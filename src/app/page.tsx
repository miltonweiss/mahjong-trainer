"use client";

import Link from "next/link";
import { useMemo } from "react";
import { CheckIcon, LockIcon } from "@/components/icons";
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
const ROOM_VARIANTS = 4;

/** Interior timber — window frames, floorboards, scroll rods. */
const TIMBER = "#8a4b32";
const PAPER = "#f6e3cf";

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
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-14 px-2 pt-6 pb-16 sm:px-4">
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

/* ── Group: one house, one room per level ──────────────────────────────── */

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
        <header
          className={`relative z-10 mx-[3%] -mt-px rounded-t-[12px] rounded-b-[28px] px-5 pt-5 pb-5 ${plaque}`}
        >
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
              <h2 className="text-[26px] leading-tight font-semibold">
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

        <ol className="relative flex flex-col">
          {units.map((unit, i) => (
            <li key={unit.id}>
              <Beam wood={wood} />
              <Room
                unit={unit}
                title={unitTitle(unit, t)}
                index={i}
                state={stateOf(unit)}
                wood={wood}
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

/* ── House frame: roof, pillars, floor beams and the stone base ────────── */

type Wood = { dark: string; light: string; trim: string };

function woodOf(state: State): Wood {
  if (state === "current") {
    return {
      dark: "var(--color-red-700)",
      light: "var(--color-red-600)",
      trim: "var(--color-gold)",
    };
  }
  if (state === "done") {
    return { dark: "#15634c", light: "var(--color-jade)", trim: "var(--color-gold)" };
  }
  return {
    dark: "var(--color-line-strong)",
    light: "var(--color-bone)",
    trim: "#cbbdaf",
  };
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

function Pillar({ side, wood }: { side: "left" | "right"; wood: Wood }) {
  return (
    <span
      aria-hidden
      className={`absolute top-0 bottom-0 w-4 rounded-t-[4px] ${
        side === "left" ? "left-0" : "right-0"
      }`}
      style={{
        background: `linear-gradient(to right, ${wood.light}, ${wood.dark})`,
      }}
    />
  );
}

/** Lintel between two floors. */
function Beam({ wood }: { wood: Wood }) {
  return (
    <div
      aria-hidden
      className="relative h-4 rounded-full"
      style={{ background: wood.dark }}
    >
      <div
        className="absolute inset-x-5 top-1/2 h-[2px] -translate-y-1/2 rounded-full opacity-70"
        style={{ background: wood.trim }}
      />
    </div>
  );
}

/** Carved brackets hanging from the lintel into the top of a room. */
function Brackets({ wood }: { wood: Wood }) {
  return (
    <span aria-hidden className="absolute inset-x-6 top-0 flex justify-between">
      {[0, 1, 2, 3, 4].map((i) => (
        <svg key={i} viewBox="0 0 30 12" className="h-3 w-[30px]">
          <path d="M0 0 H30 L23 9 Q15 12 7 9 Z" fill={wood.light} />
          <circle cx="15" cy="4.5" r="2.2" fill={wood.trim} />
        </svg>
      ))}
    </span>
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

/* ── Room: a level, furnished ──────────────────────────────────────────── */

const WALL: Record<State, string> = {
  current: "#fff3e3",
  done: "#fbf5ee",
  locked: "#f1ebe4",
};

function Room({
  unit,
  title,
  index,
  state,
  wood,
  t,
}: {
  unit: Unit;
  title: string;
  index: number;
  state: State;
  wood: Wood;
  t: Translate;
}) {
  const glyph = unit.isReview ? RECAP_GLYPH : (NUMERALS[index] ?? `${index + 1}`);
  const preview = unit.tileIds.slice(0, PREVIEW_TILES);
  const extra = unit.tileIds.length - preview.length;

  const seal =
    state === "current"
      ? "bg-red-600 text-white shadow-glow-red ring-2 ring-gold/70"
      : state === "done"
        ? "bg-jade text-white"
        : "bg-bone text-ink-faint";

  const inner = (
    <>
      {state === "current" && (
        <span
          aria-hidden
          className="absolute inset-0 bg-[radial-gradient(55%_70%_at_50%_45%,rgb(255_200_130/0.45),transparent)]"
        />
      )}

      <span
        aria-hidden
        className={`absolute inset-0 ${state === "locked" ? "opacity-40 grayscale" : ""}`}
      >
        <RoomDecor variant={index % ROOM_VARIANTS} id={unit.id} />
      </span>

      <Brackets wood={wood} />

      <span
        aria-hidden
        className="absolute inset-x-0 bottom-0 h-3"
        style={{ background: TIMBER }}
      >
        <span className="absolute inset-x-0 top-0 h-[2px] bg-gold/50" />
      </span>

      <span className="relative flex h-full flex-col items-center justify-center gap-2.5 px-[78px] pt-4 pb-7 text-center sm:px-[132px]">
        <span
          className={`cjk relative grid h-14 w-14 place-items-center rounded-[16px] text-[28px] font-semibold ${seal}`}
        >
          {glyph}
          {state === "done" && (
            <span className="absolute -right-1.5 -bottom-1.5 grid h-6 w-6 place-items-center rounded-full bg-white text-jade shadow-soft">
              <CheckIcon className="h-3.5 w-3.5" />
            </span>
          )}
        </span>

        <span
          className={`font-display text-[21px] leading-tight font-semibold ${
            state === "locked" ? "text-ink-faint" : "text-ink"
          }`}
        >
          {title}
        </span>

        {preview.length > 0 && (
          <span className="flex items-center gap-1">
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
              <span className="ml-1 text-[13px] font-semibold text-ink-faint">
                +{extra}
              </span>
            )}
          </span>
        )}

        {state === "current" ? (
          <span className="mt-1 rounded-full bg-red-600 px-6 py-2.5 font-display text-[16px] font-semibold text-white shadow-glow-red transition-transform group-active:scale-95">
            {t("home.start")}
          </span>
        ) : state === "locked" ? (
          <span className="mt-1 grid h-9 w-9 place-items-center rounded-full bg-bone text-ink-faint">
            <LockIcon className="h-4 w-4" />
          </span>
        ) : null}
      </span>
    </>
  );

  const roomClass = "group relative mx-4 block min-h-[260px] overflow-hidden";

  return state === "locked" ? (
    <div
      className={`${roomClass} cursor-not-allowed`}
      style={{ background: WALL[state] }}
      title={`${title} — locked`}
      aria-disabled
    >
      {inner}
    </div>
  ) : (
    <Link
      href={`/lesson/${unit.id}`}
      className={`${roomClass} transition-[filter] hover:brightness-[1.03]`}
      style={{ background: WALL[state] }}
    >
      {inner}
    </Link>
  );
}

/* ── Room furnishings ──────────────────────────────────────────────────── */

/** Left and right halves of the room's furniture, drawn on a 120×228 wall. */
function Side({
  side,
  anchor = "floor",
  children,
}: {
  side: "left" | "right";
  anchor?: "floor" | "ceiling";
  children: React.ReactNode;
}) {
  return (
    <svg
      viewBox="0 0 120 228"
      className={`absolute h-[74%] w-auto sm:h-[calc(100%-12px)] ${
        side === "left" ? "left-0" : "right-0"
      } ${anchor === "floor" ? "bottom-3" : "top-0"}`}
    >
      {children}
    </svg>
  );
}

function RoomDecor({ variant, id }: { variant: number; id: string }) {
  if (variant === 0) {
    return (
      <>
        <Side side="left">
          <MoonWindow clipId={`moon-${id}`} />
        </Side>
        <Side side="right" anchor="ceiling">
          <Lantern x={38} drop={26} />
          <Lantern x={84} drop={46} />
        </Side>
      </>
    );
  }
  if (variant === 1) {
    return (
      <>
        <Side side="left">
          <LatticeWindow />
        </Side>
        <Side side="right">
          <HangingScroll glyph="福" />
        </Side>
      </>
    );
  }
  if (variant === 2) {
    return (
      <>
        <Side side="left">
          <Couplet glyphs="春滿堂" />
        </Side>
        <Side side="right">
          <Couplet glyphs="福臨門" />
        </Side>
      </>
    );
  }
  return (
    <>
      <Side side="left">
        <FoldingScreen />
      </Side>
      <Side side="right">
        <Vase />
      </Side>
    </>
  );
}

function MoonWindow({ clipId }: { clipId: string }) {
  return (
    <>
      <defs>
        <clipPath id={clipId}>
          <circle cx="62" cy="104" r="44" />
        </clipPath>
      </defs>
      <circle cx="62" cy="104" r="44" fill="#fbe7d2" />
      <g clipPath={`url(#${clipId})`}>
        <circle cx="80" cy="84" r="9" fill="#f2a65a" />
        <path d="M10 136 L40 98 L58 116 L82 84 L120 136 Z" fill="#e7c0a0" />
        <path d="M10 150 L48 116 L74 134 L120 104 L120 160 Z" fill="#d6a283" />
      </g>
      <circle cx="62" cy="104" r="44" fill="none" stroke={TIMBER} strokeWidth={7} />
      <rect x="20" y="210" width="84" height="8" rx="4" fill={TIMBER} opacity={0.35} />
    </>
  );
}

function Lantern({ x, drop }: { x: number; drop: number }) {
  const cy = drop + 22;
  return (
    <g>
      <path d={`M${x} 0 V${drop}`} stroke="var(--color-gold)" strokeWidth={2} />
      <rect x={x - 7} y={drop} width="14" height="5" rx="2.5" fill="var(--color-gold)" />
      <circle cx={x} cy={cy} r="26" fill="var(--color-gold)" opacity={0.12} />
      <ellipse cx={x} cy={cy} rx="17" ry="15" fill="var(--color-red-500)" />
      <ellipse
        cx={x}
        cy={cy}
        rx="7"
        ry="15"
        fill="none"
        stroke="var(--color-red-700)"
        strokeWidth={1.5}
        opacity={0.45}
      />
      <rect x={x - 7} y={cy + 13} width="14" height="5" rx="2.5" fill="var(--color-gold)" />
      <path
        d={`M${x} ${cy + 18} V${cy + 30}`}
        stroke="var(--color-gold)"
        strokeWidth={2.5}
        strokeLinecap="round"
      />
    </g>
  );
}

function LatticeWindow() {
  return (
    <>
      <rect x="18" y="56" width="86" height="104" rx="8" fill={PAPER} />
      {[47, 75].map((x) => (
        <path key={x} d={`M${x} 56 V160`} stroke={TIMBER} strokeWidth={3} />
      ))}
      {[90, 125].map((y) => (
        <path key={y} d={`M18 ${y} H104`} stroke={TIMBER} strokeWidth={3} />
      ))}
      <rect
        x="18"
        y="56"
        width="86"
        height="104"
        rx="8"
        fill="none"
        stroke={TIMBER}
        strokeWidth={6}
      />
      <rect x="12" y="160" width="98" height="8" rx="4" fill={TIMBER} />
    </>
  );
}

function HangingScroll({ glyph }: { glyph: string }) {
  return (
    <>
      <path d="M61 18 L48 40 M61 18 L74 40" stroke={TIMBER} strokeWidth={1.5} fill="none" />
      <circle cx="61" cy="17" r="2.5" fill={TIMBER} />
      <rect x="26" y="38" width="70" height="6" rx="3" fill={TIMBER} />
      <rect x="32" y="44" width="58" height="130" fill="#fffaf1" />
      <rect x="38" y="52" width="46" height="114" fill="none" stroke="#efe1cd" strokeWidth={1.5} />
      <text
        x="61"
        y="122"
        textAnchor="middle"
        fontSize="40"
        fontWeight={600}
        className="cjk"
        fill="var(--color-red-600)"
      >
        {glyph}
      </text>
      <rect x="66" y="146" width="10" height="10" rx="2" fill="var(--color-red-500)" />
      <rect x="26" y="172" width="70" height="7" rx="3.5" fill={TIMBER} />
    </>
  );
}

function Couplet({ glyphs }: { glyphs: string }) {
  return (
    <>
      <rect x="42" y="26" width="38" height="158" rx="5" fill="var(--color-red-600)" />
      <rect
        x="46"
        y="30"
        width="30"
        height="150"
        rx="3"
        fill="none"
        stroke="var(--color-gold)"
        strokeWidth={1.5}
        opacity={0.8}
      />
      {[...glyphs].map((g, i) => (
        <text
          key={i}
          x="61"
          y={72 + i * 44}
          textAnchor="middle"
          fontSize="26"
          fontWeight={600}
          className="cjk"
          fill="var(--color-gold)"
        >
          {g}
        </text>
      ))}
    </>
  );
}

function FoldingScreen() {
  const blossoms: [number, number][] = [
    [34, 170],
    [52, 150],
    [66, 128],
    [84, 116],
    [98, 96],
  ];
  return (
    <>
      {[12, 46, 80].map((x) => (
        <rect
          key={x}
          x={x}
          y="78"
          width="30"
          height="140"
          rx="4"
          fill="#fbeee0"
          stroke={TIMBER}
          strokeWidth={3}
        />
      ))}
      <path
        d="M16 200 C34 176 52 158 66 128 S92 100 106 90"
        stroke="#6b4a3a"
        strokeWidth={3}
        strokeLinecap="round"
        fill="none"
      />
      {blossoms.map(([x, y]) => (
        <g key={`${x}-${y}`}>
          <circle cx={x} cy={y} r="5.5" fill="#f29a9a" />
          <circle cx={x} cy={y} r="1.8" fill="var(--color-gold)" />
        </g>
      ))}
    </>
  );
}

function Vase() {
  return (
    <>
      <path
        d="M60 150 C58 122 68 100 88 80"
        stroke="#6b4a3a"
        strokeWidth={2.5}
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M62 124 C52 110 44 104 32 100"
        stroke="#6b4a3a"
        strokeWidth={2}
        strokeLinecap="round"
        fill="none"
      />
      {[
        [88, 80],
        [76, 96],
        [32, 100],
        [46, 106],
        [66, 112],
      ].map(([x, y]) => (
        <circle key={`${x}-${y}`} cx={x} cy={y} r="5" fill="#f29a9a" />
      ))}
      <path
        d="M50 214 C32 204 32 174 48 160 L48 150 H72 L72 160 C88 174 88 204 70 214 Z"
        fill="#2f7a8c"
      />
      <path d="M40 186 H80" stroke="var(--color-gold)" strokeWidth={2} opacity={0.8} />
      <rect x="44" y="146" width="32" height="6" rx="3" fill="#25606e" />
      <rect x="40" y="212" width="40" height="6" rx="3" fill={TIMBER} opacity={0.6} />
    </>
  );
}
