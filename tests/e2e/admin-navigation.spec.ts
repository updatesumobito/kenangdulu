import {test,expect} from '@playwright/test';

test('admin menu changes immediately without document reload or server navigation',async({page})=>{
 const errors:string[]=[],counts:Record<string,number>={};
 let navigationRequests=0;
 page.on('pageerror',error=>errors.push(error.message));
 // Isolate the reported navigation delay from real accounts/private data.
 await page.route('**/api/v1/**',async route=>{
  const endpoint=new URL(route.request().url()).pathname.replace('/api/v1/','');
  counts[endpoint]=(counts[endpoint]||0)+1;
  const values:Record<string,unknown>={
   dashboard:{user:{id:'navigation-admin',role:'superadmin',name:'Navigation test'},orders:[],events:[],organizations:[],counts:{orders:0,live:0,review:0},meta:{hasMore:false}},
   'admin/system':{database:'Test database',storage:'test-private',paymentConfigured:false,jobs:[],audit:[],reports:[],users:[],organizations:[]},
   'catalog/plans':[{id:'mini',name:'Mini test',price:99000,partner_price:null,config:{frames:0}}],
   templates:[],
  };
  if(endpoint==='admin/system')await new Promise(resolve=>setTimeout(resolve,1500));
  await route.fulfill({json:{data:values[endpoint]||{}}});
 });
 await page.goto('/admin/fulfillment');
 const nav=page.getByRole('navigation',{name:'Menu workspace'});
 await expect(nav).toBeVisible();
 const dashboardRequests=counts.dashboard;
 const documentHandle=await page.locator('html').elementHandle();
 const sidebarHandle=await page.locator('.sidebar').elementHandle();
 page.on('request',request=>{
  if(request.isNavigationRequest()||new URL(request.url()).searchParams.has('_rsc'))navigationRequests++;
 });
 // A slow system endpoint must not block unrelated menu headings/catalog.
 await nav.getByRole('link',{name:'Paket & harga',exact:true}).click();
 await expect(page.getByRole('heading',{name:'Paket & harga.',exact:true})).toBeVisible({timeout:1000});
 await expect(page.getByRole('heading',{name:'Mini test',exact:true})).toBeVisible({timeout:1000});
 await nav.getByRole('link',{name:'Template global',exact:true}).click();
 await expect(page.getByRole('heading',{name:/Template yang bisa/})).toBeVisible({timeout:1000});
 await nav.getByRole('link',{name:'Sistem & audit',exact:true}).click();
 await expect(page.getByRole('heading',{name:/^Sistem & audit\.?$/})).toBeVisible({timeout:1000});
 await expect(page.getByText('Test database',{exact:true})).toBeVisible();
 for(const name of ['Mitra & pengguna','Laporan media','Semua acara','Pembayaran','Antrean pengerjaan','Paket & harga']){
  const link=nav.getByRole('link',{name,exact:true});await link.click();
  await expect(link).toHaveAttribute('aria-current','page',{timeout:1000});
  expect(await documentHandle!.evaluate(node=>node===document.documentElement)).toBe(true);
  expect(await sidebarHandle!.evaluate(node=>node===document.querySelector('.sidebar'))).toBe(true);
 }
 await page.goBack();await expect(page).toHaveURL(/\/admin\/fulfillment$/);
 await page.goForward();await expect(page).toHaveURL(/\/admin\/packages$/);
 expect(navigationRequests).toBe(0);
 expect(counts.dashboard).toBe(dashboardRequests);
 expect(counts['admin/system']).toBe(1);
 expect(counts['catalog/plans']).toBe(1);
 expect(counts.templates).toBe(1);
 expect(errors).toEqual([]);
 // The same URL must still work on direct entry/refresh.
 await page.reload();await expect(page.getByRole('heading',{name:'Paket & harga.',exact:true})).toBeVisible();
});
