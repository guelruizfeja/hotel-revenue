import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

const fmt    = (n, dec = 1) => n != null ? Number(n).toFixed(dec) : '—';
const fmtEur = (n) => n != null ? `€${Math.round(n).toLocaleString('es-ES')}` : '—';
const fmtDate = (iso) => {
  if (!iso) return '—';
  const [y, m, d] = iso.split('-');
  const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
  return `${parseInt(d)} ${MESES[parseInt(m) - 1]} ${y}`;
};

function buildChart(revenueAcumulado, presupuestoMensual) {
  if (!revenueAcumulado || revenueAcumulado.length === 0) return '';

  const W = 390, H = 190, PL = 52, PR = 10, PT = 14, PB = 30;
  const cW = W - PL - PR, cH = H - PT - PB;

  const maxVal = Math.max(...revenueAcumulado.map(d => d.acum), presupuestoMensual || 0);
  const yMax = maxVal * 1.12 || 1;

  const lastDay = revenueAcumulado[revenueAcumulado.length - 1]?.dia || 31;
  const totalDays = Math.max(lastDay, 28);

  const xS = (dia) => PL + ((dia - 0.5) / totalDays) * cW;
  const yS = (val) => PT + cH - (val / yMax) * cH;
  const bW  = Math.max(4, (cW / totalDays) * 0.72);

  // Y-axis ticks
  const ticks = [0, 0.25, 0.5, 0.75, 1].map(t => {
    const val = Math.round(yMax * t / 1000) * 1000;
    const y   = yS(val).toFixed(1);
    const lbl = val >= 1000 ? `€${(val / 1000).toFixed(0)}k` : `€0`;
    return `<line x1="${PL}" y1="${y}" x2="${W - PR}" y2="${y}" stroke="#EEEEEE" stroke-width="0.8"/>
<text x="${(PL - 3).toFixed(1)}" y="${y}" text-anchor="end" dominant-baseline="middle" font-size="7.5" fill="#9CA3AF">${lbl}</text>`;
  }).join('');

  // Bars — gold
  const bars = revenueAcumulado.map(d => {
    const x  = (xS(d.dia) - bW / 2).toFixed(1);
    const bH = ((d.acum / yMax) * cH).toFixed(1);
    const y  = (PT + cH - (d.acum / yMax) * cH).toFixed(1);
    return `<rect x="${x}" y="${y}" width="${bW.toFixed(1)}" height="${bH}" fill="#B8860B" rx="1.5"/>`;
  }).join('');

  // Budget dashed line
  let bLine = '';
  if (presupuestoMensual) {
    const by   = yS(presupuestoMensual).toFixed(1);
    const bLbl = `PPTO ${fmtEur(presupuestoMensual)}`;
    bLine = `<line x1="${PL}" y1="${by}" x2="${W - PR}" y2="${by}" stroke="#0A2540" stroke-width="1.5" stroke-dasharray="5,3"/>
<text x="${(W - PR - 2).toFixed(1)}" y="${(parseFloat(by) - 5).toFixed(1)}" text-anchor="end" font-size="7.5" font-weight="600" fill="#0A2540">${bLbl}</text>`;
  }

  // X labels every 5 days + last
  const shown = new Set();
  const xLbls = [];
  for (let d = 1; d <= totalDays; d += 5) {
    shown.add(d);
    xLbls.push(`<text x="${xS(d).toFixed(1)}" y="${(H - 8).toFixed(1)}" text-anchor="middle" font-size="7.5" fill="#9CA3AF">${d}</text>`);
  }
  if (!shown.has(lastDay)) {
    xLbls.push(`<text x="${xS(lastDay).toFixed(1)}" y="${(H - 8).toFixed(1)}" text-anchor="middle" font-size="7.5" font-weight="700" fill="#6B7280">${lastDay}</text>`);
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" style="display:block;width:100%;max-width:${W}px;">
  ${ticks}
  ${bars}
  ${bLine}
  ${xLbls.join('')}
  <line x1="${PL}" y1="${PT}" x2="${PL}" y2="${PT + cH}" stroke="#D1D5DB" stroke-width="1"/>
  <line x1="${PL}" y1="${PT + cH}" x2="${W - PR}" y2="${PT + cH}" stroke="#D1D5DB" stroke-width="1"/>
</svg>`;
}

function buildDonut(revenueAcumulado, presupuestoMensual) {
  if (!presupuestoMensual || !revenueAcumulado?.length) return '';

  const acum     = revenueAcumulado[revenueAcumulado.length - 1]?.acum || 0;
  const pct      = Math.round((acum / presupuestoMensual) * 100);
  const restante = Math.max(0, presupuestoMensual - acum);
  const color    = pct >= 100 ? '#059669' : pct >= 75 ? '#B8860B' : '#DC2626';

  const r = 44, cx = 58, cy = 58;
  const circ = 2 * Math.PI * r;
  const dash  = (Math.min(pct, 100) / 100 * circ).toFixed(1);

  return `
<table cellpadding="0" cellspacing="0" style="margin:0 auto;">
  <tr>
    <td align="center">
      <svg xmlns="http://www.w3.org/2000/svg" width="116" height="116" viewBox="0 0 116 116">
        <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="#E5E7EB" stroke-width="11"/>
        <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${color}" stroke-width="11"
          stroke-dasharray="${dash} ${circ.toFixed(1)}"
          stroke-linecap="round"
          transform="rotate(-90 ${cx} ${cy})"/>
        <text x="${cx}" y="${cy - 8}" text-anchor="middle" font-size="18" font-weight="700" fill="${color}">${pct}%</text>
        <text x="${cx}" y="${cy + 8}" text-anchor="middle" font-size="7.5" fill="#6B7280">CUMPL. PPTO</text>
      </svg>
    </td>
  </tr>
  <tr>
    <td align="center" style="padding-top:6px;">
      <p style="margin:0 0 2px;font-size:9px;text-transform:uppercase;letter-spacing:1px;color:#9CA3AF;font-weight:600;">Faltan</p>
      <p style="margin:0;font-size:14px;font-weight:700;color:#0A2540;">${fmtEur(restante)}</p>
      <p style="margin:2px 0 0;font-size:9px;color:#9CA3AF;">para presupuesto</p>
    </td>
  </tr>
</table>`;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { email, hotelNombre, kpis } = req.body;
  if (!email || !kpis) return res.status(400).json({ error: 'Faltan datos' });

  console.log('import-report:', { email, fecha: kpis?.fecha, hotel: hotelNombre });

  const hotel = hotelNombre || 'Tu hotel';
  const {
    fecha, mesNombre,
    occ, adr, revpar, trevpar,
    revenue_hab, hab_ocupadas, hab_disponibles,
    pickup_neto, cancelaciones,
    revenueAcumulado, presupuestoMensual,
  } = kpis;

  let chart = '', donut = '';
  try { chart = buildChart(revenueAcumulado, presupuestoMensual); } catch (e) { console.error('chart error:', e); }
  try { donut = buildDonut(revenueAcumulado, presupuestoMensual); } catch (e) { console.error('donut error:', e); }

  // KPI column helper
  const kpiCol = (label, main, sub, borderLeft = true) => `
<td style="width:20%;padding:16px 10px;text-align:center;vertical-align:top;${borderLeft ? 'border-left:1px solid #E5E7EB;' : ''}">
  <p style="margin:0 0 6px;font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:1.2px;color:#6B7280;">${label}</p>
  <p style="margin:0;font-size:22px;font-weight:700;color:#0A2540;line-height:1.1;">${main}</p>
  ${sub ? `<p style="margin:5px 0 0;font-size:11px;color:#6B7280;">${sub}</p>` : ''}
</td>`;

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <title>Informe diario — ${hotel}</title>
</head>
<body style="margin:0;padding:0;background:#F1F3F6;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">

<table width="100%" cellpadding="0" cellspacing="0" style="background:#F1F3F6;padding:28px 0;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

  <!-- ══ HEADER ══ -->
  <tr><td style="background:#0A2540;border-radius:10px 10px 0 0;padding:22px 32px 20px;">
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td align="center">
          <p style="margin:0 0 4px;font-size:18px;font-weight:700;color:#FFFFFF;letter-spacing:1px;text-transform:uppercase;">Informe Diario de Revenue</p>
          <p style="margin:0;font-size:13px;color:rgba(255,255,255,0.55);">
            FastRevenue &nbsp;—&nbsp; <strong style="color:rgba(255,255,255,0.85);">${hotel}</strong> &nbsp;—&nbsp; ${fmtDate(fecha)}
          </p>
        </td>
      </tr>
    </table>
    <div style="height:2px;background:linear-gradient(90deg,transparent,#D4A017,transparent);margin-top:18px;"></div>
  </td></tr>

  <!-- ══ RESUMEN DE AYER ══ -->
  <tr><td style="background:#FFFFFF;border:1px solid #E5E7EB;border-top:none;padding:0;">
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td style="padding:14px 18px 10px;" colspan="5">
          <p style="margin:0;font-size:13px;font-weight:700;color:#0A2540;text-transform:uppercase;letter-spacing:0.5px;">
            Resumen de Ayer
          </p>
        </td>
      </tr>
      <tr style="border-top:1px solid #F3F4F6;">
        ${kpiCol('Ocupación',     `${fmt(occ)}%`,        hab_ocupadas != null ? `${hab_ocupadas} / ${hab_disponibles} hab.` : null, false)}
        ${kpiCol('ADR',           fmtEur(adr),           null)}
        ${kpiCol('RevPAR',        fmtEur(revpar),        null)}
        ${kpiCol('TRevPAR',       trevpar ? fmtEur(trevpar) : fmtEur(revenue_hab), trevpar ? null : 'Rev. hab.')}
        ${kpiCol('Pickup Neto',   pickup_neto != null ? `+${pickup_neto} hab.` : '—', cancelaciones != null ? `${cancelaciones} cancelación${cancelaciones !== 1 ? 'es' : ''}` : null)}
      </tr>
    </table>
  </td></tr>

  <!-- ══ PROGRESO MENSUAL ══ -->
  <tr><td style="background:#FFFFFF;border:1px solid #E5E7EB;border-top:none;margin-top:12px;padding:0;">
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td style="padding:14px 18px 10px;" colspan="2">
          <p style="margin:0;font-size:13px;font-weight:700;color:#0A2540;text-transform:uppercase;letter-spacing:0.5px;">
            Progreso Mensual de Revenue${mesNombre ? ` (${mesNombre})` : ''} vs. Presupuesto
          </p>
        </td>
      </tr>
      <tr>
        <!-- Chart -->
        <td style="padding:4px 8px 8px 16px;vertical-align:middle;">
          ${chart || '<p style="color:#9CA3AF;font-size:12px;padding:12px 0;">Sin datos de progreso mensual</p>'}
          ${chart ? `
          <table cellpadding="0" cellspacing="0" style="margin:6px 0 0 52px;">
            <tr>
              <td style="padding-right:14px;">
                <span style="display:inline-block;width:10px;height:10px;background:#B8860B;border-radius:2px;vertical-align:middle;margin-right:4px;"></span>
                <span style="font-size:10px;color:#6B7280;vertical-align:middle;">Revenue acumulado</span>
              </td>
              ${presupuestoMensual ? `<td>
                <span style="display:inline-block;width:14px;border-top:2px dashed #0A2540;vertical-align:middle;margin-right:4px;"></span>
                <span style="font-size:10px;color:#6B7280;vertical-align:middle;">Presupuesto mensual</span>
              </td>` : ''}
            </tr>
          </table>` : ''}
        </td>
        <!-- Donut -->
        ${donut ? `<td style="padding:8px 16px 8px 8px;vertical-align:middle;text-align:center;width:130px;">${donut}</td>` : ''}
      </tr>
    </table>
  </td></tr>

  <!-- ══ FOOTER ══ -->
  <tr><td style="background:#0A2540;border-radius:0 0 10px 10px;padding:14px 32px;">
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td>
          <p style="margin:0;font-size:11px;color:rgba(255,255,255,0.45);">
            FastRevenue — Tu partner de inteligencia hotelera
          </p>
        </td>
        <td align="right">
          <a href="https://fastrevenue.app/home" style="font-size:11px;color:#D4A017;text-decoration:none;font-weight:600;">Abrir dashboard →</a>
        </td>
      </tr>
    </table>
  </td></tr>

  <!-- outer footer -->
  <tr><td align="center" style="padding:16px 0 0;">
    <p style="margin:0;font-size:10px;color:#9CA3AF;">
      <a href="https://fastrevenue.app/privacidad" style="color:#9CA3AF;text-decoration:none;">Privacidad</a>
      &nbsp;·&nbsp;
      <a href="mailto:info@fastrevenue.app" style="color:#9CA3AF;text-decoration:none;">info@fastrevenue.app</a>
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
      to: email,
      subject: `Informe ${fmtDate(fecha)} — ${hotel}`,
      html,
      headers: {
        'X-Entity-Ref-ID': `import-${email}-${fecha}`,
        'List-Unsubscribe': '<mailto:info@fastrevenue.app?subject=unsubscribe>',
        'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
      },
    });
    if (error) throw new Error(error.message);
    res.status(200).json({ ok: true });
  } catch (e) {
    console.error('Error enviando informe:', e);
    res.status(500).json({ error: e.message });
  }
}
