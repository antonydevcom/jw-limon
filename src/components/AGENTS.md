# AGENTS.md — Frontend / UI

Rules for agents doing frontend/UI work in JW-Limon / Congregación El Limón. Root `AGENTS.md` always applies. When rules conflict, follow the stricter and more specific rule.

This file applies to:

- `src/app/**` pages, layouts, templates, route metadata, and app shell.
- `src/components/**` shared UI, layout, forms, navigation, schedule tables, PDF preview UI, and primitives.
- `src/features/<feature>/components/**` feature UI.
- Frontend accessibility, responsive layout, visual states, interaction states, client-side form UX, and visual verification.

---

## 0. Source Of Truth

Read in this order before frontend work:

1. Root `AGENTS.md`
2. `README.md`
3. `docs/ARCHITECTURE.md`
4. This file
5. `src/features/AGENTS.md` only if the UI task touches feature data/actions/schemas.

Do not invent product data, congregation data, member names, real assignments, legal copy, official JW content, or branding.

---

## 1. Scope

Allowed in frontend scope:

- Shared UI primitives in `src/components/ui/`.
- App shell in `src/components/layout/`.
- Schedule/table display components in `src/components/schedule/`.
- PDF preview/presentation components when they only render already-loaded data.
- Feature UI in `src/features/<feature>/components/`.
- Route components and metadata in `src/app/`.
- Client-side display states: loading, empty, error, success, disabled, pending, read-only.
- Accessibility and responsive behavior.

Forbidden unless explicitly scoped:

- Supabase queries or clients.
- Server Actions.
- Route Handlers.
- RLS policies, migrations, schema changes.
- Auth/session logic.
- PDF generation backend.
- Service-role/admin clients.
- Business rules not already exposed by props, data functions, or architecture docs.
- New dependencies.

If UI needs a backend field, query, action, permission, PDF route, or schema, stop and report the dependency. Do not silently implement backend from frontend work.

---

## 2. Product UI Model

Product name:

- Formal app name: **Congregación El Limón**
- Installed/PWA short name: **El Limón**
- Repo name: `JW-Limon`

Primary user flow:

```text
Login -> Dashboard -> Sidebar section -> View full format -> Download PDF
```

Admin flow:

```text
Login -> Dashboard -> Sidebar section -> Create/select period -> Edit format -> Save draft -> Publish -> Download PDF
```

`viewer` flow:

```text
Login -> Dashboard -> Sidebar section -> View published format -> Download PDF
```

Sidebar labels must be exactly:

- Dashboard
- Reunión Semanal
- Reunión de Fin de Semana
- Lectores
- Acomodadores
- Limpieza
- Hospitalidad
- Servicio
- Miembros
- Configuración

`viewer` users must never see create, edit, delete, publish, member-admin, configuration-write, or raw debug controls.

---

## 3. Visual Direction

The UI should feel like a quiet, useful congregation operations app: clear, respectful, organized, and easy to scan. This is not a marketing landing page and not a generic SaaS dashboard.

Use a proprietary **green/lime** identity for El Limón. The direction can echo the existing spreadsheet colors enough to feel familiar, but must not imitate jw.org, JW Library, New World Scheduler, official logos, official icons, official artwork, or official brand styling.

Baseline visual principles:

- Calm dashboard, not flashy.
- Dense but readable tables.
- Large enough touch targets.
- White/light surfaces by default unless a dark theme is implemented intentionally.
- Green/lime accents for headings, selected states, primary actions, and PDF headers.
- Muted neutrals for borders, backgrounds, and secondary text.
- Clear distinction between draft, published, archived, canceled, and read-only states.
- No purple gradients, glass blobs, random orbs, neon, bokeh, or decorative AI-looking backgrounds.
- No nested cards.
- Use icons for obvious tools: download, print, edit, save, publish, calendar, users, settings.

When design tokens exist, visual values must come from tokens/CSS variables. Avoid hardcoded colors in TSX. PDF templates may define explicit colors because PDF generation often needs fixed values.

---

## 4. Component Architecture

