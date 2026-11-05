import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {randomBytes} from 'node:crypto';
import assert from 'node:assert/strict';
import {digest,bytesDigest} from '../src/contracts/core.ts';
const read=async(p:string)=>JSON.parse(await readFile(p,'utf8'));
const run=(cmd:string,args:string[],env=process.env)=>execFileSync(cmd,args,{env,stdio:'inherit'});
if(!['localhost','127.0.0.1'].includes(new URL(process.env.DATABASE_URL!).hostname))throw Error('REDERIVE_REQUIRES_ISOLATED_DATABASE');
await mkdir('artifacts/rederive',{recursive:true});
run('node',['scripts/freeze.ts','--verify']);
run('node',['scripts/import-report.ts']);
const raw=await readFile('artifacts/actual/results.json'),originalBaseline=await read('artifacts/baseline/postgres.json');
const rawDigest=bytesDigest(raw),summaries=[];
for(const seed of ['1','817']){
 const env={...process.env,PYTHONHASHSEED:seed};
 const grades='artifacts/rederive/grades-'+seed+'.json',summary='artifacts/rederive/summary-'+seed+'.json';
 run('python3',['evaluation/grade.py','artifacts/actual/results.json',grades,'--public-records'],env);
 run('python3',['evaluation/statistics.py','artifacts/actual/results.json',grades,summary],env);
 summaries.push(await read(summary));
}
assert.equal(digest(summaries[0]),digest(summaries[1]),'HASH_SEED_CHANGED_ACTUAL_SUMMARY');
assert.equal(bytesDigest(await readFile('artifacts/actual/results.json')),rawDigest,'RAW_ACTUAL_CHANGED');
const env={...process.env,CREWBENCH_SCHEMA:'crewbench_rederive_'+randomBytes(6).toString('hex')};
run('node',['scripts/migrate.ts'],env);
run('node',['scripts/baseline.ts','--postgres'],env);
const freshBaseline=await read('artifacts/baseline/results.json');
assert.equal(freshBaseline.trials.length,48);
for(const row of freshBaseline.trials){
 const prior=originalBaseline.trials.find((r:any)=>r.case_id===row.case_id);
 assert.ok(prior,'BASELINE_CASE_MISSING');assert.equal(digest(row.assessment),digest(prior.assessment),'BASELINE_ASSESSMENT_CHANGED');
 assert.equal(row.status,'submitted');assert.equal(row.model_requests,0);
}
await writeFile('artifacts/baseline/postgres.json',JSON.stringify(freshBaseline,null,2)+'\n');
run('python3',['evaluation/grade.py','artifacts/baseline/postgres.json','artifacts/baseline/postgres-grades.json','--public-records']);
const baselineGrades=await read('artifacts/baseline/postgres-grades.json');
assert.equal(baselineGrades.grades.filter((g:any)=>g.strict_success).length,48);
run('node',['scripts/recovery.ts']);
run('python3',['evaluation/recovery.py','artifacts/recovery/results.json','artifacts/recovery/grades.json']);
const recovery=await read('artifacts/recovery/grades.json');assert.equal(recovery.verified,12);
await writeFile('artifacts/actual/grades.json',JSON.stringify(await read('artifacts/rederive/grades-1.json'),null,2)+'\n');
await writeFile('artifacts/actual/summary.json',JSON.stringify(summaries[0],null,2)+'\n');
run('node',['scripts/build-report.ts']);const first=await read('site/public/data/report.json');
run('node',['scripts/build-report.ts']);const second=await read('site/public/data/report.json');
delete first.generated_at;delete second.generated_at;assert.equal(digest(first),digest(second),'REPORT_CLAIMS_CHANGED');
await writeFile('artifacts/rederive/verification.json',JSON.stringify({schema_version:1,mode:'provisional_clean_rederive',source_commit:process.env.GITHUB_SHA,passed:true,actual_raw_digest:rawDigest,actual_summary_digest:digest(summaries[0]),hash_seeds:['1','817'],fresh_baseline:48,fresh_recovery:12,report_claim_digest:digest(first),private_truth_verified:false,fixtures_regenerated:false,fixture_bytes_verified_against_freeze:true,live_api_verified:false,completed_release:false},null,2)+'\n');
