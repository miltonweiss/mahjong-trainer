"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useProgress } from "@/lib/progress-store";
import { BoltIcon, CheckIcon, FlameIcon, GearIcon } from "./icons";

/** Lessons take over the whole screen, so the shell hides itself there. */
function isImmersive(pathname: string) {
  return pathname.startsWith("/lesson") || pathname.startsWith("/session");
}

export function TopBar() {
  const pathname = usePathname();
  const { progress, ready, t } = useProgress();
  if (isImmersive(pathname) || pathname === "/settings") return null;

  const streak = ready ? progress.streak.current : 0;
  const xp = ready ? progress.dailyXp.xp : 0;
  const goal = progress.settings.dailyGoal;

  return (
    <header className="pointer-events-none sticky top-0 z-30 px-4 pt-3 pb-2">
      <div className="pointer-events-auto mx-auto flex w-fit items-center gap-2.5 rounded-full bg-white/85 p-1.5 shadow-card ring-1 ring-white/70 backdrop-blur-xl">
        <span
          className="flex h-9 items-center gap-1 rounded-full bg-gold-50 pr-3 pl-2.5"
          title={
            streak > 0
              ? t("home.streakLive", { n: streak })
              : t("home.streakStart")
          }
        >
          <FlameIcon
            className={`h-[18px] w-[18px] ${streak > 0 ? "text-gold" : "text-ink-faint"}`}
          />
          <span className="numeric text-[15px] font-semibold">{streak}</span>
        </span>
        <GoalRing
          xp={xp}
          goal={goal}
          label={`${t("home.dailyGoal")}: ${t("home.goalProgress", { done: xp, goal })}`}
        />
        <span aria-hidden className="h-6 w-px bg-line" />
        <Link
          href="/"
          className="font-display text-[17px] font-semibold tracking-tight"
        >
          Mahjong Trainer
        </Link>

        

        <span aria-hidden className="h-6 w-px bg-line" />
        <Link
          href="/settings"
          aria-label="Settings"
          className="press grid h-9 w-9 place-items-center rounded-full bg-surface text-ink-muted hover:bg-bone hover:text-ink"
        >
          <GearIcon className="h-[18px] w-[18px]" />
        </Link>
      </div>
    </header>
  );
}

/** Daily XP as a ring that closes when the goal is met. */
function GoalRing({
  xp,
  goal,
  label,
}: {
  xp: number;
  goal: number;
  label: string;
}) {
  const r = 15;
  const circumference = 2 * Math.PI * r;
  const pct = goal > 0 ? Math.min(1, xp / goal) : 0;
  const met = pct >= 1;

  return (
    <span
      role="img"
      aria-label={label}
      title={label}
      className="relative grid h-9 w-9 place-items-center"
    >
      <svg viewBox="0 0 36 36" className="absolute inset-0 -rotate-90">
        <circle
          cx="18"
          cy="18"
          r={r}
          fill="none"
          stroke="var(--color-bone)"
          strokeWidth="4"
        />
        <circle
          cx="18"
          cy="18"
          r={r}
          fill="none"
          stroke={met ? "var(--color-jade)" : "var(--color-red-600)"}
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - pct)}
          opacity={pct > 0 ? 1 : 0}
          className="transition-[stroke-dashoffset] duration-700 ease-out"
        />
      </svg>
      {met ? (
        <CheckIcon className="relative h-4 w-4 text-jade" />
      ) : (
        <BoltIcon className="relative h-4 w-4 text-red-600" />
      )}
    </span>
  );
}
