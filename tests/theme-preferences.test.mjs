import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import test from "node:test"

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8")

test("controles cliente no cargan preferencias mediante Server Actions", async () => {
  for (const file of [
    "src/components/layout/ColorAccentPicker.tsx",
    "src/components/layout/ThemeToggle.tsx",
  ]) {
    assert.doesNotMatch(await read(file), /getUserPreferences/)
  }
})

test("layout carga preferencias una sola vez y las entrega al shell", async () => {
  const layout = await read("src/app/(app)/layout.tsx")
  assert.equal(layout.match(/getUserPreferences\(\)/g)?.length, 1)
  assert.match(layout, /initialAccent=/)
  assert.match(layout, /initialTheme=/)
})
