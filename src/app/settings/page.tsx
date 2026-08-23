"use client";

import Link from "next/link";
import { useState } from "react";
import { TileCard } from "@/components/TileCard";
import { ChevronLeftIcon } from "@/components/icons";
import { useProgress } from "@/lib/progress-store";
import { toggleGroup } from "@/lib/storage";
import { TILE_GROUPS, tilesInGroup } from "@/lib/tiles";
import type { GroupId, Settings } from "@/lib/types";

const GOALS = [20, 40, 60, 100];

const MODE_COPY: {
  key: keyof Settings["modes"];
  label: string;
  blurb: string;
}[] = [
  {
    key: "multipleChoice",
    label: "Multiple choice",
    blurb: "Pick the tile or the name from four options.",
  },
  {
    key: "typed",
    label: "Type the answer",
    blurb: "Write the name out. Harder, and it sticks better.",
  },
  {
    key: "matching",
    label: "Match pairs",
    blurb: "Pair four tiles with four names against the clock.",
  },
];

export default function SettingsPage() {
  const { progress, ready, updateSettings, resetProgress } = useProgress();
  const { settings } = progress;
  const [confirmReset, setConfirmReset] = useState(false);

  const enabledCount = settings.enabledGroups
    .map((g) => tilesInGroup(g).length)
    .reduce((a, b) => a + b, 0);

  const setGroup = (group: GroupId, on: boolean) => {
    updateSettings({
      enabledGroups: toggleGroup(settings.enabledGroups, group, on),
    });
  };

  const setMode = (key: keyof Settings["modes"], on: boolean) => {
    const next = { ...settings.modes, [key]: on };
    // At least one question type has to stay on or lessons have nothing to ask.
    if (!next.multipleChoice && !next.typed && !next.matching) return;
    updateSettings({ modes: next });
  };

  return (
    <div className="pb-12">
      <header className="sticky top-0 z-30 border-b border-line bg-surface/90 backdrop-blur-md">
        <div className="flex h-14 items-center gap-2 px-2">
          <Link
            href="/"
            aria-label="Back"
            className="press grid h-10 w-10 place-items-center rounded-full text-ink-muted hover:bg-white hover:text-ink"
          >
            <ChevronLeftIcon className="h-5 w-5" />
          </Link>
          <h1 className="font-display text-lg font-semibold">Settings</h1>
        </div>
      </header>

      <Section
        title="What to train"
        note={`${ready ? enabledCount : 0} tiles in your path. Switching a group off removes it from lessons, practice and wrong answers alike.`}
      >
        {TILE_GROUPS.map((group) => {
          const tiles = tilesInGroup(group.id);
          const on = settings.enabledGroups.includes(group.id);
          const isLastOn = on && settings.enabledGroups.length === 1;
          return (
            <Row
              key={group.id}
              leading={<TileCard tile={tiles[0]} size="sm" />}
              title={group.name}
              subtitle={group.blurb}
              meta={`${tiles.length} tiles`}
              on={on}
              disabled={isLastOn}
              onChange={(next) => setGroup(group.id, next)}
            />
          );
        })}
      </Section>

      <Section
        title="Question types"
        note="Mixing all three is the fastest way to make a tile stick."
      >
        {MODE_COPY.map((mode) => (
          <Row
            key={mode.key}
            title={mode.label}
            subtitle={mode.blurb}
            on={settings.modes[mode.key]}
            onChange={(next) => setMode(mode.key, next)}
          />
        ))}
      </Section>

      <Section title="Daily goal">
        <div className="flex gap-2 px-4 py-4">
          {GOALS.map((goal) => {
            const active = settings.dailyGoal === goal;
            return (
              <button
                key={goal}
                onClick={() => updateSettings({ dailyGoal: goal })}
                className={`press flex-1 rounded-xl py-3 font-display text-[15px] font-semibold ring-1 transition-colors ${
                  active
                    ? "bg-red-600 text-white ring-red-600"
                    : "bg-white text-ink-muted ring-line"
                }`}
              >
                {goal}
                <span className="ml-1 text-[11px] font-medium opacity-70">
                  XP
                </span>
              </button>
            );
          })}
        </div>
      </Section>

      <Section title="Display">
        <Row
          title="Show pinyin"
          subtitle="Romanised readings next to the Chinese name."
          on={settings.showPinyin}
          onChange={(next) => updateSettings({ showPinyin: next })}
        />
      </Section>

      <Section title="Progress">
        <div className="px-4 py-4">
          {confirmReset ? (
            <div className="rounded-xl bg-red-50 p-4 ring-1 ring-red-100">
              <p className="text-[14.5px] text-red-700">
                This clears your XP, streak, unit progress and every tile
                score. Your settings stay as they are.
              </p>
              <div className="mt-3 flex gap-2">
                <button
                  onClick={() => {
                    resetProgress();
                    setConfirmReset(false);
                  }}
                  className="press flex-1 rounded-xl bg-red-600 py-2.5 font-display text-[13px] font-semibold tracking-wide text-white uppercase"
                >
                  Reset everything
                </button>
                <button
                  onClick={() => setConfirmReset(false)}
                  className="press flex-1 rounded-xl bg-white py-2.5 font-display text-[13px] font-semibold tracking-wide text-ink uppercase ring-1 ring-line"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setConfirmReset(true)}
              className="press w-full rounded-xl bg-white py-3 font-display text-[14px] font-semibold text-red-600 ring-1 ring-line"
            >
              Reset progress
            </button>
          )}
        </div>
      </Section>

      <p className="px-5 pt-2 text-center text-[12.5px] text-ink-faint">
        Progress is stored on this device only.
      </p>
    </div>
  );
}

