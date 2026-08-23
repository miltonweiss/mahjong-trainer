import type { Tile } from "@/lib/types";

/**
 * Tile faces are drawn rather than pulled from an image set or the Unicode
 * mahjong block, which renders inconsistently (and turns the red dragon into
 * a colour emoji). Suit pips are SVG shapes; honours and bonus tiles are CJK
 * glyphs, which is what the real tiles carry anyway.
 */

const INK = "#1a1614";
const BLUE = "#1b4f7d";
const RED = "#c8102e";
const GREEN = "#0f7b5f";
const GOLD = "#b8862b";

const VIEW_W = 100;
const VIEW_H = 140;

/* ── Dots ──────────────────────────────────────────────────────────────── */

interface Pip {
  x: number;
  y: number;
  color?: string;
}

const DOT_LAYOUTS: Record<number, { r: number; pips: Pip[] }> = {
  1: { r: 24, pips: [{ x: 50, y: 70, color: RED }] },
  2: {
    r: 16,
    pips: [
      { x: 50, y: 46, color: GREEN },
      { x: 50, y: 94, color: BLUE },
    ],
  },
  3: {
    r: 15,
    pips: [
      { x: 29, y: 44, color: BLUE },
      { x: 50, y: 70, color: GREEN },
      { x: 71, y: 96, color: RED },
    ],
  },
  4: {
    r: 15,
    pips: [
      { x: 32, y: 48, color: BLUE },
      { x: 68, y: 48, color: GREEN },
      { x: 32, y: 92, color: GREEN },
      { x: 68, y: 92, color: BLUE },
    ],
  },
  5: {
    r: 14,
    pips: [
      { x: 30, y: 46, color: BLUE },
      { x: 70, y: 46, color: GREEN },
      { x: 50, y: 70, color: RED },
      { x: 30, y: 94, color: GREEN },
      { x: 70, y: 94, color: BLUE },
    ],
  },
  6: {
    r: 13,
    pips: [
      { x: 32, y: 42, color: GREEN },
      { x: 68, y: 42, color: GREEN },
      { x: 32, y: 70, color: RED },
      { x: 68, y: 70, color: RED },
      { x: 32, y: 98, color: RED },
      { x: 68, y: 98, color: RED },
    ],
  },
  7: {
    r: 12,
    pips: [
      { x: 28, y: 46, color: GREEN },
      { x: 50, y: 38, color: GREEN },
      { x: 72, y: 30, color: GREEN },
      { x: 32, y: 78, color: RED },
      { x: 68, y: 78, color: RED },
      { x: 32, y: 106, color: RED },
      { x: 68, y: 106, color: RED },
    ],
  },
  8: {
    r: 11,
    pips: [
      { x: 33, y: 34, color: BLUE },
      { x: 67, y: 34, color: BLUE },
      { x: 33, y: 58, color: BLUE },
      { x: 67, y: 58, color: BLUE },
      { x: 33, y: 82, color: BLUE },
      { x: 67, y: 82, color: BLUE },
      { x: 33, y: 106, color: BLUE },
      { x: 67, y: 106, color: BLUE },
    ],
  },
  9: {
    r: 12,
    pips: [
      { x: 27, y: 42, color: BLUE },
      { x: 50, y: 42, color: BLUE },
      { x: 73, y: 42, color: BLUE },
      { x: 27, y: 70, color: GREEN },
      { x: 50, y: 70, color: GREEN },
      { x: 73, y: 70, color: GREEN },
      { x: 27, y: 98, color: RED },
      { x: 50, y: 98, color: RED },
      { x: 73, y: 98, color: RED },
    ],
  },
};

function Dot({ x, y, r, color }: Pip & { r: number }) {
  const c = color ?? BLUE;
  return (
    <g>
      <circle cx={x} cy={y} r={r} fill={c} />
      <circle cx={x} cy={y} r={r * 0.62} fill="#fdfbf9" />
      <circle cx={x} cy={y} r={r * 0.3} fill={c} />
    </g>
  );
}

function DotsFace({ value }: { value: number }) {
  const layout = DOT_LAYOUTS[value];
  return (
    <g>
      {layout.pips.map((pip, i) => (
        <Dot key={i} {...pip} r={layout.r} />
      ))}
    </g>
  );
}

/* ── Bamboo ────────────────────────────────────────────────────────────── */

interface StickSpec {
  x: number;
  y: number;
  color?: string;
}

