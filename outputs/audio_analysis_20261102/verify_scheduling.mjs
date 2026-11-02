import fs from 'node:fs/promises';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const source=await fs.readFile(new URL('../../src/lib/helpers/audio.js',import.meta.url),'utf8');
function setup(enabled=true){
 let now=0,id=0;const tasks=new Map(),instances=[];
 class Audio {
  constructor(src){this.src=src;this.volume=1;this.currentTime=0;this.duration=100;this.readyState=1;this.events={};this.plays=[];instances.push(this);}
  load(){this.loaded=true;}
  removeAttribute(){this.src='';}
  addEventListener(e,fn){this.events[e]=fn;}
  play(){this.plays.push([now,this.currentTime,this.volume]);return Promise.resolve();}
  pause(){this.paused=true;}
 }
 const context={Audio,performance:{now:()=>now},setTimeout:(fn,ms)=>{tasks.set(++id,{fn,at:now+ms});return id;},clearTimeout:i=>tasks.delete(i),setInterval:(fn,ms)=>{tasks.set(++id,{fn,at:now+ms,ms});return id;},clearInterval:i=>tasks.delete(i)};
 const code=source.replace(/^import .*;\r?$/gm,'').replaceAll('export ','').replace('const ENABLE_THEME_START = true;',`const ENABLE_THEME_START = ${enabled};`);
 vm.runInNewContext(`const browser=true;const VILLAGER_THEME_START=0.32;const writable=()=>({set(){}});${code}\nthis.api={playTheme,stopTheme,preloadThemes,fadeOutTheme,cancelThemeSchedule};`,context);
 return {api:context.api,instances,advance(target){while(true){const due=[...tasks].filter(([,t])=>t.at<=target).sort((a,b)=>a[1].at-b[1].at)[0];if(!due)break;const [i,t]=due;now=t.at;if(t.ms)t.at+=t.ms;else tasks.delete(i);t.fn();}now=target;}};
}
for(const [delay,t,start,offset] of [[1300,.8,500,0],[1300,2,0,.7],[300,.2,100,0],[300,.8,0,.5]]){
 const h=setup();h.api.preloadThemes(['/test']);const audio=h.instances.at(-1);
 assert.equal(audio.plays.length,0);assert.ok(audio.loaded);
 h.api.playTheme('/test',t,{delayMs:delay});h.advance(start);
 assert.equal(h.instances.at(-1),audio,'reuse prepared audio');
 assert.equal(audio.plays.length,1);assert.ok(Math.abs(audio.plays[0][1]-offset)<1e-9);
 assert.equal(audio.volume,.2);h.advance(delay);assert.ok(Math.abs(audio.volume-.2)<1e-9);
 h.advance(delay+2100);assert.ok(Math.abs(audio.volume-.6)<1e-9);
 h.api.stopTheme();assert.ok(audio.paused);
}
{
 const h=setup(false);h.api.playTheme('/off',2,{delayMs:300});h.advance(299);assert.equal(h.instances.length,1);h.advance(300);assert.equal(h.instances.at(-1).plays[0][1],0);
}
{
 const h=setup();h.api.playTheme('/cancel',.1,{delayMs:1300});h.api.cancelThemeSchedule();h.advance(2000);assert.equal(h.instances.length,1);
 h.api.preloadThemes(['/late']);const a=h.instances.at(-1);a.readyState=0;
 h.api.playTheme('/late',.8,{delayMs:300});h.advance(2200);a.events.loadedmetadata();assert.ok(Math.abs(a.plays[0][1]-.7)<1e-9);
 h.api.fadeOutTheme({skipHold:true,fadeDurationMs:300});h.advance(2600);assert.ok(a.paused);
}
console.log('Passed: both modes, negative-delay compensation, preload reuse, fixed fade deadline, disabled switch, cancellation, late metadata and fade-out.');
