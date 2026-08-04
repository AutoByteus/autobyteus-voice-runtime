#!/usr/bin/env python3
"""Score real/synthetic Mandarin-English mixed speech with Han-character/English-word units."""
import argparse,json,re,unicodedata
from collections import Counter,defaultdict
from pathlib import Path
from opencc import OpenCC
T2S=OpenCC('t2s')
TOKEN=re.compile(r"[a-z0-9]+(?:'[a-z]+)?|[\u4e00-\u9fff]")
def norm(s): return TOKEN.findall(T2S.convert(unicodedata.normalize('NFKC',s)).lower())
def dist(a,b):
 prev=list(range(len(b)+1))
 for i,x in enumerate(a,1):
  cur=[i]
  for j,y in enumerate(b,1):cur.append(min(cur[-1]+1,prev[j]+1,prev[j-1]+(x!=y)))
  prev=cur
 return prev[-1]
def er(ref,hyp):return dist(ref,hyp)/len(ref) if ref else (0 if not hyp else 1)
def recall(ref,hyp):
 r=Counter(ref);h=Counter(hyp);found=sum(min(n,h[t]) for t,n in r.items());total=sum(r.values());return found,total,(found/total if total else None)
p=argparse.ArgumentParser();p.add_argument('--corpus',required=True);p.add_argument('--output',required=True);p.add_argument('results',nargs='+');a=p.parse_args()
corpus=json.load(open(a.corpus));manifest={x['id']:x for x in corpus['clips']};reports=[]
for rp in a.results:
 raw=json.load(open(rp));per=[];allr=[];allh=[];eng_r=[];eng_h=[];han_r=[];han_h=[];by=defaultdict(lambda:[[],[]])
 for s in raw['warmSession']['quality']:
  c=manifest[s['id']];r=norm(c['reference']);h=norm(s['response']['text']);allr+=r;allh+=h
  re_= [x for x in r if x.isascii()];he=[x for x in h if x.isascii()];rh=[x for x in r if not x.isascii()];hh=[x for x in h if not x.isascii()]
  eng_r+=re_;eng_h+=he;han_r+=rh;han_h+=hh;by[c['speakerId']][0]+=r;by[c['speakerId']][1]+=h
  per.append({'id':s['id'],'speakerId':c['speakerId'],'reference':c['reference'],'hypothesis':s['response']['text'],'mixedErrorRate':round(er(r,h),6),'embeddedEnglishRecall':round(recall(re_,he)[2],6) if re_ else None,'requestRoundTripMs':s['response']['requestRoundTripMs']})
 f,t,rc=recall(eng_r,eng_h)
 reports.append({'source':rp,'backend':raw['backend'],'clipCount':len(per),'speakerCount':len(by),'durationSeconds':round(sum(manifest[s['id']]['durationMs'] for s in raw['warmSession']['quality'])/1000,3),'mixedErrorRate':round(er(allr,allh),6),'mandarinCharacterErrorRate':round(er(han_r,han_h),6),'embeddedEnglishWordErrorRate':round(er(eng_r,eng_h),6),'embeddedEnglishWordRecall':{'found':f,'total':t,'recall':round(rc,6)},'perSpeaker':{k:{'mixedErrorRate':round(er(v[0],v[1]),6),'referenceUnits':len(v[0])} for k,v in sorted(by.items())},'emptyHypotheses':sum(not norm(x['hypothesis']) for x in per),'perClip':per})
out={'schemaVersion':1,'corpusId':corpus['corpusId'],'scoring':'NFKC + Traditional-to-Simplified; Han characters and contiguous lowercase English/alphanumeric words are edit units; multiset English-word recall reported separately.','reports':reports};Path(a.output).write_text(json.dumps(out,ensure_ascii=False,indent=2)+'\n')
for r in reports:print(r['backend'],'MER',r['mixedErrorRate'],'zhCER',r['mandarinCharacterErrorRate'],'enWER',r['embeddedEnglishWordErrorRate'],'enRecall',r['embeddedEnglishWordRecall'])