const BAMBOO_LAYOUTS: Record<number, { h: number; w: number; sticks: StickSpec[] }> = {
  2: {
    h: 46,
    w: 15,
    sticks: [
      { x: 50, y: 44 },
      { x: 50, y: 96 },
    ],
  },
  3: {
    h: 42,
    w: 14,
    sticks: [
      { x: 50, y: 38 },
      { x: 32, y: 96 },
      { x: 68, y: 96 },
    ],
  },
  4: {
    h: 44,
    w: 14,
    sticks: [
      { x: 32, y: 42 },
      { x: 68, y: 42 },
      { x: 32, y: 98 },
      { x: 68, y: 98 },
    ],
  },
  5: {
    h: 38,
    w: 13,
    sticks: [
      { x: 29, y: 38 },
      { x: 71, y: 38 },
      { x: 50, y: 70, color: RED },
      { x: 29, y: 102 },
      { x: 71, y: 102 },
    ],
  },
  6: {
    h: 44,
    w: 14,
    sticks: [
      { x: 26, y: 43 },
      { x: 50, y: 43 },
      { x: 74, y: 43 },
      { x: 26, y: 97 },
      { x: 50, y: 97 },
      { x: 74, y: 97 },
    ],
  },
  7: {
    h: 32,
    w: 12,
    sticks: [
      { x: 50, y: 27, color: RED },
      { x: 26, y: 71 },
      { x: 50, y: 71 },
      { x: 74, y: 71 },
      { x: 26, y: 111 },
      { x: 50, y: 111 },
      { x: 74, y: 111 },
    ],
  },
  8: {
    h: 44,
    w: 12,
    sticks: [
      { x: 22, y: 43 },
      { x: 41, y: 43 },
      { x: 59, y: 43 },
      { x: 78, y: 43 },
      { x: 22, y: 97 },
      { x: 41, y: 97 },
      { x: 59, y: 97 },
      { x: 78, y: 97 },
    ],
  },
  9: {
    h: 32,
    w: 13,
    sticks: [
      { x: 26, y: 33 },
      { x: 50, y: 33, color: RED },
      { x: 74, y: 33 },
      { x: 26, y: 71 },
      { x: 50, y: 71, color: RED },
      { x: 74, y: 71 },
      { x: 26, y: 109 },
      { x: 50, y: 109, color: RED },
      { x: 74, y: 109 },
    ],
  },
};

/** A bamboo cane: tapered ends, a pale core and two joints across the middle. */
function Stick({
  x,
  y,
  h,
  w,
  color = GREEN,
}: StickSpec & { h: number; w: number }) {
  const top = y - h / 2;
  const jointH = Math.max(2.2, h * 0.06);
  return (
    <g>
      <rect
        x={x - w / 2}
        y={top}
        width={w}
        height={h}
        rx={w / 2}
        fill={color}
      />
      <rect
        x={x - w / 2 + w * 0.26}
        y={top + h * 0.1}
        width={w * 0.48}
        height={h * 0.8}
        rx={w * 0.24}
        fill="#fdfbf9"
        opacity={0.5}
      />
      <rect
        x={x - w / 2 - 1}
        y={y - h * 0.19 - jointH / 2}
        width={w + 2}
        height={jointH}
        rx={jointH / 2}
        fill={color}
      />
      <rect
        x={x - w / 2 - 1}
        y={y + h * 0.19 - jointH / 2}
        width={w + 2}
        height={jointH}
        rx={jointH / 2}
        fill={color}
      />
    </g>
  );
}

/** 1 Bamboo is a bird in every real set — worth drawing properly. */
function BambooBird() {
  return (
    <g>
      {/* tail feathers sweeping down and left */}
      <path d="M45 76C32 90 25 102 22 115c9-6 19-17 26-28z" fill={GREEN} />
      <path d="M48 80C39 95 35 106 34 118c7-8 14-20 18-30z" fill={RED} />
      {/* body */}
      <ellipse
        cx="54"
        cy="66"
        rx="17"
        ry="21"
        fill={GREEN}
        transform="rotate(-12 54 66)"
      />
      {/* wing */}
      <path
        d="M47 57c10 2 17 11 17 22-10-2-17-11-17-22z"
        fill="#fdfbf9"
        opacity={0.55}
      />
      {/* legs and perch */}
      <path
        d="M51 86v16M60 86v16"
        stroke={GOLD}
        strokeWidth={3}
        strokeLinecap="round"
      />
      <path
        d="M30 104h44"
        stroke={GOLD}
        strokeWidth={4}
        strokeLinecap="round"
      />
      {/* head */}
      <circle cx="58" cy="37" r="11.5" fill={GREEN} />
      <path d="M55 26l3-11 5 10z" fill={RED} />
      <circle cx="62" cy="35" r="2.8" fill="#fdfbf9" />
      <path d="M69 39l11 3-11 4z" fill={GOLD} />
    </g>
  );
}

