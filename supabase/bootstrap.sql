-- Bootstrap: primera congregación y primer admin.
-- Ejecutar UNA VEZ con la service-role key (bypasa RLS).
-- Reemplaza los placeholders antes de correr.

-- Paso 1: crea la congregación y guarda el id que regresa.
insert into public.congregations (name, display_name, short_name, midweek_day, midweek_time, weekend_day, weekend_time)
values (
  'El Limon',                    -- name (interno, snake_case)
  'Congregación El Limón',       -- display_name
  'El Limón',                    -- short_name (PWA)
  2,                             -- midweek_day: 2 = martes (0=dom, 1=lun, 2=mar…)
  '19:00:00',                    -- midweek_time: hora de reunión entre semana
  0,                             -- weekend_day: 0 = domingo
  '10:00:00'                     -- weekend_time: hora de reunión de fin de semana
)
returning id;

-- Paso 2: el primer usuario debe registrarse primero vía Supabase Auth
-- (panel → Authentication → Users → Invite user) y copiar su UUID aquí.

-- Paso 3: crea la membresía de admin para ese usuario.
-- Reemplaza <congregation_id> y <user_id> con los UUIDs reales.
insert into public.congregation_memberships (congregation_id, user_id, role)
values (
  '<congregation_id>',   -- UUID del returning id del paso 1
  '<user_id>',           -- UUID del usuario en auth.users
  'admin'
);
