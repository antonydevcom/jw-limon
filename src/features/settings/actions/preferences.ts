"use server"

"use server"

import { z } from "zod"
import { createSupabaseServerClient } from "@/shared/supabase/serverClient"
import { getAppContext } from "@/shared/auth/appContext"
import {
  themePreferences,
  type ThemePreference,
} from "../types/preferences"

const preferencesSchema = z
  .object({
    theme: z.enum(themePreferences).optional(),
  })
  .refine((value) => value.theme !== undefined)

export interface UserPreferences {
  theme?: ThemePreference
}

export async function getUserPreferences(): Promise<UserPreferences> {
  const { supabase, userId } = await getAppContext()

  const { data } = await supabase
    .from("profiles")
    .select("theme_preference")
    .eq("user_id", userId)
    .maybeSingle()

  return {
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
        ...(parsed.theme ? { theme_preference: parsed.theme } : {}),
      },
      { onConflict: "user_id" },
    )
}
