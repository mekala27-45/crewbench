import {assess} from './baseline.ts';
import {acquire,guard} from '../runtime/state.ts';
import {executeTool} from '../runtime/tools.ts';
import type {Packet} from '../contracts/core.ts';
import type {Store} from '../runtime/store.ts';
export async function advanceBaseline(store:Store,id:string,packet:Packet,owner='baseline-worker'){
 return store.change(id,(s,now)=>{
  if(s.status==='submitted')return s;
  if(s.status==='planned'){acquire(s,now,owner);return s;}
  const lease=acquire(s,now,owner);guard(s,now,lease,'baseline');
  const catalog=executeTool(s,now,lease,'baseline','list','list_evidence',{group:'all'},packet);
  const mapping=new Map<string,string>();for(let i=0;i<packet.records.length;i+=4){const ids=packet.records.slice(i,i+4).map(r=>r.evidence_id);const r=executeTool(s,now,lease,'baseline','read_'+i,'read_evidence',{evidence_ids:ids},packet);ids.forEach(id=>mapping.set(id,r.id));}
  const a=assess(packet,id=>mapping.get(id)!,()=>catalog.id);const {case_id,snapshot_id,...input}=a;
  executeTool(s,now,lease,'baseline','submit','submit_assessment',input,packet);return s;
 });
}
