import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { nombre, hotel, email, mensaje } = req.body;
  if (!nombre || !hotel || !email) {
    return res.status(400).json({ error: 'Faltan campos obligatorios' });
  }

  try {
    const { error } = await resend.emails.send({
      from: 'FastRevenue <info@fastrevenue.app>',
      to: 'info@fastrevenue.app',
      reply_to: email,
      subject: `Nueva consulta — ${nombre} (${hotel})`,
      html: `
        <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:32px;background:#f9f9f9;border-radius:10px;">
          <h2 style="color:#0A2540;margin-bottom:24px;">Nueva solicitud de consulta gratuita</h2>
          <table style="width:100%;border-collapse:collapse;">
            <tr>
              <td style="padding:10px 0;font-size:13px;color:#6B7280;width:90px;">Nombre</td>
              <td style="padding:10px 0;font-size:14px;color:#111827;font-weight:600;">${nombre}</td>
            </tr>
            <tr>
              <td style="padding:10px 0;font-size:13px;color:#6B7280;">Hotel</td>
              <td style="padding:10px 0;font-size:14px;color:#111827;font-weight:600;">${hotel}</td>
            </tr>
            <tr>
              <td style="padding:10px 0;font-size:13px;color:#6B7280;">Email</td>
              <td style="padding:10px 0;font-size:14px;color:#111827;">
                <a href="mailto:${email}" style="color:#004B87;">${email}</a>
              </td>
            </tr>
            ${mensaje ? `<tr>
              <td style="padding:10px 0;font-size:13px;color:#6B7280;vertical-align:top;">Mensaje</td>
              <td style="padding:10px 0;font-size:14px;color:#111827;line-height:1.6;">${mensaje.replace(/\n/g, '<br>')}</td>
            </tr>` : ''}
          </table>
        </div>
      `,
    });

    if (error) throw new Error(error.message);
    res.status(200).json({ ok: true });
  } catch (e) {
    console.error('Error enviando contacto:', e);
    res.status(500).json({ error: e.message });
  }
}
