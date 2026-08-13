import Link from "next/link"
import {
  ArrowRight,
  CalendarDays,
  ChevronRight,
  ClipboardList,
} from "lucide-react"
import { getAppContext } from "@/shared/auth/appContext"
import {
  formatFullDateSpanish,
  formatShortDateSpanish,
  getMonthStartEnd,
} from "@/shared/utils/dates"
import type { Database } from "@/types/database.types"

type TemplateKey = Database["public"]["Enums"]["schedule_template_key"]
type Period = Database["public"]["Tables"]["schedule_periods"]["Row"]
type MidweekMeeting = Database["public"]["Tables"]["midweek_meetings"]["Row"]
type MidweekPart = Database["public"]["Tables"]["midweek_parts"]["Row"]
type WeekendMeeting = Database["public"]["Tables"]["weekend_meetings"]["Row"]
type DutyAssignment = Database["public"]["Tables"]["duty_assignments"]["Row"]
type CleaningAssignment =
  Database["public"]["Tables"]["cleaning_assignments"]["Row"]
type HospitalityAssignment =
  Database["public"]["Tables"]["hospitality_assignments"]["Row"]
type FieldServiceRow =
  Database["public"]["Tables"]["field_service_schedule"]["Row"]
type CongregationEvent =
  Database["public"]["Tables"]["congregation_events"]["Row"]

type UpcomingMeeting = {
  date: string
  type: "midweek" | "weekend"
  title: string
  href: string
}

type MidweekAssignment = {
  id: string
  title: string
  assignedName: string | null
  assistantName: string | null
}

const midweekSectionOrder: Record<MidweekPart["section"], number> = {
  treasures: 0,
  ministry: 1,
  living: 2,
}

function toDateString(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date)
  next.setDate(next.getDate() + days)
  return next
}

function todayInMexico(): Date {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Mexico_City",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date())
  const year = Number(parts.find((p) => p.type === "year")?.value)
  const month = Number(parts.find((p) => p.type === "month")?.value)
  const day = Number(parts.find((p) => p.type === "day")?.value)
  return new Date(year, month - 1, day)
}

function getUpcomingMeetings(today: Date): UpcomingMeeting[] {
  const meetings: UpcomingMeeting[] = []

  for (let offset = 1; offset <= 14 && meetings.length < 2; offset++) {
    const date = addDays(today, offset)
    const weekday = date.getDay()
    const dateString = toDateString(date)

    if (weekday === 2) {
      meetings.push({
        date: dateString,
        type: "midweek",
        title: "Reunión Semanal",
        href: "/dashboard/reunion-semanal",
      })
    }

    if (weekday === 0) {
      meetings.push({
        date: dateString,
        type: "weekend",
        title: "Reunión Fin de Semana",
        href: "/dashboard/reunion-fin-semana",
      })
    }
  }

  return meetings
}

function getNextSevenDates(today: Date): string[] {
  return Array.from({ length: 7 }, (_, index) =>
    toDateString(addDays(today, index)),
  )
}

function getYearMonth(dateString: string): string {
  return dateString.slice(0, 7)
}

function getUniqueMonthStarts(dateStrings: string[]): string[] {
  return [
    ...new Set(
      dateStrings.map(
        (dateString) => getMonthStartEnd(getYearMonth(dateString)).starts_on,
      ),
    ),
  ]
}

function periodFor(
  periods: Period[],
  templateKey: TemplateKey,
  dateString: string,
) {
  const startsOn = getMonthStartEnd(getYearMonth(dateString)).starts_on
  return periods.find(
    (period) =>
      period.template_key === templateKey && period.starts_on === startsOn,
  )
}

function valueOrEmpty(value: string | null | undefined): string {
  return value?.trim() ? value : "Sin asignar"
}

function byDate<T extends { meeting_date?: string; service_date?: string }>(
  rows: T[],
  dateString: string,
): T | undefined {
  return rows.find(
    (row) => row.meeting_date === dateString || row.service_date === dateString,
  )
}

function namesList(values: Array<string | null | undefined>): string {
  const filled = values.filter((value): value is string => Boolean(value?.trim()))
  return filled.length > 0 ? filled.join(", ") : "Sin asignar"
}

function getMidweekAssignments(parts: MidweekPart[]): MidweekAssignment[] {
  return [...parts]
    .sort((a, b) =>
      a.section === b.section
        ? a.sort_order - b.sort_order
        : midweekSectionOrder[a.section] - midweekSectionOrder[b.section],
    )
    .map((part) => ({
      id: part.id,
      title: part.title?.trim() || `Asignación ${part.sort_order}`,
      assignedName: part.assigned_name,
      assistantName: part.assistant_name,
    }))
}

