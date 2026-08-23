import { GROUP_BY_ID, TILE_GROUPS, tilesInGroup } from "./tiles";
import type { GroupId, Unit } from "./types";

/** Suits are taught three tiles at a time; honours and bonus tiles fit in one. */
const SUIT_CHUNK = 3;

function unitsForGroup(group: GroupId): Unit[] {
  const meta = GROUP_BY_ID[group];
  const tiles = tilesInGroup(group);
  if (tiles.length === 0) return [];

  if (meta.kind !== "suit") {
    return [
      {
        id: `${group}-1`,
        group,
        title: meta.name,
        subtitle: `All ${tiles.length} tiles`,
        tileIds: tiles.map((t) => t.id),
        isReview: false,
      },
    ];
  }

  const units: Unit[] = [];
  for (let i = 0; i < tiles.length; i += SUIT_CHUNK) {
    const chunk = tiles.slice(i, i + SUIT_CHUNK);
    const from = chunk[0].value;
    const to = chunk[chunk.length - 1].value;
    units.push({
      id: `${group}-${units.length + 1}`,
      group,
      title: `${meta.name} ${from}–${to}`,
      subtitle: `${chunk.length} new tiles`,
      tileIds: chunk.map((t) => t.id),
      isReview: false,
    });
  }
  units.push({
    id: `${group}-review`,
    group,
    title: `${meta.name} recap`,
    subtitle: `All ${tiles.length} tiles mixed`,
    tileIds: tiles.map((t) => t.id),
    isReview: true,
  });
  return units;
}

/** The full ordered path for the groups the learner has switched on. */
export function buildPath(enabledGroups: GroupId[]): Unit[] {
  const enabled = new Set(enabledGroups);
  return TILE_GROUPS.filter((g) => enabled.has(g.id)).flatMap((g) =>
    unitsForGroup(g.id),
  );
}

export function unitStatus(
  path: Unit[],
  completedUnits: string[],
): Record<string, "done" | "current" | "locked"> {
  const done = new Set(completedUnits);
  const status: Record<string, "done" | "current" | "locked"> = {};
  let currentAssigned = false;
  for (const unit of path) {
    if (done.has(unit.id)) {
      status[unit.id] = "done";
    } else if (!currentAssigned) {
      status[unit.id] = "current";
      currentAssigned = true;
    } else {
      status[unit.id] = "locked";
    }
  }
  return status;
}

export function findUnit(path: Unit[], unitId: string): Unit | undefined {
  return path.find((u) => u.id === unitId);
}
