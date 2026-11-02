const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');

function harness(suspense) {
  let now = 0, nextId = 0, secondStarts = 0;
  const timers = new Map(), listeners = new Set(), audio = [];
  const schedule = (fn, delay) => {
    const id = ++nextId;
    timers.set(id, { at: now + delay, fn });
    return id;
  };
  function advance(ms) {
    const end = now + ms;
    while (true) {
      const next = [...timers].filter(([, t]) => t.at <= end).sort((a, b) => a[1].at - b[1].at)[0];
      if (!next) break;
      const [id, timer] = next;
      now = timer.at;
      timers.delete(id);
      timer.fn();
    }
    now = end;
  }
  const tracks = ['running', 'running', 'finished', 'running', 'running'].map((playState, index) => ({
    playState, currentTime: null,
    effect: { target: { closest(selector) {
      assert.equal(selector, '[data-result-independent]');
      return index >= 3 ? {} : null;
    } } },
    pause() { this.playState = 'paused'; },
    play() { this.playState = 'running'; },
    cancel() { this.playState = 'idle'; }
  }));
  const source = fs.readFileSync('src/lib/helpers/resultPlayback.js', 'utf8').replaceAll('export ', '');
  const page = fs.readFileSync('src/routes/+page.svelte', 'utf8');
  const audioFn = page.match(/  function playSecondPhaseAudio\(\) \{[\s\S]*?\n  \}/)[0];
  const ctx = vm.createContext({
    setTimeout: schedule, clearTimeout: id => timers.delete(id),
    window: {
      addEventListener(type, fn, capture) { assert.equal(type, 'click'); assert.equal(capture, true); listeners.add(fn); },
      removeEventListener(type, fn) { listeners.delete(fn); }
    },
    node: { getAnimations(options) { assert.equal(options.subtree, true); return tracks; } },
    suspense, onSecondPhase() { secondStarts++; vm.runInContext('playSecondPhaseAudio()', ctx); },
    playSfx: (name, src) => audio.push({ name, src, at: now }),
    playTheme: src => audio.push({ name: 'theme', src, at: now }),
    drawAssets: { show2Src: '/sfx/show2_4stars.mp3' },
    drawResult: [{ theme: '/theme.mp3' }], resultIndex: 0,
    showWishResult: true, showWishSummary: false,
    SHOW2_START_DELAY_MS: 1100, THEME_START_DELAY_MS: 1300
  });
  vm.runInContext(source + '\nlet show2Timer, themeTimer;\n' + audioFn + '\nvar stop = startResultPlayback({node, suspense, onSecondPhase});', ctx);
  return {
    advance, tracks, audio, listeners,
    click() { [...listeners].forEach(fn => fn()); },
    stop() { vm.runInContext('stop()', ctx); },
    get starts() { return secondStarts; }
  };
}

const normal = harness(false);
normal.advance(999); normal.click(); assert.equal(normal.starts, 0);
normal.advance(1); assert.equal(normal.starts, 1);
assert.equal(normal.tracks[0].playState, 'running');
assert.equal(normal.listeners.size, 0);
normal.advance(99); assert.equal(normal.audio.length, 0);
normal.advance(1); assert.equal(normal.audio[0].at, 1100);
normal.advance(200); assert.equal(normal.audio[1].at, 1300);

const suspense = harness(true);
suspense.advance(999); suspense.click(); assert.equal(suspense.starts, 0);
suspense.advance(1);
assert.equal(suspense.tracks[0].playState, 'paused');
assert.equal(suspense.tracks[0].currentTime, 1000);
assert.equal(suspense.tracks[1].currentTime, 1000);
assert.equal(suspense.tracks[2].currentTime, null); // 已完成的特效不重播。
for (const track of suspense.tracks.slice(3)) {
  assert.equal(track.playState, 'running'); // vfx1 与入场光圈不受暂停影响。
  assert.equal(track.currentTime, null); // 不能跳回或定位至1秒。
}
suspense.advance(6000);
assert.equal(suspense.starts, 0); assert.equal(suspense.audio.length, 0);
// 模拟独立特效已经自然播放结束，揭晓不应重新播放它们。
suspense.tracks.slice(3).forEach(track => { track.playState = 'finished'; track.currentTime = 1400; });
suspense.click(); suspense.click();
assert.equal(suspense.starts, 1); assert.equal(suspense.listeners.size, 0);
assert.equal(suspense.tracks[0].playState, 'running');
for (const track of suspense.tracks.slice(3)) {
  assert.equal(track.playState, 'finished');
  assert.equal(track.currentTime, 1400);
}
suspense.advance(100); assert.equal(suspense.audio[0].at, 7100);
suspense.advance(200); assert.equal(suspense.audio[1].at, 7300);

const earlyClose = harness(true);
earlyClose.advance(500); earlyClose.stop(); earlyClose.advance(2000); earlyClose.click();
assert.equal(earlyClose.starts, 0); assert.equal(earlyClose.listeners.size, 0);
const waitingClose = harness(true);
waitingClose.advance(1000); waitingClose.stop(); waitingClose.click();
assert.equal(waitingClose.starts, 0); assert.equal(waitingClose.tracks[0].playState, 'idle');
assert.equal(waitingClose.listeners.size, 0);
assert.equal(waitingClose.tracks[3].playState, 'running');
assert.equal(waitingClose.tracks[4].playState, 'running');
const nextResult = harness(true);
nextResult.click(); nextResult.advance(1000); assert.equal(nextResult.starts, 0);
nextResult.click(); assert.equal(nextResult.starts, 1);
assert.match(fs.readFileSync('src/routes/+page.svelte', 'utf8'), /\{suspenseEnabled\} onSecondPhase=\{playSecondPhaseAudio\}/);
const result = fs.readFileSync('src/lib/components/WishResult.svelte', 'utf8');
assert.match(result, /\{#if !skip\}\s*<SplashLight type="in"/);
assert.doesNotMatch(result, /\{#if !isSplashOut && !skip\}/);
assert.match(fs.readFileSync('src/lib/components/ParticleBurst.svelte', 'utf8'), /class="burst" data-result-independent/);
const splash = fs.readFileSync('src/lib/components/SplashLight.svelte', 'utf8');
assert.equal((splash.match(/data-result-independent/g) || []).length, 5);
console.log('PASS: first-round particles/orbs continue independently without rewinding or replay; entrance orbs are not cut off by reveal; normal/suspense timing, audio, clicks and cleanup');
