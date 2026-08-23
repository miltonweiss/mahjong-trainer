import { TileFace } from "./TileFace";
import type { Tile } from "@/lib/types";

type TileSize = "xs" | "sm" | "md" | "lg" | "xl";

const SIZE_CLASS: Record<TileSize, string> = {
  xs: "w-9 rounded-[7px]",
  sm: "w-14 rounded-[10px]",
  md: "w-20 rounded-[12px]",
  lg: "w-28 rounded-[14px]",
  xl: "w-40 rounded-[18px]",
};

const PAD_CLASS: Record<TileSize, string> = {
  xs: "p-[3px]",
  sm: "p-[5px]",
  md: "p-1.5",
  lg: "p-2",
  xl: "p-2.5",
};

export type TileState = "idle" | "correct" | "wrong" | "selected" | "muted";

const STATE_CLASS: Record<TileState, string> = {
  idle: "ring-line",
  selected: "ring-red-600 ring-2",
  correct: "ring-jade ring-2",
  wrong: "ring-red-600 ring-2",
  muted: "ring-line opacity-35",
};

export function TileCard({
  tile,
  size = "md",
  state = "idle",
  className = "",
}: {
  tile: Tile;
  size?: TileSize;
  state?: TileState;
  className?: string;
}) {
  return (
    <div
      className={`relative aspect-[5/7] shrink-0 bg-white ring-1 ring-inset shadow-tile ${SIZE_CLASS[size]} ${STATE_CLASS[state]} ${className}`}
    >
      {/* Recessed face, the way a real tile is carved */}
      <div
        className={`absolute inset-0 ${PAD_CLASS[size]}`}
        style={{ containerType: "size" }}
      >
        <div className="h-full w-full overflow-hidden rounded-[inherit] bg-[#fdfbf8] shadow-[inset_0_1px_2px_rgba(26,22,20,0.09)]">
          <TileFace tile={tile} />
        </div>
      </div>
    </div>
  );
}

/** Back of a tile — used for locked units and empty slots. */
export function TileBack({
  size = "md",
  className = "",
}: {
  size?: TileSize;
  className?: string;
}) {
  return (
    <div
      className={`aspect-[5/7] shrink-0 bg-jade ring-1 ring-inset ring-jade shadow-tile-sm ${SIZE_CLASS[size]} ${className}`}
    >
      <div className="flex h-full w-full items-center justify-center rounded-[inherit] bg-[linear-gradient(135deg,#12876a,#0c6b52)] p-1.5">
        <div className="h-full w-full rounded-[inherit] border border-white/25" />
      </div>
    </div>
  );
}
