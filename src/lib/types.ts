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

export interface TileGroup {
  id: GroupId;
  /** Short label used in nav, chips and unit titles. */
  name: string;
  /** One-line explanation shown in Settings. */
  blurb: string;
  kind: GroupKind;
  /** Bonus groups are off by default so beginners start with the core 34. */
  defaultEnabled: boolean;
}

export interface Tile {
  id: string;
  group: GroupId;
  /** Canonical English name, e.g. "5 Dots". */
  name: string;
  /** Other spellings accepted when the learner types an answer. */
  aliases: string[];
  /** Chinese name, e.g. 五筒. */
  chinese: string;
  pinyin: string;
  /** 1–9 for suit tiles, undefined for honors and bonus tiles. */
  value?: number;
  /** Copies of this tile in a standard Singapore set. */
  copies: number;
  /** Mnemonic or fact shown on the intro card and in the glossary. */
  note: string;
}

export type ExerciseKind =
  | "intro"
  | "tile-to-name"
  | "name-to-tile"
  | "type-answer"
  | "match-pairs";

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

export type Exercise =
  | IntroExercise
  | ChoiceExercise
  | TypeExercise
  | MatchExercise;

export interface Unit {
  id: string;
  group: GroupId;
  title: string;
  subtitle: string;
  tileIds: string[];
  /** True for the recap unit that closes out a group. */
  isReview: boolean;
}

export interface TileProgress {
  /** Leitner box, 0 (new/failed) → 5 (mastered). */
  box: number;
  correct: number;
  wrong: number;
  /** ISO timestamp of the last answer. */
  lastSeen: string | null;
  /** ISO timestamp when this tile is next due for review. */
  due: string | null;
}

export interface Settings {
  enabledGroups: GroupId[];
  modes: {
    multipleChoice: boolean;
    typed: boolean;
    matching: boolean;
  };
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
  settings: Settings;
}

export interface LessonResult {
  unitId: string;
  xp: number;
  correct: number;
  total: number;
  seconds: number;
}
