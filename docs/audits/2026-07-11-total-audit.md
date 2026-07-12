# Auditoría total — privacidad, QA, PWA, rendimiento y móvil

**Fecha:** 2026-07-11

## Resultado

App pasó de superficie pública con rol viewer implícito a app privada basada en Supabase Auth y RLS. PWA ahora tiene manifest completo, iconos, instalación, service worker seguro, fallback offline y safe areas. Navegación recibe feedback de carga; menú móvil mejora teclado/diálogo. QA incluye runner nativo y contratos de seguridad/PWA.

## Cambios aplicados

### Privacidad y autenticación

- Supabase Auth email/password por invitación.
- Contexto cacheado por request: usuario, membresía, congregación y rol.
- Proxy Next.js 16 para refresh/protección temprana; layout conserva guard definitivo.
- Sin service-role en lecturas normales.
- `X-Robots-Tag`, `robots.txt`, metadata noindex y cache privada.
- Migración RLS para ocultar borradores de tablas hijas.

### Calidad y consistencia

- Zod en límites de todas las Server Actions de formatos/eventos.
- Errores internos ya no llegan al usuario.
- Meses inválidos ya no pasan normalización.
- Creación de periodos dejó de ocurrir durante GET/render; ahora usa botón y Server Action.
- Viewers pueden navegar periodos publicados anteriores/siguientes.

### PWA y móvil

- Manifest con `name`, `short_name`, `id`, `scope`, `standalone`, iconos 192/512/maskable y Apple touch icon.
- Botón Instalar para Chromium; instrucciones iOS.
- Service worker con cache exclusiva de assets públicos; no guarda programas privados.
- Fallback offline explica límite de privacidad.
- `100dvh`, safe areas, targets táctiles de 44 px y menú Más con Escape, bloqueo de scroll y semántica dialog.

### Rendimiento

- Eliminadas cargas duplicadas de preferencias al montar controles desktop/móvil.
- Navegación Next mantiene prefetch automático de links visibles.
- Skeleton `loading.tsx` reduce percepción de espera y reserva espacio.
- Operaciones independientes del dashboard ya usan `Promise.all`; dependencia partes→reuniones permanece secuencial por necesidad de IDs.
- Índices agregados para `period_id` y políticas RLS.
- Service worker acelera chunks versionados sin cachear respuestas privadas.

### QA y supply chain

- `pnpm test` con Node Test Runner, sin dependencia nueva.
- 14 tests: fechas/bisiesto/navegación/mes inválido, enum semanal, auth RLS, proxy privado, PWA cache, manifest, versiones/integridad de migraciones, acciones y clickjacking.
- `pnpm audit --prod`: cero vulnerabilidades conocidas tras override PostCSS 8.5.16.

## Evidencia final requerida

Comandos ejecutados:

```text
node --test               14 casos en 2 archivos pasan
eslint .                  pasa sin warnings
tsc --noEmit              pasa
node --check public/sw.js pasa
next build --webpack      pasa; 16 rutas; Proxy detectado
pnpm audit --prod         cero vulnerabilidades conocidas (antes de cambio SQL final; dependencias sin cambios posteriores)
```

Prueba REST Supabase anónima: ocho tablas devolvieron cero filas.

## Límites de auditoría

- Reglas prohíben iniciar servidor; no hubo inspección visual/browser runtime.
- Supabase CLI no está instalado; migraciones `0006` y `0007` no pudieron aplicarse ni probarse con usuarios reales.
- Vercel CLI no está instalado ni proyecto vinculado; métricas de producción/Core Web Vitals reales no estuvieron disponibles. Auditoría Vercel metric-backed queda pendiente.
- No existen credenciales QA `admin`/`viewer`; E2E de roles requiere cuentas de prueba invitadas.

## Pruebas manuales obligatorias

1. Aplicar migraciones `0006` y `0007` en staging; limpiar duplicados si índice único detecta datos históricos incompatibles.
2. Verificar anónimo → `/login`.
3. Verificar viewer: solo publicados, sin controles de edición, navegación de meses y logout.
4. Verificar admin: crear, editar, publicar, despublicar y logout.
5. Instalar desde Chrome Android y Safari iOS; abrir desde icono.
6. Activar modo avión: mostrar fallback, nunca programa privado cacheado.
7. Probar 320, 375, 768 y desktop: menú, tablas, teclado y orientación.
8. Revisar headers desplegados y Lighthouse PWA/Accessibility/Performance.
