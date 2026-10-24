import type { NextConfig } from 'next';
const storageOrigins=new Set<string>();
if(process.env.SUPABASE_URL)storageOrigins.add(new URL(process.env.SUPABASE_URL).origin);
if(process.env.R2_ENDPOINT){const endpoint=new URL(process.env.R2_ENDPOINT);storageOrigins.add(endpoint.origin);if(process.env.R2_BUCKET_NAME)storageOrigins.add(endpoint.protocol+'//'+process.env.R2_BUCKET_NAME+'.'+endpoint.host);}
const storageOrigin=[...storageOrigins].join(' ');
const config: NextConfig = {
  serverExternalPackages: ['@electric-sql/pglite','sharp','postgres','ffmpeg-static','@ffprobe-installer/ffprobe','archiver'],
  distDir: process.env.KV_PREVIEW_DIST_DIR|| (process.env.VERCEL?'.next':process.env.KV_PRODUCTION_BUILD==='1'?'.next-production':'.next'),
  outputFileTracingIncludes:{'/*':['./infra/migrations/*.sql','./public/fonts/memory-book/*'],'/api/v1/*':['./node_modules/ffmpeg-static/ffmpeg','./node_modules/@ffprobe-installer/linux-x64/**/*']},
  allowedDevOrigins: ['127.0.0.1','localhost'],
  async redirects(){return [
    {source:'/e/wahyu-novita/:path*',destination:'/wahyu-novita/:path*',permanent:true},
    {source:'/u/wahyu-novita/:path*',destination:'/wahyu-novita/:path*',permanent:true},
    {source:'/e/nava-akhsan/:path*',destination:'/nava-akhsan/:path*',permanent:true},
    {source:'/u/nava-akhsan/:path*',destination:'/nava-akhsan/:path*',permanent:true}
  ]},
  async rewrites(){return {beforeFiles:[
    {source:'/wahyu-novita/:path*',destination:'/e/wahyu-novita/:path*'},
    {source:'/nava-akhsan/:path*',destination:'/e/nava-akhsan/:path*'}
  ]}},
  async headers(){return [{source:'/:path*',headers:[
    {key:'X-Content-Type-Options',value:'nosniff'},
    {key:'Referrer-Policy',value:'no-referrer'},
    {key:'X-Frame-Options',value:'DENY'},
    {key:'Permissions-Policy',value:'camera=(self), microphone=(self), geolocation=()'},
    {key:'Content-Security-Policy',value:`default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' blob: data: ${storageOrigin}; media-src 'self' blob: ${storageOrigin}; font-src 'self'; connect-src 'self' ${storageOrigin}; frame-ancestors 'none'; base-uri 'self'; object-src 'none'`}
  ]}]}
};
export default config;
