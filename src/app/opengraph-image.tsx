import {ImageResponse} from 'next/og';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
export const alt='Kenang Dulu — Rayakan Sekarang, Kenang Selamanya.';
export const size={width:1200,height:630};
export const contentType='image/png';
export default async function OpenGraphImage(){
 const logo=await readFile(path.join(process.cwd(),'public/brand/kenang-dulu-share.png'));
 return new ImageResponse(<div style={{width:'100%',height:'100%',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:46,padding:80,background:'#f8f5f0',color:'#293e2e',border:'16px solid #293e2e'}}><img src={'data:image/png;base64,'+logo.toString('base64')} alt="Kenang Dulu" width={900} height={270} style={{objectFit:'contain'}}/><div style={{display:'flex',fontSize:27,letterSpacing:2}}>Foto · Suara · Video · Ucapan tamu</div></div>,size);
}
