import { expect, test } from "@playwright/test"

test.beforeEach(async ({ context }) => {
  await context.addInitScript(() =>
    sessionStorage.removeItem("velokey:landing-intro-complete")
  )
})

test("plays once, then leaves the landing page ready", async ({ page }) => {
  await page.goto("/landing")
  await expect(page.getByTestId("landing-intro")).toBeVisible()
  await expect(page.getByRole("link", { name: /start typing/i })).toBeVisible({
    timeout: 5_000,
  })
  await expect(page.locator("canvas")).toHaveCount(0)

  await page.reload()
  await expect(page.getByTestId("landing-intro")).toHaveCount(0)
  await expect(page.getByRole("link", { name: /start typing/i })).toBeVisible()
})

test("click and keyboard skip both clear the overlay", async ({ page }) => {
  await page.goto("/landing")
  await expect(page.getByTestId("landing-intro")).toBeVisible()
  await page.getByTestId("landing-intro").click()
  await expect(page.getByTestId("landing-intro")).toHaveCount(0)
  await expect(page.locator("canvas")).toHaveCount(0)
  expect(await page.evaluate(() => document.body.style.overflow)).toBe("")

  await page.evaluate(() =>
    sessionStorage.removeItem("velokey:landing-intro-complete")
  )
  await page.reload()
  await expect(page.getByTestId("landing-intro")).toBeVisible()
  await page.keyboard.press("Escape")
  await expect(page.getByTestId("landing-intro")).toHaveCount(0)
})

test("reduced motion bypasses the 3D canvas", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" })
  await page.goto("/landing")

  await expect(page.getByRole("link", { name: /start typing/i })).toBeVisible()
  await expect(page.getByTestId("landing-intro")).toHaveCount(0)
  await expect(page.locator("canvas")).toHaveCount(0)
})
