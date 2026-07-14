"use client";

import { useEffect, useRef, useState } from "react";
import { SOUND_PACKS } from "@/lib/settings-data";
import { SOUND_DEFINES_DOWN } from "@/components/ui/keyboard";
import { CREAM, CYAN, CORAL } from "../lib/colors";
import { SectionHeader } from "./Modes";
import { Reveal } from "./Reveal";

const SWITCH_META: Record<string, { stem: string; feel: string }> = {
  "default":             { stem: CYAN,       feel: "clean · neutral" },
  "cherrymx-black-pbt":  { stem: "#2b2b2b",  feel: "linear · heavy" },
  "cherrymx-blue-pbt":   { stem: "#2f6fe0",  feel: "clicky · sharp" },
  "cherrymx-brown-pbt":  { stem: "#8a5a2b",  feel: "tactile · soft" },
  "cherrymx-red-pbt":    { stem: "#d7373f",  feel: "linear · light" },
  "mx-speed-silver":     { stem: "#c4ccd4",  feel: "linear · fast" },
  "eg-oreo":             { stem: "#1a1a2e",  feel: "tactile · creamy" },
  "topre-purple":        { stem: "#8b5cf6",  feel: "tactile · domed" },
  "creams":              { stem: "#f0d9c6",  feel: "linear · poppy" },
  "banana-split-lubed":  { stem: "#ffe135",  feel: "tactile · thocky" },
};

type RawConfig = {
  key_define_type?: "single" | "multi";
  defines: Record<string, [number, number] | string | null>;
};

// Module-level caches — same pattern as keyboard.tsx
const rawBufferCache = new Map<string, ArrayBuffer>();
const decodedBufferCache = new Map<string, AudioBuffer>();
const configCache = new Map<string, RawConfig>();

async function fetchDecoded(ctx: AudioContext, url: string): Promise<AudioBuffer> {
  if (decodedBufferCache.has(url)) return decodedBufferCache.get(url)!;
  let ab = rawBufferCache.get(url);
  if (!ab) {
    const r = await fetch(url);
    ab = await r.arrayBuffer();
    rawBufferCache.set(url, ab);
  }
  const decoded = await ctx.decodeAudioData(ab.slice(0));
  decodedBufferCache.set(url, decoded);
  return decoded;
}

