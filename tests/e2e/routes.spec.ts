import { expect, test } from "@playwright/test"

// CI smoke coverage for the newer routes: a build/routing regression on any
// of these pages should fail here before it reaches production.

test.describe.configure({ mode: "serial", timeout: 120_000 })

test.describe("New route smoke", () => {
  test("courses page renders the course list", async ({ page }) => {
    await page.goto("/courses", { waitUntil: "domcontentloaded" })
    await expect(
      page.getByRole("heading", { name: "Typing Courses" }),
      "courses heading should be visible"
    ).toBeVisible({ timeout: 60_000 })
    // The three built-in courses render once progress hydrates
    await expect(
      page.getByText("Foundations", { exact: true }).first()
    ).toBeVisible({ timeout: 60_000 })
  })

  test("leaderboard page renders (scores or coming-soon)", async ({ page }) => {
    await page.goto("/leaderboard", { waitUntil: "domcontentloaded" })
    await expect(
      page.getByRole("heading", { name: "Weekly Leaderboard" }),
      "leaderboard heading should be visible"
    ).toBeVisible({ timeout: 60_000 })
    // Either the live boards (configured) or the friendly coming-soon card:
    // both are valid states depending on the environment's Upstash config.
    await expect(page.getByText(/Coming soon|Top WPM/i).first()).toBeVisible({
      timeout: 60_000,
    })
  })

  test("typing language landing page renders", async ({ page }) => {
    await page.goto("/typing/english", { waitUntil: "domcontentloaded" })
    await expect(
      page.getByRole("heading", { name: "English Typing Test", exact: true }),
      "language landing heading should be visible"
    ).toBeVisible({ timeout: 60_000 })
  })

  test("unknown language landing page 404s", async ({ page }) => {
    const response = await page.goto("/typing/klingon", {
      waitUntil: "domcontentloaded",
    })
    expect(response?.status()).toBe(404)
  })
})
