"use client";

import { useMemo, useState } from "react";
import { TileCard } from "@/components/TileCard";
import { SearchIcon, XIcon } from "@/components/icons";
import { useProgress } from "@/lib/progress-store";
import { masteryOf, tileProgressOf } from "@/lib/srs";
import { GROUP_BY_ID, TILE_GROUPS, TILES, normalizeAnswer } from "@/lib/tiles";
import type { Tile } from "@/lib/types";

export default function TilesPage() {
  const { progress } = useProgress();
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Tile | null>(null);

  const matches = useMemo(() => {
    const q = normalizeAnswer(query);
    if (!q) return TILES;
    return TILES.filter((tile) =>
      [tile.name, tile.chinese, tile.pinyin, ...tile.aliases].some((field) =>
        normalizeAnswer(field).includes(q),
      ),
    );
  }, [query]);

  const enabled = new Set(progress.settings.enabledGroups);

  return (
    <div className="flex flex-col gap-5 px-4 pt-5 pb-10">
      <header>
        <h1 className="font-display text-2xl font-semibold">Tiles</h1>
        <p className="mt-1 text-[15px] text-ink-muted">
          All {TILES.length} faces in a Singapore set, with the names to match.
        </p>
      </header>

      <div className="relative">
        <SearchIcon className="absolute top-1/2 left-3.5 h-[18px] w-[18px] -translate-y-1/2 text-ink-faint" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search tiles, characters or pinyin"
          className="w-full rounded-2xl bg-white py-3.5 pr-10 pl-11 text-[15px] ring-1 ring-line outline-none placeholder:text-ink-faint focus:ring-2 focus:ring-red-600"
        />
        {query && (
          <button
            onClick={() => setQuery("")}
            aria-label="Clear search"
            className="absolute top-1/2 right-3 -translate-y-1/2 text-ink-faint hover:text-ink"
          >
            <XIcon className="h-4 w-4" />
          </button>
        )}
      </div>

      {matches.length === 0 && (
        <p className="py-10 text-center text-[15px] text-ink-muted">
          No tile matches “{query}”.
        </p>
      )}

      {TILE_GROUPS.map((group) => {
        const tiles = matches.filter((t) => t.group === group.id);
        if (tiles.length === 0) return null;
        return (
          <section key={group.id}>
            <div className="flex items-baseline justify-between px-1">
              <h2 className="font-display text-[13px] font-semibold tracking-[0.14em] text-ink-faint uppercase">
                {group.name}
              </h2>
              {!enabled.has(group.id) && (
                <span className="rounded-full bg-bone px-2 py-0.5 text-[11px] text-ink-muted">
                  Not in your path
                </span>
              )}
            </div>
            <div className="mt-3 grid grid-cols-4 gap-3 sm:grid-cols-5">
              {tiles.map((tile) => {
                const pct = Math.round(
                  masteryOf(tileProgressOf(progress.tiles, tile.id)) * 100,
                );
                return (
                  <button
                    key={tile.id}
                    onClick={() => setSelected(tile)}
                    className="press flex flex-col items-center gap-1.5"
                  >
                    <TileCard tile={tile} size="md" className="w-full" />
                    <span className="w-full truncate text-center text-[11.5px] text-ink-muted">
                      {tile.name}
                    </span>
                    <span className="h-1 w-8 overflow-hidden rounded-full bg-bone">
                      <span
                        className="block h-full rounded-full bg-jade"
                        style={{ width: `${pct}%` }}
                      />
                    </span>
                  </button>
                );
              })}
            </div>
          </section>
        );
      })}

      {selected && (
        <TileDetail tile={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}

function TileDetail({ tile, onClose }: { tile: Tile; onClose: () => void }) {
  const { progress } = useProgress();
  const p = tileProgressOf(progress.tiles, tile.id);
  const seen = p.correct + p.wrong;
  const accuracy = seen > 0 ? Math.round((p.correct / seen) * 100) : null;

  return (
    <div
      className="fixed inset-0 z-40 flex items-end justify-center bg-ink/35 backdrop-blur-[2px]"
      onClick={onClose}
    >
      <div
        className="animate-slide-up w-full max-w-lg rounded-t-3xl bg-white p-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-4">
          <TileCard tile={tile} size="lg" />
          <div className="min-w-0 flex-1">
            <p className="font-display text-[11px] font-semibold tracking-[0.14em] text-red-600 uppercase">
              {GROUP_BY_ID[tile.group].name}
            </p>
            <h2 className="mt-0.5 font-display text-2xl font-semibold">
              {tile.name}
            </h2>
            <p className="mt-1 flex items-baseline gap-2">
              <span className="cjk text-lg">{tile.chinese}</span>
              {progress.settings.showPinyin && (
                <span className="text-[14px] text-ink-muted italic">
                  {tile.pinyin}
                </span>
              )}
            </p>
            <p className="mt-2 text-[12.5px] text-ink-faint">
              {tile.copies} {tile.copies === 1 ? "copy" : "copies"} in a set
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="press grid h-9 w-9 shrink-0 place-items-center rounded-full text-ink-faint hover:bg-surface"
          >
            <XIcon className="h-5 w-5" />
          </button>
        </div>

        <p className="mt-5 rounded-2xl bg-surface p-4 text-[14.5px] leading-relaxed text-ink-muted">
          {tile.note}
        </p>

        <div className="mt-4 grid grid-cols-3 gap-2 text-center">
          <Stat label="Box" value={`${p.box}/5`} />
          <Stat label="Seen" value={`${seen}`} />
          <Stat label="Accuracy" value={accuracy == null ? "—" : `${accuracy}%`} />
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-surface py-3">
      <p className="numeric text-lg font-semibold">{value}</p>
      <p className="text-[11.5px] tracking-wide text-ink-faint uppercase">
        {label}
      </p>
    </div>
  );
}
