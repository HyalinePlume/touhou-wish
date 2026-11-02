import sys,pathlib
sys.path.insert(0,str(pathlib.Path('outputs/font-audit/dependencies').resolve()))
from PIL import Image
im=Image.open('D:/美之聚集地/杏坛铭/Source/字体.png'); bg=Image.new('RGBA',im.size,'white'); bg.alpha_composite(im);bg.convert('RGB').resize((632,722)).save('outputs/font-audit/reference-white.png')
