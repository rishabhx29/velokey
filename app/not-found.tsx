import Link from "next/link"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "404 — VeloKey",
  description: "Page not found.",
}

export default function NotFound() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6 py-16">
      <div className="flex max-w-xl flex-col items-center text-center">
        <div className="relative flex items-center justify-center">
          <span className="font-(family-name:--font-doto) text-[10rem] font-bold leading-none text-foreground sm:text-[14rem]">
            404
          </span>
        </div>

        <p className="mt-10 leading-relaxed text-muted-foreground">
          Looks like you mistyped the URL. Even the best typists miss sometimes.
        </p>

        <Link
          href="/"
          className="mt-6 text-sm text-primary underline-offset-4 hover:underline"
        >
          &#8592; Back to typing test
        </Link>
      </div>
    </main>
  )
}
