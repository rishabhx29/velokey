"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react"
import { useMountEffect } from "@/hooks/use-mount-effect"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { motion } from "motion/react"
import {
  IconInfoCircle,
  IconSettings,
  IconTargetArrow,
  IconChartLine,
  IconSwords,
  IconHistory,
} from "@tabler/icons-react"

import { DynamicFavicon } from "@/components/dynamic-favicon"
import { PracticeDashboard } from "@/components/practice-dashboard"
import { RaceCreateJoinDialog } from "@/components/race-create-join-dialog"
import { SettingsPanel } from "@/components/settings-panel"
import { cn } from "@/lib/utils"
import { useClickSound } from "@/hooks/use-click-sound"

interface AppChromeContextValue {
  settingsOpen: boolean
  setSettingsOpen: (open: boolean) => void
  testSettingsOpen: boolean
  setTestSettingsOpen: (open: boolean) => void
  typingActive: boolean
  setTypingActive: (active: boolean) => void
  homeLogoHandlerRef: React.MutableRefObject<(() => void) | null>
  startPracticeRef: React.MutableRefObject<((words: string[]) => void) | null>
  setDashboardOpenRef: React.MutableRefObject<((open: boolean) => void) | null>
}

/** Minimal typings for the VirtualKeyboard API (Chrome/Edge on Android). */
interface VirtualKeyboard extends EventTarget {
  overlaysContent: boolean
  boundingRect: { height: number }
}

const AppChromeContext = createContext<AppChromeContextValue | null>(null)

export function useAppChrome() {
  const ctx = useContext(AppChromeContext)
  if (!ctx) throw new Error("useAppChrome must be used within AppChrome")
  return ctx
}

export function AppChrome({ children }: { children: ReactNode }) {
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [testSettingsOpen, setTestSettingsOpen] = useState(false)
  const [typingActive, setTypingActive] = useState(false)
  const [keyboardInset, setKeyboardInset] = useState(0)
  const [isMobile, setIsMobile] = useState(true)
  const homeLogoHandlerRef = useRef<(() => void) | null>(null)
  const startPracticeRef = useRef<((words: string[]) => void) | null>(null)
  const setDashboardOpenRef = useRef<((open: boolean) => void) | null>(null)
  useClickSound()

  useEffect(() => {
    if (typeof window === "undefined") return

    const checkMobile = () =>
      queueMicrotask(() => setIsMobile(window.innerWidth < 1024))
    checkMobile()
    window.addEventListener("resize", checkMobile)

    // Modern VirtualKeyboard API (Chrome/Edge/Android)
    const vk = (navigator as Navigator & { virtualKeyboard?: VirtualKeyboard })
      .virtualKeyboard
    if (vk) {
      vk.overlaysContent = true
      const onGeometryChange = (e: Event) => {
        const { height } = (e.target as VirtualKeyboard).boundingRect
        queueMicrotask(() => setKeyboardInset(height))
      }
      vk.addEventListener("geometrychange", onGeometryChange)

      return () => {
        window.removeEventListener("resize", checkMobile)
        vk.removeEventListener("geometrychange", onGeometryChange)
      }
    }

    // Fallback for iOS Safari (which doesn't support virtualKeyboard API yet)
    const vv = window.visualViewport
    if (!vv) {
      return () => window.removeEventListener("resize", checkMobile)
    }

    const onResize = () => {
      // On iOS, when keyboard opens, visualViewport.height shrinks.
      const delta = window.innerHeight - vv.height
      queueMicrotask(() => setKeyboardInset(delta > 100 ? delta : 0))
    }

    vv.addEventListener("resize", onResize)
    return () => {
      vv.removeEventListener("resize", onResize)
      window.removeEventListener("resize", checkMobile)
    }
  }, [])

  useMountEffect(() => {
    if ("serviceWorker" in navigator) {
      if (process.env.NODE_ENV === "production") {
        navigator.serviceWorker.register("/sw.js").catch(() => {})
      } else {
        navigator.serviceWorker.getRegistrations().then((regs) => {
          regs.forEach((r) => r.unregister())
        })
      }
    }
  })

  const value = useMemo(
    () => ({
      settingsOpen,
      setSettingsOpen,
      testSettingsOpen,
      setTestSettingsOpen,
      typingActive,
      setTypingActive,
      homeLogoHandlerRef,
      startPracticeRef,
      setDashboardOpenRef,
    }),
    [settingsOpen, testSettingsOpen, typingActive]
  )

  const keyboardOpen = keyboardInset > 0

  return (
    <AppChromeContext.Provider value={value}>
      <DynamicFavicon />
      <motion.div
        initial={false}
        animate={{
          height:
            isMobile && keyboardOpen
              ? `calc(100dvh - ${keyboardInset}px)`
              : "100dvh",
          opacity: keyboardOpen ? [0.9, 1] : 1,
          y: keyboardOpen ? [14, 0] : 0,
        }}
        transition={{
          height: { duration: 0.28, ease: [0.22, 1, 0.36, 1] },
          opacity: { duration: 0.32, ease: [0.22, 1, 0.36, 1] },
          y: { duration: 0.34, ease: [0.22, 1, 0.36, 1] },
        }}
        className="flex w-full flex-col bg-background"
        style={{ minHeight: isMobile && keyboardOpen ? 0 : "100dvh" }}
      >
        <SiteHeader />
        {children}
      </motion.div>
      <SettingsPanel
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />
    </AppChromeContext.Provider>
  )
}

