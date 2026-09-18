import { expect, test } from "@playwright/test"

/**
 * Live multiplayer test — requires the PartyKit dev server on localhost:1999
 * (`npm run realtime:dev`). Skipped automatically when the server is absent
 * so `npm run test:e2e` still works in environments without it.
 */

async function partyKitAvailable(
  request: import("@playwright/test").APIRequestContext
): Promise<boolean> {
  try {
    // Use 127.0.0.1 — "localhost" may resolve to IPv6 in the test runner's
    // Node process while the dev server binds IPv4 only.
    const res = await request.get(
      "http://127.0.0.1:1999/parties/main/VELO-TEST",
      {
        timeout: 3000,
        failOnStatusCode: false,
      }
    )
    return res.ok()
  } catch {
    return false
  }
}

test.describe("Race room (live PartyKit)", () => {
  test("two players see identical words and live progress", async ({
    browser,
    request,
  }) => {
    test.skip(
      !(await partyKitAvailable(request)),
      "PartyKit dev server not running on localhost:1999"
    )
    test.setTimeout(150_000)
    const ctxA = await browser.newContext()
    const ctxB = await browser.newContext()
    const pageA = await ctxA.newPage()
    const pageB = await ctxB.newPage()

    // Player A creates the room via the same HTTP API the dialog uses.
    // A unique code per run avoids interference with rooms left in a
    // transient state by previous runs. Charset matches lib/room-code.ts
    // (no 0/O/1/I/L).
    const roomCode = `VELO-${crypto.randomUUID().slice(0, 4).toUpperCase().replace(/[0-1]/g, "X")}`
    const configure = await ctxA.request.post(
      "http://127.0.0.1:1999/parties/main/" + roomCode,
      {
        data: {
          mode: "words",
          wordOption: 10,
          timeOption: 30,
          difficulty: "easy",
          isQuickMatch: false,
        },
      }
    )
    expect(configure.ok()).toBeTruthy()

    await pageA.goto(`/race/${roomCode}`, { waitUntil: "domcontentloaded" })
    await expect(
      pageA.getByRole("heading", { name: "Race Lobby" })
    ).toBeVisible({ timeout: 60_000 })

    // Player B joins from a second context
    await pageB.goto(`/race/${roomCode}`, { waitUntil: "domcontentloaded" })
    await expect(
      pageB.getByRole("heading", { name: "Race Lobby" })
    ).toBeVisible({ timeout: 60_000 })

    // Both players are listed on both screens
    await expect(pageA.getByText("Players (2/8)")).toBeVisible({
      timeout: 30_000,
    })
    await expect(pageB.getByText("Players (2/8)")).toBeVisible({
      timeout: 30_000,
    })

    // Guest readies up — the host's Start button enables only when everyone is ready
    await pageB.getByRole("button", { name: /I'm Ready/ }).click()
    await expect(
      pageB.getByRole("button", { name: "Cancel Ready" })
    ).toBeVisible({ timeout: 30_000 })

    // Host starts the race
    await expect(pageA.getByRole("button", { name: "Start Race" })).toBeEnabled(
      { timeout: 30_000 }
    )
    await pageA.getByRole("button", { name: "Start Race" }).click()

    // Racing state: the words arrive and the per-player progress strip appears.
    // (The race page has no <main> element — assert on rendered words instead.)
    await expect(pageA.getByText("0/10")).toBeVisible({ timeout: 30_000 })
    await expect(pageB.getByText("0/10")).toBeVisible({ timeout: 30_000 })

    // Both players' names show in the live progress strip
    await expect(pageA.getByText(/WPM/).first()).toBeVisible({
      timeout: 30_000,
    })

    // Extract the rendered words from both clients — they must match exactly
    const wordsA = await pageA.evaluate(() => {
      const container = document.querySelector('[style*="font-size"]')
      return container?.textContent ?? ""
    })
    const wordsB = await pageB.evaluate(() => {
      const container = document.querySelector('[style*="font-size"]')
      return container?.textContent ?? ""
    })

    // The critical assertion: identical race text on every client
    expect(wordsA.length).toBeGreaterThan(0)
    expect(wordsB).toBe(wordsA)

    await ctxA.close()
    await ctxB.close()
  })
})
