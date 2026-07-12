import { getAppContext } from "@/shared/auth/appContext"
import { PageHeading } from "@/components/layout/PageHeading"
import { PeriodBar } from "@/features/schedule-templates/components/PeriodBar"
import { DutiesEditor } from "@/features/duties/components/DutiesEditor"
import { ensureSchedulePeriod } from "@/features/schedule-templates/actions/ensureSchedulePeriod"
import {
  resolveYearMonth,
  getMonthStartEnd,
  getMonthDatesForWeekdays,
} from "@/shared/utils/dates"

export const metadata = { title: "Acomodadores" }

interface Props {
  searchParams: Promise<{ month?: string }>
}

export default async function AcomodadoresPage({ searchParams }: Props) {
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
    .eq("template_key", "duties")
    .eq("starts_on", starts_on)
  if (role === "viewer") periodQuery = periodQuery.eq("status", "published")
  const { data: periodRows } = await periodQuery
    .order("created_at", { ascending: true })
    .limit(1)
  let period = periodRows?.[0] ?? null
  if (!period && role === "admin") {
    period = await ensureSchedulePeriod(congregationId, "duties", yearMonth)
  }

  let savedRows: {
    meeting_date: string
    entrance_name: string | null
    auditorium_name: string | null
    microphone_1_name: string | null
    microphone_2_name: string | null
  }[] = []
  if (period) {
    const { data } = await supabase
      .from("duty_assignments")
      .select(
        "meeting_date, entrance_name, auditorium_name, microphone_1_name, microphone_2_name",
      )
      .eq("period_id", period.id)
      .order("meeting_date")
    savedRows = data ?? []
  }

  const dates = getMonthDatesForWeekdays(yearMonth, [0, 2])

  return (
    <div className="space-y-6">
      {!period && (
        <>
          <PageHeading title="Acomodadores y micrófonos">
            <PeriodBar
              yearMonth={yearMonth}
              period={period ?? null}
              role={role}
              congregationId={congregationId}
              templateKey="duties"
              basePath="/dashboard/acomodadores"
              embedded
              hidePublish
            />
          </PageHeading>
          <p className="text-sm text-[var(--muted)]">
            {role === "admin" ? "Crea el formato para este mes." : "Sin formato publicado para este mes."}
          </p>
        </>
      )}

      {period && (
        <DutiesEditor
          key={period.id}
          period={period}
          dates={dates}
          savedRows={savedRows}
          role={role}
          congregationId={congregationId}
          yearMonth={yearMonth}
          basePath="/dashboard/acomodadores"
        />
      )}
    </div>
  )
}
