'use client';
import {useState} from 'react';
import {useRouter} from 'next/navigation';
import {api,post,Field,Notice,Action} from './ui';
export default function CoupleGate({slug,unlocked}:{slug:string,unlocked:boolean}){
 const router=useRouter(),[error,setError]=useState(''),[busy,setBusy]=useState(false);
 if(unlocked)return <Action className="outline" onClick={async()=>{await api('couple/events/'+slug+'/session',{method:'DELETE'});router.refresh()}}>Kunci album / keluar</Action>;
 return <form className="card form couple-code-form" onSubmit={async event=>{event.preventDefault();setBusy(true);setError('');const form=event.currentTarget;try{await post('couple/events/'+slug+'/session',{code:new FormData(form).get('code')});form.reset();router.refresh()}catch(e:any){setError(e.message)}finally{setBusy(false)}}><h2>Album untuk pengantin</h2><p>Masukkan kode pribadi dari penyelenggara untuk melihat kenangan yang dikirimkan para tamu.</p><Field label="Kode akses pengantin"><input name="code" type="password" autoComplete="current-password" minLength={8} maxLength={64} required autoFocus/></Field>{error&&<Notice error>{error}</Notice>}<button disabled={busy}>{busy?'Membuka album…':'Buka album kami'}</button></form>;
}
