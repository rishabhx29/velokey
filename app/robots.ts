import type { MetadataRoute } from "next"
import { siteConfig } from "@/lib/site"

function joinUrl(baseUrl: string, path: string): string {
  return `${trimTrailingSlashes(baseUrl)}${path}`
}

function trimTrailingSlashes(value: string): string {
  let end = value.length
  while (end > 0 && value[end - 1] === "/") end -= 1
  return value.slice(0, end)
}

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/race/"],
    },
    sitemap: joinUrl(siteConfig.url, "/sitemap.xml"),
    host: trimTrailingSlashes(siteConfig.url),
  }
}