Use this shape when the app is scaffolded:

```text
src/components/
├── ui/          # shadcn/custom primitives
├── layout/      # app shell, sidebar, header, mobile nav
├── schedule/    # reusable format/table/period components
├── forms/       # shared form fields and error display
└── feedback/    # empty states, loading, alerts, toasts
```

Rules:

- Prefer named exports.
- One React component per file.
- Component files: `PascalCase.tsx`.
- Hooks: `useThing.ts`.
- Utilities: `camelCase.ts`.
- Folders: `kebab-case`.
- No file over 500 lines; split by responsibility before it becomes hard to reason about.
- Components receive data through props. They do not fetch directly from Supabase.
- Shared components stay generic. Feature-specific UI belongs in `src/features/<feature>/components/`.
- Extract only after real reuse, meaningful complexity reduction, or when the pattern is a project primitive.
- Avoid boolean prop explosions. Prefer explicit variants, composition, slots, or small focused components.
- Use `children` composition where it keeps APIs smaller.
- Keep business rules out of components; show results from feature/domain functions.

Component decision guide:

| Need | Location | Rule |
|---|---|---|
| Button, input, dialog, select, tabs, badge | `src/components/ui/` | Shared primitive, token-based, accessible. |
| Sidebar, topbar, mobile nav | `src/components/layout/` | App shell only; no domain data logic. |
| Period selector, schedule table, PDF toolbar | `src/components/schedule/` | Shared across formats. |
| Field label/error/helper | `src/components/forms/` | Reusable form presentation. |
| Reunión Semanal part row | `src/features/midweek/components/` | Domain-specific. |
| Acomodadores monthly grid | `src/features/duties/components/` | Domain-specific. |

---

## 5. Schedule Format UI

The core UI is a set of prebuilt editable/read-only formats, not a generic spreadsheet app.

Every format page should include:

- Page title matching sidebar label.
- Period selector where applicable.
- Current-period default.
- Read-only published view for `viewer`.
- Admin edit mode for `admin`.
- Save/publish controls only for `admin`.
- `Descargar PDF` button for allowed users.
- Empty state when the selected period does not exist.
- Clear status indicator: `Borrador`, `Publicado`, `Archivado`, `Actualizado`.
- Safe conflict/warning messages when backend exposes them.

Format behavior:

- Reunión Semanal: weekly/period-based, more manually edited.
- Reunión de Fin de Semana: monthly, manually edited.
- Lectores: monthly.
- Acomodadores: monthly, with Entrada, Auditorio, Micrófono 1, Micrófono 2, Observaciones.
- Limpieza: monthly.
- Hospitalidad: monthly.
- Servicio: fixed current format, not month-based.

Do not build a full Excel clone. Use controlled tables/forms that feel familiar and preserve the visual structure.

---

## 6. Forms

Use React Hook Form + Zod only when installed or approved. Server validation still belongs in `src/features/**/schemas/`.

Frontend form UI must provide:

- Visible labels.
- Helper text when useful.
- Field-level errors linked to fields.
- Pending/disabled submit state.
- Success/error feedback.
- Cancel/back path for admin edits.
- Duplicate-submit prevention.
- Preservation of entered values after validation errors.

Never rely on client validation alone.

---

## 7. Accessibility

Target WCAG 2.2 AA.

- Use semantic HTML before ARIA.
- Every interactive element must be keyboard reachable.
- Focus states must be visible.
- Icon-only buttons need `aria-label` or visually hidden text.
- Form fields need labels, descriptions, and linked errors.
- Tables need captions or accessible labels when context is not obvious.
- Do not rely on color alone for status.
- Maintain contrast for green/lime accents.
- Dialogs, selects, menus, popovers, tabs, and accordions should use shadcn/Radix primitives when available.
- Motion must respect `prefers-reduced-motion`.
- Touch targets should be at least 44px where practical.

For PDF-related previews, ensure the web preview is readable and keyboard navigable. The generated PDF itself should prioritize print legibility.

---

## 8. Responsive Rules

