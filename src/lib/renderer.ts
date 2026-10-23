import {photoPlacement} from './mokabooth/frame-crop';
export const filters=[
 {name:'Original',css:'none'}, {name:'Warm Film',css:'sepia(.24) saturate(.85) contrast(1.04)'}, {name:'Mono',css:'grayscale(1) contrast(1.08)'}, {name:'Vintage',css:'sepia(.4) contrast(.9) brightness(1.05)'},
 {name:'Soft',css:'contrast(.88) brightness(1.08)'},{name:'Cool',css:'saturate(.7) hue-rotate(12deg)'},{name:'Golden',css:'sepia(.3) saturate(1.3)'},{name:'Noir',css:'grayscale(1) contrast(1.4)'},{name:'Pastel',css:'saturate(.65) brightness(1.12)'},{name:'Vivid',css:'saturate(1.35) contrast(1.1)'},{name:'Faded',css:'contrast(.78) sepia(.12)'},{name:'Rose',css:'sepia(.18) hue-rotate(320deg) saturate(1.1)'}
];
export async function loadImage(src:string){return await new Promise<HTMLImageElement>((resolve,reject)=>{const i=new Image();i.onload=()=>resolve(i);i.onerror=reject;i.src=src})}
export async function renderStrip(frame:any,photos:string[],filter='none'){
 const canvas=document.createElement('canvas');canvas.width=frame.width;canvas.height=frame.height;const ctx=canvas.getContext('2d')!;ctx.fillStyle=frame.background;ctx.fillRect(0,0,canvas.width,canvas.height);
 if(frame.backgroundImage){const background=await loadImage('/api/v1/frame-assets/'+frame.backgroundImage);ctx.drawImage(background,0,0,canvas.width,canvas.height);}
 for(let n=0;n<frame.slots.length;n++){
  const s=frame.slots[n],img=await loadImage(photos[n]),w=s.w*canvas.width,h=s.h*canvas.height,x=s.x*canvas.width,y=s.y*canvas.height;
  ctx.save();ctx.translate(x+w/2,y+h/2);ctx.rotate(s.rotation*Math.PI/180);ctx.beginPath();ctx.rect(-w/2,-h/2,w,h);ctx.clip();ctx.filter=filter;
  const placement=photoPlacement({w:img.width,h:img.height},{w,h},s.fit,{focal_x:s.focalX??.5,focal_y:s.focalY??.5,zoom:s.zoom||1});
  ctx.drawImage(img,-w/2+placement.x,-h/2+placement.y,placement.w,placement.h);ctx.restore();
 }
 for(const o of [...(frame.overlays||[])].sort((a,b)=>a.z-b.z)){const w=o.w*canvas.width,h=o.h*canvas.height;ctx.save();ctx.translate((o.x+o.w/2)*canvas.width,(o.y+o.h/2)*canvas.height);ctx.rotate(o.rotation*Math.PI/180);if(o.kind==='image'){ctx.drawImage(await loadImage('/api/v1/frame-assets/'+o.assetRef),-w/2,-h/2,w,h)}else{ctx.fillStyle=o.color;ctx.font=`${Math.max(10,h*.65)}px Georgia`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(o.text,0,0,w)}ctx.restore();}
 ctx.fillStyle=frame.textColor;ctx.textAlign='center';ctx.font=`${Math.round(frame.width*.045)}px Georgia`;ctx.fillText(frame.text,canvas.width/2,canvas.height*.93,canvas.width*.9);if(frame.sticker){ctx.font=`${frame.width*.06}px sans-serif`;ctx.fillText(frame.sticker,canvas.width/2,canvas.height*.98)}return canvas;
}
export function canvasBlob(canvas:HTMLCanvasElement,type='image/jpeg'){return new Promise<Blob>((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(Error('Gambar gagal dibuat.')),type,.88))}
