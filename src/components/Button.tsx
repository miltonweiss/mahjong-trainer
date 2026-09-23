import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost" | "jade";
type Size = "md" | "lg";

const VARIANT: Record<Variant, string> = {
  primary:
    "bg-red-600 text-white shadow-glow-red hover:bg-red-500 disabled:bg-bone disabled:text-ink-faint disabled:shadow-none",
  jade: "bg-jade text-white shadow-glow-jade hover:brightness-110",
  secondary:
    "bg-white text-ink ring-1 ring-line shadow-soft hover:bg-surface",
  ghost: "bg-transparent text-ink-muted hover:text-ink",
};

const SIZE: Record<Size, string> = {
  md: "h-12 px-5 text-[15px]",
  lg: "h-14 px-6 text-[17px]",
};

const BASE =
  "press inline-flex w-full items-center justify-center gap-2 rounded-full font-display font-semibold tracking-[-0.005em] disabled:cursor-not-allowed";

export function Button({
  variant = "primary",
  size = "lg",
  className = "",
  children,
  ...props
}: ComponentProps<"button"> & {
  variant?: Variant;
  size?: Size;
  children: ReactNode;
}) {
  return (
    <button
      className={`${BASE} ${VARIANT[variant]} ${SIZE[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function ButtonLink({
  variant = "primary",
  size = "lg",
  className = "",
  children,
  ...props
}: ComponentProps<typeof Link> & {
  variant?: Variant;
  size?: Size;
  children: ReactNode;
}) {
  return (
    <Link
      className={`${BASE} ${VARIANT[variant]} ${SIZE[size]} ${className}`}
      {...props}
    >
      {children}
    </Link>
  );
}
