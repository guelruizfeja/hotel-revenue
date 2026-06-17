export function buildHabEnCasaMap(pickupEntries, grupos) {
  const map = {};
  const pad = n => String(n).padStart(2, "0");
  const isoL = d => `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
  const addRange = (fl, fs, nr) => {
    let d = new Date(fl+"T00:00:00");
    const end = new Date(fs+"T00:00:00");
    while (d < end) { const iso=isoL(d); map[iso]=(map[iso]||0)+nr; d.setDate(d.getDate()+1); }
  };
  (grupos||[]).filter(g => g.estado==="confirmado" && g.habitaciones>0 && g.fecha_inicio && g.fecha_fin)
    .forEach(g => addRange(g.fecha_inicio, g.fecha_fin, g.habitaciones));
  const _isGrCan = c => { const lc=(c||"").toLowerCase(); return lc.includes("grupo")||lc.includes("mice")||lc.includes("evento"); };
  const dd = {};
  (pickupEntries||[]).forEach(e => {
    if (e._grupo) return;
    const est = e.estado||"confirmada";
    if (est==="cancelada"||est==="tentativo") return;
    if (_isGrCan(e.canal)) return;
    const fl = String(e.fecha_llegada||"").slice(0,10);
    const fs = e.fecha_salida ? String(e.fecha_salida).slice(0,10)
      : (fl ? (()=>{ const d=new Date(fl+"T00:00:00"); d.setDate(d.getDate()+Math.max(1,Number(e.noches)||1)); return isoL(d); })() : null);
    if (!fl||!fs) return;
    if (e.es_individual) { addRange(fl, fs, e.num_reservas||1); return; }
    const key = `${fl}|${e.canal||""}|${fs}`;
    const fp  = String(e.fecha_pickup||"").slice(0,10);
    if (!dd[key]||fp>dd[key]._fp) dd[key]={ fl, fs, nr: e.num_reservas||1, _fp: fp };
  });
  Object.values(dd).forEach(({ fl, fs, nr }) => addRange(fl, fs, nr));
  return map;
}

export function calcHabEnCasa(pickupEntries, grupos, diaIso) {
  const pad = n => String(n).padStart(2, "0");
  const isoL = d => `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
  let total = 0;
  (grupos||[]).filter(g => g.estado==="confirmado" && g.habitaciones>0 && g.fecha_inicio && g.fecha_fin)
    .forEach(g => {
      let d = new Date(g.fecha_inicio+"T00:00:00");
      const fin = new Date(g.fecha_fin+"T00:00:00");
      while (d < fin) {
        const iso = isoL(d);
        if (iso === diaIso) { total += g.habitaciones; break; }
        if (iso > diaIso) break;
        d.setDate(d.getDate()+1);
      }
    });
  const dd = {};
  let contInd = 0;
  (pickupEntries||[]).forEach(e => {
    if (e._grupo) return;
    const est = e.estado||"confirmada";
    if (est==="cancelada"||est==="tentativo") return;
    const fl = String(e.fecha_llegada||"").slice(0,10);
    const fs = e.fecha_salida ? String(e.fecha_salida).slice(0,10)
      : (fl ? (()=>{ const d=new Date(fl+"T00:00:00"); d.setDate(d.getDate()+Math.max(1,Number(e.noches)||1)); return isoL(d); })() : null);
    if (!fl||!fs) return;
    if (e.es_individual) {
      if (fl <= diaIso && fs > diaIso) contInd += (e.num_reservas||1);
      return;
    }
    const key = `${fl}|${e.canal||""}|${fs}`;
    const fp  = String(e.fecha_pickup||"").slice(0,10);
    if (!dd[key]||fp>dd[key]._fp) dd[key]={ ...e, _fp: fp, _fs: fs };
  });
  total += contInd + Object.values(dd)
    .filter(e => String(e.fecha_llegada||"").slice(0,10) <= diaIso && e._fs > diaIso)
    .reduce((a, e) => a + (e.num_reservas||1), 0);
  return total;
}
