"use client"

/** Lightweight marks kept in the Performance timeline; no analytics vendor required. */
export function markPerformance(name: string): void {
  if (typeof performance === "undefined") return
  performance.mark(name)
}

export function measurePerformance(name: string, startMark: string): void {
  if (typeof performance === "undefined") return
  try {
    performance.measure(name, startMark)
  } catch {
    // Marks can be absent during hydration, teardown, or older browsers.
  }
}
