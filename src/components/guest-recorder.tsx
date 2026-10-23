'use client';
import {useRef,useState,useEffect} from 'react';
import {uploadMemory} from './guest-upload';
import {openCamera,type CameraFacing} from '@/lib/browser-camera';
import {Notice,post} from './ui';
import PhotoAssociation from './photo-association';
import GuestThanks from './guest-thanks';

export default function GuestRecorder({event:e,session,mode,onSaved,onDraftChange,onBusyChange,embedded=false}:{event:any,session:any,mode:string,onSaved?:()=>Promise<void>,onDraftChange?:(draft:boolean)=>void,onBusyChange?:(busy:boolean)=>void,embedded?:boolean}) {
 const videoMode=mode==='video_wish',limit=videoMode?session.captureSnapshot.settings.videoSec:session.captureSnapshot.settings.voiceSec;
 const [recording,setRecording]=useState(false),[starting,setStarting]=useState(false),[finishing,setFinishing]=useState(false),[seconds,setSeconds]=useState(0),[blob,setBlob]=useState<Blob|null>(null),[preview,setPreview]=useState(''),[consent,setConsent]=useState(false),[error,setError]=useState(''),[busy,setBusy]=useState(false),[progress,setProgress]=useState(0),[message,setMessage]=useState(''),[attachment,setAttachment]=useState(''),[facing,setFacing]=useState<CameraFacing>('user'),[resolution,setResolution]=useState(''),[saved,setSaved]=useState(false);
 const stream=useRef<MediaStream|null>(null),recorder=useRef<MediaRecorder|null>(null),video=useRef<HTMLVideoElement>(null),timer=useRef<ReturnType<typeof setInterval>|null>(null),key=useRef(crypto.randomUUID()),request=useRef(0),pending=useRef(false),previewRef=useRef(''),uploaded=useRef<string|null>(null);
 useEffect(()=>{onDraftChange?.(!!blob||recording||starting||finishing)},[blob,recording,starting,finishing,onDraftChange]);
 useEffect(()=>{onBusyChange?.(busy||recording||starting||finishing)},[busy,recording,starting,finishing,onBusyChange]);
 function cleanup(){stream.current?.getTracks().forEach(t=>t.stop());stream.current=null;if(timer.current)clearInterval(timer.current);timer.current=null}
 function stop(){request.current++;pending.current=false;setStarting(false);if(recorder.current?.state==='recording'){setFinishing(true);recorder.current.stop()}else cleanup();setRecording(false)}
 function setResult(b:Blob|null){if(previewRef.current)URL.revokeObjectURL(previewRef.current);previewRef.current=b?URL.createObjectURL(b):'';setPreview(previewRef.current);setBlob(b);uploaded.current=null}
 useEffect(()=>{const visibility=()=>{if(document.hidden)stop()};document.addEventListener('visibilitychange',visibility);return()=>{request.current++;if(recorder.current){recorder.current.onstop=null;recorder.current.ondataavailable=null;recorder.current.onerror=null;if(recorder.current.state==='recording')recorder.current.stop()}cleanup();if(previewRef.current)URL.revokeObjectURL(previewRef.current);document.removeEventListener('visibilitychange',visibility)}},[]);
 async function start(){
  if(pending.current||recorder.current)return;
  pending.current=true;const id=++request.current;setStarting(true);setSaved(false);setError('');setMessage('');
  try {
   if(!navigator.mediaDevices?.getUserMedia||!window.MediaRecorder)throw Error('Perekam tidak didukung. Pilih berkas dari perangkat.');
   const types=videoMode?['video/webm;codecs=vp8,opus','video/webm','video/mp4']:['audio/webm;codecs=opus','audio/mp4','audio/ogg;codecs=opus'];
   const mime=types.find(t=>MediaRecorder.isTypeSupported(t));if(!mime)throw Error('Format rekaman tidak didukung. Gunakan unggah alternatif.');
   const s=videoMode?await openCamera(facing,true):await navigator.mediaDevices.getUserMedia({audio:true,video:false});
   if(request.current!==id){s.getTracks().forEach(t=>t.stop());return}stream.current=s;
   if(videoMode&&video.current){video.current.srcObject=s;await video.current.play();if(request.current!==id)return;setResolution(`${video.current.videoWidth} × ${video.current.videoHeight}`)}
   const r=new MediaRecorder(s,{mimeType:mime,...(videoMode?{videoBitsPerSecond:2_500_000}:{}),audioBitsPerSecond:96000}),chunks:BlobPart[]=[];
   let bytes=0,failed=false;
   r.ondataavailable=ev=>{if(!ev.data.size||failed)return;bytes+=ev.data.size;if(bytes>25*1024**2){failed=true;setError('Rekaman terlalu besar. Coba rekam lebih pendek.');stop();return}chunks.push(ev.data)};
   r.onerror=()=>{failed=true;setError('Perekaman gagal. Coba lagi atau pilih berkas.');stop()};
   r.onstop=()=>{if(!failed&&chunks.length){setResult(new Blob(chunks,{type:r.mimeType||mime}));key.current=crypto.randomUUID()}else if(!failed)setError('Rekaman kosong. Silakan rekam lagi.');cleanup();setRecording(false);setFinishing(false);recorder.current=null};
   recorder.current=r;setResult(null);setSeconds(0);r.start(300);setRecording(true);
   const began=Date.now();timer.current=setInterval(()=>{const n=(Date.now()-began)/1000;setSeconds(Math.min(limit,Math.floor(n)));if(n>=limit-.25)stop()},100);
  }catch(err:any){if(request.current===id){cleanup();recorder.current=null;setError(err.name==='NotAllowedError'?'Izin mikrofon/kamera belum diberikan. Aktifkan izin browser atau pilih berkas.':err.message)}}
  finally{if(request.current===id){pending.current=false;setStarting(false)}}
 }
 async function fromFile(f:File){
  setError('');setMessage('');setSaved(false);if(f.size>30*1024**2){setError('Berkas maksimal 30 MB.');return}
  const u=URL.createObjectURL(f);let player:HTMLMediaElement|null=null;
  try{player=document.createElement(videoMode?'video':'audio');player.preload='metadata';const media=player;await new Promise<void>((resolve,reject)=>{media.onloadedmetadata=()=>resolve();media.onerror=()=>reject(Error('Format berkas tidak dapat diputar.'));media.src=u});if(Number.isFinite(media.duration)&&media.duration>limit+.1)throw Error(`Rekaman maksimal ${limit} detik.`);setResult(f);key.current=crypto.randomUUID();setSeconds(Number.isFinite(media.duration)?Math.floor(media.duration):0)}
  catch(err:any){setError(err.message)}finally{if(player){player.removeAttribute('src');player.load()}URL.revokeObjectURL(u)}
 }
 async function send(){
  if(!blob||busy)return;setBusy(true);setError('');setMessage('');
  try{if(!uploaded.current){const result=await uploadMemory(e.id,mode,blob,consent,key.current,setProgress);uploaded.current=result.id}
   if(attachment)await post('guest/media/'+uploaded.current+'/associate',{attachmentId:attachment});
   setAttachment('');setResult(null);setMessage('Rekaman tersimpan dan masuk antrean proses.');setSaved(true);key.current=crypto.randomUUID();setProgress(0);setSeconds(0);await onSaved?.();
  }catch(err:any){setError(err.message)}finally{setBusy(false)}
 }
 return <div className="card recorder form">
  <div className="eyebrow">A MESSAGE TO KEEP</div>
  <p>Maksimal {limit} detik. Dengarkan atau lihat ulang sebelum mengirim. Rekaman hanya untuk penyelenggara sampai kamu memberi izin publik.</p>
  {videoMode?<><div className="recording-video"><video ref={video} autoPlay playsInline muted hidden={!!blob}/>{blob&&<video src={preview} controls playsInline preload="metadata"/>}</div>{recording&&<small className="camera-resolution">{resolution} px · {seconds}/{limit} detik</small>}{!blob&&<label className="field"><span>Kamera video</span><select value={facing} disabled={recording||starting||finishing} onChange={ev=>setFacing(ev.target.value as CameraFacing)}><option value="user">Kamera depan</option><option value="environment">Kamera belakang</option></select></label>}</>:<div className={'mic-visual '+(recording?'is-recording':'')}><span aria-hidden="true">◉</span><strong>{String(Math.floor(seconds/60)).padStart(2,'0')}:{String(seconds%60).padStart(2,'0')}</strong><small role="status">{recording?'Sedang merekam…':starting?'Menyiapkan mikrofon…':finishing?'Menyiapkan hasil rekaman…':'Kata-kata hangatmu, selamanya.'}</small></div>}
  {blob&&!videoMode&&<audio src={preview} controls preload="metadata"/>}
  {error&&<Notice error>{error}</Notice>}{message&&<Notice>{message}</Notice>}
  {recording?<button onClick={stop}>Hentikan rekaman · {seconds}/{limit}s</button>:!blob?<><button disabled={starting||finishing} onClick={start}>{starting?'Meminta izin…':finishing?'Menyiapkan rekaman…':videoMode?'Mulai rekam video':'Mulai rekam suara'}</button>{session.captureSnapshot.settings.allowUpload&&<label className="upload">Atau pilih berkas<input type="file" disabled={starting||finishing} accept={videoMode?'video/mp4,video/webm,video/quicktime':'audio/mp4,audio/webm,audio/ogg,audio/mpeg'} onChange={ev=>{const f=ev.target.files?.[0];if(f)fromFile(f);ev.target.value=''}}/></label>}</>:<>
   <label className="check"><input type="checkbox" checked={consent} disabled={busy||!!uploaded.current} onChange={ev=>setConsent(ev.target.checked)}/>Saya izinkan rekaman ditampilkan di galeri / live wall setelah disetujui.</label>
   <PhotoAssociation value={attachment} onChange={setAttachment} disabled={busy}/>
   <div className="row"><button disabled={busy} onClick={send}>{busy?`Mengirim ${progress}%…`:'Kirim rekaman'}</button><button className="outline" disabled={busy} onClick={()=>{setResult(null);setSeconds(0);start()}}>Rekam ulang</button><button className="outline" disabled={busy} onClick={()=>{setResult(null);setSeconds(0)}}>Buang</button></div>
  </>}
  {saved&&!embedded&&<GuestThanks event={e} saved/>}
 </div>;
}
