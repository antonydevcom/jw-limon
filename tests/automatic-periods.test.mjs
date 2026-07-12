import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import test from "node:test"

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8")

const periodPages = [
  "reunion-semanal",
  "reunion-fin-semana",
  "lectores",
  "acomodadores",
  "limpieza",
  "hospitalidad",
]

test("cada formato periódico asegura plantilla automáticamente", async () => {
  for (const route of periodPages) {
    const source = await read(`src/app/(app)/dashboard/${route}/page.tsx`)
    assert.match(source, /ensureSchedulePeriod/)
  }
})

test("autocreación reutiliza periodo existente y tolera carrera única", async () => {
  const source = await read("src/features/schedule-templates/actions/ensureSchedulePeriod.ts")
  assert.match(source, /maybeSingle/)
  assert.match(source, /error\.code === "23505"/)
  assert.match(source, /template_key/)
  assert.match(source, /congregation_id/)
})
