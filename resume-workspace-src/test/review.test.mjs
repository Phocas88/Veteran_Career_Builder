import test from 'node:test';
import assert from 'node:assert/strict';
import { validateInput, normalizeReview, reviewResume, ReviewError } from '../lib/review.mjs';
import { canApply, applyCorrections, resolveOriginal } from '../public/corrections.js';

const resume = 'ALEX MORGAN\nOperations Coordinator\nMaintained records and was assisting the team with monthly reporting.\nMicrosoft Excel and scheduling.';
const original = 'Maintained records and was assisting the team with monthly reporting.';
const replacement = 'Maintained records and assisted the team with monthly reporting.';
const suggestion = { id: 'one', category: 'Grammar', priority: 'Medium', original, replacement, explanation: 'Use parallel verbs.' };
const review = { score: 75, summary: 'A clear starting point.', strengths: ['Clear work history'], suggestions: [suggestion], nextSteps: ['Add verified details.'] };

test('corrections apply only to one exact occurrence, leaving every other character intact', () => {
  const result = applyCorrections(resume, [suggestion]);
  assert.equal(result.text, resume.replace(original, replacement));
  assert.deepEqual(result.applied, ['one']);
  assert.equal(canApply(`${resume}\n${original}`, original), false);
  assert.equal(canApply(resume, 'maintained records'), false);
  assert.equal(canApply(resume, ''), false);
});

test('substantive quotations resolve PDF wrapping but ambiguous or altered wording is rejected', () => {
  const wrapped = '• Maintained records and\nwas assisting the team with\nmonthly reporting.';
  const quote = 'Maintained records and was assisting the team with monthly reporting.';
  assert.equal(resolveOriginal(wrapped, quote), wrapped.slice(2));
  assert.equal(resolveOriginal(wrapped + '\n' + wrapped, quote), null);
  assert.equal(resolveOriginal(wrapped, quote.replace('records', 'files')), null);
  const normalized = normalizeReview({ ...review, suggestions: [{ ...suggestion, original: quote }] }, wrapped);
  assert.equal(normalized.suggestions[0].original, wrapped.slice(2));
  assert.equal(applyCorrections(wrapped, normalized.suggestions).text, '• ' + replacement);
});

test('government review validates context and returns a usable rewritten draft with fact safeguards', async () => {
  assert.throws(() => validateInput({ resume, applicationType: 'unsupported' }), ReviewError);
  assert.throws(() => validateInput({ resume, additionalDetails: 'x'.repeat(4001) }), ReviewError);
  const proposal = resume + '\nHours per week: 40';
  const result = await reviewResume({ resume, applicationType: 'federal', additionalDetails: 'Operations Coordinator: 40 hours per week.' }, { apiKey: 'test-only', fetcher: async (url, options) => {
    const body = JSON.parse(options.body);
    const request = JSON.parse(body.input);
    assert.equal(request.applicationType, 'federal');
    assert.match(body.instructions, /TWO pages/);
    assert.match(body.instructions, /complete, substantially improved revisedResume/);
    assert.equal(body.text.format.schema.properties.revisedResume.type, 'string');
    return new Response(JSON.stringify({ output: [{ content: [{ type: 'output_text', text: JSON.stringify({ ...review, revisedResume: proposal, rewriteNotes: ['Verify the supplied working hours.'], findings: [{ priority: 'High', title: 'Targeting', evidence: 'No announcement supplied.', action: 'Paste the announcement.' }] }) }] }] }));
  } });
  assert.equal(result.revisedResume, proposal);
  assert.equal(result.findings[0].priority, 'High');
  const unsafe = normalizeReview({ ...review, revisedResume: resume + '\nImproved accuracy by 99.9%.' }, resume);
  assert.equal(unsafe.revisedResume, '');
  assert.match(unsafe.rewriteNotes[0], /withheld/);
});

test('replacement text is literal, including dollar signs and JavaScript replacement patterns', () => {
  const result = applyCorrections('Handled budgets.', [{ id: 'budget', original: 'budgets', replacement: '$& and $100' }]);
  assert.equal(result.text, 'Handled $& and $100.');
});

test('overlapping and stale edits are skipped instead of rewriting the wrong sentence', () => {
  const result = applyCorrections(resume, [suggestion, { ...suggestion, id: 'overlap', original: 'was assisting', replacement: 'supported' }]);
  assert.deepEqual(result.applied, ['one']);
  assert.deepEqual(applyCorrections(result.text, [suggestion]).applied, []);
});

