import {database} from '../src/lib/db';
await database({migrate:true});console.log('Explicit database migrations applied.');process.exit(0);
