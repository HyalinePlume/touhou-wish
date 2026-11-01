const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
let now = 0, nextId = 0;
const timers = new Map(), tracks = [];
function schedule(fn, ms, repeat) { const id = ++nextId; timers.set(id, { fn, at: now + ms, ms, repeat }); return id; }
function advance(ms) {
  const end = now + ms;
  while (true) {
    const next = [...timers].filter(([, t]) => t.at <= end).sort((a, b) => a[1].at - b[1].at)[0];
    if (!next) break;
    const [id, t] = next; now = t.at;
    if (t.repeat) t.at += t.ms; else timers.delete(id);
    t.fn();
  }
  now = end;
}
class Audio {
  constructor(src) { this.src = src; this.volume = 1; this.paused = true; this.currentTime = 0; tracks.push(this); }
  play() { this.paused = false; return Promise.resolve(); }
  pause() { this.paused = true; }
  addEventListener() {}
}
let code = fs.readFileSync('src/lib/helpers/audio.js', 'utf8')
  .replace('import { browser } from "$app/environment";', 'const browser = true;')
  .replaceAll('export ', '');
for (const [hold, fade] of [[500, 500], [9000, 300], [9000, 3000]]) {
  const context = vm.createContext({Audio, performance: {now: () => now},
    setTimeout: (fn, ms) => schedule(fn, ms, false), setInterval: (fn, ms) => schedule(fn, ms, true),
    clearTimeout: id => timers.delete(id), clearInterval: id => timers.delete(id)});
  vm.runInContext(code.replace(/THEME_EXIT_HOLD_MS = \d+/, `THEME_EXIT_HOLD_MS = ${hold}`)
    .replace(/THEME_EXIT_FADE_MS = \d+/, `THEME_EXIT_FADE_MS = ${fade}`), context);
  context.playTheme('/first.mp3'); advance(250);
  const old = tracks.at(-1), volume = old.volume;
  const fadeMs = Math.min(fade, 1300), holdMs = Math.min(hold, 1300-fadeMs);
  context.fadeOutTheme({maxDurationMs:1300}); advance(holdMs);
  assert.equal(old.volume, volume); assert.equal(old.paused, false);
  advance(fadeMs/2); assert.ok(Math.abs(old.volume - volume*.5)<.02, 'linear halfway volume');
  advance(1300-holdMs-fadeMs/2);
  context.playTheme('/second.mp3'); const second = tracks.at(-1);
  assert.equal(old.paused,true); assert.equal(old.volume,0);
  assert.equal(tracks.filter(a=>!a.paused).length,1);
  // A fast next start must still clear retiring tracks, even before timers complete.
  context.fadeOutTheme({maxDurationMs:1300}); advance(100);
  context.playTheme('/third.mp3'); assert.equal(second.paused,true);
  assert.equal(tracks.filter(a=>!a.paused).length,1);
  const last = tracks.at(-1), lastVolume = last.volume;
  context.fadeOutTheme({skipHold:true,fadeDurationMs:300});
  advance(150); assert.ok(last.volume < lastVolume * .6, 'return starts fading immediately despite long hold');
  advance(170); assert.equal(last.paused,true); assert.equal(last.volume,0);
  context.stopTheme();
  assert.equal(timers.size,0); assert.equal(tracks.filter(a=>!a.paused).length,0);
  console.log(`PASS hold=${hold}, fade=${fade}: bounded linear fade, no overlapping tracks, cleanup`);
}
