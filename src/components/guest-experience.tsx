'use client';
import dynamic from 'next/dynamic';
import GuestShell,{GuestBack} from './guest-shell';
import GuestWizard from './guest-wizard';
import GuestOpening from './guest-opening';
const Gallery=dynamic(()=>import('./gallery'),{ssr:false,loading:()=> <p role="status">Menyiapkan galeri kenangan…</p>});
export default function GuestExperience({event,mode,preview=false}:{event:any;mode:string;preview?:boolean}){
 if(mode==='gallery')return <GuestShell event={event}><main id="main" className="guest-experience wide"><GuestBack event={event}/><header className="guest-experience-heading"><div><span className="eyebrow">CERITA YANG TELAH DIBAGIKAN</span><h1>Galeri kenangan</h1><p>Kiriman baru tamu tersimpan di album pribadi pengantin.</p></div></header><Gallery slug={event.slug}/></main></GuestShell>;
 const date=new Date(event.start_at).toLocaleDateString('id-ID',{day:'numeric',month:'long',year:'numeric',timeZone:event.timezone});
 return <GuestShell event={event} navigation={false}><GuestOpening name={event.name} date={date} hashtag={event.settings.hashtag} modes={event.settings.modes}><GuestWizard event={event} preview={preview}/></GuestOpening></GuestShell>;
}
