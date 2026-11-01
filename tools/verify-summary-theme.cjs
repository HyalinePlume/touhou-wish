const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const source = fs.readFileSync('src/routes/+page.svelte', 'utf8');
const functions = source.slice(source.indexOf('  function playResultTheme()'), source.indexOf('  /* ---------- 村民数量控制'));
const events = [], timers = new Map(); let id = 0;
const c = vm.createContext({drawResult: [{theme:'first'}, {theme:'last'}], resultIndex:0,
  showWishResult:true, showWishSummary:false, themeTimer:null, THEME_START_DELAY_MS:1300, THEME_RETURN_FADE_MS:300,
  playSfx:()=>{}, playTheme:src=>events.push(src), fadeOutTheme:options=>{ if(options?.skipHold) assert.equal(options.fadeDurationMs,300); events.push(options?.skipHold ? 'return-fade' : 'fade'); }, unmuteBgm:()=>events.push('home'),
  setTimeout:fn=>{timers.set(++id,fn);return id;}, clearTimeout:id=>timers.delete(id)});
vm.runInContext(functions,c);
c.handleCloseResult(); assert.deepEqual(events,['fade']); assert.equal(c.resultIndex,1);
c.handleCloseResult(); assert.equal(c.showWishSummary,true); assert.deepEqual(events,['fade']);
// 即使在最后一首启动前快速进入汇总页，也仍会启动正确的音乐。
for(const [key,fn] of timers){timers.delete(key);fn();}
assert.deepEqual(events,['fade','last']);
c.finishResults(); assert.deepEqual(events,['fade','last','return-fade','home']); assert.equal(timers.size,0);
// 汇总页关闭得很快时，不允许延迟启动的音乐在首页响起。
c.drawResult=[{theme:'first'},{theme:'last'}];c.resultIndex=1;c.showWishResult=true;
c.playResultTheme();c.handleCloseResult();c.finishResults();assert.equal(timers.size,0);
console.log('PASS: summary preserves last theme, pending start works, close fades and cancels delayed playback.');
