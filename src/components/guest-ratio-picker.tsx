'use client';
export default function GuestRatioPicker({kind,value,onChange,disabled=false}:{kind:'foto'|'video';value:string;onChange:(ratio:string)=>void;disabled?:boolean}) {
 const values=kind==='foto'?['3:4','9:16']:['9:16','16:9'];
 return <div className="gw-ratio-field"><span>Ukuran {kind}</span><div className="gw-ratios" role="group" aria-label={`Rasio ${kind}`}>
  {values.map(ratio=><button type="button" key={ratio} aria-pressed={ratio===value} disabled={disabled} onClick={()=>onChange(ratio)}><i aria-hidden="true" style={{aspectRatio:ratio.replace(':','/')}}/><span>{ratio}<small>{ratio==='16:9'?'Mendatar':ratio==='3:4'?'Klasik':'Tegak'}</small></span></button>)}
 </div></div>;
}
