export const config = { api: { bodyParser: { sizeLimit: '64kb' } } };

import { Resend } from 'resend';
import { validateEmail, cleanString, escapeHtml } from './_validate.js';

const resend = new Resend(process.env.RESEND_API_KEY);

function jwtEmail(token) {
  try {
    const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString('utf8'));
    return payload.email ?? null;
  } catch { return null; }
}

const fmt    = (n, dec = 1) => (n != null && !isNaN(n)) ? Number(n).toFixed(dec) : '—';
const fmtEur = (n) => (n != null && !isNaN(n)) ? `€${Math.round(n).toLocaleString('es-ES')}` : '—';
const fmtDate = (iso) => {
  if (!iso) return '—';
  const [y, m, d] = iso.split('-');
  const MESES = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
  return `${parseInt(d)} de ${MESES[parseInt(m) - 1]} de ${y}`;
};

const pctChg = (curr, prev) => {
  const c = Number(curr), p = Number(prev);
  if (curr == null || prev == null || p === 0) return null;
  return ((c - p) / Math.abs(p)) * 100;
};
const ppChg  = (curr, prev) => (curr == null || prev == null) ? null : Number(curr) - Number(prev);
const absChg = (curr, prev) => (curr == null || prev == null) ? null : Number(curr) - Number(prev);

function badge(val, { isPP = false, isAbs = false, prefix = '' } = {}) {
  if (val == null) return '';
  const pos   = val >= 0;
  const color = pos ? '#059669' : '#DC2626';
  let label;
  if (isPP)        label = `${pos ? '+' : ''}${val.toFixed(1)} pp`;
  else if (isAbs) { const a = Math.abs(val); label = `${pos ? '+' : '-'}${prefix}${a < 100 ? a.toFixed(1) : Math.round(a).toLocaleString('es-ES')}`; }
  else             label = `${pos ? '+' : ''}${val.toFixed(1)}%`;
  return `<p style="margin:4px 0 0;font-size:12px;color:${color};font-weight:700;line-height:1;">${label}</p>`;
}

function buildDonutChart(segments, size = 110) {
  const total = segments.reduce((s, x) => s + x.value, 0);
  if (!total) return '';
  const r = 35, cx = size / 2, cy = size / 2;
  const C = 2 * Math.PI * r;
  let acc = 0;
  const circles = segments.map(seg => {
    const pct = seg.value / total;
    const dash = pct * C;
    const off  = C / 4 - acc * C;
    acc += pct;
    return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${seg.color}" stroke-width="20" stroke-dasharray="${dash.toFixed(2)} ${(C - dash).toFixed(2)}" stroke-dashoffset="${off.toFixed(2)}"/>`;
  });
  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" style="display:block;"><g>${circles.join('')}</g><circle cx="${cx}" cy="${cy}" r="22" fill="white"/></svg>`;
}

