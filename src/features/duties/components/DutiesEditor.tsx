"use client"

import { useEffect, useRef, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { PageHeading } from "@/components/layout/PageHeading"
import { FormatCell } from "@/features/schedule-templates/components/FormatCell"
import { PeriodBar } from "@/features/schedule-templates/components/PeriodBar"
import { Button } from "@/components/ui/Button"
import { formatShortDateSpanish } from "@/shared/utils/dates"
import { saveDutyRows } from "../actions/duties"
import { updatePeriodNotes } from "@/features/schedule-templates/actions/periods"
import { publishPeriod } from "@/features/schedule-templates/actions/periods"
import type { Database } from "@/types/database.types"

type Period = Database["public"]["Tables"]["schedule_periods"]["Row"]

type DutyRowState = {
  meeting_date: string
  entrance_name: string
  auditorium_name: string
  microphone_1_name: string
  microphone_2_name: string
}

export interface DutiesEditorProps {
  period: Period
  dates: string[]
  savedRows: Array<{
    meeting_date: string
    entrance_name: string | null
    auditorium_name: string | null
    microphone_1_name: string | null
    microphone_2_name: string | null
  }>
  role: "admin" | "viewer"
  congregationId: string
  yearMonth: string
  basePath: string
}

export function DutiesEditor({
  period,
  dates,
  savedRows,
  role,
  congregationId,
  yearMonth,
  basePath,
}: DutiesEditorProps) {
  const isAdmin = role === "admin"
  const router = useRouter()

  const [rows, setRows] = useState<DutyRowState[]>(() =>
    dates.map((d) => {
      const saved = savedRows.find((r) => r.meeting_date === d)
      return {
        meeting_date: d,
        entrance_name: saved?.entrance_name ?? "",
        auditorium_name: saved?.auditorium_name ?? "",
        microphone_1_name: saved?.microphone_1_name ?? "",
        microphone_2_name: saved?.microphone_2_name ?? "",
      }
    }),
  )
  const [notes, setNotes] = useState(period.notes ?? "")
  const [dirtyVersion, setDirtyVersion] = useState(0)
  const [showErrors, setShowErrors] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [publishPending, startPublishTransition] = useTransition()
  const rowsRef = useRef(rows)
  const notesRef = useRef(notes)

  useEffect(() => {
    rowsRef.current = rows
  }, [rows])

  useEffect(() => {
    notesRef.current = notes
  }, [notes])

  useEffect(() => {
    if (!isAdmin || dirtyVersion === 0 || period.status === "published") return
    const timer = setTimeout(async () => {
      await Promise.all([
        saveDutyRows(period.id, congregationId, rowsRef.current),
        updatePeriodNotes(
          period.id,
          notesRef.current,
          "/dashboard/acomodadores",
        ),
      ])
    }, 1000)
    return () => clearTimeout(timer)
  }, [congregationId, dirtyVersion, isAdmin, period.id, period.status])

  function isComplete() {
    return rows.every(
      (r) =>
        r.entrance_name.trim() !== "" &&
        r.auditorium_name.trim() !== "" &&
        r.microphone_1_name.trim() !== "" &&
        r.microphone_2_name.trim() !== "",
    )
  }

  function updateField(
    date: string,
    field: keyof Omit<DutyRowState, "meeting_date">,
    value: string,
  ) {
    setDirtyVersion((version) => version + 1)
    const nextRows = rowsRef.current.map((r) =>
        r.meeting_date === date ? { ...r, [field]: value } : r,
    )
    rowsRef.current = nextRows
    setRows(nextRows)
  }

  function handlePublish() {
    if (!isComplete()) {
      setShowErrors(true)
      setShowConfirm(true)
      return
    }
    doPublish()
  }

  function doPublish() {
    setShowConfirm(false)
    startPublishTransition(async () => {
      const [rowsResult, notesResult] = await Promise.all([
        saveDutyRows(period.id, congregationId, rowsRef.current),
        updatePeriodNotes(period.id, notesRef.current, basePath),
      ])
      if (rowsResult.error || notesResult.error) return
      await publishPeriod(period.id, basePath)
      router.refresh()
    })
  }

  function handleSavePublished() {
    startPublishTransition(async () => {
      const [rowsResult, notesResult] = await Promise.all([
        saveDutyRows(period.id, congregationId, rowsRef.current),
        updatePeriodNotes(period.id, notesRef.current, basePath),
      ])
      if (!rowsResult.error && !notesResult.error) router.refresh()
    })
  }

  const publishControls = isAdmin && period.status !== "archived" ? (
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
    <PageHeading title="Acomodadores y micrófonos">
      <PeriodBar
        yearMonth={yearMonth}
        period={period}
        role={role}
        congregationId={congregationId}
        templateKey="duties"
        basePath={basePath}
        hidePublish
        embedded
      />
      {publishControls}
    </PageHeading>
  )

  return (
    <div className="space-y-6">
      {confirmDialog}
      {header}
      <div className="app-table-card">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-[var(--surface)] text-[var(--foreground)]">
              <th className="border border-[var(--border)] px-3 py-1.5" />
              <th
                colSpan={2}
                className="border border-[var(--border)] px-3 py-1.5 text-center font-semibold"
              >
                Acomodadores
              </th>
              <th
                colSpan={2}
                className="border border-[var(--border)] px-3 py-1.5 text-center font-semibold"
              >
                Micrófonos
              </th>
            </tr>

            <tr className="bg-[var(--surface)] text-[var(--muted)]">
              <th className="border border-[var(--border)] px-3 py-1.5 text-left font-medium" />
              <th className="border border-[var(--border)] px-3 py-1.5 text-left font-medium">
                De entrada
              </th>
              <th className="border border-[var(--border)] px-3 py-1.5 text-left font-medium">
                De auditorio
              </th>
              <th className="border border-[var(--border)] px-3 py-1.5 text-left font-medium">
                Mic. 1
              </th>
              <th className="border border-[var(--border)] px-3 py-1.5 text-left font-medium">
                Mic. 2
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={row.meeting_date}
                className="border-b border-[var(--border)] last:border-b-0"
              >
                <td className="w-32 whitespace-nowrap border-r border-[var(--border)] px-3 py-2 text-[var(--muted)]">
                  {formatShortDateSpanish(row.meeting_date)}
                </td>
                <td className="border-r border-[var(--border)] px-2 py-1.5">
                  <FormatCell
                    value={row.entrance_name}
                    onChange={(v) =>
                      updateField(row.meeting_date, "entrance_name", v)
                    }
                    readOnly={!isAdmin}
                    placeholder="Nombre..."
                    invalid={showErrors && !row.entrance_name.trim()}
                  />
                </td>
                <td className="border-r border-[var(--border)] px-2 py-1.5">
                  <FormatCell
                    value={row.auditorium_name}
                    onChange={(v) =>
                      updateField(row.meeting_date, "auditorium_name", v)
                    }
                    readOnly={!isAdmin}
                    placeholder="Nombre..."
                    invalid={showErrors && !row.auditorium_name.trim()}
                  />
                </td>
                <td className="border-r border-[var(--border)] px-2 py-1.5">
                  <FormatCell
                    value={row.microphone_1_name}
                    onChange={(v) =>
                      updateField(row.meeting_date, "microphone_1_name", v)
                    }
                    readOnly={!isAdmin}
                    placeholder="Nombre..."
                    invalid={showErrors && !row.microphone_1_name.trim()}
                  />
                </td>
                <td className="px-2 py-1.5">
                  <FormatCell
                    value={row.microphone_2_name}
                    onChange={(v) =>
                      updateField(row.meeting_date, "microphone_2_name", v)
                    }
                    readOnly={!isAdmin}
                    placeholder="Nombre..."
                    invalid={showErrors && !row.microphone_2_name.trim()}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="app-card p-4 sm:p-5">
        <label className="text-xs font-semibold uppercase tracking-widest text-[var(--muted)]">
          Observaciones
        </label>
        <textarea
          value={notes}
          onChange={(e) => {
            setDirtyVersion((version) => version + 1)
            notesRef.current = e.target.value
            setNotes(e.target.value)
          }}
          readOnly={!isAdmin}
          rows={4}
          placeholder={isAdmin ? "Observaciones del período..." : ""}
          className="mt-2 w-full resize-y rounded-2xl border border-[var(--border)] bg-[var(--surface-subtle)] px-4 py-3 text-sm transition-colors focus:bg-[var(--surface)] focus:outline focus:outline-2 focus:outline-[var(--primary)] read-only:cursor-default read-only:opacity-70"
        />
      </div>

    </div>
  )
}
