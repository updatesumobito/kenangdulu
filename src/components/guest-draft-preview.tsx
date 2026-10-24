'use client';
import {useEffect,useRef,useState,type CSSProperties} from 'react';
import {Download,Trash2,X,Expand} from 'lucide-react';
import {downloadGuestFile,mediaFilename,type DraftMedia} from '@/lib/guest-draft';
import {ratioNumber} from '@/lib/media-presentation';
export function useBlobUrl(blob?:Blob){const [url,setUrl]=useState('');useEffect(()=>{if(!blob){setUrl('');return;}const next=URL.createObjectURL(blob);setUrl(next);return()=>URL.revokeObjectURL(next);},[blob]);return url;}
export default function GuestDraftPreview({media,index=0,onRemove,download=false}:{media:DraftMedia;index?:number;onRemove?:()=>void;download?:boolean}){
 const url=useBlobUrl(media.blob),photo=media.kind!=='voice'&&media.kind!=='video_wish';
 const dialog=useRef<HTMLDialogElement>(null);
 return <div className={'gw-media '+(photo?'gw-photo':'gw-recording')} style={!photo&&media.kind==='video_wish'&&media.presentation?{'--gm-preview-ratio':ratioNumber(media.presentation.ratio),'--gm-preview-bg':media.presentation.background} as CSSProperties:undefined}>
  {url&&(photo?<><button type="button" className="gw-photo-inspect" aria-label={'Lihat foto '+(index+1)+' utuh'} onClick={()=>dialog.current?.showModal()}><img src={url} alt={'Kenangan foto '+(index+1)} loading="lazy"/><span aria-hidden="true"><Expand size={14}/></span></button><dialog ref={dialog} className="gw-photo-dialog" aria-label={'Foto '+(index+1)+' utuh'}><form method="dialog"><button aria-label="Tutup foto" autoFocus><X size={22}/></button></form><img src={url} alt={'Kenangan foto '+(index+1)+' utuh'}/><p>Foto {index+1} · Ketuk tutup untuk kembali ke kenanganmu.</p></dialog></>:media.kind==='voice'?<audio src={url} controls preload="metadata"/>:<video src={url} controls playsInline preload="metadata"/>)}
  {onRemove&&<button type="button" className="gw-remove" aria-label={'Hapus foto '+(index+1)} onClick={onRemove}><Trash2 size={16}/></button>}
  {download&&<button type="button" className="gw-download outline" disabled={media.kind==='video_wish'&&!!media.presentation&&!media.readyUrl} onClick={()=>downloadGuestFile({blob:media.blob,filename:mediaFilename(media,index),url:media.readyUrl})}><Download size={15}/> {media.kind==='video_wish'&&media.presentation&&!media.readyUrl?'Menyiapkan hasil video…':`Simpan ${photo?'foto':media.kind==='voice'?'suara':'video'}`}</button>}
 </div>;
}
