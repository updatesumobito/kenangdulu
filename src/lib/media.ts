import {guestSettings} from './guest-settings';
import {hasCoupleAccess} from './couple-access';
import { database,one,rows,json,DB } from './db';
import {fail,isPhoto} from './domain';
import {uid,guestSession,currentUser,eventAccess,hash} from './auth';
import * as storage from './storage';
import sharp from 'sharp';
import ffprobe from '@ffprobe-installer/ffprobe';
import ffmpeg from 'ffmpeg-static';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {mkdtemp,writeFile,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
const run=promisify(execFile);
export async function eventBudget(e:any,tx:DB){
 const intents=await rows("SELECT kind,max_bytes FROM intents WHERE event_id=$1 AND (state='finalized' OR (state IN ('reserved','uploaded') AND expires_at>now()))",[e.id],tx);
 const physical=await one("SELECT count(*)::int AS count,coalesce(sum(bytes),0)::bigint AS bytes FROM media WHERE event_id=$1 AND source='physical_booth'",[e.id],tx);
 const assets=await one('SELECT coalesce(sum(bytes),0)::bigint AS bytes FROM (SELECT bytes FROM frame_assets WHERE event_id=$1 UNION ALL SELECT bytes FROM event_assets WHERE event_id=$1) assets',[e.id],tx);
 return {photos:intents.filter(i=>isPhoto(i.kind)).length+physical.count,bytes:intents.reduce((n,i)=>n+Number(i.max_bytes),0)+Number(physical.bytes)+Number(assets.bytes)};
}
export async function physicalImport(e:any,file:Buffer){
 await inspect(file,'physical_booth',0);const id=uid(),key=e.id+'/'+id,reserved=Math.max(file.length*2,262144);
 try{await (await database()).transaction(async tx=>{
  const current=await one('SELECT * FROM events WHERE id=$1 FOR UPDATE',[e.id],tx),budget=await eventBudget(current,tx);if(budget.photos>=current.snapshot.photos||budget.bytes+reserved>current.snapshot.storage)fail('EVENT_QUOTA_EXCEEDED','Kuota acara telah habis.',409);
  await storage.put(key,file,'image/jpeg');await tx.query("INSERT INTO media(id,event_id,kind,source,object_key,mime,bytes,author) VALUES($1,$2,'physical_booth','physical_booth',$3,'image/jpeg',$4,'Komukuna Booth')",[id,e.id,key,reserved]);await tx.query("INSERT INTO jobs(id,event_id,kind,payload) VALUES($1,$2,'media.process',$3)",[uid(),e.id,json({mediaId:id})]);
 });}catch(err){await storage.remove(key);throw err;}return {id};
}
export async function limitedBody(req:Request,max:number){const reader=req.body?.getReader();if(!reader)return Buffer.alloc(0);const chunks:Uint8Array[]=[];let size=0;while(true){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>max){await reader.cancel();fail('FILE_TOO_LARGE','Ukuran berkas melewati batas.',413)}chunks.push(value)}return Buffer.concat(chunks);}
export async function checkLive(e:any){if(e.status!=='live'&&!(e.status==='scheduled'&&new Date(e.start_at)<=new Date()))fail('EVENT_NOT_LIVE','Acara belum aktif atau sudah ditutup.',409);if(Date.now()>+new Date(e.end_at)+e.snapshot.submitDays*86400000)fail('EVENT_CLOSED','Masa pengiriman acara telah berakhir.',409);}
export async function reserve(input:any){
 const s=await guestSession(input.eventId);const size=Number(input.sizeBytes);if(!Number.isInteger(size)||size<1||size>30*1024**2)fail('FILE_TOO_LARGE','Berkas harus antara 1 byte dan 30 MB.',413);
 if(!/^[a-zA-Z0-9_-]{8,100}$/.test(input.idempotencyKey||''))fail('INVALID_KEY','Kunci unggah tidak valid.');
 return (await database()).transaction(async tx=>{
  const e=await one('SELECT * FROM events WHERE id=$1 FOR UPDATE',[s.event_id],tx);await checkLive(e);
  await tx.query("UPDATE intents SET state='expired' WHERE event_id=$1 AND state IN ('reserved','uploaded') AND expires_at<now()",[e.id]);
  const old=await one('SELECT * FROM intents WHERE event_id=$1 AND guest_id=$2 AND client_key=$3',[e.id,s.guest_id,input.idempotencyKey],tx);if(old){if(['expired','purged','failed'].includes(old.state))fail('UPLOAD_INTENT_EXPIRED','Unggahan kedaluwarsa. Pilih ulang untuk mencoba lagi.',409);return old;}
  const kind=input.kind,p=e.snapshot,settings=guestSettings(e.slug,s.snapshot.settings);
  if(!['disposable_photo','photo_strip','voice','video_wish','gif'].includes(kind))fail('INVALID_KIND','Mode tidak valid.');
  if((kind==='photo_strip'&&!p.frames)||(kind==='gif'&&!p.creative))fail('PLAN_FEATURE_UNAVAILABLE','Mode ini tidak tersedia pada paket acara.',403);
  if(!settings.modes.includes(kind))fail('MODE_DISABLED','Mode tidak diaktifkan.',403);
  const mime=String(input.mimeType||'');const valid=isPhoto(kind)?(kind==='gif'?['image/gif']:['image/jpeg','image/png','image/webp']):kind==='voice'?['audio/webm','audio/ogg','audio/mp4','audio/mpeg']:['video/webm','video/mp4','video/quicktime'];
  if(!valid.includes(mime.split(';')[0]))fail('UNSUPPORTED_MEDIA','Format media tidak didukung.',415);
  if(size>(isPhoto(kind)?12:kind==='voice'?8:30)*1024**2)fail('FILE_TOO_LARGE','Berkas terlalu besar.',413);
  const usage=await rows("SELECT kind,guest_id,max_bytes FROM intents WHERE event_id=$1 AND (state='finalized' OR (state IN ('reserved','uploaded') AND expires_at>now()))",[e.id],tx);
  const physical=await one("SELECT count(*)::int AS count,coalesce(sum(bytes),0)::bigint AS bytes FROM media WHERE event_id=$1 AND source='physical_booth'",[e.id],tx);
  const frameBytes=await one('SELECT coalesce(sum(bytes),0)::bigint AS bytes FROM (SELECT bytes FROM frame_assets WHERE event_id=$1 UNION ALL SELECT bytes FROM event_assets WHERE event_id=$1) assets',[e.id],tx);
  const photos=usage.filter(v=>isPhoto(v.kind));
  if(isPhoto(kind)&&photos.length+physical.count>=p.photos)fail('EVENT_QUOTA_EXCEEDED','Kuota foto acara telah habis.',409);
  if(kind==='disposable_photo'&&usage.filter(v=>v.guest_id===s.guest_id&&v.kind==='disposable_photo').length>=Math.min(p.perGuest,settings.perGuest))fail('GUEST_LIMIT_EXCEEDED','Jatah foto Anda sudah habis.',409);
  if(kind==='voice'&&usage.filter(v=>v.kind==='voice').length>=p.voice||kind==='video_wish'&&usage.filter(v=>v.kind==='video_wish').length>=p.video)fail('EVENT_QUOTA_EXCEEDED','Kuota rekaman acara telah habis.',409);
  const reservedBytes=Math.max(size*2,isPhoto(kind)?256*1024:kind==='voice'?settings.voiceSec*16000+65536:settings.videoSec*160000+262144);
  if(usage.reduce((n,v)=>n+Number(v.max_bytes),0)+Number(physical.bytes)+Number(frameBytes.bytes)+reservedBytes>p.storage)fail('STORAGE_QUOTA_EXCEEDED','Penyimpanan acara penuh.',409);
  const intent={id:uid(),event_id:e.id,guest_id:s.guest_id,kind,state:'reserved',max_bytes:reservedBytes,mime,object_key:e.id+'/'+uid(),snapshot:s.snapshot,consent:input.consentPublic===true,privacy:input.consentPublic===true?'public':'private_owner'};
  await tx.query("INSERT INTO intents(id,event_id,guest_id,client_key,kind,max_bytes,mime,object_key,snapshot,consent,privacy,expires_at,expected_bytes) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,now()+interval '15 minutes',$12)",[intent.id,e.id,s.guest_id,input.idempotencyKey,kind,intent.max_bytes,mime,intent.object_key,json(s.snapshot),intent.consent,intent.privacy,size]);return intent;
 });
}
export async function inspect(body:Buffer,kind:string,maxSec:number){
 if(isPhoto(kind)){
  const m=await sharp(body,{limitInputPixels:32_000_000,animated:kind==='gif'}).metadata().catch(()=>fail('INVALID_MEDIA','Berkas bukan gambar yang valid.',415));
  if(!['jpeg','png','webp','gif'].includes(m.format||'')||(kind==='gif'&&m.format!=='gif'))fail('INVALID_MEDIA','Format gambar tidak cocok.',415);
  if(kind==='gif'&&(m.pages||1)>60)fail('INVALID_MEDIA','Animasi terlalu panjang.',415);return {duration:0,mime:kind==='gif'?'image/gif':'image/jpeg'};
 }
 const dir=await mkdtemp(path.join(tmpdir(),'kv-probe-'));try{
  const file=path.join(dir,'input');await writeFile(file,body);
  const r=await run(ffprobe.path,['-v','error','-show_format','-show_streams','-of','json',file],{timeout:20000,maxBuffer:2*1024**2});
  const info=JSON.parse(r.stdout),streams=info.streams||[];let duration=Number(info.format.duration);
  // MediaRecorder WebM commonly omits container duration. Inspect bounded
  // packet timestamps instead of trusting a browser-supplied duration.
  if(!Number.isFinite(duration)||duration<=0){
   const packetResult=await run(ffprobe.path,['-v','error','-read_intervals',`%+${maxSec+1}`,'-show_packets','-show_entries','packet=pts_time,duration_time','-of','json',file],{timeout:20000,maxBuffer:4*1024**2});
   const packets=(JSON.parse(packetResult.stdout).packets||[]).map((p:any)=>({start:Number(p.pts_time),duration:Number(p.duration_time)||0})).filter((p:any)=>Number.isFinite(p.start));
   if(packets.length)duration=Math.max(...packets.map((p:any)=>p.start+p.duration))-Math.min(...packets.map((p:any)=>p.start));
  }
  if(!Number.isFinite(duration)||duration<=0||duration>maxSec+.12)fail('DURATION_EXCEEDED',`Rekaman maksimal ${maxSec} detik.`,422);
  if(kind==='voice'&&!streams.some((v:any)=>v.codec_type==='audio')||kind==='video_wish'&&!streams.some((v:any)=>v.codec_type==='video'))fail('INVALID_MEDIA','Jenis rekaman tidak cocok.',415);
  if(streams.some((v:any)=>v.width>3840||v.height>3840))fail('INVALID_MEDIA','Resolusi rekaman terlalu besar.',415);
  return {duration,mime:kind==='voice'?'audio/mp4':'video/mp4'};
 }catch(e:any){if(e.code&&e.status)throw e;console.error('Media probe failure',e.code,e.message?.slice(0,400));return fail('INVALID_MEDIA','Rekaman tidak dapat diproses. Pilih berkas lain.',415)}finally{await rm(dir,{recursive:true,force:true})}
}
export async function finalize(intentId:string){
 const s=await guestSession();const i=await one('SELECT * FROM intents WHERE id=$1 AND guest_id=$2',[intentId,s.guest_id]);if(!i)fail('NOT_FOUND','Unggahan tidak ditemukan.',404);
 if(i.state==='finalized')return await one('SELECT * FROM media WHERE intent_id=$1',[i.id]);
 if(i.state!=='uploaded'||new Date(i.expires_at)<new Date())fail('UPLOAD_INTENT_EXPIRED','Unggah berkas terlebih dahulu atau mulai ulang.',409);
 const body=await storage.get(i.object_key);if(body.length>Number(i.max_bytes))fail('FILE_TOO_LARGE','Berkas terlalu besar.',413);
 let info;try{info=await inspect(body,i.kind,i.kind==='voice'?i.snapshot.settings.voiceSec:i.snapshot.settings.videoSec)}catch(e){await rows("UPDATE intents SET state='failed' WHERE id=$1 AND state<>'finalized'",[i.id]);await storage.remove(i.object_key);throw e;}
 return (await database()).transaction(async tx=>{
  await tx.query('SELECT id FROM events WHERE id=$1 FOR UPDATE',[i.event_id]);const existing=await one('SELECT * FROM media WHERE intent_id=$1',[i.id],tx);if(existing)return existing;
  const fresh=await one('SELECT state,expires_at FROM intents WHERE id=$1',[i.id],tx);if(fresh.state!=='uploaded'||new Date(fresh.expires_at)<new Date())fail('UPLOAD_INTENT_EXPIRED','Unggahan telah kedaluwarsa.',409);
  const id=uid();await tx.query("INSERT INTO media(id,intent_id,event_id,guest_id,kind,object_key,mime,bytes,duration,author,consent,privacy,snapshot) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)",[id,i.id,i.event_id,i.guest_id,i.kind,i.object_key,info.mime,body.length,info.duration,s.name,i.consent,i.privacy,json(i.snapshot)]);
  await tx.query("UPDATE intents SET state='finalized' WHERE id=$1",[i.id]);await tx.query("INSERT INTO jobs(id,event_id,kind,payload) VALUES($1,$2,'media.process',$3)",[uid(),i.event_id,json({mediaId:id})]);
  return await one('SELECT * FROM media WHERE id=$1',[id],tx);
 });
}
export async function mediaAccess(m:any,req?:Request,display=false){
 if(!m||m.moderation==='deleted'||m.moderation==='hidden'||m.processing!=='ready')fail('MEDIA_UNAVAILABLE','Media belum tersedia.',404);
 const e=await one('SELECT * FROM events WHERE id=$1',[m.event_id]);const u=await currentUser();
 if(await hasCoupleAccess(e.id)){if(Date.now()>+new Date(e.end_at)+e.snapshot.exportDays*86400000)fail('RETENTION_EXPIRED','Masa album pengantin telah berakhir.',410);return;}
 if(u){try{await eventAccess(u,e);if(Date.now()>+new Date(e.end_at)+e.snapshot.exportDays*86400000)fail('RETENTION_EXPIRED','Masa unduh telah berakhir.',410);return;}catch(err:any){if(err.code!=='FORBIDDEN')throw err}}
 if(display&&req){const d=await one('SELECT * FROM display_tokens WHERE token_hash=$1 AND event_id=$2 AND expires_at>now() AND NOT revoked',[hash(new URL(req.url).searchParams.get('display')||''),e.id]);if(!d)fail('FORBIDDEN','Token layar tidak valid.',403);}
 if(!e.published?.settings.gallery&&!display)fail('FORBIDDEN','Galeri privat.',403);
 if(e.reveal_at&&new Date(e.reveal_at)>new Date())fail('REVEAL_NOT_STARTED','Album belum dibuka.',403);
 if(Date.now()>+new Date(e.end_at)+e.snapshot.galleryDays*86400000)fail('RETENTION_EXPIRED','Masa galeri telah berakhir.',410);
 if(m.moderation!=='approved'||!m.consent||m.privacy!=='public')fail('MEDIA_NOT_APPROVED','Media ini tidak ditampilkan untuk publik.',403);
}
export async function processMedia(m:any){
 const body=await storage.get(m.object_key);let output:Buffer,mime=m.mime;
 if(isPhoto(m.kind)){
  output=m.kind==='gif'?await sharp(body,{animated:true}).resize({width:1000,height:1500,fit:'inside',withoutEnlargement:true}).gif().toBuffer():await sharp(body).rotate().resize({width:2400,height:2400,fit:'inside',withoutEnlargement:true}).jpeg({quality:87}).toBuffer();
 }else{
  const dir=await mkdtemp(path.join(tmpdir(),'kv-transcode-'));try{const input=path.join(dir,'input'),out=path.join(dir,'output.mp4');await writeFile(input,body);
   await run(ffmpeg!,['-y','-i',input,'-map_metadata','-1',...(m.kind==='voice'?['-vn','-c:a','aac','-b:a','96k']:['-vf',"scale='min(1280,iw)':'min(720,ih)':force_original_aspect_ratio=decrease:force_divisible_by=2",'-c:v','libx264','-preset','veryfast','-b:v','900k','-maxrate','1200k','-bufsize','2400k','-c:a','aac','-b:a','96k']),'-movflags','+faststart',out],{timeout:90000,maxBuffer:2*1024**2});output=await readFile(out);
  }finally{await rm(dir,{recursive:true,force:true})}
 }
 let thumb:Buffer|undefined;if(isPhoto(m.kind))thumb=await sharp(output,{animated:false}).resize(480,480,{fit:'inside',withoutEnlargement:true}).webp({quality:75}).toBuffer();
 const i=await one('SELECT max_bytes FROM intents WHERE id=$1',[m.intent_id]);const total=output.length+(thumb?.length||0);if(i&&total>Number(i.max_bytes))fail('PROCESSED_TOO_LARGE','Hasil proses melewati reservasi penyimpanan.');
 const key=m.object_key+'-ready';await storage.put(key,output,mime);if(thumb)await storage.put(key+'-thumb',thumb,'image/webp');
 await rows("UPDATE media SET object_key=$2,thumbnail_key=$3,bytes=$4,processing='ready' WHERE id=$1",[m.id,key,thumb?key+'-thumb':null,total]);if(i)await rows('UPDATE intents SET max_bytes=$2 WHERE id=$1',[m.intent_id,total]);await storage.remove(m.object_key);
}
