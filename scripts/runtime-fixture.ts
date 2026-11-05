import {assess} from '../src/methods/baseline.ts';
import {executeTool} from '../src/runtime/tools.ts';
import {acquire,makeJoin} from '../src/runtime/state.ts';
export async function scriptedChild(db:any,id:string,packet:any,role:string,owner:string){return db.change(id,(s:any,n:number)=>{
 const lease=acquire(s,n,owner);const cat=executeTool(s,n,lease,role as any,role+'_catalog','list_evidence',{group:role},packet);
 const rows=packet.records.filter((r:any)=>r.evidence_group===role),mapping=new Map();
 for(let i=0;i<rows.length;i+=4){const ids=rows.slice(i,i+4).map((r:any)=>r.evidence_id);const rec=executeTool(s,n,lease,role as any,role+'_read_'+i,'read_evidence',{evidence_ids:ids},packet);ids.forEach((e:string)=>mapping.set(e,rec.id));}
 const a=assess(packet,e=>mapping.get(e),()=>cat.id),keys=role==='tests'?['unit_tests','api_tests']:['artifact_match','staging_probe'];
 const input={checks:Object.fromEntries(keys.map(k=>[k,a.checks[k as keyof typeof a.checks]])),evidence_refs:a.evidence_refs.filter(r=>rows.some((e:any)=>e.evidence_id===r.evidence_id)||r.evidence_id==='catalog_'+role)};
 return executeTool(s,n,lease,role as any,role+'_submit','submit_findings',input,packet);
});}
export async function scriptedFinal(db:any,id:string,packet:any,owner:string){return db.change(id,(s:any,n:number)=>{const lease=acquire(s,n,owner);makeJoin(s,n,lease);const a=assess(packet,e=>s.receipts.find((r:any)=>r.payload.records?.some((x:any)=>x.evidence_id===e)).id,g=>s.receipts.find((r:any)=>r.payload.catalogs?.some((x:any)=>x.group===g)).id);const {case_id,snapshot_id,...input}=a;return executeTool(s,n,lease,'synthesis','final','submit_assessment',input,packet);});}