/* ── Characters, honours and bonus tiles ───────────────────────────────── */

interface GlyphProps {
  text: string;
  y: number;
  size: number;
  fill: string;
}

function Glyph({ text, y, size, fill }: GlyphProps) {
  return (
    <text
      x={VIEW_W / 2}
      y={y}
      textAnchor="middle"
      dominantBaseline="central"
      fontSize={size}
      fill={fill}
      className="cjk"
      style={{ fontWeight: 600 }}
    >
      {text}
    </text>
  );
}

const NUMERALS = ["一", "二", "三", "四", "五", "六", "七", "八", "九"];

function CharactersFace({ value }: { value: number }) {
  return (
    <g>
      <Glyph text={NUMERALS[value - 1]} y={46} size={40} fill={BLUE} />
      <Glyph text="萬" y={101} size={44} fill={RED} />
    </g>
  );
}

const BONUS_COLORS: Record<string, string> = {
  "flower-plum": RED,
  "flower-orchid": GREEN,
  "flower-chrysanthemum": GOLD,
  "flower-bamboo": GREEN,
  "season-spring": GREEN,
  "season-summer": RED,
  "season-autumn": GOLD,
  "season-winter": BLUE,
};

const BONUS_INDEX: Record<string, number> = {
  "flower-plum": 1,
  "flower-orchid": 2,
  "flower-chrysanthemum": 3,
  "flower-bamboo": 4,
  "season-spring": 1,
  "season-summer": 2,
  "season-autumn": 3,
  "season-winter": 4,
};

function BonusFace({ tile }: { tile: Tile }) {
  const color = BONUS_COLORS[tile.id] ?? INK;
  const index = BONUS_INDEX[tile.id];
  return (
    <g>
      <Glyph text={tile.chinese} y={72} size={52} fill={color} />
      {index != null && (
        <text
          x={22}
          y={26}
          textAnchor="middle"
          dominantBaseline="central"
          fontSize={20}
          fill={BLUE}
          className="cjk"
          style={{ fontWeight: 600 }}
        >
          {index}
        </text>
      )}
    </g>
  );
}

function AnimalFace({ tile }: { tile: Tile }) {
  const chars = [...tile.chinese];
  if (chars.length === 1) {
    return <Glyph text={chars[0]} y={72} size={54} fill={GOLD} />;
  }
  return (
    <g>
      <Glyph text={chars[0]} y={50} size={36} fill={GOLD} />
      <Glyph text={chars.slice(1).join("")} y={95} size={36} fill={GOLD} />
    </g>
  );
}

function DragonFace({ tile }: { tile: Tile }) {
  if (tile.id === "dragon-white") {
    // The white dragon is a blank face inside a blue frame.
    return (
      <g>
        <rect
          x={20}
          y={30}
          width={60}
          height={80}
          rx={6}
          fill="none"
          stroke={BLUE}
          strokeWidth={4}
        />
        <path
          d="M28 38l44 64M72 38L28 102"
          stroke={BLUE}
          strokeWidth={2}
          opacity={0.18}
        />
      </g>
    );
  }
  return (
    <Glyph
      text={tile.chinese}
      y={70}
      size={62}
      fill={tile.id === "dragon-red" ? RED : GREEN}
    />
  );
}

/* ── Public component ──────────────────────────────────────────────────── */

export function TileFace({ tile }: { tile: Tile }) {
  return (
    <svg
      viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
      className="h-full w-full"
      role="img"
      aria-label={tile.name}
    >
      {tile.group === "dots" && <DotsFace value={tile.value!} />}
      {tile.group === "characters" && <CharactersFace value={tile.value!} />}
      {tile.group === "bamboo" &&
        (tile.value === 1 ? (
          <BambooBird />
        ) : (
          <g>
            {BAMBOO_LAYOUTS[tile.value!].sticks.map((stick, i) => (
              <Stick
                key={i}
                {...stick}
                h={BAMBOO_LAYOUTS[tile.value!].h}
                w={BAMBOO_LAYOUTS[tile.value!].w}
              />
            ))}
          </g>
        ))}
      {tile.group === "winds" && (
        <Glyph text={tile.chinese} y={70} size={62} fill={INK} />
      )}
      {tile.group === "dragons" && <DragonFace tile={tile} />}
      {(tile.group === "flowers" || tile.group === "seasons") && (
        <BonusFace tile={tile} />
      )}
      {tile.group === "animals" && <AnimalFace tile={tile} />}
    </svg>
  );
}
