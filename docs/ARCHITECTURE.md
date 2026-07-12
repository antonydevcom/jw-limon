# Arquitectura — Congregación El Limón

Este documento define la arquitectura funcional y técnica objetivo de JW-Limon / Congregación El Limón: módulos, roles, dominios de datos, enfoque de programación, plantillas de formatos y plan de reportes/exportación.

La documentación está en español. Identificadores de código, tablas, columnas, rutas internas, funciones y tipos van en inglés.

> **Aviso**: proyecto independiente y no oficial. Sin afiliación con Watch Tower Bible and Tract Society, jw.org ni New World Scheduler. No usar marcas ni material oficial.

---

## 1. Visión general

JW-Limon es una aplicación web privada para la programación de una congregación. El nombre formal visible en la app es **Congregación El Limón**; el nombre corto para PWA/acceso directo instalado es **El Limón**. Todo vive detrás de login; no existe contenido público de miembros.

```text
Usuario invitado -> Login -> App privada -> Supabase (RLS por congregación y rol)
Programas -> Exportación server-side -> PDF / impresión
```

Superficies:

- **App privada de administración**: dashboard y módulos de programación completos para `admin`.
- **Vista de consulta**: los usuarios normales (`viewer`) entran al dashboard, navegan por la barra lateral, ven programas publicados y descargan PDFs.
- **Exportes**: vistas imprimibles y PDF generados desde plantillas prehechas.

Aunque el MVP opera una sola congregación, todas las tablas de dominio llevan `congregation_id` desde el inicio para no rehacer el modelo después.

La experiencia principal es parecida a llenar formatos de congregación: el usuario entra a una sección, ve el formato completo del periodo actual, puede cambiar de mes o crear meses futuros si es admin, edita campos manualmente y descarga PDF. Los usuarios normales solo consultan y descargan formatos publicados.

---

## 2. Roles y acceso

| Rol | Permisos |
|---|---|
| `admin` | Acceso total: configuración de congregación, usuarios, miembros, formatos, publicación y descarga PDF. |
| `viewer` | Usuario normal: dashboard, navegación lateral, lectura de formatos publicados y descarga PDF. Sin edición. |

Reglas:

- Registro cerrado: un `admin` invita por email (Supabase Auth).
- Cada usuario pertenece a una congregación; RLS filtra por `congregation_id` en cada tabla.
- Un usuario puede estar vinculado a un miembro (`profiles.member_id`) para ver "mis asignaciones".

---

## 3. Stack

| Capa | Tecnología | Uso |
|---|---|---|
| Framework | Next.js App Router | Rutas y servidor. |
| Lenguaje | TypeScript | Tipado estricto. |
| UI | Tailwind CSS + shadcn/ui + lucide-react | Sistema visual. |
| Formularios | React Hook Form + Zod | Validación client/server. |
| Base de datos | Supabase Postgres | Datos con RLS. |
| Auth | Supabase Auth | Invitaciones y sesiones. |
| Archivos | Supabase Storage | Adjuntos y PDF generados si se persisten. |
| PWA | Web app installable | Acceso directo con nombre "El Limón". |
| PDF | Generación server-side | Librería pendiente de decidir en Fase 6. |
| Hosting | Vercel | Deploy. |

---

## 4. Estructura objetivo

Monolito modular: `app/` con rutas delgadas, dominio en `features/`, UI compartida en `components/`, lógica transversal en `shared/`.

