#!/usr/bin/env python3
import argparse,json,statistics,subprocess,time
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('--package');p.add_argument('--audio');p.add_argument('--output');p.add_argument('--cold-runs',type=int,default=10);p.add_argument('--warm-runs',type=int,default=30);a=p.parse_args()
env={'HOME':'/tmp/autobyteus-voice-provider-hermetic-home','PATH':'/usr/bin:/bin','LANG':'en_US.UTF-8'}
def start():
 t=time.perf_counter_ns(); proc=subprocess.Popen([str(Path(a.package)/'provider-launch')],stdin=subprocess.PIPE,stdout=subprocess.PIPE,stderr=subprocess.PIPE,text=True,bufsize=1,env=env); ready=json.loads(proc.stdout.readline()); ready['controllerReadyMs']=round((time.perf_counter_ns()-t)/1e6,3);return proc,ready
def request(proc,i):
 q={'type':'transcribe','requestId':str(i),'audioPath':str(Path(a.audio).resolve()),'languageMode':'en'};t=time.perf_counter_ns();proc.stdin.write(json.dumps(q)+'\n');proc.stdin.flush();r=json.loads(proc.stdout.readline());r['controllerRoundTripMs']=round((time.perf_counter_ns()-t)/1e6,3);return r
def stop(proc):
 proc.stdin.write('{"type":"shutdown"}\n');proc.stdin.flush();ack=json.loads(proc.stdout.readline());code=proc.wait(timeout=10);return ack,code,proc.stderr.read()
cold=[]
for i in range(a.cold_runs):
 t=time.perf_counter_ns();proc,ready=start();first=request(proc,i);ack,code,stderr=stop(proc);cold.append({'index':i,'ready':ready,'first':first,'coldEndToEndMs':round((time.perf_counter_ns()-t)/1e6,3),'shutdown':ack,'exitCode':code,'stderr':stderr})
proc,ready=start();warmup=request(proc,'warmup');warm=[request(proc,i) for i in range(a.warm_runs)];ack,code,stderr=stop(proc)
def pct(xs,p):
 xs=sorted(xs);pos=(len(xs)-1)*p;lo=int(pos);hi=min(lo+1,len(xs)-1);return round(xs[lo]+(xs[hi]-xs[lo])*(pos-lo),3)
def summary(xs):return {'count':len(xs),'p50Ms':pct(xs,.5),'p95Ms':pct(xs,.95),'minMs':round(min(xs),3),'maxMs':round(max(xs),3)}
out={'schemaVersion':1,'conditions':'sequential process-cold runs with warm filesystem and Metal caches; sanitized environment; same packaged provider and clip','packagePath':str(Path(a.package).resolve()),'audioPath':str(Path(a.audio).resolve()),'coldRuns':cold,'warmSession':{'ready':ready,'warmup':warmup,'runs':warm,'shutdown':ack,'exitCode':code,'stderr':stderr},'summaries':{'ready':summary([x['ready']['controllerReadyMs'] for x in cold]),'firstInference':summary([x['first']['controllerRoundTripMs'] for x in cold]),'coldEndToEnd':summary([x['coldEndToEndMs'] for x in cold]),'warmInference':summary([x['controllerRoundTripMs'] for x in warm]),'maxRssBytes':max([x['first']['maxRssBytes'] for x in cold]+[x['maxRssBytes'] for x in warm])}}
Path(a.output).write_text(json.dumps(out,ensure_ascii=False,indent=2)+'\n');print(json.dumps(out['summaries'],indent=2))
