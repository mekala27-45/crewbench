import {readFile,readdir,writeFile,mkdir} from 'node:fs/promises';
import {newTrial} from '../src/runtime/state.ts';
import {advanceBaseline} from '../src/methods/run-baseline.ts';
import {MemoryStore} from '../tests/support/memory-store.ts';
import {PgStore} from '../src/runtime/store.ts';
const root=new URL('../',import.meta.url);const read=async(p:string)=>JSON.parse(await readFile(new URL(p,root),'utf8'));
const plan=await read('evaluation/plan.json');const index=await read('evaluation/case-index.json');
const usePg=process.argv.includes('--postgres');const store=usePg?await PgStore.open():new MemoryStore();
const rows=[];const start=new Date().toISOString();
for(const row of index){const packet=await read(`fixtures/runtime/${row.case_id}.json`);const id=`baseline_${row.case_id}`;await store.create(newTrial({id,packet,plan,method:'deterministic_baseline'}),packet,'baseline-v1');await advanceBaseline(store,id,packet);const s=await advanceBaseline(store,id,packet);rows.push({trial_id:id,case_id:row.case_id,method:s.method,mode:s.mode,status:s.status,on_time:s.status==='submitted'&&s.terminal_at!<s.deadline!,assessment:s.assessment,receipts:s.receipts,split:row.split,model_selected:row.model_selected,model_requests:0,tools_executed:s.receipts.length,elapsed_ms:s.terminal_at!-s.activated_at!,persistence:usePg?'postgres':'unit_test_memory'});}
await mkdir(new URL('artifacts/baseline/',root),{recursive:true});await writeFile(new URL('artifacts/baseline/results.json',root),JSON.stringify({schema_version:1,mode:'deterministic_baseline',source_commit:process.env.SOURCE_COMMIT||process.env.GITHUB_SHA||null,window:{start,end:new Date().toISOString()},trials:rows},null,2)+'\n');await store.close();console.log(JSON.stringify({baseline_trials:rows.length,submitted:rows.filter(r=>r.status==='submitted').length,persistence:usePg?'postgres':'unit_test_memory'}));
