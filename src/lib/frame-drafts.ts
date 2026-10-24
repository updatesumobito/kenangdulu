import type {FrameDocumentV2} from './frame-document';
export type FrameDraft={key:string;name:string;document:FrameDocumentV2;version:number;updatedAt:number};
let dbPromise:Promise<IDBDatabase>|undefined;
function open(){return dbPromise??=new Promise<IDBDatabase>((resolve,reject)=>{const r=indexedDB.open('kenang-dulu-frame-drafts',1);r.onupgradeneeded=()=>r.result.createObjectStore('drafts',{keyPath:'key'});r.onsuccess=()=>resolve(r.result);r.onerror=()=>{dbPromise=undefined;reject(r.error);};});}
export async function readFrameDraft(key:string){const db=await open();return new Promise<FrameDraft|undefined>((resolve,reject)=>{const r=db.transaction('drafts').objectStore('drafts').get(key);r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});}
export async function writeFrameDraft(draft:FrameDraft){const db=await open();return new Promise<void>((resolve,reject)=>{const tx=db.transaction('drafts','readwrite');tx.objectStore('drafts').put(draft);tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error||Error('Draft lokal gagal disimpan.'));});}
export async function removeFrameDraft(key:string){const db=await open();return new Promise<void>((resolve,reject)=>{const tx=db.transaction('drafts','readwrite');tx.objectStore('drafts').delete(key);tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error);});}
