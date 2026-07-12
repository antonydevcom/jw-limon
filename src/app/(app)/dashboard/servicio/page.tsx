import { getAppContext } from "@/shared/auth/appContext"
import { FieldServiceEditor } from "@/features/field-service/components/FieldServiceEditor"
import type { Database } from "@/types/database.types"

export const metadata = { title: "Servicio" }

type Row = Database["public"]["Tables"]["field_service_schedule"]["Row"]

export default async function ServicioPage() {
  const { supabase, congregationId, role } = await getAppContext()

  if (!congregationId) {
    return (
      <p className="text-sm text-[var(--muted)]">
        Aún no hay congregación configurada.
      </p>
    )
  }

  const { data } = await supabase
    .from("field_service_schedule")
    .select("*")
    .eq("congregation_id", congregationId)
  const savedRows: Row[] = data ?? []

  return (
    <div className="space-y-6">
      <FieldServiceEditor
        congregationId={congregationId}
        role={role}
        savedRows={savedRows}
      />
    </div>
  )
}
