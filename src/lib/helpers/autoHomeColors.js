import { suggestColor } from './homeColors.js';

const selectors={titleColor:'.wish-title, .wish-desc',toolsColor:'.home-tools .round-button',drawColor:'.button .draw-btn'};

/** Sample the draft background at the current home layout, accounting for centered cover. */
export async function autoHomeColor(url,key){
 const surface=document.querySelector('.root > section');
 const regions=[...document.querySelectorAll(selectors[key] || '')].map(node=>node.getBoundingClientRect()).filter(r=>r.width && r.height);
 if(!surface || !regions.length)throw new Error('暂时无法读取主页区域，请关闭窗口后重试。');
 const bounds=surface.getBoundingClientRect();
 const image=new Image();
 image.crossOrigin='anonymous';
 image.src=url;
 try{await image.decode();}catch{throw new Error('背景图无法读取，请检查图片地址；外链图片可下载后通过“选择本地图片”导入。');}
 const scale=Math.max(bounds.width/image.naturalWidth,bounds.height/image.naturalHeight);
 const width=image.naturalWidth*scale,height=image.naturalHeight*scale;
 const left=bounds.left+(bounds.width-width)/2,top=bounds.top+(bounds.height-height)/2;
 const canvas=document.createElement('canvas');canvas.width=24;canvas.height=24;
 const ctx=canvas.getContext('2d',{willReadFrequently:true});
 const groups=[];
 try{
   for(const region of regions){
     const x=Math.max(bounds.left,region.left-4),y=Math.max(bounds.top,region.top-4);
     const w=Math.min(bounds.right,region.right+4)-x,h=Math.min(bounds.bottom,region.bottom+4)-y;
     if(w<=0 || h<=0)continue;
     ctx.setTransform(1,0,0,1,0,0);ctx.fillStyle='#0f0f23';ctx.fillRect(0,0,24,24);
     ctx.setTransform(24/w,0,0,24/h,0,0);ctx.drawImage(image,left-x,top-y,width,height);
     const data=ctx.getImageData(0,0,24,24).data,pixels=[];
     for(let i=0;i<data.length;i+=4)pixels.push('#'+[data[i],data[i+1],data[i+2]].map(v=>v.toString(16).padStart(2,'0')).join(''));
     groups.push(pixels);
   }
 }catch{throw new Error('这张外链背景不允许读取颜色，请下载后通过“选择本地图片”导入。');}
 return suggestColor(groups,key);
}