function VeloKeyLogo({
  onClick,
  isButton,
}: {
  onClick?: () => void
  isButton?: boolean
}) {
  const content = (
    <div className="group flex items-center gap-3 select-none">
      {/* 3D Keycap Emblem */}
      <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 via-primary/10 to-transparent p-[1px] shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)] transition-all duration-300 group-hover:scale-105 group-active:scale-95">
        <div className="absolute inset-0 rounded-xl border border-primary/30 transition-colors group-hover:border-primary/60" />
        <div className="flex h-full w-full items-center justify-center rounded-[10px] bg-background/90 shadow-sm backdrop-blur-md">
          <svg
            className="h-5 w-5 text-primary transition-transform duration-300 group-hover:translate-x-0.5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M7 17l5-5-5-5" />
            <path d="M13 17l5-5-5-5" />
          </svg>
        </div>
        <div className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-primary shadow-[0_0_8px_var(--primary)] transition-transform duration-300 group-hover:scale-125" />
      </div>

      {/* Typography Lockup */}
      <div className="flex flex-col text-left">
        <span className="flex items-center gap-0.5 font-sans text-xl font-extrabold tracking-tight text-foreground">
          Velo<span className="font-mono font-bold text-primary">Key</span>
        </span>
        <span className="-mt-1 font-mono text-[9px] font-medium tracking-[0.24em] text-muted-foreground/75 uppercase">
          Velocity Mode
        </span>
      </div>
    </div>
  )

  if (isButton) {
    return (
      <button
        type="button"
        onClick={onClick}
        className="cursor-pointer rounded-xl focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
      >
        {content}
      </button>
    )
  }

  return (
    <Link
      href="/"
      className="cursor-pointer rounded-xl focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
    >
      {content}
    </Link>
  )
}

