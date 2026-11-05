import {readFile,writeFile,mkdir} from 'node:fs/promises';import {execFileSync} from 'node:child_process';import {retentionPlan} from '../src/report/evidence.ts';
const config=JSON.parse(await readFile('evaluation/retention.json','utf8'));
const get=(path:string)=>JSON.parse(execFileSync('gh',['api','--paginate','--slurp','repos/mekala27-45/crewbench/'+path],{encoding:'utf8',maxBuffer:16*1024*1024}));
const branches=get('branches?per_page=100').flat().filter((b:any)=>/^results\/[a-z-]+-\d+$/.test(b.name));
const runs=get('actions/runs?per_page=100').flatMap((p:any)=>p.workflow_runs);
for(const pin of config.pins){const branch=branches.find((b:any)=>b.name===pin.results_branch),run=runs.find((r:any)=>String(r.id)===pin.run_id);if(!branch||branch.commit.sha!==pin.results_commit||!run||run.head_sha!==pin.source_commit)throw new Error('PINNED_EVIDENCE_CHANGED');}
const rows=branches.map((b:any)=>{const run=runs.find((r:any)=>String(r.id)===b.name.split('-').at(-1));if(!run)throw new Error('RUN_HISTORY_MISSING');return{id:b.name,created_at:run.created_at};});
const plan=retentionPlan(rows,config.pins.map((p:any)=>p.results_branch),config.recent_capacity);
await mkdir('artifacts/contracts',{recursive:true});await writeFile('artifacts/contracts/retention.json',JSON.stringify({schema_version:1,checked_at:new Date().toISOString(),source_commit:process.env.GITHUB_SHA,pins_verified:config.pins.length,observed_branches:rows.length,...plan},null,2)+'\n');console.log(JSON.stringify({pins_verified:config.pins.length,observed:rows.length,eligible_for_review:plan.eligible_for_review.length,automatic_deletion:false}));
