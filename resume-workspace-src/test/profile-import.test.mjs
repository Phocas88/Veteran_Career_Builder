import test from 'node:test';import assert from 'node:assert/strict';
import {parseProfileResume,mergeProfileSection,matchingEntry} from '../public/profile-import-model.js';
import {normalizeProfile} from '../public/veteran-profile.js';
const resume=`ALEX MORGAN
alex@example.com
(555) 010-1234
Austin, TX
https://linkedin.com/in/alex-example

PROFESSIONAL SUMMARY
Operations professional with verified experience.

MILITARY SERVICE
Transport Supervisor | U.S. Army | Jan 2018 – Present
Unit: Example Command
Rank: SGT
Pay grade: E-5
Full MOS: 88M02
ASI: 8R
SQI: M
• Coordinated verified schedules.

CIVILIAN EXPERIENCE
Operations Analyst | Example Employer | February 2020 – March 2024
Hours per week: 37.5
• Maintained accurate records.

EDUCATION
Bachelor of Science in Information Systems | Example University
Expected 2027

CERTIFICATIONS
Example Credential | Example Institute | Expired

TRAINING
Example Course | Example School | Completed

SKILLS
Excel, Data analysis; Reporting

LANGUAGES
Spanish — Intermediate

PROJECTS & VOLUNTEERING
Community Project | Volunteer Coordinator | Jan 2023 – May 2024
• Organized community deliveries.`;
test('local extraction separates nine sections and preserves exact facts without inventing military levels or credential status',()=>{const {data}=parseProfileResume(resume);assert.equal(data.personal.name,'ALEX MORGAN');assert.equal(data.personal.email,'alex@example.com');assert.equal(data.personal.phone,'(555) 010-1234');assert.equal(data.personal.city,'Austin');assert.equal(data.personal.state,'TX');assert.equal(data.roles[0].branch,'army');assert.equal(data.roles[0].rank,'SGT');assert.equal(data.roles[0].fullCode,'88M02');assert.equal(data.roles[0].skillLevel,undefined);assert.deepEqual(data.roles[0].asi,[{code:'8R'}]);assert.equal(data.jobs[0].jobTitle,'Operations Analyst');assert.equal(data.jobs[0].employer,'Example Employer');assert.equal(data.jobs[0].startDate,'2020-02');assert.equal(data.jobs[0].endDate,'2024-03');assert.equal(data.jobs[0].current,false);assert.equal(data.jobs[0].duties,'Maintained accurate records.');assert.equal(data.educationEntries[0].institution,'Example University');assert.equal(data.educationEntries[0].degree,'Bachelor of Science');assert.equal(data.educationEntries[0].field,'Information Systems');assert.equal(data.educationEntries[0].status,'In progress');assert.equal(data.certifications[0].status,'Expired');assert.equal(data.training[0].status,'Completed');assert.equal(data.skillsEntries.length,3);assert.equal(data.languages[0].speaking,'Intermediate');assert.equal(data.projects[0].name,'Community Project');});
test('selective updates preserve unchecked fields, unrelated entries, nested qualifiers and private profile details',()=>{const existing=normalizeProfile({name:'Original Name',email:'old@example.com',phone:'Keep phone',roles:[{branch:'army',title:'Old title',includeClearance:true,clearanceLevel:'Secret',asi:[{code:'4A',desc:'Previously verified'}]}],jobs:[{jobTitle:'Keep job',employer:'Keep employer'}]});const personal=mergeProfileSection(existing,'personal',[{values:{name:'New Name'}}]);assert.equal(personal.name,'New Name');assert.equal(personal.email,existing.email);assert.equal(personal.phone,existing.phone);assert.deepEqual(personal.jobs,existing.jobs);const next=mergeProfileSection(existing,'roles',[{target:0,values:{title:'Verified new title'},qualifiers:{asi:[{code:'8R'}],sqi:[{code:'M'}]}}]);assert.equal(next.roles[0].includeClearance,true);assert.equal(next.roles[0].clearanceLevel,'Secret');assert.deepEqual(next.roles[0].asi.map(x=>x.code),['4A','8R']);assert.equal(next.roles[0].asi[0].desc,'Previously verified');assert.equal(next.roles[0].sqi[0].code,'M');assert.equal(existing.roles[0].title,'Old title');assert.throws(()=>mergeProfileSection(existing,'roles',[{target:0,values:{branch:'navy'}}]),/another branch/);});
test('year-only dates stay as recorded and ended work never inherits a currently-employed flag',()=>{const {data}=parseProfileResume('EXAMPLE APPLICANT\n\nWORK HISTORY\nCoordinator | Example Company | 2018 – 2022\n• Kept verified records.');assert.equal(data.jobs[0].dates,'2018 – 2022');assert.equal(data.jobs[0].startDate,undefined);assert.equal(data.jobs[0].endDate,undefined);assert.equal(data.jobs[0].current,false);const next=mergeProfileSection({jobs:[{jobTitle:'Coordinator',current:true}]},'jobs',[{target:0,values:data.jobs[0]}]);assert.equal(next.jobs[0].current,false);assert.equal(next.jobs[0].dates,'2018 – 2022');});
test('multiple jobs remain separate, exact matches avoid accidental duplicates, and limits reject rather than cut information',()=>{const {data}=parseProfileResume('EXAMPLE APPLICANT\nWORK EXPERIENCE\nCoordinator | First Employer | Jan 2020 – Jan 2022\n• First duty\n\nAnalyst | Second Employer | Feb 2022 – Present\n• Second duty');assert.equal(data.jobs.length,2);assert.equal(data.jobs[0].employer,'First Employer');assert.equal(data.jobs[1].jobTitle,'Analyst');assert.equal(data.jobs[1].duties,'Second duty');const profile=normalizeProfile({jobs:data.jobs});assert.equal(matchingEntry('jobs',data.jobs[1],profile),1);assert.throws(()=>mergeProfileSection(profile,'jobs',[{target:0,values:{duties:'x'.repeat(2401)}}]),/2400/);assert.throws(()=>mergeProfileSection(profile,'jobs',[{target:5,values:{jobTitle:'Bad target'}}]),/existing entry/);const full=normalizeProfile({skillsEntries:Array.from({length:12},(_,i)=>({name:'Skill '+i}))});assert.throws(()=>mergeProfileSection(full,'skillsEntries',[{target:-1,values:{name:'One too many'}}]),/12 entries/);});
test('unsupported private fields cannot be imported and missing facts stay missing',()=>{const result=parseProfileResume('EXAMPLE APPLICANT\nSSN: 000-00-0000\nDate of birth: 2000-01-01\nCERTIFICATIONS\nExample certificate');assert.equal(result.data.certifications[0].status,undefined);assert.equal(result.data.jobs.length,0);const next=mergeProfileSection({},'personal',[{values:{name:'Example Applicant',ssn:'000-00-0000',clearanceLevel:'Secret'}}]);assert.equal(next.ssn,undefined);assert.equal(next.clearanceLevel,undefined);assert.throws(()=>parseProfileResume('x'.repeat(20001)),/20,000/);assert.throws(()=>mergeProfileSection({},'payments',[]),/section/);});

