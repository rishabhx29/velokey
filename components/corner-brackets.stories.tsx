import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { CornerBrackets } from "@/components/corner-brackets"

const meta = {
  title: "Typing/CornerBrackets",
  component: CornerBrackets,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
} satisfies Meta<typeof CornerBrackets>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    children: (
      <span className="px-6 py-3 font-mono text-sm">
        Hover me — brackets appear
      </span>
    ),
  },
}

export const Focusable: Story = {
  args: {
    children: (
      <button
        type="button"
        className="px-6 py-3 font-mono text-sm outline-none"
      >
        Tab to focus — brackets lock on
      </button>
    ),
  },
}
