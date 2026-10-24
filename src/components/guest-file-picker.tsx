'use client';
import {ImagePlus,Upload,LoaderCircle} from 'lucide-react';

export default function GuestFilePicker({kind,accept,description,disabled=false,busy=false,onFile}:{kind:'foto'|'suara'|'video';accept:string;description:string;disabled?:boolean;busy?:boolean;onFile:(file:File)=>void}) {
 const Icon=busy?LoaderCircle:kind==='foto'?ImagePlus:Upload;
 return <label className="gw-file-card" data-disabled={disabled||busy} aria-disabled={disabled||busy}>
  <span className="gw-file-card-icon" aria-hidden="true"><Icon size={23} className={busy?'gw-spin':''}/></span>
  <span><strong>{busy?'Menyiapkan berkas…':`Pilih ${kind} dari perangkat`}</strong><small>{description}</small></span>
  <span className="gw-file-card-action" aria-hidden="true">Pilih</span>
  <input type="file" aria-label={`Pilih ${kind} dari perangkat`} accept={accept} disabled={disabled||busy} onChange={ev=>{const file=ev.target.files?.[0];ev.target.value='';if(file)onFile(file)}}/>
 </label>;
}
