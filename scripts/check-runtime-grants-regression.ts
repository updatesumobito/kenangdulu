// Regression for the existing private backend role missing access to new module tables.
import assert from 'node:assert/strict';
import {PGlite} from '@electric-sql/pglite';
import {readFile,readdir} from 'node:fs/promises';
const db=new PGlite();try{
 await db.exec('CREATE ROLE komukuna_backend; CREATE ROLE anon; CREATE ROLE authenticated;');
 for(const file of (await readdir('infra/migrations')).filter(f=>f.endsWith('.sql')).sort())await db.exec(await readFile('infra/migrations/'+file,'utf8'));
 await db.exec(await readFile('infra/supabase/runtime_permissions.sql','utf8'));
 await db.exec('SET ROLE komukuna_backend;');
 await db.query('SELECT id FROM frame_revisions LIMIT 1');await db.query('SELECT id FROM notification_outbox LIMIT 1');await db.query('SELECT id FROM worker_health LIMIT 1');
 await assert.rejects(()=>db.query('UPDATE credit_ledger SET delta=1'),/permission denied/);
 await assert.rejects(()=>db.query("UPDATE frame_revisions SET name='changed'"),/permission denied/);
 await db.exec('RESET ROLE; SET ROLE anon;');await assert.rejects(()=>db.query('SELECT * FROM notification_outbox'),/permission denied/);
 await db.exec('RESET ROLE; SET ROLE authenticated;');await assert.rejects(()=>db.query('SELECT * FROM frame_revisions'),/permission denied/);
 console.log('Private-role regression completed: backend reads new tables; immutable history denies UPDATE; anon/authenticated cannot read private module tables. In-memory PostgreSQL only.');
}finally{await db.close();}
