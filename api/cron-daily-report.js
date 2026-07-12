import { Resend } from 'resend';
import { createClient } from '@supabase/supabase-js';
import { buildHabEnCasaMap, calcForecastRevStandalone } from '../src/utils.js';
import { generarInformeDiarioPDF } from './_pdfInformeDiario.js';

const resend  = new Resend(process.env.RESEND_API_KEY);
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const NORM_CANAL_KEYS = ['directo', 'web', 'empresa', 'corporativo', 'grupo', 'mice', 'evento', 'tour', 'agencia', 'gds'];
const isOTACanal = (canal) => { const c = (canal || '').toLowerCase(); return !NORM_CANAL_KEYS.some(k => c.includes(k)); };
const normCanal = (canal) => {
  const c = (canal || '').toLowerCase().trim();
  if (c.includes('directo') || c.includes('teléfono') || c.includes('telefono') || c.includes('email')) return 'Directo';
  if (c.includes('web')) return 'Web';
  if (c.includes('empresa') || c.includes('corporativo')) return 'Empresa';
  if (c.includes('mice') || c.includes('evento')) return 'Eventos/MICE';
  if (c.includes('grupo')) return 'Grupos';
  return canal || 'Otro';
};
const mkGrupo = (g) => {
  const noches = Math.max(1, (new Date(g.fecha_fin + 'T00:00:00') - new Date(g.fecha_inicio + 'T00:00:00')) / 86400000);
  return {
    nombre: g.nombre, tipo: g.categoria || '', estado: g.estado, fecha_inicio: g.fecha_inicio, fecha_fin: g.fecha_fin,
    habitaciones: g.habitaciones || 0,
    revenue: Math.round((g.habitaciones || 0) * (g.adr_grupo || 0) * noches + (g.revenue_fnb || 0) + (g.revenue_sala || 0)),
  };
};

const pad2   = n => String(n).padStart(2, '0');
const fmt    = (n, dec = 1) => (n != null && !isNaN(n)) ? Number(n).toFixed(dec) : '—';
const fmtEur = (n) => (n != null && !isNaN(n)) ? `€${Math.round(n).toLocaleString('es-ES')}` : '—';
const fmtDate = (iso) => {
  if (!iso) return '—';
  const [y, m, d] = iso.split('-');
  const MESES = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
  return `${parseInt(d)} de ${MESES[parseInt(m) - 1]} de ${y}`;
};
const pctChg = (curr, prev) => { const c = Number(curr), p = Number(prev); if (curr == null || prev == null || p === 0) return null; return ((c - p) / Math.abs(p)) * 100; };
const ppChg  = (curr, prev) => (curr == null || prev == null) ? null : Number(curr) - Number(prev);
const absChg = (curr, prev) => (curr == null || prev == null) ? null : Number(curr) - Number(prev);

function badge(val, { isPP = false, isAbs = false, prefix = '' } = {}) {
  if (val == null) return '';
  const pos = val >= 0, color = pos ? '#059669' : '#DC2626';
  let label;
  if (isPP)       label = `${pos ? '+' : ''}${val.toFixed(1)} pp`;
  else if (isAbs) { const a = Math.abs(val); label = `${pos ? '+' : '-'}${prefix}${a < 100 ? a.toFixed(1) : Math.round(a).toLocaleString('es-ES')}`; }
  else            label = `${pos ? '+' : ''}${val.toFixed(1)}%`;
  return `<p style="margin:4px 0 0;font-size:12px;color:${color};font-weight:700;line-height:1;">${label}</p>`;
}

