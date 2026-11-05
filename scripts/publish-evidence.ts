import {readFile,readdir,writeFile} from 'node:fs/promises';
import {digest} from '../src/contracts/core.ts';
import {validatePublication} from '../src/report/publication.ts';
const read=async(p:string)=>JSON.parse(await readFile(p,'utf8'));
const root='artifacts/actual',files=[];
for(const name of (await readdir(root)).filter(n=>n.endsWith('.json')&&n!=='bundle.json').sort())files.push({path:root+'/'+name,content:await read(root+'/'+name)});
const bundle=validatePublication(files,{source_commit:process.env.SOURCE_COMMIT||process.env.GITHUB_SHA,plan_digest:digest(await read('evaluation/plan.json')),freeze_digest:digest(await read('evaluation/freeze.json')),subset:await read('evaluation/model-subset.json')},[process.env.GH_TOKEN,process.env.GITHUB_TOKEN,process.env.CREWBENCH_WORKER_TOKEN,process.env.DATABASE_URL].filter((s):s is string=>Boolean(s)));
await writeFile(root+'/bundle.json',JSON.stringify({...bundle,run_id:process.env.GITHUB_RUN_ID,files:bundle.files.map(({content,...f}:any)=>f)},null,2)+'\n');
console.log(JSON.stringify({validated:true,mode:bundle.mode,files:bundle.files.length}));
