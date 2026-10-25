import {api} from './ui';
import {uploadableGuestVoice} from '@/lib/browser-audio';
import type {MediaPresentation} from '@/lib/media-presentation';
type OnRetry=(attempt:number)=>void;
// Only retry idempotent guest submissions. Reuse their keys after a lost response:
// the server may already have saved the upload, finalized media, or note.
async function retrySubmission<T>(request:()=>Promise<T>,onRetry?:OnRetry):Promise<T>{
 for(let attempt=0;;attempt++){
  try{return await request();}
  catch(error){
   const err=error as Error&{status?:number;code?:string};
   const transient=err instanceof TypeError||err instanceof SyntaxError||['TimeoutError','AbortError'].includes(err.name)||['NETWORK_ERROR','UPLOAD_OFFSET_MISMATCH','UPLOAD_RESPONSE_INVALID'].includes(err.code||'')||[408,425,429].includes(err.status||0)||(err.status||0)>=500;
   if(!transient||attempt>=3)throw error;
   onRetry?.(attempt+1);await new Promise(resolve=>setTimeout(resolve,750*2**attempt));
  }
 }
}
const submissionApi=(path:string,options:RequestInit={})=>api(path,{...options,signal:AbortSignal.timeout(120000)});
const submissionPost=(path:string,data:unknown={})=>submissionApi(path,{method:'POST',body:JSON.stringify(data)});
function requireReceipt(result:any){if(!result?.id)throw Object.assign(Error('Konfirmasi kiriman belum diterima. Mencoba kembali.'),{code:'UPLOAD_RESPONSE_INVALID'});return result;}

export function sendGuestNote(text:string,key:string,onRetry?:OnRetry){
 return retrySubmission(async()=>requireReceipt(await submissionPost('guest/notes',{text,cardStyle:'plain',attachmentIds:[],consentPublic:false,idempotencyKey:key})),onRetry);
}
export async function uploadMemory(eventId:string,kind:string,blob:Blob,_consentPublic:boolean,key:string,onProgress:(p:number)=>void,onIntent?:(id:string)=>void,presentation?:MediaPresentation,onRetry?:OnRetry){
 if(kind==='voice')blob=await uploadableGuestVoice(blob);
 return retrySubmission(async()=>{
 const intent=await submissionPost('guest/media/intents',{eventId,kind,sizeBytes:blob.size,mimeType:blob.type,idempotencyKey:key,consentPublic:false,presentation});onIntent?.(intent.intentId);
 if(intent.state!=='finalized'){
  // Read the acknowledged offset on every retry, including when a chunk was
  // saved successfully but its response never reached the browser.
  const status=await submissionApi('guest/uploads/'+intent.intentId,{cache:'no-store'});
  let offset=status.receivedBytes;
  if(!Number.isSafeInteger(offset)||offset<0||offset>blob.size)throw Object.assign(Error('Posisi unggahan belum dapat dikonfirmasi.'),{code:'UPLOAD_RESPONSE_INVALID'});
  while(offset<blob.size){
   const end=Math.min(blob.size,offset+1048576),part=blob.slice(offset,end);
   await new Promise<void>((resolve,reject)=>{const x=new XMLHttpRequest();x.open('PUT',intent.uploadUrl);x.setRequestHeader('Content-Type',blob.type);x.setRequestHeader('Content-Range',`bytes ${offset}-${end-1}/${blob.size}`);x.upload.onprogress=e=>{if(e.lengthComputable)onProgress(Math.round((offset+e.loaded)/blob.size*90))};x.onload=()=>{if(x.status>=200&&x.status<300)resolve();else{let m='Unggah gagal. Coba ulang.',code='';try{const error=JSON.parse(x.responseText).error;m=error.message;code=error.code}catch{}reject(Object.assign(Error(m),{code,status:x.status}))}};x.onerror=()=>reject(Object.assign(Error('Koneksi terputus. Mencoba melanjutkan unggahan.'),{code:'NETWORK_ERROR'}));x.timeout=120000;x.ontimeout=()=>reject(Object.assign(Error('Waktu unggah habis. Mencoba melanjutkan unggahan.'),{code:'NETWORK_ERROR'}));x.send(part)});
   offset=end;
  }
 }
 const result=requireReceipt(await submissionPost('guest/media/'+intent.intentId+'/finalize'));onProgress(100);return result;
 },onRetry);
}
