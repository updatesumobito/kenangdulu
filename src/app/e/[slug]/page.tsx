import GuestOpening from '@/components/guest-opening';
import GuestShell from '@/components/guest-shell';
import GuestWizard from '@/components/guest-wizard';
import {guestEvent} from '@/lib/guest-event';
export const dynamic='force-dynamic';

export default async function GuestWelcome({params}:{params:Promise<{slug:string}>}){
 const {slug}=await params,event=await guestEvent(slug);
 const date=new Date(event.start_at).toLocaleDateString('id-ID',{day:'numeric',month:'long',year:'numeric',timeZone:event.timezone});
 return <GuestShell event={event} navigation={false}><GuestOpening name={event.name} date={date} hashtag={event.settings.hashtag} modes={event.settings.modes}><GuestWizard event={event}/></GuestOpening></GuestShell>;
}
