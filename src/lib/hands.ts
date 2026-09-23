import { TILES, getTile } from "./tiles";
import type { GroupId, SetKind, Tile } from "./types";

/**
 * Hand logic for the reading exercises. Bonus tiles (flowers, seasons,
 * animals) never take part in a hand — they're set aside during play — so the
 * pool here is suits and honours only.
 */

const SUIT_GROUPS: GroupId[] = ["characters", "dots", "bamboo"];
const HAND_GROUPS: GroupId[] = [...SUIT_GROUPS, "winds", "dragons"];

export function isHandTile(tile: Tile): boolean {
  return HAND_GROUPS.includes(tile.group);
}

function isSuitTile(tile: Tile): boolean {
  return SUIT_GROUPS.includes(tile.group);
}

/** Tiles eligible for hand exercises, restricted to the learner's groups. */
export function handPool(enabled: GroupId[]): Tile[] {
  const set = new Set(enabled);
  const scoped = TILES.filter((t) => isHandTile(t) && set.has(t.group));
  // A pool of one or two honour groups can't build hands — fall back to the
  // full suits-and-honours set rather than failing to generate a lesson.
  return scoped.length >= 9 ? scoped : TILES.filter(isHandTile);
}

type Counts = Map<string, number>;

function toCounts(ids: string[]): Counts {
  const counts: Counts = new Map();
  for (const id of ids) counts.set(id, (counts.get(id) ?? 0) + 1);
  return counts;
}

/** Canonical order so decomposition always starts from the same tile. */
const ORDER = new Map(TILES.map((t, i) => [t.id, i]));

function firstRemaining(counts: Counts): string | null {
  let best: string | null = null;
  let bestOrder = Infinity;
  for (const [id, n] of counts) {
    if (n <= 0) continue;
    const order = ORDER.get(id) ?? Infinity;
    if (order < bestOrder) {
      bestOrder = order;
      best = id;
    }
  }
  return best;
}

function chowPartners(id: string): [string, string] | null {
  const tile = getTile(id);
  if (!isSuitTile(tile) || tile.value == null || tile.value > 7) return null;
  return [`${tile.group}-${tile.value + 1}`, `${tile.group}-${tile.value + 2}`];
}

/** Can every remaining tile be used up by pungs and chows? */
function decomposes(counts: Counts): boolean {
  const id = firstRemaining(counts);
  if (id == null) return true;

  const n = counts.get(id) ?? 0;

  if (n >= 3) {
    counts.set(id, n - 3);
    if (decomposes(counts)) {
      counts.set(id, n);
      return true;
    }
    counts.set(id, n);
  }

  const partners = chowPartners(id);
  if (partners) {
    const [b, c] = partners;
    const nb = counts.get(b) ?? 0;
    const nc = counts.get(c) ?? 0;
    if (nb > 0 && nc > 0) {
      counts.set(id, n - 1);
      counts.set(b, nb - 1);
      counts.set(c, nc - 1);
      if (decomposes(counts)) {
        counts.set(id, n);
        counts.set(b, nb);
        counts.set(c, nc);
        return true;
      }
      counts.set(id, n);
      counts.set(b, nb);
      counts.set(c, nc);
    }
  }

  return false;
}

/** Four sets and a pair. Kongs are excluded, so a hand is always 14 tiles. */
export function isWinningHand(ids: string[]): boolean {
  if (ids.length !== 14) return false;
  const counts = toCounts(ids);
  for (const [id, n] of counts) {
    if (n < 2) continue;
    counts.set(id, n - 2);
    const ok = decomposes(counts);
    counts.set(id, n);
    if (ok) return true;
  }
  return false;
}

/** Sorted the way a player holds a hand: suit order, then number. */
export function sortHand(ids: string[]): string[] {
  return [...ids].sort(
    (a, b) => (ORDER.get(a) ?? 0) - (ORDER.get(b) ?? 0),
  );
}

/* ── Generation ────────────────────────────────────────────────────────── */

function pick<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

function shuffled<T>(items: T[]): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** Tracks how many copies of each tile are still available (four of each). */
class Supply {
  private used = new Map<string, number>();

  available(id: string): number {
    return getTile(id).copies - (this.used.get(id) ?? 0);
  }

  take(ids: string[]): void {
    for (const id of ids) this.used.set(id, (this.used.get(id) ?? 0) + 1);
  }
}

function tryChow(pool: Tile[], supply: Supply): string[] | null {
  const starts = pool.filter(
    (t) => isSuitTile(t) && t.value != null && t.value <= 7,
  );
  for (const start of shuffled(starts)) {
    const ids = [
      start.id,
      `${start.group}-${start.value! + 1}`,
      `${start.group}-${start.value! + 2}`,
    ];
    const inPool = ids.every((id) => pool.some((t) => t.id === id));
    if (inPool && ids.every((id) => supply.available(id) >= 1)) return ids;
  }
  return null;
}

function tryPung(pool: Tile[], supply: Supply): string[] | null {
  for (const tile of shuffled(pool)) {
    if (supply.available(tile.id) >= 3) return [tile.id, tile.id, tile.id];
  }
  return null;
}

