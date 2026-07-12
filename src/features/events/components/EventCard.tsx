"use client"

import { useState, useTransition } from "react"
import { Pencil, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/Button"
import { formatFullDateSpanish } from "@/shared/utils/dates"
import { deleteEvent, updateEvent } from "../actions/events"

type Event = {
  id: string
  event_date: string
  title: string
  description: string | null
}

export function EventCard({ event, isAdmin }: { event: Event; isAdmin: boolean }) {
  const [editing, setEditing] = useState(false)
  const [eventDate, setEventDate] = useState(event.event_date)
  const [title, setTitle] = useState(event.title)
  const [description, setDescription] = useState(event.description ?? "")
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  function cancelEdit() {
    setEventDate(event.event_date)
    setTitle(event.title)
    setDescription(event.description ?? "")
    setError(null)
    setEditing(false)
  }

  function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!eventDate || !title.trim()) return
    startTransition(async () => {
      const result = await updateEvent(event.id, eventDate, title, description)
      if (result.error) setError(result.error)
      else setEditing(false)
    })
  }

  function handleDelete() {
    startTransition(async () => {
      await deleteEvent(event.id)
    })
  }

  if (editing) {
    return (
      <form
        onSubmit={handleSave}
        className="overflow-hidden rounded-[var(--card-radius)] border border-[var(--primary)] bg-[var(--surface)] shadow-[var(--shadow-soft)]"
      >
        <div className="border-b border-[var(--border)] px-4 py-3 sm:px-5">
          <p className="text-base font-bold text-[var(--foreground)]">Editar evento</p>
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
          <Button variant="secondary" type="button" onClick={cancelEdit} disabled={pending}>
            Cancelar
          </Button>
          <Button type="submit" disabled={pending || !eventDate || !title.trim()}>
            {pending ? "Guardando..." : "Guardar"}
          </Button>
        </div>
      </form>
    )
  }

  return (
    <div className="overflow-hidden rounded-[var(--card-radius)] border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-soft)]">
      <div className="flex items-start justify-between border-b border-[var(--border)] px-4 py-3 sm:px-5">
        <div>
          <p className="text-base font-bold text-[var(--foreground)]">{event.title}</p>
          <p className="mt-0.5 text-xs font-semibold text-[var(--primary)]">
            {formatFullDateSpanish(event.event_date)}
          </p>
        </div>
        {isAdmin && (
          <div className="ml-3 flex shrink-0 items-center gap-1">
            <button
              type="button"
              onClick={() => setEditing(true)}
              disabled={pending}
              aria-label="Editar evento"
              className="flex size-9 items-center justify-center rounded-full text-[var(--muted)] transition hover:bg-[var(--surface-muted)] hover:text-[var(--foreground)] disabled:opacity-50"
            >
              <Pencil className="size-4" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={pending}
              aria-label="Eliminar evento"
              className="flex size-9 items-center justify-center rounded-full text-[var(--muted)] transition hover:bg-[var(--danger)]/10 hover:text-[var(--danger)] disabled:opacity-50"
            >
              <Trash2 className="size-4" aria-hidden="true" />
            </button>
          </div>
        )}
      </div>
      {event.description && (
        <div className="px-4 py-3 sm:px-5">
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-[var(--foreground)]">
            {event.description}
          </p>
        </div>
      )}
    </div>
  )
}
