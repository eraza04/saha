import {test,expect} from '@playwright/test';
async function open(p){await p.goto('/');await p.getByRole('button',{name:'Start with Today',exact:true}).click();await p.getByRole('button',{name:'Ask about medicines',exact:true}).click();}
const stores=p=>p.evaluate(()=>JSON.stringify([localStorage.getItem('saha:v1:participant'),localStorage.getItem('saha:v1:research')]));

// A controlled fetch stream tests arrival timing, cancellation and incomplete
// answers without sending browser-test data to a paid/external provider.
async function controlledStream(page){
 await page.addInitScript(()=>{
  const original=window.fetch;window.chatRequests=[];window.chatStreams=[];
  window.fetch=(url,options)=>{
   if(url!=='/api/medicine-chat')return original(url,options);
   window.chatRequests.push(JSON.parse(options.body));let controller;
   const body=new ReadableStream({start(c){controller=c;},cancel(){}});
   window.chatStreams.push({push:event=>controller.enqueue(new TextEncoder().encode(JSON.stringify(event)+'\n')),close:()=>controller.close()});
   return Promise.resolve(new Response(body,{headers:{'Content-Type':'application/x-ndjson'}}));
  };
 });
}
async function send(page,text){await page.getByLabel('Message',{exact:true}).fill(text);await page.getByLabel('Allow sending to AI').check();await page.getByRole('button',{name:'Send',exact:true}).click();}
async function emit(page,event,index=0){await page.evaluate(({event,index})=>window.chatStreams[index].push(event),{event,index});}

test('live deltas render before completion without replacing the composer or stealing focus',async({page})=>{
 await controlledStream(page);await open(page);await send(page,'Fictional pharmacist question');
 await emit(page,{type:'start',provider:'groq',model:'openai/gpt-oss-20b'});
 await emit(page,{type:'delta',text:'First sentence. '});await expect(page.locator('.assistant-answer')).toHaveText('First sentence.');await expect(page.getByRole('button',{name:'Stop response'})).toBeVisible();
 const field=page.getByLabel('Message',{exact:true});await field.fill('My next question');await field.focus();await field.evaluate(e=>{e.originalField=true;e.setSelectionRange(3,3);});
 await emit(page,{type:'delta',text:'Second sentence.'});await expect(page.locator('.assistant-answer')).toContainText('Second sentence');await expect(field).toBeFocused();expect(await field.evaluate(e=>[e.originalField,e.selectionStart])).toEqual([true,3]);
 await emit(page,{type:'done',kind:'ai',text:'First sentence. Second sentence.',provider:'groq',model:'openai/gpt-oss-20b'});await expect(page.getByRole('button',{name:'Send',exact:true})).toBeVisible();await expect(field).toHaveValue('My next question');expect((await page.evaluate(()=>window.chatRequests[0])).stream).toBe(true);
});

test('Stop and broken connections retain questions and exclude partial replies from follow-up context',async({page})=>{
 await controlledStream(page);await open(page);await send(page,'First fictional question');await emit(page,{type:'delta',text:'Partial reply.'});await page.getByRole('button',{name:'Stop response'}).click();await expect(page.locator('#assistant-error')).toContainText('stopped');await expect(page.getByLabel('Message',{exact:true})).toHaveValue('First fictional question');
 await send(page,'Second fictional question');expect((await page.evaluate(()=>window.chatRequests[1])).messages).toEqual([{role:'user',content:'Second fictional question'}]);await emit(page,{type:'delta',text:'Another partial reply.'},1);await page.evaluate(()=>window.chatStreams[1].close());await expect(page.locator('#assistant-error')).toContainText('before the reply was complete');await expect(page.locator('.assistant-bot[data-state="complete"]')).toHaveCount(0);await expect(page.getByLabel('Message',{exact:true})).toHaveValue('Second fictional question');
});

test('reading earlier messages does not jump to new chunks; Latest reply restores following',async({page})=>{
 await controlledStream(page);await open(page);await send(page,'Fictional long answer request');await emit(page,{type:'delta',text:'A readable paragraph for the test.\n\n'.repeat(45)});
 const list=page.locator('.assistant-conversation');await list.evaluate(e=>e.scrollTop=0);await emit(page,{type:'delta',text:'The final arriving sentence.'});expect(await list.evaluate(e=>e.scrollTop)).toBe(0);await page.getByRole('button',{name:'Latest reply'}).click();expect(await list.evaluate(e=>e.scrollHeight-e.scrollTop-e.clientHeight)).toBeLessThan(5);
});

