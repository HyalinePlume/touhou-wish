import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import {getFullPool, Character, VILLAGER_THEME_START} from '../../src/lib/data/characters.js';
const rows=JSON.parse(await fs.readFile(new URL('analysis.json',import.meta.url),'utf8'));
const offsets=new Map(rows.map(r=>[r.file,Math.floor(r.exact*100)/100]));
const pool=getFullPool(2);
for(const c of pool)assert.equal(c.themeStart,offsets.get(c.theme),c.name);
assert.equal(new Character('test','','','','').themeStart,0);
const source=await fs.readFile(new URL('../../src/lib/helpers/audio.js',import.meta.url),'utf8');
class FakeAudio {
 constructor(src){this.src=src;this.currentTime=0;this.duration=100;this.readyState=0;this.events={};FakeAudio.last=this;}
 addEventListener(name,fn){this.events[name]=fn;}
 play(){this.playedAt=this.currentTime;return Promise.resolve();}
 pause(){}
}
globalThis.Audio=FakeAudio;
const nativeTimer=globalThis.setInterval;
globalThis.setInterval=()=>0;
try {
 for(const enabled of [true,false]) {
  const code=source.replace(/import \{ browser \}[^;]+;/,'const browser = true;').replace(/import \{ VILLAGER_THEME_START \}[^;]+;/,`const VILLAGER_THEME_START = ${VILLAGER_THEME_START};`).replace('const ENABLE_THEME_START = true;',`const ENABLE_THEME_START = ${enabled};`);
  const mod=await import('data:text/javascript;base64,'+Buffer.from(code).toString('base64'));
  mod.playTheme('/theme.mp3',1.23);
  const a=FakeAudio.last;
  assert.equal(a.playedAt,undefined);
  a.events.loadedmetadata();
  assert.equal(a.playedAt,enabled?1.23:0);
  mod.playTheme('/replacement.mp3',2);
  const stale=FakeAudio.last;
  mod.stopTheme();stale.events.loadedmetadata();
  assert.equal(stale.playedAt,undefined);
  mod.playTheme('/broken.mp3',8);
  FakeAudio.last.events.error();
  const fallback=FakeAudio.last;fallback.events.loadedmetadata();
  assert.equal(fallback.playedAt,enabled?VILLAGER_THEME_START:0);
  mod.stopTheme();
 }
} finally {globalThis.setInterval=nativeTimer;}
console.log(`Verified ${pool.length} character entries, truncation, default offset, toggle on/off, stale loads and fallback.`);
