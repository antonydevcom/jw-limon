-- Migration: 0002_fix_handle_new_user_execute
-- Revoke direct-call access on handle_new_user().
-- It is a trigger function; no role should invoke it via REST RPC.
-- Postgres grants EXECUTE to public by default on all functions, which
-- Supabase exposes at /rest/v1/rpc/. This closes that gap.

revoke execute on function public.handle_new_user() from public, anon, authenticated;
