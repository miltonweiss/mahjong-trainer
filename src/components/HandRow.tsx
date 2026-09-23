import { TileCard } from "./TileCard";
import { getTile } from "@/lib/tiles";

/**
 * A hand laid out the way it sits on the rack. Thirteen tiles don't fit
 * across a phone in one line, so the row wraps and the tiles shrink with the
 * count rather than overflowing.
 */
export function HandRow({
  tileIds,
  className = "",
}: {
  tileIds: string[];
  className?: string;
}) {
  const size = tileIds.length > 8 ? "xs" : tileIds.length > 5 ? "sm" : "lg";
  return (
    <div
      className={`flex flex-wrap items-center justify-center gap-1.5 ${className}`}
      role="group"
    >
      {tileIds.map((id, i) => (
        <TileCard key={`${id}-${i}`} tile={getTile(id)} size={size} />
      ))}
    </div>
  );
}
