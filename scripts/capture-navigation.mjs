import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
const origin=new URL(process.argv[2]||'http://localhost:5173/');
if(!['localhost','127.0.0.1'].includes(origin.hostname))throw new Error('Use a local Saha URL.');
const phase=process.argv.includes('--before')?'before':'after';
const output=fileURLToPath(new URL('../playwright-report/aligned-navigation/',import.meta.url));await mkdir(output,{recursive:true});
const browser=await chromium.launch({channel:process.env.SAHA_BROWSER_CHANNEL||'chrome'}),rows=[];
try {
 for(const v of [{label:'desktop-largest',width:1280,height:900,largest:true},{label:'729-default',width:729,height:821},{label:'320-largest',width:320,height:740,largest:true,mobile:true},{label:'360-largest',width:360,height:740,largest:true,mobile:true},{label:'390-largest',width:390,height:740,largest:true,mobile:true}]){
  const context=await browser.newContext({viewport:{width:v.width,height:v.height},hasTouch:!!v.mobile,isMobile:!!v.mobile});const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.clock.install({time:new Date('2026-10-25T15:51:00')});await page.goto(origin.href);
  await page.getByRole('button',{name:'Start with Today',exact:true}).click();
  if(v.largest){await page.getByRole('button',{name:'Comfort settings',exact:true}).click();await page.getByRole('button',{name:'Largest text',exact:true}).click();await page.locator('[data-pref="roomy"]').check();await page.getByRole('button',{name:'Done',exact:true}).click();}
  await page.locator('[data-action="nav:visits"]').click();await page.getByRole('button',{name:'Add appointment',exact:true}).click();await page.getByLabel('Clinician or title').fill('Hello 1');await page.getByLabel('Date',{exact:true}).fill('2026-10-26');await page.getByLabel('Time',{exact:true}).fill('15:51');await page.getByLabel('Location and room').fill('Tabba MTC25');await page.getByLabel('Reminder',{exact:true}).selectOption('day-before');await page.getByRole('button',{name:'Save appointment',exact:true}).click();
  const records=()=>page.evaluate(()=>{const s=JSON.parse(localStorage.getItem('saha:v1:participant')).state;return {medicines:s.medicines,occurrences:s.occurrences,appointments:s.appointments,contacts:s.contacts,events:s.events};});const before=await records();
  const metrics=async()=>{
   const value=await page.evaluate(()=>{
    const box=e=>e.getBoundingClientRect().toJSON(),nav=document.querySelector('.app-nav'),header=document.querySelector('.app-top'),back=header.querySelector('button[data-action^="go:"]:not([data-action="go:help"]):not([data-action="go:settings"])'),body=document.querySelector('.app-body');
    return {url:location.href,build:document.documentElement.dataset.build,width:innerWidth,height:innerHeight,visibleHeight:visualViewport.height,visibleTop:visualViewport.offsetTop,rootScrollY:scrollY,documentHeight:document.documentElement.scrollHeight,contentScrollTop:body.scrollTop,header:box(header),content:box(body),back:box(back),backLabel:back.innerText,title:box(body.querySelector('h2')),nav:box(nav),navButtons:[...nav.querySelectorAll('button')].map(e=>({label:e.innerText,rect:box(e)})),equivalentReturns:document.querySelectorAll('[data-action="'+back.dataset.action+'"]').length,focused:document.activeElement.id};
   });
   if(phase==='after'){
    for(const rect of [value.header,value.back,value.nav,...value.navButtons.map(b=>b.rect)]){assert.ok(rect.top>=value.visibleTop-.5);assert.ok(rect.bottom<=value.visibleTop+value.visibleHeight+.5);assert.ok(rect.left>=-.5&&rect.right<=value.width+.5);}
    assert.equal(value.rootScrollY,0);assert.ok(value.documentHeight<=value.height);assert.ok(Math.abs(value.back.left-value.title.left)<1);assert.ok(Math.abs(value.header.left-value.content.left)<1);assert.equal(value.header.width,value.content.width);assert.equal(value.equivalentReturns,1);
   }
   return value;
  };
  const saved=await metrics();if(phase==='after'){assert.ok(saved.back.bottom<=saved.title.top);assert.equal(saved.contentScrollTop,0);}await page.screenshot({path:output+phase+'-'+v.label+'.png'});
  await page.locator('.app-body').evaluate(el=>el.scrollTop=el.scrollHeight);const scrolled=await metrics();await page.screenshot({path:output+phase+'-'+v.label+'-scrolled.png'});
  let afterReview,afterRefresh,destination,otherScreens=[];
  if(phase==='after'){
   await page.getByRole('button',{name:'View reminder',exact:true}).click();otherScreens.push({screen:'appointment-reminder',...await metrics()});await page.getByRole('button',{name:'Back to appointment',exact:true}).click();afterReview=await metrics();assert.equal(afterReview.contentScrollTop,0);await page.reload();afterRefresh=await metrics();assert.equal(afterRefresh.contentScrollTop,0);
   await page.getByRole('button',{name:'Back to Visits',exact:true}).click();destination=await page.evaluate(()=>JSON.parse(localStorage.getItem('saha:v1:participant')).state.screen);assert.equal(destination,'visits');assert.deepEqual(await records(),before);
   for(const [screen,open] of [
    ['medicine',async()=>{await page.locator('[data-action="nav:meds"]').click();await page.locator('[data-action="medicine:A"]').click();}],
    ['records',()=>page.getByRole('button',{name:'View record',exact:true}).click()],
    ['contact',async()=>{await page.locator('[data-action="nav:people"]').click();await page.locator('[data-action="person:0"]').click();}],
    ['settings',()=>page.getByRole('button',{name:'Comfort settings',exact:true}).click()]
   ]){await open();otherScreens.push({screen,...await metrics()});await page.screenshot({path:output+phase+'-'+v.label+'-'+screen+'.png'});}
  }
  assert.deepEqual(errors,[]);rows.push({label:v.label,saved,scrolled,afterReview,afterRefresh,destination,recordsAndReminderStateUnchanged:phase==='after',otherScreens});await context.close();
 }
 await writeFile(output+phase+'-layout.json',JSON.stringify(rows,null,2));
 console.log(JSON.stringify(rows.map(r=>({url:r.saved.url,build:r.saved.build,viewport:[r.saved.width,r.saved.height],backLeft:r.saved.back.left,titleLeft:r.saved.title.left,returns:r.saved.equivalentReturns,back:[r.saved.back.top,r.saved.back.bottom],nav:[r.saved.nav.top,r.saved.nav.bottom],returnedTo:r.destination})),null,2));
}finally{await browser.close();}
