import type {Metadata} from 'next';
import {MissingMemory} from '@/components/coming-soon';
export const metadata:Metadata={title:'404 — Halaman belum ditemukan',robots:{index:false,follow:false}};
export default function NotFound(){return <MissingMemory/>;}
