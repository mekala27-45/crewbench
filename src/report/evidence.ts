import {bytesDigest,Refusal} from '../contracts/core.ts';
export function verifyImport(bundle:any,expected:{source_commit:string;plan_digest:string;branch:string}){
 if(!bundle||!bundle.files?.length)throw new Refusal('IMPORT_EMPTY');
 if(bundle.source_commit!==expected.source_commit||bundle.plan_digest!==expected.plan_digest||bundle.results_branch!==expected.branch||!/^results\/[a-z-]+-\d+$/.test(expected.branch))throw new Refusal('IMPORT_PROVENANCE');
 const seen=new Set();for(const f of bundle.files){if(!/^artifacts\/[a-zA-Z0-9_./-]+$/.test(f.path)||f.path.split('/').includes('..')||seen.has(f.path)||!Number.isSafeInteger(f.bytes)||f.bytes<1||f.bytes>32*1024*1024||!/^[a-f0-9]{64}$/.test(f.sha256))throw new Refusal('IMPORT_PATH_OR_DIGEST');seen.add(f.path);}
 return true;
}
export function scanEvidence(text:string,knownSecrets:string[]=[]){if(knownSecrets.filter(x=>x.length>=16).some(x=>text.includes(x))||/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----|\bgh[pousr]_[A-Za-z0-9]{20,}|\bsk-(?:proj-)?[A-Za-z0-9_-]{30,}|PRIVATE_TRUTH_[A-Za-z0-9]{8,}|Bearer [A-Za-z0-9_-]{24,}/.test(text))throw new Refusal('SECRET_IN_EVIDENCE');return bytesDigest(text);}
export function retentionPlan(runs:{id:string;created_at:string}[],pins:string[],limit=32){if(!runs.length||!pins.length||pins.some(id=>!runs.some(r=>r.id===id)))throw new Refusal('RETENTION_EVIDENCE_MISSING');const retained=new Set(pins);const recent=runs.filter(r=>!retained.has(r.id)).sort((a,b)=>b.created_at.localeCompare(a.created_at));for(const r of recent.slice(0,Math.max(0,limit-pins.length)))retained.add(r.id);return {retained:[...retained].sort(),eligible_for_review:runs.filter(r=>!retained.has(r.id)).map(r=>r.id).sort(),automatic_deletion:false,capacity_exceeded:pins.length>limit};}
