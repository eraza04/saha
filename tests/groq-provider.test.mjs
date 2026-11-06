import test from 'node:test';
import assert from 'node:assert/strict';
import {generateText} from 'ai';
import {chatConfiguration,resolveChatModel,GROQ_MODEL} from '../lib/chat-provider.mjs';
import {createMedicineHandler,MEDICINE_INSTRUCTIONS} from '../lib/medicine-chat.mjs';

const env={SAHA_CHAT_PROVIDER:'groq',SAHA_CHAT_ENABLED:'true',GROQ_API_KEY:'groq-unit-test-key'};
const request=()=>new Request('http://localhost/api/medicine-chat',{method:'POST',headers:{'Content-Type':'application/json',Origin:'http://localhost'},body:JSON.stringify({consent:true,messages:[{role:'user',content:'Give three questions for a fictional pharmacist visit.'}],model:'other-model',apiKey:'client-key',provider:'openrouter',tools:{write:true}})});

test('Groq requires its own key and a permitted fixed model, without another provider fallback',async()=>{
 const config=chatConfiguration(env);assert.equal(config.model,GROQ_MODEL);assert.equal(config.provider,'groq');assert.equal(config.ready,true);
 for(const overrides of [{GROQ_API_KEY:''},{GROQ_API_KEY:'',OPENROUTER_API_KEY:'another-unit-key',AI_GATEWAY_API_KEY:'gateway-unit-key'},{GROQ_MODEL:'unknown-model'}]){
  let calls=0;const handler=createMedicineHandler({env:{...env,...overrides},generate:async()=>{calls++;}});assert.equal((await handler(request())).status,503);assert.equal(calls,0);
 }
});

test('the real Groq SDK transport uses server-owned settings and returns only final answer text',async()=>{
 let captured,calls=0;const transport=async(url,init)=>{calls++;captured={url:String(url),headers:new Headers(init.headers),body:JSON.parse(init.body)};return Response.json({id:'test-groq',object:'chat.completion',created:1700000000,model:GROQ_MODEL,choices:[{index:0,message:{role:'assistant',content:'Ask about common side effects, storage and whom to contact with questions.',reasoning:'internal-test-thought-not-for-display'},finish_reason:'stop'}],usage:{prompt_tokens:80,completion_tokens:150,total_tokens:230,completion_tokens_details:{reasoning_tokens:100}}});};
 const handler=createMedicineHandler({env,generate:generateText,modelFor:config=>resolveChatModel(config,{fetch:transport})});const response=await handler(request());const result=await response.json();assert.equal(response.status,200);assert.equal(result.provider,'groq');assert.equal(result.model,GROQ_MODEL);assert.equal(result.kind,'ai');assert.match(result.text,/side effects/);assert.doesNotMatch(JSON.stringify(result),/internal-test|unit-test-key|client-key/);assert.equal(calls,1);
 assert.equal(captured.url,'https://api.groq.com/openai/v1/chat/completions');assert.equal(captured.headers.get('authorization'),'Bearer groq-unit-test-key');assert.equal(captured.body.model,GROQ_MODEL);assert.equal(captured.body.max_tokens,1500);assert.equal(captured.body.reasoning_effort,'low');assert.equal(captured.body.reasoning_format,undefined);assert.equal(captured.body.tools,undefined);assert.equal(captured.body.messages[0].role,'system');assert.equal(captured.body.messages[0].content,MEDICINE_INSTRUCTIONS);
});

test('Groq authentication and request-limit failures are redacted and are not retried',async()=>{
 for(const [status,expected,code] of [[401,503,'provider_auth'],[429,429,'provider_rate_limit']]){
  let calls=0;const transport=async()=>{calls++;return Response.json({error:{message:'private-groq-payload',type:'requests',code:'rate_limit_exceeded'}},{status});};const handler=createMedicineHandler({env,generate:generateText,modelFor:config=>resolveChatModel(config,{fetch:transport})});const response=await handler(request());const result=await response.json();assert.equal(response.status,expected);assert.equal(result.code,code);assert.doesNotMatch(JSON.stringify(result),/private-groq|unit-test-key/);assert.equal(calls,1);
 }
});
