"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button, ButtonLink } from "./Button";
import { HandRow } from "./HandRow";
import { TileCard } from "./TileCard";
import { BoltIcon, CheckIcon, ClockIcon, TargetIcon, XIcon } from "./icons";
import { useProgress } from "@/lib/progress-store";
import { shuffle } from "@/lib/exercises";
import { getTile, isCorrectTyped, tileName, tileNote } from "@/lib/tiles";
import type { StringKey, Translate } from "@/lib/i18n";
import type { Exercise, LessonResult, SetKind, Tile } from "@/lib/types";

const XP_PER_CORRECT = 10;
const PERFECT_BONUS = 20;
const MAX_HEARTS = 5;

export interface SessionMeta {
  /** Where the X button and the end-of-session button lead. */
  exitHref: string;
  /** Unit id recorded on completion; practice sessions pass "". */
  unitId: string;
}

/** What a graded answer reports back: right or wrong, and what was picked. */
interface AnswerState {
  correct: boolean;
  tile: Tile | null;
  /** Explanation shown in the feedback bar when there's no tile to name. */
  detail?: string;
  title?: string;
}

export function LessonSession({
  exercises,
  meta,
}: {
  exercises: Exercise[];
  meta: SessionMeta;
}) {
  const { recordAnswer, finishLesson, t, progress } = useProgress();
  const lang = progress.settings.lang;
  const [index, setIndex] = useState(0);
  const [answered, setAnswered] = useState<AnswerState | null>(null);
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
    (state: AnswerState, mistakenFor?: string) => {
      if (state.tile) recordAnswer(state.tile.id, state.correct, mistakenFor);
      setScoredCount((n) => n + 1);
      if (state.correct) setCorrectCount((n) => n + 1);
      else setHearts((h) => h - 1);
      setAnswered(state);
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
  const immersivePad = exercise.kind === "intro" ? "pb-8" : "pb-40";

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-20 bg-surface/90 px-4 pt-4 pb-3 backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-lg items-center gap-3">
          <Link
            href={meta.exitHref}
            aria-label={t("lesson.leave")}
            className="press grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white text-ink-muted shadow-soft hover:text-ink"
          >
            <XIcon className="h-5 w-5" />
          </Link>
          <div className="h-3 flex-1 overflow-hidden rounded-full bg-bone">
            <div
              className="h-full rounded-full bg-gradient-to-r from-red-500 to-red-600 transition-[width] duration-500 ease-out"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <span
            className="flex shrink-0 items-center gap-1"
            aria-label={t("lesson.hearts", { n: hearts })}
          >
            <HeartIcon className="h-5 w-5 text-red-600" />
            <span className="numeric text-sm font-semibold">{hearts}</span>
          </span>
        </div>
      </header>

      <div
        className={`mx-auto flex w-full max-w-lg flex-1 flex-col px-4 ${immersivePad}`}
      >
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
        {exercise.kind === "name-set" && (
          <NameSet
            key={index}
            tileIds={exercise.tileIds}
            answer={exercise.answer}
            options={exercise.options}
            answered={answered}
            onAnswer={submit}
          />
        )}
        {exercise.kind === "complete-hand" && (
          <CompleteHand
            key={index}
            handIds={exercise.handIds}
            answerId={exercise.answerId}
            optionIds={exercise.optionIds}
            answered={answered}
            onAnswer={submit}
          />
        )}
      </div>

      {answered && (
        <FeedbackBar
          state={answered}
          lang={lang}
          t={t}
          onContinue={onContinue}
          lastHeart={hearts <= 0}
        />
      )}
    </div>
  );
}

type Submit = (state: AnswerState, mistakenFor?: string) => void;

/* ── Shared bits ───────────────────────────────────────────────────────── */

function Prompt({ children }: { children: React.ReactNode }) {
  return (
    <h1 className="mt-4 font-display text-[26px] leading-tight font-semibold">
      {children}
    </h1>
  );
}

const OPTION_CLASS: Record<string, string> = {
  idle: "bg-white ring-transparent shadow-soft hover:ring-line",
  picked: "bg-red-50 ring-red-600 ring-2 shadow-none",
  right: "bg-jade-50 ring-jade ring-2 text-jade",
  wrong: "bg-red-50 ring-red-600 ring-2 text-red-700",
};

function optionState(
  answered: AnswerState | null,
  id: string,
  correctId: string,
  picked: string | null,
) {
  if (!answered) return picked === id ? "picked" : "idle";
  if (id === correctId) return "right";
  return picked === id ? "wrong" : "idle";
}

/* ── Exercise: intro card ──────────────────────────────────────────────── */

