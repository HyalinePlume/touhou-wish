import sys,pathlib
sys.path.insert(0,str(pathlib.Path('outputs/font-audit/dependencies').resolve()))
from PIL import Image,ImageDraw,ImageFont
im=Image.open('D:/美之聚集地/杏坛铭/Source/字体.png');print(im.mode,im.size);print(im.getpixel((180,50)),im.getpixel((230,50)),im.getpixel((200,120)))
im=Image.new('RGB',(1200,360),'white');d=ImageDraw.Draw(im);font=ImageFont.truetype('static/fonts/FZCuJinLing-Patched.ttf',280)
for i,c in enumerate('咲鵺椛吽'):d.text((i*300,0),c,font=font,fill='black')
im.save('outputs/font-audit/four-before.png')
