import crypto from 'node:crypto';
import fs from 'node:fs';
import { pathToFileURL } from 'node:url';

const project = 'veteran-career-builder';
const parent = `projects/${project}/sites/${project}`;
const domains = ['veterancareerpath.com', 'www.veterancareerpath.com'];
const apiOrigin = 'https://firebasehosting.googleapis.com/v1beta1/';

export async function hostingAccessToken(credentialJson, fetcher = fetch, now = Date.now) {
  let credential;
  try { credential = JSON.parse(credentialJson); } catch { throw new Error('The existing Firebase deployment credential is unavailable or malformed.'); }
  if (!credential?.client_email || !credential?.private_key) throw new Error('The existing Firebase deployment credential is incomplete.');
  const issued = Math.floor(now() / 1000);
  const encode = value => Buffer.from(JSON.stringify(value)).toString('base64url');
  const unsigned = encode({alg:'RS256',typ:'JWT'}) + '.' + encode({iss:credential.client_email,scope:'https://www.googleapis.com/auth/firebase',aud:'https://oauth2.googleapis.com/token',iat:issued,exp:issued+300});
  let signature;
  try { signature = crypto.sign('RSA-SHA256', Buffer.from(unsigned), credential.private_key).toString('base64url'); }
  catch { throw new Error('The existing Firebase deployment credential could not sign a request.'); }
  const response = await fetcher('https://oauth2.googleapis.com/token', {method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({grant_type:'urn:ietf:params:oauth:grant-type:jwt-bearer',assertion:unsigned+'.'+signature}),signal:AbortSignal.timeout(15000)});
  if (!response.ok) throw new Error(`Firebase deployment authentication failed (HTTP ${response.status}).`);
  const data = await response.json();
  if (typeof data.access_token !== 'string' || !data.access_token) throw new Error('Firebase deployment authentication returned no token.');
  return data.access_token;
}

export function domainSummary(resource) {
  const records=[];
  for (const [phase, updates] of [['hosting',resource.requiredDnsUpdates],['certificate',resource.cert?.verification?.dns]]) {
    for (const set of [...(updates?.desired||[]),...(updates?.discovered||[])]) for (const record of set.records||[]) {
      if (!['ADD','REMOVE'].includes(record.requiredAction)) continue;
      const row={phase,action:record.requiredAction,name:record.domainName||set.domainName,type:record.type,value:record.rdata};
      if (!records.some(x=>JSON.stringify(x)===JSON.stringify(row))) records.push(row);
    }
  }
  const http=resource.cert?.verification?.http;
  return {domain:resource.name?.split('/').at(-1),ownership:resource.ownershipState||'PENDING',hosting:resource.hostState||'PENDING',certificate:resource.cert?.state||'PENDING',records,
    ...(http?.path&&http?.desired?{httpVerification:{path:http.path,value:http.desired}}:{})};
}

export async function prepareHostingDomains({credentialJson=process.env.FIREBASE_SERVICE_ACCOUNT,fetcher=fetch,wait=ms=>new Promise(resolve=>setTimeout(resolve,ms)),now=Date.now}={}) {
  const token=await hostingAccessToken(credentialJson,fetcher,now);
  async function request(path,method='GET',allowMissing=false) {
    const response=await fetcher(apiOrigin+path,{method,headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},...(method==='POST'?{body:'{}'}:{}),signal:AbortSignal.timeout(15000)});
    if (allowMissing&&response.status===404) return null;
    if (method==='POST'&&response.status===409) return null;
    if (!response.ok) throw new Error(`Firebase custom-domain ${method} failed (HTTP ${response.status}). Check the existing service account's Firebase Hosting permissions.`);
    return response.json();
  }
  const result=[];
  for (const domain of domains) {
    const name=parent+'/customDomains/'+domain;
    let resource=await request(name,'GET',true);
    if (!resource) {
      await request(parent+'/customDomains?customDomainId='+encodeURIComponent(domain),'POST');
      for (let i=0;i<8&&!resource;i++) {
        if (i) await wait(2000);
        resource=await request(name,'GET',true);
      }
    }
    result.push(domainSummary(resource||{name}));
  }
  return result;
}

export function instructionsForDomains(results) {
  const lines=['# Website security: Firebase domain preparation','','The existing GitHub Pages site stays live until DNS is changed. No DNS records were changed by this workflow.','','Add ownership and certificate-verification records first. Keep the current website A/CNAME records until Firebase reports CERT_ACTIVE and HTTPS for the custom domain has been verified. Preserve MX and unrelated TXT records.',''];
  const cell=value=>String(value??'').replaceAll('|','\\|').replace(/[\r\n]+/g,' ');
  for (const result of results) {
    lines.push(`## ${result.domain}`,'',`Ownership: ${result.ownership}. Hosting: ${result.hosting}. Certificate: ${result.certificate}.`,'','| Phase | Action | Type | Name | Value |','| --- | --- | --- | --- | --- |');
    for (const record of result.records) lines.push(`| ${[record.phase,record.action,record.type,record.name,record.value].map(cell).join(' | ')} |`);
    if (!result.records.length) lines.push('| — | — | — | No pending records returned | Check Firebase Hosting for current provisioning state |');
    if (result.httpVerification) lines.push('',`HTTP certificate verification alternative: serve the exact value below at \`${cell(result.httpVerification.path)}\` on the current website.`, '', '```text',result.httpVerification.value,'```');
    lines.push('');
  }
  lines.push('Firebase console: https://console.firebase.google.com/project/veteran-career-builder/hosting','');
  return lines.join('\n');
}

if (process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href) {
  try {
    const results=await prepareHostingDomains();
    // The account email is a public IAM principal identifier, not a credential.
    // Print it so the owner can grant the one missing deployment permission.
    const principal=JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT).client_email;
    console.log('HOSTING_DEPLOYMENT_PRINCIPAL '+principal);
    // Only public DNS / certificate verification instructions are emitted. Never
    // log the credential, OAuth assertion/token, or raw authentication responses.
    for (const result of results) console.log('HOSTING_DOMAIN '+JSON.stringify(result));
    const instructions=instructionsForDomains(results);
    if (process.env.GITHUB_STEP_SUMMARY) fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY,`Deployment account: ${principal}\n\n`+instructions);
  } catch (error) { console.error(error.message); process.exitCode=1; }
}
