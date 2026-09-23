import type { TileProgress } from "./types";

/** Leitner boxes: how long a tile rests before it comes back around. */
export const BOX_INTERVALS_HOURS = [0, 8, 24, 72, 168, 336];
export const MAX_BOX = BOX_INTERVALS_HOURS.length - 1;

export const EMPTY_TILE_PROGRESS: TileProgress = {
  box: 0,
  correct: 0,
  wrong: 0,
  lastSeen: null,
  due: null,
};

export function tileProgressOf(
  tiles: Record<string, TileProgress>,
  id: string,
): TileProgress {
  return tiles[id] ?? EMPTY_TILE_PROGRESS;
}

export function scoreAnswer(
  prev: TileProgress,
  correct: boolean,
  now = new Date(),
  /** What the learner answered instead, when they got it wrong. */
  mistakenFor?: string,
): TileProgress {
  // A miss drops the tile two boxes rather than all the way to zero, so one
  // slip on a well-known tile doesn't undo a week of reviews.
  const box = correct
    ? Math.min(MAX_BOX, prev.box + 1)
    : Math.max(0, prev.box - 2);
  const due = new Date(now.getTime() + BOX_INTERVALS_HOURS[box] * 3600_000);

  let confusions = prev.confusions;
  if (!correct && mistakenFor) {
    confusions = {
      ...prev.confusions,
      [mistakenFor]: (prev.confusions?.[mistakenFor] ?? 0) + 1,
    };
  }

  return {
    box,
    correct: prev.correct + (correct ? 1 : 0),
    wrong: prev.wrong + (correct ? 0 : 1),
    lastSeen: now.toISOString(),
    due: due.toISOString(),
    ...(confusions ? { confusions } : {}),
  };
}

/** 0–1, how well the tile is known. Drives the mastery colours on /stats. */
export function masteryOf(p: TileProgress): number {
  return p.box / MAX_BOX;
}

export function isDue(p: TileProgress, now = new Date()): boolean {
  if (!p.lastSeen) return false;
  if (!p.due) return true;
  return new Date(p.due).getTime() <= now.getTime();
}

/**
 * Practice ordering: overdue tiles first, then weakest, then least recently
 * seen. Tiles never studied are excluded — those belong in lessons.
 */
export function reviewQueue(
  tiles: Record<string, TileProgress>,
  candidateIds: string[],
  now = new Date(),
): string[] {
  return candidateIds
    .filter((id) => tiles[id]?.lastSeen)
    .sort((a, b) => {
      const pa = tileProgressOf(tiles, a);
      const pb = tileProgressOf(tiles, b);
      const dueA = isDue(pa, now) ? 0 : 1;
      const dueB = isDue(pb, now) ? 0 : 1;
      if (dueA !== dueB) return dueA - dueB;
      if (pa.box !== pb.box) return pa.box - pb.box;
      return new Date(pa.lastSeen!).getTime() - new Date(pb.lastSeen!).getTime();
    });
}

export interface ConfusionPair {
  tileId: string;
  mistakenFor: string;
  count: number;
}

/**
 * The tiles a learner keeps reading as each other, worst first. Only pairs
 * seen more than once count — a single slip isn't a pattern.
 */
export function confusionPairs(
  tiles: Record<string, TileProgress>,
  scope: string[],
  minCount = 2,
): ConfusionPair[] {
  const inScope = new Set(scope);
  const pairs: ConfusionPair[] = [];
  for (const [tileId, progress] of Object.entries(tiles)) {
    if (!inScope.has(tileId) || !progress.confusions) continue;
    for (const [mistakenFor, count] of Object.entries(progress.confusions)) {
      if (count < minCount || !inScope.has(mistakenFor)) continue;
      pairs.push({ tileId, mistakenFor, count });
    }
  }
  return pairs.sort((a, b) => b.count - a.count);
}

/** Tiles worth drilling side by side, flattened from the confusion pairs. */
export function confusedTileIds(
  tiles: Record<string, TileProgress>,
  scope: string[],
  minCount = 2,
): string[] {
  const ids: string[] = [];
  for (const pair of confusionPairs(tiles, scope, minCount)) {
    if (!ids.includes(pair.tileId)) ids.push(pair.tileId);
    if (!ids.includes(pair.mistakenFor)) ids.push(pair.mistakenFor);
  }
  return ids;
}
