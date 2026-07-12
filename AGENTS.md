# AGENTS.md — JW-Limon

Project rules for AI agents working in this repository. Read this file before any work.

> Project: JW-Limon, a Spanish-language web app for congregation scheduling and organization, inspired by New World Scheduler-style tools. Product name in the app: "Congregación El Limón"; short installed-app name: "El Limón". It manages congregation members, Reunión Semanal, Reunión de Fin de Semana, duties, cleaning, hospitality, service meetings, reminders, and printable/exportable PDF schedules.

> **Disclaimer**: This is an independent, unofficial project. It is NOT affiliated with, endorsed by, or connected to Watch Tower Bible and Tract Society, jw.org, or New World Scheduler. Never use official JW branding, logos, official artwork, or naming that could cause confusion with official software.

---

## 0. Source Of Truth

Read these before planning or editing:

1. `AGENTS.md`
2. `README.md`
3. `docs/ARCHITECTURE.md`
4. Scope-specific nested `AGENTS.md`:
   - Frontend/UI/pages/components: `src/components/AGENTS.md`
   - Backend/features/Supabase/data/actions: `src/features/AGENTS.md`

If instructions conflict, prefer the more project-specific and newer instruction. Do not invent missing congregation or business data.

---

## 1. Local Skills

Project-local skills installed with `skills.sh` live in:

```text
.agents/skills/
```

Use `.agents/skills` as the canonical project skill directory. Do not create `.skills`, duplicate tool-specific skill folders, or scatter skill copies across the repo unless the user explicitly asks.

When a task matches an installed skill, read that skill's `SKILL.md` before acting. If the skill references additional local files, read only the relevant referenced files needed for the task. Do not cite or require skills that are not installed in `.agents/skills`.

Installed project skills:

| Skill | Use when |
|---|---|
| `pnpm` | Package management, lockfile work, dependency/script troubleshooting. Use `pnpm` only. |
| `writing-plans` | Planning multi-step implementation before code changes. |
| `test-driven-development` | Adding or changing behavior where tests should define expected outcomes first. |
| `systematic-debugging` | Bugs, failing checks, unclear root causes, regressions. |
| `verification-before-completion` | Before claiming broad, risky, security, PDF, or workflow work is complete. |
| `requesting-code-review` | Before final delivery of broad feature, schema, auth, or shared component changes. |
| `code-quality` | Clean Code/SOLID/DRY review, refactor quality, maintainability checks. |
| `nextjs-app-router-patterns` | Next.js App Router routes, layouts, Server/Client Component boundaries, Route Handlers, Server Actions, caching/revalidation decisions. |
| `typescript-advanced-types` | Complex TypeScript contracts, mapped types, strict typing, avoiding `any`, reusable domain types. |
| `supabase` | Any Supabase work: Auth, SSR clients, Database, Storage, RLS, migrations, policies, generated types. |
| `supabase-postgres-best-practices` | Postgres schema design, indexes, SQL, RLS performance, query performance. |
| `nextjs-supabase-auth` | Supabase Auth with Next.js App Router, protected routes, session handling, auth middleware. |
| `database-migration` | Migration planning, schema changes, migration safety, rollback thinking. |
| `security-best-practices` | Auth, authorization, secrets, privacy, member-data exposure, secure server/client boundaries. |
| `zod-schema-validation` | Zod schemas, server-side validation, form/action payload validation. |
| `pdf` | PDF generation, PDF layout, PDF rendering/inspection, export verification. |
| `xlsx` | Reading/analyzing source Excel `.xlsx` formats such as `Programas_congregación.xlsx`. |
| `playwright` | Browser automation, screenshots, keyboard/accessibility flow verification when the user runs or allows runtime testing. |
| `webapp-testing` | End-to-end app flow testing guidance for login, roles, dashboard navigation, downloads. |
| `screenshot` | Capturing or reviewing screenshots for UI/PDF layout checks. |
| `frontend-design` | Building or redesigning polished screens, dashboards, forms, schedule pages, or UI flows. |
| `design-taste-frontend` | Improving visual quality, avoiding generic UI, refining layout, hierarchy, and taste. |
| `web-design-guidelines` | Reviewing UI against interface, interaction, layout, and visual quality rules. |
| `accessibility` | WCAG, keyboard support, focus states, labels, dialogs, tables, contrast. |
| `responsive-design` | Mobile/desktop layout, sidebar behavior, responsive schedule tables, overflow fixes. |
| `tailwind-design-system` | Tailwind tokens, theme variables, component variants, reusable design primitives. |
| `shadcn` | shadcn/ui primitives, composition, installation/customization patterns. |
| `vercel-react-best-practices` | React/Next performance, minimizing client components, rendering patterns. |
| `vercel-composition-patterns` | Component APIs, composition, slots, avoiding boolean prop explosions. |
| `vercel-react-view-transitions` | View transitions and route/page motion when explicitly requested. |
| `core-web-vitals` | LCP/INP/CLS and user-perceived performance issues. |
| `pwa-development` | PWA manifest/install behavior, app icon/start URL/display mode, installed short name "El Limón". |
| `vercel-optimize` | Vercel performance, deployment optimization, bundle/runtime checks when explicitly scoped. |
| `deploy-to-vercel` | Deployment tasks only when explicitly requested. |
| `vercel-cli-with-tokens` | Vercel CLI/token workflows only when explicitly requested. |
| `writing-guidelines` | User-facing docs/copy, README/docs polish, concise project writing. |

