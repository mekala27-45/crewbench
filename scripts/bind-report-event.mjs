import {readFileSync,writeFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
const read=p=>JSON.parse(readFileSync(p,'utf8'));
const event=read(process.env.GITHUB_EVENT_PATH),share=read('evaluation/shared-execution.json'),reference=read('evaluation/report-reference.json');
if(String(event.workflow_run.id)!==share.execution_run||event.workflow_run.head_sha!==share.execution_source||event.workflow_run.status!=='completed')throw Error('UNREGISTERED_EXECUTION_EVENT');
const ref=JSON.parse(execFileSync('gh',['api','repos/mekala27-45/crewbench/git/ref/heads/results/evaluation-'+share.execution_run],{encoding:'utf8'}));
if(!/^[a-f0-9]{40}$/.test(ref.object.sha))throw Error('RESULT_COMMIT_REQUIRED');
writeFileSync('evaluation/report-request.json',JSON.stringify({...reference,evaluation_run:share.execution_run,evaluation_source:share.execution_source,evaluation_results_commit:ref.object.sha},null,2)+'\n');
