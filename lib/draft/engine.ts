// Snake-draft helpers. `order` is the team-id list for round 1 (positions
// 1..N). Pick number `p` (1-based) maps onto that list, reversing direction
// every round.
export function teamIdForPick(
  pickNumber: number,
  teamsPerRound: number,
  round1Order: string[],
): string | null {
  if (teamsPerRound <= 0 || round1Order.length === 0) return null;
  const round = Math.ceil(pickNumber / teamsPerRound);
  const idxInRound = (pickNumber - 1) % teamsPerRound;
  const forward = round % 2 === 1;
  const slot = forward ? idxInRound : teamsPerRound - 1 - idxInRound;
  return round1Order[slot] ?? null;
}

export function buildRoundOneOrder(
  teams: Array<{ id: string; draft_position: number | null }>,
): string[] {
  return [...teams]
    .sort((a, b) => (a.draft_position ?? 999) - (b.draft_position ?? 999))
    .map((t) => t.id);
}
