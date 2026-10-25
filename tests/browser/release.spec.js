import {test,expect} from '@playwright/test';
import {BUILD} from '../../care-state.js';

const saved=p=>p.evaluate(()=>JSON.parse(localStorage.getItem('saha:v1:participant')).state);
const section=(p,id)=>p.locator('[data-action="nav:'+id+'"]').click();
const scroll=p=>p.locator('.app-body').evaluate(el=>el.scrollTop=el.scrollHeight);
async function parent(p,label){
  const back=p.locator('.app-return').getByRole('button',{name:label,exact:true});
  await expect(p.getByRole('button',{name:label,exact:true})).toHaveCount(1);
  await expect(back).toBeInViewport({ratio:1});
  const action=await back.getAttribute('data-action');
  await expect(p.locator('#screen-content [data-action="'+action+'"]')).toHaveCount(0);
  const boxes=await p.evaluate(()=>{
    const box=s=>document.querySelector(s).getBoundingClientRect().toJSON();
    return {url:location.href,build:document.documentElement.dataset.build,header:box('.app-top'),back:box('.app-return button'),title:box('#screen-content h2'),content:box('.app-body'),nav:box('.app-nav'),width:innerWidth,height:innerHeight,rootScroll:scrollY,contentScroll:document.querySelector('.app-body').scrollTop};
  });
  expect(boxes.build).toBe(BUILD);expect(boxes.rootScroll).toBe(0);
  expect(boxes.header.x).toBeCloseTo(boxes.content.x,1);expect(boxes.header.width).toBeCloseTo(boxes.content.width,1);
  expect(boxes.back.x).toBeCloseTo(boxes.title.x,1);expect(boxes.back.height).toBeGreaterThanOrEqual(44);
  if(boxes.contentScroll===0)expect(boxes.back.bottom).toBeLessThanOrEqual(boxes.title.top);
  await expect(p.locator('.app-top')).toBeInViewport({ratio:1});
  for(const button of await p.locator('.app-nav button').all())await expect(button).toBeInViewport({ratio:1});
  return boxes;
}

