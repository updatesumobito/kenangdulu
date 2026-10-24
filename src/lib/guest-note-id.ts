import {createHash} from 'node:crypto';

// RFC 9562 UUIDv5 in the standard URL namespace. The existing media primary
// key provides database uniqueness without adding a column or migration.
export function guestNoteId(eventId:string,guestId:string,key:string){
 const namespace=Buffer.from('6ba7b8119dad11d180b400c04fd430c8','hex');
 const bytes=createHash('sha1').update(namespace).update(`urn:komukuna:guest-note:${eventId}:${guestId}:${key}`).digest().subarray(0,16);
 bytes[6]=(bytes[6]&0x0f)|0x50;bytes[8]=(bytes[8]&0x3f)|0x80;
 const hex=bytes.toString('hex');return `${hex.slice(0,8)}-${hex.slice(8,12)}-${hex.slice(12,16)}-${hex.slice(16,20)}-${hex.slice(20)}`;
}
