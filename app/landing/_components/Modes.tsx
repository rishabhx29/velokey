"use client";

import { motion } from "motion/react";
import {  CREAM, CYAN, INK } from "../lib/colors";
import { ModeTime, ModeWords, ModeCode, ModeZen, ModeQuote, ModeCustom } from "./ModeIcons";
import { Reveal } from "./Reveal";

const MODES = [
  {
    tag: "01",
    title: "Time",
    line: "Race a stopwatch. 15s, 30s, 60s, 120s — pick a window and hit it.",
    icon: <ModeTime />,
  },
  {
    tag: "02",
    title: "Words",
    line: "Fixed word count. Cleanest way to compare runs over time.",
    icon: <ModeWords />,
  },
  {
    tag: "03",
    title: "Code",
    line: "Real syntax in JS, Py, Rust, Go, SQL, Ruby, PHP and more.",
    icon: <ModeCode />,
  },
  {
    tag: "04",
    title: "Zen",
    line: "No timer, no metrics, no judgement. Just text and breath.",
    icon: <ModeZen />,
  },
  {
    tag: "05",
    title: "Quote",
    line: "Curated long-form passages from books worth re-reading.",
    icon: <ModeQuote />,
  },
  {
    tag: "06",
    title: "Custom",
    line: "Paste your own text. Train on what you actually write.",
    icon: <ModeCustom />,
  },
];

export { MODES };

function SectionHeader({
  kicker,
  title,
  sub,
  align = "left",
}: {
  kicker: string;
  title: React.ReactNode;
  sub?: string;
  align?: "left" | "center";
}) {
  return (
    <div
      className={`mb-12 ${align === "center" ? "mx-auto max-w-2xl text-center" : ""}`}
    >
      <Reveal direction="up" y={12} duration={0.55}>
        <div
          className="font-mono text-[9px] uppercase tracking-[0.28em] sm:text-[10px]"
          style={{ color: CYAN }}
        >
          {kicker}
        </div>
      </Reveal>
      <Reveal direction="up" y={20} delay={0.08} duration={0.7}>
        <h2
          className="mt-3 text-[28px] font-bold leading-[1.1] tracking-[-0.015em] sm:text-[36px] md:text-[48px]"
          style={{ color: CREAM }}
        >
          {title}
        </h2>
      </Reveal>
      {sub && (
        <Reveal direction="up" y={16} delay={0.18} duration={0.7}>
          <p
            className={`mt-4 text-[15px] leading-[1.7] ${align === "center" ? "" : "max-w-2xl"}`}
            style={{ color: `${CREAM}b0` }}
          >
            {sub}
          </p>
        </Reveal>
      )}
    </div>
  );
}

export { SectionHeader };

export function Modes() {
  return (
    <section id="modes" className="relative z-10 mx-auto max-w-site px-6 py-20">
      <SectionHeader
        kicker="§02 · modes"
        title={
          <>
            Six ways in.{" "}
            <span style={{ color: `${CREAM}55` }}>One path forward.</span>
          </>
        }
        sub="Every mode is a different kind of pressure — pick the one that matches the rhythm you want to train today."
      />

      <div
        className="grid grid-cols-1 gap-px border"
        style={{ background: `${CREAM}10`, borderColor: `${CREAM}10` }}
      >
        <div className="grid grid-cols-1 gap-px sm:grid-cols-2 lg:grid-cols-3">
          {MODES.map((m, i) => (
            <ModeCard key={m.tag} {...m} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}

export function ModeCard({
  tag,
  title,
  line,
  icon,
  index,
}: {
  tag: string;
  title: string;
  line: string;
  icon: React.ReactNode;
  index: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5, delay: (index % 3) * 0.08 }}
      className="group relative flex min-h-60 flex-col justify-between p-7 transition-colors"
      style={{ background: INK }}
    >
      <div className="flex items-start justify-between">
        <span
          className="font-mono text-[10px] uppercase tracking-[0.28em]"
          style={{ color: `${CREAM}60` }}
        >
          {tag}
        </span>
        <div className="h-12 w-12">{icon}</div>
      </div>

      <div>
        <h3
          className="text-[28px] font-bold leading-tight tracking-[-0.01em]"
          style={{ color: CREAM }}
        >
          {title}
        </h3>
        <p
          className="mt-2 max-w-[30ch] text-[14px] leading-[1.65]"
          style={{ color: `${CREAM}99` }}
        >
          {line}
        </p>
      </div>

      <div
        className="absolute inset-x-0 bottom-0 h-0.5 origin-left scale-x-0 transition-transform duration-300 group-hover:scale-x-100"
        style={{ background: CYAN }}
      />
    </motion.div>
  );
}
