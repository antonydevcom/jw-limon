import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import test from "node:test"

const files = [
  ["midweek", "MidweekEditor", "persistWeek"],
  ["weekend", "WeekendEditor", "saveWeekendRows"],
  ["readers", "ReadersEditor", "saveReaderRows"],
  ["duties", "DutiesEditor", "saveDutyRows"],
  ["cleaning", "CleaningEditor", "saveCleaningRows"],
  ["hospitality", "HospitalityEditor", "saveHospitalityRows"],
]

test("publicar persiste contenido antes de cambiar estado", async () => {
  for (const [feature, component, saveAction] of files) {
    const source = await readFile(
      new URL(`../src/features/${feature}/components/${component}.tsx`, import.meta.url),
      "utf8",
    )
    const publishBlock = source.slice(source.indexOf("function doPublish"), source.indexOf("function handleSavePublished"))
    const saveIndex = publishBlock.indexOf(saveAction)
    assert.ok(saveIndex >= 0 && saveIndex < publishBlock.indexOf("publishPeriod"), `${component} debe guardar antes de publicar`)
  }
})

test("formatos publicados muestran Guardar como acción principal", async () => {
  for (const [feature, component] of files) {
    const source = await readFile(
      new URL(`../src/features/${feature}/components/${component}.tsx`, import.meta.url),
      "utf8",
    )
    const controlsStart = source.indexOf("const publishControls")
    const publishedControls = source.slice(
      source.indexOf('period.status === "published"', controlsStart),
      source.indexOf(") : (", source.indexOf('period.status === "published"', controlsStart)),
    )

    assert.match(publishedControls, />Guardar</, `${component} debe permitir guardar formato publicado`)
    assert.doesNotMatch(publishedControls, /Quitar publicación/, `${component} no debe ofrecer quitar publicación en editor`)
  }
})
