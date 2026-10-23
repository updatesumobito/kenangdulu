import fs from 'node:fs';
const edit=(name,fn)=>{const p='src/components/'+name+'.tsx';fs.writeFileSync(p,fn(fs.readFileSync(p,'utf8')))};
edit('checkout',s=>s.replace("api('catalog/plans').then(setPlans).catch(e=>setError(e.message));setSelected(new URLSearchParams(location.search).get('paket')||'mini')","api('catalog/plans').then(p=>{setPlans(p);setSelected(new URLSearchParams(location.search).get('paket')||'mini')}).catch(e=>setError(e.message))"));
for(const name of ['gallery','workspace'])edit(name,s=>s.replaceAll('useEffect(()=>{load()},[load])','useEffect(()=>{const t=setTimeout(()=>void load(),0);return()=>clearTimeout(t)},[load])').replaceAll('useEffect(()=>{reload()},[reload])','useEffect(()=>{const t=setTimeout(()=>void reload(),0);return()=>clearTimeout(t)},[reload])'));
edit('guest-experience',s=>s.replace("[checking,setChecking]=useState(true)","[checking,setChecking]=useState(mode!=='gallery')").replace("if(mode==='gallery'){setChecking(false);return}","if(mode==='gallery')return;"));
edit('live-wall',s=>s.replace("const t=location.hash.slice(1);setToken(t);", "const t=location.hash.slice(1);").replace("setData(d);setError('')","setData(d);setToken(t);setError('')"));
for(const name of ['guest-camera','guest-recorder'])edit(name,s=>{
 s=s.replaceAll('setBlob(', 'setResult(');
 s=s.replace("useEffect(()=>{if(!blob){setPreview('');return}const u=URL.createObjectURL(blob);setPreview(u);return()=>URL.revokeObjectURL(u)},[blob]);", "const previewRef=useRef('');function setResult(b:Blob|null){if(previewRef.current)URL.revokeObjectURL(previewRef.current);previewRef.current=b?URL.createObjectURL(b):'';setPreview(previewRef.current);setBlob(b)}useEffect(()=>()=>{if(previewRef.current)URL.revokeObjectURL(previewRef.current)},[]);");
 return s;
});
