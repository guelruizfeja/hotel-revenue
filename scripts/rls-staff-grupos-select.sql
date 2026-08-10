-- Permite al rol "Usuario" (recepción) leer los grupos/eventos confirmados de su
-- propio hotel, en modo solo lectura. Necesario para que Producción Diaria pueda
-- avisar de cuánto F&B/Salas de grupos ya se está sumando automáticamente ese día
-- (ver ImportarExcel.jsx). Sigue el mismo patrón que rls-staff-role.sql: se SUMA
-- a la política de Dirección (hotel_id = auth.uid()), no la sustituye.
-- Ejecutar en Supabase Dashboard > SQL Editor. Idempotente.

drop policy if exists grupos_eventos_staff_select on public.grupos_eventos;
create policy grupos_eventos_staff_select on public.grupos_eventos
  for select using (
    hotel_id = (select hotel_id from public.hotel_staff where staff_user_id = auth.uid())
  );

-- Verificación
select tablename, policyname, cmd, qual
from pg_policies
where schemaname = 'public' and tablename = 'grupos_eventos'
order by policyname;
