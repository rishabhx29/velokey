"use client"

import { motion } from "motion/react"
import type { Language } from "@/lib/languages"
import { CREAM, CYAN, INK } from "../lib/colors"
import { Reveal } from "./Reveal"

type LandingLanguage = Pick<Language, "name" | "code"> & {
  sample: string
}

const LANGUAGES: LandingLanguage[] = [
  { name: "English", code: "english", sample: "steady hands" },
  { name: "Hindi", code: "hindi", sample: "तेज टाइपिंग" },
  { name: "Bengali", code: "bangla", sample: "দ্রুত লেখা" },
  { name: "Chinese", code: "chinese_simplified", sample: "稳定输入" },
  { name: "Japanese", code: "japanese_romaji", sample: "速く正確に" },
  { name: "Korean", code: "korean", sample: "빠른 타이핑" },
  { name: "Arabic", code: "arabic", sample: "كتابة هادئة" },
  { name: "Spanish", code: "spanish", sample: "ritmo limpio" },
  { name: "Russian", code: "russian", sample: "ровный ритм" },
  { name: "Portuguese", code: "portuguese", sample: "toque preciso" },
  { name: "Vietnamese", code: "vietnamese", sample: "gõ thật đều" },
  { name: "Thai", code: "thai", sample: "พิมพ์นิ่ง" },
]

const LAYOUTS = [
  ["Latin", "Q W E R T Y"],
  ["Devanagari", "क ख ग च ट"],
  ["Arabic", "ض ص ث ق ف"],
  ["CJK", "あ 字 한 文"],
]

function LanguageGlobe() {
  return (
    <svg
      viewBox="0 0 420 280"
      className="h-auto w-full"
      role="img"
      aria-label="Language support illustration"
    >
      <defs>
        <linearGradient id="language-ring" x1="80" x2="340" y1="40" y2="260">
          <stop stopColor={CYAN} stopOpacity="0.95" />
          <stop offset="1" stopColor={CREAM} stopOpacity="0.35" />
        </linearGradient>
        <filter id="language-glow" x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="8" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <rect x="34" y="16" width="352" height="248" rx="10" fill={`${INK}f2`} />
      <path d="M80 84H340M80 150H340M80 216H340" stroke={`${CREAM}14`} />
      <path d="M144 48V252M210 48V252M276 48V252" stroke={`${CREAM}12`} />

      <circle
        cx="210"
        cy="150"
        r="88"
        fill="none"
        stroke="url(#language-ring)"
        strokeWidth="2"
        filter="url(#language-glow)"
      />
      <ellipse
        cx="210"
        cy="150"
        rx="42"
        ry="88"
        fill="none"
        stroke={`${CYAN}88`}
      />
      <ellipse
        cx="210"
        cy="150"
        rx="88"
        ry="28"
        fill="none"
        stroke={`${CYAN}66`}
      />
      <path
        d="M122 150C150 114 178 96 210 96C242 96 270 114 298 150C270 186 242 204 210 204C178 204 150 186 122 150Z"
        fill={`${CYAN}0f`}
        stroke={`${CREAM}28`}
      />

      {[
        ["A", 108, 80],
        ["字", 300, 88],
        ["ব", 92, 218],
        ["あ", 312, 216],
        ["ع", 210, 46],
        ["한", 210, 254],
      ].map(([glyph, x, y]) => (
        <g key={glyph} transform={`translate(${x} ${y})`}>
          <rect
            x="-22"
            y="-20"
            width="44"
            height="40"
            rx="6"
            fill={`${CREAM}10`}
            stroke={`${CREAM}24`}
          />
          <text
            textAnchor="middle"
            y="8"
            fontFamily="var(--font-sans)"
            fontSize="24"
            fontWeight="700"
            fill={glyph === "A" ? CYAN : CREAM}
            stroke={glyph === "A" ? `${CREAM}66` : `${CYAN}55`}
            strokeWidth="0.6"
            paintOrder="stroke"
          >
            {glyph}
          </text>
        </g>
      ))}

      <g transform="translate(154 128)">
        <rect
          width="112"
          height="44"
          rx="6"
          fill={`${CREAM}12`}
          stroke={`${CYAN}88`}
        />
        <text
          x="56"
          y="28"
          textAnchor="middle"
          fontFamily="var(--font-mono)"
          fontSize="13"
          letterSpacing="3"
          fill={CYAN}
        >
          UTF-8
        </text>
      </g>
    </svg>
  )
}

