import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {execFileSync} from 'node:child_process';import {createHash} from 'node:crypto';
const request=JSON.parse(readFileSync('evaluation/review-request.json','utf8'));
for(const key of ['development_source','results_commit'])if(!/^[a-f0-9]{40}$/.test(request[key]))throw Error('EXACT_COMMIT_REQUIRED');
if(!/^\d+$/.test(String(request.development_run)))throw Error('RUN_ID_REQUIRED');
const fetchFile=(path,ref=request.results_commit)=>{const output=execFileSync('gh',['api','repos/mekala27-45/crewbench/contents/'+path+'?ref='+ref],{encoding:'utf8',maxBuffer:32*1024*1024});return Buffer.from(JSON.parse(output).content,'base64').toString('utf8');};
const manifest=JSON.parse(fetchFile('artifacts/development/manifest.json'));
if(manifest.source_commit!==request.development_source||manifest.results_branch!=='results/development-'+request.development_run)throw Error('RESULT_MANIFEST_SOURCE');
const importFile=(path,target,ref,source,sealedManifest)=>{const bytes=fetchFile(path,ref),raw=JSON.parse(bytes);if(raw.source_commit!==source)throw Error('IMPORTED_SOURCE_MISMATCH');if(sealedManifest){const record=sealedManifest.files.find(f=>f.path===path);if(!record||record.bytes!==Buffer.byteLength(bytes)||record.sha256!==createHash('sha256').update(bytes).digest('hex'))throw Error('IMPORTED_DIGEST_MISMATCH');}mkdirSync(target.slice(0,target.lastIndexOf('/')),{recursive:true});writeFileSync(target,bytes);};
importFile('artifacts/development/trials.json','artifacts/development/trials.json',request.results_commit,request.development_source,manifest);
const rr=request.recovery_results_commit||request.results_commit,rs=request.recovery_source||request.development_source;
if(!/^[a-f0-9]{40}$/.test(rr)||!/^[a-f0-9]{40}$/.test(rs))throw Error('RECOVERY_COMMIT_REQUIRED');
const recoveryManifest=JSON.parse(fetchFile('artifacts/development/manifest.json',rr));
if(recoveryManifest.source_commit!==rs)throw Error('RECOVERY_SOURCE_MISMATCH');
importFile('artifacts/recovery/results.json','artifacts/recovery/results.json',rr,rs,recoveryManifest);
importFile('artifacts/baseline/results.json','artifacts/baseline/postgres.json',rr,rs,null);
execFileSync('git',['fetch','--no-tags','origin',request.development_source],{stdio:'inherit'});
execFileSync('git',['diff','--exit-code',request.development_source,'HEAD','--','agent','src/runtime','src/contracts','src/methods','fixtures/runtime','evaluation/plan.json','evaluation/model-lock.json'],{stdio:'inherit'});
mkdirSync('artifacts/review',{recursive:true});writeFileSync('artifacts/review/import.json',JSON.stringify({...request,verification_source:process.env.GITHUB_SHA},null,2)+'\n');

for(const [kind,files]of Object.entries({web:[['artifacts/browser/results.json','artifacts/review/browser-results.json'],['artifacts/api/check.json','artifacts/review/api-check.json']],contracts:[['artifacts/contracts/runtime.log','artifacts/review/runtime.log'],['artifacts/contracts/grading.log','artifacts/review/grading.log'],['artifacts/contracts/retention.json','artifacts/review/retention.json']]})){
 const ref=request[kind+'_results_commit'],source=request[kind+'_source'],run=request[kind+'_run'];if(!/^[a-f0-9]{40}$/.test(ref)||!/^[a-f0-9]{40}$/.test(source)||!/^\d+$/.test(String(run)))throw Error('CHECK_PROVENANCE_REQUIRED');
 const m=JSON.parse(fetchFile('artifacts/'+(kind==='web'?'browser':'contracts')+'/manifest.json',ref));if(m.source_commit!==source||m.results_branch!=='results/'+kind+'-'+run)throw Error('CHECK_MANIFEST_SOURCE');
 for(const [path,target]of files){const bytes=fetchFile(path,ref),f=m.files.find(f=>f.path===path);if(!f||f.bytes!==Buffer.byteLength(bytes)||f.sha256!==createHash('sha256').update(bytes).digest('hex'))throw Error('CHECK_MANIFEST_DIGEST');writeFileSync(target,bytes);}
}
