"use server"

import { revalidatePath } from "next/cache"
import { requireAdminContext } from "@/shared/auth/appContext"
import { cleaningRowsSchema, databaseError, invalidInputError, uuidSchema } from "@/shared/validation/actionSchemas"
import { datesBelongToPeriod, getWritablePeriod } from "@/features/schedule-templates/data/getWritablePeriod"

type Row = { service_date: string; cleaning_group_name: string }

export async function saveCleaningRows(
  periodId: string,
  congregationId: string,
  rows: Row[],
): Promise<{ error: string | null }> {
  if (!uuidSchema.safeParse(periodId).success || !uuidSchema.safeParse(congregationId).success || !cleaningRowsSchema.safeParse(rows).success) return invalidInputError()
  const context = await requireAdminContext()
  if (!context || context.congregationId !== congregationId) return { error: "No autorizado." }
  const { supabase } = context
  const period = await getWritablePeriod(supabase, congregationId, periodId, "cleaning")
  if (!period || !datesBelongToPeriod(rows.map((row) => row.service_date), period)) return invalidInputError()

  const { error } = await supabase.from("cleaning_assignments").upsert(
    rows.map((r) => ({
      congregation_id: congregationId,
      period_id: periodId,
      service_date: r.service_date,
      cleaning_group_name: r.cleaning_group_name || null,
    })),
    { onConflict: "congregation_id,service_date" },
  )

  if (error) return databaseError()
  revalidatePath("/dashboard/limpieza")
  return { error: null }
}
