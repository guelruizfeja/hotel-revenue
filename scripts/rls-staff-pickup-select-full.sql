-- Amplía la lectura de pickup_entries para el rol "Usuario" (recepción): antes solo
-- veía las reservas capturadas HOY (fecha_pickup = hoy), lo cual impedía calcular
-- correctamente "quién está alojado hoy" (necesita reservas capturadas en días
-- anteriores cuya estancia sigue activa). El usuario confirma que no hay problema
-- en que recepción vea reservas y precios históricos, ya que es información que
-- también está disponible en el PMS.
--
-- Solo se amplía SELECT. Las políticas de INSERT/UPDATE (limitadas a
-- fecha_pickup = hoy) se mantienen sin cambios: recepción sigue sin poder
-- crear/editar reservas de días distintos a hoy.
-- Ejecutar en Supabase Dashboard > SQL Editor. Idempotente.

drop policy if exists pickup_entries_staff_select_today on public.pickup_entries;
drop policy if exists pickup_entries_staff_select_all on public.pickup_entries;
create policy pickup_entries_staff_select_all on public.pickup_entries
  for select using (
    hotel_id = (select hotel_id from public.hotel_staff where staff_user_id = auth.uid())
  );

-- Verificación
select tablename, policyname, cmd, qual
from pg_policies
where schemaname = 'public' and tablename = 'pickup_entries'
order by policyname;
