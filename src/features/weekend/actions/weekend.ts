"use server"

import { revalidatePath } from "next/cache"
import { requireAdminContext } from "@/shared/auth/appContext"
import { databaseError, invalidInputError, uuidSchema, weekendRowsSchema } from "@/shared/validation/actionSchemas"
import { datesBelongToPeriod, getWritablePeriod } from "@/features/schedule-templates/data/getWritablePeriod"

type WeekendRow = {
  meeting_date: string
  chairman_name: string
  opening_prayer_name: string
  speaker_name: string
  speaker_congregation: string
  outline_title: string
  song_number: string
  wt_reader_name: string
  wt_conductor_name: string
  hospitality_group_name: string
}

export async function saveWeekendRows(
  periodId: string,
  congregationId: string,
  rows: WeekendRow[],
): Promise<{ error: string | null }> {
  if (!uuidSchema.safeParse(periodId).success || !uuidSchema.safeParse(congregationId).success || !weekendRowsSchema.safeParse(rows).success) return invalidInputError()
  const context = await requireAdminContext()
  if (!context || context.congregationId !== congregationId) return { error: "No autorizado." }
  const { supabase } = context
  const period = await getWritablePeriod(supabase, congregationId, periodId, "weekend")
  if (!period || !datesBelongToPeriod(rows.map((row) => row.meeting_date), period)) return invalidInputError()

  const { error } = await supabase.from("weekend_meetings").upsert(
    rows.map((r) => ({
      congregation_id: congregationId,
      period_id: periodId,
      meeting_date: r.meeting_date,
      chairman_name: r.chairman_name || null,
      opening_prayer_name: r.opening_prayer_name || null,
      speaker_name: r.speaker_name || null,
      speaker_congregation: r.speaker_congregation || null,
      outline_title: r.outline_title || null,
      song_number: r.song_number || null,
      wt_reader_name: r.wt_reader_name || null,
      wt_conductor_name: r.wt_conductor_name || null,
      hospitality_group_name: r.hospitality_group_name || null,
    })),
    { onConflict: "congregation_id,meeting_date" },
  )

  if (error) return databaseError()
  revalidatePath("/dashboard/reunion-fin-semana")
  return { error: null }
}
