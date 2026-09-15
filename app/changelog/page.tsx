import type { Metadata } from "next"
import Link from "next/link"
import { siteConfig } from "@/lib/site"

export const metadata: Metadata = {
  title: "Changelog — VeloKey",
  description:
    "Recent updates and improvements to VeloKey, the minimalist typing practice app.",
  alternates: { canonical: "/changelog" },
}

interface ChangelogEntry {
  version: string
  date: string
  title: string
  highlights: string[]
}

const entries: ChangelogEntry[] = [
  {
    version: "1.0.0",
    date: "2026-09-10",
    title: "Stable release",
    highlights: [
      "Timed and word-count drills, quotes, zen mode, custom text, code snippets in 14 languages",
      "Focus mode built from your personal problem keys, plus a persistent practice dictionary",
      "Multiplayer races over PartyKit: room codes, quick match, live progress, rematch",
      "Five on-screen keyboard styles with per-key sound packs and haptics",
      "Detailed results: WPM, raw, accuracy, consistency, WPM-over-time chart, shareable card",
      "Stats dashboard with daily trends, per-key accuracy heatmap, and test history",
    ],
  },
]

export default function ChangelogPage() {
  return (
    <main className="flex flex-1 flex-col px-6 py-10 md:py-16">
      <article className="mx-auto w-full max-w-site space-y-6 text-muted-foreground">
        <h1 className="font-(family-name:--font-doto) text-3xl font-bold text-foreground md:text-4xl">
          Changelog
        </h1>
        <p className="-mt-2 text-sm text-muted-foreground/50">
          What&apos;s new in {siteConfig.name}
        </p>

        <ol className="space-y-8">
          {entries.map((entry) => (
            <li
              key={entry.version}
              className="rounded-lg border border-border bg-muted/20 p-5"
            >
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h2 className="font-(family-name:--font-doto) text-xl font-semibold text-foreground">
                  {entry.title}
                </h2>
                <span className="font-mono text-xs text-muted-foreground">
                  v{entry.version} ·{" "}
                  {new Date(entry.date).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </span>
              </div>
              <ul className="mt-3 list-inside list-disc space-y-1 text-sm leading-relaxed">
                {entry.highlights.map((h) => (
                  <li key={h}>{h}</li>
                ))}
              </ul>
            </li>
          ))}
        </ol>

        <p>
          <Link
            href="/"
            className="text-sm text-primary underline-offset-4 hover:underline"
          >
            ← Back to typing test
          </Link>
        </p>
      </article>
    </main>
  )
}
