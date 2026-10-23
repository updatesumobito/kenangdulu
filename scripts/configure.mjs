import fs from 'node:fs';
const p=JSON.parse(fs.readFileSync('package.json','utf8').replace(/^\uFEFF/,''));
p.scripts.dev='next dev --webpack --hostname 0.0.0.0 --port 3107';
p.scripts.start='node scripts/runtime.mjs start';
p.scripts.build='node scripts/runtime.mjs build';
p.scripts['test:e2e:smoke']='playwright test --grep @smoke';
p.scripts['test:fixtures']='tsx scripts/fixtures.ts';
p.scripts['test:rls']='tsx tests/rls.ts';
fs.writeFileSync('package.json',JSON.stringify(p,null,2)+'\n');
