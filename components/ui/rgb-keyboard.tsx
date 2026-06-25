'use client';

import { cn } from "@/lib/utils";
import { getKeyboardLayout, QWERTY_LAYOUT } from "@/lib/keyboard-layouts";
import {
  KeyboardProvider,
  useKeyboardContext,
  KEYCODE,
  type KeyboardInteractionEvent,
  type KeyboardEventSource,
} from "./keyboard";
import {
  IconArrowNarrowLeft,
  IconBrightnessDown,
  IconBrightnessUp,
  IconBulb,
  IconChevronDown,
  IconChevronLeft,
  IconChevronRight,
  IconChevronUp,
  IconCommand,
  IconFrame,
  IconLayoutDashboard,
  IconMicrophone,
  IconMoon,
  IconPlayerSkipForward,
  IconPlayerTrackNext,
  IconPlayerTrackPrev,
  IconSearch,
  IconVolume,
  IconVolume2,
  IconVolume3,
} from "@tabler/icons-react";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export interface RGBKeyboardProps {
  className?: string;
  enableHaptics?: boolean;
  enableSound?: boolean;
  soundUrl?: string;
  soundConfigUrl?: string;
  onKeyEvent?: (event: KeyboardInteractionEvent) => void;
  forceActive?: boolean;
  physicalKeysEnabled?: boolean;
  language?: string;
  onAudioLoadingChange?: (isLoading: boolean) => void;
}

export function RGBKeyboard({
  className,
  enableHaptics = true,
  enableSound = true,
  soundUrl = "/sounds/sound.ogg",
  soundConfigUrl,
  onKeyEvent,
  forceActive = false,
  physicalKeysEnabled = true,
  language = "english",
  onAudioLoadingChange,
}: RGBKeyboardProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const layout = useMemo(() => getKeyboardLayout(language), [language]);

  return (
    <KeyboardProvider
      containerRef={containerRef}
      theme="classic"
      enableSound={enableSound}
      enableHaptics={enableHaptics}
      soundUrl={soundUrl}
      soundConfigUrl={soundConfigUrl}
      onKeyEvent={onKeyEvent}
      forceActive={forceActive}
      physicalKeysEnabled={physicalKeysEnabled}
      layout={layout}
      onAudioLoadingChange={onAudioLoadingChange}
    >
      <div
        ref={containerRef}
        className={cn(
          "inline-block [-webkit-text-size-adjust:100%] [text-size-adjust:100%] [zoom:0.55] sm:[zoom:0.7] md:[zoom:0.65] lg:[zoom:0.85] xl:[zoom:1.15]",
          className,
        )}
      >
        <RGBKeyboardKeys />
      </div>
    </KeyboardProvider>
  );
}

export default RGBKeyboard;

// ---------------------------------------------------------------------------
// Layout rendering with RGB wave animation
// ---------------------------------------------------------------------------

