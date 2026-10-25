import type {DB} from './db';
import {fail} from './domain';

export async function guestPhotoIntents(db:DB,eventId:string,guestId:string){
 return (await db.query("SELECT id,client_key AS key,state FROM intents WHERE event_id=$1 AND guest_id=$2 AND kind='disposable_photo' AND coalesce(snapshot->>'guestPhotoReset','false')<>'true' AND (state='finalized' OR (state IN ('reserved','uploaded') AND expires_at>now()))",[eventId,guestId])).rows;
}
export async function guestPhotoResetKeys(db:DB,eventId:string,guestId:string){return (await db.query("SELECT client_key AS key FROM intents WHERE event_id=$1 AND guest_id=$2 AND kind IN ('disposable_photo','photo_strip','gif') AND snapshot->>'guestPhotoReset'='true'",[eventId,guestId])).rows.map(row=>row.key as string);}

export async function resetGuestPhotoReservations(db:DB,eventId:string,guestId:string){
 return db.transaction(async tx=>{
  // Serialize against reserve/finalize. Reset refunds the guest's photo slots;
  // finalized assets remain accounted for in the event's storage/retention budget.
  const event=(await tx.query('SELECT id,legal_hold FROM events WHERE id=$1 FOR UPDATE',[eventId])).rows[0];
  if(!event)fail('NOT_FOUND','Acara tidak ditemukan.',404);
  if(event.legal_hold)fail('LEGAL_HOLD','Foto dilindungi penyelenggara dan belum dapat direset.',409);
  const deleted=await tx.query("UPDATE media SET moderation='deleted' WHERE event_id=$1 AND guest_id=$2 AND kind IN ('disposable_photo','photo_strip','gif') AND moderation<>'deleted' RETURNING id",[eventId,guestId]);
  const result=await tx.query("UPDATE intents SET state=CASE WHEN state IN ('reserved','uploaded') THEN 'expired' ELSE state END,expires_at=CASE WHEN state IN ('reserved','uploaded') THEN now() ELSE expires_at END,snapshot=jsonb_set(coalesce(snapshot,'{}'::jsonb),'{guestPhotoReset}','true'::jsonb,true) WHERE event_id=$1 AND guest_id=$2 AND kind IN ('disposable_photo','photo_strip','gif') AND coalesce(snapshot->>'guestPhotoReset','false')<>'true' RETURNING id",[eventId,guestId]);
  return {resetIntents:result.rows.length,deletedPhotos:deleted.rows.length,photoIntents:await guestPhotoIntents(tx,eventId,guestId),resetPhotoKeys:await guestPhotoResetKeys(tx,eventId,guestId)};
 });
}
