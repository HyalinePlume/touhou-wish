const MIN_CONTRAST = 3;
export const DEFAULT_COLORS={titleColor:'#ffffff',toolsColor:'#f3e5cb',drawColor:'#d4b87a'};
export const validColor=v=>typeof v==='string'&&/^#[0-9a-f]{6}$/i.test(v);
const clamp=x=>Math.max(0,Math.min(1,x));
const lin=x=>x<=.04045?x/12.92:((x+.055)/1.055)**2.4;
const rgb=h=>[1,3,5].map(i=>lin(parseInt(h.slice(i,i+2),16)/255));
export function contrast(a,b){const lum=h=>rgb(h).reduce((v,x,i)=>v+x*[.2126,.7152,.0722][i],0);const x=lum(a),y=lum(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05);}
function lab(hex){
 const [r,g,b]=rgb(hex),l=Math.cbrt(.4122214708*r+.5363325363*g+.0514459929*b),m=Math.cbrt(.2119034982*r+.6806995451*g+.1073969566*b),s=Math.cbrt(.0883024619*r+.2817188376*g+.6299787005*b);
 return [.2104542553*l+.793617785*m-.0040720468*s,1.9779984951*l-2.428592205*m+.4505937099*s,.0259040371*l+.7827717662*m-.808675766*s];
}
function tone(hex,delta=0,maxChroma=1,lightness,targetChroma,targetHue){
 const [originalL,originalA,originalB]=lab(hex);
 const L=clamp(lightness ?? (originalL+delta));
 let a=originalA,c=originalB;
 // Keep near-neutral themes neutral rather than amplifying an unstable hue.
 const originalChroma=Math.hypot(a,c);
 if(targetChroma!==undefined && originalChroma>=.008){a*=targetChroma/originalChroma;c*=targetChroma/originalChroma;}
 if(targetHue!==undefined){const C=targetChroma ?? originalChroma;a=C*Math.cos(targetHue);c=C*Math.sin(targetHue);}
 const scale=Math.min(1,maxChroma/(Math.hypot(a,c)||1));a*=scale;c*=scale;
 let out;
 for(let i=0;i<120;i++) {const x=(L+.3963377774*a+.2158037573*c)**3,y=(L-.1055613458*a-.0638541728*c)**3,z=(L-.0894841775*a-1.291485548*c)**3;out=[4.0767416621*x-3.3077115913*y+.2309699292*z,-1.2684380046*x+2.6097574011*y-.3413193965*z,-.0041960863*x-.7034186147*y+1.707614701*z];if(out.every(v=>v>=-.000001&&v<=1.000001))break;a*=.9;c*=.9;}
 return '#'+out.map(v=>{v=clamp(v);return Math.round(clamp(v<=.0031308?12.92*v:1.055*v**(1/2.4)-.055)*255).toString(16).padStart(2,'0');}).join('');
}
// Prefer desired lightness and retained theme chroma over excess contrast.
function foreground(colors,theme,chromaBoost=1){
 const score=color=>Math.min(...colors.map(bg=>contrast(color,bg)));
 const chroma=color=>{const [,a,b]=lab(color);return Math.hypot(a,b);};
 const sourceChroma=chroma(theme);
 const target=sourceChroma<.008?sourceChroma:Math.min(.10*chromaBoost,Math.max(.055*chromaBoost,sourceChroma*.8*chromaBoost));
 let best;
 for(let i=0;i<=56;i++){
   const candidates=[tone(theme,0,1,Math.max(.10,.38-i*.005),target),tone(theme,0,1,Math.min(.995,.85+i*.005),target)];
   const passing=candidates.filter(color=>score(color)>=MIN_CONTRAST);
   if(passing.length) return passing.sort((a,b)=>chroma(b)-chroma(a))[0];
   for(const candidate of candidates)if(!best || score(candidate)>score(best))best=candidate;
 }
 return best;
}
const darkText=color=>rgb(color).reduce((sum,x)=>sum+x,0)<1.5;
export function palette(values={}){
 const c=Object.fromEntries(Object.entries(DEFAULT_COLORS).map(([k,v])=>[k,validColor(values[k])?values[k]:v]));
 const title=c.titleColor,tools=c.toolsColor,ink=foreground([tools],tools,1.5);
 let hover=tone(tools,darkText(ink)?.06:-.06);if(contrast(hover,ink)<MIN_CONTRAST)hover=tools;
 let start,end,text;
 for(let n=12;n>=0;n--){const span=n*.005;start=tone(c.drawColor,-span);end=tone(c.drawColor,span);const samples=Array.from({length:17},(_,i)=>tone(c.drawColor,span*(i/8-1)));text=foreground(samples,c.drawColor);if(samples.every(x=>contrast(x,text)>=MIN_CONTRAST))break;}
 // Shift lightness toward the middle, preserving the theme hue and chroma.
 const toolBorder=tone(tools,darkText(ink)?-.12:.12);
 const drawBorder=tone(c.drawColor,darkText(text)?-.12:.12);
 return {title,tools,ink,hover,start,end,text,toolBorder,drawBorder,toolShadow:tone(tools,-.55,.04),drawShadow:tone(c.drawColor,-.55,.04)};
}
export const colorStyle=values=>Object.entries(palette(values)).map(([k,v])=>'--home-'+k+':'+v).join(';');

