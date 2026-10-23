import { mkdir,readFile,writeFile,unlink,copyFile,stat,rename } from 'node:fs/promises';
import {randomUUID} from 'node:crypto';
import {createReadStream} from 'node:fs';
import {Readable} from 'node:stream';
import {Upload} from '@aws-sdk/lib-storage';
import path from 'node:path';
import { S3Client,PutObjectCommand,GetObjectCommand,DeleteObjectCommand } from '@aws-sdk/client-s3';
import { dataDir } from './db';
import {putCloud,getCloud,removeCloud,putCloudFile,streamCloud,cloudSignedUrl} from './cloud-storage';
const s3=()=>new S3Client({region:'auto',endpoint:process.env.R2_ENDPOINT,credentials:{accessKeyId:process.env.R2_ACCESS_KEY_ID!,secretAccessKey:process.env.R2_SECRET_ACCESS_KEY!}});
const keyPath=(key:string)=>{if(!/^[a-zA-Z0-9/_\-.]+$/.test(key)||key.includes('..'))throw Error('Invalid object key');return path.join(dataDir,'private',key)};
async function atomicLocalWrite(key:string,write:(temporary:string)=>Promise<void>){const destination=keyPath(key),temporary=destination+'.'+randomUUID()+'.tmp';await mkdir(path.dirname(destination),{recursive:true});try{await write(temporary);await rename(temporary,destination)}finally{await unlink(temporary).catch(error=>{if(error.code!=='ENOENT')throw error})}}
export async function put(key:string,body:Buffer,mime:string){if(process.env.STORAGE_DRIVER==='supabase'){await putCloud(key,body,mime);return;}if(process.env.STORAGE_DRIVER==='r2'){await s3().send(new PutObjectCommand({Bucket:process.env.R2_BUCKET_NAME,Key:key,Body:body,ContentType:mime}));return;}await atomicLocalWrite(key,file=>writeFile(file,body));}
export async function get(key:string){if(process.env.STORAGE_DRIVER==='supabase')return getCloud(key);if(process.env.STORAGE_DRIVER==='r2'){const r=await s3().send(new GetObjectCommand({Bucket:process.env.R2_BUCKET_NAME,Key:key}));return Buffer.from(await r.Body!.transformToByteArray());}return readFile(keyPath(key));}
export async function remove(key:string){if(process.env.STORAGE_DRIVER==='supabase'){await removeCloud(key);return;}if(process.env.STORAGE_DRIVER==='r2'){await s3().send(new DeleteObjectCommand({Bucket:process.env.R2_BUCKET_NAME,Key:key}));return;}await unlink(keyPath(key)).catch((e)=>{if(e.code!=='ENOENT')throw e});}
export async function putFile(key:string,file:string,mime:string){
 if(process.env.STORAGE_DRIVER==='supabase'){await putCloudFile(key,file,mime);return;}
 if(process.env.STORAGE_DRIVER==='r2'){const upload=new Upload({client:s3(),params:{Bucket:process.env.R2_BUCKET_NAME,Key:key,Body:createReadStream(file),ContentType:mime},queueSize:2,partSize:8*1024**2,leavePartsOnError:false});await upload.done();return;}
 await atomicLocalWrite(key,destination=>copyFile(file,destination));
}
export async function stream(key:string){
 if(process.env.STORAGE_DRIVER==='supabase')return streamCloud(key);
 if(process.env.STORAGE_DRIVER==='r2'){const r=await s3().send(new GetObjectCommand({Bucket:process.env.R2_BUCKET_NAME,Key:key}));return {body:r.Body!.transformToWebStream(),bytes:r.ContentLength};}
 const file=keyPath(key);return {body:Readable.toWeb(createReadStream(file)),bytes:(await stat(file)).size};
}

export async function signedUrl(key:string){return process.env.STORAGE_DRIVER==='supabase'?cloudSignedUrl(key):null;}
