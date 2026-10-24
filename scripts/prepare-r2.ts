import '../src/lib/env';
import {randomUUID} from 'node:crypto';
import {HeadBucketCommand} from '@aws-sdk/client-s3';
import {r2Config,r2Client,putR2,getR2,removeR2,signR2} from '../src/lib/r2-storage';

// Explicit --probe writes and removes one isolated object; it never modifies event files.
const config=r2Config();
await r2Client().send(new HeadBucketCommand({Bucket:config.bucket}));
console.log(JSON.stringify({bucketAccessible:true,bucket:config.bucket}));
if(process.argv.includes('--probe')){
 const key='_checks/'+randomUUID(),payload=Buffer.from('Kenang Dulu R2 private storage check');
 try{
  await putR2(key,payload,'text/plain');
  const object=await getR2(key),body=Buffer.from(await object.Body!.transformToByteArray());
  if(!body.equals(payload))throw Error('R2 read-back mismatch.');
  const signed=await fetch(await signR2(key));
  if(!signed.ok||!Buffer.from(await signed.arrayBuffer()).equals(payload))throw Error('R2 signed URL check failed.');
  const privateUrl=new URL(key,config.endpoint+'/'+config.bucket+'/'),anonymous=await fetch(privateUrl);
  if(anonymous.ok)throw Error('R2 object is accessible without authorization.');
  console.log(JSON.stringify({writeReadVerified:true,signedReadVerified:true,anonymousS3ReadDenied:true}));
 }finally{await removeR2(key)}
}
