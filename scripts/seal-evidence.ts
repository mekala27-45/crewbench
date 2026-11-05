import {readFile,readdir,writeFile,stat} from 'node:fs/promises';
import {digest,bytesDigest} from '../src/contracts/core.ts';
import {scanEvidence,verifyImport} from '../src/report/evidence.ts';
const kind=process.argv[2];if(!['development','evaluation','web'].includes(kind))throw new Error('EVIDENCE_KIND');
const directory=kind==='evaluation'?'actual':kind==='web'?'browser':'development';
const files:any[]=[];const roots=kind==='web'?['artifacts/api','artifacts/browser']:kind==='development'?['artifacts/development','artifacts/recovery']:['artifacts/actual','artifacts/probes'];
for(const root of roots){try{for(const item of await readdir(root,{withFileTypes:true})){if(!item.isFile()||item.name==='manifest.json')continue;const path=root+'/'+item.name,bytes=await readFile(path);if(bytes.length>32*1024*1024)throw new Error('ARTIFACT_TOO_LARGE');if(!item.name.endsWith('.png'))scanEvidence(bytes.toString('utf8'),[process.env.CREWBENCH_WORKER_TOKEN||'']);files.push({path,bytes:bytes.length,sha256:bytesDigest(bytes)});}}catch(e:any){if(e.code!=='ENOENT')throw e;}}
const source_commit=process.env.SOURCE_COMMIT||process.env.GITHUB_SHA,plan_digest=digest(JSON.parse(await readFile('evaluation/plan.json','utf8'))),results_branch=`results/${kind}-${process.env.GITHUB_RUN_ID}`;
const bundle={schema_version:1,mode:kind==='evaluation'?'actual_model':kind==='web'?'browser_verification':'actual_model_development',source_commit,plan_digest,results_branch,files};verifyImport(bundle,{source_commit:source_commit!,plan_digest,branch:results_branch});await writeFile(`artifacts/${directory}/manifest.json`,JSON.stringify(bundle,null,2)+'\n');console.log(JSON.stringify({sealed_files:files.length,source_commit,results_branch}));
