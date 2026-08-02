#!/usr/bin/env python3
import argparse, hashlib, json, os, platform, subprocess, time
from pathlib import Path

p=argparse.ArgumentParser()
p.add_argument('--package', required=True)
p.add_argument('--audio', required=True)
p.add_argument('--output', required=True)
a=p.parse_args()
package=Path(a.package).resolve(); audio=Path(a.audio).resolve()
start=time.perf_counter_ns()
proc=subprocess.Popen(
    [str(package/'provider-launch')],
    stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.PIPE,
    text=True, bufsize=1,
    env={'HOME':'/tmp/autobyteus-voice-provider-hermetic-home','PATH':'/usr/bin:/bin','LANG':'en_US.UTF-8'},
)
def recv():
    line=proc.stdout.readline()
    if not line: raise RuntimeError('worker exited before response: '+proc.stderr.read())
    return json.loads(line)
ready=recv(); ready_observed=round((time.perf_counter_ns()-start)/1_000_000,3)
responses=[]
for i in range(2):
    request={'type':'transcribe','requestId':f'relocation-{i+1}','audioPath':str(audio),'languageMode':'en'}
    sent=time.perf_counter_ns(); proc.stdin.write(json.dumps(request)+'\n'); proc.stdin.flush()
    response=recv(); response['controllerRoundTripMs']=round((time.perf_counter_ns()-sent)/1_000_000,3); responses.append(response)
proc.stdin.write('{"type":"shutdown"}\n'); proc.stdin.flush(); shutdown=recv(); code=proc.wait(timeout=10)
stderr=proc.stderr.read()
result={
 'schemaVersion':1,'packagePath':str(package),'launcherPath':str(package/'provider-launch'),
 'audioPath':str(audio),'audioSha256':hashlib.sha256(audio.read_bytes()).hexdigest(),
 'controllerPython':platform.python_version(),'sanitizedEnvironment':{'HOME':'/tmp/autobyteus-voice-provider-hermetic-home','PATH':'/usr/bin:/bin','LANG':'en_US.UTF-8'},
 'readyObservedMs':ready_observed,'ready':ready,'responses':responses,'shutdown':shutdown,'exitCode':code,'stderr':stderr,
}
Path(a.output).write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
print(json.dumps(result,ensure_ascii=False,indent=2))
