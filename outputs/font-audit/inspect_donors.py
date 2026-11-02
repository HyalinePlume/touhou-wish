import sys,pathlib
sys.path.insert(0,str(pathlib.Path('outputs/font-audit/dependencies').resolve()))
from fontTools.ttLib import TTFont
from PIL import Image,ImageDraw,ImageFont
p=pathlib.Path('static/fonts/FZCuJinLing-Regular.ttf'); f=TTFont(p); cm=f.getBestCmap();print(f.keys());print('UPM',f['head'].unitsPerEm)
chars='咲塚椛燐鵺猯吽侘袿冴口关土冢木花火鳞夜鸟鳥端狂牛伸宅衫圭冷牙吐咆枫杠炉烂倚佳褂蛙鸦邪讶'
img=Image.new('RGB',(1000,((len(chars)+9)//10)*130),'white');d=ImageDraw.Draw(img);font=ImageFont.truetype(str(p),90);label=ImageFont.truetype('C:/Windows/Fonts/msyh.ttc',18)
for i,c in enumerate(chars):
 x=i%10*100;y=i//10*130;d.text((x+5,y),c,font=font,fill='black');d.text((x+25,y+100),c,font=label,fill='blue')
 if ord(c) not in cm:continue
 g=f['glyf'][cm[ord(c)]];co,end,flags=g.getCoordinates(f['glyf']);start=0;boxes=[]
 for e in end:
  pts=co[start:e+1];boxes.append(tuple(round(v) for v in (min(p[0] for p in pts),min(p[1] for p in pts),max(p[0] for p in pts),max(p[1] for p in pts))));start=e+1
 print(c,boxes)
img.save('outputs/font-audit/donors.png')
