"use client";

import { useState } from "react";
import type { CSSProperties } from "react";
import { Keyboard as KeychronKeyboard } from "@/components/ui/keyboard";
import { Keyboard as MagicKeyboard } from "@/components/ui/magic-keyboard";
import { SOUND_PACKS } from "@/lib/settings-data";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CREAM, CYAN } from "../lib/colors";
import { SectionHeader } from "./Modes";
import { Reveal } from "./Reveal";

const SWITCH_STEM_COLORS: Record<string, string> = {
  "default": "var(--color-primary)",
  "cherrymx-black-pbt": "#2b2b2b",
  "cherrymx-blue-pbt": "#2f6fe0",
  "cherrymx-brown-pbt": "#8a5a2b",
  "cherrymx-red-pbt": "#d7373f",
  "mx-speed-silver": "#c4ccd4",
  "eg-oreo": "#1a1a2e",
  "topre-purple": "#8b5cf6",
  "creams": "#f0d9c6",
  "banana-split-lubed": "#ffe135",
};

type LandingPopoverStyle = CSSProperties & Record<`--${string}`, string>;

const popoverThemeStyle: LandingPopoverStyle = {
  "--background": "#0a0c10",
  "--foreground": CREAM,
  "--popover": "#0d1016",
  "--popover-foreground": CREAM,
  "--muted": "#151a23",
  "--muted-foreground": `${CREAM}99`,
  "--primary": CYAN,
  "--primary-foreground": CREAM,
  "--border": `${CREAM}24`,
  "--ring": CYAN,
  "--color-background": "#0a0c10",
  "--color-foreground": CREAM,
  "--color-popover": "#0d1016",
  "--color-popover-foreground": CREAM,
  "--color-muted": "#151a23",
  "--color-muted-foreground": `${CREAM}99`,
  "--color-primary": CYAN,
  "--color-primary-foreground": CREAM,
  "--color-border": `${CREAM}24`,
  "--color-ring": CYAN,
  "--font-sans": '"Space Grotesk", ui-sans-serif, system-ui, sans-serif',
  "--font-mono": '"Geist Mono", ui-monospace, SFMono-Regular, monospace',
};

export function KeyboardStrip() {
  const [activeKeyboard, setActiveKeyboard] = useState<"magic" | "keychron">("magic");
  const [soundPack, setSoundPack] = useState("default");

  return (
    <section id="surface" className="relative z-10 mx-auto hidden max-w-site px-6 py-20 md:block">
      <SectionHeader
        kicker="§01 · the surface"
        title="Match your keyboard."
        sub="Switch layouts, type normally, and watch the board respond live."
      />

      <Reveal direction="up" y={16} delay={0.05} className="mb-10 flex flex-col  items-start gap-4 sm:mb-12">
        <div
          className="flex gap-3 items-center  border p-1"
          style={{ background: `${CREAM}10`, borderColor: `${CREAM}18` }}
        >
          <button
            onClick={() => setActiveKeyboard("magic")}
            className={`relative flex h-12 items-center justify-center gap-2 px-3 font-mono text-[10px] uppercase tracking-[0.18em] transition-colors sm:px-6 ${
              activeKeyboard === "magic"
                ? "text-white"
                : "text-white/45 hover:text-white/80"
            }`}
            style={{ background: activeKeyboard === "magic" ? `${CREAM}10` : "#0d1016" }}
          >
            <svg viewBox="0 0 48 48" width={20} height={20} className="shrink-0" aria-hidden>
              <rect x="4" y="16" width="40" height="16" rx="2" className="fill-white/20 stroke-white/40" strokeWidth="1" />
              <rect x="6" y="18" width="36" height="12" rx="1" className="fill-white/40" />
            </svg>
            <span className="hidden sm:inline">Apple Magic</span>
            <span className="sm:hidden">Magic</span>
            {activeKeyboard === "magic" && (
              <span className="absolute inset-x-3 bottom-1 h-px" style={{ background: CYAN }} />
            )}
          </button>
          <button
            onClick={() => setActiveKeyboard("keychron")}
            className={`relative flex h-12 items-center justify-center gap-2 px-3 font-mono text-[10px] uppercase tracking-[0.18em] transition-colors sm:px-6 ${
              activeKeyboard === "keychron"
                ? "text-white"
                : "text-white/45 hover:text-white/80"
            }`}
            style={{ background: activeKeyboard === "keychron" ? `${CREAM}10` : "#0d1016" }}
          >
            <svg viewBox="0 0 48 48" width={20} height={20} className="shrink-0" aria-hidden>
              <rect x="6" y="6" width="36" height="36" rx="4" className="fill-white/30" />
              <rect x="10" y="8" width="28" height="24" rx="3" className="fill-white/50" />
            </svg>
            <span className="hidden sm:inline">Keychron K2</span>
            <span className="sm:hidden">Keychron</span>
            {activeKeyboard === "keychron" && (
              <span className="absolute inset-x-3 bottom-1 h-px" style={{ background: CYAN }} />
            )}
          </button>
        </div>
      </Reveal>

      <Reveal direction="up" y={28} delay={0.1} duration={0.85} className="space-y-10">
        {activeKeyboard === "magic" ? (
          <KeyboardShowcase soundPack={soundPack} onSoundPackChange={setSoundPack}>
            <MagicKeyboard
              enableSound={true}
              enableHaptics={false}
              physicalKeysEnabled
              soundUrl={SOUND_PACKS.find(s => s.id === soundPack)?.url ?? "/sounds/sound.ogg"}
              soundConfigUrl={SOUND_PACKS.find(s => s.id === soundPack)?.configUrl}
              className="[zoom:0.68] sm:[zoom:0.98] md:[zoom:1.2] lg:[zoom:1.5] xl:[zoom:1.72]"
            />
          </KeyboardShowcase>
        ) : (
          <KeyboardShowcase soundPack={soundPack} onSoundPackChange={setSoundPack}>
            <KeychronKeyboard
              theme="classic"
              enableSound={true}
              soundUrl={SOUND_PACKS.find(s => s.id === soundPack)?.url ?? "/sounds/sound.ogg"}
              soundConfigUrl={SOUND_PACKS.find(s => s.id === soundPack)?.configUrl}
              enableHaptics={false}
              physicalKeysEnabled
              className="[zoom:0.38] sm:[zoom:0.55] md:[zoom:0.7] lg:[zoom:0.82] xl:[zoom:0.95]"
            />
          </KeyboardShowcase>
        )}
      </Reveal>
    </section>
  );
}

