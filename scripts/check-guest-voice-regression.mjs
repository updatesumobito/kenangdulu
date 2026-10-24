// Focused audio regression: real MediaRecorder encoding with synthetic input.
import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {chromium,expect} from '@playwright/test';

const bundle=await build({stdin:{contents:`
 import React,{useState} from 'react';
 import {createRoot} from 'react-dom/client';
 import Recorder from './src/components/guest-recorder';
 globalThis.inputLevel=.2;
 globalThis.inputs=[];
 Object.defineProperty(navigator,'mediaDevices',{value:{getUserMedia:async()=>{
  const context=new AudioContext();await context.resume();
  const source=context.createOscillator(),gain=context.createGain(),destination=context.createMediaStreamDestination();
  gain.gain.value=globalThis.inputLevel;source.connect(gain).connect(destination);source.start();
  globalThis.inputs.push({context,source,gain,destination,stream:destination.stream});return destination.stream;
 }}});
 function App(){const [value,setValue]=useState();globalThis.draft=value;return <Recorder session={{captureSnapshot:{settings:{voiceSec:10,allowUpload:false}}}} mode="voice" value={value} onChange={setValue} onBusy={()=>{}}/>;}
 createRoot(document.getElementById('root')).render(<App/>);
`,resolveDir:process.cwd(),loader:'tsx'},bundle:true,write:false,format:'iife',platform:'browser',logLevel:'silent'});
const browser=await chromium.launch({headless:true,args:['--autoplay-policy=no-user-gesture-required']});
try{
 const page=await browser.newPage();
 await page.route('http://localhost/voice-regression',route=>route.fulfill({contentType:'text/html',body:'<!doctype html><div id="root"></div>'}));
 await page.goto('http://localhost/voice-regression');
 await page.addScriptTag({content:bundle.outputFiles[0].text});
 await page.getByRole('button',{name:'Mulai rekam suara',exact:true}).click();
 await page.waitForTimeout(1100);
 await page.getByRole('button',{name:'Hentikan rekaman',exact:true}).click();
 await expect(page.locator('audio')).toBeVisible();
 const result=await page.evaluate(async()=>{
  const context=new AudioContext(),decoded=await context.decodeAudioData(await globalThis.draft.blob.arrayBuffer());
  let peak=0;for(const sample of decoded.getChannelData(0))peak=Math.max(peak,Math.abs(sample));await context.close();
  const player=document.querySelector('audio');await player.play();
  return {peak,playing:!player.paused,muted:player.muted,tracksStopped:globalThis.inputs.every(input=>input.stream.getTracks().every(track=>track.readyState==='ended'))};
 });
 assert.ok(result.peak>.05,JSON.stringify(result));assert.equal(result.playing,true);assert.equal(result.muted,false);assert.equal(result.tracksStopped,true);
 await page.getByRole('button',{name:'Rekam ulang',exact:true}).last().click();
 await page.evaluate(()=>{globalThis.inputLevel=0;});
 await page.getByRole('button',{name:'Mulai rekam suara',exact:true}).click();
 await page.waitForTimeout(1100);
 await page.getByRole('button',{name:'Hentikan rekaman',exact:true}).click();
 await expect(page.getByRole('alert')).toContainText('Suara belum tertangkap');
 await expect(page.locator('audio')).toHaveCount(0);
 await page.evaluate(()=>{globalThis.inputLevel=.2;});
 await page.getByRole('button',{name:'Mulai rekam suara',exact:true}).click();
 await expect(page.getByRole('meter')).toBeVisible();
 await expect(page.getByText('Suara masuk ke mikrofon.',{exact:true})).toBeVisible();
 await page.waitForTimeout(800);
 await page.getByRole('button',{name:'Hentikan rekaman',exact:true}).click();
 await expect(page.locator('audio')).toBeVisible();
 await expect(page.getByRole('alert')).toHaveCount(0);
 console.log('Voice regression: encoded audio contains signal, preview plays unmuted, microphone released, silent recording rejected, retry and live input meter work. Synthetic audio only; no real-device check.');
}finally{await browser.close();}
