import type { GroupId, Tile, TileGroup } from "./types";

export const TILE_GROUPS: TileGroup[] = [
  {
    id: "characters",
    name: "Characters",
    blurb: "萬 · the 'ten thousand' suit, 1–9. Number on top, 萬 below.",
    kind: "suit",
    defaultEnabled: true,
  },
  {
    id: "dots",
    name: "Dots",
    blurb: "筒 · circles, 1–9. Count the rings to read the number.",
    kind: "suit",
    defaultEnabled: true,
  },
  {
    id: "bamboo",
    name: "Bamboo",
    blurb: "索 · sticks, 1–9. 1 Bamboo is a bird, not a stick.",
    kind: "suit",
    defaultEnabled: true,
  },
  {
    id: "winds",
    name: "Winds",
    blurb: "東南西北 · the four directions, four copies each.",
    kind: "honor",
    defaultEnabled: true,
  },
  {
    id: "dragons",
    name: "Dragons",
    blurb: "中發白 · red, green and the blank white dragon.",
    kind: "honor",
    defaultEnabled: true,
  },
  {
    id: "flowers",
    name: "Flowers",
    blurb: "梅蘭菊竹 · four bonus tiles, one copy each.",
    kind: "bonus",
    defaultEnabled: false,
  },
  {
    id: "seasons",
    name: "Seasons",
    blurb: "春夏秋冬 · four bonus tiles, one copy each.",
    kind: "bonus",
    defaultEnabled: false,
  },
  {
    id: "animals",
    name: "Animals",
    blurb: "Cat, mouse, rooster, centipede · Singapore-only bonus tiles.",
    kind: "bonus",
    defaultEnabled: false,
  },
];

export const GROUP_BY_ID: Record<GroupId, TileGroup> = Object.fromEntries(
  TILE_GROUPS.map((g) => [g.id, g]),
) as Record<GroupId, TileGroup>;

const NUMERALS = ["一", "二", "三", "四", "五", "六", "七", "八", "九"];
const NUM_PINYIN = ["yī", "èr", "sān", "sì", "wǔ", "liù", "qī", "bā", "jiǔ"];
const NUM_WORDS = [
  "one",
  "two",
  "three",
  "four",
  "five",
  "six",
  "seven",
  "eight",
  "nine",
];

/** How the pips are laid out on each tile face — also the memory hook. */
const DOT_SHAPES = [
  "One big ring, alone in the middle.",
  "Two rings, stacked top and bottom.",
  "Three rings on a diagonal, corner to corner.",
  "Four rings, one in each corner.",
  "Four corners plus one in the centre — the middle ring is red.",
  "Two columns of three, six in all.",
  "A slanted row of three above a block of four.",
  "Two columns of four, filling the tile.",
  "A full three-by-three grid.",
];

const BAMBOO_SHAPES = [
  "Not a stick at all — 1 Bamboo is a bird. The one tile everyone misreads.",
  "Two sticks, one above the other.",
  "Three sticks: one on top, two below.",
  "Four sticks in a two-by-two block.",
  "Four green sticks around one red stick in the centre.",
  "Six sticks in two rows of three.",
  "One red stick on top, six green below in two rows.",
  "Eight sticks in two rows of four.",
  "Nine sticks in a three-by-three grid, red down the middle.",
];

const SUIT_META: Record<
  "characters" | "dots" | "bamboo",
  { char: string; pinyin: string; aliases: string[]; shapes: string[] }
> = {
  characters: {
    char: "萬",
    pinyin: "wàn",
    aliases: ["man", "wan", "crak", "character", "characters", "ten thousand"],
    shapes: NUMERALS.map(
      (n, i) =>
        `The numeral ${n} above 萬 — read the top character to get ${i + 1}.`,
    ),
  },
  dots: {
    char: "筒",
    pinyin: "tǒng",
    aliases: ["dot", "dots", "circle", "circles", "pin", "tong"],
    shapes: DOT_SHAPES,
  },
  bamboo: {
    char: "索",
    pinyin: "suǒ",
    aliases: ["bamboo", "bam", "sou", "suo", "stick", "sticks", "tiao"],
    shapes: BAMBOO_SHAPES,
  },
};

