-- Mock de datos para el hueco del 11 al 20 de agosto de 2026 (ausencia de 10 días).
-- Uso: pegar y ejecutar entero en el SQL Editor de Supabase. No toca código de la app.
-- hotel_id: dd2cc41f-0a25-4ebe-b3da-6b96871d5fff
--
-- Rellena produccion_diaria (con adr/revpar/trevpar ya calculados, igual que hace el
-- frontend) y una fila de pickup_entries por día (es_individual=true, num_reservas =
-- hab_ocupadas, precio_total = revenue_hab, noches=1) para que coincida exactamente
-- con produccion_diaria y no dispare el aviso "Pick Up vs Producción difiere".
--
-- hab_disponibles=60 y revenue_salas=NULL, igual que en los días reales de agosto
-- (2026-08-01 a 2026-08-10) usados como referencia de rango de valores.

begin;

delete from produccion_diaria
  where hotel_id = 'dd2cc41f-0a25-4ebe-b3da-6b96871d5fff'
  and fecha between '2026-08-11' and '2026-08-20';

delete from pickup_entries
  where hotel_id = 'dd2cc41f-0a25-4ebe-b3da-6b96871d5fff'
  and es_individual = true
  and fecha_llegada between '2026-08-11' and '2026-08-20';

insert into produccion_diaria
  (hotel_id, fecha, hab_ocupadas, hab_disponibles, revenue_hab, revenue_fnb, revenue_salas, revenue_total, adr, revpar, trevpar)
values
  ('dd2cc41f-0a25-4ebe-b3da-6b96871d5fff', '2026-08-11', 51, 60, 4850.00, 205.00, null, 5055.00,  95.10, 80.83,  84.25),
  ('dd2cc41f-0a25-4ebe-b3da-6b96871d5fff', '2026-08-12', 53, 60, 5100.00, 230.00, null, 5330.00,  96.23, 85.00,  88.83),
  ('dd2cc41f-0a25-4ebe-b3da-6b96871d5fff', '2026-08-13', 49, 60, 4600.00, 180.00, null, 4780.00,  93.88, 76.67,  79.67),
  ('dd2cc41f-0a25-4ebe-b3da-6b96871d5fff', '2026-08-14', 56, 60, 6200.00, 290.00, null, 6490.00, 110.71, 103.33, 108.17),
  ('dd2cc41f-0a25-4ebe-b3da-6b96871d5fff', '2026-08-15', 58, 60, 6650.00, 310.00, null, 6960.00, 114.66, 110.83, 116.00),
  ('dd2cc41f-0a25-4ebe-b3da-6b96871d5fff', '2026-08-16', 57, 60, 6400.00, 275.00, null, 6675.00, 112.28, 106.67, 111.25),
  ('dd2cc41f-0a25-4ebe-b3da-6b96871d5fff', '2026-08-17', 50, 60, 4700.00, 195.00, null, 4895.00,  94.00, 78.33,  81.58),
  ('dd2cc41f-0a25-4ebe-b3da-6b96871d5fff', '2026-08-18', 46, 60, 4250.00, 160.00, null, 4410.00,  92.39, 70.83,  73.50),
  ('dd2cc41f-0a25-4ebe-b3da-6b96871d5fff', '2026-08-19', 52, 60, 4980.00, 215.00, null, 5195.00,  95.77, 83.00,  86.58),
  ('dd2cc41f-0a25-4ebe-b3da-6b96871d5fff', '2026-08-20', 54, 60, 5350.00, 240.00, null, 5590.00,  99.07, 89.17,  93.17);

insert into pickup_entries
  (hotel_id, fecha_pickup, fecha_llegada, fecha_salida, canal, num_reservas, noches, precio_total, estado, es_individual, numero_reserva)
values
  ('dd2cc41f-0a25-4ebe-b3da-6b96871d5fff', '2026-08-11', '2026-08-11', '2026-08-12', 'Booking.com', 51, 1, 4850.00, 'confirmada', true, null),
  ('dd2cc41f-0a25-4ebe-b3da-6b96871d5fff', '2026-08-12', '2026-08-12', '2026-08-13', 'Booking.com', 53, 1, 5100.00, 'confirmada', true, null),
  ('dd2cc41f-0a25-4ebe-b3da-6b96871d5fff', '2026-08-13', '2026-08-13', '2026-08-14', 'Directo',     49, 1, 4600.00, 'confirmada', true, null),
  ('dd2cc41f-0a25-4ebe-b3da-6b96871d5fff', '2026-08-14', '2026-08-14', '2026-08-15', 'Booking.com', 56, 1, 6200.00, 'confirmada', true, null),
  ('dd2cc41f-0a25-4ebe-b3da-6b96871d5fff', '2026-08-15', '2026-08-15', '2026-08-16', 'Expedia',     58, 1, 6650.00, 'confirmada', true, null),
  ('dd2cc41f-0a25-4ebe-b3da-6b96871d5fff', '2026-08-16', '2026-08-16', '2026-08-17', 'Booking.com', 57, 1, 6400.00, 'confirmada', true, null),
  ('dd2cc41f-0a25-4ebe-b3da-6b96871d5fff', '2026-08-17', '2026-08-17', '2026-08-18', 'Directo',     50, 1, 4700.00, 'confirmada', true, null),
  ('dd2cc41f-0a25-4ebe-b3da-6b96871d5fff', '2026-08-18', '2026-08-18', '2026-08-19', 'Booking.com', 46, 1, 4250.00, 'confirmada', true, null),
  ('dd2cc41f-0a25-4ebe-b3da-6b96871d5fff', '2026-08-19', '2026-08-19', '2026-08-20', 'Expedia',     52, 1, 4980.00, 'confirmada', true, null),
  ('dd2cc41f-0a25-4ebe-b3da-6b96871d5fff', '2026-08-20', '2026-08-20', '2026-08-21', 'Booking.com', 54, 1, 5350.00, 'confirmada', true, null);

commit;
