import type { FC, SVGProps } from 'react';

type IconProps = FC<SVGProps<SVGSVGElement>>;

export const ResistorIcon: IconProps = (props) => (
  <svg
    {...props}
    viewBox="0 0 100 40"
    fill="none"
    stroke="currentColor"
    strokeWidth="4"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M5 20h15l10-15 10 30 10-30 10 30 10-15h15" />
  </svg>
);

export const CapacitorIcon: IconProps = (props) => (
  <svg
    {...props}
    viewBox="0 0 100 40"
    fill="none"
    stroke="currentColor"
    strokeWidth="4"
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
      viewBox="0 0 100 60"
      fill="none"
      stroke="currentColor"
      strokeWidth="4"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="5" y="5" width="90" height="50" rx="5" />
      <path d="M30 5V0M50 5V0M70 5V0" />
      <path d="M30 55v5M50 55v5M70 55v5" />
    </svg>
  );
  
