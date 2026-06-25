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
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export interface MinimalKeyboardProps {
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

export function MinimalKeyboard({
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
}: MinimalKeyboardProps) {
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
        <MinimalKeyboardKeys />
      </div>
    </KeyboardProvider>
  );
}

export default MinimalKeyboard;

// ---------------------------------------------------------------------------
// Layout rendering — ultra-clean flat design
// ---------------------------------------------------------------------------

function MinimalKeyboardKeys() {
  const { layout } = useKeyboardContext();

  function lbl(keyCode: string): [string, string?] | undefined {
    return layout[keyCode] ?? QWERTY_LAYOUT[keyCode];
  }

  return (
    <div>
      {/* Borderless surface */}
      <div
        className="w-fit rounded-[12px] p-[6px] h-fit"
        style={{
          background: "color-mix(in oklch, var(--foreground) 4%, var(--background))",
          border: "1px solid color-mix(in oklch, var(--foreground) 8%, transparent)",
        }}
      >
        <div className="rounded-[8px] h-[274px] overflow-hidden">
          <div className="space-y-[1px]">
            {/* Function Row */}
            <Row>
              <K kc={KEYCODE.Escape}>esc</K>
              <K kc={KEYCODE.F1}><IconBrightnessDown className="size-[10px]" /><span>F1</span></K>
              <K kc={KEYCODE.F2}><IconBrightnessUp className="size-[10px]" /><span>F2</span></K>
              <K kc={KEYCODE.F3}><IconLayoutDashboard className="size-[10px]" /><span>F3</span></K>
              <K kc={KEYCODE.F4}><IconSearch className="size-[10px]" /><span>F4</span></K>
              <K kc={KEYCODE.F5}><IconMicrophone className="size-[10px]" /><span>F5</span></K>
              <K kc={KEYCODE.F6}><IconMoon className="size-[10px]" /><span>F6</span></K>
              <K kc={KEYCODE.F7}><IconPlayerTrackPrev className="size-[10px]" /><span>F7</span></K>
              <K kc={KEYCODE.F8}><IconPlayerSkipForward className="size-[10px]" /><span>F8</span></K>
              <K kc={KEYCODE.F9}><IconPlayerTrackNext className="size-[10px]" /><span>F9</span></K>
              <K kc={KEYCODE.F10}><IconVolume3 className="size-[10px]" /><span>F10</span></K>
              <K kc={KEYCODE.F11}><IconVolume2 className="size-[10px]" /><span>F11</span></K>
              <K kc={KEYCODE.F12}><IconVolume className="size-[10px]" /><span>F12</span></K>
              <K kc={KEYCODE.F13}><IconFrame className="size-[10px]" /></K>
              <K kc={KEYCODE.Delete}>del</K>
              <K kc={KEYCODE.F14}><IconBulb className="size-[12px]" /></K>
            </Row>

            {/* Number Row */}
            <Row>
              <DK kc={KEYCODE.Backquote} l={lbl("Backquote")} />
              {[1,2,3,4,5,6,7,8,9,0].map(n => <DK key={n} kc={`Digit${n}` as KEYCODE} l={lbl(`Digit${n}`)} />)}
              <DK kc={KEYCODE.Minus} l={lbl("Minus")} />
              <DK kc={KEYCODE.Equal} l={lbl("Equal")} />
              <K kc={KEYCODE.Backspace} w={100}><IconArrowNarrowLeft className="size-[12px]" /></K>
              <K kc={KEYCODE.PageUp}>pgup</K>
            </Row>

            {/* QWERTY Row */}
            <Row>
              <K kc={KEYCODE.Tab} w={75}>tab</K>
              {["Q","W","E","R","T","Y","U","I","O","P"].map(c => <DK key={c} kc={`Key${c}` as KEYCODE} l={lbl(`Key${c}`)} />)}
              <DK kc={KEYCODE.BracketLeft} l={lbl("BracketLeft")} />
              <DK kc={KEYCODE.BracketRight} l={lbl("BracketRight")} />
              <DK kc={KEYCODE.Backslash} l={lbl("Backslash")} w={75} />
              <K kc={KEYCODE.PageDown}>pgdn</K>
            </Row>

            {/* Home Row */}
            <Row>
              <K kc={KEYCODE.CapsLock} w={100}>caps lock</K>
              {["A","S","D","F","G","H","J","K","L"].map(c => <DK key={c} kc={`Key${c}` as KEYCODE} l={lbl(`Key${c}`)} />)}
              <DK kc={KEYCODE.Semicolon} l={lbl("Semicolon")} />
              <DK kc={KEYCODE.Quote} l={lbl("Quote")} />
              <K kc={KEYCODE.Enter} w={100}>return</K>
              <K kc={KEYCODE.Home}>home</K>
            </Row>

            {/* Bottom Letter Row */}
            <Row>
              <K kc={KEYCODE.ShiftLeft} w={123}>shift</K>
              {["Z","X","C","V","B","N","M"].map(c => <DK key={c} kc={`Key${c}` as KEYCODE} l={lbl(`Key${c}`)} />)}
              <DK kc={KEYCODE.Comma} l={lbl("Comma")} />
              <DK kc={KEYCODE.Period} l={lbl("Period")} />
              <DK kc={KEYCODE.Slash} l={lbl("Slash")} />
              <K kc={KEYCODE.ShiftRight} w={77}>shift</K>
              <K kc={KEYCODE.ArrowUp}><IconChevronUp className="size-[12px]" /></K>
              <K kc={KEYCODE.End}>end</K>
            </Row>

            {/* Modifier Row */}
            <Row>
              <K kc={KEYCODE.ControlLeft} w={62}>ctrl</K>
              <K kc={KEYCODE.AltLeft} w={62}>option</K>
              <K kc={KEYCODE.MetaLeft} w={62}><IconCommand className="size-[12px]" /></K>
              <K kc={KEYCODE.Space} w={314} />
              <K kc={KEYCODE.MetaRight}><IconCommand className="size-[12px]" /></K>
              <K kc={KEYCODE.Fn}>fn</K>
              <K kc={KEYCODE.ControlRight}>ctrl</K>
              <K kc={KEYCODE.ArrowLeft}><IconChevronLeft className="size-[12px]" /></K>
              <K kc={KEYCODE.ArrowDown}><IconChevronDown className="size-[12px]" /></K>
              <K kc={KEYCODE.ArrowRight}><IconChevronRight className="size-[12px]" /></K>
            </Row>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Minimal Key — completely flat with smooth color inversion on press
// ---------------------------------------------------------------------------

const KEYCAP_FONT = '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", Arial, sans-serif';

interface MinimalKeyProps {
  w?: number;
  children?: ReactNode;
  className?: string;
  kc?: KEYCODE | string;
}

function K({ w = 50, children, className, kc }: MinimalKeyProps) {
  const { pressedKeys, pressKey, releaseKey, triggerPointerHaptic } = useKeyboardContext();
  const isPressed = kc ? pressedKeys.has(kc) : false;
  const ptrRef = useRef(false);
  const [ptrDown, setPtrDown] = useState(false);
  const active = isPressed || ptrDown;
  const innerW = w - 2;

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

  return (
    <button
      type="button"
      onClick={triggerPointerHaptic}
      aria-label={kc}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerRelease}
      onPointerCancel={handlePointerRelease}
      data-no-click-sound
      style={{ height: 46, width: w }}
      className="flex items-center justify-center cursor-pointer touch-none appearance-none border-0 bg-transparent p-0 focus:outline-none"
    >
      <div
        className="rounded-[6px] flex items-center justify-center transition-all duration-[120ms] ease-out"
        style={{
          width: `${innerW}px`,
          height: "44px",
          background: active
            ? "var(--foreground)"
            : "color-mix(in oklch, var(--foreground) 6%, var(--background))",
          border: active
            ? "1px solid var(--foreground)"
            : "1px solid color-mix(in oklch, var(--foreground) 12%, transparent)",
        }}
      >
        <div
          className={cn(
            "flex flex-col items-center justify-between gap-0.5 p-1 text-[4.5px] leading-none whitespace-nowrap select-none sm:text-[9px]",
            className,
          )}
          style={{
            color: active
              ? "var(--background)"
              : "color-mix(in oklch, var(--foreground) 55%, transparent)",
            fontFamily: KEYCAP_FONT,
            fontWeight: 300,
            transition: "color 120ms ease-out",
            WebkitTextSizeAdjust: "100%",
            textSizeAdjust: "100%",
          }}
        >
          {children}
        </div>
      </div>
    </button>
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function DK({ kc, l, w }: { kc: KEYCODE | string; l?: [string, string?]; w?: number }) {
  if (!l) return <K kc={kc} w={w} />;
  const [normal, shift] = l;
  if (shift) return <K kc={kc} w={w}><span>{shift}</span><span>{normal}</span></K>;
  return <K kc={kc} w={w}>{normal}</K>;
}

function Row({ children }: { children: ReactNode }) {
  return <div className="flex gap-[1px]">{children}</div>;
}
