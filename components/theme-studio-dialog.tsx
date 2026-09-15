"use client"

import { useEffect, useState } from "react"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import {
  IconPalette,
  IconCheck,
  IconRotateClockwise,
} from "@tabler/icons-react"

export interface ThemeStudioDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const STORAGE_KEY = "vk-custom-theme"

export interface CustomThemeConfig {
  primary: string
  backgroundDark: string
  enabled: boolean
}

export function loadCustomTheme(): CustomThemeConfig | null {
  if (typeof window === "undefined") return null
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as CustomThemeConfig
  } catch {
    return null
  }
}

export function applyCustomThemeToDom(config: CustomThemeConfig | null) {
  if (typeof document === "undefined") return
  let styleEl = document.getElementById("vk-custom-theme-style")
  if (!config || !config.enabled) {
    if (styleEl) styleEl.remove()
    return
  }

  if (!styleEl) {
    styleEl = document.createElement("style")
    styleEl.id = "vk-custom-theme-style"
    document.head.appendChild(styleEl)
  }

  styleEl.textContent = `
    :root, :root.dark {
      --primary: ${config.primary} !important;
      --ring: ${config.primary} !important;
      --background: ${config.backgroundDark} !important;
    }
  `
}

export function ThemeStudioDialog({
  open,
  onOpenChange,
}: ThemeStudioDialogProps) {
  const [primary, setPrimary] = useState("#38bdf8")
  const [backgroundDark, setBackgroundDark] = useState("#0f172a")

  useEffect(() => {
    const loaded = loadCustomTheme()
    if (loaded) {
      queueMicrotask(() => {
        setPrimary(loaded.primary)
        setBackgroundDark(loaded.backgroundDark)
      })
    }
  }, [open])

  const handleApply = () => {
    const cfg: CustomThemeConfig = { primary, backgroundDark, enabled: true }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cfg))
    applyCustomThemeToDom(cfg)
    onOpenChange(false)
  }

  const handleReset = () => {
    localStorage.removeItem(STORAGE_KEY)
    applyCustomThemeToDom(null)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-xl border-border bg-background p-6">
        <DialogTitle className="flex items-center gap-2 text-base font-semibold">
          <IconPalette className="size-5 text-primary" />
          VeloKey Theme Studio
        </DialogTitle>

        <p className="mt-1 text-xs text-muted-foreground">
          Design your own custom color scheme. Changes apply instantly and
          override prebuilt themes.
        </p>

        <div className="mt-4 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium">
              Accent / Primary Color
            </label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={primary}
                onChange={(e) => setPrimary(e.target.value)}
                className="size-7 cursor-pointer rounded border border-border bg-transparent p-0"
              />
              <input
                type="text"
                value={primary}
                onChange={(e) => setPrimary(e.target.value)}
                className="w-20 rounded border border-border bg-muted px-2 py-1 font-mono text-xs"
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <label className="text-xs font-medium">Background Color</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={backgroundDark}
                onChange={(e) => setBackgroundDark(e.target.value)}
                className="size-7 cursor-pointer rounded border border-border bg-transparent p-0"
              />
              <input
                type="text"
                value={backgroundDark}
                onChange={(e) => setBackgroundDark(e.target.value)}
                className="w-20 rounded border border-border bg-muted px-2 py-1 font-mono text-xs"
              />
            </div>
          </div>

          {/* Mini Preview Box */}
          <div
            className="mt-2 flex flex-col gap-2 rounded-lg border border-border p-4"
            style={{ backgroundColor: backgroundDark }}
          >
            <span className="font-mono text-[10px] tracking-wider text-muted-foreground uppercase">
              LIVE PREVIEW
            </span>
            <div
              className="font-mono text-sm leading-relaxed"
              style={{ color: primary }}
            >
              velokey <span className="opacity-40">custom theme preview</span>
            </div>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-between">
          <button
            type="button"
            onClick={handleReset}
            className="flex cursor-pointer items-center gap-1.5 rounded border border-border px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            <IconRotateClockwise className="size-3.5" />
            Reset to Default
          </button>

          <button
            type="button"
            onClick={handleApply}
            className="flex cursor-pointer items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-xs font-medium text-primary-foreground transition-opacity hover:opacity-90"
          >
            <IconCheck className="size-4" />
            Apply Custom Theme
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
