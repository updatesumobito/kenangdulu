// Server-to-server storage bridge. The Supabase service credential never leaves
// this Edge Function. Browser clients cannot authenticate with the bridge token.
const base=Deno.env.get('SUPABASE_URL')!;
const service=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const bucket='komukuna-private';
const headers={'apikey':service,'Authorization':'Bearer '+service};
const json=(value:unknown,status=200)=>new Response(JSON.stringify(value),{status,headers:{'Content-Type':'application/json','Cache-Control':'no-store'}});
const digest=async(value:string)=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value)))).map(byte=>byte.toString(16).padStart(2,'0')).join('');
function equal(a:string,b:string){if(a.length!==b.length)return false;let different=0;for(let index=0;index<a.length;index++)different|=a.charCodeAt(index)^b.charCodeAt(index);return different===0}
function validKey(value:string){return /^(?:[a-f0-9-]{36}\/|orders\/[a-f0-9-]{36}\/)[a-zA-Z0-9/_\-.]+$/.test(value)&&!value.includes('..')&&value.length<512}

Deno.serve(async request=>{
 try{
  const supplied=request.headers.get('x-komukuna-storage-token');if(!supplied||supplied.length>256)return json({error:'Unauthorized'},401);
  const config=await fetch(base+'/rest/v1/komukuna_runtime_config?id=eq.storage_bridge&select=token_hash',{headers});
  if(!config.ok)return json({error:'Storage configuration unavailable'},503);
  const rows=await config.json();if(!rows[0]||!equal(await digest(supplied),rows[0].token_hash))return json({error:'Unauthorized'},401);
  const operation=request.headers.get('x-storage-operation');
  if(operation==='ensure_bucket'){
   const result=await fetch(base+'/storage/v1/bucket',{method:'POST',headers:{...headers,'Content-Type':'application/json'},body:JSON.stringify({id:bucket,name:bucket,public:false,file_size_limit:50*1024*1024})});
   if(!result.ok){const existing=await fetch(base+'/storage/v1/bucket/'+bucket,{headers});if(!existing.ok)return json({error:'Bucket initialization failed'},502);const detail=await existing.json();if(detail.public)return json({error:'Bucket must remain private'},409);}
   return json({bucket,private:true});
  }
  const key=request.headers.get('x-storage-key')||'';if(!validKey(key))return json({error:'Invalid object key'},400);
  const encoded=key.split('/').map(encodeURIComponent).join('/');
  if(operation==='upload'&&request.method==='POST'){
   const length=Number(request.headers.get('content-length')||0);if(length>50*1024*1024)return json({error:'Object exceeds bucket file limit'},413);
   const result=await fetch(base+'/storage/v1/object/'+bucket+'/'+encoded,{method:'POST',headers:{...headers,'Content-Type':request.headers.get('content-type')||'application/octet-stream','x-upsert':'true','Cache-Control':'no-cache'},body:request.body});
   if(!result.ok)return json({error:'Storage upload failed',status:result.status},502);return json({stored:true});
  }
  if(operation==='sign'){
   const result=await fetch(base+'/storage/v1/object/sign/'+bucket+'/'+encoded,{method:'POST',headers:{...headers,'Content-Type':'application/json'},body:JSON.stringify({expiresIn:60})});
   if(!result.ok)return json({error:'Object unavailable',status:result.status},404);
   const signed=await result.json(),relative=signed.signedURL||signed.signedUrl;return json({url:base+'/storage/v1'+relative,expiresIn:60});
  }
  if(operation==='remove'){
   const result=await fetch(base+'/storage/v1/object/'+bucket,{method:'DELETE',headers:{...headers,'Content-Type':'application/json'},body:JSON.stringify({prefixes:[key]})});
   if(!result.ok)return json({error:'Storage removal failed',status:result.status},502);return json({removed:true});
  }
  return json({error:'Unsupported operation'},400);
 }catch{return json({error:'Storage operation failed'},500)}
});
