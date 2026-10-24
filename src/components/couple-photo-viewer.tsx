'use client';

import {useEffect,useRef,useState} from 'react';
import {ArrowDownToLine,ArrowLeft,ArrowRight,Images,RefreshCw,X} from 'lucide-react';
import {api} from './ui';
import {albumDate} from '@/lib/album-date';

export type AlbumPhoto={id:string,author:string,url?:string,thumbnail?:string,created_at?:string};
type GalleryItem=AlbumPhoto&{mime?:string,processing:string,attachments?:AlbumPhoto[]};
export function galleryPhotos(items:GalleryItem[]){
 const photos=new Map<string,AlbumPhoto>();
 for(const item of items){
  if(item.processing==='ready'&&item.mime?.startsWith('image/')&&item.url)photos.set(item.id,item);
  for(const photo of item.attachments||[])if(!photos.has(photo.id))photos.set(photo.id,photo);
 }
 return [...photos.values()];
}

export default function CouplePhotoViewer({photo,initialPhotos,slug,albumId,timeZone,onClose}:{photo:AlbumPhoto,initialPhotos:AlbumPhoto[],slug:string,albumId:string,timeZone:string,onClose:()=>void}){
 const dialog=useRef<HTMLDialogElement>(null),touch=useRef<{x:number,y:number}|null>(null);
 const [photos,setPhotos]=useState(()=>initialPhotos.some(item=>item.id===photo.id)?initialPhotos:[photo,...initialPhotos]);
 const [activeId,setActiveId]=useState(photo.id),[loading,setLoading]=useState(true),[error,setError]=useState(''),[retry,setRetry]=useState(0),[imageFailed,setImageFailed]=useState(false);
 const index=Math.max(0,photos.findIndex(item=>item.id===activeId)),current=photos[index];
 const date=albumDate(current.created_at,timeZone);
 function move(direction:number){const next=photos[index+direction];if(next)setActiveId(next.id)}
 useEffect(()=>{dialog.current?.showModal()},[]);
 useEffect(()=>{setImageFailed(false);dialog.current?.querySelector('[aria-current="true"]')?.scrollIntoView({block:'nearest',inline:'nearest',behavior:'instant'})},[activeId]);
 useEffect(()=>{
  const controller=new AbortController();let active=true;
  setLoading(true);setError('');
  void (async()=>{
   try{
    const items:GalleryItem[]=[];let page=1,hasMore=true;
    while(hasMore){
     const result=await api('couple/events/'+slug+'/gallery?album='+encodeURIComponent(albumId)+'&page='+page,{signal:controller.signal});
     items.push(...result.items);hasMore=result.hasMore;page++;
    }
    if(active){const complete=galleryPhotos(items);setPhotos(complete.some(item=>item.id===photo.id)?complete:[photo,...complete])}
   }catch(err:any){if(active&&err.name!=='AbortError')setError(err.message||'Foto lainnya belum dapat dimuat.')}
   finally{if(active)setLoading(false)}
  })();
  return()=>{active=false;controller.abort()};
 },[slug,albumId,photo.id,retry]);
 return <dialog ref={dialog} className="couple-photo-dialog couple-gallery-viewer" aria-labelledby="couple-viewer-title" onClose={onClose} onClick={ev=>{if(ev.target===ev.currentTarget){const r=ev.currentTarget.getBoundingClientRect();if(ev.clientX<r.left||ev.clientX>r.right||ev.clientY<r.top||ev.clientY>r.bottom)dialog.current?.close()}}} onKeyDown={ev=>{if(ev.key==='ArrowLeft'){ev.preventDefault();move(-1)}if(ev.key==='ArrowRight'){ev.preventDefault();move(1)}}}>
  <header><div><small>GALERI KENANGAN</small><h2 id="couple-viewer-title">{current.author||'Tamu'}</h2></div><button type="button" className="couple-viewer-close" aria-label="Tutup galeri foto" onClick={()=>dialog.current?.close()}><X size={21}/></button></header>
  <div className="couple-viewer-stage" onTouchStart={ev=>{if(ev.touches.length===1)touch.current={x:ev.touches[0].clientX,y:ev.touches[0].clientY};else touch.current=null}} onTouchEnd={ev=>{const start=touch.current;touch.current=null;if(!start)return;const dx=ev.changedTouches[0].clientX-start.x,dy=ev.changedTouches[0].clientY-start.y;if(Math.abs(dx)>50&&Math.abs(dx)>Math.abs(dy)*1.3)move(dx<0?1:-1)}} onTouchCancel={()=>{touch.current=null}}>
   {imageFailed?<div className="couple-viewer-unavailable"><Images size={32}/><p>Foto belum dapat ditampilkan.</p><a href={current.url} target="_blank" rel="noreferrer">Buka foto asli</a></div>:<img key={current.id} src={current.url} alt={'Kenangan dari '+current.author} onError={()=>setImageFailed(true)} draggable={false}/>}
   {photos.length>1&&<><button type="button" className="couple-viewer-arrow previous" disabled={index===0} aria-label="Foto sebelumnya" onClick={()=>move(-1)}><ArrowLeft size={21}/></button><button type="button" className="couple-viewer-arrow next" disabled={index===photos.length-1} aria-label="Foto berikutnya" onClick={()=>move(1)}><ArrowRight size={21}/></button></>}
   <span className="couple-viewer-counter" role="status" aria-live="polite">{index+1} / {photos.length}{loading?' · Memuat…':''}</span>
  </div>
  <div className="couple-viewer-caption"><div><strong>Setiap momen, sebuah cerita.</strong>{current.created_at&&<time dateTime={date.dateTime}>{date.label}</time>}<span>Geser foto atau gunakan tombol panah.</span></div><a className="button couple-viewer-download" href={current.url+(current.url?.includes('?')?'&':'?')+'download=1'} download><ArrowDownToLine size={18}/><span>Unduh foto</span></a></div>
  {error&&<p className="couple-viewer-error" role="alert">{error}<button type="button" onClick={()=>setRetry(value=>value+1)}><RefreshCw size={14}/>Coba lagi</button></p>}
  {photos.length>1&&<nav className="couple-viewer-thumbnails" aria-label="Pilih foto">{photos.map((item,i)=><button type="button" key={item.id} aria-label={'Tampilkan foto '+(i+1)+' dari '+item.author} aria-current={item.id===current.id?'true':undefined} onClick={()=>setActiveId(item.id)}><img src={item.thumbnail||item.url} alt="" loading="lazy" onError={ev=>{if(item.url&&ev.currentTarget.getAttribute('src')!==item.url)ev.currentTarget.src=item.url}}/></button>)}</nav>}
 </dialog>;
}
