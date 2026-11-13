import { canCompletePractice } from '../practica/state.mjs';

export function decisionIsComplete(testing, options) {
  return options.includes(testing?.verdict) && Boolean(testing?.rationale?.trim());
}

export function hasCurrentPetsReview(testing) {
  return Boolean(testing?.ran && testing.petsReviewVersion === 1 && testing.executedCode === testing.code && testing.code?.trim());
}

export function hasCommunicationAttempt(draft) {
  const testing = draft.testing;
  return Boolean(draft.analysis?.approach?.trim() || testing?.executiveSummary?.trim()
    || testing?.omission?.trim() || testing?.omittedSources?.length
    || testing?.observations?.some(item => item.classification || item.sourceId || item.evidence?.trim()));
}

export function canCompleteChallenge(draft) {
  if (!draft?.started) return false;
  if (draft.kind === 'practice') return canCompletePractice(draft);
  const t = draft.testing;
  if (draft.kind === 'sql') return Boolean(t?.code?.trim() && t.ran && t.auditExecutedCode === t.code
    && decisionIsComplete(t, ['accept', 'modify', 'reject']));
  if (draft.kind === 'general') return Boolean(hasCommunicationAttempt(draft)
    && decisionIsComplete(t, ['accept', 'modify', 'reject_summary']));
  return Boolean(hasCurrentPetsReview(t) && (!t.bankOperations || t.plan?.trim())
    && decisionIsComplete(t, ['approve', 'refactor', 'reject', 'clarify']));
}
