"use client"

import { useState, useMemo, useEffect } from "react"
import { motion } from "motion/react"
import Link from "next/link"
import {
  IconArrowLeft,
  IconTrash,
  IconChartLine,
  IconKeyboard,
  IconClock,
  IconTarget,
  IconFlame,
  IconTrophy,
  IconTrendingUp,
  IconTrendingDown,
  IconWaveSine,
} from "@tabler/icons-react"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts"
import {
  ChartContainer,
  ChartTooltip,
  type ChartConfig,
} from "@/components/ui/chart"
import {
  readHistory,
  clearHistory,
  aggregateKeyAccuracyTrend,
  aggregateConsistency,
  computeTrendSeries,
  type TestHistoryEntry,
} from "@/lib/test-history"
import { CornerBrackets } from "@/components/corner-brackets"
import { cn } from "@/lib/utils"

const wpmChartConfig: ChartConfig = {
  rollingAvg: { label: "10-test Avg", color: "var(--color-primary)" },
  wpm: { label: "Test WPM", color: "hsl(var(--muted-foreground))" },
  best: { label: "Best So Far", color: "oklch(0.72 0.18 75)" },
}

const keyChartConfig: ChartConfig = {
  accuracy: { label: "Accuracy %", color: "var(--color-primary)" },
}

// Key color based on accuracy
function getKeyColor(accuracy: number): string {
  if (accuracy >= 98) return "var(--color-primary)"
  if (accuracy >= 95) return "oklch(0.72 0.18 145)" // green
  if (accuracy >= 90) return "oklch(0.72 0.18 75)" // amber
  if (accuracy >= 80) return "oklch(0.65 0.2 35)" // orange
  return "oklch(0.55 0.22 25)" // red
}

// QWERTY keyboard rows for the heatmap
const KEYBOARD_ROWS = [
  ["q", "w", "e", "r", "t", "y", "u", "i", "o", "p"],
  ["a", "s", "d", "f", "g", "h", "j", "k", "l"],
  ["z", "x", "c", "v", "b", "n", "m"],
]

// Staggered home-row indent per keyboard row (px → rem strings)
const KEYBOARD_ROW_INDENTS = new Map<number, string>([
  [1, "1rem"],
  [2, "2.5rem"],
])

const TIME_RANGE_DAYS = new Map<string, number>([
  ["7d", 7],
  ["30d", 30],
  ["90d", 90],
])

function accuracyColor(accuracy: number): string {
  if (accuracy >= 95) return "var(--color-primary)"
  if (accuracy >= 85) return "oklch(0.72 0.18 75)"
  return "oklch(0.55 0.22 25)"
}

function StatCard({
  icon,
  label,
  value,
  sub,
}: {
  icon: React.ReactNode
  label: string
  value: string | number
  sub?: string
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col gap-1 rounded-lg border border-border bg-muted/20 p-4"
    >
      <div className="flex items-center gap-2 text-muted-foreground">
        {icon}
        <span className="text-[11px] font-medium tracking-widest uppercase">
          {label}
        </span>
      </div>
      <span className="font-mono text-2xl font-bold text-foreground tabular-nums">
        {value}
      </span>
      {sub && <span className="text-[11px] text-muted-foreground">{sub}</span>}
    </motion.div>
  )
}

function TrendArrow({ improving }: { improving: boolean | null }) {
  if (improving === null) return null
  const Icon = improving ? IconTrendingUp : IconTrendingDown
  return (
    <Icon
      size={12}
      className={cn("inline", improving ? "text-emerald-500" : "text-red-400")}
    />
  )
}

function summarizeHistory(history: TestHistoryEntry[]) {
  const totalTests = history.length
  if (totalTests === 0)
    return { totalTests, avgWpm: 0, bestWpm: 0, avgAccuracy: 0, totalTime: 0 }
  const avgWpm = Math.round(history.reduce((s, h) => s + h.wpm, 0) / totalTests)
  const bestWpm = Math.max(...history.map((h) => h.wpm))
  const avgAccuracy =
    Math.round(
      (history.reduce((s, h) => s + h.accuracy, 0) / totalTests) * 10
    ) / 10
  const totalTime = Math.round(history.reduce((s, h) => s + h.duration, 0) / 60)
  return { totalTests, avgWpm, bestWpm, avgAccuracy, totalTime }
}

function consistencyDeltaIcon(delta: number | null): React.ReactNode {
  return (delta ?? 0) >= 0 ? (
    <IconTrendingUp size={14} />
  ) : (
    <IconTrendingDown size={14} />
  )
}

function formatConsistencyDelta(delta: number | null): string {
  if (delta === null) return "—"
  return delta > 0 ? `+${delta}%` : `${delta}%`
}

