package launcher

import (
	"fmt"
	"github.com/AutoByteus/autobyteus-voice-runtime/launcher/internal/embeddedplan"
	"os"
	"path/filepath"
)

const (
	usageExit             = 64
	configExit            = 65
	packageExit           = 66
	internalExit          = 70
	pythonWorkerBootstrap = "import runpy,sys;root=sys.argv.pop(1);worker=sys.argv.pop(1);sys.path.insert(0,root);runpy.run_path(worker,run_name='__main__')"
)

func Run(args []string) int {
	if len(args) != 3 || args[1] != "--session-config" || !filepath.IsAbs(args[2]) {
		return launcherFailure("VOICE_LAUNCHER_USAGE", usageExit)
	}
	plan, err := DecodePlan(embeddedplan.PlanBytes)
	if err != nil {
		return launcherFailure("VOICE_LAUNCHER_PACKAGE", packageExit)
	}
	config, err := DecodeSession(args[2])
	if err != nil {
		return launcherFailure("VOICE_LAUNCHER_CONFIG", configExit)
	}
	target := actualTarget()
	if plan.PackageID != config.Expected.PackageID || plan.Target != target || config.Expected.Platform != target.Platform || config.Expected.Architecture != target.Architecture {
		return launcherFailure("VOICE_LAUNCHER_PACKAGE", packageExit)
	}
	root, err := DerivePackageRoot()
	if err != nil {
		return launcherFailure("VOICE_LAUNCHER_PACKAGE", packageExit)
	}
	if err := validateControlFiles(root, config, plan, embeddedplan.PlanBytes); err != nil {
		return launcherFailure("VOICE_LAUNCHER_PACKAGE", packageExit)
	}
	executable, worker, err := validatePrivatePaths(root, plan)
	if err != nil {
		return launcherFailure("VOICE_LAUNCHER_PACKAGE", packageExit)
	}
	scratch, environment, err := privateEnvironment(root)
	if err != nil {
		return launcherFailure("VOICE_LAUNCHER_INTERNAL", internalExit)
	}
	childArgs := []string{executable}
	if plan.Invocation.Kind == "python-worker" {
		childArgs = append(childArgs, "-I", "-B", "-X", "utf8", "-c", pythonWorkerBootstrap, filepath.Dir(worker), worker)
	}
	childArgs = append(childArgs, "--private-package-root", root, "--session-config", args[2])
	code, started := executePrivate(executable, childArgs, environment, scratch)
	if !started {
		_ = os.RemoveAll(scratch)
		return launcherFailure("VOICE_LAUNCHER_INTERNAL", internalExit)
	}
	return code
}

func launcherFailure(category string, code int) int {
	fmt.Fprintln(os.Stderr, category)
	return code
}
