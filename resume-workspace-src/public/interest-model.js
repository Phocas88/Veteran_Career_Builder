import {catalog,previousCareerIds} from './career-data.js?v=20261027-career-fields';
export const areas=[{key:'R',name:'Hands-on',description:'Working with tools, equipment, the outdoors, or practical tasks.'},{key:'I',name:'Investigating',description:'Understanding problems, analyzing information, and testing ideas.'},{key:'A',name:'Creating',description:'Designing, writing, making, or finding original ways to communicate.'},{key:'S',name:'Helping',description:'Teaching, supporting, caring for, and working directly with people.'},{key:'E',name:'Leading & influencing',description:'Organizing people, presenting ideas, negotiating, or making decisions.'},{key:'C',name:'Organizing',description:'Keeping records, following processes, and making information accurate.'}];
// VCP Next Mission, question set 2. These original civilian scenarios ask about
// preferred future work, without assuming a branch, combat role or prior rank.
export const interestVersion=2;
export const interestQuestionSet='vcp-next-mission-2';
const activities={
 R:[
  'A community center receives donated equipment. Would you enjoy finding out what still works and getting it ready to use?',
  'A delivery team needs a safer loading area. Would you enjoy measuring the space and helping set it up?',
  'A local organization maintains outdoor sites. Would you enjoy a workday visiting locations and fixing practical problems?',
  'A workshop has a new machine. Would you enjoy learning its controls and practicing until you can operate it reliably?',
  'An event team has a hands-on task with a visible result. Would you choose assembling and checking the equipment?'
 ],
 I:[
  'A delivery delay keeps returning despite quick fixes. Would you enjoy comparing the records to find the underlying cause?',
  'A small business has more data than answers. Would you enjoy turning it into a useful explanation for a decision?',
  'Two teams disagree about why a system failed. Would you enjoy designing a fair way to test both explanations?',
  'You are learning a civilian field with unfamiliar terms. Would you enjoy investigating how its systems fit together?',
  'A team wants to try a different work process. Would you enjoy choosing what to measure and judging whether it helped?'
 ],
 A:[
  'A veterans group wants to explain a complicated service. Would you enjoy creating a clear visual story for its audience?',
  'A business needs to show what makes its work useful. Would you enjoy shaping the message in your own words?',
  'A training team has ordinary footage and a useful story. Would you enjoy editing it into something people want to watch?',
  'A familiar approach is not reaching people. Would you enjoy sketching several fresh ways to present the idea?',
  'A website feels confusing to first-time visitors. Would you enjoy rethinking its layout and trying different designs?'
 ],
 S:[
  'Someone is starting a civilian job after years in another setting. Would you enjoy helping them practice the unfamiliar parts?',
  'A neighbor is unsure which local service can help. Would you enjoy listening and working through the available options together?',
  'A coworker understands the instructions but lacks confidence. Would you enjoy coaching them patiently through a first attempt?',
  'A community group needs practical safety skills. Would you enjoy helping people practice and checking their understanding?',
  'A learner has several possible next steps. Would you enjoy helping them compare choices without deciding for them?'
 ],
 E:[
  'A team has a useful idea but no shared plan. Would you enjoy bringing people together and getting the next steps agreed?',
  'An important deadline is approaching. Would you enjoy balancing responsibilities and keeping the team moving?',
  'A supplier and customer have conflicting priorities. Would you enjoy finding a workable agreement between them?',
  'A new service has few customers. Would you enjoy talking with people, explaining its value, and asking for their business?',
  'Several partners need to make a decision. Would you enjoy leading the discussion and taking responsibility for follow-through?'
 ],
 C:[
  'A new employee cannot find the information they need. Would you enjoy building a clear way to organize and retrieve it?',
  'A pay or invoice total looks wrong. Would you enjoy tracing the records until every difference is explained?',
  'Several teams share equipment and deadlines. Would you enjoy creating a dependable schedule everyone can follow?',
  'A supply handover has gaps in its records. Would you enjoy reconciling what is on hand with what was documented?',
  'A service works best when details are consistent. Would you enjoy checking the final records before they are passed on?'
 ]};
