import {database,rows,json} from '../src/lib/db';
import {uid,passwordHash} from '../src/lib/auth';
import {planSeeds,defaultSettings,presetFrame} from '../src/lib/domain';
if(process.env.NODE_ENV==='production')throw Error('Development fixtures are forbidden in production');
if(process.env.DATABASE_URL&&process.env.ALLOW_DEMO_SEED!=='1')throw Error('Refusing demo seed on an external database. Use an isolated local DATA_DIR, or explicitly opt in with ALLOW_DEMO_SEED=1 for a disposable test database.');
await database();
for(const [id,name,price,config] of planSeeds)await rows('INSERT INTO plans(id,name,price,config) VALUES($1,$2,$3,$4) ON CONFLICT(id) DO NOTHING',[id,name,price,json(config)]);
for(const [id,name,count] of [['10000000-0000-4000-8000-000000000001','Editorial Four',4],['10000000-0000-4000-8000-000000000002','Little Polaroid',1]] as const)await rows('INSERT INTO templates(id,name,schema) VALUES($1,$2,$3) ON CONFLICT(id) DO NOTHING',[id,name,json(presetFrame(count))]);
const users:any={};
for(const [key,role,name] of [['admin','superadmin','Admin Komukuna'],['designer','designer','Desainer Komukuna'],['buyer','buyer','Nadia'],['partner','partner','Studio Cerita'],['partner-b','partner','Partner B'],['operator','operator','Operator Acara']]){
 const email=key+'@demo.komukuna.test';const u=(await rows('SELECT id FROM users WHERE email=$1',[email]))[0];const id=u?.id||uid();users[key]=id;
 if(!u)await rows('INSERT INTO users(id,email,password_hash,name,role) VALUES($1,$2,$3,$4,$5)',[id,email,passwordHash('KomukunaDemo2026!'),name,role]);
}
for(const key of ['partner','partner-b']){if(!(await rows('SELECT 1 FROM organizations WHERE owner_id=$1',[users[key]])).length)await rows('INSERT INTO organizations(id,owner_id,name) VALUES($1,$2,$3)',[uid(),users[key],key==='partner'?'Studio Cerita':'Partner B']);}
for(const [index,slug,plan,channel] of [[0,'demo-mini','mini','DIRECT_MANAGED'],[1,'demo-classic','classic','PARTNER_SELF_SERVICE'],[2,'demo-signature','signature','PARTNER_SELF_SERVICE'],[3,'demo-partner-b','classic','PARTNER_SELF_SERVICE']] as const){
 if((await rows('SELECT 1 FROM events WHERE slug=$1',[slug])).length)continue;
 const p=(await rows('SELECT * FROM plans WHERE id=$1',[plan]))[0],eventId=uid(),orderId=uid(),partner=index===3?'partner-b':'partner',org=(await rows('SELECT id FROM organizations WHERE owner_id=$1',[users[partner]]))[0];
 const start=new Date(Date.now()-86400000).toISOString(),end=new Date(Date.now()+7*86400000).toISOString();
 const brief={name:index===0?'Nadia & Arga':index===2?'A Celebration of Us':'Rani & Dimas',contact:'demo@example.test',startAt:start,endAt:end,timezone:'Asia/Jakarta',location:'Komukuna Studio',notes:'Fixture pengembangan, tanpa pembayaran asli.'};
 await rows("INSERT INTO orders(id,user_id,org_id,channel,plan_id,amount,snapshot,brief,status,fulfillment,designer_id) VALUES($1,$2,$3,$4,$5,$6,$7,$8,'paid','delivered',$9)",[orderId,channel==='DIRECT_MANAGED'?users.buyer:users[partner],channel==='DIRECT_MANAGED'?null:org.id,channel,plan,p.price,json(p.config),json(brief),users.designer]);
 const settings=defaultSettings(p.config),frames=p.config.frames?[{id:uid(),name:'Editorial',schema:presetFrame(4)}]:[];
 await rows("INSERT INTO events(id,order_id,org_id,customer_id,channel,slug,name,start_at,end_at,status,snapshot,settings,published,revision) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,'live',$10,$11,$12,1)",[eventId,orderId,channel==='DIRECT_MANAGED'?'00000000-0000-4000-8000-000000000001':org.id,channel==='DIRECT_MANAGED'?users.buyer:null,channel,slug,brief.name,start,end,json(p.config),json(settings),json({settings,frames})]);
 for(const f of frames)await rows('INSERT INTO frames(id,event_id,name,schema) VALUES($1,$2,$3,$4)',[f.id,eventId,f.name,json(f.schema)]);
 await rows('INSERT INTO revisions VALUES($1,$2,1,$3,$4,now())',[uid(),eventId,json(settings),json(frames)]);
 if(index===1)await rows('INSERT INTO event_staff VALUES($1,$2,$3)',[eventId,users.operator,json(['media_moderate','live_wall_view'])]);
}
console.log('DEVELOPMENT ONLY seeded: admin/designer/buyer/partner/partner-b/operator@demo.komukuna.test; password KomukunaDemo2026!');process.exit(0);
