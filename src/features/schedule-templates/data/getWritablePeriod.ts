import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/types/database.types"

type TemplateKey = Database["public"]["Enums"]["schedule_template_key"]

export interface WritablePeriod {
  id: string
  startsOn: string
  endsOn: string
}

export async function getWritablePeriod(
  supabase: SupabaseClient<Database>,
  congregationId: string,
  periodId: string,
  templateKey: TemplateKey,
): Promise<WritablePeriod | null> {
  const { data } = await supabase
    .from("schedule_periods")
    .select("id, starts_on, ends_on")
    .eq("id", periodId)
    .eq("congregation_id", congregationId)
    .eq("template_key", templateKey)
    .maybeSingle()

  return data
    ? { id: data.id, startsOn: data.starts_on, endsOn: data.ends_on }
    : null
}

export function datesBelongToPeriod(
  dates: string[],
  period: WritablePeriod,
): boolean {
  return dates.every((date) => date >= period.startsOn && date <= period.endsOn)
}
