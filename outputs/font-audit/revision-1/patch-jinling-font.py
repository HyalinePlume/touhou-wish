"""Build ten missing characters from the original font's outlines.
Run from repository root; dependencies: fonttools, pillow, skia-pathops.
The original font is never overwritten. All coordinates use its 256 UPM grid.
"""
import sys, pathlib, json, re, hashlib
ROOT=pathlib.Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/'outputs/font-audit/dependencies'))
from fontTools.ttLib import TTFont
from fontTools.ttLib.tables._g_l_y_f import Glyph, GlyphCoordinates
from fontTools.ttLib.tables.ttProgram import Program
from fontTools.pens.transformPen import TransformPen
from fontTools.pens.ttGlyphPen import TTGlyphPen
from fontTools.pens.cu2quPen import Cu2QuPen
from fontTools.pens.boundsPen import BoundsPen
import pathops
from PIL import Image,ImageDraw,ImageFont
SRC=ROOT/'static/fonts/FZCuJinLing-Regular.ttf'
OUT=ROOT/'static/fonts/FZCuJinLing-Patched.ttf'
REPORT=ROOT/'outputs/font-audit';REPORT.mkdir(exist_ok=True,parents=True)
font=TTFont(SRC, recalcTimestamp=False); cmap=dict(font.getBestCmap()); glyf=font['glyf']

def part(char, indices=None):
 g=glyf[cmap[ord(char)]]
 if indices is not None:
  co,ends,flags=g.getCoordinates(glyf); g=Glyph();g.numberOfContours=len(indices)
  g.coordinates=GlyphCoordinates();g.flags=bytearray();g.endPtsOfContours=[]
  for i in indices:
   start=0 if i==0 else ends[i-1]+1; end=ends[i]+1
   g.coordinates.extend(co[start:end]);g.flags.extend(flags[start:end]);g.endPtsOfContours.append(len(g.coordinates)-1)
  g.program=Program()
 p=pathops.Path();g.draw(p.getPen(),glyf);return p

def bounds(p):
 pen=BoundsPen(None);p.draw(pen);return pen.bounds

def fit(p, box):
 x0,y0,x1,y1=bounds(p);a,b,c,d=box
 return p.transform((c-a)/(x1-x0),0,0,(d-b)/(y1-y0),a-x0*(c-a)/(x1-x0),b-y0*(d-b)/(y1-y0))

def rect(x0,y0,x1,y1):
 p=pathops.Path();pen=p.getPen();pen.moveTo((x0,y0));pen.lineTo((x1,y0));pen.lineTo((x1,y1));pen.lineTo((x0,y1));pen.closePath();return p

def union(parts):
 p=parts[0]
 for q in parts[1:]:p=pathops.op(p,q,pathops.PathOp.UNION)
 return pathops.simplify(p)

mouth=lambda:part('吐',[1,2])
bird=union([
 fit(part('白'),(125,80,232,205)),
 fit(pathops.op(part('鸟',[0]),rect(-100,-100,400,90),pathops.PathOp.INTERSECTION),(125,-26,249,90)),
 fit(part('焉',[1,2,3,4]),(130,-18,222,40)),
])
recipes={
 '咲':[mouth(),fit(part('关'),(100,-24,249,205))],
 '塚':[part('塬',[1]),fit(part('冢'),(99,-23,251,200))],
 '椛':[part('枫',[1]),fit(part('花'),(101,-23,249,204))],
 '燐':[part('炉',[1,3]),part('嶙',[0,2,3,4])],
 '鵺':[fit(part('夜'),(5,-27,137,204)),bird],
 '猯':[part('狂',[1]),part('端',[0,1,6])],
 '吽':[mouth(),fit(part('牛'),(102,-28,249,203))],
 '侘':[part('伸',[1]),fit(part('宅'),(93,-16,249,205))],
 '袿':[part('褂',[1,3]),part('蛙',[1,2])],
 '冴':[part('冷',[2,3]),part('讶',[0])],
}
for c,parts in recipes.items():
 assert ord(c) not in cmap
 p=union(parts);pen=TTGlyphPen(None);p.draw(Cu2QuPen(pen,max_err=0.25))
 g=pen.glyph();g.recalcBounds(glyf);name=f'uni{ord(c):04X}'
 font.setGlyphOrder(font.getGlyphOrder()+[name]);glyf[name]=g
 font['hmtx'].metrics[name]=(256,g.xMin)
 if 'vmtx' in font:font['vmtx'].metrics[name]=(256,205-g.yMax)
 for table in font['cmap'].tables:
  if table.isUnicode() and table.format in (4,12):table.cmap[ord(c)]=name
