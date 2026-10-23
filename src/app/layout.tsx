import type {Metadata,Viewport} from 'next';
import './globals.css';
import './personal.css';
export const metadata:Metadata={title:{default:'Komukuna Virtual — Satu QR, banyak kenangan',template:'%s | Komukuna Virtual'},description:'Kamera disposable, photostrip, suara, video dan ucapan tamu dalam satu album. Mulai Rp99.000.',robots:{index:process.env.APP_MODE!=='personal',follow:process.env.APP_MODE!=='personal'}};
export const viewport:Viewport={width:'device-width',initialScale:1,viewportFit:'cover'};
export default function Layout({children}:{children:React.ReactNode}){return <html lang="id"><body data-app-mode={process.env.APP_MODE}><a className="skip" href="#main">Lewati navigasi</a>{children}</body></html>}
