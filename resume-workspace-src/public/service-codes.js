// Resolve a known specialty family without interpreting the applicant's grade,
// skill level or qualifiers. The full recorded code remains a separate fact.
export function findSpecialty(catalog,value,branch){
 const code=String(value||'').trim().toUpperCase();
 const exact=catalog?.specialties?.find(s=>s.code.toUpperCase()===code);if(exact)return exact;
 if(branch!=='army'||!/^\d{2}[A-Z][A-Z0-9]{1,6}$/.test(code))return null;
 return catalog?.specialties?.find(s=>s.code.toUpperCase()===code.slice(0,3))||null;
}
export function fullCodeMatchesBase(full,base){
 const a=String(full||'').trim().toUpperCase(),b=String(base||'').trim().toUpperCase();
 return !a||!b||a===b||a.startsWith(b);
}
