/// <reference lib="webworker" />
export {};
type DetectMessage={pixels:ArrayBuffer;width:number;height:number;mode:'alpha'|'color';color:[number,number,number];tolerance:number;minimum:number};
self.onmessage=(event:MessageEvent<DetectMessage>)=>{
 const {pixels,width,height,mode,color,tolerance,minimum}=event.data,data=new Uint8ClampedArray(pixels),seen=new Uint8Array(width*height),queue=new Int32Array(width*height),candidates:{x:number;y:number;w:number;h:number;area:number}[]=[];
 const match=(n:number)=>mode==='alpha'?data[n*4+3]<=tolerance:Math.max(Math.abs(data[n*4]-color[0]),Math.abs(data[n*4+1]-color[1]),Math.abs(data[n*4+2]-color[2]))<=tolerance&&data[n*4+3]>0;
 for(let index=0;index<seen.length;index++){
  if(seen[index]||!match(index))continue;let head=0,tail=1,minX=width,minY=height,maxX=0,maxY=0;queue[0]=index;seen[index]=1;
  while(head<tail){const n=queue[head++],x=n%width,y=Math.floor(n/width);minX=Math.min(minX,x);maxX=Math.max(maxX,x);minY=Math.min(minY,y);maxY=Math.max(maxY,y);
   for(const next of [x>0?n-1:-1,x+1<width?n+1:-1,y>0?n-width:-1,y+1<height?n+width:-1])if(next>=0&&!seen[next]&&match(next)){seen[next]=1;queue[tail++]=next;}
  }
  const w=maxX-minX+1,h=maxY-minY+1;if(w>=minimum&&h>=minimum&&tail>=w*h*.65&&!(minX===0||minY===0||maxX===width-1||maxY===height-1))candidates.push({x:minX/width,y:minY/height,w:w/width,h:h/height,area:tail});
 }
 self.postMessage({candidates:candidates.sort((a,b)=>b.area-a.area).slice(0,20)});
};
