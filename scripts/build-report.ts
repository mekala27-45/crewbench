import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {digest} from '../src/contracts/core.ts';
import {STATEMENT,STATEMENT_ID} from '../src/report/statement.ts';
import {renderClaim} from '../src/report/claims.ts';
const read=async(p:string)=>JSON.parse(await readFile(p,'utf8'));
const optional=async(p:string)=>{try{return await read(p);}catch(e:any){if(e.code==='ENOENT')return null;throw e;}};
const index=await read('evaluation/case-index.json'),plan=await read('evaluation/plan.json'),subset=await read('evaluation/model-subset.json');
const baseline=await optional('artifacts/baseline/postgres.json'),grades=await optional('artifacts/baseline/postgres-grades.json');
const actual=await optional('artifacts/actual/results.json'),actualGrades=await optional('artifacts/actual/grades.json');
const summary=await optional('artifacts/actual/summary.json');
const recovery=await optional('artifacts/recovery/results.json'),recoveryGrades=await optional('artifacts/recovery/grades.json');
if(baseline&&(!grades||grades.source_digest!==digest(baseline)))throw new Error('BASELINE_GRADE_PROVENANCE');
if(actual&&(!actualGrades||actualGrades.source_digest!==digest(actual)||!summary||summary.source_digest!==digest(actual)||summary.grades_digest!==digest(actualGrades)))throw new Error('ACTUAL_GRADE_PROVENANCE');
if(recovery&&(!recoveryGrades||recoveryGrades.source_digest!==digest(recovery)))throw new Error('RECOVERY_GRADE_PROVENANCE');
const verifyClaim=(data:any,method:string,mode:any,scope:string,numerator:number,denominator:number)=>renderClaim({method,mode,scope,numerator,denominator,missing_reason:null,source_commit:data.source_commit,evidence_digest:digest(data),window:data.window});
if(baseline)verifyClaim(baseline,'deterministic_baseline','deterministic_baseline','all authored cases',grades.grades.filter((g:any)=>g.strict_success).length,48);
if(actual)for(const method of ['solo_agent','split_review'])verifyClaim(actual,method,'actual_model','frozen paired subset',summary[method].successes,12);
const baselinescope=(ids:string[])=>{if(!baseline||!grades)return null;const trials=baseline.trials.filter((t:any)=>ids.includes(t.case_id));const selected=grades.grades.filter((g:any)=>trials.some((t:any)=>t.trial_id===g.trial_id));if(selected.length!==ids.length)throw new Error('BASELINE_DENOMINATOR');return {successes:selected.filter((g:any)=>g.strict_success).length,planned:ids.length,observed:trials.length};};
const report={schema_version:1,statement:STATEMENT,statement_id:STATEMENT_ID,generated_at:new Date().toISOString(),source_commit:process.env.GITHUB_SHA||process.env.SOURCE_COMMIT||null,status:actual?(actualGrades.private_truth_verified?'recorded_evaluation':'provisional_evaluation'):'development',plan,subset,
 baseline:baseline?{mode:'deterministic_baseline',presentation:'recorded',source_commit:baseline.source_commit,evidence_digest:digest(baseline),window:baseline.window,all:baselinescope(index.map((r:any)=>r.case_id)),held_out:baselinescope(index.filter((r:any)=>r.split==='held_out').map((r:any)=>r.case_id)),paired_subset:baselinescope(subset)}:null,
 actual:actual&&actualGrades?{...summary,evidence_digest:digest(actual),source_commit:actual.source_commit,window:actual.window,worker:actual.worker}:null,
 recovery:recovery&&recoveryGrades?{mode:'scripted_runtime',planned:12,observed:recoveryGrades.observed,verified:recoveryGrades.verified,source_commit:recovery.source_commit,evidence_digest:digest(recovery)}:null};
const cases=[];for(const row of index){const packet=await read(`fixtures/runtime/${row.case_id}.json`);const base=baseline?.trials.find((t:any)=>t.case_id===row.case_id);cases.push({case_id:row.case_id,family:row.family,split:row.split,selected:subset.includes(row.case_id),packet,baseline:base||null,actual:actual?.trials.filter((t:any)=>t.case_id===row.case_id)||[]});}
await mkdir('site/public/data',{recursive:true});for(const [name,data]of Object.entries({report,cases,recovery:recovery||{trials:[]}}))await writeFile(`site/public/data/${name}.json`,JSON.stringify(data)+'\n');
console.log(JSON.stringify({baseline:report.baseline?.all,actual:report.actual!==null,recovery:report.recovery}));