function buildSuit(group: "characters" | "dots" | "bamboo"): Tile[] {
  const meta = SUIT_META[group];
  const label = GROUP_BY_ID[group].name;
  return Array.from({ length: 9 }, (_, i) => {
    const n = i + 1;
    const word = NUM_WORDS[i];
    const aliases = new Set<string>();
    for (const a of meta.aliases) {
      aliases.add(`${n} ${a}`);
      aliases.add(`${word} ${a}`);
      aliases.add(`${a} ${n}`);
      aliases.add(`${a}${n}`);
      aliases.add(`${n}${a}`);
    }
    return {
      id: `${group}-${n}`,
      group,
      name: `${n} ${label}`,
      aliases: [...aliases],
      chinese: `${NUMERALS[i]}${meta.char}`,
      pinyin: `${NUM_PINYIN[i]} ${meta.pinyin}`,
      value: n,
      copies: 4,
      note: meta.shapes[i],
    } satisfies Tile;
  });
}

const WINDS: Tile[] = [
  {
    id: "wind-east",
    group: "winds",
    name: "East Wind",
    aliases: ["east", "e", "dong", "east wind"],
    chinese: "東",
    pinyin: "dōng",
    copies: 4,
    note: "東. The dealer's wind and the first round — East always leads.",
  },
  {
    id: "wind-south",
    group: "winds",
    name: "South Wind",
    aliases: ["south", "s", "nan", "south wind"],
    chinese: "南",
    pinyin: "nán",
    copies: 4,
    note: "南. Play passes East → South → West → North, anticlockwise.",
  },
  {
    id: "wind-west",
    group: "winds",
    name: "West Wind",
    aliases: ["west", "w", "xi", "west wind"],
    chinese: "西",
    pinyin: "xī",
    copies: 4,
    note: "西. The flat-topped one — a lid over two legs.",
  },
  {
    id: "wind-north",
    group: "winds",
    name: "North Wind",
    aliases: ["north", "n", "bei", "north wind"],
    chinese: "北",
    pinyin: "běi",
    copies: 4,
    note: "北. Two halves back to back — 北 literally means 'to turn away'.",
  },
];

const DRAGONS: Tile[] = [
  {
    id: "dragon-red",
    group: "dragons",
    name: "Red Dragon",
    aliases: ["red", "red dragon", "zhong", "chun", "centre", "center"],
    chinese: "中",
    pinyin: "zhōng",
    copies: 4,
    note: "中 in red — 'centre'. A box with a line straight through it.",
  },
  {
    id: "dragon-green",
    group: "dragons",
    name: "Green Dragon",
    aliases: ["green", "green dragon", "fa", "faa", "hatsu", "prosperity"],
    chinese: "發",
    pinyin: "fā",
    copies: 4,
    note: "發 in green — 'prosperity'. The busiest character of the three.",
  },
  {
    id: "dragon-white",
    group: "dragons",
    name: "White Dragon",
    aliases: [
      "white",
      "white dragon",
      "bai",
      "blank",
      "soap",
      "mirror",
      "haku",
    ],
    chinese: "白",
    pinyin: "bái",
    copies: 4,
    note: "The blank tile with a blue frame — nicknamed the soap or mirror.",
  },
];

const FLOWERS: Tile[] = [
  {
    id: "flower-plum",
    group: "flowers",
    name: "Plum",
    aliases: ["plum", "mei", "flower 1", "plum blossom", "1 flower"],
    chinese: "梅",
    pinyin: "méi",
    copies: 1,
    note: "Flower 1, marked in the corner. Plum blossom stands for winter.",
  },
  {
    id: "flower-orchid",
    group: "flowers",
    name: "Orchid",
    aliases: ["orchid", "lan", "flower 2", "2 flower"],
    chinese: "蘭",
    pinyin: "lán",
    copies: 1,
    note: "Flower 2. Orchid stands for spring.",
  },
  {
    id: "flower-chrysanthemum",
    group: "flowers",
    name: "Chrysanthemum",
    aliases: ["chrysanthemum", "ju", "mum", "flower 3", "3 flower"],
    chinese: "菊",
    pinyin: "jú",
    copies: 1,
    note: "Flower 3. Chrysanthemum stands for autumn.",
  },
  {
    id: "flower-bamboo",
    group: "flowers",
    name: "Bamboo Flower",
    aliases: ["bamboo flower", "zhu", "flower 4", "4 flower", "bamboo plant"],
    chinese: "竹",
    pinyin: "zhú",
    copies: 1,
    note: "Flower 4. Bamboo stands for summer — don't mix it up with the suit.",
  },
];

