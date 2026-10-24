import {applyPhotoFilter} from './photo-filter';
self.onmessage=(event:MessageEvent<{buffer:ArrayBuffer;css:string}>)=>{
 try{const pixels=applyPhotoFilter(new Uint8ClampedArray(event.data.buffer),event.data.css);self.postMessage({buffer:pixels.buffer}, {transfer:[pixels.buffer]});}
 catch(error){self.postMessage({error:(error as Error).message});}
};
