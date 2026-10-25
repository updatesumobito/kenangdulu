'use client';
import {useEffect,useRef,useState} from 'react';
import {ArrowLeft,Images,Pencil,RotateCw,Trash2} from 'lucide-react';
import {api,Field,Notice} from './ui';

type Album={id:string;author:string;count:number;photos:number;cover?:string;thumbnail?:string};
type Photo={id:string;kind:string;mime?:string;author:string;url?:string;thumbnail?:string;processing:string;text_content?:string};
type Action={type:'edit'|'photo';photo:Photo}|{type:'album';album:Album}|{type:'all'};
const mediaNames:Record<string,string>={voice:'Pesan suara',video_wish:'Video ucapan'};
export default function AdminAlbumMedia({eventId,eventName,legalHold,onSaved}:{eventId:string;eventName:string;legalHold:boolean;onSaved:()=>Promise<unknown>}){
 const [album,setAlbum]=useState<Album|null>(null),[data,setData]=useState<any>(null),[page,setPage]=useState(1),[query,setQuery]=useState(''),[search,setSearch]=useState(''),[revision,setRevision]=useState(0),[error,setError]=useState(''),[message,setMessage]=useState(''),[action,setAction]=useState<Action|null>(null),[busy,setBusy]=useState(false),[author,setAuthor]=useState(''),[rotation,setRotation]=useState(0),[confirmation,setConfirmation]=useState('');
 const dialog=useRef<HTMLDialogElement>(null),base='admin/events/'+eventId;
 useEffect(()=>{
  const controller=new AbortController();setData(null);setError('');
  const path=album?base+'/media?album='+encodeURIComponent(album.id)+'&':base+'/albums?';
  api(path+'page='+page+'&q='+encodeURIComponent(query),{signal:controller.signal}).then(setData).catch(err=>{if(err.name!=='AbortError')setError(err.message)});
  return()=>controller.abort();
 },[base,album?.id,page,query,revision]);
 useEffect(()=>{if(!action)return;const element=dialog.current;if(!element)return;element.showModal();return()=>element.close()},[action]);
 function open(next:Action){setError('');setAction(next);setConfirmation('');setRotation(0);setAuthor('photo' in next?next.photo.author:'');}
 async function save(ev:React.FormEvent){
  ev.preventDefault();if(!action||busy)return;setBusy(true);setError('');
  try{
   if(action.type==='edit')await api(base+'/photos/'+action.photo.id,{method:'PATCH',body:JSON.stringify({author,rotation})});
   else if(action.type==='photo')await api(base+'/photos/'+action.photo.id,{method:'DELETE'});
   else await api(base+'/albums',{method:'DELETE',body:JSON.stringify(action.type==='album'?{scope:'album',albumId:action.album.id}:{scope:'all',confirmation})});
   setMessage(action.type==='edit'?'Perubahan foto tersimpan.':action.type==='photo'?'Foto dihapus dari album.':action.type==='album'?'Album tamu dihapus.':'Seluruh isi album acara dihapus.');
   if(action.type==='album'||action.type==='all')setAlbum(null);
   setAction(null);setPage(1);setRevision(value=>value+1);await onSaved();
  }catch(err){setError((err as Error).message)}finally{setBusy(false)}
 }
 const title=action?.type==='edit'?'Edit foto':action?.type==='photo'?'Hapus foto ini?':action?.type==='album'?'Hapus album '+action.album.author+'?':'Hapus seluruh isi album acara?';
 return <section className="card form admin-album-media" aria-labelledby="admin-album-media-title">
  <div><span className="eyebrow">PENGELOLAAN ADMIN</span><h2 id="admin-album-media-title">Kelola foto & album</h2><p>Edit nama pengirim dan putar foto, hapus foto satuan, atau hapus isi album tamu.</p></div>
  {legalHold&&<Notice>Media dilindungi legal hold. Edit dan hapus dinonaktifkan.</Notice>}
  {message&&<Notice>{message}</Notice>}{error&&!action&&<Notice error>{error}</Notice>}
  <form className="row" onSubmit={ev=>{ev.preventDefault();setQuery(search.trim());setPage(1)}}><Field label="Cari nama / ucapan di album"><input value={search} onChange={ev=>setSearch(ev.target.value)} maxLength={100}/></Field><button type="submit" className="outline">Cari</button></form>
  {album&&<div className="row"><button type="button" className="outline" onClick={()=>{setAlbum(null);setPage(1);setQuery('');setSearch('')}}><ArrowLeft size={16}/> Semua album tamu</button><strong>{album.author}</strong><button type="button" className="outline admin-media-delete" disabled={legalHold} onClick={()=>open({type:'album',album})}><Trash2 size={16}/> Hapus album tamu</button></div>}
  {!data&&!error?<p role="status">Memuat {album?'kiriman':'album tamu'}…</p>:album?<div className="admin-media-grid">{data?.items?.map((photo:Photo)=><article key={photo.id} className="admin-media-card">
   {photo.mime?.startsWith('image/')&&photo.processing==='ready'?<a href={photo.url} target="_blank" rel="noreferrer"><img src={photo.thumbnail||photo.url} alt={'Foto dari '+photo.author} loading="lazy"/></a>:<div className="admin-media-placeholder">{photo.text_content||(mediaNames[photo.kind]||'Foto masih diproses')}</div>}
   <strong>{photo.author}</strong><small>{photo.kind} · {photo.processing}</small>
   {photo.mime?.startsWith('image/')&&<div className="row"><button type="button" className="outline small-button" disabled={legalHold} onClick={()=>open({type:'edit',photo})}><Pencil size={15}/> Edit foto</button><button type="button" className="outline small-button admin-media-delete" disabled={legalHold} onClick={()=>open({type:'photo',photo})}><Trash2 size={15}/> Hapus foto</button></div>}
  </article>)}</div>:<div className="admin-media-grid">{data?.albums?.map((item:Album)=><article key={item.id} className="admin-media-card">
   {item.cover?<img src={item.thumbnail||item.cover} alt={'Album '+item.author} loading="lazy"/>:<div className="admin-media-placeholder"><Images size={30}/></div>}
   <strong>{item.author||'Tamu'}</strong><small>{item.count} kiriman · {item.photos} foto</small><div className="row"><button type="button" className="outline small-button" onClick={()=>{setAlbum(item);setPage(1);setQuery('');setSearch('')}}>Buka album</button><button type="button" className="outline small-button admin-media-delete" disabled={legalHold} onClick={()=>open({type:'album',album:item})}><Trash2 size={15}/> Hapus album</button></div>
  </article>)}</div>}
  {data&&(album?data.items:data.albums)?.length===0&&<p>Belum ada kiriman yang sesuai.</p>}
  <div className="row pagination"><button type="button" className="outline" disabled={page===1||!data} onClick={()=>setPage(value=>value-1)}>Sebelumnya</button><span>Halaman {page}</span><button type="button" className="outline" disabled={!data?.hasMore} onClick={()=>setPage(value=>value+1)}>Berikutnya</button></div>
  <div className="admin-media-clear"><strong>Hapus seluruh isi album acara</strong><p>Menghapus foto, suara, video, dan ucapan dari semua album tamu. Pengaturan acara tetap disimpan. Jatah foto yang sudah dipakai tidak dikembalikan.</p><button type="button" className="outline admin-media-delete" disabled={legalHold} onClick={()=>open({type:'all'})}><Trash2 size={16}/> Hapus seluruh isi album</button></div>
  {action&&<dialog ref={dialog} className="admin-media-dialog" aria-labelledby="admin-media-dialog-title" onCancel={ev=>{if(busy)ev.preventDefault();else setAction(null)}}><form className="form" onSubmit={save}><h2 id="admin-media-dialog-title">{title}</h2>
   {action.type==='edit'?<><Field label="Nama pengirim foto"><input value={author} onChange={ev=>setAuthor(ev.target.value)} required maxLength={80} disabled={busy}/></Field>{action.photo.processing==='ready'&&<div className="admin-media-edit-preview"><img src={action.photo.url} alt="Pratinjau edit foto" style={{transform:`rotate(${rotation}deg)`}}/></div>}<Field label="Putar foto"><select value={rotation} onChange={ev=>setRotation(Number(ev.target.value))} disabled={busy||action.photo.processing!=='ready'||!['image/jpeg','image/png','image/webp'].includes(action.photo.mime||'')}><option value={0}>Posisi sekarang</option><option value={90}>90° ke kanan</option><option value={180}>180°</option><option value={270}>90° ke kiri</option></select></Field><small><RotateCw size={14}/> Rotasi tersedia untuk foto JPG, PNG, dan WebP yang selesai diproses.</small></>:<><p>{action.type==='photo'?'Foto ini akan dihapus dari album tamu dan galeri.':action.type==='album'?`Semua foto, suara, video, dan ucapan di album ${action.album.author} akan dihapus, termasuk kiriman di halaman lain.`:'Semua kiriman di acara ini akan dihapus dari seluruh album dan galeri.'}</p><p>Jatah foto yang sudah dipakai tidak dikembalikan. Tindakan ini tidak menyediakan tombol urungkan.</p>{action.type==='all'&&<Field label={'Ketik nama acara: '+eventName}><input value={confirmation} onChange={ev=>setConfirmation(ev.target.value)} autoComplete="off" required disabled={busy}/></Field>}</>}
   {error&&<Notice error>{error}</Notice>}<div className="row"><button type="submit" disabled={busy||action.type==='all'&&confirmation!==eventName||action.type==='edit'&&!author.trim()}>{busy?'Menyimpan…':action.type==='edit'?'Simpan foto':'Ya, hapus'}</button><button type="button" className="outline" disabled={busy} onClick={()=>setAction(null)}>Batal</button></div>
  </form></dialog>}
 </section>;
}
