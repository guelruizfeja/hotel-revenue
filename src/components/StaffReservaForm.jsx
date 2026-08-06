import React, { useState, useEffect } from "react";
import { PieChart, Pie, Cell } from "recharts";
import { C, toNum, NET_HAB_FNB } from "../constants";
import { supabase } from "../supabase";

const CANALES = ["Booking.com","Expedia","Hotels.com","Airbnb","Hotelbeds","Agoda","Trip.com","Directo","Web propia","Tour operador","Agencia de viajes","GDS","Empresa"];

const CANAL_COLORS = {
  "Booking.com":      "#0052CC",
  "Expedia":          "#FFD700",
  "Hotels.com":       "#FF6B00",
  "Airbnb":           "#FF5A5F",
  "Hotelbeds":        "#00897B",
  "Agoda":            "#7C3AED",
  "Trip.com":         "#06B6D4",
  "Directo":          "#111111",
  "Web propia":       "#BDBDBD",
  "Tour operador":    "#F59E0B",
  "Agencia de viajes":"#8B5CF6",
  "GDS":              "#6B7280",
  "Empresa":          "#059669",
};

const inp = { width:"100%", padding:"8px 10px", borderRadius:7, border:`1px solid ${C.border}`, fontSize:13, background:C.bgCard, color:C.text, fontFamily:"inherit", boxSizing:"border-box" };
const lbl = { fontSize:10, color:C.textLight, fontWeight:600, textTransform:"uppercase", letterSpacing:"0.8px", marginBottom:4 };

