import test from 'node:test';
import assert from 'node:assert/strict';
import {generateText} from 'ai';
import {chatConfiguration,resolveChatModel,GEMMA_MODEL} from '../lib/chat-provider.mjs';
import {createMedicineHandler,MEDICINE_INSTRUCTIONS} from '../lib/medicine-chat.mjs';

const configured={SAHA_CHAT_ENABLED:'true',OPENROUTER_API_KEY:'openrouter-unit-test-key'};
const request=()=>new Request('http://localhost/api/medicine-chat',{method:'POST',headers:{'Content-Type':'application/json',Origin:'http://localhost'},body:JSON.stringify({consent:true,messages:[{role:'user',content:'Fictional example: explain common cetirizine side effects.'}],model:'paid-model',apiKey:'client-key',tools:{write:true}})});

test('OpenRouter defaults to the requested free Gemma; missing keys and paid model settings cannot generate',async()=>{
 assert.equal(chatConfiguration({}).model,GEMMA_MODEL);assert.equal(chatConfiguration({}).ready,false);
 assert.equal(chatConfiguration(configured).ready,true);
 let calls=0;
 for(const overrides of [{OPENROUTER_API_KEY:''},{OPENROUTER_MODEL:'google/paid-model'},{SAHA_CHAT_PROVIDER:'unknown'}]){
  const handler=createMedicineHandler({env:{...configured,...overrides},generate:async()=>{calls++;}});assert.equal((await handler(request())).status,503);
 }
 assert.equal(calls,0);assert.equal(chatConfiguration({SAHA_CHAT_PROVIDER:'gateway',AI_GATEWAY_MODEL:'test/model',AI_GATEWAY_API_KEY:'unit'}).ready,true);
});

test('real SDK/provider path sends server-only Gemma settings and returns only final text',async()=>{
 let captured,calls=0;
 const transport=async(url,init)=>{
  calls++;captured={url:String(url),headers:new Headers(init.headers),body:JSON.parse(init.body)};
  return Response.json({id:'test-chat',object:'chat.completion',created:1700000000,model:GEMMA_MODEL,choices:[{index:0,message:{role:'assistant',content:'Some people feel drowsy. Check the medicine leaflet with a pharmacist.',reasoning:'internal-test-reasoning-not-for-display'},finish_reason:'stop'}],usage:{prompt_tokens:80,completion_tokens:20,total_tokens:100}});
 };
 const handler=createMedicineHandler({env:configured,generate:generateText,modelFor:config=>resolveChatModel(config,{fetch:transport})});
 const response=await handler(request());const result=await response.json();assert.equal(response.status,200);assert.equal(result.kind,'ai');assert.equal(result.model,GEMMA_MODEL);assert.equal(result.provider,'openrouter');assert.match(result.text,/drowsy/);assert.doesNotMatch(JSON.stringify(result),/internal-test|unit-test-key|client-key/);
 assert.equal(captured.url,'https://openrouter.ai/api/v1/chat/completions');assert.equal(captured.headers.get('authorization'),'Bearer openrouter-unit-test-key');assert.equal(captured.body.model,GEMMA_MODEL);assert.equal(captured.body.max_tokens,750);assert.equal(captured.body.reasoning.enabled,false);assert.equal(captured.body.reasoning.exclude,true);assert.equal(captured.body.models,undefined);assert.equal(captured.body.tools,undefined);assert.equal(captured.body.messages[0].role,'system');assert.deepEqual(captured.body.messages[0].content,[{type:'text',text:MEDICINE_INSTRUCTIONS}]);assert.equal(calls,1);
});

test('upstream auth/quota failures have useful redacted messages and are not retried',async()=>{
 for(const [upstream,expected,code] of [[401,503,'provider_auth'],[402,503,'provider_account'],[403,503,'provider_auth'],[429,429,'provider_rate_limit'],[503,503,'provider_unavailable']]){
  let calls=0;const transport=async()=>{calls++;return Response.json({error:{code:upstream,message:'private-upstream-error-payload'}},{status:upstream});};
  const handler=createMedicineHandler({env:configured,generate:generateText,modelFor:config=>resolveChatModel(config,{fetch:transport})});const response=await handler(request());const result=await response.json();assert.equal(response.status,expected);assert.equal(result.code,code);assert.doesNotMatch(JSON.stringify(result),/private-upstream|unit-test-key/);assert.equal(calls,1);
 }
});
