"use client"

import { useState, useTransition, useEffect, useCallback } from "react"
import { useRouter, usePathname } from "next/navigation"
import { motion, AnimatePresence } from "motion/react"
import {
  IconSwords,
  IconDoorEnter,
  IconBolt,
  IconClock,
  IconLetterA,
  IconDice,
  IconPencil,
  IconLoader2,
} from "@tabler/icons-react"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import { generateRoomCode } from "@/lib/room-code"
import { normalizeRoomCode, isValidRoomCode } from "@/lib/room-code"
import {
  getOrCreateNickname,
  setNickname,
  refreshNickname,
} from "@/lib/race-identity"
import type { RaceMode } from "@/shared/race-protocol"
import { useQuickMatch } from "@/hooks/use-quick-match"
import { partyRoomUrl } from "@/lib/partykit-host"

interface RaceCreateJoinDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function RaceCreateJoinDialog({
  open,
  onOpenChange,
}: RaceCreateJoinDialogProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [isPending, startTransition] = useTransition()

  const [tab, setTab] = useState<"create" | "join">("create")
  const [mode, setMode] = useState<RaceMode>("words")
  const [wordOption, setWordOption] = useState(25)
  const [timeOption, setTimeOption] = useState(30)
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">(
    "easy"
  )
  const [joinCode, setJoinCode] = useState("")
  const [joinError, setJoinError] = useState("")
  const [nick, setNick] = useState(() => getOrCreateNickname())
  const [editingNick, setEditingNick] = useState(false)

  const configureRoom = useCallback(
    async (code: string, config: Record<string, unknown>) => {
      const response = await fetch(partyRoomUrl(code), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      })
      if (!response.ok) throw new Error("Unable to prepare race room")
    },
    []
  )

  const handleMatched = useCallback(
    async (
      code: string,
      config: {
        mode: RaceMode
        wordOption: number
        timeOption: number
        difficulty: "easy" | "medium" | "hard"
      }
    ) => {
      try {
        await configureRoom(code, { ...config, isQuickMatch: true })
        startTransition(() => router.push(`/race/${code}`))
      } catch {
        setJoinError(
          "Matched, but the race room could not be prepared. Please try again."
        )
      }
    },
    [configureRoom, router]
  )

  const quickMatch = useQuickMatch(handleMatched)

  // Close dialog when we actually navigate away
  useEffect(() => {
    if (open && pathname.startsWith("/race/")) {
      onOpenChange(false)
    }
  }, [pathname, open, onOpenChange])

  const handleCreate = async () => {
    const code = generateRoomCode()
    try {
      await configureRoom(code, {
        mode,
        wordOption,
        timeOption,
        difficulty,
        isQuickMatch: false,
      })
      startTransition(() => router.push(`/race/${code}`))
    } catch {
      setJoinError("Unable to create the race room. Please try again.")
    }
  }

  const handleJoin = () => {
    const normalized = normalizeRoomCode(joinCode)
    if (!normalized || !isValidRoomCode(normalized)) {
      setJoinError("Invalid room code")
      return
    }
    setJoinError("")

    startTransition(() => {
      router.push(`/race/${normalized}`)
    })
  }

  const handleQuickMatch = () =>
    quickMatch.findMatch({ mode, wordOption, timeOption, difficulty })
  const isMatchmaking =
    quickMatch.status === "connecting" ||
    quickMatch.status === "searching" ||
    quickMatch.status === "matched"

  const handleNickSave = () => {
    setNickname(nick)
    setEditingNick(false)
  }

  const handleRandomNick = () => {
    const newNick = refreshNickname()
    setNick(newNick)
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) quickMatch.cancel()
        onOpenChange(nextOpen)
      }}
    >
      <DialogContent className="max-w-md gap-0 overflow-hidden border-border/60 bg-background/95 p-0 backdrop-blur-xl">
        <DialogTitle className="sr-only">Join a Race</DialogTitle>

        {/* Nickname bar */}
        <div className="flex items-center gap-2 px-5 pt-5 pb-3">
          <div className="flex flex-1 items-center gap-2">
            <span className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
              Playing as
            </span>
            {editingNick ? (
              <input
                type="text"
                value={nick}
                onChange={(e) => setNick(e.target.value)}
                onBlur={handleNickSave}
                onKeyDown={(e) => e.key === "Enter" && handleNickSave()}
                className="w-36 rounded-lg bg-muted px-2.5 py-1 text-sm font-medium outline-none focus:ring-1 focus:ring-primary"
                autoFocus
                maxLength={20}
              />
            ) : (
              <button
                type="button"
                onClick={() => setEditingNick(true)}
                className="flex cursor-pointer items-center gap-1.5 text-sm font-semibold text-foreground transition-colors hover:text-primary"
              >
                {nick}
                <IconPencil size={12} className="text-muted-foreground" />
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={handleRandomNick}
            className="cursor-pointer rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label="Random nickname"
          >
            <IconDice size={16} />
          </button>
        </div>

        <div className="h-px bg-border/60" />

        {/* Tab switcher */}
        <div className="mx-4 mt-3 flex gap-1 rounded-xl bg-muted p-1.5">
          {(["create", "join"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={cn(
                "flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg py-2 text-xs font-semibold transition-all duration-200 select-none",
                tab === t
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {t === "create" ? (
                <IconSwords size={14} />
              ) : (
                <IconDoorEnter size={14} />
              )}
              {t === "create" ? "Create Room" : "Join Room"}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="px-5 py-4">
          <AnimatePresence mode="wait">
            {tab === "create" ? (
              <motion.div
                key="create"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.15 }}
                className="flex flex-col gap-4"
              >
                {/* Mode */}
                <div className="flex flex-col gap-2">
                  <span className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
                    Mode
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      {
                        value: "words" as const,
                        icon: IconLetterA,
                        label: "Words",
                        desc: "First to finish",
                      },
                      {
                        value: "time" as const,
                        icon: IconClock,
                        label: "Time",
                        desc: "Highest WPM",
                      },
                    ].map(({ value, icon: Icon, label, desc }) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setMode(value)}
                        className={cn(
                          "flex cursor-pointer flex-col items-center gap-1 rounded-xl border p-3 transition-all duration-200 select-none",
                          mode === value
                            ? "border-primary/50 bg-primary/10 text-primary shadow-xs"
                            : "border-border/60 bg-muted/50 text-muted-foreground hover:border-border hover:text-foreground"
                        )}
                      >
                        <Icon size={20} />
                        <span className="text-xs font-semibold">{label}</span>
                        <span className="text-[10px] text-muted-foreground">
                          {desc}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Options */}
                <div className="flex flex-col gap-2">
                  <span className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
                    {mode === "words" ? "Word Count" : "Duration"}
                  </span>
                  <div className="grid grid-cols-3 gap-2">
                    {(mode === "words" ? [25, 50, 100] : [15, 30, 60]).map(
                      (opt) => (
                        <button
                          key={opt}
                          type="button"
                          onClick={() =>
                            mode === "words"
                              ? setWordOption(opt)
                              : setTimeOption(opt)
                          }
                          className={cn(
                            "cursor-pointer rounded-xl border py-2 text-sm font-semibold transition-all duration-200 select-none",
                            (mode === "words" ? wordOption : timeOption) === opt
                              ? "border-primary/50 bg-primary/10 text-primary shadow-xs"
                              : "border-border/60 bg-muted/50 text-muted-foreground hover:text-foreground"
                          )}
                        >
                          {mode === "words" ? opt : `${opt}s`}
                        </button>
                      )
                    )}
                  </div>
                </div>

                {/* Difficulty */}
                <div className="flex flex-col gap-2">
                  <span className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
                    Difficulty
                  </span>
                  <div className="grid grid-cols-3 gap-2">
                    {(["easy", "medium", "hard"] as const).map((d) => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => setDifficulty(d)}
                        className={cn(
                          "cursor-pointer rounded-xl border py-2 text-xs font-semibold capitalize transition-all duration-200 select-none",
                          difficulty === d
                            ? "border-primary/50 bg-primary/10 text-primary shadow-xs"
                            : "border-border/60 bg-muted/50 text-muted-foreground hover:text-foreground"
                        )}
                      >
                        {d}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Create button */}
                <button
                  type="button"
                  onClick={handleCreate}
                  disabled={isPending || isMatchmaking}
                  className="flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-bold text-primary-foreground shadow-sm transition-all duration-200 select-none hover:opacity-90 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isPending ? (
                    <IconLoader2 size={16} className="animate-spin" />
                  ) : (
                    <IconSwords size={16} />
                  )}
                  {isPending ? "Creating Room..." : "Create Room"}
                </button>

                <div className="my-1 flex items-center gap-3">
                  <div className="h-px flex-1 bg-border/60" />
                  <span className="text-[10px] font-medium tracking-wider text-muted-foreground uppercase">
                    or
                  </span>
                  <div className="h-px flex-1 bg-border/60" />
                </div>

                {/* Quick match */}
                <button
                  type="button"
                  onClick={handleQuickMatch}
                  disabled={isPending || isMatchmaking}
                  className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-border/60 bg-muted/50 py-3 text-sm font-semibold text-muted-foreground transition-all duration-200 select-none hover:border-primary/40 hover:text-foreground active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isMatchmaking || isPending ? (
                    <IconLoader2 size={16} className="animate-spin" />
                  ) : (
                    <IconBolt size={16} />
                  )}
                  {isMatchmaking
                    ? `Finding players${quickMatch.waitMs >= quickMatch.suggestedTimeoutMs ? " — still searching" : "..."}`
                    : "Quick Match"}
                </button>
              </motion.div>
            ) : (
              <motion.div
                key="join"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.15 }}
                className="flex flex-col gap-4"
              >
                <div className="flex flex-col gap-2">
                  <span className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
                    Room Code
                  </span>
                  <input
                    type="text"
                    value={joinCode}
                    onChange={(e) => {
                      setJoinCode(e.target.value.toUpperCase())
                      setJoinError("")
                    }}
                    onKeyDown={(e) => e.key === "Enter" && handleJoin()}
                    placeholder="VELO-XXXX"
                    maxLength={9}
                    className="w-full rounded-xl border border-border/60 bg-muted/50 px-4 py-3 text-center font-mono text-lg font-bold tracking-[0.25em] text-foreground transition-all outline-none placeholder:text-muted-foreground/40 focus:border-primary/50 focus:ring-2 focus:ring-primary/50"
                    autoFocus
                  />
                  {joinError && (
                    <span className="text-xs font-medium text-destructive">
                      {joinError}
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={handleJoin}
                  disabled={
                    isPending ||
                    isMatchmaking ||
                    joinCode.replace(/[\s\-]/g, "").length < 4
                  }
                  className="flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-bold text-primary-foreground shadow-sm transition-all duration-200 select-none hover:opacity-90 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {isPending ? (
                    <IconLoader2 size={16} className="animate-spin" />
                  ) : (
                    <IconDoorEnter size={16} />
                  )}
                  {isPending ? "Joining Room..." : "Join Room"}
                </button>

                <div className="my-1 flex items-center gap-3">
                  <div className="h-px flex-1 bg-border/60" />
                  <span className="text-[10px] font-medium tracking-wider text-muted-foreground uppercase">
                    or
                  </span>
                  <div className="h-px flex-1 bg-border/60" />
                </div>

                <button
                  type="button"
                  onClick={handleQuickMatch}
                  disabled={isPending || isMatchmaking}
                  className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-border/60 bg-muted/50 py-3 text-sm font-semibold text-muted-foreground transition-all duration-200 select-none hover:border-primary/40 hover:text-foreground active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isMatchmaking || isPending ? (
                    <IconLoader2 size={16} className="animate-spin" />
                  ) : (
                    <IconBolt size={16} />
                  )}
                  {isMatchmaking
                    ? `Finding players${quickMatch.waitMs >= quickMatch.suggestedTimeoutMs ? " — still searching" : "..."}`
                    : "Quick Match"}
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  )
}
