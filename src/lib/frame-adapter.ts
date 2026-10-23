import {resizeBox,pointerToDocument,type ResizeAnchor} from './mokabooth/frame-geometry';
export function resizeNormalizedSlot(slot:any,anchor:ResizeAnchor,client:{x:number,y:number},bounds:{left:number,top:number,width:number},frame:{width:number,height:number}){
 const pointer=pointerToDocument(client,{x:bounds.left,y:bounds.top,scale:bounds.width/frame.width});
 const box=resizeBox({x:slot.x*frame.width,y:slot.y*frame.height,w:slot.w*frame.width,h:slot.h*frame.height,rotation:slot.rotation},anchor,pointer,undefined,24);
 const w=Math.max(.02,Math.min(1,box.w/frame.width)),h=Math.max(.02,Math.min(1,box.h/frame.height));
 return {...slot,w,h,x:Math.max(0,Math.min(1-w,box.x/frame.width)),y:Math.max(0,Math.min(1-h,box.y/frame.height))};
}