```text
src/
├── app/
│   ├── (auth)/
│   │   └── login/
│   ├── (app)/
│   │   ├── page.tsx              # Dashboard
│   │   ├── miembros/             # → features/members
│   │   ├── reunion-semanal/      # → features/midweek
│   │   ├── reunion-fin-semana/   # → features/weekend
│   │   ├── lectores/             # → features/readers
│   │   ├── acomodadores/         # → features/duties
│   │   ├── limpieza/             # → features/cleaning
│   │   ├── hospitalidad/         # → features/hospitality
│   │   ├── servicio/             # → features/field-service
│   │   ├── grupos/               # → features/service-groups
│   │   ├── reportes/             # → features/reports
│   │   └── configuracion/        # → features/settings
│   └── api/
│       └── exports/              # Route handlers de exportación
├── features/
│   ├── dashboard/
│   ├── members/
│   ├── schedule-templates/
│   ├── midweek/
│   ├── weekend/
│   ├── readers/
│   ├── duties/
│   ├── cleaning/
│   ├── hospitality/
│   ├── field-service/
│   ├── service-groups/
│   ├── reports/
│   └── settings/
├── components/
│   ├── ui/                       # shadcn
│   ├── layout/                   # shell, sidebar, header
│   └── schedule/                 # tablas/calendarios de programa reutilizables
├── shared/
│   ├── supabase/                 # browserClient · serverClient · adminClient
│   ├── auth/                     # requireUser · requireRole
│   ├── validation/
│   ├── errors/
│   ├── utils/                    # dates · weeks · schedules
│   └── constants/
├── styles/
└── types/                        # database.types.ts
```

Cada módulo de `features/` sigue la misma forma:

| Carpeta | Para qué |
|---|---|
| `components/` | interfaz del módulo |
| `actions/` | server actions (escrituras) |
| `data/` | consultas a Supabase (lecturas) |
| `schemas/` | validaciones Zod |
| `types/` | tipos TypeScript |
| `utils/` | helpers del módulo |

Reglas:

- Slugs de URL en español; módulos internos en inglés (misma convención que proyectos hermanos).
- No hacer queries de Supabase dentro de componentes UI.
- Componente usado por un solo módulo vive en su `features/<módulo>/components/`; si lo comparten varios, en `components/`.

---

## 5. Formatos base

El MVP nace del archivo `Programas_congregación.xlsx`. Cada hoja se convierte en una plantilla editable dentro de la app. El objetivo es conservar la lógica del formato, no depender de Excel como base de datos.

| Hoja origen | Ruta app | Módulo | Descripción |
|---|---|---|---|
| `Congregación` | `/reunion-semanal` | `features/midweek` | Reunión Semanal / Vida y Ministerio Cristianos. |
| `Conferencias` | `/reunion-fin-semana` | `features/weekend` | Reunión de Fin de Semana. |
| `LECTORES` | `/lectores` | `features/readers` | Lectores de Estudio de La Atalaya y EBC. |
| `ACOMODADORES` | `/acomodadores` | `features/duties` | Entrada, auditorio y micrófonos por reunión. |
| `LIMPIEZA` | `/limpieza` | `features/cleaning` | Grupo responsable por martes/domingo. |
| `HOSPITALIDAD` | `/hospitalidad` | `features/hospitality` | Grupo de hospitalidad por domingo. |
| `servicio` | `/servicio` | `features/field-service` | Formato fijo de servicio por día, turno, casa y capitán. |

Flujo común:

```text
Admin -> Entrar a sección -> Ver periodo actual -> Crear/seleccionar periodo
      -> Llenar formato manualmente -> Guardar -> Publicar -> Descargar PDF

Usuario normal -> Dashboard -> Navegar sección -> Ver formato publicado -> Descargar PDF
```

Reglas de producto:

1. Los formatos existen prehechos por módulo; el usuario no diseña plantillas desde cero en MVP.
2. Solo el admin puede crear, editar, publicar o archivar formatos.
3. El flujo principal es manual: crear periodo, llenar datos, guardar, publicar y descargar.
4. Al entrar a cada sección, el periodo por defecto es el mes o semana actual; el admin puede seleccionar periodos anteriores o crear futuros.
5. Las ayudas automáticas para copiar/duplicar un mes anterior pueden agregarse después, pero no son requisito del MVP.
6. La descarga debe salir limpia aunque la edición interna use componentes tipo tabla/celda.
7. El PDF debe parecerse lo más posible al formato actual: encabezados, bloques por mes, filas por fecha y columnas por asignación. Se permiten variaciones menores si mejoran legibilidad o impresión.
8. No reproducir contenido oficial protegido; la app permite capturar títulos y campos necesarios, pero no extrae ni distribuye publicaciones oficiales.

