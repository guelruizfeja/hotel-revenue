import { useState, useEffect, useRef } from "react";
import { supabase } from "./supabase";
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line, ComposedChart,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  PieChart, Pie, Cell,
} from "recharts";

const C = {
  bg: "#FDFDFD", bgCard: "#FFFFFF", bgDeep: "#111111",
  accent: "#004B87", accentLight: "#E8F0F9", accentDark: "#003366",
  text: "#1A1A1A", textMid: "#555555", textLight: "#888888",
  border: "#E0E0E0", green: "#009F4D", greenLight: "#E6F7EE",
  red: "#D32F2F", redLight: "#FDECEA", blue: "#004B87",
};

const MESES = ["Enero","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
const MESES_CORTO = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
const MESES_FULL = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "#fff", borderRadius: 8, padding: "10px 14px", fontSize: 12, color: C.text, border: `1px solid ${C.border}`, boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}>
      <p style={{ color: C.accent, fontWeight: 700, marginBottom: 6 }}>{payload[0]?.payload?.fecha || label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: C.textMid, margin: "2px 0" }}>
          {p.name}: <b style={{ color: C.text }}>{p.value}</b>
        </p>
      ))}
    </div>
  );
};

function Card({ children, style = {} }) {
  return (
    <div style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 10, padding: "22px 24px", ...style }}>
      {children}
    </div>
  );
}


// ─── KPI MODAL ───────────────────────────────────────────────────
function KpiModal({ kpi, datos, mes, anio, onClose }) {
  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);
  const { produccion, presupuesto } = datos;
  const MESES_FULL = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];

  // Datos diarios del mes
  const diasMes = (produccion||[])
    .filter(d => { const f=new Date(d.fecha+"T00:00:00"); return f.getMonth()===mes && f.getFullYear()===anio; })
    .sort((a,b)=>new Date(a.fecha)-new Date(b.fecha))
    .map(d => {
      const f = new Date(d.fecha+"T00:00:00");
      const habDis = d.hab_disponibles||30;
      return {
        dia: f.getDate(),
        diaSemana: f.getDay(),
        fecha: f.toLocaleDateString("es-ES",{weekday:"short",day:"numeric",month:"short"}),
        occ:    habDis>0 ? Math.round(d.hab_ocupadas/habDis*100) : 0,
        adr:    d.hab_ocupadas>0 ? Math.round(d.revenue_hab/d.hab_ocupadas) : 0,
        revpar: habDis>0 ? Math.round(d.revenue_hab/habDis) : 0,
        trevpar:habDis>0 ? Math.round((d.revenue_hab+(d.revenue_fnb||0)+(d.revenue_otros||0))/habDis) : 0,
        revHab: Math.round(d.revenue_hab||0),
        revFnb: Math.round(d.revenue_fnb||0),
        revOtros: Math.round(d.revenue_otros||0),
        revTotal: Math.round(d.revenue_total||0),
      };
    });

  // Mismo mes año anterior
  const diasLY = (produccion||[])
    .filter(d => { const f=new Date(d.fecha+"T00:00:00"); return f.getMonth()===mes && f.getFullYear()===anio-1; })
    .sort((a,b)=>new Date(a.fecha)-new Date(b.fecha))
    .map(d => {
      const habDis=d.hab_disponibles||30;
      return {
        dia: new Date(d.fecha+"T00:00:00").getDate(),
        occ: habDis>0?Math.round(d.hab_ocupadas/habDis*100):0,
        adr: d.hab_ocupadas>0?Math.round(d.revenue_hab/d.hab_ocupadas):0,
        revpar: habDis>0?Math.round(d.revenue_hab/habDis):0,
        trevpar: habDis>0?Math.round((d.revenue_hab+(d.revenue_fnb||0)+(d.revenue_otros||0))/habDis):0,
        revTotal: Math.round(d.revenue_total||0),
      };
    });

  // Presupuesto mes
  const ppto = (presupuesto||[]).find(p=>p.mes===mes+1&&p.anio===anio);

  // Métricas según KPI
  const getChartData = () => {
    if (kpi==="Ocupación") return diasMes.map((d,i)=>({...d, ly: diasLY[i]?.occ}));
    if (kpi==="ADR")       return diasMes.map((d,i)=>({...d, ly: diasLY[i]?.adr}));
    if (kpi==="RevPAR")    return diasMes.map((d,i)=>({...d, ly: diasLY[i]?.revpar}));
    if (kpi==="TRevPAR")   return diasMes.map(d=>d);
    if (kpi==="Revenue Total") return diasMes.map(d=>d);
    return diasMes;
  };
  const chartData = getChartData();

  const mediaActual = diasMes.length>0 ? diasMes.reduce((a,d)=>a+(d[kpi==="Ocupación"?"occ":kpi==="ADR"?"adr":kpi==="RevPAR"?"revpar":kpi==="TRevPAR"?"trevpar":"revTotal"]||0),0)/diasMes.length : 0;
  const mediaLY = diasLY.length>0 ? diasLY.reduce((a,d)=>a+(d[kpi==="Ocupación"?"occ":kpi==="ADR"?"adr":kpi==="RevPAR"?"revpar":kpi==="TRevPAR"?"trevpar":"revTotal"]||0),0)/diasLY.length : 0;
  const varLY = mediaLY>0?((mediaActual-mediaLY)/mediaLY*100).toFixed(1):null;
  const fieldKey = kpi==="Ocupación"?"occ":kpi==="ADR"?"adr":kpi==="RevPAR"?"revpar":kpi==="TRevPAR"?"trevpar":"revTotal";
  const mejorDia = diasMes.length>0?diasMes.reduce((a,b)=>a[fieldKey]>b[fieldKey]?a:b):null;
  const peorDia  = diasMes.length>0?diasMes.reduce((a,b)=>a[fieldKey]<b[fieldKey]?a:b):null;

  const pptoVal = kpi==="Ocupación"?ppto?.occ_ppto:kpi==="ADR"?ppto?.adr_ppto:kpi==="RevPAR"?ppto?.revpar_ppto:kpi==="Revenue Total"?ppto?.rev_total_ppto:null;
  const varPpto = pptoVal&&mediaActual?((mediaActual-pptoVal)/pptoVal*100).toFixed(1):null;

  const unit = kpi==="Ocupación"?"%":"€";

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.5)", zIndex:1000, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
      <div style={{ background:C.bgCard, borderRadius:14, width:"100%", maxWidth:820, maxHeight:"90vh", overflow:"auto", padding:28, boxShadow:"0 20px 60px rgba(0,0,0,0.2)" }} onClick={e=>e.stopPropagation()}>

        {/* Header modal */}
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
          <div>
            <p style={{ fontSize:11, color:C.textLight, textTransform:"uppercase", letterSpacing:2 }}>{MESES_FULL[mes]} {anio}</p>
            <h3 style={{ fontSize:22, fontWeight:800, color:C.text, fontFamily:"'DM Sans',sans-serif", letterSpacing:-0.5 }}>{kpi}</h3>
          </div>
          <button onClick={onClose} style={{ background:"none", border:`1.5px solid ${C.border}`, borderRadius:8, width:34, height:34, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", fontSize:16, color:C.textMid, fontWeight:300, transition:"all 0.15s" }}
            onMouseEnter={e=>{ e.currentTarget.style.background=C.accent; e.currentTarget.style.borderColor=C.accent; e.currentTarget.style.color="#fff"; }}
            onMouseLeave={e=>{ e.currentTarget.style.background="none"; e.currentTarget.style.borderColor=C.border; e.currentTarget.style.color=C.textMid; }}>
            ×
          </button>
        </div>

        {/* 3 KPIs rápidos */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:12, marginBottom:20 }}>
          {[
            { label:"Media del mes", value:`${kpi==="Ocupación"?mediaActual.toFixed(1):Math.round(mediaActual).toLocaleString("es-ES")}${unit}` },
            { label:`Vs ${anio-1}`, value: varLY!==null ? `${parseFloat(varLY)>=0?"+":""}${varLY}%` : "Sin datos", up: varLY!==null?parseFloat(varLY)>=0:true },
            ...(kpi!=="TRevPAR" ? [{ label:"Vs Presupuesto", value: varPpto!==null ? `${parseFloat(varPpto)>=0?"+":""}${varPpto}%` : "Sin datos ppto", up: varPpto!==null?parseFloat(varPpto)>=0:true }] : []),
          ].map((k,i)=>(
            <div key={i} style={{ background:C.bg, borderRadius:8, padding:"14px 16px", borderLeft:`3px solid ${C.accent}` }}>
              <p style={{ fontSize:10, color:C.textLight, textTransform:"uppercase", letterSpacing:1.5, marginBottom:6 }}>{k.label}</p>
              <p style={{ fontSize:20, fontWeight:700, color:k.up===false?C.red:k.up===true?C.green:C.text, fontFamily:"'DM Sans',sans-serif" }}>{k.value}</p>
            </div>
          ))}
        </div>

        {/* Gráfica */}
        <div style={{ marginBottom:16 }}>
          <p style={{ fontSize:12, fontWeight:600, color:C.textMid, marginBottom:10, textTransform:"uppercase", letterSpacing:1 }}>
            {kpi==="TRevPAR" ? "Desglose de ingresos del mes" : `Evolución diaria${diasLY.length>0?" vs año anterior":""}`}
          </p>
          {kpi==="TRevPAR" ? (() => {
            const totalHab  = diasMes.reduce((a,d)=>a+d.revHab,0);
            const totalFnb  = diasMes.reduce((a,d)=>a+d.revFnb,0);
            const totalOtros= diasMes.reduce((a,d)=>a+d.revOtros,0);
            const total     = totalHab+totalFnb+totalOtros;
            const pieData   = [
              { name:"Habitaciones", value:totalHab,   pct: total>0?Math.round(totalHab/total*100):0 },
              { name:"F&B",          value:totalFnb,   pct: total>0?Math.round(totalFnb/total*100):0 },
              { name:"Otros",        value:totalOtros, pct: total>0?Math.round(totalOtros/total*100):0 },
            ].filter(d=>d.value>0);
            const PIE_COLORS = [C.accent, "#E85D04", C.green];
            return (
              <div style={{ display:"flex", alignItems:"center", gap:24 }}>
                <PieChart width={200} height={200}>
                  <Pie data={pieData} cx={95} cy={95} innerRadius={55} outerRadius={90} paddingAngle={3} dataKey="value">
                    {pieData.map((_,i)=><Cell key={i} fill={PIE_COLORS[i]}/>)}
                  </Pie>
                  <Tooltip formatter={(v)=>`€${Math.round(v).toLocaleString("es-ES")}`}/>
                </PieChart>
                <div style={{ flex:1 }}>
                  {pieData.map((d,i)=>(
                    <div key={i} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"10px 0", borderBottom:`1px solid ${C.border}` }}>
                      <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                        <div style={{ width:10, height:10, borderRadius:"50%", background:PIE_COLORS[i], flexShrink:0 }}/>
                        <p style={{ fontSize:13, fontWeight:600, color:C.text }}>{d.name}</p>
                      </div>
                      <div style={{ textAlign:"right" }}>
                        <p style={{ fontSize:13, fontWeight:700, color:C.text }}>€{Math.round(d.value).toLocaleString("es-ES")}</p>
                        <p style={{ fontSize:11, color:C.textLight }}>{d.pct}%</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })() : kpi==="Revenue Total" ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={diasMes} barSize={8}>
                <CartesianGrid strokeDasharray="3 3" stroke={C.border} vertical={false}/>
                <XAxis dataKey="dia" tick={{fill:C.textLight,fontSize:10}} axisLine={false} tickLine={false}/>
                <YAxis tick={{fill:C.textLight,fontSize:10}} axisLine={false} tickLine={false} unit="€"/>
                <Tooltip content={<CustomTooltip/>}/>
                <Bar dataKey="revHab"   name="Hab."   stackId="a" fill={C.accent} radius={[0,0,0,0]}/>
                <Bar dataKey="revFnb"   name="F&B"    stackId="a" fill="#E85D04" radius={[0,0,0,0]}/>
                <Bar dataKey="revOtros" name="Otros"  stackId="a" fill={C.green} radius={[2,2,0,0]}/>
              </BarChart>
            </ResponsiveContainer>
          ) : kpi!=="TRevPAR" ? (
            <ResponsiveContainer width="100%" height={220}>
              <ComposedChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke={C.border} vertical={false}/>
                <XAxis dataKey="dia" tick={{fill:C.textLight,fontSize:10}} axisLine={false} tickLine={false}/>
                <YAxis tick={{fill:C.textLight,fontSize:10}} axisLine={false} tickLine={false} unit={unit}/>
                <Tooltip content={<CustomTooltip/>}/>
                <Area type="monotone" dataKey={fieldKey} name={kpi} stroke={C.accent} strokeWidth={2} fill={`${C.accent}15`} dot={false}/>
                {diasLY.length>0 && <Line type="monotone" dataKey="ly" name={`${anio-1}`} stroke="#E85D04" strokeWidth={1.5} dot={false} strokeDasharray="4 3"/>}
              </ComposedChart>
            </ResponsiveContainer>
          ) : null}
        </div>

        {/* Mejor y peor día / días semana */}
        {mejorDia && peorDia && (
          kpi === "Ocupación" ? (() => {
            const DIAS_SEM = ["Domingo","Lunes","Martes","Miércoles","Jueves","Viernes","Sábado"];
            const mediasPorDia = DIAS_SEM.map((nombre,idx)=>{
              const vals = diasMes.filter(d=>d.diaSemana===idx);
              const media = vals.length>0 ? vals.reduce((a,b)=>a+b.occ,0)/vals.length : 0;
              return { nombre, media };
            }).filter(d=>d.media>0).sort((a,b)=>b.media-a.media);
            const top2    = mediasPorDia.slice(0,2).map(d=>d.nombre);
            const bottom2 = mediasPorDia.slice(-2).map(d=>d.nombre);
            return (
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
                <div style={{ background:C.greenLight, borderRadius:8, padding:"14px 16px", borderLeft:`3px solid ${C.green}` }}>
                  <p style={{ fontSize:10, color:C.green, textTransform:"uppercase", letterSpacing:1.5, fontWeight:700, marginBottom:8 }}>Mayor ocupación</p>
                  <p style={{ fontSize:16, fontWeight:700, color:C.text, fontFamily:"'DM Sans',sans-serif" }}>{top2.join(" y ")}</p>
                </div>
                <div style={{ background:C.redLight, borderRadius:8, padding:"14px 16px", borderLeft:`3px solid ${C.red}` }}>
                  <p style={{ fontSize:10, color:C.red, textTransform:"uppercase", letterSpacing:1.5, fontWeight:700, marginBottom:8 }}>Menor ocupación</p>
                  <p style={{ fontSize:16, fontWeight:700, color:C.text, fontFamily:"'DM Sans',sans-serif" }}>{bottom2.join(" y ")}</p>
                </div>
              </div>
            );
          })() : (
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
            <div style={{ background:C.greenLight, borderRadius:8, padding:"12px 16px" }}>
              <p style={{ fontSize:10, color:C.green, textTransform:"uppercase", letterSpacing:1.5, fontWeight:700 }}>Mejor día</p>
              <p style={{ fontSize:16, fontWeight:700, color:C.text, marginTop:4 }}>Día {mejorDia.dia} — {mejorDia[fieldKey]}{unit}</p>
              <p style={{ fontSize:11, color:C.textLight, marginTop:2 }}>{mejorDia.fecha}</p>
            </div>
            <div style={{ background:C.redLight, borderRadius:8, padding:"12px 16px" }}>
              <p style={{ fontSize:10, color:C.red, textTransform:"uppercase", letterSpacing:1.5, fontWeight:700 }}>Peor día</p>
              <p style={{ fontSize:16, fontWeight:700, color:C.text, marginTop:4 }}>Día {peorDia.dia} — {peorDia[fieldKey]}{unit}</p>
              <p style={{ fontSize:11, color:C.textLight, marginTop:2 }}>{peorDia.fecha}</p>
            </div>
          </div>
          )
        )}
      </div>
    </div>
  );
}

