exec(open('outputs/font-audit/inspect_donors.py',encoding='utf-8-sig').read().split("chars=")[0])
chars='鸟白身嶙炉咲鵺'
img=Image.new('RGB',(len(chars)*250,300),'white');d=ImageDraw.Draw(img);font=ImageFont.truetype(str(p),240)
for i,c in enumerate(chars):d.text((i*250,0),c,font=font,fill='black')
img.save('outputs/font-audit/detail.png')
