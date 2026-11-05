import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';import {execFileSync} from 'node:child_process';
const request=JSON.parse(readFileSync('evaluation/freeze-request.json','utf8'));if(!/^\d+$/.test(String(request.development_run))||!/^\d+$/.test(String(request.calibration_run)))throw Error('RUN_ID_REQUIRED');
const fetchFile=(ref,path)=>{const output=execFileSync('gh',['api','repos/mekala27-45/crewbench/contents/'+path+'?ref='+ref],{encoding:'utf8',maxBuffer:16*1024*1024});return Buffer.from(JSON.parse(output).content,'base64').toString('utf8');};
const dev=fetchFile('results/development-'+request.development_run,'artifacts/development/trials.json'),fit=fetchFile('results/model-probe-'+request.calibration_run,'artifacts/probes/payload-fit.json');
if(JSON.parse(dev).source_commit!==request.development_source||JSON.parse(fit).source_commit!==request.calibration_source||!JSON.parse(fit).all_fit)throw Error('IMPORT_PROVENANCE');
for(const dir of ['artifacts/development','artifacts/probes'])mkdirSync(dir,{recursive:true});writeFileSync('artifacts/development/accepted-development.json',dev);writeFileSync('artifacts/probes/payload-fit.json',fit);
