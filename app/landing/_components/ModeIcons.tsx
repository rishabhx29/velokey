import { CORAL, CREAM, CYAN } from "../lib/colors";

export function ModeTime() {
  return (
    <svg viewBox="0 0 48 48" width="48" height="48" aria-hidden>
      <circle cx="24" cy="26" r="16" fill="none" stroke={`${CREAM}40`} strokeWidth="1.4" />
      <line x1="24" y1="14" x2="24" y2="11" stroke={CREAM} strokeWidth="2" strokeLinecap="round" />
      <line x1="20" y1="9" x2="28" y2="9" stroke={CREAM} strokeWidth="2" strokeLinecap="round" />
      <line x1="24" y1="26" x2="24" y2="17" stroke={CYAN} strokeWidth="2" strokeLinecap="round">
        <animateTransform
          attributeName="transform"
          type="rotate"
          from="0 24 26"
          to="360 24 26"
          dur="4s"
          repeatCount="indefinite"
        />
      </line>
      <circle cx="24" cy="26" r="1.6" fill={CYAN} />
    </svg>
  );
}

export function ModeWords() {
  return (
    <svg viewBox="0 0 48 48" width="48" height="48" aria-hidden>
      <rect x="6" y="14" width="22" height="3" fill={CREAM} opacity="0.85">
        <animate attributeName="width" values="0;22" dur="0.8s" fill="freeze" />
      </rect>
      <rect x="6" y="22" width="30" height="3" fill={CYAN}>
        <animate attributeName="width" values="0;30" dur="0.8s" begin="0.15s" fill="freeze" />
      </rect>
      <rect x="6" y="30" width="16" height="3" fill={CREAM} opacity="0.6">
        <animate attributeName="width" values="0;16" dur="0.8s" begin="0.3s" fill="freeze" />
      </rect>
      <rect x="6" y="38" width="26" height="3" fill={CREAM} opacity="0.4">
        <animate attributeName="width" values="0;26" dur="0.8s" begin="0.45s" fill="freeze" />
      </rect>
    </svg>
  );
}

export function ModeCode() {
  return (
    <svg viewBox="0 0 48 48" width="48" height="48" aria-hidden>
      <path
        d="M16 14 L6 24 L16 34"
        fill="none"
        stroke={CYAN}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <animate attributeName="opacity" values="0.4;1;0.4" dur="1.6s" repeatCount="indefinite" />
      </path>
      <path
        d="M32 14 L42 24 L32 34"
        fill="none"
        stroke={CYAN}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <animate attributeName="opacity" values="1;0.4;1" dur="1.6s" repeatCount="indefinite" />
      </path>
      <line x1="28" y1="10" x2="20" y2="38" stroke={CREAM} strokeWidth="2" strokeLinecap="round" opacity="0.7" />
    </svg>
  );
}

export function ModeZen() {
  return (
    <svg viewBox="0 0 48 48" width="48" height="48" aria-hidden>
      <circle cx="24" cy="24" r="6" fill={CREAM} opacity="0.85" />
      <circle cx="24" cy="24" r="11" fill="none" stroke={CYAN} strokeWidth="1.4" opacity="0.8">
        <animate attributeName="r" values="11;15;11" dur="3s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0.8;0.2;0.8" dur="3s" repeatCount="indefinite" />
      </circle>
      <circle cx="24" cy="24" r="17" fill="none" stroke={CYAN} strokeWidth="1" opacity="0.5">
        <animate attributeName="r" values="17;22;17" dur="3s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0.5;0.05;0.5" dur="3s" repeatCount="indefinite" />
      </circle>
    </svg>
  );
}

export function ModeQuote() {
  return (
    <svg viewBox="0 0 48 48" width="48" height="48" aria-hidden>
      <path d="M10 28 Q10 16 22 14" fill="none" stroke={CYAN} strokeWidth="2.4" strokeLinecap="round" />
      <path d="M14 28 L8 36 L8 28 Z" fill={CYAN} />
      <path d="M28 28 Q28 16 40 14" fill="none" stroke={CREAM} strokeWidth="2.4" strokeLinecap="round" opacity="0.7" />
      <path d="M32 28 L26 36 L26 28 Z" fill={CREAM} opacity="0.7" />
    </svg>
  );
}

export function ModeCustom() {
  return (
    <svg viewBox="0 0 48 48" width="48" height="48" aria-hidden>
      <rect x="8" y="10" width="32" height="28" fill="none" stroke={`${CREAM}50`} strokeWidth="1.4" />
      <line x1="14" y1="18" x2="32" y2="18" stroke={CREAM} strokeWidth="1.6" opacity="0.7">
        <animate attributeName="x2" values="14;32" dur="1s" fill="freeze" />
      </line>
      <line x1="14" y1="24" x2="28" y2="24" stroke={CREAM} strokeWidth="1.6" opacity="0.5">
        <animate attributeName="x2" values="14;28" dur="1s" begin="0.2s" fill="freeze" />
      </line>
      <line x1="14" y1="30" x2="22" y2="30" stroke={CYAN} strokeWidth="1.6">
        <animate attributeName="x2" values="14;22" dur="1s" begin="0.4s" fill="freeze" />
      </line>
      <rect x="22" y="28" width="2" height="4" fill={CYAN}>
        <animate attributeName="opacity" values="1;0;1" dur="0.9s" repeatCount="indefinite" />
      </rect>
    </svg>
  );
}
