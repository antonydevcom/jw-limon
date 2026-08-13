"use client"

import { useEffect, useRef, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Gem, HeartHandshake, Wheat, type LucideIcon } from "lucide-react"
import { PageHeading } from "@/components/layout/PageHeading"
import { FormatCell } from "@/features/schedule-templates/components/FormatCell"
import { PeriodBar } from "@/features/schedule-templates/components/PeriodBar"
import { formatFullDateSpanish } from "@/shared/utils/dates"
import { saveMidweekWeek } from "../actions/midweek"
import { publishPeriod } from "@/features/schedule-templates/actions/periods"
import { Button } from "@/components/ui/Button"
import type { Database } from "@/types/database.types"

type Period = Database["public"]["Tables"]["schedule_periods"]["Row"]
type Meeting = Database["public"]["Tables"]["midweek_meetings"]["Row"]
type Part = Database["public"]["Tables"]["midweek_parts"]["Row"]
type Section = Database["public"]["Enums"]["midweek_section"]

type PartState = {
  section: Section
  sort_order: number
  title: string
  duration_minutes: number | null
  assigned_name: string
  assistant_name: string
}

type WeekState = {
  meeting_date: string
  chairman_name: string
  opening_song: string
  opening_prayer_name: string
  mid_song: string
  closing_song: string
  closing_prayer_name: string
  parts: PartState[]
}

interface MidweekEditorProps {
  period: Period
  dates: string[]
  savedMeetings: Meeting[]
  savedParts: Part[]
  role: "admin" | "viewer"
  congregationId: string
  basePath: string
  yearMonth: string
}

const SECTION_ORDER: Section[] = ["treasures", "ministry", "living"]

const SECTION_HEADERS: Record<Section, string> = {
  treasures: "TESOROS DE LA BIBLIA",
  ministry: "SEAMOS MEJORES MAESTROS",
  living: "NUESTRA VIDA CRISTIANA",
}

const SECTION_COLOR: Record<Section, string> = {
  treasures: "var(--section-treasures)",
  ministry: "var(--section-ministry)",
  living: "var(--section-living)",
}

const SECTION_ICON_COLOR: Record<Section, string> = {
  treasures: "var(--section-treasures-icon)",
  ministry: "var(--section-ministry-icon)",
  living: "var(--section-living-icon)",
}

const SECTION_ICONS: Record<Section, LucideIcon> = {
  treasures: Gem,
  ministry: Wheat,
  living: HeartHandshake,
}

function sectionOrder(s: Section): number {
  return SECTION_ORDER.indexOf(s)
}

function partContentScore(part: PartState): number {
  return [
    part.title,
    part.assigned_name,
    part.assistant_name,
    part.duration_minutes == null ? "" : String(part.duration_minutes),
  ].reduce((score, value) => score + (value.trim() ? 1 : 0), 0)
}

function dedupeParts(parts: PartState[]): PartState[] {
  const byPosition = new Map<string, PartState>()

  for (const part of parts) {
    const key = `${part.section}:${part.sort_order}`
    const existing = byPosition.get(key)

    if (!existing || partContentScore(part) > partContentScore(existing)) {
      byPosition.set(key, part)
    }
  }

  return [...byPosition.values()].sort((a, b) =>
    a.section === b.section
      ? a.sort_order - b.sort_order
      : sectionOrder(a.section) - sectionOrder(b.section),
  )
}

function defaultParts(): PartState[] {
  return [
    { section: "treasures", sort_order: 1, title: "", duration_minutes: 10, assigned_name: "", assistant_name: "" },
    { section: "treasures", sort_order: 2, title: "Busquemos perlas escondidas", duration_minutes: 10, assigned_name: "", assistant_name: "" },
    { section: "treasures", sort_order: 3, title: "Lectura de la Biblia", duration_minutes: 4, assigned_name: "", assistant_name: "" },
    { section: "ministry", sort_order: 1, title: "", duration_minutes: 3, assigned_name: "", assistant_name: "" },
    { section: "ministry", sort_order: 2, title: "", duration_minutes: 4, assigned_name: "", assistant_name: "" },
    { section: "ministry", sort_order: 3, title: "", duration_minutes: 5, assigned_name: "", assistant_name: "" },
    { section: "living", sort_order: 1, title: "", duration_minutes: 15, assigned_name: "", assistant_name: "" },
    { section: "living", sort_order: 2, title: "EBC", duration_minutes: 30, assigned_name: "", assistant_name: "" },
  ]
}

