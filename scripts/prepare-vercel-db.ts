import '../src/lib/env';
import postgres from 'postgres';
import {readFile,writeFile} from 'node:fs/promises';
const region=(await readFile('.data/supabase-region.txt','utf8')).trim();
if(!/^[a-z]{2}-[a-z]+-\d$/.test(region))throw Error('Verified database region is required.');
const direct=new URL(process.env.DATABASE_URL!),project=new URL(process.env.SUPABASE_URL!).hostname.split('.')[0];
let saved=false;
for(const index of [0,1]){
 const candidate=new URL(direct);candidate.hostname=`aws-${index}-${region}.pooler.supabase.com`;candidate.port='6543';candidate.username=decodeURIComponent(direct.username)+'.'+project;
 const sql=postgres(candidate.href,{max:1,prepare:false,connect_timeout:8,idle_timeout:1});
 try{const result=await sql.unsafe('SELECT count(*)::int AS count FROM public.migrations');if(Number(result[0].count)<12)throw Error('Unexpected migration history');let lines=(await readFile('.env.local','utf8')).split(/\r?\n/).filter(line=>!line.startsWith('VERCEL_DATABASE_URL=')&&line!=='');lines.push('VERCEL_DATABASE_URL='+candidate.href);await writeFile('.env.local',lines.join('\n')+'\n');console.log(JSON.stringify({poolerHost:candidate.hostname,migrations:result[0].count,preparedStatements:false}));saved=true;break;}catch(error:any){console.log(JSON.stringify({poolerHost:candidate.hostname,error:error.code||'CONNECTION_FAILED'}));}finally{await sql.end({timeout:1})}
}
if(!saved)throw Error('Could not establish the project pooler connection. No deployment database URL was saved.');