Skill usage by scope is detailed in nested AGENTS files:

- Frontend/UI: `src/components/AGENTS.md`
- Backend/features/Supabase/PDF: `src/features/AGENTS.md`

---

## 2. Commands

Use `pnpm` only. Never use `npm` or `yarn`.

Expected scripts once the app is scaffolded:

```bash
pnpm install
pnpm build
pnpm lint
```

TypeScript check when no `typecheck` script exists:

```bash
pnpm exec tsc --noEmit
```

Rules:

- Never start dev servers or long-running processes (`pnpm dev`, `--watch`, `--daemon`).
- Allowed verification commands only: `build`, `tsc --noEmit`, `lint`, `typecheck`, `test`.
- If a task requires visual or runtime verification, stop and tell the user to run and test manually.
- Only run `pnpm format`, `pnpm typecheck`, or `pnpm test` after confirming those scripts exist in `package.json`.
- Before delivery, relevant available checks must pass or blockers must be stated.

---

## 3. Core Engineering Principles

Apply these by default on every implementation task:

- **Clean Code**: names reveal intent; functions/components stay small and do one thing; comments explain why, not what; delete dead code instead of commenting it out.
- **SOLID**: keep modules and functions single-purpose; depend on narrow interfaces; avoid coupling UI, data access, validation, and export generation in one file.
- **DRY**: duplicated logic used twice or more must be extracted. Cross-cutting logic goes in `shared/`; module-specific logic goes in `features/<module>/utils/`.
- **KISS**: choose the simplest implementation that satisfies the current product requirement.
- **YAGNI**: do not build speculative features, hidden automation, extra roles, unused config, or generic frameworks unless the user explicitly asks.
- **Small, reviewable changes**: one logical change at a time. Avoid broad refactors when a focused edit solves the task.

---

## 4. Module Boundaries

Respect the modular monolith boundaries:

- UI components render state and call module APIs; they do not contain Supabase queries or scheduling business rules.
- Reads live in `features/<module>/data/`.
- Writes live in `features/<module>/actions/` or route handlers.
- Validation schemas live in `features/<module>/schemas/`.
- Types live in `features/<module>/types/` or generated database types.
- Shared UI primitives live in `components/`; feature-specific UI lives in `features/<module>/components/`.
- Shared date/period/export helpers live in `shared/`.
- Do not modify a layer outside the task scope without a clear reason. If a UI change requires a schema or RLS change, state that explicitly before expanding scope.
- Do not invent new top-level folders. Follow `docs/ARCHITECTURE.md`.

---

## 5. Type Safety, Validation, And Errors

- TypeScript should stay strict. Avoid `any`; use `unknown` plus narrowing when a value is not known.
- Database tables and columns use `snake_case`; map DB shapes to UI-friendly types in data functions, not inside React components.
- Supabase database types should be generated when the app is scaffolded; do not hand-write full database types when generated types are available.
- Every external input must be validated with Zod on the server: forms, server action arguments, route handler payloads, query params, file/export options, and admin settings.
- Never trust client-side validation alone.
- Fail clearly: show user-safe Spanish messages in UI, but never leak stack traces, secrets, RLS details, or raw database errors to users.

