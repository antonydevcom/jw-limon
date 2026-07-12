"use client"

interface FormatCellProps {
  value: string
  onChange: (value: string) => void
  readOnly: boolean
  placeholder?: string
  className?: string
  multiline?: boolean
  invalid?: boolean
}

export function FormatCell({
  value,
  onChange,
  readOnly,
  placeholder,
  className = "",
  multiline = false,
  invalid = false,
}: FormatCellProps) {
  if (readOnly) {
    return (
      <span className={`block whitespace-pre-wrap ${className}`}>{value}</span>
    )
  }

  const invalidClass = invalid
    ? "outline outline-1 outline-[var(--danger)] bg-[color-mix(in_srgb,var(--danger)_10%,transparent)]"
    : ""
  const inputClassName = `w-full rounded-[var(--control-radius)] bg-[var(--surface-subtle)] px-3 py-1.5 text-sm text-[var(--foreground)] transition-colors focus:bg-[var(--surface)] focus:outline focus:outline-2 focus:outline-[var(--primary)] ${invalidClass} ${className}`
  const shared = {
    value,
    placeholder,
    onChange: (
      e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    ) => onChange(e.target.value),
    className: inputClassName,
  }

  if (multiline) {
    return (
      <textarea
        {...shared}
        rows={2}
        className={`${shared.className} resize-none rounded-2xl`}
      />
    )
  }

  return <input type="text" {...shared} />
}
