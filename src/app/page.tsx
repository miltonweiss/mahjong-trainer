"use client";

import Link from "next/link";
import { useMemo } from "react";
import { CheckIcon, ChevronRightIcon, LockIcon } from "@/components/icons";
import { TileBack, TileCard } from "@/components/TileCard";
import { useProgress } from "@/lib/progress-store";
import type { StringKey, Translate } from "@/lib/i18n";
import { GROUP_BY_ID, getTile } from "@/lib/tiles";
import { unitStatus, unitTitle } from "@/lib/units";
import type { Unit } from "@/lib/types";

type State = "done" | "current" | "locked";

const NUMERALS = "一二三四五六七八九十";
const RECAP_GLYPH = "復";
const PREVIEW_TILES = 4;

export default function LearnPage() {
  const { progress, ready, path, t } = useProgress();
  const status = useMemo(
    () => unitStatus(path, progress.completedUnits),
    [path, progress.completedUnits],
  );

  const groups = useMemo(() => {
    const out: { group: Unit["group"]; units: Unit[] }[] = [];
    for (const unit of path) {
      const last = out[out.length - 1];
      if (last && last.group === unit.group) last.units.push(unit);
      else out.push({ group: unit.group, units: [unit] });
    }
    return out;
  }, [path]);

  return (
    <div className="flex flex-col gap-14 px-4 pt-6 pb-16">
      {groups.map(({ group, units }) => (
        <GroupBlock
          key={group}
          group={group}
          units={units}
          status={status}
          ready={ready}
          t={t}
        />
      ))}
    </div>
  );
}

function groupKindLabel(group: Unit["group"], t: Translate): string {
  if (group === "hands") return t("kind.skill");
  return t(`kind.${GROUP_BY_ID[group].kind}` as StringKey);
}

/* ── Group: a pagoda tier sitting on a lacquer plaque ──────────────────── */

function GroupBlock({
  group,
  units,
  status,
  ready,
  t,
}: {
  group: Unit["group"];
  units: Unit[];
  status: Record<string, State>;
  ready: boolean;
  t: Translate;
}) {
  const stateOf = (u: Unit): State => (ready ? status[u.id] : "locked");
  const done = units.filter((u) => stateOf(u) === "done").length;
  const groupState: State =
    done === units.length && units.length > 0
      ? "done"
      : units.some((u) => stateOf(u) === "current")
        ? "current"
        : "locked";
  const sampleId = units[0]?.tileIds[0];
  const pct = units.length > 0 ? Math.round((done / units.length) * 100) : 0;
  const active = groupState === "current";

  const plaque =
    groupState === "current"
      ? "bg-gradient-to-b from-red-600 to-red-500 text-white ring-2 ring-inset ring-gold/60 shadow-glow-red"
      : groupState === "done"
        ? "bg-white text-ink ring-2 ring-inset ring-jade-100 shadow-card"
        : "bg-white text-ink shadow-card";

  const wood = woodOf(groupState);

  return (
    <section>
      <PagodaRoof state={groupState} />
      <div className="relative mx-[4%]">
        <Pillar side="left" wood={wood} />
        <Pillar side="right" wood={wood} />
        <header className={`relative z-10 mx-[2%] -mt-px rounded-t-[12px] rounded-b-[28px] px-5 pt-5 pb-5 ${plaque}`}>
          <div className="flex items-center gap-4">
            {sampleId ? (
              <TileCard tile={getTile(sampleId)} size="sm" />
            ) : (
              <TileBack size="sm" />
            )}
            <div className="min-w-0 flex-1">
              <p
                className={`text-[13px] font-medium ${
                  active ? "text-gold-100" : "text-ink-faint"
                }`}
              >
                {groupKindLabel(group, t)}
              </p>
              <h2 className="text-[24px] leading-tight font-semibold">
                {t(`group.${group}` as StringKey)}
              </h2>
            </div>
            <span
              className={`numeric shrink-0 rounded-full px-3 py-1 text-[13px] font-semibold ${
                active ? "bg-white/20 text-white" : "bg-bone text-ink-muted"
              }`}
            >
              {done}/{units.length}
            </span>
          </div>
          <p
            className={`mt-3 text-[14px] leading-snug ${
              active ? "text-white/85" : "text-ink-muted"
            }`}
          >
            {t(`blurb.${group}` as StringKey)}
          </p>
          <div
            className={`mt-4 h-2 overflow-hidden rounded-full ${
              active ? "bg-white/25" : "bg-bone"
            }`}
          >
            <div
              className={`h-full rounded-full transition-[width] duration-700 ease-out ${
                active ? "bg-gold" : "bg-jade"
              }`}
              style={{ width: `${pct}%` }}
            />
          </div>
        </header>

        <ol className="relative flex flex-col px-5">
          {units.map((unit, i) => (
            <li key={unit.id}>
              <div className="-mx-5">
                <Beam variant={i % BEAM_VARIANTS} wood={wood} />
              </div>
              <LevelCard
                unit={unit}
                title={unitTitle(unit, t)}
                index={i}
                state={stateOf(unit)}
                t={t}
              />
            </li>
          ))}
        </ol>
      </div>
      <Foundation />
    </section>
  );
}

