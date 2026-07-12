# Midweek Persistence Audit Implementation Plan

> **For Codex:** Execute this plan task-by-task. Do not deploy, commit, or change production data without explicit approval.

**Goal:** Prove and fix why Reunión Semanal appears to lose published edits after refresh while every other schedule editor persists them.

**Architecture:** Treat save and reload as one transaction boundary: client snapshot -> Server Action -> authenticated Supabase write -> server read -> editor state. Add explicit result contracts and user-safe errors; do not silently replace failed reads with base-template content. Preserve current base sections for a truly new week.

**Tech Stack:** Next.js App Router, React client component, Server Actions, Supabase Postgres/RLS, TypeScript, Node test runner.

---

## Audit evidence collected

- Direct read-only database audit found published `midweek` period records and eight persisted part rows for each July meeting. No duplicate `(section, sort_order)` positions were found.
- The write path updates `midweek_meetings` and `midweek_parts` before returning success in `src/features/midweek/actions/midweek.ts`.
- `src/app/(app)/dashboard/reunion-semanal/page.tsx` currently drops Supabase read errors by using `data ?? []`. A failed child read becomes indistinguishable from an empty new schedule.
- `src/features/midweek/components/MidweekEditor.tsx` creates base rows whenever `savedParts` has no rows. This is correct only when no meeting has been saved; it masks failed reads and needs an explicit load-state contract.
- Current editor returns no visible save error. A failed action can look like a successful refresh to an admin.

## Scope guardrails

- Keep eight base parts for a new unsaved week.
- Do not remove base sections or create generic spreadsheet behavior.
- Do not use service-role credentials in browser or client components.
- Do not log names, assignments, or full Supabase errors to users.
- Do not alter production records during verification. Use a user-provided sentinel value only after consent.

### Task 1: Capture exact failed round trip before modifying behavior

**Files:**
- Modify: `tests/midweek-persistence.test.mjs` (new focused regression test file)
- Reference: `src/features/midweek/components/MidweekEditor.tsx:135-220`
- Reference: `src/features/midweek/actions/midweek.ts:30-95`

**Step 1: Write failing test for explicit save result handling**

```js
test("guardado semanal no refresca cuando una semana devuelve error", async () => {
  const source = await read("src/features/midweek/components/MidweekEditor.tsx")

  assert.match(source, /const firstError = saveResults\.find\(\(result\) => result\.error\)/)
  assert.match(source, /setSaveError\(firstError\.error\)/)
  assert.doesNotMatch(
    source.slice(source.indexOf("function handleSavePublished"), source.indexOf("const publishControls")),
    /if \(!saveResults\.some\(\(result\) => result\.error\)\) router\.refresh\(\)/,
  )
})
```

**Step 2: Run test red**

Run: `pnpm test -- --test-name-pattern="guardado semanal no refresca"`

Expected: FAIL. Current editor does not retain/display server-action error.

**Step 3: Perform one consented sentinel reproduction**

Ask admin to change one July field to an agreed non-personal marker, for example `AUDIT-719`, click `Guardar`, then report completion. Run a read-only service-role query that returns only:

```js
{ markerPresent: Boolean(row), meetingUpdatedAt: row?.updated_at ?? null }
```

Never print assignment names, titles, IDs, or tokens.

**Step 4: Record result in this plan**

- Marker absent: investigate client snapshot/action payload.
- Marker present but page stale: investigate server read/RSC refresh path.
- Write returns error: capture only error class/code, then inspect RLS/select policy.

### Task 2: Make midweek reads fail loudly instead of rendering defaults

**Files:**
- Modify: `src/app/(app)/dashboard/reunion-semanal/page.tsx:52-70`
- Test: `tests/midweek-persistence.test.mjs`

**Step 1: Write failing test**

```js
test("página semanal no convierte error de lectura en plantilla vacía", async () => {
  const source = await read("src/app/(app)/dashboard/reunion-semanal/page.tsx")

  assert.match(source, /const \{ data: meetings, error: meetingsError \}/)
  assert.match(source, /if \(meetingsError\)/)
  assert.match(source, /No se pudo cargar la reunión semanal\./)
})
```

**Step 2: Run test red**

Run: `pnpm test -- --test-name-pattern="página semanal no convierte"`

Expected: FAIL.

**Step 3: Implement minimal error state**

Capture `meetingsError` and `partsError`. If either exists, render this user-safe Spanish state and do not mount `MidweekEditor`:

```tsx
<p className="text-sm text-[var(--danger)]">
  No se pudo cargar la reunión semanal. Recarga la página o inténtalo de nuevo.
</p>
```

Keep raw database details server-only.

**Step 4: Run focused test green**

