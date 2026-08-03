export const config = { api: { bodyParser: { sizeLimit: '4kb' } } };

import { createClient } from '@supabase/supabase-js';
import { rateLimit, getIP } from './_ratelimit.js';
import { verifySupabaseJwtPayload } from './_jwt.js';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const STAFF_EMAIL_DOMAIN = 'staff.internal.fastrevpro.app';

function validarPassword(pw) {
  if (typeof pw !== 'string' || pw.length < 8) return 'La contraseña debe tener al menos 8 caracteres';
  if (!/[A-Z]/.test(pw)) return 'Debe incluir al menos una mayúscula';
  if (!/[0-9]/.test(pw)) return 'Debe incluir al menos un número';
  return null;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  if (!await rateLimit(getIP(req), 10, 60_000)) {
    return res.status(429).json({ error: 'Demasiadas solicitudes' });
  }

  const token = (req.headers.authorization || '').replace('Bearer ', '').trim();
  if (!token) return res.status(401).json({ error: 'No autorizado' });
  const payload = await verifySupabaseJwtPayload(token);
  if (!payload) return res.status(401).json({ error: 'Token inválido' });

  // Solo Dirección (dueño de una fila en `hoteles`) puede gestionar el acceso Usuario.
  // Esto evita que la propia cuenta staff invoque este endpoint para auto-escalar.
  const { data: hotel, error: hotelErr } = await supabase
    .from('hoteles').select('id').eq('id', payload.sub).maybeSingle();
  if (hotelErr || !hotel) return res.status(403).json({ error: 'No autorizado' });
  const hotelId = hotel.id;

  const { action, password } = req.body ?? {};

  try {
    const { data: existing } = await supabase
      .from('hotel_staff').select('staff_user_id').eq('hotel_id', hotelId).maybeSingle();

    if (action === 'revoke') {
      if (!existing) return res.status(200).json({ ok: true });
      await supabase.auth.admin.deleteUser(existing.staff_user_id);
      await supabase.from('hotel_staff').delete().eq('hotel_id', hotelId);
      return res.status(200).json({ ok: true });
    }

    const pwError = validarPassword(password);
    if (pwError) return res.status(400).json({ error: pwError });

    if (existing) {
      const { error: updErr } = await supabase.auth.admin.updateUserById(existing.staff_user_id, { password });
      if (updErr) return res.status(500).json({ error: 'No se pudo actualizar la contraseña' });
      return res.status(200).json({ ok: true });
    }

    const staffEmail = `staff+${hotelId}@${STAFF_EMAIL_DOMAIN}`;
    const { data: created, error: createErr } = await supabase.auth.admin.createUser({
      email: staffEmail, password, email_confirm: true,
    });
    if (createErr || !created?.user) return res.status(500).json({ error: 'No se pudo crear el acceso' });

    const { error: insErr } = await supabase.from('hotel_staff').insert({
      hotel_id: hotelId, staff_user_id: created.user.id, staff_email: staffEmail,
    });
    if (insErr) {
      await supabase.auth.admin.deleteUser(created.user.id);
      return res.status(500).json({ error: 'No se pudo guardar el acceso' });
    }

    return res.status(200).json({ ok: true });
  } catch (e) {
    return res.status(500).json({ error: 'Error interno' });
  }
}
