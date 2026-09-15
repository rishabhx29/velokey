import { describe, expect, it } from "vitest"
import { render, screen } from "@testing-library/react"
import { WordItem } from "@/components/word-item"

describe("WordItem", () => {
  it("renders each character of the word", () => {
    render(
      <WordItem
        word="hello"
        displayInput=""
        isActive
        isPast={false}
        hasError={false}
      />
    )
    expect(screen.getByText("h")).toBeTruthy()
    expect(screen.getByText("e")).toBeTruthy()
    expect(screen.getByText("o")).toBeTruthy()
  })

  it("renders extra characters after the word", () => {
    const { container } = render(
      <WordItem
        word="hi"
        displayInput="hixy"
        isActive
        isPast={false}
        hasError={false}
      />
    )
    expect(screen.getByText("x")).toBeTruthy()
    expect(screen.getByText("y")).toBeTruthy()
    expect(container.textContent).toContain("hixy")
  })

  it("dimmed words have reduced opacity", () => {
    const { container } = render(
      <WordItem
        word="hi"
        displayInput=""
        isActive={false}
        isPast={false}
        hasError={false}
        dimmed
      />
    )
    const el = container.firstElementChild as HTMLElement
    expect(el.style.opacity).toBe("0.05")
  })

  it("non-dimmed words have no inline opacity", () => {
    const { container } = render(
      <WordItem
        word="hi"
        displayInput=""
        isActive={false}
        isPast={false}
        hasError={false}
      />
    )
    const el = container.firstElementChild as HTMLElement
    expect(el.style.opacity).toBe("")
  })
})