Run: `pnpm test -- --test-name-pattern="página semanal no convierte"`

Expected: PASS.

### Task 3: Return and display safe save failures from Reunión Semanal

**Files:**
- Modify: `src/features/midweek/components/MidweekEditor.tsx:235-266`
- Test: `tests/midweek-persistence.test.mjs`

**Step 1: Write failing test**

```js
test("guardar semanal conserva edición y muestra error seguro si acción falla", async () => {
  const source = await read("src/features/midweek/components/MidweekEditor.tsx")

  assert.match(source, /const \[saveError, setSaveError\] = useState<string \| null>\(null\)/)
  assert.match(source, /const firstError = saveResults\.find\(\(result\) => result\.error\)/)
  assert.match(source, /setSaveError\(firstError\.error\)/)
  assert.match(source, /\{saveError &&/)
})
```

**Step 2: Run test red**

Run: `pnpm test -- --test-name-pattern="guardar semanal conserva"`

Expected: FAIL.

**Step 3: Implement minimal state handling**

Add `saveError` before save. On first `result.error`, preserve client state, set user-safe error, and skip `router.refresh()`. On success, clear error before refresh. Render an accessible alert near controls:

```tsx
{saveError && (
  <p role="alert" className="text-sm text-[var(--danger)]">
    {saveError}
  </p>
)}
```

**Step 4: Run focused test green**

Run: `pnpm test -- --test-name-pattern="guardar semanal conserva"`

Expected: PASS.

### Task 4: Verify persisted payload before claiming success

**Files:**
- Modify: `src/features/midweek/actions/midweek.ts:44-95`
- Test: `tests/midweek-persistence.test.mjs`

**Step 1: Write failing test for explicit post-write select**

```js
test("acción semanal confirma reunión guardada antes de devolver éxito", async () => {
  const source = await read("src/features/midweek/actions/midweek.ts")

  assert.match(source, /\.select\("id, meeting_date"\)/)
  assert.match(source, /if \(!meeting \|\| meeting\.meeting_date !== meetingData\.meeting_date\)/)
})
```

**Step 2: Run test red**

Run: `pnpm test -- --test-name-pattern="acción semanal confirma"`

Expected: FAIL.

**Step 3: Implement narrow confirmation**

Keep current upsert, but select `id, meeting_date`; reject a missing/mismatched row with `databaseError()`. Do not return field values to client and do not log data.

**Step 4: Run focused test green**

Run: `pnpm test -- --test-name-pattern="acción semanal confirma"`

Expected: PASS.

### Task 5: Verify published save and reload with real authenticated read

**Files:**
- Modify: `tests/midweek-persistence.test.mjs`
- Reference: `supabase/migrations/0004_format_tables.sql:69-140`
- Reference: `supabase/migrations/0007_restrict_draft_schedule_reads.sql:116-159`

**Step 1: Add structural regression coverage**

```js
test("lectura semanal conserva periodo y consulta partes por reuniones del periodo", async () => {
  const source = await read("src/app/(app)/dashboard/reunion-semanal/page.tsx")

  assert.match(source, /\.eq\("period_id", period\.id\)/)
  assert.match(source, /\.in\("meeting_id", meetingIds\)/)
})
```

**Step 2: Add authenticated manual acceptance script to plan**

1. Select July 2026 as admin.
2. Change one non-sensitive title to consented marker.
3. Click `Guardar` once.
4. Confirm success/error state.
5. Browser hard refresh.
6. Confirm marker remains.
7. Query DB read-only for marker existence and update timestamp.

**Step 3: Run all checks**

Run:

```bash
pnpm test
pnpm lint
pnpm typecheck
pnpm build
```

Expected: every command exits `0`.

### Task 6: Final audit decision

**Files:**
- Modify: `docs/audits/midweek-persistence-audit.md` (only if a persistent cause/fix is confirmed)

**Step 1: Document verified cause only**

Write: reproduction, evidence, changed files, test coverage, result. Do not include member names, schedule contents, IDs, cookies, or database credentials.

**Step 2: Report remaining blocker if any**

If marker reaches DB but browser still shows old content, stop code changes and inspect active deployment/build identity. If marker does not reach DB, inspect Server Action request and RLS error code before modifying schema.

## Final verification checklist

- [ ] New week shows all eight base parts.
- [ ] Published July edit saves and remains after hard refresh.
- [ ] Published July edit failure shows safe Spanish error and preserves typed values.
- [ ] No failed Supabase read renders fake base data.
- [ ] Viewer remains read-only.
- [ ] No service-role key enters client code.
- [ ] `pnpm test`, `pnpm lint`, `pnpm typecheck`, and `pnpm build` pass.
