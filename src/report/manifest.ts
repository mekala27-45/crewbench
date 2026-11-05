import {digest,Refusal} from '../contracts/core.ts';
import {STATEMENT,STATEMENT_ID} from './statement.ts';
import {renderClaim} from './claims.ts';
function bind(raw:any,grades:any,mode:string){
 if(!raw||!grades||raw.mode!==mode||grades.source_digest!==digest(raw)||!Array.isArray(raw.trials)||!raw.trials.length||!Array.isArray(grades.grades))throw new Refusal('REPORT_GRADE_PROVENANCE');
 const ids=raw.trials.map((t:any)=>t.trial_id),gids=grades.grades.map((g:any)=>g.trial_id);
 if(new Set(ids).size!==ids.length||new Set(gids).size!==gids.length||digest([...ids].sort())!==digest([...gids].sort()))throw new Refusal('REPORT_GRADE_INVENTORY');
}
export function buildEvidenceReport(x:any){
 const {index,plan,subset,source_commit,baseline,grades,actual,actualGrades,actualSummary,recovery,recoveryGrades}=x;
 const report:any={schema_version:1,statement:STATEMENT,statement_id:STATEMENT_ID,source_commit,plan,subset,status:actual?(actualGrades?.private_truth_verified?'recorded_evaluation':'provisional_evaluation'):'development',baseline:null,actual:null,recovery:null,claims:[]};
 if(baseline){
  bind(baseline,grades,'deterministic_baseline');
  const scope=(ids:string[])=>{const rows=baseline.trials.filter((r:any)=>ids.includes(r.case_id));if(rows.length!==ids.length||new Set(rows.map((r:any)=>r.case_id)).size!==ids.length)throw new Refusal('REPORT_BASELINE_SCOPE');const wanted=new Set(rows.map((r:any)=>r.trial_id));return {successes:grades.grades.filter((g:any)=>wanted.has(g.trial_id)&&g.strict_success).length,planned:ids.length,observed:rows.length};};
  report.baseline={mode:'deterministic_baseline',presentation:'recorded',grading_basis:grades.grading_basis||'unspecified',private_truth_verified:grades.private_truth_verified===true,source_commit:baseline.source_commit,evidence_digest:digest(baseline),window:baseline.window,all:scope(index.map((r:any)=>r.case_id)),held_out:scope(index.filter((r:any)=>r.split==='held_out').map((r:any)=>r.case_id)),paired_subset:scope(subset)};
  report.claims.push({method:'deterministic_baseline',mode:'deterministic_baseline',scope:'all authored cases',numerator:report.baseline.all.successes,denominator:index.length,missing_reason:null,source_commit:baseline.source_commit,evidence_digest:digest(baseline),window:baseline.window});
 }
 if(actual){
  bind(actual,actualGrades,'actual_model');
  if(!actualSummary||actual.plan_digest!==digest(plan)||actualSummary.source_digest!==digest(actual)||actualSummary.grades_digest!==digest(actualGrades)||actualSummary.planned_pairs!==12)throw new Refusal('REPORT_ACTUAL_PROVENANCE');
  report.actual={...actualSummary,worker:actual.worker,grading_basis:actualGrades.grading_basis||'unspecified',private_truth_verified:actualGrades.private_truth_verified===true,mode:'actual_model',source_commit:actual.source_commit,evidence_digest:digest(actual),window:actual.window};
  for(const method of ['solo_agent','split_review']){const rows=actual.trials.filter((r:any)=>r.method===method);const successes=actualGrades.grades.filter((r:any)=>r.method===method&&r.strict_success).length;if(rows.length!==12||new Set(rows.map((r:any)=>r.case_id)).size!==12||rows.some((r:any)=>!subset.includes(r.case_id))||actualSummary[method].successes!==successes)throw new Refusal('REPORT_ACTUAL_COUNTS');report.claims.push({method,mode:'actual_model',scope:'registered paired subset',numerator:successes,denominator:12,missing_reason:null,source_commit:actual.source_commit,evidence_digest:digest(actual),window:actual.window});}
 }
 if(recovery){
  bind(recovery,recoveryGrades,'scripted_runtime');
  if(recoveryGrades.schema_version!==2||!recoveryGrades.inventory_valid||recoveryGrades.planned!==12||recoveryGrades.observed!==recovery.trials.length||recoveryGrades.verified!==recoveryGrades.grades.filter((g:any)=>g.verified).length)throw new Refusal('REPORT_RECOVERY_COUNTS');
  const window={start:recovery.trials.map((r:any)=>r.window.start).sort()[0],end:recovery.trials.map((r:any)=>r.window.end).sort().at(-1)};
  report.recovery={mode:'scripted_runtime',planned:12,observed:recoveryGrades.observed,verified:recoveryGrades.verified,source_commit:recovery.source_commit,evidence_digest:digest(recovery),window};
  report.claims.push({method:'runtime_invariants',mode:'scripted_runtime',scope:'six faults on two fixtures',numerator:recoveryGrades.verified,denominator:12,missing_reason:null,source_commit:recovery.source_commit,evidence_digest:digest(recovery),window});
 }
 report.rendered_claims=report.claims.map(renderClaim);
 report.generated_at=report.claims.map((c:any)=>c.window.end).sort().at(-1)||null;
 return report;
}
