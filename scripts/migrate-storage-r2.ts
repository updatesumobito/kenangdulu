import '../src/lib/env';
import {rows} from '../src/lib/db';
import {streamCloud} from '../src/lib/cloud-storage';
import {headR2,getR2,putR2File,r2Config,objectMissing,assertStorageKey} from '../src/lib/r2-storage';
import {createHash} from 'node:crypto';
import {createWriteStream} from 'node:fs';
import {mkdtemp,rm} from 'node:fs/promises';
import {Readable,Transform} from 'node:stream';
import {pipeline} from 'node:stream/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';

// Dry-run by default. Copy only; never delete source files or change DB keys.
const copy=process.argv.includes('--copy');
const entries=await rows(`
 SELECT object_key AS key,mime FROM media WHERE object_key IS NOT NULL AND moderation<>'deleted'
 UNION SELECT thumbnail_key,'image/webp' FROM media WHERE thumbnail_key IS NOT NULL AND moderation<>'deleted'
 UNION SELECT object_key,mime FROM frame_assets
 UNION SELECT object_key,mime FROM event_assets
 UNION SELECT object_key,mime FROM documents
 UNION SELECT object_key,mime FROM intents WHERE state='uploaded' AND expires_at>now()
 UNION SELECT p.object_key,'application/octet-stream' FROM upload_parts p JOIN intents i ON i.id=p.intent_id WHERE i.state IN ('reserved','uploaded') AND i.expires_at>now()`);
const jobs=await rows("SELECT result FROM jobs WHERE result IS NOT NULL AND kind IN ('export.zip','book.pdf') AND status='done'");
const objects=new Map<string,string>();
for(const entry of entries){assertStorageKey(entry.key);objects.set(entry.key,entry.mime||'application/octet-stream')}
for(const job of jobs){const r=job.result;if(!r?.expiresAt||new Date(r.expiresAt)<=new Date())continue;for(const part of r.parts||[]){assertStorageKey(part.key);objects.set(part.key,part.mime||'application/octet-stream')}}
console.log(JSON.stringify({mode:copy?'copy-and-verify':'dry-run',referencedObjects:objects.size,source:'supabase',destination:'r2',sourceDeletion:false,databaseChanges:false}));
if(!copy)process.exit(0);
r2Config();
const directory=await mkdtemp(path.join(tmpdir(),'kenang-r2-migration-'));
let copied=0,verified=0,failed=0,totalBytes=0;
try{
 for(const [key,mime] of objects){
  try{
   const source=await streamCloud(key),hash=createHash('sha256');let bytes=0;
   const digest=new Transform({transform(chunk,_encoding,callback){bytes+=chunk.length;hash.update(chunk);callback(null,chunk)}});
   const file=path.join(directory,'object');
   await pipeline(Readable.fromWeb(source.body as any),digest,createWriteStream(file));
   const sha256=hash.digest('hex');
   let existing=false;
   try{const head=await headR2(key);existing=true;if(head.ContentLength!==bytes)throw Error('R2 object already exists with a different size; refusing to overwrite.');}
   catch(error){if(!objectMissing(error))throw error}
   if(!existing){await putR2File(key,file,mime,{sha256});copied++}
   // Verify actual destination bytes, including on resumed migrations.
   const target=await getR2(key),targetHash=createHash('sha256');let targetBytes=0;
   for await(const chunk of target.Body as AsyncIterable<Uint8Array>){targetBytes+=chunk.length;targetHash.update(chunk)}
   if(targetBytes!==bytes||targetHash.digest('hex')!==sha256)throw Error('Destination checksum mismatch.');
   verified++;totalBytes+=bytes;
   console.log(JSON.stringify({key,status:existing?'verified-existing':'copied-and-verified',bytes}));
  }catch(error){failed++;console.error(JSON.stringify({key,status:'failed',reason:error instanceof Error?error.message:'Migration failed'}))}
 }
 console.log(JSON.stringify({copied,verified,failed,verifiedBytes:totalBytes,sourcePreserved:true,complete:failed===0}));
 process.exitCode=failed?1:0;
}finally{
 // Only this mkdtemp-created directory is removed; source and bucket remain intact.
 if(path.dirname(path.resolve(directory))!==path.resolve(tmpdir())||!path.basename(directory).startsWith('kenang-r2-migration-'))throw Error('Refusing to remove an unexpected temporary directory.');
 await rm(directory,{recursive:true,force:true});
}
process.exit(process.exitCode||0);
