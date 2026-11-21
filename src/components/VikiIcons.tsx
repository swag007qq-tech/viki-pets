import type { SVGProps } from 'react';

export function HomeIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M11.35 3.35a1 1 0 0 1 1.3 0l7.5 6.45a1 1 0 0 1 .35.76V19a2 2 0 0 1-2 2h-3.75a.75.75 0 0 1-.75-.75v-4.5a1.5 1.5 0 0 0-1.5-1.5h-1a1.5 1.5 0 0 0-1.5 1.5v4.5a.75.75 0 0 1-.75.75H5.5a2 2 0 0 1-2-2v-8.44a1 1 0 0 1 .35-.76l7.5-6.45Z" />
    </svg>
  );
}

export function ChatDotsIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <path d="M12 3.75c4.83 0 8.75 3.37 8.75 7.53 0 4.16-3.92 7.52-8.75 7.52-1.28 0-2.5-.24-3.6-.66L4.25 20l1.1-3.44C4.04 15.22 3.25 13.34 3.25 11.28c0-4.16 3.92-7.53 8.75-7.53Z" />
      <circle cx="8.75" cy="11.3" r="1" fill="currentColor" stroke="none" />
      <circle cx="12" cy="11.3" r="1" fill="currentColor" stroke="none" />
      <circle cx="15.25" cy="11.3" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function ShieldCheckIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <path d="M12 3.25 4.75 6.3v5.45c0 4.66 3.08 8.78 7.25 9.95 4.17-1.17 7.25-5.29 7.25-9.95V6.3L12 3.25Z" />
      <path d="m8.75 12.2 2.25 2.25 4.5-4.5" />
    </svg>
  );
}

export function HeartOutlineIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <path d="M12 20.25s-7.5-4.55-9.25-9.05C1.5 7.95 3.7 4.75 7 4.75c2.05 0 3.75 1.15 5 2.75 1.25-1.6 2.95-2.75 5-2.75 3.3 0 5.5 3.2 4.25 6.45-1.75 4.5-9.25 9.05-9.25 9.05Z" />
    </svg>
  );
}

export function CartOutlineIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <path d="M3 4.5h2.35a1 1 0 0 1 .97.76L7.1 8.5m0 0h12.65a.9.9 0 0 1 .87 1.13l-1.45 5.45a1.5 1.5 0 0 1-1.45 1.12H9.05a1.5 1.5 0 0 1-1.46-1.14L7.1 8.5Z" />
      <circle cx="9.75" cy="19.5" r="1.25" fill="currentColor" stroke="none" />
      <circle cx="17.25" cy="19.5" r="1.25" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function MusicNoteIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M19.25 3.5a.75.75 0 0 0-.9-.73l-9 2.1a.75.75 0 0 0-.6.73v9.7a3.35 3.35 0 0 0-1.65-.42c-1.8 0-3.25 1.22-3.25 2.75S5.3 20.4 7.1 20.4s3.25-1.22 3.25-2.75V9.3l7.4-1.73v5.73a3.35 3.35 0 0 0-1.65-.42c-1.8 0-3.25 1.22-3.25 2.75s1.45 2.75 3.25 2.75 3.25-1.22 3.25-2.75V3.5Z" />
    </svg>
  );
}

export function PrevTrackIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true" {...props}>
      <rect x="3" y="4" width="2.2" height="12" rx="1" />
      <path d="M16 4.7a.8.8 0 0 0-1.25-.66l-7.6 5.3a.8.8 0 0 0 0 1.32l7.6 5.3A.8.8 0 0 0 16 15.3V4.7Z" />
    </svg>
  );
}

export function NextTrackIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true" {...props}>
      <rect x="14.8" y="4" width="2.2" height="12" rx="1" />
      <path d="M4 4.7a.8.8 0 0 1 1.25-.66l7.6 5.3a.8.8 0 0 1 0 1.32l-7.6 5.3A.8.8 0 0 1 4 15.3V4.7Z" />
    </svg>
  );
}

export function PauseBarsIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true" {...props}>
      <rect x="5.5" y="4.5" width="3" height="11" rx="1.2" />
      <rect x="11.5" y="4.5" width="3" height="11" rx="1.2" />
    </svg>
  );
}

export function PlayTriangleIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M6.2 4.55a.85.85 0 0 1 1.3-.72l8.1 5.45a.85.85 0 0 1 0 1.44l-8.1 5.45a.85.85 0 0 1-1.3-.72V4.55Z" />
    </svg>
  );
}

export function SpeakerIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M4.5 9.25h3.2l4.4-3.7a.8.8 0 0 1 1.3.62v11.66a.8.8 0 0 1-1.3.62l-4.4-3.7H4.5a1.25 1.25 0 0 1-1.25-1.25v-3a1.25 1.25 0 0 1 1.25-1.25Z" />
      <path
        d="M16.25 8.85a4.75 4.75 0 0 1 0 6.3M18.6 6.7a7.8 7.8 0 0 1 0 10.6"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function SearchGlassIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <circle cx="10.75" cy="10.75" r="6.75" />
      <path d="m15.75 15.75 4.5 4.5" />
    </svg>
  );
}

export function HeartFilledIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M12 20.55c-.3 0-.6-.09-.86-.26C9.3 19.08 2.75 14.33 2.75 9.25 2.75 5.95 5.28 3.5 8.35 3.5c1.56 0 2.93.71 3.65 1.8.72-1.09 2.09-1.8 3.65-1.8 3.07 0 5.6 2.45 5.6 5.75 0 5.08-6.55 9.83-8.39 11.04-.26.17-.56.26-.86.26Z" />
    </svg>
  );
}

export function CloseIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true" {...props}>
      <path d="M6 6l12 12M18 6 6 18" />
    </svg>
  );
}

export function PlusIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true" {...props}>
      <path d="M10 4.5v11M4.5 10h11" />
    </svg>
  );
}

export function MinusIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true" {...props}>
      <path d="M4.5 10h11" />
    </svg>
  );
}

export function TrashIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <path d="M4.5 7h15M9.5 7V4.75a.75.75 0 0 1 .75-.75h3.5a.75.75 0 0 1 .75.75V7m-8 0 .85 11.5a1.5 1.5 0 0 0 1.5 1.4h5.3a1.5 1.5 0 0 0 1.5-1.4L17.5 7" />
    </svg>
  );
}
