"use client"

import { useEffect, useState } from "react"
import type { CSSProperties } from "react"
import { motion, useScroll, useMotionValueEvent } from "motion/react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowUpRight } from "@phosphor-icons/react"
import { CREAM, CYAN, INK } from "./lib/colors"
import BackgroundGrid from "./_components/BackgroundGrid"
import { Modes } from "./_components/Modes"
import { StatsShowcase } from "./_components/StatsShowcase"
import { Hero } from "./_components/Hero"
import { KeyboardStrip } from "./_components/KeyboardStrip"
import { MobileSurface } from "./_components/MobileSurface"
import { LanguageSupport } from "./_components/LanguageSupport"
import { Process } from "./_components/Process"
import { SoundWave } from "./_components/SoundWave"
import { FinalCTA } from "./_components/FinalCTA"
import { FAQ } from "./_components/FAQ"
import { Footer } from "./_components/Footer"

type LandingStyle = CSSProperties & Record<`--${string}`, string>

const landingStyle: LandingStyle = {
  background: INK,
  color: CREAM,
  "--background": INK,
  "--foreground": CREAM,
  "--card": "#0d1016",
  "--card-foreground": CREAM,
  "--popover": "#0d1016",
  "--popover-foreground": CREAM,
  "--primary": CYAN,
  "--primary-foreground": CREAM,
  "--secondary": "#121720",
  "--secondary-foreground": CREAM,
  "--muted": "#151a23",
  "--muted-foreground": `${CREAM}99`,
  "--accent": `${CYAN}24`,
  "--accent-foreground": CREAM,
  "--border": `${CREAM}24`,
  "--input": `${CREAM}24`,
  "--ring": CYAN,
  "--color-background": INK,
  "--color-foreground": CREAM,
  "--color-card": "#0d1016",
  "--color-card-foreground": CREAM,
  "--color-popover": "#0d1016",
  "--color-popover-foreground": CREAM,
  "--color-primary": CYAN,
  "--color-primary-foreground": CREAM,
  "--color-secondary": "#121720",
  "--color-secondary-foreground": CREAM,
  "--color-muted": "#151a23",
  "--color-muted-foreground": `${CREAM}99`,
  "--color-accent": `${CYAN}24`,
  "--color-accent-foreground": CREAM,
  "--color-border": `${CREAM}24`,
  "--color-input": `${CREAM}24`,
  "--color-ring": CYAN,
  "--font-sans": '"Space Grotesk", ui-sans-serif, system-ui, sans-serif',
  "--font-mono": '"Geist Mono", ui-monospace, SFMono-Regular, monospace',
}

export default function LandingPage() {
  const router = useRouter()

  useEffect(() => {
    const root = document.documentElement
    const previousAccent = root.getAttribute("data-accent")

    root.setAttribute("data-accent", "teal")

    return () => {
      if (previousAccent) {
        root.setAttribute("data-accent", previousAccent)
      } else {
        root.removeAttribute("data-accent")
      }
    }
  }, [])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (!event.metaKey || event.key.toLowerCase() !== "k") return

      const target = event.target as HTMLElement | null
      const tag = target?.tagName
      const isTypingField =
        target?.isContentEditable ||
        tag === "INPUT" ||
        tag === "TEXTAREA" ||
        tag === "SELECT"

      if (isTypingField) return

      event.preventDefault()
      router.push("/")
    }

    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [router])

  return (
    <div
      className="landing-theme relative min-h-screen overflow-x-hidden font-sans"
      style={landingStyle}
    >
      <BackgroundGrid />
      <NoiseOverlay />
      <TopBar />
      <Hero />
      <KeyboardStrip />
      <MobileSurface />
      <Modes />
      <LanguageSupport />
      <StatsShowcase />
      <Process />
      <SoundWave />
      <FAQ />
      <FinalCTA />
      <Footer />
    </div>
  )
}

