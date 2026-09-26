import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { WordItem } from "@/components/word-item"

const meta = {
  title: "Typing/WordItem",
  component: WordItem,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
} satisfies Meta<typeof WordItem>

export default meta
type Story = StoryObj<typeof meta>

export const Untouched: Story = {
  args: {
    word: "future",
    displayInput: "",
    isActive: true,
    isPast: false,
    hasError: false,
  },
}

export const HalfTyped: Story = {
  args: {
    word: "future",
    displayInput: "fut",
    isActive: true,
    isPast: false,
    hasError: false,
  },
}

export const WithError: Story = {
  args: {
    word: "future",
    displayInput: "fax",
    isActive: true,
    isPast: false,
    hasError: false,
  },
}

export const CompletedCorrect: Story = {
  args: {
    word: "future",
    displayInput: "future",
    isActive: false,
    isPast: true,
    hasError: false,
  },
}

export const CompletedWrong: Story = {
  args: {
    word: "future",
    displayInput: "futurf",
    isActive: false,
    isPast: true,
    hasError: true,
  },
}

/** A finished word keeps the error underline but no longer renders the
 *  overflow characters — they used to widen the word and shove the rest of
 *  the line sideways. */
export const CompletedWrongWithoutOverflow: Story = {
  args: {
    word: "future",
    displayInput: "futur",
    isActive: false,
    isPast: true,
    hasError: true,
  },
}

export const ExtraChars: Story = {
  args: {
    word: "future",
    displayInput: "futures",
    isActive: true,
    isPast: false,
    hasError: false,
  },
}

export const FutureDimmed: Story = {
  args: {
    word: "future",
    displayInput: "",
    isActive: false,
    isPast: false,
    hasError: false,
    dimmed: true,
  },
}

export const SyntaxHighlighted: Story = {
  args: {
    word: "const",
    displayInput: "co",
    isActive: true,
    isPast: false,
    hasError: false,
    tokenColors: ["#7f9f7f", "#7f9f7f", "#7f9f7f", "#7f9f7f", "#7f9f7f"],
  },
}
