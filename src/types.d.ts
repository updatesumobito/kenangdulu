declare module 'ffprobe-static' {const probe:{path:string};export default probe;}
declare module 'gifenc' {
 export function GIFEncoder():{writeFrame:(data:Uint8Array,w:number,h:number,options:any)=>void;finish:()=>void;bytes:()=>Uint8Array};
 export function quantize(data:Uint8ClampedArray,max:number):number[][];
 export function applyPalette(data:Uint8ClampedArray,palette:number[][]):Uint8Array;
}