function NoiseOverlay() {
  return (
    <svg
      aria-hidden
      className="pointer-events-none fixed inset-0 z-1 h-full w-full opacity-[0.05] mix-blend-overlay"
    >
      <filter id="grain">
        <feTurbulence
          type="fractalNoise"
          baseFrequency="0.85"
          numOctaves="2"
          stitchTiles="stitch"
        />
        <feColorMatrix values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 0.6 0" />
      </filter>
      <rect width="100%" height="100%" filter="url(#grain)" />
    </svg>
  )
}

const NAV_ITEMS = [
  { href: "#modes", label: "Modes" },
  { href: "#languages", label: "Languages" },
  { href: "#stats", label: "Stats" },
  { href: "#process", label: "Process" },
  { href: "#open", label: "Source" },
] as const

function TopBar() {
  const [scrolled, setScrolled] = useState(false)
  const { scrollY } = useScroll()

  useMotionValueEvent(scrollY, "change", (latest) => {
    setScrolled(latest > 8)
  })

  return (
    <motion.header
      className="sticky top-0 z-30 w-full"
      initial={{ y: -28, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
    >
      <motion.div
        className="mx-auto w-full max-w-site px-6"
        animate={{
          paddingTop: scrolled ? 10 : 18,
          paddingBottom: scrolled ? 6 : 0,
        }}
        transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
      >
        <motion.div
          className="relative flex h-12 w-full items-stretch"
          style={{
            backdropFilter: "blur(18px) saturate(140%)",
            WebkitBackdropFilter: "blur(18px) saturate(140%)",
          }}
          animate={{
            backgroundColor: scrolled
              ? "rgba(10,12,16,0.78)"
              : "rgba(10,12,16,0.42)",
            boxShadow: scrolled
              ? `0 24px 70px -18px rgba(0,0,0,0.65), inset 0 1px 0 ${CYAN}26, inset 0 -1px 0 ${CREAM}08`
              : `inset 0 1px 0 ${CYAN}1a, inset 0 -1px 0 ${CREAM}06`,
          }}
          transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
        >
          {/* hairline cyan accent at the top edge */}
          <span
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-0 h-px opacity-60"
            style={{
              background: `linear-gradient(90deg, transparent 0%, ${CYAN}80 20%, ${CYAN} 50%, ${CYAN}80 80%, transparent 100%)`,
            }}
          />
          <BarCornerTick position="tl" />
          <BarCornerTick position="tr" />
          <BarCornerTick position="bl" />
          <BarCornerTick position="br" />

          {/* LEFT — brand cluster */}
          <Link
            href="/"
            className="group flex items-center gap-4 px-5"
            style={{ borderRight: `1px solid ${CREAM}10` }}
          >
            <span
              className="font-(family-name:--font-doto) text-[24px] leading-none font-bold tracking-tight transition-[text-shadow] duration-300 group-hover:[text-shadow:0_0_18px_var(--cyan-glow)]"
              style={
                {
                  color: CYAN,
                  ["--cyan-glow" as string]: `${CYAN}80`,
                } as CSSProperties
              }
            >
              VeloKey
            </span>
            <div className="hidden flex-col items-start gap-0.75 lg:flex">
              <span
                className="font-mono text-[10px] leading-none tracking-[0.08em]"
                style={{ color: `${CREAM}d0` }}
              >
                v1.0
              </span>
            </div>
          </Link>

          {/* CENTER — segmented nav */}
          <nav className="hidden min-w-0 flex-1 items-stretch xl:flex">
            {NAV_ITEMS.map((item, i) => (
              <NavCell
                key={item.href}
                index={i + 1}
                href={item.href}
                label={item.label}
                isLast={i === NAV_ITEMS.length - 1}
              />
            ))}
          </nav>

          {/* RIGHT — social, CTA */}
          <div
            className="ml-auto flex shrink-0 items-stretch"
            style={{ borderLeft: `1px solid ${CREAM}10` }}
          >
            <a
              href="https://x.com/sh17va"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Follow on X"
              className="group grid place-items-center px-3 transition-colors lg:px-3.5 cursor-pointer"
              style={{
                color: `${CREAM}b0`,
                borderRight: `1px solid ${CREAM}08`,
              }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 16 16"
                height="14"
                width="14"
                aria-hidden
                fill="currentColor"
                className="transition-transform duration-300 group-hover:scale-110 group-hover:text-(--c)"
                style={{ ["--c" as string]: CREAM } as CSSProperties}
              >
                <path d="M12.6 0.75h2.454l-5.36 6.142L16 15.25h-4.937l-3.867 -5.07 -4.425 5.07H0.316l5.733 -6.57L0 0.75h5.063l3.495 4.633L12.601 0.75Zm-0.86 13.028h1.36L4.323 2.145H2.865z" />
              </svg>
            </a>

            <Link
              href="/"
              className="group relative flex h-full max-w-[11.75rem] items-center justify-center gap-1.5 overflow-hidden px-2 text-[10px] leading-none font-semibold tracking-[0.1em] uppercase whitespace-nowrap transition-colors sm:px-3 sm:text-[11px] lg:gap-2 lg:px-3.5 lg:tracking-[0.12em]"
              style={{
                background: CYAN,
                color: INK,
                boxShadow: `inset 0 1px 0 rgba(255,255,255,0.32), inset 0 -1px 0 rgba(10,12,16,0.18)`,
              }}
            >
              <span
                aria-hidden
                className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                style={{
                  background: `linear-gradient(180deg, rgba(255,255,255,0.22) 0%, rgba(255,255,255,0) 100%)`,
                }}
              />
              <ArrowUpRight
                weight="bold"
                size={13}
                className="transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
              />
              <span className="truncate">Start Typing</span>
            </Link>
          </div>
        </motion.div>
      </motion.div>
    </motion.header>
  )
}

function NavCell({
  index,
  href,
  label,
  isLast,
}: {
  index: number
  href: string
  label: string
  isLast: boolean
}) {
  const padded = index.toString().padStart(2, "0")
  return (
    <a
      href={href}
      className="group relative flex flex-1 items-center justify-center gap-2 px-3 lg:gap-2.5 lg:px-5"
      style={{ borderRight: isLast ? undefined : `1px solid ${CREAM}08` }}
    >
      {/* hover wash */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background: `linear-gradient(180deg, ${CYAN}14 0%, ${CYAN}00 70%)`,
        }}
      />
      <span
        className="hidden font-mono text-[9px] tracking-[0.2em] transition-colors duration-300 lg:inline"
        style={{ color: `${CREAM}38` }}
      >
        {padded}
      </span>
      <span
        className="text-[11px] leading-none tracking-[0.14em] uppercase transition-colors duration-300 group-hover:text-(--cream) lg:text-[12px] lg:tracking-[0.18em]"
        style={
          {
            color: `${CREAM}c0`,
            ["--cream" as string]: CREAM,
          } as CSSProperties
        }
      >
        {label}
      </span>
      {/* underline draw */}
      <span
        aria-hidden
        className="pointer-events-none absolute bottom-0 left-1/2 h-0.5 w-0 -translate-x-1/2 transition-[width] duration-300 ease-out group-hover:w-[64%]"
        style={{
          background: CYAN,
          boxShadow: `0 0 12px ${CYAN}, 0 0 4px ${CYAN}`,
        }}
      />
    </a>
  )
}

function BarCornerTick({ position }: { position: "tl" | "tr" | "bl" | "br" }) {
  const map: Record<typeof position, string> = {
    tl: "left-[-1px] top-[-1px] border-l border-t",
    tr: "right-[-1px] top-[-1px] border-r border-t",
    bl: "left-[-1px] bottom-[-1px] border-l border-b",
    br: "right-[-1px] bottom-[-1px] border-r border-b",
  }
  return (
    <span
      aria-hidden
      className={`pointer-events-none absolute h-1.5 w-1.5 ${map[position]}`}
      style={{ borderColor: CYAN }}
    />
  )
}
