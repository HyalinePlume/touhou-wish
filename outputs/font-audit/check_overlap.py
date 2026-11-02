import pathlib,sys
__file__=str(pathlib.Path('tools/patch-jinling-font.py').resolve())
exec(pathlib.Path(__file__).read_text(encoding='utf-8-sig').split('for c,parts in recipes.items():')[0])
for c in ['咲','椛','吽','鵺']:
 p=pathops.op(recipes[c][0],recipes[c][1],pathops.PathOp.INTERSECTION);print(c,'overlap',p.area)
