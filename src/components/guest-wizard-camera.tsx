'use client';
import {useEffect,useRef,useState,type CSSProperties} from 'react';
import dynamic from 'next/dynamic';
import {Camera,FlipHorizontal2,Timer,Images} from 'lucide-react';
import {openCamera,centerCrop} from '@/lib/browser-camera';
import {canvasBlob,filters} from '@/lib/renderer';
import {draftMedia,isDraftPhoto,type DraftMedia} from '@/lib/guest-draft';
import GuestDraftPreview,{useBlobUrl} from './guest-draft-preview';
import GuestFilePicker from './guest-file-picker';
import GuestRatioPicker from './guest-ratio-picker';
import {Notice} from './ui';
const ExtraCamera=dynamic(()=>import('./guest-camera'),{ssr:false,loading:()=> <p role="status">Menyiapkan kamera kreatif…</p>});
export default function GuestWizardCamera({event:e,session,media,onAdd,onRemove,onBusy}:{event:any;session:any;media:DraftMedia[];onAdd:(item:DraftMedia)=>void;onRemove:(id:string)=>void;onBusy:(busy:boolean)=>void}){
 const [ratio,setRatio]=useState('3:4'),[timer,setTimer]=useState(3),[facing,setFacing]=useState<'user'|'environment'>('user'),[active,setActive]=useState(false),[starting,setStarting]=useState(false),[working,setWorking]=useState(false),[countdown,setCountdown]=useState(0),[error,setError]=useState(''),[filter,setFilter]=useState(0),[extra,setExtra]=useState('');
 const video=useRef<HTMLVideoElement>(null),stream=useRef<MediaStream|null>(null),request=useRef(0),busy=useRef(false),delay=useRef<{timer:ReturnType<typeof setTimeout>;resolve:()=>void}|null>(null),alive=useRef(true);
 const photos=media.filter(isDraftPhoto),normal=media.filter(m=>m.kind==='disposable_photo'&&!m.mediaId).length,remaining=Math.max(0,session.remaining-normal),settings=session.captureSnapshot.settings;
 const tray=useRef<HTMLDivElement>(null),lastPhoto=useBlobUrl(photos.at(-1)?.blob);
 const ordinary=e.settings.modes.includes('disposable_photo');
 const extras=e.slug==='wahyu-novita'?[]:['photo_strip','gif'].filter(mode=>e.settings.modes.includes(mode)&&(mode!=='photo_strip'||e.snapshot.frames)&&(mode!=='gif'||e.snapshot.creative));
 useEffect(()=>{onBusy(starting||working);},[starting,working,onBusy]);
 function stop(){request.current++;stream.current?.getTracks().forEach(t=>t.stop());stream.current=null;if(delay.current){clearTimeout(delay.current.timer);delay.current.resolve();delay.current=null;}setActive(false);setStarting(false);setCountdown(0);}
 useEffect(()=>{alive.current=true;const hide=()=>{if(document.hidden)stop();};document.addEventListener('visibilitychange',hide);return()=>{alive.current=false;request.current++;stream.current?.getTracks().forEach(t=>t.stop());if(delay.current){clearTimeout(delay.current.timer);delay.current.resolve();}document.removeEventListener('visibilitychange',hide);onBusy(false);};},[onBusy]);
 async function start(next=facing){if(busy.current)return;stop();const id=request.current;setStarting(true);setError('');try{const s=await openCamera(next,false,{profile:'photo'});if(request.current!==id||!alive.current){s.getTracks().forEach(t=>t.stop());return;}stream.current=s;const actual=s.getVideoTracks()[0].getSettings().facingMode;setFacing(actual==='environment'?'environment':actual==='user'?'user':next);if(video.current){video.current.srcObject=s;await video.current.play();}if(request.current===id)setActive(true);}catch(err:any){if(request.current===id){stop();setError(err.name==='NotAllowedError'?'Izin kamera belum aktif. Buka pengaturan situs di browser, izinkan Kamera, lalu coba lagi.':err.message);}}finally{if(request.current===id)setStarting(false);}}
 async function imageBlob(source:CanvasImageSource,width:number,height:number){
  const target=ratio==='9:16'?9/16:3/4,crop=centerCrop(width,height,target),sw=crop.width,sh=crop.height;
  const scale=Math.min(1,2400/Math.max(sw,sh)),c=document.createElement('canvas');c.width=Math.round(sw*scale);c.height=Math.round(sh*scale);const ctx=c.getContext('2d')!;
  ctx.filter=filters[filter].css;if(source===video.current&&facing==='user'){ctx.translate(c.width,0);ctx.scale(-1,1);}ctx.drawImage(source,crop.x,crop.y,sw,sh,0,0,c.width,c.height);
  if(settings.timestamp){ctx.setTransform(1,0,0,1,0,0);ctx.filter='none';ctx.font=`${Math.max(16,Math.round(c.width*.025))}px monospace`;ctx.fillStyle='#fff';ctx.shadowColor='#000';ctx.shadowBlur=4;ctx.fillText(new Date().toLocaleString('id-ID',{timeZone:e.timezone}),20,c.height-24);}
  return canvasBlob(c);
 }
 async function capture(){if(busy.current||starting||!active||remaining<=0)return;busy.current=true;setWorking(true);const id=request.current;setError('');try{for(let n=timer;n>0;n--){setCountdown(n);await new Promise<void>(resolve=>{delay.current={timer:setTimeout(resolve,1000),resolve};});if(id!==request.current)return;}setCountdown(0);const v=video.current;if(!v?.videoWidth)throw Error('Kamera belum siap. Coba lagi.');const blob=await imageBlob(v,v.videoWidth,v.videoHeight);if(alive.current&&id===request.current)onAdd(draftMedia('disposable_photo',blob));}catch(err:any){setError(err.message);}finally{busy.current=false;if(alive.current){setWorking(false);setCountdown(0);}}}
 async function fromFile(file:File){if(busy.current||remaining<=0)return;busy.current=true;setWorking(true);setError('');const url=URL.createObjectURL(file),id=request.current;try{if(!['image/jpeg','image/png','image/webp'].includes(file.type))throw Error('Pilih foto JPG, PNG, atau WebP.');if(file.size>12*1024**2)throw Error('Foto maksimal 12 MB.');const img=new Image();img.src=url;await img.decode();const blob=await imageBlob(img,img.naturalWidth,img.naturalHeight);if(alive.current&&id===request.current)onAdd(draftMedia('disposable_photo',blob));}catch(err:any){setError(err.message);}finally{URL.revokeObjectURL(url);busy.current=false;if(alive.current)setWorking(false);}}
 return <div className="gw-capture">
  <div className="gw-capture-summary" role="status" aria-live="polite"><span><strong>{photos.length} foto siap</strong><small>Belum dikirim · tersimpan di draft</small></span>{ordinary&&<span className="gw-remaining">Sisa <strong>{remaining}</strong> jepretan</span>}</div>
  {(ordinary||extras.length>1)&&extras.length>0&&<div className="gw-mode-picker" role="group" aria-label="Jenis foto">{ordinary&&<button type="button" className={!extra?'selected':''} disabled={starting||working} onClick={()=>{stop();setExtra('');}}>Foto biasa</button>}{extras.map(mode=><button type="button" key={mode} className={extra===mode?'selected':''} disabled={starting||working} onClick={()=>{stop();setExtra(mode);}}>{mode==='photo_strip'?'Photo strip':'GIF'} <small>opsional</small></button>)}</div>}
  {(!ordinary||extra)?<ExtraCamera key={extra||extras[0]} event={e} session={session} mode={extra||extras[0]} onSaved={async()=>{}} embedded onBusyChange={onBusy} onCapture={blob=>onAdd(draftMedia((extra||extras[0]) as 'photo_strip'|'gif',blob))}/>:<>
   <div className="gw-camera-toolbar"><GuestRatioPicker kind="foto" value={ratio} disabled={working||starting} onChange={setRatio}/><label className="gw-timer"><Timer size={16}/><select aria-label="Timer foto" value={timer} disabled={working||starting} onChange={ev=>setTimer(Number(ev.target.value))}>{[0,3,5,10].map(n=><option key={n} value={n}>{n===0?'Tanpa timer':n+' detik'}</option>)}</select></label></div>
   <div className="gw-viewfinder" data-ratio={ratio} style={{'--gw-ratio':ratio==='9:16'?9/16:3/4} as CSSProperties}>
    <div className="gw-sensor"><video ref={video} autoPlay playsInline muted style={{transform:facing==='user'?'scaleX(-1)':'none',filter:filters[filter].css}}/></div>
    {!active&&<div className="gw-camera-idle"><Camera size={34} strokeWidth={1.4}/><h3>Momenmu dimulai di sini.</h3><p>Ketuk Buka kamera, lalu pilih <strong>Izinkan</strong> saat browser meminta akses kamera.</p><button type="button" disabled={starting||remaining<=0} onClick={()=>void start()}>{starting?'Membuka kamera…':'Buka kamera'}</button></div>}
    {active&&<><span className="gw-camera-tag">{facing==='user'?'Kamera depan':'Kamera belakang'}</span><div className="gw-viewfinder-controls"><button type="button" aria-label="Balik kamera" disabled={working||starting} onClick={()=>void start(facing==='user'?'environment':'user')}><FlipHorizontal2 size={23}/></button><button type="button" className="gw-shutter" aria-label="Ambil foto" disabled={working||starting||remaining<=0} onClick={()=>void capture()}><span/></button><button type="button" className="gw-last-photo" aria-label="Lihat foto terakhir di draft" disabled={!photos.length||working} onClick={()=>tray.current?.scrollIntoView({behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'center'})}>{lastPhoto?<img src={lastPhoto} alt=""/>:<Images size={20}/>}</button></div></>}
    {countdown>0&&<strong className="gw-countdown" role="status" aria-live="assertive">{countdown}</strong>}
   </div>
   {filters.slice(0,e.snapshot.filters||1).length>1&&<div className="gw-filters" role="group" aria-label="Filter foto">{filters.slice(0,e.snapshot.filters||1).map((item,i)=><button type="button" key={item.name} aria-pressed={filter===i} disabled={working} onClick={()=>setFilter(i)}>{i===0?'Tanpa filter':item.name}</button>)}</div>}
  </>}
  {error&&<Notice error>{error}</Notice>}{ordinary&&remaining===0&&<Notice>Jatah foto sudah terpakai. Kamu bisa lanjut dengan foto yang sudah siap.</Notice>}
  {settings.allowUpload&&ordinary&&!extra&&<GuestFilePicker kind="foto" accept="image/jpeg,image/png,image/webp" description="JPG, PNG, atau WebP · Maks. 12 MB · Mengikuti ukuran foto pilihanmu" disabled={working||starting||remaining<=0} onFile={file=>void fromFile(file)}/>}
  {photos.length>0&&<div ref={tray} className="gw-photo-tray" aria-label="Foto yang siap dikirim">{photos.map((item,i)=><GuestDraftPreview key={item.id} media={item} index={i} onRemove={working||starting||item.mediaId?undefined:()=>onRemove(item.id)}/>)}</div>}
  {photos.length>0&&<div className="gw-capture-feedback" role="status"><strong>Foto masuk ke draft.</strong><span>Ambil lagi atau lanjut dengan foto ini.{ordinary&&` Sisa ${remaining} jepretan.`}</span></div>}
  <p className="gw-hint">{ordinary?'Cukup 1 foto untuk lanjut. Tidak perlu menghabiskan semua jepretan.':'Simpan minimal 1 hasil foto untuk lanjut.'} Semuanya bisa diperiksa lagi sebelum dikirim.</p>
 </div>;
}
