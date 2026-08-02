#!/usr/bin/env python3
"""Extract a deterministic real Mandarin-English code-switch control subset from ASCEND."""
import argparse,hashlib,json,re,wave
from collections import Counter,defaultdict
from pathlib import Path
import pyarrow.parquet as pq

def sha(data): return hashlib.sha256(data).hexdigest()
def english_tokens(text): return re.findall(r"[A-Za-z]+(?:'[A-Za-z]+)?", text)
p=argparse.ArgumentParser();p.add_argument('--test',required=True);p.add_argument('--validation',required=True);p.add_argument('--output',required=True);a=p.parse_args()
out=Path(a.output);audio_dir=out/'audio';audio_dir.mkdir(parents=True,exist_ok=True)
by_speaker=defaultdict(list);source_hashes={}
for split,path in [('test',Path(a.test)),('validation',Path(a.validation))]:
 source_hashes[split]=sha(path.read_bytes())
 for row in pq.read_table(path).to_pylist():
  if row['language']!='mixed' or '[UNK]' in row['transcription'] or not 3 <= float(row['duration']) <= 15: continue
  tokens=english_tokens(row['transcription'])
  if not tokens: continue
  row=dict(row);row['_split']=split;row['_tokens']=tokens;by_speaker[int(row['original_speaker_id'])].append(row)
selected=[]
for speaker in sorted(by_speaker):
 rows=sorted(by_speaker[speaker],key=lambda r:(-len(r['_tokens']),-len(set(x.lower() for x in r['_tokens'])),-float(r['duration']),r['id']))
 selected.extend(rows[:6])
selected.sort(key=lambda r:(int(r['original_speaker_id']),r['_split'],r['id']))
clips=[]
for row in selected:
 audio=row['audio']['bytes'];fn=f"ascend-{row['_split']}-{row['id']}.wav";(audio_dir/fn).write_bytes(audio)
 with wave.open(str(audio_dir/fn),'rb') as w:
  attrs={'channels':w.getnchannels(),'sampleWidth':w.getsampwidth(),'sampleRate':w.getframerate(),'frames':w.getnframes(),'compression':w.getcomptype()}
 if (attrs['channels'],attrs['sampleWidth'],attrs['sampleRate'],attrs['compression']) != (1,2,16000,'NONE'):
  raise RuntimeError(f'Unexpected WAV format {fn}: {attrs}')
 clips.append({'id':f"ascend-{row['_split']}-{row['id']}",'category':'mixed-real','languageMode':'auto','path':f'audio/{fn}','durationMs':round(float(row['duration'])*1000),'speakerId':f"ascend-speaker-{row['original_speaker_id']}",'sessionId':int(row['session_id']),'topic':row['topic'],'reference':row['transcription'],'embeddedEnglishTerms':row['_tokens'],'sha256':sha(audio)})
manifest={'schemaVersion':1,'corpusId':'ascend-real-mandarin-english-control-v1','version':'1','source':{'repository':'CAiRE/ASCEND','repositoryRevision':'737e9800ae31be9932ba8464c80366559bd28424','license':'CC-BY-SA-4.0','paper':'https://arxiv.org/abs/2112.06223','sourceParquetSha256':source_hashes},'selection':{'method':'All mixed-language rows of 3-15 seconds; select six per anonymized speaker by descending embedded-English-token count, unique-token count, duration, then source ID.','selectionAuthority':'Real code-switch control evidence. It does not contain AutoByteus product vocabulary and cannot satisfy the product-term replacement gate alone.','speakerCounts':dict(Counter(x['speakerId'] for x in clips)),'clipCount':len(clips),'durationSeconds':round(sum(x['durationMs'] for x in clips)/1000,3),'embeddedEnglishTermOccurrences':sum(len(x['embeddedEnglishTerms']) for x in clips),'uniqueEmbeddedEnglishTerms':len(set(y.lower() for x in clips for y in x['embeddedEnglishTerms']))},'clips':clips}
(out/'corpus.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
print(json.dumps(manifest['selection'],indent=2))
