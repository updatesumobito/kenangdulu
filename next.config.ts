import type { NextConfig } from 'next';
const storageOrigin=process.env.SUPABASE_URL?new URL(process.env.SUPABASE_URL).origin:'';
const config: NextConfig = {
  serverExternalPackages: ['@electric-sql/pglite','sharp','postgres','ffmpeg-static','@ffprobe-installer/ffprobe','archiver'],
  distDir: process.env.VERCEL?'.next':process.env.KV_PRODUCTION_BUILD==='1'?'.next-production':'.next',
  outputFileTracingIncludes:{'/*':['./infra/migrations/*.sql'],'/api/v1/*':['./node_modules/ffmpeg-static/ffmpeg','./node_modules/@ffprobe-installer/**/ffprobe']},
  allowedDevOrigins: ['127.0.0.1','localhost'],
  async headers(){return [{source:'/:path*',headers:[
    {key:'X-Content-Type-Options',value:'nosniff'},
    {key:'Referrer-Policy',value:'no-referrer'},
    {key:'X-Frame-Options',value:'DENY'},
    {key:'Permissions-Policy',value:'camera=(self), microphone=(self), geolocation=()'},
    {key:'Content-Security-Policy',value:`default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' blob: data: ${storageOrigin}; media-src 'self' blob: ${storageOrigin}; font-src 'self'; connect-src 'self' ${storageOrigin}; frame-ancestors 'none'; base-uri 'self'; object-src 'none'`}
  ]}]}
};
export default config;
