export type MemoryKind='disposable_photo'|'photo_strip'|'gif'|'voice'|'video_wish';
export type WizardStep='name'|'camera'|'voice'|'video'|'note'|'review';
export type DraftMedia={id:string;key:string;kind:MemoryKind;blob:Blob;duration?:number;mediaId?:string;intentId?:string};
export type GuestDraft={version:1;eventId:string;guestId:string;name:string;consent:boolean;media:DraftMedia[];text:string;noteKey:string;noteId?:string;repairId?:string;confirmed:WizardStep[];videoSkipped:boolean;step:WizardStep;started:boolean;sent:boolean;updatedAt:number};
export function newGuestDraft(eventId:string,guestId='',name=''):GuestDraft{return {version:1,eventId,guestId,name,consent:false,media:[],text:'',noteKey:crypto.randomUUID(),confirmed:[],videoSkipped:false,step:'name',started:false,sent:false,updatedAt:Date.now()};}
export function draftMedia(kind:MemoryKind,blob:Blob,duration?:number):DraftMedia{return {id:crypto.randomUUID(),key:crypto.randomUUID(),kind,blob,duration};}
export const isDraftPhoto=(m:DraftMedia)=>['disposable_photo','photo_strip','gif'].includes(m.kind);
const databaseName='komukuna-guest-drafts';
function openDrafts(){return new Promise<IDBDatabase>((resolve,reject)=>{if(!globalThis.indexedDB){reject(Error('Penyimpanan lokal tidak tersedia.'));return;}const request=indexedDB.open(databaseName,1);request.onupgradeneeded=()=>request.result.createObjectStore('drafts',{keyPath:'eventId'});request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error);request.onblocked=()=>reject(Error('Penyimpanan sedang dipakai tab lain.'));});}
async function transact<T>(mode:IDBTransactionMode,run:(store:IDBObjectStore)=>IDBRequest<T>):Promise<T>{const db=await openDrafts();try{return await new Promise<T>((resolve,reject)=>{const tx=db.transaction('drafts',mode);const request=run(tx.objectStore('drafts'));tx.oncomplete=()=>resolve(request.result);tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error||Error('Draft belum tersimpan.'));});}finally{db.close();}}
export async function readGuestDraft(eventId:string){
 // Clean only this app's expired drafts, including drafts from other events.
 const all=await transact<GuestDraft[]>('readonly',store=>store.getAll());
 const now=Date.now();for(const item of all)if(item.version!==1||now-item.updatedAt>86400000)await transact('readwrite',store=>store.delete(item.eventId));
 return all.find(item=>item.eventId===eventId&&item.version===1&&now-item.updatedAt<=86400000)||null;
}
export const writeGuestDraft=(draft:GuestDraft)=>transact('readwrite',store=>store.put(draft));
export function mediaExtension(blob:Blob){const mime=blob.type.split(';')[0];return ({'image/jpeg':'jpg','image/png':'png','image/webp':'webp','image/gif':'gif','video/mp4':'mp4','video/quicktime':'mov','video/webm':'webm','audio/mp4':'m4a','audio/webm':'webm','audio/ogg':'ogg','audio/mpeg':'mp3'} as Record<string,string>)[mime]||'bin';}
export const mediaFilename=(media:DraftMedia,index:number)=>`${media.kind==='voice'?'suara':media.kind==='video_wish'?'video':'foto'}-${String(index+1).padStart(2,'0')}.${mediaExtension(media.blob)}`;
export function guestDownloadFiles(draft:GuestDraft,eventName:string){
 const files=draft.media.map((media,index)=>({blob:media.blob,filename:mediaFilename(media,index)}));
 if(draft.text.trim())files.push({blob:new Blob([`Untuk ${eventName}\nDari ${draft.name}\n\n${draft.text}\n\nKenangan pribadi untuk pengantin.\n`],{type:'text/plain;charset=utf-8'}),filename:'ucapan.txt'});
 return files;
}
export function downloadBlob(blob:Blob,filename:string){const url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download=filename;document.body.appendChild(link);link.click();link.remove();window.setTimeout(()=>URL.revokeObjectURL(url),60000);}