---

## 6. Product Scope

Single application with two surfaces:

- **Public surface**: login page and optionally a read-only published schedule view (behind explicit opt-in, never public by default).
- **Private app**: the scheduling system for authorized congregation users.

MVP modules, in priority order:

1. Auth and roles.
2. Congregation members (publishers) with privileges and assignment eligibility.
3. Template-driven schedule editors based on the current spreadsheet formats.
4. Reunión Semanal scheduler (Vida y Ministerio / midweek meeting).
5. Reunión de Fin de Semana scheduler (weekend meeting, local and visiting speakers).
6. Acomodadores scheduler (entrada, auditorio, micrófonos, and future duty types).
7. Limpieza and Hospitalidad schedulers.
8. Service groups and field service meetings.
9. Dashboard reminders and upcoming events.
10. Reports/export foundation (printable and PDF schedules).

Do not build features outside the MVP without explicit request. No preaching-report tracking (informes de predicación) in MVP — schedules only.

---

## 7. Roles

| Role | Access |
|---|---|
| `admin` | Full access: congregation settings, users, members, all schedules, publishing, and PDF downloads. |
| `viewer` | Normal user access: dashboard, sidebar navigation, published schedule viewing, and PDF downloads only. |

All access is scoped to a single congregation. Multi-congregation support is a data-model concern from day one (`congregation_id` on every domain table), not a UI feature in MVP.

---

## 8. Language Rules

- Code, identifiers, comments, branch names, commit messages, technical prompts: English.
- User-facing UI copy: Spanish. This is a Spanish-first product.
- `README.md` and `docs/ARCHITECTURE.md`: Spanish.
- Agent instruction files (`AGENTS.md`, `CLAUDE.md`): English.
- Database tables and columns: `snake_case` English.
- TypeScript variables/functions: `camelCase`.
- React components/types: `PascalCase`.
- Folders: `kebab-case`.
- Domain terms that are product-specific stay in Spanish in UI copy (Reunión Semanal, Reunión de Fin de Semana, acomodadores, superintendente de grupo), but their code identifiers are English (`midweek_meeting`, `weekend_meeting`, `attendants`, `group_overseer`).

---

## 9. Architecture Rules

Use a modular monolith. Follow `docs/ARCHITECTURE.md`.

- `app/` contains thin routes.
- `features/` contains domain modules (dashboard, members, schedule-templates, midweek, weekend, readers, duties, cleaning, hospitality, field-service, service-groups, reports).
- `components/` contains shared UI.
- `shared/` contains cross-cutting logic (supabase clients, auth guards, validation, utils).
- No Supabase queries inside React UI components.
- Reads live in module `data/`.
- Writes live in module `actions/` or route handlers.
- Zod schemas live in module `schemas/`.
- Types live in module `types/`.
- Schedule formats are template-driven: prebuilt templates render the known congregation formats, admins fill or adjust them in the app, and exports reproduce the selected format cleanly.
- Manual editing is the MVP source of truth. Do not assume automatic rotations are required unless the user asks for them later.
- Each section should default to the current period and allow creating future periods.
- Export is PDF-only unless the user explicitly adds another format.
- Use a proprietary green/lime visual identity for "El Limón". Do not imitate jw.org or official JW software styling, logos, icons, or branding.

Do not invent top-level folders without need.

---

## 10. Frontend And Visual Rules

- UI copy is Spanish and should feel simple, formal, and congregation-appropriate.
- Main navigation uses the agreed names: Dashboard, Reunión Semanal, Reunión de Fin de Semana, Lectores, Acomodadores, Limpieza, Hospitalidad, Servicio, Miembros, Configuración.
- Users should enter directly to the dashboard after login.
- `viewer` users can navigate published formats and download PDFs, but cannot see edit controls.
- Use Tailwind CSS, shadcn/ui, and lucide-react from the approved stack.
- Prefer existing components and patterns before creating new ones.
- Use a green/lime visual identity for El Limón, implemented through tokens/theme variables when the app is scaffolded.
- Avoid hardcoded colors inside TSX. Prefer design tokens/CSS variables. PDF templates may define explicit colors because PDF generation often needs fixed values.
- Do not copy jw.org, official app layouts, official icons, official logos, or official visual styling.
- Keep dashboard useful and restrained: upcoming events, reminders, published formats, and admin pending work. No bloated analytics in MVP.
- Responsive design is required from the start.

