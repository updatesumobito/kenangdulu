import {createHash} from 'node:crypto';
import {createWriteStream} from 'node:fs';
import {mkdir,unlink} from 'node:fs/promises';
import {Readable} from 'node:stream';
import {pipeline} from 'node:stream/promises';
import path from 'node:path';
import {database,one,rows,dataDir} from './db';
import {guestSession} from './auth';
import {fail,id} from './domain';
import {limitedBody} from './media';
import * as storage from './storage';

export async function uploadProgress(intentId:string){
 const session=await guestSession(),intent=await one('SELECT * FROM intents WHERE id=$1 AND guest_id=$2',[id.parse(intentId),session.guest_id]);
 if(!intent)fail('NOT_FOUND','Unggahan tidak ditemukan.',404);
 if(!['reserved','uploaded','finalized'].includes(intent.state)||new Date(intent.expires_at)<new Date())fail('UPLOAD_INTENT_EXPIRED','Unggahan kedaluwarsa.',409);
 const received=await one('SELECT coalesce(sum(bytes),0)::bigint AS bytes FROM upload_parts WHERE intent_id=$1',[intent.id]);
 return {receivedBytes:['uploaded','finalized'].includes(intent.state)?Number(intent.expected_bytes||intent.max_bytes):Number(received.bytes),state:intent.state,chunkBytes:1048576};
}

export async function uploadChunk(intentId:string,req:Request){
 const session=await guestSession(),range=/^bytes (\d+)-(\d+)\/(\d+)$/.exec(req.headers.get('content-range')||'');
 if(!range)fail('INVALID_RANGE','Rentang unggahan tidak valid.',400);
 const [start,end,total]=range.slice(1).map(Number);
 if(![start,end,total].every(Number.isSafeInteger)||total<1||total>30*1024**2||end<start||end>=total||end-start+1>1048576)fail('INVALID_RANGE','Rentang unggahan melewati batas.',400);
 const bytes=await limitedBody(req,1048576);
 if(bytes.length!==end-start+1)fail('INVALID_RANGE','Ukuran potongan tidak cocok.',400);
 const checksum=createHash('sha256').update(bytes).digest('hex');
 return (await database()).transaction(async tx=>{
  const intent=await one('SELECT * FROM intents WHERE id=$1 AND guest_id=$2 FOR UPDATE',[id.parse(intentId),session.guest_id],tx);
  if(!intent)fail('NOT_FOUND','Unggahan tidak ditemukan.',404);
  if(!['reserved','uploaded','finalized'].includes(intent.state)||new Date(intent.expires_at)<new Date())fail('UPLOAD_INTENT_EXPIRED','Unggahan kedaluwarsa.',409);
  if(Number(intent.expected_bytes)!==total||total>Number(intent.max_bytes))fail('INVALID_RANGE','Ukuran berkas tidak cocok dengan reservasi.',409);
  if(intent.state!=='reserved')return {uploaded:true,receivedBytes:total};
  const old=await one('SELECT * FROM upload_parts WHERE intent_id=$1 AND start_byte=$2',[intent.id,start],tx);
  if(old&&(old.checksum!==checksum||old.bytes!==bytes.length))fail('UPLOAD_CONFLICT','Potongan berbeda dari unggahan sebelumnya. Mulai unggahan baru.',409);
  const received=Number((await one('SELECT coalesce(sum(bytes),0)::bigint AS bytes FROM upload_parts WHERE intent_id=$1',[intent.id],tx)).bytes);
  if(!old&&start!==received)fail('UPLOAD_OFFSET_MISMATCH','Lanjutkan dari posisi terakhir yang tersimpan.',409);
  if(!old){const key=intent.object_key+'.parts/'+start;await storage.put(key,bytes,'application/octet-stream');await tx.query('INSERT INTO upload_parts(intent_id,start_byte,bytes,checksum,object_key) VALUES($1,$2,$3,$4,$5)',[intent.id,start,bytes.length,checksum,key]);}
  const next=old?received:received+bytes.length;
  if(next===total){
   const directory=path.join(dataDir,'tmp');await mkdir(directory,{recursive:true});const file=path.join(directory,intent.id+'.upload');
   const parts=await rows('SELECT * FROM upload_parts WHERE intent_id=$1 ORDER BY start_byte',[intent.id],tx);
   try{
    async function* content(){for(const part of parts){const object=await storage.stream(part.object_key);for await(const chunk of Readable.fromWeb(object.body as any))yield chunk;}}
    await pipeline(Readable.from(content()),createWriteStream(file));await storage.putFile(intent.object_key,file,intent.mime);
    await tx.query("UPDATE intents SET state='uploaded' WHERE id=$1",[intent.id]);
   }finally{await unlink(file).catch(()=>{});}
  }
  return {uploaded:next===total,receivedBytes:next};
 });
}
