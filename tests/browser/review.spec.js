import {test,expect} from '@playwright/test';
const saved=p=>p.evaluate(()=>JSON.parse(localStorage.getItem('saha:v1:participant')).state);
const nav=(p,id)=>p.locator('[data-action="nav:'+id+'"]').click();
async function start(p,time='08:40:00'){await p.clock.install({time:new Date('2026-10-25T'+time)});await p.goto('/');await p.getByRole('button',{name:'Start with Today',exact:true}).click();}
test('Upcoming, Due now, Missed reminder and Taken update on the open page without acknowledging records',async({page})=>{
 await start(page);const hero=page.locator('.hero-card');await expect(hero).toContainText('Next up');await expect(hero).toContainText('in 20 min');await expect(hero.locator('.status-chip')).toContainText('Upcoming');
 const taken=hero.getByRole('button',{name:'Taken',exact:true});await taken.focus();await page.clock.fastForward(20*60000);await expect(hero.locator('.status-chip')).toContainText('Due now');await expect(taken).toBeFocused();await page.clock.fastForward(30*60000);await expect(hero.locator('.status-chip')).toContainText('Missed reminder');expect((await saved(page)).occurrences['A~2026-10-25'].status).toBe('pending');
 await page.reload();await expect(hero.locator('.status-chip')).toContainText('Missed reminder');await taken.click();await expect(page.getByRole('heading',{name:'Recorded taken',exact:true})).toBeVisible();await nav(page,'meds');await expect(page.locator('[data-occurrence="A~2026-10-25"] .status-chip')).toContainText('Taken');
});
test('Skip requires confirmation, does not record ingestion, and can be restored',async({page})=>{
 await start(page,'12:00:00');await page.locator('.hero-card').getByRole('button',{name:'Skip',exact:true}).click();await page.getByRole('button',{name:'Cancel',exact:true}).click();expect((await saved(page)).occurrences['A~2026-10-25'].status).toBe('pending');await page.getByRole('button',{name:'Skip',exact:true}).click();await page.getByRole('button',{name:'Confirm skip',exact:true}).click();await page.reload();let s=await saved(page);expect(s.occurrences['A~2026-10-25'].status).toBe('skipped');expect(s.occurrences['A~2026-10-25'].takenAt).toBeUndefined();await page.getByRole('button',{name:'Restore reminder',exact:true}).click();s=await saved(page);expect(s.occurrences['A~2026-10-25'].status).toBe('pending');
});
test('reminders appear on Today, with past visits removed from both list and reminders',async({page})=>{
 await start(page,'12:00:00');await page.evaluate(()=>{const x=JSON.parse(localStorage.getItem('saha:v1:participant'));Object.assign(x.state.appointments[0],{date:'2026-10-26',time:'11:00',reminder:'day-before'});localStorage.setItem('saha:v1:participant',JSON.stringify(x));});await page.reload();await expect(page.locator('#foreground-reminders')).toContainText('Dr. Sara Ahmed');
 for(const id of ['meds','visits','people']){await nav(page,id);await expect(page.locator('#foreground-reminders')).toHaveCount(0);}
 await page.clock.fastForward(2*24*60*60000);await nav(page,'home');await expect(page.locator('#foreground-reminders')).not.toContainText('Dr. Sara Ahmed');await nav(page,'visits');await expect(page.locator('.app-body')).toContainText('No upcoming visits');
});
test('People Call and Message lead to confirmation/previews with no real outgoing action',async({page})=>{
 await start(page);await nav(page,'people');await page.getByRole('button',{name:'Call Nida (preview)',exact:true}).click();await expect(page.getByRole('heading',{name:'Call Nida?',exact:true})).toBeVisible();await page.getByRole('button',{name:'Cancel',exact:true}).click();await nav(page,'people');await page.getByRole('button',{name:'Message Nida (preview)',exact:true}).click();await page.getByLabel('Message text').fill('<script>fictional preview</script>');await page.getByRole('button',{name:'Preview message',exact:true}).click();await expect(page.getByText('No message sent.',{exact:true})).toBeVisible();await expect(page.locator('.app-body script')).toHaveCount(0);expect(await page.evaluate(()=>localStorage.getItem('saha:v1:participant'))).not.toContain('<script>');
});
for(const width of [320,1280])test('persistent reader, font floors and four keyboard-reachable tabs at '+width,async({page})=>{
 await page.setViewportSize({width,height:900});await start(page);await page.getByRole('button',{name:'Comfort settings',exact:true}).click();await page.getByRole('button',{name:'Largest text',exact:true}).click();await page.getByLabel('Dark mode',{exact:true}).check();await page.getByLabel('More space',{exact:true}).check();await page.getByRole('button',{name:'Done',exact:true}).click();
 for(const id of ['home','meds','visits','people']){
  await nav(page,id);const reader=page.getByRole('button',{name:'Read aloud',exact:true});await expect(reader).toHaveCount(1);await expect(reader).toBeInViewport({ratio:1});await page.locator('.app-body').evaluate(e=>e.scrollTop=e.scrollHeight);await expect(reader).toBeInViewport({ratio:1});
  const sizes=await page.evaluate(()=>({width:innerWidth,document:document.documentElement.scrollWidth,body:document.querySelector('.app-body').scrollWidth,available:document.querySelector('.app-body').clientWidth}));expect(sizes.document).toBeLessThanOrEqual(sizes.width);expect(sizes.body).toBeLessThanOrEqual(sizes.available);
  for(const b of await page.locator('.app-nav button').all()){await expect(b).toBeInViewport({ratio:1});expect(await b.evaluate(e=>parseFloat(getComputedStyle(e).fontSize))).toBeGreaterThanOrEqual(12);await b.focus();await expect(b).toBeFocused();}
 }
});

test('care and contact actions can be completed using Tab and Enter without pointer activation',async({page})=>{
 await start(page,'12:00:00');
 async function activate(target){for(let i=0;i<90;i++){if(await target.evaluate(e=>e===document.activeElement)){await page.keyboard.press('Enter');return;}await page.keyboard.press('Tab');}throw new Error('Could not reach control by Tab');}
 await activate(page.locator('.hero-card').getByRole('button',{name:'Snooze',exact:true}));await activate(page.getByRole('button',{name:'20 minutes',exact:true}));await activate(page.getByRole('button',{name:'Back to Medicine',exact:true}));
 await activate(page.locator('[data-occurrence="A~2026-10-25"]').getByRole('button',{name:'Taken',exact:true}));await activate(page.getByRole('button',{name:'Correct record',exact:true}));expect((await saved(page)).occurrences['A~2026-10-25'].status).toBe('pending');
 await activate(page.locator('[data-action="nav:people"]'));await activate(page.getByRole('button',{name:'Call Nida (preview)',exact:true}));await activate(page.getByRole('button',{name:'Cancel',exact:true}));await activate(page.locator('[data-action="nav:people"]'));await activate(page.getByRole('button',{name:'Message Nida (preview)',exact:true}));
 const input=page.getByLabel('Message text');for(let i=0;i<70&&!await input.evaluate(e=>e===document.activeElement);i++)await page.keyboard.press('Tab');await expect(input).toBeFocused();await page.keyboard.type('Fictional keyboard message');await activate(page.getByRole('button',{name:'Preview message',exact:true}));await expect(page.getByText('No message sent.',{exact:true})).toBeVisible();
});
