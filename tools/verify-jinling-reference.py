import sys,pathlib,json
ROOT=pathlib.Path(__file__).resolve().parents[1];sys.path.insert(0,str(ROOT/'outputs/font-audit/dependencies'))
from PIL import Image,ImageDraw,ImageFont,ImageChops,ImageFilter
from fontTools.ttLib import TTFont
from jinling_reference import SCALE,TX,TY
out=ROOT/'outputs/font-audit';old=TTFont(out/'revision-2/FZCuJinLing-Patched.ttf');new=TTFont(ROOT/'static/fonts/FZCuJinLing-Patched.ttf')
changed=[]
for cp,name in old.getBestCmap().items():
 assert new.getBestCmap()[cp]==name
 if old['glyf'][name].getCoordinates(old['glyf'])!=new['glyf'][name].getCoordinates(new['glyf']) or old['hmtx'][name]!=new['hmtx'][name]:changed.append(chr(cp))
assert set(changed)==set('咲鵺椛吽'),changed
font=ImageFont.truetype(str(ROOT/'static/fonts/FZCuJinLing-Patched.ttf'),1024)
label=ImageFont.truetype('C:/Windows/Fonts/msyh.ttc',22)
comparison=Image.new('RGB',(900,1150),'white');draw=ImageDraw.Draw(comparison)
for j,t in enumerate(['新参考图','字体实际渲染','重合检查（红 / 蓝为差异）']):draw.text((j*300+12,20),t,font=label,fill='black')
metrics={};strip=Image.new('RGB',(1000,280),'white')
for i,c in enumerate('咲鵺椛吽'):
 source=Image.open(out/f'trace-r3/{ord(c):04X}.png').convert('L')
 canvas=Image.new('L',(1100,1200),255);ImageDraw.Draw(canvas).text((0,900),c,font=font,fill=0,anchor='ls')
 actual=canvas.transform((640,644),Image.Transform.AFFINE,(SCALE,0,4*TX,0,SCALE,900-4*TY),Image.Resampling.BICUBIC)
 r=ImageChops.invert(source);n=ImageChops.invert(actual)
 rb=r.point(lambda x:255 if x>=128 else 0);nb=n.point(lambda x:255 if x>=128 else 0)
 count=lambda im:sum(im.histogram()[1:])
 intersection=count(ImageChops.darker(rb,nb));total=count(ImageChops.lighter(rb,nb))
 outside=ImageChops.lighter(ImageChops.subtract(rb,nb.filter(ImageFilter.MaxFilter(9))),ImageChops.subtract(nb,rb.filter(ImageFilter.MaxFilter(9))));bad=count(outside)
 metrics[c]={'ink_intersection_over_union':round(intersection/total,5),'pixels_outside_one_source_pixel_tolerance':bad,'comparison_pixels':640*644}
 assert intersection/total>0.96,metrics[c]
 assert bad==0,metrics[c]
 overlay=Image.merge('RGB',(ImageChops.invert(n),ImageChops.invert(ImageChops.lighter(r,n)),ImageChops.invert(r)))
 for j,im in enumerate([source,actual,overlay]):comparison.paste(im.resize((250,252),Image.Resampling.LANCZOS),(j*300+25,65+i*270))
 strip.paste(actual.resize((250,252),Image.Resampling.LANCZOS),(i*250,14))
 actual.save(out/f'trace-r3/{ord(c):04X}-font-render.png')
comparison.save(out/'reference-overlay-r3.png');strip.save(out/'revised-four-r3.png')
report={'reference_sha256':__import__('hashlib').sha256((out/'reference-r3.png').read_bytes()).hexdigest(),'uniform_scale':SCALE,'translation':[TX,TY],'per_component_adjustments':False,'changed_characters':changed,'all_other_glyphs_preserved':True,'glyphs':metrics}
(out/'reference-validation-r3.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8');print(json.dumps(report,ensure_ascii=False,indent=2))
