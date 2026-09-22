"use client"

import { useRouter } from "next/navigation"
import { CornerBrackets } from "@/components/corner-brackets"
import { LANGUAGE_STORAGE_KEY_FALLBACK } from "@/lib/typing-landing"

export function TypingLandingCta({ language }: { language: string }) {
  const router = useRouter()

  function start() {
    try {
      sessionStorage.setItem(LANGUAGE_STORAGE_KEY_FALLBACK, language)
    } catch {
      // storage unavailable — the test will just use the current language
    }
    router.push("/")
  }

  return (
    <div className="mt-6 flex flex-wrap items-center gap-4">
      <CornerBrackets className="inline-flex">
        <button
          type="button"
          onClick={start}
          className="flex cursor-pointer items-center gap-2 px-5 py-2.5 font-mono text-sm font-bold text-primary transition-colors hover:text-foreground focus-visible:outline-none"
        >
          Start {language} test →
        </button>
      </CornerBrackets>
      <span className="text-xs text-muted-foreground">
        free · no sign-up · works offline
      </span>
    </div>
  )
}
