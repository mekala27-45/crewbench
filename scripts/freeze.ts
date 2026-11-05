import {readFile,writeFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {frozenInputs,verifyFreeze} from '../src/report/freeze.ts';
import {digest} from '../src/contracts/core.ts';
const read=async(p:string)=>JSON.parse(await readFile(p,'utf8'));const files=await frozenInputs();
if(process.argv.includes('--verify')){
 const manifest=await read('evaluation/freeze.json');verifyFreeze(manifest,files);
 if(manifest.plan_digest!==digest(await read('evaluation/plan.json')))throw new Error('FREEZE_PLAN_MISMATCH');
 console.log(JSON.stringify({verified:true,freeze_digest:digest(manifest)}));
}else{
 const dev=await read('artifacts/development/accepted-development.json'),plan=await read('evaluation/plan.json');
 if(dev.plan_digest!==digest(plan))throw new Error('DEVELOPMENT_PLAN_CHANGED');
 const response=(s:any,role:string)=>s.attempts.some((a:any)=>a.role===role&&a.status==='response_recorded');
 if(!dev.trials.some((r:any)=>r.state.method==='solo_agent'&&response(r.state,'solo')))throw new Error('DEVELOPMENT_SOLO_MISSING');
 if(!dev.trials.some((r:any)=>r.state.method==='split_review'&&['tests','staging','synthesis'].every(role=>response(r.state,role))&&r.state.children.tests&&r.state.children.staging))throw new Error('DEVELOPMENT_THREE_ROLE_FLOW_MISSING');
 execFileSync('git',['diff','--exit-code',dev.source_commit,'HEAD','--','agent','src/runtime','src/contracts','src/methods','fixtures/runtime','evaluation/plan.json','evaluation/model-lock.json']);
 const manifest={schema_version:1,created_at:new Date().toISOString(),parent_source_commit:process.env.SOURCE_COMMIT,development_provenance:{source_commit:dev.source_commit,digest:digest(dev)},model:await read('evaluation/model-lock.json'),plan_digest:digest(plan),files};
 verifyFreeze(manifest,files);await writeFile('evaluation/freeze.json',JSON.stringify(manifest,null,2)+'\n',{flag:'wx'});
 console.log(JSON.stringify({frozen_files:Object.keys(files).length,digest:digest(manifest)}));
}
