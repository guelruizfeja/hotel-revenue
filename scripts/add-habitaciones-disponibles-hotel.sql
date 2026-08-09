-- Añade la columna para guardar las Habitaciones Disponibles por defecto del hotel
-- (distinta del Número de Habitaciones total: permite descontar bloqueos/reformas, etc.)
-- Se usa para autorrellenar el campo "Habitaciones Disponibles" en Producción diaria.
-- Ejecutar en Supabase Dashboard > SQL Editor. Idempotente.

alter table public.hoteles
  add column if not exists habitaciones_disponibles integer;
