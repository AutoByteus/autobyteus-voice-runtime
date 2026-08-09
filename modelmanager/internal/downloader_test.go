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
	"testing"

	modelcontract "github.com/AutoByteus/autobyteus-voice-runtime/contracts/model"
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
	temporary := t.TempDir()
	partial := filepath.Join(temporary, "weights.partial")
	record := filepath.Join(temporary, "weights.partial.json")
	session := &DownloadSession{Client: server.Client(), PublicHost: func(context.Context, string) error { return nil }}
	if err := session.Fetch(context.Background(), file, "catalog", "manifest", "asset", "revision", partial, record, nil); err == nil || err.Error() != "size-mismatch" {
		t.Fatalf("unexpected error: %v", err)
	}
	info, err := os.Stat(partial)
	if err != nil || info.Size() != 2 {
		t.Fatalf("partial info=%v err=%v", info, err)
	}
	resume, validator := validPartial(partial, record, file, "catalog", "manifest", "asset", "revision")
	if !resume || validator != `"stable"` {
		t.Fatalf("resume=%v validator=%q", resume, validator)
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

type roundTripFunc func(*http.Request) (*http.Response, error)

func (f roundTripFunc) RoundTrip(request *http.Request) (*http.Response, error) {
	return f(request)
}
