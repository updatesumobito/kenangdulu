import {rows} from '../src/lib/db';
import {uid,passwordHash} from '../src/lib/auth';
const email=process.env.ADMIN_EMAIL,password=process.env.ADMIN_PASSWORD;
if(!email||!password||password.length<16)throw Error('Set ADMIN_EMAIL and ADMIN_PASSWORD (minimum 16 characters) in the trusted operator environment.');
if((await rows('SELECT 1 FROM users WHERE email=$1',[email.toLowerCase()])).length)throw Error('Account already exists; use an audited superadmin role change.');
await rows("INSERT INTO users(id,email,password_hash,name,role) VALUES($1,$2,$3,'Administrator','superadmin')",[uid(),email.toLowerCase(),passwordHash(password)]);
console.log('Administrator created; no credentials printed.');process.exit(0);
