import type { MetadataRoute } from "next"
import fs from "node:fs"
import path from "node:path"
import { siteConfig } from "@/lib/site"

type StaticRoute = {
  path: string
  changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"]
  priority: number
}

const staticRoutes: StaticRoute[] = [
  { path: "/", changeFrequency: "daily", priority: 1 },
  { path: "/about", changeFrequency: "monthly", priority: 0.6 },
  { path: "/changelog", changeFrequency: "weekly", priority: 0.7 },
  { path: "/stats", changeFrequency: "weekly", priority: 0.7 },
  { path: "/courses", changeFrequency: "weekly", priority: 0.8 },
  { path: "/leaderboard", changeFrequency: "daily", priority: 0.8 },
]

function trimTrailingSlashes(value: string): string {
  let end = value.length
  while (end > 0 && end - 1 < value.length && value[end - 1] === "/") end -= 1
  return value.slice(0, end)
}

function joinUrl(baseUrl: string, path: string): string {
  const normalizedBase = trimTrailingSlashes(baseUrl)
  return path === "/" ? normalizedBase : `${normalizedBase}${path}`
}

function readLanguageCodes(): string[] {
  try {
    const file = path.join(
      process.cwd(),
      "public",
      "languages",
      "_manifest.json"
    )
    const manifest = JSON.parse(fs.readFileSync(file, "utf8")) as {
      code: string
    }[]
    return manifest.map((l) => l.code)
  } catch {
    return []
  }
}

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date()

  const routes: MetadataRoute.Sitemap = staticRoutes.map((route) => ({
    url: joinUrl(siteConfig.url, route.path),
    lastModified,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }))

  // One SEO landing page per typing language
  const languageRoutes: MetadataRoute.Sitemap = readLanguageCodes().map(
    (code) => ({
      url: joinUrl(siteConfig.url, `/typing/${code}`),
      lastModified,
      changeFrequency: "weekly",
      priority: 0.9,
    })
  )

  return [...routes, ...languageRoutes]
}
