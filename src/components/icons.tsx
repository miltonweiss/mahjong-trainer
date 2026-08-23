import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

function Icon({ children, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {children}
    </svg>
  );
}

export const FlameIcon = (props: IconProps) => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
    <path d="M12 2c.4 3.1-1.2 4.6-2.7 6C7.6 9.5 6 11 6 14a6 6 0 0 0 12 0c0-2.4-1-4-2.2-5.4-.5 1-1.2 1.6-2 1.9.5-2.6-.6-6-1.8-8.5Zm0 18a3 3 0 0 1-3-3c0-1.4.8-2.2 1.6-3 .4 1 1 1.5 1.7 1.8-.2-1.4.3-2.7.9-3.6.9 1 1.8 2.3 1.8 4.1a3 3 0 0 1-3 3Z" />
  </svg>
);

export const BoltIcon = (props: IconProps) => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
    <path d="M13.5 2 4 13.2c-.4.5 0 1.3.7 1.3H10l-1.5 7.2c-.2.8.8 1.3 1.3.7L20 11.2c.4-.5 0-1.3-.7-1.3H14l1.5-7.2c.2-.8-.8-1.3-1.3-.7Z" />
  </svg>
);

export const HomeIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M3 10.5 12 3l9 7.5" />
    <path d="M5.5 9.5V20h13V9.5" />
    <path d="M9.5 20v-5.5h5V20" />
  </Icon>
);

export const RepeatIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M4 11a8 8 0 0 1 13.7-5.6L21 8" />
    <path d="M21 4v4h-4" />
    <path d="M20 13a8 8 0 0 1-13.7 5.6L3 16" />
    <path d="M3 20v-4h4" />
  </Icon>
);

export const GridIcon = (props: IconProps) => (
  <Icon {...props}>
    <rect x="3.5" y="3.5" width="7" height="7" rx="1.5" />
    <rect x="13.5" y="3.5" width="7" height="7" rx="1.5" />
    <rect x="3.5" y="13.5" width="7" height="7" rx="1.5" />
    <rect x="13.5" y="13.5" width="7" height="7" rx="1.5" />
  </Icon>
);

export const ChartIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M5 20V11" />
    <path d="M12 20V4" />
    <path d="M19 20v-6" />
  </Icon>
);

export const GearIcon = (props: IconProps) => (
  <Icon {...props}>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-1.8-.3 1.6 1.6 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1A1.6 1.6 0 0 0 9 19.4a1.6 1.6 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0 .3-1.8 1.6 1.6 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1A1.6 1.6 0 0 0 4.6 9a1.6 1.6 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 1.8.3H9a1.6 1.6 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.6 1.6 0 0 0 1 1.5 1.6 1.6 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.8V9a1.6 1.6 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1Z" />
  </Icon>
);

export const CheckIcon = (props: IconProps) => (
  <Icon strokeWidth={3} {...props}>
    <path d="M4.5 12.5 9.5 17.5 19.5 7" />
  </Icon>
);

export const XIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M6 6l12 12M18 6 6 18" />
  </Icon>
);

export const LockIcon = (props: IconProps) => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
    <path d="M7 10V7.5a5 5 0 0 1 10 0V10h.5A2.5 2.5 0 0 1 20 12.5v6A2.5 2.5 0 0 1 17.5 21h-11A2.5 2.5 0 0 1 4 18.5v-6A2.5 2.5 0 0 1 6.5 10H7Zm2.5 0h5V7.5a2.5 2.5 0 0 0-5 0V10Z" />
  </svg>
);

export const StarIcon = (props: IconProps) => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
    <path d="m12 2.6 2.9 5.9 6.5.9-4.7 4.6 1.1 6.5-5.8-3-5.8 3 1.1-6.5L2.6 9.4l6.5-.9L12 2.6Z" />
  </svg>
);

export const SearchIcon = (props: IconProps) => (
  <Icon {...props}>
    <circle cx="11" cy="11" r="6.5" />
    <path d="m16 16 4.5 4.5" />
  </Icon>
);

export const ChevronLeftIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M14.5 5 8 12l6.5 7" />
  </Icon>
);

export const ChevronRightIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M9.5 5 16 12l-6.5 7" />
  </Icon>
);

export const TargetIcon = (props: IconProps) => (
  <Icon {...props}>
    <circle cx="12" cy="12" r="8.5" />
    <circle cx="12" cy="12" r="4.5" />
    <circle cx="12" cy="12" r="1" fill="currentColor" />
  </Icon>
);

export const ClockIcon = (props: IconProps) => (
  <Icon {...props}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 7.5V12l3 2" />
  </Icon>
);
