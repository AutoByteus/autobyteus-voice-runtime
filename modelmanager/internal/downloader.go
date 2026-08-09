package modelmanager

import (
	"context"
	"crypto/sha256"
	"encoding/hex"
	"errors"
	"fmt"
	"io"
	"net"
	"net/http"
	"net/url"
	"os"
	"strconv"
	"strings"
	"syscall"
	"time"

	installcontract "github.com/AutoByteus/autobyteus-voice-runtime/contracts/install"
	modelcontract "github.com/AutoByteus/autobyteus-voice-runtime/contracts/model"
	"github.com/AutoByteus/autobyteus-voice-runtime/integrity"
	"github.com/AutoByteus/autobyteus-voice-runtime/internal/contractjson"
)

type DownloadProgress func(completed, total int64) error

type DownloadSession struct {
	Client          *http.Client
	ReadIdleTimeout time.Duration
	OverallTimeout  time.Duration
	PublicHost      func(context.Context, string) error
}

func NewDownloadSession(policy modelcontract.DownloadPolicy) *DownloadSession {
	dialer := &net.Dialer{Timeout: time.Duration(policy.ConnectTimeoutMS) * time.Millisecond, KeepAlive: -1}
	transport := &http.Transport{Proxy: nil, DialContext: dialer.DialContext, TLSHandshakeTimeout: time.Duration(policy.ConnectTimeoutMS) * time.Millisecond, ResponseHeaderTimeout: time.Duration(policy.ReadIdleTimeoutMS) * time.Millisecond, DisableKeepAlives: true}
	client := &http.Client{Transport: transport, CheckRedirect: func(req *http.Request, via []*http.Request) error {
		if len(via) > policy.MaxRedirects {
			return errors.New("redirect-policy")
		}
		if req.URL.Scheme != "https" || req.URL.User != nil {
			return errors.New("redirect-policy")
		}
		if err := publicHost(req.Context(), req.URL.Hostname()); err != nil {
			return errors.New("redirect-policy")
		}
		req.Header.Del("Authorization")
		req.Header.Del("Cookie")
		return nil
	}}
	return &DownloadSession{Client: client, ReadIdleTimeout: time.Duration(policy.ReadIdleTimeoutMS) * time.Millisecond, OverallTimeout: time.Duration(policy.OverallFileTimeoutMS) * time.Millisecond, PublicHost: publicHost}
}

func (d *DownloadSession) Fetch(ctx context.Context, file modelcontract.ManifestFile, catalogSHA, manifestSHA, modelAssetID, modelRevision, partialPath, recordPath string, progress DownloadProgress) error {
	if !integrity.ValidRelativePath(file.Path) {
		return errors.New("digest-mismatch")
	}
	overall, cancel := context.WithTimeout(ctx, d.overallTimeout())
	defer cancel()
	resume, validator := validPartial(partialPath, recordPath, file, catalogSHA, manifestSHA, modelAssetID, modelRevision)
	start := int64(0)
	if resume {
		info, _ := os.Stat(partialPath)
		start = info.Size()
	}
	response, appendMode, err := d.request(overall, file, start, validator)
	if err != nil {
		return err
	}
	defer response.Body.Close()
	flags := os.O_CREATE | os.O_WRONLY | os.O_TRUNC
	if appendMode {
		flags = os.O_WRONLY | os.O_APPEND
	}
	output, err := openNoFollow(partialPath, flags, 0600)
	if err != nil {
		return errors.New("internal")
	}
	defer output.Close()
	hash := sha256.New()
	written := int64(0)
	if appendMode {
		prefix, err := openNoFollow(partialPath, os.O_RDONLY, 0)
		if err != nil {
			return errors.New("store-corrupt")
		}
		written, err = io.CopyBuffer(hash, prefix, make([]byte, 256*1024))
		prefix.Close()
		if err != nil {
			return errors.New("store-corrupt")
		}
	}
	validator = entityValidator(response)
	buffer := make([]byte, 256*1024)
	checkpoint := written
	for {
		count, readErr := readWithTimeout(response.Body, buffer, d.ReadIdleTimeout)
		if count > 0 {
			if written+int64(count) > file.SizeBytes {
				_ = os.Remove(partialPath)
				_ = os.Remove(recordPath)
				return errors.New("size-mismatch")
			}
			stored, writeErr := output.Write(buffer[:count])
			if stored > 0 {
				_, _ = hash.Write(buffer[:stored])
				written += int64(stored)
			}
			if writeErr != nil || stored != count {
				_ = checkpointPartial(output, recordPath, catalogSHA, manifestSHA, modelAssetID, modelRevision, file, written, validator)
				return errors.New("internal")
			}
			if progress != nil {
				if err := progress(written, file.SizeBytes); err != nil {
					_ = checkpointPartial(output, recordPath, catalogSHA, manifestSHA, modelAssetID, modelRevision, file, written, validator)
					return err
				}
			}
			if written-checkpoint >= 4*1024*1024 {
				if err := checkpointPartial(output, recordPath, catalogSHA, manifestSHA, modelAssetID, modelRevision, file, written, validator); err != nil {
					return errors.New("internal")
				}
				checkpoint = written
			}
		}
		if readErr != nil {
			if errors.Is(readErr, io.EOF) {
				break
			}
			_ = checkpointPartial(output, recordPath, catalogSHA, manifestSHA, modelAssetID, modelRevision, file, written, validator)
			if errors.Is(readErr, context.DeadlineExceeded) || errors.Is(overall.Err(), context.DeadlineExceeded) {
				return errors.New("timeout")
			}
			return errors.New("network-unavailable")
		}
	}
	if err := output.Sync(); err != nil {
		return errors.New("internal")
	}
	if written != file.SizeBytes {
		_ = checkpointPartial(output, recordPath, catalogSHA, manifestSHA, modelAssetID, modelRevision, file, written, validator)
		return errors.New("size-mismatch")
	}
	if hex.EncodeToString(hash.Sum(nil)) != file.SHA256 {
		_ = os.Remove(partialPath)
		_ = os.Remove(recordPath)
		return errors.New("digest-mismatch")
	}
	if err := writePartialRecord(recordPath, catalogSHA, manifestSHA, modelAssetID, modelRevision, file, written, validator); err != nil {
		return errors.New("internal")
	}
	return nil
}

