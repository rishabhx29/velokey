"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { motion } from "motion/react"
import {
  IconTrophy,
  IconTrophyOff,
  IconMedal,
  IconFlame,
  IconSwords,
  IconRefresh,
} from "@tabler/icons-react"
import {
  fetchLeaderboard,
  type LeaderboardGetResponse,
} from "@/lib/leaderboard-client"
import { LEADERBOARD_MODES, type LeaderboardMode } from "@/lib/leaderboard"
import { cn } from "@/lib/utils"

const MEDAL_COLORS: Record<number, string> = {
  1: "text-amber-400",
  2: "text-slate-300",
  3: "text-amber-700",
}

function RankBadge({ rank }: { rank: number }) {
  if (rank <= 3) {
    return (
      <IconMedal
        size={20}
        className={cn("shrink-0", MEDAL_COLORS[rank])}
        aria-label={`Rank ${rank}`}
      />
    )
  }
  return (
    <span className="w-6 text-center font-mono text-sm font-bold text-muted-foreground/60 tabular-nums">
      {rank}
    </span>
  )
}

/** Boards for a loaded mode; rendered only when configured. */
function LeaderboardBoards({
  data,
  mode,
}: {
  data: LeaderboardGetResponse
  mode: LeaderboardMode
}) {
  const top = data.top
  const wins = data.wins

  return (
    <>
      {/* Top scores */}
      <section className="w-full">
        <h2 className="mb-3 text-xs font-bold tracking-widest text-muted-foreground uppercase">
          Top WPM · {mode}
        </h2>
        {top.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border/60 px-4 py-8 text-center text-sm text-muted-foreground">
            No scores yet this week — finish a {mode} test to claim the top
            spot.
          </p>
        ) : (
          <ol className="flex flex-col gap-1.5">
            {top.map((row, i) => (
              <motion.li
                key={`${row.playerId}-${row.rank}`}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04, duration: 0.25 }}
                className={cn(
                  "flex items-center gap-3 rounded-xl border px-4 py-3",
                  i === 0
                    ? "border-amber-500/30 bg-amber-500/5"
                    : "border-border/50 bg-card"
                )}
              >
                <RankBadge rank={row.rank} />
                <span className="min-w-0 flex-1 truncate font-semibold">
                  {row.nickname}
                </span>
                <span className="font-mono text-sm text-muted-foreground tabular-nums">
                  {row.accuracy}%
                </span>
                <span className="w-16 text-right font-mono text-xl font-bold text-primary tabular-nums">
                  {row.wpm}
                </span>
              </motion.li>
            ))}
          </ol>
        )}
      </section>

      {/* Weekly wins */}
      {wins.length > 0 && (
        <section className="w-full">
          <h2 className="mb-3 flex items-center gap-1.5 text-xs font-bold tracking-widest text-muted-foreground uppercase">
            <IconFlame size={13} className="text-orange-400" />
            Most race wins this week
          </h2>
          <ol className="flex flex-wrap gap-2">
            {wins.map((w) => (
              <li
                key={w.playerId}
                className="flex items-center gap-2 rounded-full border border-border/50 bg-card px-3.5 py-1.5 text-sm"
              >
                <span className="font-semibold">{w.nickname}</span>
                <span className="rounded-full bg-primary/15 px-2 py-0.5 font-mono text-xs font-bold text-primary tabular-nums">
                  {w.wins}
                </span>
              </li>
            ))}
          </ol>
        </section>
      )}
    </>
  )
}

export default function LeaderboardPage() {
  const [mode, setMode] = useState<LeaderboardMode>("words")
  const [modeShown, setModeShown] = useState<LeaderboardMode | null>(null)
  const [data, setData] = useState<LeaderboardGetResponse | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  // Loading = the shown snapshot belongs to a previous mode selection.
  const loading = modeShown !== mode

  const load = (m: LeaderboardMode) => {
    setRefreshing(true)
    void fetchLeaderboard(m).then((d) => {
      setData(d)
      setModeShown(m)
      setRefreshing(false)
    })
  }

  useEffect(() => {
    let live = true
    void fetchLeaderboard(mode).then((d) => {
      if (!live) return
      setData(d)
      setModeShown(mode)
    })
    return () => {
      live = false
    }
  }, [mode])

  const configured = data?.configured ?? false

  let body: React.ReactNode
  if (loading) {
    body = (
      <div className="flex flex-col items-center gap-3 py-16 text-muted-foreground">
        <IconRefresh size={22} className="animate-spin" />
        <span className="text-sm">Loading standings…</span>
      </div>
    )
  } else if (!configured) {
    body = (
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-border/60 bg-card px-8 py-12 text-center">
        <IconTrophyOff size={28} className="text-muted-foreground/50" />
        <p className="font-semibold">Leaderboard not configured</p>
        <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">
          The weekly board needs a Redis store. Add{" "}
          <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
            UPSTASH_REDIS_REST_URL
          </code>{" "}
          and{" "}
          <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
            UPSTASH_REDIS_REST_TOKEN
          </code>{" "}
          to your environment to enable it.
        </p>
      </div>
    )
  } else if (data) {
    body = <LeaderboardBoards data={data} mode={mode} />
  } else {
    body = null
  }

  return (
    <div className="mx-auto flex min-h-[60vh] w-full max-w-2xl flex-col items-center gap-8 px-6 py-10">
      <div className="flex flex-col items-center gap-2 text-center">
        <div className="mb-2 flex h-16 w-16 items-center justify-center rounded-2xl border border-amber-500/20 bg-amber-500/10 text-amber-400">
          <IconTrophy size={30} />
        </div>
        <h1 className="text-3xl font-bold tracking-tight">
          Weekly Leaderboard
        </h1>
        <p className="text-sm text-muted-foreground">
          Global WPM rankings · resets every Monday
          {data?.weekKey ? ` · week ${data.weekKey.replace(/W0?/, " ")}` : null}
        </p>
      </div>

      {/* Mode switcher */}
      <div className="flex gap-1.5 rounded-xl border border-border/60 bg-muted/30 p-1">
        {LEADERBOARD_MODES.map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(m)}
            className={cn(
              "rounded-lg px-4 py-1.5 font-mono text-xs font-semibold tracking-wider uppercase transition-colors focus-visible:outline-none",
              mode === m
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {m}
          </button>
        ))}
        <button
          type="button"
          onClick={() => load(mode)}
          aria-label="Refresh leaderboard"
          className="rounded-lg px-2.5 text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none"
        >
          <IconRefresh
            size={14}
            className={refreshing ? "animate-spin" : undefined}
          />
        </button>
      </div>

      {body}

      <Link
        href="/"
        className="flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <IconSwords size={15} />
        Back to typing
      </Link>
    </div>
  )
}
