import {createReadStream} from 'node:fs';

async function bridge(operation:string,key?:string,body?:BodyInit,mime?:string){
 const base=process.env.SUPABASE_URL,token=process.env.SUPABASE_STORAGE_BRIDGE_TOKEN,anon=process.env.SUPABASE_ANON_KEY;
 if(!base||!token||!anon)throw Error('Supabase storage bridge is not configured.');
 const response=await fetch(base+'/functions/v1/komukuna-storage',{method:'POST',headers:{Authorization:'Bearer '+anon,apikey:anon,'x-komukuna-storage-token':token,'x-storage-operation':operation,...(key?{'x-storage-key':key}:{}),...(mime?{'Content-Type':mime}:{})},body,...(body?{duplex:'half'}:{}),cache:'no-store'} as RequestInit);
 const result=await response.json();if(!response.ok)throw Object.assign(Error(result.error||'Cloud storage request failed'),{code:'CLOUD_STORAGE_ERROR',status:response.status});return result;
}
export const ensureBucket=()=>bridge('ensure_bucket');
export const putCloud=(key:string,body:Buffer,mime:string)=>bridge('upload',key,new Uint8Array(body),mime);
export const putCloudFile=(key:string,file:string,mime:string)=>bridge('upload',key,createReadStream(file) as unknown as BodyInit,mime);
export const removeCloud=(key:string)=>bridge('remove',key);
export const cloudSignedUrl=async(key:string)=>(await bridge('sign',key)).url as string;
export async function getCloud(key:string){const response=await fetch(await cloudSignedUrl(key),{cache:'no-store'});if(!response.ok)throw Error('Cloud object is unavailable.');return Buffer.from(await response.arrayBuffer());}
export async function streamCloud(key:string){const response=await fetch(await cloudSignedUrl(key),{cache:'no-store'});if(!response.ok||!response.body)throw Error('Cloud object is unavailable.');return {body:response.body,bytes:Number(response.headers.get('content-length')||0)};}
