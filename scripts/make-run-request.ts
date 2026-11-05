import {readFile,writeFile} from 'node:fs/promises';import {digest} from '../src/contracts/core.ts';
const freeze=JSON.parse(await readFile('evaluation/freeze.json','utf8'));const request={schema_version:1,freeze_digest:digest(freeze),verified_source_commit:process.env.SOURCE_COMMIT,planned_method_case_trials:24,model_subset:'evaluation/model-subset.json',mode:'actual_model',created_at:new Date().toISOString()};
await writeFile('evaluation/run-request.json',JSON.stringify(request,null,2)+'\n');