### 5.1 Campos por formato

**Reunión Semanal (`midweek`)**

| Campo visible | Identificador sugerido | Notas |
|---|---|---|
| Fecha | `meeting_date` | Martes por defecto, configurable. |
| Presidente | `chairman_id` | Miembro elegible. |
| Canción inicial / final | `opening_song`, `closing_song` | Captura manual. |
| Oración inicial / final | `opening_prayer_id`, `closing_prayer_id` | Puede coincidir con presidente si así se decide. |
| Secciones | `section` | `treasures`, `ministry`, `living`. |
| Tiempo | `duration_minutes` | Valor editable. |
| Número de parte | `part_number` | Orden visible. |
| Título / descripción | `title`, `description` | Captura manual. |
| Asignado | `assigned_member_id` | Miembro elegible. |
| Ayudante | `assistant_member_id` | Opcional. |
| Lector EBC | `cbs_reader_id` | En el formato aparece como lector. |

**Reunión de Fin de Semana (`weekend`)**

| Campo visible | Identificador sugerido | Notas |
|---|---|---|
| Fecha | `meeting_date` | Domingo por defecto, configurable. |
| Presidente | `chairman_id` | Miembro elegible. |
| Oración inicial | `opening_prayer_id` | Miembro elegible. |
| Discursante | `speaker_id` | Local o visitante. |
| Congregación visitante | `speaker_congregation` | Para discursantes externos. |
| Discurso | `outline_title` / `outline_id` | Catálogo mantenido; no inventar datos. |
| Canción | `song_number` | Captura manual. |
| Lector | `watchtower_reader_id` | Miembro elegible. |
| Conductor | `watchtower_conductor_id` | Miembro elegible. |
| Hospitalidad | `hospitality_group_id` | Grupo asignado. |

**Lectores (`readers`)**

| Campo visible | Identificador sugerido | Notas |
|---|---|---|
| Mes | `month_start` | Primer día del mes. |
| Fecha | `meeting_date` | Domingo o martes. |
| Reunión | `meeting_type` | `watchtower_study` o `congregation_bible_study`. |
| Lector | `reader_id` | Miembro elegible. |

**Acomodadores (`duties`)**

| Campo visible | Identificador sugerido | Notas |
|---|---|---|
| Mes | `month_start` | |
| Fecha | `meeting_date` | Domingo o martes. |
| De entrada | `entrance_attendant_id` | |
| De auditorio | `auditorium_attendant_id` | |
| Micrófono 1 | `microphone_1_id` | |
| Micrófono 2 | `microphone_2_id` | |
| Observaciones | `notes` | Texto visible al final del formato. |

**Limpieza (`cleaning`)**

| Campo visible | Identificador sugerido | Notas |
|---|---|---|
| Mes | `month_start` | |
| Fecha | `service_date` | Martes/domingo. |
| Responsable | `cleaning_group_id` | Grupo 1, Grupo 2, etc. |

**Hospitalidad (`hospitality`)**

| Campo visible | Identificador sugerido | Notas |
|---|---|---|
| Mes | `month_start` | |
| Fecha | `meeting_date` | Domingos. |
| Asignado a | `service_group_id` | Grupo responsable. |

**Servicio (`field-service`)**

| Campo visible | Identificador sugerido | Notas |
|---|---|---|
| Día | `weekday` | Martes a domingo. |
| Turno | `time_slot` | `morning` / `afternoon`. |
| Hora | `starts_at` | Ej. 9:00 AM, 5:00 PM. |
| Casa | `location` | Punto de reunión. |
| Capitán | `captain_id` | Conductor/capitán del grupo. |

Servicio es un formato fijo: no se crea por mes. El admin lo edita cuando cambian lugares, horarios o capitanes; los usuarios normales ven la versión vigente y pueden descargar el PDF.

### 5.2 Edición tipo formato

La UI de formatos debe sentirse familiar para quien ya usa las hojas actuales:

