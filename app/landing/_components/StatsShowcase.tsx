"use client"

import {
  animate,
  motion,
  useInView,
  useMotionValue,
  useReducedMotion,
  useTransform,
} from "motion/react"
import { useEffect, useRef, type CSSProperties, type ReactNode } from "react"
import { CORAL, CREAM, CYAN, INK } from "../lib/colors"
import { SectionHeader } from "./Modes"

const EASE = [0.22, 1, 0.36, 1] as const
type MarginValue = `${number}${"px" | "%"}`
type InViewMargin =
  | MarginValue
  | `${MarginValue} ${MarginValue}`
  | `${MarginValue} ${MarginValue} ${MarginValue}`
  | `${MarginValue} ${MarginValue} ${MarginValue} ${MarginValue}`

function OdometerNumber({
  value,
  suffix = "",
  prefix = "",
  className = "",
  style,
  delay = 0,
  duration = 1.1,
  margin = "-80px",
  inView,
}: {
  value: number
  suffix?: string
  prefix?: string
  className?: string
  style?: CSSProperties
  delay?: number
  duration?: number
  margin?: InViewMargin
  inView?: boolean
}) {
  const ref = useRef<HTMLSpanElement>(null)
  const localInView = useInView(ref, { once: true, margin })
  const isInView = inView ?? localInView
  const prefersReducedMotion = useReducedMotion()
  const roundedValue = Math.round(value)
  const sign = roundedValue < 0 ? "-" : prefix
  const absoluteValue = Math.abs(roundedValue)
  const digits = String(absoluteValue).split("").map(Number)
  const numberLabel = `${sign}${absoluteValue}${suffix}`

  return (
    <span
      ref={ref}
      className={`inline-flex items-baseline tabular-nums ${className}`}
      style={style}
      aria-label={numberLabel}
    >
      {sign && <span aria-hidden>{sign}</span>}
      <span aria-hidden className="inline-flex">
        {digits.map((_, index) => {
          const place = digits.length - index - 1
          const steps = Math.floor(absoluteValue / 10 ** place)
          const sequence = Array.from(
            { length: steps + 1 },
            (_, step) => step % 10
          )

          return (
            <span
              key={`${absoluteValue}-${place}`}
              className="relative inline-block h-[1em] w-[0.62em] overflow-hidden align-baseline leading-none"
            >
              <motion.span
                className="absolute top-0 left-0 flex flex-col"
                initial={{ y: "0em" }}
                animate={{ y: isInView ? `-${steps}em` : "0em" }}
                transition={{
                  delay: prefersReducedMotion ? 0 : delay + index * 0.045,
                  duration: prefersReducedMotion ? 0 : duration,
                  ease: EASE,
                }}
              >
                {sequence.map((wheelDigit, step) => (
                  <span
                    key={`${place}-${step}`}
                    className="block h-[1em] leading-none"
                  >
                    {wheelDigit}
                  </span>
                ))}
              </motion.span>
            </span>
          )
        })}
      </span>
      {suffix && <span aria-hidden>{suffix}</span>}
    </span>
  )
}

function BigStat({
  children,
  className = "",
  index = 0,
}: {
  children: ReactNode
  className?: string
  index?: number
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 22 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.65, delay: index * 0.07, ease: EASE }}
      className={`relative flex min-h-[220px] flex-col overflow-hidden p-5 sm:p-7 ${className}`}
      style={{ background: INK }}
    >
      {children}
    </motion.div>
  )
}

function StatLabel({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <div
          className="font-mono text-[9px] tracking-[0.28em] uppercase"
          style={{ color: CYAN }}
        >
          {eyebrow}
        </div>
        <h3
          className="mt-2 text-[22px] leading-none font-bold tracking-[-0.01em]"
          style={{ color: CREAM }}
        >
          {title}
        </h3>
      </div>
    </div>
  )
}

