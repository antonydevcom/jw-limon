"use server"

import { requireAdminContext } from "@/shared/auth/appContext"
import { getMonthStartEnd } from "@/shared/utils/dates"
import { uuidSchema, yearMonthSchema } from "@/shared/validation/actionSchemas"
import type { Database } from "@/types/database.types"

type TemplateKey = Database["public"]["Enums"]["schedule_template_key"]
type Period = Database["public"]["Tables"]["schedule_periods"]["Row"]

const templateKeys: TemplateKey[] = [
  "midweek",
  "weekend",
  "readers",
  "duties",
  "cleaning",
  "hospitality",
]

async function findPeriod(
  context: NonNullable<Awaited<ReturnType<typeof requireAdminContext>>>,
  templateKey: TemplateKey,
  startsOn: string,
): Promise<Period | null> {
  const { data } = await context.supabase
    .from("schedule_periods")
    .select("*")
    .eq("congregation_id", context.congregationId)
    .eq("template_key", templateKey)
    .eq("starts_on", startsOn)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle()

  return data
}

export async function ensureSchedulePeriod(
  congregationId: string,
  templateKey: TemplateKey,
  yearMonth: string,
): Promise<Period | null> {
  if (
    !uuidSchema.safeParse(congregationId).success ||
    !yearMonthSchema.safeParse(yearMonth).success ||
    !templateKeys.includes(templateKey)
  ) return null

  const context = await requireAdminContext()
  if (!context || context.congregationId !== congregationId) return null

  const { starts_on, ends_on } = getMonthStartEnd(yearMonth)
  const existing = await findPeriod(context, templateKey, starts_on)
  if (existing) return existing

  const { data, error } = await context.supabase
    .from("schedule_periods")
    .insert({
      congregation_id: context.congregationId,
      template_key: templateKey,
      starts_on,
      ends_on,
      status: "draft",
    })
    .select("*")
    .single()

  if (!error) return data
  if (error.code === "23505") {
    return findPeriod(context, templateKey, starts_on)
  }

  return null
}