function SiteHeader() {
  const router = useRouter()
  const pathname = usePathname()
  const isHome = pathname === "/"
  const {
    typingActive,
    setSettingsOpen,
    setDashboardOpenRef,
    homeLogoHandlerRef,
    startPracticeRef,
  } = useAppChrome()
  const [mouseHeaderVisible, setMouseHeaderVisible] = useState(false)
  const [dashboardOpen, setDashboardOpenLocal] = useState(false)
  const [raceDialogOpen, setRaceDialogOpen] = useState(false)
  const headerTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    setDashboardOpenRef.current = setDashboardOpenLocal
    return () => {
      setDashboardOpenRef.current = () => {}
    }
  }, [setDashboardOpenRef])

  // Derived visibility — no state sync needed; header dims only while an
  // active typing session on the home page is not being hovered.
  const effectiveHeaderVisible =
    !isHome || !typingActive ? true : mouseHeaderVisible

  const handleHeaderMouseMove = useCallback(() => {
    if (!isHome || !typingActive) return
    setMouseHeaderVisible(true)
    if (headerTimerRef.current) clearTimeout(headerTimerRef.current)
    headerTimerRef.current = setTimeout(
      () => setMouseHeaderVisible(false),
      2500
    )
  }, [isHome, typingActive])

  useMountEffect(() => {
    return () => {
      if (headerTimerRef.current) clearTimeout(headerTimerRef.current)
    }
  })

  function handleLogoClick() {
    if (isHome && homeLogoHandlerRef.current) {
      homeLogoHandlerRef.current()
      return
    }
    router.push("/")
  }

  const dimHeader = isHome && typingActive
  const iconButtonClass =
    "group relative flex h-9 w-9 items-center justify-center rounded-xl border border-border/50 bg-background/60 text-muted-foreground shadow-2xs backdrop-blur-md transition-all duration-200 hover:border-primary/40 hover:bg-primary/5 hover:text-foreground active:scale-95 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"

  let headerOpacity = 1
  if (dimHeader && !effectiveHeaderVisible) {
    headerOpacity = 0.1
  }

  return (
    <>
      <motion.header
        animate={{
          opacity: headerOpacity,
        }}
        transition={{ duration: 0.4, ease: "easeInOut" }}
        onMouseMove={handleHeaderMouseMove}
        className="sticky top-0 z-40 flex shrink-0 justify-center border-b border-border/60 bg-background/40 px-6 py-3 backdrop-blur-lg"
      >
        <div className="flex w-full max-w-site items-center justify-between">
          <div className="flex items-center gap-8">
            <VeloKeyLogo onClick={handleLogoClick} isButton={isHome} />

            <div className="flex items-center gap-2">
              <Link
                href="/stats"
                prefetch
                className={cn(
                  iconButtonClass,
                  pathname === "/stats" &&
                    "border-primary/50 bg-primary/10 text-foreground"
                )}
                aria-current={pathname === "/stats" ? "page" : undefined}
                aria-label="Stats Dashboard"
              >
                <IconChartLine
                  size={16}
                  stroke={1.5}
                  className="transition-transform duration-200 group-hover:scale-110"
                  aria-hidden
                />
              </Link>
              <Link
                href="/about"
                prefetch
                className={cn(
                  iconButtonClass,
                  pathname === "/about" &&
                    "border-primary/50 bg-primary/10 text-foreground"
                )}
                aria-current={pathname === "/about" ? "page" : undefined}
                aria-label="About VeloKey"
              >
                <IconInfoCircle
                  size={16}
                  stroke={1.5}
                  className="transition-transform duration-200 group-hover:scale-110"
                  aria-hidden
                />
              </Link>

              <Link
                href="/changelog"
                prefetch
                className={cn(
                  iconButtonClass,
                  pathname === "/changelog" &&
                    "border-primary/50 bg-primary/10 text-foreground"
                )}
                aria-current={pathname === "/changelog" ? "page" : undefined}
                aria-label="Changelog"
              >
                <IconHistory
                  size={16}
                  stroke={1.5}
                  className="transition-transform duration-200 group-hover:scale-110"
                  aria-hidden
                />
              </Link>

              {isHome && (
                <button
                  type="button"
                  onClick={() => setDashboardOpenLocal(true)}
                  className={cn(iconButtonClass, "cursor-pointer")}
                  aria-label="Practice dashboard"
                >
                  <IconTargetArrow
                    size={16}
                    stroke={1.5}
                    className="transition-transform duration-200 group-hover:scale-110"
                    aria-hidden
                  />
                </button>
              )}

              <button
                type="button"
                onClick={() => setSettingsOpen(true)}
                className={cn(iconButtonClass, "cursor-pointer")}
                aria-label="Settings"
              >
                <IconSettings
                  size={16}
                  stroke={1.5}
                  className="transition-transform duration-200 group-hover:rotate-45"
                />
              </button>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setRaceDialogOpen(true)}
            className="group flex items-center gap-2 rounded-xl border border-primary/30 bg-primary/10 px-3.5 py-1.5 text-sm font-medium text-primary shadow-xs backdrop-blur-md transition-all duration-200 hover:border-primary/60 hover:bg-primary/15 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none active:scale-95"
          >
            <IconSwords
              size={16}
              stroke={1.5}
              className="transition-transform duration-200 group-hover:scale-110"
              aria-hidden
            />
            <span>Join a Race</span>
          </button>
        </div>
      </motion.header>
      {isHome && (
        <PracticeDashboard
          open={dashboardOpen}
          onOpenChange={setDashboardOpenLocal}
          onStartPractice={(words) => startPracticeRef.current?.(words)}
        />
      )}
      <RaceCreateJoinDialog
        open={raceDialogOpen}
        onOpenChange={setRaceDialogOpen}
      />
    </>
  )
}