function LanguageCard({
  label,
  sample,
  index,
}: {
  label: string
  sample: string
  index: number
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.5, delay: index * 0.04, ease: [0.22, 1, 0.36, 1] }}
      className="border px-3 py-2.5 sm:p-4"
      style={{
        background: index % 2 === 0 ? `${INK}f2` : "#0d1016",
        borderColor: `${CREAM}10`,
      }}
    >
      <div
        className="font-mono text-[9px] tracking-[0.24em] uppercase"
        style={{ color: `${CREAM}70` }}
      >
        {label}
      </div>
      <div
        className="mt-2 text-[14px] leading-tight font-semibold sm:mt-3 sm:text-[20px]"
        style={{ color: CREAM }}
      >
        {sample}
      </div>
    </motion.div>
  )
}

function KeyboardLayoutGrid() {
  return (
    <div
      className="grid grid-cols-2 gap-px"
      style={{ background: `${CREAM}10` }}
    >
      {LAYOUTS.map(([label, keys]) => (
        <div
          key={label}
          className="p-2.5 sm:p-3"
          style={{ background: "#0d1016" }}
        >
          <div
            className="font-mono text-[8px] tracking-[0.22em] uppercase sm:text-[9px]"
            style={{ color: `${CREAM}70` }}
          >
            {label}
          </div>
          <div className="mt-2 grid grid-cols-5 gap-1">
            {keys.split(" ").map((key) => (
              <span
                key={key}
                className="grid h-5 place-items-center border text-[10px] font-semibold sm:h-7 sm:text-[12px]"
                style={{
                  borderColor: `${CREAM}12`,
                  background: `${CREAM}08`,
                  color: key.length > 1 ? CYAN : CREAM,
                }}
              >
                {key}
              </span>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

function LanguageDeck() {
  return (
    <div className="relative h-full min-h-0">
      <div
        className="relative grid h-full grid-cols-2 gap-px overflow-hidden border shadow-[0_28px_80px_rgba(0,0,0,0.34)] lg:grid-cols-3"
        style={{
          background: `${CREAM}10`,
          borderColor: `${CREAM}14`,
        }}
      >
        {LANGUAGES.map((language, index) => (
          <LanguageCard
            key={language.code}
            label={language.name}
            sample={language.sample}
            index={index}
          />
        ))}
      </div>
    </div>
  )
}

export function LanguageSupport() {
  return (
    <section
      id="languages"
      className="relative z-10 mx-auto max-w-site px-6 py-24"
    >
      <div className="mb-8 sm:mb-12">
        <Reveal direction="up" y={12} duration={0.55}>
          <div
            className="font-mono text-[9px] tracking-[0.28em] uppercase sm:text-[10px]"
            style={{ color: CYAN }}
          >
            §03 · languages
          </div>
        </Reveal>
        <Reveal direction="up" y={20} delay={0.08} duration={0.7}>
          <h2
            className="mt-3 max-w-4xl text-[30px] leading-[1.05] font-bold sm:text-[42px] md:text-[56px]"
            style={{
              color: CREAM,
              textShadow: `1px 0 ${CYAN}66, -1px 0 ${CYAN}38, 0 1px ${CYAN}38, 0 -1px ${CYAN}38, 0 0 26px ${CYAN}1f`,
            }}
          >
            Practice for a global keyboard.
          </h2>
        </Reveal>
        <Reveal direction="up" y={16} delay={0.18} duration={0.7}>
          <p
            className="mt-4 max-w-2xl text-[15px] leading-[1.7]"
            style={{
              color: `${CREAM}b8`,
              textShadow: `0 0 16px ${CYAN}14`,
            }}
          >
            Train with accents, native scripts, mixed-language phrases, and the
            real text your international audience actually types.
          </p>
        </Reveal>
      </div>

      <Reveal direction="up" y={28} delay={0.1} duration={0.85} className="relative pb-4 pr-4">
        {/* Back shadow */}
        <div
          className="pointer-events-none absolute border"
          style={{ borderColor: `${CREAM}10`, background: "#090b0f", top: 16, left: 16, right: 0, bottom: 0 }}
        />
        {/* Middle shadow */}
        <div
          className="pointer-events-none absolute border"
          style={{ borderColor: `${CYAN}22`, background: "#0b1015", top: 8, left: 8, right: 8, bottom: 8 }}
        />
        <div
          className="relative grid grid-cols-1 items-stretch gap-px border md:grid-cols-[0.95fr_1.05fr]"
          style={{ background: `${CREAM}10`, borderColor: `${CREAM}10` }}
        >
          <div className="grid gap-px" style={{ background: `${CREAM}10` }}>
            <div className="p-3 sm:p-8" style={{ background: INK }}>
              <LanguageGlobe />
            </div>
            <KeyboardLayoutGrid />
          </div>

          <LanguageDeck />
        </div>
      </Reveal>
    </section>
  )
}
