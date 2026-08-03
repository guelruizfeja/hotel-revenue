export function calcForecastRevStandalone(mesIdx, anioF, produccion, pickupEntries, hotel) {
  const hoy = new Date();
  const pad = n => String(n).padStart(2, "0");
  const hoyStr   = `${hoy.getFullYear()}-${pad(hoy.getMonth()+1)}-${pad(hoy.getDate())}`;
  const mesStr   = `${anioF}-${pad(mesIdx + 1)}`;
  const mesStrLY = `${anioF - 1}-${pad(mesIdx + 1)}`;
  const ultimoDia  = new Date(anioF, mesIdx + 1, 0);
  if (ultimoDia < new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate())) return null;
  const hoyLY    = `${anioF-1}-${pad(hoy.getMonth()+1)}-${pad(hoy.getDate())}`;
  const finMesLY = `${anioF-1}-${pad(mesIdx+1)}-${pad(ultimoDia.getDate())}`;
  const getNochas = e => { const n=Number(e.noches); if(n>0)return n; if(e.fecha_salida&&e.fecha_llegada){const d=(new Date(String(e.fecha_salida).slice(0,10)+"T00:00:00")-new Date(String(e.fecha_llegada).slice(0,10)+"T00:00:00"))/86400000;return d>0?d:1;}return 1; };
  const getSalidaKey = e => { if(e.fecha_salida)return String(e.fecha_salida).slice(0,10); const n=Number(e.noches); if(n>0&&e.fecha_llegada){const d=new Date(String(e.fecha_llegada).slice(0,10)+"T00:00:00");d.setDate(d.getDate()+n);return d.toISOString().slice(0,10);}return ""; };
  const dedup = es => { const m={}; es.forEach(e=>{const k=`${String(e.fecha_llegada||"").slice(0,10)}|${e.canal||""}|${getSalidaKey(e)}`;const fp=String(e.fecha_pickup||"").slice(0,10);if(!m[k]||fp>m[k]._fp)m[k]={...e,_fp:fp};}); return Object.values(m); };
  const sumNights  = arr => arr.reduce((a,e)=>a+(e.num_reservas||1)*getNochas(e),0);
  const sumRevenue = arr => arr.reduce((a,e)=>a+(e.precio_total||0),0);
  const diasLY   = (produccion||[]).filter(r=>String(r.fecha||"").slice(0,7)===mesStrLY);
  const habOcuLY = diasLY.reduce((a,r)=>a+(r.hab_ocupadas||0),0);
  const revHabLY = diasLY.reduce((a,r)=>a+(r.revenue_hab||0),0);
  const adrLY    = habOcuLY>0?revHabLY/habOcuLY:null;
  let canceladas=0,totales=0;
  for(let m=1;m<=3;m++){const ref=new Date(hoy.getFullYear(),hoy.getMonth()-m,1);const rs=`${ref.getFullYear()}-${pad(ref.getMonth()+1)}`;dedup((pickupEntries||[]).filter(e=>!e._grupo&&String(e.fecha_llegada||"").slice(0,7)===rs)).forEach(e=>{totales++;if((e.estado||"confirmada")==="cancelada")canceladas++;});}
  const cancelRate=totales>20?canceladas/totales:0.08;
  const realPE=(pickupEntries||[]).filter(e=>!e._grupo);
  const otbEntries=dedup(realPE.filter(e=>String(e.fecha_llegada||"").slice(0,7)===mesStr&&String(e.fecha_pickup||"").slice(0,10)<=hoyStr&&(e.estado||"confirmada")!=="cancelada"));
  const netOTBRevenue=sumRevenue(otbEntries)*(1-cancelRate);
  const otbNights=sumNights(otbEntries);
  const lyBase=realPE.filter(e=>String(e.fecha_llegada||"").slice(0,7)===mesStrLY&&(e.estado||"confirmada")!=="cancelada");
  const lyOtb=dedup(lyBase.filter(e=>String(e.fecha_pickup||"").slice(0,10)<=hoyLY));
  const lyAll=dedup(lyBase.filter(e=>String(e.fecha_pickup||"").slice(0,10)<=finMesLY));
  const otbNightsLY=sumNights(lyOtb);
  const etpRevLY=Math.max(0,sumRevenue(lyAll)-sumRevenue(lyOtb));
  const paceFactor=Math.min(1.5,Math.max(0.5,otbNightsLY>3?otbNights/otbNightsLY:1));
  const etpRev=etpRevLY>0?Math.round(etpRevLY*paceFactor):(adrLY?Math.round(Math.max(0,sumNights(lyAll)-otbNightsLY)*paceFactor*adrLY):0);
  const forecastRev=Math.round(netOTBRevenue+etpRev);
  return forecastRev>0?forecastRev:null;
}

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

// Revenue total por noche (prorrateado), en el mismo esquema que buildHabEnCasaMap.
// Dividiendo revEnCasaMap[iso] / habEnCasaMap[iso] se obtiene el ADR de ese día.
export function buildRevEnCasaMap(pickupEntries, grupos) {
  const map = {};
  const pad = n => String(n).padStart(2, "0");
  const isoL = d => `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
  const addRange = (fl, fs, revPerNight) => {
    let d = new Date(fl+"T00:00:00");
    const end = new Date(fs+"T00:00:00");
    while (d < end) { const iso=isoL(d); map[iso]=(map[iso]||0)+revPerNight; d.setDate(d.getDate()+1); }
  };
  (grupos||[]).filter(g => g.estado==="confirmado" && g.habitaciones>0 && g.fecha_inicio && g.fecha_fin)
    .forEach(g => addRange(g.fecha_inicio, g.fecha_fin, (g.habitaciones||0) * (g.adr_grupo||0)));
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
    const noches = Math.max(1, (new Date(fs+"T00:00:00")-new Date(fl+"T00:00:00"))/86400000);
    const revPerNight = (e.precio_total||0) / noches;
    if (e.es_individual) { addRange(fl, fs, revPerNight); return; }
    const key = `${fl}|${e.canal||""}|${fs}`;
    const fp  = String(e.fecha_pickup||"").slice(0,10);
    if (!dd[key]||fp>dd[key]._fp) dd[key]={ fl, fs, revPerNight, _fp: fp };
  });
  Object.values(dd).forEach(({ fl, fs, revPerNight }) => addRange(fl, fs, revPerNight));
  return map;
}

export function parseEventoSala(notas) {
  if (!notas) return "";
  const m = notas.match(/^\[ev:([^\]]*)\]/);
  if (!m) return "";
  const p = Object.fromEntries(m[1].split(",").map(x => x.split("=")));
  return p.sala || "";
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
