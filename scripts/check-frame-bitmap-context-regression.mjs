// Isolated React/Konva regression for stale QR bitmaps after render-context changes.
import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {chromium} from '@playwright/test';

const bundle=await build({stdin:{contents:`
 import React from 'react';
 import {createRoot} from 'react-dom/client';
 import {flushSync} from 'react-dom';
 import Konva from 'konva';
 import FrameArtboard from './src/components/frame-artboard';
 import {toFrameDocument} from './src/lib/frame-document';
 const doc=toFrameDocument({width:600,height:600,background:'#FFFFFF',slots:[],text:'',sticker:'',overlays:[]});
 doc.objects=[{id:'qr',name:'QR',kind:'qr',x:5,y:5,w:30,h:30,rotation:0,opacity:1,visible:true,locked:false,ratioLock:false,layoutTypes:[],content:'',context:'event',slot:false,quietZone:4}];
 const root=createRoot(document.getElementById('root'));
 globalThis.drawQr=(context,url)=>{
  const next={...doc,objects:doc.objects.map(o=>({...o,context}))};
  flushSync(()=>root.render(React.createElement(FrameArtboard,{document:next,selected:[],onSelect:()=>{},onChange:()=>{},options:{[context==='gallery'?'galleryUrl':'eventUrl']:url},grid:false,smart:false,panTool:false,layoutType:'custom'})));
 };
 globalThis.qrBitmap=()=>Konva.stages[0]?.find('Image')[0]?.image()?.toDataURL();
`,resolveDir:process.cwd(),loader:'tsx'},bundle:true,write:false,format:'iife',platform:'browser',logLevel:'silent'});

const browser=await chromium.launch({headless:true});
try{
 const page=await browser.newPage();
 await page.setContent('<!doctype html><html><body><div id="root" style="width:600px;height:600px"></div></body></html>');
 await page.addScriptTag({content:bundle.outputFiles[0].text});
 await page.evaluate(()=>globalThis.drawQr('event','https://example.invalid/event/first'));
 await page.waitForFunction(()=>!!globalThis.qrBitmap());
 let previous=await page.evaluate(()=>globalThis.qrBitmap());
 for(const [context,url] of [['event','https://example.invalid/event/second'],['gallery','https://example.invalid/gallery/first'],['gallery','https://example.invalid/gallery/second']]){
  await page.evaluate(({context,url})=>globalThis.drawQr(context,url),{context,url});
  await page.waitForFunction(old=>{const current=globalThis.qrBitmap();return !!current&&current!==old;},previous,{timeout:3000}).catch(()=>assert.fail(`QR bitmap remained stale for ${context}: ${url}`));
  previous=await page.evaluate(()=>globalThis.qrBitmap());
 }
 console.log('Isolated bitmap regression completed: event and gallery URL changes repaint QR bitmaps. No application pages, screenshots or E2E suite. QR decoding and gesture acceptance remain NOT_TESTED.');
}finally{await browser.close();}
