'use client';
import {useEffect,useRef,useState,type CSSProperties} from 'react';
import dynamic from 'next/dynamic';
import {Camera,FlipHorizontal2,Timer,Images,Check,CheckCheck,ArrowRight,LoaderCircle,RotateCcw} from 'lucide-react';
import {filters} from '@/lib/renderer';
import {draftMedia,isDraftPhoto,type DraftMedia} from '@/lib/guest-draft';
import {remainingDraftPhotos} from '@/lib/guest-photo-quota';
import {MEDIA_LIMITS,presentationBackground,ratioNumber,type CaptureRatio,type MediaPresentation} from '@/lib/media-presentation';
import {PhotoSizeError,prepareGuestPhoto,takeCameraPhoto} from '@/lib/guest-photo';
import {useGuestCamera} from './use-guest-camera';
import GuestDraftPreview,{useBlobUrl} from './guest-draft-preview';
import GuestFilePicker from './guest-file-picker';
import GuestRatioPicker from './guest-ratio-picker';
import GuestMediaSheet from './guest-media-sheet';
import {Notice} from './ui';
const ExtraCamera=dynamic(()=>import('./guest-camera'),{ssr:false,loading:()=> <p role="status">Menyiapkan kamera kreatif…</p>});
type PendingPhoto={blob:Blob;presentation:MediaPresentation;css:string;timestamp?:string};
export default function GuestWizardCamera({event:e,session,media,onAdd,onRemove,onReset,onBusy,onContinue}:{event:any;session:any;media:DraftMedia[];onAdd:(item:DraftMedia)=>void;onRemove:(id:string)=>void;onReset:()=>Promise<void>;onBusy:(busy:boolean)=>void;onContinue?:()=>void}){
 const [ratio,setRatio]=useState<CaptureRatio>('1:1'),[timer,setTimer]=useState(3),[timerOpen,setTimerOpen]=useState(false),[working,setWorking]=useState(false),[uploadBusy,setUploadBusy]=useState(false),[countdown,setCountdown]=useState(0),[error,setError]=useState(''),[filter,setFilter]=useState(0),[extra,setExtra]=useState(''),[sample,setSample]=useState(''),[quotaOpen,setQuotaOpen]=useState(false),[pendingPhoto,setPendingPhoto]=useState<PendingPhoto>();
 const [resetOpen,setResetOpen]=useState(false),[resetting,setResetting]=useState(false),[resetMessage,setResetMessage]=useState(''),[extraBusy,setExtraBusy]=useState(false);
 const ordinary=e.settings.modes.includes('disposable_photo'),photos=media.filter(isDraftPhoto),settings=session.captureSnapshot.settings,limit=Math.min(e.snapshot.perGuest,settings.perGuest),remaining=remainingDraftPhotos(session,media,limit),used=Math.max(0,Math.min(limit,limit-remaining));
 const camera=useGuestCamera('photo',ordinary&&!extra),busy=useRef(false),alive=useRef(true),captureGeneration=useRef(0),delay=useRef<{timer:ReturnType<typeof setTimeout>;resolve:()=>void}|null>(null),tray=useRef<HTMLDivElement>(null),previous=useRef(remaining),quotaPending=useRef(false);
 const lastBlob=useBlobUrl(photos.at(-1)?.readyUrl?undefined:photos.at(-1)?.blob),lastPhoto=photos.at(-1)?.readyUrl||lastBlob,extras=e.slug==='wahyu-novita'?[]:['photo_strip','gif'].filter(mode=>e.settings.modes.includes(mode)&&(mode!=='photo_strip'||e.snapshot.frames)&&(mode!=='gif'||e.snapshot.creative));
 const occupied=working||uploadBusy||camera.starting||resetting||extraBusy;
 useEffect(()=>{onBusy(occupied);},[occupied,onBusy]);
 useEffect(()=>{alive.current=true;const cancel=()=>{if(document.hidden){captureGeneration.current++;if(delay.current){clearTimeout(delay.current.timer);delay.current.resolve();delay.current=null;}}};document.addEventListener('visibilitychange',cancel);return()=>{alive.current=false;captureGeneration.current++;if(delay.current){clearTimeout(delay.current.timer);delay.current.resolve();}document.removeEventListener('visibilitychange',cancel);};},[]);
 useEffect(()=>{if(previous.current>0&&remaining===0)quotaPending.current=true;if(remaining>0)quotaPending.current=false;previous.current=remaining;if(quotaPending.current&&!occupied){quotaPending.current=false;setQuotaOpen(true);}},[remaining,occupied]);
 useEffect(()=>{if(!camera.ready||!camera.video.current)return;const video=camera.video.current,c=document.createElement('canvas');c.width=120;c.height=120;const context=c.getContext('2d')!;context.fillStyle=presentationBackground();context.fillRect(0,0,120,120);const scale=Math.min(120/video.videoWidth,120/video.videoHeight),w=video.videoWidth*scale,h=video.videoHeight*scale;context.drawImage(video,(120-w)/2,(120-h)/2,w,h);setSample(c.toDataURL('image/jpeg',.75));},[camera.ready,camera.facing,camera.video]);
 function presentation(optimized=false):MediaPresentation{return {version:1,ratio,background:presentationBackground(),optimized};}
 const stamp=()=>settings.timestamp?new Date().toLocaleString('id-ID',{timeZone:e.timezone}):undefined;
 async function capture(){
  if(busy.current||occupied||!camera.ready||remaining<=0)return;busy.current=true;setWorking(true);setError('');const request=captureGeneration.current;
  try{
   for(let n=timer;n>0;n--){setCountdown(n);await new Promise<void>(resolve=>{delay.current={timer:setTimeout(resolve,1000),resolve};});if(request!==captureGeneration.current)return;}
   setCountdown(0);if(!camera.stream.current||!camera.video.current)throw Error('Kamera belum siap.');
   const item:PendingPhoto={blob:await takeCameraPhoto(camera.video.current,camera.stream.current),presentation:presentation(),css:filters[filter].css,timestamp:stamp()};
   if(!alive.current||request!==captureGeneration.current)return;
   try{const blob=await prepareGuestPhoto(item.blob,item.presentation,item.css,item.timestamp);if(alive.current&&request===captureGeneration.current)onAdd({...draftMedia('disposable_photo',blob),presentation:item.presentation});}
   catch(err){if(err instanceof PhotoSizeError)setPendingPhoto(item);else throw err;}
  }catch(err){if(alive.current)setError((err as Error).message);}finally{busy.current=false;if(alive.current){setWorking(false);setCountdown(0);}}
 }
 async function optimizeCapture(){if(!pendingPhoto||busy.current)return;busy.current=true;setWorking(true);setError('');try{const p={...pendingPhoto.presentation,optimized:true},blob=await prepareGuestPhoto(pendingPhoto.blob,p,pendingPhoto.css,pendingPhoto.timestamp);if(alive.current){onAdd({...draftMedia('disposable_photo',blob),presentation:p});setPendingPhoto(undefined);}}catch(err){setError((err as Error).message);}finally{busy.current=false;if(alive.current)setWorking(false);}}
 async function fromFile(file:File,optimize=false){
  if(remaining<=0)throw Error('Jatah foto sudah terpakai. Hapus foto draft untuk menggantinya.');
  if(!['image/jpeg','image/png','image/webp'].includes(file.type))throw Error('Pilih foto JPG, PNG, atau WebP.');
  if(file.size>MEDIA_LIMITS.photoBytes&&!optimize)throw new PhotoSizeError();
  const p=presentation(optimize),blob=await prepareGuestPhoto(file,p,filters[filter].css,stamp());if(alive.current)onAdd({...draftMedia('disposable_photo',blob),presentation:p});
 }
 function scrollTray(){tray.current?.scrollIntoView({behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'center'});}
 async function reset(){
  if(busy.current||occupied)return;busy.current=true;setResetting(true);setError('');setResetMessage('');
  try{await onReset();captureGeneration.current++;setPendingPhoto(undefined);setQuotaOpen(false);quotaPending.current=false;setExtra('');setResetOpen(false);setResetMessage('Draft foto sudah direset. Foto yang sudah terkirim tetap tersimpan.');if(ordinary)await camera.start();}
  catch(err){setError((err as Error).message||'Foto belum dapat direset. Coba lagi.');}
  finally{busy.current=false;if(alive.current)setResetting(false);}
 }
 return <div className="gw-capture gm-camera">
  <div className="gm-capture-summary" role="status" aria-live="polite"><span><span className="gm-count-number">{used}<small> / {limit}</small></span><span>foto terpakai<small>{remaining>0?`Masih bisa tambah ${remaining} foto`:'Jatah foto sudah lengkap'}</small></span></span><span className="gm-quota-summary"><strong>{remaining} tersisa</strong><span className="gm-quota-track" aria-hidden="true"><i style={{transform:`scaleX(${limit>0?used/limit:0})`}}/></span></span></div>
  {extras.length>0&&<div className="gw-mode-picker" role="group" aria-label="Jenis foto">{ordinary&&<button type="button" className={!extra?'selected':''} disabled={occupied} onClick={()=>setExtra('')}>Foto biasa</button>}{extras.map(mode=><button type="button" key={mode} className={extra===mode?'selected':''} disabled={occupied} onClick={()=>setExtra(mode)}>{mode==='photo_strip'?'Photo strip':'GIF'} <small>opsional</small></button>)}</div>}
  {(!ordinary||extra)?<ExtraCamera key={extra||extras[0]} event={e} session={session} mode={extra||extras[0]} onSaved={async()=>{}} embedded onBusyChange={setExtraBusy} onCapture={blob=>onAdd(draftMedia((extra||extras[0]) as 'photo_strip'|'gif',blob))}/>:<>
   <div className="gw-camera-toolbar gm-camera-toolbar"><GuestRatioPicker kind="foto" value={ratio} disabled={occupied} onChange={value=>setRatio(value as CaptureRatio)}/><button type="button" className="gm-timer" disabled={occupied} onClick={()=>setTimerOpen(true)} aria-label={`Timer ${timer} detik`}><Timer size={19}/><span>Timer<strong>{timer?timer+' dtk':'Mati'}</strong></span></button></div>
   <div className="gw-viewfinder gm-viewfinder" data-ratio={ratio} style={{'--gw-ratio':ratioNumber(ratio)} as CSSProperties}>
    <div className="gw-sensor"><video ref={camera.video} autoPlay playsInline muted style={{transform:camera.facing==='user'?'scaleX(-1)':'none',filter:filters[filter].css}}/></div>
    {camera.freeze&&camera.starting&&<img className="gm-camera-freeze" src={camera.freeze} alt="" style={{transform:camera.facing==='user'?'scaleX(-1)':'none'}}/>}
    {!camera.ready&&<div className="gm-camera-state" role="status">{camera.starting?<><LoaderCircle size={27} className="gm-spin"/><span>{camera.state==='switching'?'Mengganti kamera…':'Menyiapkan kamera…'}</span></>:<><Camera size={32}/><strong>Izinkan kamera untuk mulai</strong><p>Jika browser dalam aplikasi membatasi akses, buka di Safari atau Chrome, atau pilih foto dari galeri.</p><button type="button" onClick={()=>void camera.start()}>Lanjutkan kamera</button></>}</div>}
    {(camera.ready||camera.state==='switching')&&<><span className="gw-camera-tag">{camera.facing==='user'?'Kamera depan':'Kamera belakang'} · Gambar utuh</span><div className="gw-viewfinder-controls gm-viewfinder-controls"><button type="button" className="gw-last-photo" aria-label="Lihat foto terakhir di draft" disabled={!photos.length||occupied} onClick={scrollTray}>{lastPhoto?<img src={lastPhoto} alt=""/>:<Images size={20}/>}</button><button type="button" className="gw-shutter" aria-label="Ambil foto" disabled={occupied||!camera.ready||remaining<=0} onClick={()=>void capture()}><span/></button><button type="button" aria-label="Balik kamera" disabled={occupied} onClick={()=>void camera.start(camera.facing==='user'?'environment':'user')}><FlipHorizontal2 size={23}/></button></div></>}
    {countdown>0&&<strong className="gw-countdown" role="status" aria-live="assertive">{countdown}</strong>}
   </div><p className="gm-camera-caption" role="status" aria-live="polite">{working?(countdown?'Tahan pose, foto sebentar lagi…':'Menyiapkan foto, tunggu sebentar…'):'Seluruh gambar masuk ke bingkai.'}<span>{camera.dimensions.width>0?`${camera.dimensions.width} × ${camera.dimensions.height} px`:''}</span></p>
   {filters.slice(0,e.snapshot.filters||1).length>1&&<div className="gm-filter-strip" role="group" aria-label="Filter foto">{filters.slice(0,e.snapshot.filters||1).map((item,i)=><button type="button" key={item.name} aria-pressed={filter===i} disabled={occupied} onClick={()=>setFilter(i)}><span className="gm-filter-image">{sample?<img src={sample} alt="" style={{filter:item.css}}/>:<Camera size={23} aria-hidden="true"/>}{filter===i&&<i><Check size={13}/></i>}</span><span>{i===0?'Tanpa filter':item.name}</span></button>)}</div>}
  </>}
  {(error||camera.error)&&<Notice error>{error||camera.error}</Notice>}
  {settings.allowUpload&&ordinary&&!extra&&<GuestFilePicker kind="foto" accept="image/jpeg,image/png,image/webp" description="JPG, PNG, WebP · Maks. 12 MB per foto · Gambar tetap utuh" maxFiles={remaining} disabled={occupied||remaining<=0} onBusy={setUploadBusy} onFile={fromFile}/>}
  {photos.length>0&&<div ref={tray} className="gw-photo-tray" aria-label="Foto yang siap dikirim">{photos.map((item,i)=><GuestDraftPreview key={item.id} media={item} index={i} onRemove={occupied||item.mediaId?undefined:()=>onRemove(item.id)}/>)}</div>}
  {ordinary&&remaining===0&&photos.length===0&&<Notice>Jatah foto masih tercatat di sesi sebelumnya. Tekan Ulangi semua foto untuk memeriksa foto tersimpan dan memulihkan jatah unggahan yang belum selesai.</Notice>}
  <div className="gm-photo-reset"><button type="button" className="outline" disabled={occupied} onClick={()=>setResetOpen(true)}><RotateCcw size={16}/> {resetting?'Mereset foto…':'Ulangi semua foto'}</button><p className="gw-hint">Reset foto draft dan unggahan yang belum selesai. Suara, video, ucapan, dan foto terkirim tetap disimpan.</p>{resetMessage&&<p role="status">{resetMessage}</p>}</div>
  <p className="gw-hint">Cukup 1 foto untuk lanjut. Semua kenangan bisa diperiksa kembali sebelum dikirim.</p>
  <GuestMediaSheet open={resetOpen} locked={resetting} onOpenChange={setResetOpen} title="Ulangi semua foto?" description="Foto yang belum dikirim akan dibuang dan jatah unggahannya dipulihkan. Foto yang sudah terkirim tetap ditampilkan dan tidak mengembalikan jatah."><div className="gm-sheet-actions"><button type="button" disabled={resetting} onClick={()=>void reset()}>{resetting?'Mereset foto…':'Reset & ulangi foto'}</button><button type="button" className="outline" disabled={resetting} onClick={()=>setResetOpen(false)}>Simpan draft foto</button></div>{error&&<Notice error>{error}</Notice>}</GuestMediaSheet>
  <GuestMediaSheet open={timerOpen} onOpenChange={setTimerOpen} title="Waktu untuk senyum terbaikmu" description="Satu tekanan shutter mengambil satu foto."><div className="gm-timer-options">{[0,3,5,10].map(n=><button type="button" key={n} aria-pressed={timer===n} onClick={()=>{setTimer(n);setTimerOpen(false);}}><Timer size={24}/><strong>{n?n+' detik':'Tanpa timer'}</strong>{timer===n&&<Check size={18}/>}</button>)}</div></GuestMediaSheet>
  <GuestMediaSheet open={quotaOpen} onOpenChange={setQuotaOpen} title={`${limit} kenangan sudah siap`} description="Semuanya masih di draft, belum dikirim ke pengantin."><div className="gm-quota-celebration"><span><CheckCheck size={34}/></span><p>Senyum terbaikmu sudah terkumpul.</p><div>{photos.slice(-3).map((item,i)=><QuotaThumb key={item.id} media={item} index={i}/>)}</div></div><div className="gm-sheet-actions"><button type="button" onClick={()=>{setQuotaOpen(false);onContinue?.();}}>Lanjut ke langkah berikutnya <ArrowRight size={18}/></button><button type="button" className="outline" onClick={()=>{setQuotaOpen(false);scrollTray();}}>Periksa foto</button><small>Hapus foto yang belum dikirim untuk membuka satu pilihan lagi.</small></div></GuestMediaSheet>
  <GuestMediaSheet open={!!pendingPhoto} locked={working} onOpenChange={open=>{if(!open)setPendingPhoto(undefined)}} title="Pilih kualitas yang pas" description="Foto resolusi penuh melewati batas 12 MB atau 36 MP. Optimasi hanya dilakukan jika kamu memilihnya."><div className="gm-sheet-actions"><button type="button" disabled={working||remaining<=0} onClick={()=>void optimizeCapture()}>{working?'Menyiapkan…':'Optimalkan agar dapat dikirim'}</button><button type="button" className="outline" disabled={working} onClick={()=>setPendingPhoto(undefined)}>Ambil ulang</button></div>{error&&<Notice error>{error}</Notice>}</GuestMediaSheet>
 </div>;
}
function QuotaThumb({media,index}:{media:DraftMedia;index:number}){const url=useBlobUrl(media.readyUrl?undefined:media.blob);return <img src={media.readyUrl||url} alt={'Foto pilihan '+(index+1)}/>;}
