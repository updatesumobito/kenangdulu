import sharp from 'sharp';
import {mkdir,writeFile} from 'node:fs/promises';

// Preserve the supplied artwork; trim transparent margins and export web sizes.
const sources={
 light:['01_34_25','01_34_27','01_34_29','01_34_31','01_34_33'],
 dark:['03_17_35','03_17_36','03_17_37','03_17_38','03_17_39'],
};
const variants=['stacked','horizontal','signature','mark','wordmark'];
await mkdir('public/brand',{recursive:true});
for(const [theme,times] of Object.entries(sources)){
 for(let i=0;i<variants.length;i++){
  const source=`logo/ChatGPT Image Oct 24, 2026, ${times[i]} PM-${i+1}.png`;
  const image=sharp(source).trim({threshold:10});
  await image.clone().resize({width:i===0||i===3?512:1000,withoutEnlargement:true}).webp({lossless:true}).toFile(`public/brand/kenang-dulu-${variants[i]}-${theme}.webp`);
  if(theme==='light'&&i===2)await image.clone().resize({width:1000}).png().toFile('public/brand/kenang-dulu-share.png');
 }
}
async function icon(theme,size){
 const source=`logo/ChatGPT Image Oct 24, 2026, ${sources[theme][3]} PM-4.png`;
 const padding=Math.max(2,Math.round(size*.1));
 const mark=await sharp(source).trim({threshold:10}).resize(size-padding*2,size-padding*2,{fit:'contain',background:'#00000000'}).png().toBuffer();
 return sharp({create:{width:size,height:size,channels:4,background:theme==='light'?'#f8f5f0':'#1d2320'}}).composite([{input:mark,left:padding,top:padding}]).png().toBuffer();
}
for(const theme of ['light','dark'])await writeFile(`public/brand/favicon-${theme}.png`,await icon(theme,64));
await writeFile('src/app/apple-icon.png',await icon('light',180));
const sizes=[16,32,48,256],frames=await Promise.all(sizes.map(size=>icon('light',size)));
const header=Buffer.alloc(6+16*frames.length);header.writeUInt16LE(1,2);header.writeUInt16LE(frames.length,4);
let offset=header.length;
frames.forEach((frame,i)=>{const at=6+i*16;header[at]=sizes[i]===256?0:sizes[i];header[at+1]=header[at];header.writeUInt16LE(1,at+4);header.writeUInt16LE(32,at+6);header.writeUInt32LE(frame.length,at+8);header.writeUInt32LE(offset,at+12);offset+=frame.length});
await writeFile('src/app/favicon.ico',Buffer.concat([header,...frames]));
console.log('Prepared 10 themed logos, share artwork, light/dark favicons, ICO, and Apple icon.');
