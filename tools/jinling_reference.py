"""Load outlines traced from the user's reference. Apply ONE shared uniform transform."""
import re,xml.etree.ElementTree as ET
from pathlib import Path
import pathops
from fontTools.svgLib.path import parse_path
from fontTools.pens.transformPen import TransformPen
ROOT=Path(__file__).resolve().parents[1]
SCALE=232/161
TX=(256-160*SCALE)/2
TY=205

def reference_outline(char):
 path=pathops.Path()
 for node in ET.parse(ROOT/f'outputs/font-audit/trace-r3/{ord(char):04X}.svg').getroot():
  if not node.tag.endswith('path'):continue
  assert node.attrib['fill']=='#000000'
  values=re.findall(r'[-+]?\d*\.?\d+',node.attrib.get('transform','translate(0,0)'))
  dx,dy=map(float,values)
  parse_path(node.attrib['d'],TransformPen(path.getPen(),(1,0,0,1,dx,dy)))
 # SVG was traced at 4x. No separate X/Y scaling or component movement.
 return path.transform(SCALE/4,0,0,-SCALE/4,TX,TY)
