import {rows,json} from '../src/lib/db';
import {planSeeds,presetFrame} from '../src/lib/domain';
for(const [id,name,price,config] of planSeeds)await rows('INSERT INTO plans(id,name,price,config) VALUES($1,$2,$3,$4) ON CONFLICT(id) DO NOTHING',[id,name,price,json(config)]);
for(const [id,name,count] of [['10000000-0000-4000-8000-000000000001','Editorial Four',4],['10000000-0000-4000-8000-000000000002','Little Polaroid',1]] as const)await rows('INSERT INTO templates(id,name,schema) VALUES($1,$2,$3) ON CONFLICT(id) DO NOTHING',[id,name,json(presetFrame(count))]);
console.log('Four base SKUs and two global layout templates inserted where absent; existing catalog preserved. No demo users or events created.');process.exit(0);
