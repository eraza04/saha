import {test,expect} from '@playwright/test';

// Exact reported flow and fictional values. No domain data is injected.
async function createHello(app,largest=false){
  await app.getByRole('button',{name:'Start with Today',exact:true}).click();
  if(largest){await app.getByRole('button',{name:'Comfort settings',exact:true}).click();await app.getByRole('button',{name:'Largest text',exact:true}).click();await app.locator('[data-pref="roomy"]').check();await app.getByRole('button',{name:'Done',exact:true}).click();}
  await app.locator('[data-action="nav:visits"]').click();await app.getByRole('button',{name:'Add appointment',exact:true}).click();
  await app.getByLabel('Clinician or title').fill('Hello 1');await app.getByLabel('Date',{exact:true}).fill('2026-10-26');await app.getByLabel('Time',{exact:true}).fill('15:51');await app.getByLabel('Location and room').fill('Tabba MTC25');await app.getByLabel('Reminder',{exact:true}).selectOption('day-before');await app.getByRole('button',{name:'Save appointment',exact:true}).click();
}
const records=app=>app.evaluate(()=>{const s=JSON.parse(localStorage.getItem('saha:v1:participant')).state;return {medicines:s.medicines,occurrences:s.occurrences,appointments:s.appointments,contacts:s.contacts,events:s.events};});
async function insideViewport(app){
  const back=app.locator('.app-top').getByRole('button',{name:'Back to Visits',exact:true});await expect(back).toBeInViewport({ratio:1});
  await expect(app.locator('.app-top')).toBeInViewport({ratio:1});
  await expect(app.locator('.app-nav')).toBeInViewport({ratio:1});
  for(const button of await app.locator('.app-nav button').all())await expect(button).toBeInViewport({ratio:1});
  const metrics=await app.evaluate(()=>({scrollY,documentHeight:document.documentElement.scrollHeight,innerHeight,visualHeight:visualViewport.height,phone:document.querySelector('#phone').getBoundingClientRect().toJSON(),header:document.querySelector('.app-top').getBoundingClientRect().toJSON(),content:document.querySelector('.app-body').getBoundingClientRect().toJSON(),nav:document.querySelector('.app-nav').getBoundingClientRect().toJSON(),back:document.querySelector('.app-return button').getBoundingClientRect().toJSON(),build:document.documentElement.dataset.build,url:location.href}));
  expect(metrics.build).toBe('saha-phase1-1.2.2');expect(metrics.scrollY).toBe(0);expect(metrics.documentHeight).toBeLessThanOrEqual(metrics.innerHeight);
  expect(metrics.phone.height).toBeLessThanOrEqual(metrics.visualHeight+1);expect(metrics.header.bottom).toBeLessThanOrEqual(metrics.content.top+1);expect(metrics.content.bottom).toBeLessThanOrEqual(metrics.nav.top+1);expect(metrics.nav.bottom).toBeLessThanOrEqual(metrics.visualHeight+1);
  return metrics;
}

for(const v of [{width:729,height:821,largest:false},{width:390,height:480,largest:true}])test('reported appointment flow uses the aligned header return and full nav at '+v.width+'x'+v.height,async({page})=>{
  await page.setViewportSize(v);await page.clock.install({time:new Date('2026-10-25T15:51:00')});await page.goto('/');await createHello(page,v.largest);
  await insideViewport(page);const before=await records(page);
  await page.locator('.app-body').evaluate(el=>el.scrollTop=el.scrollHeight);await insideViewport(page);
  await page.getByRole('button',{name:'View reminder',exact:true}).click();expect(await page.locator('.app-body').evaluate(el=>el.scrollTop)).toBe(0);await page.getByRole('button',{name:'Back to appointment',exact:true}).click();await insideViewport(page);
  await page.reload();expect(await page.locator('.app-body').evaluate(el=>el.scrollTop)).toBe(0);await insideViewport(page);
  await page.setViewportSize({width:v.width,height:v.height-80});await insideViewport(page);await page.locator('.app-body').evaluate(el=>el.scrollTop=el.scrollHeight);await insideViewport(page);
  // A document scroll request must not displace either persistent app region.
  await page.evaluate(()=>window.scrollTo(0,1000));await insideViewport(page);
  await page.locator('.app-top').getByRole('button',{name:'Back to Visits',exact:true}).click();await expect(page.getByRole('heading',{name:'Visits',exact:true})).toBeVisible();expect(await records(page)).toEqual(before);
});

test('embedded preview uses its own viewport without clipping its bottom navigation',async({page})=>{
  await page.setViewportSize({width:729,height:821});await page.clock.install({time:new Date('2026-10-25T15:51:00')});
  await page.route('**/viewport-host',route=>route.fulfill({contentType:'text/html',body:'<!doctype html><html style="height:100%;overflow:hidden"><head><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="margin:0;height:100%;display:grid;grid-template-rows:64px minmax(0,1fr);overflow:hidden"><header>Local test preview host</header><iframe title="Saha preview" src="/" style="width:100%;height:100%;min-height:0;border:0;display:block"></iframe></body></html>'}));
  await page.goto('/viewport-host');const app=await (await page.locator('iframe').elementHandle()).contentFrame();await createHello(app,true);const before=await records(app);await insideViewport(app);
  const frameBox=await page.locator('iframe').boundingBox(),navBox=await app.locator('.app-nav').boundingBox();expect(frameBox.y+frameBox.height).toBeLessThanOrEqual(821);expect(navBox.y+navBox.height).toBeLessThanOrEqual(821);
  await app.locator('.app-body').evaluate(el=>el.scrollTop=el.scrollHeight);await insideViewport(app);await app.locator('.app-top').getByRole('button',{name:'Back to Visits',exact:true}).click();await expect(app.getByRole('heading',{name:'Visits',exact:true})).toBeVisible();expect(await records(app)).toEqual(before);expect(await page.evaluate(()=>scrollY)).toBe(0);
});
