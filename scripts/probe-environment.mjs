import {mkdir,writeFile} from 'node:fs/promises';
import os from 'node:os';
import {spawnSync} from 'node:child_process';
const root = new URL('../artifacts/probes/', import.meta.url);
await mkdir(root,{recursive:true});
const started_at = new Date().toISOString();
const report = {schema_version:1,execution_mode:'environment_probe',source_commit:process.env.GITHUB_SHA||process.env.SOURCE_COMMIT||null,started_at,node:process.version,os:os.platform(),arch:os.arch(),cpu:os.cpus()[0]?.model,memory_bytes:os.totalmem(),python:null,packages:[],model:null};
const py=spawnSync(process.env.PYTHON||'python3',['--version'],{encoding:'utf8',timeout:5000});
report.python={status:py.status,version:py.stdout?.trim()||null,error:py.error?.code||null};
const candidates={eve:'1.0.0-rc.5',ai:'7.0.163','@ai-sdk/openai-compatible':'3.0.85',pg:'8.23.1',zod:'4.6.7',vite:'8.3.6',typescript:'7.0.2','@playwright/test':'1.64.1','@fontsource/faustina':'5.3.0','@fontsource/sarabun':'5.3.0','@fontsource/sono':'5.3.0'};
for(const [name,version] of Object.entries(candidates)){
  const url=`https://registry.npmjs.org/${encodeURIComponent(name)}/${version}`;
  try{const res=await fetch(url,{signal:AbortSignal.timeout(15000)}); if(!res.ok)throw new Error(`HTTP_${res.status}`);const p=await res.json();report.packages.push({name,candidate:version,version:p.version,engines:p.engines||null,integrity:p.dist.integrity,tarball:p.dist.tarball,license:p.license,status:'verified',url});}
  catch(error){report.packages.push({name,candidate:version,status:'unavailable',code:error.cause?.code||error.message,url});}
}
try{const r=await fetch('http://127.0.0.1:11434/api/version',{signal:AbortSignal.timeout(5000)});report.model={status:r.ok?'available':'failed',provider:await r.json()};}catch(error){report.model={status:'startup_failed',code:error.cause?.code||error.message,actual_dispatch:false};}
report.ended_at=new Date().toISOString();
await writeFile(new URL(`${process.env.CI?'remote':'local'}.json`,root),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({packages_verified:report.packages.filter(p=>p.status==='verified').length,model:report.model.status,source_commit:report.source_commit}));
