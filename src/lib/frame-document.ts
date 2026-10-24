import {z} from 'zod';

export const FRAME_LIMITS={captures:18,slots:20,objects:100,pixels:36_000_000,history:100} as const;
export const PRINT_SIZES={ '4x6':[101.6,152.4],'2x6':[50.8,152.4],'5x7':[127,177.8],'6x8':[152.4,203.2],'4R':[102,152],'5R':[127,178],A5:[148,210],F4:[210,330],A4:[210,297],A3:[297,420],'100x150':[100,150],'80mm':[80,200],'80x180':[80,180],'80x50':[50,80],strip2x6:[51,152] } as const;
export const LAYOUT_TYPES=['strip2r','kolase4r','newspaper','receipt','photozine','magazine','thermal','flipbook','custom'] as const;
const color=z.string().regex(/^#[\da-f]{6}([\da-f]{2})?$/i);
const positive=z.number().finite().positive();
const common={id:z.string().min(1).max(80),name:z.string().max(120),x:z.number().finite(),y:z.number().finite(),w:positive,h:positive,rotation:z.number().finite().default(0),opacity:z.number().min(0).max(1).default(1),visible:z.boolean().default(true),locked:z.boolean().default(false),ratioLock:z.boolean().default(false),aspectRatio:positive.nullable().optional(),layoutTypes:z.array(z.string().max(40)).default([])};
const crop=z.object({fit:z.enum(['cover','contain']).default('cover'),focalX:z.number().min(0).max(1).default(.5),focalY:z.number().min(0).max(1).default(.5),zoom:z.number().min(1).max(20).default(1)});
const slot=z.object({...common,kind:z.literal('slot'),shape:z.enum(['rect','round','circle','transparent']),radius:z.number().min(0).default(3),sourceIndex:z.number().int().min(0).max(17),captureOrder:z.number().int().min(1).max(100),guide:z.enum(['wajib','opsional','orang_ke_n']).default('opsional'),crop});
const image=z.object({...common,kind:z.literal('image'),assetId:z.string().min(1).max(120),fit:z.enum(['cover','contain','stretch']).default('contain'),texture:z.boolean().default(false)});
const text=z.object({...common,kind:z.literal('text'),text:z.string().max(5000),fontFamily:z.enum(['Georgia','Arial','sans-serif','serif','monospace','Plus Jakarta Sans Variable','Playfair Display Variable','Manrope','Fraunces']).default('Georgia'),fontSize:positive,fontWeight:z.number().int().min(100).max(900).default(400),italic:z.boolean().default(false),align:z.enum(['left','center','right']).default('center'),lineHeight:z.number().min(.5).max(4).default(1.2),baseline:z.enum(['top','middle','alphabetic']).default('top'),wrap:z.boolean().default(true),color});
const qr=z.object({...common,kind:z.literal('qr'),content:z.string().max(2000),context:z.enum(['static','event','gallery']).default('event'),slot:z.boolean().default(false),quietZone:z.number().int().min(4).max(16).default(4)});
export const frameObjectSchema=z.discriminatedUnion('kind',[slot,image,text,qr]);
export const frameDocumentSchema=z.object({schemaVersion:z.literal(2),page:z.object({unit:z.literal('mm'),width:positive.max(2000),height:positive.max(2000),dpi:z.number().int().min(72).max(1200),preset:z.string().max(40),background:color}),layoutTypes:z.array(z.string().max(40)).min(1).max(30),objects:z.array(frameObjectSchema).max(FRAME_LIMITS.objects),assets:z.array(z.object({id:z.string().min(1).max(120),name:z.string().max(255),mime:z.enum(['image/png','image/jpeg','image/webp']),bytes:z.number().int().min(0).optional()})).max(100),gif:z.object({overlayAssetId:z.string().min(1).max(120),intervalMs:z.number().int().min(40).max(2000).default(130)}).nullable().default(null),metadata:z.record(z.string(),z.unknown()).default({})});
export type FrameDocumentV2=z.infer<typeof frameDocumentSchema>;
export type FrameObject=z.infer<typeof frameObjectSchema>;
export type FrameSlot=Extract<FrameObject,{kind:'slot'}>;
export const mmToPx=(mm:number,dpi:number)=>mm*dpi/25.4;
export const pxToMm=(px:number,dpi:number)=>px*25.4/dpi;
export function outputSize(doc:FrameDocumentV2){return {width:Math.round(mmToPx(doc.page.width,doc.page.dpi)),height:Math.round(mmToPx(doc.page.height,doc.page.dpi))};}
export function captureSources(frame:any){
 if(frame?.schemaVersion!==2)return (frame?.slots||[]).map((_:unknown,index:number)=>({sourceIndex:index,captureOrder:index+1,guide:'opsional'}));
 const sources=new Map<number,{sourceIndex:number;captureOrder:number;guide:string}>();
 for(const o of frame.objects as FrameObject[])if(o.kind==='slot'){
  const old=sources.get(o.sourceIndex);if(!old||o.captureOrder<old.captureOrder)sources.set(o.sourceIndex,{sourceIndex:o.sourceIndex,captureOrder:o.captureOrder,guide:o.guide});
 }
 return [...sources.values()].sort((a,b)=>a.captureOrder-b.captureOrder||a.sourceIndex-b.sourceIndex);
}
export function frameAssetIds(frame:any):string[]{
 return [...new Set<string>(frame?.schemaVersion===2?[...frame.objects.filter((o:any)=>o.kind==='image').map((o:any)=>o.assetId),...(frame.gif?[frame.gif.overlayAssetId]:[])]:[frame?.backgroundImage,...(frame?.overlays||[]).map((o:any)=>o.assetRef)].filter(Boolean))];
}
export type FrameIssue={code:string;message:string;objectId?:string};
export function validateFrame(doc:FrameDocumentV2){
 const issues:FrameIssue[]=[],size=outputSize(doc),slots=doc.objects.filter(o=>o.kind==='slot'||o.kind==='qr'&&o.slot);
 if(size.width<1||size.height<1)issues.push({code:'OUTPUT_TOO_SMALL',message:'Ukuran hasil harus sedikitnya satu piksel pada setiap sisi.'});
 if(size.width*size.height>FRAME_LIMITS.pixels)issues.push({code:'PIXEL_LIMIT',message:'Ukuran hasil maksimal 36 megapiksel. Kurangi ukuran halaman atau DPI.'});
 if(slots.length>20)issues.push({code:'SLOT_LIMIT',message:'Maksimal 20 slot per frame.'});
 if(!captureSources(doc).length)issues.push({code:'SOURCE_REQUIRED',message:'Tambahkan sedikitnya satu sumber foto.'});
 const ids=new Set<string>();for(const o of doc.objects){
  if(ids.has(o.id))issues.push({code:'DUPLICATE_ID',message:'ID objek harus berbeda.',objectId:o.id});ids.add(o.id);
  if((o.kind==='qr'||o.kind==='slot'&&o.shape==='circle')&&Math.abs(o.w-o.h)>.01)issues.push({code:'SQUARE_REQUIRED',message:'Lingkaran dan QR harus memiliki lebar serta tinggi yang sama.',objectId:o.id});
  if(o.kind==='image'&&!doc.assets.some(a=>a.id===o.assetId))issues.push({code:'MISSING_ASSET',message:'Ganti aset gambar yang belum tersedia.',objectId:o.id});
  if(o.kind==='qr'&&o.context==='static'&&!o.content.trim())issues.push({code:'QR_CONTENT',message:'Isi QR statis masih kosong.',objectId:o.id});
 }
 if(doc.gif&&!doc.assets.some(a=>a.id===doc.gif!.overlayAssetId))issues.push({code:'GIF_ASSET',message:'Overlay GIF belum tersedia.'});
 const unsupported=doc.metadata.unsupportedFeatures as string[]|undefined;
 if(unsupported?.length)issues.push({code:'UNSUPPORTED_IMPORT',message:'Fitur impor perlu dikonversi: '+unsupported.join(', ')});
 return issues;
}
export const FRAME_CAPABILITIES={schemaVersion:2,limits:FRAME_LIMITS,assetLimits:{inputBytes:5*1024**2,outputBytes:8*1024**2,pixels:36_000_000},units:['mm','px'],shapes:['rect','round','circle','transparent','qr'],objects:['slot','text','image','qr'],formats:['json','zip','moka'],presets:PRINT_SIZES,layoutTypes:LAYOUT_TYPES};
const flags=(id:string,name:string)=>({id,name,rotation:0,opacity:1,visible:true,locked:false,ratioLock:false,layoutTypes:[]});
/** Read adapter only: callers decide explicitly when to persist the returned v2 document. */
export function toFrameDocument(frame:any):FrameDocumentV2{
 if(frame?.schemaVersion===2)return frameDocumentSchema.parse(frame);
 if(frame?.layout_json||frame?.size?.mm)return fromMokabooth(frame);
 const dpi=300,width=pxToMm(frame.width,dpi),height=pxToMm(frame.height,dpi),objects:any[]=[],assets:any[]=[];
 const asset=(id:string)=>{if(!assets.some(a=>a.id===id))assets.push({id,name:id,mime:'image/png'});};
 if(frame.backgroundImage){asset(frame.backgroundImage);objects.push({...flags('legacy-background','Latar'),kind:'image',assetId:frame.backgroundImage,fit:'stretch',texture:true,x:0,y:0,w:width,h:height});}
 (frame.slots||[]).forEach((s:any,i:number)=>objects.push({...flags('legacy-slot-'+i,'Slot '+(i+1)),kind:'slot',x:s.x*width,y:s.y*height,w:s.w*width,h:s.h*height,rotation:s.rotation||0,shape:'rect',sourceIndex:i,captureOrder:i+1,guide:'opsional',radius:3,crop:{fit:s.fit||'cover',focalX:s.focalX??.5,focalY:s.focalY??.5,zoom:s.zoom||1}}));
 for(const o of [...(frame.overlays||[])].sort((a,b)=>a.z-b.z)){
  const box={...flags(o.id,'Lapisan '+o.id),x:o.x*width,y:o.y*height,w:o.w*width,h:o.h*height,rotation:o.rotation||0};
  if(o.kind==='image'){asset(o.assetRef);objects.push({...box,kind:'image',assetId:o.assetRef,fit:'stretch',texture:false});}
  else objects.push({...box,kind:'text',text:o.text,fontFamily:'Georgia',fontSize:pxToMm(Math.max(10,o.h*frame.height*.65),dpi),fontWeight:400,italic:false,align:'center',lineHeight:1.2,baseline:'middle',wrap:false,color:o.color});
 }
 if(frame.text)objects.push({...flags('legacy-caption','Teks kenangan'),kind:'text',x:width*.05,y:height*.93-pxToMm(Math.round(frame.width*.045),dpi),w:width*.9,h:height*.06,text:frame.text,fontFamily:'Georgia',fontSize:pxToMm(Math.round(frame.width*.045),dpi),fontWeight:400,italic:false,align:'center',lineHeight:1,baseline:'alphabetic',wrap:false,color:frame.textColor});
 if(frame.sticker)objects.push({...flags('legacy-sticker','Stiker'),kind:'text',x:0,y:height*.98-width*.06,w:width,h:width*.09,text:frame.sticker,fontFamily:'sans-serif',fontSize:width*.06,fontWeight:400,italic:false,align:'center',lineHeight:1,baseline:'alphabetic',wrap:false,color:frame.textColor});
 return frameDocumentSchema.parse({schemaVersion:2,page:{unit:'mm',width,height,dpi,preset:'legacy-px',background:frame.background},objects,assets,gif:null,layoutTypes:['custom'],metadata:{origin:'kenang-dulu-v1',legacy:structuredClone(frame)}});
}
function fromMokabooth(frame:any):FrameDocumentV2{
 const l=frame.layout_json||frame,objects:any[]=[],assets:any[]=[],unsupported:string[]=[],size=l.size;
 const asset=(id:string)=>{if(!assets.some(a=>a.id===id))assets.push({id,name:id,mime:'image/png'});};
 const base=(o:any,id:string,name:string)=>({...flags(o.id||id,o.name||name),x:o.x,y:o.y,w:o.w,h:o.h,rotation:o.rotation??0,opacity:o.opacity??1,locked:o.locked??false,visible:o.visible??true,ratioLock:!!o.aspect_ratio,aspectRatio:o.aspect_ratio??null,_z:o.z??0});
 for(const [i,s] of (l.slots||[]).entries()){
  if(s.shape==='qr')objects.push({...base(s,'moka-slot-'+i,'Slot QR'),kind:'qr',slot:true,content:'',context:'event',quietZone:4});
  else objects.push({...base(s,'moka-slot-'+i,'Slot '+(i+1)),kind:'slot',shape:s.shape||'rect',radius:s.radius??3,sourceIndex:(s.photo_index??i%l.capture_count+1)-1,captureOrder:s.capture_order??i+1,guide:s.guide_role||'opsional',crop:{fit:s.crop||'cover',focalX:s.photo_crop?.focal_x??.5,focalY:s.photo_crop?.focal_y??.5,zoom:s.photo_crop?.zoom??1}});
 }
 for(const [i,t] of (l.texts||[]).entries()){
  const font=['Georgia','Arial','sans-serif','serif','monospace','Plus Jakarta Sans Variable','Playfair Display Variable','Manrope','Fraunces'].includes(t.font)?t.font:'Georgia';
  if(font!==t.font)unsupported.push('font '+t.font);
  objects.push({...base({...t,w:t.w??size.w-t.x,h:t.h??t.size*1.5},'moka-text-'+i,'Teks '+(i+1)),kind:'text',text:t.value,fontFamily:font,fontSize:t.size,fontWeight:t.bold?700:400,italic:t.italic??false,align:t.align||'left',lineHeight:t.line_height??1.2,color:t.color});
 }
 for(const [i,img] of (l.images||[]).entries()){asset(img.asset_id);objects.push({...base(img,'moka-image-'+i,'Gambar '+(i+1)),kind:'image',assetId:img.asset_id,fit:img.fit||'contain',texture:false});}
 if(l.qr?.enabled){const q=l.qr;objects.push({...base({...q,w:q.size,h:q.size},'moka-qr','Kode QR'),kind:'qr',slot:false,content:q.content||'',context:q.content?'static':'event',quietZone:4});}
 for(const [i,t] of (frame.textures||[]).entries()){asset(t.asset_id);const style=l.texture_styles?.find((s:any)=>s.layer===t.layer);objects.push({...flags('moka-texture-'+i,'Tekstur '+(i+1)),kind:'image',assetId:t.asset_id,fit:style?.fit||'stretch',texture:true,x:0,y:0,w:size.w,h:size.h,opacity:t.opacity??1,visible:style?.visible??true,layoutTypes:t.layout_filter?[t.layout_filter]:[],_z:t.layer});}
 if(!(frame.textures?.length)){
  const layers=l.legacy_texture_layers?.length?l.legacy_texture_layers:[{key:'below',layer:-1000,opacity:1,layout_filter:null},{key:'above',layer:1000,opacity:1,layout_filter:null}];
  for(const [i,layer] of layers.entries()){
   const file=l.backgrounds?.[layer.key]??(l.background?.layer===layer.key?l.background.file:'none');if(!file||file==='none')continue;
   const basename=String(file).split('/').at(-1)!.replace(/\.(png|jpe?g|webp)$/i,''),id=/^[\da-f]{8}-[\da-f-]{27}$/i.test(basename)?basename:'legacy-texture-'+layer.key;
   asset(id);objects.push({...flags('legacy-texture-'+i,'Tekstur lama '+layer.key),kind:'image',assetId:id,fit:'stretch',texture:true,x:0,y:0,w:size.w,h:size.h,opacity:layer.opacity??1,layoutTypes:layer.layout_filter?[layer.layout_filter]:[],_z:layer.layer});
  }
 }
 const gif=l.gif_design?{overlayAssetId:l.gif_design.overlay_asset_id,intervalMs:130}:null;if(gif)asset(gif.overlayAssetId);
 return frameDocumentSchema.parse({schemaVersion:2,page:{unit:'mm',width:size.w,height:size.h,dpi:size.dpi||300,preset:size.preset||'custom',background:l.background_color||'#FFFFFF'},objects:objects.sort((a,b)=>(a._z??0)-(b._z??0)),assets,gif,layoutTypes:frame.layout_types?.length?frame.layout_types:['custom'],metadata:{origin:'mokabooth',compatibility:structuredClone(frame),unsupportedFeatures:unsupported}});
}
export function resizePage(doc:FrameDocumentV2,width:number,height:number,scale:boolean):FrameDocumentV2{
 const sx=width/doc.page.width,sy=height/doc.page.height;
 return {...doc,page:{...doc.page,width,height},objects:scale?doc.objects.map(o=>({...o,x:o.x*sx,y:o.y*sy,w:o.w*sx,h:(o.kind==='qr'||o.kind==='slot'&&o.shape==='circle')?o.h*sx:o.h*sy,...(o.kind==='text'?{fontSize:o.fontSize*Math.min(sx,sy)}:{})})):doc.objects};
}