function KeyboardShowcase({
  children,
  soundPack,
  onSoundPackChange,
}: {
  children: React.ReactNode;
  soundPack: string;
  onSoundPackChange: (pack: string) => void;
}) {
  const [popoverOpen, setPopoverOpen] = useState(false);
  const selectedPack = SOUND_PACKS.find(s => s.id === soundPack);
  const selectedStemColor = SWITCH_STEM_COLORS[selectedPack?.id ?? "default"] ?? "currentColor";
  const selectedIsDarkStem = (selectedPack?.id ?? "default") === "cherrymx-black-pbt" || (selectedPack?.id ?? "default") === "eg-oreo";

  return (
    <div
      className="overflow-hidden border"
      style={{
        background: "#0d1016",
        borderColor: `${CREAM}14`,
      }}
    >
      <div
        className="flex flex-wrap items-center justify-between gap-3 border-b px-5 py-4 sm:px-6"
        style={{ borderColor: `${CREAM}10` }}
      >
        <div>
          <div
            className="font-mono text-[10px] uppercase tracking-[0.28em]"
            style={{ color: CYAN }}
          >
            ▮ try it · live
          </div>
        </div>
        <div className="flex items-center gap-4">
          <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
            <PopoverTrigger asChild>
              <button
                className="flex h-10 items-center gap-2 border border-white/10 bg-white/5 px-3 font-mono text-[10px] uppercase tracking-widest text-white/60 transition-colors hover:border-white/20 hover:text-white/80"
              >
                <svg viewBox="0 0 48 48" width={16} height={16} aria-hidden>
                  <rect x="4" y="10" width="40" height="34" rx="4" className="fill-white/20" />
                  <rect x="6" y="7" width="36" height="33" rx="3.5" className="fill-white/10 stroke-white/30" strokeWidth="0.75" />
                  <rect x="11" y="11" width="26" height="25" rx="2" className="fill-white/5" />
                  <g transform="translate(24 23)">
                    <rect
                      x="-10"
                      y="-3.25"
                      width="20"
                      height="6.5"
                      rx="1.25"
                      fill={selectedStemColor}
                      stroke={selectedIsDarkStem ? "rgba(255,255,255,0.25)" : "rgba(0,0,0,0.25)"}
                      strokeWidth="0.5"
                    />
                    <rect
                      x="-3.25"
                      y="-10"
                      width="6.5"
                      height="20"
                      rx="1.25"
                      fill={selectedStemColor}
                      stroke={selectedIsDarkStem ? "rgba(255,255,255,0.25)" : "rgba(0,0,0,0.25)"}
                      strokeWidth="0.5"
                    />
                  </g>
                </svg>
                <span>{selectedPack?.label ?? "Classic"}</span>
                <svg viewBox="0 0 24 24" width={12} height={12} className="text-white/40" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </button>
            </PopoverTrigger>
            <PopoverContent
              className="w-64 bg-[#0d1016] p-0 text-white ring-white/10"
              align="end"
              style={popoverThemeStyle}
            >
              <div className="max-h-64 overflow-y-auto custom-scrollbar">
                {SOUND_PACKS.map((pack) => (
                  <button
                    key={pack.id}
                    onClick={() => { onSoundPackChange(pack.id); setPopoverOpen(false); }}
                    className="flex w-full items-center gap-3 px-3 py-2 text-left text-sm transition-colors hover:bg-white/5"
                  >
                    <svg viewBox="0 0 48 48" width={24} height={24} aria-hidden>
                      <rect x="4" y="10" width="40" height="34" rx="4" className="fill-muted-foreground/20" />
                      <rect x="6" y="7" width="36" height="33" rx="3.5" className="fill-muted-foreground/10 stroke-muted-foreground/20" strokeWidth="0.75" />
                      <rect x="11" y="11" width="26" height="25" rx="2" className="fill-background/70" />
                      <g transform="translate(24 23)">
                        <rect x="-10" y="-3.25" width="20" height="6.5" rx="1.25" fill={SWITCH_STEM_COLORS[pack.id] || "currentColor"} />
                        <rect x="-3.25" y="-10" width="6.5" height="20" rx="1.25" fill={SWITCH_STEM_COLORS[pack.id] || "currentColor"} />
                      </g>
                    </svg>
                    <span className={soundPack === pack.id ? "text-white" : "text-white/60"}>
                      {pack.label}
                    </span>
                  </button>
                ))}
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <div className="flex w-full items-center justify-center overflow-x-auto px-3 py-8 sm:min-h-[200px] sm:px-6 sm:py-10 md:min-h-[260px] lg:min-h-[320px] xl:min-h-[380px]">
        {children}
      </div>
    </div>
  );
}
