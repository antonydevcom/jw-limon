import { z } from "zod"

export const uuidSchema = z.string().uuid()
export const dateSchema = z.iso.date()
export const yearMonthSchema = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/)
export const dashboardPathSchema = z.string().regex(/^\/dashboard(?:\/[a-z0-9-]+)*$/)
export const shortTextSchema = z.string().trim().max(200)
export const longTextSchema = z.string().trim().max(2_000)

export const periodMutationSchema = z.object({
  congregationId: uuidSchema,
  templateKey: z.enum(["midweek", "weekend", "readers", "duties", "cleaning", "hospitality"]),
  yearMonth: yearMonthSchema,
  revalidate: dashboardPathSchema,
})

export const periodIdMutationSchema = z.object({
  periodId: uuidSchema,
  revalidate: dashboardPathSchema,
})

export const midweekSaveSchema = z.object({
  periodId: uuidSchema,
  congregationId: uuidSchema,
  meetingData: z.object({
    meeting_date: dateSchema,
    chairman_name: shortTextSchema,
    opening_song: shortTextSchema,
    opening_prayer_name: shortTextSchema,
    mid_song: shortTextSchema,
    closing_song: shortTextSchema,
    closing_prayer_name: shortTextSchema,
  }),
  parts: z.array(z.object({
    section: z.enum(["treasures", "ministry", "living"]),
    sort_order: z.number().int().min(0).max(100),
    title: shortTextSchema,
    duration_minutes: z.number().int().min(0).max(180).nullable(),
    assigned_name: shortTextSchema,
    assistant_name: shortTextSchema,
  })).max(100),
})

export const weekendRowsSchema = z.array(z.object({
  meeting_date: dateSchema,
  chairman_name: shortTextSchema,
  opening_prayer_name: shortTextSchema,
  speaker_name: shortTextSchema,
  speaker_congregation: shortTextSchema,
  outline_title: shortTextSchema,
  song_number: shortTextSchema,
  wt_reader_name: shortTextSchema,
  wt_conductor_name: shortTextSchema,
  hospitality_group_name: shortTextSchema,
})).max(10)

export const readerRowsSchema = z.array(z.object({
  meeting_date: dateSchema,
  reader_type: z.enum(["watchtower_study", "congregation_bible_study"]),
  reader_name: shortTextSchema,
})).max(20)

export const dutyRowsSchema = z.array(z.object({
  meeting_date: dateSchema,
  entrance_name: shortTextSchema,
  auditorium_name: shortTextSchema,
  microphone_1_name: shortTextSchema,
  microphone_2_name: shortTextSchema,
})).max(20)

export const cleaningRowsSchema = z.array(z.object({
  service_date: dateSchema,
  cleaning_group_name: shortTextSchema,
})).max(20)

export const hospitalityRowsSchema = z.array(z.object({
  meeting_date: dateSchema,
  group_name: shortTextSchema,
})).max(10)

export const fieldServiceRowsSchema = z.array(z.object({
  weekday: z.number().int().min(0).max(6),
  time_slot: z.enum(["morning", "afternoon"]),
  starts_at: z.union([z.literal(""), z.string().regex(/^([01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?$/)]),
  location: shortTextSchema,
  captain_name: shortTextSchema,
  is_active: z.boolean(),
})).max(14)

export const eventCreateSchema = z.object({
  congregationId: uuidSchema,
  eventDate: dateSchema,
  title: z.string().trim().min(1).max(160),
  description: longTextSchema,
})

export const eventUpdateSchema = eventCreateSchema.omit({ congregationId: true }).extend({ eventId: uuidSchema })

export function invalidInputError() {
  return { error: "Los datos enviados no son válidos." }
}

export function databaseError() {
  return { error: "No se pudieron guardar los cambios. Inténtalo de nuevo." }
}
