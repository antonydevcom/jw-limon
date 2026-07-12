import assert from "node:assert/strict"
import { readFile, readdir } from "node:fs/promises"
import test from "node:test"

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8")

test("contexto de aplicación usa sesión RLS, no service-role", async () => {
  const source = await read("src/shared/auth/appContext.ts")
  assert.match(source, /createSupabaseServerClient/)
  assert.match(source, /auth\.getUser\(\)/)
  assert.doesNotMatch(source, /createSupabaseAdminClient/)
})

test("dashboard queda protegido antes de renderizar", async () => {
  const proxy = await read("src/shared/supabase/proxy.ts")
  assert.match(proxy, /getClaims\(\)/)
  assert.match(proxy, /pathname\.startsWith\("\/dashboard"\)/)
  assert.match(proxy, /private, no-store/)
})

test("service worker nunca cachea HTML privado ni API", async () => {
  const worker = await read("public/sw.js")
  assert.match(worker, /request\.mode === "navigate"/)
  assert.match(worker, /fetch\(request\)\.catch/)
  assert.doesNotMatch(worker, /startsWith\("\/api/)
  assert.match(worker, /\/_next\/static\//)
})

test("manifest incluye iconos requeridos y modo standalone", async () => {
  const manifest = await read("src/app/manifest.ts")
  assert.match(manifest, /display: "standalone"/)
  assert.match(manifest, /icon-192\.png/)
  assert.match(manifest, /icon-512\.png/)
  assert.match(manifest, /purpose: "maskable"/)
})

test("política RLS nueva vincula cada formato con periodo visible", async () => {
  const sql = await read("supabase/migrations/0007_restrict_draft_schedule_reads.sql")
  for (const table of [
    "midweek_meetings",
    "midweek_parts",
    "weekend_meetings",
    "reader_assignments",
    "duty_assignments",
    "cleaning_assignments",
    "hospitality_assignments",
  ]) {
    assert.match(sql, new RegExp(`create policy ${table}_select`))
  }
  assert.match(sql, /from public\.schedule_periods/)
  assert.match(sql, /foreign key \(period_id, congregation_id\)/)
  assert.match(sql, /schedule_periods_congregation_template_start_uidx/)
  assert.match(sql, /Duplicate schedule periods block migration 0007/)
  assert.match(sql, /validate constraint hospitality_assignments_period_congregation_fk/)
})

test("cada migración usa versión única y ordenada", async () => {
  const files = (await readdir(new URL("../supabase/migrations", import.meta.url))).sort()
  const versions = files.map((file) => file.split("_")[0])
  assert.equal(new Set(versions).size, versions.length)
  assert.deepEqual(versions, ["0001", "0002", "0003", "0004", "0005", "0006", "0007"])
})

test("acciones de formatos verifican periodo y tipo en servidor", async () => {
  for (const file of [
    "src/features/midweek/actions/midweek.ts",
    "src/features/weekend/actions/weekend.ts",
    "src/features/readers/actions/readers.ts",
    "src/features/duties/actions/duties.ts",
    "src/features/cleaning/actions/cleaning.ts",
    "src/features/hospitality/actions/hospitality.ts",
  ]) {
    assert.match(await read(file), /getWritablePeriod/)
  }
})

test("guardado semanal persiste reemplazo antes de borrar sobrantes", async () => {
  const source = await read("src/features/midweek/actions/midweek.ts")
  assert.ok(source.indexOf('.upsert(') < source.indexOf('.delete()'))
  assert.match(source, /onConflict: "meeting_id,section,sort_order"/)
})

test("dashboard bloquea clickjacking", async () => {
  const config = await read("next.config.ts")
  assert.match(config, /X-Frame-Options/)
  assert.match(config, /frame-ancestors 'none'/)
})