- Filas por fecha y columnas por asignación.
- Celdas editables con selector de miembro/grupo cuando aplica.
- Campo de texto libre cuando la información no viene de catálogo.
- Selector de periodo visible en cada sección con formatos mensuales/semanales.
- Botón para crear un nuevo periodo futuro solo para `admin`.
- Guardado por borrador; publicación explícita.
- Botón principal: `Descargar PDF`.
- Botón secundario: `Vista imprimible`.
- Avisos de conflicto sin bloquear la edición.

No usar una librería de spreadsheet en MVP salvo aprobación explícita. Primero construir tablas controladas con React, formularios y componentes reutilizables.

---

## 6. Dominios de datos

Todas las tablas incluyen por convención `id` (uuid), `congregation_id`, `created_at` y `updated_at`. Nombres en `snake_case` inglés.

### 6.1 Núcleo

**`congregations`**
| Columna | Tipo | Notas |
|---|---|---|
| `name` | text | |
| `display_name` | text | Ej. "Congregación El Limón" |
| `short_name` | text | Ej. "El Limón" para PWA/acceso directo |
| `accent_color` | text nullable | Color propio de la congregación; verde/limón por defecto |
| `midweek_day` / `midweek_time` | smallint / time | Día y hora de reunión entre semana |
| `weekend_day` / `weekend_time` | smallint / time | Día y hora de fin de semana |
| `settings` | jsonb | Preferencias (idioma de plantillas, salas, etc.) |

**`profiles`** — usuarios de la app (extiende `auth.users`)
| Columna | Tipo | Notas |
|---|---|---|
| `user_id` | uuid (FK auth.users) | |
| `role` | enum: `admin` · `viewer` | |
| `member_id` | uuid nullable | Vínculo opcional con su registro de miembro |
| `theme_preference` | enum nullable | `system` · `light` · `dark` |
| `accent_color` | text nullable | Mejora futura para color por usuario |

**`members`** — publicadores
| Columna | Tipo | Notas |
|---|---|---|
| `first_name` / `last_name` | text | |
| `gender` | enum | Necesario para reglas de elegibilidad de asignaciones |
| `privilege` | enum: `elder` · `ministerial_servant` · `publisher` | |
| `pioneer_type` | enum nullable: `regular` · `auxiliary` | |
| `phone` / `email` | text nullable | Mínimo necesario para coordinar |
| `is_active` | boolean | Baja lógica; borrado físico soportado (derecho de supresión) |
| `notes` | text nullable | Nunca datos sensibles adicionales |

**`member_qualifications`** — aptitudes por tipo de asignación
| Columna | Tipo | Notas |
|---|---|---|
| `member_id` | uuid FK | |
| `assignment_type` | enum | Ej.: `chairman`, `treasures_talk`, `spiritual_gems`, `bible_reading`, `student_assignment`, `assistant`, `living_talk`, `cbs_conductor`, `cbs_reader`, `public_talk`, `watchtower_conductor`, `watchtower_reader`, `prayer`, `audio`, `video`, `platform`, `microphones`, `attendant`, `cleaning`, `group_overseer` |

**`member_absences`** — indisponibilidad
| Columna | Tipo | Notas |
|---|---|---|
| `member_id` | uuid FK | |
| `starts_on` / `ends_on` | date | |
| `reason` | text nullable | Opcional, sin detalles sensibles |

### 6.2 Plantillas, periodos y overrides

**`schedule_periods`** — instancia de un formato por mes, semana o rango
| Columna | Tipo | Notas |
|---|---|---|
| `template_key` | enum | `midweek`, `weekend`, `readers`, `duties`, `cleaning`, `hospitality` |
| `starts_on` / `ends_on` | date | Rango cubierto |
| `status` | enum: `draft` · `published` · `archived` | |
| `published_at` | timestamptz nullable | |
| `created_from_period_id` | uuid nullable | Permite copiar un periodo anterior si se agrega esa ayuda |
| `notes` | text nullable | |

