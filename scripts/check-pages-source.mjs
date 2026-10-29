// Read only: a legacy branch publisher can overwrite the built resume app.
// Changing Pages settings needs repository administration access, not a new deploy.
import {appendFile} from 'node:fs/promises';
const repository=process.env.GITHUB_REPOSITORY,token=process.env.GITHUB_TOKEN;
if(!repository||!token)throw new Error('GitHub Pages metadata requires the workflow context.');
const response=await fetch('https://api.github.com/repos/'+repository+'/pages',{headers:{Accept:'application/vnd.github+json',Authorization:'Bearer '+token,'X-GitHub-Api-Version':'2022-11-28'},signal:AbortSignal.timeout(10000)});
if(!response.ok){console.log('::warning title=Pages source check::Could not read Pages publishing settings. HTTP '+response.status);process.exit(0);}
const pages=await response.json();
console.log('PAGES_PUBLISHING_SOURCE '+JSON.stringify({buildType:pages.build_type||'unknown'}));
if(pages.build_type!=='workflow'){
 const settings='https://github.com/'+repository+'/settings/pages';
 console.log('::warning title=Pages publishing conflict::Set Settings > Pages > Build and deployment > Source to GitHub Actions. The branch publisher can replace the built app with an incomplete site.');
 if(process.env.GITHUB_STEP_SUMMARY)await appendFile(process.env.GITHUB_STEP_SUMMARY,'\nThe Pages source still allows a branch publisher to overwrite the built resume app. Set **Source: GitHub Actions** in [Pages settings]('+settings+'). The tested site will still be deployed by this workflow.\n');
}
