export const CHALLENGE_VIOLATION_KEY = "worksim-active-challenge-violation-v1";

export function readChallengeViolation(storage = window.localStorage) {
  try {
    const saved = JSON.parse(storage.getItem(CHALLENGE_VIOLATION_KEY) || "null");
    if (typeof saved?.challengeId !== "string" || !Number.isFinite(saved.deadline)) return null;
    return saved;
  } catch {
    return null;
  }
}

export function markChallengeViolation(challengeId, deadline, storage = window.localStorage) {
  try {
    storage.setItem(CHALLENGE_VIOLATION_KEY, JSON.stringify({ challengeId, deadline }));
    return true;
  } catch {
    return false;
  }
}

export function clearChallengeViolation(storage = window.localStorage) {
  try {
    storage.removeItem(CHALLENGE_VIOLATION_KEY);
    return true;
  } catch {
    return false;
  }
}
