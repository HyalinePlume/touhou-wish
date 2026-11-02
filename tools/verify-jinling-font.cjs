const {chromium}=require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const fs=require('node:fs');
const assert=require('node:assert/strict');
(async()=>{
 const {createServer}=await import('vite');const server=await createServer({server:{port:4207,host:'127.0.0.1'}});await server.listen();
 let browser;
 try{
  browser=await chromium.launch({channel:'msedge',headless:true});
  const page=await browser.newPage({viewport:{width:1200,height:900}});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  const requestedFonts=[];page.on('request',r=>{if(r.url().includes('/fonts/FZCuJinLing-Patched.ttf'))requestedFonts.push(r.url())});
  await page.goto('http://127.0.0.1:4207');
  const response=await page.request.get('http://127.0.0.1:4207/fonts/FZCuJinLing-Patched.ttf');assert.equal(response.status(),200);
  await page.evaluate(async()=>{
   await document.fonts.load('80px FZCuJinLing','咲塚椛燐鵺猯吽侘袿冴');
   const panel=document.createElement('div');panel.id='font-verification';panel.style='position:fixed;inset:0;z-index:999999;background:#151c29;color:white;padding:35px;overflow:auto';
   const heading=document.createElement('p');heading.textContent='方正粗金陵补字版 · 浏览器实际渲染';heading.style='font:22px sans-serif;margin-bottom:25px';panel.append(heading);
   for(const [i,name] of ['十六夜咲夜','小野塚小町　尘塚姥芽','犬走椛　火焰猫燐','封兽鵺　二岩猯藏','高丽野阿吽　庭渡久侘歌','埴安神袿姬　冴月麟'].entries()){
    const row=document.createElement('div');row.id='font-row-'+i;row.style='font:64px/1.6 FZCuJinLing, sans-serif';row.textContent=name;panel.append(row);
   }
   const probe=document.createElement('div');probe.id='font-probe';probe.style='font:64px FZCuJinLing, sans-serif';probe.textContent='咲塚椛燐鵺猯吽侘袿冴';panel.append(probe);
   document.body.append(panel);
  });
  const cdp=await page.context().newCDPSession(page);await cdp.send('DOM.enable');await cdp.send('CSS.enable');
  const {root}=await cdp.send('DOM.getDocument');
  const {nodeId}=await cdp.send('DOM.querySelector',{nodeId:root.nodeId,selector:'#font-probe'});
  const fonts=await cdp.send('CSS.getPlatformFontsForNode',{nodeId});
  assert.equal(fonts.fonts.length,1,JSON.stringify(fonts));assert.ok(fonts.fonts[0].isCustomFont);assert.equal(fonts.fonts[0].glyphCount,10);assert.match(fonts.fonts[0].familyName,/XTM JinLing Patched/);
  assert.deepEqual(errors,[]);
  assert.ok(requestedFonts.some(url=>url.endsWith('FZCuJinLing-Patched.ttf?v=3')));
  await page.screenshot({path:'outputs/font-audit/browser-preview.png'});
  const result={fontStatus:response.status(),requestedFonts,missingGlyphProbe:fonts,pageErrors:errors};
  fs.writeFileSync('outputs/font-audit/browser-validation.json',JSON.stringify(result,null,2));console.log(result);
 } finally {await browser?.close();await server.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
