'use client';

import {useEffect,useRef,useState,type ReactNode} from 'react';
import {ArrowRight,Camera,Check,Heart,Mic,Play,RotateCcw,Send,UserRound,MessageCircle} from 'lucide-react';

import {GuestThemeToggle,useGuestAppearance} from './guest-shell';
import BrandLogo from './brand-logo';

type Step = {id:string,label:string,title:string,description:string};
export default function GuestOpening({name,date,hashtag,modes=[],children}:{name:string,date:string,hashtag?:string,modes?:string[],children:ReactNode}) {
 const {setIntroOpen}=useGuestAppearance();
 const [phase,setPhase]=useState<'idle'|'opening'|'entered'>('idle'),[ready,setReady]=useState(false),[step,setStep]=useState(0),[visible,setVisible]=useState(true),[reduced,setReduced]=useState(false),[phoneScale,setPhoneScale]=useState(.75);
 const content=useRef<HTMLDivElement>(null),scene=useRef<HTMLDivElement>(null),enterButton=useRef<HTMLButtonElement>(null);
 const steps:Step[]=[{id:'name',label:'Isi nama',title:'Kenalan dulu, yuk.',description:'Isi namamu dan setujui penyimpanan kenangan sebelum mulai. Kalau diminta, masukkan juga kode undangan.'}];
 if(modes.some(mode=>['disposable_photo','photo_strip','gif'].includes(mode)))steps.push({id:'camera',label:'Jepret',title:'Senyum. Jepret. Simpan.',description:'Pilih mode kamera, izinkan akses, lalu ambil foto. Bisa ganti kamera depan atau belakang dan ulangi sampai kamu suka.'});
 if(modes.includes('voice'))steps.push({id:'voice',label:'Pesan suara',title:'Ada doa yang ingin didengar.',description:'Buka Pesan suara, izinkan mikrofon, lalu rekam. Dengarkan kembali, simpan ke draft, lalu lanjut ke langkah berikutnya.'});
 if(modes.includes('video_wish'))steps.push({id:'video',label:'Video ucapan',title:'Biar senyummu ikut bercerita.',description:'Video opsional. Pilih kamera depan atau belakang, lalu rekam atau lewati langkah ini. Lihat kembali hasilnya sebelum mengirim.'});
 if(modes.includes('wish_card'))steps.push({id:'note',label:'Tulis doa',title:'Sedikit kata, banyak makna.',description:'Tulis doa atau cerita kecil. Ucapanmu disimpan secara pribadi untuk pengantin.'});
 steps.push({id:'send',label:'Kirim',title:'Satu kiriman, satu kenangan.',description:'Periksa semua foto, suara, dan ucapanmu, lalu kirim secara pribadi untuk pengantin. Tunggu konfirmasi bahwa kenanganmu sudah tersimpan.'});
 const current=steps[Math.min(step,steps.length-1)];
 useEffect(()=>{setPhase('idle');setStep(0);setReady(true);const media=window.matchMedia('(prefers-reduced-motion: reduce)');const update=()=>setReduced(media.matches);update();media.addEventListener('change',update);return()=>media.removeEventListener('change',update)},[name,date]);
 useEffect(()=>{
  if(!ready||phase==='entered')return;
  const bodyOverflow=document.body.style.overflow,rootOverflow=document.documentElement.style.overflow;
  document.body.style.overflow='hidden';document.documentElement.style.overflow='hidden';enterButton.current?.focus({preventScroll:true});
  return()=>{document.body.style.overflow=bodyOverflow;document.documentElement.style.overflow=rootOverflow};
 },[ready,phase]);
 useEffect(()=>{const update=()=>setVisible(!document.hidden);update();document.addEventListener('visibilitychange',update);return()=>document.removeEventListener('visibilitychange',update)},[]);
 useEffect(()=>{if(phase!=='opening')return;const timer=setTimeout(()=>setPhase('entered'),reduced?120:220);return()=>clearTimeout(timer)},[phase,reduced]);
 useEffect(()=>{
  if(phase!=='entered')return;
  content.current?.querySelector<HTMLElement>('h1')?.focus({preventScroll:true});
 },[phase]);
 useEffect(()=>{
  if(!ready||phase!=='idle'||!visible||step>=steps.length-1)return;
  const timer=setTimeout(()=>setStep(value=>Math.min(value+1,steps.length-1)),4000);
  return()=>clearTimeout(timer);
 },[ready,phase,visible,step,steps.length]);
 useEffect(()=>{setIntroOpen(phase!=='entered');return()=>setIntroOpen(false)},[phase,setIntroOpen]);
 useEffect(()=>{
  const element=scene.current;if(!element||phase==='entered')return;
  // Reserve the full animated envelope: rotation up to 6deg, translation,
  // border and shadow, plus 12px of clearance on every side of the scene.
  const resize=()=>{const {width,height}=element.getBoundingClientRect();setPhoneScale(Math.max(0,Math.min(1.04,(width-24)/286,(height-24)/424)))};
  resize();const observer=new ResizeObserver(resize);observer.observe(element);return()=>observer.disconnect();
 },[phase]);
 function enter(){if(phase==='idle')setPhase('opening')}
 return <>
  {phase!=='entered'&&<section className="guest-opening" data-phase={phase} data-reduced={reduced} data-paused={!visible} aria-labelledby="opening-title" onKeyDown={ev=>{if(ev.key==='Escape')setPhase('entered')}}>
   <header className="tutorial-top"><BrandLogo/><div className="tutorial-header-actions"><GuestThemeToggle/></div></header>
   <div className="opening-composition">
    <div className="opening-heading"><p className="eyebrow">SELAMAT DATANG DI HARI BAHAGIA KAMI</p><h1 id="opening-title">{name}</h1><p className="opening-tagline">Simpan momen.<br/><em>Titipkan doa.</em></p><small>{date}{hashtag&&<> · {hashtag}</>}</small>
     <p className="opening-intro">Foto, suara, dan doa terbaikmu. Kenangan kecil yang akan selalu berarti.</p>

    </div>
    <div className="tutorial-area">
     <div ref={scene} className="tutorial-scene" data-step={current.id}>
      <span className="tutorial-orbit orbit-one" aria-hidden="true"/><span className="tutorial-orbit orbit-two" aria-hidden="true"/>
      <div className="tutorial-phone-fit" style={{transform:`translate(-50%,-50%) scale(${phoneScale})`}} aria-hidden="true"><div className="tutorial-phone-motion"><div className="tutorial-phone"><div className="phone-camera"/><div className="phone-top"><Heart size={12}/><span>YOUR LITTLE MEMORY</span><span>•••</span></div>
       <div className="phone-screen" key={current.id}>
        {current.id==='name'&&<div className="demo-name"><span className="demo-round"><UserRound size={30}/></span><small>SEBELUM MENULIS KENANGAN</small><h3>Boleh kenalan dulu?</h3><label>Namamu</label><div className="demo-input">{'Nama kamu'.split('').map((letter,i)=><span key={i} style={{animationDelay:`${i*90+300}ms`}}>{letter}</span>)}<i/></div><div className="demo-consent"><Check size={13}/><span>Setuju kirim ke penyelenggara</span></div><div className="demo-action">Lanjut <ArrowRight size={13}/></div></div>}
        {(current.id==='camera'||current.id==='video')&&<div className="demo-camera"><div className="demo-viewfinder"><span className="demo-camera-label">{current.id==='video'?'VIDEO UCAPAN':'KAMERA DEPAN'} <RotateCcw size={12}/></span><div className="demo-person"><span/><i/></div><span className="demo-focus"/><span className="demo-count">{current.id==='video'?'00:03':<><span>3</span><span>2</span><span>1</span></>}</span>{current.id==='camera'&&<div className="demo-flash"/>}<span className="demo-photo-caption">{current.id==='video'?'Ceritakan doa terbaikmu.':'Senyum terbaikmu, tersimpan.'}</span></div><div className="demo-camera-controls"><RotateCcw size={17}/><span className="demo-shutter">{current.id==='video'?<span/>:<Camera size={24}/>}</span><Heart size={17}/></div><small>Bisa ganti kamera & ulangi</small></div>}
        {current.id==='voice'&&<div className="demo-voice"><small>A MESSAGE TO KEEP</small><h3>Suaramu,<br/>kenangan kami.</h3><span className="demo-round"><Mic size={30}/></span><div className="demo-wave">{Array.from({length:19},(_,i)=><i key={i} style={{height:`${12+(i*17)%38}px`,animationDelay:`${i*65}ms`}}/>)}</div><strong>00:08</strong><span className="demo-recording">Merekam doa hangatmu</span><div className="demo-action"><Check size={13}/> Hentikan & dengarkan</div></div>}
        {current.id==='note'&&<div className="demo-note"><span className="demo-round"><MessageCircle size={28}/></span><small>SEDIKIT KATA, BANYAK MAKNA</small><h3>Untuk hari<br/>bahagia kalian.</h3><div className="demo-note-paper"><Heart size={18}/><p>Semoga bahagia<br/>selalu menyertai<br/>perjalanan kalian.</p><span>Dengan doa terbaik ♡</span></div><div className="demo-action">Simpan ucapan <ArrowRight size={13}/></div></div>}
        {current.id==='send'&&<div className="demo-send"><span className="demo-send-icon"><Send size={32}/></span><span className="demo-success"><Check size={30}/></span><h3>Kenangan<br/>sudah terkirim.</h3><p>Terima kasih sudah menjadi<br/>bagian dari cerita kami.</p><div className="demo-saved"><Check size={13}/> Tersimpan untuk penyelenggara</div><Heart size={20}/></div>}
       </div><div className="phone-home"/>
      </div></div></div>
      <span className="tutorial-floating floating-top" aria-hidden="true"><Heart size={15}/> MADE WITH LOVE</span><span className="tutorial-floating floating-bottom" aria-hidden="true"><Check size={15}/> Momen kecil, berarti besar.</span>
      <span className="tutorial-demo-label">SIMULASI CARA PAKAI</span>
     </div>
     <div className="tutorial-explanation" aria-live="off"><span className="tutorial-step-count">0{step+1} / 0{steps.length}</span><h2>{current.title}</h2><p>{current.description}</p></div>
     <nav className="tutorial-navigation" aria-label="Langkah tutorial"><div className="tutorial-steps" style={{gridTemplateColumns:`repeat(${steps.length},minmax(0,1fr))`}}>{steps.map((item,i)=><button type="button" key={item.id} aria-label={`${i+1}. ${item.label}`} aria-current={step===i?'step':undefined} onClick={()=>setStep(i)}><span>{i+1}</span><small>{item.label}</small></button>)}</div></nav>
    </div>
   </div>
   <div className="opening-actions"><div className="opening-invitation"><button ref={enterButton} className="opening-enter" onClick={enter} disabled={phase==='opening'}>Mulai buat kenangan <ArrowRight size={17}/></button><small>Kamera & mikrofon hanya aktif saat kamu memilihnya.</small></div><span className="opening-actions-note"><Heart size={13}/> Kenangan kecil, berarti besar.</span></div>
   <footer><span>TAKE A MOMENT. MAKE A MEMORY.</span><span>{hashtag||'KEPT WITH KENANG DULU'}</span></footer>
  </section>}
  <div ref={content} className="gw-opening-content" inert={phase!=='entered'} aria-hidden={phase!=='entered'||undefined}>{phase==='entered'&&<div className="tutorial-replay-row"><button className="tutorial-replay" onClick={()=>{setStep(0);setPhase('idle')}}><Play size={13}/> Lihat cara pakai</button></div>}{phase==='entered'&&children}</div>
 </>;
}
