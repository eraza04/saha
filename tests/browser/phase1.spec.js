import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';
const nav=(page,name)=>page.getByRole('navigation',{name:'Main app sections'}).getByRole('button',{name,exact:true}).click();
async function start(page){await page.goto('/');await page.getByRole('button',{name:'Start with Today'}).click();}
async function care(page){return page.evaluate(()=>JSON.parse(localStorage.getItem('saha:v1:participant'))?.state??null);}
async function touchSwipe(page,x,y,dx,dy=0){
  const cdp=await page.context().newCDPSession(page);
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y}]});
  for(let i=1;i<=10;i++){
    await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:x+dx*i/10,y:y+dy*i/10}]});
    await new Promise(r=>setTimeout(r,100));
  }
  await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await cdp.detach();
}
test('root is participant only; both medicines record, persist, prevent duplicates and correct',async({page})=>{
  const errors=[];page.on('pageerror',e=>errors.push(e.message));await start(page);
  await page.screenshot({path:'test-results/today-390.png'});
  await expect(page.locator('.sidebar,.phone-status,.annotation-panel,#condition,#task-strip')).toHaveCount(0);
  await nav(page,'Medicine');await page.locator('[data-action="medicine:A"]').click();
  await page.getByRole('button',{name:'Record taken',exact:true}).click();
  await expect(page.locator('.success-card')).toContainText('2026');
  await page.reload();await page.getByRole('button',{name:'View record',exact:true}).click();
  expect((await care(page)).events.filter(e=>e.type==='taken')).toHaveLength(1);
  await nav(page,'Medicine');await page.locator('[data-action="medicine:B"]').click();
  await expect(page.locator('.app-body')).toContainText('8:00 pm');
  await page.getByRole('button',{name:'Record taken',exact:true}).click();
  expect((await care(page)).doses.B.status).toBe('taken');
  await page.getByRole('button',{name:'Correct record',exact:true}).click();
  await expect(page.locator('.app-body')).toContainText('not an instruction to take another dose');
  expect((await care(page)).doses.A.status).toBe('taken');expect((await care(page)).doses.B.status).toBe('pending');
  await page.getByRole('button',{name:'Back',exact:true}).click();await expect(page.locator('.app-body')).toContainText('Medicine B');await expect(page.getByRole('heading',{name:'Recorded taken',exact:true})).toHaveCount(0);
  await page.reload();expect((await care(page)).doses.B.status).toBe('pending');expect(errors).toEqual([]);
});
test('postpone and replace reminder; foreground due reminder; prescribed schedule stays unchanged',async({page})=>{
  await start(page);await page.getByRole('button',{name:'Open reminder',exact:true}).click();
  await page.getByRole('button',{name:'Postpone reminder'}).click();await page.getByRole('button',{name:'20 minutes',exact:true}).click();
  await expect(page.locator('.success-card')).toContainText('Original schedule: 9:00 am');
  const first=(await care(page)).doses.A;expect(first.delay).toBe(20);expect(first.remindAt).toBeTruthy();
  await page.getByRole('button',{name:'Change reminder'}).click();await page.getByRole('button',{name:'30 minutes',exact:true}).click();
  await page.reload();expect((await care(page)).doses.A.delay).toBe(30);
  await page.evaluate(()=>{const x=JSON.parse(localStorage.getItem('saha:v1:participant'));x.state.doses.A.remindAt=new Date(Date.now()-1000).toISOString();localStorage.setItem('saha:v1:participant',JSON.stringify(x));});
  await page.reload();await expect(page.locator('#foreground-reminders')).toContainText('Medicine A reminder is ready');
});
test('appointment details and reminder acknowledgement remain visible after reload',async({page})=>{
  await start(page);await nav(page,'Visits');await page.locator('[data-action="go:visit"]').click();
  await expect(page.locator('.app-body')).toContainText('Tuesday, 27 October 2026');await expect(page.locator('.app-body')).toContainText('Room 04');
  await page.getByRole('button',{name:'View reminder'}).click();await page.getByRole('button',{name:'I’ve seen this'}).click();
  await expect(page.locator('.inline-feedback')).toContainText('Reminder acknowledged');await page.reload();await expect(page.locator('.inline-feedback')).toContainText('Booking unchanged');
});
test('contact form recovers errors, preserves unsaved originals and edits either contact; calls confirm and cancel',async({page})=>{
  await start(page);await page.setViewportSize({width:320,height:740});await page.getByRole('button',{name:'Comfort settings'}).click();await page.getByRole('button',{name:'Largest text'}).click();await page.locator('[data-pref="roomy"]').check();await page.locator('[data-pref="contrast"]').check();await page.getByRole('button',{name:'Done'}).click();await nav(page,'People');await page.locator('[data-action="person:0"]').click();
  await page.getByRole('button',{name:'Edit contact'}).click();
  await page.getByLabel('Name',{exact:true}).fill('');await page.getByLabel('Phone number',{exact:true}).fill('letters1234567');await page.getByRole('button',{name:'Save contact'}).click();
  await expect(page.getByLabel('Name',{exact:true})).toBeFocused();await expect(page.locator('#form-error')).toContainText('7 to 15 digits');
  expect(await page.locator('.app-body').evaluate(el=>el.scrollWidth<=el.clientWidth)).toBe(true);
  await page.getByLabel('Name',{exact:true}).fill('Nida Test');await page.getByLabel('Phone number',{exact:true}).fill('0300 000 0002');await page.getByRole('button',{name:'Save contact'}).click();
  await expect(page.getByRole('heading',{name:'Nida Test',exact:true})).toBeVisible();
  await page.getByRole('button',{name:'Edit contact'}).click();await page.getByLabel('Name',{exact:true}).fill('Discard this');await page.getByRole('button',{name:'Cancel'}).click();
  await page.getByRole('button',{name:'Call preview',exact:true}).click();await page.getByRole('button',{name:'Cancel',exact:true}).click();
  expect((await care(page)).contact.name).toBe('Nida Test');
  await page.getByRole('button',{name:'Call preview',exact:true}).click();await page.getByRole('button',{name:'Start preview',exact:true}).click();
  await expect(page.getByText('No call placed.')).toBeVisible();await page.getByRole('button',{name:'End preview'}).click();
  await nav(page,'People');await page.locator('[data-action="person:1"]').click();await page.getByRole('button',{name:'Edit contact'}).click();
  await page.getByLabel('Name',{exact:true}).fill('Omar Test');await page.getByRole('button',{name:'Save contact'}).click();await page.reload();await expect(page.getByRole('heading',{name:'Omar Test'})).toBeVisible();
});
test('manual combined settings persist, keyboard reaches content and explicit speech fails gracefully',async({page})=>{
  await start(page);await page.getByRole('button',{name:'Comfort settings'}).click();
  await page.getByRole('button',{name:'Largest text',exact:true}).click();await page.locator('[data-pref="contrast"]').check();await page.locator('[data-pref="roomy"]').check();
  await page.getByRole('button',{name:'Done'}).click();await page.reload();
  await expect(page.locator('#phone')).toHaveClass(/largest-text high-contrast roomy/);
  await page.keyboard.press('Tab');await expect(page.locator('.skip')).toBeFocused();await page.keyboard.press('Enter');await expect(page.locator('#screen-content')).toBeFocused();
  await page.evaluate(()=>{Object.defineProperty(window,'speechSynthesis',{value:undefined});});
  await page.getByRole('button',{name:'Read aloud',exact:true}).click();await expect(page.locator('#toast')).toContainText('Read aloud is unavailable');
});
test('actual slow touch swipes move only main sections and preserve care records; vertical scroll wins',async({page})=>{
  await start(page);await page.getByRole('button',{name:'Comfort settings'}).click();await page.locator('[data-pref="gestures"]').check();await page.getByRole('button',{name:'Done'}).click();
  await touchSwipe(page,300,110,-210);await expect(page.locator('[data-action="nav:meds"]')).toHaveAttribute('aria-current','page');
  await touchSwipe(page,300,110,-210);await expect(page.locator('[data-action="nav:visits"]')).toHaveAttribute('aria-current','page');
  await touchSwipe(page,90,110,210);await expect(page.locator('[data-action="nav:meds"]')).toHaveAttribute('aria-current','page');
  await page.locator('[data-action="medicine:A"]').click();await touchSwipe(page,300,110,-210);await expect(page.getByRole('button',{name:'Record taken',exact:true})).toBeVisible();
  const take=page.getByRole('button',{name:'Record taken',exact:true});await take.scrollIntoViewIfNeeded();const box=await take.boundingBox();await touchSwipe(page,box.x+box.width-25,box.y+box.height/2,-180);
  expect((await care(page)).events).toEqual([]);
  await nav(page,'People');await page.locator('[data-action="person:0"]').click();await page.getByRole('button',{name:'Call preview',exact:true}).click();await touchSwipe(page,300,110,-210);await expect(page.getByRole('button',{name:'Start preview',exact:true})).toBeVisible();await expect(page.getByRole('button',{name:'End preview',exact:true})).toHaveCount(0);
  await page.setViewportSize({width:390,height:500});await nav(page,'Today');await touchSwipe(page,200,330,-85,-160);await expect(page.locator('[data-action="nav:home"]')).toHaveAttribute('aria-current','page');
  expect(await page.locator('.app-body').evaluate(el=>el.scrollTop)).toBeGreaterThan(0);
});
test('damaged and unavailable storage recover with visible notices',async({page})=>{
  await page.goto('/');await page.evaluate(()=>localStorage.setItem('saha:v1:participant','{broken'));await page.reload();await expect(page.locator('#storage-notice')).toBeVisible();
  await page.getByRole('button',{name:'Start with Today'}).click();
  await page.addInitScript(()=>{Storage.prototype.getItem=()=>{throw new Error('disabled');};Storage.prototype.setItem=()=>{throw new Error('disabled');};});
  await page.reload();await expect(page.locator('#storage-notice')).toContainText('cannot save');await page.getByRole('button',{name:'Start with Today'}).click();await nav(page,'Medicine');await expect(page.getByRole('heading',{name:'Medicine schedule'})).toBeVisible();
});
test('malformed saved study results recover without breaking the researcher view',async({page})=>{
  await page.goto('/studio/');await page.evaluate(()=>localStorage.setItem('saha:v1:research',JSON.stringify({version:1,results:[null],events:[],active:null})));await page.reload();await page.locator('[data-view="study"]').click();await expect(page.locator('#storage-notice')).toContainText('study data was damaged');await expect(page.locator('#export-results')).toBeDisabled();await page.locator('[data-view="prototype"]').click();await page.getByRole('button',{name:'Comfort settings',exact:true}).click();expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('saha:v1:research')).results)).toEqual([null]);
});
test('studio preserves all 22 screens, wireframes, journeys and evaluation; scenarios are isolated',async({page})=>{
  const errors=[];page.on('pageerror',e=>errors.push(e.message));await start(page);const before=await care(page);
  await page.goto('/studio/');await page.locator('[data-view="atlas"]').click();await expect(page.locator('.atlas-card')).toHaveCount(22);await page.locator('#atlas-wire-btn').click();await expect(page.locator('.mini-device.wireframe')).toHaveCount(22);
  for(const name of ['flows','system','study']){await page.locator('[data-view="'+name+'"]').click();await expect(page.locator('#view-'+name)).toBeVisible();}
  await page.locator('[data-scenario="offline"]').click();await expect(page.locator('#app')).toContainText('No offline app shell');expect(await care(page)).toEqual(before);expect(errors).toEqual([]);
});
test('coded sessions retain earlier outcomes, freeze B/C, review replacements, record navigation and export distinguishable files',async({page,context})=>{
  await page.goto('/studio/');await page.getByRole('button',{name:'Comfort settings',exact:true}).click();await page.getByRole('button',{name:'Largest text'}).click();await page.locator('[data-pref="contrast"]').check();await page.locator('[data-pref="roomy"]').check();await page.locator('[data-pref="gestures"]').check();
  await page.locator('#condition').selectOption('B');await page.locator('[data-view="study"]').click();
  await page.locator('#participant-code').fill('P01');await page.getByRole('button',{name:'Create new coded session'}).click();
  await page.locator('[data-start-task="dose"]').click();await expect(page.locator('#confirm-prepare')).toBeVisible();expect((await care(page))).toBeNull();
  await page.locator('#cancel-prepare').click();expect((await care(page))).toBeNull();
  await page.locator('[data-start-task="dose"]').click();const popup=context.waitForEvent('page');await page.locator('#confirm-prepare').click();const participant=await popup;await participant.waitForLoadState();
  expect(new URL(participant.url()).pathname).toBe('/');await expect(participant.locator('#condition,#task-strip,.study-active,#participant-code')).toHaveCount(0);await expect(participant.locator('#phone')).toHaveClass(/largest-text high-contrast roomy/);
  await expect(page.locator('#begin-timer')).toBeVisible();await page.locator('#begin-timer').click();await participant.getByRole('button',{name:'Open reminder',exact:true}).click();await participant.getByRole('button',{name:'Record taken',exact:true}).click();
  await expect(page.locator('[data-task-result="completed"]')).toBeVisible();expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('saha:v1:research')).results.length)).toBe(0);
  await page.locator('[data-task-result="completed"]').click();await expect(page.locator('.metric').first()).toContainText('1');
  const b=await page.evaluate(()=>JSON.parse(localStorage.getItem('saha:v1:research')).results[0]);expect(b.build).toBe('saha-phase1-1.1.0');expect(b.participantCode).toBe('P01');expect(b.navigation.buttons).toBeGreaterThan(0);expect(b.gesturesEnabled).toBe(false);
  await page.locator('[data-view="prototype"]').click();await page.locator('#condition').selectOption('C');await page.getByRole('button',{name:'Comfort settings',exact:true}).click();await page.getByRole('button',{name:'Standard text'}).click();
  await page.locator('[data-view="study"]').click();await page.locator('[data-start-task="later"]').click();await page.locator('#confirm-prepare').click();
  await expect(participant.getByRole('button',{name:'Postpone reminder'})).toBeVisible();await expect(participant.locator('#phone')).toHaveClass(/largest-text high-contrast roomy/);await page.locator('#begin-timer').click();
  await participant.getByRole('button',{name:'Postpone reminder'}).click();await participant.getByRole('button',{name:'20 minutes',exact:true}).click();await page.locator('#help-event').click();await page.locator('[data-task-result="completed"]').click();
  await expect(page.locator('.metric').first()).toContainText('2');const c=await page.evaluate(()=>JSON.parse(localStorage.getItem('saha:v1:research')).results[1]);expect(c.config).toEqual(b.config);expect(c.result).toBe('assisted');expect(c.gesturesEnabled).toBe(true);
  const csvPromise=page.waitForEvent('download');await page.locator('#export-results').click();const csv=await csvPromise;expect(csv.suggestedFilename()).toContain('saha-P01-');const csvText=await readFile(await csv.path(),'utf8');expect(csvText).toContain('participantCode');expect(csvText).toContain('saha-phase1-1.1.0');expect(csvText).toContain('assisted');
  const jsonPromise=page.waitForEvent('download');await page.locator('#export-events').click();const json=await jsonPromise;const data=JSON.parse(await readFile(await json.path(),'utf8'));expect(data.session.participantCode).toBe('P01');expect(data.results).toHaveLength(2);expect(data.events.every(e=>e.participantCode==='P01')).toBe(true);
  await page.locator('#participant-code').fill('P02');await page.getByRole('button',{name:'Create new coded session'}).click();expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('saha:v1:research')).results.length)).toBe(2);
  await page.locator('[data-start-task="home"]').click();await page.locator('#confirm-prepare').click();await page.locator('[data-task-result="failed"]').click();const rows=await page.evaluate(()=>JSON.parse(localStorage.getItem('saha:v1:research')).results);expect(rows[2].participantCode).toBe('P02');expect(rows[2].notStarted).toBe(true);expect(rows[2].sessionId).not.toBe(rows[0].sessionId);
  await page.locator('#clear-results').click();await page.locator('#cancel-clear').click();expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('saha:v1:research')).results.length)).toBe(3);
  await page.evaluate(()=>localStorage.setItem('other-app:data','keep'));await page.locator('#reset-local').click();await page.locator('#cancel-reset').click();await page.locator('#reset-local').click();await page.locator('#confirm-reset').click();expect(await page.evaluate(()=>localStorage.getItem('other-app:data'))).toBe('keep');await expect(participant.getByRole('button',{name:'Start with Today'})).toBeVisible();
});
test('B and C share screen content and computed presentation; A keeps conventional controls',async({page})=>{
  await start(page);const results=[];
  for(const condition of ['A','B','C']){
    await page.evaluate(condition=>{const x=JSON.parse(localStorage.getItem('saha:v1:participant'));Object.assign(x.state,{condition,size:'largest',contrast:true,roomy:true,gestures:true,screen:'dose'});localStorage.setItem('saha:v1:participant',JSON.stringify(x));},condition);await page.reload();
    results.push(await page.evaluate(()=>({html:document.querySelector('#app').innerHTML,font:getComputedStyle(document.querySelector('#app')).fontSize,height:document.querySelector('[data-action="take"]').getBoundingClientRect().height,background:getComputedStyle(document.querySelector('#app')).backgroundColor})));
  }
  expect(results[1]).toEqual(results[2]);expect(results[0].font).toBe('16px');expect(results[1].font).toBe('25px');expect(results[0].height).toBe(50);expect(results[1].height).toBe(66);
});
test('Help is optional, labeled and preserves a route to trusted people',async({page})=>{
  await start(page);await page.getByRole('button',{name:'Help',exact:true}).click();await expect(page.getByRole('heading',{name:'Help',exact:true})).toBeVisible();await page.getByText('Reminders',{exact:true}).click();await expect(page.locator('.app-body')).toContainText('no background alerts');await page.getByRole('button',{name:'Trusted people',exact:true}).click();await expect(page.getByRole('heading',{name:'Trusted people',exact:true})).toBeVisible();
});
test('timed gesture usage is counted, non-gesture conditions reject swipes, and failed attempts remain',async({page,context})=>{
  await start(page);
  for(const condition of ['A','B']){
    await page.evaluate(condition=>{const x=JSON.parse(localStorage.getItem('saha:v1:participant'));Object.assign(x.state,{condition,gestures:true,screen:'home'});localStorage.setItem('saha:v1:participant',JSON.stringify(x));},condition);await page.reload();await touchSwipe(page,300,110,-210);await expect(page.locator('[data-action="nav:home"]')).toHaveAttribute('aria-current','page');
  }
  await page.goto('/studio/');await page.getByRole('button',{name:'Comfort settings',exact:true}).click();await page.locator('[data-pref="gestures"]').check();await page.locator('[data-view="study"]').click();await page.locator('#participant-code').fill('TEST');await page.getByRole('button',{name:'Create new coded session'}).click();
  await page.locator('[data-start-task="dose"]').click();const popup=context.waitForEvent('page');await page.locator('#confirm-prepare').click();const participant=await popup;await participant.waitForLoadState();await page.locator('#begin-timer').click();
  await touchSwipe(participant,300,110,-210);await expect(participant.locator('[data-action="nav:meds"]')).toHaveAttribute('aria-current','page');await participant.locator('[data-action="medicine:A"]').click();await participant.getByRole('button',{name:'Record taken',exact:true}).click();await page.locator('[data-task-result="failed"]').click();
  const r=await page.evaluate(()=>JSON.parse(localStorage.getItem('saha:v1:research')).results[0]);expect(r.result).toBe('failed');expect(r.navigation.swipes).toBe(1);expect(r.navigationMethod).toBe('mixed');expect(r.seconds).toBeGreaterThan(0);
  await page.reload();await page.locator('[data-view="study"]').click();await expect(page.locator('#study-content .spec-table')).toContainText('failed');
});
for(const width of [320,360,390])test('largest combined settings reflow all screens at '+width+'px',async({page})=>{
  await page.setViewportSize({width,height:740});await page.goto('/studio/');await page.locator('[data-view="atlas"]').click();
  const ids=await page.locator('.atlas-open').evaluateAll(els=>els.map(el=>el.dataset.target));
  await page.goto('/');await page.evaluate(()=>{const x=JSON.parse(localStorage.getItem('saha:v1:participant'));Object.assign(x.state,{size:'largest',roomy:true,contrast:true,onboarded:true});localStorage.setItem('saha:v1:participant',JSON.stringify(x));});
  for(const id of [...ids,'help']){
    await page.evaluate(id=>{const x=JSON.parse(localStorage.getItem('saha:v1:participant'));x.state.screen=id;localStorage.setItem('saha:v1:participant',JSON.stringify(x));},id);await page.reload();
    const sizes=await page.evaluate(()=>{const el=document.querySelector('.app-body');return {page:document.documentElement.scrollWidth,body:el.scrollWidth,available:el.clientWidth,nav:document.querySelector('.app-nav').getBoundingClientRect().bottom,height:innerHeight};});
    expect(sizes.page,id).toBeLessThanOrEqual(width);expect(sizes.body,id).toBeLessThanOrEqual(sizes.available);expect(sizes.nav,id).toBeLessThanOrEqual(sizes.height);
    expect(await page.locator('[data-action="nav:meds"]').evaluate(el=>el.scrollWidth<=el.clientWidth),id+' navigation label').toBe(true);
    if(id==='settings'&&width===320)await page.screenshot({path:'test-results/settings-320.png'});
  }
});
