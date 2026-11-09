const minor=new Set(['a','an','and','as','at','but','by','for','from','in','into','nor','of','on','or','per','the','to','via','with']);
const names={ai:'AI',api:'API',ats:'ATS',cv:'CV',pdf:'PDF',docx:'DOCX',txt:'TXT',csv:'CSV',url:'URL',va:'VA',dod:'DoD',opsec:'OPSEC',mos:'MOS',asi:'ASI',sqi:'SQI',nec:'NEC',afsc:'AFSC',sfsc:'SFSC',pme:'PME',dlpt:'DLPT',linkedin:'LinkedIn',github:'GitHub',usajobs:'USAJOBS'};
// Presentation only: callers pass authored interface labels, never resume text.
export function titleCaseLabel(value){
 const text=String(value??'');if(/[?.!]\s*$/.test(text))return text;
 const tokens=[...text.matchAll(/[A-Za-z0-9]+(?:['’][A-Za-z]+)?/g)];let index=0;
 return text.replace(/[A-Za-z0-9]+(?:['’][A-Za-z]+)?/g,word=>{const n=index++,lower=word.toLowerCase();if(names[lower])return names[lower];if(word===word.toUpperCase()||/[A-Z]/.test(word.slice(1)))return word;if(n>0&&n<tokens.length-1&&minor.has(lower))return lower;return word[0].toUpperCase()+word.slice(1);}).replace(/\bSign in\b/g,'Sign In').replace(/\bSign out\b/g,'Sign Out');
}