export const nextSteps={
 R:'Try a supervised workshop, site visit, or introductory trade class. Compare civilian training requirements with the equipment work you actually performed.',
 I:'Choose a small data or troubleshooting problem and write a one-page explanation of your method and result. Use it as a civilian work sample.',
 A:'Make a short portfolio sample: a training guide, visual explanation, edited video, or redesigned page. Explain who it helps and why.',
 S:'Try mentoring, a community workshop, or a supervised volunteer shift. Notice which kinds of support leave you wanting to do more.',
 E:'Coordinate a small event or project and record the goal, decisions, and outcome. Use your real contribution when describing leadership to employers.',
 C:'Create a sample schedule, inventory tracker, or records checklist using fictional data. Practice explaining how it prevents errors or saves time.'
};
export const questions=Array.from({length:5},(_,index)=>areas.map(area=>({id:area.key+index,area:area.key,text:activities[area.key][index]}))).flat();
export const ratings=['Strongly dislike','Dislike','Unsure / neutral','Like','Strongly like'];
export function normalizeAnswers(value){return Array.from({length:30},(_,i)=>Number.isInteger(value?.[i])&&value[i]>=0&&value[i]<=4?value[i]:null);}
export function scoreAssessment(value){const answers=normalizeAnswers(value);if(answers.some(x=>x===null))throw new Error('Answer all 30 activities to see your interest results.');const scores=Object.fromEntries(areas.map(area=>[area.key,0]));questions.forEach((q,i)=>scores[q.area]+=answers[i]);const sorted=areas.map(area=>({...area,score:scores[area.key]})).sort((a,b)=>b.score-a.score||areas.indexOf(areas.find(x=>x.key===a.key))-areas.indexOf(areas.find(x=>x.key===b.key)));return {scores,areas:sorted,flat:sorted[0].score===sorted.at(-1).score,low:sorted[0].score<=5};}
export function interestCareers(value,{preparation=0,limit=catalog.occupations.length}={}){const result=scoreAssessment(value);if(result.flat||result.low)return [];return catalog.occupations.filter(o=>!preparation||o.preparation<=preparation).map(o=>({...o,affinity:[...o.interests].reduce((sum,key,index)=>sum+result.scores[key]*(index===0?2:1),0)})).filter(o=>o.affinity>0).sort((a,b)=>b.affinity-a.affinity||a.title.localeCompare(b.title)).slice(0,limit);}
export const occupation=code=>catalog.occupations.find(o=>o.code===(previousCareerIds[code]||code));
export const occupationLink=code=>occupation(code)?'https://www.indeed.com/jobs?q='+encodeURIComponent(occupation(code).title):'';
export function validResumeMatches(values){return (Array.isArray(values)?values:[]).filter(m=>m&&occupation(m.code)&&typeof m.evidence==='string'&&typeof m.reason==='string'&&typeof m.checkNext==='string').slice(0,24).map(m=>({...m,code:occupation(m.code).code}));}

export const careerCategories=catalog.categories;
export const careerCatalogSize=catalog.occupations.length;
export function groupCareers(values,{search=''}={}){
 const term=String(search).trim().toLocaleLowerCase(),groups=new Map();
 for(const value of values){
  const role=occupation(value.code);if(!role)continue;
  const category=careerCategories.find(c=>c.key===role.category);if(!category)continue;
  if(term&&![role.title,role.description,category.name].join(' ').toLocaleLowerCase().includes(term))continue;
  if(!groups.has(category.key))groups.set(category.key,{...category,items:[]});
  if(!groups.get(category.key).items.some(item=>item.code===role.code))groups.get(category.key).items.push({...value,code:role.code});
 }
 return [...groups.values()];
}

export function interestActions(value){
 const result=scoreAssessment(value);if(result.flat||result.low)return [];
 return result.areas.filter(area=>area.score>5).slice(0,2).map(area=>({...area,nextStep:nextSteps[area.key]}));
}
