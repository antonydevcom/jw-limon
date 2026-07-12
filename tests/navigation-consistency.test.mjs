import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import test from "node:test"

const root = new URL("../", import.meta.url)

test("navbar comparte destino optimista entre escritorio y móvil", async () => {
  const provider = await readFile(new URL("src/components/layout/NavigationProvider.tsx", root), "utf8")
  const desktop = await readFile(new URL("src/components/layout/DesktopNavigation.tsx", root), "utf8")
  const mobile = await readFile(new URL("src/components/layout/MobileNavigation.tsx", root), "utf8")

  assert.match(provider, /pendingPath/)
  assert.match(provider, /onNavigate/)
  assert.match(provider, /pathname === pendingPath/)
  assert.match(desktop, /NavigationLink/)
  assert.match(desktop, /activePath/)
  assert.match(mobile, /NavigationLink/)
  assert.match(mobile, /activePath/)
})

test("cambio de sección no reemplaza contenido completo por skeleton", async () => {
  await assert.rejects(
    readFile(new URL("src/app/(app)/dashboard/loading.tsx", root), "utf8"),
    { code: "ENOENT" },
  )
})

test("móvil usa etiquetas compactas y no muestra control de instalación", async () => {
  const shell = await readFile(new URL("src/components/layout/AppShell.tsx", root), "utf8")
  const mobile = await readFile(new URL("src/components/layout/MobileNavigation.tsx", root), "utf8")

  assert.doesNotMatch(shell, /PwaInstallButton/)
  assert.match(mobile, /"Semanal"/)
  assert.match(mobile, /"Fin de semana"/)
})

test("dashboard muestra como máximo dos próximas reuniones y no tiene Ver formato", async () => {
  const dashboard = await readFile(new URL("src/app/(app)/dashboard/page.tsx", root), "utf8")

  assert.match(dashboard, /meetings\.length < 2/)
  assert.doesNotMatch(dashboard, /Ver formato/)
})

test("dashboard conserva orden cronológico de próximas reuniones", async () => {
  const dashboard = await readFile(new URL("src/app/(app)/dashboard/page.tsx", root), "utf8")

  assert.match(dashboard, /upcomingMeetings\.map\(\(meeting\)/)
  assert.match(dashboard, /never prioritize meeting type over date/)
  assert.doesNotMatch(dashboard, /\{midweekMeeting && \(/)
  assert.doesNotMatch(dashboard, /\{weekendMeeting && \(/)
})

test("reunión semanal muestra cada asignación sin minutos y EBC identifica conductor y lector", async () => {
  const dashboard = await readFile(new URL("src/app/(app)/dashboard/page.tsx", root), "utf8")

  assert.doesNotMatch(dashboard, /durationMinutes/)
  assert.doesNotMatch(dashboard, /Asignado/)
  assert.match(dashboard, /Conductor/)
  assert.match(dashboard, /Lector/)
  assert.match(dashboard, /MidweekAssignments/)
})
