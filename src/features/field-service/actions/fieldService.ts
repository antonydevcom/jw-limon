"use server"

import { revalidatePath } from "next/cache"
import { requireAdminContext } from "@/shared/auth/appContext"
import type { Database } from "@/types/database.types"
import { databaseError, fieldServiceRowsSchema, invalidInputError, uuidSchema } from "@/shared/validation/actionSchemas"

type TimeSlot = Database["public"]["Enums"]["time_slot"]

type CellData = {
  weekday: number
  time_slot: TimeSlot
  starts_at: string
  location: string
  captain_name: string
  is_active: boolean
}

export async function saveFieldServiceRows(
  congregationId: string,
  rows: CellData[],
): Promise<{ error: string | null }> {
  if (!uuidSchema.safeParse(congregationId).success || !fieldServiceRowsSchema.safeParse(rows).success) return invalidInputError()
  const context = await requireAdminContext()
  if (!context || context.congregationId !== congregationId) return { error: "No autorizado." }
  const { supabase } = context

  const { error } = await supabase.from("field_service_schedule").upsert(
    rows.map((r) => ({
      congregation_id: congregationId,
      weekday: r.weekday,
      time_slot: r.time_slot,
      starts_at: r.starts_at || null,
      location: r.location || null,
      captain_name: r.captain_name || null,
      is_active: r.is_active,
    })),
    { onConflict: "congregation_id,weekday,time_slot" },
  )

  if (error) return databaseError()
  revalidatePath("/dashboard/servicio")
  return { error: null }
}
