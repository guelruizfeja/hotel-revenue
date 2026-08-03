-- Verifica y fuerza el aislamiento de datos por hotel (RLS) en Supabase.
-- Ejecutar en Supabase Dashboard > SQL Editor.
-- Es idempotente: se puede correr varias veces sin duplicar políticas.

-- ============================================================
-- 1) VERIFICACIÓN: ¿qué tablas tienen RLS activado ahora mismo?
-- ============================================================
select tablename, rowsecurity as rls_activado
from pg_tables
where schemaname = 'public'
  and tablename in ('hoteles','salas','grupos_eventos','produccion_diaria','presupuesto','pickup_entries','suscripciones')
order by tablename;

-- ============================================================
-- 2) VERIFICACIÓN: ¿qué políticas existen ya en cada tabla?
-- ============================================================
select tablename, policyname, cmd, qual, with_check
from pg_policies
where schemaname = 'public'
  and tablename in ('hoteles','salas','grupos_eventos','produccion_diaria','presupuesto','pickup_entries','suscripciones')
order by tablename, policyname;

-- ============================================================
-- 3) FORZAR AISLAMIENTO: habilita RLS + crea policy "todo o nada"
--    por hotel en cada tabla. auth.uid() = el usuario logueado.
-- ============================================================

-- hoteles: la fila del hotel es su propia fila (id = auth.uid())
alter table public.hoteles enable row level security;
drop policy if exists hoteles_isolation on public.hoteles;
create policy hoteles_isolation on public.hoteles
  for all
  using (id = auth.uid())
  with check (id = auth.uid());

-- salas
alter table public.salas enable row level security;
drop policy if exists salas_isolation on public.salas;
create policy salas_isolation on public.salas
  for all
  using (hotel_id = auth.uid())
  with check (hotel_id = auth.uid());

-- grupos_eventos
alter table public.grupos_eventos enable row level security;
drop policy if exists grupos_eventos_isolation on public.grupos_eventos;
create policy grupos_eventos_isolation on public.grupos_eventos
  for all
  using (hotel_id = auth.uid())
  with check (hotel_id = auth.uid());

-- produccion_diaria
alter table public.produccion_diaria enable row level security;
drop policy if exists produccion_diaria_isolation on public.produccion_diaria;
create policy produccion_diaria_isolation on public.produccion_diaria
  for all
  using (hotel_id = auth.uid())
  with check (hotel_id = auth.uid());

-- presupuesto
alter table public.presupuesto enable row level security;
drop policy if exists presupuesto_isolation on public.presupuesto;
create policy presupuesto_isolation on public.presupuesto
  for all
  using (hotel_id = auth.uid())
  with check (hotel_id = auth.uid());

-- pickup_entries
alter table public.pickup_entries enable row level security;
drop policy if exists pickup_entries_isolation on public.pickup_entries;
create policy pickup_entries_isolation on public.pickup_entries
  for all
  using (hotel_id = auth.uid())
  with check (hotel_id = auth.uid());

-- suscripciones (esta tabla también la escribe el webhook de Stripe
-- con la service_role key, que siempre salta RLS — no se ve afectado)
alter table public.suscripciones enable row level security;
drop policy if exists suscripciones_isolation on public.suscripciones;
create policy suscripciones_isolation on public.suscripciones
  for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ============================================================
-- 4) RE-VERIFICACIÓN: repetir la consulta del punto 1 para
--    confirmar que las 7 tablas quedaron con rls_activado = true
-- ============================================================
select tablename, rowsecurity as rls_activado
from pg_tables
where schemaname = 'public'
  and tablename in ('hoteles','salas','grupos_eventos','produccion_diaria','presupuesto','pickup_entries','suscripciones')
order by tablename;
