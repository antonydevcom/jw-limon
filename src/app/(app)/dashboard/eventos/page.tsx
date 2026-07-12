import { PageHeading } from "@/components/layout/PageHeading"
import { getAppContext } from "@/shared/auth/appContext"
import { EventForm } from "@/features/events/components/EventForm"
import { EventCard } from "@/features/events/components/EventCard"

export const metadata = { title: "Eventos" }

function todayString(): string {
  const d = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Mexico_City",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date())
  return d
}

export default async function EventosPage() {
  const { supabase, congregationId, role } = await getAppContext()
  const isAdmin = role === "admin"

  if (!congregationId) {
    return (
      <p className="text-sm text-[var(--muted)]">
        Aún no hay congregación configurada.
      </p>
    )
  }

  const today = todayString()

  const [{ data: upcoming }, { data: past }] = await Promise.all([
    supabase
      .from("congregation_events")
      .select("*")
      .eq("congregation_id", congregationId)
      .gte("event_date", today)
      .order("event_date", { ascending: true }),
    supabase
      .from("congregation_events")
      .select("*")
      .eq("congregation_id", congregationId)
      .lt("event_date", today)
      .order("event_date", { ascending: false })
      .limit(5),
  ])

  return (
    <div className="mx-auto max-w-3xl space-y-8 sm:space-y-10">
      <PageHeading
        title="Eventos"
        subtitle="Próximos eventos de la congregación."
      />

      {isAdmin && <EventForm congregationId={congregationId} />}

      <section className="space-y-3">
        {upcoming && upcoming.length > 0 ? (
          upcoming.map((event) => (
            <EventCard key={event.id} event={event} isAdmin={isAdmin} />
          ))
        ) : (
          <p className="text-sm text-[var(--muted)]">Sin eventos próximos.</p>
        )}
      </section>

      {past && past.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-[var(--muted)]">
            Pasados
          </h2>
          {past.map((event) => (
            <EventCard key={event.id} event={event} isAdmin={isAdmin} />
          ))}
        </section>
      )}
    </div>
  )
}