for(const width of [320,390,1280])test('streaming chat keeps composer, header and four nav tabs visible at '+width,async({page},info)=>{
 await page.setViewportSize({width,height:844});await controlledStream(page);await open(page);await page.getByRole('button',{name:'Comfort settings',exact:true}).click();await page.getByRole('button',{name:'Largest text',exact:true}).click();await page.getByLabel('Dark mode',{exact:true}).check();await page.getByLabel('More space',{exact:true}).check();await page.getByRole('button',{name:'Done',exact:true}).click();await page.getByRole('button',{name:'Ask about medicines',exact:true}).click();
 await send(page,'What questions could I ask my pharmacist?');await emit(page,{type:'delta',text:'**Questions for your pharmacist**\n1. What are the common side effects?\n2. How should I store this medicine?\n3. Who can I ask if I have concerns?\n\n'.repeat(8)});
 for(const element of [page.getByLabel('Message',{exact:true}),page.getByRole('button',{name:'Stop response'}),page.getByRole('button',{name:'Back to Medicine',exact:true}),...await page.locator('.app-nav button').all()])await expect(element).toBeInViewport({ratio:1});
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth&&document.documentElement.scrollHeight<=innerHeight)).toBe(true);expect(await page.locator('.assistant-conversation').evaluate(e=>e.scrollHeight>e.clientHeight)).toBe(true);expect(await page.locator('.assistant-conversation').evaluate(e=>e.clientHeight)).toBeGreaterThanOrEqual(140);expect(await page.locator('.app-body').evaluate(e=>e.scrollTop)).toBe(0);await page.screenshot({path:info.outputPath('chat-stream-largest-dark.png')});
});

test('largest text stays usable at 740px height and a short keyboard-sized viewport',async({page},info)=>{
 await page.setViewportSize({width:320,height:740});await controlledStream(page);await open(page);await page.getByRole('button',{name:'Comfort settings',exact:true}).click();await page.getByRole('button',{name:'Largest text',exact:true}).click();await page.getByRole('button',{name:'Done',exact:true}).click();await page.getByRole('button',{name:'Ask about medicines',exact:true}).click();
 await expect(page.getByRole('button',{name:'Latest reply'})).toBeHidden();expect(await page.locator('.assistant-conversation').evaluate(e=>e.clientHeight)).toBeGreaterThan(200);await expect(page.getByLabel('Message',{exact:true})).toBeInViewport({ratio:1});
 await page.setViewportSize({width:320,height:480});expect(await page.locator('.app-body').evaluate(e=>getComputedStyle(e).overflowY)).toBe('auto');await page.locator('.app-body').hover();await page.mouse.wheel(0,500);await expect.poll(()=>page.locator('.app-body').evaluate(e=>e.scrollTop)).toBeGreaterThan(0);await page.getByLabel('Message',{exact:true}).scrollIntoViewIfNeeded();await expect(page.getByLabel('Message',{exact:true})).toBeInViewport({ratio:1});await page.getByLabel('Message',{exact:true}).fill('Fictional question');await page.getByLabel('Allow sending to AI').check();await page.getByRole('button',{name:'Send',exact:true}).click();await emit(page,{type:'delta',text:'A streamed sentence in a short window.'});await expect(page.locator('.assistant-answer')).toContainText('streamed sentence');
 await page.getByRole('button',{name:'Stop response'}).scrollIntoViewIfNeeded();await expect(page.getByRole('button',{name:'Stop response'})).toBeInViewport({ratio:1});await expect(page.getByRole('button',{name:'Back to Medicine',exact:true})).toBeInViewport({ratio:1});for(const nav of await page.locator('.app-nav button').all())await expect(nav).toBeInViewport({ratio:1});expect(await page.locator('.assistant-conversation').evaluate(e=>getComputedStyle(e).overflowY)).toBe('visible');await page.screenshot({path:info.outputPath('chat-short-height.png')});
});

test('chat keeps B and C identical and preserves the conventional A presentation',async({page})=>{
 await open(page);const results=[];for(const condition of ['A','B','C']){
  await page.evaluate(condition=>{const x=JSON.parse(localStorage.getItem('saha:v1:participant'));Object.assign(x.state,{condition,size:'largest',contrast:true,roomy:true,gestures:true,dark:true,screen:'assistant'});localStorage.setItem('saha:v1:participant',JSON.stringify(x));},condition);await page.reload();
  results.push(await page.locator('#app').evaluate(e=>({html:e.innerHTML,font:getComputedStyle(e).fontSize,button:document.querySelector('#assistant-send').getBoundingClientRect().height})));
 }expect(results[1]).toEqual(results[2]);expect(results[0].font).toBe('16px');expect(results[1].font).toBe('25px');
});

