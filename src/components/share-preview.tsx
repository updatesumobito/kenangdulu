'use client';
import {useState,useEffect} from 'react';
import {post,Notice} from './ui';
import EventPreview from './event-preview';
export default function SharePreview(){const [data,setData]=useState<any>(null),[error,setError]=useState(''),[token,setToken]=useState('');useEffect(()=>{let active=true;const value=location.hash.slice(1);setToken(value);if(!value){setError('Link preview tidak lengkap.');return}post('public/preview/read',{token:value}).then(result=>{if(active)setData(result)}).catch(err=>{if(active)setError(err.message)});return()=>{active=false}},[]);return error?<Notice error>{error}</Notice>:data?<EventPreview event={data.event} frames={data.frames} previewToken={token}/>:<p>Memuat pratinjau…</p>}