/* ── House frame: pillars, beams and the stone base ────────────────────── */

type Wood = {
  dark: string;
  light: string;
  trim: string;
  lantern: string;
};

const BEAM_VARIANTS = 3;

function woodOf(state: State): Wood {
  if (state === "current") {
    return {
      dark: "var(--color-red-700)",
      light: "var(--color-red-600)",
      trim: "var(--color-gold)",
      lantern: "var(--color-red-500)",
    };
  }
  if (state === "done") {
    return {
      dark: "#15634c",
      light: "var(--color-jade)",
      trim: "var(--color-gold)",
      lantern: "var(--color-red-500)",
    };
  }
  return {
    dark: "var(--color-line-strong)",
    light: "var(--color-bone)",
    trim: "#cbbdaf",
    lantern: "var(--color-bone)",
  };
}

function Pillar({ side, wood }: { side: "left" | "right"; wood: Wood }) {
  return (
    <span
      aria-hidden
      className={`absolute top-0 bottom-0 w-3 rounded-t-[4px] ${
        side === "left" ? "left-0" : "right-0"
      }`}
      style={{
        background: `linear-gradient(to right, ${wood.light}, ${wood.dark})`,
      }}
    />
  );
}

/** The piece of timber between two floors; alternates so the house has detail. */
function Beam({ variant, wood }: { variant: number; wood: Wood }) {
  return (
    <svg viewBox="0 0 400 44" className="block w-full" aria-hidden="true">
      {variant === 0 && <LintelBrackets wood={wood} />}
      {variant === 1 && <LanternBeam wood={wood} />}
      {variant === 2 && <Balustrade wood={wood} />}
    </svg>
  );
}

function LintelBrackets({ wood }: { wood: Wood }) {
  return (
    <>
      <rect x="0" y="6" width="400" height="13" rx="6.5" fill={wood.dark} />
      <path
        d="M14 12.5 H386"
        stroke={wood.trim}
        strokeWidth={2}
        strokeLinecap="round"
        opacity={0.7}
      />
      {[64, 144, 256, 336].map((x) => (
        <g key={x}>
          <path
            d={`M${x - 15} 19 H${x + 15} L${x + 8} 31 Q${x} 34 ${x - 8} 31 Z`}
            fill={wood.light}
          />
          <circle cx={x} cy={25} r={2.5} fill={wood.trim} />
        </g>
      ))}
    </>
  );
}

