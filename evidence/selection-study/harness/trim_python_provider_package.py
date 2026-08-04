#!/usr/bin/env python3
"""Remove only reproducible Python bytecode caches from an offline provider package."""
import argparse,shutil
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('root');a=p.parse_args();root=Path(a.root).resolve()
if not str(root).startswith('/private/tmp/') and not str(root).startswith('/tmp/'):
 raise SystemExit('Refusing to trim outside /tmp')
removed_files=removed_bytes=removed_dirs=0
for d in sorted(root.rglob('__pycache__'),reverse=True):
 if not d.is_dir():continue
 for f in d.rglob('*'):
  if f.is_file():removed_files+=1;removed_bytes+=f.stat().st_size
 shutil.rmtree(d);removed_dirs+=1
for suffix in ('*.pyc','*.pyo'):
 for f in root.rglob(suffix):
  if f.is_file():removed_files+=1;removed_bytes+=f.stat().st_size;f.unlink()
print({'removedDirectories':removed_dirs,'removedFiles':removed_files,'removedBytes':removed_bytes})
