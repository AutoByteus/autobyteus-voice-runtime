# Bundled Node host

`metadata/runtime-assets.json` pins the official Node archive, digest, version, and
contained executable for every supported target. `scripts/build-runtime.mjs`
downloads or consumes the exact archive, verifies it before extraction, and copies
only the executable plus its upstream license into the provider archive. The
runtime never discovers Electron, system Node, Python, or a compiler.
