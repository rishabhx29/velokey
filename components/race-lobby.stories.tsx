import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { RaceLobby } from "@/components/race-lobby"
import type { UseRaceConnectionReturn } from "@/hooks/use-race-connection"
import type { Player, RoomConfig, RoomStatus } from "@/shared/race-protocol"

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

const customConfig: RoomConfig = {
  mode: "words",
  wordOption: 50,
  timeOption: 30,
  difficulty: "medium",
  isQuickMatch: false,
}

const quickMatchConfig: RoomConfig = { ...customConfig, isQuickMatch: true }

function fakeConnection(
  overrides: Partial<UseRaceConnectionReturn>
): UseRaceConnectionReturn {
  return {
    connected: true,
    connectionState: "connected",
    error: null,
    roomStatus: "lobby" as RoomStatus,
    players,
    myPlayerId: "p1",
    isHost: true,
    roomCode: "VELO-K4TZ",
    roomConfig: customConfig,
    countdown: null,
    progress: [],
    words: [],
    raceMode: null,
    raceTimeOption: null,
    raceWordOption: null,
    sendProgress: () => {},
    sendFinish: () => {},
    startRace: () => {},
    setReady: () => {},
    disconnect: () => {},
    ...overrides,
  } as UseRaceConnectionReturn
}

const meta = {
  title: "Race/RaceLobby",
  component: RaceLobby,
  parameters: { layout: "fullscreen" },
  tags: ["autodocs"],
} satisfies Meta<typeof RaceLobby>

export default meta
type Story = StoryObj<typeof meta>

export const HostCustomRoom: Story = {
  args: { connection: fakeConnection({}) },
}

export const GuestNotReady: Story = {
  args: {
    connection: fakeConnection({
      myPlayerId: "p3",
      isHost: false,
      players: players.map((p) => (p.id === "p3" ? { ...p, ready: false } : p)),
    }),
  },
}

export const QuickMatch: Story = {
  args: { connection: fakeConnection({ roomConfig: quickMatchConfig }) },
}
