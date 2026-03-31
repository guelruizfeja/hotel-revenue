import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

const fmt    = (n, dec = 1) => n != null ? Number(n).toFixed(dec) : '—';
const fmtEur = (n) => n != null ? `€${Math.round(n).toLocaleString('es-ES')}` : '—';

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

function buildBudgetBlock(revenue_total, presupuesto) {
  if (!presupuesto) {
    return `<p style="margin:0;font-size:13px;color:#64748B;">Revenue total: <strong style="color:#0A2540;">${fmtEur(revenue_total)}</strong></p>`;
  }
  const pct      = Math.min(Math.round((revenue_total / presupuesto) * 100), 200);
  const pctBar   = Math.min(pct, 100);
  const restante = revenue_total >= presupuesto ? 0 : Math.round(presupuesto - revenue_total);
  const color    = pct >= 100 ? '#059669' : pct >= 80 ? '#C49A0A' : '#DC2626';

  return `<table width="100%" cellpadding="0" cellspacing="0">
  <tr>
    <td style="padding:6px 0 4px;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="text-align:left;">
            <p style="margin:0 0 2px;font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#64748B;">Revenue Total Mes</p>
            <p style="margin:0;font-size:22px;font-weight:700;color:#0A2540;">${fmtEur(revenue_total)}</p>
          </td>
          <td style="text-align:center;">
            <p style="margin:0 0 2px;font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#64748B;">Cumplimiento</p>
            <p style="margin:0;font-size:22px;font-weight:700;color:${color};">${pct}%</p>
          </td>
          <td style="text-align:right;">
            <p style="margin:0 0 2px;font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#64748B;">Presupuesto</p>
            <p style="margin:0;font-size:22px;font-weight:700;color:#0A2540;">${fmtEur(presupuesto)}</p>
          </td>
        </tr>
      </table>
    </td>
  </tr>
  <tr>
    <td style="padding:10px 0 6px;">
      <table width="100%" cellpadding="0" cellspacing="0" style="border-radius:6px;overflow:hidden;background:#E2E8F0;">
        <tr>
          <td style="width:${pctBar}%;background:${color};height:14px;"></td>
          <td style="background:#E2E8F0;height:14px;"></td>
        </tr>
      </table>
    </td>
  </tr>
  ${restante > 0
    ? `<tr><td><p style="margin:0;font-size:11px;color:#94A3B8;">Faltaron <strong style="color:#0A2540;">${fmtEur(restante)}</strong> para cerrar el mes en objetivo</p></td></tr>`
    : `<tr><td><p style="margin:0;font-size:11px;color:#059669;font-weight:700;">&#10003; Presupuesto superado</p></td></tr>`
  }