/** Suggest a base color from small background samples; each region has equal weight. */
export function suggestColor(groups,key) {
 const pixels=groups.flat();
 if(!pixels.length) throw new Error('没有可分析的背景区域。');
 const mean=[0,1,2].map(i=>pixels.reduce((sum,p)=>sum+rgb(p)[i],0)/pixels.length);
 const encode=v=>Math.round(255*clamp(v<=.0031308?12.92*v:1.055*v**(1/2.4)-.055));
 const hex=channels=>'#'+channels.map(v=>v.toString(16).padStart(2,'0')).join('');
 const average=hex(mean.map(encode));
 const [backgroundL,backgroundA,backgroundB]=lab(average);
 const backgroundChroma=Math.hypot(backgroundA,backgroundB);
 // Neutral backgrounds have no reliable hue: use a calm blue as the reference.
 const backgroundHue=backgroundChroma<.008?250*Math.PI/180:Math.atan2(backgroundB,backgroundA);
 if(key==='titleColor'){
   const score=color=>contrast(color,average);
   // Give light text a real chance before switching to a dark palette.
   for(const L of [.88,.92,.96,.98]){
     const light=tone(average,0,.012,L);
     if(score(light)>=MIN_CONTRAST)return light;
   }
   // Stay near the background hue; adjust lightness instead of jumping to vivid hues.
   let best;
   for(let L=Math.max(.20,backgroundL-.15);L>=.195;L-=.025){
     const candidates=[-15,15].map(offset=>tone(average,0,1,L,.07,backgroundHue+offset*Math.PI/180))
       .sort((a,b)=>score(b)-score(a));
     best=candidates[0];
     if(score(best)>=MIN_CONTRAST)return best;
   }
   return best;
 }
 const lightnesses=[...new Set([backgroundL-.20,backgroundL+.20].map(L=>Math.max(.35,Math.min(.80,L))))];
 const candidates=[-30,30].flatMap(offset=>lightnesses.map(L=>tone(average,0,1,L,.10,backgroundHue+offset*Math.PI/180)));

 let best=candidates[0],bestScore=-Infinity;
 for(const candidate of candidates){
   const p=palette({[key]:candidate});
   const surfaces=key==='toolsColor'?[p.tools]:[p.start,p.end];
   const contrastScore=Math.min(...groups.map(group=>{
     const ratios=group.map(bg=>Math.min(...surfaces.map(fg=>contrast(bg,fg)))).sort((a,b)=>a-b);
     return ratios[Math.floor((ratios.length-1)*.1)];
   }));
   const [,a,b]=lab(candidate);
   const hueGap=Math.acos(Math.cos(Math.atan2(b,a)-backgroundHue))/Math.PI;
   // Prefer nearby hues; background contrast breaks close choices.
   const score=(1-hueGap)+Math.min(contrastScore,3)*.10;
   if(score>bestScore){best=candidate;bestScore=score;}
 }
 return best;
}
