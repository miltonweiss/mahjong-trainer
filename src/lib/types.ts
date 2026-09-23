export type Lang = "en" | "de";

export type GroupId =
  | "characters"
  | "dots"
  | "bamboo"
  | "winds"
  | "dragons"
  | "flowers"
  | "seasons"
  | "animals";

export type GroupKind = "suit" | "honor" | "bonus";

/** Per-language name, accepted typed answers and memory hook. */
export interface Localised {
  name: string;
  aliases: string[];
  note: string;
}

export interface TileGroup {
  id: GroupId;
  kind: GroupKind;
  /** Bonus groups are off by default so beginners start with the core 34. */
  defaultEnabled: boolean;
}

export interface Tile {
  id: string;
  group: GroupId;
  /** Chinese name, e.g. 五筒. */
  chinese: string;
  pinyin: string;
  /** 1–9 for suit tiles, undefined for honours and bonus tiles. */
  value?: number;
  /** Copies of this tile in a standard Singapore set. */
  copies: number;
  en: Localised;
  de: Localised;
}

/* ── Sets and hands ────────────────────────────────────────────────────── */

export type SetKind = "pair" | "pung" | "kong" | "chow" | "none";

export interface TileSet {
  kind: SetKind;
  tileIds: string[];
}

/* ── Exercises ─────────────────────────────────────────────────────────── */

export type ExerciseKind =
  | "intro"
  | "tile-to-name"
  | "name-to-tile"
  | "type-answer"
  | "match-pairs"
  | "name-set"
  | "complete-hand";

export interface IntroExercise {
  kind: "intro";
  tileId: string;
}

export interface ChoiceExercise {
  kind: "tile-to-name" | "name-to-tile";
  tileId: string;
  optionIds: string[];
}

export interface TypeExercise {
  kind: "type-answer";
  tileId: string;
}

export interface MatchExercise {
  kind: "match-pairs";
  tileIds: string[];
}

/** Show a group of tiles, pick what kind of set they form. */
export interface NameSetExercise {
  kind: "name-set";
  tileIds: string[];
  answer: SetKind;
  options: SetKind[];
}

/** Show 13 tiles, pick the one that completes the hand. */
export interface CompleteHandExercise {
  kind: "complete-hand";
  handIds: string[];
  answerId: string;
  optionIds: string[];
}

export type Exercise =
  | IntroExercise
  | ChoiceExercise
  | TypeExercise
  | MatchExercise
  | NameSetExercise
  | CompleteHandExercise;

/* ── Path ──────────────────────────────────────────────────────────────── */

export type UnitKind = "tiles" | "hands";

export interface Unit {
  id: string;
  kind: UnitKind;
  /** Tile units belong to a group; hand units are grouped under "hands". */
  group: GroupId | "hands";
  /** Number range for a suit chunk, e.g. [4, 6]. */
  range?: [number, number];
  /** Tiles taught by this unit. Empty for hand units. */
  tileIds: string[];
  /** Which hand exercise this unit drills. */
  handMode?: "sets" | "winning" | "mixed";
  /** True for the recap unit that closes out a group. */
  isReview: boolean;
}

/* ── Progress ──────────────────────────────────────────────────────────── */

export interface TileProgress {
  /** Leitner box, 0 (new/failed) → 5 (mastered). */
  box: number;
  correct: number;
  wrong: number;
  /** ISO timestamp of the last answer. */
  lastSeen: string | null;
  /** ISO timestamp when this tile is next due for review. */
  due: string | null;
  /** Tiles this one has been mistaken for, and how often. */
  confusions?: Record<string, number>;
}

export interface Settings {
  lang: Lang;
  enabledGroups: GroupId[];
  modes: {
    multipleChoice: boolean;
    typed: boolean;
    matching: boolean;
  };
  /** Adds the hand-reading section to the end of the path. */
  handReading: boolean;
  dailyGoal: number;
  showPinyin: boolean;
}

export interface Progress {
  version: 1;
  xp: number;
  streak: {
    current: number;
    longest: number;
    /** Local YYYY-MM-DD of the last day a lesson was finished. */
    lastDay: string | null;
    days: string[];
  };
  dailyXp: { day: string; xp: number };
  tiles: Record<string, TileProgress>;
  completedUnits: string[];
  /** Best score in the 60-second speed drill. */
  bestSpeed: number;
  settings: Settings;
}

export interface LessonResult {
  unitId: string;
  xp: number;
  correct: number;
  total: number;
  seconds: number;
}
