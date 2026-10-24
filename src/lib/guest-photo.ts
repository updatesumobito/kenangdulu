import {containFrame,MEDIA_LIMITS,type MediaPresentation} from './media-presentation';
import {applyPhotoFilter} from './photo-filter';

export class PhotoSizeError extends Error{constructor(message='Foto resolusi penuh melebihi batas. Pilih optimasi atau gunakan foto lain.'){super(message);this.name='PhotoSizeError';}}
export async function takeCameraPhoto(video:HTMLVideoElement,stream:MediaStream){
 const Capture=(globalThis as unknown as {ImageCapture?:new(track:MediaStreamTrack)=>{takePhoto:()=>Promise<Blob>}}).ImageCapture;
 if(Capture)try{return await new Capture(stream.getVideoTracks()[0]).takePhoto();}catch{/* Video frame fallback keeps the browser's actual dimensions. */}
 if(!video.videoWidth||!video.videoHeight)throw Error('Kamera belum siap.');
 const c=document.createElement('canvas');c.width=video.videoWidth;c.height=video.videoHeight;c.getContext('2d')!.drawImage(video,0,0);
 return encode(c,.96);
}
const encode=(canvas:HTMLCanvasElement,quality:number)=>new Promise<Blob>((resolve,reject)=>canvas.toBlob(blob=>blob?resolve(blob):reject(Error('Foto tidak dapat disiapkan.')),'image/jpeg',quality));
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
  image.src=url;await image.decode();const native=containFrame(image.naturalWidth,image.naturalHeight,presentation.ratio);
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
