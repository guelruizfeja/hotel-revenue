import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

const fmt  = (n, dec = 1) => n != null ? Number(n).toFixed(dec) : '—';
const fmtEur = (n) => n != null ? `€${Math.round(n).toLocaleString('es-ES')}` : '—';
const fmtPct = (n) => n != null ? `${Math.round(n)}%` : '—';
const fmtDate = (iso) => {
  if (!iso) return '—';
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
};

function buildChart(revenueAcumulado, presupuestoMensual) {
  if (!revenueAcumulado || revenueAcumulado.length === 0) return '';

  const W = 480, H = 160, PAD_L = 48, PAD_R = 16, PAD_T = 12, PAD_B = 28;
  const chartW = W - PAD_L - PAD_R;
  const chartH = H - PAD_T - PAD_B;

  const maxRevAcum = Math.max(...revenueAcumulado.map(d => d.acum), presupuestoMensual || 0);
  const yMax = maxRevAcum * 1.1 || 1;

  // Determine days in month for x-axis (up to last known day)
  const lastDay = revenueAcumulado[revenueAcumulado.length - 1]?.dia || 31;
  const totalDays = Math.max(lastDay, 28);

  const xScale = (dia) => PAD_L + ((dia - 1) / (totalDays - 1)) * chartW;
  const yScale = (val) => PAD_T + chartH - (val / yMax) * chartH;

  // Bars
  const barWidth = Math.max(2, chartW / totalDays * 0.6);
  const bars = revenueAcumulado.map(d => {
    const x = xScale(d.dia) - barWidth / 2;
    const barH = (d.acum / yMax) * chartH;
    const y = PAD_T + chartH - barH;
    return `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${barWidth.toFixed(1)}" height="${barH.toFixed(1)}" fill="#0A2540" rx="1"/>`;
  }).join('');

  // Budget dashed line
  let budgetLine = '';
  if (presupuestoMensual) {
    const by = yScale(presupuestoMensual).toFixed(1);
    budgetLine = `<line x1="${PAD_L}" y1="${by}" x2="${W - PAD_R}" y2="${by}" stroke="#D4A017" stroke-width="1.5" stroke-dasharray="5,3"/>`;
  }

  // Y axis labels (3 ticks)
  const yTicks = [0, 0.5, 1].map(t => {
    const val = Math.round(yMax * t);
    const y = yScale(val).toFixed(1);
    const label = val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val;
    return `<text x="${(PAD_L - 4).toFixed(1)}" y="${y}" text-anchor="end" dominant-baseline="middle" font-size="9" fill="#9CA3AF">${label}</text>
<line x1="${PAD_L}" y1="${y}" x2="${W - PAD_R}" y2="${y}" stroke="#E5E7EB" stroke-width="0.5"/>`;
  }).join('');

  // X axis labels (every ~7 days)
  const xLabels = [];
  for (let d = 1; d <= totalDays; d += 7) {
    const x = xScale(d).toFixed(1);
    xLabels.push(`<text x="${x}" y="${(H - 6).toFixed(1)}" text-anchor="middle" font-size="9" fill="#9CA3AF">${d}</text>`);
  }

  return `
<table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
  <tr>
    <td style="padding:0 0 8px 0;">
      <svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" style="display:block;max-width:100%;">
        ${yTicks}
        ${bars}
        ${budgetLine}
        ${xLabels.join('')}
        <line x1="${PAD_L}" y1="${PAD_T}" x2="${PAD_L}" y2="${PAD_T + chartH}" stroke="#E5E7EB" stroke-width="1"/>
        <line x1="${PAD_L}" y1="${PAD_T + chartH}" x2="${W - PAD_R}" y2="${PAD_T + chartH}" stroke="#E5E7EB" stroke-width="1"/>
      </svg>
    </td>
  </tr>
  <tr>
    <td align="center">
      <table cellpadding="0" cellspacing="0">
        <tr>
          <td style="padding:0 16px 0 0;">
            <span style="display:inline-block;width:10px;height:10px;background:#0A2540;border-radius:2px;vertical-align:middle;margin-right:5px;"></span>
            <span style="font-size:11px;color:#6B7280;vertical-align:middle;">Revenue acumulado</span>
          </td>
          <td>
            <span style="display:inline-block;width:16px;height:0;border-top:2px dashed #D4A017;vertical-align:middle;margin-right:5px;"></span>
            <span style="font-size:11px;color:#6B7280;vertical-align:middle;">Presupuesto mensual</span>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>`;
}

