import { canCompletePractice } from '../practica/state.mjs';

export function decisionIsComplete(testing, options) {
  return options.includes(testing?.verdict) && Boolean(testing?.rationale?.trim());
}

export function hasCurrentPetsReview(testing) {
  return Boolean(testing?.ran && testing.petsReviewVersion === 1 && testing.executedCode === testing.code && testing.code?.trim());
}

export function canCompleteChallenge(draft) {
  if (!draft?.started) return false;
  if (draft.kind === 'practice') return canCompletePractice(draft);
  const t = draft.testing;
  if (draft.kind === 'sql') return Boolean(t?.code?.trim() && draft.investigation?.reviewed
    && decisionIsComplete(t, ['accept', 'modify', 'reject']));
  if (draft.kind === 'general') return Boolean(t?.ran && draft.analysis?.approach?.trim() && draft.investigation?.reviewed
    && decisionIsComplete(t, ['accept', 'modify', 'reject_summary']));
  return Boolean(hasCurrentPetsReview(t)
    && decisionIsComplete(t, ['approve', 'refactor', 'reject', 'clarify']));
}
