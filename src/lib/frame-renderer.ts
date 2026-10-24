import {captureSources,frameDocumentSchema,mmToPx,outputSize,validateFrame,type FrameDocumentV2,type FrameObject} from './frame-document';
import {photoPlacement} from './mokabooth/frame-crop';

export type RenderContext={photos?:string[];filter?:string;layoutType?:string;eventUrl?:string;galleryUrl?:string;previewToken?:string;assetUrl?:(id:string)=>string;samples?:boolean;maxDimension?:number};
const imageCache=new Map<string,Promise<HTMLImageElement>>();
function image(src:string){let pending=imageCache.get(src);if(!pending){pending=new Promise<HTMLImageElement>((resolve,reject)=>{const img=new Image();img.onload=()=>resolve(img);img.onerror=()=>{imageCache.delete(src);reject(Error('Gambar frame gagal dimuat.'));};img.src=src;});if(imageCache.size>=150)imageCache.delete(imageCache.keys().next().value!);imageCache.set(src,pending);}return pending;}
export const assetUrl=(id:string,options:RenderContext)=>options.assetUrl?.(id)||'/api/v1/frame-assets/'+encodeURIComponent(id)+(options.previewToken?'?preview='+encodeURIComponent(options.previewToken):'');
function sample(index:number){const c=document.createElement('canvas');c.width=600;c.height=800;const ctx=c.getContext('2d')!;ctx.fillStyle=['#D7D8D2','#E5E8E2','#D8B8A1'][index%3];ctx.fillRect(0,0,600,800);ctx.fillStyle='#4B5A52';ctx.beginPath();ctx.arc(300,260,90,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.ellipse(300,670,190,250,0,0,Math.PI*2);ctx.fill();ctx.fillStyle='#FCFBF8';ctx.font='36px sans-serif';ctx.textAlign='center';ctx.fillText('Foto '+(index+1),300,720);return c;}
function clip(ctx:CanvasRenderingContext2D,o:Extract<FrameObject,{kind:'slot'}>,w:number,h:number,scale:number){ctx.beginPath();if(o.shape==='circle')ctx.ellipse(w/2,h/2,w/2,h/2,0,0,Math.PI*2);else if(o.shape==='round')ctx.roundRect(0,0,w,h,Math.min(o.radius*scale,w/2,h/2));else ctx.rect(0,0,w,h);ctx.clip();}
/** The same local compositing primitive feeds editor object bitmaps and final output. */
export async function renderObjectBitmap(doc:FrameDocumentV2,o:FrameObject,options:RenderContext={},pixelsPerMm=mmToPx(1,doc.page.dpi)){
 const c=document.createElement('canvas'),w=o.w*pixelsPerMm,h=o.h*pixelsPerMm;c.width=Math.max(1,Math.ceil(w));c.height=Math.max(1,Math.ceil(h));const ctx=c.getContext('2d')!;
 if(o.kind==='slot'){
  const position=captureSources(doc).findIndex(s=>s.sourceIndex===o.sourceIndex),src=options.photos?.[position];
  const img=src?await image(src):options.samples?sample(o.sourceIndex):null;
  if(!img)throw Error('Foto sumber '+(o.sourceIndex+1)+' belum tersedia.');
  clip(ctx,o,w,h,pixelsPerMm);ctx.filter=options.filter||'none';const p=photoPlacement({w:img.width,h:img.height},{w,h},o.crop.fit,{focal_x:o.crop.focalX,focal_y:o.crop.focalY,zoom:o.crop.zoom});ctx.drawImage(img,p.x,p.y,p.w,p.h);
 }else if(o.kind==='image'){
  const img=await image(assetUrl(o.assetId,options));if(o.fit==='stretch')ctx.drawImage(img,0,0,w,h);else{const p=photoPlacement({w:img.width,h:img.height},{w,h},o.fit);ctx.drawImage(img,p.x,p.y,p.w,p.h);}
 }else if(o.kind==='text'){
  const size=o.fontSize*pixelsPerMm,font=`${o.italic?'italic ':''}${o.fontWeight} ${size}px "${o.fontFamily}"`;
  await document.fonts.load(font);await document.fonts.ready;ctx.font=font;ctx.fillStyle=o.color;ctx.textAlign=o.align;ctx.textBaseline=o.baseline;
  const tx=o.align==='center'?w/2:o.align==='right'?w:0,ty=o.baseline==='alphabetic'?size:o.baseline==='middle'?h/2:0;
  if(!o.wrap){ctx.fillText(o.text,tx,ty,w);return c;}
  const lines:string[]=[];for(const paragraph of o.text.split('\n')){let line='';for(const character of Array.from(paragraph)){if(line&&ctx.measureText(line+character).width>w){lines.push(line);line='';}line+=character;}lines.push(line);}
  const x=o.align==='center'?w/2:o.align==='right'?w:0;lines.forEach((line,i)=>ctx.fillText(line,x,ty+i*size*o.lineHeight));
 }else{
  const value=o.context==='static'?o.content:o.context==='gallery'?options.galleryUrl:options.eventUrl;
  if(!value&&!options.samples)throw Error('Konteks QR acara belum tersedia.');
  const QRCode=(await import('qrcode')).default;
  const qr=document.createElement('canvas');await QRCode.toCanvas(qr,value||'https://example.invalid/preview',{width:Math.max(64,Math.round(w)),margin:o.quietZone,errorCorrectionLevel:'M'});ctx.imageSmoothingEnabled=false;ctx.drawImage(qr,0,0,w,h);
 }
 return c;
}
export async function renderFrameDocument(input:FrameDocumentV2,options:RenderContext={}){
 const doc=frameDocumentSchema.parse(input),issues=validateFrame(doc);if(issues.length)throw Error(issues.map(i=>i.message).join(' '));
 const size=outputSize(doc),ratio=options.maxDimension?Math.min(1,options.maxDimension/Math.max(size.width,size.height)):1,c=document.createElement('canvas');c.width=Math.max(1,Math.round(size.width*ratio));c.height=Math.max(1,Math.round(size.height*ratio));const ctx=c.getContext('2d')!,sx=c.width/doc.page.width,sy=c.height/doc.page.height;ctx.fillStyle=doc.page.background;ctx.fillRect(0,0,c.width,c.height);
 for(const o of doc.objects){if(!o.visible||o.layoutTypes.length&&!o.layoutTypes.includes(options.layoutType||doc.layoutTypes[0]))continue;
  const bitmap=await renderObjectBitmap(doc,o,options,sx);ctx.save();ctx.translate((o.x+o.w/2)*sx,(o.y+o.h/2)*sy);ctx.rotate(o.rotation*Math.PI/180);ctx.globalAlpha=o.opacity;ctx.drawImage(bitmap,-o.w*sx/2,-o.h*sy/2,o.w*sx,o.h*sy);ctx.restore();
 }
 return c;
}
