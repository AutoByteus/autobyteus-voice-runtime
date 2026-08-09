package modelmanager

import (
	"bufio"
	"encoding/json"
	"errors"
	"io"
	"sync"
	"time"

	modelcontract "github.com/AutoByteus/autobyteus-voice-runtime/contracts/model"
)

type Event struct {
	SchemaVersion   int                  `json:"schemaVersion"`
	OperationID     string               `json:"operationId"`
	Operation       string               `json:"operation"`
	ProfileID       string               `json:"profileId"`
	Target          modelcontract.Target `json:"target"`
	Sequence        int                  `json:"sequence"`
	Phase           string               `json:"phase"`
	Timestamp       string               `json:"timestamp"`
	ModelAssetID    string               `json:"modelAssetId,omitempty"`
	FileIndex       int                  `json:"fileIndex,omitempty"`
	FileCount       int                  `json:"fileCount,omitempty"`
	CompletedBytes  *int64               `json:"completedBytes,omitempty"`
	TotalBytes      *int64               `json:"totalBytes,omitempty"`
	ProfileState    string               `json:"profileState,omitempty"`
	FailureCategory string               `json:"failureCategory,omitempty"`
	CleanupPending  *bool                `json:"cleanupPending,omitempty"`
}

type EventWriter struct {
	mu        sync.Mutex
	writer    *bufio.Writer
	operation string
	profile   string
	id        string
	sequence  int
	terminal  bool
	lastPhase string
	now       func() time.Time
}

func NewEventWriter(output io.Writer, operation, profile, operationID string) *EventWriter {
	return &EventWriter{writer: bufio.NewWriter(output), operation: operation, profile: profile, id: operationID, now: time.Now}
}

func (w *EventWriter) Emit(event Event) error {
	w.mu.Lock()
	defer w.mu.Unlock()
	if w.terminal {
		return errors.New("terminal event already emitted")
	}
	if err := validateEvent(w.operation, w.lastPhase, event); err != nil {
		return err
	}
	w.sequence++
	event.SchemaVersion = 1
	event.OperationID = w.id
	event.Operation = w.operation
	event.ProfileID = w.profile
	event.Target = modelcontract.Target{Platform: "darwin", Architecture: "arm64"}
	event.Sequence = w.sequence
	event.Timestamp = w.now().UTC().Format(time.RFC3339Nano)
	if isTerminal(event.Phase) {
		w.terminal = true
	}
	w.lastPhase = event.Phase
	encoded, err := json.Marshal(event)
	if err != nil {
		return err
	}
	if _, err := w.writer.Write(append(encoded, '\n')); err != nil {
		return err
	}
	return w.writer.Flush()
}

func validateEvent(operation, previous string, event Event) error {
	allowed := map[string]map[string][]string{
		"install-profile": {
			"":            {"checking"},
			"checking":    {"downloading", "already-installed", "cancelled", "failed"},
			"downloading": {"downloading", "verifying", "cancelled", "failed"},
			"verifying":   {"downloading", "verifying", "activating", "cancelled", "failed"},
			"activating":  {"installed", "cancelled", "failed"},
		},
		"status-profile": {
			"":         {"checking"},
			"checking": {"status-result", "failed"},
		},
		"remove-profile": {
			"":             {"checking"},
			"checking":     {"deactivating", "not-installed", "failed"},
			"deactivating": {"pruning", "cancelled", "failed"},
			"pruning":      {"removed"},
		},
	}
	phases, ok := allowed[operation][previous]
	if !ok || !contains(phases, event.Phase) {
		return errors.New("invalid operation event transition")
	}
	hasProgress := event.CompletedBytes != nil || event.TotalBytes != nil || event.FileIndex != 0 || event.FileCount != 0
	if event.Phase == "downloading" || event.Phase == "verifying" {
		if event.ModelAssetID == "" || event.CompletedBytes == nil || event.TotalBytes == nil || event.FileIndex < 1 || event.FileCount < 1 || *event.CompletedBytes < 0 || *event.TotalBytes < *event.CompletedBytes {
			return errors.New("invalid install progress event")
		}
	} else if hasProgress {
		return errors.New("progress fields are forbidden for this phase")
	}
	if operation != "install-profile" && event.ModelAssetID != "" {
		return errors.New("model identity is forbidden for this operation")
	}
	if event.Phase == "status-result" {
		if event.ProfileState != "active" && event.ProfileState != "not-installed" {
			return errors.New("status result is missing exact profile state")
		}
	} else if event.ProfileState != "" {
		return errors.New("profile state is forbidden for this phase")
	}
	if event.Phase == "failed" {
		if event.FailureCategory == "" {
			return errors.New("failed event is missing failure category")
		}
	} else if event.Phase == "cancelled" {
		if event.FailureCategory != "cancelled" {
			return errors.New("cancelled event has invalid category")
		}
	} else if event.FailureCategory != "" {
		return errors.New("failure category is forbidden for this phase")
	}
	if event.Phase == "removed" {
		if event.CleanupPending == nil {
			return errors.New("removed event is missing cleanup state")
		}
	} else if event.CleanupPending != nil {
		return errors.New("cleanup state is forbidden for this phase")
	}
	return nil
}

func contains(values []string, value string) bool {
	for _, item := range values {
		if item == value {
			return true
		}
	}
	return false
}

func isTerminal(phase string) bool {
	switch phase {
	case "installed", "already-installed", "cancelled", "failed", "status-result", "removed", "not-installed":
		return true
	default:
		return false
	}
}

type Terminal struct {
	Phase           string
	FailureCategory string
	CleanupPending  bool
	Signal          int
}

func (t Terminal) ExitCode() int {
	if t.Phase == "cancelled" {
		if t.Signal == 15 {
			return 143
		}
		return 130
	}
	if t.Phase != "failed" {
		return 0
	}
	switch t.FailureCategory {
	case "invalid-usage":
		return 2
	case "writer-in-progress", "profile-in-use", "state-changing":
		return 3
	case "network-unavailable", "http-status", "redirect-policy", "timeout":
		return 4
	case "host-authority-invalid", "catalog-invalid", "catalog-unadmitted", "host-incompatible", "size-mismatch", "digest-mismatch":
		return 5
	case "insufficient-space", "store-corrupt", "activation-failed":
		return 6
	default:
		return 70
	}
}