---

## 11. Backend And Data Rules

- Supabase is the source of truth for auth, Postgres, RLS, and private storage.
- RLS is required on every app table before using it from the UI.
- `admin` can write; `viewer` reads only published/safe records and downloads PDFs.
- Service-role key is server-side only. Never import admin clients into client components.
- Member data is sensitive; avoid unnecessary fields and never log personal data.
- Do not store official publication content. The app stores schedules and user-entered titles/assignments only.
- PDFs are generated server-side from saved records, not from temporary browser state.
- Servicio is a fixed editable format, not a monthly period.

---

## 12. Testing And Verification

Use testing proportional to risk.

Expected coverage once implementation exists:

- Auth redirects and role gates.
- `admin` can create/edit/publish formats.
- `viewer` can only view published formats and download PDFs.
- RLS blocks anonymous access and cross-congregation access.
- Zod validation rejects malformed input.
- Period selection defaults to the current period and supports future periods where applicable.
- Servicio remains a fixed editable format.
- PDF export uses saved data and preserves the intended format closely enough for printing.

Before major delivery, run available checks:

```bash
pnpm lint
pnpm exec tsc --noEmit
pnpm build
```

Run `pnpm typecheck`, `pnpm test`, or format scripts only after confirming they exist in `package.json`.

---

## 13. Stack

| Layer | Technology |
|---|---|
| Framework | Next.js App Router |
| Language | TypeScript |
| UI | Tailwind CSS + shadcn/ui + lucide-react |
| Forms | React Hook Form + Zod |
| Database | Supabase Postgres |
| Auth | Supabase Auth |
| Files | Supabase Storage |
| PDF/Export | Server-side generation; implementation selected during export phase |
| Hosting | Vercel |

Do not add dependencies beyond this stack without explicit approval.

---

## 14. Privacy And Security

Member data in this app is sensitive: names combined with congregation membership reveal religious affiliation, which is special-category personal data under GDPR-style regulations. Treat it accordingly.

- RLS enabled on every table. All access scoped by `congregation_id` and role.
- No public read of member data. Ever. Published schedule views (if implemented) require authentication or an explicit congregation-level opt-in with unguessable access.
- Collect the minimum: name, contact info needed for scheduling, privileges, availability. No national IDs, no addresses unless a feature strictly requires it and the user approves.
- Users are invited by an admin; no open sign-up.
- Support full deletion of a member's data (right to erasure).
- Never expose secrets to the client. Service-role key server-side only.
- Never commit `.env.local`. Never log personal data or secrets.
- Exports (PDF/print) are generated server-side for authenticated users only.

---

## 15. Do Not Invent

Ask or mark pending for:

- Real congregation names, member names, or schedules — use clearly fake seed data (e.g., "Congregación Ejemplo").
- Public talk outline catalog contents (numbers/titles are maintained data, not something to fabricate).
- Vida y Ministerio workbook content — the app schedules assignments; it does not reproduce workbook material.
- Legal/privacy policy copy.
- Logo, visual assets, domain, and final legal/privacy copy.

Never embed or scrape content from jw.org or official publications.

---

## 16. Git

- Do not commit unless explicitly asked.
- Do not push unless explicitly asked.
- Do not run destructive git commands.
- Keep edits scoped. Preserve user changes.
- Use Conventional Commits when suggesting or creating commits.

---

## 17. Review Stance

When asked to review, lead with findings. Prioritize:

- Security issues, especially RLS/auth gaps and member-data exposure.
- Bugs.
- Architecture drift.
- Missing validation.
- Accessibility problems.
- Fake or invented congregation data left in code.
- Missing tests for scheduling logic (period selection, conflict detection, publish/view permissions).
- PDF export mismatch with the agreed formats.
- UI that exposes edit controls to `viewer`.

Use file and line references when possible.

---

## 18. Nested Rules Map

Read nested rules before touching matching areas:

| File | Scope |
|---|---|
| `src/components/AGENTS.md` | Frontend/UI, shared components, app shell, route UI, feature components, visual states, accessibility, responsive behavior. |
| `src/features/AGENTS.md` | Backend/features, Supabase, RLS, server actions, data reads, schemas, route handlers, PDF export, domain logic. |

If a task crosses UI and backend, read both nested files and keep changes separated by layer.
