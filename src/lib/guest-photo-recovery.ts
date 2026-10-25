import type {DB} from './db';

export async function guestPhotoIntents(db:DB,eventId:string,guestId:string){
 return (await db.query("SELECT id,client_key AS key,state FROM intents WHERE event_id=$1 AND guest_id=$2 AND kind='disposable_photo' AND (state='finalized' OR (state IN ('reserved','uploaded') AND expires_at>now()))",[eventId,guestId])).rows;
}

export async function resetGuestPhotoReservations(db:DB,eventId:string,guestId:string){
 return db.transaction(async tx=>{
  // Same lock order as reserve/finalize; a concurrent finalized photo stays saved.
  await tx.query('SELECT id FROM events WHERE id=$1 FOR UPDATE',[eventId]);
  const result=await tx.query("UPDATE intents i SET state='expired',expires_at=now() WHERE i.event_id=$1 AND i.guest_id=$2 AND i.kind IN ('disposable_photo','photo_strip','gif') AND i.state IN ('reserved','uploaded') AND NOT EXISTS (SELECT 1 FROM media m WHERE m.intent_id=i.id) RETURNING i.id",[eventId,guestId]);
  return {released:result.rows.length};
 });
}
