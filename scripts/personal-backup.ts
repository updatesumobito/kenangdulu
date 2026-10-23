import '../src/lib/env';
import {one,rows,dataDir} from '../src/lib/db';
import {mkdir,writeFile,cp} from 'node:fs/promises';
import path from 'node:path';

if(process.env.STORAGE_DRIVER&&process.env.STORAGE_DRIVER!=='local')throw Error('This backup command is for the personal local-storage setup.');
const slug=process.argv[2]||'wahyu-novita',event=await one('SELECT * FROM events WHERE slug=$1 AND personal=true',[slug]);
if(!event)throw Error('Personal event was not found.');
const stamp=new Date().toISOString().replace(/[:.]/g,'-'),destination=path.resolve(process.env.PERSONAL_BACKUP_DIR||'D:/KomukunaVirtualBackups',slug+'-'+stamp);
await mkdir(destination,{recursive:true});
const metadata={event,frames:await rows('SELECT * FROM frames WHERE event_id=$1',[event.id]),revisions:await rows('SELECT * FROM revisions WHERE event_id=$1',[event.id]),guests:await rows('SELECT * FROM guests WHERE event_id=$1',[event.id]),intents:await rows('SELECT * FROM intents WHERE event_id=$1',[event.id]),media:await rows('SELECT * FROM media WHERE event_id=$1',[event.id]),assets:await rows('SELECT * FROM event_assets WHERE event_id=$1',[event.id]),frameAssets:await rows('SELECT * FROM frame_assets WHERE event_id=$1',[event.id])};
await writeFile(path.join(destination,'metadata.json'),JSON.stringify(metadata,null,2));
try{await cp(path.join(dataDir,'private',event.id),path.join(destination,'media'),{recursive:true,force:false,errorOnExist:true})}catch(error:any){if(error.code!=='ENOENT')throw error;}
console.log(JSON.stringify({backupDirectory:destination,mediaRecords:metadata.media.length}));process.exit(0);
