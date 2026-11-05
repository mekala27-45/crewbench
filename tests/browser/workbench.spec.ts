import {test,expect} from '@playwright/test';
test('all evidence views remain legible and keyboard reachable',async({page},info)=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('./');
 await expect(page.getByRole('heading',{name:'Does splitting the work help?'})).toBeVisible();
 await expect(page.getByText('No measured winner.',{exact:false})).toBeVisible();
 await page.getByRole('button',{name:'Baseline',exact:true}).click();await expect(page.getByRole('cell',{name:'48 / 48',exact:true})).toBeVisible();
 await page.getByRole('link',{name:'Case',exact:true}).click();
 await expect(page.getByRole('heading',{name:'Every verdict has a trail.'})).toBeVisible();
 const link=page.locator('[data-evidence]').first();await link.click();await expect(page.locator('.record:focus')).toBeVisible();
 await page.getByRole('link',{name:'Recovery',exact:true}).click();await expect(page.getByRole('heading',{name:'Break the workflow. Check what remains.'})).toBeVisible();
 await page.getByRole('link',{name:'Method',exact:true}).click();await expect(page.getByRole('heading',{name:'More agents must earn their place.'})).toBeVisible();
 await page.keyboard.press('Tab');expect(await page.evaluate(()=>document.activeElement?.tagName)).not.toBe('BODY');
 for(const route of ['compare','case','recovery','method']){await page.goto('./#'+route);await expect(page.locator('h1')).toBeVisible();expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);await page.screenshot({path:`artifacts/browser/${info.project.name}-${route}.png`,fullPage:true});}
 expect(errors).toEqual([]);
});
test('live baseline uses API and persists a visible result',async({page})=>{
 await page.goto('./#case');await page.getByRole('button',{name:'Run live baseline'}).click();await expect(page.locator('#live-status')).toContainText('Live deterministic baseline: submitted',{timeout:15000});
});
test('service failure remains explicit and preserves recorded evidence',async({page})=>{
 await page.route('http://127.0.0.1:8080/**',route=>route.abort());await page.goto('./#case');await page.getByRole('button',{name:'Run live baseline'}).click();await expect(page.locator('#live-status')).toContainText('Live service unavailable');await expect(page.getByRole('heading',{name:'Exact references'})).toBeVisible();
});
