// Focused regression for missing camera photos and exhausted quota. In-memory DB only.
import assert from 'node:assert/strict';
import {PGlite} from '@electric-sql/pglite';
import {guestPhotoIntents,resetGuestPhotoReservations} from '../src/lib/guest-photo-recovery';
import {remainingDraftPhotos,recoverGuestPhotos} from '../src/lib/guest-photo-quota';
import type {DB} from '../src/lib/db';
import type {DraftMedia} from '../src/lib/guest-draft';

const pg=new PGlite();
const adapter=(connection:any):DB=>({query:(sql,params)=>connection.query(sql,params),exec:sql=>connection.exec(sql),transaction:fn=>connection.transaction((tx:any)=>fn(adapter(tx)))});
const db=adapter(pg),blob=new Blob(['photo'],{type:'image/jpeg'});
const draft=(id:string,patch:Partial<DraftMedia>={}):DraftMedia=>({id,key:id,kind:'disposable_photo',blob,...patch});
try{
 await pg.exec(`
  CREATE TABLE events(id text PRIMARY KEY);
  CREATE TABLE intents(id text PRIMARY KEY,event_id text,guest_id text,kind text,state text,client_key text,expires_at timestamptz);
  CREATE TABLE media(id text PRIMARY KEY,intent_id text);
  INSERT INTO events VALUES ('event-a'),('event-b');
  INSERT INTO intents VALUES
   ('saved','event-a','guest-a','disposable_photo','finalized','key-saved',now()+interval '1 hour'),
   ('pending','event-a','guest-a','disposable_photo','uploaded','key-pending',now()+interval '1 hour'),
   ('reserved','event-a','guest-a','disposable_photo','reserved','key-reserved',now()+interval '1 hour'),
   ('old','event-a','guest-a','disposable_photo','reserved','key-old',now()-interval '1 hour'),
   ('other-guest','event-a','guest-b','disposable_photo','reserved','key-guest-b',now()+interval '1 hour'),
   ('other-event','event-b','guest-a','disposable_photo','reserved','key-event-b',now()+interval '1 hour'),
   ('voice','event-a','guest-a','voice','reserved','key-voice',now()+interval '1 hour'),
   ('linked','event-a','guest-a','photo_strip','uploaded','key-linked',now()+interval '1 hour');
  INSERT INTO media VALUES ('media-saved','saved'),('media-linked','linked');
 `);
 const photoIntents=await guestPhotoIntents(db,'event-a','guest-a');
 assert.equal(photoIntents.length,3);
 const pending=draft('pending-local',{key:'key-pending',intentId:'pending'}),newPhoto=draft('new-local');
 assert.equal(remainingDraftPhotos({remaining:2,photoIntents:photoIntents as any},[pending,newPhoto],5),1,'Server reservation must not consume a second local slot');
 assert.equal(remainingDraftPhotos({remaining:2,photoIntents:photoIntents as any},[draft('pending-local',{key:'key-pending'})],5),2,'Lost onIntent response still matches the upload key');
 assert.equal(remainingDraftPhotos({remaining:2,photoIntents:photoIntents as any},[draft('old-local',{intentId:'old'})],5),1,'Expired reservation must count as a local photo again');
 const saved={id:'media-saved',kind:'disposable_photo' as const,intentId:'saved',key:'key-saved',mime:'image/jpeg',url:'/api/v1/guest/media/media-saved/file'};
 const recovered=recoverGuestPhotos([], [saved]);
 assert.equal(recovered[0].readyUrl,saved.url);assert.equal(recovered[0].mediaId,saved.id);
 assert.equal(remainingDraftPhotos({remaining:0,photoIntents:photoIntents as any},recovered,3),0);
 const merged=recoverGuestPhotos([draft('lost-finalize',{key:'key-saved'}),pending],[saved]);
 assert.equal(merged.length,2);assert.equal(merged[0].mediaId,saved.id);assert.equal(merged[0].blob,blob);
 assert.equal(recoverGuestPhotos(merged,[saved]).length,2,'Recovery must be idempotent');
 assert.deepEqual(await resetGuestPhotoReservations(db,'event-a','guest-a'),{released:3});
 const states=Object.fromEntries((await pg.query<{id:string;state:string}>('SELECT id,state FROM intents')).rows.map(row=>[row.id,row.state]));
 assert.equal(states.saved,'finalized');assert.equal(states.linked,'uploaded');assert.equal(states.pending,'expired');assert.equal(states.reserved,'expired');
 assert.equal(states['other-guest'],'reserved');assert.equal(states['other-event'],'reserved');assert.equal(states.voice,'reserved');
 assert.equal((await guestPhotoIntents(db,'event-a','guest-a')).length,1);
 assert.deepEqual(await resetGuestPhotoReservations(db,'event-a','guest-a'),{released:0});
 console.log('Photo recovery regression: no double quota deduction, saved-photo recovery and deduplication, expired-upload reset, guest/event isolation, finalized photos and other media preserved. In-memory PostgreSQL only.');
}finally{await pg.close();}
