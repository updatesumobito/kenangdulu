import {createReadStream} from 'node:fs';
import {S3Client,PutObjectCommand,GetObjectCommand,HeadObjectCommand,DeleteObjectCommand} from '@aws-sdk/client-s3';
import {Upload} from '@aws-sdk/lib-storage';
import {getSignedUrl} from '@aws-sdk/s3-request-presigner';

let cached:{identity:string;client:S3Client}|undefined;
export function r2Config(){
 const names=['R2_ENDPOINT','R2_ACCESS_KEY_ID','R2_SECRET_ACCESS_KEY','R2_BUCKET_NAME'] as const;
 const missing=names.filter(name=>!process.env[name]);
 if(missing.length)throw Error('R2 belum dikonfigurasi: '+missing.join(', '));
 const endpoint=new URL(process.env.R2_ENDPOINT!);
 if(endpoint.protocol!=='https:'||endpoint.username||endpoint.password||endpoint.search||endpoint.hash||endpoint.pathname!=='/')throw Error('R2_ENDPOINT harus berupa origin HTTPS endpoint S3 R2.');
 const bucket=process.env.R2_BUCKET_NAME!;
 if(!/^[a-z0-9][a-z0-9-]{1,61}[a-z0-9]$/.test(bucket))throw Error('R2_BUCKET_NAME tidak valid.');
 return {endpoint:endpoint.origin,bucket,accessKeyId:process.env.R2_ACCESS_KEY_ID!,secretAccessKey:process.env.R2_SECRET_ACCESS_KEY!};
}
export function r2Client(){
 const config=r2Config(),identity=JSON.stringify(config);
 if(cached?.identity!==identity){cached?.client.destroy();cached={identity,client:new S3Client({region:'auto',endpoint:config.endpoint,credentials:{accessKeyId:config.accessKeyId,secretAccessKey:config.secretAccessKey},maxAttempts:3})}}
 return cached.client;
}
export function assertStorageKey(key:string){if(!key||!/^[a-zA-Z0-9/_\-.]+$/.test(key)||key.includes('..'))throw Error('Invalid object key');}
export function objectMissing(error:unknown){const e=error as {name?:string;$metadata?:{httpStatusCode?:number}};return e?.$metadata?.httpStatusCode===404||e?.name==='NoSuchKey'||e?.name==='NotFound';}
const object=(key:string)=>{assertStorageKey(key);return {Bucket:r2Config().bucket,Key:key}};
export const headR2=(key:string)=>r2Client().send(new HeadObjectCommand(object(key)));
export const getR2=(key:string)=>r2Client().send(new GetObjectCommand(object(key)));
export const putR2=(key:string,body:Uint8Array,mime:string)=>r2Client().send(new PutObjectCommand({...object(key),Body:body,ContentType:mime,CacheControl:'private, max-age=0, no-store'}));
export const removeR2=(key:string)=>r2Client().send(new DeleteObjectCommand(object(key)));
export async function putR2File(key:string,file:string,mime:string,metadata?:Record<string,string>){
 const upload=new Upload({client:r2Client(),params:{...object(key),Body:createReadStream(file),ContentType:mime,CacheControl:'private, max-age=0, no-store',Metadata:metadata},queueSize:2,partSize:8*1024**2,leavePartsOnError:false});
 await upload.done();
}
export async function signR2(key:string,options?:{contentDisposition?:string;contentType?:string}){
 // Verify existence so legacy keys can be resolved through the migration fallback.
 await headR2(key);
 return getSignedUrl(r2Client(),new GetObjectCommand({...object(key),ResponseContentDisposition:options?.contentDisposition,ResponseContentType:options?.contentType}),{expiresIn:120});
}
