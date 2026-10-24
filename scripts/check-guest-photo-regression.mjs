// Camera-driver failures must not leave a shutter permanently locked.
import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {chromium} from '@playwright/test';
const result=await build({stdin:{contents:"import {takeCameraPhoto} from './src/lib/guest-photo';globalThis.takeCameraPhoto=takeCameraPhoto;",resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,format:'iife',platform:'browser',logLevel:'silent'});
const browser=await chromium.launch();
try{
 for(const mobile of [false,true]){
  const page=await browser.newPage({viewport:{width:393,height:851},isMobile:mobile,hasTouch:mobile});
  await page.setContent('<video autoplay muted playsinline></video>');await page.addScriptTag({content:result.outputFiles[0].text});
  const cases=await page.evaluate(async()=>{
   const video=document.querySelector('video'),canvas=document.createElement('canvas');canvas.width=640;canvas.height=480;const context=canvas.getContext('2d');context.fillStyle='#c00';context.fillRect(0,0,640,480);
   const source=canvas.captureStream(30);video.srcObject=source;await video.play();
   const result=[],coarse=matchMedia('(pointer: coarse)').matches;
   for(const mode of ['native','reject','empty','stalled','missing']){
    const stream=source.clone();let requests=0;
    globalThis.ImageCapture=mode==='missing'?undefined:class{takePhoto(){requests++;if(mode==='stalled')return new Promise(()=>{});if(mode==='reject')return Promise.reject(Error('Driver failed'));return Promise.resolve(mode==='empty'?new Blob([]):new Blob(['native-photo'],{type:'image/jpeg'}));}};
    const start=performance.now();
    const photo=await Promise.race([globalThis.takeCameraPhoto(video,stream),new Promise((_,reject)=>setTimeout(()=>reject(Error('Shutter stayed locked')),4500))]);
    const native=mode==='native'&&!coarse;
    if(!photo.size||photo.type!=='image/jpeg')throw Error('Photo unavailable');
    if(native&&await photo.text()!=='native-photo')throw Error('Native capture was not preserved');
    if(!native){const image=await createImageBitmap(photo);if(image.width!==640||image.height!==480)throw Error('Fallback lost the preview dimensions');image.close();}
    if(mode==='stalled'){await globalThis.takeCameraPhoto(video,stream);if(requests!==(coarse?0:1))throw Error('A stalled native request was retried');}
    result.push({mode,requests,elapsed:Math.round(performance.now()-start)});stream.getTracks().forEach(track=>track.stop());
   }
   const ended=source.clone();ended.getTracks().forEach(track=>track.stop());let rejected=false;try{await globalThis.takeCameraPhoto(video,ended);}catch{rejected=true;}if(!rejected)throw Error('Ended camera track was accepted');
   source.getTracks().forEach(track=>track.stop());return {coarse,cases:result};
  });
  assert.equal(cases.coarse,mobile);assert.ok(cases.cases.every(item=>item.elapsed<4500));
  if(mobile)assert.ok(cases.cases.every(item=>item.requests===0));
  console.log(JSON.stringify({profile:mobile?'mobile touch':'desktop',...cases}));await page.close();
 }
 console.log('Photo regressions passed: live frames, native success/rejection/empty/stall/absence, repeated capture, and ended tracks.');
}finally{await browser.close();}