function LanternBeam({ wood }: { wood: Wood }) {
  return (
    <>
      <rect x="0" y="3" width="400" height="9" rx="4.5" fill={wood.dark} />
      {[72, 328].map((x) => (
        <g key={x}>
          <path d={`M${x} 12 V16`} stroke={wood.trim} strokeWidth={2} />
          <rect x={x - 6} y="15" width="12" height="4" rx="2" fill={wood.trim} />
          <ellipse cx={x} cy="27" rx="12" ry="9" fill={wood.lantern} />
          <ellipse
            cx={x}
            cy="27"
            rx="5"
            ry="9"
            fill="none"
            stroke={wood.dark}
            strokeWidth={1.5}
            opacity={0.35}
          />
          <rect x={x - 6} y="35" width="12" height="4" rx="2" fill={wood.trim} />
          <path
            d={`M${x} 39 V44`}
            stroke={wood.trim}
            strokeWidth={2}
            strokeLinecap="round"
          />
        </g>
      ))}
      <path
        d="M200 12 L205 17 L200 22 L195 17 Z"
        fill={wood.trim}
        stroke={wood.trim}
        strokeWidth={2}
        strokeLinejoin="round"
      />
    </>
  );
}

function Balustrade({ wood }: { wood: Wood }) {
  const posts = [];
  for (let x = 26; x <= 374; x += 22) {
    if (Math.abs(x - 200) < 16) continue;
    posts.push(x);
  }
  return (
    <>
      <rect x="0" y="6" width="400" height="7" rx="3.5" fill={wood.dark} />
      {posts.map((x) => (
        <rect
          key={x}
          x={x - 2.5}
          y="13"
          width="5"
          height="17"
          rx="2.5"
          fill={wood.light}
        />
      ))}
      <rect x="0" y="30" width="400" height="7" rx="3.5" fill={wood.dark} />
      <circle cx="200" cy="21.5" r="8" fill={wood.trim} />
      <rect
        x="197"
        y="18.5"
        width="6"
        height="6"
        rx="1.5"
        fill={wood.dark}
      />
    </>
  );
}

/** Stepped stone platform the house stands on. */
function Foundation() {
  return (
    <svg
      viewBox="0 0 400 40"
      className="block w-full drop-shadow-[0_6px_10px_rgb(80_50_30/0.1)]"
      aria-hidden="true"
    >
      <rect x="10" y="0" width="380" height="14" rx="6" fill="#e8ddd1" />
      <rect x="0" y="12" width="400" height="16" rx="7" fill="#dacbbb" />
      <rect x="168" y="27" width="64" height="7" rx="3.5" fill="#e8ddd1" />
      <rect x="156" y="33" width="88" height="7" rx="3.5" fill="#dacbbb" />
    </svg>
  );
}

/** Two stacked roof tiers with upturned eaves, in the colour of the group's state. */
function PagodaRoof({ state }: { state: State }) {
  const colors =
    state === "current"
      ? { lower: "var(--color-red-700)", upper: "var(--color-red-600)", eave: "var(--color-gold)" }
      : state === "done"
        ? { lower: "#15634c", upper: "var(--color-jade)", eave: "var(--color-gold)" }
        : { lower: "var(--color-line-strong)", upper: "var(--color-bone)", eave: "#cbbdaf" };

  return (
    <svg
      viewBox="0 0 400 66"
      className="block w-full drop-shadow-[0_6px_10px_rgb(80_50_30/0.12)]"
      aria-hidden="true"
    >
      <path
        d="M120 26 C134 22 146 14 154 5 H246 C254 14 266 22 280 26 Z"
        fill={colors.upper}
      />
      <path
        d="M150 5 C146 2 142 1 138 2 M250 5 C254 2 258 1 262 2"
        stroke={colors.eave}
        strokeWidth={3}
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M4 60 C44 58 78 46 104 26 H296 C322 46 356 58 396 60 L388 66 H12 Z"
        fill={colors.lower}
      />
      <path
        d="M4 60 C44 58 78 46 104 26 H296 C322 46 356 58 396 60"
        stroke={colors.eave}
        strokeWidth={3}
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M120 26 H280"
        stroke={colors.eave}
        strokeWidth={2}
        strokeLinecap="round"
        opacity={0.7}
      />
    </svg>
  );
}

