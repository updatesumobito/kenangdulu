import Link from 'next/link';
import {ArrowUpRight,Camera,CalendarDays,Film,Heart,Images,MessageCircle,Mic,ShieldCheck,Sparkles,Video} from 'lucide-react';
import GuestOpening from '@/components/guest-opening';
import GuestShell from '@/components/guest-shell';
import GuestThanks from '@/components/guest-thanks';
import {guestEvent,modeRoutes} from '@/lib/guest-event';
import {guestPath} from '@/lib/guest-path';
export const dynamic='force-dynamic';

export default async function GuestWelcome({params}:{params:Promise<{slug:string}>}){
 const {slug}=await params,event=await guestEvent(slug);
 const date=new Date(event.start_at).toLocaleDateString('id-ID',{day:'numeric',month:'long',year:'numeric',timeZone:event.timezone});
 const modes:Record<string,{icon:typeof Camera,title:string,description:string,tag:string}>={
  disposable_photo:{icon:Camera,title:'Kamera disposable',description:'Tangkap momen dari sudut pandangmu.',tag:`${event.snapshot.perGuest} foto per sesi`},
  photo_strip:{icon:Film,title:'Photo strip',description:'Beberapa pose, satu cerita yang manis.',tag:'Pose & rangkai'},
  voice:{icon:Mic,title:'Pesan suara',description:'Ada doa yang lebih indah didengar.',tag:'Rekam doa hangat'},
  video_wish:{icon:Video,title:'Video ucapan',description:'Senyum dan kata-kata untuk dikenang.',tag:'Ceritakan lewat video'},
  wish_card:{icon:MessageCircle,title:'Tulis ucapan',description:'Sedikit kata yang berarti banyak.',tag:'Titip doa terbaik'},
  gif:{icon:Sparkles,title:'GIF & boomerang',description:'Gerakan kecil, kenangan menyenangkan.',tag:'Buat momen bergerak'}
 };
 return <GuestShell event={event}><GuestOpening name={event.name} date={date} hashtag={event.settings.hashtag} modes={event.settings.modes}><main id="main" className="guest-welcome">
  <section className={'guest-event-card '+(event.settings.coverAssetId?'has-cover':'')} aria-labelledby="guest-event-title">
   {event.settings.coverAssetId&&<img className="guest-event-cover" src={'/api/v1/event-covers/'+event.settings.coverAssetId} alt="Sampul acara"/>}
   <div className="guest-event-story"><span className="guest-event-emblem" aria-hidden="true"><Heart size={25} strokeWidth={1}/></span><div className="eyebrow">BERSAMA MENULIS KENANGAN</div><h1 id="guest-event-title" tabIndex={-1}>{event.name}</h1><div className="guest-event-date"><CalendarDays size={14}/><span>{date}</span></div>{event.settings.hashtag&&<p className="guest-event-hashtag">{event.settings.hashtag}</p>}<p className="guest-event-headline">{event.settings.headline||'Simpan senyum, titipkan doa, dan jadilah bagian dari cerita kami.'}</p></div>
  </section>
  <section className="guest-activities" aria-labelledby="guest-activities-title">
  <div className="guest-section-heading"><div><span className="eyebrow">DARI KAMU, UNTUK KAMI</span><h2 id="guest-activities-title">Mau menyimpan apa hari ini?</h2><p>Pilih yang kamu suka. Setiap kenangan punya ceritanya.</p></div><Sparkles size={21} strokeWidth={1.3} aria-hidden="true"/></div>
  <div className="guest-modes">{event.settings.modes.map((key:string)=>{const mode=modes[key];if(!mode)return null;const Icon=mode.icon;return <Link key={key} className={'guest-mode-card mode-'+key} href={guestPath(slug)+'/'+modeRoutes[key]} prefetch={false}><span className="mode-icon"><Icon size={24} strokeWidth={1.5}/></span><span className="mode-copy"><small className="mode-tag">{mode.tag}</small><strong>{mode.title}</strong><span className="mode-description">{mode.description}</span></span><ArrowUpRight className="mode-arrow" size={17}/></Link>})}</div>
  {event.settings.gallery&&<Link className="guest-gallery-link" href={guestPath(slug)+'/gallery'} prefetch={false}><span className="gallery-link-icon"><Images size={23} strokeWidth={1.5}/></span><span><strong>Galeri kenangan</strong><small>Lihat cerita yang sudah dibagikan.</small></span><ArrowUpRight size={18}/></Link>}
  <div className="guest-privacy-card"><ShieldCheck size={19} strokeWidth={1.5}/><p>Kenanganmu aman untuk penyelenggara. Tampil di galeri publik hanya jika kamu mengizinkan dan penyelenggara menyetujuinya.</p></div>
  </section>
  <GuestThanks event={event}/>
  <footer>WITH LOVE, KEPT WITH KOMUKUNA.</footer>
 </main></GuestOpening></GuestShell>;
}
