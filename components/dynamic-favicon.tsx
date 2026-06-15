"use client"

import { useEffect, useState } from "react"
import { useTheme } from "next-themes"

import { syncVeloKeyFavicon } from "@/lib/favicon-client"

export function DynamicFavicon() {
  const { resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    queueMicrotask(() => setMounted(true))
  }, [])

  useEffect(() => {
    if (!mounted) return

    const run = () => {
      syncVeloKeyFavicon()
      requestAnimationFrame(() => syncVeloKeyFavicon())
    }

    run()

    const t1 = window.setTimeout(run, 0)
    const t2 = window.setTimeout(run, 150)

    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
    }
  }, [mounted, resolvedTheme])

  return null
}