test('assistant enforces consent, renders AI text safely and keeps chat out of stored care and exports',async({page})=>{
 let sent;await page.route('**/api/medicine-chat',async route=>{sent=route.request().postDataJSON();await route.fulfill({json:{kind:'ai',text:'<script>not executable</script> Check the medicine leaflet with a pharmacist.',provider:'groq',model:'openai/gpt-oss-20b'}});});
 await open(page);await page.getByLabel('Message',{exact:true}).fill('Fictional question unique-private-phrase');await page.getByRole('button',{name:'Send',exact:true}).click();await expect(page.locator('#assistant-error')).toContainText('Allow');expect(sent).toBeUndefined();await page.getByLabel('Allow sending to AI').check();await page.getByRole('button',{name:'Send',exact:true}).click();await expect(page.locator('.assistant-conversation')).toContainText('not executable');await expect(page.locator('.assistant-conversation script')).toHaveCount(0);expect(sent.messages).toHaveLength(1);expect(Object.keys(sent).sort()).toEqual(['consent','messages','stream']);expect(await stores(page)).not.toContain('unique-private-phrase');expect(await stores(page)).not.toContain('not executable');
 await expect(page.locator('.assistant-conversation')).toContainText('GPT-OSS 20B via Groq');await page.reload();await expect(page.getByRole('heading',{name:'Ask Saha',exact:true})).toBeVisible();await expect(page.locator('.chat-turn')).toHaveCount(0);await page.getByRole('button',{name:'Back to Medicine',exact:true}).click();await expect(page.getByRole('heading',{name:'Medicine schedule',exact:true})).toBeVisible();
});

test('provider limits are explained without losing the question',async({page})=>{
 await page.route('**/api/medicine-chat',route=>route.fulfill({status:429,json:{code:'provider_rate_limit',error:'The AI service has reached a request limit or is busy. Try again later. Your question is still here.'}}));await open(page);await page.getByLabel('Message',{exact:true}).fill('A fictional medicine question');await page.getByLabel('Allow sending to AI').check();await page.getByRole('button',{name:'Send',exact:true}).click();await expect(page.locator('#assistant-error')).toContainText('request limit');await expect(page.getByLabel('Message',{exact:true})).toHaveValue('A fictional medicine question');
});
test('urgent guidance is offline and does not contact a model or change medicine state',async({page})=>{
 let calls=0;await page.route('**/api/medicine-chat',route=>{calls++;return route.abort();});await open(page);const before=await page.evaluate(()=>JSON.parse(localStorage.getItem('saha:v1:participant')).state.occurrences);await page.getByLabel('Message',{exact:true}).fill('I took an extra dose');await page.getByRole('button',{name:'Send',exact:true}).click();await expect(page.locator('.assistant-urgent')).toContainText('Do not wait');expect(calls).toBe(0);expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('saha:v1:participant')).state.occurrences)).toEqual(before);
});
test('unconfigured and failed requests preserve typed questions; clear needs confirmation',async({page})=>{
 await open(page);await page.getByLabel('Message',{exact:true}).fill('Example side effects question');await page.getByLabel('Allow sending to AI').check();await page.getByRole('button',{name:'Send',exact:true}).click();await expect(page.locator('#assistant-error')).toContainText('not connected');await expect(page.getByLabel('Message',{exact:true})).toHaveValue('Example side effects question');await page.getByRole('button',{name:'New chat',exact:true}).click();await page.getByRole('button',{name:'Cancel',exact:true}).click();await expect(page.getByLabel('Message',{exact:true})).toHaveValue('Example side effects question');await page.getByRole('button',{name:'New chat',exact:true}).click();await page.getByRole('button',{name:'Confirm clear chat',exact:true}).click();await expect(page.getByLabel('Message',{exact:true})).toHaveValue('');await expect(page.getByLabel('Allow sending to AI')).not.toBeChecked();
});
test('leaving or stopping an in-flight request discards late results',async({page})=>{
 let finish;await page.route('**/api/medicine-chat',async route=>{await new Promise(r=>finish=r);await route.fulfill({json:{kind:'ai',text:'Late answer must not appear'}}).catch(()=>{});});await open(page);await page.getByLabel('Message',{exact:true}).fill('Example question');await page.getByLabel('Allow sending to AI').check();await page.getByRole('button',{name:'Send',exact:true}).click();await expect(page.getByRole('button',{name:'Stop response'})).toBeVisible();await page.getByRole('button',{name:'Back to Medicine',exact:true}).click();finish();await page.getByRole('button',{name:'Ask about medicines',exact:true}).click();await expect(page.locator('.assistant-conversation')).not.toContainText('Late answer');await expect(page.getByLabel('Message',{exact:true})).toHaveValue('Example question');
});
for(const width of [320,390,1280])test('assistant reflows with largest dark settings and one persistent parent at '+width,async({page},info)=>{
 await page.setViewportSize({width,height:900});await open(page);await page.getByRole('button',{name:'Comfort settings',exact:true}).click();await page.getByRole('button',{name:'Largest text',exact:true}).click();await page.getByLabel('Dark mode',{exact:true}).check();await page.getByLabel('More space',{exact:true}).check();await page.getByRole('button',{name:'Done',exact:true}).click();await page.getByRole('button',{name:'Ask about medicines',exact:true}).click();await page.getByRole('button',{name:'About & privacy',exact:true}).click();await page.locator('.assistant-conversation').evaluate(e=>e.scrollTop=e.scrollHeight);
 const bounds=await page.locator('.app-body').evaluate(e=>({width:e.clientWidth,scroll:e.scrollWidth}));expect(bounds.scroll).toBeLessThanOrEqual(bounds.width);const fieldStyle=await page.getByLabel('Message',{exact:true}).evaluate(e=>({size:parseFloat(getComputedStyle(e).fontSize),bg:getComputedStyle(e).backgroundColor}));expect(fieldStyle.size).toBeGreaterThanOrEqual(24);expect(fieldStyle.bg).not.toBe('rgb(255, 255, 255)');await expect(page.getByRole('button',{name:'Back to Medicine',exact:true})).toHaveCount(1);await expect(page.getByRole('button',{name:'Back to Medicine',exact:true})).toBeInViewport({ratio:1});await expect(page.getByRole('button',{name:'Read aloud',exact:true})).toBeInViewport({ratio:1});for(const b of await page.locator('.app-nav button').all())await expect(b).toBeInViewport({ratio:1});await page.screenshot({path:info.outputPath('assistant-largest-dark.png')});
});

