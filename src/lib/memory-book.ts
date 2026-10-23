import {PDFDocument,StandardFonts,rgb} from 'pdf-lib';
import sharp from 'sharp';
import QRCode from 'qrcode';
import * as storage from './storage';

export async function createMemoryBook(event:any,media:any[],limit:number){
 const doc=await PDFDocument.create(),regular=await doc.embedFont(StandardFonts.Helvetica),title=await doc.embedFont(StandardFonts.TimesRoman);
 const ink=rgb(.18,.07,.27),accent=rgb(.64,.12,.38),paper=rgb(.995,.988,.976),muted=rgb(.45,.4,.48);
 const safe=(value:string)=>String(value).replace(/[^\x20-\x7e\xa0-\xff]/g,'?');
 const lines=(value:string,width:number,size=11)=>{const result:string[]=[];let line='';for(const char of safe(value)){if(char==='\n'||regular.widthOfTextAtSize(line+char,size)>width){result.push(line);line=char==='\n'?'':char}else line+=char}if(line)result.push(line);return result};
 const selected=media.slice(0,limit),omitted=media.slice(limit).map(item=>item.id),failed:string[]=[];
 const cover=doc.addPage([595,842]);cover.drawRectangle({x:0,y:0,width:595,height:842,color:paper});cover.drawText('KOMUKUNA / MEMORY BOOK',{x:46,y:750,size:11,font:regular,color:accent});let top=645;
 for(const line of lines(event.name,480,30)){cover.drawText(line,{x:46,y:top,size:30,font:title,color:ink});top-=38;}
 cover.drawText(safe(new Date(event.start_at).toLocaleDateString('id-ID',{timeZone:event.timezone})),{x:46,y:top-20,size:12,font:regular,color:muted});
 cover.drawText(`${selected.length} memories / ${event.snapshot.frames>=6?'Signature collection':'Celebration collection'}`,{x:46,y:top-60,size:12,font:regular,color:ink});
 if(omitted.length)for(const [index,line]of lines(`${omitted.length} kiriman lain tersedia dalam ZIP lengkap. Buku ini mengikuti batas pilihan pemilik.`,470).entries())cover.drawText(line,{x:46,y:180-index*16,size:11,font:regular,color:muted});
 const enhanced=event.snapshot.frames>=6,columns=enhanced?2:1,gap=20,width=(503-gap*(columns-1))/columns,height=enhanced?315:350;
 let page=doc.addPage([595,842]),column=0,y=750;
 const next=()=>{if(column+1<columns){column++;return}column=0;y-=height+20;if(y-height<55){page=doc.addPage([595,842]);y=750}};
 for(const item of selected){
  try{
   const textLines=item.text_content?lines(item.text_content,width-24,11):null;
   const blocks=textLines?Array.from({length:Math.max(1,Math.ceil(textLines.length/16))},(_,index)=>textLines.slice(index*16,index*16+16)):[null];
   for(const [blockIndex,block] of blocks.entries()){
    const x=46+column*(width+gap);page.drawRectangle({x,y:y-height,width,height,color:paper});page.drawText(safe(item.author).slice(0,enhanced?30:65),{x:x+12,y:y-22,size:12,font:regular,color:ink});
    if(block){for(const [index,line]of block.entries())page.drawText(line,{x:x+12,y:y-52-index*14,size:11,font:regular,color:ink});if(blockIndex)page.drawText('(lanjutan)',{x:x+12,y:y-height+14,size:8,font:regular,color:muted});}
    else if(item.mime?.startsWith('image/')){const body=await sharp(await storage.get(item.object_key),{limitInputPixels:32_000_000}).rotate().resize({width:1200,height:1600,fit:'inside',withoutEnlargement:true}).jpeg({quality:82}).toBuffer(),image=await doc.embedJpg(body),ratio=Math.min((width-24)/image.width,(height-75)/image.height);page.drawImage(image,{x:x+(width-image.width*ratio)/2,y:y-44-image.height*ratio,width:image.width*ratio,height:image.height*ratio});}
    else{const destination=new URL('/api/v1/media/'+item.id+'/file',process.env.APP_URL||'http://127.0.0.1:3107').href,qr=await doc.embedPng(await QRCode.toBuffer(destination,{width:300,margin:2})),size=Math.min(170,width-30);page.drawImage(qr,{x:x+(width-size)/2,y:y-48-size,width:size,height:size});for(const [index,line]of lines('Pindai untuk memutar. Akses mengikuti izin media dan masa layanan.',width-24,10).entries())page.drawText(line,{x:x+12,y:y-65-size-index*13,size:10,font:regular,color:muted});}
    page.drawText(safe(item.kind).replaceAll('_',' '),{x:x+12,y:y-height+12,size:8,font:regular,color:muted});next();
   }
  }catch{failed.push(item.id);}
 }
 for(const [index,sheet]of doc.getPages().entries()){sheet.drawText('KOMUKUNA / '+(index+1),{x:46,y:25,size:8,font:regular,color:muted});}
 return {body:Buffer.from(await doc.save()),included:selected.length-failed.length,omitted,failed};
}
