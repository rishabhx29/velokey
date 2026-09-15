"use client"

import { useEffect } from "react"
import { useSettings } from "@/components/settings-context"

export function useClickSound() {
  const { clickSoundEnabled } = useSettings()

  useEffect(() => {
    if (!clickSoundEnabled) return

    function handleClick(e: MouseEvent) {
      const target = e.target as Element | null
      if (!target) return
      const el = target.closest("button, a, [role='button'], [role='switch']")
      if (!el) return
      if (el.hasAttribute("data-no-click-sound")) return
      const audio = new Audio("/sounds/click-sound.wav")
      audio.volume = 0.4
      audio.play().catch(() => {})
    }

    document.addEventListener("click", handleClick)
    return () => document.removeEventListener("click", handleClick)
  }, [clickSoundEnabled])
}
