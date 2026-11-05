import {test,expect} from '@playwright/test';
test('all evidence views remain legible and keyboard reachable',async({page},info)=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await page.route('**/data/report.json',async route=>{const r=await route.fetch();const data=await r.json();data.actual=null;await route.fulfill({json:data});});await page.goto('./');
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
test('theme persists and enlarged text remains navigable',async({page})=>{
 await page.goto('./#method');const theme=page.getByRole('button',{name:'Dark theme',exact:true});const previous=await theme.getAttribute('aria-pressed');await theme.click();await expect(theme).toHaveAttribute('aria-pressed',previous==='true'?'false':'true');await page.reload();await expect(theme).toHaveAttribute('aria-pressed',previous==='true'?'false':'true');await page.evaluate(()=>{document.documentElement.style.zoom='2';});await expect(page.getByRole('heading',{name:'More agents must earn their place.'})).toBeVisible();expect(await page.evaluate(()=>document.documentElement.scrollWidth<=document.documentElement.clientWidth+1)).toBe(true);
});
for(const code of [401,403])test(`denied service ${code} ends with explicit error`,async({page})=>{
 await page.route('http://127.0.0.1:8080/**',route=>route.fulfill({status:code,json:{error:code===401?'SESSION_EXPIRED':'DENIED'}}));await page.goto('./#case');await page.getByRole('button',{name:'Run live baseline'}).click();await expect(page.locator('#live-status')).toContainText('Live service unavailable');await expect(page.getByRole('button',{name:'Run live baseline'})).toBeEnabled();
});
test('all-failed model results keep the planned denominator and query',async({page})=>{
 await page.route('**/data/report.json',async route=>{const r=await route.fetch(),data=await r.json();const m={successes:0,planned:12,model_requests:12,input_bytes:5000,output_tokens:null,wilson_95_descriptive:[0,.2425],utility_floor_met:false};data.status='provisional_evaluation';data.actual={solo_agent:m,split_review:m,difference:'+0 / 12',rows:data.subset.map((case_id:string)=>({case_id,solo_agent:{status:'timed_out',strict_success:false,requests:1,elapsed_ms:360000},split_review:{status:'failed',strict_success:false,requests:1,elapsed_ms:5000}})),conclusion:'No demonstrated useful model behavior under the registered utility floor.',exact_mcnemar_p:1,source_commit:data.source_commit,evidence_digest:'a'.repeat(64),grades_digest:'b'.repeat(64)};await route.fulfill({json:data});});await page.goto('./');await expect(page.getByRole('heading',{name:'No demonstrated useful model behavior under the registered utility floor.'})).toBeVisible();await expect(page.locator('.paired-table tbody tr')).toHaveCount(12);await page.getByText('Show the query and source digests',{exact:true}).click();await expect(page.getByText('Exact aggregation source',{exact:true})).toBeVisible();
});
test('live baseline uses API and persists a visible result',async({page})=>{
 await page.goto('./#case');await page.getByRole('button',{name:'Run live baseline'}).click();await expect(page.locator('#live-status')).toContainText('Live deterministic baseline: submitted',{timeout:15000});
});
test('service failure remains explicit and preserves recorded evidence',async({page})=>{
 await page.route('http://127.0.0.1:8080/**',route=>route.abort());await page.goto('./#case');await page.getByRole('button',{name:'Run live baseline'}).click();await expect(page.locator('#live-status')).toContainText('Live service unavailable');await expect(page.locator('#live-status')).toContainText('may have committed');await expect(page.getByRole('heading',{name:'Exact references'})).toBeVisible();
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

test('case selection retains keyboard focus',async({page})=>{await page.goto('./#case');await page.locator('#case-select').focus();await page.keyboard.press('ArrowDown');await page.keyboard.press('Enter');await expect(page.locator('#case-select')).toBeFocused();});

test('a lost advance response resumes the persisted trial without creating another',async({page})=>{
 let creations=0,advances=0,committed=false;
 await page.route('http://127.0.0.1:8080/api/v1/trials',async route=>{if(route.request().method()==='POST')creations++;await route.continue();});
 await page.route('http://127.0.0.1:8080/api/v1/trials/*/advance',async route=>{if(route.request().method()==='POST'&&++advances===2){const result=await route.fetch();expect((await result.json()).status).toBe('submitted');committed=true;await route.abort();}else await route.continue();});
 await page.goto('./#case');await page.getByRole('button',{name:'Run live baseline'}).click();
 await expect(page.locator('#live-status')).toContainText('may have committed');
 const trial=(await page.locator('#live-status').textContent())!.match(/Trial (demo_[a-z0-9]+)/)![1];
 await page.getByRole('button',{name:'Run live baseline'}).click();await expect(page.locator('#live-status')).toContainText('Live deterministic baseline: submitted');await expect(page.locator('#live-status')).toContainText(trial);expect(creations).toBe(1);expect(advances).toBe(2);expect(committed).toBe(true);
});