function buildProgressBar(revenueAcumulado, presupuestoMensual) {
  if (!revenueAcumulado?.length) return '';
  const acum    = revenueAcumulado[revenueAcumulado.length - 1]?.acum || 0;
  const lastDay = revenueAcumulado[revenueAcumulado.length - 1]?.dia  || 1;
  if (!presupuestoMensual) {
    return `<p style="margin:0;font-size:13px;color:#64748B;">Revenue acumulado día ${lastDay}: <strong style="color:#0A2540;">${fmtEur(acum)}</strong></p>`;
  }
  const pct      = Math.min(Math.round((acum / presupuestoMensual) * 100), 100);
  const restante = Math.max(0, presupuestoMensual - acum);
  const color    = pct >= 100 ? '#059669' : pct >= 75 ? '#C49A0A' : '#DC2626';
  return `<table width="100%" cellpadding="0" cellspacing="0">
  <tr><td style="padding:4px 0 8px;">
    <table width="100%" cellpadding="0" cellspacing="0"><tr>
      <td><p style="margin:0 0 2px;font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#64748B;">Acumulado día ${lastDay}</p><p style="margin:0;font-size:20px;font-weight:700;color:#0A2540;">${fmtEur(acum)}</p></td>
      <td style="text-align:center;"><p style="margin:0 0 2px;font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#64748B;">Cumplimiento</p><p style="margin:0;font-size:20px;font-weight:700;color:${color};">${pct}%</p></td>
      <td style="text-align:right;"><p style="margin:0 0 2px;font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#64748B;">Presupuesto</p><p style="margin:0;font-size:20px;font-weight:700;color:#0A2540;">${fmtEur(presupuestoMensual)}</p></td>
    </tr></table>
  </td></tr>
  <tr><td style="padding:6px 0 4px;">
    <table width="100%" cellpadding="0" cellspacing="0" style="border-radius:6px;overflow:hidden;background:#E2E8F0;"><tr>
      <td style="width:${pct}%;background:${color};height:12px;"></td>
      <td style="background:#E2E8F0;height:12px;"></td>
    </tr></table>
  </td></tr>
  ${restante > 0
    ? `<tr><td><p style="margin:0;font-size:11px;color:#94A3B8;">Faltan <strong style="color:#0A2540;">${fmtEur(restante)}</strong> para cerrar el mes en objetivo</p></td></tr>`
    : `<tr><td><p style="margin:0;font-size:11px;color:#059669;font-weight:700;">✓ Presupuesto superado</p></td></tr>`}
</table>`;
}

function buildAlerts(kpis) {
  const { occ, pickup_neto, revenue_pickup_ayer, presupuestoMensual, revenueAcumulado, cancelaciones } = kpis;
  const alerts = [];
  if (occ >= 88) alerts.push(`<strong>Alta presión de demanda (${fmt(occ)}% ocupación)</strong> — Considera optimizar tarifas para maximizar ADR.`);
  if (pickup_neto >= 12) {
    const rev = revenue_pickup_ayer ? ` / +€${Math.round(revenue_pickup_ayer).toLocaleString('es-ES')}` : '';
    alerts.push(`<strong>Excelente pickup ayer (+${pickup_neto} hab.${rev})</strong> — Demanda activa, revisa disponibilidad y tarifas.`);
  }
  if (cancelaciones >= 5) alerts.push(`<strong>Cancelaciones elevadas ayer (${cancelaciones})</strong> — Revisa política de cancelación.`);
  if (presupuestoMensual && revenueAcumulado?.length) {
    const acum    = revenueAcumulado[revenueAcumulado.length - 1]?.acum || 0;
    const lastDay = revenueAcumulado[revenueAcumulado.length - 1]?.dia  || 1;
    const pctReal = (acum / presupuestoMensual) * 100;
    const pctPace = (lastDay / 30) * 100;
    if (pctReal < pctPace - 15) alerts.push(`<strong>Ritmo por debajo del objetivo (${Math.round(pctReal)}% del presupuesto)</strong> — Revisa pricing y distribución.`);
    else if (pctReal >= 95)     alerts.push(`<strong>¡Excelente ritmo! (${Math.round(pctReal)}% del presupuesto alcanzado)</strong> — Mantén la estrategia.`);
  }
  return alerts;
}

