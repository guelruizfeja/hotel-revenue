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
  if (isPP) {
    label = `${pos ? '+' : ''}${val.toFixed(1)} pp`;
  } else if (isAbs) {
    const a = Math.abs(val);
    label = `${pos ? '+' : '-'}${prefix}${a < 100 ? a.toFixed(1) : Math.round(a).toLocaleString('es-ES')}`;
  } else {
    label = `${pos ? '+' : ''}${val.toFixed(1)}%`;
  }
  return `<p style="margin:4px 0 0;font-size:13px;color:${color};font-weight:700;line-height:1;">${label}</p>`;
}

function buildProgressBar(revenueAcumulado, presupuestoMensual) {
  if (!revenueAcumulado?.length) return '';
  const acum = revenueAcumulado[revenueAcumulado.length - 1]?.acum || 0;
  if (!presupuestoMensual) {
    return `<table width="100%" cellpadding="0" cellspacing="0">
  <tr>
    <td style="padding:4px 0 10px;">
      <p style="margin:0;font-size:13px;color:#64748B;">Revenue acumulado: <strong style="color:#0A2540;">${fmtEur(acum)}</strong></p>
    </td>
  </tr>
</table>`;
  }
  const pct      = Math.min(Math.round((acum / presupuestoMensual) * 100), 100);
  const restante = Math.max(0, presupuestoMensual - acum);
  const color    = pct >= 100 ? '#059669' : pct >= 75 ? '#C49A0A' : '#DC2626';
  const lastDay  = revenueAcumulado[revenueAcumulado.length - 1]?.dia || 1;

  return `<table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:4px;">
  <!-- Cifras principales -->
  <tr>
    <td style="padding:6px 0 4px;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="text-align:left;">
            <p style="margin:0 0 2px;font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#64748B;">Acumulado día ${lastDay}</p>
            <p style="margin:0;font-size:22px;font-weight:700;color:#0A2540;">${fmtEur(acum)}</p>
          </td>
          <td style="text-align:center;">
            <p style="margin:0 0 2px;font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#64748B;">Cumplimiento</p>
            <p style="margin:0;font-size:22px;font-weight:700;color:${color};">${pct}%</p>
          </td>
          <td style="text-align:right;">
            <p style="margin:0 0 2px;font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#64748B;">Presupuesto total</p>
            <p style="margin:0;font-size:22px;font-weight:700;color:#0A2540;">${fmtEur(presupuestoMensual)}</p>
          </td>
        </tr>
      </table>
    </td>
  </tr>
  <!-- Barra de progreso -->
  <tr>
    <td style="padding:10px 0 6px;">
      <table width="100%" cellpadding="0" cellspacing="0" style="border-radius:6px;overflow:hidden;background:#E2E8F0;">
        <tr>
          <td style="width:${pct}%;background:${color};height:14px;"></td>
          <td style="background:#E2E8F0;height:14px;"></td>
        </tr>
      </table>
    </td>
  </tr>
  <!-- Faltan -->
  ${restante > 0 ? `<tr>
    <td style="padding:0 0 2px;">
      <p style="margin:0;font-size:11px;color:#94A3B8;">Faltan <strong style="color:#0A2540;">${fmtEur(restante)}</strong> para cerrar el mes en objetivo</p>
    </td>
  </tr>` : `<tr><td><p style="margin:0;font-size:11px;color:#059669;font-weight:700;">&#10003; Presupuesto superado</p></td></tr>`}
</table>`;
}


function buildAlerts(kpis) {
  const { occ, pickup_neto, revenue_pickup_ayer, presupuestoMensual, revenueAcumulado, cancelaciones } = kpis;
  const alerts = [];

  if (occ >= 88) {
    alerts.push({ icon: '⚡', html: `<strong>Alta presión de demanda (${fmt(occ)}% ocupación)</strong> — Considera optimizar tarifas para maximizar ADR en los próximos días.` });
  }
  if (pickup_neto >= 12) {
    const rev = revenue_pickup_ayer ? ` / +€${Math.round(revenue_pickup_ayer).toLocaleString('es-ES')}` : '';
    alerts.push({ icon: '📈', html: `<strong>Excelente pickup ayer (+${pickup_neto} hab.${rev})</strong> — Demanda activa, revisa disponibilidad y tarifas.` });
  }
  if (cancelaciones >= 5) {
    alerts.push({ icon: '⚠️', html: `<strong>Cancelaciones elevadas ayer (${cancelaciones})</strong> — Revisa política de cancelación y restricciones de estancia mínima.` });
  }
  if (presupuestoMensual && revenueAcumulado?.length) {
    const acum     = revenueAcumulado[revenueAcumulado.length - 1]?.acum || 0;
    const lastDay  = revenueAcumulado[revenueAcumulado.length - 1]?.dia || 1;
    const pctReal  = (acum / presupuestoMensual) * 100;
    const pctPace  = (lastDay / 30) * 100;
    if (pctReal < pctPace - 15) {
      alerts.push({ icon: '⚠️', html: `<strong>Ritmo por debajo del objetivo (${Math.round(pctReal)}% del presupuesto)</strong> — Revisa estrategia de pricing y distribución.` });
    } else if (pctReal >= 95) {
      alerts.push({ icon: '🎯', html: `<strong>¡Excelente ritmo! (${Math.round(pctReal)}% del presupuesto alcanzado)</strong> — Mantén la estrategia actual.` });
    }
  }

  return alerts;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { email, hotelNombre, kpis } = req.body;
  if (!email || !kpis) return res.status(400).json({ error: 'Faltan datos' });
  if (!/^[^\s@]{1,64}@[^\s@]+\.[^\s@]{2,}$/.test(email)) return res.status(400).json({ error: 'Email inválido' });

  const hotel = hotelNombre || 'FastRevenue';
  const {
    fecha, mesNombre,
    occ, adr, revpar, trevpar,
    hab_ocupadas, hab_disponibles,
    pickup_neto, cancelaciones, revenue_pickup_ayer,
    revenueAcumulado, presupuestoMensual,
    ly_occ, ly_adr, ly_revpar, ly_trevpar,
  } = kpis;

  console.log('import-report:', hotel, fecha);

  let progressBar = '';
  try { progressBar = buildProgressBar(revenueAcumulado, presupuestoMensual); } catch (e) { console.error('progressBar error:', e); }

  const alerts    = buildAlerts(kpis);
  const pickupRev = revenue_pickup_ayer ? `+€${Math.round(revenue_pickup_ayer).toLocaleString('es-ES')}` : '';
  const pickupCanc = cancelaciones ? `(${cancelaciones} cancelación${cancelaciones !== 1 ? 'es' : ''})` : '';

  const html = `<!DOCTYPE html>
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

  <!-- ══ HEADER ══ -->
  <tr><td style="background:#0A2540;border-radius:10px 10px 0 0;padding:22px 28px 18px;text-align:center;">
    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48" style="display:block;margin:0 auto 10px;">
      <rect x="4" y="28" width="8" height="14" fill="#D4A017" rx="2"/>
      <rect x="15" y="20" width="8" height="22" fill="#D4A017" rx="2"/>
      <rect x="26" y="11" width="8" height="31" fill="#D4A017" rx="2"/>
      <circle cx="40" cy="17" r="8" fill="none" stroke="#D4A017" stroke-width="2.5"/>
      <text x="40" y="22" text-anchor="middle" font-size="10" font-weight="700" fill="#D4A017" font-family="Helvetica,Arial,sans-serif">$</text>
    </svg>
    <p style="margin:0 0 6px;font-size:17px;font-weight:700;color:#FFFFFF;letter-spacing:2px;text-transform:uppercase;">Informe Diario de Revenue</p>
    <p style="margin:0;font-size:12px;color:rgba(255,255,255,0.55);">
      FastRevenue &nbsp;&#8212;&nbsp; <strong style="color:#FFFFFF;font-size:14px;">${hotel}</strong> &nbsp;&#8212;&nbsp; ${fmtDate(fecha)}
    </p>
    <div style="height:2px;background:linear-gradient(90deg,transparent,#D4A017,transparent);margin-top:16px;"></div>
  </td></tr>

  <!-- ══ RESUMEN DE AYER ══ -->
  <tr><td style="background:#FFFFFF;border:1px solid #E2E8F0;border-top:none;padding:0;">
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td colspan="5" style="padding:12px 16px 8px;border-bottom:1px solid #F1F5F9;">
          <p style="margin:0;font-size:12px;font-weight:700;color:#0A2540;text-transform:uppercase;letter-spacing:0.8px;">
            Resumen de Ayer
            <span style="font-size:11px;font-weight:400;color:#94A3B8;text-transform:none;letter-spacing:0;">(vs. Año Anterior, LY)</span>
          </p>
        </td>
      </tr>
      <tr>
        <!-- OCC -->
        <td style="padding:14px 8px 12px;text-align:center;vertical-align:top;width:20%;">
          <p style="margin:0 0 5px;font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:1.2px;color:#64748B;">Ocupación</p>
          <p style="margin:0;font-size:26px;font-weight:700;color:#0A2540;line-height:1;">${fmt(occ)}%</p>
          ${badge(ppChg(occ, ly_occ), { isPP: true })}
          ${hab_ocupadas != null ? `<p style="margin:5px 0 0;font-size:10px;color:#94A3B8;">${hab_ocupadas}/${hab_disponibles} hab.</p>` : ''}
          <div style="text-align:right;margin-top:6px;">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="1" y="9" width="3" height="6" fill="#CBD5E1" rx="1"/>
              <rect x="6" y="5" width="3" height="10" fill="#CBD5E1" rx="1"/>
              <rect x="11" y="2" width="3" height="13" fill="#CBD5E1" rx="1"/>
            </svg>
          </div>
        </td>
        <!-- ADR -->
        <td style="padding:14px 8px 12px;text-align:center;vertical-align:top;width:20%;border-left:1px solid #E2E8F0;">
          <p style="margin:0 0 5px;font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:1.2px;color:#64748B;">ADR</p>
          <p style="margin:0;font-size:26px;font-weight:700;color:#0A2540;line-height:1;">${fmtEur(adr)}</p>
          ${badge(absChg(adr, ly_adr), { isAbs: true, prefix: '€' })}
          <div style="text-align:right;margin-top:6px;">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M3 2h8l2 2v10H3V2z" stroke="#CBD5E1" stroke-width="1.5" fill="none"/>
              <path d="M6 7h5M6 10h3" stroke="#CBD5E1" stroke-width="1.2"/>
            </svg>
          </div>
        </td>
        <!-- RevPAR -->
        <td style="padding:14px 8px 12px;text-align:center;vertical-align:top;width:20%;border-left:1px solid #E2E8F0;">
          <p style="margin:0 0 5px;font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:1.2px;color:#64748B;">RevPAR</p>
          <p style="margin:0;font-size:26px;font-weight:700;color:#0A2540;line-height:1;">${fmtEur(revpar)}</p>
          ${badge(pctChg(revpar, ly_revpar))}
          <div style="text-align:right;margin-top:6px;">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <polyline points="1,13 5,8 9,10 15,3" stroke="#CBD5E1" stroke-width="1.5" fill="none"/>
              <polyline points="11,3 15,3 15,7" stroke="#CBD5E1" stroke-width="1.5" fill="none"/>
            </svg>
          </div>
        </td>
        <!-- TRevPAR -->
        <td style="padding:14px 8px 12px;text-align:center;vertical-align:top;width:20%;border-left:1px solid #E2E8F0;">
          <p style="margin:0 0 5px;font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:1.2px;color:#64748B;">TRevPAR</p>
          <p style="margin:0;font-size:26px;font-weight:700;color:#0A2540;line-height:1;">${trevpar ? fmtEur(trevpar) : '—'}</p>
          ${trevpar ? badge(pctChg(trevpar, ly_trevpar)) : ''}
          <div style="text-align:right;margin-top:6px;">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="1" y="1" width="6" height="6" stroke="#CBD5E1" stroke-width="1.2" rx="1"/>
              <rect x="9" y="1" width="6" height="6" stroke="#CBD5E1" stroke-width="1.2" rx="1"/>
              <rect x="1" y="9" width="6" height="6" stroke="#CBD5E1" stroke-width="1.2" rx="1"/>
              <rect x="9" y="9" width="6" height="6" stroke="#CBD5E1" stroke-width="1.2" rx="1"/>
            </svg>
          </div>
        </td>
        <!-- PICKUP NETO -->
        <td style="padding:14px 8px 12px;text-align:center;vertical-align:top;width:20%;border-left:1px solid #E2E8F0;">
          <p style="margin:0 0 5px;font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:1.2px;color:#64748B;">Pickup Neto (Ayer)</p>
          <p style="margin:0;font-size:20px;font-weight:700;color:#0A2540;line-height:1.1;">
            ${pickup_neto != null ? `+${pickup_neto} hab.` : '—'}
          </p>
          ${pickupRev ? `<p style="margin:4px 0 0;font-size:13px;color:#059669;font-weight:700;line-height:1;">${pickupRev}</p>` : ''}
          ${pickupCanc ? `<p style="margin:5px 0 0;font-size:10px;color:#94A3B8;">${pickupCanc}</p>` : ''}
        </td>
      </tr>
    </table>
  </td></tr>

  <!-- gap -->
  <tr><td style="height:8px;background:#EEF2F7;"></td></tr>

  <!-- ══ PROGRESO MENSUAL ══ -->
  <tr><td style="background:#FFFFFF;border:1px solid #E2E8F0;padding:0;">
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td colspan="2" style="padding:12px 16px 8px;border-bottom:1px solid #F1F5F9;">
          <p style="margin:0;font-size:12px;font-weight:700;color:#0A2540;text-transform:uppercase;letter-spacing:0.8px;">
            Progreso Mensual de Revenue${mesNombre ? ` <span style="color:#94A3B8;font-weight:400;text-transform:none;">(${mesNombre})</span>` : ''}
            &nbsp;vs.&nbsp;Presupuesto Total
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

  <!-- ══ ALERTAS DEL SISTEMA ══ -->
  <tr><td style="background:#FFFFFF;border:1px solid #E2E8F0;padding:0;">
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td style="padding:12px 16px 8px;border-bottom:1px solid #F1F5F9;">
          <p style="margin:0;font-size:12px;font-weight:700;color:#0A2540;text-transform:uppercase;letter-spacing:0.8px;">Alertas del Sistema</p>
        </td>
      </tr>
      ${alerts.map(a => `<tr><td style="padding:9px 16px;">
        <p style="margin:0;font-size:12px;color:#374151;line-height:1.6;">${a.icon}&nbsp; ${a.html}</p>
      </td></tr>`).join('')}
      <tr><td style="height:6px;"></td></tr>
    </table>
  </td></tr>
  ` : ''}

  <!-- gap before footer -->
  <tr><td style="height:8px;background:#EEF2F7;"></td></tr>

  <!-- ══ FOOTER ══ -->
  <tr><td style="background:#0A2540;border-radius:0 0 10px 10px;padding:12px 28px;">
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td><p style="margin:0;font-size:10px;color:rgba(255,255,255,0.4);">FastRevenue — Tu Partner de Inteligencia Hotelera</p></td>
        <td align="right">
          <a href="https://fastrevenue.app/home" style="font-size:10px;color:#D4A017;text-decoration:none;font-weight:600;">Abrir dashboard &#8594;</a>
        </td>
      </tr>
    </table>
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
    res.status(500).json({ error: 'Error interno' });
  }
}
