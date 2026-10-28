'use strict';
(async()=>{
 const prior=await fetch('https://raw.githubusercontent.com/Phocas88/Veteran_Career_Builder/e45ee87b22a13667da1c0690fd4ab2da40d48a1f/scripts/inspect-authorized-app-account.cjs',{signal:AbortSignal.timeout(20000)});
 if(!prior.ok)throw new Error('The previously verified public CV selection is unavailable.');
 const slug=(await prior.text()).match(/const slug='(vcp-resume-[a-f0-9]{32})'/)?.[1];if(!slug)throw new Error('Public CV selection could not be read.');
 const response=await fetch('https://profiles.veterancareerpath.com/veteran/'+slug+'?format-check='+Date.now(),{signal:AbortSignal.timeout(25000),headers:{'Cache-Control':'no-cache'}});
 const html=await response.text();const sections=[...html.matchAll(/<h2 id="([a-z-]+)">/g)].map(m=>m[1]);const summary=html.match(/<div class="cv-summary">([\s\S]*?)<\/div>/)?.[1]||'';
 const name=html.match(/<h1 class="cv-name">([^<]+)<\/h1>/)?.[1]||'',last=name.trim().split(/\s+/).at(-1)||'';
 const escape=s=>s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');const pageLabels=last?new RegExp(escape(last)+'\\s+\\d+\\s*\\/\\s*\\d+','i').test(html):false;
 console.log('LIVE_PUBLIC_CV_CHECK '+JSON.stringify({status:response.status,desktopLayout:html.includes('data-cv-layout="desktop-20261028"'),sections,hasEducation:sections.includes('education'),hasSkills:sections.includes('skills'),summaryParagraphs:(summary.match(/<p>/g)||[]).length,skillHeadingInSummary:/TECHNICAL (?:AND|&) BUSINESS SKILLS/i.test(summary),hasNamedPageLabels:pageLabels}));
 if(response.status!==200||!html.includes('data-cv-layout="desktop-20261028"')||pageLabels||/TECHNICAL (?:AND|&) BUSINESS SKILLS/i.test(summary))throw new Error('The public CV still needs attention.');
})().catch(error=>{console.error(error.message);process.exitCode=1;});
