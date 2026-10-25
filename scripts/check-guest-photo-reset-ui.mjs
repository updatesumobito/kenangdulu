// Targeted camera recovery UI regression; synthetic camera, no app server/uploads.
import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {chromium,expect} from '@playwright/test';
import {readFile} from 'node:fs/promises';

const bundle=await build({stdin:{contents:`
 import React,{useState} from 'react';
 import {createRoot} from 'react-dom/client';
 import Camera from './src/components/guest-wizard-camera';
 const settings={modes:['disposable_photo'],perGuest:2,allowUpload:false};
 const event={slug:'demo-mini',timezone:'Asia/Jakarta',settings,snapshot:{perGuest:2,filters:1}};
 Object.defineProperty(navigator,'mediaDevices',{value:{getSupportedConstraints:()=>({}),getUserMedia:async()=>{
  const canvas=document.createElement('canvas');canvas.width=320;canvas.height=240;
  const context=canvas.getContext('2d');context.fillStyle='#93243f';context.fillRect(0,0,320,240);
  const timer=setInterval(()=>context.fillRect(0,0,320,240),100),stream=canvas.captureStream(10);
  globalThis.cameraStream=stream;globalThis.cameraTimer=timer;return stream;
 }}});
 globalThis.ImageCapture=undefined;
 function App(){
  const [media,setMedia]=useState([]),[remaining,setRemaining]=useState(0);
  globalThis.media=media;globalThis.restorePhoto=()=>setMedia([{id:'saved',mediaId:'saved',key:'saved',kind:'disposable_photo',blob:new Blob([],{type:'image/png'}),readyUrl:'http://localhost/saved.png'}]);
  return <div className="guest-shell"><main className="guest-wizard"><Camera event={event} session={{remaining,captureSnapshot:{settings}}} media={media} onAdd={item=>setMedia(old=>[...old,item])} onRemove={id=>setMedia(old=>old.filter(item=>item.id!==id))} onBusy={()=>{}} onReset={async()=>{setMedia(old=>old.filter(item=>item.mediaId));setRemaining(2);}}/></main></div>;
 }
 createRoot(document.getElementById('root')).render(<App/>);
`,resolveDir:process.cwd(),loader:'tsx'},bundle:true,write:false,format:'iife',platform:'browser',logLevel:'silent'});
const browser=await chromium.launch({headless:true});
try{
 const page=await browser.newPage(),errors=[];
 page.on('pageerror',error=>errors.push(error.message));
 await page.route('http://localhost/photo-regression',route=>route.fulfill({contentType:'text/html',body:'<!doctype html><div id="root"></div>'}));
 await page.route('http://localhost/saved.png',route=>route.fulfill({contentType:'image/png',body:Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jk1sAAAAASUVORK5CYII=','base64')}));
 await page.goto('http://localhost/photo-regression');
 for(const file of ['src/app/guest-wizard.css','src/app/guest-media.css'])await page.addStyleTag({content:await readFile(file,'utf8')});
 await page.addScriptTag({content:bundle.outputFiles[0].text});
 await expect(page.getByRole('button',{name:'Ambil foto',exact:true})).toBeDisabled();
 await expect(page.getByText(/Jatah foto masih tercatat/)).toBeVisible();
 async function reset(){
  await page.getByRole('button',{name:'Ulangi semua foto',exact:true}).click();
  await page.getByRole('button',{name:'Reset & ulangi foto',exact:true}).click();
  await expect(page.getByRole('button',{name:'Ambil foto',exact:true})).toBeEnabled();
 }
 await expect(page.getByRole('button',{name:'Ulangi semua foto',exact:true})).toBeEnabled();
 await reset();await expect(page.getByText('2 tersisa',{exact:true})).toBeVisible();
 await page.getByRole('button',{name:'Timer 3 detik',exact:true}).click();
 await page.getByRole('button',{name:'Tanpa timer',exact:true}).click();
 await page.getByRole('button',{name:'Ambil foto',exact:true}).click();
 await expect(page.getByAltText('Kenangan foto 1',{exact:true})).toBeVisible();
 await expect(page.getByText('1 tersisa',{exact:true})).toBeVisible();
 assert.ok(await page.evaluate(()=>globalThis.media[0].blob.size)>0);
 await reset();await expect(page.getByText('2 tersisa',{exact:true})).toBeVisible();
 await expect(page.getByAltText('Kenangan foto 1',{exact:true})).toHaveCount(0);
 await page.evaluate(()=>globalThis.restorePhoto());
 await expect(page.getByAltText('Kenangan foto 1',{exact:true})).toBeVisible();
 await expect.poll(()=>page.getByAltText('Kenangan foto 1',{exact:true}).evaluate(img=>img.naturalWidth)).toBe(1);
 await reset();
 await expect(page.getByAltText('Kenangan foto 1',{exact:true})).toBeVisible();
 assert.deepEqual(errors,[]);
 console.log('Camera recovery UI: empty/zero-quota notice, reset, shutter recovery, photo appears with one quota deduction, reset clears drafts and preserves server-photo preview. Synthetic camera only.');
}finally{await browser.close();}
