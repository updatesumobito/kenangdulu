'use client';
export default function GuestRatioPicker({kind,value,onChange,disabled=false}:{kind:'foto'|'video';value:string;onChange:(ratio:string)=>void;disabled?:boolean}){
 return <div className="gw-ratio-field gm-ratio-field"><span>Format {kind}</span><div className="gw-ratios gm-ratios" role="group" aria-label={`Rasio ${kind}`}>
 {['1:1','9:16'].map(ratio=><button type="button" key={ratio} aria-pressed={ratio===value} disabled={disabled} onClick={()=>onChange(ratio)}><i aria-hidden="true" style={{aspectRatio:ratio.replace(':','/')}}/><span>{ratio}<small>{ratio==='1:1'?'Kotak':'Tegak'}</small></span></button>)}
 </div></div>;
}