- Mobile-first.
- Prevent overlap, clipping, horizontal scroll except intentional table scroll.
- Text wraps before shrinking.
- Do not use viewport-scaled font sizes for normal UI.
- Use stable constraints: `grid`, `flex`, `minmax()`, `aspect-ratio`, `min-*`, `max-*`, container constraints.
- Sidebar collapses cleanly on small screens.
- Large schedule tables may use horizontal scroll with sticky first column/header when practical.
- Avoid layout shift when loading periods, members, or schedule rows.
- Use skeletons only when data genuinely loads.

---

## 9. Styling Rules

- Use Tailwind CSS and project tokens/CSS variables.
- Use shadcn/ui and lucide-react from the approved stack.
- Prefer semantic component variants over one-off class piles for repeated UI.
- Do not introduce CSS Modules, styled-components, or a second styling system.
- One-off layout can use Tailwind utilities.
- Repeated visual primitives become shared components or shared classes.
- Avoid hardcoded colors in TSX; prefer tokens.
- Avoid nested cards and decorative card-heavy layouts.
- Admin surfaces should be dense and work-focused, not hero/landing-page-like.

Suggested token direction once scaffolded:

```css
--color-limon-50: #f5faec;
--color-limon-100: #e8f3d5;
--color-limon-500: #6b8f2a;
--color-limon-700: #3f5f1f;
--color-surface: #ffffff;
--color-surface-muted: #f7f9f3;
--color-border: #dce5d1;
--color-text: #18200f;
--color-muted: #66705a;
```

These are starting suggestions, not final brand decisions. Keep actual tokens centralized.

---

## 10. Motion

Motion is optional and should be restrained.

- Use CSS transitions for simple hover/focus states.
- Use Motion/Framer only if installed and approved.
- Client components only for animation.
- Animate opacity/transform, not layout-heavy properties.
- Keep admin workflows fast; no long page choreography.
- Respect `prefers-reduced-motion`.
- Do not animate PDF output.

---

## 11. App Router And Client Boundaries

- Default to Server Components.
- Add `"use client"` only for interactive components that need state, effects, browser APIs, or client libraries.
- Keep client components narrow.
- Route metadata belongs in `src/app/`.
- Auth/role redirects belong to server/middleware/shared auth, not random client effects.
- UI should consume typed data passed from server components or feature data functions.

---

## 12. Dashboard Rules

Dashboard is the first screen after login.

Show only useful items:

- Próximos eventos.
- Recordatorios.
- Formatos publicados recientes.
- Próximas asignaciones if user/member link exists.
- Admin pending drafts/publication work for `admin`.

Do not add analytics, charts, artificial KPIs, marketing sections, or busy decorative widgets in MVP.

---

## 13. PDF UX

The frontend triggers PDF download; backend generates it.

UI rules:

- Button label: `Descargar PDF`.
- Use a download icon when available.
- Show pending state while generating.
- Show safe Spanish error if generation fails.
- Never generate PDF from unsaved browser-only edits. Prompt admin to save first.
- Viewer can download only published formats.
- Admin can download drafts only if product explicitly allows it; default to published output.

PDF visual target:

- As similar as practical to the provided spreadsheet formats.
- Clean headers.
- Month blocks where applicable.
- Date rows and assignment columns preserved.
- Print legibility before pixel-perfect imitation.
- No official JW marks or copied official styling.

---

## 14. Performance

- Avoid unnecessary `use client`.
- Keep bundle weight low.
- Do not add heavy table/spreadsheet libraries without approval.
- Paginate or virtualize large member lists when needed.
- Avoid expensive render loops.
- Memoize only when measurement or clear repeated render cost justifies it.
- Protect Core Web Vitals even though this is a private app.

---

## 15. Frontend Skill Usage

Use only project-local skills from `.agents/skills`. When a task matches one of these skills, read `.agents/skills/<skill>/SKILL.md` before acting, plus only the relevant referenced files needed for the task.

