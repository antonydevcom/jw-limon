# Mobile navigation and dashboard polish

## Scope

Polish private app UI with mobile-first priority. Keep data model and schedule workflow unchanged except existing entrance-attendant field must be clear for weekend meeting rows.

## Navigation

- Remove blue icon shown in supplied screenshot from app shell.
- Mobile bottom navigation labels become `Dashboard`, `Semanal`, `Fin de semana`, `Servicio`, and `Más`.
- Desktop labels remain explicit and unchanged.
- Mobile labels must wrap or use safe width rules; no clipped text or horizontal page overflow.

## Acomodadores

- Retain one attendance row per meeting date.
- Make entrance-attendant column and mobile presentation explicitly apply to every meeting date, including weekend dates.
- Do not add a new database field: `entrance_name` already represents this assignment.
- Preserve admin editing, viewer read-only state, validation, and autosave.

## Dashboard visual system

- Standardize dashboard sections on shared app surfaces and token colors.
- Align heading treatment, spacing, borders, typography, status treatments, and actions across dashboard blocks.
- Use responsive layout: stacked, touch-safe blocks on mobile; denser grid only when content has room.
- Remove every `Ver formato` action from dashboard cards.
- Show at most the next two meeting cards, ordered by date.
- Normalize every assignment block to the supplied meeting-card pattern: uppercase muted label, compact strong value, consistent white inset surface, and shared padding/radius.
- Preserve distinct content types within that pattern: student assignments remain readable multi-line text; duty shifts remain compact labelled rows.
- Avoid nested cards, arbitrary colors, analytics, or decorative widgets.

## Accessibility and verification

- Keep all navigation controls keyboard reachable with visible focus.
- Maintain 44px practical touch targets in mobile navigation.
- Verify with lint, TypeScript check, and production build when scripts exist.
