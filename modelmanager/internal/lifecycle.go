package modelmanager

import (
	"context"
	"sync"
	"sync/atomic"
)

const (
	stateCancellable uint32 = iota
	stateCancelled
	stateCommitStarted
	stateCommitted
)

type OperationLifecycle struct {
	state      atomic.Uint32
	signal     atomic.Int32
	done       chan struct{}
	cancelOnce sync.Once
}

func NewOperationLifecycle() *OperationLifecycle {
	return &OperationLifecycle{done: make(chan struct{})}
}

// AcceptSignal races exactly once with BeginCommit. A true result means the
// cancellation won before committed selector mutation became possible.
func (l *OperationLifecycle) AcceptSignal(signal int) bool {
	if !l.state.CompareAndSwap(stateCancellable, stateCancelled) {
		return false
	}
	l.signal.Store(int32(signal))
	l.cancelOnce.Do(func() { close(l.done) })
	return true
}

func (l *OperationLifecycle) BeginCommit() bool {
	return l.state.CompareAndSwap(stateCancellable, stateCommitStarted)
}
func (l *OperationLifecycle) MarkCommitted() { l.state.Store(stateCommitted) }
func (l *OperationLifecycle) Cancelled() (bool, int) {
	return l.state.Load() == stateCancelled, int(l.signal.Load())
}
func (l *OperationLifecycle) Context(parent context.Context) context.Context {
	ctx, cancel := context.WithCancel(parent)
	go func() {
		select {
		case <-parent.Done():
		case <-l.done:
		}
		cancel()
	}()
	return ctx
}
