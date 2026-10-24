'use client';
import {useEffect,useRef,useState} from 'react';
import {toFrameDocument} from '@/lib/frame-document';
export default function FrameThumbnail({schema,previewToken}:{schema:any;previewToken?:string}){
 const host=useRef<HTMLDivElement>(null),[error,setError]=useState(''),doc=toFrameDocument(schema);
 useEffect(()=>{let live=true;import('@/lib/frame-renderer').then(({renderFrameDocument})=>renderFrameDocument(toFrameDocument(schema),{samples:true,previewToken,maxDimension:800})).then(canvas=>{if(live&&host.current){canvas.style.width='100%';canvas.style.height='auto';canvas.setAttribute('role','img');canvas.setAttribute('aria-label','Pratinjau komposisi frame');host.current.replaceChildren(canvas);setError('');}}).catch(err=>{if(live)setError(err.message);});return()=>{live=false;};},[schema,previewToken]);
 return <div ref={host} style={{aspectRatio:`${doc.page.width}/${doc.page.height}`,background:doc.page.background,maxWidth:420,margin:'auto'}}>{error?<small role="alert">{error}</small>:<small>Menyiapkan preview…</small>}</div>;
}