for(const width of [320,360,390,1280])test.describe('release at '+width+'px',()=>{
  test.use({viewport:{width,height:width===1280?900:740},isMobile:width!==1280,hasTouch:width!==1280});
  test('medicine and appointment add/edit/save/back retain state with largest combined settings',async({page,context},info)=>{
    test.setTimeout(60000);
    const errors=[];page.on('pageerror',e=>errors.push(e.message));
    await page.clock.install({time:new Date('2026-10-25T12:00:00')});await page.goto('/');
    await page.getByRole('button',{name:'Start with Today',exact:true}).click();
    await page.getByRole('button',{name:'Comfort settings',exact:true}).click();
    await page.getByRole('button',{name:'Largest text',exact:true}).click();
    await page.locator('[data-pref="contrast"]').check();await page.locator('[data-pref="roomy"]').check();
    await page.getByRole('button',{name:'Done',exact:true}).click();

    await section(page,'meds');await page.getByRole('button',{name:'Add medicine',exact:true}).click();
    await parent(page,'Cancel');await page.getByLabel('Medicine name').fill('Release fictional medicine');
    await page.getByLabel('Daily reminder time',{exact:true}).fill('08:15');await page.getByRole('button',{name:'Save medicine',exact:true}).click();
    const medicineId=(await saved(page)).selectedMedicineId;await parent(page,'Back to Medicine');
    await page.getByRole('button',{name:'Edit medicine',exact:true}).click();await parent(page,'Cancel');
    await page.getByLabel('Medicine name').fill('Edited fictional medicine');await page.getByLabel('Daily reminder time (from tomorrow)').fill('14:45');
    await page.getByRole('button',{name:'Save medicine',exact:true}).click();await page.reload();
    await expect(page.getByRole('heading',{name:'Edited fictional medicine',exact:true})).toBeVisible();
    await expect(page.locator('#phone')).toHaveClass(/largest-text high-contrast roomy/);
    const medicineLayout=await parent(page,'Back to Medicine');
    await page.screenshot({path:info.outputPath('medicine-saved.png')});
    await scroll(page);await parent(page,'Back to Medicine');await page.getByRole('button',{name:'Back to Medicine',exact:true}).click();
    await expect(page.getByRole('heading',{name:'Medicine schedule',exact:true})).toBeVisible();
    const medicine=(await saved(page)).medicines.find(m=>m.id===medicineId);expect(medicine.time).toBe('14:45');
    await page.locator('[data-action="medicine:'+medicineId+'"]').click();await page.reload();await parent(page,'Back to Medicine');
    await page.getByRole('button',{name:'Back to Medicine',exact:true}).click();

    await section(page,'visits');await page.getByRole('button',{name:'Add appointment',exact:true}).click();await parent(page,'Cancel');
    await page.getByLabel('Clinician or title').fill('Release fictional visit');await page.getByLabel('Date',{exact:true}).fill('2026-10-26');
    await page.getByLabel('Time',{exact:true}).fill('15:51');await page.getByLabel('Location and room').fill('Tabba MTC25');
    await page.getByLabel('Reminder',{exact:true}).selectOption('day-before');await page.getByRole('button',{name:'Save appointment',exact:true}).click();
    await parent(page,'Back to Visits');const appointmentId=(await saved(page)).selectedAppointmentId;
    await page.getByRole('button',{name:'Edit appointment',exact:true}).click();await parent(page,'Cancel');
    await page.getByLabel('Clinician or title').fill('Edited fictional visit');await page.getByLabel('Date',{exact:true}).fill('2026-10-28');
    await page.getByLabel('Time',{exact:true}).fill('16:20');await page.getByLabel('Location and room').fill('Fictional clinic, Room 12');
    await page.getByRole('button',{name:'Save appointment',exact:true}).click();
    const appointmentLayout=await parent(page,'Back to Visits');await page.screenshot({path:info.outputPath('appointment-saved.png')});
    const before=await saved(page);await scroll(page);const scrolled=await parent(page,'Back to Visits');
    expect(scrolled.back).toEqual(appointmentLayout.back);expect(scrolled.nav).toEqual(appointmentLayout.nav);
    await page.screenshot({path:info.outputPath('appointment-scrolled.png')});
    await page.getByRole('button',{name:'View reminder',exact:true}).click();await page.reload();await parent(page,'Back to appointment');
    expect(await page.locator('.app-body').evaluate(el=>el.scrollTop)).toBe(0);
    await page.getByRole('button',{name:'Back to appointment',exact:true}).click();await parent(page,'Back to Visits');
    await page.reload();await parent(page,'Back to Visits');
    await expect(page.getByRole('heading',{name:'Edited fictional visit',exact:true})).toBeVisible();
    await expect(page.locator('.app-body')).toContainText('Room 12');await expect(page.locator('.app-body')).toContainText('4:20 pm');
    await page.getByRole('button',{name:'Back to Visits',exact:true}).click();await expect(page.getByRole('heading',{name:'Visits',exact:true})).toBeVisible();
    await page.locator('[data-action="appointment:'+appointmentId+'"]').click();
    const direct=await context.newPage();direct.on('pageerror',e=>errors.push(e.message));await direct.clock.install({time:new Date('2026-10-25T12:00:00')});await direct.goto('/');
    await parent(direct,'Back to Visits');await direct.getByRole('button',{name:'Back to Visits',exact:true}).click();
    await expect(direct.getByRole('heading',{name:'Visits',exact:true})).toBeVisible();
    const after=await saved(direct);for(const key of ['medicines','occurrences','appointments','contacts','events'])expect(after[key],key+' preserved by return navigation').toEqual(before[key]);
    expect(after.appointments.find(a=>a.id===appointmentId).acknowledgedReminderAt).toBeNull();expect(errors).toEqual([]);
    await info.attach('layout-and-build',{body:JSON.stringify({medicineLayout,appointmentLayout,scrolled},null,2),contentType:'application/json'});
  });
});
