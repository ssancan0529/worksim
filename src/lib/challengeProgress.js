export function latestCompletedRecord(history, challengeId, ticket) {
  return history.find(record => record.completedAt && (
    record.challengeId === challengeId || (!record.challengeId && record.ticket === ticket)
  ));
}

export function getChallengeProgress(draft, record) {
  return {
    completed: Boolean(draft?.completedAt || record?.completedAt),
    inProgress: Boolean(draft?.started && !draft.completedAt),
  };
}
