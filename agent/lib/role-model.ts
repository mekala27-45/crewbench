import {defineAgent,defineDynamic} from 'eve';
import {createOpenAICompatible} from '@ai-sdk/openai-compatible';
import {measuredFetch} from '../../src/runtime/provider.ts';
import type {Role} from '../../src/contracts/core.ts';
export function roleAgent(role:Role){return defineAgent({
 description:`Review the ${role} scope of an authored release packet.`,defaultTools:false,tool:false,
 model:defineDynamic((ctx:any)=>({model:createOpenAICompatible({name:'crewbench-ollama',baseURL:'http://127.0.0.1:11434/v1',includeUsage:true,fetch:((url:any,init:any)=>measuredFetch(role,ctx.session.id,url,init)) as typeof fetch})('qwen3:1.7b'),modelContextWindowTokens:8192})),
 limits:{sessionTimeoutMs:300000},
});}
