'use client';
import {useCallback,useEffect,useRef,useState,type CSSProperties} from 'react';
import {Camera,FlipHorizontal2,Mic,Square,Video,RotateCcw,Check,LoaderCircle} from 'lucide-react';
import {openCamera,videoRecordingSource,type CameraFacing} from '@/lib/browser-camera';
import {guestVideoLimit} from '@/lib/media-limits';
import {draftMedia,type DraftMedia} from '@/lib/guest-draft';
import GuestDraftPreview from './guest-draft-preview';
import GuestFilePicker from './guest-file-picker';
import GuestRatioPicker from './guest-ratio-picker';
import {Notice} from './ui';

const clock=(seconds:number)=>`${String(Math.floor(seconds/60)).padStart(2,'0')}:${String(Math.floor(seconds%60)).padStart(2,'0')}`;
export default function GuestRecorder({session,mode,value,onChange,onBusy}:{session:any;mode:'voice'|'video_wish';value?:DraftMedia;onChange:(item:DraftMedia|undefined)=>void;onBusy:(busy:boolean)=>void}){
 const videoMode=mode==='video_wish',settings=session.captureSnapshot.settings,limit=videoMode?guestVideoLimit(settings.videoSec):settings.voiceSec,maxBytes=(videoMode?30:8)*1024**2;
 const [active,setActive]=useState(false),[starting,setStarting]=useState(false),[recording,setRecording]=useState(false),[finishing,setFinishing]=useState(false),[seconds,setSeconds]=useState(0),[facing,setFacing]=useState<CameraFacing>('user'),[error,setError]=useState(''),[ratio,setRatio]=useState('9:16'),[importing,setImporting]=useState(false);
 const video=useRef<HTMLVideoElement>(null),stream=useRef<MediaStream|null>(null),recorder=useRef<MediaRecorder|null>(null),timer=useRef<ReturnType<typeof setInterval>|null>(null),deadline=useRef<ReturnType<typeof setTimeout>|null>(null),request=useRef(0),pending=useRef(false),alive=useRef(true),recordSeconds=useRef(0),began=useRef(0),disposeRecording=useRef<(()=>void)|null>(null);
 const onChangeRef=useRef(onChange);onChangeRef.current=onChange;
 useEffect(()=>{onBusy(starting||recording||finishing)},[starting,recording,finishing,onBusy]);
 const clearTimers=useCallback(()=>{if(timer.current)clearInterval(timer.current);if(deadline.current)clearTimeout(deadline.current);timer.current=null;deadline.current=null},[]);
 const cleanup=useCallback(()=>{clearTimers();disposeRecording.current?.();disposeRecording.current=null;stream.current?.getTracks().forEach(track=>track.stop());stream.current=null;if(video.current)video.current.srcObject=null},[clearTimers]);
 function stop(){
  request.current++;pending.current=false;setStarting(false);setImporting(false);clearTimers();
  if(recorder.current?.state==='recording'){
   recordSeconds.current=Math.min(limit,(performance.now()-began.current)/1000);setSeconds(Math.floor(recordSeconds.current));setFinishing(true);recorder.current.stop();
  }else if(!recorder.current){cleanup();setActive(false)}
  setRecording(false);
 }
 useEffect(()=>{alive.current=true;const hide=()=>{if(document.hidden)stop()};document.addEventListener('visibilitychange',hide);return()=>{alive.current=false;request.current++;if(recorder.current){recorder.current.onstop=null;recorder.current.ondataavailable=null;recorder.current.onerror=null;if(recorder.current.state==='recording')recorder.current.stop()}cleanup();document.removeEventListener('visibilitychange',hide);onBusy(false)}},[cleanup,onBusy]);
 async function preview(next=facing,nextRatio=ratio){
  if(pending.current||recorder.current)return;cleanup();setActive(false);setError('');pending.current=true;setStarting(true);const id=++request.current;
  try{
   if(!window.MediaRecorder)throw Error('Perekaman belum didukung browser ini. Gunakan browser terbaru atau pilih video dari perangkat.');
   const s=await openCamera(next,true,{profile:'video',aspectRatio:nextRatio==='9:16'?9/16:16/9});
   if(id!==request.current||!alive.current){s.getTracks().forEach(track=>track.stop());return}
   stream.current=s;const actual=s.getVideoTracks()[0].getSettings().facingMode;setFacing(actual==='environment'?'environment':actual==='user'?'user':next);
   if(video.current){video.current.srcObject=s;await video.current.play()}
   if(id===request.current)setActive(true);
  }catch(err:any){if(id===request.current){cleanup();setError(err.name==='NotAllowedError'?'Izinkan Kamera dan Mikrofon di pengaturan situs browser, lalu coba lagi.':err.message)}}
  finally{if(id===request.current){pending.current=false;setStarting(false)}}
 }
 function changeRatio(next:string){if(pending.current||recorder.current)return;setRatio(next);if(active)void preview(facing,next)}
 async function start(){
  if(pending.current||recorder.current)return;pending.current=true;setStarting(true);setError('');const id=++request.current;
  try{
   if(!navigator.mediaDevices?.getUserMedia||!window.MediaRecorder)throw Error('Perekaman belum didukung. Pilih berkas dari perangkat jika tersedia.');
   const types=videoMode?['video/webm;codecs=vp8,opus','video/mp4','video/webm']:['audio/webm;codecs=opus','audio/mp4','audio/ogg;codecs=opus'],mime=types.find(type=>MediaRecorder.isTypeSupported(type));
   if(!mime)throw Error('Format rekaman tidak didukung browser ini.');
   const s=videoMode&&stream.current?stream.current:videoMode?await openCamera(facing,true,{profile:'video',aspectRatio:ratio==='9:16'?9/16:16/9}):await navigator.mediaDevices.getUserMedia({audio:true,video:false});
   if(id!==request.current||!alive.current){s.getTracks().forEach(track=>track.stop());return}stream.current=s;
   if(videoMode&&video.current){if(video.current.srcObject!==s)video.current.srcObject=s;await video.current.play()}
   if(id!==request.current)return;
   const source=videoMode?videoRecordingSource(video.current!,s,ratio==='9:16'?9/16:16/9):{stream:s,dispose:()=>{}};
   disposeRecording.current=source.dispose;
   const r=new MediaRecorder(source.stream,{mimeType:mime,audioBitsPerSecond:96000,...(videoMode?{videoBitsPerSecond:2_000_000}:{})}),chunks:BlobPart[]=[];let bytes=0,failed=false;
   r.ondataavailable=ev=>{if(!ev.data.size||failed)return;bytes+=ev.data.size;if(bytes>maxBytes){failed=true;setError('Rekaman terlalu besar. Coba rekam lebih pendek.');stop();return}chunks.push(ev.data)};
   r.onerror=()=>{failed=true;setError('Rekaman terhenti. Silakan coba lagi.');stop()};
   r.onstop=()=>{cleanup();recorder.current=null;if(!alive.current)return;if(!failed&&chunks.length)onChangeRef.current(draftMedia(mode,new Blob(chunks,{type:r.mimeType||mime}),recordSeconds.current));else if(!failed)setError('Rekaman kosong. Coba rekam lagi.');setRecording(false);setFinishing(false);setActive(false)};
   recorder.current=r;recordSeconds.current=0;setSeconds(0);r.start(300);began.current=performance.now();setRecording(true);setActive(true);
   timer.current=setInterval(()=>{recordSeconds.current=Math.min(limit,(performance.now()-began.current)/1000);setSeconds(Math.floor(recordSeconds.current));if(recordSeconds.current>=limit)stop()},200);
   deadline.current=setTimeout(stop,limit*1000);
  }catch(err:any){if(id===request.current){cleanup();recorder.current=null;setActive(false);setError(err.name==='NotAllowedError'?'Izin belum diberikan. Aktifkan mikrofon'+(videoMode?' dan kamera':'')+' di pengaturan situs browser.':err.message)}}
  finally{if(id===request.current){pending.current=false;setStarting(false)}}
 }
 async function fromFile(file:File){
  if(pending.current||recorder.current)return;
  pending.current=true;setStarting(true);setImporting(true);setError('');
  const id=++request.current,url=URL.createObjectURL(file),player=document.createElement(videoMode?'video':'audio');
  let metadataTimer:ReturnType<typeof setTimeout>|undefined;
  try{
   if(file.size>maxBytes)throw Error(`Berkas maksimal ${videoMode?30:8} MB.`);
   const aliases:Record<string,string>={'audio/x-m4a':'audio/mp4','audio/m4a':'audio/mp4','video/x-m4v':'video/mp4'};
   const extensions:Record<string,string>={m4a:'audio/mp4',mp3:'audio/mpeg',ogg:'audio/ogg',mp4:'video/mp4',mov:'video/quicktime',webm:videoMode?'video/webm':'audio/webm'};
   const mime=aliases[file.type]||file.type.split(';')[0]||extensions[file.name.split('.').pop()?.toLowerCase()||''];
   const allowed=videoMode?['video/mp4','video/webm','video/quicktime']:['audio/mp4','audio/webm','audio/ogg','audio/mpeg'];
   if(!allowed.includes(mime))throw Error('Format berkas tidak didukung. Pilih format lain atau rekam langsung.');
   await new Promise<void>((resolve,reject)=>{
    metadataTimer=setTimeout(()=>reject(Error('Durasi berkas belum terbaca. Pilih berkas lain atau rekam langsung.')),15000);
    player.preload='metadata';player.onloadedmetadata=()=>resolve();player.onerror=()=>reject(Error('Format berkas tidak dapat diputar.'));player.src=url;
   });
   if(!Number.isFinite(player.duration)||player.duration<=0)throw Error('Durasi berkas tidak terbaca. Pilih berkas lain atau rekam langsung.');
   if(player.duration>limit+.1)throw Error(`Rekaman maksimal ${limit} detik.`);
   if(alive.current&&id===request.current){cleanup();setActive(false);onChangeRef.current(draftMedia(mode,file.slice(0,file.size,mime),player.duration));}
  }catch(err:any){if(alive.current&&id===request.current)setError(err.message);}
  finally{if(metadataTimer)clearTimeout(metadataTimer);player.onloadedmetadata=null;player.onerror=null;player.removeAttribute('src');player.load();URL.revokeObjectURL(url);if(id===request.current){pending.current=false;setStarting(false);setImporting(false);}}
 }

 const occupied=starting||recording||finishing,overLimit=!!value&&!value.mediaId&&typeof value.duration==='number'&&value.duration>limit+.1;
 return <div className="gw-recorder" aria-busy={starting||finishing}>
  <ol className="gw-record-guide" aria-label="Cara merekam">{[videoMode?'Izinkan kamera & mikrofon':'Izinkan mikrofon','Rekam ceritamu',videoMode?'Lihat kembali':'Dengarkan kembali'].map((label,i)=><li key={label}><span>{i+1}</span>{label}</li>)}</ol>
  <div className="gw-record-meta"><span>{videoMode?'Video opsional · Boleh dilewati':'Suara hangat, untuk dikenang'}</span><strong>Maks. {limit} detik</strong></div>
  {videoMode?<>
   <GuestRatioPicker kind="video" value={ratio} onChange={changeRatio} disabled={occupied}/>
   <div className="gw-viewfinder gw-video-viewfinder" data-ratio={ratio} style={{'--gw-ratio':ratio==='9:16'?9/16:16/9} as CSSProperties}>
    <video ref={video} autoPlay playsInline muted style={{transform:facing==='user'?'scaleX(-1)':'none',visibility:active?'visible':'hidden'}}/>
    {!active&&<div className="gw-camera-idle"><Camera size={32}/><h3>Biar senyummu ikut bercerita.</h3><p>Buka kamera, izinkan mikrofon, lalu titipkan doa terbaikmu.</p><button type="button" disabled={occupied} onClick={()=>void preview()}>{starting?<><LoaderCircle size={16} className="gw-spin"/> Membuka kamera…</>:'Buka kamera'}</button></div>}
    {active&&<><span className={'gw-camera-tag '+(recording?'is-recording':'')}>{recording?'● ':''}{recording?`${clock(seconds)} / ${clock(limit)}`:'Siap merekam'}</span><div className="gw-viewfinder-controls"><button type="button" aria-label="Balik kamera video" disabled={occupied} onClick={()=>void preview(facing==='user'?'environment':'user')}><FlipHorizontal2 size={23}/></button><button type="button" className={'gw-shutter gw-record-button '+(recording?'is-recording':'')} aria-label={recording?'Hentikan rekaman video':'Mulai rekam video'} disabled={starting||finishing} onClick={recording?stop:()=>void start()}>{recording?<Square size={23} fill="currentColor"/>:<Video size={24}/>}</button><span className="gw-control-spacer" aria-hidden="true"/></div></>}
   </div>
  </>:<div className={'gw-voice-stage '+(recording?'is-recording':'')}>
   <span className="gw-mic-orbit"><Mic size={36} strokeWidth={1.4}/></span>
   <div className="gw-wave" aria-hidden="true">{Array.from({length:21},(_,i)=><i key={i} style={{height:12+(i*13)%32,animationDelay:`${i*55}ms`}}/>)}</div>
   <strong className="gw-record-time">{clock(seconds)}<small> / {clock(limit)}</small></strong>
   <span role="status">{starting?'Menyiapkan mikrofon…':finishing?'Menyiapkan hasil…':recording?'Sedang merekam doa hangatmu':value?'Suaramu sudah siap diperiksa':'Satu suara, banyak doa baik.'}</span>
   <button type="button" className={recording?'gw-stop-button':''} disabled={starting||finishing} onClick={recording?stop:()=>void start()}>{recording?<><Square size={17}/> Hentikan rekaman</>:<><Mic size={18}/> {value?'Rekam ulang':'Mulai rekam suara'}</>}</button>
  </div>}
  {finishing&&<p className="gw-processing" role="status"><LoaderCircle size={18} className="gw-spin"/> Menyiapkan hasil rekaman…</p>}{error&&<Notice error>{error}</Notice>}
  {overLimit&&<Notice error>Rekaman draft ini melebihi {limit} detik. Rekam ulang atau pilih berkas yang lebih pendek; kenangan lainnya tetap tersimpan.</Notice>}
  {value&&!occupied&&!active&&<div className="gw-record-result"><span className="gw-result-label"><Check size={16}/> {videoMode?'Video':'Suara'} masuk ke draft · {Math.ceil(value.duration||0)} detik</span><GuestDraftPreview media={value}/><p className="gw-hint">{videoMode?'Lihat':'Dengarkan'} kembali sebelum lanjut. Rekaman belum dikirim ke pengantin.</p><div className="gw-inline-actions"><button type="button" className="outline" onClick={()=>videoMode?void preview():void start()}><RotateCcw size={16}/> Rekam ulang</button><button type="button" className="gw-text-button" onClick={()=>onChange(undefined)}>Buang rekaman</button></div></div>}
  {settings.allowUpload&&<GuestFilePicker kind={videoMode?'video':'suara'} accept={videoMode?'video/mp4,video/webm,video/quicktime':'audio/mp4,audio/x-m4a,audio/webm,audio/ogg,audio/mpeg'} description={videoMode?`MP4, WebM, MOV · Maks. 30 MB / ${limit} detik · Rasio asli berkas dipertahankan`:`M4A, MP3, WebM, OGG · Maks. 8 MB / ${limit} detik`} disabled={occupied} busy={importing} onFile={file=>void fromFile(file)}/>}
 </div>;
}
