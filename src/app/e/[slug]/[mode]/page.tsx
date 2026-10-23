import {guestEvent} from '@/lib/guest-event';
import GuestExperience from '@/components/guest-experience';
import {notFound} from 'next/navigation';
export const dynamic='force-dynamic';
export default async function GuestMode({params}:{params:Promise<{slug:string,mode:string}>}){const {slug,mode}=await params,e=await guestEvent(slug),k=({disposable:'disposable_photo',photo:'photo_strip',voice:'voice',video:'video_wish',notes:'wish_card',creative:'gif',gallery:'gallery'} as any)[mode];if(!k||k!=='gallery'&&!e.settings.modes.includes(k)||k==='photo_strip'&&!e.snapshot.frames||k==='gif'&&!e.snapshot.creative)notFound();return <GuestExperience event={e} mode={k}/>}
