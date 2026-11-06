import {test,expect} from '@playwright/test';
const state=p=>p.evaluate(()=>JSON.parse(localStorage.getItem('saha:v1:participant')).state);
const nav=(p,id)=>p.locator('[data-action="nav:'+id+'"]').click();
async function start(p){await p.clock.install({time:new Date('2026-10-25T12:00:00')});await p.goto('/');await p.getByRole('button',{name:'Start with Today',exact:true}).click();}
async function add(p,kind){await nav(p,{medicine:'meds',appointment:'visits',contact:'people'}[kind]);await p.getByRole('button',{name:'Add '+kind,exact:true}).click();}
async function dark(p){await p.getByRole('button',{name:'Comfort settings',exact:true}).click();await p.getByLabel('Dark mode',{exact:true}).check();await p.getByRole('button',{name:'Largest text',exact:true}).click();await p.getByLabel('Stronger contrast',{exact:true}).check();await p.getByLabel('More space',{exact:true}).check();await p.getByRole('button',{name:'Done',exact:true}).click();}
async function mockVoice(p){await p.addInitScript(()=>{window.__voices=[];window.SpeechRecognition=class{
 constructor(){window.__voices.push(this);this.started=false;this.aborted=false;}
 start(){this.started=true;this.onstart?.();}stop(){this.onend?.();}abort(){this.aborted=true;this.onend?.();}
 };});}
const result=(p,text)=>p.evaluate(text=>{const v=window.__voices.at(-1);v.onresult({results:[Object.assign([{transcript:text}],{isFinal:true})]});},text);

test('voice typing requires consent/start and review/use/save; raw transcript stays out of storage',async({page})=>{
 await mockVoice(page);await start(page);await add(page,'medicine');
 await expect(page.getByRole('region',{name:'Add medicine',exact:true})).toBeFocused();
 await page.getByRole('button',{name:'Dictate medicine name',exact:true}).click();await expect(page.getByText(/browser may send audio/)).toBeVisible();expect(await page.evaluate(()=>window.__voices.length)).toBe(0);
 await expect(page.getByRole('button',{name:'Start microphone',exact:true})).toBeFocused();await page.getByRole('button',{name:'Start microphone',exact:true}).click();await expect(page.locator('#voice-status')).toContainText('Listening');
 await result(page,'<img src=x onerror=alert(1)> fictional medicine');await expect(page.locator('#voice-panel img')).toHaveCount(0);await expect(page.getByLabel('Medicine name',{exact:true})).toHaveValue('');
 expect(await page.evaluate(()=>localStorage.getItem('saha:v1:participant'))).not.toContain('onerror');await page.getByLabel('Review dictated text').fill('Fictional reviewed name');
 await page.getByRole('button',{name:'Use text',exact:true}).click();await expect(page.getByLabel('Medicine name',{exact:true})).toHaveValue('Fictional reviewed name');await expect(page.getByLabel('Medicine name',{exact:true})).toBeFocused();expect((await state(page)).medicines).toHaveLength(2);
 await page.getByLabel('Daily reminder time',{exact:true}).fill('08:30');await page.getByRole('button',{name:'Save medicine',exact:true}).click();await expect(page.locator('#toast')).toContainText('Medicine saved');expect((await state(page)).medicines).toHaveLength(3);expect((await state(page)).formDrafts).toEqual({});
});

