export const config = { api: { bodyParser: { sizeLimit: '7mb' } } };

import { Resend } from 'resend';
import { createClient } from '@supabase/supabase-js';
import { rateLimit, getIP } from './_ratelimit.js';
import { validateEmail, cleanString, validateNum, escapeHtml } from './_validate.js';

const resend = new Resend(process.env.RESEND_API_KEY);
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const fmt    = (n, dec = 1) => n != null ? Number(n).toFixed(dec) : '—';
const fmtEur = (n) => n != null ? `€${Math.round(n).toLocaleString('es-ES')}` : '—';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  if (!await rateLimit(getIP(req), 5, 10 * 60_000)) {
    return res.status(429).json({ error: 'Demasiadas solicitudes. Inténtalo más tarde.' });
  }

  // Verificar JWT
  const token = (req.headers.authorization || '').replace('Bearer ', '').trim();
  if (!token) return res.status(401).json({ error: 'No autorizado' });
  const { data: { user: authUser }, error: authErr } = await supabase.auth.getUser(token);
  if (authErr || !authUser) return res.status(401).json({ error: 'No autorizado' });

  const { email, hotelNombre, kpis, pdfBase64, pdfNombre } = req.body ?? {};
  const cleanEmail = validateEmail(email);
  if (!cleanEmail) return res.status(400).json({ error: 'Email inválido o ausente' });
  if (authUser.email !== cleanEmail) return res.status(403).json({ error: 'No autorizado' });
  if (!kpis || typeof kpis !== 'object' || Array.isArray(kpis)) {
    return res.status(400).json({ error: 'Faltan datos de KPIs' });
  }
  if (pdfBase64 != null && typeof pdfBase64 === 'string' && pdfBase64.length > 10_000_000) {
    return res.status(400).json({ error: 'PDF demasiado grande' });
  }

  const hotel       = escapeHtml(cleanString(hotelNombre, 100) ?? 'FastRevenue');
  const cleanPdfNombre = cleanString(pdfNombre, 100);
  const { mes, anio, mesNombre, occ, adr, revpar, revenue_total, presupuesto } = kpis;
  const safeAnio      = validateNum(anio, 2020, 2100) ?? '';
  const safeMes       = validateNum(mes, 1, 12) ?? '';
  const safeMesNombre = escapeHtml(cleanString(mesNombre, 20) ?? '');



  const pct = presupuesto && revenue_total
    ? Math.round((revenue_total / presupuesto) * 100)
    : null;
  const pctColor  = pct == null ? '#0A2540' : pct >= 100 ? '#059669' : pct >= 80 ? '#C49A0A' : '#DC2626';

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <title>Informe Mensual — ${hotel}</title>
</head>
<body style="margin:0;padding:0;background:#EEF2F7;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">

