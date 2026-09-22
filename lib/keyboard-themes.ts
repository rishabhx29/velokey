// The 7 built-in themes of the keyb.himan.me keyboard component
// (components/ui/keyboard.tsx). Used by the settings panel picker.
// Keep in sync with KeyboardThemeName in components/ui/keyboard.tsx.
// "classic" matches the upstream registry theme; "classic2" is the
// previous app-accent (blue) variant kept under a new name.

export type KeyboardThemeName =
  "classic" | "classic2" | "mint" | "royal" | "dolch" | "sand" | "scarlet"

export interface KeyboardThemeOption {
  id: KeyboardThemeName
  label: string
  /** Keycap body color */
  light: string
  /** Modifier / dark keycap color */
  dark: string
  /** Accent keycap color (esc, enter, arrows…) */
  accent: string
}

export const KEYBOARD_THEMES: KeyboardThemeOption[] = [
  {
    id: "classic",
    label: "Classic",
    light: "#F5F5F5",
    dark: "#737373",
    accent: "#F57644",
  },
  {
    id: "classic2",
    label: "Classic 2",
    light: "#e8e8e8",
    dark: "#3a3a3a",
    accent: "var(--primary)",
  },
  {
    id: "mint",
    label: "Mint",
    light: "#eeeeee",
    dark: "#447b82",
    accent: "#86c8ac",
  },
  {
    id: "royal",
    label: "Royal",
    light: "#324974",
    dark: "#3a3b35",
    accent: "#e4d440",
  },
  {
    id: "dolch",
    label: "Dolch",
    light: "#4f5e78",
    dark: "#3e3b4c",
    accent: "#d73e42",
  },
  {
    id: "sand",
    label: "Sand",
    light: "#efefef",
    dark: "#893d36",
    accent: "#c94e41",
  },
  {
    id: "scarlet",
    label: "Scarlet",
    light: "#e4d7d7",
    dark: "#d5868a",
    accent: "#8f4246",
  },
]
