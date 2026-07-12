"use client"

import { useEffect, useRef, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { PageHeading } from "@/components/layout/PageHeading"
import { PeriodBar } from "@/features/schedule-templates/components/PeriodBar"
import {
  GroupNumberField,
  normalizeGroupNumber,
} from "@/features/schedule-templates/components/GroupNumberField"
import { Button } from "@/components/ui/Button"
import { formatShortDateSpanish } from "@/shared/utils/dates"
import { saveCleaningRows } from "../actions/cleaning"
import { publishPeriod } from "@/features/schedule-templates/actions/periods"
import type { Database } from "@/types/database.types"

type Period = Database["public"]["Tables"]["schedule_periods"]["Row"]
type SavedRow = { service_date: string; cleaning_group_name: string | null }

interface CleaningEditorProps {
  period: Period
  dates: string[]
  savedRows: SavedRow[]
  role: "admin" | "viewer"
  congregationId: string
  yearMonth: string
  basePath: string
}

export function CleaningEditor({
  period,
  dates,
  savedRows,
  role,
  congregationId,
  yearMonth,
  basePath,
}: CleaningEditorProps) {
  const isAdmin = role === "admin"
  const router = useRouter()

  const [rows, setRows] = useState(() =>
    dates.map((d) => ({
      service_date: d,
      cleaning_group_name:
        normalizeGroupNumber(
          savedRows.find((r) => r.service_date === d)?.cleaning_group_name,
        ),
    })),
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
      await saveCleaningRows(period.id, congregationId, rowsRef.current)
    }, 1000)
    return () => clearTimeout(timer)
  }, [congregationId, dirtyVersion, isAdmin, period.id, period.status])

  function isComplete() {
    return rows.every((r) => normalizeGroupNumber(r.cleaning_group_name) !== "")
  }

  function update(date: string, value: string) {
    setDirtyVersion((version) => version + 1)
    const nextRows = rowsRef.current.map((r) =>
        r.service_date === date ? { ...r, cleaning_group_name: value } : r,
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
      const saveResult = await saveCleaningRows(period.id, congregationId, rowsRef.current)
      if (saveResult.error) return
      await publishPeriod(period.id, basePath)
      router.refresh()
    })
  }

  function handleSavePublished() {
    startPublishTransition(async () => {
      const result = await saveCleaningRows(period.id, congregationId, rowsRef.current)
      if (!result.error) router.refresh()
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
    <PageHeading title="Limpieza">
      <PeriodBar
        yearMonth={yearMonth}
        period={period}
        role={role}
        congregationId={congregationId}
        templateKey="cleaning"
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
          <tbody>
            <tr className="bg-[var(--surface)] text-[var(--foreground)]">
              <td className="border-b border-[var(--border)] px-3 py-2 text-xs font-bold uppercase tracking-wide" />
              <td className="border-b border-[var(--border)] px-3 py-2 text-xs font-bold uppercase tracking-wide">
                Responsable
              </td>
            </tr>
            {rows.map((row) => (
              <tr
                key={row.service_date}
                className="border-b border-[var(--border)] last:border-b-0"
              >
                <td className="w-40 border-r border-[var(--border)] px-3 py-2 text-[var(--muted)]">
                  {formatShortDateSpanish(row.service_date)}
                </td>
                <td className="px-3 py-1.5">
                  <GroupNumberField
                    value={row.cleaning_group_name ?? ""}
                    onChange={(v) => update(row.service_date, v)}
                    readOnly={!isAdmin}
                    invalid={
                      showErrors &&
                      normalizeGroupNumber(row.cleaning_group_name) === ""
                    }
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
