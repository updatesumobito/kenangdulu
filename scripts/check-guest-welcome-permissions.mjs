// Regression: a restored video step must not request devices behind the welcome.
import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {chromium,expect} from '@playwright/test';

const bundle=await build({stdin:{contents:`
 import React from 'react';import {createRoot} from 'react-dom/client';
 import Opening from './src/components/guest-opening';
 import Recorder from './src/components/guest-recorder';
 globalThis.deviceRequests=[];globalThis.stopped=0;
 Object.defineProperty(navigator,'mediaDevices',{value:{getSupportedConstraints:()=>({}),getUserMedia:constraints=>new Promise(resolve=>{globalThis.deviceRequests.push({constraints,resolve});})}});
 Object.defineProperties(HTMLVideoElement.prototype,{videoWidth:{get:()=>1280},videoHeight:{get:()=>720}});
 HTMLMediaElement.prototype.play=()=>Promise.resolve();
 globalThis.finishRequest=index=>{
  const stream=new MediaStream(),track={getSettings:()=>({facingMode:'user'}),stop:()=>globalThis.stopped++};
  stream.getVideoTracks=()=>[track];stream.getTracks=()=>[track];
  globalThis.deviceRequests[index].resolve(stream);
 };
 const session={captureSnapshot:{settings:{videoSec:15,voiceSec:30,allowUpload:false}}};
 createRoot(document.getElementById('root')).render(<Opening name="Acara demo" date="Hari ini" modes={['video_wish']}><Recorder session={session} mode="video_wish" onChange={()=>{}} onBusy={()=>{}}/></Opening>);
`,resolveDir:process.cwd(),loader:'tsx'},bundle:true,write:false,format:'iife',platform:'browser',jsx:'automatic',define:{'process.env':'{}'},logLevel:'silent'});
const browser=await chromium.launch({headless:true});
try{
 const page=await browser.newPage({reducedMotion:'reduce'}),errors=[];
 page.on('pageerror',error=>{errors.push(error.message);console.error(error.message)});
 await page.setContent('<!doctype html><div id="root"></div>');await page.addScriptTag({content:bundle.outputFiles[0].text});
 await expect(page.getByRole('button',{name:'Mulai buat kenangan',exact:true})).toBeVisible();
 await page.waitForTimeout(250);
 assert.equal(await page.evaluate(()=>globalThis.deviceRequests.length),0,'Welcome must not mount a restored video recorder');
 await page.getByRole('button',{name:/Video ucapan/}).click();
 await page.evaluate(()=>document.dispatchEvent(new Event('visibilitychange')));
 assert.equal(await page.evaluate(()=>globalThis.deviceRequests.length),0,'Video tutorial and visibility changes must not request devices');
 await page.getByRole('button',{name:'Mulai buat kenangan',exact:true}).click();
 await page.waitForFunction(()=>globalThis.deviceRequests.length===1);
 assert.equal(await page.evaluate(()=>globalThis.deviceRequests[0].constraints.audio),true);
 await page.getByRole('button',{name:'Lihat cara pakai',exact:true}).click();
 await page.evaluate(()=>globalThis.finishRequest(0));
 await expect.poll(()=>page.evaluate(()=>globalThis.stopped)).toBeGreaterThan(0);
 await page.waitForTimeout(250);
 assert.equal(await page.evaluate(()=>globalThis.deviceRequests.length),1,'Replayed welcome must not restart devices');
 await page.getByRole('button',{name:'Mulai buat kenangan',exact:true}).click();
 await page.waitForFunction(()=>globalThis.deviceRequests.length===2);
 assert.deepEqual(errors,[]);
 console.log('Welcome permission regression: no device request before entry or from tutorial/visibility; video requests after entry; replay stops stale streams and defers reopening. Mock devices only.');
}finally{await browser.close();}
