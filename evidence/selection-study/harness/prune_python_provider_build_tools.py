#!/usr/bin/env python3
"""Remove build/install-only content after dependency verification; retain runtime dependencies."""
import argparse,shutil
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('root');a=p.parse_args();root=Path(a.root).resolve()
if not str(root).startswith(('/private/tmp/','/tmp/')):raise SystemExit('Refusing outside /tmp')
site=root/'python/lib/python3.12/site-packages'
paths=[root/'python/include',root/'python/share',root/'python/lib/python3.12/ensurepip',site/'pip']
paths += list(site.glob('pip-*.dist-info'))
paths += [x for x in (root/'python/bin').glob('pip*')]
removed=[]
for x in paths:
 if not x.exists():continue
 size=sum(f.stat().st_size for f in x.rglob('*') if f.is_file()) if x.is_dir() else x.stat().st_size
 if x.is_dir():shutil.rmtree(x)
 else:x.unlink()
 removed.append({'path':str(x.relative_to(root)),'bytes':size})
print({'removed':removed,'removedBytes':sum(x['bytes'] for x in removed)})
