import {defineWorkflowTool} from 'eve/tools';
import {z} from 'zod';
import {loadTrialContext,verifyRole,joinContext} from '../lib/workflow-steps.ts';
export default defineWorkflowTool({description:'Run one registered fixed review workflow.',inputSchema:z.object({trial_id:z.string()}).strict(),
 async execute({trial_id},ctx){'use workflow';
  const context=await loadTrialContext(trial_id);
  if(context.method==='solo_agent'){
   const response=await ctx.agent('solo').send(context.message,{signal:ctx.abortSignal});await response.result();return await verifyRole(trial_id,'solo');
  }
  const first=context.first_specialist;const second=first==='tests'?'staging':'tests';
  for(const role of [first,second]){const response=await ctx.agent(role).send(context.message,{signal:ctx.abortSignal});await response.result();await verifyRole(trial_id,role);}
  const joined=await joinContext(trial_id);const response=await ctx.agent('synthesis').send(joined.message,{signal:ctx.abortSignal});await response.result();return await verifyRole(trial_id,'synthesis');
 }
});
