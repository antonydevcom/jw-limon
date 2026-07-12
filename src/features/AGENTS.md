# AGENTS.md — Backend / Features / Supabase

Rules for agents working on backend, feature modules, Supabase, validation, authorization, PDF export routes, and domain logic in JW-Limon / Congregación El Limón. Root `AGENTS.md` always applies. When rules conflict, follow the stricter and more specific rule.

Frontend note: feature UI under `src/features/<feature>/components/` must also follow `src/components/AGENTS.md`.

---

## 0. Source Of Truth

Read in this order before backend work:

1. Root `AGENTS.md`
2. `README.md`
3. `docs/ARCHITECTURE.md`
4. This file
5. `src/components/AGENTS.md` only if the task touches UI.

Do not invent congregation data, member names, real assignments, official publication content, legal text, or final policy language.

---

## 1. Scope

Allowed in backend/features scope:

- `src/features/<feature>/data/`
- `src/features/<feature>/actions/`
- `src/features/<feature>/schemas/`
- `src/features/<feature>/types/`
- `src/features/<feature>/utils/`
- `src/shared/supabase/`
- `src/shared/auth/`
- `src/shared/validation/`
- `src/shared/errors/`
- `src/shared/utils/`
- `src/app/api/**` route handlers when explicitly scoped.
- Supabase Auth/session helpers.
- Supabase Postgres schema/RLS/migrations when explicitly scoped.
- Server-side PDF export implementation when explicitly scoped.

Forbidden unless explicitly requested:

- UI redesign.
- Client component styling.
- New frontend dependencies.
- Deployment/Vercel/Cloudflare config.
- Email/SMS integrations.
- Stripe/payments.
- Open/public signup.
- Public anonymous member/schedule reads.
- Automatic rotation algorithms as MVP behavior.

If backend work needs UI changes, say so. If UI work needs backend changes, keep the backend change scoped and documented.

---

## 2. Product Data Model

Core product model:

- `admin` creates, edits, publishes, archives, and downloads.
- `viewer` sees dashboard, navigates sections, views published formats, and downloads PDFs.
- All data is scoped by `congregation_id`.
- Servicio is a fixed editable format, not a monthly period.
- Other schedule formats are period-based.
- Manual editing is source of truth in MVP.
- PDF is the only export format unless the user explicitly adds another.

Main feature modules:

| Feature | Purpose |
|---|---|
| `dashboard` | Events, reminders, published formats, admin pending work. |
| `members` | Publisher/member records, privileges, qualifications, absences. |
| `schedule-templates` | Shared period/status/template helpers, no generic user-designed templates in MVP. |
| `midweek` | Reunión Semanal / Vida y Ministerio schedule. |
| `weekend` | Reunión de Fin de Semana / public talk schedule. |
| `readers` | Lectores monthly format. |
| `duties` | Acomodadores: entrada, auditorio, micrófono 1, micrófono 2, observaciones. |
| `cleaning` | Limpieza monthly group responsibilities. |
| `hospitality` | Hospitalidad monthly group responsibilities. |
| `field-service` | Servicio fixed weekly service-meeting format. |
| `service-groups` | Groups and group metadata used by hospitality/cleaning/service. |
| `reports` | PDF export orchestration and export history if needed. |
| `settings` | Congregation settings, accent/theme defaults, meeting days/times. |

---

## 3. Module Structure

Each feature follows this shape when needed:

```text
src/features/<feature>/
├── components/  # feature UI; also follows src/components/AGENTS.md
├── actions/     # server actions and mutations
├── data/        # reads/query functions
├── schemas/     # Zod validation
├── types/       # feature TS contracts and mapped models
└── utils/       # pure helpers scoped to the feature
```

Rules:

- `data/` reads only.
- `actions/` writes only.
- `schemas/` validates every external input.
- `types/` defines domain contracts and mapped return types.
- `utils/` contains pure helper logic.
- Cross-feature logic goes to `src/shared/`.
- Do not duplicate domain rules in UI and backend.
- Keep functions narrow and named for one use case.
- Prefer explicit selects over `select('*')`.
- Return typed mapped objects to UI, not raw Supabase rows.

---

## 4. Naming

- DB tables/columns: `snake_case` English.
- TypeScript variables/functions: `camelCase`.
- React components/types/interfaces: `PascalCase`.
- Folders: `kebab-case`.
- UI labels: Spanish.
- Code identifiers: English.

Examples:

