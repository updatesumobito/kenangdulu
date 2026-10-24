/** Targeted checks for the previously missing R2 signed URLs and migration fallback. No cloud requests. */
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import vm from 'node:vm';
import ts from 'typescript';
import {r2Config,r2Client,signR2,objectMissing,assertStorageKey} from '../src/lib/r2-storage';

const keys=['STORAGE_DRIVER','STORAGE_FALLBACK_DRIVER','R2_ENDPOINT','R2_ACCESS_KEY_ID','R2_SECRET_ACCESS_KEY','R2_BUCKET_NAME'];
const previous=Object.fromEntries(keys.map(key=>[key,process.env[key]]));
try{
 for(const key of keys)delete process.env[key];
 assert.throws(()=>r2Config(),/R2 belum dikonfigurasi/);
 Object.assign(process.env,{STORAGE_DRIVER:'r2',STORAGE_FALLBACK_DRIVER:'supabase',R2_ENDPOINT:'https://test-account.r2.cloudflarestorage.com',R2_ACCESS_KEY_ID:'test-access-key',R2_SECRET_ACCESS_KEY:'test-secret-key',R2_BUCKET_NAME:'test-private-bucket'});
 const client=r2Client(),originalSend=client.send;
 (client as any).send=async()=>({ContentLength:3});
 const url=new URL(await signR2('event/photo-ready',{contentDisposition:'attachment; filename="photo.jpg"',contentType:'image/jpeg'}));
 assert.equal(url.hostname,'test-private-bucket.test-account.r2.cloudflarestorage.com');
 assert.equal(url.searchParams.get('X-Amz-Expires'),'120');
 assert.equal(url.searchParams.get('response-content-disposition'),'attachment; filename="photo.jpg"');
 assert.equal(url.searchParams.get('response-content-type'),'image/jpeg');
 client.send=originalSend;
 for(const key of ['../private','event/../private','https://other.invalid',''])assert.throws(()=>assertStorageKey(key));
 assert.equal(objectMissing({$metadata:{httpStatusCode:403}}),false);
 assert.equal(objectMissing({$metadata:{httpStatusCode:404}}),true);

 let missing=false,forbidden=false;const calls:string[]=[];
 const native={assertStorageKey,objectMissing,
  getR2:async()=>{calls.push('r2:get');if(forbidden)throw {$metadata:{httpStatusCode:403}};if(missing)throw {$metadata:{httpStatusCode:404}};return {Body:{transformToByteArray:async()=>new Uint8Array([1,2,3]),transformToWebStream:()=>new ReadableStream()},ContentLength:3}},
  signR2:async()=>{if(forbidden)throw {$metadata:{httpStatusCode:403}};if(missing)throw {$metadata:{httpStatusCode:404}};return 'https://signed-r2.invalid'},
  putR2:async()=>{calls.push('r2:put')},removeR2:async()=>{calls.push('r2:remove')},putR2File:async()=>{calls.push('r2:putFile')},
 };
 const cloud={getCloud:async()=>{calls.push('legacy:get');return Buffer.from('legacy')},cloudSignedUrl:async()=>{calls.push('legacy:sign');return 'https://signed-legacy.invalid'},streamCloud:async()=>{calls.push('legacy:stream');return {body:new ReadableStream(),bytes:6}},removeCloud:async()=>{calls.push('legacy:remove')}};
 const require=createRequire(import.meta.url),exports:any={};
 const code=ts.transpileModule(await readFile('src/lib/storage.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText;
 vm.runInNewContext(code,{exports,require:(name:string)=>name==='./db'?{dataDir:'.data'}:name==='./r2-storage'?native:name==='./cloud-storage'?cloud:require(name),Buffer,process,console});
 assert.deepEqual([...await exports.get('event/photo')],[1,2,3]);
 assert.equal(await exports.signedUrl('event/photo'),'https://signed-r2.invalid');
 await exports.put('event/new',Buffer.from('new'),'image/jpeg');
 assert.ok(calls.includes('r2:put'));assert.ok(!calls.some(c=>c.startsWith('legacy')));
 missing=true;
 assert.equal((await exports.get('event/old')).toString(),'legacy');
 assert.equal(await exports.signedUrl('event/old'),'https://signed-legacy.invalid');
 assert.equal(await exports.signedUrl('event/old',{contentDisposition:'attachment'}),null);
 assert.equal((await exports.stream('event/old')).bytes,6);
 await exports.remove('event/old');assert.ok(calls.includes('legacy:remove'));assert.ok(calls.includes('r2:remove'));
 forbidden=true;const legacyCalls=calls.filter(c=>c.startsWith('legacy')).length;
 await assert.rejects(()=>exports.get('event/old'));
 await assert.rejects(()=>exports.signedUrl('event/old'));
 assert.equal(calls.filter(c=>c.startsWith('legacy')).length,legacyCalls);
 forbidden=false;delete process.env.STORAGE_FALLBACK_DRIVER;
 await assert.rejects(()=>exports.get('event/old'));
 process.env.STORAGE_DRIVER='typo';await assert.rejects(()=>exports.get('event/old'),/STORAGE_DRIVER/);
 console.log('R2 targeted checks passed: configuration, signing, download headers, safe keys, 404-only fallback, writes, and deletion. No cloud requests made.');
}finally{
 for(const [key,value] of Object.entries(previous)){if(value===undefined)delete process.env[key];else process.env[key]=value}
}