test('permission denial, stop, cancellation, late events and navigation keep fields and records safe',async({page})=>{
 await mockVoice(page);await start(page);await add(page,'contact');await page.getByLabel('Name',{exact:true}).fill('Existing draft');
 const open=()=>page.getByRole('button',{name:'Dictate name',exact:true}).click(),mic=()=>page.getByRole('button',{name:'Start microphone',exact:true}).click();
 await open();await mic();await page.evaluate(()=>window.__voices.at(-1).onerror({error:'not-allowed'}));await expect(page.locator('#voice-status')).toContainText('permission was denied');await expect(page.getByRole('button',{name:'Start microphone',exact:true})).toBeVisible();await expect(page.getByLabel('Name',{exact:true})).toHaveValue('Existing draft');
 await mic();await page.getByRole('button',{name:'Stop listening',exact:true}).click();await expect(page.locator('#voice-status')).toContainText('No text received');
 await mic();await result(page,'Unaccepted text');await page.keyboard.press('Escape');await expect(page.locator('#voice-panel')).toBeHidden();await result(page,'Late result');await expect(page.getByLabel('Name',{exact:true})).toHaveValue('Existing draft');
 await open();await mic();await nav(page,'visits');await result(page,'Late result after navigation');await add(page,'contact');await expect(page.getByLabel('Name',{exact:true})).toHaveValue('Existing draft');expect((await state(page)).contacts).toHaveLength(2);
});

test('unsupported speech keeps typing available and no microphone starts on page load',async({page})=>{
 await page.addInitScript(()=>{Object.defineProperty(window,'SpeechRecognition',{value:undefined,configurable:true});Object.defineProperty(window,'webkitSpeechRecognition',{value:undefined,configurable:true});});
 await start(page);await add(page,'appointment');await page.getByRole('button',{name:'Dictate location and room',exact:true}).click();await expect(page.locator('#voice-status')).toContainText('unavailable');await expect(page.getByRole('button',{name:'Start microphone',exact:true})).toBeDisabled();await page.getByRole('button',{name:'Cancel voice typing',exact:true}).click();await expect(page.getByLabel('Location and room')).toBeFocused();await page.getByLabel('Location and room').fill('Fictional room');await page.reload();await expect(page.getByLabel('Location and room')).toHaveValue('Fictional room');
});

test('all form drafts survive navigation/refresh, Cancel and Discard clear them without saving records',async({page})=>{
 await start(page);for(const kind of ['medicine','appointment','contact']){
 await add(page,kind);const field=page.locator('form input').first();await field.fill('Unfinished '+kind);await nav(page,'home');await add(page,kind);await expect(field).toHaveValue('Unfinished '+kind);await page.reload();await expect(page.getByText('Unfinished form restored. Review before saving.',{exact:true})).toBeVisible();await expect(field).toHaveValue('Unfinished '+kind);
 await page.getByRole('button',{name:'Discard draft',exact:true}).click();await expect(field).toHaveValue('');await expect(field).toBeFocused();await field.fill('Cancelled draft');await page.getByRole('button',{name:'Cancel',exact:true}).click();await add(page,kind);await expect(field).toHaveValue('');await page.getByRole('button',{name:'Cancel',exact:true}).click();
 }const s=await state(page);expect(s.medicines).toHaveLength(2);expect(s.appointments).toHaveLength(1);expect(s.contacts).toHaveLength(2);expect(s.formDrafts).toEqual({});
});

test('edit drafts belong to their selected record and preserve saved originals until Save',async({page})=>{
 await start(page);await nav(page,'meds');await page.locator('[data-action="editmedicine:A"]').click();await page.getByLabel('Medicine name').fill('A draft');await nav(page,'meds');await page.locator('[data-action="editmedicine:B"]').click();await expect(page.getByLabel('Medicine name')).toHaveValue('Cetirizine (demo)');await page.getByLabel('Medicine name').fill('B draft');await nav(page,'meds');await page.locator('[data-action="editmedicine:A"]').click();await expect(page.getByLabel('Medicine name')).toHaveValue('A draft');expect((await state(page)).medicines.map(m=>m.name)).toEqual(['Vitamin D (demo)','Cetirizine (demo)']);await page.getByRole('button',{name:'Cancel',exact:true}).click();expect(Object.keys((await state(page)).formDrafts)).toEqual(['editmedicine:B']);
});