| UI Term | Code Identifier |
|---|---|
| Reunión Semanal | `midweek_meeting` |
| Reunión de Fin de Semana | `weekend_meeting` |
| Acomodadores | `attendants` / `duties` |
| Limpieza | `cleaning` |
| Hospitalidad | `hospitality` |
| Servicio | `field_service` |
| Superintendente de grupo | `group_overseer` |

---

## 5. Validation

Every external input must be validated server-side with Zod:

- Server Action args.
- Route Handler bodies/query params.
- URL params used for reads/writes.
- Period creation.
- Schedule row edits.
- Member data.
- User invitations/role changes.
- Settings changes.
- PDF export params.
- File metadata if Storage is used.

Rules:

- Use `unknown` and narrow; never use `any`.
- Trim and normalize text inputs.
- Validate dates and periods strictly.
- Validate role values as `admin` or `viewer`.
- Reject client-provided server-owned fields (`id`, `created_at`, `updated_at`, `congregation_id`, `published_at`, `created_by`) unless authorized and intentionally accepted.
- Keep shared schemas in `src/shared/validation/` only when reused across modules.
- Keep domain-specific schemas in `src/features/<feature>/schemas/`.

---

## 6. Supabase Clients

Client separation:

- Browser client: client-side session/auth UI only when needed.
- Server client: session-aware server reads/writes.
- Admin/service-role client: server-only, rare, only when policy-safe operations require it.

Rules:

- Never import service-role/admin client into client components.
- Never expose `SUPABASE_SERVICE_ROLE_KEY`.
- Never log secrets or full member data.
- Prefer generated Supabase database types.
- Map DB `snake_case` to TS `camelCase` in data functions.
- Check official Supabase docs for non-trivial Auth/RLS/SSR work.

---

## 7. Auth And Authorization

Auth model:

- Closed registration only.
- `admin` invites users.
- No public signup.
- Every user belongs to a congregation.
- Every domain table is scoped by `congregation_id`.

Authorization:

- `admin`: create/edit/delete/archive/publish formats, manage members, manage users, settings, download PDFs.
- `viewer`: view dashboard, navigate sections, read published formats, download published PDFs.

Rules:

- Verify session server-side before protected reads/writes.
- Verify role server-side before every write.
- Do not authorize from client-provided role data.
- Do not authorize from user-editable metadata.
- Prevent IDOR/BOLA: verify access to the specific row and congregation, not just login.
- Unauthenticated access redirects or returns safe errors.

---

## 8. RLS Policies

RLS is required on every app table.

Baseline policy intent:

- `admin` can read/write rows for their `congregation_id`.
- `viewer` can read safe/published rows for their `congregation_id`.
- `viewer` cannot insert, update, delete, publish, archive, invite, or edit members/settings.
- Anonymous users read nothing by default.
- Public read is disabled unless a future explicit opt-in feature is approved.

Policy rules:

- `TO authenticated` alone is not authorization.
- `UPDATE` needs both matching `USING` and `WITH CHECK`.
- Avoid `SECURITY DEFINER`; if required, validate `auth.uid()`, restrict search path, and revoke broad execute.
- Views should use `security_invoker = true` on Postgres 15+ or stay out of exposed schemas.
- Storage buckets for generated PDFs must be private if files are persisted.
- Signed URLs must be short-lived.
- After schema/RLS changes, run advisors/checks when available.

---

## 9. Database And Migrations

Do not change schema unless the task explicitly includes database work.

Migration rules:

- Keep migrations small and focused.
- Do not drop tables/columns/data without explicit approval.
- Add indexes for real query patterns, not speculation.
- Align DB enums, TypeScript types, Zod schemas, and UI filters in the same scoped change.
- Use `created_at` and `updated_at` on domain tables.
- Prefer explicit foreign keys.
- Keep `congregation_id` on every domain table.
- Consider `updated_by` / `published_by` for schedule auditability.
- Update `.env.example` only when adding a new env var, never with secret values.

Data sensitivity:

- Member affiliation is sensitive personal data.
- Store minimum needed for scheduling.
- Avoid national IDs, addresses, or sensitive notes unless explicitly approved.
- Support deletion/anonymization strategy for member data.

---

## 10. Feature-Specific Backend Rules

### Members

- Store member data minimally.
- Track active/inactive status.
- Qualifications determine eligible assignment choices.
- Absences/availability should be date-based and optional.
- Viewer should not get administrative member data unless needed for published schedule display.

### Reunión Semanal (`midweek`)

- Store weekly meeting records and parts.
- Parts/titles are user-entered; do not scrape/reproduce official publication content.
- Admin manually fills assignments.
- Validate dates, durations, ordering, and member IDs.
- Warn on conflicts when possible, but do not block admin by default.

