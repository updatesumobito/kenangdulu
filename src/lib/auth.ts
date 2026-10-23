import { randomBytes, createHash, scryptSync, timingSafeEqual,randomUUID } from 'node:crypto';
import { cookies } from 'next/headers';
import { one,rows } from './db';
import { fail } from './domain';
export const uid=()=>randomUUID();
export const token=()=>randomBytes(32).toString('base64url');
export const hash=(v:string)=>createHash('sha256').update(v).digest('hex');
export function secureCookie(){const local=process.env.LOCAL_PREVIEW==='1'&&/^http:\/\/(127\.0\.0\.1|localhost)(:\d+)?$/.test(process.env.APP_URL||'');return process.env.NODE_ENV==='production'&&!local;}
export function passwordHash(p:string){const salt=randomBytes(16).toString('hex');return salt+':'+scryptSync(p,salt,64).toString('hex');}
export function verifyPassword(p:string,h:string){const [s,k]=h.split(':');try{return timingSafeEqual(Buffer.from(k,'hex'),scryptSync(p,s,64));}catch{return false}}
export async function currentUser(){const t=(await cookies()).get('kv_session')?.value;if(!t)return null;return await one('SELECT u.id,u.email,u.name,u.role FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token_hash=$1 AND s.expires_at>now()',[hash(t)])||null;}
export async function requireUser(){return await currentUser()||fail('UNAUTHORIZED','Silakan masuk terlebih dahulu.',401);}
export async function setSession(userId:string){const t=token();await rows("INSERT INTO sessions VALUES($1,$2,now()+interval '7 days')",[hash(t),userId]);(await cookies()).set('kv_session',t,{httpOnly:true,sameSite:'lax',secure:secureCookie(),path:'/',maxAge:604800});}
export async function eventAccess(user:any,event:any,permission='view'){
 if(!event)fail('NOT_FOUND','Acara tidak ditemukan.',404);
 if(user?.role==='superadmin')return true;
 if(['view','export'].includes(permission)&&event.customer_id===user?.id)return true;
 if(event.channel==='DIRECT_MANAGED'){
  const o=await one('SELECT designer_id FROM orders WHERE id=$1',[event.order_id]);
  if(user?.role==='designer'&&o?.designer_id===user.id&&['view','edit','frame','moderate'].includes(permission))return true;
 }else if(user){
  if(await one('SELECT 1 FROM organizations WHERE id=$1 AND owner_id=$2',[event.org_id,user.id]))return true;
  const staff=await one('SELECT permissions FROM event_staff WHERE event_id=$1 AND user_id=$2',[event.id,user.id]);
  const perm=({view:'gallery_view',edit:'event_edit',frame:'event_edit',moderate:'media_moderate',display:'live_wall_view',export:'media_export'} as any)[permission];
  if(staff?.permissions.includes(perm)||(permission==='view'&&staff))return true;
 }
 fail('FORBIDDEN','Anda tidak memiliki izin untuk tindakan ini.',403);
}
export async function admin(){const u=await requireUser();if(u.role!=='superadmin')fail('FORBIDDEN','Khusus superadmin.',403);return u;}
export async function guestSession(eventId?:string){const t=(await cookies()).get('kv_guest')?.value;const s=t?await one('SELECT s.*,g.name,g.verified FROM guest_sessions s JOIN guests g ON g.id=s.guest_id WHERE token_hash=$1 AND expires_at>now()',[hash(t)]):undefined;if(!s||eventId&&s.event_id!==eventId)return fail('GUEST_SESSION_REQUIRED','Isi identitas dan persetujuan terlebih dahulu.',401);return s;}
export async function audit(actor:string|null,action:string,detail:any={},eventId?:string){await rows('INSERT INTO audit(id,actor_id,event_id,action,detail) VALUES($1,$2,$3,$4,$5)',[uid(),actor,eventId||null,action,JSON.stringify(detail)]);}
