export const config = { api: { bodyParser: { sizeLimit: '2mb' } } };

import { rateLimit, getIP } from './_ratelimit.js';
import { cleanString, escapeHtml } from './_validate.js';
import { generarInformeDiarioPDF } from './_pdfInformeDiario.js';
import { verifySupabaseJwt } from './_jwt.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  if (!await rateLimit(getIP(req), 20, 10 * 60_000)) {
    return res.status(429).json({ error: 'Demasiadas solicitudes. Inténtalo más tarde.' });
  }

  const token = (req.headers.authorization || '').replace('Bearer ', '').trim();
  if (!token) return res.status(401).json({ error: 'No autorizado' });
  const email = verifySupabaseJwt(token);
  if (!email) return res.status(401).json({ error: 'Token inválido' });

  const { hotelNombre, kpis } = req.body ?? {};
  if (!kpis || typeof kpis !== 'object' || Array.isArray(kpis)) {
    return res.status(400).json({ error: 'Faltan datos de KPIs' });
  }

  try {
    const hotel = escapeHtml(cleanString(hotelNombre, 100) ?? 'Mi Hotel');
    const pdfBase64 = generarInformeDiarioPDF(kpis, hotel);
    res.status(200).json({ pdfBase64 });
  } catch (e) {
    res.status(500).json({ error: 'Error al generar el PDF: ' + e.message });
  }
}
