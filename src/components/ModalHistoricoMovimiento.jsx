import { useState, useMemo, useEffect } from "react";
import { C } from "../constants";
import { CustomTooltip } from "./charts";
import { buildHabEnCasaMap } from "../utils";
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const MESES_FULL = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];

const VISTAS = [
  { key:"entradas",  label:"Entradas",  color:"#10B981" },
  { key:"salidas",   label:"Salidas",   color:"#EF4444" },
  { key:"ocupacion", label:"Ocupación", color:"#004B87" },
];

const navBtnStyle = {
  width:30, height:30, borderRadius:8, border:`1px solid ${C.border}`, background:"transparent",
  color:C.textMid, fontSize:16, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center",
};

export function ModalHistoricoMovimiento({ datos, mesInicial, anioInicial, onClose }) {
  const [mesSel, setMesSel] = useState(mesInicial);
  const [anioSel, setAnioSel] = useState(anioInicial);
  const [vista, setVista] = useState("entradas");

  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const pickupEntries = datos.pickupEntries || [];
  const grupos = datos.grupos || [];
  const produccion = datos.produccion || [];

  const habEnCasaMap = useMemo(() => buildHabEnCasaMap(pickupEntries, grupos), [pickupEntries, grupos]);

  const getFechaSalida = e => {
    if (e.fecha_salida) return String(e.fecha_salida).slice(0,10);
    if (e.noches && e.fecha_llegada) {
      const d = new Date(e.fecha_llegada); d.setDate(d.getDate() + Number(e.noches));
      return d.toISOString().slice(0,10);
    }
    return null;
  };

  const activas = useMemo(() => {
    const todasActivas = pickupEntries.filter(e => !e._grupo && (e.estado||"confirmada") !== "cancelada" && (e.estado||"confirmada") !== "tentativo");
    const _dedup = {};
    const _ind = [];
    todasActivas.forEach(e => {
      const fl = String(e.fecha_llegada||"").slice(0,10);
      const fs = getFechaSalida(e) || "";
      if (e.es_individual) { _ind.push(e); return; }
      const key = `${fl}|${e.canal||""}|${fs}`;
      const fp  = String(e.fecha_pickup||"").slice(0,10);
      if (!_dedup[key] || fp > _dedup[key]._fp) _dedup[key] = { ...e, _fp: fp };
    });
    return [..._ind, ...Object.values(_dedup)];
  }, [pickupEntries]);

  const gruposMov = useMemo(() => grupos.filter(g => g.estado==="confirmado" && g.habitaciones>0 && g.fecha_inicio && g.fecha_fin), [grupos]);
  const habGrupos = (fechaStr, campo) => gruposMov.filter(g => String(g[campo]).slice(0,10) === fechaStr).reduce((a,g)=>a+(g.habitaciones||0),0);

  const habH = (datos.hotel?.habitaciones && datos.hotel.habitaciones > 0)
    ? datos.hotel.habitaciones
    : (produccion.length > 0 ? Math.round(produccion.reduce((a,r)=>a+(r.hab_disponibles||0),0)/produccion.length) : 30);

  const pad2 = n => String(n).padStart(2,"0");
  const diasEnMes = new Date(anioSel, mesSel+1, 0).getDate();

  const chartData = useMemo(() => {
    return Array.from({ length: diasEnMes }, (_, i) => {
      const d = i+1;
      const fechaStr = `${anioSel}-${pad2(mesSel+1)}-${pad2(d)}`;
      const entradas = activas.filter(e => String(e.fecha_llegada||"").slice(0,10) === fechaStr).reduce((a,e)=>a+(e.num_reservas||1),0) + habGrupos(fechaStr, "fecha_inicio");
      const salidas  = activas.filter(e => getFechaSalida(e) === fechaStr).reduce((a,e)=>a+(e.num_reservas||1),0) + habGrupos(fechaStr, "fecha_fin");
      const prodDia = produccion.find(p => p.fecha === fechaStr);
      const ocupacion = prodDia?.hab_disponibles > 0
        ? Math.round(prodDia.hab_ocupadas / prodDia.hab_disponibles * 100)
        : (habH > 0 ? Math.round((habEnCasaMap[fechaStr]||0) / habH * 100) : null);
      const fechaLabel = new Date(fechaStr+"T00:00:00").toLocaleDateString("es-ES", { day:"numeric", month:"long", year:"numeric" });
      return { dia: d, fecha: fechaLabel, entradas, salidas, ocupacion };
    });
  }, [anioSel, mesSel, diasEnMes, activas, gruposMov, produccion, habEnCasaMap, habH]);

  const totalEntradas = chartData.reduce((a,d)=>a+d.entradas,0);
  const totalSalidas  = chartData.reduce((a,d)=>a+d.salidas,0);
  const ocupDias = chartData.filter(d=>d.ocupacion!=null);
  const mediaOcup = ocupDias.length>0 ? Math.round(ocupDias.reduce((a,d)=>a+d.ocupacion,0)/ocupDias.length) : null;

  const vistaActiva = VISTAS.find(v=>v.key===vista);
  const resumen = vista==="entradas" ? { label:"Total entradas", value:totalEntradas }
    : vista==="salidas" ? { label:"Total salidas", value:totalSalidas }
    : { label:"Ocupación media", value: mediaOcup!=null ? `${mediaOcup}%` : "—" };

  const cambiarMes = (delta) => {
    let m = mesSel + delta, a = anioSel;
    if (m < 0) { m = 11; a--; }
    if (m > 11) { m = 0; a++; }
    setMesSel(m); setAnioSel(a);
  };

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.5)", zIndex:1000, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }} onClick={onClose}>
      <div style={{ background:C.bgCard, borderRadius:14, width:"100%", maxWidth:760, maxHeight:"90vh", overflow:"auto", padding:28, boxShadow:"0 20px 60px rgba(0,0,0,0.2)" }} onClick={e=>e.stopPropagation()}>

        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
          <div>
            <p style={{ fontSize:11, color:C.textLight, textTransform:"uppercase", letterSpacing:2 }}>Movimiento Operativo</p>
            <h3 style={{ fontSize:22, fontWeight:800, color:C.text, fontFamily:"'Plus Jakarta Sans',sans-serif", letterSpacing:-0.5 }}>Histórico</h3>
          </div>
          <button onClick={onClose} style={{ background:"none", border:`1.5px solid ${C.border}`, borderRadius:8, width:34, height:34, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", fontSize:16, color:C.textMid, fontWeight:300, transition:"all 0.15s" }}
            onMouseEnter={e=>{ e.currentTarget.style.background=C.accent; e.currentTarget.style.borderColor=C.accent; e.currentTarget.style.color="#fff"; }}
            onMouseLeave={e=>{ e.currentTarget.style.background="none"; e.currentTarget.style.borderColor=C.border; e.currentTarget.style.color=C.textMid; }}>
            ×
          </button>
        </div>

        {/* Selector de mes */}
        <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:14, marginBottom:18 }}>
          <button onClick={() => cambiarMes(-1)} style={navBtnStyle}>‹</button>
          <p style={{ fontSize:15, fontWeight:700, color:C.text, minWidth:150, textAlign:"center" }}>{MESES_FULL[mesSel]} {anioSel}</p>
          <button onClick={() => cambiarMes(1)} style={navBtnStyle}>›</button>
        </div>

        {/* Toggles */}
        <div style={{ display:"flex", gap:8, marginBottom:20, justifyContent:"center" }}>
          {VISTAS.map(v => (
            <button key={v.key} onClick={()=>setVista(v.key)}
              style={{ padding:"7px 16px", borderRadius:8, border:`1.5px solid ${vista===v.key?v.color:C.border}`, background:vista===v.key?`${v.color}15`:"transparent", color:vista===v.key?v.color:C.textLight, fontSize:12.5, fontWeight:700, cursor:"pointer", fontFamily:"'Plus Jakarta Sans',sans-serif", transition:"all 0.15s" }}>
              {v.label}
            </button>
          ))}
        </div>

        {/* Resumen */}
        <div style={{ background:"#f5f5f5", border:"1.5px solid #111111", borderRadius:8, padding:"14px 18px", marginBottom:20, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", textAlign:"center" }}>
          <p style={{ fontSize:11, color:C.text, textTransform:"uppercase", letterSpacing:"1.5px", marginBottom:6, fontWeight:700 }}>{resumen.label}</p>
          <p style={{ fontSize:"clamp(20px,4vw,26px)", fontWeight:700, color:vistaActiva.color, fontFamily:"'Plus Jakarta Sans',sans-serif", letterSpacing:"-1px", lineHeight:1, margin:0 }}>{resumen.value}</p>
        </div>

        {/* Gráfico */}
        <ResponsiveContainer width="100%" height={260}>
          {vista === "ocupacion" ? (
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="gradOcupHist" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#004B87" stopOpacity={0.25}/>
                  <stop offset="95%" stopColor="#004B87" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={C.border} vertical={false}/>
              <XAxis dataKey="dia" tick={{ fill:C.textLight, fontSize:10 }} axisLine={false} tickLine={false} interval={Math.ceil(diasEnMes/10)-1}/>
              <YAxis tick={{ fill:C.textLight, fontSize:10 }} axisLine={false} tickLine={false} unit="%" domain={[0,100]} width={38}/>
              <Tooltip content={<CustomTooltip unit="%"/>} cursor={false}/>
              <Area type="monotone" dataKey="ocupacion" name="Ocupación" stroke="#004B87" strokeWidth={2} fill="url(#gradOcupHist)" dot={{fill:"#004B87",r:2}} activeDot={{r:4}} connectNulls isAnimationActive={false}/>
            </AreaChart>
          ) : (
            <BarChart data={chartData} barSize={10} barCategoryGap="25%">
              <defs>
                <linearGradient id="gradMovHist" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={vistaActiva.color} stopOpacity={0.95}/>
                  <stop offset="100%" stopColor={vistaActiva.color} stopOpacity={0.6}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={C.border} vertical={false}/>
              <XAxis dataKey="dia" tick={{ fill:C.textLight, fontSize:10 }} axisLine={false} tickLine={false} interval={Math.ceil(diasEnMes/10)-1}/>
              <YAxis tick={{ fill:C.textLight, fontSize:10 }} axisLine={false} tickLine={false} allowDecimals={false} width={30}/>
              <Tooltip content={<CustomTooltip unit="num"/>} cursor={false}/>
              <Bar dataKey={vista} name={vistaActiva.label} fill="url(#gradMovHist)" radius={[4,4,0,0]} isAnimationActive={false}/>
            </BarChart>
          )}
        </ResponsiveContainer>

      </div>
    </div>
  );
}
