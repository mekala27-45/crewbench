import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {digest} from '../src/contracts/core.ts';
import {STATEMENT,STATEMENT_ID} from '../src/report/statement.ts';
const read=async(p:string)=>JSON.parse(await readFile(p,'utf8'));
const optional=async(p:string)=>{try{return await read(p);}catch(e:any){if(e.code==='ENOENT')return null;throw e;}};
const index=await read('evaluation/case-index.json'),plan=await read('evaluation/plan.json'),subset=await read('evaluation/model-subset.json');
const baseline=await optional('artifacts/baseline/postgres.json'),grades=await optional('artifacts/baseline/postgres-grades.json');
const actual=await optional('artifacts/actual/results.json'),actualGrades=await optional('artifacts/actual/grades.json');
const recovery=await optional('artifacts/recovery/results.json'),recoveryGrades=await optional('artifacts/recovery/grades.json');
if(baseline&&(!grades||grades.source_digest!==digest(baseline)))throw new Error('BASELINE_GRADE_PROVENANCE');
const baselinescope=(ids:string[])=>{if(!baseline||!grades)return null;const trials=baseline.trials.filter((t:any)=>ids.includes(t.case_id));const selected=grades.grades.filter((g:any)=>trials.some((t:any)=>t.trial_id===g.trial_id));if(selected.length!==ids.length)throw new Error('BASELINE_DENOMINATOR');return {successes:selected.filter((g:any)=>g.strict_success).length,planned:ids.length,observed:trials.length};};
const report={schema_version:1,statement:STATEMENT,statement_id:STATEMENT_ID,generated_at:new Date().toISOString(),source_commit:process.env.GITHUB_SHA||process.env.SOURCE_COMMIT||null,status:actual?'recorded_evaluation':'development',plan,subset,
 baseline:baseline?{mode:'deterministic_baseline',presentation:'recorded',source_commit:baseline.source_commit,evidence_digest:digest(baseline),window:baseline.window,all:baselinescope(index.map((r:any)=>r.case_id)),held_out:baselinescope(index.filter((r:any)=>r.split==='held_out').map((r:any)=>r.case_id)),paired_subset:baselinescope(subset)}:null,
 actual:actual&&actualGrades?{...actual.summary,evidence_digest:digest(actual),source_commit:actual.source_commit,window:actual.window}:null,
 recovery:recovery&&recoveryGrades?{mode:'scripted_runtime',planned:12,observed:recoveryGrades.observed,verified:recoveryGrades.verified,source_commit:recovery.source_commit,evidence_digest:digest(recovery)}:null};
const cases=[];for(const row of index){const packet=await read(`fixtures/runtime/${row.case_id}.json`);const base=baseline?.trials.find((t:any)=>t.case_id===row.case_id);cases.push({case_id:row.case_id,family:row.family,split:row.split,selected:subset.includes(row.case_id),packet,baseline:base||null,actual:actual?.trials.filter((t:any)=>t.case_id===row.case_id)||[]});}
await mkdir('site/public/data',{recursive:true});for(const [name,data]of Object.entries({report,cases,recovery:recovery||{trials:[]}}))await writeFile(`site/public/data/${name}.json`,JSON.stringify(data)+'\n');
console.log(JSON.stringify({baseline:report.baseline?.all,actual:report.actual!==null,recovery:report.recovery}));
