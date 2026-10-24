// Focused regression for the reported desktop mismatch with Wahyu–Novita.
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {chromium} from '@playwright/test';
const layout=await readFile('src/app/layout.tsx','utf8');
const css=(await Promise.all([...layout.matchAll(/import '\.\/([^']+\.css)'/g)].map(m=>readFile('src/app/'+m[1],'utf8')))).join('\n');
// Identical copy isolates layout from expected differences in names/date/hashtag.
const markup=`
 <header class="guest-app-header"><a class="guest-app-brand"><span class="brand-logo"></span></a><div class="guest-header-end"><span class="guest-header-event">Nama & Pasangan</span><button class="guest-theme-toggle">Tema</button></div></header>
 <section class="guest-opening"><header class="tutorial-top"><span class="brand-logo"></span><button class="guest-theme-toggle">Tema</button></header><div class="opening-composition"><div class="opening-heading"><p class="eyebrow">SELAMAT DATANG DI HARI BAHAGIA KAMI</p><h1>Nama & Pasangan</h1><p class="opening-tagline">Simpan momen.<br/><em>Titipkan doa.</em></p><small>25 Oktober 2026 · #hariberbahagia</small><p class="opening-intro">Foto, suara, dan doa terbaikmu.</p></div><div class="tutorial-area"><div class="tutorial-scene"><div class="tutorial-phone-fit"><div class="tutorial-phone"><div class="phone-screen"><h3>Kenalan dulu</h3><div class="demo-action">Lanjut</div></div></div></div></div><div class="tutorial-explanation"><h2>Kenalan dulu, yuk.</h2><p>Isi nama sebelum mulai.</p></div><nav class="tutorial-steps"><button><span>1</span><small>Isi nama</small></button></nav></div></div><div class="opening-actions"><div class="opening-invitation"><button class="opening-enter">Mulai buat kenangan</button><small>Kamera hanya aktif saat dipilih.</small></div><span class="opening-actions-note">Kenangan kecil, berarti besar.</span></div><footer>TAKE A MOMENT. MAKE A MEMORY.</footer></section>
 <main class="guest-wizard" data-step="name"><header class="gw-heading"><div class="gw-heading-top"><span class="eyebrow">Nama & Pasangan</span><span class="gw-step-count">01 / 06</span></div><h1>Biar kami tahu, kenangan ini dari siapa?</h1><p>Namamu menemani setiap senyum dan doa.</p></header><form class="gw-identity"><div class="gw-identity-welcome"><h2>Satu nama,<br/><em>cerita yang istimewa.</em></h2><p>Tuliskan namamu.</p></div><label class="field"><span>Namamu</span><input placeholder="Namamu"/></label><label class="gw-consent"><input type="checkbox"/><span>Saya setuju kenangan disimpan pribadi.</span></label></form><section class="gw-capture"><div class="gw-ratios"><button>Portrait</button><button>Landscape</button></div><label class="gw-file-card"><span class="gw-file-card-icon">+</span><span><strong>Pilih dari perangkat</strong><small>Foto atau video</small></span><span class="gw-file-card-action">Pilih</span></label></section><section class="gw-voice-stage"><h2>Pesan suara</h2><button>Rekam</button></section><section class="gw-note"><h2>Ucapan</h2><textarea>Doa hangat.</textarea></section><nav class="gw-bottom-bar"><button disabled><span>1</span><small>Foto</small></button><button><span>2</span><small>Suara</small></button></nav></main>
 <main class="couple-dashboard"><section class="couple-premium-hero"><h1>Nama & Pasangan</h1><p class="couple-hashtag">#hariberbahagia</p><a class="couple-hero-jump">Buka album</a></section><form class="couple-code-form"><label class="field"><span>Kode pengantin</span><input/></label><button class="couple-unlock-button">Masuk album</button></form><div class="couple-album-toolbar"><button class="couple-filter-button">Semua</button><button class="couple-download-album">Unduh album</button></div></main>`;
const browser=await chromium.launch({headless:true});
try{
 const page=await browser.newPage();const mismatches=[];let comparisons=0;
 for(const width of [1280,1440])for(const theme of ['light','dark']){
  await page.setViewportSize({width,height:900});const snapshots=[];
  for(const [slug,palette] of [['wahyu-novita','maroon-romance'],['nava-akhsan','curtain-olive']]){
   await page.setContent(`<html data-guest-theme="${theme}"><head><style>${css}</style><style>*,*::before,*::after{animation:none!important;transition:none!important}</style></head><body><div class="guest-shell guest-page theme-${palette}" data-event-slug="${slug}">${markup}</div></body></html>`);
   snapshots.push(await page.evaluate(()=>{
    const root=document.querySelector('.guest-shell'),shellBg=getComputedStyle(root).backgroundColor;
    return [...root.querySelectorAll('*')].map(el=>{const s=getComputedStyle(el),b=el.getBoundingClientRect();return {element:el.className||el.tagName,rect:[b.x,b.y,b.width,b.height].map(n=>+n.toFixed(3)),typography:[s.fontFamily,s.fontSize,s.fontWeight,s.lineHeight,s.letterSpacing,s.textAlign],shape:[s.display,s.position,s.borderRadius,s.borderTopWidth,s.borderRightWidth,s.borderBottomWidth,s.borderLeftWidth],backgroundRole:el.matches('.guest-app-header')?s.backgroundColor===shellBg?'page':'distinct':el.matches('.gw-heading')?s.backgroundColor==='rgba(0, 0, 0, 0)'?'transparent':'filled':null};});
   }));
  }
  assert.equal(snapshots[0].length,snapshots[1].length);
  snapshots[0].forEach((expected,i)=>{comparisons++;const actual=snapshots[1][i];if(JSON.stringify(expected)!==JSON.stringify(actual))mismatches.push({width,theme,expected,actual});});
 }
 if(mismatches.length)console.log(JSON.stringify(mismatches.slice(0,8),null,2));
 assert.equal(mismatches.length,0,`${mismatches.length} desktop elements differ from Wahyu–Novita geometry/type/shape/surface hierarchy`);
 console.log(`Desktop parity regression: ${comparisons} element comparisons match Wahyu–Novita at 1280/1440px in light/dark, with event colors allowed to differ. Shared stylesheet fixtures; no application navigation, screenshots, uploads or E2E.`);
}finally{await browser.close();}
