import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

/** Deployment probe: verifies that the browser will not fall back to localhost. */
export function GET() {
  const host = process.env.NEXT_PUBLIC_PARTYKIT_HOST
  const configured = Boolean(host && !host.startsWith("localhost"))
  return NextResponse.json(
    { ok: configured, realtimeHost: host ?? null },
    { status: configured ? 200 : 503 },
  )
}