function buildCumplimiento(revenueAcumulado, presupuestoMensual) {
  if (!presupuestoMensual || !revenueAcumulado || revenueAcumulado.length === 0) return '';

  const acumActual = revenueAcumulado[revenueAcumulado.length - 1]?.acum || 0;
  const pct = Math.round((acumActual / presupuestoMensual) * 100);
  const color = pct >= 100 ? '#059669' : pct >= 75 ? '#D4A017' : '#DC2626';

  // Circular progress (SVG donut)
  const r = 30, cx = 38, cy = 38;
  const circ = 2 * Math.PI * r;
  const dash = Math.min(pct, 100) / 100 * circ;

  return `
<table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;background:#F8FAFC;border-radius:10px;">
  <tr>
    <td style="padding:20px 24px;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="vertical-align:middle;padding-right:20px;">
            <p style="margin:0 0 3px;font-size:10px;text-transform:uppercase;letter-spacing:1.5px;color:#9CA3AF;font-weight:600;">Cumplimiento de presupuesto</p>
            <p style="margin:0;font-size:22px;font-weight:700;color:${color};">${pct}%</p>
            <p style="margin:4px 0 0;font-size:12px;color:#9CA3AF;">${fmtEur(acumActual)} de ${fmtEur(presupuestoMensual)}</p>
          </td>
          <td style="vertical-align:middle;text-align:right;">
            <svg xmlns="http://www.w3.org/2000/svg" width="76" height="76" viewBox="0 0 76 76">
              <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="#E5E7EB" stroke-width="7"/>
              <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${color}" stroke-width="7"
                stroke-dasharray="${dash.toFixed(1)} ${circ.toFixed(1)}"
                stroke-dashoffset="${(circ / 4).toFixed(1)}"
                stroke-linecap="round"
                transform="rotate(-90 ${cx} ${cy})"/>
              <text x="${cx}" y="${cy}" text-anchor="middle" dominant-baseline="middle" font-size="13" font-weight="700" fill="${color}">${pct}%</text>
            </svg>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>`;
}