function KpiCard({ label, value, change, sub, up, i, onClick }) {
  return (
    <div onClick={onClick} style={{
      background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 10,
      padding: "20px 22px", animation: `fadeUp 0.5s ease ${i * 0.08}s both`,
      borderLeft: `3px solid ${C.accent}`, position: "relative", overflow: "hidden",
      boxShadow: "0 1px 4px rgba(0,0,0,0.06)", cursor: "pointer",
      transition: "box-shadow 0.15s, transform 0.15s",
    }}
    onMouseEnter={e=>{ e.currentTarget.style.boxShadow="0 4px 16px rgba(0,75,135,0.12)"; e.currentTarget.style.transform="translateY(-2px)"; }}
    onMouseLeave={e=>{ e.currentTarget.style.boxShadow="0 1px 4px rgba(0,0,0,0.06)"; e.currentTarget.style.transform="translateY(0)"; }}>
      <div style={{ display: "none" }} />
      <p style={{ fontSize: 12, color: C.textMid, textTransform: "uppercase", letterSpacing: "1.5px", fontWeight: 700 }}>{label}</p>
      <p style={{ fontSize: 30, fontWeight: 700, fontFamily: "'DM Sans', sans-serif", color: C.text, margin: "10px 0 6px", letterSpacing: "-1px", lineHeight: 1 }}>{value}</p>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 4, background: up ? C.greenLight : C.redLight, color: up ? C.green : C.red }}>{change}</span>
        <span style={{ fontSize: 11, color: C.textLight }}>{sub}</span>
      </div>
    </div>
  );
}

function PeriodSelectorInline({ mes, anio, onChange, aniosDisponibles }) {
  const hoy = new Date();
  const anioMax = hoy.getFullYear();
  const anios = aniosDisponibles && aniosDisponibles.length > 0 ? aniosDisponibles : [anioMax];
  const MESES_C = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];

  const anioAnterior = () => {
    const idx = anios.indexOf(anio);
    if (idx > 0) onChange(mes, anios[idx-1]);
  };
  const anioSiguiente = () => {
    const idx = anios.indexOf(anio);
    if (idx < anios.length-1) onChange(mes, anios[idx+1]);
  };
  const puedeAnterior = anios.indexOf(anio) > 0;
  const puedeSiguiente = anios.indexOf(anio) < anios.length-1;
  const btnFlecha = (activo) => ({ background:"none", border:`1px solid ${activo?C.border:"transparent"}`, borderRadius:6, width:22, height:22, cursor:activo?"pointer":"default", color:activo?C.textMid:C.border, fontSize:13, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 });

  return (
    <div style={{ userSelect:"none" }}>
      {/* Cabecera año con flechas */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:10, marginBottom:8 }}>
        <button onClick={anioAnterior} style={btnFlecha(puedeAnterior)}>‹</button>
        <p style={{ fontSize:13, fontWeight:700, color:C.text, fontFamily:"'DM Sans',sans-serif", minWidth:36, textAlign:"center" }}>{anio}</p>
        <button onClick={anioSiguiente} style={btnFlecha(puedeSiguiente)}>›</button>
      </div>
      {/* Grid 4x3 meses */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:4 }}>
        {MESES_C.map((m, i) => {
          const futuro = anio === anioMax && i > hoy.getMonth();
          const activo = i === mes;
          const esHoyMes = i === hoy.getMonth() && anio === hoy.getFullYear();
          return (
            <button key={i} onClick={() => !futuro && onChange(i, anio)}
              style={{
                padding: "5px 4px",
                borderRadius: 6,
                border: esHoyMes && !activo ? `1.5px solid ${C.accent}44` : `1px solid ${activo?C.accent:"transparent"}`,
                background: activo ? C.accent : "transparent",
                color: futuro ? C.border : activo ? "#fff" : C.textMid,
                fontSize: 11, fontWeight: activo ? 700 : 400,
                cursor: futuro ? "not-allowed" : "pointer",
                fontFamily: "'DM Sans',sans-serif",
                textAlign: "center",
                transition: "all 0.1s",
              }}>
              {m}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function PeriodSelector({ mes, anio, onChange }) {
  const hoy = new Date();
  const anioMin = hoy.getFullYear() - 3;
  const anioMax = hoy.getFullYear();
  const anios = Array.from({ length: anioMax - anioMin + 1 }, (_, i) => anioMin + i);
  const MESES_CORTOS = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];

  return (
    <div style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 10, padding: "14px 16px", display: "inline-block" }}>
      {/* Selector de año */}
      <div style={{ display: "flex", justifyContent: "center", gap: 6, marginBottom: 10 }}>
        {anios.map(a => (
          <button key={a} onClick={() => onChange(mes, a)} style={{ padding: "4px 12px", borderRadius: 8, border: `1.5px solid ${a === anio ? C.accent : C.border}`, background: a === anio ? C.accent : "transparent", color: a === anio ? "#fff" : C.textMid, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>{a}</button>
        ))}
      </div>
      {/* Grid de meses */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 5 }}>
        {MESES_CORTOS.map((m, i) => {
          const futuro = anio === anioMax && i > hoy.getMonth();
          const activo = i === mes && anio === anio;
          return (
            <button key={i} onClick={() => !futuro && onChange(i, anio)} style={{ padding: "6px 4px", borderRadius: 8, border: `1.5px solid ${activo ? C.accent : "transparent"}`, background: activo ? C.accentLight : "transparent", color: futuro ? C.border : activo ? C.accent : C.textMid, fontSize: 12, fontWeight: activo ? 700 : 400, cursor: futuro ? "not-allowed" : "pointer", fontFamily: "'DM Sans', sans-serif", textAlign: "center" }}>{m}</button>
          );
        })}
      </div>
    </div>
  );
}

function LoadingSpinner() {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: 60 }}>
      <div style={{ color: C.accent, fontFamily: "'Playfair Display', serif", fontSize: 16 }}>Cargando datos...</div>
    </div>
  );
}

function EmptyState({ mensaje }) {
  return (
    <div style={{ textAlign: "center", padding: 60 }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>📊</div>
      <p style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, fontWeight: 700, color: C.text, marginBottom: 8 }}>Sin datos todavía</p>
      <p style={{ fontSize: 13, color: C.textLight }}>{mensaje || "Importa tu plantilla Excel para ver los datos aquí"}</p>
    </div>
  );
}