test('normalization rejects nonexistent or ambiguous quotes and duplicate suggestions', () => {
  const result = normalizeReview({ ...review, score: 200, suggestions: [suggestion, suggestion, { ...suggestion, original: 'Invented experience' }, { ...suggestion, category: 'Invalid' }] }, resume);
  assert.equal(result.suggestions.length, 1);
  assert.equal(result.score, 100);
  assert.equal(result.suggestions[0].original, original);
  assert.equal(normalizeReview(review, `${resume}\n${original}`).suggestions.length, 0);
});

test('input limits and types are enforced before external requests', () => {
  assert.throws(() => validateInput({ resume: 'short' }), ReviewError);
  assert.throws(() => validateInput({ resume: 'a'.repeat(20001) }), ReviewError);
  assert.throws(() => validateInput({ resume, jobDescription: 'b'.repeat(8001) }), ReviewError);
  assert.throws(() => validateInput({ resume, role: {} }), ReviewError);
  assert.equal(validateInput({ resume, role: '  Coordinator  ' }).role, 'Coordinator');
});

test('missing credentials produce a clear unavailable response without making an API call', async () => {
  let called = false;
  await assert.rejects(reviewResume({ resume }, { apiKey: '', fetcher: () => { called = true; } }), error => error.status === 503);
  assert.equal(called, false);
});

test('a Responses API result is parsed, validated, and returned without credentials', async () => {
  const result = await reviewResume({ resume, role: 'Coordinator' }, {
    apiKey: 'test-only-not-a-real-key',
    fetcher: async (url, options) => {
      assert.equal(url, 'https://api.openai.com/v1/responses');
      const body = JSON.parse(options.body);
      assert.equal(body.store, false);
      assert.equal(body.model, 'gpt-5.4');
      assert.deepEqual(body.reasoning, {effort:'low'});
      assert.match(body.instructions, /complete military AND civilian background/);
      assert.equal(body.text.format.type, 'json_schema');
      assert.equal(body.text.format.strict, true);
      assert.equal(JSON.parse(body.input).resume, resume);
      return new Response(JSON.stringify({ output: [{ type: 'message', content: [{ type: 'output_text', text: JSON.stringify(review) }] }] }));
    }
  });
  assert.equal(result.score, 75);
  assert.equal(result.suggestions.length, 1);
  assert.equal(JSON.stringify(result).includes('test-only-not-a-real-key'), false);
});

test('refusals, malformed responses, upstream errors, and timeouts do not expose provider contents', async () => {
  const cases = [
    [async () => new Response(JSON.stringify({ output: [{ content: [{ type: 'refusal', refusal: 'no' }] }] })), 502],
    [async () => new Response('not JSON'), 502],
    [async () => new Response('sensitive upstream content', { status: 401 }), 502],
    [async () => new Response('quota details', { status: 429 }), 503],
    [async () => { throw new Error('network failure'); }, 504],
    [async () => new Response(JSON.stringify({ status: 'incomplete', output: [] })), 502]
  ];
  for (const [fetcher, status] of cases) {
    await assert.rejects(reviewResume({ resume }, { apiKey: 'test-only', fetcher }), error => error.status === status && !error.message.includes('sensitive'));
  }
});

test('API credit, spending, usage, and rate limits give distinct safe guidance', async () => {
  const cases = [
    [{ code: 'credit_balance_exhausted', type: 'insufficient_quota' }, /no OpenAI API credits/],
    [{ code: 'organization_spend_limit_exceeded', type: 'insufficient_quota' }, /organization spending limit/],
    [{ code: 'project_spend_limit_exceeded', type: 'insufficient_quota' }, /project spending limit/],
    [{ code: 'organization_usage_limit_exceeded', type: 'insufficient_quota' }, /approved API usage limit/],
    [{ code: 'insufficient_quota' }, /check API billing and limits/],
    [{ code: 'unknown_future_code', type: 'insufficient_quota' }, /check API billing and limits/],
    [{ code: 'rate_limit_exceeded' }, /Wait a minute/],
    [{ code: 'slow_down', type: 'rate_limit_error' }, /Wait a minute/],
    [{ type: 'rate_limit_error' }, /Wait a minute/],
    [{ code: 'unknown_future_code' }, /busy or its usage limit/]
  ];
  for (const [error, expected] of cases) {
    let calls = 0;
    await assert.rejects(reviewResume({ resume }, {
      apiKey: 'test-only',
      fetcher: async () => {
        calls++;
        return new Response(JSON.stringify({ error: { ...error, message: 'sensitive upstream content' } }), { status: 429 });
      }
    }), failure => failure.status === 503 && expected.test(failure.message) && !failure.message.includes('sensitive'));
    assert.equal(calls, 1, 'quota failures must not trigger automatic retries');
  }
});
