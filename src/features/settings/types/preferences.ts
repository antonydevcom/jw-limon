export const accentPreferences = [
  "purple",
  "green",
  "blue",
  "pink",
  "orange",
] as const

export type AccentPreference = (typeof accentPreferences)[number]

export const themePreferences = ["light", "dark"] as const

export type ThemePreference = (typeof themePreferences)[number]

export function isAccentPreference(value: unknown): value is AccentPreference {
  return accentPreferences.includes(value as AccentPreference)
}

export function isThemePreference(value: unknown): value is ThemePreference {
  return themePreferences.includes(value as ThemePreference)
}
