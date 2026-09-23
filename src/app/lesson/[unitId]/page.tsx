"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ButtonLink } from "@/components/Button";
import { LessonSession } from "@/components/LessonSession";
import { buildLesson } from "@/lib/exercises";
import { useProgress } from "@/lib/progress-store";
import { findUnit } from "@/lib/units";
import type { Exercise } from "@/lib/types";

export default function LessonPage() {
  const params = useParams<{ unitId: string }>();
  const unitId = params.unitId;
  const { progress, ready, path } = useProgress();
  const [exercises, setExercises] = useState<Exercise[] | null>(null);

  const unit = findUnit(path, unitId);

  // Built once after mount: the exercise order is random, so generating it
  // during render would desync the server and client markup. This is the
  // client-only-initialisation case the set-state-in-effect rule can't see.
  useEffect(() => {
    if (!ready || !unit || exercises) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setExercises(buildLesson(unit, progress.tiles, progress.settings));
  }, [ready, unit, exercises, progress.tiles, progress.settings]);

  if (ready && !unit) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-4 px-6 text-center">
        <h1 className="font-display text-2xl font-semibold">Lesson not found</h1>
        <p className="max-w-xs text-[15px] text-ink-muted">
          This set isn&apos;t part of your path — check which tile groups are
          switched on in Settings.
        </p>
        <ButtonLink href="/" className="mt-2">
          Back to path
        </ButtonLink>
      </div>
    );
  }

  if (!exercises || !unit) {
    return (
      <div className="grid min-h-dvh place-items-center">
        <span className="h-8 w-8 animate-spin rounded-full border-[3px] border-line border-t-red-600" />
      </div>
    );
  }

  return (
    <LessonSession
      exercises={exercises}
      meta={{ exitHref: "/", unitId: unit.id }}
    />
  );
}
