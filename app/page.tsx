import type { Metadata } from "next"
import HomePageClient from "@/components/home-page-client"
import { siteConfig } from "@/lib/site"

export const metadata: Metadata = {
  title: "Typing Speed Test",
  description: siteConfig.description,
  alternates: { canonical: "/" },
}

const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      name: siteConfig.name,
      url: siteConfig.url,
      description: siteConfig.description,
    },
    {
      "@type": "SoftwareApplication",
      name: siteConfig.name,
      applicationCategory: "EducationalApplication",
      operatingSystem: "Any",
      browserRequirements: "Requires a modern web browser",
      description: siteConfig.description,
      url: siteConfig.url,
      image: `${siteConfig.url}/opengraph.png`,
      offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    },
  ],
}

export default function Page() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <HomePageClient />
    </>
  )
}