function WPMGauge() {
  const ref = useRef<SVGSVGElement>(null)
  const isInView = useInView(ref, { once: true, amount: 0.45, margin: "-80px" })
  const prefersReducedMotion = useReducedMotion()
  const cx = 120
  const cy = 130
  const r = 90
  const startAngle = -180
  const endAngle = -44
  const toPoint = (angle: number, radius = r) => {
    const rad = (angle * Math.PI) / 180
    return {
      x: cx + radius * Math.cos(rad),
      y: cy + radius * Math.sin(rad),
    }
  }
  const arcPath = (from: number, to: number) => {
    const start = toPoint(from)
    const end = toPoint(to)
    const largeArc = Math.abs(to - from) > 180 ? 1 : 0
    return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 1 ${end.x} ${end.y}`
  }
  const needleAngle = useMotionValue(startAngle)
  const needleX = useTransform(needleAngle, (angle) => toPoint(angle, 78).x)
  const needleY = useTransform(needleAngle, (angle) => toPoint(angle, 78).y)

  useEffect(() => {
    if (!isInView) {
      needleAngle.set(startAngle)
      return
    }

    if (prefersReducedMotion) {
      needleAngle.set(endAngle)
      return
    }

    const controls = animate(needleAngle, endAngle, {
      duration: 1,
      delay: 0.08,
      ease: EASE,
    })

    return () => controls.stop()
  }, [endAngle, isInView, needleAngle, prefersReducedMotion, startAngle])

  return (
    <svg
      ref={ref}
      viewBox="0 0 240 160"
      className="mx-auto w-full max-w-[300px]"
      aria-hidden
    >
      <path
        d={arcPath(startAngle, 0)}
        fill="none"
        stroke={`${CREAM}1c`}
        strokeWidth="14"
        strokeLinecap="round"
      />
      <motion.path
        d={arcPath(startAngle, endAngle)}
        fill="none"
        stroke={CYAN}
        strokeWidth="14"
        strokeLinecap="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: isInView ? 1 : 0 }}
        transition={{ duration: 1, delay: 0.08, ease: EASE }}
      />
      {Array.from({ length: 11 }).map((_, i) => {
        const a = -180 + (i * 180) / 10
        const r1 = 76
        const r2 = 84
        const cx = 120
        const cy = 130
        const rad = (a * Math.PI) / 180
        return (
          <line
            key={`tick-${i}`}
            x1={cx + r1 * Math.cos(rad)}
            y1={cy + r1 * Math.sin(rad)}
            x2={cx + r2 * Math.cos(rad)}
            y2={cy + r2 * Math.sin(rad)}
            stroke={`${CREAM}40`}
            strokeWidth="1.2"
          />
        )
      })}
      <motion.line
        x1={cx}
        y1={cy}
        x2={needleX}
        y2={needleY}
        stroke={CREAM}
        strokeWidth="2.4"
        strokeLinecap="round"
      />
      <motion.circle
        cx={cx}
        cy={cy}
        r="6"
        fill={CYAN}
        initial={{ scale: 1, opacity: 1 }}
        animate={{ scale: isInView ? 1 : 1, opacity: 1 }}
        transition={{ duration: 0.2, ease: EASE }}
        style={{ transformBox: "fill-box", transformOrigin: "center" }}
      />
    </svg>
  )
}

function AccuracyDonut({ className = "" }: { className?: string }) {
  const ref = useRef<SVGSVGElement>(null)
  const isInView = useInView(ref, { once: true, amount: 0.45, margin: "-80px" })
  const c = 2 * Math.PI * 56
  return (
    <div className={`relative ${className}`}>
      <svg ref={ref} viewBox="0 0 160 160" width="100%" aria-hidden>
        <circle
          cx="80"
          cy="80"
          r="56"
          fill="none"
          stroke={`${CREAM}1c`}
          strokeWidth="12"
        />
        <motion.circle
          cx="80"
          cy="80"
          r="56"
          fill="none"
          stroke={CYAN}
          strokeWidth="12"
          strokeLinecap="round"
          transform="rotate(-90 80 80)"
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: isInView ? c * 0.03 + 12 : c }}
          transition={{ duration: 0.95, ease: EASE }}
          style={{ strokeDasharray: c }}
        />
      </svg>
      <OdometerNumber
        value={97}
        suffix="%"
        delay={0.52}
        duration={1}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[32px] leading-none font-bold tracking-[-0.01em]"
        style={{ color: CREAM }}
      />
    </div>
  )
}

function AccuracyBreakdown() {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, amount: 0.45, margin: "-80px" })
  const modes: Array<[string, number]> = [
    ["words · 60s", 98],
    ["time · 30s", 96],
    ["code · ts", 95],
    ["quotes", 99],
  ]
  return (
    <div ref={ref} className="space-y-1.5">
      {modes.map(([label, value], index) => (
        <div key={label} className="flex items-center gap-3">
          <span
            className="w-[88px] shrink-0 font-mono text-[10px] tracking-[0.18em] uppercase"
            style={{ color: `${CREAM}80` }}
          >
            {label}
          </span>
          <div
            className="relative h-[6px] flex-1 overflow-hidden rounded-full"
            style={{ background: `${CREAM}12` }}
          >
            <motion.span
              className="absolute inset-y-0 left-0 rounded-full"
              initial={{ scaleX: 0 }}
              animate={{ scaleX: isInView ? 1 : 0 }}
              transition={{
                duration: 0.8,
                delay: 0.18 + 0.08 * index,
                ease: EASE,
              }}
              style={{
                background: CYAN,
                width: `${value}%`,
                transformOrigin: "left",
              }}
            />
          </div>
          <span
            className="w-[32px] shrink-0 text-right font-mono text-[11px] tabular-nums"
            style={{ color: CREAM }}
          >
            <OdometerNumber
              value={value}
              suffix="%"
              delay={0.28 + 0.1 * index}
              duration={0.7}
              inView={isInView}
            />
          </span>
        </div>
      ))}
    </div>
  )
}

function AccuracyCard() {
  return (
    <div className="grid h-full grid-cols-1 items-start gap-8 sm:grid-cols-[minmax(0,1fr)_180px] lg:gap-10">
      <div className="flex min-w-0 flex-col">
        <div>
          <StatLabel eyebrow="accuracy" title="Clean contact" />
          <div className="mt-5">
            <AccuracyBreakdown />
          </div>
        </div>

        <div className="pt-6">
         
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
            <OdometerNumber
              value={97}
              suffix="%"
              className="text-[40px] leading-none font-bold tracking-[-0.01em] sm:text-[26px]"
              style={{ color: CREAM }}
              delay={0.72}
              duration={0.9}
            />
            <span className="font-mono text-[11px]" style={{ color: CYAN }}>
              ↑ 4 pts vs last week
            </span>
          </div>
        </div>
      </div>
      <div className="flex size-[150px] items-center justify-center self-center justify-self-center sm:size-[180px]">
        <AccuracyDonut className="size-full" />
      </div>
    </div>
  )
}

function ConsistencyChart() {
  const ref = useRef<SVGSVGElement>(null)
  const isInView = useInView(ref, { once: true, amount: 0.45, margin: "-80px" })
  const data = [40, 52, 48, 60, 58, 70, 66, 78, 76, 82, 80, 88, 86, 94]
  return (
    <div className="w-full min-w-0">
      <svg ref={ref} viewBox="0 0 240 160" width="100%" aria-hidden>
        {[30, 60, 90, 120].map((y) => (
          <line
            key={y}
            x1="10"
            y1={y}
            x2="230"
            y2={y}
            stroke={`${CREAM}10`}
            strokeWidth="1"
          />
        ))}
        <motion.path
          d={
            "M10 130 " +
            data
              .map(
                (v, i) => `L${10 + (i * 220) / (data.length - 1)} ${130 - v}`
              )
              .join(" ") +
            ` L230 130 Z`
          }
          fill={`${CYAN}22`}
          initial={{ opacity: 0 }}
          animate={{ opacity: isInView ? 1 : 0 }}
          transition={{ duration: 0.55, delay: 0.45, ease: EASE }}
        />
        <motion.path
          d={
            "M10 " +
            (130 - data[0]) +
            " " +
            data
              .slice(1)
              .map(
                (v, i) =>
                  `L${10 + ((i + 1) * 220) / (data.length - 1)} ${130 - v}`
              )
              .join(" ")
          }
          fill="none"
          stroke={CYAN}
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: isInView ? 1 : 0 }}
          transition={{ duration: 0.95, delay: 0.18, ease: EASE }}
        />
        {data.map((v, i) => (
          <motion.circle
            key={`consistency-${v}`}
            cx={10 + (i * 220) / (data.length - 1)}
            cy={130 - v}
            r={i === data.length - 1 ? 4 : 2.4}
            fill={i === data.length - 1 ? CORAL : CYAN}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: isInView ? 1 : 0, scale: isInView ? 1 : 0 }}
            transition={{ duration: 0.25, delay: 0.72 + 0.04 * i, ease: EASE }}
            style={{ transformBox: "fill-box", transformOrigin: "center" }}
          />
        ))}
        <text
          x="120"
          y="152"
          textAnchor="middle"
          fontFamily="var(--font-mono)"
          fontSize="10"
          letterSpacing="2"
          fill={`${CREAM}90`}
        >
          CONSISTENCY · 14D
        </text>
      </svg>
    </div>
  )
}

function ErrorDecayChart() {
  const ref = useRef<SVGSVGElement>(null)
  const isInView = useInView(ref, { once: true, amount: 0.45, margin: "-80px" })
  const bars = [88, 62, 48, 34, 26, 18]

  return (
    <div className="w-full min-w-0">
      <svg ref={ref} viewBox="0 0 240 160" width="100%" aria-hidden>
        {[34, 68, 102, 136].map((x) => (
          <line
            key={x}
            x1={x}
            y1="22"
            x2={x}
            y2="128"
            stroke={`${CREAM}10`}
            strokeWidth="1"
          />
        ))}
        {bars.map((height, i) => (
          <motion.rect
            key={`error-${height}`}
            x={28 + i * 34}
            y={128 - height}
            width="14"
            height={height}
            rx="2"
            fill={i === 0 ? `${CORAL}cc` : `${CYAN}${i > 3 ? "cc" : "99"}`}
            initial={{ scaleY: 0, opacity: 0 }}
            animate={{
              scaleY: isInView ? 1 : 0,
              opacity: isInView ? 1 : 0,
            }}
            transition={{ duration: 0.55, delay: 0.18 + i * 0.08, ease: EASE }}
            style={{ transformBox: "fill-box", transformOrigin: "bottom" }}
          />
        ))}
        <path
          d="M35 126C65 94 90 78 113 70C139 61 160 48 205 26"
          fill="none"
          stroke={`${CREAM}1f`}
          strokeWidth="18"
          strokeLinecap="round"
        />
        <motion.path
          d="M35 126C65 94 90 78 113 70C139 61 160 48 205 26"
          fill="none"
          stroke={CYAN}
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: isInView ? 1 : 0 }}
          transition={{ duration: 0.95, delay: 0.5, ease: EASE }}
        />
        <text
          x="120"
          y="152"
          textAnchor="middle"
          fontFamily="var(--font-mono)"
          fontSize="10"
          letterSpacing="2"
          fill={`${CREAM}90`}
        >
          ERRORS · LAST RUNS
        </text>
      </svg>
    </div>
  )
}

function SpeedSplit() {
  return (
    <div
      className="grid grid-cols-2 gap-px border"
      style={{ borderColor: `${CREAM}10`, background: `${CREAM}10` }}
    >
      {[
        ["raw", "126", "burst ceiling"],
        ["net", "112", "clean speed"],
      ].map(([label, value, note], index) => (
        <div key={label} className="p-4" style={{ background: "#0d1016" }}>
          <div
            className="font-mono text-[9px] tracking-[0.24em] uppercase"
            style={{ color: `${CREAM}60` }}
          >
            {label}
          </div>
          <div className="mt-1 flex items-baseline gap-1">
            <OdometerNumber
              value={Number(value)}
              className="text-[34px] leading-none font-bold"
              style={{ color: CREAM }}
              delay={0.42 + index * 0.24}
              duration={0.85}
            />
            <span className="font-mono text-[10px]" style={{ color: CYAN }}>
              WPM
            </span>
          </div>
          <div className="mt-2 text-[12px]" style={{ color: `${CREAM}80` }}>
            {note}
          </div>
        </div>
      ))}
    </div>
  )
}

export function StatsShowcase() {
  return (
    <section
      id="stats"
      className="relative z-10 mx-auto max-w-site px-6 py-16 sm:py-20"
    >
      <SectionHeader
        kicker="§04 · honest numbers"
        title="Stats that don't lie about you."
        sub="VeloKey tracks raw speed, net WPM, accuracy, error decay, and consistency — the signals that actually predict whether you'll be faster next month."
      />

      <div
        className="grid grid-cols-1 gap-px border sm:grid-cols-2 lg:auto-rows-[260px] lg:grid-cols-[1.6fr_1fr_1fr]"
        style={{ background: `${CREAM}10`, borderColor: `${CREAM}10` }}
      >
        <BigStat
          index={0}
          className="justify-start gap-5 lg:col-span-1 lg:row-span-2 lg:p-8"
        >
          <StatLabel eyebrow="speed split" title="Raw vs net" />
          <WPMGauge />
          <SpeedSplit />
        </BigStat>
        <BigStat index={1} className="lg:col-span-2">
          <AccuracyCard />
        </BigStat>
        <BigStat index={2} className="justify-start gap-3 lg:col-span-1">
          <StatLabel eyebrow="consistency" title="Less wobble" />
          <div className="-mb-2">
            <ConsistencyChart />
          </div>
        </BigStat>
        <BigStat index={3} className="justify-start gap-3 lg:col-span-1">
          <StatLabel eyebrow="errors" title="Decay" />
          <div className="-mb-2">
            <ErrorDecayChart />
          </div>
        </BigStat>
      </div>
    </section>
  )
}
