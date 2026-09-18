import type { MetadataRoute } from "next"
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
]

function trimTrailingSlashes(value: string): string {
  let end = value.length
  while (end > 0 && value[end - 1] === "/") end -= 1
  return value.slice(0, end)
}

function joinUrl(baseUrl: string, path: string): string {
  const normalizedBase = trimTrailingSlashes(baseUrl)
  return path === "/" ? normalizedBase : `${normalizedBase}${path}`
}

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date()

  return staticRoutes.map((route) => ({
    url: joinUrl(siteConfig.url, route.path),
    lastModified,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }))
}