</table>`;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { email, hotelNombre, kpis } = req.body;
  if (!email || !kpis) return res.status(400).json({ error: 'Faltan datos' });

  const hotel = hotelNombre || 'FastRevenue';
  const {
    mes, anio, mesNombre,
    occ, adr, revpar, trevpar,
    revenue_hab, revenue_total,
    hab_ocupadas, hab_disponibles,
    presupuesto,
    ly_occ, ly_adr, ly_revpar, ly_trevpar, ly_revenue_total,
  } = kpis;

  console.log('monthly-report:', JSON.stringify({ email, hotel, mes, anio, occ, adr, revpar, trevpar, revenue_total, presupuesto }));

  let budgetBlock = '';
  try { budgetBlock = buildBudgetBlock(revenue_total, presupuesto); } catch (e) { console.error('budgetBlock error:', e); }

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <title>Informe Mensual — ${hotel}</title>
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
    <p style="margin:0 0 4px;font-size:11px;font-weight:700;color:rgba(255,255,255,0.5);letter-spacing:2px;text-transform:uppercase;">Cierre Mensual</p>
    <p style="margin:0 0 6px;font-size:20px;font-weight:700;color:#FFFFFF;letter-spacing:1px;">${mesNombre} ${anio}</p>
    <p style="margin:0;font-size:12px;color:rgba(255,255,255,0.55);">FastRevenue &nbsp;&#8212;&nbsp; <strong style="color:#FFFFFF;">${hotel}</strong></p>
    <div style="height:2px;background:linear-gradient(90deg,transparent,#D4A017,transparent);margin-top:16px;"></div>
  </td></tr>

  <!-- ══ KPIs MENSUALES ══ -->
  <tr><td style="background:#FFFFFF;border:1px solid #E2E8F0;border-top:none;padding:0;">
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td colspan="4" style="padding:12px 16px 8px;border-bottom:1px solid #F1F5F9;">
          <p style="margin:0;font-size:12px;font-weight:700;color:#0A2540;text-transform:uppercase;letter-spacing:0.8px;">
            KPIs del Mes
            <span style="font-size:11px;font-weight:400;color:#94A3B8;text-transform:none;letter-spacing:0;">(vs. Mismo Mes Año Anterior)</span>
          </p>
        </td>
      </tr>
      <tr>
        <!-- OCC -->
        <td style="padding:16px 8px 14px;text-align:center;vertical-align:top;width:25%;">
          <p style="margin:0 0 5px;font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:1.2px;color:#64748B;">Ocupación</p>
          <p style="margin:0;font-size:26px;font-weight:700;color:#0A2540;line-height:1;">${fmt(occ)}%</p>
          ${badge(ppChg(occ, ly_occ), { isPP: true })}
          ${hab_ocupadas != null && hab_disponibles != null ? `<p style="margin:6px 0 0;font-size:10px;color:#94A3B8;">${Math.round(hab_ocupadas / (new Date(anio, mes, 0).getDate()))} hab/día</p>` : ''}
        </td>
        <!-- ADR -->
        <td style="padding:16px 8px 14px;text-align:center;vertical-align:top;width:25%;border-left:1px solid #E2E8F0;">
          <p style="margin:0 0 5px;font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:1.2px;color:#64748B;">ADR</p>
          <p style="margin:0;font-size:26px;font-weight:700;color:#0A2540;line-height:1;">${fmtEur(adr)}</p>
          ${badge(absChg(adr, ly_adr), { isAbs: true, prefix: '€' })}
        </td>
        <!-- RevPAR -->
        <td style="padding:16px 8px 14px;text-align:center;vertical-align:top;width:25%;border-left:1px solid #E2E8F0;">
          <p style="margin:0 0 5px;font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:1.2px;color:#64748B;">RevPAR</p>
          <p style="margin:0;font-size:26px;font-weight:700;color:#0A2540;line-height:1;">${fmtEur(revpar)}</p>
          ${badge(pctChg(revpar, ly_revpar))}
        </td>
        <!-- TRevPAR -->
        <td style="padding:16px 8px 14px;text-align:center;vertical-align:top;width:25%;border-left:1px solid #E2E8F0;">
          <p style="margin:0 0 5px;font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:1.2px;color:#64748B;">TRevPAR</p>
          <p style="margin:0;font-size:26px;font-weight:700;color:#0A2540;line-height:1;">${trevpar ? fmtEur(trevpar) : '—'}</p>
          ${trevpar ? badge(pctChg(trevpar, ly_trevpar)) : ''}
        </td>
      </tr>
    </table>
  </td></tr>

  <!-- gap -->
  <tr><td style="height:8px;background:#EEF2F7;"></td></tr>

  <!-- ══ REVENUE ══ -->
  <tr><td style="background:#FFFFFF;border:1px solid #E2E8F0;padding:0;">
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td colspan="2" style="padding:12px 16px 8px;border-bottom:1px solid #F1F5F9;">
          <p style="margin:0;font-size:12px;font-weight:700;color:#0A2540;text-transform:uppercase;letter-spacing:0.8px;">Revenue del Mes vs. Presupuesto</p>
        </td>
      </tr>
      <tr>
        <td style="padding:12px 16px;">
          ${budgetBlock || '<p style="margin:0;font-size:12px;color:#94A3B8;">Sin datos de presupuesto</p>'}
        </td>
      </tr>
      ${revenue_hab != null ? `
      <tr>
        <td style="padding:0 16px 14px;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="padding:10px 12px;background:#F8FAFC;border-radius:6px;">
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td>
                      <p style="margin:0 0 2px;font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#64748B;">Revenue Habitaciones</p>
                      <p style="margin:0;font-size:16px;font-weight:700;color:#0A2540;">${fmtEur(revenue_hab)}</p>
                      ${badge(pctChg(revenue_hab, ly_revenue_total ? ly_revenue_total * (revenue_hab / (revenue_total || 1)) : null))}
                    </td>
                    ${ly_revenue_total != null ? `
                    <td style="text-align:right;">
                      <p style="margin:0 0 2px;font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#64748B;">Mismo mes año anterior</p>
                      <p style="margin:0;font-size:16px;font-weight:700;color:#94A3B8;">${fmtEur(ly_revenue_total)}</p>
                    </td>` : ''}
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </td>
      </tr>` : ''}
    </table>
  </td></tr>

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
      subject: `Informe Mensual ${mesNombre} ${anio} — ${hotel}`,
      html,
      headers: {
        'X-Entity-Ref-ID': `monthly-${email}-${anio}-${mes}`,
        'List-Unsubscribe': '<mailto:info@fastrevenue.app?subject=unsubscribe>',
        'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
      },
    });
    if (error) throw new Error(error.message);
    res.status(200).json({ ok: true });
  } catch (e) {
    console.error('Error enviando informe mensual:', e);
    res.status(500).json({ error: e.message });
  }
}