function IntroCard({ tileId, onNext }: { tileId: string; onNext: () => void }) {
  const { progress, t } = useProgress();
  const tile = getTile(tileId);
  const lang = progress.settings.lang;
  return (
    <div className="flex flex-1 flex-col">
      <p className="mt-3 self-center rounded-full bg-red-50 px-4 py-1.5 font-display text-[14px] font-semibold text-red-600">
        {t("lesson.newTile")}
      </p>
      <div className="mt-6 flex flex-col items-center text-center">
        <div className="animate-flip-in">
          <TileCard tile={tile} size="xl" />
        </div>
        <h1 className="mt-7 font-display text-[34px] leading-tight font-semibold">
          {tileName(tile, lang)}
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
          {tileNote(tile, lang)}
        </p>
        <p className="mt-4 rounded-full bg-white px-4 py-1.5 text-[13.5px] text-ink-muted shadow-soft">
          {tile.copies === 1
            ? t("lesson.copiesOne")
            : t("lesson.copiesMany", { n: tile.copies })}
        </p>
      </div>
      <div className="mt-auto pt-8">
        <Button onClick={onNext}>{t("lesson.gotIt")}</Button>
      </div>
    </div>
  );
}

/* ── Exercise: tile → name ─────────────────────────────────────────────── */

