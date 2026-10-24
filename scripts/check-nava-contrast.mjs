// Focused regression for reported unreadable text in Curtain Olive, without guest data or uploads.
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {chromium} from '@playwright/test';
const layout=await readFile('src/app/layout.tsx','utf8');
const files=[...layout.matchAll(/import '\.\/([^']+\.css)'/g)].map(m=>m[1]);
const css=(await Promise.all(files.map(file=>readFile('src/app/'+file,'utf8')))).join('\n');
const fixtures=`
 <header class="guest-app-header"><span class="guest-app-brand" data-check>kenang dulu <small data-check>THE MEMORY ARCHIVE</small></span><button class="guest-theme-toggle" data-check>Tema</button></header>
 <main class="guest-wizard" data-step="name">
  <header class="gw-heading"><h1 data-check>Nava & Akhsan</h1><p data-check>25 Oktober 2026</p><span class="eyebrow" data-check>#akhsanavainlove</span></header>
  <section class="gw-identity"><div class="gw-identity-welcome"><h2>Satu nama, <em data-check>cerita yang istimewa.</em></h2><p data-check>Kenangan kecil yang berarti.</p></div><label class="field"><span data-check>Namamu</span><input value="Tamu" data-check placeholder="Nama tamu"/></label><div class="gw-private-note" data-check>Kenangan ini hanya untuk pengantin.</div></section>
  <div class="gw-ratios"><button aria-pressed="true" data-check>Portrait <small data-check>3:4</small></button><button aria-pressed="false" data-check>Landscape <small data-check>4:3</small></button></div>
  <div class="gw-filters"><button aria-pressed="true" data-check>Original</button><button data-check>Hangat</button></div>
  <div class="gw-camera-idle"><h3 data-check>Senyum terbaikmu.</h3><p data-check>Kamera hanya aktif setelah diizinkan.</p><button data-check>Buka kamera</button></div>
  <label class="gw-file-card"><span class="gw-file-card-icon" data-check>+</span><span><strong data-check>Pilih dari perangkat</strong><small data-check>Foto atau video</small></span><span class="gw-file-card-action" data-check>Pilih</span></label>
  <section class="gw-voice-stage"><strong data-check>00:00</strong><p data-check>Pesan suara untuk pengantin</p><ol class="gw-record-guide"><li><span data-check>1</span><b data-check>Rekam</b></li></ol><span class="gw-result-label" data-check>Rekaman tersimpan</span><span class="gw-processing" data-check>Menyiapkan rekaman</span></section>
  <section class="gw-note"><p data-check>Tuliskan doa hangatmu.</p><textarea data-check>Selamat berbahagia.</textarea><small data-check>Ucapan tersimpan pribadi.</small></section>
  <section class="gw-review-intro"><strong data-check>Sedikit momen, untuk selamanya.</strong></section>
  <section class="gw-send-overlay" open><h2>Menitipkan <em data-check>kenanganmu.</em></h2><small data-check>Mohon tunggu.</small></section>
  <section class="gw-individual-downloads"><h2 data-check>Simpan satu per satu</h2><div class="gw-download-files"><button data-check>Unduh foto <small data-check>250 KB</small></button></div></section>
  <button class="gw-primary" data-check>Lanjut buat kenangan</button><button class="gw-primary" disabled data-check>Belum lengkap</button><button class="outline" data-check>Kembali</button><button class="gw-text-button" data-check>Buat kenangan lagi</button>
  <nav class="gw-bottom-bar"><button data-status="locked" disabled><small data-check>Foto terkunci</small></button><button data-status="available"><small data-check>Suara</small></button><button data-status="current" aria-current="step"><small data-check>Ucapan</small></button></nav>
 </main>
 <section class="guest-experience"><div class="card"><h2 data-check>Galeri kenangan</h2><p class="empty" data-check>Belum ada kiriman</p><a class="text-link" data-check>Lihat kenangan</a><div class="notice error" data-check>Terjadi kesalahan</div><span class="badge" data-check>Menunggu moderasi</span></div></section>
 <main class="couple-dashboard"><section class="couple-premium-hero"><h1 data-check>Nava & Akhsan</h1><p class="couple-hashtag" data-check>#akhsanavainlove</p><a class="couple-hero-jump" data-check>Buka album</a></section><form class="couple-code-form"><label class="field"><span data-check>Kode pengantin</span><input data-check value="Kode akses"/></label><p class="couple-code-hint" data-check>Masukkan kode privat.</p><button class="couple-unlock-button" data-check>Masuk album</button></form><div class="couple-album-toolbar"><button class="couple-filter-button" aria-pressed="true" data-check>Semua</button><button class="couple-filter-button" data-check>Foto</button><button class="couple-download-album" data-check>Unduh album</button></div><article class="couple-memory-card"><p data-check>Ucapan untuk pengantin</p><a class="text-link" data-check>Unduh ucapan</a></article></main>
 <section class="guest-opening" style="position:static"><div class="opening-heading"><h1 data-check>Nava & Akhsan</h1><p class="opening-tagline"><em data-check>Titipkan doa.</em></p><small data-check>25 Oktober 2026</small></div><div class="tutorial-phone"><div class="phone-screen"><h3 data-check>Kenalan dulu</h3><div class="demo-action" data-check>Lanjut</div></div></div><button class="opening-enter" data-check>Mulai buat kenangan</button><nav class="tutorial-steps"><button aria-current="step"><span data-check>1</span><small data-check>Isi nama</small></button></nav></section>
`;
const browser=await chromium.launch({headless:true});
try{
 const page=await browser.newPage();let checked=0;const failures=[];
 for(const width of [390,1280])for(const theme of ['dark','light']){
  await page.setViewportSize({width,height:900});
  await page.setContent(`<html data-guest-theme="${theme}"><head><style>${css}</style><style>*,*::before,*::after{animation:none!important;transition:none!important}.guest-opening,.gw-bottom-bar{position:static!important}</style></head><body><div class="guest-shell guest-page theme-curtain-olive" data-event-slug="nava-akhsan">${fixtures}</div></body></html>`);
  const result=await page.evaluate(()=>{
   const pixel=document.createElement('canvas');pixel.width=pixel.height=1;const ctx=pixel.getContext('2d');
   function rgba(color){ctx.clearRect(0,0,1,1);ctx.fillStyle=color;ctx.fillRect(0,0,1,1);return [...ctx.getImageData(0,0,1,1).data].map((v,i)=>i===3?v/255:v);}
   function over(f,b){return [0,1,2].map(i=>f[i]*f[3]+b[i]*(1-f[3])).concat(1);}
   function background(el){const chain=[];for(let e=el;e;e=e.parentElement)chain.unshift(e);let color=[255,255,255,1];for(const e of chain)color=over(rgba(getComputedStyle(e).backgroundColor),color);return color;}
   function luminance(c){return c.slice(0,3).map(v=>{v/=255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4;}).reduce((n,v,i)=>n+v*[.2126,.7152,.0722][i],0);}
   return [...document.querySelectorAll('[data-check]')].filter(el=>el.getClientRects().length).map(el=>{const style=getComputedStyle(el),bg=background(el),fg=over(rgba(style.color),bg),a=luminance(fg),b=luminance(bg),ratio=(Math.max(a,b)+.05)/(Math.min(a,b)+.05),large=parseFloat(style.fontSize)>=24||parseFloat(style.fontSize)>=18.66&&parseInt(style.fontWeight)>=700;return {text:(el.value||el.textContent).trim().slice(0,65),class:el.className||el.parentElement.className,color:style.color,bg: bg.slice(0,3),ratio:+ratio.toFixed(2),required:large?3:4.5};});
  });
  checked+=result.length;failures.push(...result.filter(r=>r.ratio<r.required).map(r=>({width,theme,...r})));
 }
 if(failures.length)console.log(JSON.stringify(failures,null,2));
 assert.equal(failures.length,0,`${failures.length} text/state samples have insufficient contrast`);
 console.log(`Curtain Olive contrast regression: ${checked} computed text/state samples meet 4.5:1 (3:1 for large text), across light/dark and 390/1280px. Real application styles and feature-state fixtures; no uploads, camera/microphone, QR decode or full E2E.`);
}finally{await browser.close();}
