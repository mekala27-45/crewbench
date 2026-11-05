import {readFile,readdir,mkdir,writeFile} from 'node:fs/promises';
const p=JSON.parse(await readFile('package.json','utf8')),names=Object.keys({...p.dependencies,...p.devDependencies}),rows=[];
await mkdir('site/public/notices',{recursive:true});
for(const name of names){const directory='node_modules/'+name,manifest=JSON.parse(await readFile(directory+'/package.json','utf8'));const files=(await readdir(directory)).filter(f=>/^licen[sc]e|^ofl/i.test(f));for(const file of files){const path='notices/'+name.replaceAll('/','-')+'-'+file+'.txt';await writeFile('site/public/'+path,await readFile(directory+'/'+file));rows.push({name,version:manifest.version,license:manifest.license||null,path});}}
await writeFile('site/public/notices/index.json',JSON.stringify(rows,null,2)+'\n');console.log(JSON.stringify({license_files:rows.length}));
