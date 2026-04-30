/**
 * Snake-draft helpers. `order` is the team-id list for round 1 (positions
 * 1..N). Pick `p` (1-based) maps onto that list, alternating direction every
 * round so the team that picked last in round 1 picks first in round 2.
 */
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

// Sorts teams by their assigned draft_position to get the round-1 order.
export function buildRoundOneOrder(
  teams: Array<{ id: string; draft_position: number | null }>,
): string[] {
  return [...teams]
    .sort((a, b) => (a.draft_position ?? 999) - (b.draft_position ?? 999))
    .map((t) => t.id);
}

export function roundAndIndexInRound(pickNumber: number, teamsPerRound: number) {
  const round = Math.ceil(pickNumber / teamsPerRound);
  const idxInRound = (pickNumber - 1) % teamsPerRound;
  return { round, idxInRound };
}
