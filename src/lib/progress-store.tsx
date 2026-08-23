"use client";

import { useMemo, useSyncExternalStore } from "react";
import { scoreAnswer, tileProgressOf } from "./srs";
import {
  addDailyXp,
  bumpStreak,
  defaultProgress,
  loadProgress,
  saveProgress,
} from "./storage";
import { buildPath } from "./units";
import type { LessonResult, Progress, Settings, Unit } from "./types";

/**
 * localStorage is an external store, so it's read through
 * useSyncExternalStore rather than an effect: the server and the first client
 * render both see `ready: false` with default data, and the real progress
 * arrives once the store hydrates on subscribe.
 */

interface Snapshot {
  progress: Progress;
  ready: boolean;
}

const SERVER_SNAPSHOT: Snapshot = {
  progress: defaultProgress(),
  ready: false,
};

let snapshot: Snapshot = SERVER_SNAPSHOT;
let hydrated = false;
const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

function hydrate() {
  if (hydrated) return;
  hydrated = true;
  snapshot = { progress: loadProgress(), ready: true };
  emit();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  hydrate();
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot() {
  return snapshot;
}

function getServerSnapshot() {
  return SERVER_SNAPSHOT;
}

function update(mutate: (prev: Progress) => Progress) {
  const next = mutate(snapshot.progress);
  snapshot = { progress: next, ready: true };
  saveProgress(next);
  emit();
}

/* ── Actions ───────────────────────────────────────────────────────────── */

export function recordAnswer(tileId: string, correct: boolean) {
  update((prev) => ({
    ...prev,
    tiles: {
      ...prev.tiles,
      [tileId]: scoreAnswer(tileProgressOf(prev.tiles, tileId), correct),
    },
  }));
}

export function finishLesson(result: LessonResult) {
  update((prev) => ({
    ...prev,
    xp: prev.xp + result.xp,
    dailyXp: addDailyXp(prev.dailyXp, result.xp),
    streak: bumpStreak(prev.streak),
    completedUnits:
      result.unitId && !prev.completedUnits.includes(result.unitId)
        ? [...prev.completedUnits, result.unitId]
        : prev.completedUnits,
  }));
}

export function updateSettings(patch: Partial<Settings>) {
  update((prev) => ({ ...prev, settings: { ...prev.settings, ...patch } }));
}

export function resetProgress() {
  update((prev) => ({ ...defaultProgress(), settings: prev.settings }));
}

/* ── Hook ──────────────────────────────────────────────────────────────── */

export interface ProgressStore {
  progress: Progress;
  /** False until localStorage has been read, so the UI can hold its shape. */
  ready: boolean;
  path: Unit[];
  recordAnswer: typeof recordAnswer;
  finishLesson: typeof finishLesson;
  updateSettings: typeof updateSettings;
  resetProgress: typeof resetProgress;
}

export function useProgress(): ProgressStore {
  const { progress, ready } = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );

  const path = useMemo(
    () => buildPath(progress.settings.enabledGroups),
    [progress.settings.enabledGroups],
  );

  // The actions live at module scope, so they're already referentially stable
  // and safe to use as effect dependencies.
  return {
    progress,
    ready,
    path,
    recordAnswer,
    finishLesson,
    updateSettings,
    resetProgress,
  };
}
