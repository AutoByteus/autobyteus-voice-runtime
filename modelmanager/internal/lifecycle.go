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
	state      atomic.Uint64
	done       chan struct{}
	cancelOnce sync.Once
}

func NewOperationLifecycle() *OperationLifecycle {
	return &OperationLifecycle{done: make(chan struct{})}
}

// AcceptSignal races exactly once with BeginCommit. A true result means the
// cancellation won before committed selector mutation became possible.
func (l *OperationLifecycle) AcceptSignal(signal int) bool {
	if signal != 2 && signal != 15 {
		return false
	}
	cancelled := uint64(stateCancelled) | uint64(uint32(signal))<<32
	if !l.state.CompareAndSwap(uint64(stateCancellable), cancelled) {
		return false
	}
	l.cancelOnce.Do(func() { close(l.done) })
	return true
}

func (l *OperationLifecycle) BeginCommit() bool {
	return l.state.CompareAndSwap(uint64(stateCancellable), uint64(stateCommitStarted))
}
func (l *OperationLifecycle) MarkCommitted() { l.state.Store(uint64(stateCommitted)) }
func (l *OperationLifecycle) Cancelled() (bool, int) {
	state := l.state.Load()
	return uint32(state) == stateCancelled, int(uint32(state >> 32))
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