<table width="100%" cellpadding="0" cellspacing="0" style="background:#EEF2F7;padding:32px 0;">
<tr><td align="center">
<table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">

  <!-- HEADER -->
  <tr><td style="background:#0A2540;border-radius:10px 10px 0 0;padding:28px 32px 22px;text-align:center;">
    <svg xmlns="http://www.w3.org/2000/svg" width="44" height="44" viewBox="0 0 48 48" style="display:block;margin:0 auto 10px;">
      <rect x="4" y="28" width="8" height="14" fill="#D4A017" rx="2"/>
      <rect x="15" y="20" width="8" height="22" fill="#D4A017" rx="2"/>
      <rect x="26" y="11" width="8" height="31" fill="#D4A017" rx="2"/>
      <circle cx="40" cy="17" r="8" fill="none" stroke="#D4A017" stroke-width="2.5"/>
      <text x="40" y="22" text-anchor="middle" font-size="10" font-weight="700" fill="#D4A017" font-family="Helvetica,Arial,sans-serif">$</text>
    </svg>
    <p style="margin:0 0 4px;font-size:11px;font-weight:700;color:rgba(255,255,255,0.5);letter-spacing:2px;text-transform:uppercase;">Cierre Mensual</p>
    <p style="margin:0 0 6px;font-size:22px;font-weight:700;color:#FFFFFF;letter-spacing:1px;">${safeMesNombre} ${safeAnio}</p>
    <p style="margin:0;font-size:12px;color:rgba(255,255,255,0.55);">FastRevenue &nbsp;&#8212;&nbsp; <strong style="color:#FFFFFF;">${hotel}</strong></p>
    <div style="height:2px;background:linear-gradient(90deg,transparent,#D4A017,transparent);margin-top:18px;"></div>
  </td></tr>

  <!-- CUERPO -->
  <tr><td style="background:#FFFFFF;border:1px solid #E2E8F0;border-top:none;padding:32px;">

    <p style="margin:0 0 18px;font-size:15px;color:#374151;line-height:1.7;">
      Estimado/a equipo de <strong style="color:#0A2540;">${hotel}</strong>,
    </p>
    <p style="margin:0 0 18px;font-size:14px;color:#374151;line-height:1.8;">
      Adjuntamos el <strong>informe mensual de ${safeMesNombre} ${safeAnio}</strong> con el análisis completo
      de la actividad de su alojamiento: KPIs del mes, comparativa vs. año anterior, detalle diario,
      evolución de los últimos 12 meses y más.
    </p>

    <!-- Resumen rápido de KPIs -->
    <table width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0;background:#F8FAFC;border-radius:8px;overflow:hidden;">
      <tr>
        <td style="padding:14px 16px;text-align:center;width:25%;">
          <p style="margin:0 0 3px;font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#64748B;">Ocupación</p>
          <p style="margin:0;font-size:20px;font-weight:700;color:#0A2540;">${fmt(occ)}%</p>
        </td>
        <td style="padding:14px 16px;text-align:center;width:25%;border-left:1px solid #E2E8F0;">
          <p style="margin:0 0 3px;font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#64748B;">ADR</p>
          <p style="margin:0;font-size:20px;font-weight:700;color:#0A2540;">${fmtEur(adr)}</p>
        </td>
        <td style="padding:14px 16px;text-align:center;width:25%;border-left:1px solid #E2E8F0;">
          <p style="margin:0 0 3px;font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#64748B;">RevPAR</p>
          <p style="margin:0;font-size:20px;font-weight:700;color:#0A2540;">${fmtEur(revpar)}</p>
        </td>
        <td style="padding:14px 16px;text-align:center;width:25%;border-left:1px solid #E2E8F0;">
          <p style="margin:0 0 3px;font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#64748B;">Rev. Total</p>
          <p style="margin:0;font-size:20px;font-weight:700;color:#0A2540;">${fmtEur(revenue_total)}</p>
          ${pct != null ? `<p style="margin:3px 0 0;font-size:11px;font-weight:700;color:${pctColor};">${pct}% objetivo</p>` : ''}
        </td>
      </tr>
    </table>

    <p style="margin:0 0 8px;font-size:13px;color:#64748B;line-height:1.7;">
      El informe completo en PDF se adjunta a este correo.
      También puede acceder al dashboard en tiempo real desde el enlace de abajo.
    </p>

  </td></tr>

  <!-- FOOTER -->
  <tr><td style="background:#0A2540;border-radius:0 0 10px 10px;padding:14px 32px;">
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

  const attachments = [];
  if (pdfBase64) {
    try {
      attachments.push({
        filename: cleanPdfNombre || `Informe_${safeMesNombre}_${safeAnio}.pdf`,
        content: Buffer.from(pdfBase64, 'base64'),
      });
    } catch { /* ignored */ }
  }

  try {
    const { error } = await resend.emails.send({
      from: 'FastRevenue <info@fastrevenue.app>',
      to: cleanEmail,
      subject: `Informe Mensual ${safeMesNombre} ${safeAnio} — ${hotel}`,
      html,
      attachments,
      headers: {
        'X-Entity-Ref-ID': `monthly-${cleanEmail}-${safeAnio}-${safeMes}`,
        'List-Unsubscribe': '<mailto:info@fastrevenue.app?subject=unsubscribe>',
        'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
      },
    });
    if (error) throw new Error(error.message);
    res.status(200).json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: 'Error interno' });
  }
}
