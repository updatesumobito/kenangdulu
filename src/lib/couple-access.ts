import {createHmac,timingSafeEqual} from 'node:crypto';
import {cookies} from 'next/headers';
import {one,rows} from './db';
import {hash,passwordHash,verifyPassword,token,secureCookie} from './auth';
import {fail} from './domain';

const duration=12*60*60;
const cookieName=(eventId:string)=>'kv_couple_'+eventId;
function signature(payload:string,secret:string){return createHmac('sha256',secret).update(payload).digest('base64url')}
export async function coupleAccessStatus(eventId:string){const c=await one('SELECT enabled FROM event_couple_access WHERE event_id=$1',[eventId]);return {enabled:!!c?.enabled,configured:!!c};}
export async function configureCoupleAccess(eventId:string,code:string|undefined,enabled:boolean){
 if(enabled&&!code)fail('CODE_REQUIRED','Masukkan kode baru untuk mengaktifkan akses pengantin.');
 if(enabled)await rows('INSERT INTO event_couple_access(event_id,code_hash,enabled) VALUES($1,$2,true) ON CONFLICT(event_id) DO UPDATE SET code_hash=excluded.code_hash,enabled=true,updated_at=now()',[eventId,passwordHash(code!)]);
 else await rows('UPDATE event_couple_access SET enabled=false,updated_at=now() WHERE event_id=$1',[eventId]);
}
export async function hasCoupleAccess(eventId:string){
 const value=(await cookies()).get(cookieName(eventId))?.value;
 if(!value||value.length>256)return false;
 const [expires,nonce,mac,...extra]=value.split('.'),until=Number(expires),now=Math.floor(Date.now()/1000);
 if(extra.length||!nonce||!mac||!Number.isSafeInteger(until)||until<=now||until>now+duration)return false;
 const config=await one('SELECT code_hash FROM event_couple_access WHERE event_id=$1 AND enabled=true',[eventId]);if(!config)return false;
 const expected=Buffer.from(signature(eventId+'.'+expires+'.'+nonce,config.code_hash));const actual=Buffer.from(mac);
 return expected.length===actual.length&&timingSafeEqual(expected,actual);
}
export async function unlockCoupleAccess(eventId:string,code:string,req:Request){
 const ip=req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()||'unknown';
 const rate=await one("INSERT INTO rate_limits(key,hits,reset_at) VALUES($1,1,now()+interval '15 minutes') ON CONFLICT(key) DO UPDATE SET hits=CASE WHEN rate_limits.reset_at<now() THEN 1 ELSE rate_limits.hits+1 END,reset_at=CASE WHEN rate_limits.reset_at<now() THEN now()+interval '15 minutes' ELSE rate_limits.reset_at END RETURNING hits",[hash('couple-code:'+eventId+':'+ip)]);
 if(rate.hits>8)fail('RATE_LIMITED','Terlalu banyak percobaan kode. Coba lagi dalam 15 menit.',429);
 const config=await one('SELECT code_hash FROM event_couple_access WHERE event_id=$1 AND enabled=true',[eventId]);
 if(!config||!verifyPassword(code,config.code_hash))fail('INVALID_COUPLE_CODE','Kode tidak sesuai atau akses pengantin belum diaktifkan.',401);
 const expires=String(Math.floor(Date.now()/1000)+duration),nonce=token();
 (await cookies()).set(cookieName(eventId),expires+'.'+nonce+'.'+signature(eventId+'.'+expires+'.'+nonce,config.code_hash),{httpOnly:true,secure:secureCookie(),sameSite:'lax',path:'/',maxAge:duration});
}
export async function lockCoupleAccess(eventId:string){(await cookies()).delete(cookieName(eventId));}
