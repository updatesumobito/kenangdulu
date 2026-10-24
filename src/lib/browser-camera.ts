export type CameraFacing = 'user' | 'environment';
export type CameraOptions = {profile:'photo'|'video';aspectRatio?:number};

// Ask the device/browser, never infer sensor resolution from a phone model.
export async function openCamera(facing: CameraFacing, audio = false, options?: CameraOptions) {
 if (!navigator.mediaDevices?.getUserMedia) throw Error('Kamera memerlukan HTTPS atau localhost.');
 let stream: MediaStream;
 const edge = audio ? 3840 : 4096;
 const portrait=(options?.aspectRatio||1)<1;
 const size:MediaTrackConstraints = options?.profile==='video'
  ? {width:{ideal:portrait?720:1280,max:1280},height:{ideal:portrait?1280:720,max:1280},frameRate:{ideal:30,max:30},aspectRatio:{ideal:options.aspectRatio||9/16}}
  : options?.profile==='photo'
   ? {width:{ideal:1920,max:2560},height:{ideal:2560,max:2560},frameRate:{ideal:30,max:30}}
   : {width: {ideal: edge, max: edge}, height: {ideal: edge, max: edge}};
 const supported=navigator.mediaDevices.getSupportedConstraints() as MediaTrackSupportedConstraints&{resizeMode?:boolean};
 if(options?.profile==='video'&&supported.resizeMode)(size as MediaTrackConstraints&{resizeMode?:string}).resizeMode='crop-and-scale';
 try {
  stream = await navigator.mediaDevices.getUserMedia({video: {...size, facingMode: {exact: facing}}, audio});
 } catch (error) {
  if (!(error instanceof DOMException) || !['OverconstrainedError','NotFoundError'].includes(error.name)) throw error;
  stream = await navigator.mediaDevices.getUserMedia({video: {...size, facingMode: {ideal: facing}}, audio});
 }
 return stream;
}

export function centerCrop(width:number,height:number,ratio:number) {
 const sw=Math.min(width,height*ratio),sh=Math.min(height,width/ratio);
 return {x:(width-sw)/2,y:(height-sh)/2,width:sw,height:sh};
}

/** Record the native track when its shape fits; crop only devices that ignore aspectRatio. */
export function videoRecordingSource(video:HTMLVideoElement,source:MediaStream,ratio:number) {
 const width=video.videoWidth,height=video.videoHeight;
 if(!width||!height)throw Error('Kamera belum siap. Tunggu sebentar lalu coba lagi.');
 if(Math.abs(width/height-ratio)/ratio<.015)return {stream:source,dispose:()=>{}};
 const canvas=document.createElement('canvas');
 if(!canvas.captureStream)throw Error('Browser ini belum mendukung rasio rekaman. Pilih video dari perangkat atau gunakan browser terbaru.');
 const crop=centerCrop(width,height,ratio),scale=Math.min(1,720/Math.min(crop.width,crop.height));
 canvas.width=Math.max(2,Math.floor(crop.width*scale/2)*2);canvas.height=Math.max(2,Math.floor(crop.height*scale/2)*2);
 const ctx=canvas.getContext('2d',{alpha:false});if(!ctx)throw Error('Kamera tidak dapat menyiapkan video.');
 let alive=true,frame=0,raf=0,last=-Infinity;
 const draw=(now:number)=>{const elapsed=now-last;if(elapsed>=1000/24){ctx.drawImage(video,crop.x,crop.y,crop.width,crop.height,0,0,canvas.width,canvas.height);last=Number.isFinite(elapsed)?now-elapsed%(1000/24):now}};
 draw(performance.now());
 const stream=canvas.captureStream(24);
 for(const track of source.getAudioTracks())stream.addTrack(track);
 if('requestVideoFrameCallback' in video){
  const tick=(now:number)=>{if(!alive)return;draw(now);frame=video.requestVideoFrameCallback(tick)};
  frame=video.requestVideoFrameCallback(tick);
 }else{
  const tick=(now:number)=>{if(!alive)return;draw(now);raf=requestAnimationFrame(tick)};
  raf=requestAnimationFrame(tick);
 }
 return {stream,dispose:()=>{alive=false;if(frame)video.cancelVideoFrameCallback(frame);if(raf)cancelAnimationFrame(raf);stream.getVideoTracks().forEach(t=>t.stop())}};
}
