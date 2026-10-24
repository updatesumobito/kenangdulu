'use client';
import {useCallback,useEffect,useRef,useState} from 'react';
import {api} from './ui';
import {adminModule} from '@/lib/admin-modules';
const endpoints={system:'admin/modules/operations',plans:'catalog/plans',templates:'templates',partners:'admin/modules/partners',moderation:'admin/modules/moderation'};
type Resource=keyof typeof endpoints;
type Filter={q:string;status:string;page:number};
const resourceFor=(path:string):Resource|undefined=>({packages:'plans',templates:'templates',partners:'partners',moderation:'moderation',operations:'system'} as Record<string,Resource>)[adminModule(path)?.id||''];
export function useAdminResources(enabled:boolean,path:string){
 const [data,setData]=useState<Record<Resource,any>>({system:null,plans:null,templates:null,partners:null,moderation:null}),[errors,setErrors]=useState<Partial<Record<Resource,string>>>({}),[filters,setFilters]=useState<Record<Resource,Filter>>(()=>Object.fromEntries(Object.keys(endpoints).map(key=>[key,{q:'',status:'',page:1}])) as Record<Resource,Filter>);
 const pending=useRef(new Map<string,Promise<void>>()),cache=useRef(new Map<string,{value:any;at:number}>()),active=useRef(new Map<Resource,string>());
 const read=useCallback((key:Resource,force=false)=>{
  const query=endpoints[key]+'?'+new URLSearchParams({...filters[key],page:String(filters[key].page)}),cached=cache.current.get(query);active.current.set(key,query);
  if(cached)setData(previous=>({...previous,[key]:cached.value}));
  if(!force&&cached&&Date.now()-cached.at<30000)return Promise.resolve();const existing=pending.current.get(query);if(existing)return existing;
  const request=api(query).then(value=>{cache.current.set(query,{value,at:Date.now()});if(active.current.get(key)===query){setData(previous=>({...previous,[key]:value}));setErrors(previous=>({...previous,[key]:undefined}));}}).catch(error=>{if(active.current.get(key)===query)setErrors(previous=>({...previous,[key]:error.message}));}).finally(()=>pending.current.delete(query));pending.current.set(query,request);return request;
 },[filters]);
 useEffect(()=>{const key=resourceFor(path);if(enabled&&key)void read(key);},[enabled,path,read]);
 const reload=useCallback((target:string)=>{const key=resourceFor(target);return key?read(key,true):Promise.resolve();},[read]);
 const filter=(key:Resource,patch:Partial<Filter>)=>setFilters(previous=>({...previous,[key]:{...previous[key],...patch}}));
 return {data,errors,reload,filters,filter};
}
export type AdminResources=ReturnType<typeof useAdminResources>;
