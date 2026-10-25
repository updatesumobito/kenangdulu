// Targeted regression: interrupted final submission must resume and reach thank-you.
// Synthetic memories are written only to the isolated local demo preview.
import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {chromium,devices,expect} from '@playwright/test';

const base=process.env.PLAYWRIGHT_BASE_URL||'http://127.0.0.1:3117';
if(!['127.0.0.1','localhost'].includes(new URL(base).hostname))throw Error('Use an isolated local preview.');
const slug='demo-signature',name='Regresi pengiriman '+Date.now();
const browser=await chromium.launch();
try{
 const context=await browser.newContext({...devices['Pixel 5'],reducedMotion:'reduce'});
 const page=await context.newPage(),errors=[];
 page.on('pageerror',error=>errors.push(error.message));
 async function data(response){assert.ok(response.ok(),await response.text());return (await response.json()).data;}
 const event=await data(await context.request.get(base+'/api/v1/public/events/'+slug+'/bootstrap'));
 await data(await context.request.post(base+'/api/v1/public/events/'+slug+'/sessions',{data:{name,consent:true}}));
 const session=await data(await context.request.get(base+'/api/v1/guest/me/limits'));
 await page.goto(base+'/e/'+slug);
 // Chrome currently records audio/mp4 as fragmented MP4 with Opus, which
 // differs from the prebuilt AAC fixture and must survive server inspection.
 const recordedVoice=Buffer.from(await page.evaluate(async()=>{
  const audio=new AudioContext();await audio.resume();const oscillator=audio.createOscillator(),destination=audio.createMediaStreamDestination();oscillator.connect(destination);oscillator.start();
  const recorder=new MediaRecorder(destination.stream,{mimeType:'audio/mp4',audioBitsPerSecond:96000}),chunks=[];
  recorder.ondataavailable=event=>chunks.push(event.data);
  const stopped=new Promise(resolve=>{recorder.onstop=resolve;});recorder.start(250);await new Promise(resolve=>setTimeout(resolve,1400));recorder.stop();await stopped;
  oscillator.stop();destination.stream.getTracks().forEach(track=>track.stop());await audio.close();
  const blob=new Blob(chunks,{type:recorder.mimeType});return [...new Uint8Array(await blob.arrayBuffer())];
 }));
 await writeFile('.data/guest-send-recorded-voice.m4a',recordedVoice);
 const photo=await readFile('tests/fixtures/photo.jpg');
 const files=await Promise.all([
  ['disposable_photo',Buffer.concat([photo,Buffer.alloc(1048576)])],
  ['disposable_photo',photo],
  ['voice',recordedVoice],
  ['video_wish',await readFile('tests/fixtures/video-1s.mp4')],
 ].map(async([kind,body])=>({kind,base64:body.toString('base64'),mime:kind==='voice'?'audio/mp4;codecs=opus':kind==='video_wish'?'video/mp4':'image/jpeg'})));
 await page.evaluate(async({eventId,guestId,name,files})=>{
  const draft={version:1,eventId,guestId,name,consent:true,media:files.map(file=>({id:crypto.randomUUID(),key:crypto.randomUUID(),kind:file.kind,blob:new Blob([Uint8Array.from(atob(file.base64),c=>c.charCodeAt(0))],{type:file.mime}),duration:1})),text:'Semoga bahagia selalu. Regresi pengiriman terputus.',noteKey:crypto.randomUUID(),confirmed:['name','camera','voice','video','note'],videoSkipped:false,step:'review',started:false,sent:false,updatedAt:Date.now()};
  const db=await new Promise((resolve,reject)=>{const request=indexedDB.open('komukuna-guest-drafts',1);request.onupgradeneeded=()=>request.result.createObjectStore('drafts',{keyPath:'eventId'});request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error);});
  await new Promise((resolve,reject)=>{const tx=db.transaction('drafts','readwrite');tx.objectStore('drafts').put(draft);tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);});db.close();
 },{eventId:event.id,guestId:session.guestId,name,files});
 await page.reload();await page.getByRole('button',{name:'Mulai buat kenangan'}).click();
 await expect(page.getByRole('button',{name:'Kirim kenangan untuk pengantin',exact:true})).toBeEnabled();
 let interruptedChunk=false,lostFinalize=false,lostNote=false;
 let normalizedVoice=false;
 const chunks=[];
 await page.route('**/api/v1/guest/media/intents',async route=>{
  const input=route.request().postDataJSON();if(input.kind==='voice'){normalizedVoice=input.mimeType==='audio/wav';assert.ok(normalizedVoice,'Normalize existing Opus/MP4 voice drafts before reserving upload.');}
  await route.continue();
 });
 await page.route('**/api/v1/guest/uploads/*',async route=>{
  const request=route.request();
  if(request.method()==='PUT'){
   chunks.push(request.headers()['content-range']);
   if(!interruptedChunk){interruptedChunk=true;await route.fulfill({status:503,contentType:'text/html',body:'Temporarily unavailable'});return;}
  }
  await route.continue();
 });
 await page.route('**/api/v1/guest/media/*/finalize',async route=>{
  if(!lostFinalize){lostFinalize=true;const response=await route.fetch();assert.ok(response.ok(),await response.text());await route.fulfill({status:502,contentType:'text/html',body:'Response lost after commit'});return;}
  await route.continue();
 });
 await page.route('**/api/v1/guest/notes',async route=>{
  if(!lostNote){lostNote=true;const response=await route.fetch();assert.ok(response.ok(),await response.text());await route.fulfill({status:502,contentType:'text/html',body:'Response lost after commit'});return;}
  await route.continue();
 });
 await page.getByRole('button',{name:'Kirim kenangan untuk pengantin',exact:true}).click();
 try{await expect(page.locator('#gw-thanks-title')).toContainText(name,{timeout:45000});}
 catch(error){console.error('Submission state:',(await page.locator('main').innerText()).slice(-2500));throw error;}
 assert.ok(interruptedChunk&&lostFinalize&&lostNote&&normalizedVoice,'Exercise chunk failure, voice normalization and lost media/note acknowledgements.');
 assert.equal(chunks.filter(range=>range===`bytes 0-1048575/${1048576+photo.length}`).length,2,'Retry the failed first chunk once.');
 await expect(page.locator('.gw-send-overlay')).toHaveCount(0);
 // Read-only verification of the local demo guest through the local admin API.
 const admin=await context.request.post(base+'/api/v1/auth/login',{data:{email:'admin@demo.komukuna.test',password:'KomukunaDemo2026!'}});await data(admin);
 const albums=await data(await context.request.get(base+'/api/v1/events/'+event.id+'/albums?q='+encodeURIComponent(name)));
 assert.equal(albums.albums.length,1);assert.equal(albums.albums[0].count,5,'Exactly two photos, voice, video and note; no duplicate retries.');
 await page.reload();await page.getByRole('button',{name:'Mulai buat kenangan'}).click();
 await expect(page.locator('#gw-thanks-title')).toContainText(name);
 assert.deepEqual(errors,[]);
 console.log('Submission regression: resumed interrupted chunks, recovered lost finalize/note responses, exactly 5 saved items, thank-you persisted after reload. Local demo only.');
}finally{await browser.close();}
