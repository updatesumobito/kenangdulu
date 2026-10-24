'use client';
import {useCallback,useEffect,useRef,useState} from 'react';
import {attachCamera,cameraError,openCamera,type CameraFacing,type CameraState} from '@/lib/browser-camera';
export function useGuestCamera(profile:'photo'|'video',enabled:boolean,audio=false){
 const video=useRef<HTMLVideoElement>(null),stream=useRef<MediaStream|null>(null),generation=useRef(0),live=useRef(true),pending=useRef(false),facingRef=useRef<CameraFacing>('user');
 const [state,setState]=useState<CameraState>('idle'),[facing,setFacing]=useState<CameraFacing>('user'),[error,setError]=useState(''),[dimensions,setDimensions]=useState({width:0,height:0}),[freeze,setFreeze]=useState('');
 const release=useCallback(()=>{generation.current++;pending.current=false;stream.current?.getTracks().forEach(t=>t.stop());stream.current=null;if(video.current)video.current.srcObject=null;},[]);
 const stop=useCallback(()=>{release();if(live.current)setState('suspended');},[release]);
 const start=useCallback(async(next:CameraFacing=facingRef.current)=>{
  if(pending.current||!enabled)return;
  const previous=facingRef.current,isSwitch=next!==previous;
  if(video.current?.videoWidth){const c=document.createElement('canvas');c.width=240;c.height=Math.round(240*video.current.videoHeight/video.current.videoWidth);c.getContext('2d')?.drawImage(video.current,0,0,c.width,c.height);setFreeze(c.toDataURL('image/jpeg',.7));}
  release();pending.current=true;const request=generation.current;setState(isSwitch?'switching':'requesting');setError('');
  async function connect(which:CameraFacing){
   const s=await openCamera(which,audio,{profile});
   if(!live.current||generation.current!==request){s.getTracks().forEach(t=>t.stop());return false;}
   stream.current=s;if(!video.current){s.getTracks().forEach(t=>t.stop());return false;}
   await attachCamera(video.current,s);
   if(!live.current||generation.current!==request){s.getTracks().forEach(t=>t.stop());return false;}
   const actual=s.getVideoTracks()[0].getSettings().facingMode,selected=actual==='user'||actual==='environment'?actual:which;
   facingRef.current=selected;setFacing(selected);setDimensions({width:video.current.videoWidth,height:video.current.videoHeight});setState('ready');setFreeze('');return true;
  }
  try{await connect(next);}catch(err){
   // A released request must never stop the stream acquired by a newer request.
   if(!live.current||generation.current!==request)return;
   stream.current?.getTracks().forEach(t=>t.stop());stream.current=null;
   if(live.current&&generation.current===request){
    if(isSwitch){try{if(await connect(previous)){setError('Kamera lain tidak tersedia. Kamera sebelumnya tetap dipakai.');return;}}catch{/* show actionable fallback */}}
    if(live.current&&generation.current===request){setState((err as Error).name==='NotAllowedError'?'denied':'error');setError(cameraError(err));}
   }
  }finally{if(generation.current===request)pending.current=false;}
 },[enabled,audio,profile,release]);
 useEffect(()=>{
  live.current=true;if(enabled)void start();else{release();setState('idle');}
  const visibility=()=>{if(document.hidden)stop();else if(enabled)void start();};document.addEventListener('visibilitychange',visibility);
  return()=>{live.current=false;release();document.removeEventListener('visibilitychange',visibility);};
 },[enabled,start,release,stop]);
 return {video,stream,state,facing,dimensions,error,setError,freeze,start,stop,ready:state==='ready',starting:state==='requesting'||state==='switching'};
}
