import {z} from 'zod';
const state=z.enum(['current_pass','current_failure','missing_current','conflicting_current']);
const refs=z.array(z.object({receipt_id:z.string(),evidence_id:z.string(),field:z.enum(['state','subject_revision','catalog_complete'])}).strict()).min(1).max(16);
export const listSchema=z.object({group:z.enum(['all','tests','staging'])}).strict();
export const readSchema=z.object({evidence_ids:z.array(z.string()).min(1).max(4)}).strict();
export const checks={unit_tests:state,api_tests:state,artifact_match:state,staging_probe:state};
export const finalSchema=z.object({verdict:z.enum(['ready','hold','unknown']),checks:z.object(checks).strict(),reasons:z.array(z.object({check_key:z.enum(['unit_tests','api_tests','artifact_match','staging_probe']),code:z.enum(['current_failure','missing_current','conflicting_current'])}).strict()).max(4),evidence_refs:refs}).strict();
export const findingsSchema=(role:string)=>z.object({checks:z.object(role==='tests'?{unit_tests:state,api_tests:state}:{artifact_match:state,staging_probe:state}).strict(),evidence_refs:refs}).strict();
