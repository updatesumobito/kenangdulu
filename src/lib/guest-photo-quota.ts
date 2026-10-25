import type {DraftMedia} from './guest-draft';

export type PhotoIntent={id:string;key:string;state:string};
export type SavedGuestPhoto={id:string;kind:DraftMedia['kind'];intentId:string;key:string;mime:string;url:string};

export function remainingDraftPhotos(session:{remaining:number;photoIntents?:PhotoIntent[]},media:DraftMedia[],limit:number){
 const counted=session.photoIntents||[];
 const local=media.filter(item=>item.kind==='disposable_photo'&&!item.mediaId&&!counted.some(intent=>intent.id===item.intentId||intent.key===item.key)).length;
 return Math.max(0,Math.min(limit,session.remaining)-local);
}

// Match by upload key as well as media ID: the finalize response can be lost.
export function recoverGuestPhotos(media:DraftMedia[],saved:SavedGuestPhoto[],resetPhotoKeys:string[]=[]){
 const reset=new Set(resetPhotoKeys),next=media.filter(item=>!reset.has(item.key));
 for(const photo of saved){
  if(reset.has(photo.key))continue;
  const index=next.findIndex(item=>item.mediaId===photo.id||item.key===photo.key||item.intentId===photo.intentId);
  if(index>=0)next[index]={...next[index],mediaId:photo.id,intentId:photo.intentId,readyUrl:photo.url};
  else next.push({id:photo.id,key:photo.key,kind:photo.kind,blob:new Blob([],{type:photo.mime}),mediaId:photo.id,intentId:photo.intentId,readyUrl:photo.url});
 }
 return next;
}
