import assert from "node:assert/strict"
import test from "node:test"
import {
  getMonthDatesForWeekdays,
  getMonthStartEnd,
  nextYearMonth,
  prevYearMonth,
  resolveYearMonth,
} from "../src/shared/utils/dates.ts"
import { midweekSaveSchema } from "../src/shared/validation/actionSchemas.ts"

test("calcula febrero bisiesto sin cambiar zona horaria", () => {
  assert.deepEqual(getMonthStartEnd("2028-02"), {
    starts_on: "2028-02-01",
    ends_on: "2028-02-29",
  })
})

test("cambia de año al navegar meses", () => {
  assert.equal(prevYearMonth("2026-01"), "2025-12")
  assert.equal(nextYearMonth("2026-12"), "2027-01")
})

test("rechaza mes fuera de rango", () => {
  assert.notEqual(resolveYearMonth("2026-99"), "2026-99")
  assert.notEqual(resolveYearMonth("2026-00"), "2026-00")
})

test("genera solo domingos y martes del mes", () => {
  const dates = getMonthDatesForWeekdays("2026-07", [0, 2])
  assert.equal(dates[0], "2026-07-05")
  assert.equal(dates.at(-1), "2026-07-28")
  assert.equal(dates.length, 8)
})

test("schema semanal rechaza secciones fuera del enum SQL", () => {
  const base = {
    periodId: "00000000-0000-4000-8000-000000000001",
    congregationId: "00000000-0000-4000-8000-000000000002",
    meetingData: {
      meeting_date: "2026-07-07",
      chairman_name: "",
      opening_song: "",
      opening_prayer_name: "",
      mid_song: "",
      closing_song: "",
      closing_prayer_name: "",
    },
  }
  assert.equal(midweekSaveSchema.safeParse({ ...base, parts: [] }).success, true)
  assert.equal(midweekSaveSchema.safeParse({
    ...base,
    parts: [{ section: "opening", sort_order: 1, title: "", duration_minutes: null, assigned_name: "", assistant_name: "" }],
  }).success, false)
})