function buildWeek(
  date: string,
  meeting: Meeting | undefined,
  parts: Part[],
): WeekState {
  const relevant = parts.filter((p) => p.meeting_id === meeting?.id)
  const partStates: PartState[] =
    relevant.length > 0
      ? dedupeParts(
          relevant.map((p) => ({
            section: p.section,
            sort_order: p.sort_order,
            title: p.title ?? "",
            duration_minutes: p.duration_minutes,
            assigned_name: p.assigned_name ?? "",
            assistant_name: p.assistant_name ?? "",
          })),
        )
      : defaultParts()
  return {
    meeting_date: date,
    chairman_name: meeting?.chairman_name ?? "",
    opening_song: meeting?.opening_song ?? "",
    opening_prayer_name: meeting?.opening_prayer_name ?? "",
    mid_song: meeting?.mid_song ?? "",
    closing_song: meeting?.closing_song ?? "",
    closing_prayer_name: meeting?.closing_prayer_name ?? "",
    parts: partStates,
  }
}

export function MidweekEditor({
  period,
  dates,
  savedMeetings,
  savedParts,
  role,
  congregationId,
  basePath,
  yearMonth,
}: MidweekEditorProps) {
  const isAdmin = role === "admin"
  const router = useRouter()

  const [weeks, setWeeks] = useState<WeekState[]>(() =>
    dates.map((d) =>
      buildWeek(
        d,
        savedMeetings.find((m) => m.meeting_date === d),
        savedParts,
      ),
    ),
  )
  const [currentIndex, setCurrentIndex] = useState(0)
  const [dirtyDates, setDirtyDates] = useState<Set<string>>(new Set())
  const [showErrors, setShowErrors] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [publishPending, startPublishTransition] = useTransition()
  const weeksRef = useRef(weeks)

  useEffect(() => {
    weeksRef.current = weeks
  }, [weeks])

  const markDirty = (date: string) =>
    setDirtyDates((prev) => new Set(prev).add(date))

  function updateWeeks(update: (current: WeekState[]) => WeekState[]) {
    const next = update(weeksRef.current)
    weeksRef.current = next
    setWeeks(next)
  }

  function persistWeek(w: WeekState) {
    return saveMidweekWeek(
      period.id,
      congregationId,
      {
        meeting_date: w.meeting_date,
        chairman_name: w.chairman_name,
        opening_song: w.opening_song,
        opening_prayer_name: w.opening_prayer_name,
        mid_song: w.mid_song,
        closing_song: w.closing_song,
        closing_prayer_name: w.closing_prayer_name,
      },
      w.parts,
    )
  }

  // Debounced autosave: persist touched weeks ~1s after the last edit.
  useEffect(() => {
    if (!isAdmin || dirtyDates.size === 0 || period.status === "published") return
    const timer = setTimeout(async () => {
      const dates = [...dirtyDates]
      setDirtyDates(new Set())
      for (const date of dates) {
        const w = weeksRef.current.find((x) => x.meeting_date === date)
        if (w) await persistWeek(w)
      }
    }, 1000)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dirtyDates, isAdmin])

  function isWeekComplete(w: WeekState): boolean {
    const meetingOk = [
      w.chairman_name, w.opening_song, w.opening_prayer_name,
      w.mid_song, w.closing_song, w.closing_prayer_name,
    ].every((v) => v.trim() !== "")
    const partsOk = w.parts.every(
      (p) => p.title.trim() !== "" && p.assigned_name.trim() !== "",
    )
    return meetingOk && partsOk
  }

  function handlePublish() {
    if (!weeks.every(isWeekComplete)) {
      setShowErrors(true)
      setShowConfirm(true)
      return
    }
    doPublish()
  }

  function doPublish() {
    setShowConfirm(false)
    startPublishTransition(async () => {
      const saveResults = await Promise.all(weeksRef.current.map(persistWeek))
      if (saveResults.some((result) => result.error)) return
      setDirtyDates(new Set())
      const publishResult = await publishPeriod(period.id, basePath)
      if (!publishResult.error) router.refresh()
    })
  }

  function handleSavePublished() {
    startPublishTransition(async () => {
      const saveResults = await Promise.all(weeksRef.current.map(persistWeek))
      if (!saveResults.some((result) => result.error)) router.refresh()
    })
  }

  if (weeks.length === 0) {
    return (
      <p className="text-sm text-[var(--muted)]">
        No hay reuniones de martes en este mes.
      </p>
    )
  }

  const index = Math.min(currentIndex, weeks.length - 1)
  const week = weeks[index]

  function updateMeeting(
    date: string,
    field: keyof Omit<WeekState, "parts" | "meeting_date">,
    value: string,
  ) {
    markDirty(date)
    updateWeeks((prev) =>
      prev.map((w) =>
        w.meeting_date === date ? { ...w, [field]: value } : w,
      ),
    )
  }

  function updatePart(
    date: string,
    section: Section,
    sortOrder: number,
    field: keyof Omit<PartState, "section" | "sort_order" | "duration_minutes">,
    value: string,
  ) {
    markDirty(date)
    updateWeeks((prev) =>
      prev.map((w) =>
        w.meeting_date === date
          ? {
              ...w,
              parts: w.parts.map((p) =>
                p.section === section && p.sort_order === sortOrder
                  ? { ...p, [field]: value }
                  : p,
              ),
            }
          : w,
      ),
    )
  }

  function updateDuration(
    date: string,
    section: Section,
    sortOrder: number,
    value: number | null,
  ) {
    markDirty(date)
    updateWeeks((prev) =>
      prev.map((w) =>
        w.meeting_date === date
          ? {
              ...w,
              parts: w.parts.map((p) =>
                p.section === section && p.sort_order === sortOrder
                  ? { ...p, duration_minutes: value }
                  : p,
              ),
            }
          : w,
      ),
    )
  }

  function addPart(date: string, section: Section) {
    markDirty(date)
    updateWeeks((prev) =>
      prev.map((w) => {
        if (w.meeting_date !== date) return w
        const inSection = w.parts.filter((p) => p.section === section)
        const nextOrder =
          inSection.reduce((max, p) => Math.max(max, p.sort_order), 0) + 1
        const newPart: PartState = {
          section,
          sort_order: nextOrder,
          title: "",
          duration_minutes: null,
          assigned_name: "",
          assistant_name: "",
        }
        return { ...w, parts: [...w.parts, newPart] }
      }),
    )
  }

  function removePart(date: string, section: Section, sortOrder: number) {
    markDirty(date)
    updateWeeks((prev) =>
      prev.map((w) => {
        if (w.meeting_date !== date) return w
        const kept = w.parts.filter(
          (p) => !(p.section === section && p.sort_order === sortOrder),
        )
        // Re-index sort_order within the affected section (1..n).
        let counter = 0
        const reindexed = kept.map((p) =>
          p.section === section
            ? { ...p, sort_order: ++counter }
            : p,
        )
        return { ...w, parts: reindexed }
      }),
    )
  }

  function partsOf(w: WeekState, section: Section) {
    return w.parts.filter((p) => p.section === section)
  }

  /** Continuous 1..N number of a part across sections, in fixed order. */
  function displayNumber(w: WeekState, section: Section, sortOrder: number) {
    let n = 0
    for (const s of SECTION_ORDER) {
      const inSection = partsOf(w, s).sort((a, b) => a.sort_order - b.sort_order)
      for (const p of inSection) {
        n++
        if (s === section && p.sort_order === sortOrder) return n
      }
    }
    return n
  }

  const publishControls =
    isAdmin && period.status !== "archived" ? (
      <div className="mt-3 flex flex-col items-center justify-center gap-2 sm:absolute sm:right-6 sm:top-1/2 sm:mt-0 sm:-translate-y-1/2">
        {period.status === "published" ? (
          <Button onClick={handleSavePublished} disabled={publishPending}>Guardar</Button>
        ) : (
          <Button onClick={handlePublish} disabled={publishPending}>
            Publicar
          </Button>
        )}
      </div>
    ) : null

  const confirmDialog = showConfirm ? (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={() => setShowConfirm(false)}
    >
      <div
        className="app-card mx-4 max-w-sm p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="mb-1 text-sm font-semibold text-[var(--foreground)]">
          Campos sin rellenar
        </p>
        <p className="mb-5 text-sm text-[var(--muted)]">
          Hay campos marcados en rojo. ¿Aún así deseas publicar?
        </p>
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setShowConfirm(false)}>
            Cancelar
          </Button>
          <Button onClick={doPublish} disabled={publishPending}>
            Publicar
          </Button>
        </div>
      </div>
    </div>
  ) : null

  const header = (
    <PageHeading title="Reunión Semanal">
      <PeriodBar
        yearMonth={yearMonth}
        period={period}
        role={role}
        congregationId={congregationId}
        templateKey="midweek"
        basePath={basePath}
        hidePublish
        embedded
      />
      {publishControls}
    </PageHeading>
  )

  const renderCard = (week: WeekState) => (
    <div
      key={week.meeting_date}
      className="app-table-card"
    >
        <table className="w-full border-collapse text-sm">
          <tbody>
            {/* Date header + chairman */}
            <tr className="bg-[var(--surface)]">
              <td
                colSpan={2}
                className="border-b border-[var(--border)] px-3 py-2 font-semibold text-[var(--foreground)]"
              >
                {formatFullDateSpanish(week.meeting_date)}
              </td>
              <td className="border-b border-[var(--border)] px-3 py-2">
                <div className="flex items-baseline gap-2">
                  <span className="whitespace-nowrap text-xs font-semibold">
                    Presidente:
                  </span>
                  <FormatCell
                    value={week.chairman_name}
                    onChange={(v) =>
                      updateMeeting(week.meeting_date, "chairman_name", v)
                    }
                    readOnly={!isAdmin}
                    placeholder="Nombre"
                    invalid={showErrors && !week.chairman_name.trim()}
                  />
                </div>
              </td>
            </tr>

            {/* Opening song + prayer */}
            <tr>
              <td
                colSpan={2}
                className="border-b border-[var(--border)] px-3 py-2"
              >
                <div className="flex items-baseline gap-2">
                  <span className="whitespace-nowrap text-xs">Canción</span>
                  <FormatCell
                    value={week.opening_song}
                    onChange={(v) =>
                      updateMeeting(week.meeting_date, "opening_song", v)
                    }
                    readOnly={!isAdmin}
                    placeholder="#"
                    className="w-16"
                    invalid={showErrors && !week.opening_song.trim()}
                  />
                  <span className="whitespace-nowrap text-xs">y oración</span>
                </div>
              </td>
              <td className="border-b border-[var(--border)] px-3 py-2">
                <FormatCell
                  value={week.opening_prayer_name}
                  onChange={(v) =>
                    updateMeeting(week.meeting_date, "opening_prayer_name", v)
                  }
                  readOnly={!isAdmin}
                  placeholder="Oración"
                  invalid={showErrors && !week.opening_prayer_name.trim()}
                />
              </td>
            </tr>

            {/* TESOROS */}
            <SectionHeader
              label={SECTION_HEADERS.treasures}
              section="treasures"
              color={SECTION_COLOR.treasures}
            />
            {partsOf(week, "treasures").map((p) => (
              <PartRow
                key={`t-${p.sort_order}`}
                part={p}
                number={displayNumber(week, "treasures", p.sort_order)}
                isAdmin={isAdmin}
                showAssistant={false}
                showErrors={showErrors}
                onTitle={(v) =>
                  updatePart(week.meeting_date, "treasures", p.sort_order, "title", v)
                }
                onAssigned={(v) =>
                  updatePart(week.meeting_date, "treasures", p.sort_order, "assigned_name", v)
                }
                onAssistant={() => {}}
                onDuration={(v) =>
                  updateDuration(week.meeting_date, "treasures", p.sort_order, v)
                }
                onRemove={() =>
                  removePart(week.meeting_date, "treasures", p.sort_order)
                }
              />
            ))}
            {isAdmin && (
              <AddPartRow onClick={() => addPart(week.meeting_date, "treasures")} />
            )}

            {/* MINISTERIO */}
            <SectionHeader
              label={SECTION_HEADERS.ministry}
              section="ministry"
              color={SECTION_COLOR.ministry}
            />
            {partsOf(week, "ministry").map((p) => (
              <PartRow
                key={`m-${p.sort_order}`}
                part={p}
                number={displayNumber(week, "ministry", p.sort_order)}
                isAdmin={isAdmin}
                showAssistant
                showErrors={showErrors}
                onTitle={(v) =>
                  updatePart(week.meeting_date, "ministry", p.sort_order, "title", v)
                }
                onAssigned={(v) =>
                  updatePart(week.meeting_date, "ministry", p.sort_order, "assigned_name", v)
                }
                onAssistant={(v) =>
                  updatePart(week.meeting_date, "ministry", p.sort_order, "assistant_name", v)
                }
                onDuration={(v) =>
                  updateDuration(week.meeting_date, "ministry", p.sort_order, v)
                }
                onRemove={() =>
                  removePart(week.meeting_date, "ministry", p.sort_order)
                }
              />
            ))}
            {isAdmin && (
              <AddPartRow onClick={() => addPart(week.meeting_date, "ministry")} />
            )}

            {/* NUESTRA VIDA CRISTIANA */}
            <SectionHeader
              label={SECTION_HEADERS.living}
              section="living"
              color={SECTION_COLOR.living}
            />
            <tr>
              <td
                colSpan={2}
                className="border-b border-[var(--border)] px-3 py-2"
              >
                <div className="flex items-baseline gap-2">
                  <span className="whitespace-nowrap text-xs">Canción</span>
                  <FormatCell
                    value={week.mid_song}
                    onChange={(v) =>
                      updateMeeting(week.meeting_date, "mid_song", v)
                    }
                    readOnly={!isAdmin}
                    placeholder="#"
                    className="w-16"
                    invalid={showErrors && !week.mid_song.trim()}
                  />
                </div>
              </td>
              <td className="border-b border-[var(--border)]" />
            </tr>
            {partsOf(week, "living").map((p) => (
              <PartRow
                key={`l-${p.sort_order}`}
                part={p}
                number={displayNumber(week, "living", p.sort_order)}
                isAdmin={isAdmin}
                showAssistant
                assistantLabel="Lector:"
                showErrors={showErrors}
                onTitle={(v) =>
                  updatePart(week.meeting_date, "living", p.sort_order, "title", v)
                }
                onAssigned={(v) =>
                  updatePart(week.meeting_date, "living", p.sort_order, "assigned_name", v)
                }
                onAssistant={(v) =>
                  updatePart(week.meeting_date, "living", p.sort_order, "assistant_name", v)
                }
                onDuration={(v) =>
                  updateDuration(week.meeting_date, "living", p.sort_order, v)
                }
                onRemove={() =>
                  removePart(week.meeting_date, "living", p.sort_order)
                }
              />
            ))}
            {isAdmin && (
              <AddPartRow onClick={() => addPart(week.meeting_date, "living")} />
            )}

            {/* Conclusión */}
            <tr>
              <td
                colSpan={2}
                className="border-b border-[var(--border)] px-3 py-2 text-[var(--muted)]"
              >
                Palabras de conclusión
              </td>
              <td className="border-b border-[var(--border)] px-3 py-2 text-[var(--muted)]">
                A cargo del presidente
              </td>
            </tr>

            {/* Closing song + prayer */}
            <tr>
              <td colSpan={2} className="px-3 py-2">
                <div className="flex items-baseline gap-2">
                  <span className="whitespace-nowrap text-xs">Canción</span>
                  <FormatCell
                    value={week.closing_song}
                    onChange={(v) =>
                      updateMeeting(week.meeting_date, "closing_song", v)
                    }
                    readOnly={!isAdmin}
                    placeholder="#"
                    className="w-16"
                    invalid={showErrors && !week.closing_song.trim()}
                  />
                  <span className="whitespace-nowrap text-xs">y oración</span>
                </div>
              </td>
              <td className="px-3 py-2">
                <FormatCell
                  value={week.closing_prayer_name}
                  onChange={(v) =>
                    updateMeeting(week.meeting_date, "closing_prayer_name", v)
                  }
                  readOnly={!isAdmin}
                  placeholder="Oración"
                  invalid={showErrors && !week.closing_prayer_name.trim()}
                />
              </td>
            </tr>
          </tbody>
        </table>
    </div>
  )

  // Admin fills the whole month at once (changes month via PeriodBar).
  if (isAdmin) {
    return (
      <div className="space-y-6">
        {confirmDialog}
        {header}
        {weeks.map(renderCard)}
      </div>
    )
  }

  // Viewer browses one week at a time.
  return (
    <div className="space-y-6">
      {confirmDialog}
      {header}
      <div className="flex items-center justify-center gap-3">
        <button
          onClick={() => setCurrentIndex(Math.max(0, index - 1))}
          disabled={index === 0}
          className="flex size-10 items-center justify-center rounded-full text-2xl text-[var(--primary)] hover:bg-[var(--surface-muted)] disabled:opacity-30 disabled:hover:bg-transparent"
          aria-label="Semana anterior"
        >
          ‹
        </button>
        <span className="min-w-[14rem] text-center text-sm font-semibold text-[var(--primary-strong)]">
          {formatFullDateSpanish(week.meeting_date)}
        </span>
        <button
          onClick={() => setCurrentIndex(Math.min(weeks.length - 1, index + 1))}
          disabled={index === weeks.length - 1}
          className="flex size-10 items-center justify-center rounded-full text-2xl text-[var(--primary)] hover:bg-[var(--surface-muted)] disabled:opacity-30 disabled:hover:bg-transparent"
          aria-label="Semana siguiente"
        >
          ›
        </button>
      </div>
      {renderCard(week)}
    </div>
  )
}

