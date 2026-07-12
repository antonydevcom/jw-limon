"use server"

"use server"

import { z } from "zod"
import { createSupabaseServerClient } from "@/shared/supabase/serverClient"
import { getAppContext } from "@/shared/auth/appContext"
import {
  accentPreferences,
  isAccentPreference,
  themePreferences,
  type AccentPreference,
  type ThemePreference,
} from "../types/preferences"

const preferencesSchema = z
  .object({
    accent: z.enum(accentPreferences).optional(),
    theme: z.enum(themePreferences).optional(),
  })
  .refine((value) => value.accent !== undefined || value.theme !== undefined)

export interface UserPreferences {
  accent?: AccentPreference
  theme?: ThemePreference
}

export async function getUserPreferences(): Promise<UserPreferences> {
  const { supabase, userId } = await getAppContext()

  const { data } = await supabase
    .from("profiles")
    .select("accent_preference, theme_preference")
    .eq("user_id", userId)
    .maybeSingle()

  return {
    accent: isAccentPreference(data?.accent_preference)
      ? data.accent_preference
      : undefined,
    theme:
      data?.theme_preference === "light" || data?.theme_preference === "dark"
        ? data.theme_preference
        : undefined,
  }
}

export async function updateUserPreferences(input: unknown): Promise<void> {
  const parsed = preferencesSchema.parse(input)
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return

  await supabase
    .from("profiles")
    .upsert(
      {
        user_id: user.id,
        updated_at: new Date().toISOString(),
        ...(parsed.accent ? { accent_preference: parsed.accent } : {}),
        ...(parsed.theme ? { theme_preference: parsed.theme } : {}),
      },
      { onConflict: "user_id" },
    )
}
