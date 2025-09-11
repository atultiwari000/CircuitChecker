import type { FC, SVGProps } from 'react';

type IconProps = FC<SVGProps<SVGSVGElement>>;

export const ResistorIcon: IconProps = (props) => (
  <svg
    {...props}
    viewBox="0 0 100 40"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M5 20h15l10-10 10 20 10-20 10 20 10-10h15" />
  </svg>
);

export const CapacitorIcon: IconProps = (props) => (
  <svg
    {...props}
    viewBox="0 0 100 40"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M5 20h40M55 20h40" />
    <path d="M45 5v30M55 5v30" />
  </svg>
);

export const IcIcon: IconProps = (props) => (
    <svg
      {...props}
      viewBox="0 0 120 90"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="5" y="5" width="110" height="80" rx="5" fill="hsl(var(--card))" />
      <circle cx="20" cy="15" r="2" fill="hsl(var(--muted-foreground))" />
    </svg>
  );
  
