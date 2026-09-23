import {
  handPool,
  makeCompleteHandPuzzle,
  makeNameSetPuzzle,
} from "./hands";
import { TILES, getTile, tilesInGroups } from "./tiles";
import { tileProgressOf } from "./srs";
import type {
  Exercise,
  ExerciseKind,
  Settings,
  Tile,
  TileProgress,
  Unit,
} from "./types";

export function shuffle<T>(items: T[]): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

function pick<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

/**
 * Three wrong answers that are actually confusable. Tiles this learner has
 * already mistaken this one for come first — that's the discrimination they
 * need practice on — then same suit, then the same number in other suits.
 */
export function distractorsFor(
  tile: Tile,
  pool: Tile[],
  count = 3,
  progress?: TileProgress,
): string[] {
  const others = pool.filter((t) => t.id !== tile.id);
  const inPool = new Set(others.map((t) => t.id));

  const confused = Object.entries(progress?.confusions ?? {})
    .filter(([id]) => inPool.has(id))
    .sort((a, b) => b[1] - a[1])
    .map(([id]) => id);

  const sameGroup = others.filter((t) => t.group === tile.group);
  const sameValue = others.filter(
    (t) => tile.value != null && t.value === tile.value,
  );
  const rest = others.filter(
    (t) => t.group !== tile.group && t.value !== tile.value,
  );

  const chosen: string[] = [];
  const tiers = [
    confused,
    shuffle(sameGroup).map((t) => t.id),
    shuffle(sameValue).map((t) => t.id),
    shuffle(rest).map((t) => t.id),
  ];
  for (const tier of tiers) {
    for (const id of tier) {
      if (chosen.length >= count) break;
      if (!chosen.includes(id)) chosen.push(id);
    }
  }
  // Very small pools (e.g. Dragons alone) can't fill four options — fall back
  // to the whole tile set so the question still has plausible choices.
  if (chosen.length < count) {
    for (const candidate of shuffle(TILES)) {
      if (chosen.length >= count) break;
      if (candidate.id !== tile.id && !chosen.includes(candidate.id)) {
        chosen.push(candidate.id);
      }
    }
  }
  return chosen.slice(0, count);
}

function availableKinds(settings: Settings, box: number): ExerciseKind[] {
  const kinds: ExerciseKind[] = [];
  if (settings.modes.multipleChoice) {
    kinds.push("tile-to-name", "name-to-tile");
  }
  // Typing is only asked once the tile has been recognised at least once,
  // otherwise the first encounter is an unfair blank page.
  if (settings.modes.typed && box >= 1) kinds.push("type-answer");
  if (kinds.length === 0) kinds.push("tile-to-name");
  return kinds;
}

function makeExercise(
  tileId: string,
  kind: ExerciseKind,
  pool: Tile[],
  progress: Record<string, TileProgress>,
): Exercise {
  const tile = getTile(tileId);
  if (kind === "type-answer") return { kind: "type-answer", tileId };
  const choiceKind = kind === "name-to-tile" ? "name-to-tile" : "tile-to-name";
  return {
    kind: choiceKind,
    tileId,
    optionIds: shuffle([
      tileId,
      ...distractorsFor(tile, pool, 3, tileProgressOf(progress, tileId)),
    ]),
  };
}

interface BuildOptions {
  tileIds: string[];
  progress: Record<string, TileProgress>;
  settings: Settings;
  /** Roughly how many questions the session should contain. */
  length: number;
  /** Introduce unseen tiles with a teaching card first. */
  introduceNew: boolean;
}

