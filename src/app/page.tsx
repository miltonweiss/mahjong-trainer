"use client";

import Link from "next/link";
import { useMemo } from "react";
import { CheckIcon, FlameIcon, LockIcon, StarIcon } from "@/components/icons";
import { TileCard } from "@/components/TileCard";
import { useProgress } from "@/lib/progress-store";
import { isDue, tileProgressOf } from "@/lib/srs";
import { GROUP_BY_ID, getTile } from "@/lib/tiles";
import { unitStatus } from "@/lib/units";
import type { GroupId, Unit } from "@/lib/types";

const ROW_H = 108;
const NODE = 72;
const TRACK_W = 300;
const OFFSETS = [0, 46, 0, -46];

export default function LearnPage() {
  const { progress, ready, path } = useProgress();
  const status = useMemo(
    () => unitStatus(path, progress.completedUnits),
    [path, progress.completedUnits],
  );

  const dueCount = useMemo(() => {
    const now = new Date();
    return path
      .flatMap((u) => u.tileIds)
      .filter((id, i, all) => all.indexOf(id) === i)
      .filter((id) => isDue(tileProgressOf(progress.tiles, id), now)).length;
  }, [path, progress.tiles]);

  const groups = useMemo(() => {
    const out: { group: GroupId; units: Unit[] }[] = [];
    for (const unit of path) {
      const last = out[out.length - 1];
      if (last && last.group === unit.group) last.units.push(unit);
      else out.push({ group: unit.group, units: [unit] });
    }
    return out;
  }, [path]);

  const goalPct = Math.min(
    100,
    Math.round((progress.dailyXp.xp / progress.settings.dailyGoal) * 100),
  );

  return (
    <div className="flex flex-col gap-6 px-4 pt-5 pb-10">
      <section className="rounded-2xl bg-white p-4 shadow-card ring-1 ring-line">
        <div className="flex items-baseline justify-between">
          <h2 className="font-display text-base font-semibold">Daily goal</h2>
          <span className="numeric text-sm text-ink-muted">
            {ready ? progress.dailyXp.xp : 0} / {progress.settings.dailyGoal} XP
          </span>
        </div>
        <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-bone">
          <div
            className="h-full rounded-full bg-red-600 transition-[width] duration-500"
            style={{ width: `${ready ? goalPct : 0}%` }}
          />
        </div>
        <div className="mt-3 flex items-center gap-2 text-[13px] text-ink-muted">
          <FlameIcon className="h-4 w-4 text-gold" />
          {ready && progress.streak.current > 0 ? (
            <span>
              <span className="numeric font-semibold text-ink">
                {progress.streak.current}
              </span>{" "}
              day streak — keep it alive.
            </span>
          ) : (
            <span>Finish one lesson today to start a streak.</span>
          )}
        </div>
      </section>

      {ready && dueCount > 0 && (
        <Link
          href="/practice"
          className="press flex items-center justify-between rounded-2xl bg-gold-50 p-4 ring-1 ring-gold-100"
        >
          <div>
            <p className="font-display text-base font-semibold">
              {dueCount} {dueCount === 1 ? "tile is" : "tiles are"} due
            </p>
            <p className="text-[13px] text-ink-muted">
              A quick review keeps them from slipping.
            </p>
          </div>
          <span className="font-display text-[13px] font-semibold tracking-wide text-red-600 uppercase">
            Practice
          </span>
        </Link>
      )}

      {groups.map(({ group, units }) => (
        <GroupBlock
          key={group}
          group={group}
          units={units}
          status={status}
          ready={ready}
        />
      ))}
    </div>
  );
}