function SectionHeader({
  label,
  color,
  section,
}: {
  label: string
  color: string
  section: Section
}) {
  const Icon = SECTION_ICONS[section]

  return (
    <tr style={{ backgroundColor: color }}>
      <td
        colSpan={3}
        className="border-b border-[var(--border)] px-3 py-2"
      >
        <div className="flex items-center gap-3">
          <span
            className="flex size-8 items-center justify-center rounded-md text-white"
            style={{ backgroundColor: SECTION_ICON_COLOR[section] }}
          >
            <Icon className="size-4 stroke-[1.9]" aria-hidden="true" />
          </span>
          <span
            className="text-base font-extrabold uppercase leading-none tracking-wide text-white sm:text-lg"
          >
            {label}
          </span>
        </div>
      </td>
    </tr>
  )
}

function AddPartRow({ onClick }: { onClick: () => void }) {
  return (
    <tr className="border-b border-[var(--border)]">
      <td colSpan={3} className="px-3 py-1.5">
        <button
          onClick={onClick}
          className="text-xs font-medium text-[var(--foreground)] hover:underline"
        >
          + Agregar parte
        </button>
      </td>
    </tr>
  )
}

interface PartRowProps {
  part: PartState
  number: number
  isAdmin: boolean
  showAssistant: boolean
  assistantLabel?: string
  showErrors: boolean
  onTitle: (v: string) => void
  onAssigned: (v: string) => void
  onAssistant: (v: string) => void
  onDuration: (v: number | null) => void
  onRemove: () => void
}

