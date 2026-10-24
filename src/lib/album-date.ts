export function albumDate(value:string|number|Date|null|undefined,timeZone:string|undefined,short=false){
 const date=value==null||value===''?null:new Date(value);
 if(!date||!Number.isFinite(date.getTime()))return {dateTime:undefined,label:'Tanggal belum tersedia'};
 const options:Intl.DateTimeFormatOptions={day:'numeric',month:short?'short':'long',...(!short?{year:'numeric'} as const:{}),timeZone:timeZone||'Asia/Jakarta'};
 let label:string;
 try{label=date.toLocaleDateString('id-ID',options)}
 catch{label=date.toLocaleDateString('id-ID',{...options,timeZone:'Asia/Jakarta'})}
 return {dateTime:date.toISOString(),label};
}
