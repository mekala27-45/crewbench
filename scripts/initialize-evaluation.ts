import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {digest} from '../src/contracts/core.ts';
import {pairedSchedule,startupInventory} from '../src/report/evaluation-inventory.ts';
const read=async(p:string)=>JSON.parse(await readFile(p,'utf8'));
const plan=await read('evaluation/plan.json'),freeze=await read('evaluation/freeze.json');
const schedule=pairedSchedule(await read('evaluation/model-subset.json'),process.env.GITHUB_RUN_ID||'local');
await mkdir('artifacts/actual',{recursive:true});
await writeFile('artifacts/actual/results.json',JSON.stringify(startupInventory(schedule,process.env.SOURCE_COMMIT||process.env.GITHUB_SHA!,digest(plan),digest(freeze),'WORKER_NOT_STARTED'),null,2)+'\n',{flag:'wx'});