test('question, consent and sending work using keyboard controls',async({page})=>{
 await page.route('**/api/medicine-chat',route=>route.fulfill({json:{kind:'ai',text:'Test substitute answer. Check with a pharmacist.'}}));await open(page);const field=page.getByLabel('Message',{exact:true});await field.focus();await page.keyboard.type('Fictional side effects question');await page.keyboard.press('Tab');await expect(page.getByLabel('Allow sending to AI')).toBeFocused();await page.keyboard.press('Space');await page.keyboard.press('Tab');await expect(page.getByRole('button',{name:'Send',exact:true})).toBeFocused();await page.keyboard.press('Enter');await expect(page.locator('.assistant-conversation')).toContainText('Test substitute answer');await expect(field).toBeFocused();
});

test('follow-up questions retain longer answers and full chats require an explicit new start',async({page})=>{
 let calls=0,followup;const answer='General information for a pharmacist discussion. '.repeat(120).trim();
 await page.route('**/api/medicine-chat',route=>{calls++;followup=route.request().postDataJSON();return route.fulfill({json:{kind:'ai',text:answer}});});
 await open(page);await page.getByLabel('Message',{exact:true}).fill('First fictional question');await page.getByLabel('Allow sending to AI').check();await page.getByRole('button',{name:'Send',exact:true}).click();await expect(page.locator('.assistant-message')).toHaveCount(2);
 await page.getByLabel('Message',{exact:true}).fill('A follow-up question');await page.getByRole('button',{name:'Send',exact:true}).click();await expect(page.locator('.assistant-message')).toHaveCount(4);expect(followup.messages).toHaveLength(3);expect(followup.messages[1].content).toBe(answer);
 await page.getByLabel('Message',{exact:true}).fill('Keep this third question');await page.getByRole('button',{name:'Send',exact:true}).click();await expect(page.locator('#assistant-error')).toContainText('This chat is full');expect(calls).toBe(2);await expect(page.getByLabel('Message',{exact:true})).toHaveValue('Keep this third question');await expect(page.locator('.assistant-message')).toHaveCount(4);
});
