export function SaveErrorNotice({ error }: { error: string | null }) {
  if (!error) return null

  return (
    <p
      role="alert"
      className="rounded-2xl bg-[color-mix(in_srgb,var(--danger)_10%,transparent)] px-4 py-3 text-sm font-semibold text-[var(--danger)]"
    >
      {error}
    </p>
  )
}
