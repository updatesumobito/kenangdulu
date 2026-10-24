// Focused mobile file-picker -> guest upload -> private couple album check.
import assert from 'node:assert/strict';
import {chromium,devices,expect,request} from '@playwright/test';
const base=process.env.PLAYWRIGHT_BASE_URL||'http://127.0.0.1:3117';
if(!['127.0.0.1','localhost'].includes(new URL(base).hostname))throw Error('Use an isolated local preview.');
const slug='demo-signature',name='Regresi berkas '+Date.now(),code='MobileRegression2026';
async function data(response){assert.ok(response.ok(),await response.text());return (await response.json()).data;}
const admin=await request.newContext({baseURL:base});
await data(await admin.post('/api/v1/auth/login',{data:{email:'admin@demo.komukuna.test',password:'KomukunaDemo2026!'}}));
const event=await data(await admin.get('/api/v1/public/events/'+slug+'/bootstrap'));
await data(await admin.post('/api/v1/events/'+event.id+'/couple-access',{data:{enabled:true,code}}));
const browser=await chromium.launch({args:['--use-fake-device-for-media-stream','--use-fake-ui-for-media-stream']});
let page;
try{
 const context=await browser.newContext({...devices['Pixel 5'],permissions:['camera','microphone']});page=await context.newPage();page.setDefaultTimeout(20000);
 const errors=[];page.on('pageerror',error=>errors.push(error.message));
 await page.goto(base+'/e/'+slug);await page.getByRole('button',{name:'Mulai buat kenangan'}).click();await expect(page.locator('#gw-name-form')).toBeVisible();await page.waitForTimeout(700);
 await page.getByLabel('Namamu',{exact:true}).fill(name);await page.getByRole('checkbox').check();await page.getByRole('button',{name:'Lanjut buat kenangan'}).click();
 for(const [kind,file,preview,next] of [
  ['foto','tests/fixtures/photo.jpg','.gw-photo-tray img','Pakai foto ini & lanjut'],
  ['suara','tests/fixtures/voice.m4a','.gw-record-result audio','Simpan suara & lanjut'],
  ['video','tests/fixtures/video-1s.mp4','.gw-record-result video','Simpan video & lanjut'],
 ]){
  const input=page.getByLabel('Pilih '+kind+' dari galeri',{exact:true});await expect(input).toBeAttached();
  if(kind!=='suara')await expect(page.locator('.gm-camera-state')).toBeHidden();
  await input.setInputFiles(file);await page.getByRole('button',{name:'Tambahkan 1 '+kind,exact:true}).click();
  await expect(page.locator(preview).first()).toBeVisible();await expect(page.getByRole('button',{name:next,exact:true})).toBeEnabled();await page.getByRole('button',{name:next,exact:true}).click();
  console.log('Mobile file picker: '+kind+' imported and added to draft.');
 }
 await page.getByLabel('Ucapanmu',{exact:true}).fill('Ucapan bersama berkas dari perangkat.');await page.getByRole('button',{name:'Periksa kenangan',exact:true}).click();await page.getByRole('button',{name:'Kirim kenangan untuk pengantin',exact:true}).click();
 await expect(page.locator('#gw-thanks-title')).toContainText(name,{timeout:90000});
 await data(await context.request.post(base+'/api/v1/couple/events/'+slug+'/session',{data:{code}}));
 await expect.poll(async()=>{const result=await data(await context.request.get(base+'/api/v1/couple/events/'+slug+'/gallery?q='+encodeURIComponent(name)));return result.items.filter(item=>item.processing==='ready').length;},{timeout:90000,intervals:[1500,2500]}).toBe(4);
 const collection=await data(await context.request.get(base+'/api/v1/couple/events/'+slug+'/gallery?q='+encodeURIComponent(name)));
 for(const memory of collection.items.filter(item=>item.url)){const response=await context.request.get(base+memory.url);assert.ok(response.ok(),'Couple media must be readable after import');assert.ok((await response.body()).length>0);}
 assert.deepEqual(errors,[]);console.log('Imported photo, voice, video and wish: all 4 ready and readable in the private couple album.');
}catch(error){if(page)console.error('Import state:',(await page.locator('main').innerText().catch(()=>'' )).slice(-4500));throw error;}
finally{await browser.close();await admin.dispose();}
