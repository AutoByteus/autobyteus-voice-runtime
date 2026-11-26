"""Compare each built bundle with the v0.3.0 release bundle of the same name: entries, sizes, modes, types;
and the line endings of the launcher scripts. Usage: python3 -I compare_bundles.py <v030 dir> <run dir>"""
import json, sys, tarfile, pathlib
old_dir, new_dir = map(pathlib.Path, sys.argv[1:3])
def members(path):
    with tarfile.open(path) as tar:
        out = {}
        for m in tar.getmembers():
            name = m.name[2:] if m.name.startswith("./") else m.name
            data = tar.extractfile(m).read() if m.isfile() else None
            out[name] = {"type": "dir" if m.isdir() else "file", "size": m.size if m.isfile() else None,
                         "mode": oct(m.mode), "crlf": (b"\r\n" in data) if data is not None and name.startswith("bin/") else None,
                         "lf_only": (b"\n" in data and b"\r\n" not in data) if data is not None and name.startswith("bin/") else None}
        return out
for new in sorted(new_dir.rglob("voice-input-runtime-*.tar.gz")):
    old = old_dir / new.name
    a, b = members(old), members(new)
    diffs = []
    for name in sorted(set(a) | set(b)):
        if a.get(name) != b.get(name):
            diffs.append({"entry": name, "v0.3.0": a.get(name), "new": b.get(name)})
    launchers = {n: {"crlf": v["crlf"], "lf_only": v["lf_only"], "mode": v["mode"]} for n, v in b.items() if n.startswith("bin/") and v["type"] == "file"}
    print(json.dumps({"bundle": new.name, "entries": len(b), "sameEntryNames": sorted(a) == sorted(b), "differences": diffs, "launchers": launchers}))
