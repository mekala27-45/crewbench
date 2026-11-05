import {digest,Refusal} from '../contracts/core.ts';
import {STATEMENT} from './statement.ts';
export type Claim={method:string;mode:'actual_model'|'deterministic_baseline'|'scripted_runtime';scope:string;numerator:number|null;denominator:number;missing_reason:string|null;source_commit:string;evidence_digest:string;window:{start:string;end:string}};
export function renderClaim(c:Claim){
  if(!c||!c.source_commit||!(/^[a-f0-9]{40}$/).test(c.source_commit)||!(/^[a-f0-9]{64}$/).test(c.evidence_digest)||!c.scope||!c.window||!Number.isFinite(Date.parse(c.window.start))||!Number.isFinite(Date.parse(c.window.end))||Date.parse(c.window.end)<Date.parse(c.window.start))throw new Refusal('CLAIM_PROVENANCE');
  const pairs={deterministic_baseline:['deterministic_baseline'],actual_model:['solo_agent','split_review'],scripted_runtime:['runtime_invariants']};
  if(!pairs[c.mode]?.includes(c.method))throw new Refusal('CLAIM_MODE');
  if(!Number.isSafeInteger(c.denominator)||c.denominator<=0)throw new Refusal('CLAIM_DENOMINATOR');
  if(c.numerator===null){if(!c.missing_reason)throw new Refusal('MISSING_REASON');return `${c.method}: no measured result available. ${c.missing_reason}`;}
  if(!Number.isSafeInteger(c.numerator)||c.numerator<0||c.numerator>c.denominator||c.missing_reason!==null)throw new Refusal('CLAIM_COUNT');
  return `${c.method}: ${c.numerator} of ${c.denominator} planned cases passed strict grading. Source ${c.evidence_digest}. Window ${c.window.start} to ${c.window.end}.`;
}
export function renderDocument(title:string,claims:Claim[]){return `# ${title}\n\n${STATEMENT}\n\n${claims.length?claims.map(renderClaim).join('\n\n'):'No measured result available.'}\n`;}
export function validateBundle(b:any){
  if(!b||!['actual_model','deterministic_baseline','scripted_runtime','startup_failure'].includes(b.mode)||!(/^[a-f0-9]{40}$/).test(b.source_commit)||!(/^[a-f0-9]{64}$/).test(b.plan_digest)||!Array.isArray(b.files)||!b.files.length)throw new Refusal('BUNDLE_PROVENANCE');
  const seen=new Set();for(const f of b.files){if(typeof f.path!=='string'||!(/^[a-zA-Z0-9_./-]+$/).test(f.path)||f.path.startsWith('/')||f.path.split('/').includes('..')||seen.has(f.path)||digest(f.content)!==f.digest)throw new Refusal('BUNDLE_CONTENT');seen.add(f.path);}
  return true;
}