### Reunión de Fin de Semana (`weekend`)

- Store monthly/weekend meeting records.
- Speakers can be local members or visitor speakers.
- Talk outline catalog is maintained data; do not fabricate real outline numbers/titles.
- Store hospitalidad group link when assigned.

### Lectores

- Monthly period-based format.
- Store date, reader type, reader member.
- Validate reader type enum.

### Acomodadores

- Monthly period-based format.
- Required slots: `entrance`, `auditorium`, `microphone_1`, `microphone_2`.
- `notes` supports observations shown in the format.

### Limpieza

- Monthly period-based format.
- Assign group to meeting/service date.
- Do not assume automatic rotation.

### Hospitalidad

- Monthly period-based format.
- Assign service group to Sunday date.
- Do not assume automatic rotation.

### Servicio

- Fixed editable format.
- No monthly `schedule_period` required by default.
- Rows represent weekday + time slot + time + location + captain.
- Admin edits current values; viewer sees current published/active values.

### Dashboard

- Store simple events/reminders.
- Keep visibility controlled: `admin_only` or `all_users`.
- Do not turn dashboard into analytics in MVP.

---

## 11. Periods And Publishing

For period-based formats:

- Default period is current month or current week depending on feature.
- Admin can create future periods.
- Admin can select previous periods.
- Drafts are visible/editable only to admin.
- Published records are visible to viewer.
- Changes after publish should mark the format as updated or update `updated_at`.
- Avoid deleting published history unless explicitly requested.

For Servicio:

- Use active fixed rows.
- If history becomes necessary later, add it explicitly; do not build it speculatively.

---

## 12. PDF Export

PDF is backend-owned.

Rules:

- Generate PDFs server-side from saved database records.
- Do not generate final PDFs from temporary client state.
- `viewer` can download only published/safe formats.
- `admin` can generate PDFs for admin needs; default product behavior should emphasize published output.
- Validate export params: feature key, period ID/range, congregation access.
- No public anonymous PDF URLs.
- If persisted, store in private Supabase Storage with short-lived signed URLs.
- PDF visual output should match current spreadsheet formats as closely as practical.
- Prefer print legibility over pixel-perfect hacks.
- Never include official logos/artwork/branding.

Route handler guidance:

```text
src/app/api/exports/<format>/route.ts
```

Each route should:

1. Authenticate.
2. Authorize row/congregation/role.
3. Validate params with Zod.
4. Load saved data through feature `data/`.
5. Render PDF server-side.
6. Return file response or signed URL.
7. Log only safe metadata.

---

## 13. Errors And Logging

- Return typed action results or safe errors.
- UI-facing errors must be Spanish and user-safe.
- Logs may include IDs and safe metadata, not full personal data.
- Never expose raw stack traces to users.
- Do not swallow Supabase errors silently.
- Missing records can return typed not-found results.
- Unexpected errors should be logged safely and surfaced generically.

---

## 14. Caching And Revalidation

- Authenticated/dashboard data should be dynamic/session-aware.
- Do not publicly cache personalized or member-sensitive responses.
- Revalidate affected paths/tags after mutations.
- Be conservative with Next.js caching until auth/data boundaries are verified.
- Do not introduce Partial Prerendering/cache components blindly.

---

## 15. Storage

Use Supabase Storage only when needed.

Potential uses:

- Persisted generated PDFs.
- Future visual assets/logo uploaded by admin.

Rules:

- Buckets containing member/program PDFs are private.
- Storage paths include `congregation_id`.
- Signed URLs are short-lived.
- Deletes require admin access.
- Do not orphan files when deleting database records unless explicitly accepted.

---

## 16. Security

- No secrets in client code.
- No secrets in logs.
- No `.env.local` commits.
- Validate all external input.
- Use parameterized Supabase queries/SQL; never interpolate user input into raw SQL.
- Guard against IDOR/BOLA.
- Keep CORS restrictive.
- Use least privilege for service-role operations.
- Rate-limit or protect public endpoints if any are introduced later.
- Sanitize rich text/HTML if user-editable rich text ever appears.
- Do not store passwords, API keys, or credentials in the app database.

---

## 17. Backend Skill Usage

Use only project-local skills from `.agents/skills`. When a task matches one of these skills, read `.agents/skills/<skill>/SKILL.md` before acting, plus only the relevant referenced files needed for the task.