**`schedule_manual_overrides`** — historial de cambios manuales sobre un formato
| Columna | Tipo | Notas |
|---|---|---|
| `period_id` | uuid FK | |
| `entity_type` | text | Ej. `midweek_part`, `duty_assignment`, `field_service_meeting` |
| `entity_id` | uuid | ID del registro editado |
| `field_name` | text | Campo cambiado |
| `previous_value` | jsonb nullable | |
| `new_value` | jsonb | |
| `reason` | text nullable | Ej. cambio de asignación |
| `changed_by` | uuid FK profiles | |

Estas tablas permiten conservar historial de periodos y cambios manuales. En MVP todos los formatos se llenan manualmente; copiar periodos anteriores queda como mejora posterior.

### 6.3 Reunión Semanal (reunión de entre semana)

**`midweek_meetings`** — una fila por semana
| Columna | Tipo | Notas |
|---|---|---|
| `week_start` | date (único por congregación) | Lunes de la semana |
| `status` | enum: `draft` · `published` | |
| `is_canceled` | boolean | Semanas de asamblea/eventos |

**`midweek_parts`** — partes del programa
| Columna | Tipo | Notas |
|---|---|---|
| `meeting_id` | uuid FK | |
| `section` | enum: `opening` · `treasures` · `ministry` · `living` · `closing` | Tesoros · Seamos Mejores Maestros · Nuestra Vida Cristiana |
| `part_type` | enum | Referencia a `assignment_type` |
| `title` | text | Título de la parte (capturado, no extraído de publicaciones) |
| `duration_minutes` | smallint | |
| `order` | smallint | |

**`midweek_assignments`**
| Columna | Tipo | Notas |
|---|---|---|
| `part_id` | uuid FK | |
| `member_id` | uuid FK | Asignado |
| `assistant_id` | uuid FK nullable | Ayudante en demostraciones |
| `room` | enum: `main` · `aux_1` · `aux_2` | Sala principal o auxiliares |

### 6.4 Reunión de Fin de Semana (discurso público)

**`talk_outlines`** — catálogo de bosquejos (datos mantenidos, no fabricados)
| Columna | Tipo | Notas |
|---|---|---|
| `number` | smallint (único) | |
| `title` | text | |

**`speakers`** — discursantes locales y visitantes
| Columna | Tipo | Notas |
|---|---|---|
| `member_id` | uuid FK nullable | Si es local |
| `full_name` | text | Para visitantes sin registro de miembro |
| `home_congregation` | text nullable | Congregación de origen del visitante |
| `phone` | text nullable | |

**`weekend_meetings`**
| Columna | Tipo | Notas |
|---|---|---|
| `meeting_date` | date (único por congregación) | |
| `outline_id` | uuid FK nullable | |
| `speaker_id` | uuid FK nullable | |
| `chairman_id` | uuid FK members | Presidente |
| `opening_prayer_id` | uuid FK members nullable | Oración inicial |
| `song_number` | smallint nullable | Canción |
| `wt_conductor_id` | uuid FK members | Conductor de La Atalaya |
| `wt_reader_id` | uuid FK members | Lector |
| `hospitality_group_id` | uuid FK nullable | Grupo asignado |
| `status` | enum: `draft` · `published` | |
| `is_special_event` | boolean | Asamblea, visita del superintendente, etc. |

**`outgoing_talks`** — discursantes locales que salen a otras congregaciones
| Columna | Tipo | Notas |
|---|---|---|
| `member_id` | uuid FK | |
| `talk_date` | date | |
| `destination_congregation` | text | |
| `outline_id` | uuid FK nullable | |

### 6.5 Lectores

**`reader_assignments`**
| Columna | Tipo | Notas |
|---|---|---|
| `meeting_date` | date | Domingo o martes |
| `reader_type` | enum: `watchtower_study` · `congregation_bible_study` | |
| `member_id` | uuid FK members | Lector |
| `period_id` | uuid FK schedule_periods nullable | |
| `notes` | text nullable | |

### 6.6 Acomodadores y micrófonos

