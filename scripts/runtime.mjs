import {spawn} from 'node:child_process';
const mode=process.argv[2]||'start';
const args=mode==='build'?['build','--webpack']:['start','--hostname',process.env.LOCAL_PREVIEW==='1'?'127.0.0.1':'0.0.0.0','--port',process.env.PORT||'3107'];
const child=spawn(process.execPath,['node_modules/next/dist/bin/next',...args],{stdio:'inherit',env:{...process.env,KV_PRODUCTION_BUILD:'1'}});child.on('exit',code=>process.exit(code??1));
