'use client';
import {useEffect,useRef,useState} from 'react';
import {Download,Trash2,X,Expand} from 'lucide-react';
import {downloadBlob,mediaFilename,type DraftMedia} from '@/lib/guest-draft';
export function useBlobUrl(blob?:Blob){const [url,setUrl]=useState('');useEffect(()=>{if(!blob){setUrl('');return;}const next=URL.createObjectURL(blob);setUrl(next);return()=>URL.revokeObjectURL(next);},[blob]);return url;}
export default function GuestDraftPreview({media,index=0,onRemove,download=false}:{media:DraftMedia;index?:number;onRemove?:()=>void;download?:boolean}){
 const url=useBlobUrl(media.blob),photo=media.kind!=='voice'&&media.kind!=='video_wish';
 const dialog=useRef<HTMLDialogElement>(null);
 return <div className={'gw-media '+(photo?'gw-photo':'gw-recording')}>
  {url&&(photo?<><button type="button" className="gw-photo-inspect" aria-label={'Lihat foto '+(index+1)+' utuh'} onClick={()=>dialog.current?.showModal()}><img src={url} alt={'Kenangan foto '+(index+1)} loading="lazy"/><span aria-hidden="true"><Expand size={14}/></span></button><dialog ref={dialog} className="gw-photo-dialog" aria-label={'Foto '+(index+1)+' utuh'}><form method="dialog"><button aria-label="Tutup foto" autoFocus><X size={22}/></button></form><img src={url} alt={'Kenangan foto '+(index+1)+' utuh'}/><p>Foto {index+1} · Ketuk tutup untuk kembali ke kenanganmu.</p></dialog></>:media.kind==='voice'?<audio src={url} controls preload="metadata"/>:<video src={url} controls playsInline preload="metadata"/>)}
  {onRemove&&<button type="button" className="gw-remove" aria-label={'Hapus foto '+(index+1)} onClick={onRemove}><Trash2 size={16}/></button>}
  {download&&<button type="button" className="gw-download outline" onClick={()=>downloadBlob(media.blob,mediaFilename(media,index))}><Download size={15}/> Simpan {photo?'foto':media.kind==='voice'?'suara':'video'}</button>}
 </div>;
}