function buildTileSession({
  tileIds,
  progress,
  settings,
  length,
  introduceNew,
}: BuildOptions): Exercise[] {
  const scoped = tilesInGroups(settings.enabledGroups);
  const pool = scoped.length >= 4 ? scoped : TILES;
  const exercises: Exercise[] = [];

  const unseen = introduceNew
    ? tileIds.filter((id) => !progress[id]?.lastSeen)
    : [];

  // Teach first: card, then an immediate easy recognition question.
  for (const id of unseen) {
    exercises.push({ kind: "intro", tileId: id });
    exercises.push(makeExercise(id, "tile-to-name", pool, progress));
  }

  // Then drill everything in the set until the session is long enough.
  const drill: Exercise[] = [];
  let round = 0;
  while (exercises.length + drill.length < length) {
    for (const id of shuffle(tileIds)) {
      if (exercises.length + drill.length >= length) break;
      const box = tileProgressOf(progress, id).box;
      const kinds = availableKinds(settings, round === 0 ? box : box + 1);
      drill.push(makeExercise(id, pick(kinds), pool, progress));
    }
    round += 1;
    if (round > 6) break;
  }
  exercises.push(...drill);

  // One matching round in the middle, where it breaks up the rhythm.
  if (settings.modes.matching && tileIds.length >= 4) {
    const matchTiles = shuffle(tileIds).slice(0, 4);
    const at = Math.min(
      exercises.length,
      unseen.length * 2 + Math.floor((exercises.length - unseen.length * 2) / 2),
    );
    exercises.splice(at, 0, { kind: "match-pairs", tileIds: matchTiles });
  }

  return exercises;
}

/* ── Hand reading ──────────────────────────────────────────────────────── */

function buildHandSession(
  mode: NonNullable<Unit["handMode"]>,
  settings: Settings,
  length: number,
): Exercise[] {
  const pool = handPool(settings.enabledGroups);
  const exercises: Exercise[] = [];
  let guard = 0;

  while (exercises.length < length && guard < length * 6) {
    guard += 1;
    const wantSets =
      mode === "sets" || (mode === "mixed" && Math.random() < 0.55);

    if (wantSets) {
      const puzzle = makeNameSetPuzzle(pool);
      if (puzzle) {
        exercises.push({
          kind: "name-set",
          tileIds: puzzle.tileIds,
          answer: puzzle.answer,
          options: puzzle.options,
        });
      }
      continue;
    }

    const puzzle = makeCompleteHandPuzzle(pool);
    if (puzzle) {
      exercises.push({
        kind: "complete-hand",
        handIds: puzzle.handIds,
        answerId: puzzle.answerId,
        optionIds: puzzle.optionIds,
      });
    }
  }

  return exercises;
}

/* ── Public builders ───────────────────────────────────────────────────── */

export function buildLesson(
  unit: Unit,
  progress: Record<string, TileProgress>,
  settings: Settings,
): Exercise[] {
  if (unit.kind === "hands") {
    const length = unit.handMode === "winning" ? 8 : 10;
    return buildHandSession(unit.handMode ?? "mixed", settings, length);
  }

  const newCount = unit.tileIds.filter((id) => !progress[id]?.lastSeen).length;
  const length = unit.isReview
    ? Math.max(12, unit.tileIds.length + 4)
    : unit.tileIds.length * 3 + newCount;
  return buildTileSession({
    tileIds: unit.tileIds,
    progress,
    settings,
    length,
    introduceNew: true,
  });
}

export function buildPractice(
  tileIds: string[],
  progress: Record<string, TileProgress>,
  settings: Settings,
  length = 12,
): Exercise[] {
  return buildTileSession({
    tileIds: tileIds.slice(0, 8),
    progress,
    settings,
    length,
    introduceNew: false,
  });
}

/**
 * A drill built only from tiles the learner mixes up, with the confusable
 * partner always present as an option so the two must be told apart.
 */
export function buildConfusionDrill(
  tileIds: string[],
  progress: Record<string, TileProgress>,
  settings: Settings,
  length = 10,
): Exercise[] {
  return buildTileSession({
    tileIds: tileIds.slice(0, 6),
    progress,
    settings,
    length,
    introduceNew: false,
  });
}

/** Questions that score a tile; intro cards don't count towards accuracy. */
export function isScored(exercise: Exercise): boolean {
  return exercise.kind !== "intro";
}
