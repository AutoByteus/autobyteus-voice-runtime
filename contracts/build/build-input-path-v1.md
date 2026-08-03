# Build Input Path 1

This contract owns paths inside a materialized Build Input tree and the
corresponding `SHA256SUMS.json.files[].path` records. It is separate from the
narrower Provider Archive 1 output-path policy.

A Build Input path:

- is a relative, canonical, `/`-separated ASCII path of at most 240 bytes;
- contains one or more segments made only from letters, digits, `.`, `_`, `-`,
  `+`, `(`, `)`, `[`, and `]`;
- contains no empty, `.`, `..`, or `.git` segment, backslash, absolute prefix,
  trailing dot, Windows reserved device name, exact duplicate, or ASCII
  case-fold collision.

The additional punctuation is part of the source-input grammar because locked
build-source checkouts can use framework routing names such as `(chat)`,
`[id]`, and `+page.svelte`. Materialization and build verification use these
paths only through filesystem APIs or non-shell argument arrays.

Materialization preserves every authenticated upstream path and byte. It does
not rename or omit a path to satisfy this contract. An unsafe path aborts the
materialization and removes the incomplete destination. The generated manifest
and its mandatory package-build verifier use the same source policy owner.
