import React, { useState, useEffect } from "react";
import { C, toNum, dmy, NET_HAB_FNB } from "../constants";
import { supabase } from "../supabase";

const CANALES = ["Booking.com","Expedia","Hotels.com","Airbnb","Hotelbeds","Agoda","Trip.com","Directo","Web propia","Tour operador","Agencia de viajes","GDS","Empresa"];

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
      await cargarReservasHoy();
      setTimeout(() => { setOk(false); setForm(formVacio); }, 900);
    } catch (e) { setError(e.message); }
    setGuardando(false);
  };

  return (
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

      <p style={{ fontSize:12, fontWeight:700, color:C.text, marginBottom:8 }}>Reservas de hoy ({reservasHoy.length})</p>
      {cargandoLista ? (
        <p style={{ fontSize:12, color:C.textLight }}>Cargando...</p>
      ) : reservasHoy.length === 0 ? (
        <p style={{ fontSize:12, color:C.textLight, padding:"12px 0" }}>Aún no has dado de alta ninguna reserva hoy.</p>
      ) : (
        <div style={{ border:`1px solid ${C.border}`, borderRadius:10, overflow:"hidden", marginBottom:20 }}>
          {reservasHoy.map((r,i) => (
            <div key={r.id} style={{ display:"flex", justifyContent:"space-between", padding:"10px 14px", borderBottom: i<reservasHoy.length-1 ? `1px solid ${C.border}` : "none" }}>
              <div>
                <p style={{ fontSize:12, fontWeight:600, color:C.text, margin:0 }}>
                  {r.numero_reserva && <span style={{ fontSize:13, fontWeight:800 }}>#{r.numero_reserva}</span>}
                  {r.numero_reserva && r.canal && " · "}
                  {r.canal || (!r.numero_reserva ? "—" : "")}
                </p>
                <p style={{ fontSize:11, color:C.textMid, margin:0 }}>Llegada {dmy(r.fecha_llegada)} · {r.noches||"—"}n · {r.num_reservas||1} hab.</p>
              </div>
            </div>
          ))}
        </div>
      )}

      <button onClick={onContinuar}
        style={{ width:"100%", padding:"12px 0", borderRadius:8, background:"#0A2540", color:"#fff", border:"none", cursor:"pointer", fontSize:14, fontWeight:700, fontFamily:"inherit" }}>
        Continuar a Producción Diaria →
      </button>
    </div>
  );
}
