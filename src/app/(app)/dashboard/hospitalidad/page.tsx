import { getAppContext } from "@/shared/auth/appContext"
import { PageHeading } from "@/components/layout/PageHeading"
import { PeriodBar } from "@/features/schedule-templates/components/PeriodBar"
import { HospitalityEditor } from "@/features/hospitality/components/HospitalityEditor"
import { ensureSchedulePeriod } from "@/features/schedule-templates/actions/ensureSchedulePeriod"
import {
  resolveYearMonth,
  getMonthStartEnd,
  getMonthDatesForWeekdays,
} from "@/shared/utils/dates"

export const metadata = { title: "Hospitalidad" }

interface Props {
  searchParams: Promise<{ month?: string }>
}

export default async function HospitalidadPage({ searchParams }: Props) {
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
    .eq("template_key", "hospitality")
    .eq("starts_on", starts_on)
  if (role === "viewer") periodQuery = periodQuery.eq("status", "published")
  const { data: periodRows } = await periodQuery
    .order("created_at", { ascending: true })
    .limit(1)
  let period = periodRows?.[0] ?? null
  if (!period && role === "admin") {
    period = await ensureSchedulePeriod(congregationId, "hospitality", yearMonth)
  }

  let savedRows: { meeting_date: string; group_name: string | null }[] = []
  if (period) {
    const { data } = await supabase
      .from("hospitality_assignments")
      .select("meeting_date, group_name")
      .eq("period_id", period.id)
      .order("meeting_date")
    savedRows = data ?? []
  }

  const dates = getMonthDatesForWeekdays(yearMonth, [0])

  return (
    <div className="space-y-6">
      {!period && (
        <>
          <PageHeading title="Hospitalidad">
            <PeriodBar
              yearMonth={yearMonth}
              period={period ?? null}
              role={role}
              congregationId={congregationId}
              templateKey="hospitality"
              basePath="/dashboard/hospitalidad"
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
        <HospitalityEditor
          key={period.id}
          period={period}
          dates={dates}
          savedRows={savedRows}
          role={role}
          congregationId={congregationId}
          yearMonth={yearMonth}
          basePath="/dashboard/hospitalidad"
        />
      )}
    </div>
  )
}
