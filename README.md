# Mahjong Trainer

A Duolingo-style flashcard trainer for reading Singapore mahjong tiles from
memory — 46 tile faces across suits, honours and bonus tiles.

```bash
npm run dev
```

## Screens

| Route            | What it is                                                       |
| ---------------- | ---------------------------------------------------------------- |
| `/`              | Learning path — units grouped by suit, unlocked in order         |
| `/lesson/[unit]` | A lesson session: intro cards + mixed exercise types             |
| `/practice`      | Spaced-repetition review, weakest and most overdue tiles first   |
| `/tiles`         | Searchable glossary of every tile with mastery per tile          |
| `/stats`         | Streak calendar, XP, accuracy, mastery heat grid                 |
| `/settings`      | **What to train** — toggle tile groups, question types, goal     |

## How it fits together

Everything is data-driven from `src/lib/tiles.ts`, so switching a group on or
off in Settings is the only thing that changes what the app teaches:

- **`lib/tiles.ts`** — the 46 tiles and the 8 groups they belong to. Each tile
  carries its English name, accepted aliases for typed answers, Chinese name,
  pinyin, how many copies are in a set, and a memory hook.
- **`lib/units.ts`** — builds the learning path from the enabled groups. Suits
  are split into chunks of three plus a recap unit; honours and bonus groups
  are a single unit each.
- **`lib/exercises.ts`** — assembles a lesson: unseen tiles get an intro card
  and an easy first question, then everything drills in a mix of the question
  types the learner has enabled. Distractors are drawn from the same suit
  first, so the number actually has to be read.
- **`lib/srs.ts`** — Leitner boxes 0–5 with intervals from 0h to 14 days. A
  miss drops a tile two boxes rather than to zero.
- **`lib/progress-store.tsx`** — XP, streak, per-tile scores and settings, read
  from `localStorage` through `useSyncExternalStore`. Progress never leaves the
  device.

## Tile art

Tile faces are drawn in `components/TileFace.tsx` rather than loaded as images
or taken from the Unicode mahjong block (which renders inconsistently and turns
the red dragon into a colour emoji). Dots and bamboo are SVG shapes; characters,
winds, dragons and bonus tiles use CJK glyphs, which is what the real tiles
carry. Swapping in illustrated art later means changing this one file.

## Design

- **Clash Grotesk** for headings and numerals, **General Sans** for body text,
  both self-hosted from `public/fonts`.
- Chinese red `#c8102e` as the action colour, jade for correct answers, gold for
  streaks and bonus tiles, on a warm off-white ground. Light mode only.