function kpiBox(label, value, sub) {
  return `
  <td style="padding:0 6px;vertical-align:top;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#F8FAFC;border-radius:8px;border-top:3px solid #0A2540;">
      <tr>
        <td style="padding:12px 10px 10px;text-align:center;">
          <p style="margin:0 0 4px;font-size:9px;text-transform:uppercase;letter-spacing:1.2px;color:#9CA3AF;font-weight:600;">${label}</p>
          <p style="margin:0;font-size:16px;font-weight:700;color:#0A2540;line-height:1.2;">${value}</p>
          ${sub ? `<p style="margin:3px 0 0;font-size:10px;color:#9CA3AF;">${sub}</p>` : ''}
        </td>
      </tr>
    </table>
  </td>`;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { email, hotelNombre, kpis } = req.body;
  if (!email || !kpis) return res.status(400).json({ error: 'Faltan datos' });

  const hotel = hotelNombre || 'Tu hotel';
  const {
    fecha, mesNombre,
    occ, adr, revpar, trevpar,
    revenue_hab, hab_ocupadas, hab_disponibles,
    pickup_neto, cancelaciones,
    revenueAcumulado, presupuestoMensual,
    total_registros,
  } = kpis;

  const chart = buildChart(revenueAcumulado, presupuestoMensual);
  const cumplimiento = buildCumplimiento(revenueAcumulado, presupuestoMensual);

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <title>Informe diario — ${hotel}</title>
</head>
<body style="margin:0;padding:0;background:#F4F6F9;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">

<table width="100%" cellpadding="0" cellspacing="0" style="background:#F4F6F9;padding:32px 0;">
  <tr><td align="center">
    <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">

      <!-- HEADER -->
      <tr><td style="background:#0A2540;border-radius:12px 12px 0 0;padding:0;">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="padding:24px 28px 0;">
              <img src="https://fastrevenue.app/fastrev-logo.png" alt="FastRevenue" height="36" style="display:block;height:36px;border:0;">
            </td>
          </tr>
          <tr>
            <td>
              <div style="height:2px;background:linear-gradient(90deg,#B8860B,#D4A017,#B8860B);margin:14px 0;"></div>
            </td>
          </tr>
          <tr>
            <td style="padding:0 28px 28px;">
              <p style="margin:0 0 4px;font-size:9px;letter-spacing:2.5px;text-transform:uppercase;color:#D4A017;font-weight:600;">Informe diario de revenue</p>
              <h1 style="margin:0 0 6px;font-family:Georgia,serif;font-size:20px;font-weight:700;color:#FFFFFF;line-height:1.2;">${hotel}</h1>
              <p style="margin:0;font-size:12px;color:rgba(255,255,255,0.45);">Datos del ${fmtDate(fecha)}</p>
            </td>
          </tr>
        </table>
      </td></tr>

      <!-- BODY -->
      <tr><td style="background:#FFFFFF;border-radius:0 0 12px 12px;padding:28px;box-shadow:0 4px 24px rgba(0,0,0,0.07);">

        <!-- Section: Resumen de ayer -->
        <p style="margin:0 0 12px;font-size:10px;text-transform:uppercase;letter-spacing:2px;color:#9CA3AF;font-weight:600;">Resumen de ayer</p>

        <!-- KPI boxes row -->
        <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;table-layout:fixed;">
          <tr>
            ${kpiBox('Ocupación', `${fmt(occ)}%`, hab_ocupadas != null ? `${hab_ocupadas}/${hab_disponibles} hab.` : null)}
            ${kpiBox('ADR', fmtEur(adr))}
            ${kpiBox('RevPAR', fmtEur(revpar))}
            ${trevpar ? kpiBox('TRevPAR', fmtEur(trevpar)) : kpiBox('Revenue', fmtEur(revenue_hab))}
            ${kpiBox('Pickup neto', pickup_neto != null ? `+${pickup_neto}` : '—', cancelaciones != null ? `${cancelaciones} cancel.` : null)}
          </tr>
        </table>

        ${(revenueAcumulado && revenueAcumulado.length > 0) ? `
        <!-- Section: Progreso mensual -->
        <p style="margin:0 0 12px;font-size:10px;text-transform:uppercase;letter-spacing:2px;color:#9CA3AF;font-weight:600;">
          Progreso mensual${mesNombre ? ` — ${mesNombre}` : ''} vs. presupuesto
        </p>

        ${chart}
        ${cumplimiento}
        ` : ''}

        <!-- Divider -->
        <hr style="border:none;border-top:1px solid #F3F4F6;margin:0 0 18px;">

        <!-- Footer links -->
        <p style="margin:0;font-size:12px;color:#9CA3AF;text-align:center;line-height:1.8;">
          FastRevenue · <a href="mailto:info@fastrevenue.app" style="color:#9CA3AF;text-decoration:none;">info@fastrevenue.app</a>
          &nbsp;·&nbsp;
          <a href="https://fastrevenue.app/home" style="color:#B8860B;text-decoration:none;font-weight:500;">Abrir dashboard →</a>
        </p>

      </td></tr>

      <!-- Footer -->
      <tr><td align="center" style="padding:20px 0 0;">
        <p style="margin:0;font-size:11px;color:#9CA3AF;">
          <a href="https://fastrevenue.app/privacidad" style="color:#9CA3AF;text-decoration:none;">Privacidad</a>
          &nbsp;·&nbsp;
          <a href="https://fastrevenue.app/terminos" style="color:#9CA3AF;text-decoration:none;">Términos</a>
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
    console.error('Error enviando informe de importación:', e);
    res.status(500).json({ error: e.message });
  }
}
