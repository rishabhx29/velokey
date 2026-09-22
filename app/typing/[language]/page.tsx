import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import fs from "node:fs"
import path from "node:path"
import type { Language } from "@/lib/languages"
import { siteConfig } from "@/lib/site"
import { TypingLandingCta } from "@/components/typing-landing-cta"

// Language names for codes, used in titles/copy.
const LANGUAGE_LABELS: Record<string, string> = {
  english: "English",
  spanish: "Spanish",
  french: "French",
  german: "German",
  portuguese: "Portuguese",
  italian: "Italian",
  hindi: "Hindi",
  russian: "Russian",
  arabic: "Arabic",
  bangla: "Bangla",
  chinese_simplified: "Chinese (Simplified)",
  chinese_traditional: "Chinese (Traditional)",
  czech: "Czech",
  danish: "Danish",
  dutch: "Dutch",
  finnish: "Finnish",
  greek: "Greek",
  hebrew: "Hebrew",
  hungarian: "Hungarian",
  indonesian: "Indonesian",
  japanese_hiragana: "Japanese (Hiragana)",
  japanese_katakana: "Japanese (Katakana)",
  korean: "Korean",
  norwegian: "Norwegian",
  persian: "Persian",
  polish: "Polish",
  romanian: "Romanian",
  serbian: "Serbian",
  slovak: "Slovak",
  slovenian: "Slovenian",
  swedish: "Swedish",
  thai: "Thai",
  turkish: "Turkish",
  ukrainian: "Ukrainian",
  urdu: "Urdu",
  vietnamese: "Vietnamese",
  chinese_traditional_zhuyin: "Chinese (Zhuyin)",
  chinese_traditional_cangjie: "Chinese (Cangjie)",
  chinese_simplified_wubi: "Chinese (Wubi)",
}

function labelFor(code: string): string {
  return LANGUAGE_LABELS[code] ?? code.charAt(0).toUpperCase() + code.slice(1)
}

interface TypingLanguagePageProps {
  params: Promise<{ language: string }>
}

// Read the manifest at build time (server component, no fetch needed).
function readManifest(): Language[] {
  const file = path.join(process.cwd(), "public", "languages", "_manifest.json")
  return JSON.parse(fs.readFileSync(file, "utf8")) as Language[]
}

export function generateStaticParams() {
  return readManifest().map((l) => ({ language: l.code }))
}

export async function generateMetadata({
  params,
}: TypingLanguagePageProps): Promise<Metadata> {
  const { language } = await params
  const languages = readManifest()
  if (!languages.some((l) => l.code === language)) return {}
  const name = labelFor(language)
  const title = `${name} Typing Test — Free Online WPM Test in ${name}`
  const description = `Take a free ${name} typing test and measure your speed in WPM and accuracy. Practice ${name} typing with 200 and 1000 word lists, live stats, and an on-screen keyboard. No sign-up needed.`
  return {
    title,
    description,
    alternates: { canonical: `/typing/${language}` },
    openGraph: {
      title: `${siteConfig.name} — ${title}`,
      description,
      url: `${siteConfig.url}/typing/${language}`,
    },
  }
}

export default async function TypingLanguagePage({
  params,
}: TypingLanguagePageProps) {
  const { language } = await params
  const languages = readManifest()
  const meta = languages.find((l) => l.code === language)
  if (!meta) notFound()

  const name = labelFor(language)
  const others = languages.filter((l) => l.code !== language).slice(0, 11)

  const faqs = [
    {
      name: `How is ${name} typing speed measured?`,
      answer: `Your ${name} typing speed is measured in WPM (words per minute, standardized at 5 characters per word) together with accuracy. VeloKey shows live WPM while you type and a full breakdown when you finish.`,
    },
    {
      name: `Is this ${name} typing test free?`,
      answer:
        "Yes. VeloKey is completely free, requires no account, and works in your browser on desktop and mobile.",
    },
    {
      name: `How can I type ${name} faster?`,
      answer:
        "Practice regularly, keep your eyes on the text rather than the keyboard, and use the accuracy-focused drills. VeloKey tracks your weakest keys and words so you can target practice where you need it.",
    },
  ]

  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        name: `${name} Typing Test`,
        description: `Free ${name} typing speed test with WPM and accuracy tracking.`,
        url: `${siteConfig.url}/typing/${language}`,
      },
      {
        "@type": "FAQPage",
        mainEntity: faqs.map((faq) => ({
          "@type": "Question",
          name: faq.name,
          acceptedAnswer: {
            "@type": "Answer",
            text: faq.answer,
          },
        })),
      },
    ],
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      <p className="mb-2 font-mono text-xs font-semibold tracking-widest text-primary uppercase">
        {siteConfig.name} · {name}
      </p>
      <h1 className="font-mono text-3xl font-bold tracking-tight text-foreground">
        {name} Typing Test
      </h1>
      <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
        Measure your {name} typing speed in words per minute with a clean,
        distraction-free test. Type the{" "}
        {meta.has1k ? "1,000 most common" : "most common"} {name} words while
        live stats track your WPM, accuracy, and consistency. When you finish,
        you get a full character-level breakdown, a shareable result card, and
        per-key accuracy trends so you know exactly what to practice next.
      </p>

      <TypingLandingCta language={language} />

      <section className="mt-10">
        <h2 className="font-mono text-sm font-bold tracking-widest text-muted-foreground uppercase">
          What you get
        </h2>
        <ul className="mt-3 flex flex-col gap-2 text-sm text-muted-foreground">
          <li>
            • Live WPM, accuracy, and consistency while you type — no sign-up,
            no ads
          </li>
          <li>
            •{" "}
            {meta.has1k
              ? "Two word lists: top 200 and top 1,000"
              : "A curated common-words list"}{" "}
            for real-world {name} vocabulary
          </li>
          <li>• Time (15/30/60s) and word (25/50/100) test formats</li>
          <li>
            • Weak-key and problem-word drills generated from your own mistakes
          </li>
          <li>• Optional multiplayer races with friends</li>
        </ul>
      </section>

      <section className="mt-10">
        <h2 className="font-mono text-sm font-bold tracking-widest text-muted-foreground uppercase">
          Other languages
        </h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {others.map((l) => (
            <Link
              key={l.code}
              href={`/typing/${l.code}`}
              className="rounded-lg border border-border bg-muted/10 px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
            >
              {labelFor(l.code)} typing test
            </Link>
          ))}
        </div>
      </section>

      <section className="mt-10">
        <h2 className="font-mono text-sm font-bold tracking-widest text-muted-foreground uppercase">
          FAQ
        </h2>
        <div className="mt-3 flex flex-col gap-5">
          {faqs.map((faq) => (
            <div key={faq.name}>
              <h3 className="text-sm font-semibold text-foreground">
                {faq.name}
              </h3>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                {faq.answer}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