const SEASONS: Tile[] = [
  {
    id: "season-spring",
    group: "seasons",
    name: "Spring",
    aliases: ["spring", "chun", "season 1", "1 season"],
    chinese: "春",
    pinyin: "chūn",
    copies: 1,
    note: "Season 1. Seasons carry a number in the corner, same as flowers.",
  },
  {
    id: "season-summer",
    group: "seasons",
    name: "Summer",
    aliases: ["summer", "xia", "season 2", "2 season"],
    chinese: "夏",
    pinyin: "xià",
    copies: 1,
    note: "Season 2.",
  },
  {
    id: "season-autumn",
    group: "seasons",
    name: "Autumn",
    aliases: ["autumn", "fall", "qiu", "season 3", "3 season"],
    chinese: "秋",
    pinyin: "qiū",
    copies: 1,
    note: "Season 3. 秋 has 禾 (grain) on the left — harvest time.",
  },
  {
    id: "season-winter",
    group: "seasons",
    name: "Winter",
    aliases: ["winter", "dong season", "season 4", "4 season"],
    chinese: "冬",
    pinyin: "dōng",
    copies: 1,
    note: "Season 4. Same pinyin as East Wind (dōng) but a different tile.",
  },
];

const ANIMALS: Tile[] = [
  {
    id: "animal-cat",
    group: "animals",
    name: "Cat",
    aliases: ["cat", "mao"],
    chinese: "猫",
    pinyin: "māo",
    copies: 1,
    note: "Cat pairs with Mouse — hold both and you score the pair bonus.",
  },
  {
    id: "animal-mouse",
    group: "animals",
    name: "Mouse",
    aliases: ["mouse", "rat", "laoshu"],
    chinese: "老鼠",
    pinyin: "lǎoshǔ",
    copies: 1,
    note: "Mouse pairs with Cat.",
  },
  {
    id: "animal-rooster",
    group: "animals",
    name: "Rooster",
    aliases: ["rooster", "cock", "chicken", "gongji"],
    chinese: "公鷄",
    pinyin: "gōngjī",
    copies: 1,
    note: "Rooster pairs with Centipede.",
  },
  {
    id: "animal-centipede",
    group: "animals",
    name: "Centipede",
    aliases: ["centipede", "worm", "wugong"],
    chinese: "蜈蚣",
    pinyin: "wúgōng",
    copies: 1,
    note: "Centipede pairs with Rooster — the rooster eats the centipede.",
  },
];

export const TILES: Tile[] = [
  ...buildSuit("characters"),
  ...buildSuit("dots"),
  ...buildSuit("bamboo"),
  ...WINDS,
  ...DRAGONS,
  ...FLOWERS,
  ...SEASONS,
  ...ANIMALS,
];

export const TILE_BY_ID: Record<string, Tile> = Object.fromEntries(
  TILES.map((t) => [t.id, t]),
);

export function getTile(id: string): Tile {
  const tile = TILE_BY_ID[id];
  if (!tile) throw new Error(`Unknown tile: ${id}`);
  return tile;
}

export function tilesInGroup(group: GroupId): Tile[] {
  return TILES.filter((t) => t.group === group);
}

export function tilesInGroups(groups: GroupId[]): Tile[] {
  const set = new Set(groups);
  return TILES.filter((t) => set.has(t.group));
}

/** Loose comparison for typed answers: case, spacing and punctuation agnostic. */
export function normalizeAnswer(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function isCorrectTyped(tile: Tile, input: string): boolean {
  const guess = normalizeAnswer(input);
  if (!guess) return false;
  const accepted = [tile.name, tile.chinese, tile.pinyin, ...tile.aliases];
  return accepted.some((a) => normalizeAnswer(a) === guess);
}
