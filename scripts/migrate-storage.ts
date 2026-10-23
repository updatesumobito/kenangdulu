import '../src/lib/env';
import {readdir,stat} from 'node:fs/promises';
import path from 'node:path';
import {ensureBucket,putCloudFile} from '../src/lib/cloud-storage';

const source=path.resolve(process.env.LOCAL_MEDIA_SOURCE||process.env.DATA_DIR||'.data','private');
await ensureBucket();let files=0,bytes=0;
async function walk(directory:string){let entries;try{entries=await readdir(directory,{withFileTypes:true})}catch(error:any){if(error.code==='ENOENT')return;throw error;}for(const entry of entries){const file=path.join(directory,entry.name);if(entry.isDirectory())await walk(file);else if(!entry.name.endsWith('.tmp')){const key=path.relative(source,file).replaceAll('\\','/'),details=await stat(file);await putCloudFile(key,file,'application/octet-stream');files++;bytes+=details.size;}}}
await walk(source);console.log(JSON.stringify({privateBucketReady:true,copiedFiles:files,copiedBytes:bytes,localFilesPreserved:true}));process.exit(0);
