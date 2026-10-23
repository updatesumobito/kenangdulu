import {existsSync} from 'node:fs';
// Standalone tsx commands need the same local configuration as Next.js.
// Node preserves environment values supplied by the operator's shell.
if(existsSync('.env.local'))process.loadEnvFile('.env.local');

if(process.env.VERCEL&&!process.env.APP_URL){const host=process.env.VERCEL_PROJECT_PRODUCTION_URL||process.env.VERCEL_URL;if(host)process.env.APP_URL='https://'+host;}
