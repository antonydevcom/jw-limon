/** Responsible and helper share one field: "Responsable / Ayudante". */
export function combineNames(...names: Array<string | null | undefined>): string {
  return names
    .map((name) => name?.trim() ?? "")
    .filter(Boolean)
    .join(" / ")
}
