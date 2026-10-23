import {request as factory,expect,APIRequestContext} from '@playwright/test';
import {readFile} from 'node:fs/promises';
export const base=process.env.PLAYWRIGHT_BASE_URL||'http://127.0.0.1:3107';
const authStates=new Map<string,Promise<Awaited<ReturnType<APIRequestContext['storageState']>>>>();
export async function context(user?:string){
 if(!user)return factory.newContext({baseURL:base});
 if(!authStates.has(user))authStates.set(user,(async()=>{const c=await factory.newContext({baseURL:base});const r=await c.post('/api/v1/auth/login',{data:{email:user+'@demo.komukuna.test',password:'KomukunaDemo2026!'}});expect(r.status(),await r.text()).toBe(200);const state=await c.storageState();await c.dispose();return state;})());
 return factory.newContext({baseURL:base,storageState:await authStates.get(user)!});
}
export async function get(c:APIRequestContext,path:string){const r=await c.get('/api/v1/'+path);expect(r.ok(),await r.text()).toBeTruthy();return (await r.json()).data;}
export async function post(c:APIRequestContext,path:string,data:any={}){const r=await c.post('/api/v1/'+path,{data});expect(r.ok(),await r.text()).toBeTruthy();return (await r.json()).data;}
export async function makeEvent(admin:APIRequestContext,buyer:APIRequestContext,plan='mini'){
 const o=await post(buyer,'direct/orders',{planId:plan,terms:true,brief:{name:'E2E '+plan+' '+crypto.randomUUID().slice(0,8),contact:'e2e@example.test',startAt:new Date(Date.now()-3600000).toISOString(),endAt:new Date(Date.now()+86400000).toISOString(),timezone:'Asia/Jakarta',location:'Local test',notes:'Synthetic fixture'}});
 const proof=await buyer.post('/api/v1/direct/orders/'+o.id+'/payment-proof',{data:await readFile('tests/fixtures/photo.jpg'),headers:{'Content-Type':'image/jpeg'}});expect(proof.ok(),await proof.text()).toBeTruthy();await post(admin,'admin/fulfillment/'+o.id+'/verify');const p=await post(admin,'admin/fulfillment/'+o.id+'/prepare');await post(admin,'admin/fulfillment/'+o.id+'/send-preview');await post(buyer,'direct/orders/'+o.id+'/approve-preview');await post(admin,'admin/fulfillment/'+o.id+'/publish');const d=await get(admin,'events/'+p.eventId);return d.event;
}
export async function guest(e:any){const c=await context();await post(c,'public/events/'+e.slug+'/sessions',{name:'Tamu Uji',consent:true});return c;}
export async function intent(c:APIRequestContext,e:any,kind='disposable_photo',file='photo.jpg',consentPublic=false,key=crypto.randomUUID()){
 const b=await readFile('tests/fixtures/'+file),mime=file.endsWith('.jpg')?'image/jpeg':file.endsWith('.png')?'image/png':kind==='voice'?'audio/mp4':'video/mp4';const i=await post(c,'guest/media/intents',{eventId:e.id,kind,sizeBytes:b.length,mimeType:mime,idempotencyKey:key,consentPublic});const r=await c.put(i.uploadUrl,{data:b,headers:{'Content-Type':mime}});expect(r.ok(),await r.text()).toBeTruthy();return i;
}
export async function finalize(c:APIRequestContext,i:any){return await post(c,'guest/media/'+i.intentId+'/finalize')}
export async function ready(admin:APIRequestContext,e:any,id:string){await expect.poll(async()=>{const d=await get(admin,'events/'+e.id+'/media');return d.items.find((m:any)=>m.id===id)?.processing},{timeout:60000}).toBe('ready');}
