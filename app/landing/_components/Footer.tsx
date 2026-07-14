"use client"

import { motion } from "motion/react"
import { CREAM, CYAN, INK } from "../lib/colors"

const SERIF_STACK =
  "'Cormorant Garamond', 'EB Garamond', 'Iowan Old Style', 'Apple Garamond', Georgia, 'Times New Roman', serif"

const EASE = [0.22, 1, 0.36, 1] as const

const ASCII_TEXT_PATTERN = `url("data:image/svg+xml,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" width="260" height="88" viewBox="0 0 260 88">
  <g fill="${CYAN}" fill-opacity="0.92" font-family="ui-monospace, SFMono-Regular, Menlo, monospace" font-size="7" letter-spacing="0.55">
    <text x="-80" y="7">VELOKEY ASCII TYPE TAB ENTER WPM FLOW CTRL SHIFT ALT ESC RETURN HOME ROW</text>
    <text x="-112" y="15">0101 CTRL SHIFT ALT ESC RETURN HOME ROW QWERTY VELOKEY ASCII TYPE TAB</text>
    <text x="-42" y="23">WPM ACCURACY FLOW FOCUS VELOKEY CODE SPEED ZEN RETURN TAB ESC 1010</text>
    <text x="-96" y="31">ASCII MODE PRACTICE SPEED ENTER TAB VELOKEY HOME ROW CTRL SHIFT WPM</text>
    <text x="-20" y="39">HOME ROW QWERTY CODE ZEN 1010 SHIFT ALT RETURN TYPE FLOW VELOKEY</text>
    <text x="-124" y="47">KEY KEY KEY KEY KEY KEY KEY KEY KEY KEY KEY KEY KEY KEY KEY KEY KEY</text>
    <text x="-64" y="55">CTRL RETURN ACCURACY FOCUS FLOW TYPE VELOKEY ASCII WPM TAB ESC</text>
    <text x="-104" y="63">TAB ESC ENTER SPEED CODE ASCII ZEN QWERTY HOME ROW VELOKEY 0101</text>
    <text x="-34" y="71">0101 HOME ROW SHIFT ALT CTRL RETURN VELOKEY WPM FLOW ACCURACY TYPE</text>
    <text x="-88" y="79">VELOKEY ASCII TYPE TAB ENTER WPM FLOW CTRL SHIFT ALT ESC RETURN HOME</text>
    <text x="-8" y="87">WPM ACCURACY FLOW FOCUS VELOKEY CODE SPEED ZEN RETURN TAB ESC 1010</text>
  </g>
</svg>
`)}")`

const BACKGROUND_KEYS = [
  { label: "esc", x: "-2%", y: "14%", w: 68, r: -18, delay: 0 },
  { label: "1", x: "12%", y: "8%", w: 48, r: 18, delay: 0.02 },
  { label: "Q", x: "24%", y: "21%", w: 54, r: 24, delay: 0.04 },
  { label: "E", x: "44%", y: "12%", w: 54, r: 15, delay: 0.06 },
  { label: "shift", x: "76%", y: "18%", w: 94, r: 20, delay: 0.08 },
  { label: "tab", x: "9%", y: "62%", w: 78, r: 10, delay: 0.1 },
  { label: "A", x: "-3%", y: "74%", w: 54, r: 27, delay: 0.12 },
  { label: "S", x: "29%", y: "70%", w: 50, r: -13, delay: 0.14 },
  { label: "W", x: "44%", y: "76%", w: 56, r: -13, delay: 0.16 },
  { label: "space", x: "53%", y: "43%", w: 170, r: -7, delay: 0.18 },
  { label: "return", x: "68%", y: "60%", w: 104, r: -23, delay: 0.2 },
  { label: "K", x: "87%", y: "72%", w: 54, r: -17, delay: 0.22 },
  { label: "cmd", x: "3%", y: "39%", w: 68, r: -7, delay: 0.24 },
  { label: "Z", x: "89%", y: "42%", w: 50, r: 13, delay: 0.26 },
  { label: "/", x: "58%", y: "79%", w: 48, r: 22, delay: 0.28 },
] as const

function ScatteredKeys() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 z-10">
      {BACKGROUND_KEYS.map((key) => (
        <motion.div
          key={`${key.label}-${key.x}-${key.y}`}
          initial={{ opacity: 0, y: 14, rotate: key.r - 8 }}
          whileInView={{ opacity: 1, y: 0, rotate: key.r }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.9, ease: EASE, delay: key.delay }}
          className="absolute flex h-9 items-center justify-center border font-mono text-[8px] uppercase sm:h-12 sm:text-[10px]"
          style={{
            left: key.x,
            top: key.y,
            width: `clamp(${Math.round(key.w * 0.72)}px, ${Math.round(key.w * 0.24)}vw, ${key.w}px)`,
            transform: `rotate(${key.r}deg)`,
            background: `linear-gradient(180deg, ${CREAM}14, ${CREAM}05 60%, ${CYAN}12)`,
            borderColor: `${CREAM}18`,
            boxShadow: `inset 0 1px 0 ${CREAM}18, 0 18px 42px rgba(0,0,0,0.28)`,
            color: `${CREAM}5f`,
            letterSpacing: 0,
          }}
        >
          <span>{key.label}</span>
          <span
            className="absolute inset-x-2 bottom-1 h-px opacity-70"
            style={{ background: CYAN }}
          />
        </motion.div>
      ))}
    </div>
  )
}

function Wordmark() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true, margin: "-120px" }}
      transition={{ duration: 1.2, ease: EASE }}
      className="pointer-events-none absolute inset-x-[-8vw] top-1/2 z-0 -translate-y-1/2 select-none"
      aria-hidden
    >
      <span
        className="block w-full text-center leading-[1.05]"
        style={{
          fontFamily: SERIF_STACK,
          fontWeight: 700,
          fontStyle: "normal",
          fontSize: "clamp(96px, 26vw, 292px)",
          letterSpacing: 0,
          color: "transparent",
          WebkitTextStroke: `1px ${CYAN}82`,
          backgroundImage: `${ASCII_TEXT_PATTERN}, linear-gradient(${CYAN}2e, ${CYAN}2e)`,
          backgroundSize: "260px 88px, auto",
          backgroundPosition: "center",
          backgroundRepeat: "repeat",
          WebkitBackgroundClip: "text",
          backgroundClip: "text",
          filter: `drop-shadow(0 0 18px ${CYAN}1f)`,
          paddingBottom: "0.24em",
        }}
      >
        velokey
      </span>
    </motion.div>
  )
}

export function Footer() {
  return (
    <footer
      className="relative z-10 h-[300px] overflow-hidden border-t sm:h-[420px]"
      style={{ borderColor: `${CREAM}10` }}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: `linear-gradient(${CREAM} 1px, transparent 1px), linear-gradient(90deg, ${CREAM} 1px, transparent 1px)`,
          backgroundSize: "64px 64px",
          maskImage: `radial-gradient(ellipse at center, ${INK} 30%, transparent 80%)`,
        }}
      />
      <Wordmark />
      <ScatteredKeys />
    </footer>
  )
}
