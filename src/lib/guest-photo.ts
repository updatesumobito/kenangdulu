import {containFrame,MEDIA_LIMITS,type MediaPresentation} from './media-presentation';
import {applyPhotoFilter} from './photo-filter';

export class PhotoSizeError extends Error{constructor(message='Foto resolusi penuh melebihi batas. Pilih optimasi atau gunakan foto lain.'){super(message);this.name='PhotoSizeError';}}
const frameOnlyTracks=new WeakSet<MediaStreamTrack>();
async function within<T>(operation:Promise<T>,milliseconds:number,message:string){
 let timer:ReturnType<typeof setTimeout>|undefined;
 try{return await Promise.race([operation,new Promise<never>((_,reject)=>{timer=setTimeout(()=>reject(Error(message)),milliseconds);})]);}
 finally{clearTimeout(timer);}
}
export async function takeCameraPhoto(video:HTMLVideoElement,stream:MediaStream){
 const track=stream.getVideoTracks()[0];
 if(!track||track.readyState!=='live'||!video.videoWidth||!video.videoHeight||video.readyState<2)throw Error('Kamera belum siap. Buka kembali kamera lalu coba lagi.');
 // Keep the shutter frame before native capture can temporarily pause the camera.
 const c=document.createElement('canvas');c.width=video.videoWidth;c.height=video.videoHeight;
 const context=c.getContext('2d');if(!context)throw Error('Foto tidak dapat disiapkan. Coba buka ulang kamera.');context.drawImage(video,0,0);
 const Capture=(globalThis as unknown as {ImageCapture?:new(track:MediaStreamTrack)=>{takePhoto:()=>Promise<Blob>}}).ImageCapture;
 // Native still capture can pause the same mobile track used by the preview,
 // and cannot be cancelled when a phone's camera driver stops responding.
 const touchCamera=typeof matchMedia==='function'&&matchMedia('(pointer: coarse)').matches;
 try{
  if(Capture&&!touchCamera&&!frameOnlyTracks.has(track))try{
   const photo=await within(new Capture(track).takePhoto(),2000,'Kamera native belum merespons.');
   if(photo.size)return photo;
   frameOnlyTracks.add(track);
  }catch{frameOnlyTracks.add(track);}
  return await encode(c,.96);
 }finally{c.width=c.height=1;}
}
const encode=(canvas:HTMLCanvasElement,quality:number)=>within(new Promise<Blob>((resolve,reject)=>canvas.toBlob(blob=>blob?resolve(blob):reject(Error('Foto tidak dapat disiapkan.')),'image/jpeg',quality)),10000,'Foto belum dapat disiapkan. Coba jepret lagi.');
async function filterPixels(data:ImageData,css:string){
 if(css==='none')return data;
 if(typeof Worker!=='undefined'){
  const backup=data.data.slice();let worker:Worker|undefined;
  try{
   worker=new Worker(new URL('./photo-filter.worker.ts',import.meta.url));
   const buffer=await new Promise<ArrayBuffer>((resolve,reject)=>{
    const timeout=setTimeout(()=>reject(Error('Pemrosesan filter terlalu lama.')),30000);
    worker!.onmessage=event=>{clearTimeout(timeout);event.data.error?reject(Error(event.data.error)):resolve(event.data.buffer);};
    worker!.onerror=()=>{clearTimeout(timeout);reject(Error('Filter worker tidak tersedia.'));};
    const source=data.data.slice().buffer;worker!.postMessage({buffer:source,css},[source]);
   });
   return new ImageData(new Uint8ClampedArray(buffer),data.width,data.height);
  }catch{return new ImageData(new Uint8ClampedArray(applyPhotoFilter(backup,css)),data.width,data.height);}
  finally{worker?.terminate();}
 }
 applyPhotoFilter(data.data,css);return data;
}
export async function prepareGuestPhoto(blob:Blob,presentation:MediaPresentation,css='none',timestamp?:string){
 const url=URL.createObjectURL(blob),image=new Image();
 try{
  image.src=url;await within(image.decode(),10000,'Foto belum dapat dibaca. Coba jepret lagi.');const native=containFrame(image.naturalWidth,image.naturalHeight,presentation.ratio);
  if(!presentation.optimized&&(native.width*native.height>MEDIA_LIMITS.photoPixels||blob.size>MEDIA_LIMITS.photoBytes))throw new PhotoSizeError();
  const scale=presentation.optimized?Math.min(1,2400/Math.max(native.width,native.height)):1;
  const frame=containFrame(image.naturalWidth,image.naturalHeight,presentation.ratio,scale);
  const photo=document.createElement('canvas');photo.width=frame.sourceWidth;photo.height=frame.sourceHeight;const pc=photo.getContext('2d')!;
  pc.drawImage(image,0,0,photo.width,photo.height);if(css!=='none')pc.putImageData(await filterPixels(pc.getImageData(0,0,photo.width,photo.height),css),0,0);
  const canvas=document.createElement('canvas');canvas.width=frame.width;canvas.height=frame.height;const context=canvas.getContext('2d')!;
  context.fillStyle=presentation.background;context.fillRect(0,0,canvas.width,canvas.height);context.drawImage(photo,frame.x,frame.y);
  if(timestamp){context.fillStyle='#fff';context.shadowColor='#000';context.shadowBlur=4;context.font=`${Math.max(16,Math.round(frame.sourceWidth*.025))}px sans-serif`;context.fillText(timestamp,frame.x+20,frame.y+frame.sourceHeight-24);}
  const result=await encode(canvas,presentation.optimized?.9:.96);
  photo.width=photo.height=1;canvas.width=canvas.height=1;
  if(result.size>MEDIA_LIMITS.photoBytes)throw new PhotoSizeError('Hasil foto melebihi 12 MB. Pilih optimasi atau foto lain.');
  return result;
 }finally{URL.revokeObjectURL(url);}
}
