'use client';
import {useEffect,useState} from 'react';
import dynamic from 'next/dynamic';
import {api,post,Notice} from './ui';
import {guestSettings} from '@/lib/guest-settings';
const GuestExperience=dynamic(()=>import('./guest-experience'),{ssr:false,loading:()=> <p>Menyiapkan pengalaman tamu…</p>});
export default function ExperiencePreview({kind,id}:{kind:'order'|'event'|'token';id?:string}){const [event,setEvent]=useState<any>(),[error,setError]=useState('');useEffect(()=>{let live=true;const request=kind==='token'?post('public/preview/read',{token:location.hash.slice(1)}):api(kind==='order'?'direct/orders/'+id+'/preview':'events/'+id);request.then(value=>{if(!live)return;const e=value.event;if(!e.snapshot)throw Error('Link preview ini memakai snapshot lama. Minta penyelenggara membuat link preview baru.');setEvent({...e,slug:e.slug||'preview',previewToken:kind==='token'?location.hash.slice(1):undefined,settings:guestSettings(e.slug,e.settings),frames:value.frames||[]});}).catch(err=>{if(live)setError(err.message);});return()=>{live=false;};},[kind,id]);return error?<Notice error>{error}</Notice>:event?<><div className="experience-preview-banner" role="status">Pratinjau pengalaman tamu · kamera dan rekaman dapat dicoba · kiriman tidak dikirim ke acara</div><GuestExperience event={event} mode="preview" preview/></>:<p>Memuat pratinjau…</p>;}
