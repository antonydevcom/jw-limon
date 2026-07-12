# Congregación El Limón

**Aplicación web en español para la organización y programación de congregaciones**, inspirada en herramientas tipo New World Scheduler: programas de reuniones, discursos, deberes, limpieza y grupos de servicio en un solo lugar.

> **Aviso importante**: Este es un proyecto independiente y no oficial. **No** está afiliado, aprobado ni conectado con Watch Tower Bible and Tract Society, jw.org ni New World Scheduler. No usa ni debe usar logotipos, marcas o material oficial, ni presentarse de forma que pueda confundirse con software oficial.

Nombre del producto:

- **Nombre formal dentro de la app**: Congregación El Limón.
- **Nombre corto / acceso directo instalado**: El Limón.
- **Nombre técnico del repositorio**: JW-Limon.

---

## Qué se va a construir

Una aplicación privada para que los responsables de una congregación gestionen su programación semanal sin hojas de cálculo dispersas:

- **Miembros**: publicadores con sus privilegios y aptitudes de asignación.
- **Formatos prehechos**: pantallas basadas en los formatos actuales para llenar, ajustar y descargar en PDF.
- **Reunión Semanal**: programa de Vida y Ministerio con presidente, secciones, partes, asignados, ayudantes y lector.
- **Reunión de Fin de Semana**: programa con presidente, oración, discursante, discurso, canción, lector, conductor y hospitalidad.
- **Lectores**: asignación mensual de lectores para Estudio de La Atalaya y EBC.
- **Acomodadores y micrófonos**: entrada, auditorio y dos micrófonos por reunión.
- **Limpieza**: responsable por grupo en reuniones de martes y domingo.
- **Hospitalidad**: grupo asignado por domingo.
- **Servicio**: formato fijo de reuniones para el servicio por día, turno, casa y capitán.
- **Dashboard**: próximos eventos, recordatorios y avisos sencillos.
- **Reportes y exportación**: programas imprimibles y descargables en PDF para publicar o repartir.

El acceso es solo por invitación. No hay registro abierto ni datos públicos.

El sistema no busca reemplazar el criterio del responsable. El `admin` crea y edita cada formato por mes o semana, guarda cambios, publica y descarga en PDF. Los usuarios normales entran directo al dashboard, navegan por las secciones, ven formatos publicados y pueden descargarlos en PDF. En el futuro puede haber ayudas para repetir datos, pero el MVP no depende de rotaciones automáticas.

---

## MVP

| Módulo | Alcance |
|---|---|
| Autenticación y roles | Login con Supabase Auth. Roles: `admin` y `viewer`. Acceso por invitación. |
| Miembros | Alta, edición y baja de publicadores. Privilegios (anciano, siervo ministerial, publicador, precursor). Aptitudes por tipo de asignación. Disponibilidad/ausencias. |
| Editor de formatos | Vista tipo hoja de cálculo: celdas/campos editables, plantillas prehechas, guardado como borrador y descarga. |
| Reunión Semanal | Programa semanal por secciones (Tesoros de la Biblia, Seamos Mejores Maestros, Nuestra Vida Cristiana). Asignados, ayudantes, lector de EBC y detección de conflictos. |
| Reunión de Fin de Semana | Calendario de fin de semana: presidente, oración inicial, discursante, discurso, canción, lector, conductor y hospitalidad. |
| Lectores | Calendario mensual de lectores para Estudio de La Atalaya y EBC. |
| Acomodadores | Calendario mensual de entrada, auditorio y micrófonos. |
| Limpieza | Formato mensual editable de grupos responsables para martes y domingo. |
| Hospitalidad | Formato mensual editable de grupos para domingos. |
| Servicio | Formato fijo editable: día, turno, hora, casa y capitán. |
| Dashboard | Próximos eventos, recordatorios y avisos breves configurables por admin. |
| Reportes / exportación | Descarga PDF por formato y por periodo. |

Fuera del MVP: informes de predicación, asistencia, contabilidad, territorio, apps móviles nativas y acceso multi-congregación en la interfaz (el modelo de datos sí lo deja preparado).

---

## Navegación

La barra lateral principal:

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

Los usuarios normales pueden entrar a estas secciones para consultar y descargar PDFs publicados. Las acciones de crear, editar, publicar y administrar miembros/configuración son solo para `admin`.

---

## Formatos base

La primera versión se diseña alrededor del archivo `Programas_congregación.xlsx`, que define los formatos actuales de la congregación:

