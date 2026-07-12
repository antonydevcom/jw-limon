"use client"

import { useEffect, useRef, useState, useTransition, type ReactNode } from "react"
import { useRouter } from "next/navigation"
import { PageHeading } from "@/components/layout/PageHeading"
import { FormatCell } from "@/features/schedule-templates/components/FormatCell"
import { PeriodBar } from "@/features/schedule-templates/components/PeriodBar"
import { formatFullDateSpanish } from "@/shared/utils/dates"
import { saveWeekendRows } from "../actions/weekend"
import { publishPeriod } from "@/features/schedule-templates/actions/periods"
import { Button } from "@/components/ui/Button"
import type { Database } from "@/types/database.types"

type Period = Database["public"]["Tables"]["schedule_periods"]["Row"]
type SavedRow = Database["public"]["Tables"]["weekend_meetings"]["Row"]

interface WeekendRow {
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

interface WeekendEditorProps {
  period: Period
  dates: string[]
  savedRows: SavedRow[]
  role: "admin" | "viewer"
  congregationId: string
  basePath: string
  yearMonth: string
}

export function WeekendEditor({
  period,
  dates,
  savedRows,
  role,
  congregationId,
  basePath,
  yearMonth,
}: WeekendEditorProps) {
  const isAdmin = role === "admin"
  const router = useRouter()

  const [rows, setRows] = useState<WeekendRow[]>(() =>
    dates.map((d) => {
      const saved = savedRows.find((r) => r.meeting_date === d)
      return {
        meeting_date: d,
        chairman_name: saved?.chairman_name ?? "",
        opening_prayer_name: saved?.opening_prayer_name ?? "",
        speaker_name: saved?.speaker_name ?? "",
        speaker_congregation: saved?.speaker_congregation ?? "",
        outline_title: saved?.outline_title ?? "",
        song_number: saved?.song_number ?? "",
        wt_reader_name: saved?.wt_reader_name ?? "",
        wt_conductor_name: saved?.wt_conductor_name ?? "",
        hospitality_group_name: saved?.hospitality_group_name ?? "",
      }
    }),
  )

  const [dirtyVersion, setDirtyVersion] = useState(0)
  const [showErrors, setShowErrors] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [publishPending, startPublishTransition] = useTransition()
  const rowsRef = useRef(rows)

  useEffect(() => {
    rowsRef.current = rows
  }, [rows])

  useEffect(() => {
    if (!isAdmin || dirtyVersion === 0 || period.status === "published") return
    const timer = setTimeout(async () => {
      await saveWeekendRows(period.id, congregationId, rowsRef.current)
    }, 1000)
    return () => clearTimeout(timer)
  }, [congregationId, dirtyVersion, isAdmin, period.id, period.status])

  function updateField(
    date: string,
    field: keyof Omit<WeekendRow, "meeting_date">,
    value: string,
  ) {
    setDirtyVersion((version) => version + 1)
    const nextRows = rowsRef.current.map((r) =>
        r.meeting_date === date ? { ...r, [field]: value } : r,
    )
    rowsRef.current = nextRows
    setRows(nextRows)
  }

  function isRowComplete(row: WeekendRow): boolean {
    return [
      row.chairman_name,
      row.opening_prayer_name,
      row.speaker_name,
      row.speaker_congregation,
      row.outline_title,
      row.song_number,
      row.wt_reader_name,
      row.wt_conductor_name,
      row.hospitality_group_name,
    ].every((v) => v.trim() !== "")
  }

  function handlePublish() {
    if (!rows.every(isRowComplete)) {
      setShowErrors(true)
      setShowConfirm(true)
      return
    }
    doPublish()
  }

  function doPublish() {
    setShowConfirm(false)
    startPublishTransition(async () => {
      const saveResult = await saveWeekendRows(period.id, congregationId, rowsRef.current)
      if (saveResult.error) return
      const publishResult = await publishPeriod(period.id, basePath)
      if (!publishResult.error) router.refresh()
    })
  }

  function handleSavePublished() {
    startPublishTransition(async () => {
      const saveResult = await saveWeekendRows(period.id, congregationId, rowsRef.current)
      if (!saveResult.error) router.refresh()
    })
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

  return (
    <div className="space-y-6">
      {confirmDialog}
      <PageHeading title="Conferencias">
        <PeriodBar
          yearMonth={yearMonth}
          period={period}
          role={role}
          congregationId={congregationId}
          templateKey="weekend"
          basePath={basePath}
          hidePublish
          embedded
        />
        {publishControls}
      </PageHeading>

      {rows.map((row) => (
        <div
          key={row.meeting_date}
          className="app-card"
        >
          <div className="border-b border-[var(--border)] bg-[var(--surface)] px-4 py-3 sm:px-5">
            <p className="text-base font-bold text-[var(--foreground)] sm:text-lg">
              {formatFullDateSpanish(row.meeting_date)}
            </p>
          </div>

          <div className="space-y-3 px-4 py-4 sm:px-5 sm:py-5">
            <div className="grid gap-3 lg:grid-cols-2 lg:gap-x-10">
              <WeekendField label="Presidente:">
                <FormatCell
                  value={row.chairman_name}
                  onChange={(v) =>
                    updateField(row.meeting_date, "chairman_name", v)
                  }
                  readOnly={!isAdmin}
                  placeholder="Nombre..."
                  invalid={showErrors && !row.chairman_name.trim()}
                />
              </WeekendField>

              <WeekendField label="Oración inicial:">
                <FormatCell
                  value={row.opening_prayer_name}
                  onChange={(v) =>
                    updateField(row.meeting_date, "opening_prayer_name", v)
                  }
                  readOnly={!isAdmin}
                  placeholder="Nombre..."
                  invalid={showErrors && !row.opening_prayer_name.trim()}
                />
              </WeekendField>
            </div>

            <WeekendField label="Discursante:" wide>
              <div className="grid items-baseline gap-x-1 gap-y-1 sm:grid-cols-[minmax(10rem,0.55fr)_auto_minmax(12rem,0.45fr)_auto]">
                <FormatCell
                  value={row.speaker_name}
                  onChange={(v) =>
                    updateField(row.meeting_date, "speaker_name", v)
                  }
                  readOnly={!isAdmin}
                  placeholder="Nombre..."
                  invalid={showErrors && !row.speaker_name.trim()}
                />
                <span className="text-sm text-[var(--muted)]">(</span>
                <FormatCell
                  value={row.speaker_congregation}
                  onChange={(v) =>
                    updateField(row.meeting_date, "speaker_congregation", v)
                  }
                  readOnly={!isAdmin}
                  placeholder="Congregación"
                  invalid={showErrors && !row.speaker_congregation.trim()}
                />
                <span className="text-sm text-[var(--muted)]">)</span>
              </div>
            </WeekendField>

            <WeekendField label="Discurso:" wide indent>
              <FormatCell
                value={row.outline_title}
                onChange={(v) =>
                  updateField(row.meeting_date, "outline_title", v)
                }
                readOnly={!isAdmin}
                placeholder="Título del discurso..."
                invalid={showErrors && !row.outline_title.trim()}
              />
            </WeekendField>

            <div className="grid gap-3 lg:grid-cols-2 lg:gap-x-10">
              <WeekendField label="Canción:" indent>
                <FormatCell
                  value={row.song_number}
                  onChange={(v) =>
                    updateField(row.meeting_date, "song_number", v)
                  }
                  readOnly={!isAdmin}
                  placeholder="Núm."
                  className="w-24"
                  invalid={showErrors && !row.song_number.trim()}
                />
              </WeekendField>

              <WeekendField label="Lector:" indent>
                <FormatCell
                  value={row.wt_reader_name}
                  onChange={(v) =>
                    updateField(row.meeting_date, "wt_reader_name", v)
                  }
                  readOnly={!isAdmin}
                  placeholder="Nombre..."
                  invalid={showErrors && !row.wt_reader_name.trim()}
                />
              </WeekendField>
            </div>

            <div className="grid gap-3 lg:grid-cols-2 lg:gap-x-10">
              <WeekendField label="Conductor:">
                <FormatCell
                  value={row.wt_conductor_name}
                  onChange={(v) =>
                    updateField(row.meeting_date, "wt_conductor_name", v)
                  }
                  readOnly={!isAdmin}
                  placeholder="Nombre..."
                  invalid={showErrors && !row.wt_conductor_name.trim()}
                />
              </WeekendField>

              <WeekendField label="Hospitalidad:">
                <FormatCell
                  value={row.hospitality_group_name}
                  onChange={(v) =>
                    updateField(row.meeting_date, "hospitality_group_name", v)
                  }
                  readOnly={!isAdmin}
                  placeholder="Grupo..."
                  invalid={showErrors && !row.hospitality_group_name.trim()}
                />
              </WeekendField>
            </div>
          </div>
        </div>
      ))}

    </div>
  )
}

function WeekendField({
  label,
  children,
  wide = false,
  indent = false,
}: {
  label: string
  children: ReactNode
  wide?: boolean
  indent?: boolean
}) {
  return (
    <div
      className={
        wide
          ? `grid gap-1 sm:grid-cols-[8.25rem_minmax(0,1fr)] sm:items-baseline ${indent ? "sm:pl-9" : ""}`
          : `grid gap-1 sm:grid-cols-[8.25rem_minmax(0,1fr)] sm:items-baseline ${indent ? "sm:pl-9" : ""}`
      }
    >
      <span className="text-sm font-bold text-[var(--foreground)]">
        {label}
      </span>
      <div className="min-w-0 text-sm text-[var(--foreground)]">{children}</div>
    </div>
  )
}