function buildRevenueCharts(revHabMes, revFnbMes, canalesRevenue) {
  const CANAL_COLORS = {
    'Directo / Web': '#0A2540', 'Directo': '#0A2540',
    'OTAs': '#D4A017',
    'Empresa / Corporativo': '#059669', 'Empresa': '#059669',
    'Teléfono / Email': '#2563EB', 'Teléfono': '#2563EB',
    'Grupos / MICE': '#7C3AED', 'Grupos': '#7C3AED',
  };
  const totalHabFnb = (revHabMes || 0) + (revFnbMes || 0);
  const habPct = totalHabFnb > 0 ? Math.round((revHabMes || 0) / totalHabFnb * 100) : 0;
  const fnbPct = 100 - habPct;

  const habSvg = totalHabFnb > 0 ? buildDonutChart([
    { value: revHabMes || 0, color: '#0A2540' },
    { value: revFnbMes || 0, color: '#D4A017' },
  ]) : '';

  const dot = (color) => `<td style="width:8px;height:8px;background:${color};border-radius:2px;font-size:0;" bgcolor="${color}">&nbsp;</td><td style="width:6px;"></td>`;
  const habLegend = `
    <tr><td style="padding:4px 0;"><table cellpadding="0" cellspacing="0"><tr>
      ${dot('#0A2540')}
      <td style="font-family:Arial,sans-serif;font-size:11px;color:#374151;">Habitaciones</td>
      <td style="width:6px;"></td>
      <td style="font-family:Arial,sans-serif;font-size:11px;font-weight:700;color:#0A2540;">${habPct}%</td>
    </tr></table></td></tr>
    <tr><td style="padding:4px 0;"><table cellpadding="0" cellspacing="0"><tr>
      ${dot('#D4A017')}
      <td style="font-family:Arial,sans-serif;font-size:11px;color:#374151;">F&amp;B</td>
      <td style="width:6px;"></td>
      <td style="font-family:Arial,sans-serif;font-size:11px;font-weight:700;color:#0A2540;">${fnbPct}%</td>
    </tr></table></td></tr>`;

  const canales = canalesRevenue || [];
  const totalCanal = canales.reduce((s, c) => s + c.revenue, 0);
  const canalSegs = canales.map(c => ({ value: c.revenue, color: CANAL_COLORS[c.canal] || '#94A3B8', label: c.canal }));
  const canalSvg = canalSegs.length ? buildDonutChart(canalSegs) : '';
  const canalLegend = canalSegs.map(c => {
    const p = totalCanal > 0 ? Math.round(c.value / totalCanal * 100) : 0;
    return `<tr><td style="padding:3px 0;"><table cellpadding="0" cellspacing="0"><tr>
      ${dot(c.color)}
      <td style="font-family:Arial,sans-serif;font-size:10px;color:#374151;white-space:nowrap;">${escapeHtmlStr(c.label)}</td>
      <td style="width:6px;"></td>
      <td style="font-family:Arial,sans-serif;font-size:10px;font-weight:700;color:#0A2540;">${p}%</td>
    </tr></table></td></tr>`;
  }).join('');

  if (!totalHabFnb && !canalSegs.length) return '';

  return `
  <!-- gap -->
  <tr><td style="height:8px;background:#EEF2F7;"></td></tr>

  <!-- GRÁFICOS REVENUE -->
  <tr><td style="background:#FFFFFF;border:1px solid #E2E8F0;padding:0;">
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr><td colspan="3" style="padding:12px 16px 8px;border-bottom:1px solid #F1F5F9;">
        <p style="margin:0;font-size:12px;font-weight:700;color:#0A2540;text-transform:uppercase;letter-spacing:0.8px;">Mix de Revenue — Mes Actual</p>
      </td></tr>
      <tr>
        <td width="46%" style="padding:14px 12px 14px 16px;vertical-align:top;">
          <p style="margin:0 0 10px;font-size:9px;font-weight:700;color:#64748B;text-transform:uppercase;letter-spacing:1px;">Hab. vs F&amp;B</p>
          ${habSvg ? `<table cellpadding="0" cellspacing="0"><tr>
            <td style="padding-right:10px;vertical-align:middle;">${habSvg}</td>
            <td style="vertical-align:middle;"><table cellpadding="0" cellspacing="0">${habLegend}</table></td>
          </tr></table>` : '<p style="margin:0;font-size:12px;color:#94A3B8;">Sin datos</p>'}
        </td>
        <td style="width:1px;background:#E2E8F0;padding:0;"></td>
        <td width="46%" style="padding:14px 16px 14px 12px;vertical-align:top;">
          <p style="margin:0 0 10px;font-size:9px;font-weight:700;color:#64748B;text-transform:uppercase;letter-spacing:1px;">Procedencia</p>
          ${canalSvg ? `<table cellpadding="0" cellspacing="0"><tr>
            <td style="padding-right:10px;vertical-align:middle;">${canalSvg}</td>
            <td style="vertical-align:middle;"><table cellpadding="0" cellspacing="0">${canalLegend}</table></td>
          </tr></table>` : '<p style="margin:0;font-size:12px;color:#94A3B8;">Sin datos de canal</p>'}
        </td>
      </tr>
    </table>
  </td></tr>`;
}

