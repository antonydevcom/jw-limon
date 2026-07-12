"use server"

import { revalidatePath } from "next/cache"
import { requireAdminContext } from "@/shared/auth/appContext"
import type { Database } from "@/types/database.types"
import { databaseError, invalidInputError, readerRowsSchema, uuidSchema } from "@/shared/validation/actionSchemas"
import { datesBelongToPeriod, getWritablePeriod } from "@/features/schedule-templates/data/getWritablePeriod"

type ReaderType = Database["public"]["Enums"]["reader_type"]
type Row = { meeting_date: string; reader_type: ReaderType; reader_name: string }

export async function saveReaderRows(
  periodId: string,
  congregationId: string,
  rows: Row[],
): Promise<{ error: string | null }> {
  if (!uuidSchema.safeParse(periodId).success || !uuidSchema.safeParse(congregationId).success || !readerRowsSchema.safeParse(rows).success) return invalidInputError()
  const context = await requireAdminContext()
  if (!context || context.congregationId !== congregationId) return { error: "No autorizado." }
  const { supabase } = context
  const period = await getWritablePeriod(supabase, congregationId, periodId, "readers")
  if (!period || !datesBelongToPeriod(rows.map((row) => row.meeting_date), period)) return invalidInputError()

  const { error } = await supabase.from("reader_assignments").upsert(
    rows.map((r) => ({
      congregation_id: congregationId,
      period_id: periodId,
      meeting_date: r.meeting_date,
      reader_type: r.reader_type,
      reader_name: r.reader_name || null,
    })),
    { onConflict: "congregation_id,meeting_date,reader_type" },
  )

  if (error) return databaseError()
  revalidatePath("/dashboard/lectores")
  return { error: null }
}
