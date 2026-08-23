"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useProgress } from "@/lib/progress-store";
import {
  BoltIcon,
  ChartIcon,
  FlameIcon,
  GearIcon,
  GridIcon,
  HomeIcon,
  RepeatIcon,
} from "./icons";

const NAV = [
  { href: "/", label: "Learn", Icon: HomeIcon },
  { href: "/practice", label: "Practice", Icon: RepeatIcon },
  { href: "/tiles", label: "Tiles", Icon: GridIcon },
  { href: "/stats", label: "Stats", Icon: ChartIcon },
] as const;

/** Lessons take over the whole screen, so the shell hides itself there. */
function isImmersive(pathname: string) {
  return pathname.startsWith("/lesson") || pathname.startsWith("/session");
}

export function TopBar() {
  const pathname = usePathname();
  const { progress, ready } = useProgress();
  if (isImmersive(pathname) || pathname === "/settings") return null;

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-surface/85 backdrop-blur-md">
      <div className="mx-auto flex h-14 w-full max-w-lg items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2">
          <span className="grid h-7 w-7 place-items-center rounded-md bg-red-600 font-display text-sm font-semibold text-white">
            麻
          </span>
          <span className="font-display text-[15px] font-semibold tracking-tight">
            Mahjong Trainer
          </span>
        </Link>
        <div className="flex items-center gap-1.5">
          <Stat
            icon={<FlameIcon className="h-4 w-4 text-gold" />}
            value={ready ? progress.streak.current : 0}
          />
          <Stat
            icon={<BoltIcon className="h-4 w-4 text-red-600" />}
            value={ready ? progress.xp : 0}
          />
          <Link
            href="/settings"
            aria-label="Settings"
            className="press ml-1 grid h-9 w-9 place-items-center rounded-full text-ink-muted ring-1 ring-line hover:bg-white hover:text-ink"
          >
            <GearIcon className="h-[18px] w-[18px]" />
          </Link>
        </div>
      </div>
    </header>
  );
}

function Stat({ icon, value }: { icon: React.ReactNode; value: number }) {
  return (
    <span className="flex items-center gap-1 rounded-full bg-white px-2.5 py-1.5 ring-1 ring-line">
      {icon}
      <span className="numeric text-sm font-semibold">{value}</span>
    </span>
  );
}

export function BottomNav() {
  const pathname = usePathname();
  if (isImmersive(pathname)) return null;

  return (
    <nav className="sticky bottom-0 z-30 border-t border-line bg-white/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-md">
      <div className="mx-auto flex w-full max-w-lg items-stretch justify-around px-2">
        {NAV.map(({ href, label, Icon }) => {
          const active =
            href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-1 flex-col items-center gap-1 py-2.5 transition-colors ${
                active ? "text-red-600" : "text-ink-faint hover:text-ink-muted"
              }`}
            >
              <Icon className="h-[22px] w-[22px]" />
              <span
                className={`font-display text-[11px] tracking-wide uppercase ${
                  active ? "font-semibold" : "font-medium"
                }`}
              >
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