function escapeHtmlStr(s) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
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
  <tr>
    <td style="padding:4px 0 8px;">
      <table width="100%" cellpadding="0" cellspacing="0"><tr>
        <td><p style="margin:0 0 2px;font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#64748B;">Acumulado día ${lastDay}</p><p style="margin:0;font-size:20px;font-weight:700;color:#0A2540;">${fmtEur(acum)}</p></td>
        <td style="text-align:center;"><p style="margin:0 0 2px;font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#64748B;">Cumplimiento</p><p style="margin:0;font-size:20px;font-weight:700;color:${color};">${pct}%</p></td>
        <td style="text-align:right;"><p style="margin:0 0 2px;font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#64748B;">Presupuesto</p><p style="margin:0;font-size:20px;font-weight:700;color:#0A2540;">${fmtEur(presupuestoMensual)}</p></td>
      </tr></table>
    </td>
  </tr>
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

export default async function handler(req, res) {
  try {
  if (req.method !== 'POST') return res.status(405).end();

  const token = (req.headers.authorization || '').replace('Bearer ', '').trim();
  if (!token) return res.status(401).json({ error: 'No autorizado' });
  const tokenEmail = jwtEmail(token);
  if (!tokenEmail) return res.status(401).json({ error: 'Token inválido' });

  const { email, hotelNombre, kpis } = req.body ?? {};
  const cleanEmail = validateEmail(email);
  if (!cleanEmail) return res.status(400).json({ error: 'Email inválido' });
  if (tokenEmail !== cleanEmail) return res.status(403).json({ error: 'No autorizado' });
  if (!kpis || typeof kpis !== 'object') return res.status(400).json({ error: 'Faltan kpis' });

  const hotel = escapeHtml(cleanString(hotelNombre, 100) ?? 'FastRevenue');
  const {
    fecha, mesNombre,
    occ, adr, revpar, trevpar,
    hab_ocupadas, hab_disponibles,
    revenue_hab, revenue_total,
    pickup_neto, cancelaciones, revenue_pickup_ayer,
    revenueAcumulado, presupuestoMensual,
    avg_occ, avg_adr, avg_revpar, avg_trevpar,
    revHabMes, revFnbMes, canalesRevenue,
  } = kpis;

  const safeFecha     = cleanString(fecha, 10) ?? '';
  const safeMesNombre = escapeHtml(cleanString(mesNombre, 20) ?? '');

  let progressBar = '';
  try { progressBar = buildProgressBar(revenueAcumulado, presupuestoMensual); } catch { /* ignored */ }
  let revenueCharts = '';
  try { revenueCharts = buildRevenueCharts(revHabMes, revFnbMes, canalesRevenue); } catch { /* ignored */ }

  const alerts     = buildAlerts(kpis);
  const pickupRev  = revenue_pickup_ayer ? `+€${Math.round(revenue_pickup_ayer).toLocaleString('es-ES')}` : '';
  const pickupCanc = cancelaciones ? `(${cancelaciones} cancelación${cancelaciones !== 1 ? 'es' : ''})` : '';

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <title>Informe Diario</title>
</head>
<body style="margin:0;padding:0;background:#EEF2F7;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">

<table width="100%" cellpadding="0" cellspacing="0" style="background:#EEF2F7;padding:20px 0;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

  <!-- HEADER -->
  <tr><td style="background:#0A2540;border-radius:10px 10px 0 0;padding:22px 28px 18px;text-align:center;">
    <p style="margin:0 0 6px;font-size:17px;font-weight:700;color:#FFFFFF;letter-spacing:2px;text-transform:uppercase;">Informe Diario</p>
    <p style="margin:0;font-size:12px;color:rgba(255,255,255,0.55);">
      <strong style="color:#FFFFFF;font-size:14px;">${hotel}</strong> &nbsp;&#8212;&nbsp; ${fmtDate(safeFecha)}
    </p>
    <div style="height:2px;background:linear-gradient(90deg,transparent,#D4A017,transparent);margin-top:16px;"></div>
  </td></tr>

  <!-- KPIs AYER -->
  <tr><td style="background:#FFFFFF;border:1px solid #E2E8F0;border-top:none;padding:0;">
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td colspan="5" style="padding:12px 16px 8px;border-bottom:1px solid #F1F5F9;">
          <p style="margin:0;font-size:12px;font-weight:700;color:#0A2540;text-transform:uppercase;letter-spacing:0.8px;">
            Resumen de Ayer
            <span style="font-size:11px;font-weight:400;color:#94A3B8;text-transform:none;letter-spacing:0;">(vs. Media del Mes)</span>
          </p>
        </td>
      </tr>
      <tr>
        <td style="padding:14px 8px 12px;text-align:center;vertical-align:top;width:20%;">
          <p style="margin:0 0 5px;font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:1.2px;color:#64748B;">Ocupación</p>
          <p style="margin:0;font-size:26px;font-weight:700;color:#0A2540;line-height:1;">${fmt(occ)}%</p>
          ${badge(ppChg(occ, avg_occ), { isPP: true })}
          ${hab_ocupadas != null ? `<p style="margin:5px 0 0;font-size:10px;color:#94A3B8;">${hab_ocupadas}/${hab_disponibles} hab.</p>` : ''}
        </td>
        <td style="padding:14px 8px 12px;text-align:center;vertical-align:top;width:20%;border-left:1px solid #E2E8F0;">
          <p style="margin:0 0 5px;font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:1.2px;color:#64748B;">ADR</p>
          <p style="margin:0;font-size:26px;font-weight:700;color:#0A2540;line-height:1;">${fmtEur(adr)}</p>
          ${badge(absChg(adr, avg_adr), { isAbs: true, prefix: '€' })}
        </td>
        <td style="padding:14px 8px 12px;text-align:center;vertical-align:top;width:20%;border-left:1px solid #E2E8F0;">
          <p style="margin:0 0 5px;font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:1.2px;color:#64748B;">RevPAR</p>
          <p style="margin:0;font-size:26px;font-weight:700;color:#0A2540;line-height:1;">${fmtEur(revpar)}</p>
          ${badge(pctChg(revpar, avg_revpar))}
        </td>
        <td style="padding:14px 8px 12px;text-align:center;vertical-align:top;width:20%;border-left:1px solid #E2E8F0;">
          <p style="margin:0 0 5px;font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:1.2px;color:#64748B;">TRevPAR</p>
          <p style="margin:0;font-size:26px;font-weight:700;color:#0A2540;line-height:1;">${trevpar ? fmtEur(trevpar) : '—'}</p>
          ${trevpar ? badge(pctChg(trevpar, avg_trevpar)) : ''}
        </td>
        <td style="padding:14px 8px 12px;text-align:center;vertical-align:top;width:20%;border-left:1px solid #E2E8F0;">
          <p style="margin:0 0 5px;font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:1.2px;color:#64748B;">Pickup Neto</p>
          <p style="margin:0;font-size:20px;font-weight:700;color:#0A2540;line-height:1.1;">${pickup_neto != null ? `+${pickup_neto} hab.` : '—'}</p>
          ${pickupRev  ? `<p style="margin:4px 0 0;font-size:12px;color:#059669;font-weight:700;">${pickupRev}</p>`  : ''}
          ${pickupCanc ? `<p style="margin:5px 0 0;font-size:10px;color:#94A3B8;">${pickupCanc}</p>` : ''}
        </td>
      </tr>
    </table>
  </td></tr>

  ${revenueCharts}

  <!-- gap -->
  <tr><td style="height:8px;background:#EEF2F7;"></td></tr>

  <!-- PROGRESO MENSUAL -->
  <tr><td style="background:#FFFFFF;border:1px solid #E2E8F0;padding:0;">
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td style="padding:12px 16px 8px;border-bottom:1px solid #F1F5F9;">
          <p style="margin:0;font-size:12px;font-weight:700;color:#0A2540;text-transform:uppercase;letter-spacing:0.8px;">
            Progreso Mensual${safeMesNombre ? ` <span style="color:#94A3B8;font-weight:400;text-transform:none;">(${safeMesNombre})</span>` : ''}
          </p>
        </td>
      </tr>
      <tr>
        <td style="padding:12px 16px 14px;">
          ${progressBar || '<p style="margin:0;font-size:12px;color:#94A3B8;">Sin datos de progreso mensual</p>'}
        </td>
      </tr>
    </table>
  </td></tr>

  ${alerts.length > 0 ? `
  <!-- gap -->
  <tr><td style="height:8px;background:#EEF2F7;"></td></tr>

  <!-- ALERTAS -->
  <tr><td style="background:#FFFFFF;border:1px solid #E2E8F0;padding:0;">
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr><td style="padding:12px 16px 8px;border-bottom:1px solid #F1F5F9;">
        <p style="margin:0;font-size:12px;font-weight:700;color:#0A2540;text-transform:uppercase;letter-spacing:0.8px;">Alertas del Sistema</p>
      </td></tr>
      ${alerts.map(a => `<tr><td style="padding:9px 16px;"><p style="margin:0;font-size:12px;color:#374151;line-height:1.6;">${a}</p></td></tr>`).join('')}
      <tr><td style="height:6px;"></td></tr>
    </table>
  </td></tr>` : ''}

  <!-- gap -->
  <tr><td style="height:8px;background:#EEF2F7;"></td></tr>

  <!-- FIRMA -->
  <tr><td style="background:#ffffff;padding:20px 28px 24px;">
    <table cellpadding="0" cellspacing="0">
      <tr>
        <td style="padding-bottom:12px;">
          <img src="https://fastrevenue.app/fastrev-logo.png" alt="FastRevenue" width="90" style="display:block;border-radius:6px;" />
        </td>
      </tr>
      <tr>
        <td style="font-family:Arial,sans-serif;font-size:13px;color:#0A2540;padding-bottom:4px;">
          <strong>Miguel Ruiz</strong>&nbsp;&nbsp;Founder &middot; <strong>FastRevenue</strong>
        </td>
      </tr>
      <tr>
        <td style="font-family:Arial,sans-serif;font-size:12px;color:#475569;padding-bottom:10px;">
          <a href="mailto:info@fastrevenue.app" style="color:#475569;text-decoration:none;">info@fastrevenue.app</a>
          &nbsp;|&nbsp;fastrevenue.app
        </td>
      </tr>
      <tr>
        <td style="padding-bottom:4px;">
          <table cellpadding="0" cellspacing="0"><tr>
            <td style="padding-right:8px;">
              <img src="https://upload.wikimedia.org/wikipedia/commons/a/a5/Instagram_icon.png" alt="Instagram" width="22" height="22" style="display:block;border-radius:4px;" />
            </td>
            <td style="font-family:Arial,sans-serif;font-size:12px;color:#475569;">@fastrevenueapp</td>
          </tr></table>
        </td>
      </tr>
      <tr>
        <td style="padding-top:6px;">
          <table cellpadding="0" cellspacing="0"><tr>
            <td style="padding-right:8px;">
              <img src="https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg" alt="WhatsApp" width="22" height="22" style="display:block;" />
            </td>
            <td style="font-family:Arial,sans-serif;font-size:12px;color:#475569;">
              <a href="https://wa.me/34657288707" style="color:#475569;text-decoration:none;">0034 657 28 87 07</a>
            </td>
          </tr></table>
        </td>
      </tr>
    </table>
  </td></tr>

  <!-- gap -->
  <tr><td style="height:8px;background:#EEF2F7;"></td></tr>

  <!-- FOOTER -->
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

  try {
    const { error } = await resend.emails.send({
      from: 'FastRevenue <info@fastrevenue.app>',
      to: cleanEmail,
      subject: `Informe diario — ${hotel}`,
      html,
      headers: {
        'X-Entity-Ref-ID': `daily-${cleanEmail}-${safeFecha}-${Date.now()}`,
        'List-Unsubscribe': '<mailto:info@fastrevenue.app?subject=unsubscribe>',
        'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
      },
    });
    if (error) throw new Error(error.message);
    res.status(200).json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: 'resend: ' + e.message });
  }
  } catch (outerErr) {
    res.status(500).json({ error: 'crash: ' + outerErr.message });
  }
}
