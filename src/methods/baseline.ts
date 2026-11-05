import {CHECKS,groupFor,validatePacket} from '../contracts/core.ts';
import type {Assessment,Check,CheckState,Packet,Ref} from '../contracts/core.ts';

export function assess(packet:Packet,receiptFor:(evidenceId:string)=>string,catalogFor:(group:string)=>string):Assessment{
  validatePacket(packet);
  const checks={} as Record<Check,CheckState>;
  const refs:Ref[]=[];
  for(const key of CHECKS){
    const records=packet.records.filter(r=>r.record_kind==='check'&&r.check_key===key&&r.subject_revision===packet.target_revision);
    const states=new Set(records.map(r=>r.state));
    checks[key]=states.size===0?'missing_current':states.size>1?'conflicting_current':states.has('fail')?'current_failure':'current_pass';
    if(states.size===0)refs.push({receipt_id:catalogFor(groupFor(key)),evidence_id:`catalog_${groupFor(key)}`,field:'catalog_complete'});
    else for(const r of records)refs.push({receipt_id:receiptFor(r.evidence_id),evidence_id:r.evidence_id,field:'state'});
  }
  const reasons=CHECKS.filter(k=>checks[k]!=='current_pass').map(check_key=>({check_key,code:checks[check_key] as Exclude<CheckState,'current_pass'>}));
  const verdict=Object.values(checks).includes('current_failure')?'hold':reasons.length?'unknown':'ready';
  return {case_id:packet.case_id,snapshot_id:packet.snapshot_id,verdict,checks,reasons,evidence_refs:refs};
}
