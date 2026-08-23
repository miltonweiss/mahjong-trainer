"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button, ButtonLink } from "./Button";
import { TileCard } from "./TileCard";
import { CheckIcon, ClockIcon, TargetIcon, XIcon, BoltIcon } from "./icons";
import { useProgress } from "@/lib/progress-store";
import { shuffle } from "@/lib/exercises";
import { getTile, isCorrectTyped } from "@/lib/tiles";
import type { Exercise, LessonResult, Tile } from "@/lib/types";

const XP_PER_CORRECT = 10;
const PERFECT_BONUS = 20;
const MAX_HEARTS = 5;

export interface SessionMeta {
  title: string;
  /** Where the X button and the end-of-session button lead. */
  exitHref: string;
  /** Unit id recorded on completion; practice sessions pass "". */
  unitId: string;
}

export function LessonSession({
  exercises,
  meta,
}: {
  exercises: Exercise[];
  meta: SessionMeta;
}) {
  const { recordAnswer, finishLesson } = useProgress();
  const [index, setIndex] = useState(0);
  const [answered, setAnswered] = useState<null | {
    correct: boolean;
    tile: Tile | null;
  }>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [scoredCount, setScoredCount] = useState(0);
  const [hearts, setHearts] = useState(MAX_HEARTS);
  const [finished, setFinished] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const startedAt = useRef(0);

  useEffect(() => {
    startedAt.current = Date.now();
  }, []);

  const exercise = exercises[index];
  const total = exercises.length;
  const outOfHearts = hearts <= 0;

  const complete = useCallback(
    (finalCorrect: number, finalScored: number) => {
      const perfect = finalScored > 0 && finalCorrect === finalScored;
      const xp = finalCorrect * XP_PER_CORRECT + (perfect ? PERFECT_BONUS : 0);
      const seconds = Math.round((Date.now() - startedAt.current) / 1000);
      const result: LessonResult = {
        unitId: meta.unitId,
        xp,
        correct: finalCorrect,
        total: finalScored,
        seconds,
      };
      finishLesson(result);
      setElapsed(seconds);
      setFinished(true);
    },
    [finishLesson, meta.unitId],
  );

  const submit = useCallback(
    (correct: boolean, tile: Tile | null) => {
      if (tile) recordAnswer(tile.id, correct);
      setScoredCount((n) => n + 1);
      if (correct) setCorrectCount((n) => n + 1);
      else setHearts((h) => h - 1);
      setAnswered({ correct, tile });
    },
    [recordAnswer],
  );

  const advance = useCallback(
    (nextCorrect: number, nextScored: number) => {
      setAnswered(null);
      if (index + 1 >= total) complete(nextCorrect, nextScored);
      else setIndex((i) => i + 1);
    },
    [complete, index, total],
  );

  /** Matching rounds score several tiles at once and skip the feedback sheet. */
  const submitBatch = useCallback(
    (results: { tileId: string; correct: boolean }[]) => {
      let gained = 0;
      let missed = 0;
      for (const r of results) {
        recordAnswer(r.tileId, r.correct);
        if (r.correct) gained += 1;
        else missed += 1;
      }
      setScoredCount((n) => n + results.length);
      setCorrectCount((n) => n + gained);
      if (missed > 0) setHearts((h) => h - 1);
      advance(correctCount + gained, scoredCount + results.length);
    },
    [recordAnswer, advance, correctCount, scoredCount],
  );

  const onContinue = useCallback(() => {
    advance(correctCount, scoredCount);
  }, [advance, correctCount, scoredCount]);

  // Enter advances the feedback sheet, matching the keyboard-first flow.
  useEffect(() => {
    if (!answered) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault();
        onContinue();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [answered, onContinue]);

  if (finished) {
    return (
      <SessionResults
        correct={correctCount}
        total={scoredCount}
        seconds={elapsed}
        exitHref={meta.exitHref}
      />
    );
  }

  if (outOfHearts && !answered) {
    return <OutOfHearts exitHref={meta.exitHref} />;
  }

  const progressPct = Math.round((index / total) * 100);

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-20 bg-surface/90 px-4 pt-4 pb-3 backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-lg items-center gap-3">
          <Link
            href={meta.exitHref}
            aria-label="Leave lesson"
            className="press grid h-9 w-9 shrink-0 place-items-center rounded-full text-ink-faint hover:bg-white hover:text-ink"
          >
            <XIcon className="h-5 w-5" />
          </Link>
          <div className="h-3.5 flex-1 overflow-hidden rounded-full bg-bone">
            <div
              className="h-full rounded-full bg-red-600 transition-[width] duration-300 ease-out"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <span className="flex shrink-0 items-center gap-1" aria-label={`${hearts} hearts left`}>
            <HeartIcon className="h-5 w-5 text-red-600" />
            <span className="numeric text-sm font-semibold">{hearts}</span>
          </span>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-lg flex-1 flex-col px-4 pb-40">
        {exercise.kind === "intro" && (
          <IntroCard tileId={exercise.tileId} onNext={onContinue} />
        )}
        {exercise.kind === "tile-to-name" && (
          <TileToName
            key={index}
            tileId={exercise.tileId}
            optionIds={exercise.optionIds}
            answered={answered}
            onAnswer={submit}
          />
        )}
        {exercise.kind === "name-to-tile" && (
          <NameToTile
            key={index}
            tileId={exercise.tileId}
            optionIds={exercise.optionIds}
            answered={answered}
            onAnswer={submit}
          />
        )}
        {exercise.kind === "type-answer" && (
          <TypeAnswer
            key={index}
            tileId={exercise.tileId}
            answered={answered}
            onAnswer={submit}
          />
        )}
        {exercise.kind === "match-pairs" && (
          <MatchPairs
            key={index}
            tileIds={exercise.tileIds}
            onDone={submitBatch}
          />
        )}
      </div>

      {answered && (
        <FeedbackBar
          correct={answered.correct}
          tile={answered.tile}
          onContinue={onContinue}
          lastHeart={hearts <= 0}
        />
      )}
    </div>
  );
}

