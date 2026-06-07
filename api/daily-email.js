export const config = { api: { bodyParser: { sizeLimit: '7mb' } } };

import { Resend } from 'resend';
import { validateEmail, cleanString, escapeHtml } from './_validate.js';

const resend = new Resend(process.env.RESEND_API_KEY);

function jwtEmail(token) {
  try {
    const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString('utf8'));
    return payload.email ?? null;
  } catch { return null; }
}

const fmt    = (n, dec = 0) => (n != null && !isNaN(n)) ? Number(n).toFixed(dec) : '—';
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

    const token = (req.headers.authorization || '').replace('Bearer ', '').trim();
    if (!token) return res.status(401).json({ error: 'No autorizado' });
    const tokenEmail = jwtEmail(token);
    if (!tokenEmail) return res.status(401).json({ error: 'Token inválido' });

    const { email, hotelNombre, kpis, pdfBase64 } = req.body ?? {};
    const cleanEmail = validateEmail(email);
    if (!cleanEmail) return res.status(400).json({ error: 'Email inválido' });
    if (tokenEmail !== cleanEmail) return res.status(403).json({ error: 'No autorizado' });
    if (!kpis || typeof kpis !== 'object') return res.status(400).json({ error: 'Faltan kpis' });

    const hotel = escapeHtml(cleanString(hotelNombre, 100) ?? 'tu hotel');
    const { fecha } = kpis;
    const safeFecha = cleanString(fecha, 10) ?? '';

    const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <title>Informe Diario</title>
</head>
<body style="margin:0;padding:0;background:#EEF2F7;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#EEF2F7;padding:32px 0;">
<tr><td align="center">
<table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">

  <!-- HEADER -->
  <tr><td style="background:#0A2540;border-radius:10px 10px 0 0;padding:28px 32px 22px;text-align:center;">
    <p style="margin:0 0 4px;font-size:11px;font-weight:700;color:rgba(255,255,255,0.5);letter-spacing:2px;text-transform:uppercase;">Informe Diario</p>
    <p style="margin:0 0 6px;font-size:22px;font-weight:700;color:#FFFFFF;">${escapeHtml(hotel)}</p>
    <p style="margin:0;font-size:12px;color:rgba(255,255,255,0.55);">${fmtDate(safeFecha)}</p>
    <div style="height:2px;background:linear-gradient(90deg,transparent,#D4A017,transparent);margin-top:16px;"></div>
  </td></tr>

  <!-- CUERPO -->
  <tr><td style="background:#FFFFFF;border:1px solid #E2E8F0;border-top:none;padding:32px;">

    <p style="margin:0 0 16px;font-size:15px;color:#374151;line-height:1.7;">
      Buenos días,
    </p>
    <p style="margin:0 0 14px;font-size:14px;color:#374151;line-height:1.85;">
      Te adjunto el informe diario de operaciones de <strong style="color:#0A2540;">${fmtDate(safeFecha)}</strong>.
      Encontrarás el análisis completo con los KPIs del día, la comparativa con la media del mes,
      el mix de revenue y el progreso mensual en el <strong>PDF adjunto</strong>.
    </p>
    <p style="margin:0 0 20px;font-size:14px;color:#374151;line-height:1.85;">
      Revisa el PDF para obtener una visión detallada de la evolución del negocio y tomar
      las mejores decisiones del día.
    </p>
    <p style="margin:0;font-size:13px;color:#94A3B8;line-height:1.6;">
      Accede al dashboard para ver el detalle en tiempo real.
    </p>

  </td></tr>

  <!-- FOOTER -->
  <tr><td style="background:#0A2540;border-radius:0 0 10px 10px;padding:14px 32px;">
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

    const attachments = [];
    if (pdfBase64) {
      try {
        attachments.push({
          filename: `Informe_diario_${safeFecha}.pdf`,
          content: Buffer.from(pdfBase64, 'base64'),
        });
      } catch { /* ignored */ }
    }

    const { error } = await resend.emails.send({
      from: 'FastRevenue <info@fastrevenue.app>',
      to: cleanEmail,
      subject: `Informe diario ${fmtDate(safeFecha)} — ${escapeHtml(hotel)}`,
      html,
      attachments,
      headers: {
        'X-Entity-Ref-ID': `daily-${cleanEmail}-${safeFecha}`,
        'List-Unsubscribe': '<mailto:info@fastrevenue.app?subject=unsubscribe>',
        'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
      },
    });

    if (error) throw new Error(error.message);
    res.status(200).json({ ok: true });

  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
