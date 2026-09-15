import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { RaceProgressStrip } from "@/components/race-progress-strip"
import type { Player, RaceProgress, RoomConfig } from "@/shared/race-protocol"

const players: Player[] = [
  {
    id: "p1",
    nickname: "Racer",
    color: "#e11d48",
    isHost: true,
    ready: true,
    connected: true,
  },
  {
    id: "p2",
    nickname: "TypeBot",
    color: "#0ea5e9",
    isHost: false,
    ready: true,
    connected: true,
  },
  {
    id: "p3",
    nickname: "SwiftKey",
    color: "#22c55e",
    isHost: false,
    ready: false,
    connected: true,
  },
]

const wordsConfig: RoomConfig = {
  mode: "words",
  wordOption: 50,
  timeOption: 30,
  difficulty: "easy",
  isQuickMatch: false,
}

const timeConfig: RoomConfig = {
  mode: "time",
  wordOption: 25,
  timeOption: 30,
  difficulty: "medium",
  isQuickMatch: true,
}

const meta = {
  title: "Race/RaceProgressStrip",
  component: RaceProgressStrip,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
} satisfies Meta<typeof RaceProgressStrip>

export default meta
type Story = StoryObj<typeof meta>

const progressFor = (indexes: number[], finishedAt?: number): RaceProgress[] =>
  players.map((p, i) => ({
    playerId: p.id,
    wordIndex: indexes[i] ?? 0,
    totalWords: 50,
    wpm: [78, 64, 91][i] ?? 0,
    accuracy: [96, 92, 98][i] ?? 100,
    finished: finishedAt !== undefined && indexes[i] >= 50,
    elapsedSeconds: finishedAt ?? indexes[i] ?? 0,
  }))

export const EarlyRace: Story = {
  args: {
    players,
    progress: progressFor([6, 4, 9]),
    myPlayerId: "p1",
    config: wordsConfig,
  },
}

export const MidRace: Story = {
  args: {
    players,
    progress: progressFor([27, 31, 19]),
    myPlayerId: "p1",
    config: wordsConfig,
  },
}

export const Finisher: Story = {
  args: {
    players,
    progress: progressFor([50, 38, 22], 42),
    myPlayerId: "p1",
    config: wordsConfig,
  },
}

export const TimeMode: Story = {
  args: {
    players,
    progress: players.map((p, i) => ({
      playerId: p.id,
      wordIndex: [12, 9, 15][i] ?? 0,
      totalWords: 200,
      wpm: [82, 71, 95][i] ?? 0,
      accuracy: [95, 90, 97][i] ?? 100,
      finished: false,
      elapsedSeconds: [14, 14, 14][i] ?? 0,
    })),
    myPlayerId: "p1",
    config: timeConfig,
  },
}
