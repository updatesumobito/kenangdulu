'use client';

import {createContext,useContext,useEffect,useState,type ReactNode} from 'react';
import Link from 'next/link';
import {Camera,ChevronLeft,Heart,Home,Images,MessageCircle,Mic,Moon,Sun,Video} from 'lucide-react';
import {guestPath} from '@/lib/guest-path';

type Appearance={dark:boolean,toggle:()=>void,setIntroOpen:(open:boolean)=>void};
const AppearanceContext=createContext<Appearance>({dark:false,toggle:()=>{},setIntroOpen:()=>{}});
export const useGuestAppearance=()=>useContext(AppearanceContext);
export function GuestThemeToggle(){
 const {dark,toggle}=useGuestAppearance();
 return <button type="button" className="guest-theme-toggle" onClick={toggle} aria-label={dark?'Gunakan mode terang':'Gunakan mode gelap'} title={dark?'Mode terang':'Mode gelap'}>{dark?<Sun size={19}/>:<Moon size={19}/>}</button>;
}

export default function GuestShell({event,activeMode='home',navigation=true,brandHref,children}:{event:any,activeMode?:string,navigation?:boolean,brandHref?:string,children:ReactNode}){
 const [dark,setDark]=useState(false),[introOpen,setIntroOpen]=useState(false);
 useEffect(()=>{
  const media=window.matchMedia('(prefers-color-scheme: dark)');
  const update=()=>{let value:string|null=null;try{value=localStorage.getItem('komukuna-guest-theme')}catch{}const next=value==='dark'||value!=='light'&&media.matches;applyTheme(next);setDark(next)};
  update();media.addEventListener('change',update);window.addEventListener('storage',update);
  return()=>{media.removeEventListener('change',update);window.removeEventListener('storage',update)};
 },[]);
 function applyTheme(next:boolean){document.documentElement.dataset.guestTheme=next?'dark':'light';const maroon=event.slug==='wahyu-novita';document.querySelector('meta[name="theme-color"]')?.setAttribute('content',maroon?(next?'#171315':'#f8f5f0'):(next?'#1d2320':'#f2eee8'))}
 function toggle(){const next=!dark;setDark(next);applyTheme(next);try{localStorage.setItem('komukuna-guest-theme',next?'dark':'light')}catch{}}
 const base=guestPath(event.slug),modes:string[]=event.settings.modes;
 const camera=modes.includes('disposable_photo')?'disposable':modes.includes('photo_strip')?'photo':modes.includes('gif')?'creative':null;
 const items=[{id:'home',label:'Acara',href:base,icon:Home},
  ...(modes.includes('voice')?[{id:'voice',label:'Suara',href:base+'/voice',icon:Mic}]:[]),
  ...(modes.includes('video_wish')?[{id:'video_wish',label:'Video',href:base+'/video',icon:Video}]:[]),
  ...(camera?[{id:'camera',label:'Kamera',href:base+'/'+camera,icon:Camera}]:[]),
  ...(modes.includes('wish_card')?[{id:'wish_card',label:'Ucapan',href:base+'/notes',icon:MessageCircle}]:[]),
  ...(event.settings.gallery?[{id:'gallery',label:'Galeri',href:base+'/gallery',icon:Images}]:[])];
 return <AppearanceContext.Provider value={{dark,toggle,setIntroOpen}}><div className={'guest-page guest-shell theme-'+event.settings.theme} data-event-slug={event.slug} data-intro-open={introOpen} data-navigation={navigation}>
  <header className="guest-app-header" inert={introOpen} aria-hidden={introOpen||undefined}>
   <Link className="guest-app-brand" href={brandHref||base} aria-label={brandHref?'Album pengantin '+event.name:'Kembali ke acara '+event.name}><span className="guest-brand-mark"><Heart size={18} strokeWidth={1.5}/></span><span>kenang dulu<small>THE MEMORY ARCHIVE</small></span></Link>
   <div className="guest-header-end"><span className="guest-header-event">{event.name}</span><GuestThemeToggle/></div>
  </header>
  {navigation&&<nav className="guest-bottom-bar" aria-label="Navigasi acara" inert={introOpen} aria-hidden={introOpen||undefined}>{items.map(({id,label,href,icon:Icon})=>{const active=id===activeMode||id==='camera'&&['disposable_photo','photo_strip','gif'].includes(activeMode);return <Link key={id} href={href} prefetch={false} className={'guest-nav-item '+(id==='camera'?'guest-nav-camera':'')} aria-current={active?'page':undefined}><span className="guest-nav-icon"><Icon size={21} strokeWidth={active?2:1.65}/></span><span>{label}</span></Link>})}</nav>}
  {children}
 </div></AppearanceContext.Provider>;
}

export function GuestBack({event}:{event:any}){return <Link className="guest-screen-back" href={guestPath(event.slug)}><ChevronLeft size={17}/><span>{event.name}</span></Link>}
