import {post} from './ui';
export async function uploadMemory(eventId:string,kind:string,blob:Blob,consentPublic:boolean,key:string,onProgress:(p:number)=>void){
 const intent=await post('guest/media/intents',{eventId,kind,sizeBytes:blob.size,mimeType:blob.type,idempotencyKey:key,consentPublic});
 if(intent.state!=='finalized'){
  const response=await fetch(intent.uploadUrl,{cache:'no-store'}),status=await response.json();if(!response.ok)throw Error(status.error?.message||'Posisi unggahan belum dapat dimuat.');
  let offset=status.data.receivedBytes;
  while(offset<blob.size){
   const end=Math.min(blob.size,offset+1048576),part=blob.slice(offset,end);
   await new Promise<void>((resolve,reject)=>{const x=new XMLHttpRequest();x.open('PUT',intent.uploadUrl);x.setRequestHeader('Content-Type',blob.type);x.setRequestHeader('Content-Range',`bytes ${offset}-${end-1}/${blob.size}`);x.upload.onprogress=e=>{if(e.lengthComputable)onProgress(Math.round((offset+e.loaded)/blob.size*90))};x.onload=()=>{if(x.status>=200&&x.status<300)resolve();else{let m='Unggah gagal. Coba ulang.';try{m=JSON.parse(x.responseText).error.message}catch{}reject(Error(m))}};x.onerror=()=>reject(Error('Koneksi terputus. Coba lagi untuk melanjutkan unggahan.'));x.timeout=120000;x.ontimeout=()=>reject(Error('Waktu unggah habis. Coba lagi untuk melanjutkan.'));x.send(part)});
   offset=end;
  }
 }
 const result=await post('guest/media/'+intent.intentId+'/finalize');onProgress(100);return result;
}
