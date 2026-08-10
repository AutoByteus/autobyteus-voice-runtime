package launcher

import (
	"bytes"
	"errors"
	"os"
	"path/filepath"
)

func validateEmbeddedPlan(root string, plan LauncherPlan, embedded []byte) error {
	path, err := containedRegular(root, "provider/package-launcher-plan-v2.json")
	if err != nil {
		return err
	}
	observed, err := os.ReadFile(path)
	if err != nil || !bytes.Equal(observed, embedded) {
		return errors.New("embedded launcher plan mismatch")
	}
	return nil
}

func validatePrivatePaths(root string, plan LauncherPlan) (string, string, error) {
	executable, err := containedRegular(root, plan.Invocation.Executable)
	if err != nil {
		return "", "", err
	}
	worker := ""
	if plan.Invocation.Kind == "python-worker" {
		worker, err = containedRegular(root, plan.Invocation.Worker)
		if err != nil {
			return "", "", err
		}
	}
	info, err := os.Stat(executable)
	if err != nil {
		return "", "", err
	}
	if actualTarget().Platform != "win32" && info.Mode().Perm()&0111 == 0 {
		return "", "", errors.New("private executable not executable")
	}
	_ = filepath.Separator
	return executable, worker, nil
}
