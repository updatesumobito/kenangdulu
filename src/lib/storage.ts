import { mkdir,readFile,writeFile,unlink,copyFile,stat,rename } from 'node:fs/promises';
import {randomUUID} from 'node:crypto';
import {createReadStream} from 'node:fs';
import {Readable} from 'node:stream';
import path from 'node:path';
import { dataDir } from './db';
import {putCloud,getCloud,removeCloud,putCloudFile,streamCloud,cloudSignedUrl} from './cloud-storage';
import {assertStorageKey,getR2,putR2,removeR2,putR2File,signR2,objectMissing} from './r2-storage';
const legacy=()=>process.env.STORAGE_FALLBACK_DRIVER==='supabase';
function driver(){const value=process.env.STORAGE_DRIVER||'local';if(!['local','supabase','r2'].includes(value))throw Error('STORAGE_DRIVER tidak valid.');return value;}
const keyPath=(key:string)=>{if(!/^[a-zA-Z0-9/_\-.]+$/.test(key)||key.includes('..'))throw Error('Invalid object key');return path.join(dataDir,'private',key)};
async function atomicLocalWrite(key:string,write:(temporary:string)=>Promise<void>){const destination=keyPath(key),temporary=destination+'.'+randomUUID()+'.tmp';await mkdir(path.dirname(destination),{recursive:true});try{await write(temporary);await rename(temporary,destination)}finally{await unlink(temporary).catch(error=>{if(error.code!=='ENOENT')throw error})}}
export async function put(key:string,body:Buffer,mime:string){assertStorageKey(key);if(driver()==='supabase'){await putCloud(key,body,mime);return;}if(driver()==='r2'){await putR2(key,body,mime);return;}await atomicLocalWrite(key,file=>writeFile(file,body));}
export async function get(key:string){assertStorageKey(key);if(driver()==='supabase')return getCloud(key);if(driver()==='r2'){try{const r=await getR2(key);return Buffer.from(await r.Body!.transformToByteArray());}catch(error){if(!legacy()||!objectMissing(error))throw error;return getCloud(key)}}return readFile(keyPath(key));}
export async function remove(key:string){assertStorageKey(key);if(driver()==='supabase'){await removeCloud(key);return;}if(driver()==='r2'){await removeR2(key);if(legacy())await removeCloud(key);return;}await unlink(keyPath(key)).catch((e)=>{if(e.code!=='ENOENT')throw e});}
export async function putFile(key:string,file:string,mime:string){
 assertStorageKey(key);
 if(driver()==='supabase'){await putCloudFile(key,file,mime);return;}
 if(driver()==='r2'){await putR2File(key,file,mime);return;}
 await atomicLocalWrite(key,destination=>copyFile(file,destination));
}
export async function stream(key:string){
 assertStorageKey(key);
 if(driver()==='supabase')return streamCloud(key);
 if(driver()==='r2'){try{const r=await getR2(key);return {body:r.Body!.transformToWebStream(),bytes:r.ContentLength};}catch(error){if(!legacy()||!objectMissing(error))throw error;return streamCloud(key)}}
 const file=keyPath(key);return {body:Readable.toWeb(createReadStream(file)),bytes:(await stat(file)).size};
}

export async function signedUrl(key:string,options?:{contentDisposition?:string;contentType?:string}){
 assertStorageKey(key);
 if(driver()==='r2'){try{return await signR2(key,options)}catch(error){if(!legacy()||!objectMissing(error))throw error;if(!options)return cloudSignedUrl(key);return null}}
 return driver()==='supabase'&&!options?cloudSignedUrl(key):null;
}