function RGBKeyboardKeys() {
  const { layout } = useKeyboardContext();
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Animate --rgb-hue CSS variable for the rainbow wave, used only on active keys
  useEffect(() => {
    let h = 0;
    let frame: number;
    const tick = () => {
      h = (h + 0.4) % 360;
      wrapperRef.current?.style.setProperty("--rgb-hue", String(h));
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, []);

  // Glow offset counter — each key gets a sequential offset for the wave
  let _gi = 0;
  const g = () => (_gi++) * 6;

  function lbl(keyCode: string): [string, string?] | undefined {
    return layout[keyCode] ?? QWERTY_LAYOUT[keyCode];
  }

  return (
    <div ref={wrapperRef} style={{ "--rgb-hue": "0" } as React.CSSProperties}>
      {/* Heavy aluminum chassis */}
      <div
        className="w-fit rounded-[16px] p-4 h-fit"
        style={{
          background: "linear-gradient(160deg, #16161a, #1a1a20, #141418)",
          border: "3px solid #08080a",
          boxShadow: "0 10px 30px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,255,255,0.08), inset 0 -1px 0 rgba(0,0,0,0.4)",
        }}
      >
        {/* Exposed plate/PCB between keys */}
        <div
          className="rounded-[8px] h-[290px] overflow-hidden"
          style={{
            background: "#08080a",
            border: "1px solid rgba(255,255,255,0.02)",
            padding: "4px",
            boxShadow: "inset 0 4px 20px rgba(0,0,0,0.5)",
          }}
        >
          <div className="space-y-[5px]">
            {/* Function Row */}
            <Row>
              <K kc={KEYCODE.Escape} g={g()}>esc</K>
              <K kc={KEYCODE.F1} g={g()}><IconBrightnessDown className="size-[10px]" /><span>F1</span></K>
              <K kc={KEYCODE.F2} g={g()}><IconBrightnessUp className="size-[10px]" /><span>F2</span></K>
              <K kc={KEYCODE.F3} g={g()}><IconLayoutDashboard className="size-[10px]" /><span>F3</span></K>
              <K kc={KEYCODE.F4} g={g()}><IconSearch className="size-[10px]" /><span>F4</span></K>
              <K kc={KEYCODE.F5} g={g()}><IconMicrophone className="size-[10px]" /><span>F5</span></K>
              <K kc={KEYCODE.F6} g={g()}><IconMoon className="size-[10px]" /><span>F6</span></K>
              <K kc={KEYCODE.F7} g={g()}><IconPlayerTrackPrev className="size-[10px]" /><span>F7</span></K>
              <K kc={KEYCODE.F8} g={g()}><IconPlayerSkipForward className="size-[10px]" /><span>F8</span></K>
              <K kc={KEYCODE.F9} g={g()}><IconPlayerTrackNext className="size-[10px]" /><span>F9</span></K>
              <K kc={KEYCODE.F10} g={g()}><IconVolume3 className="size-[10px]" /><span>F10</span></K>
              <K kc={KEYCODE.F11} g={g()}><IconVolume2 className="size-[10px]" /><span>F11</span></K>
              <K kc={KEYCODE.F12} g={g()}><IconVolume className="size-[10px]" /><span>F12</span></K>
              <K kc={KEYCODE.F13} g={g()}><IconFrame className="size-[10px]" /></K>
              <K kc={KEYCODE.Delete} g={g()}>del</K>
              <K kc={KEYCODE.F14} g={g()}><IconBulb className="size-[12px]" /></K>
            </Row>

            {/* Number Row */}
            <Row>
              <DK kc={KEYCODE.Backquote} l={lbl("Backquote")} g={g()} />
              {[1,2,3,4,5,6,7,8,9,0].map(n => <DK key={n} kc={`Digit${n}` as KEYCODE} l={lbl(`Digit${n}`)} g={g()} />)}
              <DK kc={KEYCODE.Minus} l={lbl("Minus")} g={g()} />
              <DK kc={KEYCODE.Equal} l={lbl("Equal")} g={g()} />
              <K kc={KEYCODE.Backspace} w={100} g={g()}><IconArrowNarrowLeft className="size-[12px]" /></K>
              <K kc={KEYCODE.PageUp} g={g()}>pgup</K>
            </Row>

            {/* QWERTY Row */}
            <Row>
              <K kc={KEYCODE.Tab} w={75} g={g()}>tab</K>
              {["Q","W","E","R","T","Y","U","I","O","P"].map(c => <DK key={c} kc={`Key${c}` as KEYCODE} l={lbl(`Key${c}`)} g={g()} />)}
              <DK kc={KEYCODE.BracketLeft} l={lbl("BracketLeft")} g={g()} />
              <DK kc={KEYCODE.BracketRight} l={lbl("BracketRight")} g={g()} />
              <DK kc={KEYCODE.Backslash} l={lbl("Backslash")} w={75} g={g()} />
              <K kc={KEYCODE.PageDown} g={g()}>pgdn</K>
            </Row>

            {/* Home Row */}
            <Row>
              <K kc={KEYCODE.CapsLock} w={100} g={g()}>caps lock</K>
              {["A","S","D","F","G","H","J","K","L"].map(c => <DK key={c} kc={`Key${c}` as KEYCODE} l={lbl(`Key${c}`)} g={g()} />)}
              <DK kc={KEYCODE.Semicolon} l={lbl("Semicolon")} g={g()} />
              <DK kc={KEYCODE.Quote} l={lbl("Quote")} g={g()} />
              <K kc={KEYCODE.Enter} w={100} g={g()}>return</K>
              <K kc={KEYCODE.Home} g={g()}>home</K>
            </Row>

            {/* Bottom Letter Row */}
            <Row>
              <K kc={KEYCODE.ShiftLeft} w={123} g={g()}>shift</K>
              {["Z","X","C","V","B","N","M"].map(c => <DK key={c} kc={`Key${c}` as KEYCODE} l={lbl(`Key${c}`)} g={g()} />)}
              <DK kc={KEYCODE.Comma} l={lbl("Comma")} g={g()} />
              <DK kc={KEYCODE.Period} l={lbl("Period")} g={g()} />
              <DK kc={KEYCODE.Slash} l={lbl("Slash")} g={g()} />
              <K kc={KEYCODE.ShiftRight} w={77} g={g()}>shift</K>
              <K kc={KEYCODE.ArrowUp} g={g()}><IconChevronUp className="size-[12px]" /></K>
              <K kc={KEYCODE.End} g={g()}>end</K>
            </Row>

            {/* Modifier Row */}
            <Row>
              <K kc={KEYCODE.ControlLeft} w={62} g={g()}>ctrl</K>
              <K kc={KEYCODE.AltLeft} w={62} g={g()}>option</K>
              <K kc={KEYCODE.MetaLeft} w={62} g={g()}><IconCommand className="size-[12px]" /></K>
              <K kc={KEYCODE.Space} w={314} g={g()} />
              <K kc={KEYCODE.MetaRight} g={g()}><IconCommand className="size-[12px]" /></K>
              <K kc={KEYCODE.Fn} g={g()}>fn</K>
              <K kc={KEYCODE.ControlRight} g={g()}>ctrl</K>
              <K kc={KEYCODE.ArrowLeft} g={g()}><IconChevronLeft className="size-[12px]" /></K>
              <K kc={KEYCODE.ArrowDown} g={g()}><IconChevronDown className="size-[12px]" /></K>
              <K kc={KEYCODE.ArrowRight} g={g()}><IconChevronRight className="size-[12px]" /></K>
            </Row>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// RGB Key component — Enhanced 3D keycap with deep sculpted depth and RGB glow
// ---------------------------------------------------------------------------

const KEYCAP_FONT = '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", Arial, sans-serif';

interface RGBKeyProps {
  w?: number;
  children?: ReactNode;
  className?: string;
  kc?: KEYCODE | string;
  g?: number; // glow hue offset in degrees
}

function K({ w = 50, children, className, kc, g: glowOffset = 0 }: RGBKeyProps) {
  const { pressedKeys, pressKey, releaseKey, triggerPointerHaptic } = useKeyboardContext();
  const isPressed = kc ? pressedKeys.has(kc) : false;
  const ptrRef = useRef(false);
  const [ptrDown, setPtrDown] = useState(false);
  const active = isPressed || ptrDown;

  const handlePointerDown = (e: ReactPointerEvent<HTMLButtonElement>) => {
    if (!kc || e.button !== 0) return;
    e.preventDefault();
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch { /* ignore */ }
    if (pressKey(kc, "pointer")) {
      ptrRef.current = true;
      setPtrDown(true);
    }
  };

  const handlePointerRelease = () => {
    setPtrDown(false);
    if (!kc || !ptrRef.current) return;
    ptrRef.current = false;
    releaseKey(kc, "pointer");
  };

  // CSS calc references the animated --rgb-hue variable on the container
  const hue = `calc(var(--rgb-hue, 0) + ${glowOffset})`;
  const glowMain = `hsl(${hue}, 100%, 65%)`;
  const glowDim = `hsl(${hue}, 100%, 30%)`;
  const glowUnder = `hsl(${hue}, 100%, 45%)`;
  const innerW = w - 10;

  return (
    <button
      type="button"
      onClick={triggerPointerHaptic}
      aria-label={kc}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerRelease}
      onPointerCancel={handlePointerRelease}
      data-no-click-sound
      style={{ height: 50, width: w }}
      className="flex items-end cursor-pointer touch-none appearance-none border-0 bg-transparent p-0 text-left focus:outline-none"
    >
      {/* Outer keycap shell — the visible "walls" of the 3D key */}
      <div
        className={cn(
          "relative h-[50px] rounded-[5px] flex items-start justify-center transition-all duration-75",
          active && "h-[46px]",
        )}
        style={{
          width: `${w}px`,
          // Multi-layer gradient for realistic side walls
          background: active
            ? "linear-gradient(180deg, #1c1c22 0%, #18181e 40%, #121216 100%)"
            : "linear-gradient(180deg, #30303a 0%, #26262e 30%, #1c1c22 70%, #16161a 100%)",
          // Complex border for edge definition
          borderTop: `1px solid ${active ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.15)"}`,
          borderLeft: `1px solid ${active ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.08)"}`,
          borderRight: `1px solid ${active ? "rgba(0,0,0,0.3)" : "rgba(0,0,0,0.4)"}`,
          borderBottom: `1px solid ${active ? "rgba(0,0,0,0.4)" : "rgba(0,0,0,0.6)"}`,
          boxShadow: active
            ? [
                `inset 0 0 12px 1px ${glowDim}`,       // Inner RGB glow on press
                `0 0 18px 3px ${glowUnder}`,            // Outer RGB burst
                "0 1px 2px rgba(0,0,0,0.6)",            // Tight shadow
              ].join(", ")
            : [
                `0 8px 12px -4px ${glowDim}`,           // RGB underglow
                "0 4px 0 0 #0e0e12",                    // Visible front face / bottom edge
                "0 5px 3px 0 rgba(0,0,0,0.5)",          // Drop shadow under front face
                "inset 0 1px 0 rgba(255,255,255,0.06)",  // Top edge shine
              ].join(", "),
        }}
      >
        {/* Top highlight line — simulates light catching the top edge */}
        <div
          className="absolute top-0 left-[3px] right-[3px] h-px rounded-full pointer-events-none z-20"
          style={{
            background: active
              ? `linear-gradient(90deg, transparent, ${glowUnder}, transparent)`
              : "linear-gradient(90deg, transparent 10%, rgba(255,255,255,0.12) 30%, rgba(255,255,255,0.18) 50%, rgba(255,255,255,0.12) 70%, transparent 90%)",
          }}
        />

        {/* Left edge highlight line */}
        <div
          className="absolute top-[2px] left-0 bottom-[6px] w-px rounded-full pointer-events-none z-20"
          style={{
            background: active
              ? "rgba(255,255,255,0.04)"
              : "linear-gradient(180deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.03) 100%)",
          }}
        />

        {/* Right edge shadow line */}
        <div
          className="absolute top-[2px] right-0 bottom-[6px] w-px rounded-full pointer-events-none z-20"
          style={{
            background: "linear-gradient(180deg, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.3) 100%)",
          }}
        />

        {/* Front face / bottom edge strip — the visible front wall of the keycap */}
        {!active && (
          <div
            className="absolute bottom-0 left-[1px] right-[1px] h-[5px] rounded-b-[4px] pointer-events-none z-10"
            style={{
              background: "linear-gradient(180deg, #1e1e24 0%, #141418 100%)",
              borderTop: "1px solid rgba(255,255,255,0.03)",
            }}
          />
        )}

        {/* Intense glow overlay on press */}
        <div
          className="absolute inset-0 rounded-[5px] opacity-0 transition-opacity duration-75 pointer-events-none z-10"
          style={{
            opacity: active ? 1 : 0,
            background: `radial-gradient(ellipse at center 30%, ${glowDim} 0%, transparent 65%)`,
            mixBlendMode: "screen",
          }}
        />

        {/* Inner top surface — the "dish" you see on the top of the keycap */}
        <div
          className={cn(
            "relative z-10 h-[35px] rounded-[5px] transition-all duration-75",
            "flex flex-col items-center justify-between gap-0.5 p-1 text-[4.5px] leading-none font-bold whitespace-nowrap select-none sm:text-[9px]",
            className,
          )}
          style={{
            width: `${innerW}px`,
            marginTop: "2px",
            // Slightly concave top surface
            background: active
              ? "linear-gradient(180deg, #1a1a22 0%, #222230 100%)"
              : "linear-gradient(180deg, #2c2c36 0%, #24242e 50%, #282834 100%)",
            // Inner border for depth separation between top and sides
            borderTop: `1px solid ${active ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.1)"}`,
            borderLeft: "1px solid rgba(255,255,255,0.04)",
            borderRight: "1px solid rgba(0,0,0,0.15)",
            borderBottom: "1px solid rgba(0,0,0,0.2)",
            boxShadow: active
              ? `inset 0 2px 6px rgba(0,0,0,0.4), inset 0 0 8px 1px ${glowDim}`
              : "inset 0 1px 3px rgba(0,0,0,0.15), inset 0 -1px 0 rgba(255,255,255,0.03)",
            color: glowMain,
            fontFamily: KEYCAP_FONT,
            textShadow: active
              ? `0 0 8px ${glowMain}, 0 0 16px ${glowMain}`
              : `0 0 5px ${glowDim}`,
            WebkitTextSizeAdjust: "100%",
            textSizeAdjust: "100%",
          }}
        >
          {children}
        </div>

        {/* Diagonal bevel lines — connecting top surface to bottom corners */}
        <div className={cn("absolute z-0 bottom-0 right-0 h-[2px] w-8 rotate-70 translate-x-3.5 transition-all duration-75", active && "rotate-60")} style={{ background: active ? `linear-gradient(90deg, transparent, ${glowDim})` : "linear-gradient(90deg, transparent, rgba(255,255,255,0.06))" }} />
        <div className={cn("absolute z-0 bottom-0 left-0 h-[2px] w-8 -rotate-70 -translate-x-3.5 transition-all duration-75", active && "-rotate-60")} style={{ background: active ? `linear-gradient(270deg, transparent, ${glowDim})` : "linear-gradient(270deg, transparent, rgba(255,255,255,0.06))" }} />
      </div>
    </button>
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function DK({ kc, l, w, g: glowOffset }: { kc: KEYCODE | string; l?: [string, string?]; w?: number; g?: number }) {
  if (!l) return <K kc={kc} w={w} g={glowOffset} />;
  const [normal, shift] = l;
  if (shift) return <K kc={kc} w={w} g={glowOffset}><span>{shift}</span><span>{normal}</span></K>;
  return <K kc={kc} w={w} g={glowOffset}>{normal}</K>;
}

function Row({ children }: { children: ReactNode }) {
  return <div className="flex gap-[3px]">{children}</div>;
}
