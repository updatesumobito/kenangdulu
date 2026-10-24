import {worldBounds,anchorPoint,resizeBox,rotate,type Box,type ResizeAnchor} from './mokabooth/frame-geometry';
import type {FrameDocumentV2,FrameObject} from './frame-document';
export function constrainTransformBox(original:Box,anchor:ResizeAnchor,next:{x:number;y:number;width:number;height:number;rotation:number},view:{x:number;y:number;scale:number},ratio?:number){
 const w=next.width/view.scale,h=next.height/view.scale,rotation=next.rotation*180/Math.PI,center=rotate({x:w/2,y:h/2},rotation),candidate={x:(next.x-view.x)/view.scale+center.x-w/2,y:(next.y-view.y)/view.scale+center.y-h/2,w,h,rotation},pointer=anchorPoint(candidate,anchor),box=resizeBox(original,anchor,pointer,ratio,1),topLeft=anchorPoint(box,'top-left');
 return {...next,x:view.x+topLeft.x*view.scale,y:view.y+topLeft.y*view.scale,width:box.w*view.scale,height:box.h*view.scale};
}
export function bounds(objects:FrameObject[]){const boxes=objects.map(o=>worldBounds(o));const x=Math.min(...boxes.map(o=>o.x)),y=Math.min(...boxes.map(o=>o.y));return {x,y,w:Math.max(...boxes.map(o=>o.x+o.w))-x,h:Math.max(...boxes.map(o=>o.y+o.h))-y};}
export function alignObjects(doc:FrameDocumentV2,ids:string[],action:string,page=false):FrameDocumentV2{
 const selected=doc.objects.filter(o=>ids.includes(o.id)&&!o.locked);if(!selected.length)return doc;
 const area=page?{x:0,y:0,w:doc.page.width,h:doc.page.height}:bounds(selected),first=selected[0];
 const patches=new Map<string,Partial<FrameObject>>();
 if(action==='distribute-x'||action==='distribute-y'){
  if(selected.length<3)return doc;const horizontal=action==='distribute-x',ordered=[...selected].sort((a,b)=>horizontal?a.x-b.x:a.y-b.y),space=((horizontal?area.w:area.h)-ordered.reduce((n,o)=>n+(horizontal?worldBounds(o).w:worldBounds(o).h),0))/(ordered.length-1);let cursor=horizontal?area.x:area.y;
  for(const o of ordered){const b=worldBounds(o);patches.set(o.id,horizontal?{x:o.x+cursor-b.x}:{y:o.y+cursor-b.y});cursor+=(horizontal?b.w:b.h)+space;}
 }else for(const o of selected){const b=worldBounds(o);patches.set(o.id,action==='left'?{x:o.x+area.x-b.x}:action==='right'?{x:o.x+area.x+area.w-b.x-b.w}:action==='top'?{y:o.y+area.y-b.y}:action==='bottom'?{y:o.y+area.y+area.h-b.y-b.h}:action==='center-x'?{x:o.x+area.x+area.w/2-b.x-b.w/2}:action==='center-y'?{y:o.y+area.y+area.h/2-b.y-b.h/2}:action==='equal'?{w:first.w,h:o.kind==='qr'||o.kind==='slot'&&o.shape==='circle'?first.w:first.h}:{});}
 return {...doc,objects:doc.objects.map(o=>({...o,...patches.get(o.id)}))};
}
export function snapObject(o:FrameObject,doc:FrameDocumentV2,selected:string[],scale:number,grid:boolean,smart:boolean){
 let x=o.x,y=o.y;const guides:{axis:'x'|'y';value:number}[]=[];if(grid){x=Math.round(x/5)*5;y=Math.round(y/5)*5;}
 if(smart){const tolerance=6/scale,b=worldBounds({...o,x,y}),xs=[0,doc.page.width/2,doc.page.width],ys=[0,doc.page.height/2,doc.page.height];
  for(const other of doc.objects.filter(v=>v.visible&&!selected.includes(v.id))){const box=worldBounds(other);xs.push(box.x,box.x+box.w/2,box.x+box.w);ys.push(box.y,box.y+box.h/2,box.y+box.h);}
  let dx=tolerance,dy=tolerance,tx=0,ty=0,gx:number|undefined,gy:number|undefined;
  for(const target of xs)for(const current of [b.x,b.x+b.w/2,b.x+b.w])if(Math.abs(target-current)<dx){dx=Math.abs(target-current);tx=target-current;gx=target;}
  for(const target of ys)for(const current of [b.y,b.y+b.h/2,b.y+b.h])if(Math.abs(target-current)<dy){dy=Math.abs(target-current);ty=target-current;gy=target;}
  x+=tx;y+=ty;if(gx!==undefined)guides.push({axis:'x',value:gx});if(gy!==undefined)guides.push({axis:'y',value:gy});
 }
 return {x,y,guides};
}
