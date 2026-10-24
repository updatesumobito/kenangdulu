import {rows} from './db';
import {createMemoryBook} from './memory-book';
import * as storage from './storage';
import {ZipArchive} from 'archiver';
import {createWriteStream} from 'node:fs';
import {mkdir,stat,unlink} from 'node:fs/promises';
import path from 'node:path';
import {dataDir,json} from './db';
export type ExportPart={key:string;filename:string;mime:string;bytes:number;fileCount:number;failed:string[]};
const extension=(mime:string)=>({'image/jpeg':'jpg','image/png':'png','image/webp':'webp','image/gif':'gif','audio/mp4':'m4a','audio/ogg':'ogg','audio/webm':'webm','audio/mpeg':'mp3','video/webm':'webm','video/mp4':'mp4','video/quicktime':'mov'}[mime]||'bin');
export async function renderEventExport(job:any,event:any){
 const media=await rows("SELECT * FROM media WHERE event_id=$1 AND processing='ready' AND moderation NOT IN ('deleted','hidden','rejected') ORDER BY created_at,id",[event.id]),parts:ExportPart[]=[],failed:string[]=[],warnings=new Set<string>(),expiresAt=new Date(Date.now()+86400000).toISOString(),maxBytes=Math.max(1024**2,Math.min(Number(process.env.EXPORT_PART_MAX_BYTES)||256*1024**2,Number(process.env.STORAGE_MAX_OBJECT_BYTES)||256*1024**2)),manifest=media.map(m=>({id:m.id,kind:m.kind,source:m.source,author:m.author,createdAt:m.created_at,consent:m.consent,filename:m.id+(m.text_content?'.txt':'.'+extension(m.mime)),bytes:Number(m.bytes),text:m.text_content||null}));
 async function checkpoint(){await rows('UPDATE jobs SET result=$2 WHERE id=$1',[job.id,json({parts,fileCount:media.length,failed,expiresAt,unsupportedCharacters:[...warnings]})]);}
 try{
 if(job.kind==='book.pdf'){
  const volumeSize=Math.max(1,Math.min(300,Number(job.payload.bookLimit)||100)),volumeCount=Math.max(1,Math.ceil(media.length/volumeSize));
  for(let index=0;index<volumeCount;index++){
   const selected=media.slice(index*volumeSize,(index+1)*volumeSize),book=await createMemoryBook({...event,name:event.name+(volumeCount>1?' · Volume '+(index+1)+'/'+volumeCount:'')},selected,volumeSize),key=event.id+'/exports/'+job.id+'-'+(index+1)+'.pdf';
   if(book.body.length>maxBytes)throw Error('Volume PDF melewati batas objek storage. Ulangi dengan jumlah kiriman per volume lebih kecil.');
   await storage.put(key,book.body,'application/pdf');parts.push({key,filename:'memory-book-'+(index+1)+'.pdf',mime:'application/pdf',bytes:book.body.length,fileCount:book.included,failed:book.failed});failed.push(...book.failed);book.unsupportedCharacters.forEach(c=>warnings.add(c));await checkpoint();
  }
 }else{
  const manifestReserve=Buffer.byteLength(JSON.stringify(manifest,null,2))+128*1024;const groups:any[][]=[];let current:any[]=[],bytes=0;
  for(const m of media){const size=m.text_content?Buffer.byteLength(m.author+'\n'+m.text_content):Number(m.bytes);if(size>maxBytes-manifestReserve){failed.push(m.id);continue;}if(current.length&&bytes+size>maxBytes-manifestReserve){groups.push(current);current=[];bytes=0;}current.push(m);bytes+=size;}
  if(current.length||!groups.length)groups.push(current);
  await mkdir(path.join(dataDir,'tmp'),{recursive:true});
  for(const [index,group] of groups.entries()){
   const key=event.id+'/exports/'+job.id+'-'+(index+1)+'.zip',file=path.join(dataDir,'tmp',job.id+'-'+(index+1)+'.zip'),archive=new ZipArchive({store:true}),output=createWriteStream(file),errors:string[]=[],completion=new Promise<void>((resolve,reject)=>{output.on('close',resolve);output.on('error',reject);archive.on('error',reject);});archive.pipe(output);
   try{for(const m of group){const name=m.id+(m.text_content?'.txt':'.'+extension(m.mime));if(m.text_content)archive.append(m.author+'\n'+m.text_content,{name});else try{const object=await storage.stream(m.object_key),{Readable}=await import('node:stream');archive.append(Readable.fromWeb(object.body as any),{name});}catch{errors.push(m.id);}}
    archive.append(JSON.stringify({event:event.name,part:index+1,parts:groups.length,allItems:manifest,partItems:group.map(m=>m.id),failed:[...failed,...errors]},null,2),{name:'manifest.json'});await archive.finalize();await completion;const size=(await stat(file)).size;if(size>maxBytes)throw Error('ZIP melewati batas objek penyimpanan. Turunkan EXPORT_PART_MAX_BYTES atau kurangi metadata.');await storage.putFile(key,file,'application/zip');parts.push({key,filename:'memories-'+(index+1)+'.zip',mime:'application/zip',bytes:size,fileCount:group.length-errors.length,failed:errors});failed.push(...errors);await checkpoint();
   }finally{output.destroy();await unlink(file).catch(()=>{});}
  }
 }
 const manifestKey=event.id+'/exports/'+job.id+'-manifest.json';const manifestBody=Buffer.from(JSON.stringify({event:event.name,items:manifest,parts:parts.map(p=>({filename:p.filename,bytes:p.bytes,fileCount:p.fileCount})),failed,unsupportedCharacters:[...warnings],expiresAt},null,2));await storage.put(manifestKey,manifestBody,'application/json');parts.push({key:manifestKey,filename:'manifest.json',mime:'application/json',bytes:manifestBody.length,fileCount:0,failed:[]});
 return {key:parts[0].key,parts,bytes:parts.reduce((n,p)=>n+p.bytes,0),fileCount:media.length-failed.length,failed,unsupportedCharacters:[...warnings],expiresAt};
 }catch(error){await Promise.allSettled(parts.map(part=>storage.remove(part.key)));await rows('UPDATE jobs SET result=NULL WHERE id=$1',[job.id]);throw error;}
}
export async function cleanExpiredExports(){const jobs=await rows("SELECT id,result FROM jobs WHERE status='done' AND kind IN ('book.pdf','export.zip') AND (result->>'expiresAt')::timestamptz<now() AND coalesce(result->>'cleaned','false')<>'true' LIMIT 20");for(const job of jobs){for(const key of new Set<string>([job.result.key,...(job.result.parts||[]).map((p:any)=>p.key)].filter(Boolean)))await storage.remove(key);await rows("UPDATE jobs SET result=jsonb_set(result,'{cleaned}','true'::jsonb) WHERE id=$1",[job.id]);}}
