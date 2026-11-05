import {readFile,access} from 'node:fs/promises';
const read=p=>readFile(p,'utf8');
for(const path of ['AGENTS.md','CLAUDE.md','.github/copilot-instructions.md','docs/SPEC.md','OPERATIONS.md','NOTICES.md'])await access(path);
for(const path of ['CLAUDE.md','.github/copilot-instructions.md'])if(!(await read(path)).includes('AGENTS.md'))throw new Error('GUIDANCE_CONTRACT_LINK');
for(const name of ['run-paired-evaluation','inspect-trial-recovery','publish-evidence-report']){const s=await read('.agents/skills/'+name+'/SKILL.md');if(!s.startsWith('---\nname: '+name+'\ndescription: ')||!s.includes('AGENTS.md')||!s.includes('Refuse')&&!s.includes('Reject'))throw new Error('OPERATOR_SKILL_CONTRACT');}
console.log(JSON.stringify({guidance:'verified',repository_skills:3,runtime_inclusion:false}));