**`duty_types`** — catálogo por congregación (audio, video, plataforma, micrófonos, acomodadores, entrada)

**`duty_assignments`**
| Columna | Tipo | Notas |
|---|---|---|
| `duty_type_id` | uuid FK | |
| `member_id` | uuid FK | |
| `meeting_date` | date | Cubre reunión entre semana y fin de semana |
| `slot` | text nullable | Ej. `entrance`, `auditorium`, `microphone_1`, `microphone_2` |
| `period_id` | uuid FK schedule_periods nullable | |

### 6.7 Limpieza

**`cleaning_groups`** — grupos o familias con nombre y miembros (`cleaning_group_members`)

**`cleaning_assignments`**
| Columna | Tipo | Notas |
|---|---|---|
| `cleaning_group_id` | uuid FK | |
| `week_start` | date nullable | Semana de referencia si aplica |
| `service_date` | date nullable | Fecha exacta cuando se programa por martes/domingo |
| `period_id` | uuid FK schedule_periods nullable | |
| `notes` | text nullable | Ej. limpieza profunda |

### 6.8 Hospitalidad

**`hospitality_assignments`**
| Columna | Tipo | Notas |
|---|---|---|
| `meeting_date` | date | Domingo |
| `service_group_id` | uuid FK service_groups | Grupo asignado |
| `period_id` | uuid FK schedule_periods nullable | |
| `notes` | text nullable | |

### 6.9 Grupos de servicio

**`service_groups`**
| Columna | Tipo | Notas |
|---|---|---|
| `name` | text | |
| `overseer_id` | uuid FK members | Superintendente de grupo |
| `assistant_id` | uuid FK members nullable | Auxiliar |

`members.service_group_id` (FK nullable) asigna cada publicador a un grupo.

### 6.10 Programa de servicio

**`field_service_schedule`** — formato fijo para reuniones de servicio
| Columna | Tipo | Notas |
|---|---|---|
| `weekday` | smallint | Para vistas tipo formato semanal |
| `time_slot` | enum: `morning` · `afternoon` | |
| `starts_at` | time nullable | |
| `location` | text | Punto de encuentro |
| `captain_id` | uuid FK members | Capitán/conductor |
| `service_group_id` | uuid FK nullable | Nulo = toda la congregación |
| `is_active` | boolean | Permite desactivar un bloque sin borrarlo |

### 6.11 Dashboard

**`dashboard_events`** — próximos eventos visibles en el dashboard
| Columna | Tipo | Notas |
|---|---|---|
| `title` | text | Texto corto en español |
| `description` | text nullable | |
| `event_date` | date | |
| `event_time` | time nullable | |
| `visibility` | enum: `admin_only` · `all_users` | |
| `is_active` | boolean | |

**`reminders`** — recordatorios simples
| Columna | Tipo | Notas |
|---|---|---|
| `title` | text | |
| `due_on` | date nullable | |
| `assigned_role` | enum nullable | Si aplica a `admin` o a todos |
| `is_done` | boolean | |
| `created_by` | uuid FK profiles | |

---

## 7. Enfoque de programación

Principios comunes a todos los módulos de calendario:

1. **Periodo como unidad**: cada formato se crea por semana, mes o rango según su sección. Al entrar, se muestra el periodo actual.
2. **Borrador → publicado**: el `admin` trabaja en `draft`; al publicar, los `viewer` pueden consultarlo y descargar PDF. Cambios posteriores marcan el programa como actualizado.
3. **Elegibilidad**: al asignar, solo se ofrecen miembros con la `member_qualification` correspondiente, activos y sin ausencia en la fecha.
4. **Detección de conflictos**: aviso (no bloqueo) cuando un miembro ya tiene otra asignación la misma semana o el mismo día — asignación de VyM + deber, discursante saliente + deber local, etc.
5. **Edición manual primero**: el admin decide los valores finales. La app puede validar y avisar, pero no reemplaza el llenado manual en MVP.
6. **Periodos futuros**: cada sección permite crear periodos adelantados para preparar programas de meses próximos.
7. **Semanas especiales**: asambleas y eventos cancelan o modifican reuniones sin borrar el historial.
8. **Descarga confiable**: el PDF se genera desde datos guardados, no desde estado temporal del navegador.