// ─── IMPORTAR EXCEL ───────────────────────────────────────────────
function ImportarExcel({ onClose, session, onImportado }) {
  const [loading, setLoading] = useState(false);
  const [resultado, setResultado] = useState(null);
  const [error, setError] = useState("");

  const procesarExcel = async (file) => {
    setLoading(true); setError(""); setResultado(null);
    try {
      const XLSX = await import("xlsx");
      const data = await file.arrayBuffer();
      const wb = XLSX.read(data);

      // ── Producción Diaria ──
      const ws = wb.Sheets["📅 Producción Diaria"];
      if (!ws) throw new Error("No se encontró la hoja '📅 Producción Diaria'");

      const rows = XLSX.utils.sheet_to_json(ws, { header: 1, range: 4 });
      const produccionRows = [];

      const wsHotel = wb.Sheets["🏨 Mi Hotel"];
      const hotelRows = wsHotel ? XLSX.utils.sheet_to_json(wsHotel, { header: 1 }) : [];
      const totalHab = parseFloat(hotelRows?.[8]?.[4]) || null;


      for (const row of rows) {
        if (!row[0]) continue;
        const fecha = row[0];
        const hab_ocupadas = parseFloat(row[1]) || null;
        const hab_disponibles = parseFloat(row[2]) || totalHab;
        const revenue_hab = parseFloat(row[3]) || null;
        const revenue_total = parseFloat(row[4]) || null;
        const revenue_fnb = parseFloat(row[5]) || null;
        const revenue_otros = parseFloat(row[6]) || null;
        if (!hab_ocupadas && !revenue_hab) continue;

        let fechaISO;
        if (typeof fecha === "number") {
          const d = XLSX.SSF.parse_date_code(fecha);
          fechaISO = `${d.y}-${String(d.m).padStart(2,"0")}-${String(d.d).padStart(2,"0")}`;
        } else if (typeof fecha === "string") {
          const parts = fecha.split("/");
          if (parts.length === 3) fechaISO = `${parts[2]}-${parts[1]}-${parts[0]}`;
        }
        if (!fechaISO) continue;

        const adr = hab_ocupadas > 0 ? revenue_hab / hab_ocupadas : null;
        const revpar = hab_disponibles > 0 ? revenue_hab / hab_disponibles : null;
        const trevpar = hab_disponibles > 0 ? ((revenue_hab||0)+(revenue_fnb||0)+(revenue_otros||0)) / hab_disponibles : null;

        produccionRows.push({
          hotel_id: session.user.id, fecha: fechaISO,
          hab_ocupadas, hab_disponibles, revenue_hab, revenue_total,
          revenue_fnb, revenue_otros,
          adr: adr ? Math.round(adr*100)/100 : null,
          revpar: revpar ? Math.round(revpar*100)/100 : null,
          trevpar: trevpar ? Math.round(trevpar*100)/100 : null,
        });
      }

      // ── Pickup (nuevo formato: fecha_pickup, fecha_llegada, canal, num_reservas) ──
      const wsPu = wb.Sheets["🎯 Pickup"];
      const pickupRows = [];
      if (wsPu) {
        const rowsPu = XLSX.utils.sheet_to_json(wsPu, { header: 1, range: 4 });
        const parseFechaES = (val) => {
          if (!val) return null;
          if (typeof val === "number") {
            const d = XLSX.SSF.parse_date_code(val);
            return `${d.y}-${String(d.m).padStart(2,"0")}-${String(d.d).padStart(2,"0")}`;
          }
          if (typeof val === "string") {
            // DD/MM/AAAA o DD/MM/AA
            const parts = val.trim().split("/");
            if (parts.length === 3) {
              const anio = parts[2].length === 2 ? "20" + parts[2] : parts[2];
              return `${anio}-${parts[1].padStart(2,"0")}-${parts[0].padStart(2,"0")}`;
            }
          }
          return null;
        };
        for (const row of rowsPu) {
          if (!row[0] && !row[1]) continue;
          const fechaPickup = parseFechaES(row[0]);
          const fechaLlegada = parseFechaES(row[1]);
          if (!fechaPickup || !fechaLlegada) continue;
          const canal = row[2] || null;
          const numReservas = parseInt(row[3]) || 1;
          const notas = row[4] || "";
          pickupRows.push({
            hotel_id: session.user.id,
            fecha_pickup: fechaPickup,
            fecha_llegada: fechaLlegada,
            canal,
            num_reservas: numReservas,
            notas,
          });
        }
      }

      // ── Presupuesto ──
      // Lee dos bloques: filas 5-16 (2025) y filas 22-33 (2026)
      const wsBu = wb.Sheets["💰 Presupuesto"];
      const presupuestoRows = [];
      if (wsBu) {
        const rowsBu = XLSX.utils.sheet_to_json(wsBu, { header: 1 });
        // Detectar bloques dinámicamente: buscar filas con nombre de mes en col 0
        const MESES_PPTO = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
        const anioImportPpto = parseInt(produccionRows[0]?.fecha?.slice(0,4)) || new Date().getFullYear();
        const bloques = [{ startRow: null, anio: anioImportPpto }];
        for (let r = 0; r < rowsBu.length; r++) {
          if (rowsBu[r]?.[0] === "Enero") { bloques[0].startRow = r; break; }
        }
        for (const { startRow, anio } of bloques) {
          if (startRow === null) continue;
          for (let i = 0; i < 12; i++) {
            const row = rowsBu[startRow + i];
            if (!row || !row[0] || typeof row[0] !== "string") continue;
            const occ_ppto = parseFloat(row[1]) || null;
            const adr_ppto = parseFloat(row[4]) || null;
            const revpar_ppto = parseFloat(row[7]) || null;
            const rev_total_ppto = parseFloat(row[10]) || null;
            if (!occ_ppto && !adr_ppto && !revpar_ppto && !rev_total_ppto) continue;
            presupuestoRows.push({
              hotel_id: session.user.id,
              anio,
              mes: i + 1,
              occ_ppto: occ_ppto ? Math.round(occ_ppto * 10) / 10 : null,
              adr_ppto: adr_ppto ? Math.round(adr_ppto * 100) / 100 : null,
              revpar_ppto: revpar_ppto ? Math.round(revpar_ppto * 100) / 100 : null,
              rev_total_ppto: rev_total_ppto ? Math.round(rev_total_ppto) : null,
            });
          }
        }
      }

      if (produccionRows.length === 0) throw new Error("No se encontraron datos en la hoja de Producción Diaria");

      // Detectar años presentes en el Excel
      const aniosImport = [...new Set(produccionRows.map(r => r.fecha.slice(0, 4)))];
      for (const anio of aniosImport) {
        await supabase.from("produccion_diaria").delete()
          .eq("hotel_id", session.user.id)
          .gte("fecha", `${anio}-01-01`)
          .lte("fecha", `${anio}-12-31`);
        await supabase.from("pickup_entries").delete()
          .eq("hotel_id", session.user.id)
          .gte("fecha_pickup", `${anio}-01-01`)
          .lte("fecha_pickup", `${anio}-12-31`);
        await supabase.from("presupuesto").delete()
          .eq("hotel_id", session.user.id)
          .eq("anio", parseInt(anio));
      }


      const { error: err1 } = await supabase.from("produccion_diaria").insert(produccionRows);
      if (err1) throw new Error("Error al guardar producción: " + err1.message);

      if (pickupRows.length > 0) {
        const { error: err2 } = await supabase.from("pickup_entries").insert(pickupRows);
        if (err2) throw new Error("Error al guardar pickup: " + err2.message);
      }

      if (presupuestoRows.length > 0) {
        const { error: err3 } = await supabase.from("presupuesto").insert(presupuestoRows);
        if (err3) throw new Error("Error al guardar presupuesto: " + err3.message);
      }

      setResultado({ produccion: produccionRows.length, pickup: pickupRows.length, presupuesto: presupuestoRows.length });
      if (onImportado) onImportado();
    } catch (e) {
      setError(e.message);
    }
    setLoading(false);
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
      <div style={{ background: "#fff", borderRadius: 10, padding: "36px 40px", width: 480, boxShadow: "0 24px 60px rgba(0,0,0,0.3)", fontFamily: "'DM Sans', sans-serif" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <div>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, fontWeight: 700, color: "#1C1814" }}>Importar datos</h2>
            <p style={{ fontSize: 12, color: "#A8998A", marginTop: 4 }}>Sube tu plantilla Excel de RevManager</p>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#A8998A" }}>✕</button>
        </div>
        {!resultado ? (
          <>
            <div onClick={() => document.getElementById("excel-input").click()} style={{ border: "2px dashed #E8E0D5", borderRadius: 8, padding: "40px 20px", textAlign: "center", cursor: "pointer", background: "#F7F3EE", marginBottom: 16 }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>📊</div>
              <p style={{ fontWeight: 600, color: "#1C1814", marginBottom: 6 }}>{loading ? "Procesando..." : "Haz clic para seleccionar el archivo"}</p>
              <p style={{ fontSize: 12, color: "#A8998A" }}>Formato .xlsx · Plantilla RevManager</p>
              <input id="excel-input" type="file" accept=".xlsx" style={{ display: "none" }} onChange={e => e.target.files[0] && procesarExcel(e.target.files[0])} />
            </div>
            {error && <div style={{ background: "#FDECEA", color: "#C0392B", padding: "12px 16px", borderRadius: 8, fontSize: 13, marginBottom: 12 }}>⚠️ {error}</div>}
            <p style={{ fontSize: 11, color: "#A8998A", textAlign: "center" }}>Al importar se reemplazarán los datos anteriores</p>
          </>
        ) : (
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 50, marginBottom: 16 }}>✅</div>
            <p style={{ fontWeight: 700, fontSize: 16, color: "#1C1814", marginBottom: 8 }}>¡Datos importados correctamente!</p>
            <div style={{ background: "#D4EDDE", borderRadius: 10, padding: "16px", marginBottom: 20 }}>
              <p style={{ color: "#2D7A4F", fontSize: 13 }}>📅 {resultado.produccion} días de producción importados</p>
              {resultado.pickup > 0 && <p style={{ color: "#2D7A4F", fontSize: 13, marginTop: 6 }}>🎯 {resultado.pickup} días de pickup importados</p>}
              {resultado.presupuesto > 0 && <p style={{ color: "#2D7A4F", fontSize: 13, marginTop: 6 }}>💰 {resultado.presupuesto} meses de presupuesto importados</p>}
            </div>
            <button onClick={onClose} style={{ background: "#C8933A", color: "#fff", border: "none", borderRadius: 10, padding: "12px 32px", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>Ver dashboard</button>
          </div>
        )}
      </div>
    </div>
  );
}


// ─── MONTH DETAIL VIEW ───────────────────────────────────────────
function MonthDetailView({ datos, mes, anio, onBack }) {
  const { produccion } = datos;

  const datosMes = (produccion || []).filter(d => {
    const f = new Date(d.fecha + "T00:00:00");
    return f.getMonth() === mes && f.getFullYear() === anio;
  }).sort((a, b) => new Date(a.fecha) - new Date(b.fecha));

  const totalHabOcu = datosMes.reduce((a, d) => a + (d.hab_ocupadas || 0), 0);
  const totalHabDis = datosMes.reduce((a, d) => a + (d.hab_disponibles || 0), 0);
  const totalRevHab = datosMes.reduce((a, d) => a + (d.revenue_hab || 0), 0);
  const totalRevTot = datosMes.reduce((a, d) => a + (d.revenue_total || 0), 0);
  const mediaOcc    = totalHabDis > 0 ? (totalHabOcu / totalHabDis * 100).toFixed(1) : 0;
  const mediaAdr    = totalHabOcu > 0 ? Math.round(totalRevHab / totalHabOcu) : 0;
  const mediaRevpar = totalHabDis > 0 ? Math.round(totalRevHab / totalHabDis) : 0;

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 28 }}>
        <button onClick={onBack} style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 8, padding: "8px 16px", cursor: "pointer", fontSize: 13, color: C.textMid, fontFamily: "'DM Sans', sans-serif", display: "flex", alignItems: "center", gap: 6 }}>
          ← Volver
        </button>
        <div>
          <h2 style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 20, fontWeight: 700, color: C.text, letterSpacing: -0.3 }}>
            Detalle diario — {MESES[mes]} {anio}
          </h2>
          <p style={{ fontSize: 12, color: C.textLight, marginTop: 4 }}>{datosMes.length} días con datos</p>
        </div>
      </div>

      {/* KPIs resumen del mes */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 14, marginBottom: 24 }}>
        {[
          { label: "Ocupación media", value: `${mediaOcc}%` },
          { label: "ADR medio",       value: `€${mediaAdr}` },
          { label: "RevPAR medio",    value: `€${mediaRevpar}` },
          { label: "Rev. Hab. total", value: `€${Math.round(totalRevHab).toLocaleString("es-ES")}` },
          { label: "Rev. Total",      value: `€${Math.round(totalRevTot).toLocaleString("es-ES")}` },
        ].map((k, i) => (
          <div key={i} style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 8, padding: "16px 18px", borderTop: `3px solid ${C.accent}` }}>
            <p style={{ fontSize: 11, color: C.textLight, textTransform: "uppercase", letterSpacing: "1.5px" }}>{k.label}</p>
            <p style={{ fontSize: 24, fontWeight: 700, fontFamily: "'Playfair Display', serif", color: C.text, marginTop: 6 }}>{k.value}</p>
          </div>
        ))}
      </div>

      {/* Tabla diaria */}
      <Card>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: `2px solid ${C.border}` }}>
                {["Fecha", "Hab. Ocup.", "Ocupación", "ADR", "RevPAR", "Rev. Hab.", "Rev. Total"].map(h => (
                  <th key={h} style={{ padding: "10px 14px", textAlign: h === "Fecha" ? "left" : "right", fontSize: 10, color: C.textLight, textTransform: "uppercase", letterSpacing: "1px", fontWeight: 600 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {datosMes.map((d, i) => {
                const fecha   = new Date(d.fecha + "T00:00:00");
                const dia     = fecha.getDate();
                const semana  = ["Dom","Lun","Mar","Mié","Jue","Vie","Sáb"][fecha.getDay()];
                const habDis  = d.hab_disponibles || 30;
                const occ     = habDis > 0 ? (d.hab_ocupadas / habDis * 100).toFixed(1) : 0;
                const adr     = d.hab_ocupadas > 0 ? Math.round(d.revenue_hab / d.hab_ocupadas) : 0;
                const revpar  = habDis > 0 ? Math.round(d.revenue_hab / habDis) : 0;
                const esFinSemana = fecha.getDay() === 0 || fecha.getDay() === 6;
                return (
                  <tr key={i} style={{ borderBottom: `1px solid ${C.border}`, background: esFinSemana ? C.accentLight : (i % 2 === 0 ? C.bg : C.bgCard) }}>
                    <td style={{ padding: "9px 14px", color: C.text, fontWeight: esFinSemana ? 600 : 400 }}>
                      <span style={{ color: C.textLight, fontSize: 11, marginRight: 6 }}>{semana}</span>
                      {String(dia).padStart(2, "0")}/{String(mes + 1).padStart(2, "0")}
                    </td>
                    <td style={{ padding: "9px 14px", textAlign: "right", color: C.textMid }}>{d.hab_ocupadas}</td>
                    <td style={{ padding: "9px 14px", textAlign: "right", color: parseFloat(occ) >= 80 ? C.green : parseFloat(occ) < 50 ? C.red : C.textMid, fontWeight: 600 }}>{occ}%</td>
                    <td style={{ padding: "9px 14px", textAlign: "right", color: C.textMid }}>€{adr}</td>
                    <td style={{ padding: "9px 14px", textAlign: "right", color: C.accent, fontWeight: 600 }}>€{revpar}</td>
                    <td style={{ padding: "9px 14px", textAlign: "right", color: C.textMid }}>€{Math.round(d.revenue_hab).toLocaleString("es-ES")}</td>
                    <td style={{ padding: "9px 14px", textAlign: "right", color: C.textMid }}>€{Math.round(d.revenue_total || 0).toLocaleString("es-ES")}</td>
                  </tr>
                );
              })}
            </tbody>
            {/* Totales */}
            <tfoot>
              <tr style={{ borderTop: `2px solid ${C.border}`, background: C.accentLight, fontWeight: 700 }}>
                <td style={{ padding: "10px 14px", color: C.text, fontWeight: 700 }}>TOTAL MES</td>
                <td style={{ padding: "10px 14px", textAlign: "right", color: C.text }}>{totalHabOcu}</td>
                <td style={{ padding: "10px 14px", textAlign: "right", color: C.text }}>{mediaOcc}%</td>
                <td style={{ padding: "10px 14px", textAlign: "right", color: C.text }}>€{mediaAdr}</td>
                <td style={{ padding: "10px 14px", textAlign: "right", color: C.accent }}>€{mediaRevpar}</td>
                <td style={{ padding: "10px 14px", textAlign: "right", color: C.text }}>€{Math.round(totalRevHab).toLocaleString("es-ES")}</td>
                <td style={{ padding: "10px 14px", textAlign: "right", color: C.text }}>€{Math.round(totalRevTot).toLocaleString("es-ES")}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </Card>
    </div>
  );
}


// ─── PDF REPORT ──────────────────────────────────────────────────
async function generarReportePDF(datos, mes, anio, hotelNombre) {
  const MESES_FULL = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
  const MESES_C    = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
  const { produccion, presupuesto } = datos;
  const fmt  = n => n != null ? Math.round(n).toLocaleString("es-ES") : "—";
  const fmtP = n => n != null ? parseFloat(n).toFixed(1) + "%" : "—";

  const getMes = (mIdx, aIdx) => {
    const d = (produccion||[]).filter(r => {
      const f = new Date(r.fecha+"T00:00:00");
      return f.getMonth()===mIdx && f.getFullYear()===aIdx;
    });
    const habOcu = d.reduce((a,r)=>a+(r.hab_ocupadas||0),0);
    const habDis = d.reduce((a,r)=>a+(r.hab_disponibles||0),0);
    const revH   = d.reduce((a,r)=>a+(r.revenue_hab||0),0);
    const revFnb = d.reduce((a,r)=>a+(r.revenue_fnb||0),0);
    const revOt  = d.reduce((a,r)=>a+(r.revenue_otros||0),0);
    const revTot = d.reduce((a,r)=>a+(r.revenue_total||0),0);
    return { d, habOcu, habDis, revH, revFnb, revOt, revTot,
      occ:    habDis>0 ? (habOcu/habDis*100) : 0,
      adr:    habOcu>0 ? revH/habOcu : 0,
      revpar: habDis>0 ? revH/habDis : 0,
      trevpar:habDis>0 ? (revH+revFnb+revOt)/habDis : 0,
    };
  };

  const mesAct = getMes(mes, anio);
  const mesPrev = getMes(mes===0?11:mes-1, mes===0?anio-1:anio);

  // Datos 12 meses rodantes
  const rodantes = Array.from({length:12},(_,i)=>{
    const total = mes-11+i;
    const mIdx  = ((total%12)+12)%12;
    const aIdx  = anio + Math.floor(total/12);
    const md = getMes(mIdx, aIdx);
    const pp = (presupuesto||[]).find(p=>p.mes===mIdx+1 && p.anio===aIdx);
    return { mes: MESES_C[mIdx], anio: aIdx, ...md, ppto: pp };
  }).filter(r=>r.habOcu>0||r.revTot>0);

  // Detalle diario
  const diasMes = mesAct.d.sort((a,b)=>new Date(a.fecha)-new Date(b.fecha)).map(d=>{
    const f = new Date(d.fecha+"T00:00:00");
    const habDis = d.hab_disponibles||30;
    return {
      dia:   f.getDate(),
      sem:   ["Dom","Lun","Mar","Mié","Jue","Vie","Sáb"][f.getDay()],
      occ:   habDis>0?(d.hab_ocupadas/habDis*100).toFixed(1):0,
      adr:   d.hab_ocupadas>0?Math.round(d.revenue_hab/d.hab_ocupadas):0,
      revpar:habDis>0?Math.round(d.revenue_hab/habDis):0,
      revTot:Math.round(d.revenue_total||0),
    };
  });

  // Presupuesto mes actual
  const pptoMes = (presupuesto||[]).find(p=>p.mes===mes+1 && p.anio===anio);
  const pptoVsReal = pptoMes ? {
    adr:   pptoMes.adr_ppto   ? ((mesAct.adr    - pptoMes.adr_ppto)   / pptoMes.adr_ppto   * 100).toFixed(1) : null,
    revpar:pptoMes.revpar_ppto ? ((mesAct.revpar  - pptoMes.revpar_ppto)/ pptoMes.revpar_ppto * 100).toFixed(1) : null,
    rev:   pptoMes.rev_total_ppto ? ((mesAct.revTot - pptoMes.rev_total_ppto)/pptoMes.rev_total_ppto*100).toFixed(1) : null,
  } : null;

  // ── Generar resumen automático basado en datos ──
  const diffPct = (curr, prev) => prev > 0 ? ((curr-prev)/prev*100).toFixed(1) : null;
  const occDiff  = diffPct(mesAct.occ, mesPrev.occ);
  const adrDiff  = diffPct(mesAct.adr, mesPrev.adr);
  const revDiff  = diffPct(mesAct.revTot, mesPrev.revTot);
  const tendOcc  = occDiff  ? (parseFloat(occDiff)>=0  ? `subió un ${occDiff}%`  : `bajó un ${Math.abs(occDiff)}%`)  : "sin comparativa";
  const tendAdr  = adrDiff  ? (parseFloat(adrDiff)>=0  ? `subió un ${adrDiff}%`  : `bajó un ${Math.abs(adrDiff)}%`)  : "sin comparativa";
  const tendRev  = revDiff  ? (parseFloat(revDiff)>=0  ? `aumentó un ${revDiff}%` : `cayó un ${Math.abs(revDiff)}%`) : "sin comparativa";
  const mejorDia = diasMes.length>0 ? diasMes.reduce((a,b)=>parseFloat(a.occ)>parseFloat(b.occ)?a:b) : null;
  const peorDia  = diasMes.length>0 ? diasMes.reduce((a,b)=>parseFloat(a.occ)<parseFloat(b.occ)?a:b) : null;
  const pptoOk   = pptoVsReal?.rev ? parseFloat(pptoVsReal.rev) >= 0 : null;

  const resumenIA = [
    `El mes de ${MESES_FULL[mes]} ${anio} cerró con una ocupación del ${mesAct.occ.toFixed(1)}%, un ADR de €${Math.round(mesAct.adr)} y un RevPAR de €${Math.round(mesAct.revpar)}, generando un revenue total de €${fmt(mesAct.revTot)}. Respecto al mes anterior, la ocupación ${tendOcc}, el ADR ${tendAdr} y el revenue ${tendRev}.`,
    pptoVsReal ? `En cuanto al cumplimiento presupuestario, el revenue total ${pptoOk?"superó":"no alcanzó"} el objetivo con una desviación del ${pptoVsReal.rev}%. El ADR ${parseFloat(pptoVsReal.adr)>=0?"superó":"estuvo por debajo de"} el presupuesto en un ${Math.abs(pptoVsReal.adr)}% y el RevPAR se desvió un ${pptoVsReal.revpar}% respecto al objetivo.` : `No se dispone de datos presupuestarios para este mes, por lo que no es posible realizar la comparativa vs objetivo.`,
    mejorDia && peorDia ? `El día de mayor ocupación fue el ${mejorDia.dia} con un ${mejorDia.occ}% de ocupación y un ADR de €${mejorDia.adr}. Por el contrario, el día más débil fue el ${peorDia.dia} con un ${peorDia.occ}% de ocupación, lo que sugiere oportunidades de mejora en la captación de demanda en esos períodos.` : "",
    `El TRevPAR del mes se situó en €${Math.round(mesAct.trevpar)}, con los ingresos de habitaciones representando el grueso del revenue total. Para el próximo mes se recomienda ${mesAct.occ < 70 ? "reforzar la estrategia de captación y revisar la política de precios para mejorar la ocupación" : mesAct.adr < mesPrev.adr ? "mantener la ocupación alcanzada y trabajar en incrementar el ADR mediante upselling y segmentación de tarifas" : "consolidar la estrategia actual que está mostrando resultados positivos tanto en ocupación como en precio medio"}.`
  ].filter(Boolean).join("\n\n");

  // ── Cargar jsPDF ──
  const loadScript = (src) => new Promise((res, rej) => {
    if (document.querySelector(`script[src="${src}"]`)) { res(); return; }
    const s = document.createElement("script");
    s.src = src; s.onload = res; s.onerror = rej;
    document.head.appendChild(s);
  });
  await loadScript("https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js");
  await loadScript("https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.8.2/jspdf.plugin.autotable.min.js");
  const { jsPDF } = window.jspdf;

  const doc = new jsPDF({ orientation:"portrait", unit:"mm", format:"a4" });
  const W=210; const M=14; let y=M;

  const azul   = [0,75,135];
  const negro  = [26,26,26];
  const gris   = [100,100,100];
  const grisCl = [220,220,220];
  const verde  = [0,159,77];
  const rojo   = [211,47,47];

  const addPage = () => { doc.addPage(); y=M; };
  const checkY  = (needed=20) => { if(y+needed>285) addPage(); };

  // ── Portada / Header ──
  doc.setFillColor(...azul);
  doc.rect(0,0,W,38,"F");
  doc.setTextColor(255,255,255);
  doc.setFontSize(22); doc.setFont("helvetica","bold");
  doc.text((hotelNombre||"Mi Hotel").toUpperCase(), M, 18);
  doc.setFontSize(13); doc.setFont("helvetica","normal");
  doc.text(`Informe Mensual — ${MESES_FULL[mes]} ${anio}`, M, 28);
  doc.setFontSize(9);
  doc.text(`Generado el ${new Date().toLocaleDateString("es-ES",{day:"2-digit",month:"long",year:"numeric"})}`, W-M, 33, {align:"right"});
  y = 48;

  // ── KPIs del mes ──
  doc.setTextColor(...azul);
  doc.setFontSize(13); doc.setFont("helvetica","bold");
  doc.text("KPIs del Mes", M, y); y+=6;
  doc.setDrawColor(...grisCl); doc.line(M, y, W-M, y); y+=5;

  const kpis = [
    ["Ocupación", fmtP(mesAct.occ), "Mes anterior: "+fmtP(mesPrev.occ)],
    ["ADR", "€"+fmt(mesAct.adr), "Mes anterior: €"+fmt(mesPrev.adr)],
    ["RevPAR", "€"+fmt(mesAct.revpar), "Mes anterior: €"+fmt(mesPrev.revpar)],
    ["TRevPAR", "€"+fmt(mesAct.trevpar), ""],
    ["Revenue Hab.", "€"+fmt(mesAct.revH), ""],
    ["Revenue Total", "€"+fmt(mesAct.revTot), pptoVsReal?.rev ? `vs Ppto: ${pptoVsReal.rev}%` : ""],
  ];
  const colW = (W-M*2)/3;
  kpis.forEach((k,i)=>{
    const col = i%3; const row = Math.floor(i/3);
    const x = M + col*colW; const ky = y + row*22;
    doc.setFillColor(248,250,253);
    doc.roundedRect(x+1, ky, colW-3, 18, 2, 2, "F");
    doc.setDrawColor(...grisCl); doc.roundedRect(x+1, ky, colW-3, 18, 2, 2, "S");
    doc.setTextColor(...gris); doc.setFontSize(7); doc.setFont("helvetica","normal");
    doc.text(k[0].toUpperCase(), x+5, ky+5);
    doc.setTextColor(...negro); doc.setFontSize(13); doc.setFont("helvetica","bold");
    doc.text(k[1], x+5, ky+12);
    if(k[2]){ doc.setFontSize(7); doc.setFont("helvetica","normal"); doc.setTextColor(...gris); doc.text(k[2], x+5, ky+16.5); }
  });
  y += 48;

  // ── Vs Presupuesto ──
  if(pptoVsReal) {
    checkY(30);
    doc.setTextColor(...azul); doc.setFontSize(13); doc.setFont("helvetica","bold");
    doc.text("Comparativa vs Presupuesto", M, y); y+=6;
    doc.setDrawColor(...grisCl); doc.line(M,y,W-M,y); y+=5;
    doc.autoTable({
      startY: y,
      head: [["Métrica","Presupuesto","Real","Desviación"]],
      body: [
        ["ADR", pptoMes?.adr_ppto?"€"+fmt(pptoMes.adr_ppto):"—", "€"+fmt(mesAct.adr), pptoVsReal.adr?(parseFloat(pptoVsReal.adr)>=0?"+":"")+pptoVsReal.adr+"%":"—"],
        ["RevPAR", pptoMes?.revpar_ppto?"€"+fmt(pptoMes.revpar_ppto):"—", "€"+fmt(mesAct.revpar), pptoVsReal.revpar?(parseFloat(pptoVsReal.revpar)>=0?"+":"")+pptoVsReal.revpar+"%":"—"],
        ["Revenue Total", pptoMes?.rev_total_ppto?"€"+fmt(pptoMes.rev_total_ppto):"—", "€"+fmt(mesAct.revTot), pptoVsReal.rev?(parseFloat(pptoVsReal.rev)>=0?"+":"")+pptoVsReal.rev+"%":"—"],
      ],
      styles: { fontSize:9, cellPadding:3 },
      headStyles: { fillColor:azul, textColor:[255,255,255], fontStyle:"bold" },
      alternateRowStyles: { fillColor:[248,250,253] },
      columnStyles: { 3: { halign:"center", fontStyle:"bold" } },
      margin: { left:M, right:M },
      didParseCell: (d)=>{
        if(d.section==="body" && d.column.index===3 && d.cell.raw!=="—"){
          d.cell.styles.textColor = parseFloat(d.cell.raw)>=0 ? verde : rojo;
        }
      }
    });
    y = doc.lastAutoTable.finalY + 8;
  }

  // ── Resumen IA ──
  checkY(40);
  doc.setTextColor(...azul); doc.setFontSize(13); doc.setFont("helvetica","bold");
  doc.text("Análisis IA del Mes", M, y); y+=6;
  doc.setDrawColor(...grisCl); doc.line(M,y,W-M,y); y+=5;
  doc.setFillColor(248,250,253);
  const lines = doc.splitTextToSize(resumenIA, W-M*2-8);
  doc.roundedRect(M, y, W-M*2, lines.length*4.5+8, 2, 2, "F");
  doc.setTextColor(...negro); doc.setFontSize(9); doc.setFont("helvetica","normal");
  doc.text(lines, M+4, y+6);
  y += lines.length*4.5+14;

  // ── Tabla resumen 12 meses ──
  checkY(20); addPage();
  doc.setTextColor(...azul); doc.setFontSize(13); doc.setFont("helvetica","bold");
  doc.text("Resumen Últimos 12 Meses", M, y); y+=6;
  doc.setDrawColor(...grisCl); doc.line(M,y,W-M,y); y+=3;
  doc.autoTable({
    startY: y,
    head: [["Mes","Ocup.","ADR","RevPAR","TRevPAR","Rev. Hab.","Rev. Total"]],
    body: rodantes.map(r=>[
      r.mes+(r.anio!==anio?" "+r.anio:""),
      fmtP(r.occ), "€"+fmt(r.adr), "€"+fmt(r.revpar),
      "€"+fmt(r.trevpar), "€"+fmt(r.revH), "€"+fmt(r.revTot)
    ]),
    styles: { fontSize:8.5, cellPadding:2.5 },
    headStyles: { fillColor:azul, textColor:[255,255,255], fontStyle:"bold" },
    alternateRowStyles: { fillColor:[248,250,253] },
    margin: { left:M, right:M },
  });
  y = doc.lastAutoTable.finalY + 10;

  // ── Detalle diario ──
  checkY(20);
  doc.setTextColor(...azul); doc.setFontSize(13); doc.setFont("helvetica","bold");
  doc.text(`Detalle Diario — ${MESES_FULL[mes]} ${anio}`, M, y); y+=6;
  doc.setDrawColor(...grisCl); doc.line(M,y,W-M,y); y+=3;
  doc.autoTable({
    startY: y,
    head: [["Día","","Ocup.","ADR","RevPAR","Rev. Total"]],
    body: diasMes.map(d=>[d.dia, d.sem, d.occ+"%", "€"+d.adr, "€"+d.revpar, "€"+fmt(d.revTot)]),
    styles: { fontSize:8, cellPadding:2 },
    headStyles: { fillColor:azul, textColor:[255,255,255], fontStyle:"bold" },
    alternateRowStyles: { fillColor:[248,250,253] },
    columnStyles: { 1:{ textColor:gris, fontStyle:"italic" } },
    margin: { left:M, right:M },
    didParseCell: (d)=>{
      if(d.section==="body" && d.column.index===2){
        const v = parseFloat(d.cell.raw);
        d.cell.styles.textColor = v>=80?verde:v<50?rojo:negro;
        d.cell.styles.fontStyle = "bold";
      }
    }
  });

  // ── Footer ──
  const pages = doc.internal.getNumberOfPages();
  for(let i=1;i<=pages;i++){
    doc.setPage(i);
    doc.setFontSize(8); doc.setTextColor(...gris);
    doc.text(`${hotelNombre||"RevManager"} · Informe ${MESES_FULL[mes]} ${anio} · Página ${i} de ${pages}`, W/2, 292, {align:"center"});
  }

  doc.save(`Informe_${MESES_FULL[mes]}_${anio}.pdf`);
}

// ─── DASHBOARD VIEW ───────────────────────────────────────────────
function DashboardView({ datos, mes, anio, onPeriodo, onMesDetalle, kpiModal, setKpiModal }) {
  const { produccion } = datos;

  if (!produccion || produccion.length === 0) return <EmptyState />;

  const datosMes = produccion.filter(d => {
    const f = new Date(d.fecha + "T00:00:00");
    return f.getMonth() === mes && f.getFullYear() === anio;
  });

  const totalHabOcupadas    = datosMes.reduce((a, d) => a + (d.hab_ocupadas || 0), 0);
  const totalHabDisponibles = datosMes.reduce((a, d) => a + (d.hab_disponibles || 0), 0);
  const totalRevHab   = datosMes.reduce((a, d) => a + (d.revenue_hab || 0), 0);
  const totalRevTotal = datosMes.reduce((a, d) => a + (d.revenue_total || 0), 0);
  const totalRevFnb   = datosMes.reduce((a, d) => a + (d.revenue_fnb || 0), 0);
  const totalRevOtros = datosMes.reduce((a, d) => a + (d.revenue_otros || 0), 0);

  const occ     = totalHabDisponibles > 0 ? (totalHabOcupadas / totalHabDisponibles * 100).toFixed(1) : 0;
  const adr     = totalHabOcupadas > 0 ? (totalRevHab / totalHabOcupadas).toFixed(0) : 0;
  const revpar  = totalHabDisponibles > 0 ? (totalRevHab / totalHabDisponibles).toFixed(0) : 0;
  const trevpar = totalHabDisponibles > 0 ? ((totalRevHab + totalRevFnb + totalRevOtros) / totalHabDisponibles).toFixed(0) : 0;

  // Últimos 12 meses rodantes desde el mes seleccionado
  const porMes = Array.from({ length: 12 }, (_, i) => {
    const totalMeses = mes - 11 + i;
    const mIdx = ((totalMeses % 12) + 12) % 12;
    const aIdx = anio + Math.floor((mes - 11 + i) / 12);
    const d = produccion.filter(r => {
      const f = new Date(r.fecha + "T00:00:00");
      return f.getMonth() === mIdx && f.getFullYear() === aIdx;
    });
    const habOcu   = d.reduce((a, r) => a + (r.hab_ocupadas || 0), 0);
    const habDis   = d.reduce((a, r) => a + (r.hab_disponibles || 0), 0);
    const revH     = d.reduce((a, r) => a + (r.revenue_hab || 0), 0);
    const revFnb   = d.reduce((a, r) => a + (r.revenue_fnb || 0), 0);
    const revOtros = d.reduce((a, r) => a + (r.revenue_otros || 0), 0);
    return {
      mes: MESES_CORTO[mIdx],
      mesIdx: mIdx,
      anioIdx: aIdx,
      occ:     habDis > 0 ? Math.round(habOcu / habDis * 100) : 0,
      adr:     habOcu > 0 ? Math.round(revH / habOcu) : 0,
      revpar:  habDis > 0 ? Math.round(revH / habDis) : 0,
      trevpar: habDis > 0 ? Math.round((revH + revFnb + revOtros) / habDis) : 0,
      revHab:  Math.round(revH),
      revTotal: d.reduce((a,r) => a+(r.revenue_total||0), 0),
    };
  }).filter(d => d.occ > 0 || d.adr > 0);

  // Últimos 30 días con datos para gráfica
  const hace30 = new Date(); hace30.setDate(hace30.getDate() - 29);
  const hace30Str = hace30.toISOString().slice(0,10);
  const datosDiariosMes = produccion
    .filter(d => d.fecha >= hace30Str)
    .sort((a, b) => new Date(a.fecha) - new Date(b.fecha))
    .map(d => ({
      dia: new Date(d.fecha + "T00:00:00").toLocaleDateString("es-ES", { day: "numeric", month: "short" }),
      fecha: new Date(d.fecha + "T00:00:00").toLocaleDateString("es-ES", { weekday: "short", day: "numeric", month: "short" }),
      occ: d.hab_disponibles > 0 ? Math.round(d.hab_ocupadas / d.hab_disponibles * 100) : 0,
      adr: d.hab_ocupadas > 0 ? Math.round(d.revenue_hab / d.hab_ocupadas) : 0,
    }));

  // Mes anterior para comparativa
  const mesPrevIdx = mes === 0 ? 11 : mes - 1;
  const anioPrev   = mes === 0 ? anio - 1 : anio;
  const datosPrev  = produccion.filter(d => {
    const f = new Date(d.fecha + "T00:00:00");
    return f.getMonth() === mesPrevIdx && f.getFullYear() === anioPrev;
  });
  const prevHabOcu  = datosPrev.reduce((a, d) => a + (d.hab_ocupadas || 0), 0);
  const prevHabDis  = datosPrev.reduce((a, d) => a + (d.hab_disponibles || 0), 0);
  const prevRevHab  = datosPrev.reduce((a, d) => a + (d.revenue_hab || 0), 0);
  const prevRevTot  = datosPrev.reduce((a, d) => a + (d.revenue_total || 0), 0);
  const prevRevFnb  = datosPrev.reduce((a, d) => a + (d.revenue_fnb || 0), 0);
  const prevRevOtros= datosPrev.reduce((a, d) => a + (d.revenue_otros || 0), 0);
  const prevOcc     = prevHabDis > 0 ? (prevHabOcu / prevHabDis * 100) : null;
  const prevAdr     = prevHabOcu > 0 ? (prevRevHab / prevHabOcu) : null;
  const prevRevpar  = prevHabDis > 0 ? (prevRevHab / prevHabDis) : null;
  const prevTrevpar = prevHabDis > 0 ? ((prevRevHab + prevRevFnb + prevRevOtros) / prevHabDis) : null;

  const diff = (curr, prev, isEur = false, decimals = 1) => {
    if (prev == null || prev === 0) return { change: "Sin datos prev.", up: true, sub: "" };
    const d = curr - prev;
    const pct = ((d / prev) * 100).toFixed(1);
    const sign = d >= 0 ? "+" : "";
    const val = isEur ? `${sign}€${Math.round(Math.abs(d)).toLocaleString("es-ES")}` : `${sign}${Math.abs(parseFloat(pct))}%`;
    return { change: `${sign}${pct}% vs mes ant.`, up: d >= 0, sub: "" };
  };

  const kpis = [
    { label: "Ocupación",     value: `${occ}%`,    ...diff(parseFloat(occ), prevOcc) },
    { label: "ADR",           value: `€${adr}`,    ...diff(parseFloat(adr), prevAdr) },
    { label: "RevPAR",        value: `€${revpar}`,  ...diff(parseFloat(revpar), prevRevpar) },
    { label: "TRevPAR",       value: `€${trevpar}`, ...diff(parseFloat(trevpar), prevTrevpar) },
    { label: "Revenue Total", value: `€${Math.round(totalRevTotal).toLocaleString("es-ES")}`, ...diff(totalRevTotal, prevRevTot, true) },
  ];

  const esMesActual = mes === new Date().getMonth() && anio === new Date().getFullYear();
  return (
    <div>


      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 14, marginBottom: 24 }}>
        {kpis.map((k, i) => <KpiCard key={i} {...k} i={i} onClick={()=>setKpiModal(k.label)} />)}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "minmax(0,3fr) minmax(0,2fr)", gap: 16, marginBottom: 16 }}>
        <Card>
          <p style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700, fontSize: 16, color: C.text, marginBottom: 4 }}>Evolución — Últimos 30 días</p>
          <p style={{ fontSize: 11, color: C.textLight, marginBottom: 18 }}>Ocupación % y ADR día a día</p>
          <ResponsiveContainer width="100%" height={220}>
            <ComposedChart data={datosDiariosMes} barSize={8}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.border} vertical={false} />
              <XAxis dataKey="dia" tick={{ fill: C.textLight, fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis yAxisId="left"  tick={{ fill: C.textLight, fontSize: 11 }} axisLine={false} tickLine={false} unit="%" domain={[0,100]} />
              <YAxis yAxisId="right" orientation="right" tick={{ fill: C.textLight, fontSize: 11 }} axisLine={false} tickLine={false} unit="€" />
              <Tooltip content={<CustomTooltip />} />
              <Bar  yAxisId="left"  dataKey="occ" name="Ocupación" fill={C.accent} radius={[2,2,0,0]} fillOpacity={0.85} />
              <Line yAxisId="right" dataKey="adr" name="ADR" type="monotone" stroke="#E85D04" strokeWidth={2.5} dot={false} />
            </ComposedChart>
          </ResponsiveContainer>
        </Card>
        <Card>
          <p style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700, fontSize: 16, color: C.text, marginBottom: 4 }}>RevPAR — Evolución {anio}</p>
          <p style={{ fontSize: 11, color: C.textLight, marginBottom: 18 }}>RevPAR vs TRevPAR (€/hab disponible)</p>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={porMes}>
              <defs>
                <linearGradient id="gRevpar" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={C.accent} stopOpacity={0.15} />
                  <stop offset="95%" stopColor={C.accent} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
              <XAxis dataKey="mes" tick={{ fill: C.textLight, fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: C.textLight, fontSize: 11 }} axisLine={false} tickLine={false} unit="€" />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="revpar" name="RevPAR" stroke={C.accent} strokeWidth={2} fill="url(#gRevpar)" dot={{ fill: C.accent, r: 2.5 }} activeDot={{ r: 4 }} />
              <Line type="monotone" dataKey="trevpar" name="TRevPAR" stroke="#E85D04" strokeWidth={1.5} dot={false} strokeDasharray="5 4" />
            </AreaChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <Card>
        <p style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700, fontSize: 16, color: C.text, marginBottom: 16 }}>
          Últimos 12 meses
        </p>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: `2px solid ${C.border}` }}>
                {["Mes","Ocup.","ADR","RevPAR","TRevPAR","Rev. Hab.","Rev. Total"].map(h => (
                  <th key={h} style={{ padding: "8px 12px", textAlign: "right", fontSize: 10, color: C.textLight, textTransform: "uppercase", letterSpacing: "1px", fontWeight: 600 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {porMes.map((d, i) => (
                <tr key={i} onClick={() => onMesDetalle && onMesDetalle(d.mesIdx, d.anioIdx)} style={{ borderBottom: `1px solid ${C.border}`, background: d.mesIdx === mes && d.anioIdx === anio ? C.accentLight : (i % 2 === 0 ? C.bg : C.bgCard), cursor: "pointer" }} onMouseEnter={e => e.currentTarget.style.background = C.accentLight} onMouseLeave={e => e.currentTarget.style.background = MESES_CORTO.indexOf(d.mes) === mes ? C.accentLight : (i % 2 === 0 ? C.bg : C.bgCard)}>
                  <td style={{ padding: "10px 12px", fontWeight: 600, color: C.accent, textDecoration: "underline", cursor: "pointer" }}>{d.mes}</td>
                  <td style={{ padding: "10px 12px", textAlign: "right", color: d.occ > 80 ? C.green : C.textMid }}>{d.occ}%</td>
                  <td style={{ padding: "10px 12px", textAlign: "right", color: C.textMid }}>€{d.adr}</td>
                  <td style={{ padding: "10px 12px", textAlign: "right", fontWeight: 600, color: C.accent }}>€{d.revpar}</td>
                  <td style={{ padding: "10px 12px", textAlign: "right", color: C.blue }}>€{d.trevpar}</td>
                  <td style={{ padding: "10px 12px", textAlign: "right", color: C.textMid }}>€{Math.round(d.revHab).toLocaleString("es-ES")}</td>
                  <td style={{ padding: "10px 12px", textAlign: "right", color: C.textMid }}>€{Math.round(d.revTotal).toLocaleString("es-ES")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
      {kpiModal && <KpiModal kpi={kpiModal} datos={datos} mes={mes} anio={anio} onClose={()=>setKpiModal(null)} />}
    </div>
  );
}

// ─── MODAL RELLENAR PICKUP ───────────────────────────────────────
function PickupEntryModal({ session, onClose, onGuardado }) {
  const hoy = new Date();
  const hoyStr = hoy.toISOString().slice(0,10);
  const CANALES = ["OTA (Booking, Expedia...)", "Web propia", "Teléfono / Email", "Walk-in", "TTOO / Agencia", "Otro"];

  const [entradas, setEntradas] = useState([]);
  const [notas, setNotas] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");
  const [guardadas, setGuardadas] = useState([]);
  const [cargandoHoy, setCargandoHoy] = useState(true);

  // Cargar entradas ya guardadas hoy al abrir
  useEffect(() => {
    const cargar = async () => {
      const { data } = await supabase.from("pickup_entries")
        .select("*")
        .eq("hotel_id", session.user.id)
        .eq("fecha_pickup", hoyStr)
        .order("created_at", { ascending: false });
      setGuardadas(data || []);
      setCargandoHoy(false);
    };
    cargar();
  }, []);

  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const addEntrada = () => setEntradas(e => [...e, { fecha_llegada: "", canal: "", num_reservas: 1 }]);
  const removeEntrada = (i) => setEntradas(e => e.filter((_,j) => j!==i));
  const updateEntrada = (i, field, val) => setEntradas(e => e.map((r,j) => j===i ? {...r,[field]:val} : r));

  const totalNuevas = entradas.reduce((a,e) => a + (parseInt(e.num_reservas)||0), 0);
  const totalHoy = guardadas.reduce((a,e) => a + (e.num_reservas||0), 0);

  const guardar = async () => {
    const validas = entradas.filter(e => e.fecha_llegada && e.num_reservas > 0);
    if (validas.length === 0) { setError("Añade al menos una entrada con fecha de llegada"); return; }
    setGuardando(true); setError("");
    const rows = validas.map(e => ({
      hotel_id: session.user.id,
      fecha_pickup: hoyStr,
      fecha_llegada: e.fecha_llegada,
      canal: e.canal || null,
      num_reservas: parseInt(e.num_reservas) || 1,
      notas: notas || null,
    }));
    const { error: err } = await supabase.from("pickup_entries").insert(rows);
    if (err) { setError("Error al guardar: " + err.message); setGuardando(false); return; }
    // Actualizar lista de guardadas y limpiar formulario
    setGuardadas(prev => [...rows.map((r,i) => ({...r, id: Date.now()+i})), ...prev]);
    setEntradas([]);
    setNotas("");
    setGuardando(false);
    if (onGuardado) onGuardado();
  };

  const inp = { width:"100%", padding:"9px 12px", borderRadius:8, border:`1.5px solid ${C.border}`, fontSize:13, fontFamily:"'DM Sans',sans-serif", color:C.text, background:C.bg, outline:"none", boxSizing:"border-box" };
  const sel = { ...inp, cursor:"pointer" };

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.55)", zIndex:1000, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
      <div style={{ background:C.bgCard, borderRadius:14, width:"100%", maxWidth:640, maxHeight:"90vh", overflow:"auto", padding:28, boxShadow:"0 20px 60px rgba(0,0,0,0.25)" }} onClick={e=>e.stopPropagation()}>

        {/* Header */}
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
          <div>
            <p style={{ fontSize:11, color:C.textLight, textTransform:"uppercase", letterSpacing:2, marginBottom:4 }}>Pickup diario</p>
            <h3 style={{ fontSize:20, fontWeight:800, color:C.text, fontFamily:"'DM Sans',sans-serif", letterSpacing:-0.5 }}>Rellenar Pickup Hoy</h3>
          </div>
          <button onClick={onClose} style={{ background:"none", border:`1.5px solid ${C.border}`, borderRadius:8, width:34, height:34, cursor:"pointer", fontSize:16, color:C.textMid }}
            onMouseEnter={e=>{ e.currentTarget.style.background=C.accent; e.currentTarget.style.color="#fff"; e.currentTarget.style.borderColor=C.accent; }}
            onMouseLeave={e=>{ e.currentTarget.style.background="none"; e.currentTarget.style.color=C.textMid; e.currentTarget.style.borderColor=C.border; }}>
            ×
          </button>
        </div>

        {/* Fecha hoy */}
        <div style={{ background:C.accentLight, borderRadius:10, padding:"12px 16px", marginBottom:20, display:"flex", alignItems:"center", gap:10 }}>
          <span style={{ fontSize:18 }}>📅</span>
          <div>
            <p style={{ fontSize:10, color:C.accent, textTransform:"uppercase", letterSpacing:1.5, fontWeight:700 }}>Fecha de hoy</p>
            <p style={{ fontSize:16, fontWeight:800, color:C.accent, fontFamily:"'DM Sans',sans-serif" }}>
              {hoy.toLocaleDateString("es-ES",{ weekday:"long", day:"numeric", month:"long", year:"numeric" }).replace(/^\w/,c=>c.toUpperCase())}
            </p>
          </div>
        </div>

        {/* Entradas */}
        <div style={{ marginBottom:16 }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
            <p style={{ fontSize:12, fontWeight:700, color:C.textMid, textTransform:"uppercase", letterSpacing:1 }}>Reservas captadas hoy</p>
            <button onClick={addEntrada} style={{ background:C.accent, color:"#fff", border:"none", borderRadius:6, padding:"5px 12px", fontSize:11, fontWeight:700, cursor:"pointer", fontFamily:"'DM Sans',sans-serif" }}>+ Añadir fila</button>
          </div>

          {/* Cabecera */}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 80px 32px", gap:8, marginBottom:6 }}>
            {["Fecha de llegada","Canal","Nº res.",""].map((h,i) => (
              <p key={i} style={{ fontSize:10, color:C.textLight, textTransform:"uppercase", letterSpacing:1, fontWeight:600 }}>{h}</p>
            ))}
          </div>

          {/* Filas */}
          {entradas.map((e,i) => (
            <div key={i} style={{ display:"grid", gridTemplateColumns:"1fr 1fr 80px 32px", gap:8, marginBottom:8 }}>
              <input type="date" value={e.fecha_llegada} onChange={ev=>updateEntrada(i,"fecha_llegada",ev.target.value)} style={inp}/>
              <select value={e.canal} onChange={ev=>updateEntrada(i,"canal",ev.target.value)} style={sel}>
                <option value="">— Canal —</option>
                {CANALES.map(c=><option key={c} value={c}>{c}</option>)}
              </select>
              <input type="number" min="1" value={e.num_reservas} onChange={ev=>updateEntrada(i,"num_reservas",ev.target.value)} style={{...inp, textAlign:"center"}}/>
              {entradas.length > 1
                ? <button onClick={()=>removeEntrada(i)} style={{ background:"none", border:`1px solid ${C.border}`, borderRadius:6, cursor:"pointer", color:C.red, fontSize:14, fontWeight:700 }}>×</button>
                : <div/>
              }
            </div>
          ))}
        </div>

        {/* Notas */}
        <div style={{ marginBottom:16 }}>
          <p style={{ fontSize:10, color:C.textLight, textTransform:"uppercase", letterSpacing:1.5, fontWeight:600, marginBottom:6 }}>📝 Notas del día (opcional)</p>
          <textarea value={notas} onChange={e=>setNotas(e.target.value)} placeholder="Ej: Evento en la ciudad este fin de semana, subida de precios en Booking..." rows={2}
            style={{ ...inp, resize:"vertical", lineHeight:1.5 }}/>
        </div>

        {error && <div style={{ background:C.redLight, color:C.red, padding:"10px 14px", borderRadius:8, fontSize:12, marginBottom:12 }}>⚠️ {error}</div>}

        {/* Botones */}
        <div style={{ display:"flex", gap:10, marginBottom:20 }}>
          <button onClick={onClose} style={{ flex:1, padding:"12px", borderRadius:10, border:`1px solid ${C.border}`, background:"transparent", color:C.textMid, fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:"'DM Sans',sans-serif" }}>Cerrar</button>
          <button onClick={guardar} disabled={guardando || entradas.length===0} style={{ flex:2, padding:"12px", borderRadius:10, border:"none", background:(guardando||entradas.length===0)?C.accentLight:C.accent, color:(guardando||entradas.length===0)?C.accentDark:"#fff", fontSize:13, fontWeight:700, cursor:(guardando||entradas.length===0)?"not-allowed":"pointer", fontFamily:"'DM Sans',sans-serif" }}>
            {guardando ? "Guardando..." : `✓ Guardar ${totalNuevas} reservas`}
          </button>
        </div>

        {/* ── Reservas captadas hoy ── */}
        <div style={{ borderTop:`1px solid ${C.border}`, paddingTop:16 }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
            <p style={{ fontSize:11, fontWeight:700, color:C.textMid, textTransform:"uppercase", letterSpacing:1 }}>
              ✅ Reservas captadas hoy
            </p>
            <span style={{ fontSize:18, fontWeight:800, color:C.accent, fontFamily:"'DM Sans',sans-serif" }}>
              {totalHoy} reservas
            </span>
          </div>
          {cargandoHoy ? (
            <p style={{ fontSize:12, color:C.textLight, textAlign:"center", padding:"12px 0" }}>Cargando...</p>
          ) : guardadas.length === 0 ? (
            <p style={{ fontSize:12, color:C.textLight, textAlign:"center", padding:"12px 0" }}>Aún no hay reservas registradas hoy</p>
          ) : (
            <div style={{ display:"flex", flexDirection:"column", gap:6, maxHeight:220, overflowY:"auto" }}>
              {guardadas.map((e, i) => (
                <div key={i} style={{ display:"grid", gridTemplateColumns:"1fr 1fr 60px", gap:8, background:i%2===0?C.bg:C.bgCard, borderRadius:8, padding:"8px 12px", border:`1px solid ${C.border}` }}>
                  <div>
                    <p style={{ fontSize:9, color:C.textLight, textTransform:"uppercase", letterSpacing:1 }}>Llegada</p>
                    <p style={{ fontSize:12, fontWeight:600, color:C.text }}>{e.fecha_llegada}</p>
                  </div>
                  <div>
                    <p style={{ fontSize:9, color:C.textLight, textTransform:"uppercase", letterSpacing:1 }}>Canal</p>
                    <p style={{ fontSize:12, color:C.textMid }}>{e.canal || "—"}</p>
                  </div>
                  <div style={{ textAlign:"right" }}>
                    <p style={{ fontSize:9, color:C.textLight, textTransform:"uppercase", letterSpacing:1 }}>Res.</p>
                    <p style={{ fontSize:16, fontWeight:800, color:C.accent, fontFamily:"'DM Sans',sans-serif" }}>{e.num_reservas}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── PICKUP VIEW ──────────────────────────────────────────────────
function PickupView({ datos }) {
  const { pickup, produccion, session, pickupEntries } = datos;
  const [showEntryModal, setShowEntryModal] = useState(false);

  const hoy = new Date();
  const hoyStr = hoy.toISOString().slice(0,10);
  const hoyLYStr = `${hoy.getFullYear()-1}-${String(hoy.getMonth()+1).padStart(2,"0")}-${String(hoy.getDate()).padStart(2,"0")}`;
  const ayer = new Date(hoy); ayer.setDate(hoy.getDate()-1);
  const ayerStr = ayer.toISOString().slice(0,10);
  const hace2d = new Date(hoy); hace2d.setDate(hoy.getDate()-2);
  const hace2dStr = hace2d.toISOString().slice(0,10);

  const MESES_CAMPOS = ["enero","febrero","marzo","abril","mayo","junio","julio","agosto","septiembre","octubre","noviembre","diciembre"];

  // Producción indexada por fecha
  const prodPorFecha = {};
  (produccion||[]).forEach(d => { prodPorFecha[d.fecha] = d; });

  // Pickup indexado por fecha
  const pickupPorFecha = {};
  pickup.forEach(d => { pickupPorFecha[d.fecha_pickup] = d; });

  // OTB acumulado hasta una fecha para un mes específico
  const getOTB = (hastaFecha, mesIdx) => {
    return (pickupEntries || [])
      .filter(e => e.fecha_pickup <= hastaFecha && new Date(e.fecha_llegada + "T00:00:00").getMonth() === mesIdx)
      .reduce((a, e) => a + (e.num_reservas || 1), 0);
  };

  // Habitaciones disponibles por día (media de producción histórica)
  const habDisponibles = (produccion||[]).length > 0
    ? Math.round((produccion||[]).reduce((a,d)=>a+(d.hab_disponibles||30),0)/(produccion||[]).length)
    : 30;

  // Todas las entradas de pickup (Excel + web) indexadas por fecha_llegada
  // pickup y pickupEntries apuntan al mismo array (pickup_entries)
  const reservasPorFechaLlegada = {};
  (pickupEntries || []).forEach(e => {
    const fl = e.fecha_llegada;
    if (!fl) return;
    reservasPorFechaLlegada[fl] = (reservasPorFechaLlegada[fl] || 0) + (e.num_reservas || 1);
  });

  // OTB total por mes (suma de reservas captadas para ese mes de llegada)
  const otbPorMes = {};
  Object.entries(reservasPorFechaLlegada).forEach(([fecha, reservas]) => {
    const mesIdx = new Date(fecha + "T00:00:00").getMonth();
    otbPorMes[mesIdx] = (otbPorMes[mesIdx] || 0) + reservas;
  });

  const getOccOTB = (fechaStr) => {
    const prod = prodPorFecha[fechaStr];
    if (prod) {
      // Fecha pasada o hoy: ocupación real
      const habDis = prod.hab_disponibles || habDisponibles;
      return habDis > 0 ? Math.round(prod.hab_ocupadas / habDis * 100) : 0;
    }
    // Fecha futura: reservas captadas para ese día exacto
    const reservasDia = reservasPorFechaLlegada[fechaStr] || 0;
    if (reservasDia > 0) {
      // Tenemos dato exacto por día
      return Math.min(Math.round(reservasDia / habDisponibles * 100), 100);
    }
    // Sin dato por día: distribuir OTB del mes uniformemente
    const f = new Date(fechaStr + "T00:00:00");
    const mesIdx = f.getMonth();
    const anioF = f.getFullYear();
    const diasDelMes = new Date(anioF, mesIdx + 1, 0).getDate();
    const otbMes = otbPorMes[mesIdx] || 0;
    if (!otbMes || !habDisponibles || !diasDelMes) return 0;
    return Math.min(Math.round((otbMes / diasDelMes) / habDisponibles * 100), 100);
  };

  // Pickup de una fecha para un mes concreto (hab reservadas ese día para ese mes)
  const getPickupDia = (fechaPickup, mesIdx) => {
    const d = pickupPorFecha[fechaPickup];
    if (!d) return 0;
    return d[`mes_${MESES_CAMPOS[mesIdx]}`] || 0;
  };

  // Color ocupación degradado rojo → amarillo → verde oscuro
  const getOccBg = (occ) => {
    if (!occ || occ === 0) return { bg: C.bg, text: C.textLight };
    if (occ >= 85) return { bg: "#004D26", text: "#fff" };
    if (occ >= 70) return { bg: "#1A7A3C", text: "#fff" };
    if (occ >= 55) return { bg: "#4CAF50", text: "#fff" };
    if (occ >= 40) return { bg: "#FFC107", text: "#1A1A1A" };
    if (occ >= 25) return { bg: "#FF7043", text: "#fff" };
    return { bg: "#D32F2F", text: "#fff" };
  };

  // ── BLOQUE 1: Calendario 3 meses ──────────────────────────────
  const [calOffset, setCalOffset] = useState(0);
  const meses3 = [0].map(i => {
    const d = new Date(hoy.getFullYear(), hoy.getMonth() + calOffset + i, 1);
    return { anio: d.getFullYear(), mes: d.getMonth() };
  });

  // ── BLOQUE 2: Pace tabla 4 meses ─────────────────────────────
  const pace4 = [0,1,2,3].map(offset => {
    const d = new Date(hoy.getFullYear(), hoy.getMonth() + offset, 1);
    const mesIdx = d.getMonth();
    const otbActual = getOTB(hoyStr, mesIdx);
    const otbLY     = getOTB(hoyLYStr, mesIdx);
    const diff      = otbLY > 0 ? otbActual - otbLY : null;
    const diffPct   = otbLY > 0 ? ((otbActual - otbLY)/otbLY*100).toFixed(1) : null;
    return {
      label: `${MESES_FULL[mesIdx]} ${d.getFullYear()}`,
      otbActual, otbLY,
      diff, diffPct,
      status: diffPct===null?"neutral":parseFloat(diffPct)>=5?"up":parseFloat(diffPct)<=-5?"down":"neutral"
    };
  });

  // ── BLOQUE 3: Top 5 fechas calientes ─────────────────────────
  // Para cada fecha futura, suma pickup total de ayer y anteayer
  const fechasCalientes = [];
  for (let i = 1; i <= 90; i++) {
    const fd = new Date(hoy); fd.setDate(hoy.getDate() + i);
    const fdStr = fd.toISOString().slice(0,10);
    const mesIdx = fd.getMonth();
    const campo  = `mes_${MESES_CAMPOS[mesIdx]}`;
    const puAyer = pickupPorFecha[ayerStr]?.[campo] || 0;
    const puAntes= pickupPorFecha[hace2dStr]?.[campo] || 0;
    const puReciente = puAyer + puAntes;
    if (puReciente > 0) {
      const occ = getOccOTB(fdStr);
      fechasCalientes.push({
        fecha: fd,
        fechaStr: fdStr,
        label: fd.toLocaleDateString("es-ES",{weekday:"long",day:"numeric",month:"long"}),
        puReciente, puAyer, occ
      });
    }
  }
  fechasCalientes.sort((a,b)=>b.puReciente-a.puReciente);
  const top5 = fechasCalientes.slice(0,5);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

      {/* ── HEADER ── */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <div>
          <h2 style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 20, fontWeight: 700, color: C.text, letterSpacing: -0.3 }}>Pickup & Demanda</h2>
          <p style={{ fontSize: 12, color: C.textLight, marginTop: 3 }}>
            {hoy.toLocaleDateString("es-ES",{weekday:"long",day:"numeric",month:"long",year:"numeric"}).replace(/^./,c=>c.toUpperCase())}
          </p>
        </div>
        <button onClick={()=>setShowEntryModal(true)} style={{ background:C.accent, color:"#fff", border:"none", borderRadius:10, padding:"10px 20px", fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:"'DM Sans',sans-serif", display:"flex", alignItems:"center", gap:8, boxShadow:"0 2px 8px rgba(0,75,135,0.3)" }}>
          ✏️ Rellenar Pickup Hoy
        </button>
      </div>
      {showEntryModal && <PickupEntryModal session={session} onClose={()=>setShowEntryModal(false)} onGuardado={()=>{}} />}

      {/* ── LAYOUT: Calendario + Lateral ── */}
      <div style={{ display: "grid", gridTemplateColumns: "minmax(0,3fr) minmax(0,2fr)", gap: 20, alignItems: "start" }}>

        {/* COLUMNA IZQUIERDA: Calendario 3 meses */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

          {meses3.map(({ anio, mes }) => {
            const diasMes = new Date(anio, mes+1, 0).getDate();
            const primerDia = new Date(anio, mes, 1).getDay();
            const offset = (primerDia + 6) % 7;
            return (
              <Card key={`${anio}-${mes}`}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                    <button onClick={()=>setCalOffset(o=>o-1)} style={{ background:"none", border:`1px solid ${C.border}`, borderRadius:6, width:26, height:26, cursor:"pointer", color:C.textMid, fontSize:14, display:"flex", alignItems:"center", justifyContent:"center" }}>‹</button>
                    <p style={{ fontWeight: 800, fontSize: 15, color: C.text, fontFamily: "'DM Sans',sans-serif", textTransform: "uppercase", letterSpacing: 0.5 }}>
                      {MESES_FULL[mes]} {anio}
                    </p>
                    <button onClick={()=>setCalOffset(o=>o+1)} style={{ background:"none", border:`1px solid ${C.border}`, borderRadius:6, width:26, height:26, cursor:"pointer", color:C.textMid, fontSize:14, display:"flex", alignItems:"center", justifyContent:"center" }}>›</button>
                  </div>
                  <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                    {[["<25%","#D32F2F"],["25-40%","#FF7043"],["40-55%","#FFC107"],["55-70%","#4CAF50"],["70-85%","#1A7A3C"],["≥85%","#004D26"]].map(([l,c])=>(
                      <div key={l} style={{ display:"flex", alignItems:"center", gap:3 }}>
                        <div style={{ width:10, height:10, borderRadius:2, background:c, border:`1px solid ${C.border}` }}/>
                        <span style={{ fontSize:9, color:C.textLight }}>{l}</span>
                      </div>
                    ))}
                  </div>
                </div>
                {/* Cabecera días */}
                <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:3, marginBottom:3 }}>
                  {["L","M","X","J","V","S","D"].map(d=>(
                    <div key={d} style={{ textAlign:"center", fontSize:10, color:C.textLight, fontWeight:600, padding:"2px 0" }}>{d}</div>
                  ))}
                </div>
                {/* Grid días */}
                <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:3 }}>
                  {Array.from({length:offset}).map((_,i)=><div key={`e${i}`}/>)}
                  {Array.from({length:diasMes}).map((_,i)=>{
                    const dia = i+1;
                    const fechaStr = `${anio}-${String(mes+1).padStart(2,"0")}-${String(dia).padStart(2,"0")}`;
                    const esPasado = fechaStr < hoyStr;
                    const esHoy2   = fechaStr === hoyStr;
                    const occ      = getOccOTB(fechaStr);
                    const { bg, text } = getOccBg(occ);
                    const esFinde  = new Date(anio,mes,dia).getDay()===0||new Date(anio,mes,dia).getDay()===6;
                    // Actividad reciente: pickup ayer para este mes
                    const campo = `mes_${MESES_CAMPOS[mes]}`;
                    const pickupAyer = pickupPorFecha[ayerStr]?.[campo] || 0;
                    const hayActividad = pickupAyer > 0 && !esPasado;
                    return (
                      <div key={dia} style={{
                        background: esPasado ? "#F5F5F5" : occ > 0 ? bg : C.bg,
                        borderRadius: 8,
                        padding: "6px 2px",
                        textAlign: "center",
                        border: esHoy2 ? `2px solid ${C.accent}` : hayActividad ? `1.5px solid #1A7A3C` : `1px solid ${esFinde ? C.accent+"33" : C.border}`,
                        minHeight: 52,
                        display: "flex", flexDirection: "column", justifyContent: "space-between", alignItems: "center",
                        opacity: esPasado ? 0.45 : 1,
                        boxShadow: !esPasado && occ > 0 ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
                        transition: "transform 0.1s",
                        cursor: "default",
                        position: "relative",
                        overflow: "hidden",
                      }}>
                        {/* Barras decorativas interiores */}
                        {!esPasado && occ > 0 && (
                          <div style={{ position:"absolute", bottom:0, left:0, right:0, height:`${Math.round(occ * 0.45)}%`, background: "rgba(255,255,255,0.15)", borderRadius:"0 0 8px 8px", pointerEvents:"none" }}/>
                        )}
                        <span style={{ fontSize:10, color: esPasado ? C.textLight : occ>0 ? text : C.textLight, fontWeight: esFinde||esHoy2 ? 700 : 400, lineHeight:1.4, position:"relative" }}>{dia}</span>
                        {!esPasado && occ > 0 ? (
                          <span style={{ fontSize:12, fontWeight:800, color:text, lineHeight:1, fontFamily:"'DM Sans',sans-serif", position:"relative" }}>{occ}%</span>
                        ) : !esPasado ? (
                          <span style={{ fontSize:10, color:C.border }}>—</span>
                        ) : null}
                        <span style={{ fontSize:8, color: hayActividad?"#1A7A3C":esFinde&&!esPasado?C.accent+"88":"transparent", fontWeight:700, position:"relative" }}>{hayActividad?"↑":esFinde&&!esPasado?"★":""}</span>
                      </div>
                    );
                  })}
                </div>
              </Card>
            );
          })}
        </div>

        {/* COLUMNA DERECHA: Pace + Top 5 */}
        <div style={{ display:"flex", flexDirection:"column", gap:16 }}>

          {/* PACE */}
          <Card>
            <p style={{ fontWeight:800, fontSize:15, color:C.text, fontFamily:"'DM Sans',sans-serif", marginBottom:4 }}>Pace vs Año Anterior</p>
            <p style={{ fontSize:11, color:C.textLight, marginBottom:14 }}>OTB actual vs misma fecha de {hoy.getFullYear()-1}</p>
            <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
              {pace4.map((d,i)=>(
                <div key={i} style={{ background:C.bg, borderRadius:8, padding:"12px 14px", border:`1px solid ${C.border}`, borderLeft:`3px solid ${d.status==="up"?C.green:d.status==="down"?C.red:C.border}` }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:6 }}>
                    <p style={{ fontSize:13, fontWeight:700, color:C.text }}>{d.label}</p>
                    {d.diffPct !== null && (
                      <span style={{ fontSize:11, fontWeight:700, padding:"2px 8px", borderRadius:4, background:parseFloat(d.diffPct)>=0?C.greenLight:C.redLight, color:parseFloat(d.diffPct)>=0?C.green:C.red }}>
                        {parseFloat(d.diffPct)>=0?"+":""}{d.diffPct}%
                      </span>
                    )}
                  </div>
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8 }}>
                    <div>
                      <p style={{ fontSize:9, color:C.textLight, textTransform:"uppercase", letterSpacing:1 }}>OTB Actual</p>
                      <p style={{ fontSize:18, fontWeight:800, color:C.accent, fontFamily:"'DM Sans',sans-serif" }}>{d.otbActual}</p>
                    </div>
                    <div>
                      <p style={{ fontSize:9, color:C.textLight, textTransform:"uppercase", letterSpacing:1 }}>OTB LY</p>
                      <p style={{ fontSize:18, fontWeight:800, color:C.textMid, fontFamily:"'DM Sans',sans-serif" }}>{d.otbLY>0?d.otbLY:"—"}</p>
                    </div>
                    <div>
                      <p style={{ fontSize:9, color:C.textLight, textTransform:"uppercase", letterSpacing:1 }}>Diferencia</p>
                      <p style={{ fontSize:18, fontWeight:800, color:d.diff===null?C.textLight:d.diff>=0?C.green:C.red, fontFamily:"'DM Sans',sans-serif" }}>
                        {d.diff!==null?`${d.diff>=0?"+":""}${d.diff}`:"—"}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* TOP 5 FECHAS CALIENTES */}
          <Card>
            <p style={{ fontWeight:800, fontSize:15, color:C.text, fontFamily:"'DM Sans',sans-serif", marginBottom:4 }}>🔥 Fechas Calientes</p>
            <p style={{ fontSize:11, color:C.textLight, marginBottom:14 }}>Días futuros con mayor pickup en las últimas 48h</p>
            {top5.length === 0 ? (
              <p style={{ fontSize:12, color:C.textLight, textAlign:"center", padding:"20px 0" }}>Sin actividad reciente detectada</p>
            ) : (
              <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                {top5.map((d,i)=>(
                  <div key={i} style={{ display:"flex", alignItems:"center", gap:12, padding:"10px 12px", borderRadius:8, background:i===0?"#FFF8E7":C.bg, border:`1px solid ${i===0?"#F0A500":C.border}` }}>
                    <div style={{ width:28, height:28, borderRadius:"50%", background:i===0?"#F0A500":C.accentLight, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                      <span style={{ fontSize:13, fontWeight:800, color:i===0?"#fff":C.accent }}>#{i+1}</span>
                    </div>
                    <div style={{ flex:1 }}>
                      <p style={{ fontSize:12, fontWeight:700, color:C.text, textTransform:"capitalize" }}>{d.label}</p>
                      <p style={{ fontSize:11, color:C.textLight, marginTop:1 }}>+{d.puReciente} reservas · Ocup. actual: {d.occ}%</p>
                    </div>
                    <div style={{ textAlign:"right" }}>
                      <p style={{ fontSize:16, fontWeight:800, color:d.occ>=75?C.green:d.occ>=50?C.accent:C.red, fontFamily:"'DM Sans',sans-serif" }}>{d.occ}%</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}

// ─── BUDGET VIEW ──────────────────────────────────────────────────
function BudgetView({ datos, anio: anioProp }) {
  const { produccion, presupuesto } = datos;

  // Detectar años disponibles en el presupuesto
  const aniosDisponibles = [...new Set((presupuesto || []).map(p => p.anio))].sort();
  const [anio, setAnio] = useState(() => aniosDisponibles.includes(anioProp) ? anioProp : (aniosDisponibles[aniosDisponibles.length - 1] || anioProp));

  if (!presupuesto || presupuesto.length === 0) {
    return <EmptyState mensaje="Importa tu plantilla Excel con los datos de la hoja 💰 Presupuesto para ver el análisis aquí" />;
  }

  // Calcular reales desde producción por mes
  const realesPorMes = MESES_FULL.map((_, i) => {
    const d = (produccion || []).filter(r => {
      const f = new Date(r.fecha + "T00:00:00");
      return f.getMonth() === i && f.getFullYear() === anio;
    });
    const habOcu = d.reduce((a, r) => a + (r.hab_ocupadas || 0), 0);
    const habDis = d.reduce((a, r) => a + (r.hab_disponibles || 0), 0);
    const revH   = d.reduce((a, r) => a + (r.revenue_hab || 0), 0);
    const revT   = d.reduce((a, r) => a + (r.revenue_total || 0), 0);
    return {
      adr_real:       habOcu > 0 ? Math.round(revH / habOcu) : null,
      revpar_real:    habDis > 0 ? Math.round(revH / habDis) : null,
      rev_total_real: d.length > 0 ? Math.round(revT) : null,
    };
  });

  // Combinar presupuesto + reales
  const filas = presupuesto
    .filter(p => p.anio === anio)
    .sort((a, b) => a.mes - b.mes)
    .map(p => {
      const real = realesPorMes[p.mes - 1];
      const adr_dev       = real.adr_real != null       ? real.adr_real - p.adr_ppto           : null;
      const revpar_dev    = real.revpar_real != null     ? real.revpar_real - p.revpar_ppto       : null;
      const revtotal_dev  = real.rev_total_real != null  ? real.rev_total_real - p.rev_total_ppto : null;
      return {
        mes:            MESES_CORTO[p.mes - 1],
        mesIdx:         p.mes - 1,
        adr_ppto:       p.adr_ppto,
        adr_real:       real.adr_real,
        adr_dev,
        adr_dev_pct:    p.adr_ppto > 0 && adr_dev != null ? ((adr_dev / p.adr_ppto) * 100).toFixed(1) : null,
        revpar_ppto:    p.revpar_ppto,
        revpar_real:    real.revpar_real,
        revpar_dev,
        revpar_dev_pct: p.revpar_ppto > 0 && revpar_dev != null ? ((revpar_dev / p.revpar_ppto) * 100).toFixed(1) : null,
        rev_total_ppto: p.rev_total_ppto,
        rev_total_real: real.rev_total_real,
        revtotal_dev,
        revtotal_dev_pct: p.rev_total_ppto > 0 && revtotal_dev != null ? ((revtotal_dev / p.rev_total_ppto) * 100).toFixed(1) : null,
      };
    });

  const filasConReal = filas.filter(f => f.adr_real != null || f.revpar_real != null);

  // KPIs anuales acumulados (solo meses con real)
  const totalRevPpto  = filas.reduce((a, f) => a + (f.rev_total_ppto || 0), 0);
  const totalRevReal  = filasConReal.reduce((a, f) => a + (f.rev_total_real || 0), 0);
  const totalRevDev   = totalRevReal - filasConReal.reduce((a, f) => a + (f.rev_total_ppto || 0), 0);
  const totalRevDevPct = filasConReal.length > 0
    ? ((totalRevDev / filasConReal.reduce((a,f) => a + (f.rev_total_ppto||0), 0)) * 100).toFixed(1)
    : null;

  const mediaAdrPpto  = filas.length > 0 ? Math.round(filas.reduce((a,f) => a+(f.adr_ppto||0),0)/filas.length) : 0;
  const mediaAdrReal  = filasConReal.length > 0 ? Math.round(filasConReal.reduce((a,f) => a+(f.adr_real||0),0)/filasConReal.length) : null;
  const mediaRevparPpto = filas.length > 0 ? Math.round(filas.reduce((a,f) => a+(f.revpar_ppto||0),0)/filas.length) : 0;
  const mediaRevparReal = filasConReal.length > 0 ? Math.round(filasConReal.reduce((a,f) => a+(f.revpar_real||0),0)/filasConReal.length) : null;

  // Datos para la gráfica (solo meses con ambos datos)
  const chartData = filas.map(f => ({
    mes:          f.mes,
    "RevPAR Ppto": f.revpar_ppto,
    "RevPAR Real": f.revpar_real,
    "ADR Ppto":   f.adr_ppto,
    "ADR Real":   f.adr_real,
  }));

  const chartRevTotal = filas.map(f => ({
    mes:              f.mes,
    "Rev. Ppto (k€)": f.rev_total_ppto ? Math.round(f.rev_total_ppto / 1000) : null,
    "Rev. Real (k€)": f.rev_total_real ? Math.round(f.rev_total_real / 1000) : null,
  }));

  const DevBadge = ({ val, pct }) => {
    if (val == null) return <span style={{ color: C.textLight, fontSize: 11 }}>—</span>;
    const up = val >= 0;
    return (
      <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: up ? C.green : C.red }}>
          {up ? "+" : ""}{val > 999 ? `${(val/1000).toFixed(1)}k` : val}€
        </span>
        {pct != null && (
          <span style={{ fontSize: 10, fontWeight: 600, padding: "1px 5px", borderRadius: 3, background: up ? C.greenLight : C.redLight, color: up ? C.green : C.red }}>
            {up ? "+" : ""}{pct}%
          </span>
        )}
      </span>
    );
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28 }}>
        <div>
          <h2 style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 20, fontWeight: 700, color: C.text, letterSpacing: -0.3 }}>Presupuesto vs Real</h2>
          <p style={{ fontSize: 12, color: C.textLight, marginTop: 4 }}>Seguimiento del cumplimiento presupuestario · {anio}</p>
        </div>
        {aniosDisponibles.length > 1 && (
          <select value={anio} onChange={e => setAnio(parseInt(e.target.value))} style={{ padding: "6px 10px", borderRadius: 6, border: `1px solid ${C.border}`, fontSize: 12, fontWeight: 600, color: C.text, background: C.bgCard, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", outline: "none", letterSpacing: 0.2 }}>
            {aniosDisponibles.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
        )}
      </div>

      {/* KPIs resumen */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 14, marginBottom: 24 }}>
        <KpiCard
          label="Revenue Total Ppto."
          value={`€${Math.round(totalRevPpto).toLocaleString("es-ES")}`}
          change="Año completo"
          sub="objetivo anual"
          up={true} i={0}
        />
        <KpiCard
          label="Revenue Real (YTD)"
          value={`€${Math.round(totalRevReal).toLocaleString("es-ES")}`}
          change={totalRevDevPct != null ? `${totalRevDevPct >= 0 ? "+" : ""}${totalRevDevPct}%` : "—"}
          sub="vs presupuesto"
          up={totalRevDev >= 0} i={1}
        />
        <KpiCard
          label="ADR Medio Ppto."
          value={`€${mediaAdrPpto}`}
          change={mediaAdrReal != null ? `Real: €${mediaAdrReal}` : "Sin real"}
          sub="precio medio objetivo"
          up={mediaAdrReal == null || mediaAdrReal >= mediaAdrPpto} i={2}
        />
        <KpiCard
          label="RevPAR Medio Ppto."
          value={`€${mediaRevparPpto}`}
          change={mediaRevparReal != null ? `Real: €${mediaRevparReal}` : "Sin real"}
          sub="por hab disponible"
          up={mediaRevparReal == null || mediaRevparReal >= mediaRevparPpto} i={3}
        />
      </div>

      {/* Gráficas */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
        <Card>
          <p style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700, fontSize: 16, color: C.text, marginBottom: 4 }}>ADR — Ppto. vs Real</p>
          <p style={{ fontSize: 11, color: C.textLight, marginBottom: 18 }}>€ precio medio por habitación</p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData} barSize={14} barGap={3}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.border} vertical={false} />
              <XAxis dataKey="mes" tick={{ fill: C.textLight, fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: C.textLight, fontSize: 11 }} axisLine={false} tickLine={false} unit="€" />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 11, color: C.textMid, paddingTop: 8 }} />
              <Bar dataKey="ADR Ppto" fill={`${C.accent}55`} radius={[3,3,0,0]} />
              <Bar dataKey="ADR Real" fill={C.accent}        radius={[3,3,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card>
          <p style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700, fontSize: 16, color: C.text, marginBottom: 4 }}>Revenue Total — Ppto. vs Real</p>
          <p style={{ fontSize: 11, color: C.textLight, marginBottom: 18 }}>Miles de € por mes</p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartRevTotal} barSize={14} barGap={3}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.border} vertical={false} />
              <XAxis dataKey="mes" tick={{ fill: C.textLight, fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: C.textLight, fontSize: 11 }} axisLine={false} tickLine={false} unit="k" />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 11, color: C.textMid, paddingTop: 8 }} />
              <Bar dataKey="Rev. Ppto (k€)" fill={`${C.blue}55`} radius={[3,3,0,0]} />
              <Bar dataKey="Rev. Real (k€)" fill={C.blue}        radius={[3,3,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Tabla detallada */}
      <Card>
        <p style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700, fontSize: 16, color: C.text, marginBottom: 16 }}>Detalle mensual</p>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <thead>
              <tr style={{ borderBottom: `2px solid ${C.border}` }}>
                <th style={{ padding: "8px 12px", textAlign: "left",  fontSize: 10, color: C.textLight, textTransform: "uppercase", letterSpacing: "1px", fontWeight: 600 }}>Mes</th>
                {/* ADR */}
                <th style={{ padding: "8px 8px",  textAlign: "right", fontSize: 10, color: C.textLight, textTransform: "uppercase", letterSpacing: "1px", fontWeight: 600 }}>ADR Ppto.</th>
                <th style={{ padding: "8px 8px",  textAlign: "right", fontSize: 10, color: C.textLight, textTransform: "uppercase", letterSpacing: "1px", fontWeight: 600 }}>ADR Real</th>
                <th style={{ padding: "8px 8px",  textAlign: "right", fontSize: 10, color: C.textLight, textTransform: "uppercase", letterSpacing: "1px", fontWeight: 600 }}>Desv. ADR</th>
                {/* RevPAR */}
                <th style={{ padding: "8px 8px",  textAlign: "right", fontSize: 10, color: C.textLight, textTransform: "uppercase", letterSpacing: "1px", fontWeight: 600 }}>RevPAR Ppto.</th>
                <th style={{ padding: "8px 8px",  textAlign: "right", fontSize: 10, color: C.textLight, textTransform: "uppercase", letterSpacing: "1px", fontWeight: 600 }}>RevPAR Real</th>
                <th style={{ padding: "8px 8px",  textAlign: "right", fontSize: 10, color: C.textLight, textTransform: "uppercase", letterSpacing: "1px", fontWeight: 600 }}>Desv. RevPAR</th>
                {/* Rev Total */}
                <th style={{ padding: "8px 8px",  textAlign: "right", fontSize: 10, color: C.textLight, textTransform: "uppercase", letterSpacing: "1px", fontWeight: 600 }}>Rev. Total Ppto.</th>
                <th style={{ padding: "8px 8px",  textAlign: "right", fontSize: 10, color: C.textLight, textTransform: "uppercase", letterSpacing: "1px", fontWeight: 600 }}>Rev. Total Real</th>
                <th style={{ padding: "8px 8px",  textAlign: "right", fontSize: 10, color: C.textLight, textTransform: "uppercase", letterSpacing: "1px", fontWeight: 600 }}>Desv. Rev. Total</th>
              </tr>
            </thead>
            <tbody>
              {filas.map((f, i) => (
                <tr key={i} style={{ borderBottom: `1px solid ${C.border}`, background: i % 2 === 0 ? "#FAFAFA" : C.bgCard }}>
                  <td style={{ padding: "10px 12px", fontWeight: 600, color: C.text }}>{f.mes}</td>
                  {/* ADR */}
                  <td style={{ padding: "10px 8px", textAlign: "right", color: C.textMid }}>€{f.adr_ppto}</td>
                  <td style={{ padding: "10px 8px", textAlign: "right", color: C.text, fontWeight: f.adr_real ? 600 : 400 }}>{f.adr_real != null ? `€${f.adr_real}` : "—"}</td>
                  <td style={{ padding: "10px 8px", textAlign: "right" }}><DevBadge val={f.adr_dev} pct={f.adr_dev_pct} /></td>
                  {/* RevPAR */}
                  <td style={{ padding: "10px 8px", textAlign: "right", color: C.textMid }}>€{f.revpar_ppto}</td>
                  <td style={{ padding: "10px 8px", textAlign: "right", color: C.accent, fontWeight: f.revpar_real ? 600 : 400 }}>{f.revpar_real != null ? `€${f.revpar_real}` : "—"}</td>
                  <td style={{ padding: "10px 8px", textAlign: "right" }}><DevBadge val={f.revpar_dev} pct={f.revpar_dev_pct} /></td>
                  {/* Rev Total */}
                  <td style={{ padding: "10px 8px", textAlign: "right", color: C.textMid }}>€{f.rev_total_ppto?.toLocaleString("es-ES")}</td>
                  <td style={{ padding: "10px 8px", textAlign: "right", color: C.blue, fontWeight: f.rev_total_real ? 600 : 400 }}>{f.rev_total_real != null ? `€${f.rev_total_real.toLocaleString("es-ES")}` : "—"}</td>
                  <td style={{ padding: "10px 8px", textAlign: "right" }}><DevBadge val={f.revtotal_dev} pct={f.revtotal_dev_pct} /></td>
                </tr>
              ))}
              {/* Fila totales */}
              {filasConReal.length > 0 && (
                <tr style={{ borderTop: `2px solid ${C.border}`, background: C.accentLight, fontWeight: 700 }}>
                  <td style={{ padding: "10px 12px", color: C.text, fontWeight: 700 }}>TOTAL YTD</td>
                  <td colSpan={2} style={{ padding: "10px 8px", textAlign: "right", color: C.textMid, fontSize: 11 }}>Ppto: €{mediaAdrPpto} media</td>
                  <td style={{ padding: "10px 8px", textAlign: "right" }}><DevBadge val={mediaAdrReal != null ? mediaAdrReal - mediaAdrPpto : null} pct={mediaAdrReal != null ? (((mediaAdrReal - mediaAdrPpto)/mediaAdrPpto)*100).toFixed(1) : null} /></td>
                  <td colSpan={2} style={{ padding: "10px 8px", textAlign: "right", color: C.textMid, fontSize: 11 }}>Ppto: €{mediaRevparPpto} media</td>
                  <td style={{ padding: "10px 8px", textAlign: "right" }}><DevBadge val={mediaRevparReal != null ? mediaRevparReal - mediaRevparPpto : null} pct={mediaRevparReal != null ? (((mediaRevparReal - mediaRevparPpto)/mediaRevparPpto)*100).toFixed(1) : null} /></td>
                  <td style={{ padding: "10px 8px", textAlign: "right", color: C.textMid, fontSize: 11 }}>€{Math.round(filasConReal.reduce((a,f)=>a+(f.rev_total_ppto||0),0)).toLocaleString("es-ES")}</td>
                  <td style={{ padding: "10px 8px", textAlign: "right", color: C.blue }}>€{Math.round(totalRevReal).toLocaleString("es-ES")}</td>
                  <td style={{ padding: "10px 8px", textAlign: "right" }}><DevBadge val={Math.round(totalRevDev)} pct={totalRevDevPct} /></td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

// ─── AUTH SCREEN ──────────────────────────────────────────────────
function AuthScreen() {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [hotelNombre, setHotelNombre] = useState("");
  const [hotelCiudad, setHotelCiudad] = useState("");
  const [habitaciones, setHabitaciones] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");

  const handleLogin = async () => {
    setLoading(true); setError("");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setError("Email o contraseña incorrectos");
    setLoading(false);
  };

  const handleRegister = async () => {
    if (!hotelNombre || !email || !password) { setError("Rellena todos los campos obligatorios"); return; }
    setLoading(true); setError("");
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) { setError(error.message); setLoading(false); return; }
    if (data.user) {
      await supabase.from("hoteles").insert({ id: data.user.id, nombre: hotelNombre, ciudad: hotelCiudad, habitaciones: parseInt(habitaciones) || null });
    }
    setMensaje("¡Cuenta creada! Ya puedes iniciar sesión.");
    setLoading(false);
  };

  const inp = { width: "100%", padding: "11px 14px", borderRadius: 8, border: `1.5px solid ${C.border}`, fontSize: 14, fontFamily: "'DM Sans', sans-serif", color: C.text, background: C.bg, outline: "none" };

  return (
    <div style={{ minHeight: "100vh", background: C.bgDeep, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700;800&family=DM+Sans:wght@300;400;500;600&display=swap'); * { box-sizing: border-box; margin: 0; padding: 0; } @keyframes fadeUp { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: translateY(0); } }`}</style>
      <div style={{ width: 420, background: C.bgCard, borderRadius: 20, padding: "40px 36px", boxShadow: "0 32px 80px rgba(0,0,0,0.4)", animation: "fadeUp 0.5s ease both" }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ width: 52, height: 52, background: C.accent, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, margin: "0 auto 14px" }}>🏨</div>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 24, fontWeight: 800, color: C.text }}>RevManager</h1>
          <p style={{ fontSize: 12, color: C.textLight, marginTop: 4 }}>Revenue Management para hoteles independientes</p>
        </div>
        <div style={{ display: "flex", background: C.bg, borderRadius: 10, padding: 4, marginBottom: 24 }}>
          {[["login","Iniciar sesión"],["register","Crear cuenta"]].map(([k,l]) => (
            <button key={k} onClick={() => { setMode(k); setError(""); setMensaje(""); }} style={{ flex: 1, padding: "9px", borderRadius: 8, border: "none", cursor: "pointer", background: mode===k ? C.bgCard : "transparent", color: mode===k ? C.accent : C.textMid, fontWeight: mode===k ? 600 : 400, fontSize: 13, fontFamily: "'DM Sans', sans-serif", boxShadow: mode===k ? "0 1px 4px rgba(0,0,0,0.08)" : "none" }}>{l}</button>
          ))}
        </div>
        {mensaje ? (
          <div style={{ background: C.greenLight, color: C.green, padding: "14px", borderRadius: 8, fontSize: 13, textAlign: "center", fontWeight: 500 }}>{mensaje}</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {mode === "register" && (
              <>
                <div>
                  <p style={{ fontSize: 11, color: C.textLight, marginBottom: 5, textTransform: "uppercase", letterSpacing: "1px" }}>Nombre del hotel *</p>
                  <input style={inp} placeholder="Hotel San Marcos" value={hotelNombre} onChange={e => setHotelNombre(e.target.value)} />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <div>
                    <p style={{ fontSize: 11, color: C.textLight, marginBottom: 5, textTransform: "uppercase", letterSpacing: "1px" }}>Ciudad</p>
                    <input style={inp} placeholder="Madrid" value={hotelCiudad} onChange={e => setHotelCiudad(e.target.value)} />
                  </div>
                  <div>
                    <p style={{ fontSize: 11, color: C.textLight, marginBottom: 5, textTransform: "uppercase", letterSpacing: "1px" }}>Habitaciones</p>
                    <input style={inp} placeholder="45" type="number" value={habitaciones} onChange={e => setHabitaciones(e.target.value)} />
                  </div>
                </div>
                <div style={{ height: 1, background: C.border, margin: "4px 0" }} />
              </>
            )}
            <div>
              <p style={{ fontSize: 11, color: C.textLight, marginBottom: 5, textTransform: "uppercase", letterSpacing: "1px" }}>Email *</p>
              <input style={inp} type="email" placeholder="gerente@mihotel.com" value={email} onChange={e => setEmail(e.target.value)} />
            </div>
            <div>
              <p style={{ fontSize: 11, color: C.textLight, marginBottom: 5, textTransform: "uppercase", letterSpacing: "1px" }}>Contraseña *</p>
              <input style={inp} type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key==="Enter" && (mode==="login" ? handleLogin() : handleRegister())} />
            </div>
            {error && <div style={{ background: C.redLight, color: C.red, padding: "10px 14px", borderRadius: 8, fontSize: 13 }}>{error}</div>}
            <button onClick={mode==="login" ? handleLogin : handleRegister} disabled={loading} style={{ width: "100%", padding: "13px", borderRadius: 10, border: "none", background: loading ? C.accentLight : C.accent, color: loading ? C.accentDark : "#fff", fontSize: 14, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer", fontFamily: "'DM Sans', sans-serif", marginTop: 4 }}>
              {loading ? "Cargando..." : mode==="login" ? "Entrar" : "Crear cuenta"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

const IconPickup = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <line x1="3" y1="4" x2="3" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <line x1="8" y1="2" x2="8" y2="14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <line x1="13" y1="4" x2="13" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <line x1="1" y1="8" x2="15" y2="8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

const NAV = [
  { key: "dashboard",  icon: "◈",  label: "Dashboard" },
  { key: "pickup",     icon: <IconPickup />,  label: "Pickup" },
  { key: "budget",     icon: "💰", label: "Presupuesto" },
];

export default function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("dashboard");

  const hoy = new Date();
  const [mesSel,  setMesSel]  = useState(() => { const v = localStorage.getItem("rm_mes");  return v !== null ? parseInt(v) : hoy.getMonth(); });
  const [anioSel, setAnioSel] = useState(() => { const v = localStorage.getItem("rm_anio"); return v !== null ? parseInt(v) : hoy.getFullYear(); });
  const [importar, setImportar] = useState(false);
  const [datos, setDatos] = useState({ produccion: [], pickup: [], presupuesto: [] });
  const [cargandoDatos, setCargandoDatos] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session) cargarDatos();
  }, [session]);

  const cargarDatos = async () => {
    setCargandoDatos(true);
    const [{ data: produccion }, { data: pickup }, { data: presupuesto }, { data: hotelData }] = await Promise.all([
      supabase.from("produccion_diaria").select("*").eq("hotel_id", session.user.id).order("fecha"),
      supabase.from("pickup_entries").select("*").eq("hotel_id", session.user.id).order("fecha_pickup"),
      supabase.from("presupuesto").select("*").eq("hotel_id", session.user.id).order("mes"),
      supabase.from("hoteles").select("nombre, ciudad").eq("id", session.user.id).maybeSingle(),
    ]);
    setDatos({ produccion: produccion || [], pickup: pickup || [], presupuesto: presupuesto || [], hotel: hotelData, session, pickupEntries: pickup || [] });
    setCargandoDatos(false);
  };

  const handleLogout = async () => { await supabase.auth.signOut(); };

  const [mesDetalle, setMesDetalle] = useState(null);
  const [generandoPDF, setGenerandoPDF] = useState(false);
  const [kpiModal, setKpiModal] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const views = {
    dashboard: (props) => <DashboardView {...props} onMesDetalle={(m, a) => setMesDetalle({ mes: m, anio: a })} kpiModal={kpiModal} setKpiModal={setKpiModal} />,
    pickup:    (props) => <PickupView    {...props} />,
    budget:    (props) => <BudgetView    {...props} />,
  };
  const View = views[view];

  if (loading) return (
    <div style={{ minHeight: "100vh", background: C.bgDeep, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ color: C.accent, fontFamily: "'Playfair Display', serif", fontSize: 20 }}>Cargando...</div>
    </div>
  );

  if (!session) return <AuthScreen />;

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", background: C.bg, minHeight: "100vh", display: "flex", width: "100vw", overflow: "hidden" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700;800&family=DM+Sans:wght@300;400;500;600&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-track { background: ${C.bg}; }
        ::-webkit-scrollbar-thumb { background: ${C.accentLight}; border-radius: 3px; }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: translateY(0); } }
        .nav-item:hover { background: rgba(255,255,255,0.12) !important; color: #FFFFFF !important; }
      `}</style>

      {/* Sidebar desplegable */}
      <div style={{ width: sidebarOpen ? 220 : 60, flexShrink: 0, minHeight: "100vh", background: C.bgDeep, display: "flex", flexDirection: "column", position: "sticky", top: 0, height: "100vh", transition: "width 0.25s ease", overflow: "hidden" }}>
        {/* Header con toggle */}
        <div style={{ padding: sidebarOpen ? "24px 20px 20px" : "20px 12px", borderBottom: "1px solid #FFFFFF11", display: "flex", alignItems: "center", justifyContent: sidebarOpen ? "space-between" : "center" }}>
          {sidebarOpen && (
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 36, height: 36, background: "rgba(255,255,255,0.15)", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, color: "#FFFFFF", fontFamily: "'DM Sans', sans-serif", letterSpacing: 1, flexShrink: 0 }}>RM</div>
              <div>
                <p style={{ fontFamily: "'DM Sans', sans-serif", color: "#FFFFFF", fontWeight: 700, fontSize: 15, letterSpacing: 0.3, whiteSpace: "nowrap" }}>RevManager</p>
                <p style={{ fontSize: 10, color: "rgba(255,255,255,0.5)", whiteSpace: "nowrap" }}>Hotel Intelligence</p>
              </div>
            </div>
          )}
          <button onClick={() => setSidebarOpen(o => !o)} style={{ background: "rgba(255,255,255,0.08)", border: "none", borderRadius: 8, width: 32, height: 32, cursor: "pointer", color: "rgba(255,255,255,0.6)", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "background 0.15s" }}
            onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.18)"}
            onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.08)"}>
            <span style={{ display:"flex", flexDirection:"column", gap:4, alignItems:"center", justifyContent:"center" }}>
              <span style={{ width:16, height:2, background:"rgba(255,255,255,0.7)", borderRadius:2, display:"block" }}/>
              <span style={{ width:16, height:2, background:"rgba(255,255,255,0.7)", borderRadius:2, display:"block" }}/>
              <span style={{ width:16, height:2, background:"rgba(255,255,255,0.7)", borderRadius:2, display:"block" }}/>
            </span>
          </button>
        </div>
        <nav style={{ flex: 1, padding: "16px 10px" }}>
          {NAV.map(n => (
            <button key={n.key} className="nav-item" onClick={() => { setView(n.key); setMesDetalle(null); }}
              title={!sidebarOpen ? n.label : ""}
              style={{ width: "100%", display: "flex", alignItems: "center", gap: sidebarOpen ? 10 : 0, justifyContent: sidebarOpen ? "flex-start" : "center", padding: sidebarOpen ? "10px 12px" : "10px 0", borderRadius: 8, border: "none", cursor: "pointer", background: view===n.key ? C.accent : "transparent", color: view===n.key ? "#fff" : "#A8998A", fontSize: 13, fontWeight: view===n.key ? 600 : 400, fontFamily: "'DM Sans', sans-serif", marginBottom: 2, textAlign: "left", transition: "all 0.15s", overflow: "hidden" }}>
              <span style={{ fontSize: 16, flexShrink: 0 }}>{n.icon}</span>
              {sidebarOpen && <span style={{ whiteSpace: "nowrap" }}>{n.label}</span>}
            </button>
          ))}
        </nav>
        <div style={{ padding: sidebarOpen ? "16px 12px" : "16px 10px", borderTop: "1px solid #FFFFFF11" }}>
          {sidebarOpen && <p style={{ fontSize: 11, color: "#FFFFFF44", marginBottom: 8, paddingLeft: 4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{session.user.email}</p>}
          <button onClick={handleLogout}
            title={!sidebarOpen ? "Cerrar sesión" : ""}
            style={{ width: "100%", padding: "10px", borderRadius: 8, border: "1px solid #FFFFFF22", background: "transparent", color: "#A8998A", cursor: "pointer", fontSize: sidebarOpen ? 12 : 16, fontFamily: "'DM Sans', sans-serif", display: "flex", alignItems: "center", justifyContent: "center" }}>
            {sidebarOpen ? "Cerrar sesión" : "↩"}
          </button>
        </div>
      </div>

      {/* Main */}
      <main style={{ flex: 1, minWidth: 0, padding: "28px 32px", overflowY: "auto", height: "100vh" }}>
        {/* ── BIENVENIDA ── */}
        <div style={{ marginBottom: 14 }}>
          <p style={{ fontSize: 22, fontWeight: 800, color: C.text, fontFamily: "'DM Sans',sans-serif", letterSpacing: -0.5 }}>
            Bienvenido, <span style={{ color: C.accent }}>{datos.hotel?.nombre || "Mi Hotel"}</span>
          </p>
          <p style={{ fontSize: 12, color: C.textLight, marginTop: 2 }}>
            {new Date().toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long", year: "numeric" }).replace(/^\w/, c => c.toUpperCase())}
          </p>
        </div>

        {/* ── HEADER 3 COLUMNAS ── */}
        {view !== "pickup" && <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", alignItems: "center", marginBottom: 24, gap: 16, background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 12, padding: "16px 20px", boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>

          {/* IZQUIERDA: Logo + nombre herramienta */}
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 44, height: 44, borderRadius: 10, background: C.accent, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M3 20V9l9-6 9 6v11H14v-5h-4v5H3z" fill="white" fillOpacity="0.9"/>
                <rect x="9" y="13" width="6" height="7" rx="1" fill={C.accent}/>
                <path d="M2 10h20M12 4v6" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </div>
            <div>
              <p style={{ fontSize: 15, fontWeight: 800, color: C.text, fontFamily: "'DM Sans',sans-serif", letterSpacing: -0.3 }}>RevManager</p>
              <p style={{ fontSize: 10, color: C.textLight, letterSpacing: 1, textTransform: "uppercase" }}>Hotel Intelligence</p>
            </div>
          </div>

          {/* CENTRO: Selector */}
          <div style={{ display: "flex", justifyContent: "center" }}>
            {view === "dashboard"
              ? <PeriodSelectorInline mes={mesSel} anio={anioSel} onChange={(m,a)=>{ setMesSel(m); setAnioSel(a); localStorage.setItem("rm_mes",m); localStorage.setItem("rm_anio",a); }} aniosDisponibles={[...new Set((datos.produccion||[]).map(d=>new Date(d.fecha+"T00:00:00").getFullYear()))].sort()} />
              : null
            }
          </div>

          {/* DERECHA: Acciones apiladas */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 5, padding: "4px 10px", borderRadius: 20, background: C.greenLight, color: C.green, fontSize: 10, fontWeight: 600 }}>
              <span style={{ width: 6, height: 6, background: C.green, borderRadius: "50%", display: "inline-block" }} />
              {cargandoDatos ? "Cargando..." : "En directo"}
            </div>
            <button onClick={() => setImportar(true)} style={{ background: C.accent, color: "#fff", border: "none", borderRadius: 8, padding: "5px 14px", fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans',sans-serif", width: "100%", maxWidth: 150 }}>
              📊 Importar datos
            </button>
            {view === "dashboard" && (
              <button
                onClick={async()=>{ setGenerandoPDF(true); await generarReportePDF(datos,mesSel,anioSel,datos.hotel?.nombre||"Mi Hotel"); setGenerandoPDF(false); }}
                disabled={generandoPDF}
                style={{ background: "transparent", color: C.accent, border: `1px solid ${C.accent}`, borderRadius: 8, padding: "5px 14px", fontSize: 11, fontWeight: 600, cursor: generandoPDF?"not-allowed":"pointer", fontFamily: "'DM Sans',sans-serif", width: "100%", maxWidth: 150 }}
              >
                {generandoPDF ? "⏳ Generando..." : "📄 Informe PDF"}
              </button>
            )}
          </div>
        </div>}
        {cargandoDatos ? <LoadingSpinner /> : mesDetalle ? (
          <MonthDetailView datos={datos} mes={mesDetalle.mes} anio={mesDetalle.anio} onBack={() => setMesDetalle(null)} />
        ) : (
          <View datos={datos} mes={mesSel} anio={anioSel} onPeriodo={(m,a) => { setMesSel(m); setAnioSel(a); localStorage.setItem("rm_mes", m); localStorage.setItem("rm_anio", a); }} />
        )}
      </main>

      {importar && <ImportarExcel onClose={() => setImportar(false)} session={session} onImportado={cargarDatos} />}
    </div>
  );
}