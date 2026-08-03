-- Añade la columna que faltaba para guardar el desglose de Revenue Salas
-- en produccion_diaria (hasta ahora solo se usaba para sumar al total y se descartaba).
-- Ejecutar en Supabase Dashboard > SQL Editor. Idempotente.

alter table public.produccion_diaria
  add column if not exists revenue_salas numeric;
