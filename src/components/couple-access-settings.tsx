'use client';
import {guestPath} from '@/lib/guest-path';
import {coupleCodeSchema} from '@/lib/couple-code';
import {useState,useEffect,useCallback} from 'react';
import {api,post,Action,Field,Notice} from './ui';
type AccessStatus={enabled:boolean,configured:boolean};
export default function CoupleAccessSettings({eventId,slug}:{eventId:string,slug:string}){
 const [status,setStatus]=useState<AccessStatus|null>(null),[code,setCode]=useState(''),[message,setMessage]=useState(''),[error,setError]=useState(''),[busy,setBusy]=useState(false);
 const path='events/'+eventId+'/couple-access';
 const load=useCallback(async()=>{try{setStatus(await api('events/'+eventId+'/couple-access'));setError('')}catch(e:any){setError(e.message)}},[eventId]);
 useEffect(()=>{setStatus(null);setCode('');setMessage('');void load()},[load]);
 async function disable(remove=false){
  if(busy)return;setBusy(true);setMessage('');setError('');
  try{
   if(remove)await api(path,{method:'DELETE'});else await post(path,{enabled:false});
   setStatus({enabled:false,configured:!remove});setCode('');
   setMessage(remove?'Kode dihapus. Semua sesi pengantin terkunci dan album tidak dapat dibuka sampai kode baru dibuat.':'Akses dinonaktifkan. Semua sesi pengantin terkunci.');
  }catch(e:any){setError(e.message)}finally{setBusy(false)}
 }
 return <section className="card form"><h2>Link & kode akses pengantin</h2><p>Kode di pengaturan ini langsung berlaku pada album pengantin, tanpa publish ulang. Pengantin dapat melihat kiriman privat dan kiriman yang menunggu moderasi.</p>
  <div className="form"><a className="text-link" href={guestPath(slug)} target="_blank" rel="noreferrer">Buka halaman tamu ↗</a><a className="text-link" href={guestPath(slug)+'/pengantin'} target="_blank" rel="noreferrer">Buka album pengantin ↗</a><Action className="outline" onClick={async()=>{await navigator.clipboard.writeText(location.origin+guestPath(slug)+'/pengantin');setMessage('Link pengantin disalin. Bagikan kode secara terpisah.')}}>Salin link pengantin</Action></div>
  <p>Status: <strong>{status?status.enabled?'Aktif · wajib kode masuk':status.configured?'Nonaktif · album terkunci':'Belum ada kode · album terkunci':'Memuat…'}</strong></p>
  <form className="form" onSubmit={async event=>{
   event.preventDefault();if(busy||!status)return;setMessage('');setError('');
   const parsed=coupleCodeSchema.safeParse(code);if(!parsed.success){setError(parsed.error.issues[0].message);return}
   setBusy(true);
   try{await post(path,{enabled:true,code:parsed.data});setStatus({enabled:true,configured:true});setCode('');setMessage('Kode disimpan dan sesi lama dicabut. Hanya kode baru yang dapat membuka album. Simpan kode sebelum membagikannya.')}
   catch(e:any){setError(e.message)}finally{setBusy(false)}
  }}><Field label={(status?.configured?'Ganti':'Tambah')+' kode pengantin (8–64 karakter)'}><input type="password" value={code} onChange={e=>setCode(e.target.value)} minLength={8} maxLength={64} pattern="[A-Za-z0-9-]+" autoComplete="new-password" autoCapitalize="none" spellCheck={false} disabled={busy||!status} required/></Field><p>Gunakan huruf, angka, dan tanda hubung. Kode peka huruf besar/kecil dan tidak dapat ditampilkan kembali setelah disimpan.</p><button disabled={busy||!status}>{busy?'Menyimpan…':status?.configured?'Ganti kode & aktifkan':'Tambah kode & aktifkan'}</button></form>
  {status?.configured&&<div className="row">{status.enabled&&<button type="button" className="outline" disabled={busy} onClick={()=>void disable()}>Nonaktifkan akses</button>}<button type="button" className="outline" disabled={busy} onClick={()=>void disable(true)}>Hapus kode pengantin</button></div>}
  {message&&<Notice>{message}</Notice>}{error&&<Notice error>{error}</Notice>}
 </section>;
}