function formatServiceTime(value: string | null): string {
  const trimmed = value?.trim() ?? ""
  const match = trimmed.match(/^(\d{2}):(\d{2})$/)
  if (!match) return valueOrEmpty(value)

  const hours = Number(match[1])
  const displayHours = hours % 12 || 12
  const meridiem = hours >= 12 ? "PM" : "AM"
  return `${displayHours}:${match[2]} ${meridiem}`
}

function formatServiceHouse(value: string | null): string {
  const name = (value ?? "")
    .trim()
    .replace(/^Casa\s*:\s*/i, "")
    .replace(/^Casa\s+(de\s+la\s+|del\s+|de\s+)?/i, "")
    .trim()

  return name ? `Casa: ${name}` : "Sin asignar"
}

function formatGroupValue(value: string | null | undefined): string {
  const match = value?.match(/[1-5]/)
  return match ? `Grupo ${match[0]}` : "Sin asignar"
}

function weekdayFromDateString(dateString: string): number {
  const [year, month, day] = dateString.split("-").map(Number)
  return new Date(year, month - 1, day).getDay()
}

function formatTimeSlotLabel(slot: FieldServiceRow["time_slot"]): string {
  return slot === "morning" ? "Mañana" : "Tarde"
}

function compareServiceRows(a: FieldServiceRow, b: FieldServiceRow): number {
  if (a.time_slot !== b.time_slot) return a.time_slot === "morning" ? -1 : 1
  return (a.starts_at ?? "").localeCompare(b.starts_at ?? "")
}

