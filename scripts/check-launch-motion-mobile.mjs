// Focused regression for reported static motion and clipped mobile text.
import assert from 'node:assert/strict';
import {chromium,expect} from '@playwright/test';
const browser=await chromium.launch({headless:true});
const base='http://localhost:3107';
try{
 const page=await browser.newPage({viewport:{width:390,height:844},reducedMotion:'no-preference'}),errors=[];
 page.on('pageerror',error=>errors.push(error.message));
 for(const path of ['/','/check-launch-404']){
  await page.goto(base+path,{waitUntil:'domcontentloaded'});
  await expect(page.locator('.kl-page')).toHaveAttribute('data-motion','playing');
  await expect(page.getByRole('button',{name:/Jeda animasi|Putar animasi/})).toHaveCount(0);
  await expect(page.locator('a[href="/masuk"]')).toHaveCount(0);
  const selector=path==='/'?'.kl-floating-front':'.kl-lost-floating';
  await page.locator('.kl-scene').evaluate(el=>el.scrollIntoView({block:'center',behavior:'instant'}));
  await page.waitForTimeout(1100);
  const transform=()=>page.locator(selector).evaluate(el=>getComputedStyle(el).transform);
  const before=await transform();await page.waitForTimeout(900);assert.notEqual(await transform(),before,path+' illustration must actually move');
  const loop=await page.locator(selector).evaluate(el=>({play:getComputedStyle(el).animationPlayState,iterations:getComputedStyle(el).animationIterationCount}));
  assert.deepEqual(loop,{play:'running',iterations:'infinite'},'Motion must loop continuously without user interaction');
  for(const width of [320,375,390,430,768]){
   await page.setViewportSize({width,height:844});await page.evaluate(()=>document.fonts.ready);
   const clipping=await page.evaluate(()=>{
    const clipped=[];
    for(const element of document.querySelectorAll('.kl-page *')){
     if(element.closest('svg'))continue;
     for(const node of element.childNodes){
      if(node.nodeType!==Node.TEXT_NODE||!node.textContent.trim())continue;
      const range=document.createRange();range.selectNodeContents(node);
      for(const rect of range.getClientRects())if(rect.width&&(rect.left<-.5||rect.right>innerWidth+.5))clipped.push(node.textContent.trim());
     }
    }
    return {width:innerWidth,scrollWidth:document.documentElement.scrollWidth,clipped};
   });
   assert.equal(clipping.scrollWidth,width,JSON.stringify(clipping));assert.deepEqual(clipping.clipped,[],JSON.stringify(clipping));
  }
 }
 await page.emulateMedia({reducedMotion:'reduce'});await page.reload({waitUntil:'domcontentloaded'});
 await expect(page.locator('.kl-page')).toHaveAttribute('data-motion','playing');
 await expect(page.locator('a[href="/masuk"]')).toHaveCount(0);
 assert.equal(await page.locator('.kl-lost-floating').evaluate(el=>getComputedStyle(el).animationPlayState),'running');
 assert.equal(await page.locator('.kl-lost-floating').evaluate(el=>getComputedStyle(el).animationName),'kl-float-gentle','Reduced motion uses a gentler automatic loop');
 const reducedBefore=await page.locator('.kl-lost-floating').evaluate(el=>getComputedStyle(el).transform);
 await page.waitForTimeout(1000);
 assert.notEqual(await page.locator('.kl-lost-floating').evaluate(el=>getComputedStyle(el).transform),reducedBefore,'Gentle motion must also start without a play button');
 assert.deepEqual(errors,[]);
 console.log('Launch regression: homepage and 404 auto-start and loop infinitely without interaction; no login or motion buttons; no text clipping at 320/375/390/430/768px; reduced motion uses a gentler automatic loop. Local Chromium only, no real-device check.');
}finally{await browser.close()}