func checkpointPartial(output *os.File, recordPath, catalogSHA, manifestSHA, assetID, revision string, file modelcontract.ManifestFile, written int64, validator string) error {
	if written <= 0 || written >= file.SizeBytes || validator == "" {
		return nil
	}
	if err := output.Sync(); err != nil {
		return err
	}
	return writePartialRecord(recordPath, catalogSHA, manifestSHA, assetID, revision, file, written, validator)
}

func (d *DownloadSession) overallTimeout() time.Duration {
	if d == nil || d.OverallTimeout <= 0 {
		return 2 * time.Hour
	}
	return d.OverallTimeout
}

type readResult struct {
	count int
	err   error
}

func readWithTimeout(body io.ReadCloser, buffer []byte, timeout time.Duration) (int, error) {
	if timeout <= 0 {
		return body.Read(buffer)
	}
	result := make(chan readResult, 1)
	go func() {
		count, err := body.Read(buffer)
		result <- readResult{count: count, err: err}
	}()
	timer := time.NewTimer(timeout)
	defer timer.Stop()
	select {
	case observed := <-result:
		return observed.count, observed.err
	case <-timer.C:
		_ = body.Close()
		return 0, context.DeadlineExceeded
	}
}

func (d *DownloadSession) request(ctx context.Context, file modelcontract.ManifestFile, start int64, validator string) (*http.Response, bool, error) {
	response, _, err := d.doRequest(ctx, file.URL, start, validator)
	if err != nil {
		return nil, false, err
	}
	if start > 0 && validator != "" {
		if response.StatusCode == http.StatusPartialContent && validContentRange(response.Header.Get("Content-Range"), start, file.SizeBytes) && entityValidator(response) == validator {
			return response, true, nil
		}
		response.Body.Close()
		return d.doRequest(ctx, file.URL, 0, "")
	}
	if response.StatusCode != http.StatusOK {
		response.Body.Close()
		return nil, false, errors.New("http-status")
	}
	return response, false, nil
}

