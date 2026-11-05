import {readFile,readdir} from 'node:fs/promises';
import {bytesDigest,digest,Refusal} from '../contracts/core.ts';
export async function frozenInputs(){const files:string[]=[];async function walk(path:string){for(const e of await readdir(path,{withFileTypes:true})){const p=path+'/'+e.name;if(e.isDirectory())await walk(p);else files.push(p);}}for(const path of ['agent','src/runtime','src/contracts','src/methods','fixtures/runtime'])await walk(path);files.push('package.json','package-lock.json','evaluation/plan.json','evaluation/model-lock.json','evaluation/model-subset.json','evaluation/case-index.json','evaluation/corpus-manifest.json','evaluation/grade.py','evaluation/statistics.py','src/report/accounting.ts','src/report/evaluation-inventory.ts','src/report/freeze.ts','scripts/run-evaluation.ts','scripts/initialize-evaluation.ts','scripts/install-ollama.py');files.sort();const result:any={};for(const path of files)result[path]=bytesDigest(await readFile(path));return result;}
export function verifyFreeze(manifest:any,files:any){
 if(!manifest||manifest.schema_version!==1||!manifest.files||Object.keys(manifest.files).length<50||!manifest.development_provenance||!manifest.model?.model_digest)throw new Refusal('FREEZE_EMPTY');
 for(const [path,hash]of Object.entries(manifest.files)){if(!/^[a-zA-Z0-9_.\/-]+$/.test(path)||path.startsWith('/')||path.split('/').includes('..')||!/^[a-f0-9]{64}$/.test(String(hash)))throw new Refusal('FREEZE_PATH_OR_HASH');}
 if(digest(files)!==digest(manifest.files))throw new Refusal('FREEZE_MISMATCH');
 if(!/^[a-f0-9]{64}$/.test(manifest.plan_digest)||!/^[a-f0-9]{40}$/.test(manifest.development_provenance.source_commit)||!/^[a-f0-9]{64}$/.test(manifest.development_provenance.digest))throw new Refusal('FREEZE_PROVENANCE');
 if(!/^[a-f0-9]{64}$/.test(manifest.model.model_digest)||!manifest.model.provider_version)throw new Refusal('FREEZE_MODEL_IDENTITY');
 return true;
}
