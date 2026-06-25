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

export interface MechanicalKeyboardProps {
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

export function MechanicalKeyboard({
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
}: MechanicalKeyboardProps) {
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
        <MechKeyboardKeys />
      </div>
    </KeyboardProvider>
  );
}

export default MechanicalKeyboard;

// ---------------------------------------------------------------------------
// Layout rendering — heavy 3D mechanical aesthetic
// ---------------------------------------------------------------------------

function MechKeyboardKeys() {
  const { layout } = useKeyboardContext();

  function lbl(keyCode: string): [string, string?] | undefined {
    return layout[keyCode] ?? QWERTY_LAYOUT[keyCode];
  }

  return (
    <div>
      {/* Heavy aluminum chassis */}
      <div
        className="w-fit rounded-[16px] p-4 h-fit"
        style={{
          background: "linear-gradient(160deg, #1e1e22, #28282e, #1c1c20)",
          border: "3px solid #0c0c0e",
          boxShadow: "0 10px 30px rgba(0,0,0,0.65), inset 0 1px 0 rgba(255,255,255,0.06), inset 0 -1px 0 rgba(0,0,0,0.3)",
        }}
      >
        {/* Exposed plate/PCB between keys */}
        <div
          className="rounded-[8px] h-[290px] overflow-hidden"
          style={{
            background: "#0f0f12",
            border: "1px solid rgba(255,255,255,0.03)",
            padding: "4px",
          }}
        >
          <div className="space-y-[5px]">
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
// Mechanical Key — thick 3D keycap with deep travel and spring-bounce release
// ---------------------------------------------------------------------------

const KEYCAP_FONT = '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", Arial, sans-serif';

interface MechKeyProps {
  w?: number;
  children?: ReactNode;
  className?: string;
  kc?: KEYCODE | string;
}

function K({ w = 50, children, className, kc }: MechKeyProps) {
  const { pressedKeys, pressKey, releaseKey, triggerPointerHaptic } = useKeyboardContext();
  const isPressed = kc ? pressedKeys.has(kc) : false;
  const ptrRef = useRef(false);
  const [ptrDown, setPtrDown] = useState(false);
  const active = isPressed || ptrDown;
  const innerW = w - 8;

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
      style={{ height: 50, width: w }}
      className="flex items-end justify-center cursor-pointer touch-none appearance-none border-0 bg-transparent p-0 focus:outline-none"
    >
      <div
        className="relative rounded-[5px] flex items-center justify-center"
        style={{
          width: `${innerW}px`,
          height: active ? "38px" : "44px",
          background: active
            ? "linear-gradient(180deg, #3d3d42, #333338)"
            : "linear-gradient(180deg, #4e4e54, #3e3e44)",
          boxShadow: active
            ? "0 1px 0 0 #222226, 0 1px 2px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.07)"
            : [
                "0 5px 0 0 #2a2a2e",
                "0 6px 4px rgba(0,0,0,0.45)",
                "-1px 4px 0 0 #333338",
                "1px 4px 0 0 #333338",
                "inset 0 1px 0 rgba(255,255,255,0.1)",
              ].join(", "),
          transform: active ? "translateY(4px)" : "translateY(0)",
          // Spring-bounce on release, snappy on press
          transitionProperty: "transform, height, box-shadow",
          transitionDuration: active ? "50ms" : "140ms",
          transitionTimingFunction: active
            ? "cubic-bezier(0.2, 0, 0.8, 1)"
            : "cubic-bezier(0.34, 1.56, 0.64, 1)",
        }}
      >
        {/* Subtle PBT matte texture overlay */}
        <div
          className="absolute inset-0 rounded-[5px] opacity-[0.03] pointer-events-none"
          style={{
            backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
            backgroundSize: "100px 100px",
          }}
        />

        <div
          className={cn(
            "relative z-10 flex flex-col items-center justify-between gap-0.5 p-1 text-[4.5px] leading-none font-medium whitespace-nowrap select-none sm:text-[9px]",
            className,
          )}
          style={{
            color: "rgba(255, 255, 255, 0.85)",
            fontFamily: KEYCAP_FONT,
            textShadow: "0 1px 2px rgba(0,0,0,0.6)",
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
  return <div className="flex gap-[3px]">{children}</div>;
}
