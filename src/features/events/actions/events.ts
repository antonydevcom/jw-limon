"use server"

import { revalidatePath } from "next/cache"
import { requireAdminContext } from "@/shared/auth/appContext"
import { databaseError, eventCreateSchema, eventUpdateSchema, invalidInputError, uuidSchema } from "@/shared/validation/actionSchemas"

export async function createEvent(
  congregationId: string,
  eventDate: string,
  title: string,
  description: string,
): Promise<{ error: string | null }> {
  if (!eventCreateSchema.safeParse({ congregationId, eventDate, title, description }).success) return invalidInputError()
  const context = await requireAdminContext()
  if (!context || context.congregationId !== congregationId) return { error: "No autorizado." }
  const { supabase } = context

  const { error } = await supabase.from("congregation_events").insert({
    congregation_id: congregationId,
    event_date: eventDate,
    title: title.trim(),
    description: description.trim() || null,
  })

  if (error) return databaseError()
  revalidatePath("/dashboard/eventos")
  return { error: null }
}

export async function updateEvent(
  eventId: string,
  eventDate: string,
  title: string,
  description: string,
): Promise<{ error: string | null }> {
  if (!eventUpdateSchema.safeParse({ eventId, eventDate, title, description }).success) return invalidInputError()
  const context = await requireAdminContext()
  if (!context) return { error: "No autorizado." }
  const { supabase } = context

  const { error } = await supabase
    .from("congregation_events")
    .update({
      event_date: eventDate,
      title: title.trim(),
      description: description.trim() || null,
    })
    .eq("id", eventId)
    .eq("congregation_id", context.congregationId)
    .select("id")
    .single()

  if (error) return databaseError()
  revalidatePath("/dashboard/eventos")
  return { error: null }
}

export async function deleteEvent(eventId: string): Promise<{ error: string | null }> {
  if (!uuidSchema.safeParse(eventId).success) return invalidInputError()
  const context = await requireAdminContext()
  if (!context) return { error: "No autorizado." }
  const { supabase } = context

  const { error } = await supabase
    .from("congregation_events")
    .delete()
    .eq("id", eventId)
    .eq("congregation_id", context.congregationId)
    .select("id")
    .single()

  if (error) return databaseError()
  revalidatePath("/dashboard/eventos")
  return { error: null }
}
