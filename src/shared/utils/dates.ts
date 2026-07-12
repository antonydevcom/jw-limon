const DIAS = [
  "domingo",
  "lunes",
  "martes",
  "miércoles",
  "jueves",
  "viernes",
  "sábado",
]

const DIAS_CAP = [
  "Domingo",
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
]

const MESES = [
  "enero",
  "febrero",
  "marzo",
  "abril",
  "mayo",
  "junio",
  "julio",
  "agosto",
  "septiembre",
  "octubre",
  "noviembre",
  "diciembre",
]

const MESES_CAP = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
]

function parseLocalDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split("-").map(Number)
  return new Date(y, m - 1, d)
}

/** "2026-07-07" → "martes, julio 07, 2026" */
export function formatFullDateSpanish(dateStr: string): string {
  const d = parseLocalDate(dateStr)
  const day = DIAS[d.getDay()]
  const month = MESES[d.getMonth()]
  const date = String(d.getDate()).padStart(2, "0")
  return `${day}, ${month} ${date}, ${d.getFullYear()}`
}

/** "2026-07-05" → "Domingo 5" */
export function formatShortDateSpanish(dateStr: string): string {
  const d = parseLocalDate(dateStr)
  return `${DIAS_CAP[d.getDay()]} ${d.getDate()}`
}

/** "2026-07-01" → "Julio 2026" */
export function getSpanishMonthYear(dateStr: string): string {
  const d = parseLocalDate(dateStr)
  return `${MESES_CAP[d.getMonth()]} ${d.getFullYear()}`
}

/** "2026-07" → "Julio 2026" */
export function getSpanishMonthYearFromYM(yearMonth: string): string {
  return getSpanishMonthYear(yearMonth + "-01")
}

/** "2026-07" → { starts_on: "2026-07-01", ends_on: "2026-07-31" } */
export function getMonthStartEnd(yearMonth: string): {
  starts_on: string
  ends_on: string
} {
  const [year, month] = yearMonth.split("-").map(Number)
  const start = new Date(year, month - 1, 1)
  const end = new Date(year, month, 0)
  return {
    starts_on: toDateStr(start),
    ends_on: toDateStr(end),
  }
}

/** All dates in yearMonth matching any of the given weekdays, sorted asc.
 *  weekday: 0 = Sunday … 6 = Saturday */
export function getMonthDatesForWeekdays(
  yearMonth: string,
  weekdays: number[],
): string[] {
  const [year, month] = yearMonth.split("-").map(Number)
  const dates: string[] = []
  const d = new Date(year, month - 1, 1)
  while (d.getMonth() === month - 1) {
    if (weekdays.includes(d.getDay())) {
      dates.push(toDateStr(d))
    }
    d.setDate(d.getDate() + 1)
  }
  return dates
}

/** Current year-month: "2026-07" */
export function getCurrentYearMonth(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
}

/** "2026-07" → "2026-06" */
export function prevYearMonth(yearMonth: string): string {
  const [year, month] = yearMonth.split("-").map(Number)
  const d = new Date(year, month - 2, 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
}

/** "2026-07" → "2026-08" */
export function nextYearMonth(yearMonth: string): string {
  const [year, month] = yearMonth.split("-").map(Number)
  const d = new Date(year, month, 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
}

/** Validate and normalise a yearMonth string. Falls back to current month. */
export function resolveYearMonth(raw: string | string[] | undefined): string {
  const s = Array.isArray(raw) ? raw[0] : raw
  if (s && /^\d{4}-(0[1-9]|1[0-2])$/.test(s)) return s
  return getCurrentYearMonth()
}

function toDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}
