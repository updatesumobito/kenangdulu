import {defineConfig,devices} from '@playwright/test';
export default defineConfig({testDir:'./tests/e2e',timeout:90000,expect:{timeout:15000},fullyParallel:false,workers:1,retries:0,reporter:[['list'],['html',{open:'never'}],['json',{outputFile:'artifacts/playwright-results.json'}]],use:{baseURL:process.env.PLAYWRIGHT_BASE_URL||'http://127.0.0.1:3107',trace:'retain-on-failure',screenshot:'only-on-failure',video:'retain-on-failure'},projects:[
 {name:'chromium-desktop',testIgnore:/(camera|contracts)\.spec/,use:{...devices['Desktop Chrome']}},
 {name:'android-emulated',testIgnore:/(camera|contracts)\.spec/,use:{...devices['Pixel 5']}},
 {name:'webkit-mobile',testIgnore:/(camera|contracts)\.spec/,use:{...devices['iPhone 13']}},
 {name:'firefox-desktop',testIgnore:/(camera|contracts)\.spec/,use:{...devices['Desktop Firefox']}},
 {name:'api-contracts',testMatch:/contracts\.spec/},
 {name:'chromium-camera',testMatch:/camera\.spec/,use:{...devices['Desktop Chrome'],permissions:['camera','microphone'],launchOptions:{args:['--use-fake-device-for-media-stream','--use-fake-ui-for-media-stream']}}},
 ],webServer:process.env.PLAYWRIGHT_BASE_URL?undefined:{command:'npm run dev',url:'http://127.0.0.1:3107',reuseExistingServer:true,timeout:120000}});
