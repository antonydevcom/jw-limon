# Informe de seguridad — JW-Limon

**Fecha:** 2026-07-11  
**Estado:** fixes de código aplicados; migraciones `0006` y `0007` pendientes de aplicar y validar en Supabase remoto.

## Resumen ejecutivo

Auditoría encontró una exposición crítica: visitantes anónimos eran tratados como `viewer` y lecturas del servidor usaban service-role, anulando RLS. Código ahora exige Supabase Auth, resuelve membresía/rol en servidor y usa JWT del usuario para toda lectura/escritura. También se cerró lectura directa de borradores, se validaron entradas con Zod, se ocultaron errores internos y se corrigió una dependencia vulnerable.

## Críticos

### S-01 — Acceso anónimo mediante service-role — corregido en código

**Impacto:** cualquiera con URL podía consultar horarios/nombres sin iniciar sesión, aunque sitio indicara `noindex`.

- Contexto ahora verifica usuario y membresía: `src/shared/auth/appContext.ts:21`.
- Queries conservan JWT y RLS: `src/shared/auth/appContext.ts:22`.
- Dashboard tiene protección anticipada y definitiva: `src/shared/supabase/proxy.ts:24` y `src/shared/auth/appContext.ts:27`.
- Login usa Supabase Auth, no contraseña global: `src/features/admin-auth/actions.ts:15`.
- Prueba REST remota confirmó rol `anon` sin filas para ocho tablas auditadas.

### S-02 — Viewers podían leer borradores por Data API — corregido; despliegue pendiente

**Impacto:** usuario autenticado `viewer` podía consultar filas de borradores directamente aunque UI ocultara periodo.

- Migración reemplaza siete políticas SELECT y hereda visibilidad desde `schedule_periods`.
- Preflight aborta con instrucciones si encuentra duplicados o referencias cruzadas; constraints compuestos se validan dentro de misma migración: `supabase/migrations/0007_restrict_draft_schedule_reads.sql`.

Acción obligatoria: aplicar migraciones `0006_user_accent_preferences.sql` y `0007_restrict_draft_schedule_reads.sql` al proyecto Supabase y probar `admin`, `viewer`, anónimo y otra congregación. CLI/MCP Supabase no estuvo disponible en esta sesión.

## Altos

### S-03 — Server Actions confiaban en payload cliente — corregido

- Esquemas limitan UUID, fechas, rutas, enums, texto y cantidad de filas: `src/shared/validation/actionSchemas.ts:3`.
- Acciones derivan congregación desde sesión y comparan ID recibido.
- Errores DB se convierten a mensaje seguro: `src/shared/validation/actionSchemas.ts:103`.

### S-04 — Noindex incompleto — corregido

- Metadata usa `noindex`, `nofollow`, `noarchive`, `nosnippet`: `src/app/layout.tsx:26`.
- `robots.txt` bloquea rastreo completo.
- Header global `X-Robots-Tag` agrega defensa HTTP: `next.config.ts:5`.
- Dashboard usa `Cache-Control: private, no-store`: `next.config.ts:13`.

Nota: `noindex` reduce descubrimiento; autenticación es control real de privacidad.

## Moderados

### S-05 — PostCSS vulnerable transitivo — corregido

`pnpm audit --prod` detectó GHSA-qx2v-qp2m-jg93 en `postcss@8.4.31`. Override compatible con pnpm 10 fija `8.5.16`; audit final: cero vulnerabilidades conocidas.

### S-06 — Cache PWA podía crear riesgo de privacidad — diseño seguro aplicado

Service worker cachea solo assets versionados/iconos. Navegaciones usan red y fallback genérico; nunca cachea HTML/API autenticada: `public/sw.js:16`.

## Verificación pendiente externa

- Aplicar migraciones `0006` y `0007` en staging y ejecutar pruebas RLS autenticadas.
- Probar login/logout con usuario invitado real y roles `admin`/`viewer`.
- Confirmar configuración Supabase: registro público deshabilitado, email/password según política, JWT corto apropiado y usuarios solo por invitación.
- Probar headers en deployment final.
