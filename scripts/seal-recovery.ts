import {readFile,readdir,writeFile} from 'node:fs/promises';
import {digest,bytesDigest} from '../src/contracts/core.ts';
import {scanEvidence,verifyImport} from '../src/report/evidence.ts';
const files=[];for(const directory of ['artifacts/baseline','artifacts/recovery'])for(const entry of await readdir(directory,{withFileTypes:true})){if(!entry.isFile()||entry.name==='manifest.json')continue;const path=directory+'/'+entry.name,bytes=await readFile(path);scanEvidence(bytes.toString('utf8'));files.push({path,bytes:bytes.length,sha256:bytesDigest(bytes)});}
const source_commit=process.env.GITHUB_SHA!,plan_digest=digest(JSON.parse(await readFile('evaluation/plan.json','utf8'))),results_branch='results/recovery-'+process.env.GITHUB_RUN_ID;
const manifest={schema_version:1,mode:'scripted_runtime',source_commit,plan_digest,results_branch,files};verifyImport(manifest,{source_commit,plan_digest,branch:results_branch});await writeFile('artifacts/recovery/manifest.json',JSON.stringify(manifest,null,2)+'\n');
