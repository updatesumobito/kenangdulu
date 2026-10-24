'use client';
import {useCallback,useEffect,useRef,useState,type CSSProperties} from 'react';
import {Camera,FlipHorizontal2,Mic,Square,Video,RotateCcw,Check,LoaderCircle} from 'lucide-react';
import {guestVideoLimit} from '@/lib/media-limits';
import {draftMedia,type DraftMedia} from '@/lib/guest-draft';
import {containFrame,MEDIA_LIMITS,presentationBackground,ratioNumber,type CaptureRatio,type MediaPresentation} from '@/lib/media-presentation';
import {optimizeVideoFile} from '@/lib/browser-video';
import {microphoneMonitor} from '@/lib/browser-microphone';
import {useGuestCamera} from './use-guest-camera';
import GuestDraftPreview from './guest-draft-preview';
import GuestFilePicker from './guest-file-picker';
import GuestRatioPicker from './guest-ratio-picker';
import GuestMediaSheet from './guest-media-sheet';
import {Notice} from './ui';
const clock=(seconds:number)=>`${String(Math.floor(seconds/60)).padStart(2,'0')}:${String(Math.floor(seconds%60)).padStart(2,'0')}`;
export default function GuestRecorder({session,mode,value,onChange,onBusy}:{session:any;mode:'voice'|'video_wish';value?:DraftMedia;onChange:(item:DraftMedia|undefined)=>void;onBusy:(busy:boolean)=>void}){
 const videoMode=mode==='video_wish',settings=session.captureSnapshot.settings,limit=videoMode?guestVideoLimit(settings.videoSec):settings.voiceSec,maxBytes=(videoMode?30:8)*1024**2;
 const [starting,setStarting]=useState(false),[recording,setRecording]=useState(false),[finishing,setFinishing]=useState(false),[seconds,setSeconds]=useState(0),[error,setError]=useState(''),[ratio,setRatio]=useState<CaptureRatio>('9:16'),[importing,setImporting]=useState(false),[importBusy,setImportBusy]=useState(false),[optimization,setOptimization]=useState(false),[optimizeOpen,setOptimizeOpen]=useState(false),[importProgress,setImportProgress]=useState(0);
 const camera=useGuestCamera('video',videoMode&&!value,true),recorder=useRef<MediaRecorder|null>(null),audioStream=useRef<MediaStream|null>(null),pending=useRef(false),alive=useRef(true),generation=useRef(0),began=useRef(0),duration=useRef(0),timer=useRef<ReturnType<typeof setInterval>|undefined>(undefined),deadline=useRef<ReturnType<typeof setTimeout>|undefined>(undefined),abort=useRef<AbortController|null>(null);
 const changed=useRef(onChange);changed.current=onChange;
 const monitor=useRef<ReturnType<typeof microphoneMonitor>|null>(null),[level,setLevel]=useState<number|null>(null),[heard,setHeard]=useState(false);
 const clearTimers=useCallback(()=>{clearInterval(timer.current);clearTimeout(deadline.current);},[]);
 function stop(){
  clearTimers();if(recorder.current?.state==='recording'){duration.current=Math.min(limit,(performance.now()-began.current)/1000);setSeconds(Math.floor(duration.current));setFinishing(true);recorder.current.stop();}else{audioStream.current?.getTracks().forEach(t=>t.stop());audioStream.current=null;}setRecording(false);
 }
 useEffect(()=>{onBusy(starting||recording||finishing||importBusy||camera.starting);},[starting,recording,finishing,importBusy,camera.starting,onBusy]);
 useEffect(()=>{alive.current=true;const hide=()=>{if(document.hidden&&recorder.current?.state==='recording')stop();};document.addEventListener('visibilitychange',hide);return()=>{alive.current=false;generation.current++;clearTimers();abort.current?.abort();monitor.current?.close();if(recorder.current){recorder.current.onstop=null;recorder.current.ondataavailable=null;recorder.current.onerror=null;if(recorder.current.state==='recording')recorder.current.stop();}audioStream.current?.getTracks().forEach(t=>t.stop());document.removeEventListener('visibilitychange',hide);};},[clearTimers]);
 function presentation(optimized=optimization):MediaPresentation{return {version:1,ratio,background:presentationBackground(),optimized};}
 async function start(allowOptimization=false){
  if(pending.current||recorder.current)return;if(videoMode&&!camera.ready){await camera.start();return;}
  if(videoMode){const frame=containFrame(camera.dimensions.width,camera.dimensions.height,ratio);if(Math.max(frame.width,frame.height)>MEDIA_LIMITS.videoEdge&&!optimization&&!allowOptimization){setOptimizeOpen(true);return;}}
  pending.current=true;setStarting(true);setError('');setLevel(null);setHeard(false);const request=++generation.current;
  // Resume during the button gesture, before the permission prompt on mobile.
  const input=videoMode?null:microphoneMonitor();monitor.current=input;
  try{
   if(!navigator.mediaDevices?.getUserMedia||!window.MediaRecorder)throw Error('Perekaman tidak tersedia. Pilih berkas dari perangkat atau gunakan Safari/Chrome.');
   const player=document.createElement(videoMode?'video':'audio');
   const mime=(videoMode?['video/webm;codecs=vp8,opus','video/mp4','video/webm']:['audio/mp4','audio/webm;codecs=opus','audio/ogg;codecs=opus']).find(type=>MediaRecorder.isTypeSupported(type)&&!!player.canPlayType(type));if(!mime)throw Error('Format rekaman tidak didukung.');
   const stream=videoMode?camera.stream.current!:await navigator.mediaDevices.getUserMedia({audio:{channelCount:{ideal:1},autoGainControl:true,echoCancellation:true},video:false});
   if(!alive.current||request!==generation.current){input?.close();if(!videoMode)stream.getTracks().forEach(t=>t.stop());return;}
   if(!videoMode)audioStream.current=stream;
   const mic=stream.getAudioTracks()[0];if(!mic||mic.readyState!=='live')throw Error('Mikrofon belum aktif. Periksa mikrofon perangkat, lalu rekam ulang.');mic.enabled=true;input?.connect(stream);
   const p=videoMode?presentation(optimization||allowOptimization):undefined;
   const videoRate=Math.min(16_000_000,Math.floor(maxBytes*8*.82/limit)-96000),r=new MediaRecorder(stream,{mimeType:mime,audioBitsPerSecond:96000,...(videoMode?{videoBitsPerSecond:videoRate}:{})});
   const chunks:BlobPart[]=[];let bytes=0,failed=false;
   r.ondataavailable=event=>{if(!event.data.size||failed)return;bytes+=event.data.size;if(bytes>maxBytes){failed=true;setError('Rekaman melebihi batas. Rekam lebih pendek atau pilih video yang lebih kecil.');stop();return;}chunks.push(event.data);};
   r.onerror=()=>{failed=true;setError('Rekaman terhenti. Coba lagi.');stop();};
   r.onstop=()=>{clearTimers();recorder.current=null;const silent=input?.silent;input?.close();monitor.current=null;audioStream.current?.getTracks().forEach(t=>t.stop());audioStream.current=null;if(!alive.current)return;if(!failed&&silent)setError('Suara belum tertangkap. Periksa mikrofon yang dipilih di pengaturan situs, dekatkan perangkat, lalu rekam ulang.');else if(!failed&&chunks.length)changed.current({...draftMedia(mode,new Blob(chunks,{type:r.mimeType||mime}),duration.current),presentation:p});else if(!failed)setError('Rekaman kosong. Coba lagi.');setRecording(false);setFinishing(false);};
   recorder.current=r;duration.current=0;setSeconds(0);r.start(250);began.current=performance.now();setRecording(true);
   timer.current=setInterval(()=>{duration.current=Math.min(limit,(performance.now()-began.current)/1000);setSeconds(Math.floor(duration.current));if(input){const next=input.sample();setLevel(next);if(next!==null&&next>.008)setHeard(true);}if(duration.current>=limit)stop();},200);deadline.current=setTimeout(stop,limit*1000);
  }catch(err){input?.close();if(alive.current&&request===generation.current){recorder.current=null;audioStream.current?.getTracks().forEach(t=>t.stop());audioStream.current=null;setError((err as Error).name==='NotAllowedError'?'Izinkan mikrofon di pengaturan situs, lalu coba lagi.':(err as Error).message);}}
  finally{if(request===generation.current){pending.current=false;if(alive.current)setStarting(false);}}
 }
 async function fromFile(file:File,optimize=false){
  if(pending.current||recorder.current)throw Error('Selesaikan rekaman terlebih dahulu.');
  pending.current=true;setImporting(true);setError('');setImportProgress(0);const request=++generation.current,controller=new AbortController();abort.current=controller;
  const url=URL.createObjectURL(file),player=document.createElement(videoMode?'video':'audio');let metadataTimer:ReturnType<typeof setTimeout>|undefined;
  try{
   if(file.size>maxBytes&&(!videoMode||!optimize))throw Error(`Berkas melebihi ${videoMode?30:8} MB. ${videoMode?'Pilih optimasi atau video lain.':'Pilih rekaman yang lebih pendek.'}`);
   const aliases:Record<string,string>={'audio/x-m4a':'audio/mp4','audio/m4a':'audio/mp4','video/x-m4v':'video/mp4'},extensions:Record<string,string>={m4a:'audio/mp4',mp3:'audio/mpeg',ogg:'audio/ogg',mp4:'video/mp4',mov:'video/quicktime',webm:videoMode?'video/webm':'audio/webm'};
   const mime=aliases[file.type]||file.type.split(';')[0]||extensions[file.name.split('.').pop()?.toLowerCase()||''];
   if(!(videoMode?['video/mp4','video/webm','video/quicktime']:['audio/mp4','audio/webm','audio/ogg','audio/mpeg']).includes(mime))throw Error('Format berkas tidak didukung.');
   await new Promise<void>((resolve,reject)=>{metadataTimer=setTimeout(()=>reject(Error('Durasi berkas belum terbaca. Pilih berkas lain.')),15000);player.preload='metadata';player.onloadedmetadata=()=>resolve();player.onerror=()=>reject(Error('Format berkas tidak dapat diputar.'));player.src=url;});clearTimeout(metadataTimer);
   if(!Number.isFinite(player.duration)||player.duration<=0||player.duration>limit+.1)throw Error(`Pilih rekaman maksimal ${limit} detik.`);
   if(videoMode&&!optimize){const v=player as HTMLVideoElement,frame=containFrame(v.videoWidth,v.videoHeight,ratio);if(Math.max(frame.width,frame.height)>MEDIA_LIMITS.videoEdge)throw Error('Bingkai utuh melebihi batas resolusi. Pilih optimasi atau video lain.');}
   const blob=videoMode&&optimize?await optimizeVideoFile(file,controller.signal,setImportProgress):file.slice(0,file.size,mime);
   if(alive.current&&request===generation.current){camera.stop();onChange({...draftMedia(mode,blob,player.duration),presentation:videoMode?presentation(optimize):undefined});}
  }catch(err){if(alive.current)setError((err as Error).message);throw err;}
  finally{clearTimeout(metadataTimer);player.onloadedmetadata=null;player.onerror=null;player.removeAttribute('src');player.load();URL.revokeObjectURL(url);if(request===generation.current){pending.current=false;if(alive.current)setImporting(false);}}
 }
 const occupied=starting||recording||finishing||importBusy||camera.starting,overLimit=value&&typeof value.duration==='number'&&value.duration>limit+.1;
 return <div className="gw-recorder gm-recorder" aria-busy={starting||finishing}>
  <div className="gm-record-heading"><span>{videoMode?'VIDEO UCAPAN':'PESAN SUARA'}</span><strong>Maks. {limit} detik</strong></div>
  {videoMode&&!value?<>
   <GuestRatioPicker kind="video" value={ratio} onChange={next=>setRatio(next as CaptureRatio)} disabled={occupied}/>
   <div className="gw-viewfinder gw-video-viewfinder gm-viewfinder" data-ratio={ratio} style={{'--gw-ratio':ratioNumber(ratio)} as CSSProperties}>
    <video ref={camera.video} autoPlay playsInline muted style={{transform:camera.facing==='user'?'scaleX(-1)':'none'}}/>
    {camera.freeze&&camera.starting&&<img className="gm-camera-freeze" src={camera.freeze} alt=""/>}
    {!camera.ready&&<div className="gm-camera-state" role="status">{camera.starting?<><LoaderCircle size={27} className="gm-spin"/><span>Menyiapkan kamera…</span></>:<><Camera size={32}/><strong>Izinkan kamera & mikrofon</strong><p>Gunakan Safari/Chrome jika akses dibatasi aplikasi.</p><button type="button" disabled={occupied} onClick={()=>void camera.start()}>Lanjutkan kamera</button></>}</div>}
    {camera.ready&&<><span className={'gw-camera-tag '+(recording?'is-recording':'')}>{recording?`${clock(seconds)} / ${clock(limit)}`:'Gambar utuh · Siap merekam'}</span><div className="gw-viewfinder-controls gm-viewfinder-controls"><span className="gw-control-spacer"/><button type="button" className={'gw-shutter gw-record-button '+(recording?'is-recording':'')} aria-label={recording?'Hentikan rekaman video':'Mulai rekam video'} disabled={starting||finishing||importBusy} onClick={recording?stop:()=>void start()}>{recording?<Square size={23} fill="currentColor"/>:<Video size={24}/>}</button><button type="button" aria-label="Balik kamera video" disabled={occupied} onClick={()=>void camera.start(camera.facing==='user'?'environment':'user')}><FlipHorizontal2 size={23}/></button></div></>}
   </div><p className="gm-camera-caption">Tanpa zoom atau crop.<span>{camera.dimensions.width?`${camera.dimensions.width} × ${camera.dimensions.height} px`:''}</span></p>
  </>:!videoMode?<div className={'gw-voice-stage '+(recording?'is-recording':'')}><span className="gw-mic-orbit"><Mic size={36} strokeWidth={1.4}/></span><div className="gw-wave" aria-hidden="true">{Array.from({length:21},(_,i)=><i key={i} style={{height:recording?3+(level??0)*(12+(i*13)%32):12+(i*13)%32,animation:'none'}}/>)}</div><strong className="gw-record-time">{clock(seconds)}<small> / {clock(limit)}</small></strong><span role="status">{starting?'Menyiapkan mikrofon…':finishing?'Menyiapkan hasil…':recording?'Sedang merekam doa hangatmu':value?'Suaramu siap diperiksa':'Satu suara, banyak doa baik.'}</span><button type="button" disabled={starting||finishing||importBusy} onClick={recording?stop:()=>void start()}>{recording?<><Square size={17}/> Hentikan rekaman</>:<><Mic size={18}/> {value?'Rekam ulang':'Mulai rekam suara'}</>}</button></div>:null}
  {finishing&&<p className="gw-processing" role="status"><LoaderCircle size={18} className="gm-spin"/> Menyiapkan hasil rekaman…</p>}
  {!videoMode&&recording&&level!==null&&<div className="gw-mic-level"><meter min={0} max={1} value={level} aria-label="Kekuatan suara mikrofon"/><p role="status">{heard?'Suara masuk ke mikrofon.':seconds>=2?'Suara belum terdeteksi. Coba bicara lebih dekat dan periksa mikrofon perangkat.':'Bicaralah untuk memeriksa mikrofon.'}</p></div>}
  {(error||camera.error)&&<Notice error>{error||camera.error}</Notice>}{overLimit&&<Notice error>Rekaman draft melebihi {limit} detik. Pilih rekaman lebih pendek.</Notice>}
  {value&&!occupied&&<div className="gw-record-result"><span className="gw-result-label"><Check size={16}/> {videoMode?'Video':'Suara'} siap · {Math.ceil(value.duration||0)} detik</span><GuestDraftPreview media={value}/><p className="gw-hint">Periksa kembali. Rekaman belum dikirim.</p><div className="gw-inline-actions"><button type="button" className="outline" onClick={()=>{onChange(undefined);setSeconds(0);}}><RotateCcw size={16}/> Rekam ulang</button><button type="button" className="gw-text-button" onClick={()=>onChange(undefined)}>Buang rekaman</button></div></div>}
  {importing&&<p className="gm-upload-message" role="status">Menyiapkan berkas{importProgress?` · ${importProgress}%`:''}…</p>}
  {settings.allowUpload&&<GuestFilePicker kind={videoMode?'video':'suara'} accept={videoMode?'video/mp4,video/webm,video/quicktime':'audio/mp4,audio/x-m4a,audio/webm,audio/ogg,audio/mpeg'} description={videoMode?`MP4, WebM, MOV · Maks. 30 MB / ${limit} detik · Gambar utuh`:`M4A, MP3, WebM, OGG · Maks. 8 MB / ${limit} detik`} disabled={starting||recording||finishing||camera.starting} busy={importing} onBusy={setImportBusy} onFile={fromFile}/>}
  <GuestMediaSheet open={optimizeOpen} onOpenChange={setOptimizeOpen} title="Sesuaikan bingkai video?" description="Rasio pilihan dengan gambar utuh melebihi batas resolusi. Optimasi mempertahankan seluruh gambar dengan dimensi lebih kecil."><div className="gm-sheet-actions"><button type="button" onClick={()=>{setOptimization(true);setOptimizeOpen(false);void start(true);}}>Setuju optimasi & rekam</button><button type="button" className="outline" onClick={()=>setOptimizeOpen(false)}>Kembali</button></div></GuestMediaSheet>
 </div>;
}
