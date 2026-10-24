import {z} from 'zod';
export const MEDIA_LIMITS={photoBytes:12*1024**2,photoPixels:36_000_000,videoBytes:30*1024**2,videoEdge:3840} as const;
export const mediaPresentationSchema=z.object({version:z.literal(1),ratio:z.enum(['1:1','9:16']),background:z.string().regex(/^#[\da-f]{6}$/i),optimized:z.boolean().default(false)});
export type MediaPresentation=z.infer<typeof mediaPresentationSchema>;
export type CaptureRatio=MediaPresentation['ratio'];
export const ratioNumber=(ratio:CaptureRatio)=>ratio==='1:1'?1:9/16;
/** Add space around the entire source; never enlarge, crop or distort it. */
export function containFrame(width:number,height:number,ratio:CaptureRatio,scale=1){
 if(![width,height,scale].every(Number.isFinite)||width<=0||height<=0||scale<=0||scale>1)throw Error('Dimensi media tidak valid.');
 const r=ratioNumber(ratio),sourceWidth=Math.max(1,Math.round(width*scale)),sourceHeight=Math.max(1,Math.round(height*scale));
 const w=Math.ceil(Math.max(sourceWidth,sourceHeight*r)/2)*2,h=Math.ceil(Math.max(sourceHeight,sourceWidth/r)/2)*2;
 return {width:w,height:h,sourceWidth,sourceHeight,x:(w-sourceWidth)/2,y:(h-sourceHeight)/2};
}
export function videoPresentationFilter(p:MediaPresentation){
 const r=ratioNumber(p.ratio),scale=p.optimized?`,scale=w='min(iw,${Math.floor(1920*r)})':h='min(ih,1920)':force_original_aspect_ratio=decrease:force_divisible_by=2`:'';
 return `setsar=1${scale},pad=w='ceil(max(iw,ih*${r})/2)*2':h='ceil(max(ih,iw/${r})/2)*2':x=(ow-iw)/2:y=(oh-ih)/2:color=0x${p.background.slice(1)},format=yuv420p`;
}
export function presentationBackground(){
 const shell=document.querySelector('.guest-shell'),value=shell?getComputedStyle(shell).getPropertyValue('--color-media-bg').trim():'';
 return /^#[\da-f]{6}$/i.test(value)?value:'#150F03';
}
