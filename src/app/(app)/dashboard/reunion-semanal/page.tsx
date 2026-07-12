import { getAppContext } from "@/shared/auth/appContext"
import { MidweekEditor } from "@/features/midweek/components/MidweekEditor"
import { PageHeading } from "@/components/layout/PageHeading"
import { PeriodBar } from "@/features/schedule-templates/components/PeriodBar"
import { ensureSchedulePeriod } from "@/features/schedule-templates/actions/ensureSchedulePeriod"
import {
  resolveYearMonth,
  getMonthStartEnd,
  getMonthDatesForWeekdays,
} from "@/shared/utils/dates"
import type { Database } from "@/types/database.types"

export const metadata = { title: "Reunión Semanal" }

type Meeting = Database["public"]["Tables"]["midweek_meetings"]["Row"]
type Part = Database["public"]["Tables"]["midweek_parts"]["Row"]

interface Props {
  searchParams: Promise<{ month?: string }>
}

export default async function ReunionSemanalPage({ searchParams }: Props) {
  const { supabase, congregationId, role } = await getAppContext()

  const params = await searchParams
  const yearMonth = resolveYearMonth(params.month)
  const { starts_on } = getMonthStartEnd(yearMonth)

  if (!congregationId) {
    return (
      <p className="text-sm text-[var(--muted)]">
        Aún no hay congregación configurada.
      </p>
    )
  }

  let periodQuery = supabase
    .from("schedule_periods")
    .select("*")
    .eq("congregation_id", congregationId)
    .eq("template_key", "midweek")
    .eq("starts_on", starts_on)
  if (role === "viewer") periodQuery = periodQuery.eq("status", "published")
  const { data: periodRows } = await periodQuery
    .order("created_at", { ascending: true })
    .limit(1)
  let period = periodRows?.[0] ?? null
  if (!period && role === "admin") {
    period = await ensureSchedulePeriod(congregationId, "midweek", yearMonth)
  }

  let savedMeetings: Meeting[] = []
  let savedParts: Part[] = []
  if (period) {
    const { data: meetings } = await supabase
      .from("midweek_meetings")
      .select("*")
      .eq("period_id", period.id)
      .order("meeting_date")
    savedMeetings = meetings ?? []

    const meetingIds = savedMeetings.map((m) => m.id)
    if (meetingIds.length > 0) {
      const { data: parts } = await supabase
        .from("midweek_parts")
        .select("*")
        .in("meeting_id", meetingIds)
        .order("sort_order")
      savedParts = parts ?? []
    }
  }

  const dates = getMonthDatesForWeekdays(yearMonth, [2])

  return (
    <div className="space-y-6">
      {!period && (
        <>
          <PageHeading title="Reunión Semanal">
            <PeriodBar yearMonth={yearMonth} period={null} role={role} congregationId={congregationId} templateKey="midweek" basePath="/dashboard/reunion-semanal" embedded hidePublish />
          </PageHeading>
          <p className="text-sm text-[var(--muted)]">
            {role === "admin" ? "Crea el formato para este mes." : "Sin formato publicado para este mes."}
          </p>
        </>
      )}

      {period && (
        <MidweekEditor
          key={period.id}
          period={period}
          dates={dates}
          savedMeetings={savedMeetings}
          savedParts={savedParts}
          role={role}
          congregationId={congregationId}
          basePath="/dashboard/reunion-semanal"
          yearMonth={yearMonth}
        />
      )}
    </div>
  )
}
