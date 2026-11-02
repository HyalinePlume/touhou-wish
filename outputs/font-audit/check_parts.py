exec(open('outputs/font-audit/inspect_donors.py',encoding='utf-8-sig').read().split("chars=")[0])
chars='磷粼嶙麟鳳鳩鴉鵝鶴鳥烏乌焉舄鄢燕舃岛鸡鸣鹊鹅鸵冢家逐塬咕叶呆'
for c in chars:
 if ord(c) not in cm: print(c,'MISSING');continue
 g=f['glyf'][cm[ord(c)]];co,end,flags=g.getCoordinates(f['glyf']);start=0;boxes=[]
 for e in end:
  pts=co[start:e+1];boxes.append((min(p[0] for p in pts),min(p[1] for p in pts),max(p[0] for p in pts),max(p[1] for p in pts)));start=e+1
 print(c,boxes)
