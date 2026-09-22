// ── Upstash Redis REST Client ─────────────────────────────────────────────────
// Thin server-only wrapper around Upstash's REST API. Used exclusively by
// API routes (never imported from client components — it reads server env
// vars that must not reach the browser).
//
// Setup: create a free database at https://console.upstash.com, open its
// "REST API" tab, and paste the URL + token into .env.local:
//   UPSTASH_REDIS_REST_URL=https://....upstash.io
//   UPSTASH_REDIS_REST_TOKEN=...
//
// Every helper degrades gracefully: when the env vars are missing (local dev,
// preview deploys) calls resolve to `null` instead of throwing, so features
// can hide themselves rather than error.

const REST_URL = process.env.UPSTASH_REDIS_REST_URL?.trim() || ""
const REST_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN?.trim() || ""

/** True when both Upstash env vars are present. */
export function upstashConfigured(): boolean {
  return REST_URL.length > 0 && REST_TOKEN.length > 0
}

/**
 * Run a single Redis command. Returns null (never throws) when Upstash is
 * unconfigured or unreachable — callers treat null as "feature disabled".
 */
export async function upstashCommand<T = unknown>(
  command: unknown[]
): Promise<T | null> {
  const results = await upstashPipeline<T>([command])
  return results === null ? null : (results[0] ?? null)
}

/**
 * Run a pipeline (atomic batch) of Redis commands via the /pipeline endpoint.
 * Returns null (never throws) when Upstash is unconfigured or unreachable.
 */
export async function upstashPipeline<T = unknown>(
  commands: unknown[][]
): Promise<T[] | null> {
  if (!upstashConfigured()) return null
  try {
    // Pipeline batches go to the /pipeline endpoint (array-of-arrays body).
    const res = await fetch(`${REST_URL.replace(/\/+$/, "")}/pipeline`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${REST_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(commands),
      cache: "no-store",
    })
    if (!res.ok) return null
    const json = (await res.json()) as Array<{ result?: T; error?: string }>
    if (!Array.isArray(json)) return null
    for (const item of json) {
      if (item && typeof item === "object" && "error" in item && item.error)
        return null
    }
    return json.map((item) => item?.result as T)
  } catch {
    return null
  }
}
