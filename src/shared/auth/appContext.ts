import { cache } from "react"
import { redirect } from "next/navigation"
import { createSupabaseServerClient } from "@/shared/supabase/serverClient"
import { createSupabaseAdminClient } from "@/shared/supabase/adminClient"
import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/types/database.types"

export type AppRole = "admin" | "viewer"

export interface AppContext {
  supabase: SupabaseClient<Database>
  congregationId: string
  userId: string
  isAdmin: boolean
  role: AppRole
}

export const getAppContext = cache(async (): Promise<AppContext> => {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    // Public viewer: look up congregation with admin client (bypasses RLS).
    // Anon Supabase client enforces published-only RLS for all subsequent queries.
    const adminClient = createSupabaseAdminClient()
    const { data: congregation } = await adminClient
      .from("congregations")
      .select("id")
      .limit(1)
      .maybeSingle()

    return {
      supabase,
      congregationId: congregation?.id ?? "",
      userId: "",
      isAdmin: false,
      role: "viewer",
    }
  }

  const { data: membership } = await supabase
    .from("congregation_memberships")
    .select("congregation_id, role")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle()

  if (!membership) redirect("/sin-acceso")

  const isAdmin = membership.role === "admin"

  return {
    supabase,
    congregationId: membership.congregation_id,
    userId: user.id,
    isAdmin,
    role: isAdmin ? "admin" : "viewer",
  }
})

/**
 * For write server actions. Returns an admin Supabase client only when the
 * caller holds a valid admin session; otherwise null.
 */
export async function requireAdminContext(): Promise<AppContext | null> {
  const context = await getAppContext()
  return context.isAdmin ? context : null
}
