import {randomUUID} from 'node:crypto';
import sharp from 'sharp';
import {database,one,rows,json,type DB} from './db';
import {fail,isPhoto} from './domain';
import {albumIdentity} from './couple-albums';
import {eventBudget} from './media';
import * as storage from './storage';

async function lockedEvent(tx:DB,eventId:string){
 const event=await one('SELECT * FROM events WHERE id=$1 FOR UPDATE',[eventId],tx);
 if(!event)fail('NOT_FOUND','Acara tidak ditemukan.',404);
 if(event.legal_hold)fail('LEGAL_HOLD','Media dilindungi legal hold. Lepaskan perlindungan sebelum mengubah atau menghapusnya.',409);
 return event;
}
async function record(tx:DB,actorId:string,eventId:string,action:string,detail:unknown){
 await tx.query('INSERT INTO audit(id,actor_id,event_id,action,detail) VALUES($1,$2,$3,$4,$5)',[randomUUID(),actorId,eventId,action,json(detail)]);
}

export async function deleteAdminAlbumMedia(eventId:string,actorId:string,target:{photoId?:string;albumId?:string;all?:boolean;confirmation?:string}){
 return (await database()).transaction(async tx=>{
  const event=await lockedEvent(tx,eventId);
  if(target.all&&target.confirmation!==event.name)fail('CONFIRMATION_REQUIRED','Ketik nama acara dengan tepat untuk menghapus seluruh isi album.',400);
  let where:string,param:string;
  if(target.photoId){where="id=$2 AND kind IN ('disposable_photo','photo_strip','gif','physical_booth')";param=target.photoId;}
  else if(target.albumId){where=albumIdentity+'=$2';param=target.albumId;}
  else if(target.all){where="$2::text='all'";param='all';}
  else return fail('INVALID_ACTION','Pilih foto atau album yang akan dihapus.',400);
  // Retain assets for retention/legal recovery, matching existing moderation deletion.
  const deleted=await rows(`UPDATE media SET moderation='deleted' WHERE event_id=$1 AND moderation<>'deleted' AND (${where}) RETURNING id`,[eventId,param],tx);
  await record(tx,actorId,eventId,target.photoId?'photo.delete':target.all?'album.clear':'album.delete',{...target,confirmation:undefined,count:deleted.length});
  return {deleted:deleted.length};
 });
}

export async function editAdminPhoto(eventId:string,photoId:string,actorId:string,input:{author:string;rotation:number}){
 const original=await one("SELECT * FROM media WHERE id=$1 AND event_id=$2 AND moderation<>'deleted'",[photoId,eventId]);
 if(!original||!isPhoto(original.kind))fail('NOT_FOUND','Foto tidak ditemukan.',404);
 let output:Buffer|undefined,thumb:Buffer|undefined,key:string|undefined,mime=original.mime;
 if(input.rotation){
  if(original.processing!=='ready')fail('MEDIA_NOT_READY','Tunggu sampai foto selesai diproses sebelum memutarnya.',409);
  if(!['image/jpeg','image/png','image/webp'].includes(mime))fail('UNSUPPORTED_MEDIA','Rotasi hanya tersedia untuk foto JPG, PNG, atau WebP.',415);
  const image=sharp(await storage.get(original.object_key),{limitInputPixels:36_000_000}).rotate(input.rotation);
  output=await (mime==='image/png'?image.png():mime==='image/webp'?image.webp({quality:96}):image.jpeg({quality:96})).toBuffer();
  if(output.length>12*1024**2)fail('FILE_TOO_LARGE','Hasil edit melebihi 12 MB.',413);
  thumb=await sharp(output).resize(480,480,{fit:'inside',withoutEnlargement:true}).webp({quality:75}).toBuffer();
  key=eventId+'/'+randomUUID()+'-edited';
 }
 let committed=false;
 try{
  if(key&&output&&thumb){await storage.put(key,output,mime);await storage.put(key+'-thumb',thumb,'image/webp');}
  await (await database()).transaction(async tx=>{
   const event=await lockedEvent(tx,eventId),fresh=await one("SELECT * FROM media WHERE id=$1 AND event_id=$2 AND moderation<>'deleted' FOR UPDATE",[photoId,eventId],tx);
   if(!fresh||!isPhoto(fresh.kind))fail('NOT_FOUND','Foto tidak ditemukan.',404);
   if(key&&fresh.object_key!==original.object_key)fail('PHOTO_CHANGED','Foto berubah saat diedit. Muat ulang lalu coba lagi.',409);
   if(key&&output&&thumb){
    const bytes=output.length+thumb.length,reservation=fresh.intent_id?await one('SELECT max_bytes FROM intents WHERE id=$1',[fresh.intent_id],tx):null,budget=await eventBudget(event,tx);
    if(budget.bytes-Number(reservation?.max_bytes??fresh.bytes)+bytes>event.snapshot.storage)fail('STORAGE_QUOTA_EXCEEDED','Penyimpanan acara tidak cukup untuk hasil edit.',409);
    await tx.query('UPDATE media SET object_key=$3,thumbnail_key=$4,mime=$5,bytes=$6,author=$7 WHERE id=$1 AND event_id=$2',[photoId,eventId,key,key+'-thumb',mime,bytes,input.author]);
    if(fresh.intent_id)await tx.query('UPDATE intents SET max_bytes=$2 WHERE id=$1',[fresh.intent_id,bytes]);
   }else await tx.query('UPDATE media SET author=$3 WHERE id=$1 AND event_id=$2',[photoId,eventId,input.author]);
   await record(tx,actorId,eventId,'photo.edit',{photoId,author:input.author,rotation:input.rotation});
  });
  committed=true;
 }finally{
  if(key&&!committed){await storage.remove(key).catch(()=>{});await storage.remove(key+'-thumb').catch(()=>{});}
 }
 if(key){for(const old of [original.object_key,original.thumbnail_key].filter(Boolean))await storage.remove(old).catch(error=>console.error('Old edited-photo cleanup failed',error));}
 return {saved:true};
}
