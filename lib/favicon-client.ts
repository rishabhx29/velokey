
function buildFaviconHref(primary: string, background: string): string {
  const p = primary.replace(/"/g, "'")
  const b = background.replace(/"/g, "'")
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32" fill="none"><rect fill="${b}" width="32" height="32" rx="8"/><rect x="1.5" y="1.5" width="29" height="29" rx="7" stroke="${p}" stroke-opacity="0.35" stroke-width="1.5"/><rect x="4.5" y="4.5" width="23" height="23" rx="5.5" fill="${b}" stroke="${p}" stroke-opacity="0.15" stroke-width="1"/><path d="M 9.5 21.5 L 15 16 L 9.5 10.5 M 16.5 21.5 L 22 16 L 16.5 10.5" stroke="${p}" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" fill="none"/><circle cx="27.5" cy="4.5" r="2.5" fill="${p}"/></svg>`
    .replace(/\s+/g, " ")
    .trim()
  return `data:image/svg+xml;base64,${globalThis.btoa(svg)}`
}

function readColorsFromThemeProbe(): { primary: string; background: string } | null {
  if (typeof document === "undefined" || !document.body) return null

  const el = document.createElement("div")
  el.setAttribute("aria-hidden", "true")
  el.className = "bg-background text-primary"
  el.style.cssText =
    "position:absolute;left:0;top:0;width:1px;height:1px;overflow:hidden;clip:rect(0,0,0,0);pointer-events:none"

  document.body.appendChild(el)
  const cs = getComputedStyle(el)
  const primary = cs.color
  const background = cs.backgroundColor
  el.remove()

  if (!primary || !background || primary === "rgba(0, 0, 0, 0)") return null
  return { primary, background }
}

export function syncVeloKeyFavicon() {
  if (typeof document === "undefined") return

  const colors = readColorsFromThemeProbe()
  if (!colors) return

  const href = buildFaviconHref(colors.primary, colors.background)

  const selectors = ['link[rel="icon"]', 'link[rel="shortcut icon"]'] as const
  let touched = false
  for (const sel of selectors) {
    document.querySelectorAll<HTMLLinkElement>(sel).forEach((link) => {
      link.type = "image/svg+xml"
      link.href = href
      touched = true
    })
  }

  if (!touched) {
    const link = document.createElement("link")
    link.id = "velokey-favicon"
    link.rel = "shortcut icon"
    link.type = "image/svg+xml"
    link.href = href
    document.head.prepend(link)
  }
}
