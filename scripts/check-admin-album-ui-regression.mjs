// Focused regression for the album-list -> photo-list transition and modal actions.
import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {chromium,expect} from '@playwright/test';
const bundle=await build({stdin:{contents:`
 import React from 'react';import {createRoot} from 'react-dom/client';
 import AdminAlbumMedia from './src/components/admin-album-media';
 createRoot(document.getElementById('root')).render(<AdminAlbumMedia eventId="event-a" eventName="Acara A" legalHold={false} onSaved={async()=>{}}/>);
`,resolveDir:process.cwd(),loader:'tsx'},bundle:true,write:false,platform:'browser',format:'iife',logLevel:'silent'});
const browser=await chromium.launch({headless:true});
try{
 const page=await browser.newPage(),errors=[],changes=[];
 page.on('pageerror',error=>errors.push(error.message));
 await page.route('http://localhost/admin-fixture',route=>route.fulfill({contentType:'text/html',body:'<!doctype html><div id="root"></div>'}));
 await page.route('**/api/v1/admin/events/event-a/**',async route=>{
  const req=route.request(),path=new URL(req.url()).pathname;
  if(req.method()!=='GET'){changes.push({path,method:req.method(),body:req.postData()?req.postDataJSON():null});return route.fulfill({json:{data:{saved:true,deleted:1}}});}
  return route.fulfill({json:{data:path.endsWith('/albums')?{albums:[{id:'guest-a',author:'Tamu A',count:2,photos:1}],page:1,hasMore:false}:{items:[{id:'photo-a',author:'Tamu A',kind:'disposable_photo',mime:'image/jpeg',processing:'ready',url:'/photo.jpg'}],page:1,hasMore:false}}});
 });
 await page.goto('http://localhost/admin-fixture');await page.addScriptTag({content:bundle.outputFiles[0].text});
 await page.getByRole('button',{name:'Buka album',exact:true}).click();
 await page.getByRole('button',{name:'Edit foto',exact:true}).click();
 await page.getByLabel('Nama pengirim foto',{exact:true}).fill('Nama baru');await page.getByRole('dialog').getByRole('combobox').selectOption('90');
 await page.getByRole('button',{name:'Simpan foto',exact:true}).click();
 await expect(page.getByText('Perubahan foto tersimpan.',{exact:true})).toBeVisible();
 assert.deepEqual(changes[0],{path:'/api/v1/admin/events/event-a/photos/photo-a',method:'PATCH',body:{author:'Nama baru',rotation:90}});
 await page.getByRole('button',{name:'Hapus foto',exact:true}).click();await page.getByRole('button',{name:'Batal',exact:true}).click();assert.equal(changes.length,1);
 await page.getByRole('button',{name:'Hapus foto',exact:true}).click();await page.getByRole('button',{name:'Ya, hapus',exact:true}).click();
 await expect(page.getByText('Foto dihapus dari album.',{exact:true})).toBeVisible();
 assert.equal(changes[1].path,'/api/v1/admin/events/event-a/photos/photo-a');assert.equal(changes[1].method,'DELETE');
 await page.getByRole('button',{name:'Hapus album tamu',exact:true}).click();await page.getByRole('button',{name:'Ya, hapus',exact:true}).click();
 await expect(page.getByText('Album tamu dihapus.',{exact:true})).toBeVisible();assert.deepEqual(changes[2].body,{scope:'album',albumId:'guest-a'});
 await page.getByRole('button',{name:'Hapus seluruh isi album',exact:true}).click();await expect(page.getByRole('button',{name:'Ya, hapus',exact:true})).toBeDisabled();
 await page.getByLabel('Ketik nama acara: Acara A',{exact:true}).fill('Acara A');await page.getByRole('button',{name:'Ya, hapus',exact:true}).click();
 await expect(page.getByText('Seluruh isi album acara dihapus.',{exact:true})).toBeVisible();assert.deepEqual(changes[3].body,{scope:'all',confirmation:'Acara A'});
 assert.deepEqual(errors,[]);
 console.log('Admin album transition regression: no stale-list runtime error; edit payload, cancel, photo/album deletion and typed clear confirmation work. Mock API only; no real media deleted.');
}finally{await browser.close();}
