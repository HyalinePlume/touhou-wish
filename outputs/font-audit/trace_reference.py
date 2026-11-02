import sys,pathlib
ROOT=pathlib.Path.cwd();sys.path.insert(0,str(ROOT/'outputs/font-audit/dependencies'))
from PIL import Image
import vtracer
out=ROOT/'outputs/font-audit/trace-r3';out.mkdir(exist_ok=True)
im=Image.open(ROOT/'outputs/font-audit/reference-r3.png');white=Image.new('RGBA',(320,361),'white');white.alpha_composite(im)
for c,box in zip('咲鵺椛吽',[(0,0,160,161),(160,0,320,161),(0,200,160,361),(160,200,320,361)]):
 crop=white.crop(box).convert('RGB').resize((640,644),Image.Resampling.LANCZOS)
 file=out/f'{ord(c):04X}.png';crop.save(file)
 vtracer.convert_image_to_svg_py(str(file),str(file.with_suffix('.svg')),colormode='binary',mode='spline',filter_speckle=0,corner_threshold=45,length_threshold=0.5,max_iterations=10,splice_threshold=45,path_precision=4)
 print(c,file.with_suffix('.svg').stat().st_size)
