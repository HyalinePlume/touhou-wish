import sys,pathlib
sys.path.insert(0,str(pathlib.Path('outputs/font-audit/dependencies').resolve()))
import pathops
print([x for x in dir(pathops.Path) if not x.startswith('_')])