for(const width of [320,360,390,1280])test('dark theme covers screens and combines with largest text at '+width,async({page},info)=>{
 await page.setViewportSize({width,height:width===1280?900:740});await start(page);await dark(page);await page.reload();await expect(page.locator('#phone')).toHaveClass(/dark-mode.*largest-text high-contrast roomy/);
 for(const id of ['home','medicinedetail','meds','dose','taken','snooze','postponed','history','visits','visit','visitReminder','people','contact','call','calling','settings','help','welcome','comfort','gesture','missed','empty','offline','addmedicine','editmedicine','archivemedicine','addappointment','editappointment','deleteappointment','addcontact','editcontact','skipReminder','skipped','message','messagePreview','assistant']){
  await page.evaluate(id=>{const x=JSON.parse(localStorage.getItem('saha:v1:participant'));x.state.screen=id;localStorage.setItem('saha:v1:participant',JSON.stringify(x));},id);await page.reload();
  const sizes=await page.locator('.app-body').evaluate(el=>({width:el.clientWidth,scroll:el.scrollWidth,bg:getComputedStyle(el.parentElement).backgroundColor}));expect(sizes.scroll,id).toBeLessThanOrEqual(sizes.width);expect(sizes.bg,id).toBe('rgb(8, 15, 12)');
  for(const button of await page.locator('.app-nav button').all())await expect(button).toBeInViewport({ratio:1});
  const back=page.locator('.app-return button');if(await back.count()){
   await expect(back).toBeInViewport({ratio:1});const b=await back.boundingBox(),h=await page.locator('.app-body h2').boundingBox();expect(b.x,id).toBeCloseTo(h.x,1);
  }
 }
 await add(page,'medicine');await page.getByRole('button',{name:'Save medicine',exact:true}).click();await expect(page.getByLabel('Medicine name')).toBeFocused();await expect(page.getByLabel('Medicine name')).toHaveAttribute('aria-invalid','true');expect(await page.locator('#form-error').evaluate(e=>getComputedStyle(e).color)).toBe('rgb(255, 180, 173)');
 await page.screenshot({path:info.outputPath('dark-form-error.png')});
});

test('dark B/C have identical content/presentation and theme is frozen in study settings',async({page})=>{
 await start(page);await dark(page);const results=[];
 for(const condition of ['B','C']){await page.evaluate(condition=>{const x=JSON.parse(localStorage.getItem('saha:v1:participant'));Object.assign(x.state,{condition,screen:'visit'});localStorage.setItem('saha:v1:participant',JSON.stringify(x));},condition);await page.reload();results.push(await page.locator('#app').evaluate(e=>({html:e.innerHTML,color:getComputedStyle(e).color,bg:getComputedStyle(e).backgroundColor})));}expect(results[0]).toEqual(results[1]);
 await page.goto('/studio/');await page.getByRole('button',{name:'Comfort settings',exact:true}).click();await page.getByLabel('Dark mode',{exact:true}).check();await page.locator('[data-pref="gestures"]').check();await page.locator('[data-view="study"]').click();await page.locator('#participant-code').fill('DARK');await page.getByRole('button',{name:'Create new coded session',exact:true}).click();const r=await page.evaluate(()=>JSON.parse(localStorage.getItem('saha:v1:research')));expect(r.sessions.at(-1).config.dark).toBe(true);
});

test('speech timeout, network failure and backgrounding recover without accepting text',async({page})=>{
 await mockVoice(page);await start(page);await add(page,'medicine');
 const open=()=>page.getByRole('button',{name:'Dictate medicine name',exact:true}).click(),mic=()=>page.getByRole('button',{name:'Start microphone',exact:true}).click();
 await open();await mic();await page.evaluate(()=>window.__voices.at(-1).onerror({error:'network'}));await expect(page.locator('#voice-status')).toContainText('could not connect');await mic();await page.clock.runFor(60001);await expect(page.locator('#voice-status')).toContainText('one minute');expect(await page.evaluate(()=>window.__voices.at(-1).aborted)).toBe(true);
 await mic();await page.evaluate(()=>{Object.defineProperty(document,'hidden',{value:true,configurable:true});document.dispatchEvent(new Event('visibilitychange'));});await expect(page.locator('#voice-panel')).toBeHidden();await result(page,'Late background speech');await expect(page.getByLabel('Medicine name')).toHaveValue('');
 await page.evaluate(()=>{Object.defineProperty(document,'hidden',{value:false,configurable:true});document.dispatchEvent(new Event('visibilitychange'));});await open();await expect(page.getByRole('button',{name:'Start microphone',exact:true})).toBeEnabled();
});

