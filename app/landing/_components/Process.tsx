import { motion } from "motion/react";
import { CORAL, CREAM, CYAN, INK } from "../lib/colors";
import { SectionHeader } from "./Modes";

const steps = [
  {
    n: "01",
    title: "Pick",
    line: "Choose the pressure: time, words, code, quote, custom, or zen.",
    outcome: "intent",
  },
  {
    n: "02",
    title: "Type",
    line: "The interface gets quiet so your hands can do the honest work.",
    outcome: "signal",
  },
  {
    n: "03",
    title: "Read",
    line: "Raw speed, net WPM, accuracy, consistency, and errors separate noise from progress.",
    outcome: "diagnosis",
  },
  {
    n: "04",
    title: "Return",
    line: "Come back with one target. The loop compounds because the graph remembers.",
    outcome: "habit",
  },
] as const;

function LoopVisual() {
  const nodes = [
    { x: 116, y: 28, label: "01" },
    { x: 204, y: 116, label: "02" },
    { x: 116, y: 204, label: "03" },
    { x: 28, y: 116, label: "04" },
  ];

  return (
    <div className="relative min-h-[360px] overflow-hidden border-b p-6 sm:p-8 lg:border-r lg:border-b-0">
      <div
        className="absolute inset-0 opacity-[0.12]"
        style={{
          backgroundImage: `linear-gradient(${CREAM}14 1px, transparent 1px), linear-gradient(90deg, ${CREAM}14 1px, transparent 1px)`,
          backgroundSize: "28px 28px",
        }}
      />
      <div className="relative flex h-full min-h-[300px] items-center justify-center">
        <svg viewBox="0 0 232 232" className="h-[min(74vw,360px)] w-[min(74vw,360px)]" aria-hidden>
          <circle cx="116" cy="116" r="88" fill="none" stroke={`${CREAM}18`} strokeWidth="1" />
          <path
            d="M116 28 A88 88 0 0 1 204 116 A88 88 0 0 1 116 204 A88 88 0 0 1 28 116 A88 88 0 0 1 116 28"
            fill="none"
            stroke={CYAN}
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray="50 18"
          />
          <path
            d="M116 28 L127 22 L125 35 Z"
            fill={CYAN}
          />
          {nodes.map((node) => (
            <g key={node.label}>
              <circle cx={node.x} cy={node.y} r="18" fill={INK} stroke={`${CYAN}aa`} strokeWidth="1.4" />
              <text
                x={node.x}
                y={node.y + 4}
                textAnchor="middle"
                fontFamily="var(--font-mono)"
                fontSize="10"
                letterSpacing="1.5"
                fill={node.label === "03" ? CORAL : CYAN}
              >
                {node.label}
              </text>
            </g>
          ))}
        </svg>

        <div
          className="absolute left-1/2 top-1/2 w-[150px] -translate-x-1/2 -translate-y-1/2 border px-5 py-4 text-center"
          style={{ borderColor: `${CREAM}1f`, background: "#0d1016" }}
        >
          <div className="font-mono text-[9px] uppercase tracking-[0.24em]" style={{ color: CYAN }}>
            practice
          </div>
          <div className="mt-2 text-[30px] font-bold leading-none" style={{ color: CREAM }}>
            loop
          </div>
          <div className="mt-3 font-mono text-[9px] uppercase tracking-[0.2em]" style={{ color: `${CREAM}70` }}>
            repeatable · measurable
          </div>
        </div>
      </div>
    </div>
  );
}

function StepPanel({
  step,
  index,
}: {
  step: (typeof steps)[number];
  index: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.45, delay: index * 0.06 }}
      className="group relative grid gap-4 border-b px-5 py-5 last:border-b-0 sm:grid-cols-[72px_1fr_auto] sm:items-center sm:px-7"
      style={{ borderColor: `${CREAM}10` }}
    >
      <div className="flex items-center gap-3">
        <span
          className="flex h-11 w-11 items-center justify-center border font-mono text-[11px] uppercase tracking-[0.2em]"
          style={{ borderColor: `${CYAN}55`, color: index === 2 ? CORAL : CYAN, background: `${CYAN}0d` }}
        >
          {step.n}
        </span>
        <div className="h-px flex-1 sm:hidden" style={{ background: `${CREAM}14` }} />
      </div>

      <div>
        <h3 className="text-[28px] font-bold leading-none tracking-[-0.01em]" style={{ color: CREAM }}>
          {step.title}
        </h3>
        <p className="mt-2 max-w-[48ch] text-[14px] leading-[1.65]" style={{ color: `${CREAM}99` }}>
          {step.line}
        </p>
      </div>

      <div
        className="w-fit border px-3 py-2 font-mono text-[9px] uppercase tracking-[0.22em] sm:justify-self-end"
        style={{ borderColor: `${CREAM}14`, color: `${CREAM}82`, background: "#0b0e13" }}
      >
        {step.outcome}
      </div>

      <div
        className="absolute inset-y-0 left-0 w-0.5 origin-top scale-y-0 transition-transform duration-300 group-hover:scale-y-100"
        style={{ background: index === 2 ? CORAL : CYAN }}
      />
    </motion.div>
  );
}

export function Process() {
  return (
    <section id="process" className="relative z-10 mx-auto max-w-site px-6 py-20">
      <SectionHeader
        kicker="§05 · the loop"
        title="A four-step ritual."
        sub="A simple cycle is what makes practice stick. Show up, type, read the numbers, come back tomorrow."
      />

      <div className="relative">
        <div
          className="absolute inset-0 translate-x-2 translate-y-2 border"
          style={{ borderColor: `${CYAN}18`, background: "#0c1116" }}
        />
        <div
          className="relative grid overflow-hidden border lg:grid-cols-[0.95fr_1.05fr]"
          style={{ background: INK, borderColor: `${CREAM}10` }}
        >
          <LoopVisual />
          <div className="flex flex-col">
            {steps.map((step, index) => (
              <StepPanel key={step.n} step={step} index={index} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
