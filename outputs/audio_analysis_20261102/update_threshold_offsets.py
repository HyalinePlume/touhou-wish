import json, re
from decimal import Decimal, ROUND_DOWN
from pathlib import Path

root = Path(__file__).resolve().parents[2]
rows = json.loads((Path(__file__).parent / 'analysis.json').read_text(encoding='utf-8'))
by_file = {row['file']: row for row in rows}
excluded = {row['file'] for row in rows if '候选' in row['category']}
assert len(excluded) == 5
path = root / 'src/lib/data/characters.js'
with path.open(encoding='utf-8', newline='') as stream:
    source = stream.read()
pattern = r'(^[ \t]*"([^"\r\n]+\.mp3)",[^\r\n]*\r?\n[ \t]*)(\d+\.\d+)'
changed = 0
seen = set()
def update(match):
    global changed
    filename = match[2]
    seen.add(filename)
    if filename in excluded:
        return match[0]
    value = by_file[filename]['high']
    assert value is not None, filename
    number = str(Decimal(str(value)).quantize(Decimal('0.01'), rounding=ROUND_DOWN))
    changed += number != match[3]
    return match[1] + number
result = re.sub(pattern, update, source, flags=re.M)
assert seen == set(by_file) - {'villager_theme.mp3'}
villager = str(Decimal(str(by_file['villager_theme.mp3']['high'])).quantize(Decimal('0.01'), rounding=ROUND_DOWN))
result, count = re.subn(r'(export const VILLAGER_THEME_START = )\d+\.\d+', lambda m: m[1] + villager, result)
assert count == 1
# Verify all five exclusions remain byte-for-byte identical within their entries.
for filename in excluded:
    old = next(m[0] for m in re.finditer(pattern, source, re.M) if m[2] == filename)
    new = next(m[0] for m in re.finditer(pattern, result, re.M) if m[2] == filename)
    assert old == new, filename
with path.open('w', encoding='utf-8', newline='') as stream:
    stream.write(result)
print(f'Changed {changed} character offsets plus village offset to {villager}; preserved 5 excluded tracks.')
for row in rows:
    if row['file'] in excluded:
        print('Preserved:', row['people'], row['file'])
