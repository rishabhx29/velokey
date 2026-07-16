import type { MetadataRoute } from "next"
import { siteConfig } from "@/lib/site"

function joinUrl(baseUrl: string, path: string): string {
  const normalizedBase = baseUrl.replace(/\/+$/, "")
  return `${normalizedBase}${path}`
}

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
    },
    sitemap: joinUrl(siteConfig.url, "/sitemap.xml"),
    host: siteConfig.url.replace(/\/+$/, ""),
  }
}
