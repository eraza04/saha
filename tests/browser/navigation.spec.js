import {test,expect} from '@playwright/test';

const instant=new Date('2026-10-25T15:51:00');
const screen=p=>p.locator('#screen-content');
const nav=(p,label)=>p.getByRole('navigation',{name:'Main app sections'}).getByRole('button',{name:label,exact:true}).click();
const state=p=>p.evaluate(()=>JSON.parse(localStorage.getItem('saha:v1:participant')).state);
async function records(p){const s=await state(p);return {medicines:s.medicines,occurrences:s.occurrences,appointments:s.appointments,contacts:s.contacts,events:s.events};}
async function start(p,width){
  await p.setViewportSize({width,height:740});await p.clock.install({time:instant});await p.goto('/');
  await p.getByRole('button',{name:'Start with Today',exact:true}).click();
  await p.getByRole('button',{name:'Comfort settings',exact:true}).click();await p.getByRole('button',{name:'Largest text',exact:true}).click();
  await p.locator('[data-pref="contrast"]').check();await p.locator('[data-pref="roomy"]').check();await p.getByRole('button',{name:'Done',exact:true}).click();
}
async function scrollDown(p){await screen(p).evaluate(el=>el.scrollTop=el.scrollHeight);}
async function pinned(p,label){
  const back=p.locator('.app-top').getByRole('button',{name:label,exact:true});
  await expect(p.getByRole('button',{name:label,exact:true})).toHaveCount(1);
  await expect(back).toBeInViewport({ratio:1});
  const action=await back.getAttribute('data-action');
  await expect(p.locator('[data-action="'+action+'"]')).toHaveCount(1);
  await expect(p.locator('#screen-content').getByRole('button',{name:/^Back(?: to |$)/})).toHaveCount(0);
  const geometry=await p.evaluate(()=>({header:document.querySelector('.app-top').getBoundingClientRect().toJSON(),body:document.querySelector('.app-body').getBoundingClientRect().toJSON(),back:document.querySelector('.app-return button').getBoundingClientRect().toJSON(),title:document.querySelector('#screen-content h2').getBoundingClientRect().toJSON(),scroll:document.querySelector('.app-body').scrollTop}));
  expect(geometry.header.x).toBeCloseTo(geometry.body.x,1);expect(geometry.header.width).toBeCloseTo(geometry.body.width,1);
  expect(geometry.back.x).toBeCloseTo(geometry.title.x,1);expect(geometry.back.height).toBeGreaterThanOrEqual(44);expect(geometry.back.width).toBeGreaterThanOrEqual(44);
  if(geometry.scroll===0)expect(geometry.back.bottom).toBeLessThanOrEqual(geometry.title.top);
  await expect(p.locator('.app-top').getByRole('button',{name:'Help',exact:true})).toBeInViewport({ratio:1});
  await expect(p.getByRole('navigation',{name:'Main app sections'})).toBeInViewport({ratio:1});
  for(const button of await p.locator('.app-nav button').all())await expect(button).toBeInViewport({ratio:1});
  const pageScroll=await p.evaluate(()=>({y:scrollY,height:document.documentElement.scrollHeight,viewport:innerHeight}));
  expect(pageScroll.y).toBe(0);expect(pageScroll.height).toBeLessThanOrEqual(pageScroll.viewport);
  const fit=await p.evaluate(()=>({page:document.documentElement.scrollWidth,width:innerWidth,content:document.querySelector('.app-body').scrollWidth,available:document.querySelector('.app-body').clientWidth}));
  expect(fit.page).toBeLessThanOrEqual(fit.width);expect(fit.content).toBeLessThanOrEqual(fit.available);
}
async function arrived(p,id){expect((await state(p)).screen).toBe(id);await expect(screen(p)).toBeFocused();expect(await screen(p).evaluate(el=>el.scrollTop)).toBe(0);}
async function directEntry(p){
  const next=await p.context().newPage();await next.setViewportSize(p.viewportSize());await next.clock.install({time:instant});await p.close();await next.goto('/');return next;
}
async function sampleVisit(p){await nav(p,'Visits');await p.locator('[data-action="appointment:sample-visit"]').click();}

