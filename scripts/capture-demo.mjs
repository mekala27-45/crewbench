import {chromium,expect} from '@playwright/test';
import {readFile,writeFile,mkdir,rename} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const request=JSON.parse(await readFile('evaluation/demo-request.json','utf8'));
if(request.site!=='https://mekala27-45.github.io/crewbench/'||!/^[a-f0-9]{40}$/.test(request.report_source))throw Error('DEMO_SCOPE_INVALID');
await mkdir('artifacts/demo',{recursive:true});
const browser=await chromium.launch(),context=await browser.newContext({viewport:{width:1280,height:900},recordVideo:{dir:'artifacts/demo/raw',size:{width:1280,height:900}}});
const page=await context.newPage(),video=page.video(),scenes=[],errors=[];
page.on('pageerror',e=>errors.push(e.message));
const scene=async(name,action)=>{await action();await page.waitForTimeout(1400);scenes.push({name,url:page.url(),at:new Date().toISOString()});};
let report,passed=false;
try{
 const response=await context.request.get(request.site+'data/report.json');if(!response.ok())throw Error('REPORT_UNAVAILABLE');report=await response.json();
 if(report.source_commit!==request.report_source||!!report.actual!==request.actual_expected)throw Error('DEPLOYED_REPORT_MISMATCH');
 await scene('Recorded actual comparison or explicit missing-result state',async()=>{await page.goto(request.site);await expect(page.getByRole('heading',{name:'Does splitting the work help?'})).toBeVisible();await page.locator('.comparison').scrollIntoViewIfNeeded();});
 await scene('Separate recorded deterministic baseline',async()=>{await page.getByRole('button',{name:'Baseline',exact:true}).click();await expect(page.getByRole('cell',{name:'48 / 48',exact:true})).toBeVisible();});
 await scene('Exact evidence reference',async()=>{await page.getByRole('link',{name:'Case',exact:true}).click();const ref=page.locator('[data-evidence]').first();await ref.click();await expect(page.locator('.field-selected')).toBeVisible();});
 await scene('Scripted recovery with fresh observations',async()=>{await page.getByRole('link',{name:'Recovery',exact:true}).click();const receipt=page.locator('details.panel').first();await receipt.locator('summary').click();await receipt.scrollIntoViewIfNeeded();await expect(receipt).toContainText('Fresh connection');});
 await scene('Registered method and limits',async()=>{await page.getByRole('link',{name:'Method',exact:true}).click();await expect(page.getByRole('heading',{name:'More agents must earn their place.'})).toBeVisible();});
 if(errors.length)throw Error('PAGE_ERRORS');passed=true;
}finally{
 await context.close();const original=await video.path();await rename(original,'artifacts/demo/crewbench-demo.webm');await browser.close();
 const bytes=await readFile('artifacts/demo/crewbench-demo.webm');
 await writeFile('artifacts/demo/manifest.json',JSON.stringify({schema_version:1,mode:'public_browser_recording',source_commit:process.env.GITHUB_SHA,report_source:report?.source_commit,report_status:report?.status,actual_present:!!report?.actual,site:request.site,passed,scenes,page_errors:errors,live_api_verified:false,video:{path:'artifacts/demo/crewbench-demo.webm',bytes:bytes.length,sha256:createHash('sha256').update(bytes).digest('hex')}},null,2)+'\n');
}
