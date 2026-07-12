# Auditoría y endurecimiento de app privada, PWA y rendimiento

**Fecha:** 2026-07-11  
**Alcance:** autenticación, autorización, RLS, validación, privacidad de indexación, PWA, navegación, móvil, rendimiento y QA.

## Baseline

- `pnpm lint`: pasa.
- `pnpm exec tsc --noEmit`: pasa.
- `pnpm build`: pasa; 14 rutas, dashboard dinámico.
- No existe suite de tests ni script `test`.
- No existe `AGENTS.md` de QA/test; aplican reglas raíz, UI, features y skills locales TDD/verificación.
- No existe repositorio Git en este directorio.

## Hallazgos principales

1. Visitantes anónimos reciben rol `viewer`; lecturas usan service-role y omiten RLS.
2. Login administrativo usa credenciales globales y cookie HMAC en vez de Supabase Auth/membresías existentes.
3. Acciones aceptan IDs/objetos del cliente sin Zod y devuelven errores crudos de Supabase.
4. Políticas SELECT de tablas hijas no comprueban estado publicado del periodo.
5. `robots` declara `noindex`, pero faltan `X-Robots-Tag`, `robots.txt` restrictivo y headers privados.
6. Manifest carece de iconos; no existe service worker, fallback offline ni botón Instalar.
7. No existe `loading.tsx` para feedback durante cambios de sección.
8. Navegación móvil necesita cierre por Escape, bloqueo de scroll y mejor semántica de diálogo.

## Orden de implementación

### 1. Autenticación y autorización

- Sustituir cookie administrativa por Supabase Auth email/password.
- Resolver `user`, membresía, `congregation_id` y rol en servidor con cliente de sesión.
- Proteger `/dashboard/**` mediante `src/proxy.ts` y comprobación definitiva en layout/contexto.
- Usar cliente session-aware para lecturas/escrituras; service-role queda solo para tareas administrativas futuras.
- Derivar congregación del contexto, nunca confiar en ID enviado por cliente.

### 2. Validación y RLS

- Crear esquemas Zod compartidos para UUID, fecha, mes, rutas internas y texto acotado.
- Validar argumentos de todas las Server Actions antes de ejecutar queries.
- Convertir errores DB a mensajes españoles seguros.
- Añadir migración aditiva que limite tablas de formatos a admins o periodos publicados.
- Añadir índices de `period_id` usados por políticas y consultas.

### 3. Privacidad, PWA y rendimiento

- Añadir metadata/robots y headers `X-Robots-Tag: noindex, nofollow, noarchive, nosnippet`.
- Añadir `Cache-Control: private, no-store` a superficies autenticadas.
- Completar manifest, iconos propios basados en marca visual Citrus ya existente, service worker seguro y página offline sin datos.
- Cachear solo assets versionados/públicos; nunca HTML/API autenticada.
- Añadir botón Instalar compatible con Chromium y guía iOS.
- Añadir skeleton estable para transiciones y mantener prefetch de `Link`.

### 4. Móvil y accesibilidad

- Respetar safe areas, objetivos táctiles y viewport dinámico.
- Convertir menú Más en diálogo accesible; Escape, foco y scroll corporal controlados.
- Evitar overflow no intencional y mejorar feedback de conexión/carga.

### 5. Verificación

- Ejecutar `pnpm lint`, `pnpm exec tsc --noEmit` y `pnpm build`.
- Revisar build routes, service worker/manifest/robots generados y SQL estático.
- Documentar pruebas manuales requeridas: login real, roles, instalación Android/iOS, offline y navegación en teléfono.

## Restricciones

- Sin servidor de desarrollo ni procesos watch.
- Sin dependencias nuevas: proyecto exige aprobación explícita para ampliar stack.
- Sin datos reales inventados, branding oficial ni contenido de publicaciones.
- Migración solo aditiva/reversible; aplicación remota requiere ejecución manual y verificación con Supabase.