function buildHtml(hotel, kpis) {
  const {
    fecha, mesNombre,
    occ, adr, revpar, trevpar,
    hab_ocupadas, hab_disponibles,
    pickup_neto, cancelaciones, revenue_pickup_ayer,
    revenueAcumulado, presupuestoMensual,
    ly_occ, ly_adr, ly_revpar, ly_trevpar,
  } = kpis;

  const progressBar = buildProgressBar(revenueAcumulado, presupuestoMensual);
  const alerts      = buildAlerts(kpis);
  const pickupRev   = revenue_pickup_ayer ? `+€${Math.round(revenue_pickup_ayer).toLocaleString('es-ES')}` : '';
  const pickupCanc  = cancelaciones ? `(${cancelaciones} cancelación${cancelaciones !== 1 ? 'es' : ''})` : '';

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <title>Informe diario — ${hotel}</title>
</head>
<body style="margin:0;padding:0;background:#EEF2F7;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#EEF2F7;padding:20px 0;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
  <tr><td style="background:#0A2540;border-radius:10px 10px 0 0;padding:22px 28px 18px;text-align:center;">
    <p style="margin:0 0 4px;font-size:11px;font-weight:600;color:rgba(255,255,255,0.45);letter-spacing:2px;text-transform:uppercase;">FastRevenue · Informe Diario</p>
    <p style="margin:0 0 6px;font-size:22px;font-weight:700;color:#FFFFFF;letter-spacing:0.5px;">${hotel}</p>
    <p style="margin:0;font-size:12px;color:rgba(255,255,255,0.55);">${fmtDate(fecha)}</p>
    <div style="height:2px;background:linear-gradient(90deg,transparent,#D4A017,transparent);margin-top:16px;"></div>
  </td></tr>
  <tr><td style="background:#FFFFFF;border:1px solid #E2E8F0;border-top:none;padding:0;">
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr><td colspan="5" style="padding:12px 16px 8px;border-bottom:1px solid #F1F5F9;">
        <p style="margin:0;font-size:12px;font-weight:700;color:#0A2540;text-transform:uppercase;letter-spacing:0.8px;">Resumen de Ayer <span style="font-size:11px;font-weight:400;color:#94A3B8;text-transform:none;letter-spacing:0;">(vs. Año Anterior)</span></p>
      </td></tr>
      <tr>
        <td style="padding:14px 8px 12px;text-align:center;vertical-align:top;width:20%;">
          <p style="margin:0 0 5px;font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:1.2px;color:#64748B;">Ocupación</p>
          <p style="margin:0;font-size:26px;font-weight:700;color:#0A2540;line-height:1;">${fmt(occ)}%</p>
          ${badge(ppChg(occ, ly_occ), { isPP: true })}
          ${hab_ocupadas != null ? `<p style="margin:5px 0 0;font-size:10px;color:#94A3B8;">${hab_ocupadas}/${hab_disponibles} hab.</p>` : ''}
        </td>
        <td style="padding:14px 8px 12px;text-align:center;vertical-align:top;width:20%;border-left:1px solid #E2E8F0;">
          <p style="margin:0 0 5px;font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:1.2px;color:#64748B;">ADR</p>
          <p style="margin:0;font-size:26px;font-weight:700;color:#0A2540;line-height:1;">${fmtEur(adr)}</p>
          ${badge(absChg(adr, ly_adr), { isAbs: true, prefix: '€' })}
        </td>
        <td style="padding:14px 8px 12px;text-align:center;vertical-align:top;width:20%;border-left:1px solid #E2E8F0;">
          <p style="margin:0 0 5px;font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:1.2px;color:#64748B;">RevPAR</p>
          <p style="margin:0;font-size:26px;font-weight:700;color:#0A2540;line-height:1;">${fmtEur(revpar)}</p>
          ${badge(pctChg(revpar, ly_revpar))}
        </td>
        <td style="padding:14px 8px 12px;text-align:center;vertical-align:top;width:20%;border-left:1px solid #E2E8F0;">
          <p style="margin:0 0 5px;font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:1.2px;color:#64748B;">TRevPAR</p>
          <p style="margin:0;font-size:26px;font-weight:700;color:#0A2540;line-height:1;">${trevpar ? fmtEur(trevpar) : '—'}</p>
          ${trevpar ? badge(pctChg(trevpar, ly_trevpar)) : ''}
        </td>
        <td style="padding:14px 8px 12px;text-align:center;vertical-align:top;width:20%;border-left:1px solid #E2E8F0;">
          <p style="margin:0 0 5px;font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:1.2px;color:#64748B;">Pickup Neto</p>
          <p style="margin:0;font-size:20px;font-weight:700;color:#0A2540;line-height:1.1;">${pickup_neto != null ? `+${pickup_neto} hab.` : '—'}</p>
          ${pickupRev  ? `<p style="margin:4px 0 0;font-size:12px;color:#059669;font-weight:700;">${pickupRev}</p>` : ''}
          ${pickupCanc ? `<p style="margin:5px 0 0;font-size:10px;color:#94A3B8;">${pickupCanc}</p>` : ''}
        </td>
      </tr>
    </table>
  </td></tr>
  <tr><td style="height:8px;background:#EEF2F7;"></td></tr>
  <tr><td style="background:#FFFFFF;border:1px solid #E2E8F0;padding:0;">
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr><td style="padding:12px 16px 8px;border-bottom:1px solid #F1F5F9;">
        <p style="margin:0;font-size:12px;font-weight:700;color:#0A2540;text-transform:uppercase;letter-spacing:0.8px;">Progreso Mensual${mesNombre ? ` <span style="color:#94A3B8;font-weight:400;text-transform:none;">(${mesNombre})</span>` : ''}</p>
      </td></tr>
      <tr><td style="padding:12px 16px 14px;">${progressBar || '<p style="margin:0;font-size:12px;color:#94A3B8;">Sin datos de progreso mensual</p>'}</td></tr>
    </table>
  </td></tr>
  ${alerts.length > 0 ? `
  <tr><td style="height:8px;background:#EEF2F7;"></td></tr>
  <tr><td style="background:#FFFFFF;border:1px solid #E2E8F0;padding:0;">
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr><td style="padding:12px 16px 8px;border-bottom:1px solid #F1F5F9;"><p style="margin:0;font-size:12px;font-weight:700;color:#0A2540;text-transform:uppercase;letter-spacing:0.8px;">Alertas del Sistema</p></td></tr>
      ${alerts.map(a => `<tr><td style="padding:9px 16px;"><p style="margin:0;font-size:12px;color:#374151;line-height:1.6;">${a}</p></td></tr>`).join('')}
      <tr><td style="height:6px;"></td></tr>
    </table>
  </td></tr>` : ''}
  <tr><td style="height:8px;background:#EEF2F7;"></td></tr>
  <tr><td style="background:#0A2540;border-radius:0 0 10px 10px;padding:12px 28px;">
    <table width="100%" cellpadding="0" cellspacing="0"><tr>
      <td><p style="margin:0;font-size:10px;color:rgba(255,255,255,0.4);">FastRevenue — Tu Partner de Inteligencia Hotelera</p></td>
      <td align="right"><a href="https://fastrevenue.app/home" style="font-size:10px;color:#D4A017;text-decoration:none;font-weight:600;">Abrir dashboard &#8594;</a></td>
    </tr></table>
  </td></tr>
  <tr><td align="center" style="padding:14px 0 0;">
    <p style="margin:0;font-size:10px;color:#94A3B8;">
      <a href="mailto:info@fastrevenue.app" style="color:#94A3B8;text-decoration:none;">info@fastrevenue.app</a>
      &nbsp;&#183;&nbsp;
      <a href="https://fastrevenue.app/privacidad" style="color:#94A3B8;text-decoration:none;">Privacidad</a>
    </p>
  </td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;
}

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();

  // Vercel envía automáticamente Authorization: Bearer {CRON_SECRET} al invocar el cron
  // (no existe un header "x-vercel-cron" fiable para autenticar — ver docs de Vercel)
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || req.headers['authorization'] !== `Bearer ${cronSecret}`) {
    return res.status(401).json({ error: 'No autorizado' });
  }

  // Compute yesterday in UTC (cron fires at 07:30 UTC = 09:30 CEST, so UTC date = local date - 1)
  const now = new Date();
  const ayer = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - 1));
  const ayerStr = `${ayer.getUTCFullYear()}-${pad2(ayer.getUTCMonth()+1)}-${pad2(ayer.getUTCDate())}`;

  const mesActual   = ayer.getUTCMonth() + 1;
  const anioActual  = ayer.getUTCFullYear();
  const mesStr      = pad2(mesActual);
  const inicioMes   = `${anioActual}-${mesStr}-01`;
  const inicioSig   = mesActual === 12 ? `${anioActual+1}-01-01` : `${anioActual}-${pad2(mesActual+1)}-01`;
  const inicioMesLY = `${anioActual-1}-${mesStr}-01`;
  const inicioSigLY = mesActual === 12 ? `${anioActual}-01-01` : `${anioActual-1}-${pad2(mesActual+1)}-01`;

  const mesLM  = mesActual === 1 ? 12 : mesActual - 1;
  const anioLM = mesActual === 1 ? anioActual - 1 : anioActual;
  const inicioMesLM = `${anioLM}-${pad2(mesLM)}-01`;

  // Ventana amplia de pickup: cubre los 3 meses previos (tasa de cancelación + forecast)
  // y los próximos 7 días desde ayer (pace / grupos en casa)
  const ref3m = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 3, 1));
  const inicioPickupAmplio = `${ref3m.getUTCFullYear()}-${pad2(ref3m.getUTCMonth()+1)}-01`;
  const en7 = new Date(Date.UTC(ayer.getUTCFullYear(), ayer.getUTCMonth(), ayer.getUTCDate() + 7));
  const en7Str = `${en7.getUTCFullYear()}-${pad2(en7.getUTCMonth()+1)}-${pad2(en7.getUTCDate())}`;
  // Cota superior (exclusiva) de la consulta de pickup: cubre TODO el mes en curso (para el forecast de
  // cierre, que necesita el OTB del mes completo) y, si se extiende más allá, los próximos 7 días de pace.
  const finPickupAmplio8 = new Date(Date.UTC(ayer.getUTCFullYear(), ayer.getUTCMonth(), ayer.getUTCDate() + 8));
  const finPickupAmplio8Str = `${finPickupAmplio8.getUTCFullYear()}-${pad2(finPickupAmplio8.getUTCMonth()+1)}-${pad2(finPickupAmplio8.getUTCDate())}`;
  const finPickupAmplioStr = inicioSig > finPickupAmplio8Str ? inicioSig : finPickupAmplio8Str;

  const PICKUP_FIELDS = 'fecha_llegada,fecha_pickup,fecha_salida,noches,precio_total,num_reservas,canal,estado,es_individual';

  const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

  const { data: suscripciones, error: subErr } = await supabase
    .from('suscripciones')
    .select('user_id')
    .in('estado', ['activa', 'trial', 'cancelando']);

  if (subErr) return res.status(500).json({ error: 'DB: ' + subErr.message });
  if (!suscripciones?.length) return res.status(200).json({ ok: true, sent: 0, skipped: 0 });

  const results = { sent: 0, skipped: 0, errors: [] };

  for (const sub of suscripciones) {
    const userId = sub.user_id;
    try {
      const { data: { user: authUser } } = await supabase.auth.admin.getUserById(userId);
      if (!authUser?.email) { results.skipped++; continue; }
      const email = authUser.email;

      const { data: hotelRow } = await supabase.from('hoteles').select('nombre,habitaciones').eq('id', userId).maybeSingle();
      const hotelNombre = hotelRow?.nombre || 'Tu Hotel';

      const [
        { data: ayerData },
        { data: datosMes },
        { data: datosMesLY },
        { data: datosLM },
        { data: pickupAyer },
        { data: pptoRow },
        { data: gruposRows },
        { data: pickupAmplio },
        { data: pickupLY },
      ] = await Promise.all([
        supabase.from('produccion_diaria').select('*').eq('hotel_id', userId).eq('fecha', ayerStr).maybeSingle(),
        supabase.from('produccion_diaria').select('fecha,hab_ocupadas,hab_disponibles,revenue_hab,revenue_fnb,revenue_total').eq('hotel_id', userId).gte('fecha', inicioMes).lt('fecha', inicioSig).order('fecha', { ascending: true }),
        supabase.from('produccion_diaria').select('fecha,hab_ocupadas,hab_disponibles,revenue_hab,revenue_total').eq('hotel_id', userId).gte('fecha', inicioMesLY).lt('fecha', inicioSigLY),
        supabase.from('produccion_diaria').select('hab_ocupadas,hab_disponibles,revenue_hab,revenue_fnb,revenue_total').eq('hotel_id', userId).gte('fecha', inicioMesLM).lt('fecha', inicioMes),
        supabase.from('pickup_entries').select('num_reservas,precio_total,estado,canal').eq('hotel_id', userId).eq('fecha_pickup', ayerStr),
        supabase.from('presupuesto').select('rev_total_ppto,adr_ppto,occ_ppto').eq('hotel_id', userId).eq('anio', anioActual).eq('mes', mesActual).maybeSingle(),
        supabase.from('grupos_eventos').select('nombre,categoria,estado,fecha_inicio,fecha_fin,habitaciones,adr_grupo,revenue_fnb,revenue_sala').eq('hotel_id', userId).neq('estado', 'cancelado').gte('fecha_fin', ayerStr).order('fecha_inicio'),
        supabase.from('pickup_entries').select(PICKUP_FIELDS).eq('hotel_id', userId).gte('fecha_llegada', inicioPickupAmplio).lt('fecha_llegada', finPickupAmplioStr),
        supabase.from('pickup_entries').select(PICKUP_FIELDS).eq('hotel_id', userId).gte('fecha_llegada', inicioMesLY).lt('fecha_llegada', inicioSigLY),
      ]);

      if (!ayerData) { results.skipped++; continue; }

      let nuevasAyer = 0, cancelAyer = 0, revPickupAyer = 0;
      for (const p of (pickupAyer || [])) {
        const nr = p.num_reservas || 1;
        if (p.estado === 'cancelada') cancelAyer += nr;
        else { nuevasAyer += nr; revPickupAyer += p.precio_total || nr * (ayerData.adr || 0); }
      }

      let acum = 0;
      const revenueAcumulado = (datosMes || []).map(d => {
        acum += d.revenue_hab || 0;
        return { dia: parseInt(d.fecha.split('-')[2]), acum: Math.round(acum) };
      });

      const lyFecha  = `${anioActual-1}-${ayerStr.slice(5)}`;
      const lyDia    = (datosMesLY || []).find(d => d.fecha === lyFecha);
      const lyOcc    = lyDia?.hab_disponibles > 0 ? lyDia.hab_ocupadas / lyDia.hab_disponibles * 100 : null;
      const lyAdr    = lyDia?.hab_ocupadas > 0 && lyDia?.revenue_hab ? lyDia.revenue_hab / lyDia.hab_ocupadas : null;
      const lyRevpar = lyDia?.hab_disponibles > 0 && lyDia?.revenue_hab ? lyDia.revenue_hab / lyDia.hab_disponibles : null;
      const lyTrevpar= lyDia?.hab_disponibles > 0 && lyDia?.revenue_total ? lyDia.revenue_total / lyDia.hab_disponibles : null;

      const occ    = ayerData.hab_disponibles > 0 ? ayerData.hab_ocupadas / ayerData.hab_disponibles * 100 : null;
      const adr    = ayerData.adr    ?? (ayerData.hab_ocupadas > 0 && ayerData.revenue_hab ? ayerData.revenue_hab / ayerData.hab_ocupadas : null);
      const revpar = ayerData.revpar ?? (ayerData.hab_disponibles > 0 && ayerData.revenue_hab ? ayerData.revenue_hab / ayerData.hab_disponibles : null);
      const trevpar= ayerData.trevpar?? (ayerData.hab_disponibles > 0 && ayerData.revenue_total ? ayerData.revenue_total / ayerData.hab_disponibles : null);

      // ── Medias del mes actual y del mes anterior (para el PDF) ──
      let totHabOcu = 0, totHabDisp = 0, totRevHab = 0, totRevFnb = 0, totRevTotal = 0;
      for (const d of (datosMes || [])) {
        if (d.hab_disponibles > 0) { totHabOcu += d.hab_ocupadas || 0; totHabDisp += d.hab_disponibles || 0; totRevHab += d.revenue_hab || 0; totRevFnb += d.revenue_fnb || 0; totRevTotal += d.revenue_total || 0; }
      }
      const totRevTotalEff = totRevTotal || (totRevHab + totRevFnb) || 0;
      const avg_occ    = totHabDisp > 0 ? totHabOcu / totHabDisp * 100 : null;
      const avg_adr    = totHabOcu > 0 ? totRevHab / totHabOcu : null;
      const avg_revpar = totHabDisp > 0 ? totRevHab / totHabDisp : null;
      const avg_trevpar= totHabDisp > 0 && totRevTotalEff > 0 ? totRevTotalEff / totHabDisp : null;

      let lmHabOcu = 0, lmHabDisp = 0, lmRevHab = 0, lmRevFnb = 0, lmRevTotal = 0;
      for (const d of (datosLM || [])) {
        if (d.hab_disponibles > 0) { lmHabOcu += d.hab_ocupadas || 0; lmHabDisp += d.hab_disponibles || 0; lmRevHab += d.revenue_hab || 0; lmRevFnb += d.revenue_fnb || 0; lmRevTotal += d.revenue_total || 0; }
      }
      const lmRevTotalEff = lmRevTotal || (lmRevHab + lmRevFnb) || 0;
      const lm_avg_occ    = lmHabDisp > 0 ? lmHabOcu / lmHabDisp * 100 : null;
      const lm_avg_adr    = lmHabOcu > 0 ? lmRevHab / lmHabOcu : null;
      const lm_avg_revpar = lmHabDisp > 0 ? lmRevHab / lmHabDisp : null;
      const lm_avg_trevpar= lmHabDisp > 0 && lmRevTotalEff > 0 ? lmRevTotalEff / lmHabDisp : null;

      // ── Mix de canales de ayer ──
      const canalMap = {}, canalPickupMap = {}, canalRevMixMap = {};
      let totCanalRev = 0;
      for (const p of (pickupAyer || [])) {
        if ((p.estado || '') === 'cancelada') continue;
        const peso = p.precio_total || (p.num_reservas || 1);
        const key = isOTACanal(p.canal) ? 'OTA' : normCanal(p.canal);
        canalMap[key] = (canalMap[key] || 0) + peso; totCanalRev += peso;
        const keyN = normCanal(p.canal);
        canalPickupMap[keyN] = (canalPickupMap[keyN] || 0) + (p.num_reservas || 1);
        canalRevMixMap[keyN] = (canalRevMixMap[keyN] || 0) + (p.precio_total || 0);
      }
      const canalesRevenue = Object.entries(canalMap).filter(([,v])=>v>0).sort((a,b)=>b[1]-a[1]).map(([canal,revenue])=>({ canal, revenue: Math.round(revenue), pct: totCanalRev>0?Math.round(revenue/totCanalRev*100):0 }));
      const canalesPickup  = Object.entries(canalPickupMap).filter(([,v])=>v>0).sort((a,b)=>b[1]-a[1]).map(([canal,reservas])=>({ canal, reservas }));
      const canalesRevMix  = Object.entries(canalRevMixMap).filter(([,v])=>v>0).sort((a,b)=>b[1]-a[1]).map(([canal,revenue])=>({ canal, revenue: Math.round(revenue) }));

      // ── Grupos & eventos ──
      const gruposAyer = (gruposRows || []).filter(g => g.estado === 'confirmado' && g.fecha_inicio <= ayerStr && g.fecha_fin > ayerStr);
      const revGruposAyer = gruposAyer.reduce((s,g) => s + (g.habitaciones||0)*(g.adr_grupo||0), 0);
      const gruposProximos = (gruposRows || []).filter(g => g.estado === 'confirmado' && g.fecha_inicio > ayerStr && g.fecha_inicio <= en7Str).map(mkGrupo);
      const proximoConfirmado = (() => {
        const g = (gruposRows || []).filter(g => g.estado === 'confirmado' && g.fecha_inicio > ayerStr).sort((a,b) => a.fecha_inicio.localeCompare(b.fecha_inicio))[0];
        return g ? mkGrupo(g) : null;
      })();

      // ── Forecast de cierre de mes y pace próximos 7 días ──
      const forecastMes = calcForecastRevStandalone(mesActual - 1, anioActual, [...(datosMes||[]), ...(datosMesLY||[])], [...(pickupAmplio||[]), ...(pickupLY||[])], null);
      const habMap  = buildHabEnCasaMap(pickupAmplio, gruposRows);
      const habDisp = hotelRow?.habitaciones || ayerData.hab_disponibles || 1;
      const paceProximos7 = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(Date.UTC(ayer.getUTCFullYear(), ayer.getUTCMonth(), ayer.getUTCDate() + i + 1));
        const iso = `${d.getUTCFullYear()}-${pad2(d.getUTCMonth()+1)}-${pad2(d.getUTCDate())}`;
        const hab = habMap[iso] || 0;
        return { fecha: iso, hab_reservadas: hab, occ_pct: Math.round(hab / habDisp * 100) };
      });

      const kpis = {
        fecha: ayerStr,
        mesNombre: MESES[mesActual - 1],
        occ, adr, revpar, trevpar,
        hab_ocupadas: ayerData.hab_ocupadas,
        hab_disponibles: ayerData.hab_disponibles,
        revenue_hab: ayerData.revenue_hab,
        revenue_total: ayerData.revenue_total,
        pickup_neto: nuevasAyer,
        cancelaciones: cancelAyer,
        revenue_pickup_ayer: revPickupAyer || null,
        revenueAcumulado,
        presupuestoMensual: pptoRow?.rev_total_ppto ?? null,
        ly_occ: lyOcc, ly_adr: lyAdr, ly_revpar: lyRevpar, ly_trevpar: lyTrevpar,
        avg_occ, avg_adr, avg_revpar, avg_trevpar,
        lm_avg_occ, lm_avg_adr, lm_avg_revpar, lm_avg_trevpar,
        revHabAyer: ayerData.revenue_hab || 0, revFnbAyer: ayerData.revenue_fnb || 0,
        canalesRevenue, canalesPickup, canalesRevMix,
        revGruposAyer: Math.round(revGruposAyer),
        revIndividualAyer: Math.round(Math.max(0, (ayerData.revenue_hab||0) - revGruposAyer)),
        adrPpto: pptoRow?.adr_ppto ?? null, occPpto: pptoRow?.occ_ppto ?? null,
        gruposProximos, proximoConfirmado, forecastMes, paceProximos7,
      };

      let pdfBase64 = null;
      try { pdfBase64 = generarInformeDiarioPDF(kpis, hotelNombre); }
      catch (pdfErr) { results.errors.push({ userId, error: 'PDF: ' + pdfErr.message }); }

      const attachments = pdfBase64
        ? [{ filename: `Informe_diario_${ayerStr}.pdf`, content: Buffer.from(pdfBase64, 'base64') }]
        : [];

      const { error: sendErr } = await resend.emails.send({
        from: 'FastRevenue <info@fastrevenue.app>',
        to: email,
        subject: `Informe ${fmtDate(ayerStr)} — ${hotelNombre}`,
        html: buildHtml(hotelNombre, kpis),
        attachments,
        headers: {
          'X-Entity-Ref-ID': `cron-daily-${userId}-${ayerStr}`,
          'List-Unsubscribe': '<mailto:info@fastrevenue.app?subject=unsubscribe>',
          'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
        },
      });

      if (sendErr) results.errors.push({ userId, error: sendErr.message });
      else results.sent++;

    } catch (e) {
      results.errors.push({ userId, error: e.message });
    }
  }

  res.status(200).json({ ok: true, date: ayerStr, ...results });
}
