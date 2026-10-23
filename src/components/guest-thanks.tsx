import {guestPath} from '@/lib/guest-path';
import Link from 'next/link';

export default function GuestThanks({event, saved=false}:{event:any,saved?:boolean}) {
 return <section className="guest-thanks" aria-label="Terima kasih">
  <span className="thanks-heart" aria-hidden="true">♡</span>
  <p className="eyebrow">{saved?'KENANGANMU SUDAH TERKIRIM':'WITH LOVE'}</p>
  <h2>Terima kasih sudah menjadi<br/><em>bagian dari cerita kami.</em></h2>
  <p>Senyum, doa, dan kata-kata hangatmu membuat hari ini semakin berarti.</p>
  <strong>{event.name}</strong>
  {saved&&<div className="row">
   {event.settings.modes.includes('voice')&&<Link className="button outline" href={guestPath(event.slug)+'/voice'}>Titip pesan suara</Link>}
   {event.settings.modes.includes('wish_card')&&<Link className="button outline" href={guestPath(event.slug)+'/notes'}>Tulis doa & ucapan</Link>}
   <Link className="text-link" href={guestPath(event.slug)}>Kembali ke acara →</Link>
  </div>}
 </section>;
}
