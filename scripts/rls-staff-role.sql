-- Rol "Usuario" (recepción) con separación real a nivel de RLS.
-- Se añade por encima de scripts/rls-aislamiento-hoteles.sql sin tocarlo:
-- las políticas RLS permisivas se combinan con OR, así que esto solo
-- amplía el acceso para la identidad "staff", nunca reduce el de Dirección.
-- Ejecutar en Supabase Dashboard > SQL Editor. Idempotente.

-- ============================================================
-- 1) Tabla puente: qué cuenta de Supabase Auth (staff_user_id)
--    es el "Usuario" de qué hotel.
-- ============================================================
create table if not exists public.hotel_staff (
  hotel_id      uuid primary key references public.hoteles(id) on delete cascade,
  staff_user_id uuid not null unique references auth.users(id) on delete cascade,
  staff_email   text not null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

alter table public.hotel_staff enable row level security;

-- El propio staff puede ver su fila (para resolver su hotel_id en el cliente).
drop policy if exists hotel_staff_select_staff on public.hotel_staff;
create policy hotel_staff_select_staff on public.hotel_staff
  for select using (staff_user_id = auth.uid());

-- Dirección puede ver (no escribir) la fila de su propio hotel, para
-- mostrar en Configuración si el acceso "Usuario" ya está configurado.
drop policy if exists hotel_staff_select_owner on public.hotel_staff;
create policy hotel_staff_select_owner on public.hotel_staff
  for select using (hotel_id = auth.uid());

-- Sin políticas de insert/update/delete para "authenticated": solo el
-- backend con la service_role key (que ignora RLS) puede escribir aquí,
-- vía api/set-staff-password.js.

-- ============================================================
-- 2) RPC: resolver el email sintético de staff a partir del email
--    real del hotel. security definer para poder leer auth.users.
--    NO se concede a anon/authenticated: solo se invoca server-side
--    (api/resolve-staff-login.js) con la service_role key, para no
--    permitir enumerar desde el cliente qué hoteles tienen "Usuario".
-- ============================================================
create or replace function public.resolve_staff_login_email(p_email text)
returns text
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_hotel_id uuid;
  v_staff_email text;
begin
  select id into v_hotel_id from auth.users where lower(email) = lower(trim(p_email)) limit 1;
  if v_hotel_id is null then
    return null;
  end if;
  select staff_email into v_staff_email from public.hotel_staff where hotel_id = v_hotel_id;
  return v_staff_email; -- null si Dirección no ha configurado el acceso Usuario
end;
$$;

revoke all on function public.resolve_staff_login_email(text) from public, anon, authenticated;

-- ============================================================
-- 3) RPC: comprobar si un número de reserva ya existe en TODO el
--    histórico (no solo "hoy"), sin exponer ninguna fila ni revenue.
--    Necesaria porque el SELECT normal de staff sobre pickup_entries
--    queda restringido a la fecha de hoy (ver punto 4) y por tanto no
--    vería duplicados de días anteriores si se comprobara con un SELECT.
-- ============================================================
create or replace function public.check_duplicate_reserva(p_numero_reserva integer)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_hotel_id uuid;
begin
  select id into v_hotel_id from public.hoteles where id = auth.uid();
  if v_hotel_id is null then
    select hotel_id into v_hotel_id from public.hotel_staff where staff_user_id = auth.uid();
  end if;
  if v_hotel_id is null then
    return false;
  end if;
  return exists(
    select 1 from public.pickup_entries
    where hotel_id = v_hotel_id and numero_reserva = p_numero_reserva
  );
end;
$$;

grant execute on function public.check_duplicate_reserva(integer) to authenticated;

-- ============================================================
-- 4) Políticas RLS adicionales para la identidad staff, restringidas
--    a la fecha de hoy. Se SUMAN a las políticas de Dirección ya
--    existentes (hotel_id = auth.uid()) — no las sustituyen.
--    Sin política de DELETE: el rol Usuario nunca puede borrar.
-- ============================================================

-- pickup_entries
drop policy if exists pickup_entries_staff_select_today on public.pickup_entries;
create policy pickup_entries_staff_select_today on public.pickup_entries
  for select using (
    fecha_pickup = current_date
    and hotel_id = (select hotel_id from public.hotel_staff where staff_user_id = auth.uid())
  );

drop policy if exists pickup_entries_staff_insert_today on public.pickup_entries;
create policy pickup_entries_staff_insert_today on public.pickup_entries
  for insert with check (
    fecha_pickup = current_date
    and hotel_id = (select hotel_id from public.hotel_staff where staff_user_id = auth.uid())
  );

drop policy if exists pickup_entries_staff_update_today on public.pickup_entries;
create policy pickup_entries_staff_update_today on public.pickup_entries
  for update using (
    fecha_pickup = current_date
    and hotel_id = (select hotel_id from public.hotel_staff where staff_user_id = auth.uid())
  ) with check (
    fecha_pickup = current_date
    and hotel_id = (select hotel_id from public.hotel_staff where staff_user_id = auth.uid())
  );

-- produccion_diaria
drop policy if exists produccion_diaria_staff_select_today on public.produccion_diaria;
create policy produccion_diaria_staff_select_today on public.produccion_diaria
  for select using (
    fecha = current_date
    and hotel_id = (select hotel_id from public.hotel_staff where staff_user_id = auth.uid())
  );

drop policy if exists produccion_diaria_staff_insert_today on public.produccion_diaria;
create policy produccion_diaria_staff_insert_today on public.produccion_diaria
  for insert with check (
    fecha = current_date
    and hotel_id = (select hotel_id from public.hotel_staff where staff_user_id = auth.uid())
  );

drop policy if exists produccion_diaria_staff_update_today on public.produccion_diaria;
create policy produccion_diaria_staff_update_today on public.produccion_diaria
  for update using (
    fecha = current_date
    and hotel_id = (select hotel_id from public.hotel_staff where staff_user_id = auth.uid())
  ) with check (
    fecha = current_date
    and hotel_id = (select hotel_id from public.hotel_staff where staff_user_id = auth.uid())
  );

-- ============================================================
-- 5) Verificación
-- ============================================================
select tablename, policyname, cmd, qual, with_check
from pg_policies
where schemaname = 'public'
  and tablename in ('hotel_staff','pickup_entries','produccion_diaria')
order by tablename, policyname;