test('dark palettes keep rendered participant text readable in normal and stronger contrast',async({page})=>{
 await start(page);await dark(page);const problems=[];
 for(const contrast of [false,true])for(const screen of ['home','dose','snooze','taken','postponed','history','visit','visitReminder','contact','calling','settings','help','welcome','addmedicine','addappointment','addcontact']){
  await page.evaluate(({screen,contrast})=>{const x=JSON.parse(localStorage.getItem('saha:v1:participant'));Object.assign(x.state,{screen,contrast});localStorage.setItem('saha:v1:participant',JSON.stringify(x));},{screen,contrast});await page.reload();
  problems.push(...await page.locator('#phone').evaluate(root=>{
   const rgb=s=>s.match(/[\d.]+/g).map(Number),lum=c=>c.slice(0,3).map(v=>{v/=255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4;}).reduce((a,v,i)=>a+v*[.2126,.7152,.0722][i],0),found=[];
   for(const el of root.querySelectorAll('h2,h3,p,small,strong,label,button,a,summary,input,select,textarea,.app-badge,.mini-brand')){
    if(!el.getClientRects().length||el.closest('[hidden]')||el.matches(':disabled')||el.closest('button:disabled'))continue;
    if(!['INPUT','SELECT','TEXTAREA'].includes(el.tagName)&&![...el.childNodes].some(n=>n.nodeType===3&&n.textContent.trim()))continue;
    let parent=el,bg;while(parent){const c=rgb(getComputedStyle(parent).backgroundColor);if(c.length===3||c[3]===1){bg=c;break;}parent=parent.parentElement;}
    if(!bg)continue;const isSwitch=el.matches('input[type=checkbox]'),fg=rgb(isSwitch?getComputedStyle(el,'::after').backgroundColor:getComputedStyle(el).color),ratio=(Math.max(lum(fg),lum(bg))+.05)/(Math.min(lum(fg),lum(bg))+.05);
    if(ratio<(isSwitch?3:4.5))found.push({text:(el.textContent||el.getAttribute('aria-label')||el.tagName).trim().slice(0,45),ratio,color:getComputedStyle(el).color,background:bg});
   }return found;
  }));
 }expect(problems).toEqual([]);
});


test('personal and study drafts stay separate and speech events omit the dictated text',async({page})=>{
 await mockVoice(page);await start(page);await add(page,'medicine');await page.getByLabel('Medicine name').fill('Personal fictional draft');
 const personal=await page.evaluate(()=>localStorage.getItem('saha:v1:participant'));
 await page.evaluate(()=>{const x=JSON.parse(localStorage.getItem('saha:v1:participant'));x.state.recordsMode='study';x.state.formDrafts={};localStorage.setItem('saha:v1:scenario',JSON.stringify(x));localStorage.setItem('saha:v1:workspace',JSON.stringify('study'));});await page.reload();
 await expect(page.getByLabel('Medicine name')).toHaveValue('');await page.getByRole('button',{name:'Dictate medicine name',exact:true}).click();await page.getByRole('button',{name:'Start microphone',exact:true}).click();await result(page,'Unique fictional study transcript');await page.getByRole('button',{name:'Use text',exact:true}).click();
 const data=await page.evaluate(()=>({personal:localStorage.getItem('saha:v1:participant'),study:localStorage.getItem('saha:v1:scenario'),research:localStorage.getItem('saha:v1:research')}));
 expect(data.personal).toBe(personal);expect(data.study).toContain('Unique fictional study transcript');expect(data.research).not.toContain('Unique fictional study transcript');expect(JSON.parse(data.research).events.some(e=>e.type==='voice_text_used')).toBe(true);
 await page.evaluate(()=>localStorage.setItem('saha:v1:workspace',JSON.stringify('personal')));await page.reload();await expect(page.getByLabel('Medicine name')).toHaveValue('Personal fictional draft');
});
