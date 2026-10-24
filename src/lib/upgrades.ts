import {z} from 'zod';
import {database,rows,one,json,type DB} from './db';
import {uid,eventAccess} from './auth';
import {fail,id as uuid,presetFrame} from './domain';
import {canExportQrPdf} from './qr-entitlement';
const tiers=['mini','classic','celebration','signature'];
async function currentTier(e:any,tx?:DB){const original=await one('SELECT plan_id FROM orders WHERE id=$1',[e.order_id],tx),applied=await rows("SELECT o.plan_id FROM entitlement_changes c JOIN orders o ON o.id=c.order_id WHERE c.event_id=$1 AND o.brief->>'upgradeEventId'=$1::text",[e.id],tx);return Math.max(tiers.indexOf(e.snapshot._packageId||original.plan_id),...applied.map(o=>tiers.indexOf(o.plan_id)));}
export async function upgradeOptions(e:any){const rank=await currentTier(e);return (await rows('SELECT id,name,price,partner_price,config,version FROM plans ORDER BY price')).filter(p=>tiers.indexOf(p.id)>rank);}
export async function createUpgradeOrder(e:any,u:any,input:unknown){
 await eventAccess(u,e,'export');if(e.channel==='DIRECT_MANAGED'&&e.customer_id!==u.id)fail('FORBIDDEN','Pemilik acara diperlukan.',403);if(e.channel==='PARTNER_SELF_SERVICE'&&!await one('SELECT id FROM organizations WHERE id=$1 AND owner_id=$2',[e.org_id,u.id]))fail('FORBIDDEN','Pemilik organisasi diperlukan.',403);
 const b=z.object({planId:z.string().max(40),confirmFullPackage:z.literal(true)}).parse(input),plan=(await upgradeOptions(e)).find(p=>p.id===b.planId);if(!plan)fail('INVALID_UPGRADE','Pilih paket pada tingkat yang lebih tinggi.');const amount=e.channel==='DIRECT_MANAGED'?plan.price:plan.partner_price;if(amount===null)fail('PARTNER_PRICING_UNDECIDED','Harga mitra belum ditetapkan.',409);const old=await one('SELECT brief FROM orders WHERE id=$1',[e.order_id]),id=uid();await rows('INSERT INTO orders(id,user_id,org_id,channel,plan_id,amount,snapshot,brief) VALUES($1,$2,$3,$4,$5,$6,$7,$8)',[id,u.id,e.org_id,e.channel,plan.id,amount,json(plan.config),json({...old.brief,upgradeEventId:e.id,notes:'Upgrade paket penuh: '+(old.brief.notes||'')})]);await rows('INSERT INTO audit(id,actor_id,event_id,action,detail) VALUES($1,$2,$3,$4,$5)',[uid(),u.id,e.id,'upgrade.order',json({orderId:id,planId:plan.id,amount,planVersion:plan.version})]);return {id,amount};
}
export async function applyUpgrade(e:any,u:any,input:unknown){
 if(u.role!=='superadmin')fail('FORBIDDEN','Khusus superadmin.',403);const b=z.object({orderId:uuid,reason:z.string().min(5).max(500)}).parse(input);
 return (await database()).transaction(async tx=>{
  const fresh=await one('SELECT * FROM events WHERE id=$1 FOR UPDATE',[e.id],tx),order=await one('SELECT * FROM orders WHERE id=$1 FOR UPDATE',[b.orderId],tx);if(!order||order.brief.upgradeEventId!==e.id||order.status!=='paid')fail('UPGRADE_PAYMENT_REQUIRED','Upgrade harus cocok dengan acara dan dibayar.',409);
  if(await one('SELECT id FROM entitlement_changes WHERE order_id=$1',[order.id],tx))return {applied:true};if(tiers.indexOf(order.plan_id)<=await currentTier(fresh,tx))fail('INVALID_UPGRADE','Acara sudah memakai paket setara atau lebih tinggi.',409);
  const extras=await rows("SELECT o.brief->'addonSnapshot' AS addon FROM entitlement_changes c JOIN orders o ON o.id=c.order_id WHERE c.event_id=$1 AND o.brief->>'addonEventId'=$1::text",[e.id],tx),next={...fresh.snapshot,...order.snapshot,_packageId:order.plan_id};
  for(const item of extras){const a=item.addon;next[a.entitlement_key]=Number(next[a.entitlement_key]||0)+Number(a.units)*a.quantity;}
  // Retain already purchased rights if catalogue changes made a higher tier smaller in one dimension.
  for(const [key,value] of Object.entries(fresh.snapshot))if(typeof value==='number')next[key]=Math.max(value,Number(next[key]||0));else if(typeof value==='boolean')next[key]=value||!!next[key];
  next.qrPdf=canExportQrPdf(fresh.snapshot)||canExportQrPdf(order.snapshot);
  await tx.query('INSERT INTO entitlement_changes(id,event_id,order_id,actor_id,previous_snapshot,new_snapshot,reason) VALUES($1,$2,$3,$4,$5,$6,$7)',[uid(),e.id,order.id,u.id,json(fresh.snapshot),json(next),b.reason]);await tx.query('UPDATE events SET snapshot=$2 WHERE id=$1',[e.id,json(next)]);await tx.query("UPDATE orders SET fulfillment='delivered' WHERE id=$1",[order.id]);if(!fresh.snapshot.frames&&next.frames)await tx.query('INSERT INTO frames(id,event_id,name,schema) VALUES($1,$2,$3,$4)',[uid(),e.id,'Editorial',json(presetFrame(4))]);await tx.query('INSERT INTO audit(id,actor_id,event_id,action,detail) VALUES($1,$2,$3,$4,$5)',[uid(),u.id,e.id,'upgrade.apply',json({orderId:order.id,reason:b.reason,retainedAddons:extras.length})]);return {applied:true};
 });
}