for(const width of [320,360,390]){
  test('appointment parent returns after save, scroll, refresh and direct entry at '+width,async({page})=>{
    let p=page;await start(p,width);await nav(p,'Visits');await p.getByRole('button',{name:'Add appointment',exact:true}).click();
    await p.getByLabel('Clinician or title').fill('Hello 1');await p.getByLabel('Date',{exact:true}).fill('2026-10-26');await p.getByLabel('Time',{exact:true}).fill('15:51');
    await p.getByLabel('Location and room').fill('Tabba MTC25');await p.getByLabel('Reminder',{exact:true}).selectOption('day-before');await p.getByRole('button',{name:'Save appointment',exact:true}).click();
    await arrived(p,'visit');await expect(p.getByRole('heading',{name:'Hello 1',exact:true})).toBeVisible();
    const back=p.locator('.app-top').getByRole('button',{name:'Back to Visits',exact:true});await expect(back).toBeInViewport({ratio:1});
    const backBox=await back.boundingBox(),titleBox=await p.getByRole('heading',{name:'Hello 1',exact:true}).boundingBox();expect(backBox.y+backBox.height).toBeLessThanOrEqual(titleBox.y);const before=await records(p),id=(await state(p)).selectedAppointmentId;
    await scrollDown(p);expect(await screen(p).evaluate(el=>el.scrollTop)).toBeGreaterThan(0);await pinned(p,'Back to Visits');
    await p.getByRole('button',{name:'View reminder',exact:true}).click();await arrived(p,'visitReminder');await scrollDown(p);await pinned(p,'Back to appointment');
    await p.getByRole('button',{name:'Back to appointment',exact:true}).click();await arrived(p,'visit');expect(await records(p)).toEqual(before);
    await p.getByRole('button',{name:'View reminder',exact:true}).click();await p.reload();expect(await screen(p).evaluate(el=>el.scrollTop)).toBe(0);await scrollDown(p);await p.getByRole('button',{name:'Back to appointment',exact:true}).click();await arrived(p,'visit');
    await p.reload();await scrollDown(p);await pinned(p,'Back to Visits');await p.getByRole('button',{name:'Back to Visits',exact:true}).click();await arrived(p,'visits');
    await p.locator('[data-action="appointment:'+id+'"]').click();await p.getByRole('button',{name:'View reminder',exact:true}).click();p=await directEntry(p);
    await scrollDown(p);await pinned(p,'Back to appointment');await p.getByRole('button',{name:'Back to appointment',exact:true}).click();await arrived(p,'visit');
    p=await directEntry(p);await scrollDown(p);await pinned(p,'Back to Visits');await p.getByRole('button',{name:'Back to Visits',exact:true}).click();await arrived(p,'visits');expect(await records(p)).toEqual(before);
  });

  test('saved medicine and reminder have explicit returns at '+width,async({page})=>{
    let p=page;await start(p,width);await nav(p,'Medicine');await p.getByRole('button',{name:'Add medicine',exact:true}).click();
    await p.getByLabel('Medicine name').fill('Fictional daily medicine for clear return navigation');await p.getByLabel('Daily reminder time',{exact:true}).fill('08:15');await p.getByRole('button',{name:'Save medicine',exact:true}).click();
    await arrived(p,'medicinedetail');await expect(p.getByRole('heading',{name:'Fictional daily medicine for clear return navigation',exact:true})).toBeVisible();const before=await records(p),id=(await state(p)).selectedMedicineId;
    await scrollDown(p);await pinned(p,'Back to Medicine');await p.getByRole('button',{name:'Open reminder',exact:true}).click();await arrived(p,'dose');
    await scrollDown(p);expect(await screen(p).evaluate(el=>el.scrollTop)).toBeGreaterThan(0);await pinned(p,'Back to Medicine');await p.getByRole('button',{name:'Back to Medicine',exact:true}).click();await arrived(p,'meds');expect(await records(p)).toEqual(before);
    await p.locator('[data-action="medicine:'+id+'"]').click();await p.reload();expect(await screen(p).evaluate(el=>el.scrollTop)).toBe(0);await scrollDown(p);await p.getByRole('button',{name:'Back to Medicine',exact:true}).click();await arrived(p,'meds');
    await p.locator('[data-action="medicine:'+id+'"]').click();p=await directEntry(p);await scrollDown(p);await pinned(p,'Back to Medicine');await p.getByRole('button',{name:'Back to Medicine',exact:true}).click();await arrived(p,'meds');expect(await records(p)).toEqual(before);
  });

  test('all create/edit Cancel actions use parents after scrolling, refresh and direct entry at '+width,async({page})=>{
    let p=page;await start(p,width);const before=await records(p);
    const forms=[
      {section:'Medicine',add:'Add medicine',parent:'meds'},
      {section:'Medicine',edit:'[data-action="editmedicine:A"]',parent:'medicinedetail'},
      {section:'Visits',add:'Add appointment',parent:'visits'},
      {section:'Visits',open:sampleVisit,edit:'[data-action="go:editappointment"]',parent:'visit'},
      {section:'People',add:'Add contact',parent:'people'},
      {section:'People',open:async p=>p.locator('[data-action="person:0"]').click(),edit:'[data-action="go:editcontact"]',parent:'contact'}
    ];
    for(const f of forms){
      await nav(p,f.section);if(f.open)await f.open(p);if(f.add)await p.getByRole('button',{name:f.add,exact:true}).click();else await p.locator(f.edit).click();
      await p.locator('.app-field input').first().fill('Unsaved fictional draft');await scrollDown(p);await pinned(p,'Cancel');
      await p.getByRole('button',{name:'Cancel',exact:true}).click();await arrived(p,f.parent);expect(await records(p)).toEqual(before);
      // Reopen the same form, then remove all navigation-stack context by reload.
      await nav(p,f.section);if(f.open)await f.open(p);if(f.add)await p.getByRole('button',{name:f.add,exact:true}).click();else await p.locator(f.edit).click();
      await p.reload();await p.locator('.app-field input').first().fill('Another unsaved fictional draft');await scrollDown(p);await pinned(p,'Cancel');
      p=await directEntry(p);await scrollDown(p);await pinned(p,'Cancel');await p.getByRole('button',{name:'Cancel',exact:true}).click();await arrived(p,f.parent);expect(await records(p)).toEqual(before);
    }
  });

  test('editing and saving every record shows that record with its parent action at '+width,async({page})=>{
    await start(page,width);const p=page;
    await nav(p,'Medicine');await p.locator('[data-action="editmedicine:A"]').click();await p.getByLabel('Medicine name').fill('Edited fictional medicine');await p.getByRole('button',{name:'Save medicine',exact:true}).click();await arrived(p,'medicinedetail');await pinned(p,'Back to Medicine');await expect(p.getByRole('heading',{name:'Edited fictional medicine',exact:true})).toBeVisible();
    await sampleVisit(p);await p.getByRole('button',{name:'Edit appointment',exact:true}).click();await p.getByLabel('Clinician or title').fill('Edited fictional visit');await p.getByRole('button',{name:'Save appointment',exact:true}).click();await arrived(p,'visit');await pinned(p,'Back to Visits');await expect(p.getByRole('heading',{name:'Edited fictional visit',exact:true})).toBeVisible();
    await nav(p,'People');await p.locator('[data-action="person:0"]').click();await p.getByRole('button',{name:'Edit contact',exact:true}).click();await p.getByLabel('Name',{exact:true}).fill('Edited fictional helper');await p.getByRole('button',{name:'Save contact',exact:true}).click();await arrived(p,'contact');await pinned(p,'Back to People');await expect(p.getByRole('heading',{name:'Edited fictional helper',exact:true})).toBeVisible();
  });
}

