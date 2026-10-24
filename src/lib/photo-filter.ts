/** CSS filter primitives shared by still-image worker and canvas fallback. */
export function applyPhotoFilter(pixels:Uint8ClampedArray,css:string){
 for(const [,name,raw] of css.matchAll(/([a-z-]+)\(([^)]+)\)/g)){
  const v=parseFloat(raw);if(!Number.isFinite(v))continue;
  const angle=v*Math.PI/180,c=Math.cos(angle),s=Math.sin(angle);
  for(let i=0;i<pixels.length;i+=4){const r=pixels[i],g=pixels[i+1],b=pixels[i+2];let x=r,y=g,z=b;
   if(name==='brightness'){x=r*v;y=g*v;z=b*v;}
   else if(name==='contrast'){x=(r-127.5)*v+127.5;y=(g-127.5)*v+127.5;z=(b-127.5)*v+127.5;}
   else if(name==='grayscale'||name==='saturate'){const amount=name==='grayscale'?1-Math.min(1,v):v,l=.2126*r+.7152*g+.0722*b;x=l+(r-l)*amount;y=l+(g-l)*amount;z=l+(b-l)*amount;}
   else if(name==='sepia'){const a=Math.min(1,v);x=r*(1-a)+a*(.393*r+.769*g+.189*b);y=g*(1-a)+a*(.349*r+.686*g+.168*b);z=b*(1-a)+a*(.272*r+.534*g+.131*b);}
   else if(name==='hue-rotate'){x=(.213+.787*c-.213*s)*r+(.715-.715*c-.715*s)*g+(.072-.072*c+.928*s)*b;y=(.213-.213*c+.143*s)*r+(.715+.285*c+.140*s)*g+(.072-.072*c-.283*s)*b;z=(.213-.213*c-.787*s)*r+(.715-.715*c+.715*s)*g+(.072+.928*c+.072*s)*b;}
   pixels[i]=x;pixels[i+1]=y;pixels[i+2]=z;
  }
 }
 return pixels;
}
