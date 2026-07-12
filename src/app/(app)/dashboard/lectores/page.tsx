import { getAppContext } from "@/shared/auth/appContext"
import { PageHeading } from "@/components/layout/PageHeading"
import { PeriodBar } from "@/features/schedule-templates/components/PeriodBar"
import { ReadersEditor } from "@/features/readers/components/ReadersEditor"
import { ensureSchedulePeriod } from "@/features/schedule-templates/actions/ensureSchedulePeriod"
import {
  resolveYearMonth,
  getMonthStartEnd,
  getMonthDatesForWeekdays,
} from "@/shared/utils/dates"

export const metadata = { title: "Lectores" }

interface Props {
  searchParams: Promise<{ month?: string }>
}

export default async function LectoresPage({ searchParams }: Props) {
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
    .eq("template_key", "readers")
    .eq("starts_on", starts_on)
  if (role === "viewer") periodQuery = periodQuery.eq("status", "published")
  const { data: periodRows } = await periodQuery
    .order("created_at", { ascending: true })
    .limit(1)
  let period = periodRows?.[0] ?? null
  if (!period && role === "admin") {
    period = await ensureSchedulePeriod(congregationId, "readers", yearMonth)
  }

  let savedRows: Array<{
    meeting_date: string
    reader_type: string
    reader_name: string | null
  }> = []

  if (period) {
    const { data } = await supabase
      .from("reader_assignments")
      .select("meeting_date, reader_type, reader_name")
      .eq("period_id", period.id)
      .order("meeting_date")
    savedRows = data ?? []
  }

  const sundays = getMonthDatesForWeekdays(yearMonth, [0])
  const tuesdays = getMonthDatesForWeekdays(yearMonth, [2])

  return (
    <div className="space-y-6">
      {!period && (
        <>
          <PageHeading title="Lectores">
            <PeriodBar
              yearMonth={yearMonth}
              period={period ?? null}
              role={role}
              congregationId={congregationId}
              templateKey="readers"
              basePath="/dashboard/lectores"
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
        <ReadersEditor
          key={period.id}
          period={period}
          sundays={sundays}
          tuesdays={tuesdays}
          savedRows={savedRows}
          role={role}
          congregationId={congregationId}
          yearMonth={yearMonth}
          basePath="/dashboard/lectores"
        />
      )}
    </div>
  )
}
