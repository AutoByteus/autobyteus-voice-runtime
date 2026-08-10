package main

import (
	"context"
	"fmt"
	"os"
	"os/signal"
	"syscall"

	modelmanager "github.com/AutoByteus/autobyteus-voice-runtime/modelmanager/internal"
)

func main() {
	operationID, err := modelmanager.NewOperationID()
	if err != nil {
		fmt.Fprintln(os.Stderr, "voice-model-manager: internal")
		os.Exit(70)
	}
	command, parseErr := modelmanager.ParseCommand(os.Args[1:])
	profile := command.Profile
	if profile != "english" && profile != "chinese" {
		fmt.Fprintln(os.Stderr, "voice-model-manager: invalid-usage")
		os.Exit(2)
	}
	events := modelmanager.NewEventWriter(os.Stdout, command.Operation, profile, operationID)
	if parseErr != nil {
		_ = events.Emit(modelmanager.Event{Phase: "failed", FailureCategory: "invalid-usage"})
		os.Exit(2)
	}
	hostRoot, err := modelmanager.DeriveHostRoot()
	if err != nil {
		_ = events.Emit(modelmanager.Event{Phase: "failed", FailureCategory: "host-authority-invalid"})
		os.Exit(5)
	}
	lifecycle := modelmanager.NewOperationLifecycle()
	signals := make(chan os.Signal, 1)
	signal.Notify(signals, syscall.SIGINT, syscall.SIGTERM)
	defer signal.Stop(signals)
	go func() {
		observed := <-signals
		if value, ok := observed.(syscall.Signal); ok {
			lifecycle.AcceptSignal(int(value))
		}
	}()
	service := modelmanager.NewService(hostRoot, modelmanager.BuiltinAuthority(), events, lifecycle)
	var terminal modelmanager.Terminal
	switch command.Operation {
	case "install-profile":
		terminal = service.Install(context.Background(), command.CatalogPath, command.Profile, command.InstallRoot)
	case "status-profile":
		terminal = service.Status(command.Profile, command.InstallRoot)
	case "remove-profile":
		terminal = service.Remove(command.Profile, command.InstallRoot)
	}
	os.Exit(terminal.ExitCode())
}
