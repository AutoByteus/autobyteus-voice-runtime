package modelmanager

import (
	"context"
	"crypto/sha256"
	"encoding/hex"
	"io"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"strings"
	"testing"

	modelcontract "github.com/AutoByteus/autobyteus-voice-runtime/contracts/model"
	"github.com/AutoByteus/autobyteus-voice-runtime/modelstore"
)

func TestIncompleteResponseCheckpointsExactResumableBytes(t *testing.T) {
	server := httptest.NewTLSServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		w.Header().Set("ETag", `"stable"`)
		_, _ = io.WriteString(w, "ab")
	}))
	defer server.Close()
	payload := []byte("abcd")
	digest := sha256.Sum256(payload)
	file := modelcontract.ManifestFile{Path: "weights.bin", URL: server.URL, SizeBytes: int64(len(payload)), SHA256: hex.EncodeToString(digest[:])}
	root, err := filepath.EvalSymlinks(t.TempDir())
	if err != nil {
		t.Fatal(err)
	}
	store, err := modelstore.Open(root)
	if err != nil {
		t.Fatal(err)
	}
	defer store.Close()
	partial, err := store.Partial(strings.Repeat("a", 64), file.Path)
	if err != nil {
		t.Fatal(err)
	}
	session := &DownloadSession{Client: server.Client(), PublicHost: func(context.Context, string) error { return nil }}
	if err := session.Fetch(context.Background(), file, "catalog", "manifest", "asset", "revision", partial, nil); err == nil || err.Error() != "size-mismatch" {
		t.Fatalf("unexpected error: %v", err)
	}
	info, err := partial.DataInfo()
	if err != nil || info.Size() != 2 {
		t.Fatalf("partial info=%v err=%v", info, err)
	}
	bytesPresent, validator, err := validPartial(partial, file, "catalog", "manifest", "asset", "revision")
	if err != nil || bytesPresent != 2 || validator != `"stable"` {
		t.Fatalf("bytes=%d validator=%q err=%v", bytesPresent, validator, err)
	}
}

func TestResumeMismatchRestartsWithoutRange(t *testing.T) {
	requests := 0
	server := httptest.NewTLSServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		requests++
		if requests == 1 {
			if r.Header.Get("Range") != "bytes=2-" {
				t.Errorf("missing resume range")
			}
			w.Header().Set("ETag", `"changed"`)
			w.Header().Set("Content-Range", "bytes 2-3/4")
			w.WriteHeader(http.StatusPartialContent)
			_, _ = io.WriteString(w, "cd")
			return
		}
		if r.Header.Get("Range") != "" || r.Header.Get("If-Range") != "" {
			t.Errorf("restart retained range headers")
		}
		_, _ = io.WriteString(w, "abcd")
	}))
	defer server.Close()
	session := &DownloadSession{Client: server.Client(), PublicHost: func(context.Context, string) error { return nil }}
	response, appendMode, err := session.request(context.Background(), modelcontract.ManifestFile{URL: server.URL, SizeBytes: 4}, 2, `"original"`)
	if err != nil {
		t.Fatal(err)
	}
	defer response.Body.Close()
	if appendMode || requests != 2 {
		t.Fatalf("append=%v requests=%d", appendMode, requests)
	}
	body, _ := io.ReadAll(response.Body)
	if string(body) != "abcd" {
		t.Fatalf("restart body %q", body)
	}
}

func TestInitialPrivateHostIsRejectedBeforeTransport(t *testing.T) {
	called := false
	session := &DownloadSession{
		Client: &http.Client{Transport: roundTripFunc(func(*http.Request) (*http.Response, error) {
			called = true
			return nil, nil
		})},
		PublicHost: func(context.Context, string) error { return io.EOF },
	}
	_, _, err := session.request(context.Background(), modelcontract.ManifestFile{URL: "https://example.invalid/model", SizeBytes: 1}, 0, "")
	if err == nil || err.Error() != "redirect-policy" || called {
		t.Fatalf("err=%v transportCalled=%v", err, called)
	}
}

