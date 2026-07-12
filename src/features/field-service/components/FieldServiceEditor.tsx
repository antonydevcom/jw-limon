"use client"

import { useEffect, useRef, useState } from "react"
import { Check } from "lucide-react"
import { PageHeading } from "@/components/layout/PageHeading"
import { FormatCell } from "@/features/schedule-templates/components/FormatCell"
import { saveFieldServiceRows } from "../actions/fieldService"
import type { Database } from "@/types/database.types"

type Row = Database["public"]["Tables"]["field_service_schedule"]["Row"]
type TimeSlot = Database["public"]["Enums"]["time_slot"]

interface FieldServiceEditorProps {
  congregationId: string
  role: "admin" | "viewer"
  savedRows: Row[]
}

type CellState = {
  starts_at: string
  location: string
  captain_name: string
  is_active: boolean
}

const DAYS: { weekday: number; label: string }[] = [
  { weekday: 2, label: "MARTES" },
  { weekday: 3, label: "MIÉRCOLES" },
  { weekday: 4, label: "JUEVES" },
  { weekday: 5, label: "VIERNES" },
  { weekday: 6, label: "SÁBADO" },
  { weekday: 0, label: "DOMINGO" },
]

const SLOTS: { slot: TimeSlot; label: string }[] = [
  { slot: "morning", label: "MAÑANA" },
  { slot: "afternoon", label: "TARDE" },
]

const DEFAULT_CELLS: Record<string, CellState> = {
  "2-morning": {
    starts_at: "09:00",
    location: "hermana Zoila",
    captain_name: "Carlos Hernández",
    is_active: true,
  },
  "3-morning": {
    starts_at: "09:00",
    location: "hermana Zoila",
    captain_name: "Oscar Ramírez",
    is_active: true,
  },
  "3-afternoon": {
    starts_at: "17:00",
    location: "Marta Valdovinos",
    captain_name: "Uriel Ramírez",
    is_active: true,
  },
  "4-morning": {
    starts_at: "09:00",
    location: "Marta Valdovinos",
    captain_name: "Max Dominguez",
    is_active: true,
  },
  "4-afternoon": {
    starts_at: "17:00",
    location: "fam. Juarez Leonardo",
    captain_name: "Antonio Valdovinos",
    is_active: true,
  },
  "5-morning": {
    starts_at: "09:00",
    location: "familia Orozco Lara",
    captain_name: "Noel Orozco",
    is_active: true,
  },
  "5-afternoon": {
    starts_at: "17:00",
    location: "familia Orozco Lara",
    captain_name: "Max Dominguez",
    is_active: true,
  },
  "6-morning": {
    starts_at: "09:00",
    location: "familia Orozco Lara",
    captain_name: "Valente H. / Alejandro R.",
    is_active: true,
  },
}

function keyOf(weekday: number, slot: TimeSlot) {
  return `${weekday}-${slot}`
}

function toTimeInputValue(value: string | null | undefined): string {
  const trimmed = value?.trim() ?? ""
  if (/^\d{2}:\d{2}$/.test(trimmed)) return trimmed

  const match = trimmed.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i)
  if (!match) return ""

  let hours = Number(match[1])
  const minutes = match[2]
  const meridiem = match[3].toUpperCase()

  if (meridiem === "PM" && hours < 12) hours += 12
  if (meridiem === "AM" && hours === 12) hours = 0

  return `${String(hours).padStart(2, "0")}:${minutes}`
}

function formatTimeLabel(value: string): string {
  const time = toTimeInputValue(value)
  if (!time) return value

  const [hoursText, minutes] = time.split(":")
  const hours = Number(hoursText)
  const displayHours = hours % 12 || 12
  const meridiem = hours >= 12 ? "PM" : "AM"

  return `${displayHours}:${minutes} ${meridiem}`
}

function normalizeHouseName(value: string | null | undefined): string {
  return (value ?? "")
    .trim()
    .replace(/^Casa\s*:\s*/i, "")
    .replace(/^Casa\s+(de\s+la\s+|del\s+|de\s+)?/i, "")
    .trim()
}

function formatHouseLabel(value: string): string {
  const name = normalizeHouseName(value)
  return name ? `Casa: ${name}` : ""
}

function firstFilled(...values: string[]): string {
  return values.find((value) => value.trim() !== "") ?? ""
}