func (d *DownloadSession) doRequest(ctx context.Context, rawURL string, start int64, validator string) (*http.Response, bool, error) {
	parsed, err := url.Parse(rawURL)
	if err != nil || parsed.Scheme != "https" || parsed.User != nil || parsed.Hostname() == "" {
		return nil, false, errors.New("network-unavailable")
	}
	hostCheck := d.PublicHost
	if hostCheck == nil {
		hostCheck = publicHost
	}
	if err := hostCheck(ctx, parsed.Hostname()); err != nil {
		return nil, false, errors.New("redirect-policy")
	}
	request, err := http.NewRequestWithContext(ctx, http.MethodGet, rawURL, nil)
	if err != nil {
		return nil, false, errors.New("network-unavailable")
	}
	if start > 0 && validator != "" {
		request.Header.Set("Range", fmt.Sprintf("bytes=%d-", start))
		request.Header.Set("If-Range", validator)
	}
	response, err := d.Client.Do(request)
	if err != nil {
		if errors.Is(ctx.Err(), context.DeadlineExceeded) {
			return nil, false, errors.New("timeout")
		}
		if strings.Contains(err.Error(), "redirect-policy") {
			return nil, false, errors.New("redirect-policy")
		}
		return nil, false, errors.New("network-unavailable")
	}
	if start == 0 && response.StatusCode != http.StatusOK {
		response.Body.Close()
		return nil, false, errors.New("http-status")
	}
	return response, start > 0, nil
}
func validContentRange(value string, start, total int64) bool {
	prefix := fmt.Sprintf("bytes %d-", start)
	if !strings.HasPrefix(value, prefix) {
		return false
	}
	slash := strings.LastIndex(value, "/")
	if slash < 0 {
		return false
	}
	observed, err := strconv.ParseInt(value[slash+1:], 10, 64)
	return err == nil && observed == total
}
func entityValidator(response *http.Response) string {
	if value := response.Header.Get("ETag"); value != "" {
		return value
	}
	return response.Header.Get("Last-Modified")
}
func publicHost(ctx context.Context, host string) error {
	ips, err := net.DefaultResolver.LookupIP(ctx, "ip", host)
	if err != nil {
		return err
	}
	if len(ips) == 0 {
		return errors.New("no address")
	}
	for _, ip := range ips {
		if ip.IsLoopback() || ip.IsPrivate() || ip.IsLinkLocalUnicast() || ip.IsLinkLocalMulticast() || ip.IsUnspecified() {
			return errors.New("non-public address")
		}
	}
	return nil
}
func validPartial(partialPath, recordPath string, file modelcontract.ManifestFile, catalogSHA, manifestSHA, assetID, revision string) (bool, string) {
	info, err := os.Lstat(partialPath)
	if err != nil || !info.Mode().IsRegular() || hardLinked(info) || info.Size() <= 0 || info.Size() >= file.SizeBytes {
		removePartial(partialPath, recordPath)
		return false, ""
	}
	var record installcontract.PartialDownloadRecord
	data, err := readNoFollow(recordPath, 1024*1024)
	if err != nil || contractjson.Decode(data, &record) != nil || record.SchemaVersion != 1 || record.CatalogSHA256 != catalogSHA || record.ManifestSHA256 != manifestSHA || record.ModelAssetID != assetID || record.Revision != revision || record.File.Path != file.Path || record.File.SizeBytes != file.SizeBytes || record.File.SHA256 != file.SHA256 || record.File.URL != file.URL || record.File.BytesPresent != info.Size() || record.File.EntityValidator == "" {
		removePartial(partialPath, recordPath)
		return false, ""
	}
	return true, record.File.EntityValidator
}
func writePartialRecord(path, catalogSHA, manifestSHA, assetID, revision string, file modelcontract.ManifestFile, bytes int64, validator string) error {
	record := installcontract.PartialDownloadRecord{SchemaVersion: 1, CatalogSHA256: catalogSHA, ManifestSHA256: manifestSHA, ModelAssetID: assetID, Revision: revision, File: installcontract.PartialFile{Path: file.Path, SizeBytes: file.SizeBytes, SHA256: file.SHA256, URL: file.URL, BytesPresent: bytes, EntityValidator: validator}}
	data, err := contractjson.Canonical(record)
	if err != nil {
		return err
	}
	temp := path + ".tmp"
	_ = os.Remove(temp)
	fileHandle, err := openNoFollow(temp, os.O_CREATE|os.O_EXCL|os.O_WRONLY, 0600)
	if err != nil {
		return err
	}
	if _, err := fileHandle.Write(data); err != nil {
		_ = fileHandle.Close()
		_ = os.Remove(temp)
		return err
	}
	if err := fileHandle.Sync(); err != nil {
		_ = fileHandle.Close()
		_ = os.Remove(temp)
		return err
	}
	if err := fileHandle.Close(); err != nil {
		_ = os.Remove(temp)
		return err
	}
	return os.Rename(temp, path)
}
func parseURL(value string) (*url.URL, error) { return url.Parse(value) }

func openNoFollow(path string, flags int, mode os.FileMode) (*os.File, error) {
	fd, err := syscall.Open(path, flags|syscall.O_NOFOLLOW, uint32(mode.Perm()))
	if err != nil {
		return nil, err
	}
	return os.NewFile(uintptr(fd), path), nil
}

func readNoFollow(path string, limit int64) ([]byte, error) {
	file, err := openNoFollow(path, os.O_RDONLY, 0)
	if err != nil {
		return nil, err
	}
	defer file.Close()
	info, err := file.Stat()
	if err != nil || !info.Mode().IsRegular() || hardLinked(info) || info.Size() > limit {
		return nil, errors.New("unsafe partial record")
	}
	return io.ReadAll(io.LimitReader(file, limit+1))
}

func hardLinked(info os.FileInfo) bool {
	stat, ok := info.Sys().(*syscall.Stat_t)
	return ok && stat.Nlink != 1
}

func removePartial(partialPath, recordPath string) {
	_ = os.Remove(partialPath)
	_ = os.Remove(recordPath)
}