function consistencySublabel(delta: number | null): string {
  if (delta === null) return "Needs 20+ recorded tests"
  return delta >= 0 ? "Getting steadier" : "Getting spikier"
}

function KeyboardHeatmap({
  keyData,
}: {
  keyData: Map<
    string,
    { accuracy: number; attempts: number; improving: boolean | null }
  >
}) {
  return (
    <div className="flex flex-col items-center gap-1.5">
      {KEYBOARD_ROWS.map((row, rowIdx) => (
        <div
          key={rowIdx}
          className="flex gap-1.5"
          style={{
            paddingLeft: KEYBOARD_ROW_INDENTS.get(rowIdx) ?? 0,
          }}
        >
          {row.map((key) => {
            const data = keyData.get(key)
            const acc = data?.accuracy ?? 100
            const attempts = data?.attempts ?? 0
            const improving = data?.improving ?? null
            return (
              <div
                key={key}
                className="group relative flex h-10 w-10 items-center justify-center rounded-md border border-border font-mono text-xs font-semibold uppercase transition-transform hover:scale-110"
                style={{
                  backgroundColor:
                    attempts > 0 ? getKeyColor(acc) : "var(--muted)",
                  color:
                    attempts > 0 && acc < 95 ? "white" : "var(--foreground)",
                  opacity: attempts > 0 ? 1 : 0.3,
                }}
              >
                {key}
                {attempts > 0 && (
                  <div className="pointer-events-none absolute -top-12 left-1/2 z-50 flex -translate-x-1/2 items-center gap-1 rounded border border-border bg-background px-2 py-1 text-[10px] whitespace-nowrap text-foreground opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
                    <span className="font-semibold">{acc}%</span>
                    <TrendArrow improving={improving} />
                    <span className="text-muted-foreground">
                      {attempts} hits
                    </span>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      ))}
    </div>
  )
}

export default function StatsPage() {
  const [history, setHistory] = useState<TestHistoryEntry[]>([])
  const [timeRange, setTimeRange] = useState<"7d" | "30d" | "90d" | "all">(
    "30d"
  )
  // Snapshot "now" once when data loads — keeps render pure and stable.
  const [loadedAt, setLoadedAt] = useState<number | null>(null)

  useEffect(() => {
    const entries = readHistory()
    queueMicrotask(() => {
      setHistory(entries)
      setLoadedAt(Date.now())
    })
  }, [])

  const filteredHistory = useMemo(() => {
    if (timeRange === "all" || loadedAt === null) return history
    const rangeDays = TIME_RANGE_DAYS.get(timeRange) ?? 90
    const ms = rangeDays * 86400000
    const cutoff = loadedAt - ms
    return history.filter((h) => new Date(h.timestamp).getTime() >= cutoff)
  }, [history, timeRange, loadedAt])

  const keyAccuracy = useMemo(
    () => aggregateKeyAccuracyTrend(filteredHistory),
    [filteredHistory]
  )
  const trendSeries = useMemo(
    () => computeTrendSeries(filteredHistory),
    [filteredHistory]
  )
  const consistencyStats = useMemo(
    () => aggregateConsistency(filteredHistory),
    [filteredHistory]
  )

  const keyMap = useMemo(() => {
    const m = new Map<
      string,
      { accuracy: number; attempts: number; improving: boolean | null }
    >()
    for (const ka of keyAccuracy) {
      m.set(ka.key, {
        accuracy: ka.accuracy,
        attempts: ka.attempts,
        improving: ka.improving,
      })
    }
    return m
  }, [keyAccuracy])

  // Summary stats
  const { totalTests, avgWpm, bestWpm, avgAccuracy, totalTime } = useMemo(
    () => summarizeHistory(filteredHistory),
    [filteredHistory]
  )

  // Worst 5 keys
  const worstKeys = keyAccuracy.filter((k) => k.attempts >= 5).slice(0, 5)

  const handleClear = () => {
    if (confirm("Clear all test history? This cannot be undone.")) {
      clearHistory()
      setHistory([])
    }
  }

  return (
    <div className="mx-auto w-full max-w-4xl px-6 py-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 flex items-center justify-between"
      >
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <IconArrowLeft size={16} />
            Back
          </Link>
          <h1 className="font-mono text-xl font-bold tracking-tight text-foreground">
            Stats Dashboard
          </h1>
        </div>
        <div className="flex items-center gap-3">
          {/* Time range picker */}
          <div className="flex items-center gap-1 rounded-lg border border-border bg-muted/20 p-0.5">
            {(["7d", "30d", "90d", "all"] as const).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={cn(
                  "rounded-md px-3 py-1 font-mono text-[11px] transition-colors",
                  timeRange === range
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {range === "all" ? "All" : range}
              </button>
            ))}
          </div>
          <CornerBrackets className="inline-flex">
            <button
              onClick={handleClear}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:text-destructive"
            >
              <IconTrash size={14} />
              Clear
            </button>
          </CornerBrackets>
        </div>
      </motion.div>

      {totalTests === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center gap-4 py-20"
        >
          <IconChartLine size={48} className="text-muted-foreground/30" />
          <p className="font-mono text-sm text-muted-foreground">
            No test history yet. Complete a typing test to see your stats!
          </p>
          <Link
            href="/"
            className="rounded-lg border border-border bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Start Typing
          </Link>
        </motion.div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="mb-8 grid grid-cols-2 gap-3 md:grid-cols-4">
            <StatCard
              icon={<IconFlame size={14} />}
              label="Avg WPM"
              value={avgWpm}
              sub={`Peak: ${bestWpm} WPM`}
            />
            <StatCard
              icon={<IconTarget size={14} />}
              label="Accuracy"
              value={`${avgAccuracy}%`}
            />
            <StatCard
              icon={<IconTrophy size={14} />}
              label="Tests"
              value={totalTests}
            />
            <StatCard
              icon={<IconClock size={14} />}
              label="Time Typed"
              value={
                totalTime > 60
                  ? `${Math.round(totalTime / 60)}h`
                  : `${totalTime}m`
              }
              sub={`${Math.round(totalTime)} minutes total`}
            />
          </div>

          {/* WPM Trend Chart — per-test with rolling average and best-so-far */}
          {trendSeries.length > 1 && (
            <motion.section
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="mb-8"
            >
              <h2 className="mb-4 font-mono text-xs font-semibold tracking-widest text-muted-foreground uppercase">
                <IconChartLine size={14} className="mr-1.5 inline" />
                WPM Trend
              </h2>
              <div className="rounded-lg border border-border bg-muted/10 p-4">
                <ChartContainer
                  config={wpmChartConfig}
                  className="h-[250px] w-full"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={trendSeries}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="var(--border)"
                      />
                      <XAxis
                        dataKey="index"
                        tickFormatter={(i: number) => `#${i}`}
                        stroke="var(--muted-foreground)"
                        fontSize={10}
                        tickLine={false}
                      />
                      <YAxis
                        stroke="var(--muted-foreground)"
                        fontSize={10}
                        tickLine={false}
                      />
                      <ChartTooltip
                        labelFormatter={(i) => {
                          const point = trendSeries[i - 1]
                          return point
                            ? new Date(point.timestamp).toLocaleDateString(
                                "en-US",
                                { month: "short", day: "numeric" }
                              )
                            : `Test #${i}`
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="wpm"
                        stroke="hsl(var(--muted-foreground))"
                        strokeWidth={1}
                        dot={false}
                        name="Test WPM"
                        legendType="none"
                      />
                      <Line
                        type="monotone"
                        dataKey="rollingAvg"
                        stroke="var(--color-primary)"
                        strokeWidth={2}
                        dot={false}
                        name="10-test Avg"
                      />
                      <Line
                        type="monotone"
                        dataKey="best"
                        stroke="oklch(0.72 0.18 75)"
                        strokeWidth={1}
                        strokeDasharray="4 4"
                        dot={false}
                        name="Best So Far"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </div>
            </motion.section>
          )}

          {/* Consistency */}
          {consistencyStats.avg !== null && (
            <motion.section
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="mb-8"
            >
              <h2 className="mb-4 font-mono text-xs font-semibold tracking-widest text-muted-foreground uppercase">
                <IconWaveSine size={14} className="mr-1.5 inline" />
                Consistency
              </h2>
              <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                <StatCard
                  icon={<IconWaveSine size={14} />}
                  label="All-time Avg"
                  value={`${consistencyStats.avg}%`}
                  sub="Keystroke steadiness (CV-based)"
                />
                <StatCard
                  icon={<IconTrendingUp size={14} />}
                  label="Last 10 Tests"
                  value={
                    consistencyStats.recent !== null
                      ? `${consistencyStats.recent}%`
                      : "—"
                  }
                />
                <StatCard
                  icon={consistencyDeltaIcon(consistencyStats.delta)}
                  label="vs Prior 10"
                  value={formatConsistencyDelta(consistencyStats.delta)}
                  sub={consistencySublabel(consistencyStats.delta)}
                />
              </div>
            </motion.section>
          )}

          {/* Keyboard Accuracy Heatmap */}
          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-8"
          >
            <h2 className="mb-4 font-mono text-xs font-semibold tracking-widest text-muted-foreground uppercase">
              <IconKeyboard size={14} className="mr-1.5 inline" />
              Key Accuracy Heatmap
            </h2>
            <div className="flex flex-col items-center gap-6 rounded-lg border border-border bg-muted/10 p-6">
              <KeyboardHeatmap keyData={keyMap} />
              <div className="flex items-center gap-4 text-[10px] text-muted-foreground">
                <span className="flex items-center gap-1">
                  <span
                    className="inline-block h-3 w-3 rounded"
                    style={{ backgroundColor: "oklch(0.55 0.22 25)" }}
                  />
                  &lt;80%
                </span>
                <span className="flex items-center gap-1">
                  <span
                    className="inline-block h-3 w-3 rounded"
                    style={{ backgroundColor: "oklch(0.65 0.2 35)" }}
                  />
                  80-89%
                </span>
                <span className="flex items-center gap-1">
                  <span
                    className="inline-block h-3 w-3 rounded"
                    style={{ backgroundColor: "oklch(0.72 0.18 75)" }}
                  />
                  90-94%
                </span>
                <span className="flex items-center gap-1">
                  <span
                    className="inline-block h-3 w-3 rounded"
                    style={{ backgroundColor: "oklch(0.72 0.18 145)" }}
                  />
                  95-97%
                </span>
                <span className="flex items-center gap-1">
                  <span
                    className="inline-block h-3 w-3 rounded"
                    style={{ backgroundColor: "var(--color-primary)" }}
                  />
                  98%+
                </span>
              </div>
            </div>
          </motion.section>

          {/* Worst Keys */}
          {worstKeys.length > 0 && (
            <motion.section
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mb-8"
            >
              <h2 className="mb-4 font-mono text-xs font-semibold tracking-widest text-muted-foreground uppercase">
                <IconTarget size={14} className="mr-1.5 inline" />
                Keys to Practice
              </h2>
              <div className="rounded-lg border border-border bg-muted/10 p-4">
                <ChartContainer
                  config={keyChartConfig}
                  className="h-[180px] w-full"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={worstKeys} layout="vertical">
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="var(--border)"
                        horizontal={false}
                      />
                      <XAxis
                        type="number"
                        domain={[0, 100]}
                        stroke="var(--muted-foreground)"
                        fontSize={10}
                      />
                      <YAxis
                        dataKey="key"
                        type="category"
                        stroke="var(--muted-foreground)"
                        fontSize={12}
                        tickLine={false}
                        width={30}
                        tickFormatter={(v: string) => v.toUpperCase()}
                      />
                      <ChartTooltip />
                      <Bar
                        dataKey="accuracy"
                        fill="var(--color-primary)"
                        radius={[0, 4, 4, 0]}
                        name="Accuracy %"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </div>
            </motion.section>
          )}

          {/* Recent Test History */}
          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <h2 className="mb-4 font-mono text-xs font-semibold tracking-widest text-muted-foreground uppercase">
              Recent Tests
            </h2>
            <div className="overflow-hidden rounded-lg border border-border">
              <table className="w-full text-left font-mono text-xs">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="px-3 py-2.5 font-semibold text-muted-foreground">
                      Date
                    </th>
                    <th className="px-3 py-2.5 font-semibold text-muted-foreground">
                      Mode
                    </th>
                    <th className="px-3 py-2.5 text-right font-semibold text-muted-foreground">
                      WPM
                    </th>
                    <th className="px-3 py-2.5 text-right font-semibold text-muted-foreground">
                      Raw
                    </th>
                    <th className="px-3 py-2.5 text-right font-semibold text-muted-foreground">
                      Acc
                    </th>
                    <th className="hidden px-3 py-2.5 text-right font-semibold text-muted-foreground md:table-cell">
                      Duration
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredHistory.slice(0, 20).map((entry) => (
                    <tr
                      key={entry.id}
                      className="border-b border-border/50 transition-colors hover:bg-muted/10"
                    >
                      <td className="px-3 py-2 text-muted-foreground">
                        {new Date(entry.timestamp).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                      <td className="px-3 py-2">
                        <span className="rounded bg-muted/50 px-1.5 py-0.5 text-[10px] uppercase">
                          {entry.mode}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-right font-semibold text-foreground tabular-nums">
                        {entry.wpm}
                      </td>
                      <td className="px-3 py-2 text-right text-muted-foreground tabular-nums">
                        {entry.raw}
                      </td>
                      <td
                        className="px-3 py-2 text-right tabular-nums"
                        style={{
                          color: accuracyColor(entry.accuracy),
                        }}
                      >
                        {entry.accuracy}%
                      </td>
                      <td className="hidden px-3 py-2 text-right text-muted-foreground tabular-nums md:table-cell">
                        {entry.duration}s
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.section>
        </>
      )}
    </div>
  )
}
