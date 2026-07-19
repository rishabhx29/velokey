import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Typing Practice, Built for Flow",
  description: "Practice typing with VeloKey's focused, customizable typing tests, visual keyboards, sounds, and live performance feedback.",
  alternates: { canonical: "/landing" },
}

export default function LandingLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children
}
