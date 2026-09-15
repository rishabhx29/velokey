import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { RaceCountdown } from "@/components/race-countdown"

const meta = {
  title: "Race/RaceCountdown",
  component: RaceCountdown,
  parameters: { layout: "fullscreen" },
  tags: ["autodocs"],
} satisfies Meta<typeof RaceCountdown>

export default meta
type Story = StoryObj<typeof meta>

export const CountdownThree: Story = {
  args: { countdown: 3 },
}

export const CountdownTwo: Story = {
  args: { countdown: 2 },
}

export const CountdownOne: Story = {
  args: { countdown: 1 },
}

export const Go: Story = {
  args: { countdown: 0 },
}

export const Inactive: Story = {
  args: { countdown: null },
}
