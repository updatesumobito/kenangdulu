// Targeted regression for shutter stalls and the guest -> couple media journey.
// Only use seeded local demo data; never put synthetic memories in a real event.
import assert from 'node:assert/strict';
import {chromium,devices,expect,request} from '@playwright/test';
const base=process.env.PLAYWRIGHT_BASE_URL||'http://127.0.0.1:3117';
if(!['127.0.0.1','localhost'].includes(new URL(base).hostname))throw Error('Use an isolated local preview.');
const slug='demo-signature',name='Regresi mobile '+Date.now(),code='MobileRegression2026';
const admin=await request.newContext({baseURL:base});
async function data(response){assert.ok(response.ok(),await response.text());return (await response.json()).data;}
await data(await admin.post('/api/v1/auth/login',{data:{email:'admin@demo.komukuna.test',password:'KomukunaDemo2026!'}}));
const event=await data(await admin.get('/api/v1/public/events/'+slug+'/bootstrap'));
await data(await admin.post('/api/v1/events/'+event.id+'/couple-access',{data:{enabled:true,code}}));
const browser=await chromium.launch({args:['--use-fake-device-for-media-stream','--use-fake-ui-for-media-stream']});
let page;
try{
 const context=await browser.newContext({...devices['Pixel 5'],permissions:['camera','microphone']});
 await context.addInitScript(()=>{globalThis.nativePhotoRequests=0;globalThis.ImageCapture=class{takePhoto(){globalThis.nativePhotoRequests++;return new Promise(()=>{});}};});
 page=await context.newPage();page.setDefaultTimeout(20000);const errors=[];page.on('pageerror',error=>errors.push(error.message));
 await page.goto(base+'/e/'+slug);await page.getByRole('button',{name:'Mulai buat kenangan'}).click();
 await expect(page.locator('.gw-name-form, #gw-name-form')).toBeVisible();
 // Let any development hydration finish before typing into controlled fields.
 await page.waitForTimeout(700);
 await page.getByLabel('Namamu',{exact:true}).fill(name);await page.getByRole('checkbox').check();await page.getByRole('button',{name:'Lanjut buat kenangan'}).click();
 await expect(page.getByRole('button',{name:'Ambil foto',exact:true})).toBeEnabled();
 await page.getByRole('button',{name:'Timer 3 detik'}).click();await page.getByRole('button',{name:'Tanpa timer',exact:true}).click();
 await page.getByRole('button',{name:'Ambil foto',exact:true}).click();await expect(page.getByAltText('Kenangan foto 1',{exact:true})).toBeVisible();
 await page.getByRole('button',{name:'9:16 Tegak',exact:true}).click();await page.getByRole('button',{name:'Mono',exact:true}).click();
 await page.getByRole('button',{name:'Ambil foto',exact:true}).click();await expect(page.getByAltText('Kenangan foto 2',{exact:true})).toBeVisible();
 assert.equal(await page.evaluate(()=>globalThis.nativePhotoRequests),0,'Mobile shutters must preserve the live preview without native still-capture stalls.');
 console.log('Camera: mobile touch, live-frame capture, repeat shutter, ratio, and filter succeeded.');
 await page.getByRole('button',{name:'Pakai foto ini & lanjut'}).click();
 await page.getByRole('button',{name:'Mulai rekam suara',exact:true}).click();await page.waitForTimeout(1400);await page.getByRole('button',{name:'Hentikan rekaman',exact:true}).click();
 await expect(page.locator('.gw-record-result audio')).toBeVisible();await page.getByRole('button',{name:'Simpan suara & lanjut'}).click();
 await expect(page.getByRole('button',{name:'Mulai rekam video',exact:true})).toBeEnabled();await page.getByRole('button',{name:'Mulai rekam video',exact:true}).click();
 if(await page.getByRole('button',{name:'Setuju optimasi & rekam'}).isVisible())await page.getByRole('button',{name:'Setuju optimasi & rekam'}).click();
 await expect(page.getByRole('button',{name:'Hentikan rekaman video',exact:true})).toBeEnabled();await page.waitForTimeout(1400);await page.getByRole('button',{name:'Hentikan rekaman video',exact:true}).click();
 await expect(page.locator('.gw-record-result video')).toBeVisible();await page.getByRole('button',{name:'Simpan video & lanjut'}).click();
 await page.getByLabel('Ucapanmu',{exact:true}).fill('Semoga bahagia selalu. Ucapan regresi lokal.');await page.getByRole('button',{name:'Periksa kenangan',exact:true}).click();
 await page.getByRole('button',{name:'Kirim kenangan untuk pengantin',exact:true}).click();
 await expect(page.getByRole('heading',{name:new RegExp('Terima kasih,.*'+name)})).toBeVisible({timeout:90000});
 console.log('Guest: voice, video, wishes, chunked upload, and thank-you receipt succeeded.');
 const couple=await context.newPage();await couple.goto(base+'/e/'+slug+'/pengantin');await couple.getByLabel('Kode akses pengantin',{exact:true}).fill(code);await couple.locator('#couple-code-form').getByRole('button',{name:'Buka album kami',exact:true}).click();
 await expect(couple.getByRole('button',{name:new RegExp('Buka album '+name+', 5 kiriman')})).toBeVisible({timeout:30000});
 await expect.poll(async()=>{const result=await data(await context.request.get(base+'/api/v1/couple/events/'+slug+'/gallery?q='+encodeURIComponent(name)));return result.items.filter(item=>item.processing==='ready').length;},{timeout:90000,intervals:[1500,2500]}).toBe(5);
 await couple.getByRole('button',{name:new RegExp('Buka album '+name+', 5 kiriman')}).click();
 await expect(couple.locator('.couple-memory-card')).toHaveCount(5);await expect(couple.getByText('Semoga bahagia selalu. Ucapan regresi lokal.',{exact:true})).toBeVisible();
 for(const element of await couple.locator('.couple-memory-card.is-photo img').all())await expect.poll(()=>element.evaluate(image=>image.naturalWidth)).toBeGreaterThan(0);
 const audio=couple.locator('audio'),video=couple.locator('video');
 for(const player of [audio,video]){await player.evaluate(async element=>{await element.play();});await expect(player).toHaveJSProperty('paused',false);await player.evaluate(element=>element.pause());}
 const photo=couple.locator('.couple-memory-card.is-photo button').first();await photo.click();await expect(couple.getByRole('dialog',{name:name})).toBeVisible();
 await couple.getByRole('button',{name:'Foto berikutnya',exact:true}).click();await expect(couple.locator('.couple-viewer-counter')).toContainText('2 / 2');await couple.getByRole('button',{name:'Tutup galeri foto',exact:true}).click();
 assert.deepEqual(errors,[],'Guest page must not throw runtime errors.');
 console.log('Couple: all 5 private submissions visible, photo viewer navigation and audio/video playback succeeded.');
}catch(error){if(page)console.error('Guest state:',(await page.locator('main').innerText().catch(()=>'' )).slice(-4500));throw error;}
finally{await browser.close();await admin.dispose();}