# Give the derived font a distinct identity to avoid stale browser/OS cache entries.
for name_id,value in {1:'XTM JinLing Patched',2:'Regular',3:'XTM-JinLing-Patched-20261102',4:'XTM JinLing Patched Regular',6:'XTMJinLingPatched-Regular'}.items():
 for record in font['name'].names:
  if record.nameID==name_id:record.string=value.encode(record.getEncoding())
font.save(OUT)
check=TTFont(OUT,checkChecksums=2);newmap=check.getBestCmap();original=TTFont(SRC)
# Existing mapped outlines and widths must remain identical after serialization.
for cp,name in cmap.items():
 assert newmap[cp]==name
 assert check['hmtx'][name]==original['hmtx'][name]
 assert check['glyf'][name].getCoordinates(check['glyf'])==original['glyf'][name].getCoordinates(original['glyf'])
text=(ROOT/'src/lib/data/characters.js').read_text(encoding='utf-8')
rows=re.findall(r'new Character\("([^"]+)"\s*,\s*"([^"]+)"',text)
names=[name for name,title in rows]+['村民0123456789号']
missing=sorted({c for name in names for c in name if ord(c) not in newmap})
assert not missing,missing
for c in recipes:
 g=check['glyf'][newmap[ord(c)]];assert g.numberOfContours>0 and 0<=g.xMin<g.xMax<=256 and -40<=g.yMin<g.yMax<=215
result={'source_sha256':hashlib.sha256(SRC.read_bytes()).hexdigest(),'output_sha256':hashlib.sha256(OUT.read_bytes()).hexdigest(),'added_characters':list(recipes),'source_mapped_characters':len(cmap),'patched_mapped_characters':len(newmap),'character_names_checked':len(names),'missing_name_characters':missing,'all_original_mapped_outlines_preserved':True,'method':'Original-font contour composition; bird component assembled from 白, 鸟 and 焉. No external-font outlines.'}
(REPORT/'patched-validation.json').write_text(json.dumps(result,ensure_ascii=False,indent=2),encoding='utf-8')
# Preview at actual name size plus enlarged individual glyphs.
label=ImageFont.truetype('C:/Windows/Fonts/msyh.ttc',20)
large=ImageFont.truetype(str(OUT),112);normal=ImageFont.truetype(str(OUT),58);fallback=ImageFont.truetype('C:/Windows/Fonts/msyh.ttc',112)
img=Image.new('RGB',(1300,10*155+80),'#f4f0e8');d=ImageDraw.Draw(img)
d.text((25,20),'原字形部件拼字预览：新增字 / 微软雅黑参考 / 完整角色名',font=label,fill='#333333')
for i,c in enumerate(recipes):
 y=70+i*155
 d.line((20,y+145,1280,y+145),fill='#d6cfc4')
 d.text((30,y-12),c,font=large,fill='#181818')
 d.text((200,y-12),c,font=fallback,fill='#777777')
 sample='、'.join(n for n in names if c in n)
 d.text((390,y+20),sample,font=normal,fill='#181818')
img.save(REPORT/'patched-preview.png')
print(json.dumps(result,ensure_ascii=False,indent=2))