function GroupBlock({
  group,
  units,
  status,
  ready,
}: {
  group: GroupId;
  units: Unit[];
  status: Record<string, "done" | "current" | "locked">;
  ready: boolean;
}) {
  const meta = GROUP_BY_ID[group];
  const done = units.filter((u) => status[u.id] === "done").length;
  const active = units.some((u) => status[u.id] === "current");
  const sampleTile = getTile(units[0].tileIds[0]);

  return (
    <section>
      <header
        className={`flex items-center gap-3 rounded-2xl px-4 py-3.5 ${
          active
            ? "bg-red-600 text-white"
            : "bg-white text-ink ring-1 ring-line"
        }`}
      >
        <TileCard tile={sampleTile} size="sm" />
        <div className="min-w-0 flex-1">
          <p
            className={`font-display text-[11px] font-medium tracking-[0.14em] uppercase ${
              active ? "text-white/70" : "text-ink-faint"
            }`}
          >
            {meta.kind === "suit" ? "Suit" : meta.kind === "honor" ? "Honours" : "Bonus"}
          </p>
          <h2 className="font-display text-lg leading-tight font-semibold">
            {meta.name}
          </h2>
          <p
            className={`truncate text-[12.5px] ${
              active ? "text-white/80" : "text-ink-muted"
            }`}
          >
            {meta.blurb}
          </p>
        </div>
        <span
          className={`numeric shrink-0 text-[13px] font-semibold ${
            active ? "text-white/80" : "text-ink-faint"
          }`}
        >
          {done}/{units.length}
        </span>
      </header>

      <div
        className="relative mx-auto mt-7"
        style={{ width: TRACK_W, height: units.length * ROW_H }}
      >
        <Connector count={units.length} />
        {units.map((unit, i) => (
          <PathNode
            key={unit.id}
            unit={unit}
            index={i}
            state={ready ? status[unit.id] : "locked"}
          />
        ))}
      </div>
    </section>
  );
}

/** Dotted spine linking the nodes, matching their serpentine offsets. */
function Connector({ count }: { count: number }) {
  if (count < 2) return null;
  const cx = TRACK_W / 2;
  const pointAt = (i: number) => ({
    x: cx + OFFSETS[i % OFFSETS.length],
    y: i * ROW_H + ROW_H / 2,
  });
  let d = "";
  for (let i = 0; i < count - 1; i++) {
    const a = pointAt(i);
    const b = pointAt(i + 1);
    const my = (a.y + b.y) / 2;
    d += `M${a.x} ${a.y + NODE / 2 - 4} C${a.x} ${my} ${b.x} ${my} ${b.x} ${
      b.y - NODE / 2 + 4
    } `;
  }
  return (
    <svg
      className="absolute inset-0 h-full w-full"
      viewBox={`0 0 ${TRACK_W} ${count * ROW_H}`}
      aria-hidden="true"
    >
      <path
        d={d}
        fill="none"
        stroke="var(--color-line-strong)"
        strokeWidth={4}
        strokeLinecap="round"
        strokeDasharray="1 11"
      />
    </svg>
  );
}

function PathNode({
  unit,
  index,
  state,
}: {
  unit: Unit;
  index: number;
  state: "done" | "current" | "locked";
}) {
  const offset = OFFSETS[index % OFFSETS.length];
  const top = index * ROW_H + (ROW_H - NODE) / 2;
  const left = TRACK_W / 2 + offset - NODE / 2;

  const face =
    state === "done" ? (
      <CheckIcon className="h-7 w-7 text-white" />
    ) : state === "current" ? (
      unit.isReview ? (
        <StarIcon className="h-7 w-7 text-white" />
      ) : (
        <span className="numeric text-xl font-semibold text-white">
          {index + 1}
        </span>
      )
    ) : (
      <LockIcon className="h-6 w-6 text-ink-faint" />
    );

  const shell =
    state === "done"
      ? "bg-jade shadow-[0_5px_0_0_#0a5943]"
      : state === "current"
        ? "bg-red-600 shadow-[0_5px_0_0_var(--color-red-800)]"
        : "bg-bone shadow-[0_5px_0_0_var(--color-line-strong)]";

  const content = (
    <span
      className={`press grid h-full w-full place-items-center rounded-[26px] ${shell}`}
    >
      {face}
    </span>
  );

  return (
    <div className="absolute" style={{ top, left, width: NODE, height: NODE }}>
      {state === "current" && (
        <span
          aria-hidden
          className="animate-halo absolute -inset-2 rounded-[34px] ring-2 ring-red-200"
        />
      )}
      {state === "locked" ? (
        <div
          className="h-full w-full cursor-not-allowed"
          title={`${unit.title} — locked`}
          aria-disabled
        >
          {content}
        </div>
      ) : (
        <Link
          href={`/lesson/${unit.id}`}
          className="block h-full w-full"
          aria-label={`${unit.title} — ${unit.subtitle}`}
        >
          {content}
        </Link>
      )}
      <span
        className={`absolute top-[80px] left-1/2 w-[130px] -translate-x-1/2 text-center font-display text-[11.5px] leading-tight ${
          state === "current"
            ? "font-semibold text-red-600"
            : "font-medium text-ink-muted"
        }`}
      >
        {unit.title}
      </span>
    </div>
  );
}
