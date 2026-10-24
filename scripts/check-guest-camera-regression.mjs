// Focused regression: a stale camera request must not stop its replacement.
import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {chromium} from '@playwright/test';

const bundle=await build({stdin:{contents:`
 import React from 'react';
 import {createRoot} from 'react-dom/client';
 import {useGuestCamera} from './src/components/use-guest-camera';
 const requests=[];
 Object.defineProperty(navigator,'mediaDevices',{value:{
  getSupportedConstraints:()=>({}),
  getUserMedia:constraints=>new Promise((resolve,reject)=>requests.push({constraints,resolve,reject}))
 }});
 Object.defineProperties(HTMLVideoElement.prototype,{
  videoWidth:{get:()=>1280},videoHeight:{get:()=>720}
 });
 HTMLMediaElement.prototype.play=()=>Promise.resolve();
 globalThis.requests=requests;
 globalThis.stops=0;
 globalThis.resolveCamera=index=>{
  const stream=new MediaStream();
  const track={getSettings:()=>({facingMode:'user'}),stop:()=>globalThis.stops++};
  stream.getVideoTracks=()=>[track];stream.getTracks=()=>[track];
  requests[index].resolve(stream);
 };
 function Camera(){globalThis.camera=useGuestCamera('video',true);return <video ref={globalThis.camera.video}/>;}
 createRoot(document.getElementById('root')).render(<Camera/>);
`,resolveDir:process.cwd(),loader:'tsx'},bundle:true,write:false,format:'iife',platform:'browser',logLevel:'silent'});

const browser=await chromium.launch({headless:true});
try{
 const page=await browser.newPage();
 await page.setContent('<!doctype html><div id="root"></div>');
 await page.addScriptTag({content:bundle.outputFiles[0].text});
 await page.waitForFunction(()=>globalThis.requests?.length===1);
 const constraints=await page.evaluate(()=>globalThis.requests[0].constraints.video);
 assert.equal(constraints.width.ideal,1920);
 assert.equal(constraints.frameRate.ideal,30);
 await page.evaluate(()=>{globalThis.camera.stop();void globalThis.camera.start();});
 await page.waitForFunction(()=>globalThis.requests.length===2);
 await page.evaluate(()=>globalThis.resolveCamera(1));
 await page.waitForFunction(()=>globalThis.camera.ready);
 await page.evaluate(async()=>{
  globalThis.requests[0].reject(new Error('Old camera request failed'));
  await new Promise(resolve=>setTimeout(resolve,30));
 });
 const result=await page.evaluate(()=>({stops:globalThis.stops,active:!!globalThis.camera.stream.current,ready:globalThis.camera.ready,error:globalThis.camera.error}));
 assert.deepEqual(result,{stops:0,active:true,ready:true,error:''});
 await page.evaluate(()=>globalThis.camera.stop());
 assert.equal(await page.evaluate(()=>globalThis.stops),1);
 console.log('Camera race regression completed: stale failure preserves replacement stream; explicit stop releases it; video requests 1080p/30 fps. Mock streams only; no app pages or real-device testing.');
}finally{await browser.close();}
