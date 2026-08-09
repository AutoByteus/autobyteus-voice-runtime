package modelmanager

import (
	"bytes"
	"encoding/json"
	"strings"
	"testing"
)

func TestInstallEventGraphAndPayload(t *testing.T) {
	var output bytes.Buffer
	w := NewEventWriter(&output, "install-profile", "english", "00000000-0000-4000-8000-000000000001")
	if err := w.Emit(Event{Phase: "checking"}); err != nil {
		t.Fatal(err)
	}
	completed, total := int64(2), int64(4)
	if err := w.Emit(Event{Phase: "downloading", ModelAssetID: "asset", FileIndex: 1, FileCount: 1, CompletedBytes: &completed, TotalBytes: &total}); err != nil {
		t.Fatal(err)
	}
	if err := w.Emit(Event{Phase: "verifying", ModelAssetID: "asset", FileIndex: 1, FileCount: 1, CompletedBytes: &total, TotalBytes: &total}); err != nil {
		t.Fatal(err)
	}
	if err := w.Emit(Event{Phase: "activating", ModelAssetID: "asset"}); err != nil {
		t.Fatal(err)
	}
	if err := w.Emit(Event{Phase: "installed", ModelAssetID: "asset"}); err != nil {
		t.Fatal(err)
	}
	if err := w.Emit(Event{Phase: "failed", FailureCategory: "internal"}); err == nil {
		t.Fatal("terminal writer accepted another event")
	}
	lines := strings.Split(strings.TrimSpace(output.String()), "\n")
	if len(lines) != 5 {
		t.Fatalf("got %d events", len(lines))
	}
	for index, line := range lines {
		var event Event
		if err := json.Unmarshal([]byte(line), &event); err != nil {
			t.Fatal(err)
		}
		if event.Sequence != index+1 {
			t.Fatalf("sequence %d", event.Sequence)
		}
	}
}

func TestEventWriterRejectsCrossOperationAndSentinelFields(t *testing.T) {
	for name, event := range map[string]Event{
		"wrong first phase": {Phase: "removed"},
		"status field":      {Phase: "checking", ProfileState: "not-installed"},
		"progress sentinel": {Phase: "checking", FileIndex: 1},
	} {
		t.Run(name, func(t *testing.T) {
			w := NewEventWriter(&bytes.Buffer{}, "install-profile", "english", "00000000-0000-4000-8000-000000000001")
			if err := w.Emit(event); err == nil {
				t.Fatal("invalid event accepted")
			}
		})
	}
}

func TestLifecycleSignalAndCommitHaveSingleWinner(t *testing.T) {
	for i := 0; i < 100; i++ {
		lifecycle := NewOperationLifecycle()
		results := make(chan bool, 2)
		go func() { results <- lifecycle.AcceptSignal(15) }()
		go func() { results <- lifecycle.BeginCommit() }()
		first, second := <-results, <-results
		if first == second {
			t.Fatalf("expected exactly one winner, got %v/%v", first, second)
		}
		if lifecycle.BeginCommit() || lifecycle.AcceptSignal(2) {
			t.Fatal("lifecycle accepted a second transition")
		}
	}
}
