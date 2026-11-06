import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {buildResumeWebsite} from './build-resume-landing.mjs';

// This deployment serves only the resume app. Accounts and purchases continue
// using the existing Firebase project and authenticated backend.
const root=fileURLToPath(new URL('../',import.meta.url));
const workspace=path.join(root,'resume-workspace-src');
const npm=process.platform==='win32'?'npm.cmd':'npm';
function run(command,args,cwd=root){
 const result=spawnSync(command,args,{cwd,stdio:'inherit',shell:process.platform==='win32'});
 if(result.error||result.status!==0)throw new Error('Standalone app build failed: '+command+' '+args.join(' '));
}
run(process.execPath,['scripts/build-service-library.mjs']);
run(process.execPath,['--test','test/standalone-resume.test.mjs','test/resume-website.test.mjs']);
run(npm,['run','check'],workspace);
run(npm,['run','build'],workspace);
run(process.execPath,['scripts/render-template-previews-node.mjs'],workspace);
run(process.execPath,['scripts/render-website-examples.mjs'],workspace);
const result=buildResumeWebsite();
console.log('RESUME_WEBSITE_BUILT '+JSON.stringify(result));