La lógica de periodos, elegibilidad y conflictos vive en `shared/utils/schedules` y en los `data/` de cada módulo, con pruebas unitarias.

---

## 8. Reportes y exportación

Fundación en MVP, generación completa en Fase 6:

- **Vistas imprimibles**: cada programa publicado tiene una vista limpia para imprimir desde el navegador (CSS print) — esto puede apoyar la verificación visual.
- **PDF server-side**: route handlers en `app/api/exports/` generan PDF por módulo y periodo (Reunión Semanal, Reunión de Fin de Semana, Lectores, Acomodadores, Limpieza, Hospitalidad) y el PDF vigente de Servicio. Requisito: ejecución server-side en Vercel y salida en español.
- **Descarga por formato**: cada módulo tiene botón `Descargar PDF`; no se obliga al usuario a pasar por un módulo global de reportes para lo básico.
- **Acceso**: toda exportación exige sesión autenticada; los archivos no se sirven desde URLs públicas. Si se persisten, van a un bucket privado de Storage con URLs firmadas de corta duración.
- **Plantillas**: diseño sobrio, legible y apto para tablón de anuncios, sin marcas ni logotipos oficiales. Puede usar identidad propia verde/limón de "El Limón" siempre que no parezca oficial.

---

## 9. Seguridad y privacidad

- **RLS en todas las tablas**: política base `congregation_id = congregación del usuario autenticado`, más restricción por rol para escrituras (`admin` solamente) y para lectura de datos administrativos de miembros.
- **Datos de categoría especial**: la pertenencia religiosa se trata como dato sensible. Minimización de datos: solo lo necesario para programar.
- **Sin acceso anónimo**: ninguna política pública de lectura o escritura. Registro solo por invitación.
- **Derecho de supresión**: borrado físico de un miembro con limpieza de referencias (las asignaciones históricas pueden anonimizarse en lugar de borrarse, decisión de producto pendiente).
- **Claves**: `SUPABASE_SERVICE_ROLE_KEY` solo server-side. Nunca en el cliente, nunca en logs.
- **Auditoría mínima**: `created_at`/`updated_at` en todo; considerar `updated_by` en tablas de programa para trazabilidad.

---

## 10. Pruebas

Proporcionales al riesgo:

- Unitarias: elegibilidad, detección de conflictos, selección/creación de periodos, cálculo de semanas y meses.
- Unitarias: aplicación de overrides manuales sobre borradores generados.
- Integración: RLS bloquea acceso entre congregaciones y a usuarios anónimos; `viewer` no puede escribir.
- Antes de cada entrega: `pnpm lint`, `pnpm exec tsc --noEmit`, `pnpm build`.

---

## 11. Roadmap técnico

| Fase | Entrega |
|---|---|
| 1 | Scaffolding, Supabase, auth por invitación, roles, PWA "El Limón", `congregations`, `profiles`, CRUD de `members` + `member_qualifications` + `member_absences`. |
| 2 | `schedule_periods`, `schedule_manual_overrides`, estructura común de plantillas, editor tipo tabla, estados `draft`/`published`, vista imprimible base. |
| 3 | `midweek_meetings`/`midweek_parts`/`midweek_assignments`, `weekend_meetings`, `talk_outlines`, `speakers`, descargas iniciales de Reunión Semanal y Reunión de Fin de Semana. |
| 4 | `reader_assignments`, `duty_types`/`duty_assignments`, `cleaning_groups`/`cleaning_assignments`, `hospitality_assignments`, edición mensual. |
| 5 | `service_groups`, `field_service_schedule`, `dashboard_events`, `reminders`, vista "mis asignaciones". |
| 6 | PDF server-side, publicación para `viewer`, historial de descargas, pulido de impresión. |

Cada fase cierra con checks en verde y migraciones aplicadas en `supabase/migrations/`.
