import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

const fmt = (n, dec = 1) => n != null ? Number(n).toFixed(dec) : '—';
const fmtEur = (n) => n != null ? `€${Math.round(n).toLocaleString('es-ES')}` : '—';
const fmtDate = (iso) => {
  if (!iso) return '—';
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
};

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { email, hotelNombre, kpis } = req.body;
  if (!email || !kpis) return res.status(400).json({ error: 'Faltan datos' });

  const hotel = hotelNombre || 'Tu hotel';
  const { fecha, occ, adr, revpar, revenue_hab, revenue_total, hab_ocupadas, hab_disponibles, total_registros, pickup_nuevos } = kpis;

  const kpiRow = (label, value, extra = '') => `
    <tr>
      <td style="padding:12px 0;font-size:13px;color:#6B7280;border-bottom:1px solid #F3F4F6;">${label}</td>
      <td style="padding:12px 0;font-size:14px;font-weight:700;color:#0A2540;text-align:right;border-bottom:1px solid #F3F4F6;">${value}${extra ? `<span style="font-size:11px;color:#9CA3AF;font-weight:400;margin-left:6px;">${extra}</span>` : ''}</td>
    </tr>`;

  const html = `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#F4F6F9;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F4F6F9;padding:32px 0;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">

        <!-- Header -->
        <tr><td style="background:#0A2540;border-radius:12px 12px 0 0;padding:28px 36px 24px;">
          <div style="height:3px;background:linear-gradient(90deg,#B8860B,#D4A017);border-radius:2px;margin-bottom:20px;"></div>
          <p style="margin:0 0 4px;font-size:10px;letter-spacing:2.5px;text-transform:uppercase;color:#D4A017;font-weight:600;">Informe de importación</p>
          <h1 style="margin:0;font-family:Georgia,serif;font-size:22px;font-weight:700;color:#FFFFFF;line-height:1.2;">${hotel}</h1>
          <p style="margin:8px 0 0;font-size:13px;color:rgba(255,255,255,0.45);">Datos del ${fmtDate(fecha)}</p>
        </td></tr>

        <!-- Body -->
        <tr><td style="background:#FFFFFF;border-radius:0 0 12px 12px;padding:28px 36px 32px;box-shadow:0 4px 24px rgba(0,0,0,0.07);">

          <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
            ${kpiRow('Ocupación', `${fmt(occ)}%`, hab_ocupadas != null && hab_disponibles != null ? `${hab_ocupadas} / ${hab_disponibles} hab.` : '')}
            ${kpiRow('ADR', fmtEur(adr))}
            ${kpiRow('RevPAR', fmtEur(revpar))}
            ${kpiRow('Revenue habitaciones', fmtEur(revenue_hab))}
            ${revenue_total ? kpiRow('Revenue total', fmtEur(revenue_total)) : ''}
          </table>

          <div style="background:#F8FAFC;border-radius:8px;padding:14px 16px;display:flex;justify-content:space-between;margin-bottom:24px;">
            <div style="text-align:center;flex:1;">
              <p style="margin:0 0 3px;font-size:10px;text-transform:uppercase;letter-spacing:1px;color:#9CA3AF;">Registros</p>
              <p style="margin:0;font-size:18px;font-weight:700;color:#0A2540;">${total_registros ?? '—'}</p>
            </div>
            <div style="width:1px;background:#E5E7EB;"></div>
            <div style="text-align:center;flex:1;">
              <p style="margin:0 0 3px;font-size:10px;text-transform:uppercase;letter-spacing:1px;color:#9CA3AF;">Pickup</p>
              <p style="margin:0;font-size:18px;font-weight:700;color:#0A2540;">${pickup_nuevos ?? '—'}</p>
            </div>
          </div>

          <p style="margin:0;font-size:12px;color:#9CA3AF;line-height:1.6;text-align:center;">
            Importación registrada en FastRevenue ·
            <a href="https://fastrevenue.app/home" style="color:#B8860B;text-decoration:none;">Abrir dashboard →</a>
          </p>

        </td></tr>

        <!-- Footer -->
        <tr><td align="center" style="padding:20px 0 0;">
          <p style="margin:0;font-size:11px;color:#9CA3AF;">FastRevenue · <a href="https://fastrevenue.app/privacidad" style="color:#9CA3AF;text-decoration:none;">Privacidad</a></p>
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
      subject: `Importación ${fmtDate(fecha)} — ${hotel}`,
      html,
    });
    if (error) throw new Error(error.message);
    res.status(200).json({ ok: true });
  } catch (e) {
    console.error('Error enviando informe de importación:', e);
    res.status(500).json({ error: e.message });
  }
}
