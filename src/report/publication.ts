import {digest,Refusal} from '../contracts/core.ts';
import {validateBundle} from './claims.ts';
import {verifyAccounting} from './accounting.ts';
export function validatePublication(files:any[],expected:any,secrets:string[]=[]){
 if(!Array.isArray(files)||!files.length)throw new Refusal('PUBLICATION_EMPTY');
 let bytes=0;const forbidden=secrets.filter(s=>s.length>=12);
 function scan(value:any){if(typeof value==='string'&&(forbidden.some(s=>value.includes(s))||value.includes('PRIVATE_TRUTH_')||/postgres(?:ql)?:\/\/[^\s]+@/.test(value)))throw new Refusal('PUBLICATION_SECRET');if(value&&typeof value==='object')for(const v of Object.values(value))scan(v);}
 for(const f of files){if(!/^artifacts\/actual\/(results|model-probe|workflow|grades|summary)\.json$/.test(f.path))throw new Refusal('PUBLICATION_PATH');scan(f.content);bytes+=Buffer.byteLength(JSON.stringify(f.content));if(bytes>110*1024*1024)throw new Refusal('PUBLICATION_SIZE');}
 const raw=files.find(f=>f.path==='artifacts/actual/results.json')?.content;
 if(!raw||raw.mode!=='actual_model'||raw.source_commit!==expected.source_commit||raw.plan_digest!==expected.plan_digest||raw.freeze_digest!==expected.freeze_digest)throw new Refusal('PUBLICATION_PROVENANCE');
 const wanted=new Set(expected.subset.flatMap((id:string)=>['solo_agent','split_review'].map(m=>id+':'+m)));
 if(wanted.size!==24||raw.trials?.length!==24||new Set(raw.trials.map((r:any)=>r.trial_id)).size!==24||new Set(raw.trials.map((r:any)=>r.case_id+':'+r.method)).size!==24||raw.trials.some((r:any)=>!wanted.has(r.case_id+':'+r.method)))throw new Refusal('PUBLICATION_INVENTORY');
 for(const r of raw.trials){if(r.actual_dispatch){const a=verifyAccounting(r.state);if(!a.confirmed_attempts)throw new Refusal('PUBLICATION_FALSE_ACTUAL');}else if(r.status==='submitted')throw new Refusal('PUBLICATION_UNEXECUTED_SUCCESS');}
 const bundle={schema_version:1,mode:raw.trials.some((r:any)=>r.actual_dispatch)?'actual_model':'startup_failure',source_commit:raw.source_commit,plan_digest:raw.plan_digest,files:files.map(f=>({...f,digest:digest(f.content)}))};
 validateBundle(bundle);return bundle;
}
