import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { ShareableResultCard } from "@/components/shareable-result-card"

const baseStats = {
  wpm: 87,
  accuracy: 96.2,
  raw: 94,
  correctChars: 412,
  incorrectChars: 9,
  extraChars: 4,
  missedChars: 2,
  consistency: 88,
  elapsedSeconds: 30,
  correctedErrors: 5,
  mode: "time",
  modeDetail: "30",
  language: "english",
  wpmHistory: Array.from({ length: 30 }, (_, i) => ({
    second: i + 1,
    wpm: 70 + Math.round(Math.sin(i / 4) * 14) + Math.round(i / 8),
    raw: 78 + Math.round(Math.cos(i / 5) * 12),
    errors: i % 9 === 0 ? 1 : 0,
  })),
}

const meta = {
  title: "Results/ShareableResultCard",
  component: ShareableResultCard,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
} satisfies Meta<typeof ShareableResultCard>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: { stats: baseStats },
}

export const NewPersonalBest: Story = {
  args: {
    stats: baseStats,
    pb: {
      isNewPb: true,
      previous: { wpm: 82, accuracy: 94, date: "2026-08-30T10:00:00Z" },
    },
  },
}

export const SlowStart: Story = {
  args: {
    stats: {
      ...baseStats,
      wpm: 41,
      accuracy: 88.5,
      raw: 55,
      consistency: 62,
      wpmHistory: Array.from({ length: 15 }, (_, i) => ({
        second: i + 1,
        wpm: 30 + i * 2,
        raw: 40 + i * 2,
        errors: i % 4 === 0 ? 1 : 0,
      })),
    },
  },
}
