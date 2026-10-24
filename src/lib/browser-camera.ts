export type CameraFacing='user'|'environment';
export type CameraOptions={profile:'photo'|'video';aspectRatio?:number};
export type CameraState='idle'|'requesting'|'switching'|'ready'|'suspended'|'denied'|'error';
export async function openCamera(facing:CameraFacing,audio=false,options?:CameraOptions){
 if(!navigator.mediaDevices?.getUserMedia)throw Error('Kamera memerlukan HTTPS dan browser yang mendukung akses kamera.');
 const supported=navigator.mediaDevices.getSupportedConstraints() as MediaTrackSupportedConstraints&{resizeMode?:boolean};
 // Keep the live preview affordable on phones; still photos use ImageCapture when available.
 const size:MediaTrackConstraints=options?.profile==='video'?{width:{ideal:1920,max:1920},height:{ideal:1080,max:1920},frameRate:{ideal:30,max:30}}:{width:{ideal:1920},height:{ideal:1080},frameRate:{ideal:30,max:30}};
 if(supported.resizeMode)(size as MediaTrackConstraints&{resizeMode?:string}).resizeMode='none';
 let stream:MediaStream;
 try{stream=await navigator.mediaDevices.getUserMedia({video:{...size,facingMode:{exact:facing}},audio});}
 catch(error){
  if(!['OverconstrainedError','NotFoundError'].includes((error as Error).name))throw error;
  const {resizeMode,...fallback}=size as MediaTrackConstraints&{resizeMode?:string};
  stream=await navigator.mediaDevices.getUserMedia({video:{...fallback,facingMode:{ideal:facing}},audio});
 }
 const track=stream.getVideoTracks()[0];
 try{
  const caps=track.getCapabilities?.() as MediaTrackCapabilities&{zoom?:{min:number;max:number};focusMode?:string[]};
  const settings=track.getSettings() as MediaTrackSettings&{zoom?:number},advanced:Record<string,unknown>={};
  if(caps?.zoom&&caps.zoom.min<=1&&caps.zoom.max>=1&&settings.zoom!==1)advanced.zoom=1;
  if(caps?.focusMode?.includes('continuous'))advanced.focusMode='continuous';
  if(Object.keys(advanced).length)await track.applyConstraints({advanced:[advanced as MediaTrackConstraintSet]});
 }catch{/* Optional controls must not prevent an otherwise usable stream. */}
 return stream;
}
export async function attachCamera(video:HTMLVideoElement,stream:MediaStream){
 video.srcObject=stream;
 await new Promise<void>((resolve,reject)=>{
  const cleanup=()=>{clearTimeout(timeout);video.removeEventListener('loadeddata',ready);video.removeEventListener('error',failed);};
  const ready=()=>{if(video.videoWidth&&video.videoHeight){cleanup();resolve();}};
  const failed=()=>{cleanup();reject(Error('Preview kamera tidak dapat diputar. Ketuk Lanjutkan kamera.'));};
  const timeout=setTimeout(failed,12000);
  video.addEventListener('loadeddata',ready);video.addEventListener('error',failed);ready();void video.play().then(ready,failed);
 });
}
export function cameraError(error:unknown){
 const name=(error as Error)?.name;
 return name==='NotAllowedError'?'Izin kamera belum tersedia. Izinkan melalui pengaturan situs, atau buka halaman ini di Safari/Chrome.':name==='NotReadableError'?'Kamera sedang dipakai aplikasi lain. Tutup kamera lain, lalu coba lagi.':(error as Error)?.message||'Kamera belum dapat dibuka. Pilih dari galeri atau gunakan Safari/Chrome.';
}
// Legacy creative frame slots intentionally retain their own crop geometry.
export function centerCrop(width:number,height:number,ratio:number){const sw=Math.min(width,height*ratio),sh=Math.min(height,width/ratio);return {x:(width-sw)/2,y:(height-sh)/2,width:sw,height:sh};}
/** Record the real track; server padding preserves the complete field of view. */
export function videoRecordingSource(video:HTMLVideoElement,source:MediaStream,_ratio:number){
 if(!video.videoWidth||!video.videoHeight)throw Error('Kamera belum siap. Tunggu sebentar lalu coba lagi.');return {stream:source,dispose:()=>{}};
}