export function FieldServiceEditor({
  congregationId,
  role,
  savedRows,
}: FieldServiceEditorProps) {
  const isAdmin = role === "admin"

  const [cells, setCells] = useState<Record<string, CellState>>(() => {
    const map: Record<string, CellState> = {}
    for (const day of DAYS) {
      for (const s of SLOTS) {
        const key = keyOf(day.weekday, s.slot)
        const saved = savedRows.find(
          (r) => r.weekday === day.weekday && r.time_slot === s.slot,
        )
        const fallback = DEFAULT_CELLS[key] ?? {
          starts_at: "",
          location: "",
          captain_name: "",
          is_active: false,
        }
        map[key] = saved
          ? {
              starts_at: firstFilled(
                toTimeInputValue(saved.starts_at),
                fallback.starts_at,
              ),
              location: firstFilled(
                normalizeHouseName(saved.location),
                fallback.location,
              ),
              captain_name: firstFilled(saved.captain_name ?? "", fallback.captain_name),
              is_active: saved.is_active,
            }
          : fallback
      }
    }
    return map
  })

  const [dirtyVersion, setDirtyVersion] = useState(0)
  const cellsRef = useRef(cells)

  useEffect(() => {
    cellsRef.current = cells
  }, [cells])

  useEffect(() => {
    if (!isAdmin || dirtyVersion === 0) return
    const timer = setTimeout(async () => {
      const rows = DAYS.flatMap((day) =>
        SLOTS.map((s) => {
          const c = cellsRef.current[keyOf(day.weekday, s.slot)]
          return {
            weekday: day.weekday,
            time_slot: s.slot,
            starts_at: c.starts_at,
            location: c.location,
            captain_name: c.captain_name,
            is_active: c.is_active,
          }
        }),
      )
      await saveFieldServiceRows(congregationId, rows)
    }, 1000)
    return () => clearTimeout(timer)
  }, [congregationId, dirtyVersion, isAdmin])

  function updateCell(key: string, field: keyof CellState, value: string) {
    setDirtyVersion((version) => version + 1)
    setCells((prev) => ({
      ...prev,
      [key]: (() => {
        const next = { ...prev[key], [field]: value }
        return {
          ...next,
          is_active: field === "is_active" ? value === "true" : prev[key].is_active,
        }
      })(),
    }))
  }

  function toggleCell(key: string) {
    updateCell(key, "is_active", cells[key].is_active ? "false" : "true")
  }

  function renderCell(key: string) {
    const c = cells[key]
    if (!isAdmin) {
      if (!c.is_active) {
        return <span className="text-[var(--muted)]">Sin reunión</span>
      }
      return (
        <div className="space-y-0.5">
          {c.starts_at && <p className="font-semibold">{formatTimeLabel(c.starts_at)}</p>}
          {c.location && <p>{formatHouseLabel(c.location)}</p>}
          {c.captain_name && (
            <p className="text-[var(--muted)]">Capitán: {c.captain_name}</p>
          )}
        </div>
      )
    }
    return (
      <div
        className={
          c.is_active
            ? "space-y-1"
            : "space-y-1 opacity-45 transition-opacity"
        }
      >
        <button
          type="button"
          onClick={() => toggleCell(key)}
          className="mb-1 flex min-h-8 items-center gap-2 text-xs font-semibold text-[var(--foreground)]"
          aria-pressed={c.is_active}
        >
          <span className="flex size-5 items-center justify-center rounded-full border border-[var(--border-strong)] bg-[var(--surface)] text-[var(--primary)]">
            {c.is_active && <Check className="size-4" aria-hidden="true" />}
          </span>
          Habilitado
        </button>
        <input
          type="time"
          value={c.starts_at}
          onChange={(event) => updateCell(key, "starts_at", event.target.value)}
          className="w-full rounded-[var(--control-radius)] bg-[var(--surface-subtle)] px-3 py-1.5 text-sm font-semibold text-[var(--foreground)] transition-colors focus:bg-[var(--surface)] focus:outline focus:outline-2 focus:outline-[var(--primary)]"
          aria-label="Hora"
        />
        <div className="flex items-baseline gap-1">
          <span className="whitespace-nowrap text-xs text-[var(--muted)]">
            Casa:
          </span>
          <FormatCell
            value={c.location}
            onChange={(v) => updateCell(key, "location", normalizeHouseName(v))}
            readOnly={false}
            placeholder="familia / persona"
          />
        </div>
        <div className="flex items-baseline gap-1">
          <span className="whitespace-nowrap text-xs text-[var(--muted)]">
            Capitán:
          </span>
          <FormatCell
            value={c.captain_name}
            onChange={(v) => updateCell(key, "captain_name", v)}
            readOnly={false}
            placeholder="Nombre"
          />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeading title="Servicio" />

      <div className="app-table-card">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-[var(--surface)] text-[var(--foreground)]">
              <th className="w-32 border-b border-[var(--border)] px-3 py-2" />
              {SLOTS.map((s) => (
                <th
                  key={s.slot}
                  className="border-b border-[var(--border)] px-3 py-2 text-left text-xs font-bold uppercase tracking-wide"
                >
                  {s.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {DAYS.map((day) => (
              <tr
                key={day.weekday}
                className="border-b border-[var(--border)] align-top last:border-b-0"
              >
                <td className="w-32 border-r border-[var(--border)] bg-[var(--surface)] px-3 py-2 font-semibold text-[var(--foreground)]">
                  {day.label}
                </td>
                {SLOTS.map((s) => (
                  <td
                    key={s.slot}
                    className="border-r border-[var(--border)] px-3 py-2"
                  >
                    {renderCell(keyOf(day.weekday, s.slot))}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
