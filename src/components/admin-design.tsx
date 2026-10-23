import Link from 'next/link';
import {ArrowUpRight, BookOpen, CalendarDays, CircleCheck, Clock3, CreditCard, Files, FolderHeart, Layers3, LayoutTemplate, ShieldCheck, SlidersHorizontal, Users, type LucideIcon} from 'lucide-react';

export const adminIcons:Record<string,LucideIcon>={pribadi:FolderHeart,fulfillment:Layers3,orders:CreditCard,events:CalendarDays,packages:Files,templates:LayoutTemplate,partners:Users,moderation:ShieldCheck,system:SlidersHorizontal};

export function MemoryBrand(){return <Link href="/" className="kd-brand" aria-label="Kenang Dulu — beranda"><span className="kd-brand-icon"><BookOpen size={23} strokeWidth={1.3}/></span><span>kenang dulu<small>THE MEMORY ARCHIVE</small></span></Link>}

export function AdminMetric({label,value,detail,kind}:{label:string,value:number,detail:string,kind:'orders'|'live'|'review'}){
 const Icon=kind==='orders'?Files:kind==='live'?CalendarDays:Clock3;
 return <div className={'card kd-metric kd-metric-'+kind}><div className="kd-metric-top"><span>{label}</span><span className="kd-icon-tile"><Icon size={19} strokeWidth={1.5}/></span></div><strong>{value.toLocaleString('id-ID')}</strong><small>{detail}</small></div>;
}

export function AdminWorkflow({orders}:{orders:any[]}){
 const steps=[{label:'Tinjau pembayaran',count:orders.filter(o=>o.status==='payment_review').length,icon:CreditCard},{label:'Siapkan desain',count:orders.filter(o=>o.status==='paid'&&!['preview_ready','client_approved','delivered'].includes(o.fulfillment)).length,icon:Layers3},{label:'Tunggu persetujuan',count:orders.filter(o=>o.fulfillment==='preview_ready').length,icon:Clock3},{label:'Siap dirayakan',count:orders.filter(o=>['client_approved','delivered'].includes(o.fulfillment)).length,icon:CircleCheck}];
 return <section className="kd-workflow" aria-label="Progres pesanan pada halaman ini"><div className="kd-workflow-heading"><div><span className="eyebrow">DARI PERSIAPAN KE PERAYAAN</span><h2>Setiap cerita, selangkah lebih dekat.</h2></div><span className="kd-caption">Pesanan di halaman ini</span></div><div className="kd-workflow-steps">{steps.map(({label,count,icon:Icon},i)=><div className="kd-workflow-step" key={label}><span className="kd-step-number">0{i+1}</span><Icon size={19} strokeWidth={1.4}/><strong>{count}</strong><span>{label}</span></div>)}</div></section>;
}

const contexts:Record<string,[string,string]>={
 fulfillment:['Antrean pengerjaan','Dari brief pertama hingga acara siap dirayakan.'],
 orders:['Pembayaran','Tinjau pembayaran dan lanjutkan persiapan acara.'],
 events:['Semua acara','Setiap perayaan punya ruang untuk dikenang.'],
 packages:['Paket & harga','Kelola pilihan untuk setiap cerita.'],
 templates:['Template global','Detail indah untuk kenangan yang personal.'],
 partners:['Mitra & pengguna','Orang-orang di balik setiap perayaan.'],
 moderation:['Laporan media','Jaga ruang kenangan tetap nyaman.'],
 system:['Sistem & audit','Ruang kendali operasional dan aktivitas.'],
 pribadi:['Acara pribadi','Ruang kecil untuk hari yang berarti.'],
};
export function adminContext(path:string){return contexts[path.split('/')[1]||path]||['Detail acara','Semua detail, tertata dalam satu ruang.']}

export function AdminPageNote({path}:{path:string}){const [title,description]=adminContext(path);return <div className="kd-page-note"><span><span className="kd-status-dot"/> ADMIN WORKSPACE</span><span>{description}</span><span className="kd-note-title">{title}<ArrowUpRight size={14}/></span></div>}
