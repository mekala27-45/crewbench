import fs from 'node:fs/promises';import path from 'node:path';import {pathToFileURL} from 'node:url';import {execFile} from 'node:child_process';import {promisify} from 'node:util';
const root=process.cwd(),inventory=JSON.parse(await fs.readFile('artifacts/host/package.json','utf8'));
if(inventory.configs.length!==1)throw Error('HOST_FUNCTION_COUNT');
const cfg=inventory.configs[0],directory=path.dirname(path.resolve(cfg.path));
for(const [logical,source]of Object.entries(cfg.config.filePathMap||{})){const target=path.resolve(directory,logical);if(!target.startsWith(directory+path.sep))throw Error('HOST_TARGET_ESCAPE');await fs.mkdir(path.dirname(target),{recursive:true});await fs.copyFile(path.resolve(root,String(source)),target);}
process.env.VERCEL='1';process.env.SOURCE_COMMIT=process.env.GITHUB_SHA;process.chdir(directory);
const {default:server}=await import(pathToFileURL(path.join(directory,cfg.config.handler)).href);
if(!server||typeof server.listen!=='function')throw Error('HOST_HANDLER_NOT_HTTP_SERVER');
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const port=server.address().port;
let passed=false,failure=null;
try{const {stdout}=await promisify(execFile)(process.execPath,[path.join(root,'scripts/check-api.ts')],{cwd:root,env:{...process.env,API_URL:'http://127.0.0.1:'+port},timeout:60000});console.log(stdout);await fs.copyFile(path.join(root,'artifacts/api/check.json'),path.join(root,'artifacts/host/api-check.json'));passed=true;}
catch(e){failure=String(e.message);throw e;}
finally{await new Promise(resolve=>server.close(resolve));await fs.writeFile(path.join(root,'artifacts/host/smoke.json'),JSON.stringify({schema_version:1,source_commit:process.env.GITHUB_SHA,mode:'isolated_compiled_function',deployed:false,passed,failure,handler:cfg.config.handler},null,2)+'\n');}
