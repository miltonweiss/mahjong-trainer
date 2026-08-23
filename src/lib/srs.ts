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
): TileProgress {
  // A miss drops the tile two boxes rather than all the way to zero, so one
  // slip on a well-known tile doesn't undo a week of reviews.
  const box = correct
    ? Math.min(MAX_BOX, prev.box + 1)
    : Math.max(0, prev.box - 2);
  const due = new Date(now.getTime() + BOX_INTERVALS_HOURS[box] * 3600_000);
  return {
    box,
    correct: prev.correct + (correct ? 1 : 0),
    wrong: prev.wrong + (correct ? 0 : 1),
    lastSeen: now.toISOString(),
    due: due.toISOString(),
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
      return (
        new Date(pa.lastSeen!).getTime() - new Date(pb.lastSeen!).getTime()
      );
    });
}
