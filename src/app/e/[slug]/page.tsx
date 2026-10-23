import Link from 'next/link';
import {guestEvent,modeRoutes} from '@/lib/guest-event';
export const dynamic='force-dynamic';

export default async function GuestWelcome({params}:{params:Promise<{slug:string}>}){
 const {slug}=await params,event=await guestEvent(slug);
 const modes:Record<string,[string,string,string]>={
  disposable_photo:['◎',`Kamera ${event.snapshot.perGuest} Foto`,'Abadikan momen dari sudut pandangmu.'],
  photo_strip:['▥','Photo strip','Rangkai beberapa pose dalam satu kenangan.'],
  voice:['◉','Pesan suara','Ada doa yang lebih indah didengar.'],
  video_wish:['▷','Video ucapan','Senyum, tawa, dan kata-kata hangat.'],
  wish_card:['✎','Tulis ucapan','Sedikit kata, banyak makna.'],
  gif:['✦','GIF & boomerang','Satu gerakan kecil yang menyenangkan.'],
 };
 return <div className={'guest-page theme-'+event.settings.theme}><main id="main" className="guest-welcome">
  <Link className="guest-back" href="/">komukuna <small>VIRTUAL</small></Link>
  {event.settings.coverAssetId&&<img className="event-cover" src={'/api/v1/event-covers/'+event.settings.coverAssetId} alt="Sampul acara"/>}
  <section className="personal-event-hero">
   <div className="eyebrow">A DAY TO REMEMBER</div>
   <h1>{event.name}</h1>
   <div className="wedding-divider" aria-hidden="true"/>
   <p>{new Date(event.start_at).toLocaleDateString('id-ID',{day:'numeric',month:'long',year:'numeric',timeZone:event.timezone})}</p>
   {event.settings.hashtag&&<p className="wedding-hashtag">{event.settings.hashtag}</p>}<p className="guest-intro">{event.settings.headline}</p>
  </section>
  <div className="eyebrow">TINGGALKAN SEDIKIT CERITA</div>
  <div className="guest-modes">{event.settings.modes.map((key:string)=>{
   const mode=modes[key];return mode?<Link key={key} href={'/e/'+slug+'/'+modeRoutes[key]}><span className="mode-icon">{mode[0]}</span><span><strong>{mode[1]}</strong><small>{mode[2]}</small></span><b>↗</b></Link>:null;
  })}{event.settings.gallery&&<Link href={'/e/'+slug+'/gallery'}><span className="mode-icon">▧</span><span><strong>Galeri kenangan</strong><small>Kepingan cerita dari orang-orang tersayang.</small></span><b>↗</b></Link>}</div>
  <p className="privacy-note">Kirimanmu tersimpan untuk penyelenggara. Berbagi ke galeri publik selalu pilihanmu dan menunggu persetujuan penyelenggara.</p>
  <footer>WITH LOVE, KEPT WITH KOMUKUNA.</footer>
 </main></div>;
}
