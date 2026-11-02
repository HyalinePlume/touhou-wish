from pathlib import Path
p=Path('tools/patch-jinling-font.py');s=p.read_text(encoding='utf-8-sig')
a=s.index('def spread_guan():');b=s.index('recipes={',a)
s=s[:a]+'from jinling_reference import reference_outline\n\n'+s[b:]
s=s.replace("'咲':[fit(mouth(),(5,33,83,154)),spread_guan()]", "'咲':[reference_outline('咲')]")
s=s.replace("'椛':[wood_for_hua(),fit(part('花'),(69,-23,249,204))]", "'椛':[reference_outline('椛')]")
s=s.replace("'鵺':[fit(part('夜'),(5,-27,137,204)),bird]", "'鵺':[reference_outline('鵺')]")
s=s.replace("'吽':[fit(mouth(),(5,60,73,178)),fit(part('牛'),(45,-28,250,203))]", "'吽':[reference_outline('吽')]")
s=s.replace('max_err=0.25','max_err=0.08').replace('20261102-r2','20261102-r3')
s=s.replace("'Original-font contour composition; bird component assembled from 白, 鸟 and 焉. No external-font outlines.'", "'咲鵺椛吽 traced directly from reference-r3.png; a single shared uniform scale and translation. Other six glyphs retain original-font compositions.'")
s=s.replace('原字形部件拼字预览：新增字 / 微软雅黑参考 / 完整角色名','补字预览：新增字 / 微软雅黑参考 / 完整角色名')
p.write_text(s,encoding='utf-8')
