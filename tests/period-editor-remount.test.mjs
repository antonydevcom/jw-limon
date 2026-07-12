import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import test from "node:test"

const pages = [
  ["reunion-semanal", "MidweekEditor"],
  ["reunion-fin-semana", "WeekendEditor"],
  ["lectores", "ReadersEditor"],
  ["acomodadores", "DutiesEditor"],
  ["limpieza", "CleaningEditor"],
  ["hospitalidad", "HospitalityEditor"],
]

test("editor remonta estado al cambiar periodo mensual", async () => {
  for (const [route, component] of pages) {
    const source = await readFile(
      new URL(`../src/app/(app)/dashboard/${route}/page.tsx`, import.meta.url),
      "utf8",
    )
    assert.match(source, new RegExp(`<${component}\\s+key=\\{period\\.id\\}`))
  }
})
