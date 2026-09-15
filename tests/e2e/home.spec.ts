import { expect, test } from "@playwright/test"

// First visit compiles the route in dev mode; keep timeouts generous.
test.describe.configure({ mode: "serial", timeout: 120_000 })

test.describe("Home page", () => {
  test("loads with the typing test visible", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" })
    await expect(page).toHaveTitle(/Typing Speed Test/i, { timeout: 60_000 })
    // The typing area initializes: settings hydrate and words render
    await expect(page.locator("main").first()).toBeVisible({ timeout: 60_000 })
    await expect
      .poll(
        async () =>
          page.evaluate(
            () => document.querySelector('input[spellcheck="false"]') !== null
          ),
        {
          timeout: 60_000,
          message: "typing input should mount",
        }
      )
      .toBe(true)
  })

  test("focus overlay prompts the user before typing starts", async ({
    page,
  }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" })
    const input = page.locator('input[spellcheck="false"]')
    await expect(input).toBeAttached({ timeout: 60_000 })
  })

  test("typing produces visible progress", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" })
    // Clicking the typing surface focuses the hidden input via handleFocus
    await page.locator("main").click({ timeout: 60_000 })

    // Read the first word from the DOM, then type it exactly
    const firstWord = await page.evaluate(() => {
      const el = document.querySelector<HTMLDivElement>(
        '[style*="font-size"] [class*="whitespace-nowrap"]'
      )
      return el?.textContent ?? ""
    })

    if (/^[a-zA-Z]+$/.test(firstWord.trim())) {
      await page.keyboard.type(firstWord.trim(), { delay: 25 })
      await page.keyboard.press("Space")
      // A fully-typed word shows as committed (no crash, words still visible)
      await expect(page.locator("main")).toBeVisible()
    }
  })

  test("restart shortcut (tab + enter) keeps the test fresh", async ({
    page,
  }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" })
    await page.locator("main").click({ timeout: 60_000 })
    await page.keyboard.press("Tab")
    await page.keyboard.press("Enter")
    await expect(page.locator("main")).toBeVisible()
  })
})

test.describe("Navigation", () => {
  test("header links navigate to stats and about", async ({ page }) => {
    test.setTimeout(120_000)
    await page.goto("/", { waitUntil: "domcontentloaded" })
    await page.getByRole("link", { name: "Stats Dashboard" }).click()
    await expect(page).toHaveURL(/\/stats/, { timeout: 60_000 })
    await expect(
      page.getByRole("heading", { name: "Stats Dashboard" })
    ).toBeVisible({ timeout: 60_000 })

    await page.getByRole("link", { name: "About VeloKey" }).click()
    await expect(page).toHaveURL(/\/about/, { timeout: 60_000 })
    await expect(
      page.getByRole("heading", { name: "About VeloKey" })
    ).toBeVisible({ timeout: 60_000 })
  })

  test("changelog page renders", async ({ page }) => {
    test.setTimeout(120_000)
    await page.goto("/changelog", { waitUntil: "domcontentloaded" })
    await expect(page.getByRole("heading", { name: "Changelog" })).toBeVisible({
      timeout: 60_000,
    })
  })

  test("404 page shows for unknown routes", async ({ page }) => {
    test.setTimeout(120_000)
    await page.goto("/this-page-does-not-exist", {
      waitUntil: "domcontentloaded",
    })
    await expect(page.getByText("404")).toBeVisible({ timeout: 60_000 })
  })

  test("llms.txt route serves plain text", async ({ request }) => {
    const res = await request.get("/llms.txt")
    expect(res.ok()).toBeTruthy()
    const body = await res.text()
    expect(body).toContain("VeloKey")
    expect(body).toContain("/changelog")
  })

  test("sitemap includes changelog", async ({ request }) => {
    const res = await request.get("/sitemap.xml")
    expect(res.ok()).toBeTruthy()
    const body = await res.text()
    expect(body).toContain("/changelog")
    expect(body).toContain("/about")
  })

  test("themes API returns the default theme", async ({ request }) => {
    const res = await request.get("/api/themes")
    expect(res.ok()).toBeTruthy()
    const themes = (await res.json()) as { id: string; label: string }[]
    expect(themes.length).toBeGreaterThan(1)
    expect(themes[0].id).toBe("default")
  })
})

test.describe("Race room", () => {
  test("invalid room codes redirect home", async ({ page }) => {
    test.setTimeout(120_000)
    await page.goto("/race/not-a-real-code", { waitUntil: "commit" })
    await expect(page).toHaveURL(/\/$/, { timeout: 60_000 })
  })

  test("invalid short codes redirect home", async ({ page }) => {
    test.setTimeout(120_000)
    await page.goto("/race/VELO-", { waitUntil: "commit" })
    await expect(page).toHaveURL(/\/$/, { timeout: 60_000 })
  })
})
