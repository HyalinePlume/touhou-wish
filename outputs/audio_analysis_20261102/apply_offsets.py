import json, math, re
from pathlib import Path
root=Path(__file__).resolve().parents[2]
rows=json.loads((Path(__file__).parent/'analysis.json').read_text(encoding='utf-8'))
offsets={r['file']:math.floor(r['exact']*100)/100 for r in rows}
p=root/'src/lib/data/characters.js'
s=p.read_text(encoding='utf-8')
s=s.replace('constructor(name, title, race, artSrc, theme) {','constructor(name, title, race, artSrc, theme, themeStart = 0) {')
s=s.replace('    this.theme = theme;','    this.theme = theme;\n    this.themeStart = themeStart; // 起始播放位置，单位：秒。')
s=s.replace('const VILLAGER_THEME = "villager_theme.mp3";',f'const VILLAGER_THEME = "villager_theme.mp3";\nexport const VILLAGER_THEME_START = {offsets["villager_theme.mp3"]:.2f};')
count=0
def update(m):
    global count
    count+=1
    return f'{m[1]}"{m[2]}",{m[3]}\n    {offsets[m[2]]:.2f} // themeStart：完全静音开头时长，截取两位小数'
s=re.sub(r'^(    )"([^"\n]+\.mp3)"([^\n]*)',update,s,flags=re.M)
s=s.replace('VILLAGER_ART, VILLAGER_THEME)','VILLAGER_ART, VILLAGER_THEME, VILLAGER_THEME_START)')
assert count==len(re.findall(r'new Character\("',s))-1, count
p.write_text(s,encoding='utf-8',newline='\n')
print(f'Configured {count} characters + villagers')
