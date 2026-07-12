"use server"

import { revalidatePath } from "next/cache"
import { requireAdminContext } from "@/shared/auth/appContext"
import { databaseError, dutyRowsSchema, invalidInputError, uuidSchema } from "@/shared/validation/actionSchemas"
import { datesBelongToPeriod, getWritablePeriod } from "@/features/schedule-templates/data/getWritablePeriod"

export type DutyRow = {
  meeting_date: string
  entrance_name: string
  auditorium_name: string
  microphone_1_name: string
  microphone_2_name: string
}

export async function saveDutyRows(
  periodId: string,
  congregationId: string,
  rows: DutyRow[],
): Promise<{ error: string | null }> {
  if (!uuidSchema.safeParse(periodId).success || !uuidSchema.safeParse(congregationId).success || !dutyRowsSchema.safeParse(rows).success) return invalidInputError()
  const context = await requireAdminContext()
  if (!context || context.congregationId !== congregationId) return { error: "No autorizado." }
  const { supabase } = context
  const period = await getWritablePeriod(supabase, congregationId, periodId, "duties")
  if (!period || !datesBelongToPeriod(rows.map((row) => row.meeting_date), period)) return invalidInputError()

  const { error } = await supabase.from("duty_assignments").upsert(
    rows.map((r) => ({
      congregation_id: congregationId,
      period_id: periodId,
      meeting_date: r.meeting_date,
      entrance_name: r.entrance_name || null,
      auditorium_name: r.auditorium_name || null,
      microphone_1_name: r.microphone_1_name || null,
      microphone_2_name: r.microphone_2_name || null,
    })),
    { onConflict: "congregation_id,meeting_date" },
  )

  if (error) return databaseError()
  revalidatePath("/dashboard/acomodadores")
  return { error: null }
}
