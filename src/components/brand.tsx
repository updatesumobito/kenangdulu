import Link from 'next/link';
import {MemoryBrand} from './admin-design';
export function Brand(){return <Link className="brand" href="/">kenang dulu<span>Rayakan Sekarang, Kenang Selamanya.</span></Link>}
export function Header({heritage=false}:{heritage?:boolean}={}){return <header className="header wrap">{heritage?<MemoryBrand/>:<Brand/>}<nav aria-label="Navigasi utama"><Link href="/fitur">Fitur</Link><Link href="/harga">Paket & harga</Link><Link href="/untuk-vendor">Untuk WO</Link><Link href="/contoh">Demo</Link></nav><Link className="button outline" href="/masuk">Masuk <span>↗</span></Link></header>}
export function Footer({heritage=false}:{heritage?:boolean}={}){return <footer className="wrap footer">{heritage?<MemoryBrand/>:<Brand/>}<p>Kenangan kecil. Berarti selamanya.</p><div><Link href="/panduan">Panduan</Link><Link href="/legal">Privasi & ketentuan</Link><Link href="/kontak">Hubungi kami</Link></div><small>© {new Date().getFullYear()} Kenang Dulu</small></footer>}
