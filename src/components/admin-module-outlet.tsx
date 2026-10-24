'use client';
import dynamic from 'next/dynamic';
import {ADMIN_MODULES,adminModule,adminModuleEnabled} from '@/lib/admin-modules';
import type {AdminResources} from './admin-resources';
import {Notice} from './ui';
type Props={path:string;user:any;resources:AdminResources;features?:Record<string,boolean>;cache:Map<string,{value:any;at:number;actor:string}>};
const panels=Object.fromEntries(ADMIN_MODULES.map(m=>[m.id,dynamic(m.loadPanel as ()=>Promise<{default:React.ComponentType<any>}>,{loading:()=> <p>Memuat modul…</p>})]));
export default function AdminModuleOutlet({path,user,resources,cache,features}:Props){const module=adminModule(path);if(!module)return <Notice error>Modul tidak ditemukan.</Notice>;if(!adminModuleEnabled(module,user.role,features))return <Notice error>Anda tidak memiliki izin untuk modul ini.</Notice>;const Panel=panels[module.id];return <Panel key={module.id} path={'admin/'+module.route} moduleId={module.id} user={user} resources={resources} cache={cache}/>;}
