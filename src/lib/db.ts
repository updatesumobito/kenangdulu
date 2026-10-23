import './env';
import { PGlite } from '@electric-sql/pglite';
import postgres from 'postgres';
import { mkdir, readFile,readdir } from 'node:fs/promises';
import path from 'node:path';
export type Row = Record<string, any>;
export interface DB { query<T extends Row = Row>(sql:string, params?:any[]):Promise<{rows:T[]}>; exec(sql:string):Promise<any>; transaction<T>(fn:(tx:DB)=>Promise<T>):Promise<T> }
const g=globalThis as typeof globalThis & {kvdb?:Promise<DB>};
function decodeJson(value:any):any {
 if(typeof value==='string'&&/^[\[{]/.test(value.trim())){try{return decodeJson(JSON.parse(value))}catch{return value}}
 if(Array.isArray(value))return value.map(decodeJson);
 if(value&&typeof value==='object')return Object.fromEntries(Object.entries(value).map(([key,item])=>[key,decodeJson(item)]));
 return value;
}
export const dataDir=path.resolve(process.env.VERCEL?'/tmp/komukuna-virtual':process.env.DATA_DIR||'.data');
async function open():Promise<DB>{
 await mkdir(dataDir,{recursive:true});
 let db:DB;
 if(process.env.DATABASE_URL){
  // Application callers pass JSON text, while existing rows may contain JSON
  // encoded as a JSON string. Keep writes single-encoded and read both shapes.
  const jsonType={to:3802,from:[114,3802],serialize:(value:any)=>typeof value==='string'?value:JSON.stringify(value),parse:(value:string)=>decodeJson(JSON.parse(value))};
  const sql=postgres(process.env.DATABASE_URL,{max:process.env.VERCEL?2:5,prepare:false,idle_timeout:20,connect_timeout:15,types:{json:jsonType}});
  const wrap=(s:any):DB=>({query:async(q,p=[])=>({rows:await s.unsafe(q,p)}),exec:(q)=>s.unsafe(q),transaction:(fn)=>s.begin((t:any)=>fn(wrap(t)))});
  db=wrap(sql);
 }else if(process.env.VERCEL)throw Error('Vercel requires a configured external DATABASE_URL.');
 else db=new PGlite(path.join(dataDir,'postgres')) as unknown as DB;
 if(process.env.DATABASE_AUTO_MIGRATE!=='0')await db.exec('CREATE TABLE IF NOT EXISTS migrations (name text PRIMARY KEY, applied_at timestamptz DEFAULT now())');
 for(const file of (await readdir(path.join(process.cwd(),'infra/migrations'))).filter(f=>f.endsWith('.sql')).sort()){
  const name=file.replace(/\.sql$/,'');if((await db.query('SELECT 1 FROM migrations WHERE name=$1',[name])).rows.length)continue;
  if(process.env.DATABASE_AUTO_MIGRATE==='0')throw Error('Database migration required: '+name+'. Apply it with the deployment MCP/owner connection before starting the app.');
  await db.transaction(async tx=>{await tx.exec(await readFile(path.join(process.cwd(),'infra/migrations',file),'utf8'));await tx.query('INSERT INTO migrations(name) VALUES($1)',[name]);});
 }
 return db;
}
export const database=()=>g.kvdb??=(open());
export async function rows<T extends Row=Row>(sql:string,params:any[]=[],db?:DB){return (await (db||await database()).query<T>(sql,params)).rows;}
export async function one<T extends Row=Row>(sql:string,params:any[]=[],db?:DB){return (await rows<T>(sql,params,db))[0];}
export const json=(v:any)=>JSON.stringify(v);
