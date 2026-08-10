package embeddedplan

import _ "embed"

// PlanBytes is replaced only in the isolated launcher build workspace.
//
//go:embed package-launcher-plan-v2.json
var PlanBytes []byte
