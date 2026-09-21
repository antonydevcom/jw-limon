"use server"

import { revalidatePath } from "next/cache"
import type { SupabaseClient } from "@supabase/supabase-js"
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

  const partsError = await syncParts(supabase, congregationId, meeting.id, parts)
  if (partsError) return databaseError()

  revalidatePath("/dashboard/reunion-semanal")
  return { error: null }
}

type PartKey = `${Section}:${number}`

const partKey = (section: Section, sortOrder: number): PartKey => `${section}:${sortOrder}`

/**
 * Update-by-id / insert / delete-stale instead of `upsert ... ON CONFLICT`,
 * so saving never depends on a unique index existing in the remote database
 * and legacy duplicate rows get cleaned up.
 */
async function syncParts(
  supabase: SupabaseClient<Database>,
  congregationId: string,
  meetingId: string,
  parts: PartData[],
): Promise<boolean> {
  const { data: existing, error: readError } = await supabase
    .from("midweek_parts")
    .select("id, section, sort_order")
    .eq("meeting_id", meetingId)
    .order("created_at", { ascending: true })
  if (readError) return true

  const idByKey = new Map<PartKey, string>()
  const staleIds: string[] = []
  for (const row of existing ?? []) {
    const key = partKey(row.section, row.sort_order)
    if (idByKey.has(key)) staleIds.push(row.id)
    else idByKey.set(key, row.id)
  }

  const toRow = (p: PartData) => ({
    title: p.title || null,
    duration_minutes: p.duration_minutes,
    assigned_name: p.assigned_name || null,
    assistant_name: p.assistant_name || null,
  })

  const inserts: Database["public"]["Tables"]["midweek_parts"]["Insert"][] = []
  const updates: Array<PromiseLike<{ error: unknown }>> = []
  const keptKeys = new Set<PartKey>()

  for (const p of parts) {
    const key = partKey(p.section, p.sort_order)
    if (keptKeys.has(key)) continue
    keptKeys.add(key)
    const existingId = idByKey.get(key)
    if (existingId) {
      updates.push(supabase.from("midweek_parts").update(toRow(p)).eq("id", existingId))
    } else {
      inserts.push({
        congregation_id: congregationId,
        meeting_id: meetingId,
        section: p.section,
        sort_order: p.sort_order,
        ...toRow(p),
      })
    }
  }

  for (const [key, id] of idByKey) {
    if (!keptKeys.has(key)) staleIds.push(id)
  }

  const results = await Promise.all(updates)
  if (results.some((result) => result.error)) return true

  if (inserts.length > 0) {
    const { error } = await supabase.from("midweek_parts").insert(inserts)
    if (error) return true
  }

  if (staleIds.length > 0) {
    const { error } = await supabase.from("midweek_parts").delete().in("id", staleIds)
    if (error) return true
  }

  return false
}
