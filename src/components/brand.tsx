import Link from 'next/link';
import BrandLogo from './brand-logo';
import {MemoryBrand} from './admin-design';
export function Brand({signature=false}:{signature?:boolean}={}){return <Link className="brand" href="/" aria-label="Kenang Dulu - beranda"><BrandLogo variant={signature?'signature':'horizontal'}/></Link>}
export function Header({heritage=false}:{heritage?:boolean}={}){return <header className="header wrap">{heritage?<MemoryBrand/>:<Brand/>}<nav aria-label="Navigasi utama"><Link href="/fitur">Fitur</Link><Link href="/harga">Paket & harga</Link><Link href="/untuk-vendor">Untuk WO</Link><Link href="/contoh">Demo</Link></nav><Link className="button outline" href="/masuk">Masuk <span>↗</span></Link></header>}
export function Footer({heritage=false}:{heritage?:boolean}={}){return <footer className="wrap footer">{heritage?<MemoryBrand signature/>:<Brand signature/>}<p>Kenangan kecil. Berarti selamanya.</p><div><Link href="/panduan">Panduan</Link><Link href="/legal">Privasi & ketentuan</Link><Link href="/kontak">Hubungi kami</Link></div><small>© {new Date().getFullYear()} Kenang Dulu</small></footer>}
