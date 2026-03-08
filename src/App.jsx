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
          {p.name}: <b style={{ color: C.text }}>{typeof p.value === 'number' ? `${Math.round(p.value).toLocaleString("es-ES")}€` : p.value}</b>
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
  const compMode = "mes";

  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);
  const { produccion, presupuesto } = datos;
  const MESES_FULL = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];

  const todasProd = (produccion||[]).sort((a,b)=>new Date(a.fecha)-new Date(b.fecha));
  const ultimaFechaMes = todasProd
    .filter(d => { const f=new Date(d.fecha+"T00:00:00"); return f.getMonth()===mes && f.getFullYear()===anio; })
    .map(d => d.fecha).slice(-1)[0];
  const refDate = ultimaFechaMes ? new Date(ultimaFechaMes+"T00:00:00") : new Date();
  const desde30 = new Date(refDate); desde30.setDate(desde30.getDate()-29);
  const desde30Str = desde30.toISOString().slice(0,10);
  const refDateStr  = refDate.toISOString().slice(0,10);

  const diasMes = todasProd
    .filter(d => d.fecha >= desde30Str && d.fecha <= refDateStr)
    .map(d => {
      const f = new Date(d.fecha+"T00:00:00");
      const habDis = d.hab_disponibles||30;
      return {
        dia: `${f.getDate()}/${f.getMonth()+1}`,
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

  const mapProd = d => {
    const habDis=d.hab_disponibles||30;
    return {
      dia: new Date(d.fecha+"T00:00:00").getDate(),
      occ: habDis>0?Math.round(d.hab_ocupadas/habDis*100):0,
      adr: d.hab_ocupadas>0?Math.round(d.revenue_hab/d.hab_ocupadas):0,
      revpar: habDis>0?Math.round(d.revenue_hab/habDis):0,
      trevpar: habDis>0?Math.round((d.revenue_hab+(d.revenue_fnb||0)+(d.revenue_otros||0))/habDis):0,
      revTotal: Math.round(d.revenue_total||0),
    };
  };

  const mesPrevIdx = mes === 0 ? 11 : mes - 1;
  const anioPrevModal = mes === 0 ? anio - 1 : anio;
  const diasMP = todasProd
    .filter(d => { const f=new Date(d.fecha+"T00:00:00"); return f.getMonth()===mesPrevIdx && f.getFullYear()===anioPrevModal; })
    .map(mapProd);

  const diasComp  = diasMP;
  const compLabel = MESES_FULL[mesPrevIdx];

  const ppto = (presupuesto||[]).find(p=>p.mes===mes+1&&p.anio===anio);

  const getChartData = () => {
    if (kpi==="Ocupación") return diasMes.map((d,i)=>({...d, ly: diasComp[i]?.occ}));
    if (kpi==="ADR")       return diasMes.map((d,i)=>({...d, ly: diasComp[i]?.adr}));
    if (kpi==="RevPAR")    return diasMes.map((d,i)=>({...d, ly: diasComp[i]?.revpar}));
    if (kpi==="TRevPAR")   return diasMes.map(d=>d);
    if (kpi==="Revenue Total") return diasMes.map(d=>d);
    return diasMes;
  };
  const chartData = getChartData();

  const fk = kpi==="Ocupación"?"occ":kpi==="ADR"?"adr":kpi==="RevPAR"?"revpar":kpi==="TRevPAR"?"trevpar":"revTotal";

  const diasMesCompleto = todasProd
    .filter(d => { const f=new Date(d.fecha+"T00:00:00"); return f.getMonth()===mes && f.getFullYear()===anio; })
    .map(mapProd);
  const diasMesCompLetoMP = todasProd
    .filter(d => { const f=new Date(d.fecha+"T00:00:00"); return f.getMonth()===mesPrevIdx && f.getFullYear()===(mes===0?anio-1:anio); })
    .map(mapProd);

  const srcActual = kpi==="TRevPAR" ? diasMesCompleto : diasMes;
  const srcComp   = kpi==="TRevPAR" ? diasMesCompLetoMP : diasComp;

  const mediaActual = srcActual.length>0 ? srcActual.reduce((a,d)=>a+(d[fk]||0),0)/srcActual.length : 0;
  const mediaComp   = srcComp.length>0   ? srcComp.reduce((a,d)=>a+(d[fk]||0),0)/srcComp.length   : 0;
  const varComp = mediaComp>0?((mediaActual-mediaComp)/mediaComp*100).toFixed(1):null;
  const fieldKey = kpi==="Ocupación"?"occ":kpi==="ADR"?"adr":kpi==="RevPAR"?"revpar":kpi==="TRevPAR"?"trevpar":"revTotal";

  const pptoVal = kpi==="Ocupación"?ppto?.occ_ppto:kpi==="ADR"?ppto?.adr_ppto:kpi==="RevPAR"?ppto?.revpar_ppto:kpi==="Revenue Total"?ppto?.rev_total_ppto:null;
  const varPpto = pptoVal&&mediaActual?((mediaActual-pptoVal)/pptoVal*100).toFixed(1):null;

  const unit = kpi==="Ocupación"?"%":"€";

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.5)", zIndex:1000, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
      <div style={{ background:C.bgCard, borderRadius:14, width:"100%", maxWidth:820, maxHeight:"90vh", overflow:"auto", padding:28, boxShadow:"0 20px 60px rgba(0,0,0,0.2)" }} onClick={e=>e.stopPropagation()}>

        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
          <div>
            <p style={{ fontSize:11, color:C.textLight, textTransform:"uppercase", letterSpacing:2 }}>{MESES_FULL[mes]} {anio}</p>
            <h3 style={{ fontSize:22, fontWeight:800, color:C.text, fontFamily:"'DM Sans',sans-serif", letterSpacing:-0.5 }}>{kpi}</h3>
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            <button onClick={onClose} style={{ background:"none", border:`1.5px solid ${C.border}`, borderRadius:8, width:34, height:34, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", fontSize:16, color:C.textMid, fontWeight:300, transition:"all 0.15s" }}
              onMouseEnter={e=>{ e.currentTarget.style.background=C.accent; e.currentTarget.style.borderColor=C.accent; e.currentTarget.style.color="#fff"; }}
              onMouseLeave={e=>{ e.currentTarget.style.background="none"; e.currentTarget.style.borderColor=C.border; e.currentTarget.style.color=C.textMid; }}>
              ×
            </button>
          </div>
        </div>

        <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:12, marginBottom:20 }}>
          {[
            { label:"Media del mes", value:`${kpi==="Ocupación"?mediaActual.toFixed(1):Math.round(mediaActual).toLocaleString("es-ES")}${unit}` },
            { label: kpi==="TRevPAR" ? `Vs ${MESES_FULL[mesPrevIdx]}` : `Vs ${compLabel}`, value: varComp!==null ? `${parseFloat(varComp)>=0?"+":""}${varComp}%` : "Sin datos", up: varComp!==null?parseFloat(varComp)>=0:true },
            ...(kpi!=="TRevPAR" ? [{ label:"Vs Presupuesto", value: varPpto!==null ? `${parseFloat(varPpto)>=0?"+":""}${varPpto}%` : "Sin datos ppto", up: varPpto!==null?parseFloat(varPpto)>=0:true }] : []),
          ].map((k,i)=>(
            <div key={i} style={{ background:`${C.accent}0f`, borderRadius:8, padding:"16px", borderLeft:`3px solid ${C.accent}`, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", textAlign:"center" }}>
              <p style={{ fontSize:10, color:C.textMid, textTransform:"uppercase", letterSpacing:1.5, marginBottom:6, fontWeight:600 }}>{k.label}</p>
              <p style={{ fontSize:22, fontWeight:700, color:k.up===false?C.red:k.up===true?C.green:C.text, fontFamily:"'DM Sans',sans-serif" }}>{k.value}</p>
            </div>
          ))}
        </div>

        <div style={{ marginBottom:16 }}>
          <p style={{ fontSize:12, fontWeight:600, color:C.textMid, marginBottom:10, textTransform:"uppercase", letterSpacing:1 }}>
            {kpi==="TRevPAR" ? "Desglose de ingresos del mes" : kpi==="Revenue Total" ? "Evolución anual" : "Evolución del mes"}
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
          })() : kpi==="Revenue Total" ? (() => {
            const MESES_SHORT = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
            const revPorMes = Array.from({length:12},(_,i)=>{
              const mIdx = ((mes-11+i)%12+12)%12;
              const aIdx = anio + Math.floor((mes-11+i)/12);
              const dias = todasProd.filter(d=>{ const f=new Date(d.fecha+"T00:00:00"); return f.getMonth()===mIdx && f.getFullYear()===aIdx; });
              return {
                mes: MESES_SHORT[mIdx],
                revHab:   Math.round(dias.reduce((a,d)=>a+(d.revenue_hab||0),0)),
                revFnb:   Math.round(dias.reduce((a,d)=>a+(d.revenue_fnb||0),0)),
                revOtros: Math.round(dias.reduce((a,d)=>a+(d.revenue_otros||0),0)),
              };
            }).filter(d=>d.revHab+d.revFnb+d.revOtros>0);
            return (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={revPorMes} barSize={18}>
                <CartesianGrid strokeDasharray="3 3" stroke={C.border} vertical={false}/>
                <XAxis dataKey="mes" tick={{fill:"#555",fontSize:11,fontWeight:500}} axisLine={false} tickLine={false}/>
                <YAxis tick={{fill:C.textLight,fontSize:10}} axisLine={false} tickLine={false} tickFormatter={v=>v>=1000?`${Math.round(v).toLocaleString("es-ES")}€`:v}/>
                <Tooltip content={<CustomTooltip/>}/>
                <Bar dataKey="revHab"   name="Hab."   stackId="a" fill={C.accent} radius={[0,0,0,0]}/>
                <Bar dataKey="revFnb"   name="F&B"    stackId="a" fill="#E85D04" radius={[0,0,0,0]}/>
                <Bar dataKey="revOtros" name="Otros"  stackId="a" fill={C.green} radius={[2,2,0,0]}/>
                <Legend wrapperStyle={{ fontSize:11, color:C.textMid, paddingTop:8 }}/>
              </BarChart>
            </ResponsiveContainer>
            );
          })() : kpi!=="TRevPAR" ? (
            <ResponsiveContainer width="100%" height={220}>
              <ComposedChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke={C.border} vertical={false}/>
                <XAxis dataKey="dia" tick={{fill:"#555",fontSize:11,fontWeight:500}} axisLine={false} tickLine={false} interval={4}/>
                <YAxis tick={{fill:C.textLight,fontSize:10}} axisLine={false} tickLine={false} unit={unit}/>
                <Tooltip content={<CustomTooltip/>}/>
                <Area type="monotone" dataKey={fieldKey} name={kpi} stroke={C.accent} strokeWidth={2} fill={`${C.accent}15`} dot={false}/>
              </ComposedChart>
            </ResponsiveContainer>
          ) : null}
        </div>

     </div>
    </div>
  );
}

