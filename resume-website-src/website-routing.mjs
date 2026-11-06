const appHashes=new Set(['home','workspace','settings','calculator','profile','applications','library','versions','match','skills','letter','digital-cv','careers']);
// Returning checkout URLs enter the existing authenticated recovery flow.
export function appDestination(href,installed=false){
 const url=new URL(href),returning=['build','letter'].some(key=>/^[a-f0-9]{64}$/i.test(url.searchParams.get(key)||''));
 if(!installed&&!returning&&!appHashes.has(url.hash.slice(1)))return null;
 return new URL('/app/'+url.search+url.hash,url.origin).href;
}
