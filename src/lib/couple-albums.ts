import {Readable} from 'node:stream';
import {ZipArchive} from 'archiver';
import {rows} from './db';
import {fail} from './domain';
import * as storage from './storage';

// Guest identity keeps two different people with the same name in separate albums.
// Booth imports without a guest identity are grouped by their recorded author.
export const albumIdentity="coalesce(guest_id::text,'author:'||author)";
export const mediaExtension=(mime:string)=>({'image/jpeg':'jpg','image/png':'png','image/webp':'webp','image/gif':'gif','audio/mp4':'m4a','audio/ogg':'ogg','audio/webm':'webm','audio/mpeg':'mp3','video/webm':'webm','video/mp4':'mp4','video/quicktime':'mov'}[mime]||'bin');
export function attachmentHeader(name:string){return `attachment; filename="album-download.${name.split('.').pop()?.replace(/[^a-z0-9]/gi,'')||'zip'}"; filename*=UTF-8''${encodeURIComponent(name).replace(/['()*]/g,c=>'%'+c.charCodeAt(0).toString(16).toUpperCase())}`;}

export async function coupleAlbums(eventId:string,url:URL){
 const page=Math.max(1,Math.min(100000,Math.floor(Number(url.searchParams.get('page'))||1)));
 const kind=(url.searchParams.get('kind')||'').slice(0,40),query=(url.searchParams.get('q')||'').slice(0,100);
 const albums=await rows(`
  SELECT ${albumIdentity} AS id,
   (array_agg(author ORDER BY created_at DESC,id DESC))[1] AS author,
   count(*)::int AS count,
   count(*) FILTER(WHERE mime LIKE 'image/%')::int AS photos,
   count(*) FILTER(WHERE processing='ready' AND (object_key IS NOT NULL OR text_content IS NOT NULL))::int AS downloadable,
   max(created_at) AS latest_at,
   (array_agg(jsonb_build_object('id',id,'thumbnail',thumbnail_key IS NOT NULL)
    ORDER BY CASE kind WHEN 'disposable_photo' THEN 0 WHEN 'photo_strip' THEN 1 WHEN 'gif' THEN 2 ELSE 3 END,created_at DESC,id DESC)
    FILTER(WHERE processing='ready' AND mime LIKE 'image/%' AND kind IN ('disposable_photo','photo_strip','gif','physical_booth')))[1] AS cover
  FROM media WHERE event_id=$1 AND moderation<>'deleted'
  GROUP BY ${albumIdentity}
  HAVING ($2='' OR bool_or(kind=$2)) AND ($3='' OR bool_or(author ILIKE '%'||$3||'%' OR text_content ILIKE '%'||$3||'%'))
  ORDER BY max(created_at) DESC,${albumIdentity}
  LIMIT 25 OFFSET $4`,[eventId,kind,query,(page-1)*24]);
 return {items:[],albums:albums.slice(0,24).map(album=>({
  id:album.id,author:album.author,count:album.count,photos:album.photos,downloadable:album.downloadable,latest_at:album.latest_at,
  cover:album.cover?'/api/v1/media/'+album.cover.id+'/file':null,
  thumbnail:album.cover?.thumbnail?'/api/v1/media/'+album.cover.id+'/file?thumb=1':null,
 })),page,hasMore:albums.length>24};
}

export async function downloadCoupleAlbum(event:any,albumId:string,signal:AbortSignal){
 const items=await rows(`SELECT id,author,kind,mime,object_key,text_content,processing,created_at FROM media WHERE event_id=$1 AND moderation<>'deleted' AND ${albumIdentity}=$2 ORDER BY created_at,id`,[event.id,albumId]);
 if(!items.length)fail('NOT_FOUND','Album tamu tidak ditemukan.',404);
 if(!items.some(item=>item.processing==='ready'&&(item.object_key||item.text_content)))fail('MEDIA_NOT_READY','Kiriman di album ini masih diproses.',409);
 const author=items[items.length-1].author||'Tamu',name=String(author).replace(/[<>:"/\\|?*\x00-\x1f]/g,'-').slice(0,80)||'Tamu';
 const archive=new ZipArchive({store:true});
 const skipped:Array<{id:string;reason:string}>=[],included:string[]=[];
 let activeSource:Readable|null=null;
 const abort=()=>{activeSource?.destroy();archive.abort();archive.destroy();};
 signal.addEventListener('abort',abort,{once:true});
 archive.on('close',()=>signal.removeEventListener('abort',abort));
 if(signal.aborted)abort();
 // Produce one entry at a time so a large album does not open every file at once.
 void (async()=>{
  try{
   for(const item of items){
    if(signal.aborted||archive.destroyed)return;
    if(item.processing!=='ready'||(!item.object_key&&!item.text_content)){skipped.push({id:item.id,reason:'Kiriman belum tersedia'});continue;}
    const filename=item.kind+'/'+item.id+(item.text_content?'.txt':'.'+mediaExtension(item.mime));
    try{
     if(!item.text_content){
      const object=await storage.stream(item.object_key);
      activeSource=Readable.fromWeb(object.body as import('node:stream/web').ReadableStream<Uint8Array>);
      activeSource.on('error',()=>archive.destroy(Error('Berkas album tidak dapat diunduh. Silakan coba lagi.')));
     }
     const entry=new Promise<void>((resolve,reject)=>{const done=()=>{cleanup();resolve()},failed=(error:Error)=>{cleanup();reject(error)},cleanup=()=>{archive.off('entry',done);archive.off('error',failed)};archive.once('entry',done);archive.once('error',failed)});
     if(item.text_content)archive.append(item.author+'\n\n'+item.text_content+'\n',{name:filename});
     else archive.append(activeSource!,{name:filename});
     await entry;activeSource=null;included.push(item.id);
    }catch(error){
     if(archive.destroyed)throw error;
     skipped.push({id:item.id,reason:'Berkas belum dapat diunduh'});
    }
   }
   archive.append(JSON.stringify({event:event.name,guest:author,included,skipped},null,2),{name:'daftar-kiriman.json'});
   await archive.finalize();
  }catch(error){if(!archive.destroyed)archive.destroy(error instanceof Error?error:Error('Unduhan album gagal.'));}
 })();
 return new Response(Readable.toWeb(archive) as ReadableStream<Uint8Array>,{headers:{'Content-Type':'application/zip','Content-Disposition':attachmentHeader('Album - '+name+'.zip'),'Cache-Control':'private,no-store'}});
}