/* ── Exercise: intro card ──────────────────────────────────────────────── */

function IntroCard({
  tileId,
  onNext,
}: {
  tileId: string;
  onNext: () => void;
}) {
  const tile = getTile(tileId);
  const { progress } = useProgress();
  return (
    <div className="flex flex-1 flex-col">
      <p className="mt-2 font-display text-[11px] font-semibold tracking-[0.16em] text-red-600 uppercase">
        New tile
      </p>
      <div className="mt-6 flex flex-col items-center text-center">
        <div className="animate-flip-in">
          <TileCard tile={tile} size="xl" />
        </div>
        <h1 className="mt-6 font-display text-3xl font-semibold">
          {tile.name}
        </h1>
        <p className="mt-1 flex items-baseline gap-2">
          <span className="cjk text-xl text-ink">{tile.chinese}</span>
          {progress.settings.showPinyin && (
            <span className="text-[15px] text-ink-muted italic">
              {tile.pinyin}
            </span>
          )}
        </p>
        <p className="mt-5 max-w-xs text-[15px] leading-relaxed text-ink-muted">
          {tile.note}
        </p>
        <p className="mt-4 rounded-full bg-bone px-3 py-1 text-[12.5px] text-ink-muted">
          {tile.copies} {tile.copies === 1 ? "copy" : "copies"} in a set
        </p>
      </div>
      <div className="mt-auto pt-8">
        <Button onClick={onNext}>Got it</Button>
      </div>
    </div>
  );
}

/* ── Exercise: tile → name ─────────────────────────────────────────────── */

interface AnswerState {
  correct: boolean;
  tile: Tile | null;
}

function Prompt({ children }: { children: React.ReactNode }) {
  return (
    <h1 className="mt-3 font-display text-[22px] leading-snug font-semibold">
      {children}
    </h1>
  );
}