| Formato | Uso | Edición esperada |
|---|---|---|
| Reunión Semanal | Programa semanal de la reunión entre semana. | El admin carga/edita partes, tiempos y asignados. Algunas partes cambian cada semana, así que debe permitir ajustes manuales. |
| Reunión de Fin de Semana | Programa dominical mensual. | Se edita presidente, oración, discursante, discurso, canción, lector, conductor y hospitalidad. |
| Lectores | Lectores de Estudio de La Atalaya y EBC. | Formato mensual editable. |
| Acomodadores | Entrada, auditorio y micrófonos por domingo/martes. | Formato mensual editable; se pueden cambiar personas puntualmente. |
| Limpieza | Responsable por grupo en martes/domingo. | Formato mensual editable. |
| Hospitalidad | Grupo asignado cada domingo. | Formato mensual editable. |
| Servicio | Programa fijo de servicio por día y turno. | Se edita cuando cambian hora, casa o capitán. No se crea cada mes. |

Cada formato debe tener tres estados:

1. **Borrador**: editable solo por `admin`.
2. **Publicado**: visible y descargable para usuarios normales (`viewer`).
3. **Descargado/exportado**: salida limpia para imprimir o compartir como PDF.

Al entrar a una sección desde la barra lateral, el usuario ve por defecto el periodo actual (normalmente el mes actual). Puede seleccionar meses anteriores o, si es `admin`, crear meses futuros para adelantarse. El formato de Servicio es fijo y se edita cuando cambien sus datos. El objetivo visual es que los PDF se parezcan lo más posible a los formatos actuales, permitiendo variaciones pequeñas cuando mejoren legibilidad o impresión.

---

## Identidad visual

La app debe sentirse propia de **El Limón**, con un estilo verde/limón sobrio y claro. Puede permitir tema o color de acento por usuario en una fase posterior, pero el MVP usa una identidad consistente.

No se debe copiar ni imitar el estilo visual, iconografía, marcas, logos o apariencia de jw.org ni de software oficial. La app puede ser limpia y respetuosa, pero debe evitar cualquier confusión con herramientas oficiales.

---

## Privacidad y seguridad

Los datos de miembros son sensibles: un nombre asociado a una congregación revela afiliación religiosa, que es dato de categoría especial en regulaciones tipo GDPR.

- Row Level Security en todas las tablas, con acceso limitado por congregación y rol.
- Ningún dato de miembros es público. Los programas publicados requieren autenticación.
- Se recolecta el mínimo necesario: nombre, contacto para asignaciones, privilegios y disponibilidad.
- Los usuarios entran solo por invitación de un administrador.
- Se soporta la eliminación completa de los datos de un miembro.
- Las exportaciones (PDF/impresión) se generan en el servidor solo para usuarios autenticados.

---

## Stack

| Capa | Tecnología |
|---|---|
| Framework | Next.js App Router |
| Lenguaje | TypeScript |
| UI | Tailwind CSS + shadcn/ui + lucide-react |
| Formularios | React Hook Form + Zod |
| Base de datos | Supabase Postgres |
| Autenticación | Supabase Auth |
| Archivos | Supabase Storage |
| PDF | Generación server-side |
| Hosting | Vercel |

---

## Instalación local

Cuando exista el código de la aplicación:

```bash
pnpm install
pnpm build
```

Usar siempre `pnpm`. No usar `npm` ni `yarn`.

### Scripts esperados

```bash
pnpm build
pnpm lint
pnpm exec tsc --noEmit
```

Verificar `package.json` antes de correr cualquier script. No se corren servidores de desarrollo desde agentes; las pruebas visuales se hacen manualmente.

### Variables de entorno esperadas

```bash
# App
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

Nunca subir `.env.local` ni credenciales reales.

---

## Documentos fuente

| Archivo | Uso |
|---|---|
| `README.md` | Contexto general del producto. |
| `docs/ARCHITECTURE.md` | Arquitectura técnica, módulos y modelo de datos. |
| `AGENTS.md` | Reglas para asistentes de IA. |

---

## Roadmap por fases

1. **Fase 1 — Base**: scaffolding, autenticación, roles, configuración de congregación, PWA/acceso directo "El Limón" y CRUD de miembros con privilegios y aptitudes.
2. **Fase 2 — Plantillas y exportación inicial**: estructura común de formatos, editor tipo hoja de cálculo, estados borrador/publicado y vista imprimible.
3. **Fase 3 — Reunión Semanal + Reunión de Fin de Semana**: captura semanal/mensual, asignaciones, cambios manuales, conflictos y descarga PDF.
4. **Fase 4 — Lectores, Acomodadores, Limpieza y Hospitalidad**: edición mensual por formato y exportación PDF.
5. **Fase 5 — Servicio y dashboard**: formato fijo de servicio, próximos eventos, recordatorios y avisos.
6. **Fase 6 — PDF server-side y pulido**: PDFs fieles, publicación para `viewer`, historial y mejoras de impresión.

Cada fase termina con `lint`, `tsc --noEmit` y `build` en verde antes de continuar.

---

## Datos pendientes

No inventar estos datos:

- Dominio.
- Logotipo e identidad visual (sin parecido con marcas oficiales).
- Catálogo real de bosquejos de discursos.
- Textos legales y política de privacidad finales.
- Congregación, miembros o programas reales — solo datos de ejemplo claramente ficticios.