| Skill | Use when |
|---|---|
| `writing-plans` | Creating implementation plans for multi-step backend/features work. |
| `test-driven-development` | Adding or changing backend behavior where tests should define expected behavior first. |
| `systematic-debugging` | Backend bugs, failing builds, auth/RLS issues, unclear root cause. |
| `verification-before-completion` | Before claiming backend/security/PDF/RLS work is complete. |
| `requesting-code-review` | Significant backend/schema/security changes before delivery. |
| `code-quality` | Clean Code/SOLID/DRY review, refactor quality, maintainability checks. |
| `supabase` | Any Supabase task: Auth, Database, Storage, RLS, SSR clients, migrations, policies. |
| `supabase-postgres-best-practices` | SQL, indexes, RLS performance, schema design, Postgres performance. |
| `nextjs-supabase-auth` | Supabase Auth integration with Next.js App Router, protected routes, session helpers, middleware. |
| `database-migration` | Migration design, schema changes, rollback safety, data migration planning. |
| `security-best-practices` | Auth, authorization, secrets, privacy, member-data exposure, secure server/client boundaries. |
| `nextjs-app-router-patterns` | Route Handlers, Server Actions, RSC, route groups, dynamic/static rendering. |
| `typescript-advanced-types` | Strict domain contracts, generated DB type usage, mapped types, action return types. |
| `zod-schema-validation` | Zod validation for actions, route handlers, forms, params, export options, and admin settings. |
| `pdf` | PDF generation, layout inspection, rendering, and verification. |
| `xlsx` | Reading/analyzing source `.xlsx` formats before mapping them to database-backed templates or PDFs. |
| `playwright` | Auth/role/download flow verification when browser automation is explicitly useful and allowed. |
| `webapp-testing` | End-to-end app flow testing guidance for protected pages, roles, downloads, and publishing. |
| `screenshot` | Screenshot capture/review for PDF or protected UI verification. |
| `core-web-vitals` | User-perceived performance work that crosses server/rendering boundaries. |
| `pwa-development` | Server/manifest pieces for installed app behavior if PWA scope touches backend/config. |
| `vercel-optimize` | Vercel/API/runtime optimization when explicitly scoped. |
| `deploy-to-vercel` | Only explicit deployment tasks. |
| `vercel-cli-with-tokens` | Only explicit Vercel CLI/token workflows. |
| `writing-guidelines` | Backend docs, architecture notes, README/API documentation wording. |
| `pnpm` | Package/script/lockfile troubleshooting when backend dependencies or scripts are involved. |

Avoid for pure backend scope unless task explicitly crosses boundaries:

- Frontend visual/design skills.
- UI accessibility/responsive skills.
- Deployment skills for normal feature changes.
- Prisma skills; this project uses Supabase directly.
- Stripe/payment skills; no payments in MVP.
- SEO skills; this is a private app.

---

## 18. Testing And Verification

Never start dev servers or watch commands.

Allowed checks, after confirming scripts exist:

```bash
pnpm lint
pnpm exec tsc --noEmit
pnpm build
pnpm test
```

Use tests proportional to risk:

- Schemas/utils: unit tests when setup exists.
- Actions/data: integration tests when setup exists.
- RLS/schema: verify anon/authenticated/admin/viewer behavior.
- PDF: verify file generation and representative layout when PDF tooling exists.

Expected backend coverage once implementation exists:

- Auth redirects/session requirements.
- `admin` can create/edit/publish.
- `viewer` cannot write.
- `viewer` can view/download only published formats.
- RLS blocks anonymous and cross-congregation access.
- Zod rejects malformed payloads.
- Period creation defaults correctly.
- Servicio stays fixed and editable.
- PDF export uses saved data and denies unauthorized access.

For Supabase work, also consider:

```bash
supabase --version
supabase db advisors
supabase migration list --local
```

Use Supabase MCP tools when available for schema, RLS, advisors, and SQL verification. If tools are unavailable, say what was not verified.

---

## 19. Review Checklist

Before final response on backend work:

- Scope stayed in backend/features unless explicitly broadened.
- All external inputs validated with Zod.
- Server-side auth/authorization exists before protected reads/writes.
- RLS impact considered.
- `admin`/`viewer` permissions respected.
- No public member data exposure.
- No service-role/client leakage.
- No official publication content stored or scraped.
- No fake real congregation/member data.
- DB `snake_case` maps to TS `camelCase` in data layer.
- No `any`.
- No secrets or sensitive PII in logs.
- Mutations revalidate affected UI where applicable.
- PDF export uses saved records and protected access.
- Checks run match the risk, or skipped checks are stated clearly.
