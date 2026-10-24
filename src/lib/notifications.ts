import {database,rows,one,json,type DB} from './db';
import {uid} from './auth';
export async function enqueueNotification(templateId:string,userId:string,values:Record<string,string>,key:string,eventId?:string,tx?:DB){
 const template=await one('SELECT * FROM notification_templates WHERE id=$1 AND enabled=true',[templateId],tx),user=await one('SELECT email FROM users WHERE id=$1',[userId],tx);if(!template||!user)return;
 const render=(value:string)=>value.replace(/\{\{(\w+)\}\}/g,(_,name)=>values[name]||'');
 await (tx||await database()).query('INSERT INTO notification_outbox(id,user_id,event_id,template_id,recipient,subject,body,template_version,idempotency_key) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9) ON CONFLICT(idempotency_key) DO NOTHING',[uid(),userId,eventId||null,templateId,user.email,render(template.subject),render(template.body),template.version,key]);
}
export async function processNotifications(){
 if(process.env.NOTIFICATIONS_ENABLED!=='true')return;
 const endpoint=process.env.EMAIL_PROVIDER_URL,token=process.env.EMAIL_PROVIDER_TOKEN;if(!endpoint||!token)return;
 if(new URL(endpoint).protocol!=='https:')throw Error('Email provider requires HTTPS.');
 await rows("UPDATE notification_outbox SET state='queued' WHERE state='sending' AND next_attempt_at<now()-interval '5 minutes'");
 const item=await (await database()).transaction(async tx=>{const next=await one("SELECT * FROM notification_outbox WHERE state='queued' AND next_attempt_at<=now() ORDER BY created_at FOR UPDATE SKIP LOCKED LIMIT 1",[],tx);if(next)await tx.query("UPDATE notification_outbox SET state='sending',attempts=attempts+1,next_attempt_at=now() WHERE id=$1",[next.id]);return next;});if(!item)return;
 try{const response=await fetch(endpoint,{method:'POST',headers:{Authorization:'Bearer '+token,'Content-Type':'application/json','Idempotency-Key':item.id},body:JSON.stringify({to:item.recipient,subject:item.subject,text:item.body}),signal:AbortSignal.timeout(15000)});if(!response.ok)throw Error('Provider HTTP '+response.status);await rows("UPDATE notification_outbox SET state='sent',sent_at=now(),error=NULL WHERE id=$1",[item.id]);}catch(err:any){await rows("UPDATE notification_outbox SET state=$2,error=$3,next_attempt_at=now()+interval '1 minute'*$4 WHERE id=$1",[item.id,item.attempts>=4?'failed':'queued',String(err.message).slice(0,300),2**Math.min(item.attempts,5)]);}
}
export async function scheduleRetention(){
 const due=await rows("SELECT * FROM events WHERE status<>'archived' AND end_at+((snapshot->>'exportDays')::int+7)*interval '1 day'<now() AND end_at+((snapshot->>'exportDays')::int+14)*interval '1 day'>now() LIMIT 100");for(const e of due)await enqueueNotification('retention',e.customer_id,{name:e.name,date:new Date(+new Date(e.end_at)+(e.snapshot.exportDays+14)*86400000).toLocaleDateString('id-ID')},'retention:'+e.id+':'+e.snapshot.exportDays,e.id);
 if(process.env.RETENTION_AUTO_PURGE_ENABLED==='true')await rows("INSERT INTO jobs(id,event_id,kind,payload) SELECT gen_random_uuid(),e.id,'retention.purge','{}'::jsonb FROM events e WHERE e.legal_hold=false AND e.status<>'archived' AND e.end_at+((e.snapshot->>'exportDays')::int+14)*interval '1 day'<now() AND NOT EXISTS(SELECT 1 FROM jobs j WHERE j.event_id=e.id AND j.kind='retention.purge' AND j.status IN ('queued','working','done'))");
}
