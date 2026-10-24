'use client';
import dynamic from 'next/dynamic';
import GuestShell,{GuestBack} from './guest-shell';
import GuestWizard from './guest-wizard';
const Gallery=dynamic(()=>import('./gallery'),{ssr:false,loading:()=> <p role="status">Menyiapkan galeri kenangan…</p>});
export default function GuestExperience({event,mode}:{event:any;mode:string}){
 if(mode==='gallery')return <GuestShell event={event}><main id="main" className="guest-experience wide"><GuestBack event={event}/><header className="guest-experience-heading"><div><span className="eyebrow">CERITA YANG TELAH DIBAGIKAN</span><h1>Galeri kenangan</h1><p>Kiriman baru tamu tersimpan di album pribadi pengantin.</p></div></header><Gallery slug={event.slug}/></main></GuestShell>;
 return <GuestShell event={event} navigation={false}><GuestWizard event={event}/></GuestShell>;
}