test('PDF headings keep skills and education out of the summary and remove only matching page labels',()=>{
 const source=`ALEX MORGAN
PROFESSIONAL SUMMARY
Operations professional with experience in
transportation, training and administration.

TECHNICAL AND BUSINESS SKILLS
Software & Development: JavaScript, SQL, GitHub
Analytics & Reporting: Excel, Power BI
Morgan 3/4
PROFESSIONAL EXPERIENCE
Operations supervisor | Example Services | Jan 2020 – Present
• Trained employees on documented
safety and inventory procedures.
• Coordinated schedules for 20 people.
Morgan 4/4
EDUCATION
Bachelor of Science in Business Administration | Example University | 2022
Master of Science in Operations | Example College | Expected 2027
CERTIFICATIONS
OSHA 10/30
`;
 const parsed=parseProfileResume(source);assert.equal(parsed.data.personal.summary,'Operations professional with experience in transportation, training and administration.');assert.ok(parsed.data.skillsEntries.some(e=>e.name.includes('Power BI')));assert.equal(parsed.data.educationEntries.length,2);assert.match(parsed.data.jobs[0].duties,/Trained employees on documented safety and inventory procedures\./);assert.doesNotMatch(JSON.stringify(parsed.data),/Morgan [34]\/4/);assert.equal(parsed.data.certifications[0].name,'OSHA 10/30');
});
