import {installAccount} from './workspace.mjs';
export const sampleResume='EXAMPLE CAREER APPLICANT\napplicant@example.com\n\nPROFESSIONAL SUMMARY\nOperations professional with verified scheduling, recordkeeping and team support experience.\n\nEXPERIENCE\nOperations Coordinator | Example Employer | Jan 2020 – Dec 2024\n• Maintained PURCHASED_DOCUMENT_FACT_42 and verified equipment records.\n\nEDUCATION\nExample College · Business Certificate · 2019\n\nSKILLS\nExcel, Scheduling';
export async function installPurchasedResumes(page,server={purchased:false,documents:{},requests:[]}){
 await installAccount(page,'registered',{templateEntitlements:[]});const id='a'.repeat(64);
 const build=()=>({id,status:server.review?'complete':'paid',createdAt:1780000000000,prepaid:true,entryMode:'edit',templates:Object.keys(server.documents),includedTemplate:Object.keys(server.documents)[0]||null,input:server.input||null,review:server.review||null});
 await page.route('https://vcp-proxy.vercel.app/api/claude',route=>{
  const body=route.request().postDataJSON();server.requests.push(body);
  if(body.action==='purchase'){server.purchased=true;return route.fulfill({json:{...build(),entryMode:body.entryMode}});}
  if(body.action==='list')return route.fulfill({json:{builds:server.purchased?[build()]:[]}});
  if(body.action==='get'||body.action==='verify')return route.fulfill({json:build()});
  if(body.action==='bind'){server.input=body.input;return route.fulfill({json:build()});}
  if(body.action==='run'){server.review={score:82,summary:'Verified resume review.',strengths:[],findings:[],nextSteps:[],suggestions:[],revisedResume:sampleResume,rewriteNotes:[]};return route.fulfill({json:{id,review:server.review}});}
  if(body.action==='template-finish'){
   const design=body.document.design;if(Object.keys(server.documents).length&&!server.documents[design])return route.fulfill({json:{url:'https://checkout.stripe.com/c/pay/fixture-template'}});
   server.documents[design]={...body.document,buildId:id};return route.fulfill({json:{document:server.documents[design],templates:Object.keys(server.documents),includedTemplate:Object.keys(server.documents)[0]}});
  }
  if(body.action==='template-open')return route.fulfill({json:{document:server.documents[body.design],templates:Object.keys(server.documents),includedTemplate:Object.keys(server.documents)[0]}});
  return route.fallback();
 });return server;
}
