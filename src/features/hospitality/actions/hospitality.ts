"use server"

import { revalidatePath } from "next/cache"
import { requireAdminContext } from "@/shared/auth/appContext"
import { databaseError, hospitalityRowsSchema, invalidInputError, uuidSchema } from "@/shared/validation/actionSchemas"
import { datesBelongToPeriod, getWritablePeriod } from "@/features/schedule-templates/data/getWritablePeriod"

type Row = { meeting_date: string; group_name: string }

export async function saveHospitalityRows(
  periodId: string,
  congregationId: string,
  rows: Row[],
): Promise<{ error: string | null }> {
  if (!uuidSchema.safeParse(periodId).success || !uuidSchema.safeParse(congregationId).success || !hospitalityRowsSchema.safeParse(rows).success) return invalidInputError()
  const context = await requireAdminContext()
  if (!context || context.congregationId !== congregationId) return { error: "No autorizado." }
  const { supabase } = context
  const period = await getWritablePeriod(supabase, congregationId, periodId, "hospitality")
  if (!period || !datesBelongToPeriod(rows.map((row) => row.meeting_date), period)) return invalidInputError()

  const { error } = await supabase.from("hospitality_assignments").upsert(
    rows.map((r) => ({
      congregation_id: congregationId,
      period_id: periodId,
      meeting_date: r.meeting_date,
      group_name: r.group_name || null,
    })),
    { onConflict: "congregation_id,meeting_date" },
  )

  if (error) return databaseError()
  revalidatePath("/dashboard/hospitalidad")
  return { error: null }
}
