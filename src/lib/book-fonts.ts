import fontkit from '@pdf-lib/fontkit';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
import type {PDFDocument,PDFFont,PDFPage,PDFPageDrawTextOptions} from 'pdf-lib';
const files=['NotoSans-Regular.ttf','NotoSansArabic-Regular.ttf','NotoSansCJKsc-Regular.otf'];
let sources:Promise<Buffer[]>|undefined;
export async function bookFonts(doc:PDFDocument){
 doc.registerFontkit(fontkit);const bytes=await(sources??=Promise.all(files.map(file=>readFile(path.join(process.cwd(),'public/fonts/memory-book',file))))),fonts=await Promise.all(bytes.map(body=>doc.embedFont(body,{subset:true}))),coverage=fonts.map(font=>new Set(font.getCharacterSet())),missing=new Set<string>();
 function fontFor(character:string){const point=character.codePointAt(0)!;const index=coverage.findIndex(set=>set.has(point));if(index<0){missing.add(character);return {font:fonts[0],text:'□'};}return {font:fonts[index],text:character};}
 function runs(text:string){const result:{font:PDFFont;text:string}[]=[];for(const character of Array.from(text)){const selected=fontFor(character),last=result.at(-1);if(last?.font===selected.font)last.text+=selected.text;else result.push(selected);}return result;}
 const width=(text:string,size:number)=>runs(text).reduce((sum,run)=>sum+run.font.widthOfTextAtSize(run.text,size),0);
 function draw(page:PDFPage,text:string,options:PDFPageDrawTextOptions){let x=options.x||0;for(const run of runs(text)){page.drawText(run.text,{...options,x,font:run.font});x+=run.font.widthOfTextAtSize(run.text,options.size||12);}}
 return {regular:fonts[0],width,draw,missing};
}
