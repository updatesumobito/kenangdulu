import {api,post} from './ui';
export async function uploadMemory(eventId:string,kind:string,blob:Blob,_consentPublic:boolean,key:string,onProgress:(p:number)=>void,onIntent?:(id:string)=>void){
 const intent=await post('guest/media/intents',{eventId,kind,sizeBytes:blob.size,mimeType:blob.type,idempotencyKey:key,consentPublic:false});onIntent?.(intent.intentId);
 if(intent.state!=='finalized'){
  const status=await api('guest/uploads/'+intent.intentId,{cache:'no-store'});
  let offset=status.receivedBytes;
  while(offset<blob.size){
   const end=Math.min(blob.size,offset+1048576),part=blob.slice(offset,end);
   await new Promise<void>((resolve,reject)=>{const x=new XMLHttpRequest();x.open('PUT',intent.uploadUrl);x.setRequestHeader('Content-Type',blob.type);x.setRequestHeader('Content-Range',`bytes ${offset}-${end-1}/${blob.size}`);x.upload.onprogress=e=>{if(e.lengthComputable)onProgress(Math.round((offset+e.loaded)/blob.size*90))};x.onload=()=>{if(x.status>=200&&x.status<300)resolve();else{let m='Unggah gagal. Coba ulang.',code='';try{const error=JSON.parse(x.responseText).error;m=error.message;code=error.code}catch{}reject(Object.assign(Error(m),{code}))}};x.onerror=()=>reject(Error('Koneksi terputus. Coba lagi untuk melanjutkan unggahan.'));x.timeout=120000;x.ontimeout=()=>reject(Error('Waktu unggah habis. Coba lagi untuk melanjutkan.'));x.send(part)});
   offset=end;
  }
 }
 const result=await post('guest/media/'+intent.intentId+'/finalize');onProgress(100);return result;
}
