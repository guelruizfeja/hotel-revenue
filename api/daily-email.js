export const config = { api: { bodyParser: { sizeLimit: '16kb' } } };

import { Resend } from 'resend';
import { createClient } from '@supabase/supabase-js';
import { validateEmail, cleanString, escapeHtml } from './_validate.js';

const resend = new Resend(process.env.RESEND_API_KEY);
const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

const fmt    = (n, dec = 1) => (n != null && !isNaN(n)) ? Number(n).toFixed(dec) : '—';
const fmtEur = (n) => (n != null && !isNaN(n)) ? `€${Math.round(n).toLocaleString('es-ES')}` : '—';
const fmtDate = (iso) => {
  if (!iso) return '—';
  const [y, m, d] = iso.split('-');
  const MESES = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
  return `${parseInt(d)} de ${MESES[parseInt(m) - 1]} de ${y}`;
};

export default async function handler(req, res) {
  try {
  if (req.method !== 'POST') return res.status(405).end();

  // JWT
  const token = (req.headers.authorization || '').replace('Bearer ', '').trim();
  if (!token) return res.status(401).json({ error: 'No autorizado' });
  let user;
  try {
    const resp = await supabase.auth.getUser(token);
    user = resp.data?.user;
    if (!user) return res.status(401).json({ error: 'No autorizado' });
  } catch (authEx) {
    console.error('daily-email auth crash:', authEx);
    return res.status(401).json({ error: 'Auth error: ' + authEx.message });
  }

  const {
    email, hotelNombre, fecha,
    occ, adr, revpar, trevpar,
    hab_ocupadas, hab_disponibles,
    revenue_hab, revenue_total,
  } = req.body ?? {};

  const cleanEmail = validateEmail(email);
  if (!cleanEmail) return res.status(400).json({ error: 'Email inválido' });
  if (user.email !== cleanEmail) return res.status(403).json({ error: 'No autorizado' });

  const hotel    = escapeHtml(cleanString(hotelNombre, 100) ?? 'FastRevenue');
  const safeFecha = cleanString(fecha, 10) ?? '';

  const occ_   = occ   != null ? occ   : (hab_disponibles > 0 ? hab_ocupadas / hab_disponibles * 100 : null);
  const adr_   = adr   != null ? adr   : (hab_ocupadas > 0 && revenue_hab ? revenue_hab / hab_ocupadas : null);
  const revpar_= revpar != null ? revpar: (hab_disponibles > 0 && revenue_hab ? revenue_hab / hab_disponibles : null);

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <title>Informe diario — ${hotel}</title>
</head>
<body style="margin:0;padding:0;background:#F0F4F8;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">

<table width="100%" cellpadding="0" cellspacing="0" style="background:#F0F4F8;padding:32px 0;">
<tr><td align="center">
<table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">

  <!-- HEADER -->
  <tr><td style="background:#0A2540;border-radius:10px 10px 0 0;padding:28px 32px 24px;text-align:center;">
    <p style="margin:0 0 4px;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#D4A017;font-weight:600;">Informe Diario de Revenue</p>
    <h1 style="margin:0 0 6px;font-size:22px;font-weight:700;color:#FFFFFF;">${hotel}</h1>
    <p style="margin:0;font-size:13px;color:rgba(255,255,255,0.55);">${fmtDate(safeFecha)}</p>
    <div style="height:2px;background:linear-gradient(90deg,transparent,#D4A017,transparent);margin-top:20px;"></div>
  </td></tr>

  <!-- KPIs -->
  <tr><td style="background:#FFFFFF;padding:0;border-left:1px solid #E2E8F0;border-right:1px solid #E2E8F0;">
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <!-- OCC -->
        <td style="width:25%;padding:20px 8px;text-align:center;vertical-align:top;border-right:1px solid #F1F5F9;">
          <p style="margin:0 0 6px;font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:1.2px;color:#64748B;">Ocupación</p>
          <p style="margin:0;font-size:28px;font-weight:700;color:#0A2540;line-height:1;">${fmt(occ_)}%</p>
          ${hab_ocupadas != null ? `<p style="margin:6px 0 0;font-size:11px;color:#94A3B8;">${hab_ocupadas} / ${hab_disponibles} hab.</p>` : ''}
        </td>
        <!-- ADR -->
        <td style="width:25%;padding:20px 8px;text-align:center;vertical-align:top;border-right:1px solid #F1F5F9;">
          <p style="margin:0 0 6px;font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:1.2px;color:#64748B;">ADR</p>
          <p style="margin:0;font-size:28px;font-weight:700;color:#0A2540;line-height:1;">${fmtEur(adr_)}</p>
        </td>
        <!-- RevPAR -->
        <td style="width:25%;padding:20px 8px;text-align:center;vertical-align:top;border-right:1px solid #F1F5F9;">
          <p style="margin:0 0 6px;font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:1.2px;color:#64748B;">RevPAR</p>
          <p style="margin:0;font-size:28px;font-weight:700;color:#0A2540;line-height:1;">${fmtEur(revpar_)}</p>
        </td>
        <!-- Rev. Total -->
        <td style="width:25%;padding:20px 8px;text-align:center;vertical-align:top;">
          <p style="margin:0 0 6px;font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:1.2px;color:#64748B;">Rev. Total</p>
          <p style="margin:0;font-size:28px;font-weight:700;color:#0A2540;line-height:1;">${fmtEur(revenue_total ?? revenue_hab)}</p>
        </td>
      </tr>
    </table>
  </td></tr>

  ${trevpar != null ? `
  <!-- TRevPAR -->
  <tr><td style="background:#F8FAFC;border-left:1px solid #E2E8F0;border-right:1px solid #E2E8F0;padding:12px 20px;">
    <p style="margin:0;font-size:12px;color:#64748B;">
      TRevPAR: <strong style="color:#0A2540;">${fmtEur(trevpar)}</strong>
      &nbsp;·&nbsp;
      Rev. Hab.: <strong style="color:#0A2540;">${fmtEur(revenue_hab)}</strong>
    </p>
  </td></tr>` : ''}

  <!-- CTA -->
  <tr><td style="background:#FFFFFF;border:1px solid #E2E8F0;border-top:none;padding:20px 32px 24px;text-align:center;">
    <a href="https://fastrevenue.app/home"
      style="display:inline-block;background:#0A2540;color:#FFFFFF;text-decoration:none;font-size:14px;font-weight:600;padding:12px 32px;border-radius:7px;">
      Ver dashboard completo →
    </a>
  </td></tr>

  <!-- FOOTER -->
  <tr><td style="background:#0A2540;border-radius:0 0 10px 10px;padding:14px 28px;text-align:center;">
    <p style="margin:0;font-size:10px;color:rgba(255,255,255,0.4);">
      FastRevenue &nbsp;·&nbsp;
      <a href="mailto:info@fastrevenue.app" style="color:#D4A017;text-decoration:none;">info@fastrevenue.app</a>
      &nbsp;·&nbsp;
      <a href="https://fastrevenue.app/privacidad" style="color:rgba(255,255,255,0.4);text-decoration:none;">Privacidad</a>
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
      subject: `Informe ${fmtDate(safeFecha)} — ${hotel}`,
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
    console.error('daily-email resend error:', e);
    res.status(500).json({ error: 'resend: ' + e.message });
  }
  } catch (outerErr) {
    console.error('daily-email crash:', outerErr);
    res.status(500).json({ error: 'crash: ' + outerErr.message });
  }
}
