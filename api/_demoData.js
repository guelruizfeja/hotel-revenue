// Generador de datos ficticios (fase de desarrollo).
// Lo llama el cron del informe diario, ANTES de leer la producción de "ayer", para las cuentas
// listadas en DEMO_DATA_EMAILS. Cada día:
//   1. Da de alta reservas de Pick Up nuevas (fecha_pickup = ayer) en varios canales y, a veces,
//      cancela alguna reserva ficticia futura.
//   2. De vez en cuando confirma un grupo (con habitaciones) o un evento (solo F&B/Salas) futuro.
//   3. Genera la producción de ayer a partir de lo que ya hay OTB para esa noche (Pick Up + grupos)
//      y completa hasta una ocupación objetivo realista con reservas de última hora del mismo día.
//      Así producción y OTB coinciden y no salta el aviso "Pick Up vs Producción difiere".
// No toca nada si ayer ya tiene producción (introducida a mano o generada antes).
//
// Marcas para poder limpiar luego:
//   - pickup_entries ficticias: numero_reserva >= 9000000
//   - grupos_eventos ficticios: notas contiene "[demo]"
//   - produccion_diaria: por rango de fechas (desde que se activó el generador)

import { buildHabEnCasaMap, buildRevEnCasaMap } from '../src/utils.js';

export const DEMO_RESERVA_MIN = 9000000;

const pad2 = n => String(n).padStart(2, '0');
const addDays = (iso, n) => {
  const d = new Date(iso + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() + n);
  return `${d.getUTCFullYear()}-${pad2(d.getUTCMonth() + 1)}-${pad2(d.getUTCDate())}`;
};
const rnd   = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const rndF  = (min, max) => Math.random() * (max - min) + min;
const pick  = arr => arr[Math.floor(Math.random() * arr.length)];
const pickW = (pairs) => { // [[valor, peso], ...]
  const tot = pairs.reduce((s, [, w]) => s + w, 0);
  let r = Math.random() * tot;
  for (const [v, w] of pairs) { if ((r -= w) <= 0) return v; }
  return pairs[pairs.length - 1][0];
};
const r2 = n => Math.round(n * 100) / 100;

// Estacionalidad (hotel urbano/vacacional medio, valores netos de IVA)
const OCC_MES = [0.55, 0.60, 0.65, 0.72, 0.78, 0.85, 0.90, 0.88, 0.80, 0.72, 0.60, 0.62];
const ADR_MES = [75, 78, 82, 88, 92, 98, 104, 106, 96, 90, 80, 85];
const diaSemana = iso => new Date(iso + 'T00:00:00Z').getUTCDay(); // 0 = domingo
const occObjetivo = iso => {
  const dow = diaSemana(iso);
  const ajuste = dow === 5 || dow === 6 ? 0.12 : dow === 0 ? -0.10 : 0;
  const mes = parseInt(iso.slice(5, 7)) - 1;
  return Math.min(0.98, Math.max(0.35, OCC_MES[mes] + ajuste + rndF(-0.07, 0.07)));
};
const adrEstimado = iso => {
  const dow = diaSemana(iso);
  const f = dow === 5 || dow === 6 ? 1.12 : dow === 0 ? 0.95 : 1;
  const mes = parseInt(iso.slice(5, 7)) - 1;
  return ADR_MES[mes] * f * rndF(0.92, 1.08);
};

const CANALES = [['Booking.com', 40], ['Expedia', 18], ['Directo', 16], ['Web', 16], ['Empresa', 10]];
const NOMBRES_GRUPO = [
  ['Congreso Médico Regional', 'corporativo', 'congreso'], ['Convención Ventas TechCo', 'corporativo', 'negocio'],
  ['Feria Alimentaria', 'feria', 'negocio'], ['Boda Martín-Sanz', 'boda', 'social'], ['Boda Ortega', 'boda', 'social'],
  ['Torneo Pádel Amateur', 'deportivo', 'deportivo'], ['Equipo Fútbol Juvenil', 'deportivo', 'deportivo'],
  ['Viaje Incentivo Seguros', 'corporativo', 'negocio'], ['Circuito Cultural Senior', 'otros', 'turistico'],
];
const NOMBRES_EVENTO = ['Cena de Empresa', 'Presentación de Producto', 'Jornada Formativa', 'Cóctel Networking', 'Comunión Familiar'];

const nuevoNumeroReserva = () => DEMO_RESERVA_MIN + rnd(0, 999999);