function TileToName({
  tileId,
  optionIds,
  answered,
  onAnswer,
}: {
  tileId: string;
  optionIds: string[];
  answered: AnswerState | null;
  onAnswer: Submit;
}) {
  const { progress, t } = useProgress();
  const lang = progress.settings.lang;
  const tile = getTile(tileId);
  const [picked, setPicked] = useState<string | null>(null);

  const choose = (id: string) => {
    if (answered) return;
    setPicked(id);
    const correct = id === tileId;
    onAnswer({ correct, tile }, correct ? undefined : id);
  };

  return (
    <div className="flex flex-1 flex-col">
      <Prompt>{t("lesson.whichTile")}</Prompt>
      <div className="my-7 flex justify-center">
        <div className="animate-pop">
          <TileCard tile={tile} size="xl" />
        </div>
      </div>
      <div className="mt-auto grid gap-2.5">
        {optionIds.map((id) => {
          const option = getTile(id);
          const state = optionState(answered, id, tileId, picked);
          return (
            <button
              key={id}
              onClick={() => choose(id)}
              disabled={!!answered}
              className={`press flex items-center justify-center rounded-[20px] px-5 py-4 text-center font-display text-[17px] font-semibold ring-1 transition-colors ${OPTION_CLASS[state]}`}
            >
              {tileName(option, lang)}
            </button>
          );
        })}
      </div>
    </div>
  );
}

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
  onAnswer: Submit;
}) {
  const { progress, t } = useProgress();
  const lang = progress.settings.lang;
  const tile = getTile(tileId);
  const [picked, setPicked] = useState<string | null>(null);

  const choose = (id: string) => {
    if (answered) return;
    setPicked(id);
    const correct = id === tileId;
    onAnswer({ correct, tile }, correct ? undefined : id);
  };

  return (
    <div className="flex flex-1 flex-col">
      <Prompt>
        {t("lesson.tap")}{" "}
        <span className="text-red-600">{tileName(tile, lang)}</span>
      </Prompt>
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
              aria-label={tileName(option, lang)}
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
  onAnswer: Submit;
}) {
  const { t } = useProgress();
  const tile = getTile(tileId);
  const [value, setValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const check = () => {
    if (answered || !value.trim()) return;
    onAnswer({ correct: isCorrectTyped(tile, value), tile });
  };

  return (
    <div className="flex flex-1 flex-col">
      <Prompt>{t("lesson.nameThis")}</Prompt>
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
          placeholder={t("lesson.typePlaceholder")}
          autoComplete="off"
          autoCapitalize="off"
          autoCorrect="off"
          spellCheck={false}
          className={`w-full rounded-[20px] bg-white px-5 py-4 font-display text-lg shadow-soft ring-1 outline-none transition-colors placeholder:font-sans placeholder:text-[15px] placeholder:text-ink-faint ${
            answered
              ? answered.correct
                ? "ring-jade ring-2"
                : "ring-2 ring-red-600"
              : "ring-transparent focus:ring-2 focus:ring-red-200"
          }`}
        />
        <p className="mt-2 px-1 text-[12.5px] text-ink-faint">
          {t("lesson.typeHint")}
        </p>
        <Button
          className="mt-4"
          onClick={check}
          disabled={!value.trim() || !!answered}
        >
          {t("lesson.check")}
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
  const { progress, t } = useProgress();
  const lang = progress.settings.lang;
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
      <Prompt>{t("lesson.match")}</Prompt>
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
                aria-label={tileName(tile, lang)}
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
                className={`press flex h-[74px] items-center justify-center rounded-[20px] px-3 text-center font-display text-[15px] font-semibold ring-1 transition-colors ${
                  isMatched
                    ? "bg-jade-50 text-jade ring-jade-100"
                    : isSelected
                      ? flashWrong
                        ? "animate-shake bg-red-50 text-red-700 ring-2 ring-red-600"
                        : "bg-red-50 ring-2 ring-red-600"
                      : "bg-white ring-transparent shadow-soft"
                }`}
              >
                {tileName(tile, lang)}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ── Exercise: name the set ────────────────────────────────────────────── */

const SET_LABEL: Record<SetKind, StringKey> = {
  pair: "set.pair",
  pung: "set.pung",
  kong: "set.kong",
  chow: "set.chow",
  none: "set.none",
};

const SET_HINT: Record<SetKind, StringKey> = {
  pair: "set.pairHint",
  pung: "set.pungHint",
  kong: "set.kongHint",
  chow: "set.chowHint",
  none: "set.noneHint",
};

function NameSet({
  tileIds,
  answer,
  options,
  answered,
  onAnswer,
}: {
  tileIds: string[];
  answer: SetKind;
  options: SetKind[];
  answered: AnswerState | null;
  onAnswer: Submit;
}) {
  const { t } = useProgress();
  const [picked, setPicked] = useState<SetKind | null>(null);

  const choose = (kind: SetKind) => {
    if (answered) return;
    setPicked(kind);
    onAnswer({
      correct: kind === answer,
      tile: null,
      title: t(SET_LABEL[answer]),
      detail: t(SET_HINT[answer]),
    });
  };

  return (
    <div className="flex flex-1 flex-col">
      <Prompt>{t("hand.namePrompt")}</Prompt>
      <div className="my-9">
        <HandRow tileIds={tileIds} />
      </div>
      <div className="mt-auto grid grid-cols-2 gap-2.5">
        {options.map((kind) => {
          const state = optionState(answered, kind, answer, picked);
          return (
            <button
              key={kind}
              onClick={() => choose(kind)}
              disabled={!!answered}
              className={`press rounded-[20px] px-4 py-4 font-display text-[17px] font-semibold ring-1 transition-colors ${OPTION_CLASS[state]}`}
            >
              {t(SET_LABEL[kind])}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ── Exercise: complete the hand ───────────────────────────────────────── */

function CompleteHand({
  handIds,
  answerId,
  optionIds,
  answered,
  onAnswer,
}: {
  handIds: string[];
  answerId: string;
  optionIds: string[];
  answered: AnswerState | null;
  onAnswer: Submit;
}) {
  const { progress, t } = useProgress();
  const lang = progress.settings.lang;
  const [picked, setPicked] = useState<string | null>(null);
  const answerTile = getTile(answerId);

  const choose = (id: string) => {
    if (answered) return;
    setPicked(id);
    onAnswer({
      correct: id === answerId,
      tile: null,
      title: tileName(answerTile, lang),
      detail: t("hand.completeHint"),
    });
  };

  return (
    <div className="flex flex-1 flex-col">
      <Prompt>{t("hand.completePrompt")}</Prompt>
      <div className="my-6 rounded-[24px] bg-white p-4 shadow-soft">
        <HandRow tileIds={handIds} />
      </div>
      <div className="mt-auto grid grid-cols-4 justify-items-center gap-2">
        {optionIds.map((id) => {
          const option = getTile(id);
          const state = !answered
            ? picked === id
              ? "selected"
              : "idle"
            : id === answerId
              ? "correct"
              : picked === id
                ? "wrong"
                : "muted";
          return (
            <button
              key={id}
              onClick={() => choose(id)}
              disabled={!!answered}
              aria-label={tileName(option, lang)}
              className="press w-full rounded-[14px]"
            >
              <TileCard tile={option} size="md" state={state} className="w-full" />
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ── Feedback ──────────────────────────────────────────────────────────── */

function FeedbackBar({
  state,
  lang,
  t,
  onContinue,
  lastHeart,
}: {
  state: AnswerState;
  lang: "en" | "de";
  t: Translate;
  onContinue: () => void;
  lastHeart: boolean;
}) {
  const { correct, tile } = state;
  const title = correct
    ? t("lesson.correct")
    : (state.title ?? (tile ? tileName(tile, lang) : t("lesson.notQuite")));
  const detail = correct
    ? (tile ? tileNote(tile, lang) : state.detail)
    : (state.detail ?? (tile ? `${tile.chinese} · ${tile.pinyin}` : undefined));

  return (
    <div
      className={`animate-slide-up fixed inset-x-0 bottom-0 z-30 rounded-t-[32px] pb-[env(safe-area-inset-bottom)] shadow-[0_-12px_40px_-16px_rgb(80_50_30/0.25)] ${
        correct ? "bg-jade-50" : "bg-red-50"
      }`}
    >
      <div className="mx-auto w-full max-w-lg px-5 pt-5 pb-4">
        <div className="flex items-start gap-3.5">
          <span
            className={`grid h-11 w-11 shrink-0 place-items-center rounded-full text-white ${
              correct ? "bg-jade shadow-glow-jade" : "bg-red-600 shadow-glow-red"
            }`}
          >
            {correct ? (
              <CheckIcon className="h-5 w-5" />
            ) : (
              <XIcon className="h-5 w-5" />
            )}
          </span>
          <div className="min-w-0 flex-1">
            <p
              className={`font-display text-xl font-semibold ${
                correct ? "text-jade" : "text-red-700"
              }`}
            >
              {title}
            </p>
            {detail && (
              <p
                className={`mt-0.5 text-[14px] leading-snug ${
                  correct ? "text-jade/80" : "text-red-700/80"
                }`}
              >
                {detail}
              </p>
            )}
          </div>
        </div>
        <Button
          className="mt-4"
          variant={correct ? "jade" : "primary"}
          onClick={onContinue}
        >
          {lastHeart ? t("lesson.outOfHearts") : t("lesson.continue")}
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
  const { t } = useProgress();
  const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;
  const perfect = total > 0 && correct === total;
  const xp = correct * XP_PER_CORRECT + (perfect ? PERFECT_BONUS : 0);

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-lg flex-col px-5 py-10">
      <div className="flex flex-1 flex-col items-center justify-center text-center">
        <span className="animate-pop grid h-24 w-24 place-items-center rounded-full bg-gradient-to-br from-red-500 to-red-600 text-white shadow-glow-red ring-8 ring-red-50">
          <CheckIcon className="h-10 w-10" />
        </span>
        <h1 className="mt-7 font-display text-[34px] leading-tight font-semibold">
          {perfect ? t("lesson.flawless") : t("lesson.complete")}
        </h1>
        <p className="mt-2 max-w-xs text-[15px] text-ink-muted">
          {perfect ? t("lesson.flawlessBlurb") : t("lesson.completeBlurb")}
        </p>

        <div className="mt-8 grid w-full gap-2.5">
          <ResultRow
            icon={<BoltIcon className="h-4 w-4 text-red-600" />}
            label={t("lesson.xpEarned")}
            value={`+${xp}`}
          />
          <ResultRow
            icon={<TargetIcon className="h-4 w-4 text-jade" />}
            label={t("lesson.accuracy")}
            value={`${accuracy}%`}
          />
          <ResultRow
            icon={<ClockIcon className="h-4 w-4 text-gold" />}
            label={t("lesson.time")}
            value={formatTime(seconds)}
          />
        </div>
      </div>
      <ButtonLink href={exitHref}>{t("lesson.continue")}</ButtonLink>
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
    <div className="flex items-center justify-between rounded-[20px] bg-white px-5 py-4 shadow-soft">
      <span className="flex items-center gap-2.5 text-[15px] text-ink-muted">
        {icon}
        {label}
      </span>
      <span className="numeric text-[17px] font-semibold">{value}</span>
    </div>
  );
}

function OutOfHearts({ exitHref }: { exitHref: string }) {
  const { t } = useProgress();
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-lg flex-col items-center justify-center gap-4 px-5 text-center">
      <HeartIcon className="h-12 w-12 text-red-600" />
      <h1 className="font-display text-2xl font-semibold">
        {t("lesson.outOfHearts")}
      </h1>
      <p className="max-w-xs text-[15px] text-ink-muted">
        {t("lesson.outOfHeartsBlurb")}
      </p>
      <div className="mt-4 grid w-full gap-2.5">
        <Button onClick={() => window.location.reload()}>
          {t("lesson.tryAgain")}
        </Button>
        <ButtonLink href={exitHref} variant="secondary">
          {t("lesson.backToPath")}
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

export function HeartIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M12 20.7 4.6 13.4a5 5 0 0 1 7-7.1l.4.4.4-.4a5 5 0 1 1 7 7.1L12 20.7Z" />
    </svg>
  );
}
