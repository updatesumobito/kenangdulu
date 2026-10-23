import {database} from '../src/lib/db';
await database();console.log('Local/database migrations applied.');process.exit(0);
