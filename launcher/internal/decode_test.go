package launcher

import "testing"

func TestPlanStrictness(t *testing.T) {
	valid := []byte(`{"schemaVersion":1,"packageId":"p","target":{"platform":"darwin","architecture":"arm64"},"invocation":{"kind":"python-worker","executable":"host/python","worker":"worker/main.py"}}`)
	if _, err := DecodePlan(valid); err != nil {
		t.Fatal(err)
	}
	for _, value := range [][]byte{
		[]byte(`{"schemaVersion":1,"packageId":"p","target":{"platform":"darwin","architecture":"arm64"},"invocation":{"kind":"python-worker","executable":"../python","worker":"worker/main.py"}}`),
		[]byte(`{"schemaVersion":1,"packageId":"p","target":{"platform":"darwin","architecture":"arm64"},"invocation":{"kind":"native-worker","executable":"provider/worker"},"backend":"x"}`),
	} {
		if _, err := DecodePlan(value); err == nil {
			t.Fatal("invalid plan accepted")
		}
	}
}

func TestRelativePathPolicy(t *testing.T) {
	for _, value := range []string{"bin/voice-provider", "worker/main.py"} {
		if !validRelativePath(value) {
			t.Fatalf("valid rejected: %s", value)
		}
	}
	for _, value := range []string{"../escape", "/absolute", "a\\b", "a//b", "a/./b"} {
		if validRelativePath(value) {
			t.Fatalf("invalid accepted: %s", value)
		}
	}
}
