"use client";

import { motion } from "motion/react";
import { GithubLogo } from "@phosphor-icons/react";
import { CORAL, CREAM, CYAN } from "../lib/colors";
import Link from "next/link";

function CornerCross({ pos }: { pos: "tl" | "tr" | "bl" | "br" }) {
  const map = {
    tl: { top: -7, left: -7 },
    tr: { top: -7, right: -7 },
    bl: { bottom: -7, left: -7 },
    br: { bottom: -7, right: -7 },
  } as const;
  return (
    <div className="absolute z-20" style={map[pos]}>
      <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden>
        <line x1="7" y1="0" x2="7" y2="14" stroke={CYAN} strokeWidth="1.4" />
        <line x1="0" y1="7" x2="14" y2="7" stroke={CYAN} strokeWidth="1.4" />
      </svg>
    </div>
  );
}

function LaunchSignal() {
  const rows = [
    "velokey.start()",
    "mode: time",
    "duration: 30s",
    "result: cleaner",
  ];

  return (
    <div
      className="relative min-h-[240px] overflow-hidden border-t px-5 py-5 sm:px-8 lg:border-l lg:border-t-0"
      style={{ borderColor: `${CREAM}12` }}
    >
      <div
        className="absolute inset-0 opacity-[0.16]"
        style={{
          backgroundImage: `linear-gradient(${CREAM}14 1px, transparent 1px), linear-gradient(90deg, ${CREAM}14 1px, transparent 1px)`,
          backgroundSize: "28px 28px",
        }}
      />
      <div className="relative flex h-full flex-col justify-center gap-8">
        <div
          className="flex items-center justify-between font-mono text-[9px] uppercase tracking-[0.24em] sm:text-[10px]"
          style={{ color: `${CREAM}70` }}
        >
          <span>ready</span>
          <span style={{ color: CYAN }}>30s run</span>
        </div>
        <div
          className="space-y-3 font-mono text-[12px] sm:text-[13px]"
          style={{ color: `${CREAM}a8` }}
        >
          {rows.map((row, index) => (
            <div key={row} className="flex items-center gap-3">
              <span style={{ color: index === 0 ? CYAN : `${CREAM}40` }}>
                {String(index + 1).padStart(2, "0")}
              </span>
              <span>{row}</span>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-12 gap-1" aria-hidden>
          {Array.from({ length: 36 }).map((_, i) => (
            <span
              key={i}
              className="h-3"
              style={{
                background: i % 9 === 0 ? CORAL : CYAN,
                opacity: [0, 11, 23, 35].includes(i)
                  ? 1
                  : 0.18 + (i % 5) * 0.12,
                animation: `velokey-signal ${0.8 + (i % 4) * 0.12}s ease-in-out ${i * 0.025}s infinite alternate`,
              }}
            />
          ))}
        </div>
      </div>
      <style>{`@keyframes velokey-signal { to { opacity: 0.95; transform: translateY(-1px); } }`}</style>
    </div>
  );
}

function SourceButton() {
  return (
    <a
      href="https://github.com/rishabhx29/velokey"
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex h-11 min-w-0 items-center justify-center gap-2 border px-3 font-mono text-[9px] uppercase tracking-[0.12em] transition-colors hover:bg-white/5 sm:h-12 sm:px-4 sm:text-[10px] sm:tracking-[0.16em]"
      style={{ borderColor: `${CYAN}55`, color: CREAM }}
    >
      <GithubLogo size={14} weight="fill" />
      <span className="truncate font-(family-name:--font-doto)">Star On Github</span>
    </a>
  );
}

export function FinalCTA() {
  return (
    <section id="open" className="relative z-10 mx-auto max-w-site px-6 py-16 sm:py-20">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className="relative pb-4 pr-4"
      >
        {/* Back shadow — same size as main card, offset 16px */}
        <div
          className="pointer-events-none absolute border"
          style={{ borderColor: `${CREAM}10`, background: "#090b0f", top: 16, left: 16, right: 0, bottom: 0 }}
        />
        {/* Middle shadow — same size as main card, offset 8px */}
        <div
          className="pointer-events-none absolute border"
          style={{ borderColor: `${CYAN}22`, background: "#0b1015", top: 8, left: 8, right: 8, bottom: 8 }}
        />
        <div
          className="relative overflow-hidden border"
          style={{ borderColor: `${CREAM}1a`, background: "#0d1016" }}
        >
          <CornerCross pos="tl" />
          <CornerCross pos="tr" />
          <CornerCross pos="bl" />
          <CornerCross pos="br" />

          <div className="relative z-10 grid min-h-[520px] min-w-0 items-stretch lg:min-h-[360px] lg:grid-cols-[1.05fr_0.95fr]">
            <div className="flex min-w-0 flex-col justify-center px-5 py-8 text-left sm:px-10 lg:py-10">
              <div
                className="font-mono text-[10px] uppercase tracking-[0.28em]"
                style={{ color: CYAN }}
              >
                §end · begin
              </div>
              <h2
                className="mt-4 max-w-full text-[30px] font-bold leading-[1.04] tracking-[-0.015em] text-balance sm:text-[44px] lg:text-[50px]"
                style={{ color: CREAM }}
              >
                Start the next run while the thought is warm.
              </h2>
              <p
                className="mt-4 max-w-full text-[14px] leading-[1.7] sm:max-w-xl sm:text-[15px]"
                style={{ color: `${CREAM}b0` }}
              >
                No login, no card. Open VeloKey, take a breath, and let the first
                30 seconds tell you what to practice next.
              </p>

              <div className="mt-7 grid w-full grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center sm:gap-3">
                <Link
                  href="/"
                  className="group inline-flex h-11 min-w-0 items-center justify-center gap-2 px-3 font-mono text-[9px] uppercase tracking-[0.14em] transition-transform hover:-translate-y-0.5 sm:h-12 sm:gap-3 sm:px-6 sm:text-[11px] sm:tracking-[0.22em]"
                  style={{ background: CYAN, color: CREAM }}
                >
                  Start Typing
                  <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden>
                    <path
                      d="M2 7 H12 M8 3 L12 7 L8 11"
                      fill="none"
                      stroke={CREAM}
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </Link>
                <SourceButton />
              </div>
            </div>
            <LaunchSignal />
          </div>
        </div>
      </motion.div>
    </section>
  );
}
