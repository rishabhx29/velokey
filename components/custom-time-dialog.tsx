"use client"

import { useEffect, useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"

interface CustomTimeDialogProps {
  timeOption: number
  onSave: (next: number) => void
  trigger: React.ReactNode
}

export function CustomTimeDialog({
  timeOption,
  onSave,
  trigger,
}: CustomTimeDialogProps) {
  const [open, setOpen] = useState(false)
  const [value, setValue] = useState("")

  useEffect(() => {
    if (open) {
      queueMicrotask(() => setValue(timeOption.toString()))
    }
  }, [open, timeOption])

  const MAX_SECONDS = 3600

  // Parse "90", "1h30m", "2h", "45m" → seconds. Returns null for invalid input.
  function parseDuration(trimmed: string): number | null {
    if (trimmed.length === 0) return null
    if (/^\d+$/.test(trimmed)) {
      const n = parseInt(trimmed, 10)
      return Number.isFinite(n) ? n : null
    }
    if (/^\d+h(\d+m)?$|^\d+m$/.test(trimmed)) {
      const hMatch = trimmed.match(/(\d+)h/)
      const mMatch = trimmed.match(/(\d+)m/)
      let seconds = 0
      if (hMatch) seconds += parseInt(hMatch[1], 10) * 3600
      if (mMatch) seconds += parseInt(mMatch[1], 10) * 60
      return seconds
    }
    return null
  }

  function handleSave() {
    const seconds = parseDuration(value.trim())
    // 0 is rejected: there is no infinite mode — the timer would end the
    // test after a single tick.
    if (seconds === null || seconds <= 0 || seconds > MAX_SECONDS) {
      return
    }
    onSave(seconds)
    setOpen(false)
  }

  const invalid = (() => {
    const seconds = parseDuration(value.trim())
    return (
      value.trim() !== "" &&
      (seconds === null || seconds <= 0 || seconds > MAX_SECONDS)
    )
  })()

  // Determine subtext based on current value
  let subtext = ""
  if (value.trim() === "") {
    subtext = ""
  } else if (invalid) {
    subtext = "enter 1–3600 seconds (e.g. 90, 1h30m, 45m)"
  } else {
    const seconds = parseDuration(value.trim())!
    if (seconds === 1) subtext = "1 second"
    else if (seconds % 3600 === 0 && seconds >= 3600)
      subtext = `${seconds / 3600} hour${seconds > 3600 ? "s" : ""}`
    else if (seconds % 60 === 0 && seconds >= 60)
      subtext = `${seconds / 60} minute${seconds > 60 ? "s" : ""}`
    else subtext = `${seconds} seconds`
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent
        className={cn(
          "w-[min(420px,calc(100vw-2rem))] sm:max-w-[420px]",
          "overflow-hidden rounded-xl border border-border bg-zinc-100 p-0 shadow-2xl dark:bg-[#111111]",
          "duration-300 ease-out",
          "data-open:fade-in-0 data-open:zoom-in-95 data-open:slide-in-from-bottom-2",
          "data-closed:fade-out-0 data-closed:zoom-out-95 data-closed:slide-out-to-bottom-2"
        )}
      >
        <div className="flex flex-col gap-6 p-6">
          <DialogTitle className="font-(family-name:--font-doto) text-[1.35rem] font-bold tracking-wide text-zinc-900 dark:text-zinc-100">
            Test Duration
          </DialogTitle>

          <div className="flex flex-col gap-2">
            <span className="text-[13px] font-medium text-zinc-500 dark:text-zinc-400">
              {subtext || "0 seconds"}
            </span>
            <input
              type="text"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault()
                  handleSave()
                }
              }}
              className="w-full rounded-lg border border-zinc-300 bg-zinc-200/50 px-4 py-3 font-mono text-sm text-zinc-900 transition-colors outline-none focus:ring-1 focus:ring-primary dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
              autoFocus
            />
          </div>

          <div className="flex flex-col gap-4 font-mono text-[13px] leading-relaxed text-zinc-600 dark:text-zinc-400">
            <p>
              You can use &quot;h&quot; for hours and &quot;m&quot; for minutes,
              for example &quot;1h30m&quot;. Maximum is 1 hour.
            </p>
          </div>

          <button
            type="button"
            onClick={handleSave}
            disabled={invalid}
            className="w-full cursor-pointer rounded-lg border border-zinc-300 bg-zinc-200/80 py-2.5 font-mono text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-200 hover:text-zinc-900 disabled:cursor-not-allowed disabled:opacity-40 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 hover:dark:bg-zinc-800 hover:dark:text-zinc-100"
          >
            apply
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
