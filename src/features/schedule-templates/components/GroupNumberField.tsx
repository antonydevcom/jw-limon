"use client"

const GROUP_OPTIONS = ["1", "2", "3", "4", "5"] as const

export function normalizeGroupNumber(value: string | null | undefined): string {
  const trimmed = value?.trim() ?? ""
  const match = trimmed.match(/[1-5]/)
  return match?.[0] ?? ""
}

export function formatGroupLabel(value: string | null | undefined): string {
  const groupNumber = normalizeGroupNumber(value)
  return groupNumber ? `Grupo: ${groupNumber}` : "Grupo: Sin asignar"
}

export function GroupNumberField({
  value,
  onChange,
  readOnly,
  invalid = false,
}: {
  value: string
  onChange: (value: string) => void
  readOnly: boolean
  invalid?: boolean
}) {
  const groupNumber = normalizeGroupNumber(value)

  if (readOnly) {
    return <span>{formatGroupLabel(groupNumber)}</span>
  }

  return (
    <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Grupo">
      <span className="whitespace-nowrap text-xs font-bold text-[var(--muted)]">
        Grupo:
      </span>
      <div
        className={`inline-flex overflow-hidden rounded-full border bg-[var(--surface)] shadow-[var(--shadow-soft)] ${
          invalid ? "border-[var(--danger)]" : "border-[var(--border)]"
        }`}
      >
        {GROUP_OPTIONS.map((option) => (
          <button
            key={option}
            type="button"
            aria-pressed={groupNumber === option}
            aria-label={`Grupo ${option}`}
            title={`Grupo ${option}`}
            onClick={() => onChange(groupNumber === option ? "" : option)}
            className={`flex size-10 items-center justify-center border-r border-[var(--border)] text-sm font-semibold transition-colors last:border-r-0 focus-visible:relative focus-visible:z-10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--primary)] ${
              groupNumber === option
                ? "bg-[var(--primary)] text-[var(--action-foreground)]"
                : "bg-[var(--surface)] text-[var(--foreground)] hover:bg-[var(--surface-muted)]"
            }`}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  )
}
