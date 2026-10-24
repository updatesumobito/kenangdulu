'use client';
import {useCallback,useEffect,useRef,useState} from 'react';
import {Camera,FlipHorizontal2,Mic,Square,Video,Upload,RotateCcw} from 'lucide-react';
import {openCamera,type CameraFacing} from '@/lib/browser-camera';
import {draftMedia,type DraftMedia} from '@/lib/guest-draft';
import GuestDraftPreview from './guest-draft-preview';
import {Notice} from './ui';

export default function GuestRecorder({session,mode,value,onChange,onBusy}:{session:any;mode:'voice'|'video_wish';value?:DraftMedia;onChange:(item:DraftMedia|undefined)=>void;onBusy:(busy:boolean)=>void}){
 const videoMode=mode==='video_wish',settings=session.captureSnapshot.settings,limit=videoMode?settings.videoSec:settings.voiceSec,maxBytes=(videoMode?30:8)*1024**2;
 const [active,setActive]=useState(false),[starting,setStarting]=useState(false),[recording,setRecording]=useState(false),[finishing,setFinishing]=useState(false),[seconds,setSeconds]=useState(0),[facing,setFacing]=useState<CameraFacing>('user'),[error,setError]=useState('');
 const video=useRef<HTMLVideoElement>(null),stream=useRef<MediaStream|null>(null),recorder=useRef<MediaRecorder|null>(null),timer=useRef<ReturnType<typeof setInterval>|null>(null),request=useRef(0),pending=useRef(false),alive=useRef(true),recordSeconds=useRef(0);
 const onChangeRef=useRef(onChange);onChangeRef.current=onChange;
 useEffect(()=>{onBusy(starting||recording||finishing);},[starting,recording,finishing,onBusy]);
 const cleanup=useCallback(()=>{stream.current?.getTracks().forEach(track=>track.stop());stream.current=null;if(timer.current)clearInterval(timer.current);timer.current=null;},[]);
 function stop(){request.current++;pending.current=false;setStarting(false);if(recorder.current?.state==='recording'){setFinishing(true);recorder.current.stop();}else{cleanup();setActive(false);}setRecording(false);}
 useEffect(()=>{alive.current=true;const hide=()=>{if(document.hidden)stop();};document.addEventListener('visibilitychange',hide);return()=>{alive.current=false;request.current++;if(recorder.current){recorder.current.onstop=null;recorder.current.ondataavailable=null;recorder.current.onerror=null;if(recorder.current.state==='recording')recorder.current.stop();}cleanup();document.removeEventListener('visibilitychange',hide);onBusy(false);};},[cleanup,onBusy]);
 async function preview(next=facing){if(pending.current||recorder.current)return;cleanup();setActive(false);setError('');pending.current=true;setStarting(true);const id=++request.current;try{if(!window.MediaRecorder)throw Error('Perekaman belum didukung browser ini. Gunakan browser terbaru atau pilih berkas jika tersedia.');const s=await openCamera(next,true);if(id!==request.current||!alive.current){s.getTracks().forEach(track=>track.stop());return;}stream.current=s;setFacing(next);if(video.current){video.current.srcObject=s;await video.current.play();}if(id===request.current)setActive(true);}catch(err:any){if(id===request.current){cleanup();setError(err.name==='NotAllowedError'?'Izinkan Kamera dan Mikrofon di pengaturan situs browser, lalu coba lagi.':err.message);}}finally{if(id===request.current){pending.current=false;setStarting(false);}}}
 async function start(){
  if(pending.current||recorder.current)return;pending.current=true;setStarting(true);setError('');const id=++request.current;
  try{
   if(!navigator.mediaDevices?.getUserMedia||!window.MediaRecorder)throw Error('Perekaman belum didukung. Pilih berkas dari perangkat jika tersedia.');
   const types=videoMode?['video/webm;codecs=vp8,opus','video/webm','video/mp4']:['audio/webm;codecs=opus','audio/mp4','audio/ogg;codecs=opus'],mime=types.find(type=>MediaRecorder.isTypeSupported(type));if(!mime)throw Error('Format rekaman tidak didukung browser ini.');
   const s=videoMode&&stream.current?stream.current:videoMode?await openCamera(facing,true):await navigator.mediaDevices.getUserMedia({audio:true,video:false});
   if(id!==request.current||!alive.current){s.getTracks().forEach(track=>track.stop());return;}stream.current=s;
   if(videoMode&&video.current){video.current.srcObject=s;await video.current.play();}if(id!==request.current)return;
   const r=new MediaRecorder(s,{mimeType:mime,audioBitsPerSecond:96000,...(videoMode?{videoBitsPerSecond:2_000_000}:{})}),chunks:BlobPart[]=[];let bytes=0,failed=false;
   r.ondataavailable=ev=>{if(!ev.data.size||failed)return;bytes+=ev.data.size;if(bytes>maxBytes){failed=true;setError('Rekaman terlalu besar. Coba rekam lebih pendek.');stop();return;}chunks.push(ev.data);};
   r.onerror=()=>{failed=true;setError('Rekaman terhenti. Silakan coba lagi.');stop();};
   r.onstop=()=>{cleanup();recorder.current=null;if(!alive.current)return;if(!failed&&chunks.length)onChangeRef.current(draftMedia(mode,new Blob(chunks,{type:r.mimeType||mime}),recordSeconds.current));else if(!failed)setError('Rekaman kosong. Coba rekam lagi.');setRecording(false);setFinishing(false);setActive(false);};
   recorder.current=r;setSeconds(0);recordSeconds.current=0;r.start(300);setRecording(true);setActive(true);
   const began=Date.now();timer.current=setInterval(()=>{recordSeconds.current=Math.min(limit,(Date.now()-began)/1000);setSeconds(Math.floor(recordSeconds.current));if(recordSeconds.current>=limit)stop();},100);
  }catch(err:any){if(id===request.current){cleanup();recorder.current=null;setActive(false);setError(err.name==='NotAllowedError'?'Izin belum diberikan. Aktifkan mikrofon'+(videoMode?' dan kamera':'')+' di pengaturan situs browser.':err.message);}}
  finally{if(id===request.current){pending.current=false;setStarting(false);}}
 }
 async function fromFile(file:File){
  if(pending.current||recorder.current)return;
  pending.current=true;setStarting(true);setError('');
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
  finally{if(metadataTimer)clearTimeout(metadataTimer);player.onloadedmetadata=null;player.onerror=null;player.removeAttribute('src');player.load();URL.revokeObjectURL(url);if(id===request.current){pending.current=false;setStarting(false);}}
 }

 const occupied=starting||recording||finishing,time=`${String(Math.floor(seconds/60)).padStart(2,'0')}:${String(seconds%60).padStart(2,'0')}`;
 return <div className="gw-recorder">
  <p className="gw-hint">{videoMode?'Senyum dan doa, dalam satu cerita. Izinkan kamera dan mikrofon saat diminta.':'Izinkan mikrofon saat diminta. Rekam doa atau cerita kecil dengan suaramu sendiri.'} Maksimal {limit} detik.</p>
  {videoMode?<div className="gw-viewfinder gw-video-viewfinder">
   <video ref={video} autoPlay playsInline muted style={{transform:facing==='user'?'scaleX(-1)':'none',visibility:active?'visible':'hidden'}}/>
   {!active&&<div className="gw-camera-idle"><Camera size={34}/><h3>Biar senyummu ikut bercerita.</h3><p>Video boleh dilewati jika kamu belum ingin merekam.</p><button type="button" disabled={occupied} onClick={()=>void preview()}>{starting?'Membuka kamera…':'Buka kamera'}</button></div>}
   {active&&<><span className={'gw-camera-tag '+(recording?'is-recording':'')}>{recording?'● '+time+' / '+limit+' detik':'Siap merekam'}</span><div className="gw-viewfinder-controls"><button type="button" aria-label="Balik kamera video" disabled={occupied} onClick={()=>void preview(facing==='user'?'environment':'user')}><FlipHorizontal2 size={23}/></button><button type="button" className={'gw-shutter gw-record-button '+(recording?'is-recording':'')} aria-label={recording?'Hentikan rekaman video':'Mulai rekam video'} disabled={starting||finishing} onClick={recording?stop:()=>void start()}>{recording?<Square size={23} fill="currentColor"/>:<Video size={24}/>}</button><button type="button" aria-label="Tutup kamera video" disabled={occupied} onClick={stop}><Square size={19}/></button></div></>}
  </div>:<div className={'gw-voice-stage '+(recording?'is-recording':'')}><span className="gw-mic-orbit"><Mic size={36} strokeWidth={1.4}/></span><div className="gw-wave" aria-hidden="true">{Array.from({length:21},(_,i)=><i key={i} style={{height:12+(i*13)%32,animationDelay:`${i*55}ms`}}/>)}</div><strong className="gw-record-time">{time}</strong><span role="status">{starting?'Menyiapkan mikrofon…':finishing?'Menyiapkan hasil…':recording?'Sedang merekam doa hangatmu':value?'Suaramu sudah siap diperiksa':'Kata-kata hangatmu, untuk selamanya.'}</span><button type="button" className={recording?'gw-stop-button':''} disabled={starting||finishing} onClick={recording?stop:()=>void start()}>{recording?<><Square size={17}/> Hentikan rekaman</>:<><Mic size={18}/> {value?'Rekam ulang':'Mulai rekam suara'}</>}</button></div>}
  {finishing&&<p role="status">Menyiapkan hasil rekaman…</p>}{error&&<Notice error>{error}</Notice>}
  {value&&!occupied&&!active&&<div className="gw-record-result"><span className="eyebrow">DENGARKAN ATAU LIHAT KEMBALI</span><GuestDraftPreview media={value}/><div className="gw-inline-actions"><button type="button" className="outline" onClick={()=>videoMode?void preview():void start()}><RotateCcw size={16}/> Rekam ulang</button><button type="button" className="gw-text-button" onClick={()=>onChange(undefined)}>Buang rekaman</button></div></div>}
  {settings.allowUpload&&<label className="gw-upload-option"><Upload size={16}/> Atau pilih {videoMode?'video':'suara'} dari perangkat<input type="file" accept={videoMode?'video/mp4,video/webm,video/quicktime':'audio/mp4,audio/webm,audio/ogg,audio/mpeg'} disabled={occupied} onChange={ev=>{const file=ev.target.files?.[0];if(file)void fromFile(file);ev.target.value='';}}/></label>}
 </div>;
}
