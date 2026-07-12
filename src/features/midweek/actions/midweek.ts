"use server"

import { revalidatePath } from "next/cache"
import { requireAdminContext } from "@/shared/auth/appContext"
import type { Database } from "@/types/database.types"
import { databaseError, invalidInputError, midweekSaveSchema } from "@/shared/validation/actionSchemas"
import { datesBelongToPeriod, getWritablePeriod } from "@/features/schedule-templates/data/getWritablePeriod"

type Section = Database["public"]["Enums"]["midweek_section"]

type MeetingData = {
  meeting_date: string
  chairman_name: string
  opening_song: string
  opening_prayer_name: string
  mid_song: string
  closing_song: string
  closing_prayer_name: string
}

type PartData = {
  section: Section
  sort_order: number
  title: string
  duration_minutes: number | null
  assigned_name: string
  assistant_name: string
}

export async function saveMidweekWeek(
  periodId: string,
  congregationId: string,
  meetingData: MeetingData,
  parts: PartData[],
): Promise<{ error: string | null }> {
  const parsed = midweekSaveSchema.safeParse({ periodId, congregationId, meetingData, parts })
  if (!parsed.success) return invalidInputError()
  const context = await requireAdminContext()
  if (!context || context.congregationId !== congregationId) return { error: "No autorizado." }
  const { supabase } = context
  const period = await getWritablePeriod(supabase, congregationId, periodId, "midweek")
  if (!period || !datesBelongToPeriod([meetingData.meeting_date], period)) return invalidInputError()

  const { data: meeting, error: meetingError } = await supabase
    .from("midweek_meetings")
    .upsert(
      {
        congregation_id: congregationId,
        period_id: periodId,
        meeting_date: meetingData.meeting_date,
        chairman_name: meetingData.chairman_name || null,
        opening_song: meetingData.opening_song || null,
        opening_prayer_name: meetingData.opening_prayer_name || null,
        mid_song: meetingData.mid_song || null,
        closing_song: meetingData.closing_song || null,
        closing_prayer_name: meetingData.closing_prayer_name || null,
      },
      { onConflict: "congregation_id,meeting_date" },
    )
    .select("id")
    .single()

  if (meetingError) return databaseError()

  if (parts.length > 0) {
    const { data: savedParts, error: partsError } = await supabase.from("midweek_parts").upsert(
      parts.map((p) => ({
        congregation_id: congregationId,
        meeting_id: meeting.id,
        section: p.section,
        sort_order: p.sort_order,
        title: p.title || null,
        duration_minutes: p.duration_minutes,
        assigned_name: p.assigned_name || null,
        assistant_name: p.assistant_name || null,
      })),
      { onConflict: "meeting_id,section,sort_order" },
    ).select("id")
    if (partsError) return databaseError()
    const savedIds = savedParts?.map((part) => part.id) ?? []
    const deleteQuery = supabase.from("midweek_parts").delete().eq("meeting_id", meeting.id)
    const { error: deleteError } = savedIds.length
      ? await deleteQuery.not("id", "in", `(${savedIds.join(",")})`)
      : await deleteQuery
    if (deleteError) return databaseError()
  } else {
    const { error: deleteError } = await supabase
      .from("midweek_parts")
      .delete()
      .eq("meeting_id", meeting.id)
    if (deleteError) return databaseError()
  }

  revalidatePath("/dashboard/reunion-semanal")
  return { error: null }
}
