import {guestSettings} from '@/lib/guest-settings';
import {guestPath} from '@/lib/guest-path';
import {guestNoteId} from '@/lib/guest-note-id';
import { NextRequest,NextResponse,after } from 'next/server';
import { cookies } from 'next/headers';
import {z} from 'zod';
import {one,rows,database,json} from '@/lib/db';
import {uid,token,hash,passwordHash,verifyPassword,setSession,currentUser,requireUser,eventAccess,admin,guestSession,audit,secureCookie} from '@/lib/auth';
import {AppError,fail,briefSchema,settingsSchema,frameSchema,defaultSettings,presetFrame,id as uuid,isPhoto} from '@/lib/domain';
import {limitedBody,reserve,finalize,checkLive,mediaAccess,inspect,eventBudget,physicalImport} from '@/lib/media';
import * as storage from '@/lib/storage';
import {startWorker,processJobs} from '@/lib/worker';
import QRCode from 'qrcode';
import {PDFDocument} from 'pdf-lib';
import sharp from 'sharp';
import {providerLogin,providerRegister,providerRecovery,providerReset} from '@/lib/supabase-auth';
import {uploadChunk,uploadProgress} from '@/lib/resumable-upload';
import {coupleAccessStatus,configureCoupleAccess,deleteCoupleAccess,hasCoupleAccess,unlockCoupleAccess,lockCoupleAccess} from '@/lib/couple-access';
import {coupleCodeSchema} from '@/lib/couple-code';
import {albumIdentity,coupleAlbums,downloadCoupleAlbum,mediaExtension,attachmentHeader} from '@/lib/couple-albums';
import {mediaPresentationSchema} from '@/lib/media-presentation';
import {FRAME_CAPABILITIES,frameAssetIds,toFrameDocument,validateFrame} from '@/lib/frame-document';
import {parseFrame,saveFrame,frameResponse,importFrame} from '@/lib/frame-service';
import {canExportQrPdf} from '@/lib/qr-entitlement';
import {createFramePackage,frameEnvelope} from '@/lib/frame-portability';
import {adminQuery,updateTask,paymentAdjustment,reviewPayment} from '@/lib/admin-queries';
import {upgradeOptions,createUpgradeOrder,applyUpgrade} from '@/lib/upgrades';
import {saveAddon,orderAddon,applyAddon} from '@/lib/addons';
import {creditSummary,grantCredit,reserveCredit,useReservation} from '@/lib/vendor-credits';
import {orgMembers,saveOrgMember} from '@/lib/organization-members';
export const runtime='nodejs';
export const maxDuration=300;
export const dynamic='force-dynamic';
const ok=(data:any,status=200)=>NextResponse.json({data},{status,headers:{'Cache-Control':'no-store'}});
async function body(req:Request,maxBytes=200000){return JSON.parse((await limitedBody(req,maxBytes)).toString()||'{}')}
async function event(id:string){uuid.parse(id);return await one('SELECT * FROM events WHERE id=$1',[id])||fail('NOT_FOUND','Acara tidak ditemukan.',404)}
async function orderAccess(id:string){uuid.parse(id);const u=await requireUser(),o=await one('SELECT * FROM orders WHERE id=$1',[id]);if(!o)fail('NOT_FOUND','Pesanan tidak ditemukan.',404);if(o.user_id!==u.id&&u.role!=='superadmin'&&!(u.role==='designer'&&o.designer_id===u.id)&&!(o.org_id&&await one("SELECT o.id FROM organizations o LEFT JOIN members m ON m.org_id=o.id AND m.user_id=$2 WHERE o.id=$1 AND (o.owner_id=$2 OR m.permissions ? 'billing_view')",[o.org_id,u.id])))fail('FORBIDDEN','Tidak memiliki akses pesanan.',403);return {u,o};}
async function managedEdit(id:string,permission='edit'){const u=await requireUser(),e=await event(id);await eventAccess(u,e,permission);return {u,e};}
async function rate(req:Request,key:string,max=100){
 const ip=req.headers.get('x-forwarded-for')?.split(',')[0]||'local';const c=await cookies();const k=hash(ip+key+(c.get('kv_session')?.value||c.get('kv_guest')?.value||c.get('kv_device')?.value||''));
 const r=await one("INSERT INTO rate_limits(key,hits,reset_at) VALUES($1,1,now()+interval '1 minute') ON CONFLICT(key) DO UPDATE SET hits=CASE WHEN rate_limits.reset_at<now() THEN 1 ELSE rate_limits.hits+1 END,reset_at=CASE WHEN rate_limits.reset_at<now() THEN now()+interval '1 minute' ELSE rate_limits.reset_at END RETURNING hits",[k]);if(r.hits>max)fail('RATE_LIMITED','Terlalu banyak permintaan. Coba lagi sebentar.',429);
}
async function handler(req:NextRequest,ctx:{params:Promise<{path:string[]}>}){
 const requestId=uid();try{
 if(process.env.VERCEL)after(async()=>{await processJobs(2)});else startWorker();const p=(await ctx.params).path.join('/'),method=req.method,url=new URL(req.url);
 if(!['GET','HEAD'].includes(method)){
  const origin=req.headers.get('origin');const host=req.headers.get('host');const sameOrigin=origin&&(origin===url.origin||origin===process.env.APP_URL||new URL(origin).host===host&&new URL(origin).protocol===url.protocol);if(origin&&!sameOrigin)fail('CSRF_REJECTED','Asal permintaan tidak diizinkan.',403);
  await rate(req,p.startsWith('auth')?'auth':p.startsWith('guest')?'guest':'mutation',p.startsWith('auth')?25:240);
 }
 if(p==='catalog/plans'&&method==='GET')return ok(await rows('SELECT id,name,price,config,version,partner_price FROM plans ORDER BY price'));
 if(p==='catalog/partner-pricing')return ok({status:'UNDECIDED',message:'Hubungi Admin untuk Harga Mitra',plans:await rows('SELECT id,name,partner_price FROM plans')});
 if(p==='templates'&&method==='GET'){await requireUser();return ok(await rows('SELECT * FROM templates ORDER BY created_at'));}
 if(p==='frame-capabilities'&&method==='GET'){await requireUser();return ok(FRAME_CAPABILITIES);}
 if(p==='frame-library'&&method==='GET'){
  const u=await requireUser(),q='%'+(url.searchParams.get('q')||'').slice(0,100)+'%',page=Math.floor(Math.max(1,Number(url.searchParams.get('page'))||1));
  const items=await rows("SELECT DISTINCT f.*,e.name AS event_name FROM frames f JOIN events e ON e.id=f.event_id LEFT JOIN orders o ON o.id=e.order_id LEFT JOIN organizations org ON org.id=e.org_id LEFT JOIN members m ON m.org_id=e.org_id AND m.user_id=$2 LEFT JOIN event_staff s ON s.event_id=e.id AND s.user_id=$2 WHERE (f.name ILIKE $3 OR e.name ILIKE $3) AND ($1='superadmin' OR ($1='designer' AND o.designer_id=$2) OR (e.channel='PARTNER_SELF_SERVICE' AND (org.owner_id=$2 OR m.permissions ? 'event_edit' OR s.permissions ? 'event_edit'))) ORDER BY f.updated_at DESC,f.id LIMIT 21 OFFSET $4",[u.role,u.id,q,(page-1)*20]);return ok({items:items.slice(0,20).map(frameResponse),hasMore:items.length>20,page,role:u.role,capabilities:FRAME_CAPABILITIES});
 }
 if(p==='catalog/addons'&&method==='GET'){await requireUser();return ok(await rows('SELECT * FROM addon_catalog WHERE enabled=true ORDER BY name'));}
 if(p==='admin/addons'&&method==='GET'){await admin();return ok(await rows('SELECT * FROM addon_catalog ORDER BY name'));}
 if(p==='admin/addons'&&method==='POST')return ok(await saveAddon(await admin(),await body(req)));
 if(p==='admin/credits/status'&&method==='GET'){await admin();return ok({enabled:process.env.VENDOR_CREDITS_ENABLED==='true'});}
 if(p==='admin/credits/grants'&&method==='POST')return ok(await grantCredit(await admin(),await body(req)));
 const creditRoute=p.match(/^partner\/organizations\/([\w-]+)\/credits(?:\/([\w-]+)\/(redeem|release|refund))?$/);
 if(creditRoute){const u=await requireUser();if(method==='GET')return ok(await creditSummary(u,creditRoute[1]));if(method==='POST')return ok(creditRoute[2]?await useReservation(u,creditRoute[1],creditRoute[2],creditRoute[3] as 'redeem'|'release'|'refund',await body(req)):await reserveCredit(u,creditRoute[1],await body(req)));}
 const memberRoute=p.match(/^partner\/organizations\/([\w-]+)\/members$/);
 if(memberRoute){const u=await requireUser();if(method==='GET')return ok(await orgMembers(u,memberRoute[1]));if(method==='POST')return ok(await saveOrgMember(u,memberRoute[1],await body(req)));}
 if(p==='admin/notifications'&&method==='GET'){await admin();return ok({enabled:process.env.NOTIFICATIONS_ENABLED==='true',configured:!!process.env.EMAIL_PROVIDER_URL&&!!process.env.EMAIL_PROVIDER_TOKEN,templates:await rows('SELECT * FROM notification_templates ORDER BY id'),outbox:await rows('SELECT id,template_id,state,attempts,error,created_at,sent_at FROM notification_outbox ORDER BY created_at DESC LIMIT 100')});}
 if(p==='admin/notifications'&&method==='POST'){const u=await admin(),b=z.object({id:z.string().max(80),subject:z.string().min(1).max(200),body:z.string().min(1).max(10000),enabled:z.boolean()}).parse(await body(req));await rows('UPDATE notification_templates SET subject=$2,body=$3,enabled=$4,version=version+1 WHERE id=$1',[b.id,b.subject,b.body,b.enabled]);await audit(u.id,'notification.template',{id:b.id,enabled:b.enabled});return ok({saved:true});}
 const outboxRetry=p.match(/^admin\/notifications\/([\w-]+)\/retry$/);
 if(outboxRetry&&method==='POST'){await admin();await rows("UPDATE notification_outbox SET state='queued',attempts=0,error=NULL,next_attempt_at=now() WHERE id=$1 AND state='failed'",[uuid.parse(outboxRetry[1])]);return ok({queued:true});}
 const moduleRoute=p.match(/^admin\/modules\/(overview|fulfillment|payments|events|partners|moderation|analytics|operations)$/);
 if(moduleRoute&&method==='GET')return ok(await adminQuery(moduleRoute[1],await requireUser(),url));
 if(p==='admin/team'&&method==='GET'){await admin();return ok({users:await rows("SELECT id,name,role FROM users WHERE role IN ('superadmin','designer') ORDER BY name")});}
 const taskRoute=p.match(/^admin\/tasks\/([\w-]+)$/);
 if(taskRoute&&method==='PATCH')return ok(await updateTask(taskRoute[1],await requireUser(),await body(req)));
 const adjustmentRoute=p.match(/^admin\/payments\/([\w-]+)\/adjustments$/);
 if(adjustmentRoute&&method==='POST')return ok(await paymentAdjustment(adjustmentRoute[1],await requireUser(),await body(req)));
 const frameImportRoute=p.match(/^events\/([\w-]+)\/frames\/import$/);
 if(frameImportRoute&&method==='POST'){
  const {u,e}=await managedEdit(frameImportRoute[1],'frame');if(!e.snapshot.frames)fail('PLAN_FEATURE_UNAVAILABLE','Mini tidak menyediakan frame.',403);
  const target=url.searchParams.get('id')?{id:uuid.parse(url.searchParams.get('id')),expectedVersion:z.coerce.number().int().min(1).parse(url.searchParams.get('expectedVersion'))}:undefined;
  return ok(await importFrame(e,u,new Uint8Array(await limitedBody(req,128*1024**2)),target),201);
 }
 const frameRoute=p.match(/^events\/([\w-]+)\/frames\/([\w-]+)(?:\/(revisions|export|validate|preview))?$/);
 if(frameRoute&&method==='GET'){
  const {u,e}=await managedEdit(frameRoute[1],'frame');if(!e.snapshot.frames)fail('PLAN_FEATURE_UNAVAILABLE','Mini tidak menyediakan frame.',403);
  const f=await one('SELECT * FROM frames WHERE id=$1 AND event_id=$2',[uuid.parse(frameRoute[2]),e.id]);if(!f)fail('NOT_FOUND','Frame tidak ditemukan.',404);
  if(frameRoute[3]==='revisions')return ok(await rows('SELECT id,version,name,schema,created_at FROM frame_revisions WHERE frame_id=$1 AND event_id=$2 ORDER BY version DESC LIMIT 20',[f.id,e.id]));
  if(frameRoute[3]==='validate')return ok(frameResponse(f));
  if(frameRoute[3]==='preview')return ok({document:toFrameDocument(f.schema),version:f.version,capabilities:FRAME_CAPABILITIES,validation:validateFrame(toFrameDocument(f.schema))});
  if(frameRoute[3]==='export'){
   if(['zip','moka'].includes(url.searchParams.get('format')||'')){
    const files:Record<string,Uint8Array>={};for(const id of frameAssetIds(f.schema)){const a=await one('SELECT * FROM frame_assets WHERE id=$1 AND event_id=$2',[id,e.id]);if(!a)fail('MISSING_FRAME_ASSET','Aset ekspor tidak tersedia.',409);files['assets/'+id+'.png']=new Uint8Array(await storage.get(a.object_key));}
    return new Response(new Uint8Array(createFramePackage(f.name,toFrameDocument(f.schema),files)),{headers:{'Content-Type':'application/zip','Content-Disposition':'attachment; filename="frame.'+(url.searchParams.get('format')||'zip')+'"','Cache-Control':'private,no-store'}});
   }
   return new Response(JSON.stringify(frameEnvelope(f.name,toFrameDocument(f.schema)),null,2),{headers:{'Content-Type':'application/json','Content-Disposition':'attachment; filename="frame.json"','Cache-Control':'private,no-store'}});
  }
  return ok(frameResponse(f));
 }
 if(p==='public/preview/read'&&method==='POST'){
  const b=z.object({token:z.string().min(32).max(128)}).parse(await body(req)),preview=await one('SELECT snapshot FROM preview_tokens WHERE token_hash=$1 AND revoked=false AND expires_at>now()',[hash(b.token)]);if(!preview)fail('PREVIEW_EXPIRED','Pratinjau tidak valid atau kedaluwarsa.',410);return ok(preview.snapshot);
 }
 const coverMatch=p.match(/^event-covers\/([\w-]+)$/);
 if(coverMatch&&method==='GET'){
  const asset=await one('SELECT * FROM event_assets WHERE id=$1',[uuid.parse(coverMatch[1])]);if(!asset)fail('NOT_FOUND','Sampul tidak ditemukan.',404);const e=await event(asset.event_id);let allowed=e.published?.settings.coverAssetId===asset.id;const u=await currentUser();if(u)try{await eventAccess(u,e);allowed=true}catch{}
  if(!allowed&&url.searchParams.get('preview')){const preview=await one('SELECT snapshot FROM preview_tokens WHERE token_hash=$1 AND event_id=$2 AND revoked=false AND expires_at>now()',[hash(url.searchParams.get('preview')!),e.id]);allowed=preview?.snapshot.event.settings.coverAssetId===asset.id;}
  if(!allowed)fail('FORBIDDEN','Sampul belum dipublikasikan.',403);return new Response(new Uint8Array(await storage.get(asset.object_key)),{headers:{'Content-Type':asset.mime,'Cache-Control':'private,no-store'}});
 }
 if(p==='admin/templates'&&method==='POST'){const u=await admin(),b=await body(req),schema=parseFrame(b.schema);if(frameAssetIds(schema).length)fail('TEMPLATE_ASSET_SCOPE','Template global harus bebas aset privat acara.');const id=uid();await rows('INSERT INTO templates(id,name,schema,created_by) VALUES($1,$2,$3,$4)',[id,z.string().min(1).max(100).parse(b.name),json(schema),u.id]);await audit(u.id,'template.create',{id});return ok({id},201);}
 let assetMatch=p.match(/^frame-assets\/([\w-]+)$/);
 if(assetMatch&&method==='GET'){const asset=await one('SELECT * FROM frame_assets WHERE id=$1',[uuid.parse(assetMatch[1])]);if(!asset)fail('NOT_FOUND','Aset tidak ditemukan.',404);const e=await event(asset.event_id);let allowed=false;const u=await currentUser();if(u)try{await eventAccess(u,e,'view');allowed=true}catch{}if(!allowed)allowed=!!e.published?.frames.some((f:any)=>frameAssetIds(f.schema).includes(asset.id));if(!allowed&&url.searchParams.get('preview')){const preview=await one('SELECT snapshot FROM preview_tokens WHERE token_hash=$1 AND event_id=$2 AND revoked=false AND expires_at>now()',[hash(url.searchParams.get('preview')!),e.id]);allowed=!!preview?.snapshot.frames.some((f:any)=>frameAssetIds(f.schema).includes(asset.id));}if(!allowed)try{const session=await guestSession(e.id);allowed=!!session.snapshot.frames.some((f:any)=>frameAssetIds(f.schema).includes(asset.id));}catch{}if(!allowed)fail('FORBIDDEN','Aset belum dipublikasikan.',403);return new Response(new Uint8Array(await storage.get(asset.object_key)),{headers:{'Content-Type':'image/png','Cache-Control':'private,no-store'}});}
 if(p==='auth/me')return ok(await currentUser());
 if(p==='personal/events'&&method==='POST'){
  const u=await admin();if(process.env.APP_MODE!=='personal')fail('PERSONAL_MODE_DISABLED','Mode acara pribadi belum aktif.',403);
  const b=z.object({name:z.string().min(2).max(100),startAt:z.iso.datetime({offset:true}),endAt:z.iso.datetime({offset:true}),guests:z.number().int().min(1).max(1000).default(100),perGuest:z.number().int().min(1).max(50).default(15),openNow:z.boolean().default(false),slug:z.string().min(3).max(80).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).optional(),hashtag:z.string().max(60).default('')}).refine(value=>new Date(value.endAt)>=new Date(value.startAt),'Waktu selesai harus setelah mulai.').parse(await body(req));
  const plan=await one("SELECT config FROM plans WHERE id='signature'");if(!plan)fail('CATALOGUE_MISSING','Katalog belum tersedia.',503);
  const snapshot={...plan.config,guests:b.guests,perGuest:b.perGuest,photos:b.guests*b.perGuest,storage:10*1024**3,voice:b.guests,video:b.guests,frames:1,notes:b.guests*3,voiceSec:30,videoSec:15,creative:false},settings={...defaultSettings(snapshot),theme:'maroon-romance',headline:'Satu hari istimewa, dikenang bersama. Bagikan momen dan doa hangatmu di sini.',timestamp:true,hashtag:b.hashtag};
  const eventId=uid(),orderId=uid(),frameId=uid(),slug=b.slug||b.name.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,65)+'-'+eventId.slice(0,8),frame={...presetFrame(4),background:'#F9F6F0',textColor:'#6A0C12',text:b.name};
  if(await one('SELECT 1 FROM events WHERE slug=$1',[slug]))fail('SLUG_EXISTS','Alamat acara sudah digunakan.',409);
  await (await database()).transaction(async tx=>{
   await tx.query("INSERT INTO orders(id,user_id,channel,plan_id,amount,snapshot,brief,status,fulfillment) VALUES($1,$2,'DIRECT_MANAGED','signature',0,$3,$4,'complimentary','in_preparation')",[orderId,u.id,json(snapshot),json({name:b.name,contact:u.email,startAt:b.startAt,endAt:b.endAt,timezone:'Asia/Jakarta',personal:true,notes:'Acara pribadi pemilik; tanpa transaksi pembayaran.'})]);
   await tx.query("INSERT INTO events(id,order_id,org_id,customer_id,channel,slug,name,start_at,end_at,timezone,status,snapshot,settings,personal) VALUES($1,$2,'00000000-0000-4000-8000-000000000001',$3,'DIRECT_MANAGED',$4,$5,$6,$7,'Asia/Jakarta','draft',$8,$9,true)",[eventId,orderId,u.id,slug,b.name,b.startAt,b.endAt,json(snapshot),json(settings)]);
   await tx.query('INSERT INTO frames(id,event_id,name,schema) VALUES($1,$2,$3,$4)',[frameId,eventId,'Maroon Moments',json(frame)]);
  });await audit(u.id,'personal.event.create',{orderId},eventId);await publish(u,await event(eventId),'Aktivasi acara pribadi oleh pemilik');if(b.openNow){await rows("UPDATE events SET status='live' WHERE id=$1",[eventId]);await audit(u.id,'personal.event.open-now',{},eventId);}return ok({id:eventId,slug},201);
 }
 if(p==='auth/accept-invitation'&&method==='POST'){
  const u=await requireUser(),b=z.object({token:z.string().min(32).max(128)}).parse(await body(req));
  const invitation=await (await database()).transaction(async tx=>{
   const invite=await one('SELECT * FROM staff_invitations WHERE token_hash=$1 FOR UPDATE',[hash(b.token)],tx);
   if(!invite||invite.revoked||new Date(invite.expires_at)<new Date())fail('INVITATION_EXPIRED','Undangan tidak valid atau kedaluwarsa.',410);
   if(invite.email!==u.email.toLowerCase())fail('INVITATION_EMAIL_MISMATCH','Masuk menggunakan email penerima undangan.',403);
   if(!invite.accepted_at){await tx.query('INSERT INTO event_staff(event_id,user_id,permissions) VALUES($1,$2,$3) ON CONFLICT(event_id,user_id) DO UPDATE SET permissions=EXCLUDED.permissions',[invite.event_id,u.id,json(invite.permissions)]);await tx.query('UPDATE staff_invitations SET accepted_at=now() WHERE id=$1',[invite.id]);}
   return invite;
  });await audit(u.id,'event.invitation.accept',{invitationId:invitation.id},invitation.event_id);return ok({eventId:invitation.event_id});
 }
 if(p==='auth/recovery'&&method==='POST'){
  if(process.env.AUTH_PROVIDER!=='supabase')fail('AUTH_PROVIDER_NOT_CONFIGURED','Pemulihan email belum tersedia. Hubungi penyelenggara.',503);
  const b=z.object({email:z.email().max(150)}).parse(await body(req));await providerRecovery(b.email.toLowerCase());return ok({requested:true});
 }
 if(p==='auth/reset-password'&&method==='POST'){
  if(process.env.AUTH_PROVIDER!=='supabase')fail('AUTH_PROVIDER_NOT_CONFIGURED','Pemulihan email belum tersedia.',503);
  const b=z.object({accessToken:z.string().min(1).max(8192),refreshToken:z.string().min(1).max(8192),password:z.string().min(12).max(128)}).parse(await body(req));
  const remote=await providerReset(b.accessToken,b.refreshToken,b.password),u=await one('SELECT id FROM users WHERE auth_provider_id=$1',[remote.id]);
  if(u){await rows('DELETE FROM sessions WHERE user_id=$1',[u.id]);await audit(u.id,'auth.password-reset');}(await cookies()).delete('kv_session');return ok({updated:true});
 }
 if(p==='auth/logout'&&method==='POST'){const c=await cookies(),t=c.get('kv_session')?.value;if(t)await rows('DELETE FROM sessions WHERE token_hash=$1',[hash(t)]);c.delete('kv_session');return ok({loggedOut:true});}
 if(p==='auth/register'&&method==='POST'){
  const b=z.object({name:z.string().min(2).max(100),email:z.email().max(150),password:z.string().min(12).max(128),channel:z.enum(['buyer','partner'])}).parse(await body(req));
  if(await one('SELECT 1 FROM users WHERE email=$1',[b.email.toLowerCase()]))fail('EMAIL_EXISTS','Email sudah terdaftar.',409);
  const remote=process.env.AUTH_PROVIDER==='supabase'?await providerRegister(b.email.toLowerCase(),b.password,b.name):null;
  const id=uid();await rows('INSERT INTO users(id,email,password_hash,name,role,auth_provider_id) VALUES($1,$2,$3,$4,$5,$6)',[id,b.email.toLowerCase(),remote?'provider:supabase':passwordHash(b.password),b.name,b.channel,remote?.user.id||null]);if(!remote?.needsConfirmation)await setSession(id);return ok({id,needsConfirmation:remote?.needsConfirmation||false},201);
 }
 if(p==='auth/login'&&method==='POST'){
  const b=z.object({email:z.email(),password:z.string().max(128)}).parse(await body(req));let u;
  if(process.env.AUTH_PROVIDER==='supabase'){
   const remote=await providerLogin(b.email.toLowerCase(),b.password);
   u=await one('SELECT * FROM users WHERE auth_provider_id=$1',[remote.id]);
   if(!u){
    u=await one('SELECT * FROM users WHERE email=$1',[b.email.toLowerCase()]);
    if(u?.auth_provider_id&&u.auth_provider_id!==remote.id)fail('LOGIN_FAILED','Identitas akun tidak cocok.',401);
    if(u)await rows('UPDATE users SET auth_provider_id=$2 WHERE id=$1',[u.id,remote.id]);
    else u=await one("INSERT INTO users(id,email,password_hash,name,role,auth_provider_id) VALUES($1,$2,'provider:supabase',$3,'buyer',$4) ON CONFLICT(auth_provider_id) DO UPDATE SET auth_provider_id=EXCLUDED.auth_provider_id RETURNING *",[uid(),remote.email!.toLowerCase(),remote.user_metadata?.display_name||'Pengguna',remote.id]);
   }
  }else{
   u=await one('SELECT * FROM users WHERE email=$1',[b.email.toLowerCase()]);
   if(u&&!verifyPassword(b.password,u.password_hash))fail('LOGIN_FAILED','Email atau kata sandi salah.',401);
  }
  if(!u)fail('LOGIN_FAILED','Email atau kata sandi salah.',401);await setSession(u.id);return ok({id:u.id,role:u.role,name:u.name,personalMode:process.env.APP_MODE==='personal'});
 }
 if(p==='dashboard'&&method==='GET'){
  const u=await requireUser(),page=Math.max(1,Math.min(100000,Number(url.searchParams.get('page'))||1));const params=u.role==='superadmin'?[]:[u.id];
  let orderSQL=u.role==='superadmin'?'SELECT * FROM orders':u.role==='designer'?'SELECT * FROM orders WHERE designer_id=$1':"SELECT * FROM orders WHERE user_id=$1 OR EXISTS(SELECT 1 FROM members m WHERE m.org_id=orders.org_id AND m.user_id=$1 AND m.permissions ? 'billing_view')";
  let eventSQL=u.role==='superadmin'?'SELECT * FROM events':u.role==='designer'?'SELECT e.* FROM events e JOIN orders o ON o.id=e.order_id WHERE o.designer_id=$1':'SELECT DISTINCT e.* FROM events e LEFT JOIN organizations o ON o.id=e.org_id LEFT JOIN event_staff s ON s.event_id=e.id LEFT JOIN members m ON m.org_id=e.org_id AND m.user_id=$1 WHERE e.customer_id=$1 OR o.owner_id=$1 OR s.user_id=$1 OR (m.permissions ?| ARRAY[\'gallery_view\',\'event_edit\',\'media_moderate\',\'live_wall_view\',\'media_export\'])';
  const organization=url.searchParams.get('org');if(organization){uuid.parse(organization);if(u.role!=='superadmin'&&!await one('SELECT 1 FROM organizations o WHERE id=$1 AND (owner_id=$2 OR EXISTS(SELECT 1 FROM members m WHERE m.org_id=o.id AND m.user_id=$2))',[organization,u.id]))fail('FORBIDDEN','Organisasi tidak diizinkan.',403);params.push(organization);orderSQL=`SELECT * FROM (${orderSQL}) scoped_org WHERE org_id=$${params.length}`;eventSQL=`SELECT * FROM (${eventSQL}) scoped_org WHERE org_id=$${params.length}`;}
  const orderCounts=await one(`SELECT count(*)::int AS total,count(*) FILTER(WHERE status='payment_review')::int AS review FROM (${orderSQL}) scoped`,params),eventCounts=await one(`SELECT count(*)::int AS total,count(*) FILTER(WHERE status='live')::int AS live FROM (${eventSQL}) scoped`,params);
  const orders=await rows(`SELECT * FROM (${orderSQL}) scoped ORDER BY created_at DESC LIMIT $${params.length+1} OFFSET $${params.length+2}`,[...params,12,(page-1)*12]);const events=await rows(`SELECT * FROM (${eventSQL}) scoped ORDER BY created_at DESC LIMIT $${params.length+1} OFFSET $${params.length+2}`,[...params,12,(page-1)*12]);
  const orgs=await rows('SELECT o.*,o.owner_id=$1 AS is_owner,coalesce(m.permissions,\'[]\'::jsonb) AS delegated_permissions FROM organizations o LEFT JOIN members m ON m.org_id=o.id AND m.user_id=$1 WHERE o.owner_id=$1 OR m.user_id=$1',[u.id]);return ok({user:u,orders,events,organizations:orgs,features:{vendorCredits:process.env.VENDOR_CREDITS_ENABLED==='true',notifications:process.env.NOTIFICATIONS_ENABLED==='true'},counts:{orders:orderCounts.total,review:orderCounts.review,live:eventCounts.live,events:eventCounts.total},meta:{page,hasMore:Math.max(orderCounts.total,eventCounts.total)>page*12}});
 }
 if(p==='calendar'&&method==='GET'){
  const u=await requireUser(),month=z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/).parse(url.searchParams.get('month'));
  const from=new Date(month+'-01T00:00:00Z'),until=new Date(from);until.setUTCMonth(until.getUTCMonth()+1);const organization=url.searchParams.get('org')||null;if(organization)uuid.parse(organization);
  const events=await rows("SELECT DISTINCT e.id,e.name,e.start_at,e.end_at,e.timezone,e.status FROM events e LEFT JOIN organizations o ON o.id=e.org_id LEFT JOIN event_staff s ON s.event_id=e.id LEFT JOIN orders ord ON ord.id=e.order_id LEFT JOIN members mem ON mem.org_id=e.org_id AND mem.user_id=$4 WHERE e.start_at<$3 AND e.end_at>=$2 AND ($1='superadmin' OR e.customer_id=$4 OR o.owner_id=$4 OR s.user_id=$4 OR mem.permissions ?| ARRAY['gallery_view','event_edit','media_moderate','live_wall_view','media_export'] OR ($1='designer' AND ord.designer_id=$4)) AND ($5::uuid IS NULL OR e.org_id=$5::uuid) ORDER BY e.start_at LIMIT 500",[u.role,from.toISOString(),until.toISOString(),u.id,organization]);return ok({events});
 }
 if(p==='partner/organizations'&&method==='POST'){
  const u=await requireUser();if(u.role!=='partner')fail('FORBIDDEN','Akun vendor diperlukan.',403);const b=z.object({name:z.string().min(2).max(100),tagline:z.string().max(180).default(''),primaryColor:z.string().regex(/^#[a-fA-F0-9]{6}$/).default('#682692')}).parse(await body(req));const id=uid();await rows('INSERT INTO organizations(id,owner_id,name,branding) VALUES($1,$2,$3,$4)',[id,u.id,b.name,json({tagline:b.tagline,primaryColor:b.primaryColor})]);return ok({id},201);
 }
 let organizationMatch=p.match(/^partner\/organizations\/([\w-]+)$/);
 if(organizationMatch&&method==='PATCH'){
  const u=await requireUser(),organization=await one('SELECT * FROM organizations WHERE id=$1 AND owner_id=$2',[uuid.parse(organizationMatch[1]),u.id]);if(!organization)fail('FORBIDDEN','Organisasi tidak diizinkan.',403);
  const b=z.object({name:z.string().min(2).max(100),tagline:z.string().max(180),primaryColor:z.string().regex(/^#[a-fA-F0-9]{6}$/)}).parse(await body(req));await rows('UPDATE organizations SET name=$2,branding=$3 WHERE id=$1',[organization.id,b.name,json({...organization.branding,tagline:b.tagline,primaryColor:b.primaryColor})]);await audit(u.id,'organization.branding',{organizationId:organization.id});return ok({saved:true});
 }
 if(p==='direct/orders'||p==='partner/orders'){
  if(method==='GET'){const u=await requireUser();return ok(await rows('SELECT * FROM orders WHERE user_id=$1 ORDER BY created_at DESC',[u.id]));}
  if(method==='POST'){
   const u=await requireUser(),b=await body(req);if(b.terms!==true)fail('CONSENT_REQUIRED','Persetujuan ketentuan diperlukan.');const brief=briefSchema.parse(b.brief),plan=await one('SELECT * FROM plans WHERE id=$1',[String(b.planId)]);if(!plan)fail('INVALID_PLAN','Paket tidak ditemukan.');
   let org=null;const partner=p.startsWith('partner');if(partner){org=await one('SELECT * FROM organizations WHERE id=$1 AND owner_id=$2',[uuid.parse(b.orgId),u.id]);if(!org)fail('FORBIDDEN','Organisasi tidak diizinkan.',403);if(plan.partner_price===null)fail('PARTNER_PRICING_UNDECIDED','Harga mitra belum ditetapkan. Hubungi admin.',409);}
   if(!plan.config.frames&&(b.frames||b.frame||b.layout))fail('PLAN_FEATURE_UNAVAILABLE','Mini tidak menyediakan frame.',403);
   const id=uid();await rows('INSERT INTO orders(id,user_id,org_id,channel,plan_id,amount,snapshot,brief) VALUES($1,$2,$3,$4,$5,$6,$7,$8)',[id,u.id,org?.id||null,partner?'PARTNER_SELF_SERVICE':'DIRECT_MANAGED',plan.id,partner?plan.partner_price:plan.price,json(plan.config),json(brief)]);await audit(u.id,'order.create',{orderId:id});return ok({id},201);
  }
 }
 let m=p.match(/^(?:direct\/orders|orders)\/([\w-]+)(?:\/(.+))?$/);
 if(m){const {u,o}=await orderAccess(m[1]),action=m[2];const e=await one('SELECT * FROM events WHERE order_id=$1 OR id=$2',[o.id,o.brief.upgradeEventId||o.brief.addonEventId||null]);
  if(method==='GET'&&!action)return ok({order:o,event:e,timeline:await rows("SELECT id,action,detail,created_at FROM audit WHERE detail->>'orderId'=$1 ORDER BY created_at DESC LIMIT 100",[o.id]),adjustments:await rows('SELECT kind,amount,reason,reference,created_at FROM payment_adjustments WHERE order_id=$1 ORDER BY created_at',[o.id]),requests:await rows('SELECT * FROM requests WHERE order_id=$1 ORDER BY created_at DESC',[o.id]),documents:(await rows('SELECT id,kind,mime,bytes FROM documents WHERE order_id=$1',[o.id])),payment:{configured:!!process.env.PAYMENT_BANK_ACCOUNT,bank:process.env.PAYMENT_BANK_LABEL||'Transfer belum dikonfigurasi',account:process.env.PAYMENT_BANK_ACCOUNT||null,owner:process.env.PAYMENT_BANK_OWNER||null,development:process.env.NODE_ENV!=='production'}});
  if(['assets','payment-proof'].includes(action)&&method==='POST'){
   if(u.id!==o.user_id&&u.role!=='superadmin'&&!(u.role==='designer'&&o.designer_id===u.id&&action==='assets'))fail('FORBIDDEN','Izin membaca tagihan tidak memberikan hak mengubah bahan atau bukti pembayaran.',403);
   const mime=req.headers.get('content-type')?.split(';')[0]||'';if(!['image/jpeg','image/png','image/webp','application/pdf'].includes(mime))fail('UNSUPPORTED_MEDIA','Gunakan JPG, PNG, WebP, atau PDF.',415);const file=await limitedBody(req,8*1024**2);if(!file.length)fail('INVALID_MEDIA','Berkas kosong.');
   if(mime==='application/pdf'&&!file.subarray(0,5).equals(Buffer.from('%PDF-')))fail('INVALID_MEDIA','PDF tidak valid.',415);if(mime.startsWith('image/'))await inspect(file,'disposable_photo',0);
   const id=uid(),key='orders/'+o.id+'/'+id;await storage.put(key,file,mime);
   try{await (await database()).transaction(async tx=>{const fresh=await one('SELECT * FROM orders WHERE id=$1 FOR UPDATE',[o.id],tx);if(action==='payment-proof'&&!['awaiting_payment','payment_review','payment_rejected','rejected'].includes(fresh.status))fail('PAYMENT_STATE_CONFLICT','Pesanan sudah diselesaikan atau ditutup; bukti tidak dapat diubah.',409);if(action==='payment-proof'&&fresh.status!=='payment_review'&&new Date(fresh.payment_expires_at)<new Date())fail('PAYMENT_EXPIRED','Batas pembayaran sudah lewat.',409);await tx.query('INSERT INTO documents(id,order_id,kind,object_key,mime,bytes) VALUES($1,$2,$3,$4,$5,$6)',[id,o.id,action,key,mime,file.length]);if(action==='payment-proof')await tx.query("UPDATE orders SET status='payment_review' WHERE id=$1",[o.id]);});}catch(err){await storage.remove(key);throw err;}await audit(u.id,'order.'+action,{orderId:o.id});return ok({id});
  }
  if(['revision-requests','corrections'].includes(action)&&method==='POST'){
   if(u.id!==o.user_id)fail('FORBIDDEN','Permintaan revisi atau koreksi harus dikirim pembeli.',403);
   const b=z.object({message:z.string().min(3).max(2000)}).parse(await body(req));if(!['preview_ready','revision_requested'].includes(o.fulfillment))fail('PREVIEW_NOT_READY','Preview belum siap.',409);
   await (await database()).transaction(async tx=>{const order=await one('SELECT * FROM orders WHERE id=$1 FOR UPDATE',[o.id],tx);if(action==='revision-requests'&&order.revision_count>=order.snapshot.revisions)fail('REVISION_LIMIT','Jatah revisi paket sudah habis. Koreksi kesalahan data tetap dapat diajukan.',409);await tx.query('INSERT INTO requests(id,order_id,user_id,kind,message) VALUES($1,$2,$3,$4,$5)',[uid(),o.id,u.id,action==='corrections'?'correction':'revision',b.message]);await tx.query("UPDATE orders SET fulfillment='revision_requested',revision_count=revision_count+$2 WHERE id=$1",[o.id,action==='corrections'?0:1]);});return ok({requested:true});
  }
  if(action==='approve-preview'&&method==='POST'){if(u.id!==o.user_id)fail('FORBIDDEN','Persetujuan harus diberikan pembeli. Admin dapat memakai override beralasan saat publish.',403);if(o.fulfillment!=='preview_ready')fail('PREVIEW_NOT_READY','Preview belum siap.',409);await rows("UPDATE orders SET fulfillment='client_approved' WHERE id=$1",[o.id]);await audit(u.id,'preview.approve',{orderId:o.id},e?.id);return ok({approved:true});}
  if(action==='preview'&&method==='GET'){if(!e||!['preview_ready','revision_requested','client_approved','delivered'].includes(o.fulfillment))fail('PREVIEW_NOT_READY','Preview belum tersedia.',409);return ok({event:e,frames:await rows('SELECT * FROM frames WHERE event_id=$1',[e.id])});}
 }
 if(p==='admin/orders'||p==='admin/fulfillment'){const u=await requireUser();if(!['superadmin','designer'].includes(u.role))fail('FORBIDDEN','Akses ditolak.',403);return ok(await rows('SELECT * FROM orders '+(u.role==='designer'?'WHERE designer_id=$1 ':'')+'ORDER BY created_at DESC',u.role==='designer'?[u.id]:[]));}
 m=p.match(/^admin\/(?:orders|fulfillment)\/([\w-]+)\/(verify|reject|assign|prepare|send-preview|resolve-revision|publish|request-assets)$/);
 if(m&&method==='POST'){
  const {u,o}=await orderAccess(m[1]),b=await body(req),action=m[2];if(['verify','reject','assign'].includes(action))await admin();else if(u.role!=='superadmin'&&!(u.role==='designer'&&o.designer_id===u.id))fail('FORBIDDEN','Tindakan khusus tim Komukuna.',403);
  if(action==='verify'||action==='reject')await reviewPayment(o.id,u.id,action,b.reason);
  if(action==='assign'){uuid.parse(b.designerId);if(!(await one("SELECT 1 FROM users WHERE id=$1 AND role IN ('designer','superadmin')",[b.designerId])))fail('INVALID_DESIGNER','Desainer tidak valid.');await rows('UPDATE orders SET designer_id=$2 WHERE id=$1',[o.id,b.designerId]);}
  if(action==='request-assets')await rows("UPDATE orders SET fulfillment='assets_requested' WHERE id=$1",[o.id]);
  if(action==='prepare'){
   if(o.status!=='paid')fail('PAYMENT_PENDING','Pembayaran belum diverifikasi.',409);
   if(o.brief.upgradeEventId||o.brief.addonEventId)fail('UPGRADE_ORDER','Terapkan paket melalui tindakan upgrade acara.',409);
   await createEvent(o);await rows("UPDATE orders SET fulfillment='in_preparation' WHERE id=$1",[o.id]);
  }
  const e=await one('SELECT * FROM events WHERE order_id=$1',[o.id]);
  if(action==='send-preview'||action==='resolve-revision'){if(!e||o.status!=='paid')fail('EVENT_NOT_READY','Siapkan event berbayar terlebih dahulu.',409);if(action==='resolve-revision')await rows("UPDATE requests SET status='resolved' WHERE order_id=$1 AND status='open'",[o.id]);await rows("UPDATE orders SET fulfillment='preview_ready' WHERE id=$1",[o.id]);}
  if(action==='publish'){if(!e)fail('EVENT_NOT_READY','Siapkan event terlebih dahulu.',409);await publish(u,e,b.reason);}
  await audit(u.id,'fulfillment.'+action,{orderId:o.id,reason:b.reason||null},e?.id);return ok({done:true,eventId:e?.id});
 }
 if(p==='partner/events'&&method==='POST'){
  const u=await requireUser(),b=await body(req),o=await one('SELECT * FROM orders WHERE id=$1 AND user_id=$2',[uuid.parse(b.orderId),u.id]);if(!o||o.channel!=='PARTNER_SELF_SERVICE')fail('FORBIDDEN','Pesanan vendor diperlukan.',403);if(o.status!=='paid')fail('PAYMENT_PENDING','Pembayaran belum diverifikasi.',409);return ok(await createEvent(o),201);
 }
 m=p.match(/^(?:partner\/events|events|admin\/events)\/([\w-]+)(?:\/(.+))?$/);
 if(m){const e=await event(m[1]),a=m[2],u=await requireUser();
  if(method==='GET'&&!a){await eventAccess(u,e);const permission=await getPermissions(u,e);return ok({event:e,frames:await rows('SELECT * FROM frames WHERE event_id=$1',[e.id]),usage:await usage(e.id),permissions:permission,staff:permission.edit?await rows('SELECT s.*,u.email,u.name FROM event_staff s JOIN users u ON u.id=s.user_id WHERE event_id=$1',[e.id]):[],invitations:permission.edit?await rows('SELECT id,email,permissions,expires_at FROM staff_invitations WHERE event_id=$1 AND accepted_at IS NULL AND revoked=false AND expires_at>now()',[e.id]):[]});}
  if(a==='staff-invitations'&&method==='POST'){
   if(u.role!=='superadmin'&&!await one('SELECT 1 FROM organizations WHERE id=$1 AND owner_id=$2',[e.org_id,u.id]))fail('FORBIDDEN','Hanya pemilik organisasi dapat mencabut undangan.',403);
   const b=z.object({id:uuid}).parse(await body(req));await rows('UPDATE staff_invitations SET revoked=true WHERE id=$1 AND event_id=$2',[b.id,e.id]);await audit(u.id,'event.invitation.revoke',{invitationId:b.id},e.id);return ok({revoked:true});
  }
  if(a==='couple-access'&&method==='GET'){await eventAccess(u,e,'edit');return ok(await coupleAccessStatus(e.id));}
  if(a==='couple-access'&&method==='POST'){
   await eventAccess(u,e,'edit');const b=z.object({enabled:z.boolean(),code:coupleCodeSchema.optional()}).parse(await body(req));
   await configureCoupleAccess(e.id,b.code,b.enabled);await audit(u.id,'event.couple-access',{enabled:b.enabled},e.id);return ok({saved:true,enabled:b.enabled});
  }
  if(a==='couple-access'&&method==='DELETE'){
   await eventAccess(u,e,'edit');await deleteCoupleAccess(e.id);await audit(u.id,'event.couple-access.delete',{},e.id);return ok({saved:true,enabled:false,configured:false});
  }
  if(a==='settings'&&method==='PATCH'){
   await eventAccess(u,e,'edit');const b=await body(req),s=settingsSchema.parse(b.settings),p=e.snapshot;
   if(s.perGuest>p.perGuest||s.videoSec>p.videoSec||s.voiceSec>p.voiceSec)fail('PLAN_LIMIT','Pengaturan melewati batas paket.',403);
   if(!p.frames&&s.modes.includes('photo_strip')||!p.creative&&s.modes.includes('gif'))fail('PLAN_FEATURE_UNAVAILABLE','Mode tidak tersedia pada paket.',403);
   if(s.revealAt&&!Number.isFinite(Date.parse(s.revealAt)))fail('INVALID_DATE','Tanggal reveal tidak valid.');
   if(s.coverAssetId&&!await one('SELECT 1 FROM event_assets WHERE id=$1 AND event_id=$2',[s.coverAssetId,e.id]))fail('INVALID_COVER','Sampul harus berasal dari acara ini.',403);
   const detail=z.object({name:z.string().min(2).max(100).optional(),startAt:z.iso.datetime({offset:true}).optional(),endAt:z.iso.datetime({offset:true}).optional(),timezone:z.string().max(80).optional()}).parse(b.detail||{});if(new Date(detail.endAt||e.end_at)<new Date(detail.startAt||e.start_at))fail('INVALID_DATE','Akhir acara harus setelah awal acara.');if(detail.timezone){try{new Intl.DateTimeFormat('id-ID',{timeZone:detail.timezone})}catch{fail('INVALID_TIMEZONE','Zona waktu tidak valid.')}}
   await rows('UPDATE events SET name=$2,start_at=$3,end_at=$4,timezone=$5,settings=$6,reveal_at=$7 WHERE id=$1',[e.id,detail.name||e.name,detail.startAt||e.start_at,detail.endAt||e.end_at,detail.timezone||e.timezone,json(s),s.revealAt]);await audit(u.id,'event.settings',{},e.id);return ok({saved:true});
  }
  if(a==='cover'&&method==='POST'){
   await eventAccess(u,e,'edit');const raw=await limitedBody(req,5*1024**2);await inspect(raw,'disposable_photo',0);const image=await sharp(raw,{limitInputPixels:16_000_000}).rotate().resize({width:1600,height:900,fit:'inside',withoutEnlargement:true}).jpeg({quality:82}).toBuffer();const id=uid(),key=e.id+'/covers/'+id;
   try{await (await database()).transaction(async tx=>{const locked=await one('SELECT * FROM events WHERE id=$1 FOR UPDATE',[e.id],tx),budget=await eventBudget(locked,tx);if(budget.bytes+image.length>locked.snapshot.storage)fail('STORAGE_QUOTA_EXCEEDED','Penyimpanan acara penuh.',409);await storage.put(key,image,'image/jpeg');await tx.query('INSERT INTO event_assets(id,event_id,object_key,mime,bytes) VALUES($1,$2,$3,$4,$5)',[id,e.id,key,'image/jpeg',image.length]);await tx.query("UPDATE events SET settings=jsonb_set(settings,'{coverAssetId}',to_jsonb($2::text),true) WHERE id=$1",[e.id,id]);});}catch(err){await storage.remove(key);throw err;}await audit(u.id,'event.cover',{assetId:id},e.id);return ok({id},201);
  }
  if(a==='preview-tokens'&&method==='POST'){
   await eventAccess(u,e,'edit');const b=await body(req);if(b.revoke){await rows('UPDATE preview_tokens SET revoked=true WHERE event_id=$1',[e.id]);return ok({revoked:true});}
   const previewToken=token(),frames=await rows('SELECT * FROM frames WHERE event_id=$1',[e.id]),snapshot={event:{id:e.id,slug:e.slug,name:e.name,start_at:e.start_at,timezone:e.timezone,settings:e.settings,snapshot:e.snapshot},frames};await rows("INSERT INTO preview_tokens(token_hash,event_id,snapshot,expires_at) VALUES($1,$2,$3,now()+interval '24 hours')",[hash(previewToken),e.id,json(snapshot)]);await audit(u.id,'event.preview.create',{},e.id);return ok({url:'/preview#'+previewToken},201);
  }
  if(a==='frame-assets'&&method==='GET'){await eventAccess(u,e,'frame');if(!e.snapshot.frames)fail('PLAN_FEATURE_UNAVAILABLE','Mini tidak menyediakan frame.',403);return ok(await rows('SELECT id,mime,bytes,created_at FROM frame_assets WHERE event_id=$1 ORDER BY created_at DESC LIMIT 100',[e.id]));}
  if(a==='frame-assets'&&method==='POST'){await eventAccess(u,e,'frame');if(!e.snapshot.frames)fail('PLAN_FEATURE_UNAVAILABLE','Mini tidak menyediakan frame.',403);const raw=await limitedBody(req,5*1024**2);await inspect(raw,'disposable_photo',0);const image=await sharp(raw,{limitInputPixels:36_000_000}).rotate().png().toBuffer().catch(()=>fail('INVALID_MEDIA','Aset gambar tidak valid.',415));const id=uid(),key=e.id+'/frame-assets/'+id;if(image.length>8*1024**2)fail('FILE_TOO_LARGE','Hasil gambar terlalu besar.',413);try{await (await database()).transaction(async tx=>{const current=await one('SELECT * FROM events WHERE id=$1 FOR UPDATE',[e.id],tx),budget=await eventBudget(current,tx);if(budget.bytes+image.length>current.snapshot.storage)fail('STORAGE_QUOTA_EXCEEDED','Penyimpanan acara penuh.',409);await storage.put(key,image,'image/png');await tx.query('INSERT INTO frame_assets(id,event_id,object_key,mime,bytes) VALUES($1,$2,$3,$4,$5)',[id,e.id,key,'image/png',image.length]);});}catch(err){await storage.remove(key);throw err;}return ok({id,url:'/api/v1/frame-assets/'+id},201);}
  if(a==='clone-template'&&method==='POST'){await eventAccess(u,e,'frame');if(!e.snapshot.frames)fail('PLAN_FEATURE_UNAVAILABLE','Mini tidak menyediakan frame.',403);const b=await body(req),template=await one('SELECT * FROM templates WHERE id=$1',[uuid.parse(b.templateId)]);if(!template)fail('NOT_FOUND','Template tidak ditemukan.',404);const id=uid();await (await database()).transaction(async tx=>{await tx.query('SELECT id FROM events WHERE id=$1 FOR UPDATE',[e.id]);if((await rows('SELECT 1 FROM frames WHERE event_id=$1',[e.id],tx)).length>=e.snapshot.frames)fail('FRAME_LIMIT','Jumlah frame mencapai paket. Gunakan template sebagai dasar frame yang ada.',409);await tx.query('INSERT INTO frames(id,event_id,name,schema) VALUES($1,$2,$3,$4)',[id,e.id,template.name,json(template.schema)]);});return ok({id});}
  if(a==='upgrade-options'&&method==='GET'){await eventAccess(u,e,'export');return ok(await upgradeOptions(e));}
  if(a==='upgrade-order'&&method==='POST')return ok(await createUpgradeOrder(e,u,await body(req)),201);
  if(a==='apply-upgrade'&&method==='POST')return ok(await applyUpgrade(e,u,await body(req)));
  if(a==='addon-order'&&method==='POST')return ok(await orderAddon(e,u,await body(req)),201);
  if(a==='apply-addon'&&method==='POST')return ok(await applyAddon(e,u,await body(req)));
  if(a==='frames'&&method==='GET'){await eventAccess(u,e,'frame');if(!e.snapshot.frames)fail('PLAN_FEATURE_UNAVAILABLE','Mini tidak menyediakan frame.',403);return ok((await rows('SELECT * FROM frames WHERE event_id=$1 ORDER BY updated_at,id',[e.id])).map(frameResponse));}
  if(a==='frames'&&method==='POST'){
   await eventAccess(u,e,'frame');if(!e.snapshot.frames)fail('PLAN_FEATURE_UNAVAILABLE','Mini tidak menyediakan frame.',403);return ok(await saveFrame(e,u,await body(req,2*1024**2)));
  }
  if(a==='publish'&&method==='POST'){await eventAccess(u,e,'edit');const b=await body(req);await publish(u,e,b.reason);return ok({published:true});}
  if(['pause','resume','close'].includes(a)&&method==='POST'){await eventAccess(u,e,'edit');if(a==='resume'&&!e.published)fail('EVENT_NOT_READY','Terbitkan acara terlebih dahulu.',409);await rows('UPDATE events SET status=$2 WHERE id=$1',[e.id,a==='pause'?'paused':a==='resume'?'live':'closed']);await audit(u.id,'event.'+a,{},e.id);return ok({done:true});}
  if(a==='duplicate'&&method==='POST'){await eventAccess(u,e,'edit');if(e.channel!=='PARTNER_SELF_SERVICE')fail('FORBIDDEN','Duplikasi khusus vendor.',403);const oid=uid(),old=await one('SELECT * FROM orders WHERE id=$1',[e.order_id]);await rows('INSERT INTO orders(id,user_id,org_id,channel,plan_id,amount,snapshot,brief) VALUES($1,$2,$3,$4,$5,$6,$7,$8)',[oid,u.id,e.org_id,e.channel,old.plan_id,old.amount,json(e.snapshot),json({...old.brief,name:e.name+' — salinan'})]);return ok({orderId:oid});}
  if(a==='invitations'&&method==='POST'){await eventAccess(u,e,'edit');const b=await body(req),code=token().slice(0,12),id=uid();await rows('INSERT INTO invitations VALUES($1,$2,$3,$4)',[id,e.id,hash(code),z.string().min(1).max(100).parse(b.label)]);return ok({code,label:b.label});}
  if(a==='staff'&&method==='POST'){
   await eventAccess(u,e,'edit');if(e.channel!=='PARTNER_SELF_SERVICE')fail('FORBIDDEN','Tim event khusus vendor.',403);if(u.role!=='superadmin'&&!await one('SELECT 1 FROM organizations WHERE id=$1 AND owner_id=$2',[e.org_id,u.id]))fail('FORBIDDEN','Hanya pemilik organisasi yang dapat mengatur tim.',403);
   const b=z.object({email:z.email(),permissions:z.array(z.enum(['event_edit','media_moderate','live_wall_view','gallery_view','media_export'])),remove:z.boolean().optional()}).parse(await body(req));if(!b.remove&&!b.permissions.length)fail('PERMISSIONS_REQUIRED','Pilih minimal satu izin anggota.');const email=b.email.toLowerCase(),member=await one('SELECT id FROM users WHERE email=$1',[email]);if(!member){if(b.remove)fail('USER_NOT_FOUND','Pengguna belum terdaftar.',404);const invitationToken=token(),invitationId=uid();await rows('INSERT INTO staff_invitations(id,event_id,email,permissions,token_hash,created_by) VALUES($1,$2,$3,$4,$5,$6)',[invitationId,e.id,email,json(b.permissions),hash(invitationToken),u.id]);await audit(u.id,'event.invitation.create',{invitationId,email},e.id);return ok({inviteUrl:'/terima-undangan#'+invitationToken},201);}
   if(b.remove)await rows('DELETE FROM event_staff WHERE event_id=$1 AND user_id=$2',[e.id,member.id]);else await rows('INSERT INTO event_staff VALUES($1,$2,$3) ON CONFLICT(event_id,user_id) DO UPDATE SET permissions=excluded.permissions',[e.id,member.id,json(b.permissions)]);await audit(u.id,'event.staff',{memberId:member.id,remove:!!b.remove},e.id);return ok({done:true});
  }
  if(a==='analytics'&&method==='GET'){await eventAccess(u,e);return ok(await usage(e.id));}
  if(a==='legal-hold'&&method==='POST'){await admin();const b=z.object({enabled:z.boolean(),reason:z.string().min(5).max(500)}).parse(await body(req));await rows('UPDATE events SET legal_hold=$2 WHERE id=$1',[e.id,b.enabled]);await audit(u.id,'event.legal-hold',{enabled:b.enabled,reason:b.reason},e.id);return ok({done:true});}
  if(a==='media'&&method==='GET'){await eventAccess(u,e);return ok(await gallery(e,url,true));}
  if(a==='moderation'&&method==='POST'){
   await eventAccess(u,e,'moderate');const b=z.object({ids:z.array(uuid).min(1).max(100),action:z.enum(['approved','hidden','rejected','deleted'])}).parse(await body(req));for(const id of b.ids)await rows('UPDATE media SET moderation=$3 WHERE id=$1 AND event_id=$2',[id,e.id,b.action]);await audit(u.id,'media.moderate',{ids:b.ids,action:b.action},e.id);return ok({done:true});
  }
  if(a==='display-tokens'&&method==='POST'){await eventAccess(u,e,'display');if(!e.snapshot.live)fail('PLAN_FEATURE_UNAVAILABLE','Live wall tidak tersedia pada Mini.',403);const b=await body(req);if(b.revoke){await rows('UPDATE display_tokens SET revoked=true WHERE event_id=$1',[e.id]);return ok({revoked:true});}const t=token();await rows("INSERT INTO display_tokens VALUES($1,$2,now()+interval '24 hours',false)",[hash(t),e.id]);return ok({token:t,url:'/live/'+e.id+'#'+t});}
  if(a==='exports'&&method==='POST'){await eventAccess(u,e,'export');if(Date.now()>+new Date(e.end_at)+e.snapshot.exportDays*86400000)fail('RETENTION_EXPIRED','Masa ekspor telah berakhir.',410);const b=z.object({book:z.boolean().default(false),bookLimit:z.number().int().min(1).max(300).default(100)}).parse(await body(req));if(b.book&&!e.snapshot.book)fail('PLAN_FEATURE_UNAVAILABLE','Memory Book tersedia pada Celebration/Signature.',403);const id=uid();await rows('INSERT INTO jobs(id,event_id,user_id,kind,payload) VALUES($1,$2,$3,$4,$5)',[id,e.id,u.id,b.book?'book.pdf':'export.zip',json({bookLimit:b.bookLimit})]);startWorker();return ok({id},202);}
  if(a==='qr-kit'&&method==='GET'){
   await eventAccess(u,e);if(!e.published)fail('EVENT_NOT_READY','QR tersedia setelah publish.',409);const format=url.searchParams.get('format')||'svg',link=(process.env.APP_URL||url.origin)+guestPath(e.slug);
   if(format==='pdf'&&!canExportQrPdf(e.snapshot))fail('PLAN_FEATURE_UNAVAILABLE','QR PDF tidak termasuk entitlement pembelian acara ini.',403);
   if(format==='svg')return new Response(await QRCode.toString(link,{type:'svg',margin:4,errorCorrectionLevel:'M'}),{headers:{'Content-Type':'image/svg+xml','Content-Disposition':'attachment; filename="qr-event.svg"','Cache-Control':'private,no-store'}});
   const png=await QRCode.toBuffer(link,{width:1000,margin:4});if(format==='pdf'){const doc=await PDFDocument.create(),page=doc.addPage([595,842]),img=await doc.embedPng(png);page.drawImage(img,{x:70,y:220,width:455,height:455});return binary(Buffer.from(await doc.save()),'application/pdf','qr-event.pdf');}return binary(png,'image/png','qr-event.png');
  }
  if(a==='manual-physical-import'&&method==='POST'){
   await admin();await eventAccess(u,e,'edit');return ok(await physicalImport(e,await limitedBody(req,12*1024**2)),201);
  }
 }
 m=p.match(/^couple\/events\/([a-z0-9-]+)\/(session|gallery|albums(?:\/download)?)$/);
 if(m){const e=await one('SELECT * FROM events WHERE slug=$1',[m[1]]);if(!e?.published)fail('NOT_FOUND','Acara tidak ditemukan.',404);
  if(m[2]==='session'&&method==='POST'){const b=z.object({code:z.string().min(8).max(64)}).parse(await body(req));await unlockCoupleAccess(e.id,b.code,req);return ok({unlocked:true});}
  if(m[2]==='session'&&method==='DELETE'){await lockCoupleAccess(e.id);return ok({locked:true});}
  if(['gallery','albums','albums/download'].includes(m[2])&&method==='GET'){
   if(!await hasCoupleAccess(e.id))fail('COUPLE_CODE_REQUIRED','Masukkan kode pengantin terlebih dahulu.',401);
   if(Date.now()>+new Date(e.end_at)+e.snapshot.exportDays*86400000)fail('RETENTION_EXPIRED','Masa album pengantin telah berakhir.',410);
   if(m[2]==='albums')return ok(await coupleAlbums(e.id,url));
   if(m[2]==='albums/download'){const album=z.string().min(1).max(200).parse(url.searchParams.get('album'));return downloadCoupleAlbum(e,album,req.signal);}
   return ok(await gallery(e,url,true));
  }
 }
 m=p.match(/^public\/events\/([a-z0-9-]+)\/(bootstrap|sessions|gallery)$/);
 if(m){const e=await one('SELECT * FROM events WHERE slug=$1',[m[1]]);if(!e||!e.published)fail('NOT_FOUND','Acara tidak ditemukan.',404);const s=guestSettings(e.slug,e.published.settings);
  if(m[2]==='bootstrap'&&method==='GET')return ok({id:e.id,slug:e.slug,name:e.name,start_at:e.start_at,end_at:e.end_at,timezone:e.timezone,status:e.status,snapshot:e.snapshot,settings:s,reveal_at:e.reveal_at,frames:e.published.frames});
  if(m[2]==='sessions'&&method==='POST'){
   await checkLive(e);const b=z.object({name:z.string().min(1).max(80),consent:z.literal(true),code:z.string().max(100).optional()}).parse(await body(req));const existingCookie=(await cookies()).get('kv_device')?.value,device=existingCookie||token();let identityHash=hash(device),verified=false;
   if(s.identity==='invite_code'){const inv=await one('SELECT * FROM invitations WHERE event_id=$1 AND code_hash=$2',[e.id,hash(b.code||'')]);if(!inv)fail('INVALID_INVITATION','Kode undangan tidak valid.',403);identityHash=inv.code_hash;verified=true;}
   const gid=await (await database()).transaction(async tx=>{await tx.query('SELECT id FROM events WHERE id=$1 FOR UPDATE',[e.id]);const old=await one('SELECT id FROM guests WHERE event_id=$1 AND identity_hash=$2',[e.id,identityHash],tx);if(old)return old.id;const count=await one('SELECT count(*)::int AS count FROM guests WHERE event_id=$1',[e.id],tx);if(count.count>=e.snapshot.guests)fail('GUEST_LIMIT_EXCEEDED','Jumlah tamu maksimal acara tercapai.',409);const id=uid();await tx.query('INSERT INTO guests(id,event_id,identity_hash,name,verified) VALUES($1,$2,$3,$4,$5)',[id,e.id,identityHash,b.name,verified]);return id;});
   const t=token();await rows("INSERT INTO guest_sessions VALUES($1,$2,$3,$4,now()+interval '24 hours')",[hash(t),gid,e.id,json({settings:s,frames:e.published.frames,revision:e.revision})]);const c=await cookies();c.set('kv_guest',t,{httpOnly:true,sameSite:'lax',secure:secureCookie(),path:'/',maxAge:86400});c.set('kv_device',device,{httpOnly:true,sameSite:'lax',secure:secureCookie(),path:'/',maxAge:86400*90});return ok({guestId:gid,verified});
  }
  if(m[2]==='gallery'&&method==='GET')return ok(await gallery(e,url,false));
 }
 if(p==='guest/me'&&method==='PATCH'){
  const s=await guestSession(),b=z.object({name:z.string().trim().min(1).max(80)}).parse(await body(req));
  await checkLive(await event(s.event_id));
  await rows('UPDATE guests SET name=$3 WHERE id=$1 AND event_id=$2',[s.guest_id,s.event_id,b.name]);
  return ok({name:b.name});
 }
 if(p==='guest/me/limits'&&method==='GET'){
  const s=await guestSession(),e=await event(s.event_id);const n=await one("SELECT count(*)::int AS count FROM intents WHERE guest_id=$1 AND kind='disposable_photo' AND (state='finalized' OR (state IN ('reserved','uploaded') AND expires_at>now()))",[s.guest_id]);return ok({eventId:e.id,guestId:s.guest_id,name:s.name,verified:s.verified,remaining:Math.max(0,Math.min(e.snapshot.perGuest,s.snapshot.settings.perGuest)-n.count),captureSnapshot:s.snapshot});
 }
 if(p==='guest/memories'&&method==='GET'){
  const s=await guestSession();return ok({items:await rows("SELECT id,kind,created_at FROM media WHERE event_id=$1 AND guest_id=$2 AND kind IN ('disposable_photo','photo_strip','gif') AND moderation<>'deleted' ORDER BY created_at DESC LIMIT 48",[s.event_id,s.guest_id])});
 }
 const associationMatch=p.match(/^guest\/media\/([\w-]+)\/associate$/);
 if(associationMatch&&method==='POST'){
  const s=await guestSession(),b=z.object({attachmentId:uuid}).parse(await body(req)),media=await one("SELECT id FROM media WHERE id=$1 AND guest_id=$2 AND event_id=$3 AND kind IN ('voice','video_wish')",[uuid.parse(associationMatch[1]),s.guest_id,s.event_id]);if(!media)fail('FORBIDDEN','Kiriman tidak dapat ditautkan.',403);
  const photo=await one("SELECT id FROM media WHERE id=$1 AND guest_id=$2 AND event_id=$3 AND kind IN ('disposable_photo','photo_strip','gif') AND moderation<>'deleted'",[b.attachmentId,s.guest_id,s.event_id]);if(!photo)fail('FORBIDDEN','Foto pendamping tidak diizinkan.',403);await rows("UPDATE media SET snapshot=jsonb_set(snapshot,'{attachmentIds}',$2::jsonb,true) WHERE id=$1",[media.id,json([photo.id])]);return ok({associated:true});
 }
 if((p==='guest/media/intents'||p==='guest/video/upload-intent')&&method==='POST'){const i=await reserve(await body(req));return ok({intentId:i.id,uploadUrl:'/api/v1/guest/uploads/'+i.id,state:i.state,maxBytes:Number(i.max_bytes)});}
 m=p.match(/^guest\/uploads\/([\w-]+)$/);
 if(m&&method==='GET')return ok(await uploadProgress(m[1]));
 if(m&&method==='PUT'&&req.headers.has('content-range'))return ok(await uploadChunk(m[1],req));
 if(m&&method==='PUT'){
  const s=await guestSession(),i=await one('SELECT * FROM intents WHERE id=$1 AND guest_id=$2',[uuid.parse(m[1]),s.guest_id]);if(!i)fail('NOT_FOUND','Unggahan tidak ditemukan.',404);if(i.state==='finalized')return ok({uploaded:true});if(!['reserved','uploaded'].includes(i.state)||new Date(i.expires_at)<new Date())fail('UPLOAD_INTENT_EXPIRED','Unggahan kedaluwarsa.',409);const b=await limitedBody(req,Math.min(Number(i.max_bytes),30*1024**2));if(!b.length)fail('INVALID_MEDIA','Berkas kosong.');await storage.put(i.object_key,b,i.mime);await rows("UPDATE intents SET state='uploaded' WHERE id=$1 AND state IN ('reserved','uploaded')",[i.id]);return ok({uploaded:true});
 }
 m=p.match(/^guest\/(?:media|video)\/([\w-]+)\/finalize$/);if(m&&method==='POST'){const result=await finalize(uuid.parse(m[1]));startWorker();return ok({id:result.id,processing:result.processing});}
 m=p.match(/^guest\/media\/([\w-]+)\/(status|file|optimize)$/);
 if(m){
  const session=await guestSession(),media=await one('SELECT * FROM media WHERE id=$1 AND guest_id=$2 AND event_id=$3',[uuid.parse(m[1]),session.guest_id,session.event_id]);
  if(!media||media.kind!=='video_wish'||media.moderation==='deleted')fail('NOT_FOUND','Video tidak ditemukan.',404);
  const ownerEvent=await event(media.event_id);
  if(Date.now()>+new Date(ownerEvent.end_at)+ownerEvent.snapshot.exportDays*86400000)fail('RETENTION_EXPIRED','Masa unduh sudah berakhir.',410);
  if(m[2]==='status'&&method==='GET')return ok({processing:media.processing,url:media.processing==='ready'?'/api/v1/guest/media/'+media.id+'/file':undefined,error:media.processing==='failed'?'Hasil video belum dapat disiapkan. Pilih optimasi untuk mencoba kembali.':undefined});
  if(m[2]==='file'&&method==='GET'){
   if(media.processing!=='ready')fail('MEDIA_NOT_READY','Video masih disiapkan.',409);
   const object=await storage.stream(media.object_key);
   return new Response(object.body as ReadableStream<Uint8Array>,{headers:{'Content-Type':media.mime,'Cache-Control':'private,no-store','Content-Disposition':attachmentHeader('Video-kenangan.mp4'),...(object.bytes?{'Content-Length':String(object.bytes)}:{})}});
  }
  if(m[2]==='optimize'&&method==='POST'){
   const result=await (await database()).transaction(async tx=>{
    await tx.query('SELECT id FROM events WHERE id=$1 FOR UPDATE',[media.event_id]);
    const fresh=await one('SELECT * FROM media WHERE id=$1 FOR UPDATE',[media.id],tx);
    if(fresh.processing!=='failed')return {processing:fresh.processing};
    const presentation=mediaPresentationSchema.parse({...fresh.snapshot.mediaPresentation,optimized:true});
    const reservation=await one('SELECT max_bytes FROM intents WHERE id=$1',[fresh.intent_id],tx),budget=await eventBudget(ownerEvent,tx);
    if(budget.bytes+Number(reservation.max_bytes)>ownerEvent.snapshot.storage)fail('STORAGE_QUOTA_EXCEEDED','Penyimpanan acara belum cukup untuk mencoba kembali.',409);
    await tx.query("UPDATE intents SET state='finalized' WHERE id=$1",[fresh.intent_id]);
    await tx.query("UPDATE media SET snapshot=$2,processing='queued' WHERE id=$1",[media.id,json({...fresh.snapshot,mediaPresentation:presentation})]);
    await tx.query("INSERT INTO jobs(id,event_id,kind,payload) VALUES($1,$2,'media.process',$3)",[uid(),media.event_id,json({mediaId:media.id})]);
    return {processing:'queued'};
   });startWorker();return ok(result);
  }
 }
 if((p==='guest/notes'||p==='guest/wishes')&&method==='POST'){
  const s=await guestSession(),b=z.object({text:z.string().trim().min(1).max(1500),cardStyle:z.enum(['plain','botanical','romance']).default('plain'),attachmentIds:z.array(uuid).max(3).default([]),idempotencyKey:z.string().regex(/^[a-zA-Z0-9_-]{8,100}$/).optional()}).parse(await body(req));
  const result=await (await database()).transaction(async tx=>{
   const e=await one('SELECT * FROM events WHERE id=$1 FOR UPDATE',[s.event_id],tx);
   const id=b.idempotencyKey?guestNoteId(e.id,s.guest_id,b.idempotencyKey):uid();
   if(b.idempotencyKey){const old=await one("SELECT id,text_content FROM media WHERE event_id=$1 AND guest_id=$2 AND kind='wish_card' AND id=$3",[e.id,s.guest_id,id],tx);if(old){if(old.text_content!==b.text)fail('IDEMPOTENCY_CONFLICT','Ucapan berbeda dari kiriman sebelumnya.',409);return {id:old.id};}}
   await checkLive(e);
   if(b.attachmentIds.length){const photos=await rows("SELECT id FROM media WHERE event_id=$1 AND guest_id=$2 AND id=ANY($3::uuid[]) AND kind IN ('disposable_photo','photo_strip','gif') AND moderation<>'deleted'",[e.id,s.guest_id,b.attachmentIds],tx);if(photos.length!==new Set(b.attachmentIds).size)fail('FORBIDDEN','Foto pendamping tidak diizinkan.',403);}
   if(!e.snapshot.frames&&b.cardStyle!=='plain')fail('PLAN_FEATURE_UNAVAILABLE','Kartu dekoratif tersedia pada Classic ke atas.',403);
   if(!guestSettings(e.slug,s.snapshot.settings).modes.includes('wish_card'))fail('MODE_DISABLED','Ucapan tidak diaktifkan.',403);
   const count=await one("SELECT count(*)::int AS count FROM media WHERE event_id=$1 AND kind='wish_card'",[e.id],tx);if(count.count>=e.snapshot.notes)fail('EVENT_QUOTA_EXCEEDED','Kuota ucapan habis.',409);
   await tx.query("INSERT INTO media(id,event_id,guest_id,kind,text_content,author,consent,privacy,processing,snapshot) VALUES($1,$2,$3,'wish_card',$4,$5,false,'private_owner','ready',$6)",[id,e.id,s.guest_id,b.text,s.name,json({cardStyle:b.cardStyle,attachmentIds:[...new Set(b.attachmentIds)]})]);return {id};
  });return ok(result,201);
 }
 m=p.match(/^media\/([\w-]+)(?:\/(access|file|report))?$/);
 if(m){uuid.parse(m[1]);const media=await one('SELECT * FROM media WHERE id=$1',[m[1]]),action=m[2];if(action==='report'&&method==='POST'){const b=z.object({reason:z.string().min(5).max(500)}).parse(await body(req));await mediaAccess(media);await rows('INSERT INTO reports(id,media_id,reason) VALUES($1,$2,$3)',[uid(),media.id,b.reason]);return ok({reported:true});}
  await mediaAccess(media,req,!!url.searchParams.get('display'));
  if(action==='file'&&method==='GET'){
   const download=url.searchParams.get('download')==='1',thumb=!download&&url.searchParams.get('thumb')==='1';
   if(download&&media.text_content)return new Response(media.author+'\n\n'+media.text_content+'\n',{headers:{'Content-Type':'text/plain; charset=utf-8','Cache-Control':'private,no-store','Content-Disposition':attachmentHeader('Ucapan-'+media.id+'.txt')}});
   const key=thumb?media.thumbnail_key:media.object_key;if(!key)fail('NOT_FOUND','Media tidak tersedia.',404);
   if(download){const disposition=attachmentHeader('Kenangan-'+media.id+'.'+mediaExtension(media.mime)),signed=await storage.signedUrl(key,{contentDisposition:disposition,contentType:media.mime});if(signed)return NextResponse.redirect(signed,{status:307,headers:{'Cache-Control':'private,no-store'}});const object=await storage.stream(key);return new Response(object.body as ReadableStream<Uint8Array>,{headers:{'Content-Type':media.mime,'Cache-Control':'private,no-store','Content-Disposition':disposition,...(object.bytes?{'Content-Length':String(object.bytes)}:{})}});}
   const signed=await storage.signedUrl(key);if(signed)return NextResponse.redirect(signed,{status:307,headers:{'Cache-Control':'private,no-store'}});
   return new Response(new Uint8Array(await storage.get(key)),{headers:{'Content-Type':thumb?'image/webp':media.mime,'Cache-Control':'private,no-store','Content-Disposition':`inline; filename="${media.id}.${thumb?'webp':mediaExtension(media.mime)}"`}});
  }
  if(method==='GET')return ok({url:'/api/v1/media/'+media.id+'/file',expiresIn:0,authorization:'checked on every request'});
 }
 m=p.match(/^documents\/([\w-]+)$/);if(m&&method==='GET'){const d=await one('SELECT * FROM documents WHERE id=$1',[uuid.parse(m[1])]);if(!d)fail('NOT_FOUND','Berkas tidak ditemukan.',404);await orderAccess(d.order_id);return binary(await storage.get(d.object_key),d.mime,'document'+(d.mime==='application/pdf'?'.pdf':'.jpg'));}
 m=p.match(/^exports\/([\w-]+)(?:\/(download))?$/);if(m&&method==='GET'){
  const j=await one('SELECT * FROM jobs WHERE id=$1',[uuid.parse(m[1])]);if(!j)fail('NOT_FOUND','Ekspor tidak ditemukan.',404);await managedEdit(j.event_id,'export');
  if(m[2]){if(j.status!=='done'||new Date(j.result.expiresAt)<new Date())fail('EXPORT_NOT_READY','Ekspor belum siap atau telah kedaluwarsa.',409);const parts=j.result.parts||[{key:j.result.key,mime:j.kind==='book.pdf'?'application/pdf':'application/zip',filename:j.kind==='book.pdf'?'memory-book.pdf':'memories.zip'}],index=z.coerce.number().int().min(0).max(parts.length-1).parse(url.searchParams.get('part')||'0'),part=parts[index],signed=await storage.signedUrl(part.key);if(signed)return NextResponse.redirect(signed,{status:307,headers:{'Cache-Control':'private,no-store'}});const object=await storage.stream(part.key);return new Response(object.body as ReadableStream<Uint8Array>,{headers:{'Content-Type':part.mime,'Content-Disposition':`attachment; filename="${part.filename}"`,'Content-Length':String(object.bytes||0),'Cache-Control':'private,no-store'}});}
  return ok({id:j.id,status:j.status,error:j.error,result:j.status==='done'?{...j.result,key:undefined,parts:j.result.parts?.map((part:any)=>({...part,key:undefined}))}:null});
 }
 m=p.match(/^display\/([\w-]+)$/);if(m&&method==='GET'){const id=uuid.parse(m[1]),d=await one('SELECT * FROM display_tokens WHERE token_hash=$1 AND event_id=$2 AND expires_at>now() AND NOT revoked',[hash(req.headers.get('authorization')?.replace('Bearer ','')||''),id]);if(!d)fail('FORBIDDEN','Token layar kedaluwarsa atau dicabut.',403);const e=await event(id);if(!e.snapshot.live)fail('PLAN_FEATURE_UNAVAILABLE','Live wall tidak tersedia.',403);return ok({event:{name:e.name,slug:e.slug},items:await gallery(e,url,false,true)});}
 if(p==='admin/system'&&method==='GET'){await admin();return ok({database:process.env.DATABASE_URL?'Postgres':'PGlite local PostgreSQL',storage:process.env.STORAGE_DRIVER||'local-private',paymentConfigured:!!process.env.PAYMENT_BANK_ACCOUNT,queue:await rows('SELECT status,count(*)::int AS count FROM jobs GROUP BY status'),jobs:await rows('SELECT id,event_id,kind,status,attempts,error,created_at FROM jobs ORDER BY created_at DESC LIMIT 50'),audit:await rows('SELECT * FROM audit ORDER BY created_at DESC LIMIT 80'),reports:await rows('SELECT * FROM reports ORDER BY created_at DESC LIMIT 50'),users:await rows('SELECT id,email,name,role FROM users'),organizations:await rows('SELECT * FROM organizations')});}
 m=p.match(/^admin\/users\/([\w-]+)\/role$/);if(m&&method==='PATCH'){const u=await admin(),b=z.object({role:z.enum(['buyer','partner','operator','designer','superadmin']),reason:z.string().min(5).max(500)}).parse(await body(req));uuid.parse(m[1]);if(m[1]===u.id)fail('SELF_ROLE_CHANGE','Gunakan superadmin lain untuk mengubah peran sendiri.',409);await rows('UPDATE users SET role=$2 WHERE id=$1',[m[1],b.role]);await rows('DELETE FROM sessions WHERE user_id=$1',[m[1]]);await audit(u.id,'user.role',{userId:m[1],role:b.role,reason:b.reason});return ok({updated:true});}
 m=p.match(/^admin\/jobs\/([\w-]+)\/retry$/);if(m&&method==='POST'){const u=await admin();await rows("UPDATE jobs SET status='queued',attempts=0,run_after=now() WHERE id=$1 AND status='failed'",[uuid.parse(m[1])]);await audit(u.id,'job.retry',{jobId:m[1]});return ok({queued:true});}
 m=p.match(/^admin\/reports\/([\w-]+)\/resolve$/);if(m&&method==='POST'){await admin();await rows("UPDATE reports SET status='resolved' WHERE id=$1",[uuid.parse(m[1])]);return ok({resolved:true});}
 m=p.match(/^admin\/catalog\/plans\/([a-z]+)$/);if(m&&method==='PATCH'){
  const u=await admin(),b=await body(req),p=await one('SELECT * FROM plans WHERE id=$1',[m[1]]);if(!p)fail('NOT_FOUND','Paket tidak ditemukan.',404);
  const schema=z.object({qrPdf:z.boolean().default(false),frames:z.number().int().min(0).max(6),perGuest:z.number().int().min(1).max(100),guests:z.number().int().min(1).max(10000),photos:z.number().int().min(1).max(100000),voice:z.number().int().min(0).max(10000),voiceSec:z.number().int().min(1).max(120),video:z.number().int().min(0).max(10000),videoSec:z.number().int().min(1).max(60),notes:z.number().int().min(1).max(100000),storage:z.number().int().min(1048576).max(1024**4),live:z.boolean(),filters:z.number().int().min(1).max(12),creative:z.boolean(),book:z.boolean(),submitDays:z.number().int().min(0).max(365),galleryDays:z.number().int().min(1).max(365),exportDays:z.number().int().min(1).max(365),revisions:z.number().int().min(0).max(100)});
  const config=schema.parse(b.config);if(p.id==='mini'&&(config.frames!==0||config.live||config.creative||config.qrPdf))fail('MINI_CONTRACT','Mini harus tetap tanpa frame, strip, dan live wall.');const price=z.number().int().min(0).parse(b.price),partnerPrice=b.partnerPrice===null?null:z.number().int().min(0).parse(b.partnerPrice);await rows('UPDATE plans SET price=$2,config=$3,partner_price=$4,version=version+1 WHERE id=$1',[p.id,price,json(config),partnerPrice]);await audit(u.id,'catalog.update',{plan:p.id,previousVersion:p.version});return ok({saved:true});
 }
 if(p==='admin/retention'&&method==='POST'){const u=await admin(),b=await body(req),e=await event(uuid.parse(b.eventId));if(!b.reason)fail('REASON_REQUIRED','Alasan wajib.');if(e.legal_hold)fail('LEGAL_HOLD','Acara dilindungi legal hold.',409);if(Date.now()<+new Date(e.end_at)+(e.snapshot.exportDays+14)*86400000)fail('RETENTION_NOT_DUE','Masa retensi dan tenggang 14 hari belum berakhir.',409);await rows("INSERT INTO jobs(id,event_id,user_id,kind,payload) VALUES($1,$2,$3,'retention.purge',$4)",[uid(),e.id,u.id,json({reason:b.reason})]);await audit(u.id,'retention.request',{reason:b.reason},e.id);return ok({queued:true});}
 if(p==='worker/tick'&&method==='POST'){await admin();await processJobs();return ok({processed:true});}
 fail('NOT_FOUND','Endpoint tidak ditemukan.',404);
 }catch(e:any){
  const status=e instanceof AppError?e.status:e instanceof z.ZodError?422:500;const code=e instanceof AppError?e.code:e instanceof z.ZodError?'VALIDATION_ERROR':'INTERNAL_ERROR';
  if(status===500)console.error('API error',requestId,e);
  return NextResponse.json({error:{code,message:status===500?'Terjadi gangguan. Coba kembali.':e instanceof z.ZodError?e.issues.map((v:any)=>v.path.join('.')+': '+v.message).join('; '):e.message,requestId}},{status,headers:{'Cache-Control':'no-store'}});
 }
}
export const GET=handler,POST=handler,PATCH=handler,PUT=handler,DELETE=handler;
function binary(b:Buffer,mime:string,name:string){return new Response(new Uint8Array(b),{headers:{'Content-Type':mime,'Content-Disposition':`attachment; filename="${name}"`,'Cache-Control':'private,no-store'}})}
async function getPermissions(u:any,e:any){const out:any={};for(const p of ['edit','frame','moderate','export','display']){try{await eventAccess(u,e,p);out[p]=true}catch{out[p]=false}}out.frame=out.frame&&!!e.snapshot.frames;out.display=out.display&&e.snapshot.live;out.purchase=e.channel==='DIRECT_MANAGED'?e.customer_id===u.id:!!await one('SELECT id FROM organizations WHERE id=$1 AND owner_id=$2',[e.org_id,u.id]);return out;}
async function createEvent(o:any){
 return (await database()).transaction(async tx=>{await tx.query('SELECT id FROM orders WHERE id=$1 FOR UPDATE',[o.id]);const old=await one('SELECT * FROM events WHERE order_id=$1',[o.id],tx);if(old)return old;
  const id=uid(),slug=o.brief.name.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,65)+'-'+id.slice(0,8);
  await tx.query('INSERT INTO events(id,order_id,org_id,customer_id,channel,slug,name,start_at,end_at,timezone,snapshot,settings) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)',[id,o.id,o.org_id||'00000000-0000-4000-8000-000000000001',o.channel==='DIRECT_MANAGED'?o.user_id:null,o.channel,slug,o.brief.name,o.brief.startAt,o.brief.endAt,o.brief.timezone,json(o.snapshot),json(defaultSettings(o.snapshot))]);
  if(o.snapshot.frames)await tx.query('INSERT INTO frames(id,event_id,name,schema) VALUES($1,$2,$3,$4)',[uid(),id,'Editorial',json(presetFrame(4))]);return await one('SELECT * FROM events WHERE id=$1',[id],tx);
 });
}
async function publish(u:any,e:any,reason?:string){
 await (await database()).transaction(async tx=>{
  await tx.query('SELECT id FROM events WHERE id=$1 FOR UPDATE',[e.id]);const o=await one('SELECT * FROM orders WHERE id=$1',[e.order_id],tx);const personal=e.personal&&u.role==='superadmin'&&o.status==='complimentary';if(o.status!=='paid'&&!personal)fail('PAYMENT_PENDING','Pembayaran belum diverifikasi.',409);
  if(e.channel==='DIRECT_MANAGED'&&!personal&&o.fulfillment!=='client_approved'&&!(u.role==='superadmin'&&reason?.length!>=5))fail('APPROVAL_REQUIRED','Persetujuan klien diperlukan. Override admin harus memiliki alasan.',409);
  const fresh=await one('SELECT * FROM events WHERE id=$1',[e.id],tx),frames=await rows('SELECT * FROM frames WHERE event_id=$1',[e.id],tx);if(e.snapshot.frames&&!frames.length)fail('FRAME_REQUIRED','Siapkan frame sebelum publish.',409);
  for(const frame of frames){const issues=validateFrame(toFrameDocument(frame.schema));if(issues.length)fail('FRAME_NOT_RENDERABLE',frame.name+': '+issues.map(i=>i.message).join(' '),409);}
  const revision=fresh.revision+1;await tx.query('INSERT INTO revisions VALUES($1,$2,$3,$4,$5,now())',[uid(),e.id,revision,json(fresh.settings),json(frames)]);await tx.query("UPDATE events SET status=CASE WHEN start_at>now() THEN 'scheduled' ELSE 'live' END,published=$2,revision=$3 WHERE id=$1",[e.id,json({settings:fresh.settings,frames}),revision]);await tx.query("UPDATE orders SET fulfillment='delivered' WHERE id=$1",[o.id]);
 });await audit(u.id,'event.publish',{reason:reason||null},e.id);
}
async function usage(eventId:string){return {budgetBytes:(await eventBudget({id:eventId},await database())).bytes,media:await rows('SELECT kind,processing,moderation,count(*)::int AS count,coalesce(sum(bytes),0)::bigint AS bytes FROM media WHERE event_id=$1 GROUP BY kind,processing,moderation',[eventId]),guests:(await one('SELECT count(*)::int AS count FROM guests WHERE event_id=$1',[eventId])).count,reservations:await one("SELECT count(*)::int AS count,coalesce(sum(max_bytes),0)::bigint AS bytes FROM intents WHERE event_id=$1 AND state IN ('reserved','uploaded') AND expires_at>now()",[eventId])};}
async function gallery(e:any,url:URL,owner=false,display=false){
 if(!owner){if(!display&&!e.published?.settings.gallery)return {items:[],locked:true,message:'Galeri bersifat privat.'};if(e.reveal_at&&new Date(e.reveal_at)>new Date())return {items:[],locked:true,message:'Film akan dibuka setelah '+new Date(e.reveal_at).toLocaleString('id-ID')};if(Date.now()>+new Date(e.end_at)+e.snapshot.galleryDays*86400000)return {items:[],locked:true,message:'Masa galeri telah berakhir.'};}
 const page=Math.max(1,Number(url.searchParams.get('page'))||1),kind=url.searchParams.get('kind')||'',search=(url.searchParams.get('q')||'').slice(0,100),where=owner?"moderation<>'deleted'":"moderation='approved' AND consent=true AND privacy='public' AND processing='ready'";
 const album=owner?(url.searchParams.get('album')||'').slice(0,200):'';
 const params:any[]=[e.id,kind,search,24,(page-1)*24,album];const items=await rows(`SELECT id,kind,source,mime,bytes,duration,text_content,author,consent,moderation,processing,privacy,snapshot->>'cardStyle' AS card_style,snapshot->'attachmentIds' AS attachment_ids,created_at,thumbnail_key IS NOT NULL AS has_thumbnail FROM media WHERE event_id=$1 AND ${where} AND ($2='' OR kind=$2) AND ($3='' OR author ILIKE '%'||$3||'%' OR text_content ILIKE '%'||$3||'%') AND ($6='' OR ${albumIdentity}=$6) ORDER BY created_at DESC,id DESC LIMIT $4 OFFSET $5`,params);
 const attachmentIds=[...new Set(items.flatMap(item=>Array.isArray(item.attachment_ids)?item.attachment_ids:[]))];
 const attached=attachmentIds.length?await rows(`SELECT id,author FROM media WHERE event_id=$1 AND id=ANY($2::uuid[]) AND kind IN ('disposable_photo','photo_strip','gif') AND ${where} AND processing='ready'`,[e.id,attachmentIds]):[];
 return {items:items.map(m=>({...m,attachments:attached.filter(photo=>m.attachment_ids?.includes(photo.id)).map(photo=>({...photo,url:'/api/v1/media/'+photo.id+'/file'})),url:m.text_content?null:'/api/v1/media/'+m.id+'/file',thumbnail:m.has_thumbnail?'/api/v1/media/'+m.id+'/file?thumb=1':null})),page,hasMore:items.length===24};
}
