const {chromium}=require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert=require('node:assert/strict');
(async()=>{
 const {createServer}=await import('vite');const server=await createServer({server:{port:4199,host:'127.0.0.1'}});await server.listen();
 const browser=await chromium.launch({channel:'msedge',headless:true});
 try {
 const page=await browser.newPage({viewport:{width:1600,height:900}}); const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(()=>localStorage.setItem('xtm_skip_missing_prize_prompt','true'));
 await page.goto('http://127.0.0.1:4199');
 let total=0;
 for(const count of [1,2,5,10]){
  if(count===1)await page.getByRole('button',{name:'祈愿一次'}).click();else{await page.getByRole('button',{name:'祈愿多次'}).click();await page.locator('#wish-count').fill(String(count));await page.getByRole('button',{name:'确定',exact:true}).click();}
  await page.locator('.meteor-wrapper video').evaluate(v=>v.dispatchEvent(new Event('ended')));
  const names=[];
  for(let i=0;i<count;i++){
   await page.getByRole('button',{name:'关闭结果',exact:true}).waitFor();
   names.push(await page.locator('.wish-result .name .text').last().textContent());
   await page.getByRole('button',{name:'关闭结果',exact:true}).click();
   await page.waitForTimeout(300);
  }
  total+=count;
  if(count>1){
   await page.locator('dialog.summary[open]').waitFor();
   assert.deepEqual(await page.locator('.summary .summary-name').allTextContents(),names);
   await page.waitForTimeout(2000);
   await page.screenshot({path:`artifacts/summary-${count}.png`});
   const boxes=await page.locator('.arrival').evaluateAll(els=>els.map(e=>{const r=e.getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height};}));
   assert.ok(boxes.every(b=>b.x>=0&&b.x+b.w<=1600));
   assert.ok(Math.abs((boxes[0].x+boxes.at(-1).x+boxes.at(-1).w)/2-800)<2);
   if(count===10){
    const idleBefore=await page.locator('.portrait').evaluateAll(els=>els.map(e=>{const r=e.getBoundingClientRect();return [r.x,r.y,r.width,r.height]}));
    await page.waitForTimeout(700);
    assert.deepEqual(await page.locator('.portrait').evaluateAll(els=>els.map(e=>{const r=e.getBoundingClientRect();return [r.x,r.y,r.width,r.height]})),idleBefore);
    await page.evaluate(()=>document.querySelectorAll('.arrival').forEach(e=>e.getAnimations().forEach(a=>{a.pause();a.currentTime=650})));
    await page.screenshot({path:'artifacts/summary-entrance.png'});
    await page.evaluate(()=>document.querySelectorAll('.arrival').forEach(e=>e.getAnimations().forEach(a=>{a.pause();a.currentTime=3000})));
    await page.setViewportSize({width:390,height:844});await page.screenshot({path:'artifacts/summary-mobile.png'});
    assert.equal(await page.locator('.arrival').evaluateAll(els=>els.every(e=>{const r=e.getBoundingClientRect();return r.x>=0&&r.right<=innerWidth&&r.y>=0&&r.bottom<=innerHeight})),true);
    await page.emulateMedia({reducedMotion:'reduce'});assert.equal(await page.locator('.arrival').first().evaluate(e=>getComputedStyle(e).animationName),'none');
    await page.setViewportSize({width:1600,height:900});
    await page.getByRole('button',{name:'关闭连抽结果'}).click();
   } else if(count===2)await page.keyboard.press('Escape');else await page.locator('.summary footer button').click();
  }
  await page.getByRole('button',{name:'祈愿一次'}).waitFor();
  const records=await page.evaluate(()=>new Promise((resolve,reject)=>{const r=indexedDB.open('xtm_wish_history',2);r.onsuccess=()=>{const db=r.result;const q=db.transaction('records').objectStore('records').count();q.onsuccess=()=>{resolve(q.result);db.close()};q.onerror=reject;};r.onerror=reject;}));
  assert.equal(records,total);console.log(`PASS count=${count}, ordered results, history=${records}, close/re-entry`);
 }
 assert.deepEqual(errors,[]);console.log('PASS no browser runtime errors, desktop centering, mobile bounds, reduced motion');
 }finally{await browser.close();await server.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
