'use client';
import {useEffect,useRef,useState,type ReactNode} from 'react';
import {Drawer} from '@base-ui/react/drawer';
import {X} from 'lucide-react';

export default function GuestMediaSheet({open,onOpenChange,title,description,children,locked=false}:{open:boolean;onOpenChange:(open:boolean)=>void;title:string;description:string;children:ReactNode;locked?:boolean}){
 const anchor=useRef<HTMLSpanElement>(null),[container,setContainer]=useState<HTMLElement|null>(null);
 useEffect(()=>setContainer(anchor.current?.closest<HTMLElement>('.guest-shell')||document.body),[]);
 return <><span ref={anchor} hidden/><Drawer.Root open={open&&!!container} onOpenChange={next=>{if(!locked)onOpenChange(next)}} disablePointerDismissal={locked}>
  <Drawer.Portal container={container}><Drawer.Backdrop className="gm-sheet-backdrop"/><Drawer.Viewport className="gm-sheet-viewport"><Drawer.Popup className="gm-sheet" onKeyDown={e=>{if(locked&&e.key==='Escape')e.preventDefault()}}>
   <div className="gm-sheet-handle" aria-hidden="true"/><header className="gm-sheet-heading"><div><Drawer.Title>{title}</Drawer.Title><Drawer.Description>{description}</Drawer.Description></div><Drawer.Close className="gm-sheet-close" disabled={locked} aria-label="Tutup panel"><X size={21}/></Drawer.Close></header>
   <Drawer.Content className="gm-sheet-content">{children}</Drawer.Content>
  </Drawer.Popup></Drawer.Viewport></Drawer.Portal>
 </Drawer.Root></>;
}
