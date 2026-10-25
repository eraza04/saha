import { test, expect } from '@playwright/test';

test('direct participant/studio URLs, refresh and root assets work from the deployed tree',async({page,request})=>{
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('/');await expect(page.getByRole('heading',{name:'Welcome to Saha'})).toBeVisible();await page.reload();await expect(page.getByRole('button',{name:'Start with Today'})).toBeVisible();
  await page.goto('/studio/');await expect(page.locator('#condition')).toBeVisible();await page.reload();await expect(page.locator('#condition')).toBeVisible();
  await page.goto('/studio/#study');await expect(page.locator('#participant-code')).toBeVisible();await page.reload();await expect(page.locator('#participant-code')).toBeVisible();
  const redirect=await request.get('/studio',{maxRedirects:0});expect(redirect.status()).toBe(308);expect(new URL(redirect.headers().location,page.url()).pathname).toBe('/studio/');
  await page.goto('/studio');await expect(page).toHaveURL(url=>url.pathname==='/studio/');await expect(page.locator('#condition')).toBeVisible();
  for(const file of ['app.js','care-state.js','participant-screens.js','research-state.js','style.css','participant.css']){
    const response=await request.get('/'+file);expect(response.status(),file).toBe(200);expect(response.headers()['content-type'],file).toMatch(file.endsWith('.js')?/javascript/:/text\/css/);
  }
  await expect(page.locator('[href^="/docs/"]')).toHaveCount(0);expect(errors).toEqual([]);
});

test('private, source and research files are absent rather than rewritten to the participant app',async({request})=>{
  for(const filename of ['docs/EXPERIMENTAL_PLAN.md','docs/OBSERVATION_SHEET.csv','docs/DEPLOYMENT.md','README.md','BUILD_BRIEF.md','START_HERE.md','server.mjs','scripts/build.mjs','package.json','package-lock.json','vercel.json','.env','.env.local','.git/config','.vercel/project.json','exports/saha-P01-tasks.csv','research-exports/saha-P01-events.json','private/consent.pdf','credentials/token.json','test-results/.last-run.json','tests/care-state.test.mjs','unknown-route/']){
    const response=await request.get('/'+filename);expect(response.status(),filename).toBe(404);expect(await response.text(),filename).not.toContain('data-mode="studio"');
  }
});