func TestResumeInventoryUsesOnlyRemainingAdmittedBytes(t *testing.T) {
	root, err := filepath.EvalSymlinks(t.TempDir())
	if err != nil {
		t.Fatal(err)
	}
	store, err := modelstore.Open(root)
	if err != nil {
		t.Fatal(err)
	}
	defer store.Close()
	manifestSHA := strings.Repeat("a", 64)
	revision := strings.Repeat("b", 40)
	configPayload := []byte("configured")
	configDigest := sha256.Sum256(configPayload)
	config := modelcontract.ManifestFile{Path: "config.json", URL: "https://huggingface.co/owner/repository/resolve/" + revision + "/config.json", SizeBytes: int64(len(configPayload)), SHA256: hex.EncodeToString(configDigest[:])}
	weights := modelcontract.ManifestFile{Path: "weights.bin", URL: "https://huggingface.co/owner/repository/resolve/" + revision + "/weights.bin", SizeBytes: 100, SHA256: strings.Repeat("c", 64)}
	resolved := ResolvedProfile{CatalogSHA256: strings.Repeat("d", 64), ManifestSHA256: manifestSHA, Manifest: modelcontract.AssetManifest{ModelAssetID: "asset", Revision: revision, Files: []modelcontract.ManifestFile{config, weights}, TotalSizeBytes: config.SizeBytes + weights.SizeBytes}}
	configPartial, err := store.Partial(manifestSHA, config.Path)
	if err != nil {
		t.Fatal(err)
	}
	data, err := configPartial.OpenData(os.O_CREATE|os.O_WRONLY|os.O_TRUNC, 0600)
	if err != nil {
		t.Fatal(err)
	}
	if _, err := data.Write(configPayload); err != nil {
		t.Fatal(err)
	}
	if err := data.Close(); err != nil {
		t.Fatal(err)
	}
	partial, err := store.Partial(manifestSHA, weights.Path)
	if err != nil {
		t.Fatal(err)
	}
	data, err = partial.OpenData(os.O_CREATE|os.O_WRONLY|os.O_TRUNC, 0600)
	if err != nil {
		t.Fatal(err)
	}
	if _, err := data.Write(make([]byte, 70)); err != nil {
		t.Fatal(err)
	}
	if err := data.Close(); err != nil {
		t.Fatal(err)
	}
	if err := writePartialRecord(partial, resolved.CatalogSHA256, manifestSHA, resolved.Manifest.ModelAssetID, resolved.Manifest.Revision, weights, 70, `"stable"`); err != nil {
		t.Fatal(err)
	}
	partials, remaining, err := inventoryResumablePartials(store, &DownloadSession{}, resolved)
	if err != nil || remaining != 30 || partials[weights.Path] == nil || partials[config.Path] == nil {
		t.Fatalf("remaining=%d weights=%v config=%v err=%v", remaining, partials[weights.Path] != nil, partials[config.Path] != nil, err)
	}
	available := remaining + 16*1024 + freeSpaceReserve
	if available < remaining+16*1024+freeSpaceReserve || available >= resolved.Manifest.TotalSizeBytes+16*1024+freeSpaceReserve {
		t.Fatal("fixture does not distinguish remaining-byte and full-size admission")
	}

	if err := writePartialRecord(partial, "wrong-catalog", manifestSHA, resolved.Manifest.ModelAssetID, resolved.Manifest.Revision, weights, 70, `"stable"`); err != nil {
		t.Fatal(err)
	}
	_, remaining, err = inventoryResumablePartials(store, &DownloadSession{}, resolved)
	if err != nil || remaining != weights.SizeBytes {
		t.Fatalf("invalid partial remaining=%d err=%v", remaining, err)
	}
	if _, err := partial.DataInfo(); !os.IsNotExist(err) {
		t.Fatalf("invalid partial was not deleted: %v", err)
	}
	if info, err := configPartial.DataInfo(); err != nil || info.Size() != config.SizeBytes {
		t.Fatalf("verified completed file was not retained: info=%v err=%v", info, err)
	}
}

type roundTripFunc func(*http.Request) (*http.Response, error)

func (f roundTripFunc) RoundTrip(request *http.Request) (*http.Response, error) {
	return f(request)
}
