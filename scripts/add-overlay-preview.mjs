import fs from 'node:fs';
const file='src/components/frame-studio.tsx';let s=fs.readFileSync(file,'utf8');const key='<div className="frame-caption"';
const layers='{[...(frame.overlays||[])].sort((a,b)=>a.z-b.z).map((o:any)=><div key={o.id} className="frame-overlay" style={{left:o.x*100+"%",top:o.y*100+"%",width:o.w*100+"%",height:o.h*100+"%",transform:`rotate(${o.rotation}deg)`,color:o.color,zIndex:o.z,fontSize:Math.max(8,o.h*250)}}>{o.kind==="image"?<img src={"/api/v1/frame-assets/"+o.assetRef} alt="Overlay frame"/>:o.text}</div>)}';
if(!s.includes(key))throw Error('Caption not found');s=s.replace(key,layers+key);fs.writeFileSync(file,s);