function PartRow({
  part,
  number,
  isAdmin,
  showAssistant,
  assistantLabel,
  showErrors,
  onTitle,
  onAssigned,
  onAssistant,
  onDuration,
  onRemove,
}: PartRowProps) {
  return (
    <tr className="border-b border-[var(--border)]">
      <td className="w-16 border-r border-[var(--border)] px-3 py-1.5 text-center text-[var(--muted)]">
        {isAdmin ? (
          <div className="flex items-baseline justify-center gap-0.5">
            <input
              type="number"
              inputMode="numeric"
              min={0}
              value={part.duration_minutes ?? ""}
              onChange={(e) =>
                onDuration(e.target.value === "" ? null : Number(e.target.value))
              }
              placeholder="–"
              aria-label="Minutos"
              className="w-7 rounded bg-transparent text-right text-sm focus:outline focus:outline-1 focus:outline-[var(--primary)] [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
            />
            <span className="text-xs">min</span>
          </div>
        ) : part.duration_minutes != null ? (
          `${part.duration_minutes} min`
        ) : (
          ""
        )}
      </td>
      <td className="border-r border-[var(--border)] px-3 py-1.5">
        <div className="flex items-baseline gap-1">
          <span className="text-[var(--muted)]">{number}.-</span>
          <FormatCell
            value={part.title}
            onChange={onTitle}
            readOnly={!isAdmin}
            placeholder="Título de la parte"
            invalid={showErrors && !part.title.trim()}
          />
        </div>
      </td>
      <td className="px-3 py-1.5">
        <div className="flex items-baseline gap-1">
          <FormatCell
            value={part.assigned_name}
            onChange={onAssigned}
            readOnly={!isAdmin}
            placeholder="Asignado"
            invalid={showErrors && !part.assigned_name.trim()}
          />
          {showAssistant && (
            <>
              <span className="whitespace-nowrap text-xs text-[var(--muted)]">
                {assistantLabel ?? "/"}
              </span>
              <FormatCell
                value={part.assistant_name}
                onChange={onAssistant}
                readOnly={!isAdmin}
                placeholder="Ayudante"
              />
            </>
          )}
          {isAdmin && (
            <button
              onClick={onRemove}
              className="ml-auto shrink-0 px-1 text-[var(--muted)] hover:text-[var(--danger)]"
              aria-label="Quitar parte"
              title="Quitar parte"
            >
              ✕
            </button>
          )}
        </div>
      </td>
    </tr>
  )
}