function Section({
  title,
  note,
  children,
}: {
  title: string;
  note?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-7">
      <h2 className="px-5 font-display text-[12px] font-semibold tracking-[0.16em] text-ink-faint uppercase">
        {title}
      </h2>
      {note && (
        <p className="mt-1.5 px-5 text-[13px] leading-relaxed text-ink-muted">
          {note}
        </p>
      )}
      <div className="mt-2.5 divide-y divide-line border-y border-line bg-white">
        {children}
      </div>
    </section>
  );
}

function Row({
  leading,
  title,
  subtitle,
  meta,
  on,
  disabled,
  onChange,
}: {
  leading?: React.ReactNode;
  title: string;
  subtitle: string;
  meta?: string;
  on: boolean;
  disabled?: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <div className="flex items-center gap-3 px-4 py-3.5">
      {leading}
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2">
          <p className="font-display text-[16px] font-medium">{title}</p>
          {meta && (
            <span className="numeric text-[12px] text-ink-faint">{meta}</span>
          )}
        </div>
        <p className="mt-0.5 text-[13px] leading-snug text-ink-muted">
          {subtitle}
        </p>
      </div>
      <Toggle
        on={on}
        disabled={disabled}
        label={title}
        onChange={() => onChange(!on)}
      />
    </div>
  );
}

function Toggle({
  on,
  disabled,
  label,
  onChange,
}: {
  on: boolean;
  disabled?: boolean;
  label: string;
  onChange: () => void;
}) {
  return (
    <button
      role="switch"
      aria-checked={on}
      aria-label={label}
      disabled={disabled}
      onClick={onChange}
      title={disabled ? "Keep at least one group switched on" : undefined}
      className={`relative h-[30px] w-[52px] shrink-0 rounded-full transition-colors disabled:opacity-45 ${
        on ? "bg-red-600" : "bg-line-strong"
      }`}
    >
      <span
        className={`absolute top-[3px] left-0 h-6 w-6 rounded-full bg-white shadow-sm transition-transform ${
          on ? "translate-x-[25px]" : "translate-x-[3px]"
        }`}
      />
    </button>
  );
}