export async function generarDatosDemo(supabase, hotelId, ayerStr) {
  const resumen = { reservas: 0, cancelaciones: 0, grupo: null, produccion: null };

  // No pisar producción ya existente (manual o de una ejecución anterior)
  const { data: yaExiste } = await supabase.from('produccion_diaria')
    .select('id').eq('hotel_id', hotelId).eq('fecha', ayerStr).maybeSingle();
  if (yaExiste) return { ...resumen, omitido: 'ya hay producción para ' + ayerStr };

  const { data: hotel } = await supabase.from('hoteles')
    .select('habitaciones,habitaciones_disponibles').eq('id', hotelId).maybeSingle();
  const cap = hotel?.habitaciones_disponibles || hotel?.habitaciones || 60;

  // OTB actual desde 2 semanas antes de ayer hasta 90 días vista (para no sobrevender)
  const desde = addDays(ayerStr, -14), hasta = addDays(ayerStr, 90);
  const [{ data: pickup }, { data: grupos }] = await Promise.all([
    supabase.from('pickup_entries')
      .select('id,fecha_llegada,fecha_pickup,fecha_salida,noches,precio_total,num_reservas,canal,estado,es_individual,numero_reserva')
      .eq('hotel_id', hotelId).gte('fecha_llegada', desde).lt('fecha_llegada', hasta),
    supabase.from('grupos_eventos')
      .select('estado,fecha_inicio,fecha_fin,habitaciones,adr_grupo,revenue_fnb,revenue_sala')
      .eq('hotel_id', hotelId).gte('fecha_fin', desde),
  ]);
  const pickupList = pickup || [];
  const gruposList = grupos || [];
  const habMap = buildHabEnCasaMap(pickupList, gruposList);
  const hayHueco = (llegada, noches, hab) => {
    for (let i = 0; i < noches; i++) if ((habMap[addDays(llegada, i)] || 0) + hab > cap * 0.95) return false;
    return true;
  };
  const reservar = (llegada, noches, hab) => {
    for (let i = 0; i < noches; i++) { const k = addDays(llegada, i); habMap[k] = (habMap[k] || 0) + hab; }
  };

  // ── 1. Reservas nuevas de ayer (llegadas futuras) ──
  const mes = parseInt(ayerStr.slice(5, 7)) - 1;
  const nReservas = Math.round(rnd(3, 8) * (0.7 + OCC_MES[mes] * 0.5));
  const filasPickup = [];
  for (let i = 0; i < nReservas; i++) {
    const lead = 1 + Math.floor(60 * Math.random() ** 2); // sesgado a corto plazo
    const llegada = addDays(ayerStr, lead);
    const noches = pickW([[1, 35], [2, 30], [3, 20], [4, 10], [5, 5]]);
    const hab = pickW([[1, 85], [2, 15]]);
    if (!hayHueco(llegada, noches, hab)) continue;
    reservar(llegada, noches, hab);
    let total = 0;
    for (let n = 0; n < noches; n++) total += adrEstimado(addDays(llegada, n));
    filasPickup.push({
      hotel_id: hotelId, fecha_pickup: ayerStr, fecha_llegada: llegada, fecha_salida: addDays(llegada, noches),
      noches, num_reservas: hab, precio_total: r2(total * hab), canal: pickW(CANALES),
      estado: 'confirmada', es_individual: true, numero_reserva: nuevoNumeroReserva(),
    });
  }

  // ── 1b. A veces se cancela una reserva ficticia futura ──
  if (Math.random() < 0.35) {
    const cancelables = pickupList.filter(e =>
      (e.numero_reserva || 0) >= DEMO_RESERVA_MIN && (e.estado || 'confirmada') === 'confirmada' && e.fecha_llegada > addDays(ayerStr, 1));
    if (cancelables.length) {
      const c = pick(cancelables);
      await supabase.from('pickup_entries').update({ estado: 'cancelada' }).eq('id', c.id);
      // Registro de la cancelación en el pickup de ayer (no cuenta OTB: estado cancelada)
      filasPickup.push({
        hotel_id: hotelId, fecha_pickup: ayerStr, fecha_llegada: c.fecha_llegada, fecha_salida: c.fecha_salida,
        noches: c.noches, num_reservas: c.num_reservas || 1, precio_total: c.precio_total, canal: c.canal,
        estado: 'cancelada', es_individual: true, numero_reserva: nuevoNumeroReserva(),
      });
      resumen.cancelaciones++;
    }
  }

  // ── 2. De vez en cuando, un grupo o un evento confirmado ──
  const filasGrupo = [];
  if (Math.random() < 0.12) {
    const [nombre, categoria, segmento] = pick(NOMBRES_GRUPO);
    const inicio = addDays(ayerStr, rnd(7, 45));
    const noches = pickW([[1, 30], [2, 45], [3, 25]]);
    let habitaciones = rnd(8, 25);
    while (habitaciones > 4 && !hayHueco(inicio, noches, habitaciones)) habitaciones -= 3;
    if (habitaciones > 4) {
      reservar(inicio, noches, habitaciones);
      filasGrupo.push({
        hotel_id: hotelId, nombre, categoria, segmento, estado: 'confirmado',
        fecha_inicio: inicio, fecha_fin: addDays(inicio, noches), fecha_confirmacion: ayerStr,
        habitaciones, adr_grupo: r2(adrEstimado(inicio) * 0.85),
        revenue_fnb: r2(habitaciones * noches * rndF(18, 35)),
        revenue_sala: Math.random() < 0.5 ? r2(rndF(300, 1200)) : 0,
        notas: '[demo] Grupo ficticio generado automáticamente',
      });
    }
  } else if (Math.random() < 0.06) {
    const fecha = addDays(ayerStr, rnd(5, 30));
    const sala = pick(['Sala Principal', 'Sala Jardín', 'Salón Azul']);
    filasGrupo.push({
      hotel_id: hotelId, nombre: pick(NOMBRES_EVENTO), categoria: 'evento', segmento: 'negocio', estado: 'confirmado',
      fecha_inicio: fecha, fecha_fin: fecha, fecha_confirmacion: ayerStr, habitaciones: 0, adr_grupo: 0,
      revenue_fnb: r2(rndF(800, 3500)), revenue_sala: r2(rndF(250, 900)),
      notas: `[ev:hi=19:00,hf=23:00,sala=${sala},serv=sí]\n[demo] Evento ficticio generado automáticamente`,
    });
  }

  // ── 3. Producción de ayer: OTB de esa noche + reservas de última hora hasta la ocupación objetivo ──
  const habOtb = Math.round(buildHabEnCasaMap(pickupList, gruposList)[ayerStr] || 0);
  const revOtb = buildRevEnCasaMap(pickupList, gruposList)[ayerStr] || 0;
  const objetivo = Math.min(cap, Math.round(cap * occObjetivo(ayerStr)));
  let hueco = Math.max(0, objetivo - habOtb);
  let revUltimaHora = 0;
  while (hueco > 0) {
    const hab = Math.min(hueco, rnd(1, Math.max(1, Math.ceil(hueco / 2))));
    const precio = r2(adrEstimado(ayerStr) * hab * rndF(0.95, 1.15)); // última hora, algo más cara
    revUltimaHora += precio;
    filasPickup.push({
      hotel_id: hotelId, fecha_pickup: ayerStr, fecha_llegada: ayerStr, fecha_salida: addDays(ayerStr, 1),
      noches: 1, num_reservas: hab, precio_total: precio, canal: pickW(CANALES),
      estado: 'confirmada', es_individual: true, numero_reserva: nuevoNumeroReserva(),
    });
    hueco -= hab;
  }

  const hab_ocupadas = Math.min(cap, Math.max(habOtb, objetivo));
  const revenue_hab = r2(revOtb + revUltimaHora);
  const revenue_fnb = r2(hab_ocupadas * rndF(3, 7));
  const revenue_salas = Math.random() < 0.1 ? r2(rndF(150, 600)) : null;
  const revenue_total = r2(revenue_hab + revenue_fnb + (revenue_salas || 0));
  const filaProd = {
    hotel_id: hotelId, fecha: ayerStr, hab_ocupadas, hab_disponibles: cap,
    revenue_hab, revenue_fnb, revenue_salas, revenue_total,
    adr: hab_ocupadas > 0 ? r2(revenue_hab / hab_ocupadas) : null,
    revpar: r2(revenue_hab / cap),
    trevpar: r2(revenue_total / cap),
  };

  // ── Escritura ──
  if (filasPickup.length) {
    const { error } = await supabase.from('pickup_entries').insert(filasPickup);
    if (error) throw new Error('demo pickup: ' + error.message);
  }
  if (filasGrupo.length) {
    const { error } = await supabase.from('grupos_eventos').insert(filasGrupo);
    if (error) throw new Error('demo grupos: ' + error.message);
  }
  const { error: prodErr } = await supabase.from('produccion_diaria').insert(filaProd);
  if (prodErr) throw new Error('demo producción: ' + prodErr.message);

  resumen.reservas = filasPickup.filter(f => f.estado === 'confirmada').length;
  resumen.grupo = filasGrupo[0]?.nombre || null;
  resumen.produccion = { hab_ocupadas, occ: Math.round(hab_ocupadas / cap * 100), adr: filaProd.adr, revenue_hab };
  return resumen;
}
