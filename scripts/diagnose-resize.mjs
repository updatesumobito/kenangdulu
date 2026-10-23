import {chromium,request,expect} from '@playwright/test';

const baseURL=process.env.PLAYWRIGHT_BASE_URL||'http://127.0.0.1:3107';
const client=await request.newContext({baseURL});
let browser;
try{
 const login=await client.post('/api/v1/auth/login',{data:{email:'partner@demo.komukuna.test',password:'KomukunaDemo2026!'}});
 if(!login.ok())throw Error(`Demo login failed (${login.status()}); use a development database with demo fixtures.`);
 const response=await client.get('/api/v1/dashboard');
 if(!response.ok())throw Error(`Dashboard failed (${response.status()}).`);
 const event=(await response.json()).data.events.find(event=>event.slug==='demo-classic');
 if(!event)throw Error('demo-classic is absent from the demo partner dashboard.');
 browser=await chromium.launch();
 const page=await browser.newPage({viewport:{width:1280,height:720},storageState:await client.storageState()});
 page.on('pageerror',error=>console.error('PAGE ERROR',error.message));
 await page.goto(new URL('/partner/events/'+event.id+'/edit',baseURL).href);
 await page.getByRole('tab',{name:'Frame studio'}).click();
 const width=page.getByRole('spinbutton',{name:'Lebar',exact:true});
 const handle=page.locator('.resize-handle[data-anchor="bottom-right"]').first();
 await handle.scrollIntoViewIfNeeded();
 const box=await handle.boundingBox();
 if(!box)throw Error('Resize handle is not visible.');
 const before=Number(await width.inputValue());
 await page.mouse.move(box.x+box.width/2,box.y+box.height/2);
 await page.mouse.down();
 await page.mouse.move(box.x+box.width/2+20,box.y+box.height/2+20,{steps:5});
 await page.mouse.up();
 await expect.poll(async()=>Number(await width.inputValue())).toBeGreaterThan(before);
 console.log(JSON.stringify({baseURL,before,after:Number(await width.inputValue())}));
}finally{
 await browser?.close();
 await client.dispose();
}
