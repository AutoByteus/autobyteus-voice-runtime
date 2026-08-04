#!/usr/bin/env python3
import argparse,json,os,subprocess,time
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('root');p.add_argument('--output',required=True);a=p.parse_args();root=Path(a.root).resolve()
env={'HOME':'/tmp/autobyteus-voice-provider-hermetic-home','PATH':'/usr/bin:/bin','LANG':'en_US.UTF-8','PYTHONNOUSERSITE':'1','PYTHONSAFEPATH':'1'}
t=time.perf_counter_ns();proc=subprocess.Popen([str(root/'python/bin/python3'),str(root/'provider/worker.py'),'--model',str(root/'models/whisper-small-mlx')],stdin=subprocess.PIPE,stdout=subprocess.PIPE,stderr=subprocess.PIPE,text=True,env=env);ready=json.loads(proc.stdout.readline());ready['controllerReadyMs']=round((time.perf_counter_ns()-t)/1e6,3);proc.stdin.write('{"type":"shutdown"}\n');proc.stdin.flush();shutdown=json.loads(proc.stdout.readline());code=proc.wait(timeout=10);out={'schemaVersion':1,'purpose':'build-time bytecode priming for provider-imported modules only','root':str(root),'ready':ready,'shutdown':shutdown,'exitCode':code,'stderr':proc.stderr.read()};Path(a.output).write_text(json.dumps(out,indent=2)+'\n');print(json.dumps(out,indent=2))