function playBuffer(ctx: AudioContext, buffer: AudioBuffer, startMs: number, durMs: number): AudioBufferSourceNode {
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  source.connect(ctx.destination);
  if (startMs === 0 && durMs === 0) {
    source.start(0);
  } else {
    source.start(0, startMs / 1000, durMs / 1000);
  }
  return source;
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// Scancode to use when demoing a specific pack (overrides random pick)
const PACK_SHOWCASE_SCANCODE: Record<string, string> = {
  "creams": "57", // Space
};

export function MobileSurface() {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [pressedId, setPressedId] = useState<string | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const currentSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const stopTimer = useRef<number | null>(null);

  useEffect(() => () => {
    if (stopTimer.current) window.clearTimeout(stopTimer.current);
    try { currentSourceRef.current?.stop(); } catch { /* already stopped */ }
    audioCtxRef.current?.close();
  }, []);

  async function play(packId: string) {
    const pack = SOUND_PACKS.find(p => p.id === packId);
    if (!pack) return;

    setPressedId(packId);
    setActiveId(packId);
    window.setTimeout(() => setPressedId(null), 140);

    if (stopTimer.current) window.clearTimeout(stopTimer.current);
    try { currentSourceRef.current?.stop(); } catch { /* already stopped */ }
    currentSourceRef.current = null;

    if (!audioCtxRef.current) audioCtxRef.current = new AudioContext();
    const ctx = audioCtxRef.current;
    if (ctx.state === "suspended") await ctx.resume();

    try {
      let source: AudioBufferSourceNode;
      let durMs: number;

      if (!pack.configUrl) {
        // Classic: built-in sprite with SOUND_DEFINES_DOWN offsets
        const buffer = await fetchDecoded(ctx, pack.url);
        const defs = Object.values(SOUND_DEFINES_DOWN);
        const [startMs, dur] = pickRandom(defs);
        durMs = dur;
        source = playBuffer(ctx, buffer, startMs, durMs);
      } else {
        let config = configCache.get(pack.configUrl);
        if (!config) {
          config = await fetch(pack.configUrl).then(r => r.json()) as RawConfig;
          configCache.set(pack.configUrl, config);
        }

        if (config.key_define_type === "multi") {
          // Individual WAV files per key — pick one randomly and play the whole file
          const baseUrl = pack.configUrl.slice(0, pack.configUrl.lastIndexOf("/") + 1);
          const filenames = Object.values(config.defines).filter((v): v is string => typeof v === "string");
          const filename = pickRandom(filenames);
          const buffer = await fetchDecoded(ctx, baseUrl + filename);
          durMs = Math.round(buffer.duration * 1000);
          source = playBuffer(ctx, buffer, 0, 0);
        } else {
          // Sprite pack — use showcase scancode if defined, otherwise pick randomly
          const buffer = await fetchDecoded(ctx, pack.url);
          const showcaseScancode = PACK_SHOWCASE_SCANCODE[packId];
          const showcaseEntry = showcaseScancode ? config.defines[showcaseScancode] : undefined;
          const slices = Object.values(config.defines).filter((v): v is [number, number] => Array.isArray(v));
          const [startMs, dur] = (Array.isArray(showcaseEntry) ? showcaseEntry : null) ?? pickRandom(slices);
          durMs = dur;
          source = playBuffer(ctx, buffer, startMs, durMs);
        }
      }

      currentSourceRef.current = source;
      stopTimer.current = window.setTimeout(() => {
        setActiveId(cur => (cur === packId ? null : cur));
      }, durMs + 60);
    } catch {
      setActiveId(null);
    }
  }

  return (
    <section className="relative z-10 mx-auto max-w-site px-6 py-16 md:hidden">
      <SectionHeader
        kicker="§01 · the surface"
        title={
          <>
            Pick a feel.{" "}
            <span style={{ color: `${CREAM}55` }}>Hear before you type.</span>
          </>
        }
        sub="Ten switches, ten personalities. Tap one to sample its voice."
      />

      <Reveal direction="up" y={20} delay={0.1}>
      <div
        className="relative border"
        style={{ borderColor: `${CREAM}14`, background: "#0d1016" }}
      >
        <div
          className="flex items-center justify-between border-b px-4 py-3"
          style={{ borderColor: `${CREAM}10` }}
        >
          <div
            className="font-mono text-[10px] uppercase tracking-[0.28em]"
            style={{ color: CYAN }}
          >
            ▮ switch lab
          </div>
          <NowPlaying active={!!activeId} />
        </div>

        <ul className="divide-y" style={{ borderColor: `${CREAM}08` }}>
          {SOUND_PACKS.map((pack, i) => {
            const meta = SWITCH_META[pack.id] ?? { stem: CYAN, feel: "—" };
            const isPressed = pressedId === pack.id;
            const isActive = activeId === pack.id;
            return (
              <li
                key={pack.id}
                style={{ borderColor: `${CREAM}0d` }}
                className="border-t first:border-t-0"
              >
                <button
                  type="button"
                  onClick={() => play(pack.id)}
                  className="group flex w-full items-center gap-3 px-3 py-3 text-left transition-[transform,background] active:bg-white/[0.03]"
                  style={{
                    transform: isPressed ? "translateY(1px)" : "translateY(0)",
                  }}
                >
                  <span
                    className="w-6 shrink-0 self-stretch pt-1 text-left font-mono text-[9px] uppercase tracking-[0.22em]"
                    style={{ color: isActive ? CYAN : `${CREAM}40` }}
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>

                  <SwitchStem color={meta.stem} active={isActive} />

                  <div className="min-w-0 flex-1">
                    <div
                      className="truncate text-[15px] font-semibold leading-tight tracking-[-0.01em]"
                      style={{ color: CREAM }}
                    >
                      {pack.label}
                    </div>
                    <div
                      className="mt-1 truncate font-mono text-[10px] tracking-[0.16em]"
                      style={{ color: `${CREAM}70` }}
                    >
                      {meta.feel}
                    </div>
                  </div>

                  <PlayPulse active={isActive} />
                </button>
              </li>
            );
          })}
        </ul>

        <div
          className="border-t px-4 py-3 font-mono text-[10px] uppercase tracking-[0.22em]"
          style={{ borderColor: `${CREAM}10`, color: `${CREAM}55` }}
        >
          tap a row · sample the stem
        </div>
      </div>
      </Reveal>
    </section>
  );
}

function SwitchStem({ color, active }: { color: string; active: boolean }) {
  return (
    <div
      className="relative grid h-10 w-10 shrink-0 place-items-center border"
      style={{
        borderColor: `${CREAM}14`,
        background: "#0a0c10",
      }}
    >
      <svg viewBox="0 0 48 48" width={28} height={28} aria-hidden>
        <rect x="6" y="6" width="36" height="36" rx="2" fill="#0d1016" />
        <rect x="8" y="8" width="32" height="32" rx="1.5" fill={`${CREAM}06`} />
        <g transform="translate(24 24)">
          <rect x="-9" y="-2.75" width="18" height="5.5" rx="1" fill={color} />
          <rect x="-2.75" y="-9" width="5.5" height="18" rx="1" fill={color} />
        </g>
      </svg>
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          boxShadow: active ? `inset 0 0 0 1px ${CYAN}` : "none",
          transition: "box-shadow 200ms ease",
        }}
      />
    </div>
  );
}

