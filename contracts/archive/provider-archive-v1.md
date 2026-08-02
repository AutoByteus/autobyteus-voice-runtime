# Provider Archive 1

The normative archive contract is `voice-runtime-contract.md` Provider Archive 1.
This repository implements it in `packaging/archive` and exposes only the
`zip`/1/`deflate`/`autobyteus-provider-zip-v1` handler.

An archive contains regular files only beneath `package/`, sorted by unsigned
UTF-8 path bytes. Names are ASCII, collision-free and traversal-free. ZIP32,
method 8, UTF-8 flag, Unix creator, no descriptor/comment/extra/directory entry,
fixed DOS epoch, and logical modes `executable|read-only` are mandatory.
Extraction verifies catalog byte identity and every record before writing into a
new private staging directory, then verifies the complete descriptor/file
manifest and modes before returning a read-only package root. Any failure removes
staging and returns no root.
