'use client';
import {useEffect,useRef,useState} from 'react';
import {useDropzone} from 'react-dropzone';
import {ImagePlus,Images,Upload,LoaderCircle,Plus,ArrowUpRight,Trash2,Check,AlertCircle,Film,Mic} from 'lucide-react';
import GuestMediaSheet from './guest-media-sheet';

type Choice={id:string;file:File;url:string;state:'selected'|'working'|'added'|'error';error?:string};
type Props={kind:'foto'|'suara'|'video';accept:string;description:string;disabled?:boolean;busy?:boolean;maxFiles?:number;onFile:(file:File,optimize?:boolean)=>void|Promise<void>;onBusy?:(busy:boolean)=>void};
export default function GuestFilePicker({kind,accept,description,disabled=false,busy=false,maxFiles=1,onFile,onBusy}:Props){
 const [open,setOpen]=useState(false),[choices,setChoices]=useState<Choice[]>([]),[processing,setProcessing]=useState(false),[message,setMessage]=useState('');
 const live=useRef(true),current=useRef(choices),generation=useRef(0),busyCallback=useRef(onBusy);current.current=choices;busyCallback.current=onBusy;
 useEffect(()=>{live.current=true;return()=>{live.current=false;generation.current++;for(const row of current.current)URL.revokeObjectURL(row.url);busyCallback.current?.(false);};},[]);
 const multiple=kind==='foto',capacity=Math.max(0,maxFiles),selected=choices.filter(c=>c.state!=='added'),Icon=kind==='foto'?Images:kind==='video'?Film:Mic;
 function discard(){generation.current++;for(const row of current.current)URL.revokeObjectURL(row.url);setChoices([]);setMessage('');}
 const picker=useDropzone({accept:Object.fromEntries(accept.split(',').map(mime=>[mime.trim(),[]])),multiple,disabled:disabled||busy||processing||capacity===0,noClick:true,noKeyboard:true,
  onDrop:(files,rejected)=>{
   setMessage(rejected.length?'Sebagian berkas tidak didukung. Pilih format yang tercantum di bawah.':'');
   if(!multiple){for(const row of current.current)URL.revokeObjectURL(row.url);}
   setChoices(previous=>[...(multiple?previous:[]),...files.map(file=>({id:crypto.randomUUID(),file,url:URL.createObjectURL(file),state:'selected' as const}))]);setOpen(true);
  }
 });
 function choose(){if(disabled||busy||processing||capacity===0)return;setOpen(true);picker.open();}
 async function add(only?:Choice,optimize=false){
  const rows=only?[only]:selected.filter(row=>row.state==='selected');if(processing||!rows.length)return;
  if(rows.length>capacity){setMessage(`Pilih maksimal ${capacity} foto. Hapus pilihan yang tidak ingin ditambahkan.`);return;}
  const request=++generation.current;setProcessing(true);busyCallback.current?.(true);setMessage('');
  const update=(id:string,patch:Partial<Choice>)=>{if(live.current&&request===generation.current)setChoices(previous=>previous.map(row=>row.id===id?{...row,...patch}:row));};
  let failures=0;
  try{for(const row of rows){if(!live.current||request!==generation.current)return;update(row.id,{state:'working',error:undefined});try{await onFile(row.file,optimize);update(row.id,{state:'added'});}catch(err){failures++;update(row.id,{state:'error',error:(err as Error).message||'Berkas belum dapat ditambahkan.'});}}
   if(live.current&&request===generation.current){setMessage(failures?'Berkas yang valid sudah masuk draft. Periksa pilihan yang perlu diperbaiki.':'Sudah masuk ke draft, belum dikirim.');if(!failures){setOpen(false);discard();}}
  }finally{if(live.current&&request===generation.current){setProcessing(false);busyCallback.current?.(false);}else if(live.current){setProcessing(false);busyCallback.current?.(false);}}
 }
 const isBusy=busy||processing;
 return <div className="gm-upload" {...picker.getRootProps()}>
  <input {...picker.getInputProps({'aria-label':`Pilih ${kind} dari galeri`})}/>
  <button type="button" className="gm-upload-card" disabled={disabled||isBusy||capacity===0} onClick={choose}>
   <span className="gm-upload-art" aria-hidden="true"><i/><i/><span>{isBusy?<LoaderCircle className="gm-spin" size={26}/>:<Icon size={28}/>}</span></span>
   <span className="gm-upload-copy"><small>DARI PERANGKATMU</small><strong>{isBusy?'Menyiapkan kenangan…':kind==='foto'?'Tambahkan dari galeri':`Pilih ${kind} dari perangkat`}</strong><span>{multiple?`Pilih beberapa foto · sisa ${capacity} pilihan`:'Periksa hasil sebelum masuk draft'}</span></span><span className="gm-upload-plus" aria-hidden="true"><Plus size={20}/></span>
  </button><p className="gm-upload-description">{description}</p>
  <GuestMediaSheet open={open} locked={processing} onOpenChange={next=>{setOpen(next);if(!next)discard();}} title={kind==='foto'?'Pilih momen favoritmu':`Tambahkan ${kind}`} description={multiple?`Pilih hingga ${capacity} foto. Semuanya bisa diperiksa sebelum dikirim.`:kind==='video'?'Pilih video, putar untuk memeriksa gambar dan suara, lalu tambahkan ke draft.':'Pilih rekaman suara, dengarkan kembali, lalu tambahkan ke draft.'}>
   <ol className="gm-upload-guide" aria-label={`Cara menambahkan ${kind}`}><li><span>1</span>Pilih {kind}</li><li><span>2</span>{multiple?'Periksa foto':'Putar & periksa'}</li><li><span>3</span>Masuk draft</li></ol>
   <p className="gm-upload-description">{description}</p>
   <div className="gm-upload-sheet-summary"><span>{selected.length} dipilih{multiple?` / ${capacity} tersedia`:''}</span><button type="button" className="outline" disabled={processing||disabled||selected.length>=capacity} onClick={()=>picker.open()}><ImagePlus size={17}/> Tambah pilihan</button></div>
   {choices.length===0?<button type="button" className="gm-upload-empty" onClick={()=>picker.open()}><Upload size={30}/><strong>Pilih berkas dari perangkat</strong><span>Kenanganmu tetap pribadi.</span></button>:<div className={'gm-upload-grid '+(!multiple?'gm-upload-single':'')}>
    {choices.map(row=><article key={row.id} className="gm-upload-item" data-state={row.state}>
     <div className="gm-upload-thumb">{kind==='foto'?<img src={row.url} alt={row.file.name}/>:kind==='video'?<video src={row.url} controls playsInline preload="metadata"/>:<audio src={row.url} controls preload="metadata"/>}{row.state==='working'&&<span className="gm-upload-state"><LoaderCircle className="gm-spin" size={24}/></span>}{row.state==='added'&&<span className="gm-upload-state"><Check size={24}/></span>}</div>
     <div className="gm-upload-item-meta"><strong>{row.file.name}</strong><small>{(row.file.size/1024**2).toFixed(1)} MB</small>{row.state!=='added'&&<button type="button" aria-label={'Hapus pilihan '+row.file.name} disabled={processing} onClick={()=>{URL.revokeObjectURL(row.url);setChoices(previous=>previous.filter(item=>item.id!==row.id));}}><Trash2 size={17}/></button>}</div>
     {row.error&&<div className="gm-upload-error"><span role="alert"><AlertCircle size={15}/>{row.error}</span><button type="button" className="outline" disabled={processing||capacity===0} onClick={()=>void add(row)}>Coba tambahkan lagi</button>{kind!=='suara'&&<button type="button" className="outline" disabled={processing||capacity===0} onClick={()=>void add(row,true)}>Optimalkan & tambahkan</button>}</div>}
    </article>)}
   </div>}
   {message&&<p className="gm-upload-message" role="status">{message}</p>}
   <div className="gm-sheet-actions"><button type="button" disabled={processing||disabled||selected.filter(row=>row.state==='selected').length===0||selected.filter(row=>row.state==='selected').length>capacity} onClick={()=>void add()}>{processing?<><LoaderCircle className="gm-spin" size={18}/> Menyiapkan…</>:<>Tambahkan {selected.filter(row=>row.state==='selected').length} {kind}<ArrowUpRight size={18}/></>}</button><small>Masuk ke draft dahulu, belum dikirim ke pengantin.</small></div>
  </GuestMediaSheet>
 </div>;
}