test('keyboard return resets scrolling and focuses content; form errors still focus the invalid field',async({page})=>{
  await start(page,320);await sampleVisit(page);const before=await records(page);await scrollDown(page);
  const back=page.getByRole('button',{name:'Back to Visits',exact:true});await back.focus();await page.keyboard.press('Enter');await arrived(page,'visits');expect(await records(page)).toEqual(before);
  await page.getByRole('button',{name:'Add appointment',exact:true}).click();await scrollDown(page);await page.getByRole('button',{name:'Save appointment',exact:true}).click();await expect(page.getByLabel('Clinician or title')).toBeFocused();await expect(page.getByLabel('Clinician or title')).toBeInViewport({ratio:1});await pinned(page,'Cancel');
  await page.getByRole('button',{name:'Cancel',exact:true}).focus();await page.keyboard.press('Enter');await arrived(page,'visits');expect(await records(page)).toEqual(before);
});

for(const width of [320,360,390,1280])test('one aligned persistent parent across records, contacts, settings and confirmations at '+width,async({page})=>{
  await start(page,width);const before=await records(page);
  // Each screen is reached with its actual button, then restored without a stack.
  const routes=[
    {open:async()=>{await nav(page,'Medicine');await page.locator('[data-action="medicine:A"]').click();},label:'Back to Medicine',parent:'meds'},
    {open:async()=>{await nav(page,'Medicine');await page.getByRole('button',{name:'View all records',exact:true}).click();},label:'Back to Medicine',parent:'meds'},
    {open:async()=>{await nav(page,'People');await page.locator('[data-action="person:0"]').click();},label:'Back to People',parent:'people'},
    {open:async()=>{await nav(page,'People');await page.locator('[data-action="person:0"]').click();await page.getByRole('button',{name:'Call preview',exact:true}).click();},label:'Back to People',parent:'people',cancel:'contact'},
    {open:async()=>{await nav(page,'Medicine');await page.locator('[data-action="medicine:A"]').click();await page.getByRole('button',{name:'Postpone reminder',exact:true}).click();},label:'Back to Medicine',parent:'meds',cancel:'dose'},
    {open:async()=>{await sampleVisit(page);await page.getByRole('button',{name:'Delete appointment',exact:true}).click();},label:'Back to Visits',parent:'visits',cancel:'visit'},
    {open:async()=>{await nav(page,'Medicine');await page.locator('[data-action="editmedicine:A"]').click();await page.getByRole('button',{name:'Archive medicine',exact:true}).click();},label:'Back to Medicine',parent:'meds',cancel:'editmedicine'},
    {open:()=>page.getByRole('button',{name:'Comfort settings',exact:true}).click(),label:'Back to Today',parent:'home'},
    {open:()=>page.getByRole('button',{name:'Help',exact:true}).click(),label:'Back to Today',parent:'home'}
  ];
  for(const route of routes){
    await route.open();await pinned(page,route.label);const box=await page.locator('.app-top').boundingBox();
    await scrollDown(page);await pinned(page,route.label);expect(await page.locator('.app-top').boundingBox()).toEqual(box);
    if(route.cancel){await page.getByRole('button',{name:'Cancel',exact:true}).click();await arrived(page,route.cancel);expect(await records(page)).toEqual(before);await route.open();}
    await page.reload();await pinned(page,route.label);expect(await screen(page).evaluate(el=>el.scrollTop)).toBe(0);
    await scrollDown(page);await page.getByRole('button',{name:route.label,exact:true}).click();await arrived(page,route.parent);expect(await records(page)).toEqual(before);
  }
});
