import { TILE_GROUPS } from "./tiles";
import type { GroupId, Progress, Settings } from "./types";

export const STORAGE_KEY = "mahjong-trainer:v1";

export const DEFAULT_SETTINGS: Settings = {
  enabledGroups: TILE_GROUPS.filter((g) => g.defaultEnabled).map((g) => g.id),
  modes: { multipleChoice: true, typed: true, matching: true },
  dailyGoal: 40,
  showPinyin: true,
};

export function defaultProgress(): Progress {
  return {
    version: 1,
    xp: 0,
    streak: { current: 0, longest: 0, lastDay: null, days: [] },
    dailyXp: { day: todayKey(), xp: 0 },
    tiles: {},
    completedUnits: [],
    settings: DEFAULT_SETTINGS,
  };
}

/** Local calendar day, not UTC — a streak should follow the learner's clock. */
export function todayKey(date = new Date()): string {
  const y = date.getFullYear();
  const m = `${date.getMonth() + 1}`.padStart(2, "0");
  const d = `${date.getDate()}`.padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function dayKeyOffset(days: number, from = new Date()): string {
  const d = new Date(from);
  d.setDate(d.getDate() + days);
  return todayKey(d);
}

export function loadProgress(): Progress {
  if (typeof window === "undefined") return defaultProgress();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultProgress();
    const parsed = JSON.parse(raw) as Partial<Progress>;
    if (parsed.version !== 1) return defaultProgress();
    const base = defaultProgress();
    return {
      ...base,
      ...parsed,
      streak: { ...base.streak, ...parsed.streak },
      dailyXp: { ...base.dailyXp, ...parsed.dailyXp },
      tiles: parsed.tiles ?? {},
      completedUnits: parsed.completedUnits ?? [],
      settings: {
        ...base.settings,
        ...parsed.settings,
        modes: { ...base.settings.modes, ...parsed.settings?.modes },
        enabledGroups:
          parsed.settings?.enabledGroups ?? base.settings.enabledGroups,
      },
    };
  } catch {
    return defaultProgress();
  }
}

export function saveProgress(progress: Progress): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch {
    // Storage full or blocked (private mode) — the session still works, it
    // just won't survive a reload.
  }
}

/** Roll the streak forward for a day on which the learner finished a lesson. */
export function bumpStreak(
  streak: Progress["streak"],
  day = todayKey(),
): Progress["streak"] {
  if (streak.lastDay === day) return streak;
  const yesterday = dayKeyOffset(-1);
  const current = streak.lastDay === yesterday ? streak.current + 1 : 1;
  return {
    current,
    longest: Math.max(streak.longest, current),
    lastDay: day,
    days: streak.days.includes(day) ? streak.days : [...streak.days, day],
  };
}

export function addDailyXp(
  dailyXp: Progress["dailyXp"],
  amount: number,
  day = todayKey(),
): Progress["dailyXp"] {
  return dailyXp.day === day
    ? { day, xp: dailyXp.xp + amount }
    : { day, xp: amount };
}

export function toggleGroup(
  enabled: GroupId[],
  group: GroupId,
  on: boolean,
): GroupId[] {
  const next = on
    ? [...new Set([...enabled, group])]
    : enabled.filter((g) => g !== group);
  // Never leave the learner with nothing to train.
  return next.length > 0 ? next : enabled;
}
