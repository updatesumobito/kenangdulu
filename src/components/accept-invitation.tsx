'use client';
import {useEffect,useState} from 'react';
import Link from 'next/link';
import {useRouter} from 'next/navigation';
import {post,Notice} from './ui';
export default function AcceptInvitation(){const [token,setToken]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState('');const router=useRouter();useEffect(()=>{setToken(location.hash.slice(1))},[]);return <section className="card form compact"><h1>Undangan ruang acara</h1><p>Masuk dengan email yang menerima undangan. Jika belum memiliki akun, daftar dahulu lalu kembali ke halaman ini.</p><div className="row"><Link className="button outline" href="/masuk" target="_blank" rel="noreferrer">Masuk</Link><Link className="button outline" href="/daftar" target="_blank" rel="noreferrer">Daftar akun</Link></div><button disabled={busy||!token} onClick={async()=>{setBusy(true);setError('');try{const result=await post('auth/accept-invitation',{token});history.replaceState(null,'',location.pathname);router.push('/akun/events/'+result.eventId)}catch(err:any){setError(err.message)}finally{setBusy(false)}}}>{busy?'Menerima…':'Terima undangan'}</button>{error&&<Notice error>{error}</Notice>}</section>}