function relativeDateLabel(dateString: string, todayString: string): string {
  if (dateString === todayString) return "Hoy"
  const today = new Date(`${todayString}T00:00:00`)
  const date = new Date(`${dateString}T00:00:00`)
  const diffDays = Math.round(
    (date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
  )
  if (diffDays === 1) return "Mañana"
  return formatShortDateSpanish(dateString)
}

function getPartsForMeeting(
  parts: MidweekPart[] | null,
  meeting: MidweekMeeting | undefined,
): MidweekPart[] {
  if (!meeting) return []
  return (parts ?? []).filter((part) => part.meeting_id === meeting.id)
}

export default async function DashboardPage() {
  const { supabase, congregationId, role } = await getAppContext()
  const today = todayInMexico()
  const todayString = toDateString(today)
  const upcomingMeetings = getUpcomingMeetings(today)
  const weekDates = getNextSevenDates(today)
  const lookupDates = [
    ...new Set([...upcomingMeetings.map((m) => m.date), ...weekDates]),
  ]
  const monthStarts = getUniqueMonthStarts(lookupDates)

  if (!congregationId) {
    return (
      <p className="text-sm text-[var(--muted)]">
        Aún no hay congregación configurada.
      </p>
    )
  }

  let periodsQuery = supabase
    .from("schedule_periods")
    .select("*")
    .eq("congregation_id", congregationId)
    .in("starts_on", monthStarts)

  if (role === "viewer") {
    periodsQuery = periodsQuery.eq("status", "published")
  }

  const { data: periodRows } = await periodsQuery.order("created_at", {
    ascending: true,
  })
  const periods = periodRows ?? []
  const periodIds = periods.map((period) => period.id)

  const [
    midweekResult,
    weekendResult,
    dutiesResult,
    cleaningResult,
    hospitalityResult,
    serviceResult,
    eventResult,
  ] = await Promise.all([
    periodIds.length
      ? supabase
          .from("midweek_meetings")
          .select("*")
          .in("period_id", periodIds)
          .in("meeting_date", lookupDates)
      : Promise.resolve({ data: [] as MidweekMeeting[] }),
    periodIds.length
      ? supabase
          .from("weekend_meetings")
          .select("*")
          .in("period_id", periodIds)
          .in("meeting_date", lookupDates)
      : Promise.resolve({ data: [] as WeekendMeeting[] }),
    periodIds.length
      ? supabase
          .from("duty_assignments")
          .select("*")
          .in("period_id", periodIds)
          .in("meeting_date", lookupDates)
      : Promise.resolve({ data: [] as DutyAssignment[] }),
    periodIds.length
      ? supabase
          .from("cleaning_assignments")
          .select("*")
          .in("period_id", periodIds)
          .in("service_date", lookupDates)
      : Promise.resolve({ data: [] as CleaningAssignment[] }),
    periodIds.length
      ? supabase
          .from("hospitality_assignments")
          .select("*")
          .in("period_id", periodIds)
          .in("meeting_date", lookupDates)
      : Promise.resolve({ data: [] as HospitalityAssignment[] }),
    supabase
      .from("field_service_schedule")
      .select("*")
      .eq("congregation_id", congregationId)
      .eq("is_active", true),
    supabase
      .from("congregation_events")
      .select("*")
      .eq("congregation_id", congregationId)
      .gte("event_date", todayString)
      .order("event_date", { ascending: true })
      .limit(1),
  ])

  const midweekRows = midweekResult.data ?? []
  const weekendRows = weekendResult.data ?? []
  const dutyRows = dutiesResult.data ?? []
  const cleaningRows = cleaningResult.data ?? []
  const hospitalityRows = hospitalityResult.data ?? []
  const serviceRows = serviceResult.data ?? []
  const nextCongregationEvent = (eventResult.data ?? [])[0] as
    | CongregationEvent
    | undefined
  const midweekMeetingIds = midweekRows.map((meeting) => meeting.id)
  const { data: midweekParts } = midweekMeetingIds.length
    ? await supabase
        .from("midweek_parts")
        .select("*")
        .in("meeting_id", midweekMeetingIds)
        .order("sort_order")
    : { data: [] as MidweekPart[] }

  const midweekMeeting =
    upcomingMeetings.find((meeting) => meeting.type === "midweek") ?? null
  const weekendMeeting =
    upcomingMeetings.find((meeting) => meeting.type === "weekend") ?? null
  const midweekRow = midweekMeeting
    ? byDate(midweekRows, midweekMeeting.date)
    : undefined
  const weekendRow = weekendMeeting
    ? byDate(weekendRows, weekendMeeting.date)
    : undefined
  const midweekPartsForCard = getPartsForMeeting(midweekParts ?? [], midweekRow)
  const midweekAssignments = getMidweekAssignments(midweekPartsForCard)
  const serviceByDate = weekDates.map((dateString) => ({
    dateString,
    rows: serviceRows.filter(
      (row) => row.weekday === weekdayFromDateString(dateString),
    ).sort(compareServiceRows),
  }))
  const activeServiceDays = serviceByDate.filter(({ rows }) => rows.length > 0)
  const todayServiceRows =
    serviceByDate.find((item) => item.dateString === todayString)?.rows ?? []
  const nextServiceDay =
    activeServiceDays.find(({ dateString }) => dateString >= todayString) ?? null
  return (
    <div className="mx-auto max-w-6xl space-y-5 pb-8">
      {nextCongregationEvent && <EventBanner event={nextCongregationEvent} />}

      <TodayServicePanel
        todayString={todayString}
        rows={todayServiceRows}
        nextServiceDay={nextServiceDay}
      />

      <section className="grid gap-4 lg:grid-cols-2">
        {/* Render chronological source directly: never prioritize meeting type over date. */}
        {upcomingMeetings.map((meeting) =>
          meeting.type === "midweek" ? (
            <MeetingFocusCard
              key={meeting.date}
              title={meeting.title}
              href={meeting.href}
              date={meeting.date}
              hasPeriod={Boolean(periodFor(periods, "midweek", meeting.date))}
              items={[
                ["Presidente", valueOrEmpty(midweekRow?.chairman_name)],
                ["Oración inicial", valueOrEmpty(midweekRow?.opening_prayer_name)],
                [
                  "Limpieza",
                  formatGroupValue(
                    byDate(cleaningRows, meeting.date)?.cleaning_group_name,
                  ),
                ],
              ]}
              footerItems={[
                ["Entrada", valueOrEmpty(byDate(dutyRows, meeting.date)?.entrance_name)],
                ["Auditorio", valueOrEmpty(byDate(dutyRows, meeting.date)?.auditorium_name)],
                ["Mic. 1", valueOrEmpty(byDate(dutyRows, meeting.date)?.microphone_1_name)],
                ["Mic. 2", valueOrEmpty(byDate(dutyRows, meeting.date)?.microphone_2_name)],
              ]}
              midweekAssignments={midweekAssignments}
            />
          ) : (
            <MeetingFocusCard
              key={meeting.date}
              title={meeting.title}
              href={meeting.href}
              date={meeting.date}
              hasPeriod={Boolean(periodFor(periods, "weekend", meeting.date))}
              items={[
                ["Presidente", valueOrEmpty(weekendRow?.chairman_name)],
                ["Oración inicial", valueOrEmpty(weekendRow?.opening_prayer_name)],
                [
                  "Discursante",
                  namesList([
                    weekendRow?.speaker_name,
                    weekendRow?.speaker_congregation
                      ? `(${weekendRow.speaker_congregation})`
                      : null,
                  ]),
                ],
                ["Discurso", valueOrEmpty(weekendRow?.outline_title)],
                ["Conductor", valueOrEmpty(weekendRow?.wt_conductor_name)],
                ["Lector", valueOrEmpty(weekendRow?.wt_reader_name)],
                ["Hospitalidad", formatGroupValue(byDate(hospitalityRows, meeting.date)?.group_name)],
                ["Limpieza", formatGroupValue(byDate(cleaningRows, meeting.date)?.cleaning_group_name)],
              ]}
              footerItems={[
                ["Entrada", valueOrEmpty(byDate(dutyRows, meeting.date)?.entrance_name)],
                ["Auditorio", valueOrEmpty(byDate(dutyRows, meeting.date)?.auditorium_name)],
                ["Mic. 1", valueOrEmpty(byDate(dutyRows, meeting.date)?.microphone_1_name)],
                ["Mic. 2", valueOrEmpty(byDate(dutyRows, meeting.date)?.microphone_2_name)],
              ]}
            />
          ),
        )}
      </section>
    </div>
  )
}

function EventBanner({ event }: { event: CongregationEvent }) {
  return (
    <Link
      href="/dashboard/eventos"
      className="app-card flex items-center justify-between gap-4 px-5 py-4 transition hover:border-[var(--primary)] hover:bg-[var(--primary-soft)] sm:px-6"
    >
      <div className="flex min-w-0 items-center gap-3">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-[1.25rem] bg-[var(--primary-soft)] text-[var(--primary)]">
          <CalendarDays className="size-5 stroke-[1.8]" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-wide text-[var(--muted)]">
            Próximo evento
          </p>
          <p className="truncate text-base font-bold text-[var(--foreground)]">
            {event.title}
          </p>
          <p className="text-sm font-semibold text-[var(--primary-strong)]">
            {formatShortDateSpanish(event.event_date)}
          </p>
        </div>
      </div>
      <ArrowRight
        className="size-5 shrink-0 text-[var(--primary)]"
        aria-hidden="true"
      />
    </Link>
  )
}

function TodayServicePanel({
  todayString,
  rows,
  nextServiceDay,
}: {
  todayString: string
  rows: FieldServiceRow[]
  nextServiceDay: { dateString: string; rows: FieldServiceRow[] } | null
}) {
  const displayRows = rows.length > 0 ? rows : nextServiceDay?.rows ?? []
  const dateString = rows.length > 0 ? todayString : nextServiceDay?.dateString

  return (
    <aside className="app-card p-5 sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-[var(--muted)]">
            {rows.length > 0 ? "Servicio de hoy" : "Próximo servicio"}
          </p>
          <h2 className="mt-1 text-2xl font-bold text-[var(--foreground)]">
            {dateString
              ? relativeDateLabel(dateString, todayString)
              : "Sin servicio"}
          </h2>
          {dateString && (
            <p className="mt-1 text-sm font-semibold text-[var(--primary-strong)]">
              {formatFullDateSpanish(dateString)}
            </p>
          )}
        </div>
        <span className="flex size-12 shrink-0 items-center justify-center rounded-[1.35rem] bg-[var(--primary-soft)] text-[var(--primary)]">
          <ClipboardList className="size-6 stroke-[1.8]" aria-hidden="true" />
        </span>
      </div>

      <div className="mt-5 space-y-3">
        {displayRows.map((row) => (
          <ServiceSlot key={row.id} row={row} />
        ))}
        {displayRows.length === 0 && (
          <p className="rounded-[1.25rem] bg-[var(--surface-subtle)] px-4 py-4 text-sm font-medium text-[var(--muted)]">
            Sin reuniones de servicio activas esta semana.
          </p>
        )}
      </div>
    </aside>
  )
}

function ServiceSlot({ row }: { row: FieldServiceRow }) {
  return (
    <div className="rounded-[1.35rem] border border-[var(--border)] bg-[var(--surface-subtle)] px-4 py-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-bold text-[var(--primary)]">
          {formatTimeSlotLabel(row.time_slot)}
        </p>
        <p className="rounded-full bg-[var(--surface)] px-3 py-1 text-sm font-bold text-[var(--foreground)]">
          {formatServiceTime(row.starts_at)}
        </p>
      </div>
      <p className="mt-3 text-base font-bold text-[var(--foreground)]">
        {formatServiceHouse(row.location)}
      </p>
      <p className="mt-1 text-sm font-medium text-[var(--muted)]">
        Capitán: {valueOrEmpty(row.captain_name)}
      </p>
    </div>
  )
}

function MeetingFocusCard({
  title,
  href,
  date,
  hasPeriod,
  items,
  footerItems,
  midweekAssignments = [],
}: {
  title: string
  href: string
  date: string
  hasPeriod: boolean
  items: Array<[string, string]>
  footerItems: Array<[string, string]>
  midweekAssignments?: MidweekAssignment[]
}) {
  return (
    <article className="app-card">
      <div className="flex items-start justify-between gap-3 border-b border-[var(--border)] px-4 py-4 sm:px-5">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-[var(--primary)]">
            {title}
          </p>
          <h3 className="mt-1 text-lg font-bold text-[var(--foreground)]">
            {formatFullDateSpanish(date)}
          </h3>
          {!hasPeriod && (
            <p className="mt-1 text-xs font-semibold text-[var(--muted)]">
              Sin formato del mes
            </p>
          )}
        </div>
        <Link
          href={href}
          className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[var(--primary-soft)] text-[var(--primary)] transition hover:bg-[var(--primary)] hover:text-white"
          aria-label={`Abrir ${title}`}
        >
          <ChevronRight className="size-5" aria-hidden="true" />
        </Link>
      </div>

      <div className="space-y-4 px-4 py-4 sm:px-5">
        <div className="grid gap-3 sm:grid-cols-2">
          {items.map(([label, value]) => (
            <InfoItem key={label} label={label} value={value} />
          ))}
        </div>

        {midweekAssignments.length > 0 && (
          <MidweekAssignments assignments={midweekAssignments} />
        )}
      </div>

      <div className="border-t border-[var(--border)] bg-[var(--surface-muted)] px-4 py-4 sm:px-5">
        <p className="mb-3 text-xs font-bold uppercase tracking-wide text-[var(--muted)]">
          Acomodadores
        </p>
        <div className="grid gap-2 sm:grid-cols-2">
          {footerItems.map(([label, value]) => (
            <DutyPill key={label} label={label} value={value} />
          ))}
        </div>
      </div>
    </article>
  )
}

function MidweekAssignments({
  assignments,
}: {
  assignments: MidweekAssignment[]
}) {
  return (
    <div className="space-y-3">
      <p className="text-xs font-bold uppercase tracking-wide text-[var(--muted)]">
        Asignaciones
      </p>
      <ul className="space-y-3">
        {assignments.flatMap((assignment) => {
          const isBibleStudy = /\bebc\b|estudio bíblico/i.test(assignment.title)
          const items = [
            {
              key: `${assignment.id}-assigned`,
              label: isBibleStudy ? `${assignment.title} · Conductor` : assignment.title,
              value: assignment.assignedName,
            },
          ]

          if (isBibleStudy && assignment.assistantName?.trim()) {
            items.push({
              key: `${assignment.id}-reader`,
              label: `${assignment.title} · Lector`,
              value: assignment.assistantName,
            })
          }

          return items.map((item) => (
            <li key={item.key} className="rounded-2xl bg-[var(--surface-subtle)] px-3 py-3">
              <p className="text-[0.68rem] font-bold uppercase tracking-wide text-[var(--muted)]">
                {item.label}
              </p>
              <p className="mt-1 text-sm font-semibold text-[var(--foreground)]">
                {valueOrEmpty(item.value)}
              </p>
            </li>
          ))
        })}
      </ul>
    </div>
  )
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-2xl bg-[var(--surface-subtle)] px-3 py-3">
      <p className="text-xs font-bold uppercase tracking-wide text-[var(--muted)]">
        {label}
      </p>
      <p className="mt-1 break-words text-sm font-semibold text-[var(--foreground)]">
        {value}
      </p>
    </div>
  )
}

function DutyPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center gap-2 rounded-full bg-[var(--surface)] px-3 py-2">
      <span className="size-2 rounded-full bg-[var(--primary)]" />
      <span className="text-xs font-bold text-[var(--muted)]">{label}</span>
      <span className="min-w-0 flex-1 truncate text-right text-xs font-semibold text-[var(--foreground)]">
        {value}
      </span>
    </div>
  )
}
