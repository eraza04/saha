import test from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {Readable} from 'node:stream';
import {pipeline} from 'node:stream/promises';
import {streamText} from 'ai';
import {createMedicineHandler,BOUNDARY_REPLY} from '../lib/medicine-chat.mjs';
import {resolveChatModel} from '../lib/chat-provider.mjs';
import {formatChatText} from '../medicine-assistant.js';
const env={SAHA_CHAT_PROVIDER:'groq',SAHA_CHAT_ENABLED:'true',GROQ_API_KEY:'unit-test-only'};
const request=()=>new Request('http://localhost/api/medicine-chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({consent:true,stream:true,messages:[{role:'user',content:'Questions for a fictional pharmacist visit?'}]})});
const events=async response=>(await response.text()).trim().split('\n').map(JSON.parse);
function fake(parts){return ()=>({stream:(async function*(){yield* parts;})()});}

test('HTTP bridge delivers a screened sentence before the provider finishes',async()=>{
 let release,finished=false,aborted;const gate=new Promise(r=>release=r);
 const handler=createMedicineHandler({env,stream:options=>{aborted=options.abortSignal;return {stream:(async function*(){yield {type:'reasoning-delta',text:'private internal reasoning'};yield {type:'text-delta',text:'Ask your pharmacist. '};await gate;yield {type:'text-delta',text:'Check the leaflet.'};finished=true;yield {type:'finish',finishReason:'stop'};})()};}});
 const server=createServer(async(_,res)=>{const response=await handler(request());res.writeHead(response.status,Object.fromEntries(response.headers));res.flushHeaders();await pipeline(Readable.fromWeb(response.body),res);});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 try{const response=await fetch('http://127.0.0.1:'+server.address().port);assert.match(response.headers.get('content-type'),/x-ndjson/);const reader=response.body.getReader();let text='';while(!text.includes('"delta"'))text+=new TextDecoder().decode((await reader.read()).value);assert.equal(finished,false);assert.match(text,/Ask your pharmacist/);assert.doesNotMatch(text,/private internal/);release();while(true){const {done,value}=await reader.read();if(done)break;text+=new TextDecoder().decode(value);}assert.match(text,/"done"/);assert.equal(finished,true);assert.equal(aborted.aborted,true);}finally{release();await new Promise(r=>server.close(r));}
});

test('split unsafe instructions are withheld, replaced, and never sent as text deltas',async()=>{
 const handler=createMedicineHandler({env,stream:fake([{type:'text-delta',text:'Take\n500 '},{type:'text-delta',text:'mg daily.'},{type:'finish',finishReason:'stop'}])});
 const frames=await events(await handler(request()));assert.equal(frames.some(e=>e.type==='delta'),false);assert.equal(frames.find(e=>e.type==='replace').text,BOUNDARY_REPLY);assert.equal(frames.at(-1).kind,'boundary');
});

test('length-limited, broken and provider-failed streams do not claim a completed answer',async()=>{
 for(const parts of [[{type:'text-delta',text:'Partial sentence.'},{type:'finish',finishReason:'length'}],[{type:'text-delta',text:'Interrupted text'}],[{type:'error',error:Object.assign(new Error('private-token-and-question'),{statusCode:429})}]]){
  const handler=createMedicineHandler({env,stream:fake(parts)}),frames=await events(await handler(request()));assert.equal(frames.some(e=>e.type==='done'),false);assert.equal(frames.at(-1).type,'error');assert.doesNotMatch(JSON.stringify(frames),/private-token/);
 }
});

test('canceling the browser stream aborts generation',async()=>{
 let signal;const handler=createMedicineHandler({env,stream:options=>{signal=options.abortSignal;return {stream:(async function*(){await new Promise(r=>signal.addEventListener('abort',r,{once:true}));yield {type:'abort'};})()};}});
 const reader=(await handler(request())).body.getReader();await reader.read();await reader.cancel();assert.equal(signal.aborted,true);
});

test('real Groq SDK requests streaming and keeps provider reasoning out of the wire response',async()=>{
 let upstream;const transport=async(_,init)=>{upstream=JSON.parse(init.body);const chunks=[{choices:[{index:0,delta:{role:'assistant',reasoning:'private reasoning'}}]},{choices:[{index:0,delta:{content:'Ask your pharmacist. '}}]},{choices:[{index:0,delta:{content:'Check the leaflet.'}}]},{choices:[{index:0,delta:{},finish_reason:'stop'}]}];return new Response(chunks.map(c=>'data: '+JSON.stringify({id:'test',object:'chat.completion.chunk',created:1700000000,model:'openai/gpt-oss-20b',...c})+'\n\n').join('')+'data: [DONE]\n\n',{headers:{'Content-Type':'text/event-stream'}});};
 const handler=createMedicineHandler({env,stream:streamText,modelFor:config=>resolveChatModel(config,{fetch:transport})});const frames=await events(await handler(request()));assert.equal(upstream.stream,true);assert.equal(upstream.reasoning_effort,'low');assert.equal(upstream.max_tokens,1500);assert.equal(frames.at(-1).type,'done');assert.equal(frames.at(-1).text,'Ask your pharmacist. Check the leaflet.');assert.doesNotMatch(JSON.stringify(frames),/private reasoning|unit-test/);
});

test('chat formatting supports readable lists while escaping generated markup',()=>{
 const esc=s=>s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;');
 const html=formatChatText('**Questions**\n1. First question\n2. <img src=x onerror=alert(1)>\n[unsafe](javascript:alert(1))',esc);assert.match(html,/<strong>Questions<\/strong>/);assert.match(html,/<ol><li>First question/);assert.doesNotMatch(html,/<img|<a|<script/);assert.match(html,/&lt;img/);
});