function PlayPulse({ active }: { active: boolean }) {
  return (
    <div className="relative grid h-9 w-9 shrink-0 place-items-center">
      <span
        aria-hidden
        className="absolute inset-0 rounded-full border"
        style={{
          borderColor: active ? CYAN : `${CREAM}1f`,
          transition: "border-color 200ms ease",
        }}
      />
      {active && (
        <span
          aria-hidden
          className="absolute inset-0 rounded-full"
          style={{
            border: `1px solid ${CYAN}`,
            animation: "mobileSurfacePulse 700ms ease-out 1",
          }}
        />
      )}
      <svg viewBox="0 0 16 16" width={11} height={11} aria-hidden>
        <path d="M4 2.5 13 8 4 13.5z" fill={active ? CYAN : `${CREAM}80`} />
      </svg>
      <style jsx>{`
        @keyframes mobileSurfacePulse {
          0% { transform: scale(1); opacity: 0.9; }
          100% { transform: scale(1.9); opacity: 0; }
        }
      `}</style>
    </div>
  );
}

function NowPlaying({ active }: { active: boolean }) {
  const bars = 5;
  return (
    <div className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.24em]" style={{ color: active ? CORAL : `${CREAM}40` }}>
      <span>{active ? "live" : "idle"}</span>
      <svg viewBox="0 0 30 14" width={30} height={14} aria-hidden>
        {Array.from({ length: bars }).map((_, i) => (
          <rect
            key={i}
            x={i * 6}
            y={5}
            width={3}
            height={4}
            fill={active ? CORAL : `${CREAM}30`}
          >
            {active && (
              <animate
                attributeName="height"
                values="3;11;5;9;3"
                dur={`${0.55 + i * 0.07}s`}
                repeatCount="indefinite"
                begin={`${i * 0.05}s`}
              />
            )}
            {active && (
              <animate
                attributeName="y"
                values="6;1;4;2;6"
                dur={`${0.55 + i * 0.07}s`}
                repeatCount="indefinite"
                begin={`${i * 0.05}s`}
              />
            )}
          </rect>
        ))}
      </svg>
    </div>
  );
}
