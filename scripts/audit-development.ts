import {readFile,writeFile} from 'node:fs/promises';
import {auditDevelopment} from '../src/report/development.ts';
const read=async(p:string)=>JSON.parse(await readFile(p,'utf8'));
const input=process.argv[2]||'artifacts/development/trials.json',output=process.argv[3]||'artifacts/development/accounting-audit.json';
const raw=await read(input),plan=await read('evaluation/plan.json'),index=await read('evaluation/case-index.json'),packets=new Map();
for(const row of raw.trials){if(!index.some((x:any)=>x.case_id===row.state.case_id&&x.split==='development'))throw new Error('NOT_DEVELOPMENT_CASE');packets.set(row.state.case_id,await read('fixtures/runtime/'+row.state.case_id+'.json'));}
const audit=auditDevelopment(raw,plan,packets);await writeFile(output,JSON.stringify(audit,null,2)+'\n');console.log(JSON.stringify({verified:audit.verified,trials:audit.trial_count,roles:audit.role_evidence,three_role_flow:audit.three_role_flow_observed}));
