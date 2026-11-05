import {readFileSync,writeFileSync} from 'node:fs';
const p=JSON.parse(readFileSync('evaluation/plan.json','utf8'));
p.revision=3;p.registered_at=new Date().toISOString();p.source_commit='6232283c440cdf6df39b57de82fa1c8ffdd1a80d';
p.budget={model_requests:12,tool_requests:24,input_bytes:98304,output_reserved_tokens:6144,output_per_request_tokens:512,trial_seconds:360,request_seconds:120};
p.partitions={tests:{model_requests:5,tool_requests:10,input_bytes:32768,output_reserved_tokens:2560},staging:{model_requests:5,tool_requests:10,input_bytes:32768,output_reserved_tokens:2560},synthesis:{model_requests:2,tool_requests:4,input_bytes:32768,output_reserved_tokens:1024}};
p.revision_reason='Development runs 42102826720 and 42103168989 exhausted three-call child allocations on extra reads and showed a 60-second synthesis timeout. Use matched 12-call, 98304-byte, 6144-reserved-token ceilings, 360-second trials and 120-second requests. Child partitions are five calls each and synthesis two. Clarify batching and required nonempty references. No held-out actual result has been inspected.';
writeFileSync('evaluation/plan.json',JSON.stringify(p,null,2)+'\n');
let run=readFileSync('scripts/run-development.ts','utf8').replace('245000','plan.budget.trial_seconds*1000+5000');writeFileSync('scripts/run-development.ts',run);
let evalRun=readFileSync('scripts/run-evaluation.ts','utf8').replace("trials.map(r=>r.state.activated_at).filter(Boolean).sort()[0]||null","trials.some(r=>r.state.activated_at)?new Date(Math.min(...trials.map(r=>r.state.activated_at).filter(Boolean))).toISOString():null");writeFileSync('scripts/run-evaluation.ts',evalRun);
