import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { createGroq } from '@ai-sdk/groq';

export const GEMMA_MODEL='google/gemma-4-31b-it:free';
export const GROQ_MODEL='openai/gpt-oss-20b';
const GROQ_MODELS=new Set([GROQ_MODEL,'openai/gpt-oss-120b']);

export function chatConfiguration(env){
  const provider=env.SAHA_CHAT_PROVIDER||'openrouter';
  if(provider==='groq'){
    const model=env.GROQ_MODEL?.trim()||GROQ_MODEL;
    return {provider,model,apiKey:env.GROQ_API_KEY,ready:Boolean(env.GROQ_API_KEY?.trim()&&GROQ_MODELS.has(model))};
  }
  if(provider==='openrouter'){
    const model=env.OPENROUTER_MODEL?.trim()||GEMMA_MODEL;
    // No paid model or automatic model fallback in the OpenRouter integration.
    return {provider,model,apiKey:env.OPENROUTER_API_KEY,ready:Boolean(env.OPENROUTER_API_KEY?.trim()&&model.endsWith(':free'))};
  }
  if(provider==='gateway')return {provider,model:env.AI_GATEWAY_MODEL,ready:Boolean(env.AI_GATEWAY_MODEL&&(env.AI_GATEWAY_API_KEY||env.VERCEL_OIDC_TOKEN))};
  return {provider,ready:false};
}

export function resolveChatModel(config,{fetch:transport}={}){
  if(!config.ready)throw new Error('Chat is not configured');
  if(config.provider==='gateway')return config.model;
  if(config.provider==='groq')return createGroq({apiKey:config.apiKey,...(transport?{fetch:transport}:{})})(config.model);
  return createOpenRouter({apiKey:config.apiKey,compatibility:'strict',...(transport?{fetch:transport}:{})}).chat(config.model,{
    reasoning:{enabled:false,effort:'none',exclude:true}
  });
}

export function chatGenerationOptions(config){
  // GPT-OSS accepts reasoning_effort, not reasoning_format. Only final text
  // leaves the server. Allow some extra tokens for its low-effort reasoning.
  return config.provider==='groq'?{maxOutputTokens:1500,providerOptions:{groq:{reasoningEffort:'low'}}}:{maxOutputTokens:750};
}
