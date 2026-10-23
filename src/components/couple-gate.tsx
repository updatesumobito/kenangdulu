'use client';
import {useState,useTransition} from 'react';
import {useRouter} from 'next/navigation';
import {ArrowRight,Eye,EyeOff,KeyRound,LockKeyhole,ShieldCheck} from 'lucide-react';
import {api,post,Field,Notice,Action} from './ui';
export default function CoupleGate({slug,unlocked}:{slug:string,unlocked:boolean}){
 const router=useRouter(),[error,setError]=useState(''),[busy,setBusy]=useState(false),[show,setShow]=useState(false),[pending,startTransition]=useTransition();
 if(unlocked)return <Action className="outline couple-lock-button" onClick={async()=>{await api('couple/events/'+slug+'/session',{method:'DELETE'});router.refresh()}}><LockKeyhole size={17}/>Kunci album & keluar</Action>;
 return <form id="couple-code-form" className="card form couple-code-form" aria-busy={busy||pending} onSubmit={async event=>{event.preventDefault();if(busy||pending)return;setBusy(true);setError('');const form=event.currentTarget;try{await post('couple/events/'+slug+'/session',{code:new FormData(form).get('code')});form.reset();startTransition(()=>router.refresh())}catch(e:any){setError(e.message)}finally{setBusy(false)}}}>
  <div className="couple-gate-heading"><span className="couple-gate-icon"><KeyRound size={24} strokeWidth={1.4}/></span><span className="eyebrow">RUANG KENANGAN PRIBADI</span><h2>Buka album kalian.</h2><p>Foto, doa, dan cerita dari orang-orang tersayang, dalam satu tempat.</p></div>
  <Field label="Kode akses pengantin"><span className="couple-code-input"><input id="couple-access-code" name="code" type={show?'text':'password'} autoComplete="current-password" autoCapitalize="none" spellCheck={false} minLength={8} maxLength={64} required disabled={busy||pending} placeholder="Masukkan kode dari penyelenggara" aria-describedby="couple-code-hint"/><button type="button" className="couple-code-reveal" onClick={()=>setShow(value=>!value)} disabled={busy||pending} aria-label={show?'Sembunyikan kode akses':'Tampilkan kode akses'} aria-pressed={show}>{show?<EyeOff size={18}/>:<Eye size={18}/>}</button></span></Field>
  <p id="couple-code-hint" className="couple-code-hint">Kode peka huruf besar dan kecil. Gunakan kode yang diberikan penyelenggara.</p>
  {error&&<Notice error>{error}</Notice>}
  <button disabled={busy||pending} className="couple-unlock-button">{busy||pending?'Membuka album…':'Buka album kami'}<ArrowRight size={18}/></button>
  <div className="couple-gate-footnote"><ShieldCheck size={16}/><span>Akses pribadi untuk kalian berdua.</span></div>
 </form>;
}
