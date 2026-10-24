/** Focused checks for the reported album dates, thumbnail access, and guest grouping. */
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import vm from 'node:vm';
import ts from 'typescript';
import {PGlite} from '@electric-sql/pglite';
import {unzipSync,strFromU8} from 'fflate';
import {albumDate} from '../src/lib/album-date';

assert.equal(albumDate('2026-10-23T17:00:00Z','Asia/Jakarta').label,'24 Oktober 2026');
assert.equal(albumDate('2026-10-23T17:00:00Z','Asia/Jakarta',true).label,'24 Okt');
for(const value of [null,undefined,'','invalid'])assert.equal(albumDate(value,'Asia/Jakarta').dateTime,undefined);
assert.equal(albumDate('2026-10-23T17:00:00Z','invalid').label,'24 Oktober 2026');

// Isolate authorization from cookies, storage, and the hosted database.
const event={id:'event',end_at:new Date(Date.now()+86400000),snapshot:{exportDays:90,galleryDays:30},published:{settings:{gallery:true}}};
let couple=false,user:any=null,allowed=false;
const fail=(code:string,message:string,status=400)=>{throw Object.assign(Error(message),{code,status})};
const dependencies:Record<string,any>={
 './db':{one:async()=>event},'./domain':{fail},
 './auth':{currentUser:async()=>user,eventAccess:async()=>{if(!allowed)fail('FORBIDDEN','Forbidden',403)}},
 './couple-access':{hasCoupleAccess:async()=>couple},
};
const require=createRequire(import.meta.url),exports:any={};
const source=await readFile('src/lib/media.ts','utf8');
const compiled=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText;
vm.runInNewContext(compiled,{exports,require:(name:string)=>dependencies[name]||(name.startsWith('node:')?require(name):{}),Buffer,Date,console,process});
const media={event_id:'event',moderation:'hidden',processing:'ready',consent:false,privacy:'private_owner'};
await assert.rejects(()=>exports.mediaAccess(media),(e:any)=>e.code==='MEDIA_UNAVAILABLE');
couple=true;await exports.mediaAccess(media);
await exports.mediaAccess({...media,moderation:'pending'});
await assert.rejects(()=>exports.mediaAccess({...media,moderation:'deleted'}),(e:any)=>e.code==='MEDIA_UNAVAILABLE');
await assert.rejects(()=>exports.mediaAccess({...media,processing:'pending'}),(e:any)=>e.code==='MEDIA_UNAVAILABLE');
couple=false;user={id:'owner'};allowed=true;await exports.mediaAccess(media);
allowed=false;await assert.rejects(()=>exports.mediaAccess(media),(e:any)=>e.code==='MEDIA_UNAVAILABLE');
user=null;await assert.rejects(()=>exports.mediaAccess({...media,moderation:'pending'}),(e:any)=>e.code==='MEDIA_NOT_APPROVED');
couple=true;event.end_at=new Date(Date.now()-100*86400000);
await assert.rejects(()=>exports.mediaAccess(media),(e:any)=>e.code==='RETENTION_EXPIRED');

// Use an isolated in-memory database. Never write fixture data to the real event.
const db=new PGlite();
(globalThis as any).kvdb=Promise.resolve(db);
try{
 await db.exec(`CREATE TABLE media(id text PRIMARY KEY,event_id text,guest_id text,author text,kind text,mime text,
  object_key text,thumbnail_key text,text_content text,processing text,moderation text,created_at timestamptz);
  INSERT INTO media SELECT 'wish-'||n,'event','guest-a','Same name','wish_card','text/plain',null,null,'Wish '||n,'ready','pending',
   '2026-10-24T00:00:00Z'::timestamptz+n*interval '1 second' FROM generate_series(1,26) n;
  INSERT INTO media VALUES
   ('camera','event','guest-a','Same name','disposable_photo','image/jpeg',null,'camera-thumb',null,'ready','pending','2026-10-23T00:00:00Z'),
   ('other-person','event','guest-b','Same name','wish_card','text/plain',null,null,'Other guest','ready','pending','2026-10-24T00:00:00Z'),
   ('deleted','event','guest-a','Same name','wish_card','text/plain',null,null,'Deleted','ready','deleted','2026-10-24T00:00:00Z'),
   ('other-event','other-event','guest-a','Same name','wish_card','text/plain',null,null,'Other event','ready','pending','2026-10-24T00:00:00Z');`);
 const {coupleAlbums,downloadCoupleAlbum}=await import('../src/lib/couple-albums');
 const result=await coupleAlbums('event',new URL('http://local.invalid'));
 assert.equal(result.albums.length,2);
 const album=result.albums.find(a=>a.id==='guest-a')!;
 assert.equal(album.count,27);assert.equal(album.downloadable,26);
 assert.equal(album.cover,'/api/v1/media/camera/file');
 assert.equal(album.thumbnail,'/api/v1/media/camera/file?thumb=1');
 assert.ok(Number.isFinite(+new Date(album.latest_at)));
 const filtered=await coupleAlbums('event',new URL('http://local.invalid/?kind=disposable_photo'));
 assert.deepEqual(filtered.albums.map(a=>a.id),['guest-a']);assert.equal(filtered.albums[0].count,27);
 const response=await downloadCoupleAlbum({id:'event',name:'Regression'},'guest-a',new AbortController().signal);
 const files=unzipSync(new Uint8Array(await response.arrayBuffer()));
 assert.equal(Object.keys(files).filter(name=>name.endsWith('.txt')).length,26);
 const manifest=JSON.parse(strFromU8(files['daftar-kiriman.json']));
 assert.equal(manifest.included.length,26);assert.equal(manifest.skipped.length,1);
 assert.ok(!manifest.included.includes('deleted'));assert.ok(!manifest.included.includes('other-person'));
 await db.exec(`INSERT INTO media SELECT 'extra-'||n,'event','extra-'||n,'Guest','wish_card','text/plain',null,null,'Wish','ready','pending',
  '2026-10-22T00:00:00Z'::timestamptz FROM generate_series(1,25) n;`);
 const first=await coupleAlbums('event',new URL('http://local.invalid'));
 const second=await coupleAlbums('event',new URL('http://local.invalid/?page=2'));
 assert.equal(first.albums.length,24);assert.equal(first.hasMore,true);
 assert.equal(second.albums.length,3);assert.equal(second.hasMore,false);
 assert.equal(new Set([...first.albums,...second.albums].map(a=>a.id)).size,27);
 console.log('Album regression checks passed: dates, access permissions, guest grouping, pagination, and complete ZIP.');
}finally{await db.close();delete (globalThis as any).kvdb}
