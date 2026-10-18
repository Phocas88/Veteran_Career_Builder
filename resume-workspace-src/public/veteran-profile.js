export const branches = {
  army: { name: 'U.S. Army', code: 'MOS', example: '92Y' },
  navy: { name: 'U.S. Navy', code: 'Rating / NEC', example: 'LS / NEC, if applicable' },
  marines: { name: 'U.S. Marine Corps', code: 'MOS', example: '3043' },
  airforce: { name: 'U.S. Air Force', code: 'AFSC', example: '2S0X1' },
  coastguard: { name: 'U.S. Coast Guard', code: 'Rating', example: 'SK' },
  spaceforce: { name: 'U.S. Space Force', code: 'SFSC / former AFSC', example: 'Your specialty code' }
};
export const components = ['Active duty', 'Reserve', 'National Guard'];
const clean = (value, max = 4000) => typeof value === 'string' ? value.trim().slice(0, max) : '';

export function normalizeProfile(input = {}) {
  return {
    name: clean(input.name, 120), contact: clean(input.contact, 500), summary: clean(input.summary, 1800),
    roles: (Array.isArray(input.roles) ? input.roles : []).slice(0, 12).map(role => ({
      branch: Object.hasOwn(branches, role.branch) ? role.branch : '',
      component: components.includes(role.component) ? role.component : '',
      code: clean(role.code, 80), rank: clean(role.rank, 80), title: clean(role.title, 160),
      organization: clean(role.organization, 200), location: clean(role.location, 160),
      dates: clean(role.dates, 100), hours: clean(role.hours, 30), duties: clean(role.duties, 2400)
    })),
    civilian: clean(input.civilian, 4000), education: clean(input.education, 2000), skills: clean(input.skills, 1800)
  };
}

export function profileToResume(input) {
  const p = normalizeProfile(input);
  const sections = [p.name, p.contact, p.summary && 'PROFESSIONAL SUMMARY\n' + p.summary];
  if (p.roles.some(r => (r.title || r.duties) && !r.branch)) throw new Error('Choose a branch for each service experience.');
  const jobs = p.roles.filter(r => r.title || r.duties).map(r => [
    [r.title, r.dates].filter(Boolean).join(' | '),
    [branches[r.branch]?.name || 'Military service', r.component, r.organization, r.location].filter(Boolean).join(' · '),
    [r.rank && 'Military rank: ' + r.rank, r.code && (branches[r.branch]?.code || 'Specialty code') + ': ' + r.code, r.hours && 'Hours per week: ' + r.hours].filter(Boolean).join(' · '),
    r.duties
  ].filter(Boolean).join('\n'));
  if (jobs.length) sections.push('MILITARY EXPERIENCE\n' + jobs.join('\n\n'));
  if (p.civilian) sections.push('CIVILIAN EXPERIENCE\n' + p.civilian);
  if (p.education) sections.push('EDUCATION & CERTIFICATIONS\n' + p.education);
  if (p.skills) sections.push('SKILLS\n' + p.skills);
  const resume = sections.filter(Boolean).join('\n\n');
  if (!p.name || !p.roles.some(r => r.duties) && !p.civilian) throw new Error('Add your name and actual duties or civilian experience before building your draft.');
  if (resume.length > 20000) throw new Error('Your background is too long. Shorten it to fit the 20,000-character draft limit.');
  return resume;
}

export function profileFromWebsite(data = {}) {
  const p = data.personal || {};
  const findBranch = value => !value ? '' : Object.keys(branches).find(k => (branches[k].name + k).toLowerCase().includes(String(value || '').toLowerCase().replace(/^u\.?s\.?\s*/i, ''))) || '';
  const text = v => typeof v === 'string' ? v : Array.isArray(v) ? v.filter(x => typeof x === 'string').join('\n') : '';
  if (data.resumeWorkspaceProfile) return normalizeProfile(data.resumeWorkspaceProfile);
  return normalizeProfile({ name: p.name, contact: [p.email, p.phone, p.location, p.city, p.state, p.linkedin].filter(x => typeof x === 'string' && x).join(' · '),
    roles: (data.milExperiences || data.experiences || []).map(r => ({ branch: findBranch(r.branch), component: r.component || r.serviceType, code: r.mos || r.afsc || r.rating, rank: r.rank, title: r.dutyTitle || r.jobTitle || r.title || r.mosTitle, organization: r.unit, location: r.location, dates: [r.startDate || r.start, r.current ? 'Present' : r.endDate || r.end].filter(Boolean).join(' – '), hours: r.hours, duties: text(r.duties || r.description || r.achievements) })),
    civilian: (data.civExperiences || []).map(r => [r.jobTitle || r.title, r.employer || r.company, r.dates || [r.startDate, r.current ? 'Present' : r.endDate].filter(Boolean).join(' – '), text(r.duties || r.description)].filter(Boolean).join('\n')).join('\n\n'),
    education: (data.education || []).map(r => [r.degree, r.field, r.institution || r.school, r.status, r.year].filter(Boolean).join(' · ')).join('\n'),
    skills: typeof data.skills === 'string' ? data.skills : Object.values(data.skills || {}).map(text).filter(Boolean).join('\n') });
}
