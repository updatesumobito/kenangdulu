import {rows,one,database,json,dataDir} from './db';
import {uid} from './auth';
import {processMedia} from './media';
import * as storage from './storage';
import {ZipArchive} from 'archiver';
import {createWriteStream} from 'node:fs';
import {readFile,unlink,mkdir,stat} from 'node:fs/promises';
import path from 'node:path';
import {renderEventExport,cleanExpiredExports} from './event-exports';
import {processNotifications,scheduleRetention} from './notifications';
import {expireCredits} from './vendor-credits';
const global=globalThis as typeof globalThis&{kvWorking?:boolean,kvTimer?:ReturnType<typeof setInterval>};
export async function processJobs(maxJobs=25){if(global.kvWorking)return;global.kvWorking=true;try{
 await rows("INSERT INTO worker_health(id,detail) VALUES('media-worker',$1) ON CONFLICT(id) DO UPDATE SET last_seen_at=now(),detail=excluded.detail",[json({mode:process.env.WORKER_EMBEDDED==='0'?'external':'embedded'})]);
 await rows("WITH expired AS (UPDATE orders SET status='expired' WHERE status IN ('awaiting_payment','payment_rejected','rejected') AND payment_expires_at<now() RETURNING id) INSERT INTO payment_adjustments(id,order_id,kind,reason,idempotency_key) SELECT gen_random_uuid(),id,'expire','Batas pembayaran otomatis berakhir',gen_random_uuid() FROM expired");
 await expireCredits();await scheduleRetention();await processNotifications();await cleanExpiredExports();
 await rows("UPDATE jobs SET status='queued' WHERE status='working' AND run_after<now()-interval '5 minutes'");
 await rows("UPDATE intents SET state='expired' WHERE state IN ('reserved','uploaded') AND expires_at<now()");
 const parts=await rows("SELECT p.* FROM upload_parts p JOIN intents i ON i.id=p.intent_id WHERE i.state IN ('finalized','expired','purged','failed') LIMIT 100");for(const part of parts){await storage.remove(part.object_key);await rows('DELETE FROM upload_parts WHERE intent_id=$1 AND start_byte=$2',[part.intent_id,part.start_byte]);}
 const expired=await rows("SELECT id,object_key FROM intents WHERE state='expired' LIMIT 50");for(const i of expired){await storage.remove(i.object_key);await rows("UPDATE intents SET state='purged' WHERE id=$1 AND state='expired'",[i.id]);}
 for(let n=0;n<maxJobs;n++){
  const job=await (await database()).transaction(async tx=>{const j=await one("SELECT * FROM jobs WHERE status='queued' AND run_after<=now() ORDER BY created_at FOR UPDATE SKIP LOCKED LIMIT 1",[],tx);if(j)await tx.query("UPDATE jobs SET status='working',attempts=attempts+1,run_after=now() WHERE id=$1",[j.id]);return j});if(!job)break;
  const heartbeat=setInterval(()=>{void rows("UPDATE jobs SET run_after=now() WHERE id=$1 AND status='working'",[job.id]).catch(()=>{})},30000);heartbeat.unref();
  try{let result:any={};
   if(job.kind==='media.process'){const m=await one('SELECT * FROM media WHERE id=$1',[job.payload.mediaId]);if(m&&m.processing!=='ready')await processMedia(m);}
   else if(job.kind==='export.zip'||job.kind==='book.pdf')result=await renderEventExport(job,await one('SELECT * FROM events WHERE id=$1',[job.event_id]));
   else if(job.kind==='frame-assets.cleanup'){for(const key of job.payload.keys||[])if(!await one('SELECT id FROM frame_assets WHERE object_key=$1 AND event_id=$2',[key,job.event_id]))await storage.remove(key);result={cleaned:true};}
   else if(job.kind==='retention.purge'){
    const e=await one('SELECT * FROM events WHERE id=$1',[job.event_id]);if(e.legal_hold)throw Object.assign(Error('Event has legal hold'),{code:'LEGAL_HOLD'});if(Date.now()<+new Date(e.end_at)+(e.snapshot.exportDays+14)*86400000)throw Error('Retention grace period has not ended');
    const media=await rows('SELECT * FROM media WHERE event_id=$1',[e.id]);for(const m of media){if(m.object_key)await storage.remove(m.object_key);if(m.thumbnail_key)await storage.remove(m.thumbnail_key);}await rows("UPDATE media SET moderation='deleted' WHERE event_id=$1",[e.id]);
    const assets=await rows('SELECT object_key FROM frame_assets WHERE event_id=$1 UNION ALL SELECT object_key FROM event_assets WHERE event_id=$1',[e.id]);for(const asset of assets)await storage.remove(asset.object_key);
    await rows('DELETE FROM frame_assets WHERE event_id=$1',[e.id]);await rows('DELETE FROM event_assets WHERE event_id=$1',[e.id]);await rows('UPDATE preview_tokens SET revoked=true WHERE event_id=$1',[e.id]);await rows('UPDATE display_tokens SET revoked=true WHERE event_id=$1',[e.id]);await rows("UPDATE events SET status='archived' WHERE id=$1",[e.id]);
   }
   await rows("UPDATE jobs SET status='done',result=$2,error=NULL WHERE id=$1",[job.id,json(result)]);
  }catch(err:any){const failed=job.attempts>=2;await rows("UPDATE jobs SET status=$2,error=$3,run_after=now()+interval '15 seconds' WHERE id=$1",[job.id,failed?'failed':'queued',String(err.code||'PROCESSING_ERROR').slice(0,200)]);if(failed&&job.payload.mediaId){await rows("UPDATE media SET processing='failed' WHERE id=$1",[job.payload.mediaId]);await rows("UPDATE intents SET state='failed' WHERE id=(SELECT intent_id FROM media WHERE id=$1)",[job.payload.mediaId]);}}finally{clearInterval(heartbeat)}
 }
 }finally{global.kvWorking=false;if(!process.env.VERCEL&&await one("SELECT 1 FROM jobs WHERE status='queued' AND run_after<=now() LIMIT 1")){const t=setTimeout(()=>{void processJobs().catch(()=>{})},100);t.unref();}}}
export function startWorker(){if(process.env.VERCEL||process.env.WORKER_EMBEDDED==='0')return;if(!global.kvTimer){global.kvTimer=setInterval(()=>{void processJobs().catch(()=>{})},3000);global.kvTimer.unref();}void processJobs().catch(()=>{});}
