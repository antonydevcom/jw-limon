# Mobile dashboard polish implementation plan

## Goal

Remove PWA install icon, shorten mobile navigation labels, keep two upcoming meeting cards maximum, remove dashboard `Ver formato`, and unify assignment surfaces around existing `InfoItem`/`DutyPill` pattern.

## Tasks

1. Add or update static navigation tests in `tests/navigation-consistency.test.mjs` for mobile labels and PWA install button removal.
2. Update `src/components/layout/AppShell.tsx` to remove `PwaInstallButton` import and render. Keep color, theme, logout controls.
3. Update `src/components/layout/MobileNavigation.tsx` to render mobile-only labels `Semanal` and `Fin de semana`; desktop item labels stay unchanged.
4. Refactor `src/app/(app)/dashboard/page.tsx`:
   - keep `getUpcomingMeetings` capped at two;
   - remove `WeekHero` and its `Ver formato` control;
   - derive each rendered meeting card from exactly one of two upcoming meetings;
   - retain `entrance_name` in weekend duty rows;
   - use `InfoItem`, student-assignment inset block, and `DutyPill` across both cards;
   - retain accessible chevron link for opening full format.
5. Run `pnpm test`, `pnpm lint`, `pnpm typecheck`, and `pnpm build`.
