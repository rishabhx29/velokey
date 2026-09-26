import { afterAll, beforeAll, describe, expect, it } from "vitest"
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

  it("does not render overflow characters for a finished word", () => {
    const { container } = render(
      <WordItem
        word="hi"
        displayInput="hixy"
        isActive={false}
        isPast
        hasError
      />
    )
    // The finished word shows only the word's own characters, so its box stays
    // the width of the word and the following words cannot be pushed sideways.
    expect(container.textContent).toBe("hi")
    expect(container.querySelector(".text-destructive\\/80")).toBeNull()
  })
})

describe("WordItem caret placement", () => {
  const CHAR_WIDTH = 10
  const originals = {
    offsetLeft: Object.getOwnPropertyDescriptor(
      HTMLElement.prototype,
      "offsetLeft"
    ),
    offsetWidth: Object.getOwnPropertyDescriptor(
      HTMLElement.prototype,
      "offsetWidth"
    ),
    scrollWidth: Object.getOwnPropertyDescriptor(
      HTMLElement.prototype,
      "scrollWidth"
    ),
  }

  /** Width of an element's own rendered text, in fake pixels. */
  function widthOf(el: Element): number {
    return (el.textContent ?? "").length * CHAR_WIDTH
  }

  beforeAll(() => {
    // jsdom performs no layout, so model a single line of fixed-width
    // characters: every element is as wide as its text and starts where its
    // preceding siblings end.
    Object.defineProperty(HTMLElement.prototype, "offsetWidth", {
      configurable: true,
      get(this: HTMLElement) {
        return widthOf(this)
      },
    })
    Object.defineProperty(HTMLElement.prototype, "offsetLeft", {
      configurable: true,
      get(this: HTMLElement) {
        let x = 0
        for (
          let sib = this.previousElementSibling;
          sib;
          sib = sib.previousElementSibling
        ) {
          x += widthOf(sib)
        }
        return x
      },
    })
    // Poisoned: the caret is an absolutely positioned child of the same
    // container, so reading scrollWidth while it is visible measures the
    // caret too and the placement drifts right. Any regression to it fails.
    Object.defineProperty(HTMLElement.prototype, "scrollWidth", {
      configurable: true,
      get() {
        return 9999
      },
    })
  })

  afterAll(() => {
    for (const [prop, desc] of Object.entries(originals)) {
      if (desc) {
        Object.defineProperty(HTMLElement.prototype, prop, desc)
      } else {
        delete (HTMLElement.prototype as unknown as Record<string, unknown>)[
          prop
        ]
      }
    }
  })

  function caret(container: HTMLElement): HTMLElement {
    return container.querySelector<HTMLElement>(".typing-cursor")!
  }

  it("places the caret before the character about to be typed", () => {
    const { container } = render(
      <WordItem
        word="abc"
        displayInput="a"
        isActive
        isPast={false}
        hasError={false}
      />
    )
    // Second character starts after "a".
    expect(caret(container).style.transform).toBe("translateX(10px)")
  })

  it("places the caret at the word end from the last character, not scrollWidth", () => {
    const { container } = render(
      <WordItem
        word="abc"
        displayInput="abc"
        isActive
        isPast={false}
        hasError={false}
      />
    )
    expect(caret(container).style.transform).toBe("translateX(30px)")
  })

  it("places the caret after the overflow characters while the word is active", () => {
    const { container } = render(
      <WordItem
        word="ab"
        displayInput="abcd"
        isActive
        isPast={false}
        hasError={false}
      />
    )
    // Word "ab" is 20 wide, overflow "cd" is another 20.
    expect(caret(container).style.transform).toBe("translateX(40px)")
  })

  it("places the caret instantly when a word is entered", () => {
    const { container, rerender } = render(
      <WordItem
        word="abc"
        displayInput=""
        isActive
        isPast={false}
        hasError={false}
      />
    )
    expect(caret(container).style.transition).toBe("none")
    expect(caret(container).style.transform).toBe("translateX(0px)")

    // The same word going inactive and active again must also place the caret
    // instantly, even when the word still holds typed input from a mistake.
    rerender(
      <WordItem
        word="abc"
        displayInput="ax"
        isActive={false}
        isPast={false}
        hasError={false}
      />
    )
    expect(caret(container).style.display).toBe("none")

    rerender(
      <WordItem
        word="abc"
        displayInput="ax"
        isActive
        isPast={false}
        hasError={false}
      />
    )
    expect(caret(container).style.transition).toBe("none")
    expect(caret(container).style.transform).toBe("translateX(20px)")
  })

  it("keeps the caret animated while typing within a word", () => {
    const { container, rerender } = render(
      <WordItem
        word="abc"
        displayInput=""
        isActive
        isPast={false}
        hasError={false}
      />
    )
    rerender(
      <WordItem
        word="abc"
        displayInput="a"
        isActive
        isPast={false}
        hasError={false}
      />
    )
    expect(caret(container).style.transition).toBe("transform 90ms linear")
  })
})
