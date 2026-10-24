export const jobStatuses = ['Saved', 'Preparing', 'Applied', 'Interview', 'Offer', 'Closed'];
const text = (v, max) => typeof v === 'string' ? v.trim().slice(0, max) : '';
export function safeJobUrl(value) {
 const url = text(value, 2000); if (!url) return '';
 try { const parsed = new URL(url); return ['https:','http:'].includes(parsed.protocol) && !parsed.username && !parsed.password ? parsed.href : ''; } catch { return ''; }
}
export function normalizeJob(value = {}) {
 const date = v => /^\d{4}-\d{2}-\d{2}$/.test(v || '') && !Number.isNaN(Date.parse(v)) ? v : '';
 return {role:text(value.role,200),company:text(value.company,200),url:safeJobUrl(value.url),description:text(value.description,8000),
  applicationType:['private','federal','government'].includes(value.applicationType)?value.applicationType:'private',
  status:jobStatuses.includes(value.status)?value.status:'Saved',appliedDate:date(value.appliedDate),interviewDate:date(value.interviewDate),followUpDate:date(value.followUpDate),
  contact:text(value.contact,250),notes:text(value.notes,3000),resumeVersionId:text(value.resumeVersionId,160),resumeVersionLabel:text(value.resumeVersionLabel,200)};
}
export function versionGroups(items) {
 const groups = new Map();
 for (const item of items) { const id = item.familyId || item.id; if (!groups.has(id)) groups.set(id, []); groups.get(id).push(item); }
 return [...groups.values()].map(versions => versions.sort((a,b)=>String(b.createdAt).localeCompare(String(a.createdAt))));
}
export function profileSummary(profile = {}) {
 return [['roles','service experiences'],['jobs','civilian jobs'],['educationEntries','education entries'],['certifications','credentials'],['skillsEntries','skills']]
  .map(([key,label])=>`${(profile[key]||[]).filter(item=>Object.values(item).some(v=>typeof v==='string'&&v.trim())).length} ${label}`).join(' · ');
}
