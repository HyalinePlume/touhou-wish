"""Compare the four revised glyphs with the supplied raster reference and revision 1."""
import sys,pathlib,json
ROOT=pathlib.Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/'outputs/font-audit/dependencies'))
from PIL import Image,ImageDraw,ImageFont,ImageChops
from fontTools.ttLib import TTFont
out=ROOT/'outputs/font-audit';old=TTFont(out/'revision-1/FZCuJinLing-Patched.ttf');new=TTFont(ROOT/'static/fonts/FZCuJinLing-Patched.ttf')
changed=[]
for cp,name in old.getBestCmap().items():
 assert new.getBestCmap()[cp]==name
 a=old['glyf'][name].getCoordinates(old['glyf']);b=new['glyf'][name].getCoordinates(new['glyf'])
 if a!=b or old['hmtx'][name]!=new['hmtx'][name]:changed.append(chr(cp))
assert set(changed)==set('咲鵺椛吽'),changed
(out/'revision-2-validation.json').write_text(json.dumps({'changed_characters':changed,'all_other_mapped_glyphs_and_widths_preserved':True,'reference':'reference.png'},ensure_ascii=False,indent=2),encoding='utf-8')
ref=Image.open(out/'reference.png');white=Image.new('RGBA',ref.size,'white');white.alpha_composite(ref);ref=white.convert('RGB')
label=ImageFont.truetype('C:/Windows/Fonts/msyh.ttc',24)
fonts=[ImageFont.truetype(str(out/'revision-1/FZCuJinLing-Patched.ttf'),235),ImageFont.truetype(str(ROOT/'static/fonts/FZCuJinLing-Patched.ttf'),235)]
img=Image.new('RGB',(900,1140),'white');d=ImageDraw.Draw(img)
for j,text in enumerate(['你的参考图','调整前','调整后']):d.text((j*300+90,20),text,font=label,fill='#333333')
boxes=[(0,0,160,160),(170,0,316,165),(0,200,160,361),(165,200,316,361)]
strip=Image.new('RGB',(1000,300),'#f4f0e8');sd=ImageDraw.Draw(strip);stripfont=ImageFont.truetype(str(ROOT/'static/fonts/FZCuJinLing-Patched.ttf'),230)
for i,(c,box) in enumerate(zip('咲鵺椛吽',boxes)):
 y=65+i*265
 crop=ref.crop(box);bbox=ImageChops.difference(crop,Image.new('RGB',crop.size,'white')).point(lambda x:255 if x>64 else 0).getbbox();crop=crop.crop(bbox)
 scale=min(235/crop.width,213/crop.height);crop=crop.resize((round(crop.width*scale),round(crop.height*scale)),Image.Resampling.LANCZOS)
 img.paste(crop,((300-crop.width)//2,y+(235-crop.height)//2))
 for j,f in enumerate(fonts,1):
  x0,y0,x1,y1=d.textbbox((0,0),c,font=f)
  d.text((j*300+(300-(x1-x0))//2-x0,y+(235-(y1-y0))//2-y0),c,font=f,fill='black')
 d.line((15,y+250,885,y+250),fill='#dddddd')
 x0,y0,x1,y1=sd.textbbox((0,0),c,font=stripfont)
 sd.text((i*250+(250-x1+x0)//2-x0,(300-y1+y0)//2-y0),c,font=stripfont,fill='#181818')
img.save(out/'reference-comparison-r2.png');strip.save(out/'revised-four.png');print('Only changed:', ''.join(changed))
