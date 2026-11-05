import {test,expect} from '@playwright/test';
test('all evidence views remain legible and keyboard reachable',async({page},info)=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('./');
 await expect(page.getByRole('heading',{name:'Does splitting the work help?'})).toBeVisible();
 await expect(page.getByRole('button',{name:'Actual model',exact:true})).toHaveAttribute('aria-pressed','true');
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
 await page.route('**/api/v1/**',route=>route.abort());await page.goto('./#case');await page.getByRole('button',{name:'Run live baseline'}).click();await expect(page.locator('#live-status')).toContainText('Live service unavailable');await expect(page.locator('#live-status')).toContainText('may have committed');await expect(page.getByRole('heading',{name:'Exact references'})).toBeVisible();
});
test('theme preference persists and case selection retains focus',async({page})=>{
 await page.goto('./#case');const initial=await page.locator('html').getAttribute('data-theme');await page.locator('#theme-toggle').click();const next=initial==='dark'?'light':'dark';await expect(page.locator('html')).toHaveAttribute('data-theme',next);await page.reload();await expect(page.locator('html')).toHaveAttribute('data-theme',next);
 await page.locator('#case-select').focus();await page.keyboard.press('ArrowDown');await page.keyboard.press('Enter');await expect(page.locator('#case-select')).toBeFocused();
});
test('expired and denied sessions produce a finite useful error',async({page})=>{
 await page.route('**/api/v1/sessions',route=>route.fulfill({status:401,contentType:'application/json',body:JSON.stringify({error:'CAPABILITY_EXPIRED'})}));await page.goto('./#case');await page.getByRole('button',{name:'Run live baseline'}).click();await expect(page.locator('#live-status')).toContainText('session expired');await expect(page.getByRole('button',{name:'Run live baseline'})).toBeEnabled();
});
test('missing actual results remain missing and reduced motion is supported',async({page})=>{
 await page.emulateMedia({reducedMotion:'reduce'});await page.route('**/data/report.json',async route=>{const response=await route.fetch();const data=await response.json();data.actual=null;await route.fulfill({response,json:data});});await page.goto('./');await expect(page.getByText('No measured winner.',{exact:false})).toBeVisible();await expect(page.locator('.method-card .missing')).toHaveCount(2);
});
test('text remains reachable under enlarged rendering',async({page})=>{
 await page.goto('./#method');await page.evaluate(()=>document.body.style.zoom='2');await expect(page.getByRole('heading',{name:'More agents must earn their place.'})).toBeVisible();await page.getByRole('link',{name:'Download report data'}).scrollIntoViewIfNeeded();await expect(page.getByRole('link',{name:'Download report data'})).toBeVisible();
});

test('evidence text meets contrast in the active theme',async({page})=>{
 await page.goto('./#case');
 const ratios=await page.evaluate(()=>{
  const rgba=(text:string)=>{const n=text.match(/[\d.]+/g)!.map(Number);return [n[0],n[1],n[2],n[3]??1];};
  const luminance=(c:number[])=>{const v=c.slice(0,3).map(x=>{x/=255;return x<=0.04045?x/12.92:((x+0.055)/1.055)**2.4;});return .2126*v[0]+.7152*v[1]+.0722*v[2];};
  return [...document.querySelectorAll('.record,.record p,.record h3,.record .meta,.record .badge')].map(el=>{
   const fg=rgba(getComputedStyle(el).color);let parent:Element|null=el,bg:number[]|null=null;
   while(parent){const value=rgba(getComputedStyle(parent).backgroundColor);if(value[3]===1){bg=value;break;}parent=parent.parentElement;}
   if(!bg)throw new Error('No opaque background');
   const a=luminance(fg),b=luminance(bg);return (Math.max(a,b)+.05)/(Math.min(a,b)+.05);
  });
 });expect(ratios.length).toBeGreaterThan(0);expect(Math.min(...ratios)).toBeGreaterThanOrEqual(4.5);
});
