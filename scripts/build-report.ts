import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {buildEvidenceReport} from '../src/report/manifest.ts';
import {STATEMENT,STATEMENT_ID} from '../src/report/statement.ts';
const read=async(p:string)=>JSON.parse(await readFile(p,'utf8'));
const optional=async(p:string)=>{try{return await read(p);}catch(e:any){if(e.code==='ENOENT')return null;throw e;}};
const index=await read('evaluation/case-index.json'),plan=await read('evaluation/plan.json'),subset=await read('evaluation/model-subset.json');
const baseline=await optional('artifacts/baseline/postgres.json'),grades=await optional('artifacts/baseline/postgres-grades.json');
const actual=await optional('artifacts/actual/results.json'),actualGrades=await optional('artifacts/actual/grades.json');
const recovery=await optional('artifacts/recovery/results.json'),recoveryGrades=await optional('artifacts/recovery/grades.json');
const actualSummary=await optional('artifacts/actual/summary.json');
const report=buildEvidenceReport({index,plan,subset,source_commit:process.env.SOURCE_COMMIT||process.env.GITHUB_SHA||null,baseline,grades,actual,actualGrades,actualSummary,recovery,recoveryGrades});
const cases=[];for(const row of index){const packet=await read(`fixtures/runtime/${row.case_id}.json`);const base=baseline?.trials.find((t:any)=>t.case_id===row.case_id);cases.push({case_id:row.case_id,family:row.family,split:row.split,selected:subset.includes(row.case_id),packet,baseline:base||null,actual:actual?.trials.filter((t:any)=>t.case_id===row.case_id)||[]});}
await mkdir('site/public/data',{recursive:true});for(const [name,data]of Object.entries({report,cases,recovery:recovery||{trials:[]}}))await writeFile(`site/public/data/${name}.json`,JSON.stringify(data)+'\n');
console.log(JSON.stringify({baseline:report.baseline?.all,actual:report.actual!==null,recovery:report.recovery}));
