"use client";

import { useMemo, useState } from "react";
import { TileCard } from "@/components/TileCard";
import { BoltIcon, FlameIcon, StarIcon, TargetIcon } from "@/components/icons";
import { useProgress } from "@/lib/progress-store";
import { MAX_BOX, masteryOf, tileProgressOf } from "@/lib/srs";
import { GROUP_BY_ID, getTile, tilesInGroup } from "@/lib/tiles";
import { todayKey } from "@/lib/storage";
import type { GroupId } from "@/lib/types";

const WEEKDAYS = ["M", "T", "W", "T", "F", "S", "S"];

export default function StatsPage() {
  const { progress, ready, path } = useProgress();
  const [month, setMonth] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });

  const pathTiles = useMemo(
    () => [...new Set(path.flatMap((u) => u.tileIds))],
    [path],
  );

  const { mastered, accuracy, seen } = useMemo(() => {
    let correct = 0;
    let wrong = 0;
    let masteredCount = 0;
    let seenCount = 0;
    for (const id of pathTiles) {
      const p = tileProgressOf(progress.tiles, id);
      correct += p.correct;
      wrong += p.wrong;
      if (p.lastSeen) seenCount += 1;
      if (p.box >= MAX_BOX) masteredCount += 1;
    }
    const total = correct + wrong;
    return {
      mastered: masteredCount,
      seen: seenCount,
      accuracy: total > 0 ? Math.round((correct / total) * 100) : null,
    };
  }, [pathTiles, progress.tiles]);

  const groupsInPath = useMemo(
    () => [...new Set(path.map((u) => u.group))] as GroupId[],
    [path],
  );

  return (
    <div className="flex flex-col gap-5 px-4 pt-5 pb-10">
      <header>
        <h1 className="font-display text-2xl font-semibold">Stats</h1>
        <p className="mt-1 text-[15px] text-ink-muted">
          {ready ? seen : 0} of {pathTiles.length} tiles in your path have been
          studied.
        </p>
      </header>

      <div className="grid grid-cols-2 gap-3">
        <StatTile
          icon={<FlameIcon className="h-4 w-4 text-gold" />}
          value={ready ? progress.streak.current : 0}
          label="Day streak"
        />
        <StatTile
          icon={<StarIcon className="h-4 w-4 text-gold" />}
          value={ready ? progress.streak.longest : 0}
          label="Best streak"
        />
        <StatTile
          icon={<BoltIcon className="h-4 w-4 text-red-600" />}
          value={ready ? progress.xp : 0}
          label="Total XP"
        />
        <StatTile
          icon={<TargetIcon className="h-4 w-4 text-jade" />}
          value={accuracy == null ? "—" : `${accuracy}%`}
          label="Accuracy"
        />
      </div>

      <section className="rounded-2xl bg-white p-5 shadow-card ring-1 ring-line">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-base font-semibold">
            {month.toLocaleDateString("en-GB", {
              month: "long",
              year: "numeric",
            })}
          </h2>
          <div className="flex gap-1">
            <MonthButton
              label="Previous month"
              onClick={() =>
                setMonth((m) => new Date(m.getFullYear(), m.getMonth() - 1, 1))
              }
              glyph="‹"
            />
            <MonthButton
              label="Next month"
              onClick={() =>
                setMonth((m) => new Date(m.getFullYear(), m.getMonth() + 1, 1))
              }
              glyph="›"
            />
          </div>
        </div>
        <StreakCalendar month={month} days={progress.streak.days} />
        <p className="mt-4 text-[13px] text-ink-muted">
          {progress.streak.days.length} practice{" "}
          {progress.streak.days.length === 1 ? "day" : "days"} logged in total.
        </p>
      </section>

      <section>
        <h2 className="px-1 font-display text-[13px] font-semibold tracking-[0.14em] text-ink-faint uppercase">
          Mastery
        </h2>
        <p className="mt-1.5 px-1 text-[13px] text-ink-muted">
          {mastered} tiles fully mastered. Darker means stronger.
        </p>
        <div className="mt-3 flex flex-col gap-4">
          {groupsInPath.map((group) => (
            <div key={group}>
              <p className="mb-2 px-1 font-display text-[14px] font-medium">
                {GROUP_BY_ID[group].name}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {tilesInGroup(group).map((tile) => {
                  const p = tileProgressOf(progress.tiles, tile.id);
                  const m = masteryOf(p);
                  return (
                    <span
                      key={tile.id}
                      title={`${tile.name} — box ${p.box}/${MAX_BOX}`}
                      className="grid h-9 w-9 place-items-center rounded-lg text-[10px] font-medium ring-1 ring-inset ring-line"
                      style={{
                        backgroundColor:
                          m === 0
                            ? "var(--color-bone)"
                            : `color-mix(in oklab, var(--color-jade) ${Math.round(
                                m * 100,
                              )}%, white)`,
                        color: m > 0.55 ? "white" : "var(--color-ink-faint)",
                      }}
                    >
                      {tile.value ?? tile.name.slice(0, 1)}
                    </span>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </section>

      <WeakestTiles />
    </div>
  );
}

function StatTile({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode;
  value: number | string;
  label: string;
}) {
  return (
    <div className="rounded-2xl bg-white p-4 ring-1 ring-line">
      <span className="flex items-center gap-1.5 text-[12px] tracking-wide text-ink-faint uppercase">
        {icon}
        {label}
      </span>
      <p className="numeric mt-2 text-2xl font-semibold">{value}</p>
    </div>
  );
}

function MonthButton({
  label,
  glyph,
  onClick,
}: {
  label: string;
  glyph: string;
  onClick: () => void;
}) {
  return (
    <button
      aria-label={label}
      onClick={onClick}
      className="press grid h-8 w-8 place-items-center rounded-full text-lg text-ink-muted ring-1 ring-line hover:bg-surface"
    >
      {glyph}
    </button>
  );
}

function StreakCalendar({ month, days }: { month: Date; days: string[] }) {
  const active = new Set(days);
  const today = todayKey();
  const year = month.getFullYear();
  const m = month.getMonth();
  const first = new Date(year, m, 1);
  const daysInMonth = new Date(year, m + 1, 0).getDate();
  // Monday-first grid.
  const lead = (first.getDay() + 6) % 7;

  return (
    <div className="mt-4">
      <div className="grid grid-cols-7 gap-1 text-center">
        {WEEKDAYS.map((d, i) => (
          <span key={i} className="text-[11px] text-ink-faint">
            {d}
          </span>
        ))}
      </div>
      <div className="mt-1.5 grid grid-cols-7 gap-1">
        {Array.from({ length: lead }, (_, i) => (
          <span key={`lead-${i}`} />
        ))}
        {Array.from({ length: daysInMonth }, (_, i) => {
          const day = i + 1;
          const key = `${year}-${`${m + 1}`.padStart(2, "0")}-${`${day}`.padStart(2, "0")}`;
          const on = active.has(key);
          const isToday = key === today;
          return (
            <span
              key={key}
              className={`numeric grid aspect-square place-items-center rounded-full text-[12.5px] ${
                on
                  ? "bg-red-600 font-semibold text-white"
                  : isToday
                    ? "text-ink ring-1 ring-red-200"
                    : "text-ink-faint"
              }`}
            >
              {day}
            </span>
          );
        })}
      </div>
    </div>
  );
}

function WeakestTiles() {
  const { progress, path } = useProgress();
  const weakest = useMemo(() => {
    const ids = [...new Set(path.flatMap((u) => u.tileIds))];
    return ids
      .map((id) => ({ id, p: tileProgressOf(progress.tiles, id) }))
      .filter((t) => t.p.wrong > 0)
      .sort((a, b) => b.p.wrong - a.p.wrong || a.p.box - b.p.box)
      .slice(0, 5);
  }, [path, progress.tiles]);

  if (weakest.length === 0) return null;

  return (
    <section>
      <h2 className="px-1 font-display text-[13px] font-semibold tracking-[0.14em] text-ink-faint uppercase">
        Trickiest tiles
      </h2>
      <div className="mt-3 grid gap-2">
        {weakest.map(({ id, p }) => {
          const tile = getTile(id);
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
                <p className="text-[12.5px] text-ink-muted">
                  {p.wrong} {p.wrong === 1 ? "miss" : "misses"} · {p.correct}{" "}
                  correct
                </p>
              </div>
              <span className="numeric shrink-0 text-[13px] text-ink-faint">
                box {p.box}
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}
