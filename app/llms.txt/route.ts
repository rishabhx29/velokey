import { siteConfig } from "@/lib/site"

export const dynamic = "force-static"

export function GET() {
  const content = `# ${siteConfig.name}

> ${siteConfig.description}

## Main pages

- [Typing test](${siteConfig.url}/): Start a typing test and track WPM and accuracy.
- [Product overview](${siteConfig.url}/landing): Learn about typing modes, languages, keyboards, sounds, and statistics.
- [About](${siteConfig.url}/about): Project background, keyboard shortcuts, and privacy information.
- [Changelog](${siteConfig.url}/changelog): Recent product updates.
- [Stats](${siteConfig.url}/stats): Typing performance statistics.
`

  return new Response(content, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  })
}
