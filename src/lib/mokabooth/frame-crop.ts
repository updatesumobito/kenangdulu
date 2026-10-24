export type PhotoCrop = {focal_x:number;focal_y:number;zoom:number};
export const CENTER_CROP:PhotoCrop={focal_x:.5,focal_y:.5,zoom:1};
export function photoPlacement(source:{w:number;h:number},target:{w:number;h:number},fit:"cover"|"contain",crop:PhotoCrop=CENTER_CROP) {
  if (![source.w,source.h,target.w,target.h,crop.focal_x,crop.focal_y,crop.zoom].every(Number.isFinite) || source.w<=0 || source.h<=0 || target.w<=0 || target.h<=0 || crop.zoom<1 || crop.zoom>20 || crop.focal_x<0 || crop.focal_x>1 || crop.focal_y<0 || crop.focal_y>1) throw new Error("Crop foto tidak valid.");
  const scale=(fit==="cover"?Math.max(target.w/source.w,target.h/source.h):Math.min(target.w/source.w,target.h/source.h))*crop.zoom;
  const w=source.w*scale,h=source.h*scale;
  const offset=(length:number,size:number,focal:number)=>length>=size?Math.max(size-length,Math.min(0,size/2-focal*length)):(size-length)/2;
  return {x:offset(w,target.w,crop.focal_x),y:offset(h,target.h,crop.focal_y),w,h,scale};
}
/** Move the photo beneath the clipping window; this never changes the window geometry. */
export function panPhotoCrop(source:{w:number;h:number},target:{w:number;h:number},fit:'cover'|'contain',crop:PhotoCrop,delta:{x:number;y:number}):PhotoCrop{
 const placement=photoPlacement(source,target,fit,crop),clamp=(value:number)=>Math.max(0,Math.min(1,value));
 return {...crop,focal_x:placement.w>target.w+1e-9?clamp((target.w/2-placement.x-delta.x)/placement.w):crop.focal_x,focal_y:placement.h>target.h+1e-9?clamp((target.h/2-placement.y-delta.y)/placement.h):crop.focal_y};
}