| Skill | Use when |
|---|---|
| `writing-plans` | Planning multi-step UI/screen work before implementation. |
| `test-driven-development` | UI behavior changes where tests should define expected behavior first. |
| `systematic-debugging` | UI bugs, layout regressions, failing checks, unclear rendering issues. |
| `verification-before-completion` | Before claiming UI, visual, interaction, accessibility, or PDF-preview work is complete. |
| `requesting-code-review` | Before delivery of broad UI/shared component changes. |
| `code-quality` | Component maintainability, Clean Code/SOLID/DRY review, refactor quality. |
| `frontend-design` | Building or redesigning app screens, dashboards, schedule pages, forms, or polished UI. |
| `design-taste-frontend` | Raising visual quality, avoiding generic SaaS layout, improving aesthetic taste. |
| `web-design-guidelines` | UI review against interaction/interface rules. |
| `tailwind-design-system` | Tokens, Tailwind theme values, component variants, shared primitives. |
| `responsive-design` | Mobile/desktop layout, sidebar, tables, schedule grids, overflow fixes. |
| `accessibility` | WCAG, keyboard, focus, forms, dialogs, contrast, screen reader support. |
| `nextjs-app-router-patterns` | App Router routes, layouts, route groups, streaming, protected route structure. |
| `vercel-react-best-practices` | React performance, composition, avoiding unnecessary client work. |
| `vercel-composition-patterns` | Component APIs, compound components, reducing boolean prop mess. |
| `shadcn` | shadcn/ui installation, composition, customization, and primitive usage. |
| `vercel-react-view-transitions` | Native-feeling route/page transitions if requested. |
| `core-web-vitals` | LCP/INP/CLS issues and user-perceived performance. |
| `pwa-development` | PWA manifest/install UX, icons, app name/short name, display mode, offline strategy if later approved. |
| `vercel-optimize` | Frontend performance/deployment optimization when explicitly scoped. |
| `security-best-practices` | UI auth visibility, client/server boundary safety, preventing accidental member-data exposure. |
| `typescript-advanced-types` | Strong component prop types, domain UI contracts, typed variants, avoiding `any`. |
| `zod-schema-validation` | Client-side form schema wiring that mirrors server schemas without replacing server validation. |
| `playwright` | Screenshots, browser automation, visual verification, keyboard testing. |
| `webapp-testing` | End-to-end app flow testing guidance for login, navigation, role visibility, and downloads. |
| `screenshot` | Screenshot capture/review for UI or PDF visual checks. |
| `pdf` | PDF visual inspection or PDF layout verification when frontend/PDF presentation overlaps. |
| `xlsx` | Reading/analyzing source spreadsheet format structure to reproduce schedule UI/PDF layout. |
| `writing-guidelines` | Spanish UI copy polish and docs/readme wording. |
| `pnpm` | Package/script/lockfile troubleshooting when frontend dependencies or scripts are involved. |

Avoid for pure frontend scope unless task explicitly crosses boundaries:

- `supabase`
- `supabase-postgres-best-practices`
- `deploy-to-vercel`
- `vercel-cli-with-tokens`
- PDF skills unless the task is specifically PDF output or visual PDF verification.

---

## 16. Verification

Never start dev servers or watch commands.

Allowed checks, after confirming scripts exist:

```bash
pnpm lint
pnpm exec tsc --noEmit
pnpm build
pnpm test
```

Use checks proportional to risk:

- Small UI copy/class change: `pnpm lint`.
- Shared components, App Router boundaries, types: `pnpm lint` + `pnpm exec tsc --noEmit`.
- Broad UI/routes/build-sensitive changes: `pnpm lint` + `pnpm exec tsc --noEmit` + `pnpm build`.
- UI behavior tests only when a test script/setup exists.

If visual/runtime verification is needed, stop and tell the user what to test manually. Do not start a dev server.

Before final response, check:

- No `viewer` edit controls.
- Spanish UI copy.
- No raw official JW branding/assets.
- No Supabase queries in UI.
- No horizontal overflow except intentional table scroll.
- Buttons/inputs have accessible names and states.
- PDF download UI uses saved/published data rules.
