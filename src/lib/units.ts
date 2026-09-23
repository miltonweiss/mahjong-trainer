import { GROUP_BY_ID, TILE_GROUPS, tilesInGroup } from "./tiles";
import type { StringKey, Translate } from "./i18n";
import type { GroupId, Settings, Unit } from "./types";

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
        kind: "tiles",
        group,
        tileIds: tiles.map((t) => t.id),
        isReview: false,
      },
    ];
  }

  const units: Unit[] = [];
  for (let i = 0; i < tiles.length; i += SUIT_CHUNK) {
    const chunk = tiles.slice(i, i + SUIT_CHUNK);
    units.push({
      id: `${group}-${units.length + 1}`,
      kind: "tiles",
      group,
      range: [chunk[0].value!, chunk[chunk.length - 1].value!],
      tileIds: chunk.map((t) => t.id),
      isReview: false,
    });
  }
  units.push({
    id: `${group}-review`,
    kind: "tiles",
    group,
    tileIds: tiles.map((t) => t.id),
    isReview: true,
  });
  return units;
}

const HAND_UNITS: Unit[] = [
  {
    id: "hands-sets",
    kind: "hands",
    group: "hands",
    tileIds: [],
    handMode: "sets",
    isReview: false,
  },
  {
    id: "hands-winning",
    kind: "hands",
    group: "hands",
    tileIds: [],
    handMode: "winning",
    isReview: false,
  },
  {
    id: "hands-review",
    kind: "hands",
    group: "hands",
    tileIds: [],
    handMode: "mixed",
    isReview: true,
  },
];

/** The full ordered path for the groups and skills the learner has switched on. */
export function buildPath(settings: Settings): Unit[] {
  const enabled = new Set(settings.enabledGroups);
  const tileUnits = TILE_GROUPS.filter((g) => enabled.has(g.id)).flatMap((g) =>
    unitsForGroup(g.id),
  );
  return settings.handReading ? [...tileUnits, ...HAND_UNITS] : tileUnits;
}

export function unitTitle(unit: Unit, t: Translate): string {
  if (unit.kind === "hands") {
    const key: StringKey =
      unit.handMode === "sets"
        ? "unit.handSets"
        : unit.handMode === "winning"
          ? "unit.handWinning"
          : "unit.handMixed";
    return t(key);
  }
  const group = t(`group.${unit.group}` as StringKey);
  if (unit.isReview) return t("unit.recap", { group });
  if (unit.range) {
    return t("unit.suitRange", {
      group,
      from: unit.range[0],
      to: unit.range[1],
    });
  }
  return group;
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

/** Every tile the learner's path covers, deduplicated. */
export function tilesInPath(path: Unit[]): string[] {
  return [...new Set(path.flatMap((u) => u.tileIds))];
}