function TileToName({
  tileId,
  optionIds,
  answered,
  onAnswer,
}: {
  tileId: string;
  optionIds: string[];
  answered: AnswerState | null;
  onAnswer: (correct: boolean, tile: Tile) => void;
}) {
  const tile = getTile(tileId);
  const [picked, setPicked] = useState<string | null>(null);

  const choose = (id: string) => {
    if (answered) return;
    setPicked(id);
    onAnswer(id === tileId, tile);
  };

  return (
    <div className="flex flex-1 flex-col">
      <Prompt>Which tile is this?</Prompt>
      <div className="my-7 flex justify-center">
        <div className="animate-pop">
          <TileCard tile={tile} size="xl" />
        </div>
      </div>
      <div className="mt-auto grid gap-2.5">
        {optionIds.map((id) => {
          const option = getTile(id);
          const state = !answered
            ? picked === id
              ? "picked"
              : "idle"
            : id === tileId
              ? "right"
              : picked === id
                ? "wrong"
                : "idle";
          return (
            <button
              key={id}
              onClick={() => choose(id)}
              disabled={!!answered}
              className={`press flex items-center justify-between rounded-2xl px-4 py-3.5 text-left ring-1 transition-colors ${OPTION_CLASS[state]}`}
            >
              <span className="font-display text-[17px] font-medium">
                {option.name}
              </span>
              <span className="cjk text-[15px] opacity-45">
                {option.chinese}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

const OPTION_CLASS: Record<string, string> = {
  idle: "bg-white ring-line shadow-[0_3px_0_0_var(--color-line)]",
  picked: "bg-red-50 ring-red-600 ring-2 shadow-none",
  right: "bg-jade-50 ring-jade ring-2 text-jade",
  wrong: "bg-red-50 ring-red-600 ring-2 text-red-700",
};

/* ── Exercise: name → tile ─────────────────────────────────────────────── */

function NameToTile({
  tileId,
  optionIds,
  answered,
  onAnswer,
}: {
  tileId: string;
  optionIds: string[];
  answered: AnswerState | null;
  onAnswer: (correct: boolean, tile: Tile) => void;
}) {
  const tile = getTile(tileId);
  const [picked, setPicked] = useState<string | null>(null);

  const choose = (id: string) => {
    if (answered) return;
    setPicked(id);
    onAnswer(id === tileId, tile);
  };

  return (
    <div className="flex flex-1 flex-col">
      <Prompt>
        Tap <span className="text-red-600">{tile.name}</span>
      </Prompt>
      <p className="mt-1 cjk text-[15px] text-ink-muted">{tile.chinese}</p>
      <div className="mt-auto grid grid-cols-2 justify-items-center gap-3 pt-8">
        {optionIds.map((id) => {
          const option = getTile(id);
          const state = !answered
            ? picked === id
              ? "selected"
              : "idle"
            : id === tileId
              ? "correct"
              : picked === id
                ? "wrong"
                : "muted";
          return (
            <button
              key={id}
              onClick={() => choose(id)}
              disabled={!!answered}
              aria-label={option.name}
              className="press rounded-[18px]"
            >
              <TileCard tile={option} size="lg" state={state} />
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ── Exercise: type the answer ─────────────────────────────────────────── */

function TypeAnswer({
  tileId,
  answered,
  onAnswer,
}: {
  tileId: string;
  answered: AnswerState | null;
  onAnswer: (correct: boolean, tile: Tile) => void;
}) {
  const tile = getTile(tileId);
  const [value, setValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const check = () => {
    if (answered || !value.trim()) return;
    onAnswer(isCorrectTyped(tile, value), tile);
  };

  return (
    <div className="flex flex-1 flex-col">
      <Prompt>Name this tile</Prompt>
      <div className="my-7 flex justify-center">
        <div className="animate-pop">
          <TileCard tile={tile} size="xl" />
        </div>
      </div>
      <div className="mt-auto">
        <input
          ref={inputRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              check();
            }
          }}
          disabled={!!answered}
          placeholder="e.g. 5 Dots"
          autoComplete="off"
          autoCapitalize="off"
          autoCorrect="off"
          spellCheck={false}
          className={`w-full rounded-2xl bg-white px-4 py-4 font-display text-lg ring-1 outline-none transition-colors placeholder:font-sans placeholder:text-[15px] placeholder:text-ink-faint ${
            answered
              ? answered.correct
                ? "ring-jade ring-2"
                : "ring-red-600 ring-2"
              : "ring-line focus:ring-red-600 focus:ring-2"
          }`}
        />
        <p className="mt-2 px-1 text-[12.5px] text-ink-faint">
          Suit and number is enough — “5 dots”, “5 pin” and “wu tong” all work.
        </p>
        <Button className="mt-4" onClick={check} disabled={!value.trim() || !!answered}>
          Check
        </Button>
      </div>
    </div>
  );
}

/* ── Exercise: match pairs ─────────────────────────────────────────────── */

function MatchPairs({
  tileIds,
  onDone,
}: {
  tileIds: string[];
  onDone: (results: { tileId: string; correct: boolean }[]) => void;
}) {
  const tiles = useMemo(() => tileIds.map(getTile), [tileIds]);
  const [nameOrder] = useState(() => shuffle(tileIds));
  const [selectedTile, setSelectedTile] = useState<string | null>(null);
  const [selectedName, setSelectedName] = useState<string | null>(null);
  const [matched, setMatched] = useState<string[]>([]);
  const [flashWrong, setFlashWrong] = useState(false);
  const missed = useRef(new Set<string>());
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    const pending = timers.current;
    return () => pending.forEach(clearTimeout);
  }, []);

  const later = (fn: () => void, ms: number) => {
    timers.current.push(setTimeout(fn, ms));
  };

  /** Runs on the second tap of a pair, once both halves are known. */
  const resolve = (tileId: string | null, nameId: string | null) => {
    if (tileId == null || nameId == null) return;
    if (tileId === nameId) {
      const next = [...matched, tileId];
      setMatched(next);
      setSelectedTile(null);
      setSelectedName(null);
      if (next.length === tileIds.length) {
        later(
          () =>
            onDone(
              tileIds.map((id) => ({
                tileId: id,
                correct: !missed.current.has(id),
              })),
            ),
          420,
        );
      }
      return;
    }
    missed.current.add(tileId);
    setFlashWrong(true);
    later(() => {
      setFlashWrong(false);
      setSelectedTile(null);
      setSelectedName(null);
    }, 480);
  };

  const chooseTile = (id: string) => {
    if (flashWrong || matched.includes(id)) return;
    setSelectedTile(id);
    resolve(id, selectedName);
  };

  const chooseName = (id: string) => {
    if (flashWrong || matched.includes(id)) return;
    setSelectedName(id);
    resolve(selectedTile, id);
  };

  return (
    <div className="flex flex-1 flex-col">
      <Prompt>Match each tile to its name</Prompt>
      <div className="mt-8 grid grid-cols-2 gap-4">
        <div className="flex flex-col items-center gap-3">
          {tiles.map((tile) => {
            const isMatched = matched.includes(tile.id);
            const isSelected = selectedTile === tile.id;
            return (
              <button
                key={tile.id}
                onClick={() => chooseTile(tile.id)}
                disabled={isMatched}
                aria-label={tile.name}
                className={`press rounded-[16px] ${
                  isSelected && flashWrong ? "animate-shake" : ""
                }`}
              >
                <TileCard
                  tile={tile}
                  size="md"
                  state={
                    isMatched
                      ? "muted"
                      : isSelected
                        ? flashWrong
                          ? "wrong"
                          : "selected"
                        : "idle"
                  }
                />
              </button>
            );
          })}
        </div>
        <div className="flex flex-col justify-around gap-3">
          {nameOrder.map((id) => {
            const tile = getTile(id);
            const isMatched = matched.includes(id);
            const isSelected = selectedName === id;
            return (
              <button
                key={id}
                onClick={() => chooseName(id)}
                disabled={isMatched}
                className={`press flex h-[74px] items-center justify-center rounded-2xl px-3 text-center font-display text-[15px] font-medium ring-1 transition-colors ${
                  isMatched
                    ? "bg-jade-50 text-jade ring-jade-100"
                    : isSelected
                      ? flashWrong
                        ? "animate-shake bg-red-50 text-red-700 ring-2 ring-red-600"
                        : "bg-red-50 ring-2 ring-red-600"
                      : "bg-white ring-line shadow-[0_3px_0_0_var(--color-line)]"
                }`}
              >
                {tile.name}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ── Feedback ──────────────────────────────────────────────────────────── */

function FeedbackBar({
  correct,
  tile,
  onContinue,
  lastHeart,
}: {
  correct: boolean;
  tile: Tile | null;
  onContinue: () => void;
  lastHeart: boolean;
}) {
  return (
    <div
      className={`animate-slide-up fixed inset-x-0 bottom-0 z-30 border-t pb-[env(safe-area-inset-bottom)] ${
        correct ? "border-jade-100 bg-jade-50" : "border-red-100 bg-red-50"
      }`}
    >
      <div className="mx-auto w-full max-w-lg px-4 py-4">
        <div className="flex items-start gap-3">
          <span
            className={`mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full ${
              correct ? "bg-jade text-white" : "bg-red-600 text-white"
            }`}
          >
            {correct ? (
              <CheckIcon className="h-4 w-4" />
            ) : (
              <XIcon className="h-4 w-4" />
            )}
          </span>
          <div className="min-w-0 flex-1">
            <p
              className={`font-display text-lg font-semibold ${
                correct ? "text-jade" : "text-red-700"
              }`}
            >
              {correct ? "Correct" : tile ? tile.name : "Not quite"}
            </p>
            {tile && (
              <p
                className={`text-[13.5px] leading-snug ${
                  correct ? "text-jade/80" : "text-red-700/80"
                }`}
              >
                {correct ? tile.note : `${tile.chinese} · ${tile.pinyin}`}
              </p>
            )}
          </div>
        </div>
        <Button
          className="mt-3.5"
          variant={correct ? "jade" : "primary"}
          onClick={onContinue}
        >
          {lastHeart ? "Out of hearts" : "Continue"}
        </Button>
      </div>
    </div>
  );
}

/* ── End states ────────────────────────────────────────────────────────── */

function SessionResults({
  correct,
  total,
  seconds,
  exitHref,
}: {
  correct: number;
  total: number;
  seconds: number;
  exitHref: string;
}) {
  const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;
  const perfect = total > 0 && correct === total;
  const xp = correct * XP_PER_CORRECT + (perfect ? PERFECT_BONUS : 0);

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-lg flex-col px-5 py-10">
      <div className="flex flex-1 flex-col items-center justify-center text-center">
        <span className="animate-pop grid h-20 w-20 place-items-center rounded-full bg-red-600 text-white shadow-card">
          <CheckIcon className="h-9 w-9" />
        </span>
        <h1 className="mt-6 font-display text-3xl font-semibold">
          {perfect ? "Flawless round" : "Lesson complete"}
        </h1>
        <p className="mt-2 max-w-xs text-[15px] text-ink-muted">
          {perfect
            ? "Every tile read correctly — that set is yours."
            : "Missed tiles come back sooner in practice."}
        </p>

        <div className="mt-8 grid w-full gap-2.5">
          <ResultRow
            icon={<BoltIcon className="h-4 w-4 text-red-600" />}
            label="XP earned"
            value={`+${xp}`}
          />
          <ResultRow
            icon={<TargetIcon className="h-4 w-4 text-jade" />}
            label="Accuracy"
            value={`${accuracy}%`}
          />
          <ResultRow
            icon={<ClockIcon className="h-4 w-4 text-gold" />}
            label="Time"
            value={formatTime(seconds)}
          />
        </div>
      </div>
      <ButtonLink href={exitHref}>Continue</ButtonLink>
    </div>
  );
}

function ResultRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between rounded-2xl bg-white px-4 py-3.5 ring-1 ring-line">
      <span className="flex items-center gap-2.5 text-[15px] text-ink-muted">
        {icon}
        {label}
      </span>
      <span className="numeric text-[17px] font-semibold">{value}</span>
    </div>
  );
}

function OutOfHearts({ exitHref }: { exitHref: string }) {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-lg flex-col items-center justify-center gap-4 px-5 text-center">
      <HeartIcon className="h-12 w-12 text-red-600" />
      <h1 className="font-display text-2xl font-semibold">Out of hearts</h1>
      <p className="max-w-xs text-[15px] text-ink-muted">
        Take another run at this set — the tiles you missed will come up first.
      </p>
      <div className="mt-4 grid w-full gap-2.5">
        <Button onClick={() => window.location.reload()}>Try again</Button>
        <ButtonLink href={exitHref} variant="secondary">
          Back to path
        </ButtonLink>
      </div>
    </div>
  );
}

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${`${s}`.padStart(2, "0")}`;
}

function HeartIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M12 20.7 4.6 13.4a5 5 0 0 1 7-7.1l.4.4.4-.4a5 5 0 1 1 7 7.1L12 20.7Z" />
    </svg>
  );
}
