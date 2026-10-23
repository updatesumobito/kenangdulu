import '../src/lib/env';
import {processJobs} from '../src/lib/worker';
if(!process.env.DATABASE_URL)throw Error('A separate worker requires DATABASE_URL. Local PGlite uses the embedded web worker.');
let running=true;
process.on('SIGINT',()=>{running=false});process.on('SIGTERM',()=>{running=false});
console.log('Komukuna database worker started.');
while(running){try{await processJobs()}catch(err:any){console.error('Worker cycle failed:',err.code||'PROCESSING_ERROR')}if(running)await new Promise(resolve=>setTimeout(resolve,3000));}
console.log('Komukuna worker stopped after completing its current cycle.');process.exit(0);
