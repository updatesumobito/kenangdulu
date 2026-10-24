import {unzipSync,zipSync,strFromU8,strToU8} from 'fflate';
import {toFrameDocument,frameAssetIds,captureSources,type FrameDocumentV2} from './frame-document';
export type FrameImport={name:string;document:FrameDocumentV2;files:Record<string,Uint8Array>;missing:string[];report:string[]};
export function readFramePackage(bytes:Uint8Array):FrameImport{
 if(bytes.length>128*1024**2)throw Error('Paket maksimal 128 MiB.');
 let files:Record<string,Uint8Array>={},raw:any;
 if(bytes[0]===0x50&&bytes[1]===0x4b){
  let total=0,count=0;const names=new Set<string>();files=unzipSync(bytes,{filter:file=>{
   if(++count>102||!(/^(frame|manifest)\.json$/.test(file.name)||/^assets\/[\w-]{1,120}\.(png|jpg|jpeg|webp)$/i.test(file.name)))throw Error('Paket berisi jalur atau berkas yang tidak didukung.');
   if(names.has(file.name))throw Error('Paket berisi nama berkas duplikat.');names.add(file.name);
   total+=file.originalSize;if(file.originalSize>12*1024**2||total>128*1024**2)throw Error('Isi paket melewati batas ukuran.');return true;
  }});if(!files['frame.json'])throw Error('Paket tidak memiliki frame.json.');raw=JSON.parse(strFromU8(files['frame.json']));
 }else{if(bytes.length>12*1024**2)throw Error('JSON maksimal 12 MiB.');raw=JSON.parse(strFromU8(bytes));}
 const candidate=raw.kenangDuluDocument??raw.document??raw.frame??raw;
 const document=toFrameDocument(candidate.layout?{...candidate,layout_json:candidate.layout}:candidate),missing=frameAssetIds(document).filter(id=>!Object.keys(files).some(name=>name.startsWith('assets/'+id+'.')));
 return {name:String(raw.name??candidate.name??'Frame impor').slice(0,80),document,files,missing,report:[document.objects.length+' objek',document.objects.filter(o=>o.kind==='slot').length+' slot',document.assets.length+' aset',...(missing.length?[missing.length+' aset perlu dipetakan ke pustaka acara atau berkas pengganti.']:[]),...((document.metadata.unsupportedFeatures as string[])||[]).map(v=>'Perlu konversi: '+v)]};
}
export function remapFrameAssets(doc:FrameDocumentV2,mapping:Record<string,string>):FrameDocumentV2{
 return {...doc,assets:doc.assets.map(a=>({...a,id:mapping[a.id]||a.id})),objects:doc.objects.map(o=>o.kind==='image'?{...o,assetId:mapping[o.assetId]||o.assetId}:o),gif:doc.gif?{...doc.gif,overlayAssetId:mapping[doc.gif.overlayAssetId]||doc.gif.overlayAssetId}:null,metadata:{...doc.metadata,assetMappings:{...(doc.metadata.assetMappings as object||{}),...mapping}}};
}
export function createFramePackage(name:string,doc:FrameDocumentV2,assets:Record<string,Uint8Array>={}){
 return zipSync({'frame.json':strToU8(JSON.stringify(frameEnvelope(name,doc),null,2)),...assets},{level:0});
}
/** Native-readable envelope plus an exact web document for lossless mm/metadata round-trips. */
export function frameEnvelope(name:string,doc:FrameDocumentV2){
 const original=(doc.metadata.compatibility||{}) as any,l=original.layout_json||original.layout||{},sources=captureSources(doc),textures:any[]=[],texts:any[]=[],images:any[]=[],slots:any[]=[],compatibilityWarnings:string[]=[];let qr:any={x:0,y:0,size:10,content:'',enabled:false};
 const sourceObject=(id:string,kind:'slot'|'text'|'image')=>{const values=l[kind==='slot'?'slots':kind==='text'?'texts':'images']||[];return values.find((v:any,i:number)=>(v.id||'moka-'+kind+'-'+i)===id)||{};};
 for(const [z,o] of doc.objects.entries()){
  const common={...(['slot','text','image'].includes(o.kind)?sourceObject(o.id,o.kind as 'slot'|'text'|'image'):{}),id:o.id,name:o.name,x:o.x,y:o.y,w:o.w,h:o.h,rotation:o.rotation,opacity:o.opacity,visible:o.visible,locked:o.locked,z};
  if(o.kind==='image'&&!o.texture&&o.fit==='stretch')compatibilityWarnings.push('Gambar '+o.name+': Mokabooth memakai contain. Dokumen web mempertahankan stretch.');
  if(o.kind==='qr'&&o.slot&&o.context!=='event')compatibilityWarnings.push('Slot QR '+o.name+': konteks khusus dipertahankan pada dokumen web; periksa dukungan runtime Mokabooth.');
  if(o.kind==='slot')slots.push({...common,shape:o.shape,radius:o.radius,aspect_ratio:o.ratioLock?(o.aspectRatio??o.w/o.h):null,crop:o.crop.fit,photo_index:sources.findIndex(s=>s.sourceIndex===o.sourceIndex)+1,capture_order:o.captureOrder,guide_role:o.guide,photo_crop:{focal_x:o.crop.focalX,focal_y:o.crop.focalY,zoom:o.crop.zoom}});
  if(o.kind==='text')texts.push({...common,value:o.text,font:o.fontFamily,size:o.fontSize,bold:o.fontWeight>=600,italic:o.italic,align:o.align,line_height:o.lineHeight});
  if(o.kind==='image'){if(o.texture)textures.push({asset_id:o.assetId,source:'asset',layer:z,opacity:o.opacity,layout_filter:o.layoutTypes.length===1?o.layoutTypes[0]:null});else images.push({...common,asset_id:o.assetId,fit:o.fit==='stretch'?'contain':o.fit});}
  if(o.kind==='qr'){if(o.slot)slots.push({...common,shape:'qr',crop:'cover',capture_order:null,guide_role:null,web_qr_context:o.context,web_qr_content:o.content});else qr={...common,size:o.w,enabled:o.visible,content:o.content,web_qr_context:o.context};}
 }
 const layout={...l,builder_version:2,size:{...l.size,w:doc.page.width,h:doc.page.height,mm:[doc.page.width,doc.page.height],dpi:doc.page.dpi,preset:doc.page.preset},background_color:doc.page.background,background:{file:'none',layer:'below'},backgrounds:{below:'none',above:'none'},slots,texts,images,qr,capture_count:sources.length,duplicate_slots:slots.filter(s=>s.shape!=='qr').length>sources.length,texture_styles:textures.map(t=>({layer:t.layer,fit:doc.objects[t.layer].kind==='image'?(doc.objects[t.layer] as any).fit:'stretch',visible:doc.objects[t.layer].visible})),gif_design:doc.gif?{version:1,overlay_asset_id:doc.gif.overlayAssetId}:null};
 if(sources.length>8)compatibilityWarnings.push('Dokumen menggunakan lebih dari 8 sumber foto. Versi Mokabooth yang diaudit masih membatasi sebagian kontrol pada 8; web mendukung 18.');
 return {schema_version:2,unit:'mm',name,frame:{...original,name,layout_json:layout,textures,layout_types:doc.layoutTypes},kenangDuluDocument:doc,compatibilityWarnings};
}
