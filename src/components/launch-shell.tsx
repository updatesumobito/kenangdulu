import type {ReactNode} from 'react';
import Link from 'next/link';
import {ArrowUpRight,Sparkles} from 'lucide-react';
import BrandLogo from './brand-logo';

export default function LaunchShell({children,missing=false}:{children:ReactNode;missing?:boolean}){
 return <div className={'kl-page kd-theme'+(missing?' kl-missing':'')} data-motion="playing" data-motion-override="true">
  <div className="kl-paper-grain" aria-hidden="true"/>
  <header className="kl-header kl-reveal"><Link className="kl-brand" href="/" aria-label="Kenang Dulu — beranda"><BrandLogo/></Link><span className="kl-header-note">COLLECT MOMENTS. KEEP FEELINGS.</span></header>
  {children}
  <footer className="kl-footer"><span><Sparkles size={13}/> Momen kecil. Berarti besar.</span><Link href="/legal">Privasi & ketentuan <ArrowUpRight size={13}/></Link><span>KENANG DULU · MADE FOR MEMORIES</span></footer>
 </div>;
}