function KpiCard({ label, value, change, sub, up, i, onClick, accentColor }) {
  const kpiAccent = accentColor || C.accent;
  return (
    <div onClick={onClick} style={{
      background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 10,
      padding: "20px 22px", animation: `fadeUp 0.5s ease ${i * 0.08}s both`,
      borderLeft: `3px solid ${kpiAccent}`, position: "relative", overflow: "hidden",
      boxShadow: "0 1px 4px rgba(0,0,0,0.06)", cursor: "pointer",
      transition: "box-shadow 0.2s, transform 0.2s, border-color 0.2s, background 0.2s",
    }}
    onMouseEnter={e=>{ 
      e.currentTarget.style.boxShadow=`0 6px 24px ${kpiAccent}40`; 
      e.currentTarget.style.transform="translateY(-2px)";
      e.currentTarget.style.borderColor=kpiAccent;
      e.currentTarget.style.background=`${kpiAccent}08`;
    }}
    onMouseLeave={e=>{ 
      e.currentTarget.style.boxShadow="0 1px 4px rgba(0,0,0,0.06)"; 
      e.currentTarget.style.transform="translateY(0)";
      e.currentTarget.style.borderColor=C.border;
      e.currentTarget.style.background=C.bgCard;
    }}>
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
  const MESES_C = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];

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
      <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:10, marginBottom:8 }}>
        <button onClick={anioAnterior} style={btnFlecha(puedeAnterior)}>‹</button>
        <p style={{ fontSize:13, fontWeight:700, color:C.text, fontFamily:"'DM Sans',sans-serif", minWidth:36, textAlign:"center" }}>{anio}</p>
        <button onClick={anioSiguiente} style={btnFlecha(puedeSiguiente)}>›</button>
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:6, minWidth:260 }}>
        {MESES_C.map((m, i) => {
          const futuro = anio === anioMax && i > hoy.getMonth();
          const activo = i === mes;
          const esHoyMes = i === hoy.getMonth() && anio === hoy.getFullYear();
          return (
            <button key={i} onClick={() => !futuro && onChange(i, anio)}
              style={{
                padding: "6px 10px",
                borderRadius: 6,
                border: esHoyMes && !activo ? `1.5px solid ${C.accent}44` : `1px solid ${activo?C.accent:"transparent"}`,
                background: activo ? C.accent : "transparent",
                color: futuro ? C.border : activo ? "#fff" : C.text,
                fontSize: 11, fontWeight: activo ? 700 : 400, opacity: futuro ? 0.3 : activo ? 1 : 0.75,
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
      <div style={{ display: "flex", justifyContent: "center", gap: 6, marginBottom: 10 }}>
        {anios.map(a => (
          <button key={a} onClick={() => onChange(mes, a)} style={{ padding: "4px 12px", borderRadius: 8, border: `1.5px solid ${a === anio ? C.accent : C.border}`, background: a === anio ? C.accent : "transparent", color: a === anio ? "#fff" : C.textMid, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>{a}</button>
        ))}
      </div>
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
  const [vaciando, setVaciando] = useState(false);
  const [confirmVaciar, setConfirmVaciar] = useState(false);

  const vaciarDatos = async () => {
    setVaciando(true); setError("");
    try {
      await supabase.from("produccion_diaria").delete().eq("hotel_id", session.user.id);
      await supabase.from("pickup_entries").delete().eq("hotel_id", session.user.id);
      await supabase.from("presupuesto").delete().eq("hotel_id", session.user.id);
      setConfirmVaciar(false);
      onImportado();
      onClose();
    } catch(e) {
      setError("Error al vaciar datos: " + e.message);
    }
    setVaciando(false);
  };

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


      // ── Pickup — hoja "🎯 Pickup", datos desde fila 5 ──
      // raw:false hace que SheetJS convierta datetime → string "YYYY-MM-DD"
      const wsPu = wb.Sheets["🎯 Pickup"];
      const pickupRows = [];
      if (wsPu) {
        // Leer toda la hoja sin range fijo — buscar filas con seriales de fecha válidos
        const rowsPu = XLSX.utils.sheet_to_json(wsPu, { header: 1, raw: true });
        const esSerial = (v) => typeof v === "number" && v > 40000 && v < 60000;
        const serialToDate = (v) => {
          const d = new Date(Date.UTC(1899, 11, 30) + Math.floor(v) * 86400000);
          return d.toISOString().slice(0, 10);
        };
        for (const row of rowsPu) {
          if (!row || row.length < 2) continue;
          if (!esSerial(row[0]) || !esSerial(row[1])) continue;
          const fp = serialToDate(row[0]);
          const fl = serialToDate(row[1]);
          // col2=canal, col3=num_reservas (puede ser número o serial pequeño 1900-xx)
          const nrRaw = row[3];
          const nr = typeof nrRaw === "number"
            ? (nrRaw < 40000 ? Math.round(nrRaw) : 1)  // serial < 40000 = número real de reservas
            : (parseInt(nrRaw) || 1);
          pickupRows.push({
            hotel_id: session.user.id,
            fecha_pickup:  fp,
            fecha_llegada: fl,
            canal:         row[2] || null,
            num_reservas:  nr || 1,
          });
        }
        console.log(`[ImportPickup] filas parseadas: ${pickupRows.length}`);
      }

      // ── Presupuesto — col[0]=Mes, col[1]=OCC(decimal), col[4]=ADR, col[7]=RevPAR, col[10]=RevTotal ──
      const wsBu = wb.Sheets["💰 Presupuesto"];
      const presupuestoRows = [];
      if (wsBu) {
        const rowsBu = XLSX.utils.sheet_to_json(wsBu, { header: 1 });
        const MESES_PPTO = ["Enero","Febrero","Marzo","Abril","Mayo","Junio",
                            "Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
        const anioImportPpto = parseInt(produccionRows[0]?.fecha?.slice(0,4)) || new Date().getFullYear();
        let startRow = null;
        for (let r = 0; r < rowsBu.length; r++) {
          if (rowsBu[r]?.[0] === "Enero") { startRow = r; break; }
        }
        if (startRow !== null) {
          for (let i = 0; i < 12; i++) {
            const row = rowsBu[startRow + i];
            if (!row || !MESES_PPTO.includes(row[0])) continue;
            const occ_ppto       = parseFloat(row[1])  || null;
            const adr_ppto       = parseFloat(row[4])  || null;
            const revpar_ppto    = parseFloat(row[7])  || null;
            const rev_total_ppto = parseFloat(row[10]) || null;
            if (!occ_ppto && !adr_ppto && !revpar_ppto && !rev_total_ppto) continue;
            presupuestoRows.push({
              hotel_id: session.user.id,
              anio: anioImportPpto,
              mes: i + 1,
              occ_ppto:       occ_ppto       ? Math.round(occ_ppto * 1000) / 10 : null,
              adr_ppto:       adr_ppto       ? Math.round(adr_ppto * 100) / 100 : null,
              revpar_ppto:    revpar_ppto    ? Math.round(revpar_ppto * 100) / 100 : null,
              rev_total_ppto: rev_total_ppto ? Math.round(rev_total_ppto) : null,
            });
          }
        }
      }

      if (produccionRows.length === 0) throw new Error("No se encontraron datos en la hoja de Producción Diaria");

      // Detectar años y limpiar
      const aniosImport = [...new Set(produccionRows.map(r => r.fecha.slice(0, 4)))];
      // Años en pickup (por fecha_llegada)
      const aniosPickup = [...new Set(pickupRows.map(r => r.fecha_llegada.slice(0, 4)))];
      const todosAnios  = [...new Set([...aniosImport, ...aniosPickup])];

      for (const anio of aniosImport) {
        await supabase.from("produccion_diaria").delete()
          .eq("hotel_id", session.user.id)
          .gte("fecha", `${anio}-01-01`).lte("fecha", `${anio}-12-31`);
        await supabase.from("presupuesto").delete()
          .eq("hotel_id", session.user.id).eq("anio", parseInt(anio));
      }
      for (const anio of todosAnios) {
        await supabase.from("pickup_entries").delete()
          .eq("hotel_id", session.user.id)
          .gte("fecha_llegada", `${anio}-01-01`).lte("fecha_llegada", `${anio}-12-31`);
      }

      const { error: err1 } = await supabase.from("produccion_diaria").insert(produccionRows);
      if (err1) throw new Error("Error al guardar producción: " + err1.message);

      if (pickupRows.length > 0) {
        // Insertar en lotes de 100 para evitar límites
        for (let i = 0; i < pickupRows.length; i += 100) {
          const { error: errPu } = await supabase.from("pickup_entries").insert(pickupRows.slice(i, i + 100));
          if (errPu) throw new Error("Error al guardar pickup: " + errPu.message);
        }
      }

      if (presupuestoRows.length > 0) {
        const { error: err3 } = await supabase.from("presupuesto").insert(presupuestoRows);
        if (err3) throw new Error("Error al guardar presupuesto: " + err3.message);
      }

      // Actualizar habitaciones en hoteles si viene del Excel
      if (totalHab) {
        await supabase.from("hoteles").update({ habitaciones: totalHab }).eq("id", session.user.id);
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
            {confirmVaciar ? (
              <div style={{ background: "#FDECEA", borderRadius: 10, padding: "20px", marginBottom: 16, textAlign: "center" }}>
                <p style={{ fontWeight: 700, color: "#C0392B", marginBottom: 8 }}>⚠️ ¿Vaciar todos los datos?</p>
                <p style={{ fontSize: 12, color: "#A8998A", marginBottom: 16 }}>Se eliminarán producción, pickup y presupuesto. Esta acción no se puede deshacer.</p>
                <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
                  <button onClick={()=>setConfirmVaciar(false)} style={{ padding: "8px 20px", borderRadius: 8, border: "1px solid #E8E0D5", background: "#fff", color: "#A8998A", cursor: "pointer", fontFamily: "'DM Sans',sans-serif", fontSize: 13 }}>Cancelar</button>
                  <button onClick={vaciarDatos} disabled={vaciando} style={{ padding: "8px 20px", borderRadius: 8, border: "none", background: "#C0392B", color: "#fff", cursor: vaciando?"not-allowed":"pointer", fontWeight: 700, fontFamily: "'DM Sans',sans-serif", fontSize: 13 }}>{vaciando ? "Vaciando..." : "Sí, vaciar todo"}</button>
                </div>
              </div>
            ) : (
              <button onClick={()=>setConfirmVaciar(true)} style={{ width: "100%", padding: "9px", borderRadius: 8, border: "1px solid #FDECEA", background: "#FFF5F5", color: "#C0392B", cursor: "pointer", fontSize: 12, fontWeight: 600, fontFamily: "'DM Sans',sans-serif", marginBottom: 16, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                🗑️ Vaciar todos los datos importados
              </button>
            )}
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
              {resultado.pickup > 0 && <p style={{ color: "#2D7A4F", fontSize: 13, marginTop: 6 }}>🎯 {resultado.pickup} reservas de pickup importadas</p>}
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

      <Card>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
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
            <tfoot>
              <tr style={{ borderTop: `2px solid ${C.border}`, background: "#E8F5EE", fontWeight: 700 }}>
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

  const rodantes = Array.from({length:12},(_,i)=>{
    const total = mes-11+i;
    const mIdx  = ((total%12)+12)%12;
    const aIdx  = anio + Math.floor(total/12);
    const md = getMes(mIdx, aIdx);
    const pp = (presupuesto||[]).find(p=>p.mes===mIdx+1 && p.anio===aIdx);
    return { mes: MESES_C[mIdx], anio: aIdx, ...md, ppto: pp };
  }).filter(r=>r.habOcu>0||r.revTot>0);

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

  const pptoMes = (presupuesto||[]).find(p=>p.mes===mes+1 && p.anio===anio);
  const pptoVsReal = pptoMes ? {
    adr:   pptoMes.adr_ppto   ? ((mesAct.adr    - pptoMes.adr_ppto)   / pptoMes.adr_ppto   * 100).toFixed(1) : null,
    revpar:pptoMes.revpar_ppto ? ((mesAct.revpar  - pptoMes.revpar_ppto)/ pptoMes.revpar_ppto * 100).toFixed(1) : null,
    rev:   pptoMes.rev_total_ppto ? ((mesAct.revTot - pptoMes.rev_total_ppto)/pptoMes.rev_total_ppto*100).toFixed(1) : null,
  } : null;

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
  const [hmMesSel, setHmMesSel] = useState(null);

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
      mes: MESES_FULL[mIdx],
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
    return { change: `${sign}${pct}% vs mes ant.`, up: d >= 0, sub: "" };
  };

  const kpis = [
    { label: "Ocupación",     value: `${occ}%`,    ...diff(parseFloat(occ), prevOcc) },
    { label: "ADR",           value: `€${adr}`,    ...diff(parseFloat(adr), prevAdr) },
    { label: "RevPAR",        value: `€${revpar}`,  ...diff(parseFloat(revpar), prevRevpar) },
    { label: "TRevPAR",       value: `€${trevpar}`, ...diff(parseFloat(trevpar), prevTrevpar) },
    { label: "Revenue Total", value: `€${Math.round(totalRevTotal).toLocaleString("es-ES")}`, ...diff(totalRevTotal, prevRevTot, true) },
  ];

  return (
    <div>
      {/* ── CABECERA MES ACTIVO ── */}
      <div style={{ display:"flex", alignItems:"baseline", gap:12, marginBottom:16, paddingBottom:14, borderBottom:`1px solid ${C.border}` }}>
        <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:28, fontWeight:700, color:C.text, margin:0, letterSpacing:-0.5 }}>
          {["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"][mes]}
        </h2>
        <span style={{ fontSize:20, fontWeight:400, color:C.textLight }}>{anio}</span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 14, marginBottom: 24 }}>
        {kpis.map((k, i) => <KpiCard key={i} {...k} i={i} onClick={()=>setKpiModal(k.label)} />)}
      </div>

      {/* ── HEATMAP + GRÁFICAS ── */}
      {(() => {
        const MESES_H = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
        const DIAS_S  = ["L","M","X","J","V","S","D"];
        // Ocupación por mes para el heatmap (real o OTB para futuros)
        const _pad = n => String(n).padStart(2,"0");
        const _hoy = new Date();
        const _hoyStr = `${_hoy.getFullYear()}-${_pad(_hoy.getMonth()+1)}-${_pad(_hoy.getDate())}`;
        const otbDia = {};
        (datos.pickupEntries||[]).forEach(e => {
          const f = String(e.fecha_llegada||"").slice(0,10);
          if (!f||f.length<10) return;
          otbDia[f] = (otbDia[f]||0)+(e.num_reservas||1);
        });
        const occPorMes = MESES_H.map((label, mi) => {
          const d = produccion.filter(r => {
            const f = new Date(r.fecha+"T00:00:00");
            return f.getMonth()===mi && f.getFullYear()===anio;
          });
          const habOcu = d.reduce((a,r)=>a+(r.hab_ocupadas||0),0);
          const habDis = d.reduce((a,r)=>a+(r.hab_disponibles||0),0);
          if (habDis>0) return { label, mi, occ: habOcu/habDis*100, esOtb: false };
          // Mes futuro: sumar reservas OTB del pickup
          const mesStr = `${anio}-${_pad(mi+1)}`;
          const primerDia = `${mesStr}-01`;
          if (primerDia <= _hoyStr) return { label, mi, occ: null, esOtb: false };
          const diasMes = new Date(anio, mi+1, 0).getDate();
          const habH = datos.hotel?.habitaciones || 30;
          let totalRes = 0;
          for (let di=1; di<=diasMes; di++) {
            const iso = `${mesStr}-${_pad(di)}`;
            totalRes += otbDia[iso] || 0;
          }
          const occ = habH > 0 ? (totalRes / (habH * diasMes) * 100) : null;
          return { label, mi, occ: totalRes>0 ? occ : null, esOtb: true };
        });

        // Color heatmap
        const heatColor = (occ) => {
          if (occ==null) return C.border;
          if (occ<25)  return "#7B241C";
          if (occ<40)  return "#A93226";
          if (occ<55)  return "#C0392B";
          if (occ<70)  return "#4CAF50";
          if (occ<85)  return "#1A7A3C";
          return "#004D26";
        };

        // Datos diarios del mes seleccionado (pasado=produccion, futuro=pickup)
        const habHotel = datos.hotel?.habitaciones ||
          (produccion.length > 0 ? Math.round(produccion.reduce((a,r)=>a+(r.hab_disponibles||0),0)/produccion.length) : 30);
        const _hoy2 = new Date();
        const pad2  = n => String(n).padStart(2,"0");
        const hoyStr2 = `${_hoy2.getFullYear()}-${pad2(_hoy2.getMonth()+1)}-${pad2(_hoy2.getDate())}`;


        const diasDelMes = hmMesSel!=null ? (() => {
          const diasEnMes = new Date(anio, hmMesSel+1, 0).getDate();
          const pad = n => String(n).padStart(2,"0");
          return Array.from({length:diasEnMes},(_,di)=>{
            const dt   = new Date(anio, hmMesSel, di+1);
            const iso  = `${anio}-${pad(hmMesSel+1)}-${pad(di+1)}`;
            const prod = produccion.find(r=>r.fecha===iso);
            const esFut = iso > hoyStr2;
            let occ=null, adr=null;
            if (prod) {
              occ = prod.hab_disponibles>0 ? (prod.hab_ocupadas/prod.hab_disponibles*100) : null;
              adr = prod.hab_ocupadas>0    ? (prod.revenue_hab/prod.hab_ocupadas)         : null;
            } else if (esFut) {
              const res = otbDia[iso]||0;
              occ = res>0 ? (res/habHotel*100) : null;
            }
            return { iso, dia:di+1, diaSem:dt.getDay(), occ, adr, esFut, tieneReal:!!prod };
          });
        })() : [];

        return (
          <div style={{ display:"grid", gridTemplateColumns:"minmax(0,3fr) minmax(0,2fr)", gap:16, marginBottom:16 }}>

            {/* ── HEATMAP ── */}
            <Card style={{ display:"flex", flexDirection:"column" }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
                <div>
                  <p style={{ fontFamily:"'Playfair Display',serif", fontWeight:700, fontSize:20, color:C.text, marginBottom:2 }}>Ocupación mensual</p>
                  <p style={{ fontSize:13, color:C.textMid }}>Haz clic en un mes para ver el detalle diario</p>
                </div>
                {hmMesSel!=null && (
                  <button onClick={()=>setHmMesSel(null)} style={{ fontSize:11, color:C.accent, background:"none", border:`1px solid ${C.accent}`, borderRadius:6, padding:"3px 10px", cursor:"pointer" }}>← Volver</button>
                )}
              </div>

              {hmMesSel==null ? (
                /* Vista anual: grid 4x3 */
                <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gridTemplateRows:"repeat(3,1fr)", gap:8, flex:1 }}>
                  {occPorMes.map(({label, mi, occ, esOtb})=>(
                    <div key={mi} onClick={()=>setHmMesSel(mi)} style={{ borderRadius:8, padding:"10px 6px", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", background: occ!=null ? heatColor(occ)+"22" : C.bg, border:`1.5px solid ${occ!=null?heatColor(occ):C.border}`, cursor:"pointer", textAlign:"center", transition:"all 0.15s" }}
                      onMouseEnter={e=>e.currentTarget.style.opacity="0.8"} onMouseLeave={e=>e.currentTarget.style.opacity="1"}>
                      <p style={{ fontSize:9, fontWeight:600, color:C.textLight, textTransform:"uppercase", letterSpacing:0.5, marginBottom:3 }}>{label}</p>
                      {occ!=null
                        ? <p style={{ fontSize:16, fontWeight:800, color:heatColor(occ), fontFamily:"'DM Sans',sans-serif" }}>{occ.toFixed(0)}%</p>
                        : <p style={{ fontSize:12, color:C.border }}>—</p>
                      }
                      {esOtb && occ!=null && <p style={{ fontSize:8, color:"#7A9CC8", fontWeight:700, marginTop:2 }}>OTB</p>}
                    </div>
                  ))}
                </div>
              ) : (
                /* Vista diaria del mes */
                <div style={{ display:"flex", flexDirection:"column", flex:1 }}>
                  <p style={{ fontSize:12, fontWeight:700, color:C.text, marginBottom:10 }}>{MESES_H[hmMesSel]} {anio}</p>
                  <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:3, marginBottom:6 }}>
                    {DIAS_S.map(d=><p key={d} style={{ fontSize:9, color:C.textLight, textAlign:"center", fontWeight:600 }}>{d}</p>)}
                  </div>
                  {/* Espaciado inicial según día semana del día 1 (lun=0) */}
                  <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gridAutoRows:"1fr", gap:3, flex:1 }}>
                    {Array.from({length: (diasDelMes[0]?.diaSem===0?6:diasDelMes[0]?.diaSem-1)||0 },(_,i)=>(
                      <div key={"e"+i}/>
                    ))}
                    {diasDelMes.map(({dia,occ,adr,esFut,tieneReal})=>{
                      const col = occ!=null ? heatColor(occ) : C.border;
                      return (
                        <div key={dia} title={occ!=null?`OCC: ${occ.toFixed(0)}%${adr?` | ADR: €${Math.round(adr)}`:""}`:""} style={{ borderRadius:4, padding:"4px 2px", background: occ!=null?col+"33":C.bg, border:`1px solid ${occ!=null?col:C.border}`, textAlign:"center", opacity: esFut&&!tieneReal?0.7:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center" }}>
                          <p style={{ fontSize:9, color:C.textLight, lineHeight:1 }}>{dia}</p>
                          {occ!=null
                            ? <p style={{ fontSize:10, fontWeight:700, color:col, lineHeight:1.4 }}>{occ.toFixed(0)}%</p>
                            : <p style={{ fontSize:9, color:C.border }}>—</p>
                          }
                          {esFut && <p style={{ fontSize:7, color:"#7A9CC8", lineHeight:1 }}>OTB</p>}
                        </div>
                      );
                    })}
                  </div>
                  {/* Leyenda */}
                  <div style={{ display:"flex", gap:8, marginTop:10, flexWrap:"wrap" }}>
                    {[["<25%","#7B241C"],["25-40%","#A93226"],["40-55%","#C0392B"],["55-70%","#4CAF50"],["70-85%","#1A7A3C"],["≥85%","#004D26"]].map(([l,c])=>(
                      <div key={l} style={{ display:"flex", alignItems:"center", gap:4 }}>
                        <div style={{ width:8, height:8, borderRadius:2, background:c }}/>
                        <span style={{ fontSize:9, color:C.textLight }}>{l}</span>
                      </div>
                    ))}
                    <div style={{ display:"flex", alignItems:"center", gap:4 }}>
                      <span style={{ fontSize:9, color:"#7A9CC8", fontWeight:600 }}>OTB</span><span style={{ fontSize:9, color:C.textLight }}>=pickup futuro</span>
                    </div>
                  </div>
                </div>
              )}
            </Card>

            {/* ── GRÁFICAS DERECHA ── */}
            <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
              <Card>
                <p style={{ fontFamily:"'Playfair Display',serif", fontWeight:700, fontSize:18, color:C.text, marginBottom:2 }}>ADR & Ocupación</p>
                <p style={{ fontSize:12, color:C.textMid, marginBottom:12 }}>Evolución mensual {anio}</p>
                <ResponsiveContainer width="100%" height={160}>
                  <ComposedChart data={porMes} barSize={10}>
                    <CartesianGrid strokeDasharray="3 3" stroke={C.border} vertical={false}/>
                    <XAxis dataKey="mes" tick={{fill:C.textLight,fontSize:9}} axisLine={false} tickLine={false}/>
                    <YAxis yAxisId="left"  tick={{fill:C.textLight,fontSize:9}} axisLine={false} tickLine={false} unit="%" domain={[0,100]}/>
                    <YAxis yAxisId="right" orientation="right" tick={{fill:C.textLight,fontSize:9}} axisLine={false} tickLine={false} unit="€"/>
                    <Tooltip content={<CustomTooltip/>}/>
                    <Bar  yAxisId="left"  dataKey="occ"  name="Ocupación" fill={C.accent} radius={[2,2,0,0]} fillOpacity={0.8}/>
                    <Line yAxisId="right" dataKey="adr"  name="ADR" type="monotone" stroke="#E85D04" strokeWidth={2} dot={false}/>
                  </ComposedChart>
                </ResponsiveContainer>
              </Card>
              <Card>
                <p style={{ fontFamily:"'Playfair Display',serif", fontWeight:700, fontSize:18, color:C.text, marginBottom:2 }}>RevPAR — {anio}</p>
                <p style={{ fontSize:13, color:C.textMid, marginBottom:12 }}>RevPAR vs TRevPAR (€/hab)</p>
                <ResponsiveContainer width="100%" height={160}>
                  <AreaChart data={porMes}>
                    <defs>
                      <linearGradient id="gRevpar2" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor={C.accent} stopOpacity={0.15}/>
                        <stop offset="95%" stopColor={C.accent} stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={C.border}/>
                    <XAxis dataKey="mes" tick={{fill:C.textLight,fontSize:9}} axisLine={false} tickLine={false}/>
                    <YAxis tick={{fill:C.textLight,fontSize:9}} axisLine={false} tickLine={false} unit="€"/>
                    <Tooltip content={<CustomTooltip/>}/>
                    <Area type="monotone" dataKey="revpar"  name="RevPAR"  stroke={C.accent} strokeWidth={2} fill="url(#gRevpar2)" dot={{fill:C.accent,r:2}} activeDot={{r:3}}/>
                    <Line type="monotone" dataKey="trevpar" name="TRevPAR" stroke="#E85D04" strokeWidth={1.5} dot={false} strokeDasharray="5 4"/>
                  </AreaChart>
                </ResponsiveContainer>
              </Card>
            </div>

          </div>
        );
      })()}

      <Card>
        <p style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700, fontSize: 16, color: C.text, marginBottom: 16 }}>
          Últimos 12 meses
        </p>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
            <thead>
              <tr style={{ borderBottom: `2px solid ${C.border}` }}>
                {["Mes","Ocup.","ADR","RevPAR","TRevPAR","Rev. Hab.","Rev. Total"].map((h,hi) => (
                  <th key={h} style={{ padding: "8px 12px", textAlign: hi===0?"left":"right", fontSize: 11, color: C.textLight, textTransform: "uppercase", letterSpacing: "1px", fontWeight: 600 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {porMes.map((d, i) => (
                <tr key={i} onClick={() => onMesDetalle && onMesDetalle(d.mesIdx, d.anioIdx)} style={{ borderBottom: `1px solid ${C.border}`, background: d.mesIdx === mes && d.anioIdx === anio ? C.accentLight : (i % 2 === 0 ? C.bg : C.bgCard), cursor: "pointer" }} onMouseEnter={e => e.currentTarget.style.background = C.accentLight} onMouseLeave={e => e.currentTarget.style.background = MESES_CORTO.indexOf(d.mes) === mes ? C.accentLight : (i % 2 === 0 ? C.bg : C.bgCard)}>
                  <td style={{ padding: "10px 12px", fontWeight: 700, fontSize: 15, color: C.accent, textDecoration: "underline", cursor: "pointer" }}>{d.mes}</td>
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

// ─── PICKUP VIEW ──────────────────────────────────────────────────
function PickupView({ datos }) {
  const { session, presupuesto, produccion } = datos;
  const [pickupEntries, setPickupEntries] = useState([]);
  const [cargando, setCargando]           = useState(true);
  const [anio, setAnio]                   = useState(new Date().getFullYear());

  const hoy     = new Date();
  const MESES   = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];

  // ── Recargar cuando cambia session ──
  useEffect(() => {
    if (!session?.user?.id) return;
    const cargar = async () => {
      setCargando(true);
      // Cargar en páginas de 1000 para evitar el límite de Supabase
      let todas = [];
      let desde = 0;
      const PAGINA = 1000;
      while (true) {
        const { data, error } = await supabase.from("pickup_entries")
          .select("*")
          .eq("hotel_id", session.user.id)
          .order("fecha_llegada")
          .range(desde, desde + PAGINA - 1);
        if (error || !data || data.length === 0) break;
        todas = todas.concat(data);
        if (data.length < PAGINA) break;
        desde += PAGINA;
      }
      console.log(`[Pickup] total cargado: ${todas.length}`);
      console.log(`[Pickup] años detectados:`, [...new Set(todas.map(e => String(e.fecha_llegada||"").slice(0,4)))]);
      setPickupEntries(todas);
      // Ajustar año al más reciente con datos
      if (todas.length > 0) {
        const anios = [...new Set(todas.map(e => String(e.fecha_llegada||"").slice(0,4)).filter(Boolean).map(Number))].sort();
        if (anios.length > 0) setAnio(anios[anios.length - 1]);
      }
      setCargando(false);
    };
    cargar();
  }, [session?.user?.id]);

  // ── OTB por mes (suma num_reservas por fecha_llegada) ──
  const otbPorMes = {};
  (pickupEntries || []).forEach(e => {
    const f = String(e.fecha_llegada || "").slice(0, 7);
    if (!f || f.length < 7) return;
    otbPorMes[f] = (otbPorMes[f] || 0) + (e.num_reservas || 1);
  });

  // ── Presupuesto por mes del año seleccionado ──
  const pptoPorMes = {};
  (presupuesto || []).forEach(p => {
    if (!p.anio || !p.mes) return;
    // Convertir OCC ppto + habitaciones → reservas estimadas
    const hab = datos.hotel?.habitaciones || 30;
    const diasMes = new Date(p.anio, p.mes, 0).getDate();
    const reservasPpto = p.occ_ppto ? Math.round((p.occ_ppto / 100) * hab * diasMes) : null;
    const key = `${p.anio}-${String(p.mes).padStart(2,"0")}`;
    pptoPorMes[key] = reservasPpto;
  });

  // ── Datos para la gráfica: 4 trimestres del año seleccionado ──
  const TRIMESTRES = ["Q1", "Q2", "Q3", "Q4"];
  const datosGrafica = TRIMESTRES.map((trim, qi) => {
    const meses = [qi*3, qi*3+1, qi*3+2]; // índices 0-based
    let otb = 0, ppto = 0, ly = 0, tienePpto = false, tieneLY = false;
    meses.forEach(mi => {
      const key   = `${anio}-${String(mi+1).padStart(2,"0")}`;
      const keyLY = `${anio-1}-${String(mi+1).padStart(2,"0")}`;
      otb  += otbPorMes[key]  || 0;
      ly   += otbPorMes[keyLY] || 0;
      if (pptoPorMes[key] != null) { ppto += pptoPorMes[key]; tienePpto = true; }
      if (otbPorMes[keyLY]) tieneLY = true;
    });
    return { mes: trim, otb: otb || null, ppto: tienePpto ? ppto : null, ly: tieneLY ? ly : null };
  });

  // ── Años disponibles: unión de pickup + presupuesto (siempre navegable) ──
  const aniosPickupDisp = Object.keys(otbPorMes).map(k => parseInt(k.slice(0,4)));
  const aniosPptoDisp   = (presupuesto || []).map(p => p.anio).filter(Boolean);
  const aniosDisp = [...new Set([...aniosPickupDisp, ...aniosPptoDisp, anio])].sort();

  // ── Colores gráfica: tonos dorados ──
  const COL_OTB  = "#B8860B";  // dorado oscuro
  const COL_PPTO = "#DAA520";  // dorado medio
  const COL_LY   = "#F5D78E";  // dorado claro

  // ── Calcular máximo para escala ──
  const maxVal = Math.max(
    ...datosGrafica.map(d => Math.max(d.otb||0, d.ppto||0, d.ly||0)),
    10
  );
  const escala = [0, 25, 50, 75, 100].map(p => Math.round(maxVal * p / 100));
  escala.push(Math.ceil(maxVal / 10) * 10);
  const yMax = Math.ceil(maxVal * 1.15 / 10) * 10;

  const barH = (val) => val && yMax > 0 ? `${Math.min((val/yMax)*100, 100)}%` : "0%";

  const hayDatos = datosGrafica.some(d => d.otb || d.ppto || d.ly);

  if (cargando) return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", minHeight:300, gap:12 }}>
      <div style={{ width:32, height:32, border:`3px solid ${C.border}`, borderTop:`3px solid ${C.accent}`, borderRadius:"50%", animation:"spin 0.8s linear infinite" }} />
      <p style={{ color:C.textLight, fontSize:13 }}>Cargando pickup...</p>
    </div>
  );

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:20 }}>

      {/* Selector año */}
      <div style={{ display:"flex", justifyContent:"flex-end" }}>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <button
            onClick={()=>setAnio(a=>{const i=aniosDisp.indexOf(a); return i>0?aniosDisp[i-1]:a;})}
            disabled={aniosDisp.indexOf(anio)===0}
            style={{ background:"none", border:`1px solid ${C.border}`, borderRadius:6, width:28, height:28, cursor: aniosDisp.indexOf(anio)===0?"default":"pointer", fontSize:15, color: aniosDisp.indexOf(anio)===0?C.border:C.textMid, display:"flex", alignItems:"center", justifyContent:"center" }}>‹</button>
          <span style={{ fontWeight:700, fontSize:16, color:C.text, minWidth:44, textAlign:"center", fontFamily:"'DM Sans',sans-serif" }}>{anio}</span>
          <button
            onClick={()=>setAnio(a=>{const i=aniosDisp.indexOf(a); return i<aniosDisp.length-1?aniosDisp[i+1]:a;})}
            disabled={aniosDisp.indexOf(anio)===aniosDisp.length-1}
            style={{ background:"none", border:`1px solid ${C.border}`, borderRadius:6, width:28, height:28, cursor: aniosDisp.indexOf(anio)===aniosDisp.length-1?"default":"pointer", fontSize:15, color: aniosDisp.indexOf(anio)===aniosDisp.length-1?C.border:C.textMid, display:"flex", alignItems:"center", justifyContent:"center" }}>›</button>
        </div>
      </div>

      {/* ── GRÁFICA + DÍA MÁS RESERVADO ── */}
      <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:"24px 28px", display:"flex", gap:24 }}>
        {/* Col izquierda: días más reservados */}
        <div style={{ display:"flex", flexDirection:"column", gap:12, minWidth:170 }}>
          <p style={{ fontSize:11, fontWeight:700, color:C.textLight, textTransform:"uppercase", letterSpacing:1, marginBottom:4 }}>🏆 Día pico</p>
          {(pickupEntries && pickupEntries.length > 0) && (() => {
            const porDia = {};
            (pickupEntries || []).forEach(e => {
              const f = String(e.fecha_llegada || "").slice(0, 10);
              if (!f || f.length < 10) return;
              porDia[f] = (porDia[f] || 0) + (e.num_reservas || 1);
            });
            const findPeak = (desde, hasta) => {
              let best = null, bestVal = 0;
              Object.entries(porDia).forEach(([fecha, val]) => {
                if (fecha >= desde && fecha <= hasta && val > bestVal) { bestVal = val; best = fecha; }
              });
              return best ? { fecha: best, reservas: bestVal } : null;
            };
            const fmt = (isoStr) => {
              const [y, m, d] = isoStr.split("-");
              const dias  = ["Dom","Lun","Mar","Mié","Jue","Vie","Sáb"];
              const meses = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
              const dt = new Date(Number(y), Number(m)-1, Number(d));
              return `${dias[dt.getDay()]} ${Number(d)} ${meses[Number(m)-1]}`;
            };
            const pad = n => String(n).padStart(2,"0");
            const hoyStr    = `${hoy.getFullYear()}-${pad(hoy.getMonth()+1)}-${pad(hoy.getDate())}`;
            const semFin    = new Date(hoy); semFin.setDate(semFin.getDate()+7);
            const semFinStr = `${semFin.getFullYear()}-${pad(semFin.getMonth()+1)}-${pad(semFin.getDate())}`;
            const mesSig    = new Date(hoy.getFullYear(), hoy.getMonth()+1, 1);
            const mesSigFin = new Date(hoy.getFullYear(), hoy.getMonth()+2, 0);
            const mesDesde  = `${mesSig.getFullYear()}-${pad(mesSig.getMonth()+1)}-01`;
            const mesHasta  = `${mesSigFin.getFullYear()}-${pad(mesSigFin.getMonth()+1)}-${pad(mesSigFin.getDate())}`;
            const anioDesde = `${hoy.getFullYear()}-01-01`;
            const anioHasta = `${hoy.getFullYear()}-12-31`;
            const tarjetas  = [
              { label:"Próx. semana", icon:"📅", peak: findPeak(hoyStr,    semFinStr) },
              { label:"Próx. mes",    icon:"🗓️",  peak: findPeak(mesDesde,  mesHasta)  },
              { label:"Año actual",   icon:"📆",  peak: findPeak(anioDesde, anioHasta) },
            ];
            return tarjetas.map(({ label, icon, peak }) => (
              <div key={label} style={{ borderLeft:`3px solid ${COL_OTB}`, paddingLeft:12 }}>
                <p style={{ fontSize:10, color:C.textLight, fontWeight:600, marginBottom:4 }}>{icon} {label}</p>
                {peak ? (
                  <>
                    <p style={{ fontSize:15, fontWeight:800, color:C.text, fontFamily:"'DM Sans',sans-serif", letterSpacing:-0.3 }}>{fmt(peak.fecha)}</p>
                    <p style={{ fontSize:11, color:C.textMid, marginTop:2 }}><span style={{ fontWeight:700, color:COL_PPTO }}>{peak.reservas}</span> reservas</p>
                  </>
                ) : (
                  <p style={{ fontSize:11, color:C.textLight }}>Sin datos</p>
                )}
              </div>
            ));
          })()}
        </div>
        {/* Col derecha: gráfica */}
        <div style={{ flex:1 }}>

        {/* Leyenda */}
        <div style={{ display:"flex", gap:20, marginBottom:24, flexWrap:"wrap" }}>
          {[["OTB Actual", COL_OTB], ["Presupuesto", COL_PPTO], ["Año Anterior", COL_LY]].map(([label, color]) => (
            <div key={label} style={{ display:"flex", alignItems:"center", gap:7 }}>
              <div style={{ width:14, height:14, background:color, borderRadius:2 }} />
              <span style={{ fontSize:12, fontWeight:600, color:C.textMid }}>{label}</span>
            </div>
          ))}
        </div>

        {!hayDatos ? (
          <div style={{ textAlign:"center", padding:"60px 0", color:C.textLight, fontSize:13 }}>
            Sin datos de pickup. Sube un CSV para ver la gráfica.
          </div>
        ) : (
          <div style={{ display:"flex", gap:0, alignItems:"flex-end", height:280, position:"relative" }}>

            {/* Escala Y solo números, sin líneas */}
            {[0,25,50,75,100].map(p => {
              const val = Math.round(yMax * p / 100);
              return (
                <div key={p} style={{ position:"absolute", left:0, bottom:`${p}%`, display:"flex", alignItems:"center" }}>
                  <span style={{ fontSize:10, color:C.textLight, lineHeight:1 }}>{val}</span>
                </div>
              );
            })}

            {/* Barras por mes */}
            <div style={{ display:"flex", flex:1, alignItems:"flex-end", height:"100%", paddingLeft:36, gap:4 }}>
              {datosGrafica.map((d, i) => (
                <div key={i} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", height:"100%", justifyContent:"flex-end", gap:2 }}>
                  {/* Grupo de 3 barras */}
                  <div style={{ display:"flex", alignItems:"flex-end", gap:2, width:"100%", height:"calc(100% - 20px)", justifyContent:"center" }}>
                    {/* OTB */}
                    <div style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"flex-end", height:"100%" }}>
                      {d.otb > 0 && (
                        <span style={{ fontSize:9, fontWeight:700, color:COL_OTB, marginBottom:2, lineHeight:1 }}>{d.otb}</span>
                      )}
                      <div title={`OTB: ${d.otb||0}`} style={{ width:"100%", height:barH(d.otb), background:COL_OTB, borderRadius:"3px 3px 0 0", minHeight: d.otb>0?4:0, transition:"height 0.3s" }} />
                    </div>
                    {/* PPTO */}
                    <div style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"flex-end", height:"100%" }}>
                      {d.ppto > 0 && (
                        <span style={{ fontSize:9, fontWeight:700, color:COL_PPTO, marginBottom:2, lineHeight:1 }}>{d.ppto}</span>
                      )}
                      <div title={`Ppto: ${d.ppto||0}`} style={{ width:"100%", height:barH(d.ppto), background:COL_PPTO, borderRadius:"3px 3px 0 0", minHeight: d.ppto>0?4:0, transition:"height 0.3s" }} />
                    </div>
                    {/* LY */}
                    <div style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"flex-end", height:"100%" }}>
                      {d.ly > 0 && (
                        <span style={{ fontSize:9, fontWeight:700, color:COL_LY, marginBottom:2, lineHeight:1 }}>{d.ly}</span>
                      )}
                      <div title={`LY: ${d.ly||0}`} style={{ width:"100%", height:barH(d.ly), background:COL_LY, borderRadius:"3px 3px 0 0", minHeight: d.ly>0?4:0, transition:"height 0.3s" }} />
                    </div>
                  </div>
                  {/* Label mes */}
                  <span style={{ fontSize:10, color:C.textLight, fontWeight:600, marginTop:6 }}>{d.mes}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        </div>{/* fin col derecha */}
      </div>{/* fin card gráfica+pico */}

      {/* ── PACE ── */}
      {(() => {
        const MESES_FULL2 = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
        const pad = n => String(n).padStart(2,"0");
        const hab = datos.hotel?.habitaciones || 30;

        // 6 meses desde el mes actual
        const filasPace = Array.from({ length: 6 }, (_, i) => {
          const d    = new Date(hoy.getFullYear(), hoy.getMonth() + i, 1);
          const a    = d.getFullYear();
          const m    = d.getMonth() + 1;
          const key  = `${a}-${pad(m)}`;
          const keyLY= `${a-1}-${pad(m)}`;
          const diasMes = new Date(a, m, 0).getDate();
          const esFuturo = a > hoy.getFullYear() || (a === hoy.getFullYear() && m > hoy.getMonth() + 1);

          // OTB actual
          const otb = otbPorMes[key] || 0;
          // LY real (produccion)
          const lyDatos = (produccion || []).filter(r => {
            const f = new Date(r.fecha + "T00:00:00");
            return f.getFullYear() === a-1 && f.getMonth()+1 === m;
          });
          const lyHabOcu = lyDatos.reduce((s,r) => s + (r.hab_ocupadas||0), 0);
          const lyHabDis = lyDatos.reduce((s,r) => s + (r.hab_disponibles||0), 0);
          const lyOcc    = lyHabDis > 0 ? (lyHabOcu / lyHabDis * 100) : null;
          const lyRevHab = lyDatos.reduce((s,r) => s + (r.revenue_hab||0), 0);
          const lyAdr    = lyHabOcu > 0 ? (lyRevHab / lyHabOcu) : null;

          // Presupuesto
          const pp = (presupuesto || []).find(p => p.anio === a && p.mes === m);
          const ppOcc = pp?.occ_ppto || null; // ya en %
          const ppAdr = pp?.adr_ppto || null;

          // OCC OTB estimada (reservas / (hab * días))
          const otbOcc = hab > 0 ? (otb / (hab * diasMes) * 100) : null;

          // Diferencias
          const diffLY   = lyOcc != null && otbOcc != null ? (otbOcc - lyOcc).toFixed(1) : null;
          const diffPpto = ppOcc != null && otbOcc != null ? (otbOcc - ppOcc).toFixed(1) : null;

          return {
            label: MESES[d.getMonth()] + " " + a,
            esFuturo,
            otb,
            otbOcc: otbOcc != null ? otbOcc.toFixed(1) : null,
            lyOcc:  lyOcc  != null ? lyOcc.toFixed(1)  : null,
            lyAdr:  lyAdr  != null ? Math.round(lyAdr) : null,
            ppOcc:  ppOcc  != null ? ppOcc.toFixed(1)  : null,
            ppAdr:  ppAdr  != null ? Math.round(ppAdr) : null,
            diffLY,
            diffPpto,
          };
        });

        const hayPace = filasPace.some(f => f.otb > 0 || f.lyOcc || f.ppOcc);
        if (!hayPace) return null;

        const colorDiff = v => v == null ? C.textLight : parseFloat(v) >= 0 ? "#2ECC71" : "#E74C3C";
        const fmtDiff   = v => v == null ? "—" : `${parseFloat(v)>=0?"+":""}${v}%`;

        return (
          <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, overflow:"hidden" }}>
            <div style={{ padding:"18px 24px 12px", borderBottom:`1px solid ${C.border}`, display:"flex", alignItems:"baseline", gap:10 }}>
              <h3 style={{ fontFamily:"'DM Sans',sans-serif", fontSize:16, fontWeight:700, color:C.text, margin:0 }}>Pace — Próximos 6 meses</h3>
              <span style={{ fontSize:11, color:C.textLight }}>OCC en cartera vs Presupuesto y Año Anterior</span>
            </div>
            <div style={{ overflowX:"auto" }}>
              <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12 }}>
                <thead>
                  <tr style={{ background:C.bg }}>
                    <th style={{ padding:"9px 16px", textAlign:"left",   color:C.textLight, fontWeight:600, fontSize:11, textTransform:"uppercase", letterSpacing:0.8, whiteSpace:"nowrap" }}>Mes</th>
                    <th style={{ padding:"9px 12px", textAlign:"right",  color:C.textLight, fontWeight:600, fontSize:11, textTransform:"uppercase", letterSpacing:0.8 }}>OTB Res.</th>
                    <th style={{ padding:"9px 12px", textAlign:"right",  color:"#B8860B",   fontWeight:700, fontSize:11, textTransform:"uppercase", letterSpacing:0.8 }}>OCC OTB</th>
                    <th style={{ padding:"9px 12px", textAlign:"right",  color:C.textLight, fontWeight:600, fontSize:11, textTransform:"uppercase", letterSpacing:0.8 }}>OCC LY</th>
                    <th style={{ padding:"9px 12px", textAlign:"right",  color:C.textLight, fontWeight:600, fontSize:11, textTransform:"uppercase", letterSpacing:0.8 }}>ADR LY</th>
                    <th style={{ padding:"9px 12px", textAlign:"right",  color:C.textLight, fontWeight:600, fontSize:11, textTransform:"uppercase", letterSpacing:0.8 }}>OCC Ppto</th>
                    <th style={{ padding:"9px 12px", textAlign:"right",  color:C.textLight, fontWeight:600, fontSize:11, textTransform:"uppercase", letterSpacing:0.8 }}>ADR Ppto</th>
                    <th style={{ padding:"9px 12px", textAlign:"right",  color:C.textLight, fontWeight:600, fontSize:11, textTransform:"uppercase", letterSpacing:0.8 }}>vs LY</th>
                    <th style={{ padding:"9px 16px", textAlign:"right",  color:C.textLight, fontWeight:600, fontSize:11, textTransform:"uppercase", letterSpacing:0.8 }}>vs Ppto</th>
                  </tr>
                </thead>
                <tbody>
                  {filasPace.map((f, i) => (
                    <tr key={i} style={{ borderTop:`1px solid ${C.border}`, background: i===0 ? C.accentLight : "transparent" }}>
                      <td style={{ padding:"10px 16px", fontWeight:600, color:C.text, whiteSpace:"nowrap" }}>
                        {f.label}
                        {f.esFuturo && <span style={{ marginLeft:6, fontSize:9, background:"#2C3E7A22", color:"#7A9CC8", borderRadius:3, padding:"1px 5px", fontWeight:700 }}>OTB</span>}
                      </td>
                      <td style={{ padding:"10px 12px", textAlign:"right", color:C.textMid }}>{f.otb > 0 ? f.otb : "—"}</td>
                      <td style={{ padding:"10px 12px", textAlign:"right", fontWeight:700, color:"#B8860B" }}>{f.otbOcc != null ? `${f.otbOcc}%` : "—"}</td>
                      <td style={{ padding:"10px 12px", textAlign:"right", color:C.textMid }}>{f.lyOcc  != null ? `${f.lyOcc}%`  : "—"}</td>
                      <td style={{ padding:"10px 12px", textAlign:"right", color:C.textMid }}>{f.lyAdr  != null ? `€${f.lyAdr}`  : "—"}</td>
                      <td style={{ padding:"10px 12px", textAlign:"right", color:C.textMid }}>{f.ppOcc  != null ? `${f.ppOcc}%`  : "—"}</td>
                      <td style={{ padding:"10px 12px", textAlign:"right", color:C.textMid }}>{f.ppAdr  != null ? `€${f.ppAdr}`  : "—"}</td>
                      <td style={{ padding:"10px 12px", textAlign:"right", fontWeight:700, color:colorDiff(f.diffLY)   }}>{fmtDiff(f.diffLY)}</td>
                      <td style={{ padding:"10px 16px", textAlign:"right", fontWeight:700, color:colorDiff(f.diffPpto) }}>{fmtDiff(f.diffPpto)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      })()}

    </div>
  );
}

// ─── BUDGET VIEW ──────────────────────────────────────────────────
function BudgetView({ datos, anio: anioProp }) {
  const { produccion, presupuesto } = datos;

  const aniosDisponibles = [...new Set((presupuesto || []).map(p => p.anio))].sort();
  const [anio, setAnio] = useState(() => aniosDisponibles.includes(anioProp) ? anioProp : (aniosDisponibles[aniosDisponibles.length - 1] || anioProp));

  if (!presupuesto || presupuesto.length === 0) {
    return <EmptyState mensaje="Importa tu plantilla Excel con los datos de la hoja 💰 Presupuesto para ver el análisis aquí" />;
  }

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

  const filas = presupuesto
    .filter(p => p.anio === anio)
    .sort((a, b) => a.mes - b.mes)
    .map(p => {
      const real = realesPorMes[p.mes - 1];
      const adr_dev       = real.adr_real != null       ? Math.round((real.adr_real - p.adr_ppto) * 100) / 100           : null;
      const revpar_dev    = real.revpar_real != null     ? Math.round((real.revpar_real - p.revpar_ppto) * 100) / 100       : null;
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
    const rounded = Math.round(val * 100) / 100;
    const up = rounded >= 0;
    return (
      <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: up ? C.green : C.red }}>
          {up ? "+" : ""}{Math.abs(rounded) > 999 ? `${(rounded/1000).toFixed(1)}k` : rounded}€
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

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 14, marginBottom: 24 }}>
        <KpiCard accentColor="#1A7A3C" label="Revenue Total Ppto." value={`€${Math.round(totalRevPpto).toLocaleString("es-ES")}`} change="Año completo" sub="objetivo anual" up={true} i={0} />
        <KpiCard accentColor="#1A7A3C" label="Revenue Real (YTD)" value={`€${Math.round(totalRevReal).toLocaleString("es-ES")}`} change={totalRevDevPct != null ? `${totalRevDevPct >= 0 ? "+" : ""}${totalRevDevPct}%` : "—"} sub="vs presupuesto" up={totalRevDev >= 0} i={1} />
        <KpiCard accentColor="#1A7A3C" label="ADR Medio Ppto." value={`€${mediaAdrPpto}`} change={mediaAdrReal != null ? `Real: €${mediaAdrReal}` : "Sin real"} sub="precio medio objetivo" up={mediaAdrReal == null || mediaAdrReal >= mediaAdrPpto} i={2} />
        <KpiCard accentColor="#1A7A3C" label="RevPAR Medio Ppto." value={`€${mediaRevparPpto}`} change={mediaRevparReal != null ? `Real: €${mediaRevparReal}` : "Sin real"} sub="por hab disponible" up={mediaRevparReal == null || mediaRevparReal >= mediaRevparPpto} i={3} />
      </div>

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
              <Bar dataKey="ADR Ppto" fill="#2E9C5588" radius={[3,3,0,0]} />
              <Bar dataKey="ADR Real" fill="#1A7A3C" radius={[3,3,0,0]} />
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
              <Bar dataKey="Rev. Ppto (k€)" fill="#2E9C5588" radius={[3,3,0,0]} />
              <Bar dataKey="Rev. Real (k€)" fill="#1A7A3C" radius={[3,3,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <Card>
        <p style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700, fontSize: 16, color: C.text, marginBottom: 16 }}>Detalle mensual</p>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <thead>
              <tr style={{ borderBottom: `2px solid ${C.border}` }}>
                <th style={{ padding: "8px 12px", textAlign: "left",  fontSize: 10, color: C.textLight, textTransform: "uppercase", letterSpacing: "1px", fontWeight: 600 }}>Mes</th>
                <th style={{ padding: "8px 8px",  textAlign: "right", fontSize: 10, color: C.textLight, textTransform: "uppercase", letterSpacing: "1px", fontWeight: 600 }}>ADR Ppto.</th>
                <th style={{ padding: "8px 8px",  textAlign: "right", fontSize: 10, color: C.textLight, textTransform: "uppercase", letterSpacing: "1px", fontWeight: 600 }}>ADR Real</th>
                <th style={{ padding: "8px 8px",  textAlign: "right", fontSize: 10, color: C.textLight, textTransform: "uppercase", letterSpacing: "1px", fontWeight: 600 }}>Desv. ADR</th>
                <th style={{ padding: "8px 8px",  textAlign: "right", fontSize: 10, color: C.textLight, textTransform: "uppercase", letterSpacing: "1px", fontWeight: 600 }}>RevPAR Ppto.</th>
                <th style={{ padding: "8px 8px",  textAlign: "right", fontSize: 10, color: C.textLight, textTransform: "uppercase", letterSpacing: "1px", fontWeight: 600 }}>RevPAR Real</th>
                <th style={{ padding: "8px 8px",  textAlign: "right", fontSize: 10, color: C.textLight, textTransform: "uppercase", letterSpacing: "1px", fontWeight: 600 }}>Desv. RevPAR</th>
                <th style={{ padding: "8px 8px",  textAlign: "right", fontSize: 10, color: C.textLight, textTransform: "uppercase", letterSpacing: "1px", fontWeight: 600 }}>Rev. Total Ppto.</th>
                <th style={{ padding: "8px 8px",  textAlign: "right", fontSize: 10, color: C.textLight, textTransform: "uppercase", letterSpacing: "1px", fontWeight: 600 }}>Rev. Total Real</th>
                <th style={{ padding: "8px 8px",  textAlign: "right", fontSize: 10, color: C.textLight, textTransform: "uppercase", letterSpacing: "1px", fontWeight: 600 }}>Desv. Rev. Total</th>
              </tr>
            </thead>
            <tbody>
              {filas.map((f, i) => (
                <tr key={i} style={{ borderBottom: `1px solid ${C.border}`, background: i % 2 === 0 ? "#FAFAFA" : C.bgCard }}>
                  <td style={{ padding: "10px 12px", fontWeight: 600, color: C.text }}>{f.mes}</td>
                  <td style={{ padding: "10px 8px", textAlign: "right", color: C.textMid }}>€{f.adr_ppto}</td>
                  <td style={{ padding: "10px 8px", textAlign: "right", color: C.text, fontWeight: f.adr_real ? 600 : 400 }}>{f.adr_real != null ? `€${f.adr_real}` : "—"}</td>
                  <td style={{ padding: "10px 8px", textAlign: "right" }}><DevBadge val={f.adr_dev} pct={f.adr_dev_pct} /></td>
                  <td style={{ padding: "10px 8px", textAlign: "right", color: C.textMid }}>€{f.revpar_ppto}</td>
                  <td style={{ padding: "10px 8px", textAlign: "right", color: "#1A7A3C", fontWeight: f.revpar_real ? 600 : 400 }}>{f.revpar_real != null ? `€${f.revpar_real}` : "—"}</td>
                  <td style={{ padding: "10px 8px", textAlign: "right" }}><DevBadge val={f.revpar_dev} pct={f.revpar_dev_pct} /></td>
                  <td style={{ padding: "10px 8px", textAlign: "right", color: C.textMid }}>€{f.rev_total_ppto?.toLocaleString("es-ES")}</td>
                  <td style={{ padding: "10px 8px", textAlign: "right", color: "#1A7A3C", fontWeight: f.rev_total_real ? 600 : 400 }}>{f.rev_total_real != null ? `€${f.rev_total_real.toLocaleString("es-ES")}` : "—"}</td>
                  <td style={{ padding: "10px 8px", textAlign: "right" }}><DevBadge val={f.revtotal_dev} pct={f.revtotal_dev_pct} /></td>
                </tr>
              ))}
              {filasConReal.length > 0 && (
                <tr style={{ borderTop: `2px solid ${C.border}`, background: "#E8F5EE", fontWeight: 700 }}>
                  <td style={{ padding: "10px 12px", color: C.text, fontWeight: 700 }}>TOTAL YTD</td>
                  <td colSpan={2} style={{ padding: "10px 8px", textAlign: "right", color: C.textMid, fontSize: 11 }}>Ppto: €{mediaAdrPpto} media</td>
                  <td style={{ padding: "10px 8px", textAlign: "right" }}><DevBadge val={mediaAdrReal != null ? mediaAdrReal - mediaAdrPpto : null} pct={mediaAdrReal != null ? (((mediaAdrReal - mediaAdrPpto)/mediaAdrPpto)*100).toFixed(1) : null} /></td>
                  <td colSpan={2} style={{ padding: "10px 8px", textAlign: "right", color: C.textMid, fontSize: 11 }}>Ppto: €{mediaRevparPpto} media</td>
                  <td style={{ padding: "10px 8px", textAlign: "right" }}><DevBadge val={mediaRevparReal != null ? mediaRevparReal - mediaRevparPpto : null} pct={mediaRevparReal != null ? (((mediaRevparReal - mediaRevparPpto)/mediaRevparPpto)*100).toFixed(1) : null} /></td>
                  <td style={{ padding: "10px 8px", textAlign: "right", color: C.textMid, fontSize: 11 }}>€{Math.round(filasConReal.reduce((a,f)=>a+(f.rev_total_ppto||0),0)).toLocaleString("es-ES")}</td>
                  <td style={{ padding: "10px 8px", textAlign: "right", color: "#1A7A3C" }}>€{Math.round(totalRevReal).toLocaleString("es-ES")}</td>
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

const NAV = [
  { key: "dashboard",  icon: "◈",  label: "Dashboard" },
  { key: "pickup",     icon: "📊", label: "Pickup" },
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
  const [datos, setDatos] = useState({ produccion: [], presupuesto: [] });
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

  const [refreshKey, setRefreshKey] = useState(0);

  const cargarDatos = async () => {
    setCargandoDatos(true);
    const [{ data: produccion }, { data: presupuesto }, { data: hotelData }] = await Promise.all([
      supabase.from("produccion_diaria").select("*").eq("hotel_id", session.user.id).order("fecha"),
      supabase.from("presupuesto").select("*").eq("hotel_id", session.user.id).order("mes"),
      supabase.from("hoteles").select("nombre, ciudad, habitaciones").eq("id", session.user.id).maybeSingle(),
    ]);
    // Pickup separado — carga en paralelo para máxima velocidad
    let pickupEntries = [];
    try {
      // Primera llamada para saber el total
      const { data: pe0, count } = await supabase.from("pickup_entries")
        .select("fecha_llegada, num_reservas", { count: "exact" })
        .eq("hotel_id", session.user.id)
        .range(0, 999);
      if (pe0 && pe0.length > 0) {
        const total = count || pe0.length;
        const PAGINA = 1000;
        const paginas = Math.ceil(total / PAGINA);
        // Lanzar el resto en paralelo
        const resto = paginas > 1
          ? await Promise.all(
              Array.from({ length: paginas - 1 }, (_, i) =>
                supabase.from("pickup_entries")
                  .select("fecha_llegada, num_reservas")
                  .eq("hotel_id", session.user.id)
                  .range((i + 1) * PAGINA, (i + 2) * PAGINA - 1)
                  .then(r => r.data || [])
              )
            )
          : [];
        pickupEntries = [...pe0, ...resto.flat()];
      }
    } catch(_) {}
    setDatos({
      produccion: produccion || [],
      presupuesto: presupuesto || [],
      pickupEntries,
      hotel: hotelData,
      session,
    });
    setCargandoDatos(false);
    setRefreshKey(k => k + 1);
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
        
      `}</style>

      {/* Sidebar */}
      <div style={{ width: sidebarOpen ? 220 : 60, flexShrink: 0, minHeight: "100vh", background: C.bgDeep, display: "flex", flexDirection: "column", position: "sticky", top: 0, height: "100vh", transition: "width 0.25s ease", overflow: "hidden" }}>
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
          {NAV.map(n => {
              const navColor = n.key==="budget" ? "#1A7A3C" : n.key==="pickup" ? "#B8860B" : C.accent;
              const isActive = view===n.key;
              return (
                <button key={n.key} onClick={() => { setView(n.key); setMesDetalle(null); }}
                  title={!sidebarOpen ? n.label : ""}
                  style={{ width: "100%", display: "flex", alignItems: "center", gap: sidebarOpen ? 10 : 0, justifyContent: sidebarOpen ? "flex-start" : "center", padding: sidebarOpen ? "10px 12px" : "10px 0", borderRadius: 8, border: "none", cursor: "pointer", background: isActive ? navColor : "transparent", color: isActive ? "#fff" : "#A8998A", fontSize: 13, fontWeight: isActive ? 600 : 400, fontFamily: "'DM Sans', sans-serif", marginBottom: 2, textAlign: "left", transition: "all 0.15s", overflow: "hidden" }}
                  onMouseEnter={e=>{ if(!isActive){ e.currentTarget.style.background=navColor+"55"; e.currentTarget.style.color="#fff"; } }}
                  onMouseLeave={e=>{ e.currentTarget.style.background=isActive ? navColor : "transparent"; e.currentTarget.style.color=isActive ? "#fff" : "#A8998A"; }}>
                  <span style={{ fontSize: 16, flexShrink: 0 }}>{n.icon}</span>
                  {sidebarOpen && <span style={{ whiteSpace: "nowrap" }}>{n.label}</span>}
                </button>
              );
            })}
        </nav>
        <div style={{ padding: sidebarOpen ? "16px 12px" : "16px 10px", borderTop: "1px solid #FFFFFF11" }}>
          {sidebarOpen && <p style={{ fontSize: 11, color: "#FFFFFF44", marginBottom: 8, paddingLeft: 4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{session.user.email}</p>}
          <button onClick={handleLogout} title={!sidebarOpen ? "Cerrar sesión" : ""}
            style={{ width: "100%", padding: "10px", borderRadius: 8, border: "1px solid #FFFFFF22", background: "transparent", color: "#A8998A", cursor: "pointer", fontSize: sidebarOpen ? 12 : 16, fontFamily: "'DM Sans', sans-serif", display: "flex", alignItems: "center", justifyContent: "center" }}>
            {sidebarOpen ? "Cerrar sesión" : "↩"}
          </button>
        </div>
      </div>

      {/* Main */}
      <main style={{ flex: 1, minWidth: 0, padding: "28px 32px", overflowY: "auto", height: "100vh" }}>
        {view === "dashboard" && (
        <div style={{ marginBottom: 14 }}>
          <p style={{ fontSize: 22, fontWeight: 800, color: C.text, fontFamily: "'DM Sans',sans-serif", letterSpacing: -0.5 }}>
            Bienvenido, <span style={{ color: C.accent }}>{datos.hotel?.nombre || "Mi Hotel"}</span>
          </p>
          <p style={{ fontSize: 12, color: C.textLight, marginTop: 2 }}>
            {new Date().toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long", year: "numeric" }).replace(/^\w/, c => c.toUpperCase())}
          </p>
        </div>
        )}

        {view === "dashboard" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", alignItems: "center", marginBottom: 24, gap: 16, background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 12, padding: "16px 20px", boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
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

            <div style={{ display: "flex", justifyContent: "center" }}>
              {view === "dashboard"
                ? <PeriodSelectorInline mes={mesSel} anio={anioSel} onChange={(m,a)=>{ setMesSel(m); setAnioSel(a); localStorage.setItem("rm_mes",m); localStorage.setItem("rm_anio",a); }} aniosDisponibles={[...new Set((datos.produccion||[]).map(d=>new Date(d.fecha+"T00:00:00").getFullYear()))].sort()} />
                : null
              }
            </div>

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
          </div>
        )}

        {cargandoDatos ? <LoadingSpinner /> : mesDetalle ? (
          <MonthDetailView datos={datos} mes={mesDetalle.mes} anio={mesDetalle.anio} onBack={() => setMesDetalle(null)} />
        ) : (
          <View datos={datos} mes={mesSel} anio={anioSel} onGuardado={cargarDatos} onPeriodo={(m,a) => { setMesSel(m); setAnioSel(a); localStorage.setItem("rm_mes", m); localStorage.setItem("rm_anio", a); }} />
        )}
      </main>

      {importar && <ImportarExcel onClose={() => setImportar(false)} session={session} onImportado={cargarDatos} />}
    </div>
  );
}