import concurrent.futures, hashlib, json, re, subprocess, sys
from pathlib import Path
import numpy as np

ROOT = Path(__file__).resolve().parents[2]
OUT = Path(__file__).resolve().parent
FFMPEG = r'D:\ToolsIncluded\bilibili视频提取\BB\windows\ffmpeg\ffmpeg.exe'
source = (ROOT/'src/lib/data/characters.js').read_text(encoding='utf-8-sig')
source = re.sub(r'//[^\n]*', '', source)
mapping = {}
for name, body in re.findall(r'new Character\("([^"]+)"\s*,(.*?)\n\s*\)', source, re.S):
    files = re.findall(r'"([^"\n]+\.mp3)"',body)
    if files: mapping.setdefault(files[-1], []).append(name)
mapping['villager_theme.mp3'] = ['村民（全部编号）']
if '--map-only' in sys.argv:
    rows = json.loads((OUT/'analysis.json').read_text(encoding='utf-8'))
    for row in rows: row['people'] = '、'.join(mapping.get(row['file'], ['未在角色配置中引用']))
    (OUT/'analysis.json').write_text(json.dumps(rows, ensure_ascii=False, indent=2), encoding='utf-8')
    print('Mapping corrected; no audio reprocessed.')
    sys.exit()

def analyze(path):
    before = hashlib.sha256(path.read_bytes()).hexdigest()
    proc = subprocess.run([FFMPEG,'-v','error','-i',str(path),'-f','f32le','-acodec','pcm_f32le','-ar','44100','-ac','2','pipe:1'],capture_output=True)
    if proc.returncode: raise RuntimeError(path.name+proc.stderr.decode(errors='replace'))
    audio = np.frombuffer(proc.stdout, dtype='<f4').reshape(-1,2)
    # Preserve both channels: stereo cancellation must not be mistaken for silence.
    peaks = np.max(np.abs(audio),axis=1)
    nz = np.flatnonzero(peaks != 0)
    exact = float(nz[0]/44100) if len(nz) else float(len(audio)/44100)
    n = len(audio)//441
    power = np.mean(audio[:n*441].reshape(n,441,2).astype(np.float64)**2,axis=(1,2))
    db = 10*np.log10(np.maximum(power,1e-30))
    def onset(level):
        valid = db >= level
        # Five consecutive 10-ms windows, return start of the qualifying run.
        hits = np.flatnonzero(np.convolve(valid.astype(int),np.ones(5,dtype=int),'valid')==5)
        return float(hits[0]/100) if len(hits) else None
    low, target, high = [onset(v) for v in [-60,-35,-30]]
    delta = None if target is None or low is None else max(0,target-low)
    category = '全曲未达−35 dBFS' if target is None else ('弱起/渐入候选，需试听' if delta >= .3 else '较快达到阈值')
    after = hashlib.sha256(path.read_bytes()).hexdigest()
    assert before == after
    return dict(file=path.name, people='、'.join(mapping.get(path.name, ['未在角色配置中引用'])), exact=exact, target=target, low=low, high=high, gap=delta, category=category, duration=len(audio)/44100, sha256=before, peak_db=float(20*np.log10(max(float(peaks.max()),1e-15))))

paths = sorted((ROOT/'static/sfx/theme').glob('*.mp3'))
with concurrent.futures.ThreadPoolExecutor(max_workers=2) as pool:
    rows=[]
    for i,row in enumerate(pool.map(analyze,paths),1):
        rows.append(row)
        if i%20==0: print(f'{i}/{len(paths)}',flush=True)
(OUT/'analysis.json').write_text(json.dumps(rows,ensure_ascii=False,indent=2),encoding='utf-8')
missing = sorted(set(mapping)-{p.name for p in paths})
print(json.dumps({'files':len(rows),'unmapped':[r['file'] for r in rows if r['people']=='未在角色配置中引用'],'missing':missing,'max_target':max(r['target'] or 0 for r in rows),'weak':sum('候选' in r['category'] for r in rows)},ensure_ascii=False),flush=True)
