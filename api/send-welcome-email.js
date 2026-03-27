import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { email, hotelNombre } = req.body;
  if (!email) return res.status(400).json({ error: 'Falta email' });

  const nombre = hotelNombre || 'tu hotel';

  const html = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Bienvenido a FastRevenue</title>
</head>
<body style="margin:0;padding:0;background:#F4F6F9;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">

  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F4F6F9;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="580" cellpadding="0" cellspacing="0" style="max-width:580px;width:100%;">

          <!-- Header -->
          <tr>
            <td align="center" style="padding:0 0 24px 0;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#0A2540;border-radius:12px 12px 0 0;">
                <tr>
                  <td align="center" style="padding:36px 40px 32px;">
                    <div style="display:inline-block;border:1px solid rgba(184,134,11,0.5);border-radius:4px;padding:3px 12px;margin-bottom:20px;">
                      <span style="font-size:9px;letter-spacing:2.5px;text-transform:uppercase;color:#D4A017;font-weight:500;">Revenue Intelligence</span>
                    </div>
                    <h1 style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:32px;font-weight:700;color:#FFFFFF;letter-spacing:-0.5px;line-height:1.2;">
                      Bienvenido a FastRevenue
                    </h1>
                    <p style="margin:14px 0 0;font-size:15px;color:rgba(255,255,255,0.65);line-height:1.6;">
                      ${nombre} ya tiene su centro de mando de revenue.
                    </p>
                  </td>
                </tr>
                <!-- Gold divider -->
                <tr>
                  <td>
                    <div style="height:3px;background:linear-gradient(90deg,#B8860B,#D4A017,#B8860B);"></div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="background:#FFFFFF;border-radius:0 0 12px 12px;padding:40px 40px 32px;box-shadow:0 4px 24px rgba(0,0,0,0.07);">

              <p style="margin:0 0 24px;font-size:15px;color:#374151;line-height:1.7;">
                Tu cuenta está lista. Tienes <strong style="color:#0A2540;">30 días de acceso completo</strong> sin coste y sin necesidad de tarjeta de crédito.
              </p>

              <!-- Steps -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:32px;">
                <tr>
                  <td style="padding:0 0 16px 0;">
                    <table width="100%" cellpadding="0" cellspacing="0" style="background:#F8FAFC;border-radius:10px;border-left:3px solid #B8860B;">
                      <tr>
                        <td style="padding:16px 20px;">
                          <p style="margin:0 0 4px;font-size:11px;text-transform:uppercase;letter-spacing:1.5px;color:#B8860B;font-weight:600;">Paso 1</p>
                          <p style="margin:0;font-size:14px;font-weight:600;color:#0A2540;">Descarga la plantilla Excel</p>
                          <p style="margin:4px 0 0;font-size:13px;color:#6B7280;line-height:1.5;">Introduce tus datos de producción, pickup y presupuesto en la plantilla FastRev.</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding:0 0 16px 0;">
                    <table width="100%" cellpadding="0" cellspacing="0" style="background:#F8FAFC;border-radius:10px;border-left:3px solid #0A2540;">
                      <tr>
                        <td style="padding:16px 20px;">
                          <p style="margin:0 0 4px;font-size:11px;text-transform:uppercase;letter-spacing:1.5px;color:#0A2540;font-weight:600;">Paso 2</p>
                          <p style="margin:0;font-size:14px;font-weight:600;color:#0A2540;">Importa los datos</p>
                          <p style="margin:4px 0 0;font-size:13px;color:#6B7280;line-height:1.5;">Sube tu Excel desde el dashboard. En segundos tendrás todos tus KPIs actualizados.</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td>
                    <table width="100%" cellpadding="0" cellspacing="0" style="background:#F8FAFC;border-radius:10px;border-left:3px solid #059669;">
                      <tr>
                        <td style="padding:16px 20px;">
                          <p style="margin:0 0 4px;font-size:11px;text-transform:uppercase;letter-spacing:1.5px;color:#059669;font-weight:600;">Paso 3</p>
                          <p style="margin:0;font-size:14px;font-weight:600;color:#0A2540;">Analiza y decide</p>
                          <p style="margin:4px 0 0;font-size:13px;color:#6B7280;line-height:1.5;">Revisa tu RevPAR, ADR, pickup y presupuesto. Genera informes PDF con un clic.</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Features grid -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:32px;">
                <tr>
                  <td width="50%" style="padding:0 8px 0 0;vertical-align:top;">
                    ${['Dashboard KPIs en tiempo real','Análisis de pickup','Forecast de cierre de mes'].map(f =>
                      `<p style="margin:0 0 10px;font-size:13px;color:#374151;padding-left:18px;position:relative;">
                        <span style="position:absolute;left:0;color:#059669;font-weight:700;">✓</span> ${f}
                      </p>`
                    ).join('')}
                  </td>
                  <td width="50%" style="padding:0 0 0 8px;vertical-align:top;">
                    ${['Presupuesto vs. real','Grupos y eventos','Informes PDF mensuales'].map(f =>
                      `<p style="margin:0 0 10px;font-size:13px;color:#374151;padding-left:18px;position:relative;">
                        <span style="position:absolute;left:0;color:#059669;font-weight:700;">✓</span> ${f}
                      </p>`
                    ).join('')}
                  </td>
                </tr>
              </table>

              <!-- CTA -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:32px;">
                <tr>
                  <td align="center">
                    <a href="https://fastrevenue.app/home"
                      style="display:inline-block;background:#0A2540;color:#FFFFFF;text-decoration:none;font-size:15px;font-weight:600;padding:14px 40px;border-radius:8px;letter-spacing:0.2px;">
                      Acceder a mi dashboard →
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Divider -->
              <hr style="border:none;border-top:1px solid #E5E7EB;margin:0 0 24px;">

              <p style="margin:0;font-size:13px;color:#9CA3AF;line-height:1.7;text-align:center;">
                ¿Tienes alguna pregunta? Responde a este correo o escríbenos a
                <a href="mailto:info@fastrevenue.app" style="color:#B8860B;text-decoration:none;">info@fastrevenue.app</a>
                — te respondemos en menos de 24h.
              </p>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding:24px 0 0;">
              <p style="margin:0 0 8px;font-size:12px;color:#9CA3AF;">
                FastRevenue
              </p>
              <p style="margin:0;font-size:11px;color:#D1D5DB;">
                <a href="https://fastrevenue.app/privacidad" style="color:#9CA3AF;text-decoration:none;">Privacidad</a>
                &nbsp;·&nbsp;
                <a href="https://fastrevenue.app/terminos" style="color:#9CA3AF;text-decoration:none;">Términos</a>
                &nbsp;·&nbsp;
                <a href="https://fastrevenue.app/aviso-legal" style="color:#9CA3AF;text-decoration:none;">Aviso Legal</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>

</body>
</html>
  `;

  try {
    const { error } = await resend.emails.send({
      from: 'FastRevenue <info@fastrevenue.app>',
      to: email,
      subject: `Bienvenido a FastRevenue — Tu prueba de 30 días ha comenzado`,
      html,
    });

    if (error) throw new Error(error.message);
    res.status(200).json({ ok: true });
  } catch (e) {
    console.error('Error enviando email de bienvenida:', e);
    res.status(500).json({ error: e.message });
  }
}
