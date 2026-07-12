"use client"

import { useState, useTransition } from "react"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/Button"
import { createEvent } from "../actions/events"

export function EventForm({ congregationId }: { congregationId: string }) {
  const [open, setOpen] = useState(false)
  const [eventDate, setEventDate] = useState("")
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  function reset() {
    setEventDate("")
    setTitle("")
    setDescription("")
    setError(null)
    setOpen(false)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!eventDate || !title.trim()) return
    startTransition(async () => {
      const result = await createEvent(congregationId, eventDate, title, description)
      if (result.error) setError(result.error)
      else reset()
    })
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex w-full items-center gap-2 rounded-[var(--card-radius)] border border-dashed border-[var(--border)] px-4 py-3 text-sm font-semibold text-[var(--primary)] transition hover:border-[var(--primary)] hover:bg-[var(--primary-soft)]"
      >
        <Plus className="size-4" aria-hidden="true" />
        Agregar evento
      </button>
    )
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="overflow-hidden rounded-[var(--card-radius)] border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-soft)]"
    >
      <div className="border-b border-[var(--border)] px-4 py-3 sm:px-5">
        <p className="text-base font-bold text-[var(--foreground)]">Nuevo evento</p>
      </div>

      <div className="space-y-3 px-4 py-4 sm:px-5">
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
              Fecha
            </label>
            <input
              type="date"
              required
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
              className="w-full rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm focus:outline focus:outline-2 focus:outline-[var(--primary)]"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
              Título
            </label>
            <input
              type="text"
              required
              placeholder="Nombre del evento..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm focus:outline focus:outline-2 focus:outline-[var(--primary)]"
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
            Descripción
          </label>
          <textarea
            rows={3}
            placeholder="Detalles del evento..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full resize-y rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm focus:outline focus:outline-2 focus:outline-[var(--primary)]"
          />
        </div>

        {error && <p className="text-xs text-[var(--danger)]">{error}</p>}
      </div>

      <div className="flex justify-end gap-2 border-t border-[var(--border)] px-4 py-3 sm:px-5">
        <Button variant="secondary" type="button" onClick={reset} disabled={pending}>
          Cancelar
        </Button>
        <Button type="submit" disabled={pending || !eventDate || !title.trim()}>
          {pending ? "Guardando..." : "Guardar"}
        </Button>
      </div>
    </form>
  )
}
