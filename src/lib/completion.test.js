import test from 'node:test';
import assert from 'node:assert/strict';
import { canCompleteChallenge } from './completion.js';
import { PROJECTS } from '../data/projects.js';
import { isNewAcceptedSubmission, normalizeProjectWork } from './projects.js';

test('finalization validates current evidence and decision without demanding a perfect score', () => {
  const draft = {kind:'technical', started:true, testing:{code:'code', executedCode:'code',petsReviewVersion:1,ran:true,results:[{passed:false}],verdict:'refactor',rationale:'Resultado incorrecto'}};
  assert.equal(canCompleteChallenge(draft),true);
  for (const patch of [{ran:false},{executedCode:'old'},{petsReviewVersion:undefined},{verdict:'inventado'},{rationale:'  '}]) assert.equal(canCompleteChallenge({...draft,testing:{...draft.testing,...patch}}),false);
  assert.equal(canCompleteChallenge({...draft,started:false}),false);
  assert.equal(canCompleteChallenge({kind:'sql',started:true, investigation:{reviewed:true},testing:{code:'SELECT',auditExecutedCode:'SELECT',ran:true,verdict:'modify',rationale:'Necesito corregir la sintaxis'}}),true);
});

test('accepted identical project submissions do not count again after reload or later revisions', () => {
  const project=PROJECTS[0];
  const work={answers:{0:'respuesta'}, evidence:{}, inventoryCode:''};
  assert.equal(isNewAcceptedSubmission(project,work,{passed:false}),false);
  assert.equal(isNewAcceptedSubmission(project,work,{passed:true}),true);
  const previous={submittedAt:'2026-11-12', submittedAnswers:work.answers,submittedEvidence:{},evaluation:{passed:true,criteria:[]}};
  const restored=normalizeProjectWork({[project.id]:{...work, submissions:[previous]}})[project.id];
  assert.equal(isNewAcceptedSubmission(project,restored,{passed:true}),false);
  assert.equal(isNewAcceptedSubmission(project,{...restored,answers:{0:'Nueva explicación'}},{passed:true}),true);
});

test('communication accepts a partial attempt and requires a decision and justification', () => {
  const draft = {kind:'general', started:true, analysis:{approach:'Mi resumen'},
    testing:{bankMeeting:true, ran:false, verdict:'modify', rationale:'La fecha sigue pendiente.'}};
  assert.equal(canCompleteChallenge(draft), true);
  assert.equal(canCompleteChallenge({...draft, analysis:{approach:''}}), false);
  assert.equal(canCompleteChallenge({...draft, analysis:{approach:''},
    testing:{...draft.testing, observations:[{classification:'supported'}]}}), true);
  assert.equal(canCompleteChallenge({...draft, testing:{...draft.testing, rationale:' '}}), false);
});
