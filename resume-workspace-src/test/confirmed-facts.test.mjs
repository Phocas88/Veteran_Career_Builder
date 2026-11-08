import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeReview} from '../lib/review.mjs';
const resume='APPLICANT B\nArmy | MOS 88M\nDispatched vehicles.\nTrained drivers.\nRecorded vehicle status in GCSS-Army.';
const raw=revisedResume=>({score:70,summary:'Check the supplied facts.',strengths:[],suggestions:[],findings:[],nextSteps:[],revisedResume,rewriteNotes:[]});
test('the local writer withholds the same unconfirmed ERP and reporting claims as the paid service',()=>{
 const result=normalizeReview(raw(resume+'\nImplemented GCSS-Army and prepared weekly vehicle availability reports.'),resume);
 assert.equal(result.revisedResume,'');assert.ok(result.rewriteNotes[0].includes('facts you did not confirm'));
 assert.equal(normalizeReview(raw(resume),resume).revisedResume,resume);
});
test('only an affirmative verified answer authorizes the added weekly report',()=>{
 const claim='Prepared a weekly vehicle availability report for the dispatch team.',question='Did you prepare or export reports?';
 for(const answer of ['',question,question+'\nApplicant’s verified answer: No, I did not prepare reports.'])assert.equal(normalizeReview(raw(resume+'\n'+claim),resume,answer).revisedResume,'');
 const details=question+'\nApplicant’s verified answer: I exported vehicle-status data from GCSS-Army and prepared a weekly availability report for the dispatch team.';
 assert.ok(normalizeReview(raw(resume+'\n'+claim),resume,details).revisedResume.includes(claim));
});