function tryPair(pool: Tile[], supply: Supply): string[] | null {
  for (const tile of shuffled(pool)) {
    if (supply.available(tile.id) >= 2) return [tile.id, tile.id];
  }
  return null;
}

/**
 * A legal 14-tile winning hand: four sets plus a pair, never more than four
 * copies of any tile. Chows are favoured so hands look like real ones.
 */
export function makeWinningHand(pool: Tile[]): string[] {
  for (let attempt = 0; attempt < 40; attempt++) {
    const supply = new Supply();
    const tiles: string[] = [];
    let ok = true;

    for (let i = 0; i < 4; i++) {
      const preferChow = Math.random() < 0.65;
      const set =
        (preferChow ? tryChow(pool, supply) : tryPung(pool, supply)) ??
        (preferChow ? tryPung(pool, supply) : tryChow(pool, supply));
      if (!set) {
        ok = false;
        break;
      }
      supply.take(set);
      tiles.push(...set);
    }

    if (!ok) continue;
    const pair = tryPair(pool, supply);
    if (!pair) continue;
    supply.take(pair);
    tiles.push(...pair);

    if (isWinningHand(tiles)) return sortHand(tiles);
  }

  // Fallback that is always legal: four pungs and a pair from distinct tiles.
  const distinct = shuffled(pool).slice(0, 5);
  const flat = distinct.flatMap((t, i) =>
    i < 4 ? [t.id, t.id, t.id] : [t.id, t.id],
  );
  return sortHand(flat);
}

export interface CompleteHandPuzzle {
  handIds: string[];
  answerId: string;
  optionIds: string[];
}

/**
 * Thirteen tiles one away from winning, plus three tiles that genuinely do
 * not complete it — each distractor is checked against the hand rather than
 * assumed wrong.
 */
export function makeCompleteHandPuzzle(
  pool: Tile[],
): CompleteHandPuzzle | null {
  for (let attempt = 0; attempt < 30; attempt++) {
    const full = makeWinningHand(pool);
    const removeAt = Math.floor(Math.random() * full.length);
    const answerId = full[removeAt];
    const hand = full.filter((_, i) => i !== removeAt);
    if (hand.length !== 13) continue;

    const distractors: string[] = [];
    for (const tile of shuffled(pool)) {
      if (distractors.length >= 3) break;
      if (tile.id === answerId) continue;
      if (isWinningHand([...hand, tile.id])) continue;
      distractors.push(tile.id);
    }
    if (distractors.length < 3) continue;

    return {
      handIds: sortHand(hand),
      answerId,
      optionIds: shuffled([answerId, ...distractors]),
    };
  }
  return null;
}

export interface NameSetPuzzle {
  tileIds: string[];
  answer: SetKind;
  options: SetKind[];
}

const ALL_KINDS: SetKind[] = ["pair", "pung", "kong", "chow", "none"];

/** Tiles that look like a set but aren't — the useful kind of wrong answer. */
function makeNonSet(pool: Tile[]): string[] | null {
  for (let attempt = 0; attempt < 30; attempt++) {
    const kind = Math.random();
    if (kind < 0.5) {
      // Two of a kind plus a stranger.
      const [a, b] = shuffled(pool);
      if (!a || !b || a.id === b.id) continue;
      return [a.id, a.id, b.id];
    }
    // Three in a suit that don't run consecutively.
    const suited = pool.filter((t) => isSuitTile(t) && t.value != null);
    const group = pick(SUIT_GROUPS.filter((g) => suited.some((t) => t.group === g)));
    const values = shuffled(
      suited.filter((t) => t.group === group).map((t) => t.value!),
    ).slice(0, 3);
    if (values.length < 3) continue;
    const sorted = [...values].sort((a, b) => a - b);
    const consecutive =
      sorted[1] === sorted[0] + 1 && sorted[2] === sorted[1] + 1;
    if (consecutive) continue;
    return sorted.map((v) => `${group}-${v}`);
  }
  return null;
}

export function makeNameSetPuzzle(pool: Tile[]): NameSetPuzzle | null {
  const canChow = pool.some(
    (t) =>
      isSuitTile(t) &&
      t.value != null &&
      t.value <= 7 &&
      pool.some((x) => x.id === `${t.group}-${t.value! + 1}`) &&
      pool.some((x) => x.id === `${t.group}-${t.value! + 2}`),
  );
  const kinds: SetKind[] = canChow
    ? ALL_KINDS
    : ALL_KINDS.filter((k) => k !== "chow");
  const answer = pick(kinds);

  let tileIds: string[] | null = null;
  if (answer === "chow") {
    tileIds = tryChow(pool, new Supply());
  } else if (answer === "none") {
    tileIds = makeNonSet(pool);
  } else {
    const tile = pick(pool);
    const n = answer === "pair" ? 2 : answer === "pung" ? 3 : 4;
    if (tile.copies >= n) tileIds = Array.from({ length: n }, () => tile.id);
  }
  if (!tileIds) return null;

  const others = shuffled(ALL_KINDS.filter((k) => k !== answer)).slice(0, 3);
  return {
    tileIds,
    answer,
    options: shuffled([answer, ...others]),
  };
}
