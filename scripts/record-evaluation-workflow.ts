import {readFile,writeFile} from 'node:fs/promises';
const raw=JSON.parse(await readFile('artifacts/actual/results.json','utf8'));
await writeFile('artifacts/actual/workflow.json',JSON.stringify({schema_version:1,source_commit:raw.source_commit,request_commit:process.env.GITHUB_SHA,run_id:process.env.GITHUB_RUN_ID,status:process.env.EVALUATION_JOB_STATUS,observed_at:new Date().toISOString()},null,2)+'\n');
