/** Focused regression checks for legacy conversion, source mapping, and additive frame migration. No external DB. */
import assert from 'node:assert/strict';
import {readFile,readdir} from 'node:fs/promises';
import {PGlite} from '@electric-sql/pglite';
import {presetFrame} from '../src/lib/domain';
import {captureSources,outputSize,toFrameDocument,frameDocumentSchema} from '../src/lib/frame-document';
import {readFramePackage,createFramePackage} from '../src/lib/frame-portability';
import {canExportQrPdf} from '../src/lib/qr-entitlement';

const original=presetFrame(4),copy=JSON.stringify(original),legacy=toFrameDocument(original);
assert.equal(JSON.stringify(original),copy,'Opening legacy must not mutate the source');
assert.deepEqual(outputSize(legacy),{width:1200,height:1800});
const caption=legacy.objects.find(o=>o.id==='legacy-caption');assert.equal(caption?.kind,'text');if(caption?.kind==='text'){assert.equal(caption.baseline,'alphabetic');assert.ok(Math.abs((caption.y+caption.fontSize)*300/25.4-1800*.93)<1e-8);}
const inch=frameDocumentSchema.parse({...legacy,page:{...legacy.page,width:101.6,height:152.4,preset:'4x6'}});assert.deepEqual(outputSize(inch),{width:1200,height:1800});
const old=toFrameDocument({name:'Legacy',layout_json:{size:{w:102,h:152,mm:[102,152],preset:'4R'},slots:[{x:29.5,y:7,w:43,h:54,shape:'rect',crop:'cover',photo_index:1,capture_order:2},{x:4,y:8,w:40,h:40,shape:'rect',crop:'cover',photo_index:1,capture_order:1}],texts:[],capture_count:1,qr:{enabled:false}},device_ids:['device-metadata'],price_idr:10000});
assert.equal(old.page.width,102);assert.equal(old.page.height,152);assert.equal(captureSources(old).length,1);assert.equal(captureSources({...old,objects:[...old.objects].reverse()})[0].captureOrder,1);
let roundtrip=old;for(let i=0;i<20;i++)roundtrip=readFramePackage(createFramePackage('Legacy',roundtrip)).document;assert.equal(roundtrip.objects[0].x,29.5);assert.deepEqual(roundtrip.metadata,old.metadata);
const db=new PGlite();try{
 for(const name of (await readdir('infra/migrations')).filter(f=>f.endsWith('.sql')).sort())await db.exec(await readFile('infra/migrations/'+name,'utf8'));
 await db.query("INSERT INTO frames(id,name,schema) VALUES('10000000-0000-4000-8000-000000000001','Legacy',$1)",[JSON.stringify(original)]);
 const result=await db.query<{version:number}>('SELECT version FROM frames');assert.equal(result.rows[0].version,1);
 const rls=await db.query<{relname:string;relrowsecurity:boolean}>("SELECT relname,relrowsecurity FROM pg_class WHERE relname IN ('frame_revisions','frame_asset_links')");assert.equal(rls.rows.length,2);assert.ok(rls.rows.every(r=>r.relrowsecurity));
 await db.transaction(async tx=>{await tx.query('UPDATE frames SET version=version+1 WHERE version=$1',[1]);const r=await tx.query<{version:number}>('SELECT version FROM frames');assert.equal(r.rows[0].version,2);});
 await db.query("INSERT INTO plans(id,name,price,config) VALUES('classic','Classic',150000,'{\"frames\":1}')");
 await db.query("INSERT INTO orders(id,channel,plan_id,amount,snapshot,brief) VALUES('20000000-0000-4000-8000-000000000001','DIRECT_MANAGED','classic',150000,'{\"frames\":1}','{}')");
 await db.exec(await readFile('infra/migrations/020_explicit_qr_entitlement.sql','utf8'));
 const catalog=await db.query<any>("SELECT config FROM plans WHERE id='classic'"),purchase=await db.query<any>('SELECT snapshot FROM orders');assert.equal(canExportQrPdf(catalog.rows[0].config),false);assert.equal(canExportQrPdf(purchase.rows[0].snapshot),true);assert.equal(canExportQrPdf({frames:0}),false);assert.equal(canExportQrPdf({frames:3,qrPdf:true}),true);
}finally{await db.close();}
console.log('Frame regression checks completed: legacy dimensions/baseline, immutable read, shared source mapping, 20 round-trips, additive migration defaults/RLS, explicit new QR entitlement with existing snapshots preserved. No remote database accessed.');
