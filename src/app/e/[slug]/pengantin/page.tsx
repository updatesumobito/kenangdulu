import {guestEvent} from '@/lib/guest-event';
import {hasCoupleAccess} from '@/lib/couple-access';
import CoupleGate from '@/components/couple-gate';
import Gallery from '@/components/gallery';
export const dynamic='force-dynamic';
export default async function CoupleAlbum({params}:{params:Promise<{slug:string}>}){
 const {slug}=await params,event=await guestEvent(slug),unlocked=await hasCoupleAccess(event.id);
 return <div className={'guest-page theme-'+event.settings.theme}><main id="main" className="guest-welcome couple-album"><div className="guest-back">komukuna <small>VIRTUAL</small></div>{event.settings.coverAssetId&&<img className="event-cover" src={'/api/v1/event-covers/'+event.settings.coverAssetId} alt="Sampul acara"/>}<section className="personal-event-hero"><div className="eyebrow">OUR DAY, THROUGH YOUR EYES</div><h1>{event.name}</h1><div className="wedding-divider" aria-hidden="true"/><p>{new Date(event.start_at).toLocaleDateString('id-ID',{day:'numeric',month:'long',year:'numeric',timeZone:event.timezone})}</p>{event.settings.hashtag&&<p className="wedding-hashtag">{event.settings.hashtag}</p>}<p className="guest-intro">Kenangan dari orang-orang tersayang, disimpan untuk kalian berdua.</p></section><CoupleGate slug={slug} unlocked={unlocked}/>{unlocked&&<section className="couple-memories"><h2>Album kenangan kita</h2><p>Foto, suara, video, dan ucapan para tamu, termasuk kiriman privat untuk pengantin.</p><Gallery eventId={event.id} slug={slug} owner couple/></section>}<footer>WITH LOVE, KEPT WITH KOMUKUNA.</footer></main></div>;
}
