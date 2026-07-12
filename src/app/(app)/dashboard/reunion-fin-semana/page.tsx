import { getAppContext } from "@/shared/auth/appContext"
import { WeekendEditor } from "@/features/weekend/components/WeekendEditor"
import { PageHeading } from "@/components/layout/PageHeading"
import { PeriodBar } from "@/features/schedule-templates/components/PeriodBar"
import { ensureSchedulePeriod } from "@/features/schedule-templates/actions/ensureSchedulePeriod"
import {
  resolveYearMonth,
  getMonthStartEnd,
  getMonthDatesForWeekdays,
} from "@/shared/utils/dates"
import type { Database } from "@/types/database.types"

export const metadata = { title: "Reunión Fin de Semana" }

type WeekendRow = Database["public"]["Tables"]["weekend_meetings"]["Row"]

interface Props {
  searchParams: Promise<{ month?: string }>
}

export default async function ReunionFinSemanaPage({ searchParams }: Props) {
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
    .eq("template_key", "weekend")
    .eq("starts_on", starts_on)
  if (role === "viewer") periodQuery = periodQuery.eq("status", "published")
  const { data: periodRows } = await periodQuery
    .order("created_at", { ascending: true })
    .limit(1)
  let period = periodRows?.[0] ?? null
  if (!period && role === "admin") {
    period = await ensureSchedulePeriod(congregationId, "weekend", yearMonth)
  }

  let savedRows: WeekendRow[] = []
  if (period) {
    const { data } = await supabase
      .from("weekend_meetings")
      .select("*")
      .eq("period_id", period.id)
      .order("meeting_date")
    savedRows = data ?? []
  }

  const dates = getMonthDatesForWeekdays(yearMonth, [0])

  return (
    <div className="space-y-6">
      {!period && (
        <>
          <PageHeading title="Reunión Fin de Semana">
            <PeriodBar yearMonth={yearMonth} period={null} role={role} congregationId={congregationId} templateKey="weekend" basePath="/dashboard/reunion-fin-semana" embedded hidePublish />
          </PageHeading>
          <p className="text-sm text-[var(--muted)]">
            {role === "admin" ? "Crea el formato para este mes." : "Sin formato publicado para este mes."}
          </p>
        </>
      )}

      {period && (
        <WeekendEditor
          key={period.id}
          period={period}
          dates={dates}
          savedRows={savedRows}
          role={role}
          congregationId={congregationId}
          basePath="/dashboard/reunion-fin-semana"
          yearMonth={yearMonth}
        />
      )}
    </div>
  )
}
