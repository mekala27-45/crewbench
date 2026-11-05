import fs from 'node:fs';import path from 'node:path';import {createHash} from 'node:crypto';
const rows=[],links=[],seen=new Set();
function walk(p){const real=fs.realpathSync(p),st=fs.statSync(p);if(st.isDirectory()){if(seen.has(real))return;seen.add(real);for(const name of fs.readdirSync(p))walk(path.join(p,name));}else if(st.isFile())rows.push(p);if(fs.lstatSync(p).isSymbolicLink())links.push({path:p,target:fs.readlinkSync(p)});}
walk('.vercel/output');
const inputs=rows.filter(p=>/fixtures\/runtime\/.*\.json$/.test(p)),configs=rows.filter(p=>p.endsWith('.vc-config.json')).map(p=>({path:p,config:JSON.parse(fs.readFileSync(p))}));
const out={source_commit:process.env.GITHUB_SHA,mode:'offline_host_package_verification',deployed:false,public_packets:inputs.length,report_present:rows.some(p=>p.endsWith('site/public/data/report.json')),configs,file_count:rows.length,links,paths:rows.filter(p=>!p.includes('/node_modules/')),config_digest:createHash('sha256').update(fs.readFileSync('vercel.json')).digest('hex')};
fs.mkdirSync('artifacts/host',{recursive:true});fs.writeFileSync('artifacts/host/package.json',JSON.stringify(out,null,2)+'\n');
if(out.public_packets!==48||!out.report_present)throw Error('PUBLIC_INPUTS_NOT_PACKAGED');
if(rows.some(p=>/fixtures\/truth\/|\/agent\/subagents\//.test(p)))throw Error('PRIVATE_WORKER_PACKAGED');
console.log(JSON.stringify({verified:true,public_packets:out.public_packets,configs:configs.length}));
