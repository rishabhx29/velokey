"use client"

import { createContext, useContext, useState, type ReactNode } from "react"
import { useMountEffect } from "@/hooks/use-mount-effect"
import {
  FONT_OPTIONS,
  type FontSize,
  type SoundPack,
  type TypingFont,
} from "@/lib/settings-data"
import { KEYBOARD_THEMES, type KeyboardThemeName } from "@/lib/keyboard-themes"

export type { FontSize, SoundPack, TypingFont } from "@/lib/settings-data"
export type { KeyboardThemeName } from "@/lib/keyboard-themes"

export { FONT_OPTIONS, FONT_SIZES, SOUND_PACKS } from "@/lib/settings-data"
export { KEYBOARD_THEMES } from "@/lib/keyboard-themes"

export type KeyboardStyle =
  | "normal"
  | "magic"
  | "rgb"
  | "mechanical"
  | "minimal"
  | "split"
  | "ortho"
  | "compact"

interface SettingsContextType {
  keyboardTheme: KeyboardThemeName
  setKeyboardTheme: (t: KeyboardThemeName) => void
  font: TypingFont
  setFont: (f: TypingFont) => void
  fontCssFamily: string
  fontSize: FontSize
  setFontSize: (s: FontSize) => void
  showKeyboard: boolean
  setShowKeyboard: (v: boolean) => void
  keyboardStyle: KeyboardStyle
  setKeyboardStyle: (s: KeyboardStyle) => void
  soundEnabled: boolean
  setSoundEnabled: (v: boolean) => void
  clickSoundEnabled: boolean
  setClickSoundEnabled: (v: boolean) => void
  realtimeWpm: boolean
  setRealtimeWpm: (v: boolean) => void
  faahMode: boolean
  setFaahMode: (v: boolean) => void
  ghostMode: boolean
  setGhostMode: (v: boolean) => void
  shakeMode: boolean
  setShakeMode: (v: boolean) => void
  paceBotEnabled: boolean
  setPaceBotEnabled: (v: boolean) => void
  paceBotWpm: number
  setPaceBotWpm: (wpm: number) => void
  soundPack: SoundPack
  setSoundPack: (p: SoundPack) => void
  language: string
  setLanguage: (l: string) => void
  showDiacritics: boolean
  setShowDiacritics: (v: boolean) => void
  syntaxHighlighting: boolean
  setSyntaxHighlighting: (v: boolean) => void
  autoPair: boolean
  setAutoPair: (v: boolean) => void
  showLineNumbers: boolean
  setShowLineNumbers: (v: boolean) => void
  soundPackLoading: boolean
  setSoundPackLoading: (v: boolean) => void
  settingsLoaded: boolean
}

const SettingsContext = createContext<SettingsContextType | null>(null)

export const KEYBOARD_THEME_STORAGE_KEY = "tc-keyboard-theme"

function loadGoogleFont(family: string) {
  const id = `gf-${family}`
  if (document.getElementById(id)) return
  const link = document.createElement("link")
  link.id = id
  link.rel = "stylesheet"
  link.href = `https://fonts.googleapis.com/css2?family=${family}&display=swap`
  document.head.appendChild(link)
}

