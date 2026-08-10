package modelmanager

import (
	"errors"
	"path/filepath"
)

type Command struct {
	Operation   string
	Profile     string
	CatalogPath string
	InstallRoot string
}

func ParseCommand(arguments []string) (Command, error) {
	if len(arguments) < 1 {
		return Command{}, errors.New("invalid-usage")
	}
	command := Command{Operation: arguments[0]}
	if command.Operation != "install-profile" && command.Operation != "status-profile" && command.Operation != "remove-profile" {
		return command, errors.New("invalid-usage")
	}
	values := map[string]string{}
	for index := 1; index < len(arguments); {
		if index+1 >= len(arguments) {
			return command, errors.New("invalid-usage")
		}
		name, value := arguments[index], arguments[index+1]
		if (name != "--profile" && name != "--install-root" && name != "--catalog") || value == "" || values[name] != "" {
			return command, errors.New("invalid-usage")
		}
		values[name] = value
		index += 2
	}
	command.Profile = values["--profile"]
	command.InstallRoot = values["--install-root"]
	command.CatalogPath = values["--catalog"]
	if (command.Profile != "english" && command.Profile != "chinese") || !filepath.IsAbs(command.InstallRoot) {
		return command, errors.New("invalid-usage")
	}
	if command.Operation == "install-profile" {
		if !filepath.IsAbs(command.CatalogPath) {
			return command, errors.New("invalid-usage")
		}
	} else if command.CatalogPath != "" {
		return command, errors.New("invalid-usage")
	}
	return command, nil
}

func NewOperationID() (string, error) { return randomUUID() }
