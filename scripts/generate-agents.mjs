import {mkdirSync,writeFileSync,readFileSync} from 'node:fs';
import {instructions} from './agent-instructions.mjs';
const policy=JSON.parse(readFileSync('evaluation/plan.json','utf8')).policy;
for(const role of ['solo','tests','staging','synthesis']){
 const dir=`agent/subagents/${role}`;mkdirSync(`${dir}/tools`,{recursive:true});
 writeFileSync(`${dir}/agent.ts`,`import {roleAgent} from '../../lib/role-model.ts';\nexport default roleAgent('${role}');\n`);
 writeFileSync(`${dir}/instructions.md`,instructions(role,policy));
 const names=role==='synthesis'?['read_evidence','submit_assessment']:['list_evidence','read_evidence',role==='solo'?'submit_assessment':'submit_findings'];
 for(const name of names){const schema=name==='list_evidence'?'listSchema':name==='read_evidence'?'readSchema':name==='submit_assessment'?'finalSchema':`findingsSchema('${role}')`;writeFileSync(`${dir}/tools/${name}.ts`,`import {boundTool} from '../../../lib/tool.ts';\nimport {listSchema,readSchema,finalSchema,findingsSchema} from '../../../lib/schemas.ts';\nexport default boundTool('${role}','${name}',${schema});\n`);}
}
