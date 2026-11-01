const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const http = require('http'); const fs = require('fs');
(async()=>{
 const path=process.argv[2]; if(!path) throw new Error('Usage: node tools/reference.cjs <video.mp4>');
 const server=http.createServer((req,res)=>{if(req.url==='/video'){const size=fs.statSync(path).size; const m=/bytes=(\d+)-(\d*)/.exec(req.headers.range||''); const start=m?+m[1]:0,end=m&&m[2]?+m[2]:size-1;res.writeHead(m?206:200,{'Content-Type':'video/mp4','Accept-Ranges':'bytes','Content-Length':end-start+1,...(m?{'Content-Range':"bytes "+start+'-'+end+'/'+size}:{})});fs.createReadStream(path,{start,end}).pipe(res);}else {res.end('<body style="margin:0;background:#111"><video style="width:960px;height:540px" src="/video" muted></video></body>');}}).listen(4198,'127.0.0.1');
 const browser=await chromium.launch({channel:'msedge',headless:true}); const page=await browser.newPage({viewport:{width:960,height:540}}); await page.goto('http://127.0.0.1:4198'); await page.waitForFunction(()=>document.querySelector('video').readyState>=2); console.log(await page.locator('video').evaluate(v=>({duration:v.duration,width:v.videoWidth,height:v.videoHeight})));
 const duration=await page.locator('video').evaluate(v=>v.duration);
 for(let i=0;i<12;i++){let t=Math.min(duration-0.05,i*duration/12); await page.locator('video').evaluate((v,t)=>new Promise(r=>{v.onseeked=r;v.currentTime=t||0.001}),t);await page.waitForTimeout(120);await page.screenshot({path:`artifacts/ref-${i}.png`});}
 await browser.close();server.close();
})();


