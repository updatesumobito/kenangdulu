import {spawn} from 'node:child_process';
const env={...process.env,NODE_ENV:'development',VERCEL:'',DATABASE_URL:'',DATABASE_AUTO_MIGRATE:'1',DATA_DIR:'.data/prd-preview',AUTH_PROVIDER:'local',STORAGE_DRIVER:'local',APP_MODE:'platform',APP_URL:'http://127.0.0.1:3117',LOCAL_PREVIEW:'1',KV_PREVIEW_DIST_DIR:'.next-prd-preview',ENABLE_DEMO:'true',WORKER_EMBEDDED:'1',NOTIFICATIONS_ENABLED:'false',VENDOR_CREDITS_ENABLED:'false',RETENTION_AUTO_PURGE_ENABLED:'false'};
const seed=spawn(process.execPath,['node_modules/tsx/dist/cli.mjs','scripts/seed.ts'],{env,stdio:'inherit',windowsHide:true});
const status=await new Promise(resolve=>{seed.on('exit',resolve);seed.on('error',error=>{console.error(error.message);resolve(1);});});if(status!==0)process.exit(Number(status)||1);
console.log('Isolated local preview: http://127.0.0.1:3117 — demo data only, local DB/storage, no remote migrations or messages.');
const next=spawn(process.execPath,['node_modules/next/dist/bin/next','dev','--webpack','--hostname','127.0.0.1','--port','3117'],{env,stdio:'inherit',windowsHide:true});
for(const signal of ['SIGINT','SIGTERM'])process.on(signal,()=>next.kill(signal));next.on('exit',code=>process.exit(code||0));
