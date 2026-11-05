import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {execFileSync} from 'node:child_process';import {createHash} from 'node:crypto';
const request=JSON.parse(readFileSync('evaluation/review-request.json','utf8'));
for(const key of ['development_source','results_commit'])if(!/^[a-f0-9]{40}$/.test(request[key]))throw Error('EXACT_COMMIT_REQUIRED');
if(!/^\d+$/.test(String(request.development_run)))throw Error('RUN_ID_REQUIRED');
const fetchFile=path=>{const output=execFileSync('gh',['api','repos/mekala27-45/crewbench/contents/'+path+'?ref='+request.results_commit],{encoding:'utf8',maxBuffer:32*1024*1024});return Buffer.from(JSON.parse(output).content,'base64').toString('utf8');};
const manifest=JSON.parse(fetchFile('artifacts/development/manifest.json'));
if(manifest.source_commit!==request.development_source||manifest.results_branch!=='results/development-'+request.development_run)throw Error('RESULT_MANIFEST_SOURCE');
const imports=[['artifacts/development/trials.json','artifacts/development/trials.json',true],['artifacts/recovery/results.json','artifacts/recovery/results.json',true],['artifacts/baseline/results.json','artifacts/baseline/postgres.json',false]];
for(const [path,target,sealed]of imports){const bytes=fetchFile(path),raw=JSON.parse(bytes);if(raw.source_commit!==request.development_source)throw Error('IMPORTED_SOURCE_MISMATCH');if(sealed){const record=manifest.files.find(f=>f.path===path);if(!record||record.bytes!==Buffer.byteLength(bytes)||record.sha256!==createHash('sha256').update(bytes).digest('hex'))throw Error('IMPORTED_DIGEST_MISMATCH');}mkdirSync(target.slice(0,target.lastIndexOf('/')),{recursive:true});writeFileSync(target,bytes);}
execFileSync('git',['fetch','--no-tags','origin',request.development_source],{stdio:'inherit'});
execFileSync('git',['diff','--exit-code',request.development_source,'HEAD','--','agent','src/runtime','src/contracts','src/methods','fixtures/runtime','evaluation/plan.json','evaluation/model-lock.json'],{stdio:'inherit'});
mkdirSync('artifacts/review',{recursive:true});writeFileSync('artifacts/review/import.json',JSON.stringify({...request,verification_source:process.env.GITHUB_SHA},null,2)+'\n');
