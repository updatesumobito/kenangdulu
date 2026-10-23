import {guestEvent} from '@/lib/guest-event';
import {hasCoupleAccess} from '@/lib/couple-access';
import {guestPath} from '@/lib/guest-path';
import GuestShell from '@/components/guest-shell';
import CoupleAlbumView from '@/components/couple-album-view';
export const dynamic='force-dynamic';
export const metadata={title:'Album Pengantin',robots:{index:false,follow:false}};
export default async function CoupleAlbum({params}:{params:Promise<{slug:string}>}){
 const {slug}=await params,event=await guestEvent(slug),unlocked=await hasCoupleAccess(event.id);
 return <GuestShell event={event} activeMode="couple" navigation={false} brandHref={guestPath(slug)+'/pengantin'}><CoupleAlbumView event={event} unlocked={unlocked}/></GuestShell>;
}
