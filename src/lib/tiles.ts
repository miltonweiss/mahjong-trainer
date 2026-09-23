import type { GroupId, Lang, Localised, Tile, TileGroup } from "./types";

export const TILE_GROUPS: TileGroup[] = [
  { id: "characters", kind: "suit", defaultEnabled: true },
  { id: "dots", kind: "suit", defaultEnabled: true },
  { id: "bamboo", kind: "suit", defaultEnabled: true },
  { id: "winds", kind: "honor", defaultEnabled: true },
  { id: "dragons", kind: "honor", defaultEnabled: true },
  { id: "flowers", kind: "bonus", defaultEnabled: false },
  { id: "seasons", kind: "bonus", defaultEnabled: false },
  { id: "animals", kind: "bonus", defaultEnabled: false },
];

export const GROUP_BY_ID: Record<GroupId, TileGroup> = Object.fromEntries(
  TILE_GROUPS.map((g) => [g.id, g]),
) as Record<GroupId, TileGroup>;

const NUMERALS = ["一", "二", "三", "四", "五", "六", "七", "八", "九"];
const NUM_PINYIN = ["yī", "èr", "sān", "sì", "wǔ", "liù", "qī", "bā", "jiǔ"];
const NUM_WORDS_EN = [
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
const NUM_WORDS_DE = [
  "eins",
  "zwei",
  "drei",
  "vier",
  "fünf",
  "sechs",
  "sieben",
  "acht",
  "neun",
];

/** How the pips sit on each face — the description doubles as the memory hook. */
const DOT_SHAPES_EN = [
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

const DOT_SHAPES_DE = [
  "Ein großer Ring, allein in der Mitte.",
  "Zwei Ringe, oben und unten gestapelt.",
  "Drei Ringe diagonal von Ecke zu Ecke.",
  "Vier Ringe, in jeder Ecke einer.",
  "Vier Ecken plus einer in der Mitte — der mittlere Ring ist rot.",
  "Zwei Spalten zu je drei, sechs insgesamt.",
  "Eine schräge Dreierreihe über einem Viererblock.",
  "Zwei Spalten zu je vier, der ganze Stein voll.",
  "Ein volles Drei-mal-drei-Raster.",
];

const BAMBOO_SHAPES_EN = [
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

const BAMBOO_SHAPES_DE = [
  "Gar kein Stab — Bambus 1 ist ein Vogel. Der Stein, den alle falsch lesen.",
  "Zwei Stäbe, einer über dem anderen.",
  "Drei Stäbe: einer oben, zwei darunter.",
  "Vier Stäbe in einem Zwei-mal-zwei-Block.",
  "Vier grüne Stäbe um einen roten in der Mitte.",
  "Sechs Stäbe in zwei Reihen zu dritt.",
  "Ein roter Stab oben, sechs grüne darunter in zwei Reihen.",
  "Acht Stäbe in zwei Reihen zu viert.",
  "Neun Stäbe im Drei-mal-drei-Raster, rot in der Mitte.",
];

type SuitId = "characters" | "dots" | "bamboo";

interface SuitMeta {
  char: string;
  pinyin: string;
  en: { label: (n: number) => string; aliases: string[]; shapes: string[] };
  de: { label: (n: number) => string; aliases: string[]; shapes: string[] };
}

const SUIT_META: Record<SuitId, SuitMeta> = {
  characters: {
    char: "萬",
    pinyin: "wàn",
    en: {
      label: () => "Characters",
      aliases: ["man", "wan", "crak", "character", "characters", "ten thousand"],
      shapes: NUMERALS.map(
        (n, i) =>
          `The numeral ${n} above 萬 — read the top character to get ${i + 1}.`,
      ),
    },
    de: {
      label: () => "Zeichen",
      aliases: ["zeichen", "wan", "man", "crak", "zehntausend"],
      shapes: NUMERALS.map(
        (n, i) =>
          `Die Ziffer ${n} über 萬 — lies das obere Zeichen, um ${i + 1} zu erhalten.`,
      ),
    },
  },
  dots: {
    char: "筒",
    pinyin: "tǒng",
    en: {
      label: () => "Dots",
      aliases: ["dot", "dots", "circle", "circles", "pin", "tong"],
      shapes: DOT_SHAPES_EN,
    },
    de: {
      label: (n) => (n === 1 ? "Kreis" : "Kreise"),
      aliases: [
        "kreis",
        "kreise",
        "punkt",
        "punkte",
        "ball",
        "bälle",
        "baelle",
        "pin",
        "tong",
      ],
      shapes: DOT_SHAPES_DE,
    },
  },
  bamboo: {
    char: "索",
    pinyin: "suǒ",
    en: {
      label: () => "Bamboo",
      aliases: ["bamboo", "bam", "sou", "suo", "stick", "sticks", "tiao"],
      shapes: BAMBOO_SHAPES_EN,
    },
    de: {
      label: () => "Bambus",
      aliases: ["bambus", "bam", "sou", "suo", "stab", "stäbe", "staebe"],
      shapes: BAMBOO_SHAPES_DE,
    },
  },
};

function suitAliases(n: number, word: string, bases: string[]): string[] {
  const out = new Set<string>();
  for (const base of bases) {
    out.add(`${n} ${base}`);
    out.add(`${word} ${base}`);
    out.add(`${base} ${n}`);
    out.add(`${base}${n}`);
    out.add(`${n}${base}`);
  }
  return [...out];
}

function buildSuit(group: SuitId): Tile[] {
  const meta = SUIT_META[group];
  return Array.from({ length: 9 }, (_, i) => {
    const n = i + 1;
    return {
      id: `${group}-${n}`,
      group,
      chinese: `${NUMERALS[i]}${meta.char}`,
      pinyin: `${NUM_PINYIN[i]} ${meta.pinyin}`,
      value: n,
      copies: 4,
      en: {
        name: `${n} ${meta.en.label(n)}`,
        aliases: suitAliases(n, NUM_WORDS_EN[i], meta.en.aliases),
        note: meta.en.shapes[i],
      },
      de: {
        name: `${n} ${meta.de.label(n)}`,
        aliases: suitAliases(n, NUM_WORDS_DE[i], meta.de.aliases),
        note: meta.de.shapes[i],
      },
    } satisfies Tile;
  });
}

interface HonorSpec {
  id: string;
  group: GroupId;
  chinese: string;
  pinyin: string;
  copies: number;
  en: Localised;
  de: Localised;
}

const HONORS_AND_BONUS: HonorSpec[] = [
  {
    id: "wind-east",
    group: "winds",
    chinese: "東",
    pinyin: "dōng",
    copies: 4,
    en: {
      name: "East Wind",
      aliases: ["east", "e", "dong", "east wind"],
      note: "東. The dealer's wind and the first round — East always leads.",
    },
    de: {
      name: "Ostwind",
      aliases: ["ost", "o", "dong", "ostwind", "osten"],
      note: "東. Der Wind des Gebers und die erste Runde — Ost führt immer an.",
    },
  },
  {
    id: "wind-south",
    group: "winds",
    chinese: "南",
    pinyin: "nán",
    copies: 4,
    en: {
      name: "South Wind",
      aliases: ["south", "s", "nan", "south wind"],
      note: "南. Play passes East → South → West → North, anticlockwise.",
    },
    de: {
      name: "Südwind",
      aliases: ["süd", "sued", "s", "nan", "südwind", "suedwind", "süden"],
      note: "南. Das Spiel läuft Ost → Süd → West → Nord, gegen den Uhrzeigersinn.",
    },
  },
  {
    id: "wind-west",
    group: "winds",
    chinese: "西",
    pinyin: "xī",
    copies: 4,
    en: {
      name: "West Wind",
      aliases: ["west", "w", "xi", "west wind"],
      note: "西. The flat-topped one — a lid over two legs.",
    },
    de: {
      name: "Westwind",
      aliases: ["west", "w", "xi", "westwind", "westen"],
      note: "西. Der mit dem flachen Dach — ein Deckel über zwei Beinen.",
    },
  },
  {
    id: "wind-north",
    group: "winds",
    chinese: "北",
    pinyin: "běi",
    copies: 4,
    en: {
      name: "North Wind",
      aliases: ["north", "n", "bei", "north wind"],
      note: "北. Two halves back to back — 北 literally means 'to turn away'.",
    },
    de: {
      name: "Nordwind",
      aliases: ["nord", "n", "bei", "nordwind", "norden"],
      note: "北. Zwei Hälften Rücken an Rücken — 北 heißt wörtlich „sich abwenden“.",
    },
  },
  {
    id: "dragon-red",
    group: "dragons",
    chinese: "中",
    pinyin: "zhōng",
    copies: 4,
    en: {
      name: "Red Dragon",
      aliases: ["red", "red dragon", "zhong", "chun", "centre", "center"],
      note: "中 in red — 'centre'. A box with a line straight through it.",
    },
    de: {
      name: "Roter Drache",
      aliases: ["rot", "roter drache", "zhong", "mitte"],
      note: "中 in Rot — „Mitte“. Ein Kasten mit einem Strich mittendurch.",
    },
  },
  {
    id: "dragon-green",
    group: "dragons",
    chinese: "發",
    pinyin: "fā",
    copies: 4,
    en: {
      name: "Green Dragon",
      aliases: ["green", "green dragon", "fa", "faa", "hatsu", "prosperity"],
      note: "發 in green — 'prosperity'. The busiest character of the three.",
    },
    de: {
      name: "Grüner Drache",
      aliases: [
        "grün",
        "gruen",
        "grüner drache",
        "gruener drache",
        "fa",
        "wohlstand",
      ],
      note: "發 in Grün — „Wohlstand“. Das komplizierteste der drei Zeichen.",
    },
  },
  {
    id: "dragon-white",
    group: "dragons",
    chinese: "白",
    pinyin: "bái",
    copies: 4,
    en: {
      name: "White Dragon",
      aliases: ["white", "white dragon", "bai", "blank", "soap", "mirror", "haku"],
      note: "The blank tile with a blue frame — nicknamed the soap or mirror.",
    },
    de: {
      name: "Weißer Drache",
      aliases: [
        "weiß",
        "weiss",
        "weißer drache",
        "weisser drache",
        "bai",
        "leer",
        "seife",
        "spiegel",
      ],
      note: "Der leere Stein mit blauem Rahmen — genannt Seife oder Spiegel.",
    },
  },
  {
    id: "flower-plum",
    group: "flowers",
    chinese: "梅",
    pinyin: "méi",
    copies: 1,
    en: {
      name: "Plum",
      aliases: ["plum", "mei", "flower 1", "plum blossom", "1 flower"],
      note: "Flower 1, marked in the corner. Plum blossom stands for winter.",
    },
    de: {
      name: "Pflaume",
      aliases: ["pflaume", "mei", "blume 1", "pflaumenblüte", "1 blume"],
      note: "Blume 1, in der Ecke markiert. Die Pflaumenblüte steht für den Winter.",
    },
  },
  {
    id: "flower-orchid",
    group: "flowers",
    chinese: "蘭",
    pinyin: "lán",
    copies: 1,
    en: {
      name: "Orchid",
      aliases: ["orchid", "lan", "flower 2", "2 flower"],
      note: "Flower 2. Orchid stands for spring.",
    },
    de: {
      name: "Orchidee",
      aliases: ["orchidee", "lan", "blume 2", "2 blume"],
      note: "Blume 2. Die Orchidee steht für den Frühling.",
    },
  },
  {
    id: "flower-chrysanthemum",
    group: "flowers",
    chinese: "菊",
    pinyin: "jú",
    copies: 1,
    en: {
      name: "Chrysanthemum",
      aliases: ["chrysanthemum", "ju", "mum", "flower 3", "3 flower"],
      note: "Flower 3. Chrysanthemum stands for autumn.",
    },
    de: {
      name: "Chrysantheme",
      aliases: ["chrysantheme", "ju", "blume 3", "3 blume"],
      note: "Blume 3. Die Chrysantheme steht für den Herbst.",
    },
  },
  {
    id: "flower-bamboo",
    group: "flowers",
    chinese: "竹",
    pinyin: "zhú",
    copies: 1,
    en: {
      name: "Bamboo Flower",
      aliases: ["bamboo flower", "zhu", "flower 4", "4 flower", "bamboo plant"],
      note: "Flower 4. Bamboo stands for summer — don't mix it up with the suit.",
    },
    de: {
      name: "Bambusblume",
      aliases: ["bambusblume", "zhu", "blume 4", "4 blume"],
      note: "Blume 4. Bambus steht für den Sommer — nicht mit der Farbe verwechseln.",
    },
  },
  {
    id: "season-spring",
    group: "seasons",
    chinese: "春",
    pinyin: "chūn",
    copies: 1,
    en: {
      name: "Spring",
      aliases: ["spring", "chun", "season 1", "1 season"],
      note: "Season 1. Seasons carry a number in the corner, same as flowers.",
    },
    de: {
      name: "Frühling",
      aliases: ["frühling", "fruehling", "chun", "jahreszeit 1", "1 jahreszeit"],
      note: "Jahreszeit 1. Jahreszeiten tragen wie Blumen eine Zahl in der Ecke.",
    },
  },
  {
    id: "season-summer",
    group: "seasons",
    chinese: "夏",
    pinyin: "xià",
    copies: 1,
    en: {
      name: "Summer",
      aliases: ["summer", "xia", "season 2", "2 season"],
      note: "Season 2.",
    },
    de: {
      name: "Sommer",
      aliases: ["sommer", "xia", "jahreszeit 2", "2 jahreszeit"],
      note: "Jahreszeit 2.",
    },
  },
  {
    id: "season-autumn",
    group: "seasons",
    chinese: "秋",
    pinyin: "qiū",
    copies: 1,
    en: {
      name: "Autumn",
      aliases: ["autumn", "fall", "qiu", "season 3", "3 season"],
      note: "Season 3. 秋 has 禾 (grain) on the left — harvest time.",
    },
    de: {
      name: "Herbst",
      aliases: ["herbst", "qiu", "jahreszeit 3", "3 jahreszeit"],
      note: "Jahreszeit 3. 秋 trägt links 禾 (Getreide) — Erntezeit.",
    },
  },
  {
    id: "season-winter",
    group: "seasons",
    chinese: "冬",
    pinyin: "dōng",
    copies: 1,
    en: {
      name: "Winter",
      aliases: ["winter", "dong season", "season 4", "4 season"],
      note: "Season 4. Same pinyin as East Wind (dōng) but a different tile.",
    },
    de: {
      name: "Winter",
      aliases: ["winter", "jahreszeit 4", "4 jahreszeit"],
      note: "Jahreszeit 4. Gleiches Pinyin wie Ostwind (dōng), aber ein anderer Stein.",
    },
  },
  {
    id: "animal-cat",
    group: "animals",
    chinese: "猫",
    pinyin: "māo",
    copies: 1,
    en: {
      name: "Cat",
      aliases: ["cat", "mao"],
      note: "Cat pairs with Mouse — hold both and you score the pair bonus.",
    },
    de: {
      name: "Katze",
      aliases: ["katze", "mao"],
      note: "Die Katze gehört zur Maus — beide zusammen bringen den Paar-Bonus.",
    },
  },
  {
    id: "animal-mouse",
    group: "animals",
    chinese: "老鼠",
    pinyin: "lǎoshǔ",
    copies: 1,
    en: {
      name: "Mouse",
      aliases: ["mouse", "rat", "laoshu"],
      note: "Mouse pairs with Cat.",
    },
    de: {
      name: "Maus",
      aliases: ["maus", "ratte", "laoshu"],
      note: "Die Maus gehört zur Katze.",
    },
  },
  {
    id: "animal-rooster",
    group: "animals",
    chinese: "公鷄",
    pinyin: "gōngjī",
    copies: 1,
    en: {
      name: "Rooster",
      aliases: ["rooster", "cock", "chicken", "gongji"],
      note: "Rooster pairs with Centipede.",
    },
    de: {
      name: "Hahn",
      aliases: ["hahn", "huhn", "gongji"],
      note: "Der Hahn gehört zum Tausendfüßler.",
    },
  },
  {
    id: "animal-centipede",
    group: "animals",
    chinese: "蜈蚣",
    pinyin: "wúgōng",
    copies: 1,
    en: {
      name: "Centipede",
      aliases: ["centipede", "worm", "wugong"],
      note: "Centipede pairs with Rooster — the rooster eats the centipede.",
    },
    de: {
      name: "Tausendfüßler",
      aliases: ["tausendfüßler", "tausendfuessler", "wurm", "wugong"],
      note: "Der Tausendfüßler gehört zum Hahn — der Hahn frisst ihn.",
    },
  },
];

export const TILES: Tile[] = [
  ...buildSuit("characters"),
  ...buildSuit("dots"),
  ...buildSuit("bamboo"),
  ...HONORS_AND_BONUS,
];

export const TILE_BY_ID: Record<string, Tile> = Object.fromEntries(
  TILES.map((t) => [t.id, t]),
);

export function getTile(id: string): Tile {
  const tile = TILE_BY_ID[id];
  if (!tile) throw new Error(`Unknown tile: ${id}`);
  return tile;
}

export function tileName(tile: Tile, lang: Lang): string {
  return tile[lang]?.name ?? tile.en.name;
}

export function tileNote(tile: Tile, lang: Lang): string {
  return tile[lang]?.note ?? tile.en.note;
}

export function tilesInGroup(group: GroupId): Tile[] {
  return TILES.filter((t) => t.group === group);
}

export function tilesInGroups(groups: GroupId[]): Tile[] {
  const set = new Set(groups);
  return TILES.filter((t) => set.has(t.group));
}

/** Loose comparison for typed answers: case, accent and punctuation agnostic. */
export function normalizeAnswer(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/**
 * Typed answers are accepted in either language plus Chinese and pinyin — a
 * learner who knows a tile shouldn't be marked wrong for the language they
 * happened to recall it in.
 */
export function isCorrectTyped(tile: Tile, input: string): boolean {
  const guess = normalizeAnswer(input);
  if (!guess) return false;
  const accepted = [
    tile.chinese,
    tile.pinyin,
    tile.en.name,
    ...tile.en.aliases,
    tile.de.name,
    ...tile.de.aliases,
  ];
  return accepted.some((a) => normalizeAnswer(a) === guess);
}

/** Every string a tile can be found by, for glossary search. */
export function searchableText(tile: Tile): string[] {
  return [
    tile.chinese,
    tile.pinyin,
    tile.en.name,
    tile.de.name,
    ...tile.en.aliases,
    ...tile.de.aliases,
  ];
}
