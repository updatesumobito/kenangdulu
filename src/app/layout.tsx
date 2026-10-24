import type {Metadata,Viewport} from 'next';
import './heritage-tokens.css';
import './globals.css';
import './personal.css';
import './guest-opening.css';
import './guest-native.css';
import './guest-readable.css';
import './couple-album.css';
import './guest-welcome-screen.css';
import './guest-responsive.css';
import './admin-design.css';
import './home-design.css';
import './heritage-components.css';
import './guest-wizard.css';
export const metadata:Metadata={title:{default:'Kenang Dulu — Satu QR, banyak kenangan',template:'%s | Kenang Dulu'},description:'Kamera disposable, photostrip, suara, video dan ucapan tamu dalam satu album. Mulai Rp99.000.',robots:{index:process.env.APP_MODE!=='personal',follow:process.env.APP_MODE!=='personal'}};
export const viewport:Viewport={width:'device-width',initialScale:1,viewportFit:'cover',themeColor:'#f2eee8'};
export default function Layout({children}:{children:React.ReactNode}){return <html lang="id" suppressHydrationWarning><body data-app-mode={process.env.APP_MODE}><script dangerouslySetInnerHTML={{__html:"try{var t=localStorage.getItem('komukuna-guest-theme');document.documentElement.dataset.guestTheme=t==='dark'||t!=='light'&&matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'}catch(e){}"}}/><a className="skip" href="#main">Lewati navigasi</a>{children}</body></html>}
