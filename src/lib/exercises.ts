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
 * Three wrong answers that are actually confusable: same suit first (so the
 * learner has to read the number), then the same number in other suits, then
 * anything else that's in play.
 */
export function distractorsFor(
  tile: Tile,
  pool: Tile[],
  count = 3,
): string[] {
  const others = pool.filter((t) => t.id !== tile.id);
  const sameGroup = others.filter((t) => t.group === tile.group);
  const sameValue = others.filter(
    (t) => tile.value != null && t.value === tile.value,
  );
  const rest = others.filter(
    (t) => t.group !== tile.group && t.value !== tile.value,
  );

  const chosen: string[] = [];
  for (const tier of [shuffle(sameGroup), shuffle(sameValue), shuffle(rest)]) {
    for (const candidate of tier) {
      if (chosen.length >= count) break;
      if (!chosen.includes(candidate.id)) chosen.push(candidate.id);
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
): Exercise {
  const tile = getTile(tileId);
  switch (kind) {
    case "intro":
      return { kind: "intro", tileId };
    case "type-answer":
      return { kind: "type-answer", tileId };
    case "match-pairs":
      return { kind: "match-pairs", tileIds: [tileId] };
    default:
      return {
        kind,
        tileId,
        optionIds: shuffle([tileId, ...distractorsFor(tile, pool)]),
      };
  }
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

function buildSession({
  tileIds,
  progress,
  settings,
  length,
  introduceNew,
}: BuildOptions): Exercise[] {
  const pool = tilesInGroups(settings.enabledGroups);
  const lookup = pool.length >= 4 ? pool : TILES;
  const exercises: Exercise[] = [];

  const unseen = introduceNew
    ? tileIds.filter((id) => !progress[id]?.lastSeen)
    : [];

  // Teach first: card, then an immediate easy recognition question.
  for (const id of unseen) {
    exercises.push({ kind: "intro", tileId: id });
    exercises.push(makeExercise(id, "tile-to-name", lookup));
  }

  // Then drill everything in the set until the session is long enough.
  const drill: Exercise[] = [];
  let round = 0;
  while (exercises.length + drill.length < length) {
    const order = shuffle(tileIds);
    for (const id of order) {
      if (exercises.length + drill.length >= length) break;
      const box = tileProgressOf(progress, id).box;
      const kinds = availableKinds(settings, round === 0 ? box : box + 1);
      drill.push(makeExercise(id, pick(kinds), lookup));
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

export function buildLesson(
  unit: Unit,
  progress: Record<string, TileProgress>,
  settings: Settings,
): Exercise[] {
  const newCount = unit.tileIds.filter((id) => !progress[id]?.lastSeen).length;
  const length = unit.isReview
    ? Math.max(12, unit.tileIds.length + 4)
    : unit.tileIds.length * 3 + newCount;
  return buildSession({
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
  return buildSession({
    tileIds: tileIds.slice(0, 8),
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

export function tilesInExercise(exercise: Exercise): string[] {
  return exercise.kind === "match-pairs" ? exercise.tileIds : [exercise.tileId];
}
