"use server"

import { revalidatePath } from "next/cache"
import { requireAdminContext } from "@/shared/auth/appContext"
import { getMonthStartEnd } from "@/shared/utils/dates"
import type { Database } from "@/types/database.types"
import { databaseError, invalidInputError, longTextSchema, periodIdMutationSchema, periodMutationSchema } from "@/shared/validation/actionSchemas"

type TemplateKey = Database["public"]["Enums"]["schedule_template_key"]

export async function createPeriod(
  congregationId: string,
  templateKey: TemplateKey,
  yearMonth: string,
  revalidate: string,
): Promise<{ periodId: string | null; error: string | null }> {
  const parsed = periodMutationSchema.safeParse({ congregationId, templateKey, yearMonth, revalidate })
  if (!parsed.success) return { periodId: null, ...invalidInputError() }
  const context = await requireAdminContext()
  if (!context || context.congregationId !== congregationId) return { periodId: null, error: "No autorizado." }
  const { supabase } = context
  const { starts_on, ends_on } = getMonthStartEnd(yearMonth)

  const { data, error } = await supabase
    .from("schedule_periods")
    .insert({
      congregation_id: congregationId,
      template_key: templateKey,
      starts_on,
      ends_on,
      status: "draft",
    })
    .select("id")
    .single()

  if (error) return { periodId: null, ...databaseError() }
  revalidatePath(revalidate)
  return { periodId: data.id, error: null }
}

export async function publishPeriod(
  periodId: string,
  revalidate: string,
): Promise<{ error: string | null }> {
  if (!periodIdMutationSchema.safeParse({ periodId, revalidate }).success) return invalidInputError()
  const context = await requireAdminContext()
  if (!context) return { error: "No autorizado." }
  const { supabase } = context

  const { error } = await supabase
    .from("schedule_periods")
    .update({ status: "published", published_at: new Date().toISOString() })
    .eq("id", periodId)
    .eq("congregation_id", context.congregationId)
    .select("id")
    .single()

  if (error) return databaseError()
  revalidatePath(revalidate)
  return { error: null }
}

export async function unpublishPeriod(
  periodId: string,
  revalidate: string,
): Promise<{ error: string | null }> {
  if (!periodIdMutationSchema.safeParse({ periodId, revalidate }).success) return invalidInputError()
  const context = await requireAdminContext()
  if (!context) return { error: "No autorizado." }
  const { supabase } = context

  const { error } = await supabase
    .from("schedule_periods")
    .update({ status: "draft", published_at: null })
    .eq("id", periodId)
    .eq("congregation_id", context.congregationId)
    .select("id")
    .single()

  if (error) return databaseError()
  revalidatePath(revalidate)
  return { error: null }
}

export async function updatePeriodNotes(
  periodId: string,
  notes: string,
  revalidate: string,
): Promise<{ error: string | null }> {
  if (!periodIdMutationSchema.safeParse({ periodId, revalidate }).success || !longTextSchema.safeParse(notes).success) return invalidInputError()
  const context = await requireAdminContext()
  if (!context) return { error: "No autorizado." }
  const { supabase } = context

  const { error } = await supabase
    .from("schedule_periods")
    .update({ notes })
    .eq("id", periodId)
    .eq("congregation_id", context.congregationId)
    .select("id")
    .single()

  if (error) return databaseError()
  revalidatePath(revalidate)
  return { error: null }
}
