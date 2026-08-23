import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost" | "jade";
type Size = "md" | "lg";

const VARIANT: Record<Variant, string> = {
  primary:
    "bg-red-600 text-white shadow-[0_4px_0_0_var(--color-red-800)] hover:bg-red-500 disabled:bg-line-strong disabled:text-ink-faint disabled:shadow-[0_4px_0_0_var(--color-line-strong)]",
  jade: "bg-jade text-white shadow-[0_4px_0_0_#0a5943] hover:brightness-110",
  secondary:
    "bg-white text-ink ring-1 ring-line-strong shadow-[0_4px_0_0_var(--color-line)] hover:bg-surface",
  ghost: "bg-transparent text-ink-muted hover:text-ink",
};

const SIZE: Record<Size, string> = {
  md: "h-11 px-5 text-[15px] rounded-xl",
  lg: "h-14 px-6 text-base rounded-2xl",
};

const BASE =
  "press inline-flex w-full items-center justify-center gap-2 font-display font-semibold tracking-wide uppercase text-[0.8125rem] disabled:cursor-not-allowed";

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
