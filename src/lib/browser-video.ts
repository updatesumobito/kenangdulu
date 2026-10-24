import {MEDIA_LIMITS} from './media-presentation';
/** Explicitly requested optimization only. Never stretches or crops the source. */
export async function optimizeVideoFile(file:File,signal:AbortSignal,onProgress:(percent:number)=>void){
 const url=URL.createObjectURL(file),video=document.createElement('video');video.playsInline=true;video.preload='auto';
 let audio:AudioContext|undefined,output:MediaStream|undefined,recorder:MediaRecorder|undefined,frame=0;
 try{
  if(signal.aborted)throw Error('Optimasi dibatalkan.');
  await new Promise<void>((resolve,reject)=>{const timeout=setTimeout(()=>reject(Error('Video belum dapat dibaca. Pilih berkas lain.')),15000);video.onloadedmetadata=()=>{clearTimeout(timeout);resolve()};video.onerror=()=>{clearTimeout(timeout);reject(Error('Format video tidak didukung.'))};video.src=url;});
  if(!Number.isFinite(video.duration)||video.duration<=0||video.duration>30.1)throw Error('Pilih video maksimal 30 detik.');
  const canvas=document.createElement('canvas');if(!canvas.captureStream||!globalThis.MediaRecorder)throw Error('Browser ini belum mendukung optimasi. Pilih video lebih kecil atau buka di Chrome/Safari terbaru.');
  const scale=Math.min(1,1080/Math.max(video.videoWidth,video.videoHeight));canvas.width=Math.max(2,Math.floor(video.videoWidth*scale/2)*2);canvas.height=Math.max(2,Math.floor(video.videoHeight*scale/2)*2);
  const ctx=canvas.getContext('2d')!;ctx.drawImage(video,0,0,canvas.width,canvas.height);output=canvas.captureStream(30);
  audio=new AudioContext();const source=audio.createMediaElementSource(video),destination=audio.createMediaStreamDestination();source.connect(destination);destination.stream.getAudioTracks().forEach(track=>output!.addTrack(track));await audio.resume();
  const mime=['video/webm;codecs=vp8,opus','video/mp4','video/webm'].find(type=>MediaRecorder.isTypeSupported(type));if(!mime)throw Error('Optimasi video tidak tersedia di browser ini.');
  recorder=new MediaRecorder(output,{mimeType:mime,videoBitsPerSecond:4_000_000,audioBitsPerSecond:96000});
  const result=await new Promise<Blob>((resolve,reject)=>{
   const chunks:BlobPart[]=[];let bytes=0,settled=false;
   const timeout=setTimeout(()=>finish(Error('Optimasi terlalu lama. Pilih video lebih kecil.')),45000);
   const abort=()=>finish(Error('Optimasi dibatalkan.'));
   function finish(error?:Error){if(settled)return;settled=true;clearTimeout(timeout);signal.removeEventListener('abort',abort);video.pause();if(recorder?.state==='recording')recorder.stop();error?reject(error):resolve(new Blob(chunks,{type:recorder?.mimeType||mime}));}
   recorder!.ondataavailable=event=>{bytes+=event.data.size;if(bytes>MEDIA_LIMITS.videoBytes){finish(Error('Hasil optimasi masih melebihi 30 MB. Pilih video lebih pendek.'));return;}if(event.data.size)chunks.push(event.data);};
   recorder!.onerror=()=>finish(Error('Optimasi terhenti. Pilih video lain.'));recorder!.onstop=()=>finish();video.onended=()=>recorder?.state==='recording'&&recorder.stop();signal.addEventListener('abort',abort,{once:true});
   const draw=()=>{if(settled)return;ctx.drawImage(video,0,0,canvas.width,canvas.height);onProgress(Math.min(99,Math.round(video.currentTime/video.duration*100)));frame=requestAnimationFrame(draw);};
   recorder!.start(250);void video.play().then(draw,()=>finish(Error('Ketuk Optimalkan lagi untuk mengizinkan pemutaran video.')));
  });
  if(!result.size)throw Error('Hasil optimasi kosong. Pilih video lain.');return result;
 }finally{cancelAnimationFrame(frame);video.pause();video.removeAttribute('src');video.load();URL.revokeObjectURL(url);output?.getTracks().forEach(track=>track.stop());if(recorder?.state==='recording')recorder.stop();void audio?.close();}
}
