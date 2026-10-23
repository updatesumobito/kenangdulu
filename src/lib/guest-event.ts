import {one} from './db';
import {notFound} from 'next/navigation';
export async function guestEvent(slug:string){if(!/^[a-z0-9-]+$/.test(slug))notFound();const e=await one('SELECT * FROM events WHERE slug=$1',[slug]);if(!e?.published)notFound();return {id:e.id,name:e.name,slug:e.slug,start_at:e.start_at,end_at:e.end_at,timezone:e.timezone,status:e.status,snapshot:e.snapshot,settings:e.published.settings,frames:e.published.frames,reveal_at:e.reveal_at};}
export const modeNames:Record<string,string>={disposable_photo:'Kamera 15 Foto',photo_strip:'Photo strip',voice:'Pesan suara',video_wish:'Kirim video',wish_card:'Tulis ucapan',gif:'GIF & boomerang'};
export const modeRoutes:Record<string,string>={disposable_photo:'disposable',photo_strip:'photo',voice:'voice',video_wish:'video',wish_card:'notes',gif:'creative'};
