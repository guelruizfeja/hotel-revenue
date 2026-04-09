export const config = { api: { bodyParser: { sizeLimit: '16kb' } } };

import { Resend } from 'resend';
import { rateLimit, getIP } from './_ratelimit.js';
import { validateEmail, cleanString, escapeHtml } from './_validate.js';

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  if (!await rateLimit(getIP(req), 5, 10 * 60_000)) {
    return res.status(429).json({ error: 'Demasiadas solicitudes' });
  }

  const { nombre, hotel, email, mensaje } = req.body ?? {};

  const cleanNombre  = cleanString(nombre, 100);
  const cleanHotel   = cleanString(hotel, 100);
  const cleanEmail   = validateEmail(email);
  const cleanMensaje = cleanString(mensaje, 2000);

  if (!cleanNombre || !cleanHotel || !cleanEmail) {
    return res.status(400).json({ error: 'Faltan campos obligatorios o son inválidos' });
  }

  const sNombre  = escapeHtml(cleanNombre);
  const sHotel   = escapeHtml(cleanHotel);
  const sEmail   = escapeHtml(cleanEmail);
  const sMensaje = cleanMensaje ? escapeHtml(cleanMensaje).replace(/\n/g, '<br>') : null;

  try {
    const { error } = await resend.emails.send({
      from: 'FastRevenue <info@fastrevenue.app>',
      to: 'info@fastrevenue.app',
      reply_to: sEmail,
      subject: `Nueva consulta — ${sNombre} (${sHotel})`,
      html: `
        <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:32px;background:#f9f9f9;border-radius:10px;">
          <h2 style="color:#0A2540;margin-bottom:24px;">Nueva solicitud de consulta gratuita</h2>
          <table style="width:100%;border-collapse:collapse;">
            <tr>
              <td style="padding:10px 0;font-size:13px;color:#6B7280;width:90px;">Nombre</td>
              <td style="padding:10px 0;font-size:14px;color:#111827;font-weight:600;">${sNombre}</td>
            </tr>
            <tr>
              <td style="padding:10px 0;font-size:13px;color:#6B7280;">Hotel</td>
              <td style="padding:10px 0;font-size:14px;color:#111827;font-weight:600;">${sHotel}</td>
            </tr>
            <tr>
              <td style="padding:10px 0;font-size:13px;color:#6B7280;">Email</td>
              <td style="padding:10px 0;font-size:14px;color:#111827;">
                <a href="mailto:${sEmail}" style="color:#004B87;">${sEmail}</a>
              </td>
            </tr>
            ${sMensaje ? `<tr>
              <td style="padding:10px 0;font-size:13px;color:#6B7280;vertical-align:top;">Mensaje</td>
              <td style="padding:10px 0;font-size:14px;color:#111827;line-height:1.6;">${sMensaje}</td>
            </tr>` : ''}
          </table>
        </div>
      `,
    });

    if (error) throw new Error(error.message);
    res.status(200).json({ ok: true });
  } catch (e) {
    console.error('Error enviando contacto');
    res.status(500).json({ error: 'Error interno' });
  }
}
