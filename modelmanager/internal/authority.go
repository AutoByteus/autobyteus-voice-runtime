package modelmanager

import (
	"os"
	"path/filepath"

	"github.com/AutoByteus/autobyteus-voice-runtime/hostverify"
)

var (
	embeddedHostPackageID                  = "UNSET"
	embeddedHostSourceClosureSHA256        = "UNSET"
	embeddedModelAdmissionRootSHA256       = "UNSET"
	embeddedCompatibilityRequirementSHA256 = "UNSET"
)

type EmbeddedAuthority = hostverify.Expected
type HostAuthority = hostverify.HostAuthority

func BuiltinAuthority() EmbeddedAuthority {
	return EmbeddedAuthority{HostPackageID: embeddedHostPackageID, HostSourceClosureSHA256: embeddedHostSourceClosureSHA256, ModelAdmissionRootSHA256: embeddedModelAdmissionRootSHA256, CompatibilityRequirementSHA256: embeddedCompatibilityRequirementSHA256}
}
func DeriveHostRoot() (string, error) {
	executable, err := os.Executable()
	if err != nil {
		return "", err
	}
	executable, err = filepath.EvalSymlinks(executable)
	if err != nil {
		return "", err
	}
	return filepath.Dir(filepath.Dir(executable)), nil
}
func VerifyHost(root string, expected EmbeddedAuthority) (HostAuthority, error) {
	return hostverify.Verify(root, expected)
}
