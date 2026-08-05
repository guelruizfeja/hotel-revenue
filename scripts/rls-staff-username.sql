-- Sustituye el login de "Usuario" (mismo email que Dirección + contraseña
-- distinta) por un nombre de usuario propio, definido por Dirección al
-- crear el acceso. Se añade por encima de scripts/rls-staff-role.sql sin
-- tocar sus políticas RLS ni el RPC check_duplicate_reserva.
-- Ejecutar en Supabase Dashboard > SQL Editor. Idempotente.

-- ============================================================
-- 1) Columna username en hotel_staff.
--    hotel_staff.hotel_id es PK (un único acceso "Usuario" por hotel),
--    así que un índice único global sobre username ya es, en la
--    práctica, único "por hotel" — no hace falta namespacing.
-- ============================================================
alter table public.hotel_staff add column if not exists username text;

-- Backfill de filas ya existentes (si las hay): slug a partir del
-- nombre del hotel, con fallback y resolución de colisiones.
do $$
declare
  r record;
  v_base text;
  v_candidate text;
  v_suffix int;
begin
  for r in select hotel_id from public.hotel_staff where username is null loop
    select coalesce(nombre, '') into v_base from public.hoteles where id = r.hotel_id;
    v_base := lower(trim(v_base));
    v_base := translate(v_base,
      'áéíóúñàèìòùäëïöüâêîôûç',
      'aeiounaeiouaeiouaeiouc');
    v_base := regexp_replace(v_base, '[^a-z0-9]+', '-', 'g');
    v_base := trim(both '-' from v_base);
    if v_base = '' then
      v_base := 'usuario-' || substr(r.hotel_id::text, 1, 8);
    end if;

    v_candidate := v_base;
    v_suffix := 1;
    while exists(select 1 from public.hotel_staff where lower(username) = v_candidate and hotel_id <> r.hotel_id) loop
      v_suffix := v_suffix + 1;
      v_candidate := v_base || '-' || v_suffix;
    end loop;

    update public.hotel_staff set username = v_candidate where hotel_id = r.hotel_id;
  end loop;
end $$;

alter table public.hotel_staff alter column username set not null;

create unique index if not exists hotel_staff_username_unique_idx
  on public.hotel_staff (lower(username));

-- ============================================================
-- 2) RPC: resolver el email sintético de staff a partir del
--    nombre de usuario. Reemplaza a resolve_staff_login_email.
--    security definer, NO se concede a anon/authenticated: solo se
--    invoca server-side (api/resolve-staff-login.js) con la
--    service_role key.
-- ============================================================
create or replace function public.resolve_staff_login_username(p_username text)
returns text
language sql
security definer
set search_path = public
as $$
  select staff_email from public.hotel_staff where lower(username) = lower(trim(p_username));
$$;

revoke all on function public.resolve_staff_login_username(text) from public, anon, authenticated;

drop function if exists public.resolve_staff_login_email(text);

-- ============================================================
-- 3) Verificación
-- ============================================================
select hotel_id, username, staff_email from public.hotel_staff order by username;
