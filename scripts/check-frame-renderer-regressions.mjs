// One isolated canvas check for the legacy baseline/clipping regression. No app server or browser navigation suite.
import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {chromium} from '@playwright/test';
const bundle=await build({stdin:{contents:"import {renderStrip} from './src/lib/renderer';import {toFrameDocument} from './src/lib/frame-document';globalThis.frameCheck={renderStrip,toFrameDocument};",resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,format:'iife',platform:'browser',logLevel:'silent'});
let browser;try{browser=await chromium.launch({headless:true});}catch(error){console.log('NOT_TESTED: isolated canvas check could not launch installed Chromium: '+error.message.split('\n')[0]);process.exit(2);}
try{
 const page=await browser.newPage();await page.setContent('<!doctype html><html><body></body></html>');await page.addScriptTag({content:bundle.outputFiles[0].text});
 const result=await page.evaluate(async()=>{
  const {renderStrip,toFrameDocument}=globalThis.frameCheck,frame={width:1200,height:1800,background:'#FFFFFF',slots:[{x:.1,y:.1,w:.8,h:.6,rotation:0,fit:'cover',focalX:.5,focalY:.5,zoom:1}],text:'Legacy text baseline — a long caption that must remain on one line without clipping',textColor:'#000000',sticker:'',overlays:[]};
  const photo=document.createElement('canvas');photo.width=600;photo.height=600;const p=photo.getContext('2d');p.fillStyle='#ff0000';p.fillRect(0,0,600,600);const photos=[photo.toDataURL()];
  const old=await renderStrip(frame,photos,'none','/e/preview'),doc=toFrameDocument(frame),next=await renderStrip(doc,photos,'none','/e/preview');
  function ink(canvas){const ctx=canvas.getContext('2d'),pixels=ctx.getImageData(0,1550,1200,250).data;let x=1200,y=1800,right=-1,bottom=-1;for(let row=0;row<250;row++)for(let col=0;col<1200;col++){const i=(row*1200+col)*4;if(pixels[i]<160&&pixels[i+1]<160&&pixels[i+2]<160){x=Math.min(x,col);y=Math.min(y,row+1550);right=Math.max(right,col);bottom=Math.max(bottom,row+1550);}}return {x,y,right,bottom};}
  const slot=doc.objects.find(o=>o.kind==='slot');slot.w=30;slot.h=30;slot.shape='circle';doc.objects.unshift({...structuredClone(slot),id:'duplicate',x:50,sourceIndex:slot.sourceIndex,crop:{...slot.crop,zoom:2}});const mapped=await renderStrip(doc,photos,'none','/e/preview'),ctx=mapped.getContext('2d'),scale=300/25.4;
  const center=ctx.getImageData(Math.round((slot.x+15)*scale),Math.round((slot.y+15)*scale),1,1).data,corner=ctx.getImageData(Math.round(slot.x*scale),Math.round(slot.y*scale),1,1).data;
  return {legacy:ink(old),v2:ink(next),size:[next.width,next.height],center:Array.from(center),corner:Array.from(corner)};
 });
 assert.ok(result.v2.right>result.v2.x,'Legacy caption must contain visible pixels');for(const key of ['x','y','right','bottom'])assert.ok(Math.abs(result.legacy[key]-result.v2[key])<=1,`${key}: legacy ${result.legacy[key]} vs v2 ${result.v2[key]}`);assert.deepEqual(result.size,[1200,1800]);assert.equal(result.center[0],255);assert.equal(result.center[1],0);assert.equal(result.corner[1],255);
 console.log('Isolated canvas regression completed: legacy long caption bounds within 1 px, visible baseline, 1200×1800 output, repeated source mapping and circular clipping. No app pages, screenshots or E2E suite.');
}finally{await browser.close();}