export function StaffReservaForm({ hotelId, onContinuar }) {
  const _hoy = new Date();
  const hoyISO = `${_hoy.getFullYear()}-${String(_hoy.getMonth()+1).padStart(2,"0")}-${String(_hoy.getDate()).padStart(2,"0")}`;
  const _manana = new Date(); _manana.setDate(_manana.getDate()+1);
  const mananaISO = `${_manana.getFullYear()}-${String(_manana.getMonth()+1).padStart(2,"0")}-${String(_manana.getDate()).padStart(2,"0")}`;

  const formVacio = { canal:"", num_reservas:"1", fecha_llegada:hoyISO, fecha_salida:mananaISO, noches:"1", precio_total:"", numero_reserva:"" };
  const [form, setForm] = useState(formVacio);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");
  const [ok, setOk] = useState(false);
  const [reservasHoy, setReservasHoy] = useState([]);
  const [cargandoLista, setCargandoLista] = useState(true);
  const [notifReserva, setNotifReserva] = useState(null); // { numero } o null

  const cargarReservasHoy = async () => {
    setCargandoLista(true);
    const { data } = await supabase.from("pickup_entries").select("*")
      .eq("hotel_id", hotelId).eq("fecha_pickup", hoyISO);
    setReservasHoy(data || []);
    setCargandoLista(false);
  };

  useEffect(() => { cargarReservasHoy(); }, []);

  const guardar = async () => {
    setGuardando(true); setError("");
    try {
      const noches = form.noches ? parseInt(form.noches) : 1;
      const fechaLlegada = form.fecha_llegada || hoyISO;
      let fechaSalida = form.fecha_salida || null;
      if (!fechaSalida) {
        const d = new Date(fechaLlegada+"T00:00:00"); d.setDate(d.getDate()+noches);
        fechaSalida = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
      }
      const numero_reserva = form.numero_reserva ? parseInt(form.numero_reserva) : null;
      if (numero_reserva) {
        if (reservasHoy.some(r => r.numero_reserva === numero_reserva)) {
          throw new Error(`La reserva #${numero_reserva} ya existe`);
        }
        const { data: dup, error: dupErr } = await supabase.rpc("check_duplicate_reserva", { p_numero_reserva: numero_reserva });
        if (dupErr) throw new Error("No se pudo comprobar el número de reserva. Inténtalo de nuevo.");
        if (dup) throw new Error(`La reserva #${numero_reserva} ya existe`);
      }
      const precioTotalFinal = form.precio_total ? Math.round(toNum(form.precio_total) * NET_HAB_FNB * 100) / 100 : null;
      const row = {
        hotel_id: hotelId, fecha_pickup: hoyISO, fecha_llegada: fechaLlegada,
        canal: form.canal || null, num_reservas: parseInt(form.num_reservas) || 1,
        fecha_salida: fechaSalida, noches, precio_total: precioTotalFinal,
        estado: "confirmada", es_individual: true, numero_reserva,
      };
      const { error: insErr } = await supabase.from("pickup_entries").insert(row);
      if (insErr) throw new Error(insErr.message);
      setOk(true);
      setNotifReserva({ numero: numero_reserva });
      await cargarReservasHoy();
      setTimeout(() => { setOk(false); setForm(formVacio); }, 900);
    } catch (e) { setError(e.message); }
    setGuardando(false);
  };

  // ── Estadísticas de las reservas de hoy (por canal) ──
  const reservasHoyActivas = reservasHoy.filter(r => (r.estado||"confirmada") !== "cancelada");
  const reservasHoyTotal = reservasHoyActivas.reduce((a,r) => a + (r.num_reservas||1), 0);
  const canalStatsHoy = {};
  reservasHoyActivas.forEach(r => {
    const c = r.canal || "Directo";
    if (!canalStatsHoy[c]) canalStatsHoy[c] = { count:0, precioTotal:0, nochesTotal:0, antTotal:0, antCount:0 };
    const nr = r.num_reservas || 1;
    canalStatsHoy[c].count       += nr;
    canalStatsHoy[c].precioTotal += (r.precio_total || 0);
    canalStatsHoy[c].nochesTotal += (r.noches || 0) * nr;
    if (r.fecha_llegada && r.fecha_pickup) {
      const dias = Math.round((new Date(r.fecha_llegada) - new Date(r.fecha_pickup)) / 86400000);
      if (dias >= 0) { canalStatsHoy[c].antTotal += dias * nr; canalStatsHoy[c].antCount += nr; }
    }
  });
  const canalData = Object.entries(canalStatsHoy).map(([canal, d]) => ({
    canal, color: CANAL_COLORS[canal] || C.accent,
    count: d.count,
    adr:   d.nochesTotal > 0 ? Math.round(d.precioTotal / d.nochesTotal) : (d.count > 0 ? Math.round(d.precioTotal / d.count) : null),
    noches: d.count > 0 ? parseFloat((d.nochesTotal / d.count).toFixed(1)) : null,
    antelacion: d.antCount > 0 ? Math.round(d.antTotal / d.antCount) : null,
  })).sort((a,b) => b.count - a.count);
  const totRawHoy = Object.values(canalStatsHoy).reduce((acc, d) => ({
    count: acc.count + d.count, precioTotal: acc.precioTotal + d.precioTotal,
    nochesTotal: acc.nochesTotal + d.nochesTotal, antTotal: acc.antTotal + d.antTotal, antCount: acc.antCount + d.antCount,
  }), { count:0, precioTotal:0, nochesTotal:0, antTotal:0, antCount:0 });
  const globalAdr        = totRawHoy.nochesTotal > 0 ? Math.round(totRawHoy.precioTotal / totRawHoy.nochesTotal) : (totRawHoy.count > 0 ? Math.round(totRawHoy.precioTotal / totRawHoy.count) : null);
  const globalNoches     = totRawHoy.count > 0 ? parseFloat((totRawHoy.nochesTotal / totRawHoy.count).toFixed(1)) : null;
  const globalAntelacion = totRawHoy.antCount > 0 ? Math.round(totRawHoy.antTotal / totRawHoy.antCount) : null;

  return (
    <>
    <div style={{ maxWidth:640, margin:"0 auto", padding:"24px 16px" }}>
      <h2 style={{ fontSize:18, fontWeight:700, color:C.text, marginBottom:4 }}>Alta de reservas de hoy</h2>
      <p style={{ fontSize:12, color:C.textMid, marginBottom:20 }}>Da de alta todas las reservas del día. Cuando termines, pulsa "Continuar a Producción Diaria".</p>

      <div style={{ background:C.bgCard, border:`1px solid ${C.border}`, borderRadius:12, padding:18, marginBottom:20 }}>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
          <div>
            <p style={lbl}>Fecha llegada</p>
            <input type="date" style={inp} value={form.fecha_llegada}
              onChange={e=>{ const v=e.target.value; setForm(f=>({...f, fecha_llegada:v, fecha_salida:"", noches:""})); }}/>
          </div>
          <div>
            <p style={lbl}>Canal</p>
            <select style={inp} value={form.canal} onChange={e=>setForm(f=>({...f,canal:e.target.value}))}>
              <option value="">Seleccionar</option>
              {CANALES.map(c=><option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <p style={lbl}>Habitaciones</p>
            <input type="number" min="1" style={inp} value={form.num_reservas} onChange={e=>setForm(f=>({...f,num_reservas:e.target.value}))}/>
          </div>
          <div>
            <p style={lbl}>Noches</p>
            <input type="number" min="1" style={inp} value={form.noches}
              onChange={e=>{ const v=e.target.value; const d=new Date((form.fecha_llegada||hoyISO)+"T00:00:00"); if(parseInt(v)>0) d.setDate(d.getDate()+parseInt(v)); const p2=n=>String(n).padStart(2,"0"); setForm(f=>({...f, noches:v, fecha_salida: parseInt(v)>0 ? `${d.getFullYear()}-${p2(d.getMonth()+1)}-${p2(d.getDate())}` : ""})); }}/>
          </div>
          <div>
            <p style={lbl}>Fecha salida</p>
            <input type="date" style={inp} value={form.fecha_salida}
              onChange={e=>{ const v=e.target.value; const fl=form.fecha_llegada||hoyISO; const n=v?Math.round((new Date(v+"T00:00:00")-new Date(fl+"T00:00:00"))/86400000):0; setForm(f=>({...f, fecha_salida:v, noches: n>0?String(n):""})); }}/>
          </div>
          <div>
            <p style={lbl}>Precio total €</p>
            <input type="text" inputMode="decimal" style={inp} value={form.precio_total} onChange={e=>setForm(f=>({...f,precio_total:e.target.value}))}/>
          </div>
          <div style={{ gridColumn:"1 / -1" }}>
            <p style={lbl}>Nº de reserva</p>
            <input type="number" min="1" style={inp} value={form.numero_reserva} onChange={e=>setForm(f=>({...f,numero_reserva:e.target.value}))}/>
          </div>
        </div>
        {error && <p style={{ fontSize:12, color:C.red, marginTop:10 }}>{error}</p>}
        {ok && <p style={{ fontSize:12, color:"#1A7A3C", fontWeight:600, marginTop:10 }}>Reserva guardada</p>}
        <button onClick={guardar} disabled={guardando}
          style={{ width:"100%", marginTop:16, padding:"11px 0", borderRadius:8, background:guardando?C.border:C.text, color:"#fff", border:"none", cursor:guardando?"default":"pointer", fontSize:13, fontWeight:700, fontFamily:"inherit" }}>
          {guardando ? "Guardando..." : "Guardar reserva"}
        </button>
      </div>

      {cargandoLista ? (
        <p style={{ fontSize:12, color:C.textLight, marginBottom:20 }}>Cargando...</p>
      ) : (
        <div style={{ background:C.bgCard, border:`1px solid ${C.border}`, borderRadius:12, padding:18, marginBottom:20 }}>
          <div style={{ display:"flex", alignItems:"center", gap:16, marginBottom:20 }}>
            <div style={{ background:"#111", borderRadius:8, padding:"7px 12px", textAlign:"center", flexShrink:0 }}>
              <p style={{ fontSize:20, fontWeight:800, color:"#fff", fontFamily:"'Plus Jakarta Sans',sans-serif", lineHeight:1 }}>{reservasHoyTotal}</p>
              <p style={{ fontSize:8.5, color:"#ffffff", fontWeight:700, textTransform:"uppercase", letterSpacing:0.5, marginTop:3, whiteSpace:"nowrap" }}>Nuevas reservas</p>
            </div>
            <div>
              <p style={{ fontFamily:"'Plus Jakarta Sans',sans-serif", fontWeight:700, fontSize:18, color:C.text }}>Reservas de hoy</p>
            </div>
          </div>

          {reservasHoyTotal === 0 ? (
            <p style={{ color:C.textLight, fontSize:13, textAlign:"center", padding:"20px 0" }}>Aún no has dado de alta ninguna reserva hoy.</p>
          ) : (
            <div style={{ display:"grid", gridTemplateColumns:"2fr 1fr 1fr 1fr", gap:8 }}>

              <div style={{ borderRadius:10, padding:"12px", border:`1.5px solid ${C.border}`, background:C.bg }}>
                <p style={{ fontSize:10, fontWeight:700, textTransform:"uppercase", letterSpacing:1, color:C.textLight, marginBottom:10, whiteSpace:"nowrap" }}>Por canal</p>
                <div style={{ display:"flex", alignItems:"center", gap:16 }}>
                  <PieChart width={90} height={90}>
                    <Pie data={canalData.map(d => ({ name:d.canal, value:d.count, color:d.color }))} cx={40} cy={40} innerRadius={26} outerRadius={42} dataKey="value" strokeWidth={0} isAnimationActive={false}>
                      {canalData.map((d,i) => <Cell key={i} fill={d.color}/>)}
                    </Pie>
                  </PieChart>
                  <div style={{ display:"flex", flexDirection:"column", gap:5, flex:1 }}>
                    {canalData.map(d => (
                      <div key={d.canal} style={{ display:"flex", alignItems:"center", gap:6 }}>
                        <div style={{ width:8, height:8, borderRadius:"50%", background:d.color, flexShrink:0 }}/>
                        <span style={{ fontSize:11, color:C.textMid, flex:1 }}>{d.canal}</span>
                        <span style={{ fontSize:11, fontWeight:700, color:C.text }}>{d.count}</span>
                        <span style={{ fontSize:10, color:C.textLight }}>{Math.round(d.count/reservasHoyTotal*100)}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div style={{ borderRadius:10, padding:"12px", border:`1.5px solid ${C.border}`, background:C.bg }}>
                <p style={{ fontSize:10, fontWeight:700, textTransform:"uppercase", letterSpacing:1, color:C.textLight, marginBottom:10, whiteSpace:"nowrap" }}>Precio medio</p>
                <p style={{ fontSize:24, fontWeight:800, color:C.text, fontFamily:"'Plus Jakarta Sans',sans-serif", lineHeight:1, marginBottom:6 }}>{globalAdr != null ? `€${globalAdr}` : "—"}</p>
                <p style={{ fontSize:10, color:C.textMid, marginBottom:10, whiteSpace:"nowrap" }}>ADR medio</p>
                <div style={{ display:"flex", flexDirection:"column", gap:4 }}>
                  {canalData.map(d => d.adr != null && (
                    <div key={d.canal} style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                      <span style={{ fontSize:10, color:C.textMid }}>{d.canal}</span>
                      <span style={{ fontSize:11, fontWeight:700, color:C.text }}>€{d.adr}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ borderRadius:10, padding:"12px", border:`1.5px solid ${C.border}`, background:C.bg }}>
                <p style={{ fontSize:10, fontWeight:700, textTransform:"uppercase", letterSpacing:1, color:C.textLight, marginBottom:10, whiteSpace:"nowrap" }}>Duración media</p>
                <p style={{ fontSize:24, fontWeight:800, color:C.text, fontFamily:"'Plus Jakarta Sans',sans-serif", lineHeight:1, marginBottom:6 }}>{globalNoches != null ? globalNoches : "—"}</p>
                <p style={{ fontSize:10, color:C.textMid, marginBottom:10, whiteSpace:"nowrap" }}>noches / reserva</p>
                <div style={{ display:"flex", flexDirection:"column", gap:4 }}>
                  {canalData.map(d => d.noches != null && (
                    <div key={d.canal} style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                      <span style={{ fontSize:10, color:C.textMid }}>{d.canal}</span>
                      <span style={{ fontSize:11, fontWeight:700, color:C.text }}>{d.noches}n</span>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ borderRadius:10, padding:"12px", border:`1.5px solid ${C.border}`, background:C.bg }}>
                <p style={{ fontSize:10, fontWeight:700, textTransform:"uppercase", letterSpacing:1, color:C.textLight, marginBottom:10, whiteSpace:"nowrap" }}>Antelación</p>
                <p style={{ fontSize:24, fontWeight:800, color:C.text, fontFamily:"'Plus Jakarta Sans',sans-serif", lineHeight:1, marginBottom:6 }}>{globalAntelacion != null ? globalAntelacion : "—"}</p>
                <p style={{ fontSize:10, color:C.textMid, marginBottom:10, whiteSpace:"nowrap" }}>días de antelación</p>
                <div style={{ display:"flex", flexDirection:"column", gap:4 }}>
                  {canalData.map(d => d.antelacion != null && (
                    <div key={d.canal} style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                      <span style={{ fontSize:10, color:C.textMid }}>{d.canal}</span>
                      <span style={{ fontSize:11, fontWeight:700, color:C.text }}>{d.antelacion}d</span>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}
        </div>
      )}

      <button onClick={onContinuar}
        style={{ width:"100%", padding:"12px 0", borderRadius:8, background:"#111111", color:"#fff", border:"none", cursor:"pointer", fontSize:14, fontWeight:700, fontFamily:"inherit" }}>
        Continuar a Producción Diaria →
      </button>
    </div>

    {/* Notificación flotante: reserva guardada (persiste hasta que el usuario la cierra) — mismo diseño que en Dirección */}
    {notifReserva && (
      <div style={{ position:"fixed", top:64, right:"clamp(12px,4vw,32px)", zIndex:2000, background:"#fff", border:`1px solid ${C.border}`, borderRadius:14, boxShadow:"0 16px 40px rgba(0,0,0,0.16)", padding:"14px 16px", display:"flex", alignItems:"center", gap:12, maxWidth:320, fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
        <div style={{ width:30, height:30, borderRadius:"50%", background:C.greenLight, color:C.green, display:"flex", alignItems:"center", justifyContent:"center", fontSize:16, flexShrink:0 }}>✓</div>
        <p style={{ margin:0, fontSize:13, fontWeight:600, color:C.text, flex:1 }}>{notifReserva.numero != null ? `Reserva número ${notifReserva.numero} guardada` : "Reserva guardada"}</p>
        <button onClick={() => setNotifReserva(null)} style={{ background:"none", border:"none", cursor:"pointer", color:C.textLight, fontSize:15, padding:4, lineHeight:1, flexShrink:0 }}>✕</button>
      </div>
    )}
    </>
  );
}
