// ── Upstash REST client regression tests ─────────────────────────────────────
// Guards the endpoint contract that once broke the leaderboard in production:
// pipeline batches (array-of-arrays) MUST go to the /pipeline endpoint — the
// base REST URL only accepts single commands and rejects arrays with
// "ERR unsupported arg type".
//
// The client reads env vars into module constants at import time, so each
// test resets modules and re-imports to pick up the stubbed env.

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

async function loadClient() {
  vi.resetModules()
  return await import("@/lib/upstash")
}

describe("upstash REST client", () => {
  let fetchMock: ReturnType<typeof vi.fn>

  beforeEach(() => {
    // Trailing slash on purpose: the client must normalize it away.
    vi.stubEnv("UPSTASH_REDIS_REST_URL", "https://test-db.upstash.io/")
    vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "test-token")
    fetchMock = vi.fn()
    vi.stubGlobal("fetch", fetchMock)
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    vi.unstubAllGlobals()
  })

  const okResponse = (body: unknown) =>
    new Response(JSON.stringify(body), { status: 200 })

  it("routes single commands through the /pipeline endpoint with an array-of-arrays body", async () => {
    fetchMock.mockResolvedValue(okResponse([{ result: "PONG" }]))
    const client = await loadClient()

    const result = await client.upstashCommand<string>(["PING"])

    expect(fetchMock).toHaveBeenCalledTimes(1)
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(url).toBe("https://test-db.upstash.io/pipeline")
    expect(JSON.parse(String(init.body))).toEqual([["PING"]])
    expect((init.headers as Record<string, string>).Authorization).toBe(
      "Bearer test-token"
    )
    expect(result).toBe("PONG")
  })

  it("sends multi-command pipelines intact to /pipeline", async () => {
    fetchMock.mockResolvedValue(okResponse([{ result: 1 }, { result: 2 }]))
    const client = await loadClient()

    const commands = [
      ["ZADD", "board", "1", "a"],
      ["ZADD", "board", "2", "b"],
    ]
    const results = await client.upstashPipeline<number>(commands)

    expect(fetchMock).toHaveBeenCalledTimes(1)
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(url).toBe("https://test-db.upstash.io/pipeline")
    expect(JSON.parse(String(init.body))).toEqual(commands)
    expect(results).toEqual([1, 2])
  })

  it("is unconfigured without env vars and never calls fetch", async () => {
    vi.stubEnv("UPSTASH_REDIS_REST_URL", "")
    vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "")
    const client = await loadClient()

    expect(client.upstashConfigured()).toBe(false)
    expect(await client.upstashCommand(["PING"])).toBeNull()
    expect(await client.upstashPipeline([["PING"]])).toBeNull()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it("degrades to null on non-2xx responses", async () => {
    fetchMock.mockResolvedValue(new Response("nope", { status: 401 }))
    const client = await loadClient()

    expect(await client.upstashCommand(["PING"])).toBeNull()
  })

  it("degrades to null when any pipeline item reports a Redis error", async () => {
    fetchMock.mockResolvedValue(
      okResponse([{ result: 1 }, { error: "ERR unsupported arg type" }])
    )
    const client = await loadClient()

    expect(
      await client.upstashPipeline([
        ["SET", "k", "v"],
        ["BAD", "cmd"],
      ])
    ).toBeNull()
  })

  it("degrades to null when fetch throws (network unreachable)", async () => {
    fetchMock.mockRejectedValue(new TypeError("fetch failed"))
    const client = await loadClient()

    expect(await client.upstashCommand(["PING"])).toBeNull()
  })

  it("degrades to null on malformed (non-array) response bodies", async () => {
    fetchMock.mockResolvedValue(okResponse({ unexpected: true }))
    const client = await loadClient()

    expect(await client.upstashCommand(["PING"])).toBeNull()
  })
})
