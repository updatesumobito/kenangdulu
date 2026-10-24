import {one,rows,database,json} from './db';
import {fail,id as uuid} from './domain';
import {uid} from './auth';
import {z} from 'zod';
export async function adminQuery(module:string,u:any,url:URL){
 if(!['superadmin','designer'].includes(u.role))fail('FORBIDDEN','Khusus tim pengelola.',403);
 if(u.role==='designer'&&!['overview','fulfillment','events'].includes(module))fail('FORBIDDEN','Khusus superadmin.',403);
 const page=Math.floor(Math.max(1,Math.min(100000,Number(url.searchParams.get('page'))||1))),limit=20,q=(url.searchParams.get('q')||'').slice(0,100),status=(url.searchParams.get('status')||'').slice(0,80),sort=url.searchParams.get('sort')||'date';
 const team=await rows("SELECT id,name FROM users WHERE role IN ('superadmin','designer') ORDER BY name LIMIT 200");
 if(module==='overview')return {counts:await one("SELECT (SELECT count(*)::int FROM orders WHERE ($1='superadmin' OR designer_id=$2)) AS orders,(SELECT count(*)::int FROM orders WHERE status='payment_review' AND ($1='superadmin' OR designer_id=$2)) AS payment_review,(SELECT count(*)::int FROM orders WHERE status='paid' AND fulfillment<>'delivered' AND ($1='superadmin' OR designer_id=$2)) AS work,(SELECT count(*)::int FROM events e LEFT JOIN orders o ON o.id=e.order_id WHERE e.status='live' AND ($1='superadmin' OR o.designer_id=$2)) AS live",[u.role,u.id])};
 if(['fulfillment','payments','events'].includes(module)){
  const params:any[]=[u.role,u.id,'%'+q+'%'],where=["($1='superadmin' OR o.designer_id=$2)","(coalesce(o.brief->>'name','') ILIKE $3 OR coalesce(c.name,'') ILIKE $3 OR coalesce(c.email,'') ILIKE $3)"];
  if(module==='fulfillment')where.push("o.channel='DIRECT_MANAGED' AND o.status='paid' AND o.fulfillment<>'delivered' AND NOT (o.brief ? 'addonEventId' OR o.brief ? 'upgradeEventId')");
  if(module==='events')where.push('e.id IS NOT NULL');
  if(status){params.push(status);where.push((module==='events'?'e.status':module==='payments'?'o.status':'o.fulfillment')+'=$'+params.length);}
  const from='FROM orders o LEFT JOIN events e ON e.order_id=o.id LEFT JOIN users c ON c.id=o.user_id LEFT JOIN users d ON d.id=o.designer_id WHERE '+where.join(' AND '),total=await one('SELECT count(*)::int AS count '+from,params),ordering=sort==='newest'?'o.created_at DESC':sort==='deadline'?'o.deadline ASC NULLS LAST, o.created_at':"CASE o.priority WHEN 'urgent' THEN 0 WHEN 'high' THEN 1 ELSE 2 END,coalesce(e.start_at,(o.brief->>'startAt')::timestamptz) ASC,o.created_at";
  const items=await rows('SELECT o.*,e.id AS event_id,e.slug,e.status AS event_status,e.start_at,c.name AS customer_name,c.email AS customer_email,d.name AS designer_name,(SELECT count(*)::int FROM documents f WHERE f.order_id=o.id AND f.kind=\'assets\') AS materials '+from+' ORDER BY '+ordering+` LIMIT $${params.length+1} OFFSET $${params.length+2}`,[...params,limit,(page-1)*limit]);return {items,total:total.count,page,limit,team};
 }
 if(module==='partners')return {users:await rows('SELECT id,name,email,role FROM users WHERE name ILIKE $1 OR email ILIKE $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3',['%'+q+'%',limit,(page-1)*limit]),organizations:await rows('SELECT id,name,branding,organization_type FROM organizations WHERE name ILIKE $1 ORDER BY name LIMIT $2 OFFSET $3',['%'+q+'%',limit,(page-1)*limit]),page};
 if(module==='moderation')return {reports:await rows("SELECT r.* FROM reports r WHERE ($1='' OR r.status=$1) ORDER BY created_at DESC LIMIT $2 OFFSET $3",[status,limit,(page-1)*limit]),page};
 if(module==='analytics')return {events:await rows("SELECT e.id,e.name,e.org_id,e.status,e.snapshot->>'storage' AS storage_limit,count(m.id)::int AS media,coalesce(sum(m.bytes),0)::text AS bytes,count(m.id) FILTER(WHERE m.processing='failed')::int AS failures FROM events e LEFT JOIN media m ON m.event_id=e.id WHERE e.name ILIKE $1 GROUP BY e.id ORDER BY coalesce(sum(m.bytes),0) DESC LIMIT $2 OFFSET $3",['%'+q+'%',limit,(page-1)*limit]),costRatesConfigured:!!process.env.STORAGE_COST_PER_GB_MONTH,storageCostPerGbMonth:process.env.STORAGE_COST_PER_GB_MONTH?Number(process.env.STORAGE_COST_PER_GB_MONTH):null,page};
 if(module==='operations')return {workerHealth:await rows('SELECT * FROM worker_health'),database:process.env.DATABASE_URL?'Postgres':'PGlite local PostgreSQL',storage:process.env.STORAGE_DRIVER||'local-private',paymentConfigured:!!process.env.PAYMENT_BANK_ACCOUNT,queue:await rows('SELECT status,count(*)::int AS count FROM jobs GROUP BY status'),jobs:await rows("SELECT id,event_id,kind,status,attempts,error,run_after,created_at FROM jobs WHERE ($1='' OR status=$1) ORDER BY created_at DESC LIMIT $2 OFFSET $3",[status,limit,(page-1)*limit]),audit:await rows('SELECT * FROM audit ORDER BY created_at DESC LIMIT $1 OFFSET $2',[limit,(page-1)*limit]),notificationsEnabled:process.env.NOTIFICATIONS_ENABLED==='true',creditsEnabled:process.env.VENDOR_CREDITS_ENABLED==='true',page};
 fail('NOT_FOUND','Modul tidak ditemukan.',404);
}
export async function updateTask(id:string,u:any,input:unknown){
 const b=z.object({deadline:z.iso.datetime({offset:true}).nullable(),priority:z.enum(['normal','high','urgent']),checklist:z.record(z.string().max(80),z.boolean()),designerId:uuid.nullable().optional()}).parse(input);
 await (await database()).transaction(async tx=>{const o=await one('SELECT * FROM orders WHERE id=$1 FOR UPDATE',[uuid.parse(id)],tx);if(!o)fail('NOT_FOUND','Pesanan tidak ditemukan.',404);if(u.role!=='superadmin'&&!(u.role==='designer'&&o.designer_id===u.id))fail('FORBIDDEN','Pekerjaan tidak ditugaskan kepada Anda.',403);
  if(b.designerId!==undefined&&u.role!=='superadmin'&&b.designerId!==o.designer_id)fail('FORBIDDEN','Assignment hanya dapat diubah admin.',403);
  if(b.designerId&&!await one("SELECT id FROM users WHERE id=$1 AND role IN ('designer','superadmin')",[b.designerId],tx))fail('INVALID_DESIGNER','Pilih anggota tim desain.');
  await tx.query('UPDATE orders SET deadline=$2,priority=$3,material_checklist=$4,designer_id=$5 WHERE id=$1',[o.id,b.deadline,b.priority,json(b.checklist),b.designerId===undefined?o.designer_id:b.designerId]);
  await tx.query('INSERT INTO audit(id,actor_id,event_id,action,detail) VALUES($1,$2,$3,$4,$5)',[uid(),u.id,null,'fulfillment.task',json({orderId:o.id,previous:{deadline:o.deadline,priority:o.priority,checklist:o.material_checklist,designerId:o.designer_id},...b})]);
 });return {saved:true};
}
export async function reviewPayment(id:string,actor:string,action:'verify'|'reject',reason?:string){
 return (await database()).transaction(async tx=>{
  const o=await one('SELECT * FROM orders WHERE id=$1 FOR UPDATE',[id],tx);if(!o)fail('NOT_FOUND','Pesanan tidak ditemukan.',404);
  if(action==='verify'&&o.status==='paid')return;
  if(!['payment_review','payment_rejected','rejected'].includes(o.status))fail('PAYMENT_STATE_CONFLICT','Status pembayaran sudah berubah; muat ulang pesanan.',409);
  if(action==='verify'&&!await one("SELECT id FROM documents WHERE order_id=$1 AND kind='payment-proof'",[id],tx))fail('PROOF_REQUIRED','Bukti pembayaran belum tersedia.',409);
  if(action==='reject')z.string().trim().min(5).max(1000).parse(reason);
  await tx.query('UPDATE orders SET status=$2 WHERE id=$1',[id,action==='verify'?'paid':'payment_rejected']);
  await tx.query('INSERT INTO audit(id,actor_id,action,detail) VALUES($1,$2,$3,$4)',[uid(),actor,'payment.'+action,json({orderId:id,reason:reason||null})]);
 });
}
export async function paymentAdjustment(id:string,u:any,input:unknown){
 if(u.role!=='superadmin')fail('FORBIDDEN','Khusus superadmin.',403);
 const b=z.object({kind:z.enum(['cancel','expire','refund']),amount:z.number().int().min(0).default(0),reason:z.string().min(5).max(1000),reference:z.string().max(200).default(''),idempotencyKey:uuid}).parse(input);
 return (await database()).transaction(async tx=>{
  const o=await one('SELECT * FROM orders WHERE id=$1 FOR UPDATE',[uuid.parse(id)],tx);if(!o)fail('NOT_FOUND','Pesanan tidak ditemukan.',404);
  const previous=await one('SELECT * FROM payment_adjustments WHERE idempotency_key=$1',[b.idempotencyKey],tx);if(previous){if(previous.order_id!==id||previous.kind!==b.kind||previous.amount!==b.amount)fail('IDEMPOTENCY_CONFLICT','Kunci transaksi telah dipakai untuk permintaan berbeda.',409);return {id:previous.id};}
  const refunded=await one("SELECT coalesce(sum(amount),0)::int AS amount FROM payment_adjustments WHERE order_id=$1 AND kind='refund'",[o.id],tx);
  if(b.kind==='refund'&&(!['paid','partially_refunded'].includes(o.status)||b.amount<=0||refunded.amount+b.amount>o.amount||!b.reference))fail('INVALID_REFUND','Refund memerlukan pembayaran terverifikasi, referensi transfer, dan nominal yang tidak melebihi sisa pembayaran.',409);
  if(b.kind!=='refund'&&['paid','partially_refunded','refunded','complimentary'].includes(o.status))fail('PAYMENT_ALREADY_SETTLED','Pembayaran sudah diselesaikan. Gunakan pencatatan refund manual.',409);
  if(b.kind==='expire'&&new Date(o.payment_expires_at)>new Date())fail('PAYMENT_NOT_EXPIRED','Batas pembayaran belum lewat.',409);
  const adjustmentId=uid();await tx.query('INSERT INTO payment_adjustments(id,order_id,actor_id,kind,amount,reason,reference,idempotency_key) VALUES($1,$2,$3,$4,$5,$6,$7,$8)',[adjustmentId,o.id,u.id,b.kind,b.amount,b.reason,b.reference,b.idempotencyKey]);
  await tx.query('UPDATE orders SET status=$2 WHERE id=$1',[o.id,b.kind==='refund'?refunded.amount+b.amount===o.amount?'refunded':'partially_refunded':b.kind==='cancel'?'cancelled':'expired']);
  await tx.query('INSERT INTO audit(id,actor_id,action,detail) VALUES($1,$2,$3,$4)',[uid(),u.id,'payment.'+b.kind,json({orderId:o.id,adjustmentId,...b})]);return {id:adjustmentId};
 });
}