/* ── Level: a big stacked lacquer plaque ───────────────────────────────── */

function LevelCard({
  unit,
  title,
  index,
  state,
  t,
}: {
  unit: Unit;
  title: string;
  index: number;
  state: State;
  t: Translate;
}) {
  const glyph = unit.isReview ? RECAP_GLYPH : (NUMERALS[index] ?? `${index + 1}`);
  const preview = unit.tileIds.slice(0, PREVIEW_TILES);
  const extra = unit.tileIds.length - preview.length;

  const layers =
    state === "current"
      ? ["bg-red-200", "bg-red-100"]
      : state === "done"
        ? ["bg-jade-100", "bg-jade-50"]
        : ["bg-line", "bg-bone"];

  const face =
    state === "current"
      ? "bg-gradient-to-br from-red-600 to-red-500 text-white ring-2 ring-inset ring-gold/60 shadow-glow-red"
      : state === "done"
        ? "bg-white text-ink shadow-card"
        : "bg-[#fdfaf6] text-ink-faint shadow-soft";

  const seal =
    state === "current"
      ? "bg-white text-red-600 ring-2 ring-gold/70"
      : state === "done"
        ? "bg-jade text-white"
        : "bg-bone text-ink-faint";

  const content = (
    <>
      <span
        className={`cjk relative grid h-[68px] w-[68px] shrink-0 place-items-center rounded-[18px] text-[32px] font-semibold ${seal}`}
      >
        {glyph}
        {state === "done" && (
          <span className="absolute -right-1.5 -bottom-1.5 grid h-6 w-6 place-items-center rounded-full bg-white text-jade shadow-soft">
            <CheckIcon className="h-3.5 w-3.5" />
          </span>
        )}
      </span>

      <span className="min-w-0 flex-1">
        <span className="block truncate font-display text-[20px] leading-tight font-semibold">
          {title}
        </span>
        {preview.length > 0 && (
          <span className="mt-2.5 flex items-center gap-1">
            {preview.map((id, i) =>
              state === "locked" ? (
                <TileBack
                  key={`${id}-${i}`}
                  size="xs"
                  className="opacity-35 saturate-50"
                />
              ) : (
                <TileCard key={`${id}-${i}`} tile={getTile(id)} size="xs" />
              ),
            )}
            {extra > 0 && (
              <span
                className={`ml-1 text-[13px] font-semibold ${
                  state === "current" ? "text-white/80" : "text-ink-faint"
                }`}
              >
                +{extra}
              </span>
            )}
          </span>
        )}
      </span>

      {state === "current" ? (
        <span className="shrink-0 rounded-full bg-gold px-4 py-2.5 font-display text-[15px] font-semibold text-red-800 shadow-soft">
          {t("home.start")}
        </span>
      ) : state === "done" ? (
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-surface text-ink-muted">
          <ChevronRightIcon className="h-5 w-5" />
        </span>
      ) : (
        <LockIcon className="h-5 w-5 shrink-0" />
      )}
    </>
  );

  const faceClass = `relative flex min-h-[128px] items-center gap-4 rounded-[28px] p-4 pr-5 ${face}`;

  return (
    <div className="relative pb-3">
      <span
        aria-hidden
        className={`absolute inset-x-7 top-3 bottom-0 rounded-[28px] ${layers[1]}`}
      />
      <span
        aria-hidden
        className={`absolute inset-x-3.5 top-1.5 bottom-1.5 rounded-[28px] ${layers[0]}`}
      />
      {state === "locked" ? (
        <div
          className={`${faceClass} cursor-not-allowed`}
          title={`${title} — locked`}
          aria-disabled
        >
          {content}
        </div>
      ) : (
        <Link href={`/lesson/${unit.id}`} className={`press ${faceClass}`}>
          {content}
        </Link>
      )}
    </div>
  );
}
