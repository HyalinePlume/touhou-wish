import sys,pathlib
sys.path.insert(0,str(pathlib.Path('outputs/font-audit/dependencies').resolve()))
__file__=str(pathlib.Path('tools/patch-jinling-font.py').resolve())
exec(open('tools/patch-jinling-font.py',encoding='utf-8-sig').read().split('mouth=lambda:')[0])
from fontTools.pens.svgPathPen import SVGPathPen
for c in ['关','白']:
 p=SVGPathPen(None);part(c).draw(p);print(c,p.getCommands())