function applyFontToDom(fontId: TypingFont) {
  const option = FONT_OPTIONS.find((f) => f.id === fontId)
  if (!option) return
  if (option.googleFamily) loadGoogleFont(option.googleFamily)
  document.documentElement.style.setProperty("--typing-font", option.cssFamily)
}

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [keyboardTheme, setKeyboardThemeState] =
    useState<KeyboardThemeName>("classic")
  const [font, setFontState] = useState<TypingFont>("geist-mono")
  const [showKeyboard, setShowKeyboardState] = useState(true)
  const [keyboardStyle, setKeyboardStyleState] =
    useState<KeyboardStyle>("normal")
  const [soundEnabled, setSoundEnabledState] = useState(true)
  const [clickSoundEnabled, setClickSoundEnabledState] = useState(true)
  const [realtimeWpm, setRealtimeWpmState] = useState(false)
  const [faahMode, setFaahModeState] = useState(false)
  const [ghostMode, setGhostModeState] = useState(false)
  const [shakeMode, setShakeModeState] = useState(false)
  const [paceBotEnabled, setPaceBotEnabledState] = useState(false)
  const [paceBotWpm, setPaceBotWpmState] = useState(60)
  const [soundPack, setSoundPackState] = useState<SoundPack>("default")
  const [language, setLanguageState] = useState("english")
  const [showDiacritics, setShowDiacriticsState] = useState(true)
  const [fontSize, setFontSizeState] = useState<FontSize>("md")
  const [syntaxHighlighting, setSyntaxHighlightingState] = useState(true)
  const [autoPair, setAutoPairState] = useState(true)
  const [showLineNumbers, setShowLineNumbersState] = useState(true)
  const [soundPackLoading, setSoundPackLoading] = useState(false)
  const [settingsLoaded, setSettingsLoaded] = useState(false)

  useMountEffect(() => {
    // Any localStorage failure (private mode, quota, security policy) must
    // still release the loading gate so the app remains usable.
    try {
      const read = (key: string) => localStorage.getItem(key)
      const readBool = (key: string) => {
        const raw = read(key)
        return raw === null ? null : raw !== "false"
      }

      const savedFont = read("tc-font") as TypingFont | null
      if (savedFont) {
        setFontState(savedFont)
        applyFontToDom(savedFont)
      }

      const savedKeyboardTheme = read(KEYBOARD_THEME_STORAGE_KEY)
      if (savedKeyboardTheme && savedKeyboardTheme in KEYBOARD_THEMES) {
        setKeyboardThemeState(savedKeyboardTheme as KeyboardThemeName)
      }

      const savedKeyboardStyle = read(
        "tc-keyboard-style"
      ) as KeyboardStyle | null
      if (savedKeyboardStyle) setKeyboardStyleState(savedKeyboardStyle)
      const savedSoundPack = read("tc-sound-pack") as SoundPack | null
      if (savedSoundPack) setSoundPackState(savedSoundPack)
      const savedLanguage = read("tc-language")
      if (savedLanguage) setLanguageState(savedLanguage)
      const savedFontSize = read("tc-font-size") as FontSize | null
      if (savedFontSize) setFontSizeState(savedFontSize)

      const boolSettings: [string, (v: boolean) => void][] = [
        ["tc-show-keyboard", setShowKeyboardState],
        ["tc-sound-enabled", setSoundEnabledState],
        ["tc-click-sound-enabled", setClickSoundEnabledState],
        ["tc-realtime-wpm", setRealtimeWpmState],
        ["tc-faah-mode", setFaahModeState],
        ["tc-ghost-mode", setGhostModeState],
        ["tc-shake-mode", setShakeModeState],
        ["tc-show-diacritics", setShowDiacriticsState],
        ["tc-syntax-highlighting", setSyntaxHighlightingState],
        ["tc-auto-pair", setAutoPairState],
        ["tc-show-line-numbers", setShowLineNumbersState],
        ["tc-pace-bot-enabled", setPaceBotEnabledState],
      ]
      for (const [key, setter] of boolSettings) {
        const value = readBool(key)
        if (value !== null) setter(value)
      }

      const savedPaceBotWpm = read("tc-pace-bot-wpm")
      if (savedPaceBotWpm !== null) {
        const parsed = parseInt(savedPaceBotWpm, 10)
        if (!isNaN(parsed) && parsed > 0) setPaceBotWpmState(parsed)
      }
    } catch {
      // storage unavailable — run with defaults
    } finally {
      setSettingsLoaded(true)
    }
  })

  const setKeyboardTheme = (t: KeyboardThemeName) => {
    setKeyboardThemeState(t)
    localStorage.setItem(KEYBOARD_THEME_STORAGE_KEY, t)
  }

  const setFont = (f: TypingFont) => {
    setFontState(f)
    applyFontToDom(f)
    localStorage.setItem("tc-font", f)
  }

  const setShowKeyboard = (v: boolean) => {
    setShowKeyboardState(v)
    localStorage.setItem("tc-show-keyboard", String(v))
  }

  const setKeyboardStyle = (s: KeyboardStyle) => {
    setKeyboardStyleState(s)
    localStorage.setItem("tc-keyboard-style", s)
  }

  const setSoundEnabled = (v: boolean) => {
    setSoundEnabledState(v)
    localStorage.setItem("tc-sound-enabled", String(v))
  }

  const setClickSoundEnabled = (v: boolean) => {
    setClickSoundEnabledState(v)
    localStorage.setItem("tc-click-sound-enabled", String(v))
  }

  const setRealtimeWpm = (v: boolean) => {
    setRealtimeWpmState(v)
    localStorage.setItem("tc-realtime-wpm", String(v))
  }

  const setFaahMode = (v: boolean) => {
    setFaahModeState(v)
    localStorage.setItem("tc-faah-mode", String(v))
  }

  const setGhostMode = (v: boolean) => {
    setGhostModeState(v)
    localStorage.setItem("tc-ghost-mode", String(v))
  }

  const setShakeMode = (v: boolean) => {
    setShakeModeState(v)
    localStorage.setItem("tc-shake-mode", String(v))
  }

  const setSoundPack = (p: SoundPack) => {
    setSoundPackState(p)
    localStorage.setItem("tc-sound-pack", p)
  }

  const setLanguage = (l: string) => {
    setLanguageState(l)
    localStorage.setItem("tc-language", l)
  }

  const setShowDiacritics = (v: boolean) => {
    setShowDiacriticsState(v)
    localStorage.setItem("tc-show-diacritics", String(v))
  }

  const setFontSize = (s: FontSize) => {
    setFontSizeState(s)
    localStorage.setItem("tc-font-size", s)
  }

  const setSyntaxHighlighting = (v: boolean) => {
    setSyntaxHighlightingState(v)
    localStorage.setItem("tc-syntax-highlighting", String(v))
  }

  const setAutoPair = (v: boolean) => {
    setAutoPairState(v)
    localStorage.setItem("tc-auto-pair", String(v))
  }

  const setShowLineNumbers = (v: boolean) => {
    setShowLineNumbersState(v)
    localStorage.setItem("tc-show-line-numbers", String(v))
  }

  const setPaceBotEnabled = (v: boolean) => {
    setPaceBotEnabledState(v)
    localStorage.setItem("tc-pace-bot-enabled", String(v))
  }

  const setPaceBotWpm = (wpm: number) => {
    setPaceBotWpmState(wpm)
    localStorage.setItem("tc-pace-bot-wpm", String(wpm))
  }

  const fontCssFamily =
    FONT_OPTIONS.find((f) => f.id === font)?.cssFamily ?? "var(--font-mono)"

  return (
    <SettingsContext.Provider
      value={{
        keyboardTheme,
        setKeyboardTheme,
        font,
        setFont,
        fontCssFamily,
        fontSize,
        setFontSize,
        showKeyboard,
        setShowKeyboard,
        keyboardStyle,
        setKeyboardStyle,
        soundEnabled,
        setSoundEnabled,
        clickSoundEnabled,
        setClickSoundEnabled,
        realtimeWpm,
        setRealtimeWpm,
        faahMode,
        setFaahMode,
        ghostMode,
        setGhostMode,
        shakeMode,
        setShakeMode,
        paceBotEnabled,
        setPaceBotEnabled,
        paceBotWpm,
        setPaceBotWpm,
        soundPack,
        setSoundPack,
        language,
        setLanguage,
        showDiacritics,
        setShowDiacritics,
        syntaxHighlighting,
        setSyntaxHighlighting,
        autoPair,
        setAutoPair,
        showLineNumbers,
        setShowLineNumbers,
        soundPackLoading,
        setSoundPackLoading,
        settingsLoaded,
      }}
    >
      {children}
    </SettingsContext.Provider>
  )
}

export function useSettings() {
  const ctx = useContext(SettingsContext)
  if (!ctx) throw new Error("useSettings must be used within SettingsProvider")
  return ctx
}
