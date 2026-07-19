"use client";

import { motion } from "motion/react";
import { CORAL, CREAM, CYAN } from "../lib/colors";

function Waveform() {
  const bars = 28;
  return (
    <svg
      viewBox={`0 0 ${bars * 6} 30`}
      width={bars * 6}
      height="30"
      aria-hidden
      className="hidden shrink-0 sm:block"
    >
      {Array.from({ length: bars }).map((_, i) => {
        const dur = 0.6 + (i % 5) * 0.18;
        return (
          <rect
            key={i}
            x={i * 6}
            y="10"
            width="3"
            height="10"
            fill={i % 6 === 0 ? CORAL : CYAN}
            opacity="0.85"
          >
            <animate
              attributeName="height"
              values="4;26;6;18;4"
              dur={`${dur}s`}
              repeatCount="indefinite"
              begin={`${i * 0.07}s`}
            />
            <animate
              attributeName="y"
              values="13;2;12;6;13"
              dur={`${dur}s`}
              repeatCount="indefinite"
              begin={`${i * 0.07}s`}
            />
          </rect>
        );
      })}
    </svg>
  );
}

function Marquee() {
  const items = [
    "★ open source",
    "no sign up",
    "no ads",
    "60fps",
    "20+ themes",
    "code · python · js · go · rust · sql · ruby · php",
    "english · 14 languages",
    "v.1.0 · beta",
  ];
  return (
    <div className="relative flex flex-1 overflow-hidden">
      <div
        className="flex shrink-0 items-center gap-10 whitespace-nowrap font-mono text-[12px] uppercase tracking-[0.22em]"
        style={{
          color: `${CREAM}90`,
          animation: "velokey-marquee 30s linear infinite",
        }}
      >
        {[...items, ...items, ...items].map((t, i) => (
          <span key={i} className="flex items-center gap-3">
            <span style={{ color: CYAN }}>◇</span>
            {t}
          </span>
        ))}
      </div>
      <style>{`@keyframes velokey-marquee { from { transform: translateX(0); } to { transform: translateX(-33.33%); } }`}</style>
    </div>
  );
}

export function SoundWave() {
  return (
    <section className="relative z-10 mx-auto max-w-site px-6 py-12">
      <motion.div
        initial={{ opacity: 0, scaleX: 0.94 }}
        whileInView={{ opacity: 1, scaleX: 1 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="flex origin-center items-center gap-6 overflow-hidden border-y py-6"
        style={{ borderColor: `${CREAM}1a` }}
      >
        <div
          className="shrink-0 font-mono text-[10px] uppercase tracking-[0.28em]"
          style={{ color: CYAN }}
        >
          ▮ live signal
        </div>
        <Waveform />
        <Marquee />
      </motion.div>
    </section>
  );
}
