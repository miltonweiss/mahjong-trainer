"use client";

import { useMemo, useState } from "react";
import { Button, ButtonLink } from "@/components/Button";
import { LessonSession } from "@/components/LessonSession";
import { TileCard } from "@/components/TileCard";
import { RepeatIcon } from "@/components/icons";
import { buildPractice } from "@/lib/exercises";
import { useProgress } from "@/lib/progress-store";
import { isDue, masteryOf, reviewQueue, tileProgressOf } from "@/lib/srs";
import { getTile } from "@/lib/tiles";
import type { Exercise } from "@/lib/types";

export default function PracticePage() {
  const { progress, ready, path } = useProgress();
  const [exercises, setExercises] = useState<Exercise[] | null>(null);

  const candidates = useMemo(() => {
    const ids = [...new Set(path.flatMap((u) => u.tileIds))];
    return reviewQueue(progress.tiles, ids);
  }, [path, progress.tiles]);

  const dueNow = useMemo(() => {
    const now = new Date();
    return candidates.filter((id) =>
      isDue(tileProgressOf(progress.tiles, id), now),
    );
  }, [candidates, progress.tiles]);

  if (exercises) {
    return (
      <LessonSession
        exercises={exercises}
        meta={{ title: "Practice", exitHref: "/practice", unitId: "" }}
      />
    );
  }

  const weakest = candidates.slice(0, 6);

  return (
    <div className="flex flex-col gap-5 px-4 pt-5 pb-10">
      <header>
        <h1 className="font-display text-2xl font-semibold">Practice</h1>
        <p className="mt-1 text-[15px] text-ink-muted">
          Tiles come back on a schedule — the shakier the tile, the sooner it
          returns.
        </p>
      </header>

      <section className="rounded-2xl bg-white p-5 shadow-card ring-1 ring-line">
        <div className="flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-full bg-red-50 text-red-600">
            <RepeatIcon className="h-5 w-5" />
          </span>
          <div>
            <p className="numeric font-display text-2xl leading-none font-semibold">
              {ready ? dueNow.length : 0}
            </p>
            <p className="text-[13px] text-ink-muted">due right now</p>
          </div>
          <span className="ml-auto text-right">
            <p className="numeric font-display text-2xl leading-none font-semibold">
              {ready ? candidates.length : 0}
            </p>
            <p className="text-[13px] text-ink-muted">tiles seen</p>
          </span>
        </div>

        {candidates.length === 0 ? (
          <p className="mt-5 text-[14.5px] leading-relaxed text-ink-muted">
            Nothing to review yet. Finish a lesson first and the tiles you meet
            will start showing up here.
          </p>
        ) : (
          <Button
            className="mt-5"
            onClick={() =>
              setExercises(
                buildPractice(candidates, progress.tiles, progress.settings),
              )
            }
          >
            Start review
          </Button>
        )}
        {candidates.length === 0 && (
          <ButtonLink href="/" variant="secondary" className="mt-4">
            Go to lessons
          </ButtonLink>
        )}
      </section>

      {weakest.length > 0 && (
        <section>
          <h2 className="px-1 font-display text-[13px] font-semibold tracking-[0.14em] text-ink-faint uppercase">
            Up next
          </h2>
          <div className="mt-3 grid gap-2">
            {weakest.map((id) => {
              const tile = getTile(id);
              const p = tileProgressOf(progress.tiles, id);
              const pct = Math.round(masteryOf(p) * 100);
              return (
                <div
                  key={id}
                  className="flex items-center gap-3 rounded-2xl bg-white px-3 py-2.5 ring-1 ring-line"
                >
                  <TileCard tile={tile} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="font-display text-[15px] font-medium">
                      {tile.name}
                    </p>
                    <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-bone">
                      <div
                        className="h-full rounded-full bg-jade"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                  <span className="numeric shrink-0 text-[13px] text-ink-muted">
                    {pct}%
                  </span>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
