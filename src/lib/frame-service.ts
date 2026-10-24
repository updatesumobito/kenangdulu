import {z} from 'zod';
import {database,one,rows,json,type DB} from './db';
import sharp from 'sharp';
import * as storage from './storage';
import {eventBudget} from './media';
import {readFramePackage,remapFrameAssets} from './frame-portability';
import {uid} from './auth';
import {frameSchema,fail,id as uuid} from './domain';
import {FRAME_CAPABILITIES,frameDocumentSchema,frameAssetIds,validateFrame,toFrameDocument} from './frame-document';

export function parseFrame(input:unknown){return (input as any)?.schemaVersion===2?frameDocumentSchema.parse(input):frameSchema.parse(input);}
export function frameResponse(row:any){return {...row,schemaVersion:row.schema.schemaVersion||1,version:row.version||1,capabilities:FRAME_CAPABILITIES,validation:validateFrame(toFrameDocument(row.schema))};}
export async function ensureFrameAssets(schema:any,eventId:string,tx?:DB){for(const id of frameAssetIds(schema)){uuid.parse(id);if(!await one('SELECT 1 FROM frame_assets WHERE id=$1 AND event_id=$2',[id,eventId],tx))fail('INVALID_FRAME_ASSET','Ganti aset yang belum tersedia dalam pustaka acara ini.',403);}}
export async function saveFrame(e:any,u:any,input:any){
 const name=z.string().trim().min(1).max(80).parse(input.name),schema=parseFrame(input.schema),id=input.id?uuid.parse(input.id):uid(),expected=input.expectedVersion===undefined?undefined:z.number().int().min(1).parse(input.expectedVersion);
 const validation=validateFrame(toFrameDocument(schema));
 // Drafts may contain incomplete QR or missing local assets; invalid structural data is never accepted.
 if(validation.some(v=>['PIXEL_LIMIT','SLOT_LIMIT','DUPLICATE_ID','SQUARE_REQUIRED'].includes(v.code)))fail('INVALID_FRAME',validation.map(v=>v.message).join(' '));
 return (await database()).transaction(async tx=>{
  await tx.query('SELECT id FROM events WHERE id=$1 FOR UPDATE',[e.id]);
  const old=await one('SELECT * FROM frames WHERE id=$1 FOR UPDATE',[id],tx);
  if(old&&old.event_id!==e.id)fail('FORBIDDEN','Frame tidak diizinkan.',403);
  if(old&&(expected===undefined||expected!==old.version))fail('FRAME_VERSION_CONFLICT','Frame server telah berubah. Muat versi terbaru atau simpan sebagai salinan.',409);
  if(!old&&(await rows('SELECT id FROM frames WHERE event_id=$1',[e.id],tx)).length>=e.snapshot.frames)fail('FRAME_LIMIT','Jumlah frame melewati paket. Ekspor draft atau ganti salah satu frame setelah meninjaunya.',409);
  await ensureFrameAssets(schema,e.id,tx);
  if(old)await tx.query('INSERT INTO frame_revisions(id,frame_id,event_id,version,name,schema,actor_id) VALUES($1,$2,$3,$4,$5,$6,$7) ON CONFLICT(frame_id,version) DO NOTHING',[uid(),id,e.id,old.version,old.name,json(old.schema),u.id]);
  const version=old?old.version+1:1;
  const saved=await one('INSERT INTO frames(id,event_id,name,schema,version) VALUES($1,$2,$3,$4,$5) ON CONFLICT(id) DO UPDATE SET name=excluded.name,schema=excluded.schema,version=excluded.version,updated_at=now() RETURNING *',[id,e.id,name,json(schema),version],tx);
  await tx.query('INSERT INTO frame_revisions(id,frame_id,event_id,version,name,schema,actor_id) VALUES($1,$2,$3,$4,$5,$6,$7)',[uid(),id,e.id,version,name,json(schema),u.id]);
  await tx.query('DELETE FROM frame_asset_links WHERE frame_id=$1',[id]);
  for(const assetId of frameAssetIds(schema))await tx.query('INSERT INTO frame_asset_links(frame_id,asset_id,event_id) VALUES($1,$2,$3)',[id,assetId,e.id]);
  await tx.query('INSERT INTO audit(id,actor_id,event_id,action,detail) VALUES($1,$2,$3,$4,$5)',[uid(),u.id,e.id,'frame.save',json({id,version,schemaVersion:(schema as any).schemaVersion||1})]);
  return frameResponse(saved);
 });
}
/** Validate everything before storing assets. All DB changes commit together, failed blobs are removed. */
export async function importFrame(e:any,u:any,bytes:Uint8Array,target?:{id?:string;expectedVersion?:number}){
 const parsed=readFramePackage(bytes),mapping:Record<string,string>={},images:{id:string;key:string;body:Buffer}[]=[];
 for(const assetId of frameAssetIds(parsed.document)){
  const filename=Object.keys(parsed.files).find(name=>name.startsWith('assets/'+assetId+'.'));
  if(filename){const body=await sharp(parsed.files[filename],{limitInputPixels:36_000_000}).rotate().png().toBuffer();if(body.length>8*1024**2)fail('FILE_TOO_LARGE','Aset hasil impor maksimal 8 MiB.');const id=uid();mapping[assetId]=id;images.push({id,key:e.id+'/frame-assets/'+id,body});}
  else if(!await one('SELECT id FROM frame_assets WHERE id=$1 AND event_id=$2',[uuid.safeParse(assetId).success?assetId:null,e.id]))fail('MISSING_FRAME_ASSET','Ganti semua aset yang hilang sebelum menerapkan impor.');
 }
 const doc=remapFrameAssets(parsed.document,mapping),validation=validateFrame(doc);if(validation.some(i=>['PIXEL_LIMIT','SLOT_LIMIT','DUPLICATE_ID','SQUARE_REQUIRED'].includes(i.code)))fail('INVALID_FRAME',validation.map(i=>i.message).join(' '));
 const written:string[]=[],cleanupId=images.length?uid():null;
 if(cleanupId)await rows("INSERT INTO jobs(id,event_id,user_id,kind,payload,run_after) VALUES($1,$2,$3,'frame-assets.cleanup',$4,now()+interval '1 hour')",[cleanupId,e.id,u.id,json({keys:images.map(img=>img.key)})]);
 try{for(const img of images){written.push(img.key);await storage.put(img.key,img.body,'image/png');}return await (await database()).transaction(async tx=>{
  const current=await one('SELECT * FROM events WHERE id=$1 FOR UPDATE',[e.id],tx),budget=await eventBudget(current,tx);if(budget.bytes+images.reduce((n,i)=>n+i.body.length,0)>current.snapshot.storage)fail('STORAGE_QUOTA_EXCEEDED','Penyimpanan acara penuh.',409);
  const id=target?.id?uuid.parse(target.id):uid(),old=await one('SELECT * FROM frames WHERE id=$1 FOR UPDATE',[id],tx);
  if(old&&(old.event_id!==e.id||old.version!==target?.expectedVersion))fail('FRAME_VERSION_CONFLICT','Frame server telah berubah; draft impor tetap tersedia.',409);
  if(!old&&(await rows('SELECT id FROM frames WHERE event_id=$1',[e.id],tx)).length>=e.snapshot.frames)fail('FRAME_LIMIT','Jumlah frame mencapai batas paket.',409);
  for(const img of images){await tx.query('INSERT INTO frame_assets(id,event_id,object_key,mime,bytes) VALUES($1,$2,$3,$4,$5)',[img.id,e.id,img.key,'image/png',img.body.length]);}
  const version=old?old.version+1:1;
  if(old)await tx.query('INSERT INTO frame_revisions(id,frame_id,event_id,version,name,schema,actor_id) VALUES($1,$2,$3,$4,$5,$6,$7) ON CONFLICT(frame_id,version) DO NOTHING',[uid(),id,e.id,old.version,old.name,json(old.schema),u.id]);
  const saved=await one('INSERT INTO frames(id,event_id,name,schema,version) VALUES($1,$2,$3,$4,$5) ON CONFLICT(id) DO UPDATE SET name=excluded.name,schema=excluded.schema,version=excluded.version,updated_at=now() RETURNING *',[id,e.id,parsed.name,json(doc),version],tx);
  await tx.query('INSERT INTO frame_revisions(id,frame_id,event_id,version,name,schema,actor_id) VALUES($1,$2,$3,$4,$5,$6,$7)',[uid(),id,e.id,version,parsed.name,json(doc),u.id]);
  await tx.query('DELETE FROM frame_asset_links WHERE frame_id=$1',[id]);for(const assetId of frameAssetIds(doc))await tx.query('INSERT INTO frame_asset_links(frame_id,asset_id,event_id) VALUES($1,$2,$3)',[id,assetId,e.id]);
  await tx.query('INSERT INTO audit(id,actor_id,event_id,action,detail) VALUES($1,$2,$3,$4,$5)',[uid(),u.id,e.id,'frame.import',json({id,version,assets:images.length})]);
  if(cleanupId)await tx.query("UPDATE jobs SET status='done',result=$2 WHERE id=$1",[cleanupId,json({retained:true})]);
  return frameResponse(saved);
 });}catch(error){const cleanup=await Promise.allSettled(written.map(key=>storage.remove(key)));if(cleanupId)await rows("UPDATE jobs SET status=$2,run_after=now(),result=$3 WHERE id=$1",[cleanupId,cleanup.every(r=>r.status==='fulfilled')?'done':'queued',json({cleaned:cleanup.every(r=>r.status==='fulfilled')})]).catch(()=>{});throw error;}
}
