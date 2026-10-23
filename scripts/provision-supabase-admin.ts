import '../src/lib/env';
import {createClient} from '@supabase/supabase-js';
import {rows,one,json} from '../src/lib/db';
import {uid} from '../src/lib/auth';

const email=process.env.ADMIN_EMAIL?.trim().toLowerCase(),password=process.env.ADMIN_PASSWORD;
if(!email||!password)throw Error('Supply ADMIN_EMAIL and ADMIN_PASSWORD in the operator shell.');
const client=createClient(process.env.SUPABASE_URL!,process.env.SUPABASE_PUBLISHABLE_KEY||process.env.SUPABASE_ANON_KEY!,{auth:{persistSession:false,autoRefreshToken:false}});
const {data,error}=await client.auth.signInWithPassword({email,password});
let remote=data.user;
let needsConfirmation=false;
if(error){
 const result=await client.auth.signUp({email,password,options:{data:{display_name:'Administrator Komukuna'},emailRedirectTo:new URL('/masuk',process.env.APP_URL).href}});
 if(result.error||!result.data.user)throw Error('Supabase admin registration failed: '+(result.error?.code||'UNKNOWN'));
 if(!result.data.user.identities?.length)throw Error('Account already exists. Confirm its email and supply its existing password.');
 remote=result.data.user;needsConfirmation=!result.data.session;
}
if(!remote)throw Error('Supabase admin identity is unavailable.');
const existing=await one('SELECT * FROM users WHERE email=$1 OR auth_provider_id=$2',[email,remote.id]);
if(existing?.auth_provider_id&&existing.auth_provider_id!==remote.id)throw Error('Existing application identity does not match provider.');
const id=existing?.id||uid();
await rows("INSERT INTO users(id,email,password_hash,name,role,auth_provider_id) VALUES($1,$2,'provider:supabase','Administrator Komukuna','superadmin',$3) ON CONFLICT(id) DO UPDATE SET role='superadmin',auth_provider_id=EXCLUDED.auth_provider_id",[id,email,remote.id]);
await rows('INSERT INTO audit(id,actor_id,action,detail) VALUES($1,$2,$3,$4)',[uid(),id,'admin.bootstrap',json({provider:'supabase',needsConfirmation})]);
console.log(JSON.stringify({administratorProvisioned:true,needsEmailConfirmation:needsConfirmation}));
await client.auth.signOut();process.exit(0);
