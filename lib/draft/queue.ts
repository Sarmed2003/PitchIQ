// Per-team pre-pick queue stored in localStorage. Consumed by the
// autopick route when the pick clock expires.

const KEY = (teamId: string) => `pitchiq:draft-queue:${teamId}`;

export function getQueue(teamId: string): number[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY(teamId));
    if (!raw) return [];
    const arr = JSON.parse(raw) as unknown;
    if (Array.isArray(arr)) {
      return arr.filter((x): x is number => typeof x === "number");
    }
    return [];
  } catch {
    return [];
  }
}

export function setQueue(teamId: string, ids: number[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(KEY(teamId), JSON.stringify(ids));
  } catch {
    // Storage may be full or disabled.
  }
}

export function addToQueue(teamId: string, playerId: number): number[] {
  const current = getQueue(teamId);
  if (current.includes(playerId)) return current;
  const next = [...current, playerId];
  setQueue(teamId, next);
  return next;
}

export function removeFromQueue(teamId: string, playerId: number): number[] {
  const current = getQueue(teamId);
  const next = current.filter((id) => id !== playerId);
  setQueue(teamId, next);
  return next;
}

export function moveInQueue(teamId: string, playerId: number, direction: -1 | 1): number[] {
  const current = getQueue(teamId);
  const idx = current.indexOf(playerId);
  if (idx < 0) return current;
  const target = idx + direction;
  if (target < 0 || target >= current.length) return current;
  const next = current.slice();
  [next[idx], next[target]] = [next[target], next[idx]];
  setQueue(teamId, next);
  return next;
}

export function isQueued(teamId: string, playerId: number): boolean {
  return getQueue(teamId).includes(playerId);
}
