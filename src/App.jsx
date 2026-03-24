import { useState, useEffect, useRef } from "react";
import { supabase } from "./supabase";
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line, ComposedChart,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  PieChart, Pie, Cell,
} from "recharts";

const LOGO_B64 = "data:image/png;base64,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";
const C = {
  bg: "#FDFDFD", bgCard: "#FFFFFF", bgDeep: "#0A2540",
  accent: "#004B87", accentLight: "#E8F0F9", accentDark: "#003366",
  text: "#1A1A1A", textMid: "#555555", textLight: "#888888",
  border: "#E0E0E0", green: "#009F4D", greenLight: "#E6F7EE",
  red: "#D32F2F", redLight: "#FDECEA", blue: "#004B87",
};

const MESES = ["Enero","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
const MESES_CORTO = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
const MESES_FULL = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];

const CustomTooltip = ({ active, payload, label, unit }) => {
  if (!active || !payload?.length) return null;
  const OCC_NAMES = ["Ocupación","occ","OCC"];
  return (
    <div style={{ background: "#fff", borderRadius: 8, padding: "10px 14px", fontSize: 12, color: C.text, border: `1px solid ${C.border}`, boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}>
      <p style={{ color: C.accent, fontWeight: 700, marginBottom: 6 }}>{payload[0]?.payload?.mesNombre || payload[0]?.payload?.fecha || label}</p>
      {payload.map((p, i) => {
        const isOcc = unit === "%" || OCC_NAMES.includes(p.name);
        const val = typeof p.value === 'number'
          ? isOcc ? `${Math.round(p.value)}%` : `${Math.round(p.value).toLocaleString("es-ES")}€`
          : p.value;
        return (
          <p key={i} style={{ color: C.textMid, margin: "2px 0" }}>
            {p.name}: <b style={{ color: C.text }}>{val}</b>
          </p>
        );
      })}
    </div>
  );
};

function Card({ children, style = {} }) {
  return (
    <div style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 10, padding: "22px 24px", width: "100%", ...style }}>
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

  const [modoVista, setModoVista] = useState("30dias"); // "30dias" | "mes"

  const todasProd = (produccion||[]).sort((a,b)=>new Date(a.fecha)-new Date(b.fecha));
  const ultimaFechaMes = todasProd
    .filter(d => { const f=new Date(d.fecha+"T00:00:00"); return f.getMonth()===mes && f.getFullYear()===anio; })
    .map(d => d.fecha).slice(-1)[0];
  const refDate = ultimaFechaMes ? new Date(ultimaFechaMes+"T00:00:00") : new Date();
  const desde30 = new Date(refDate); desde30.setDate(desde30.getDate()-29);
  const desde30Str = desde30.toISOString().slice(0,10);
  const refDateStr  = refDate.toISOString().slice(0,10);

  const diasMes = todasProd
    .filter(d => {
      const f=new Date(d.fecha+"T00:00:00");
      if (modoVista === "mes") return f.getMonth()===mes && f.getFullYear()===anio;
      return d.fecha >= desde30Str && d.fecha <= refDateStr;
    })
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

  // Año anterior mismo mes
  const diasLY = todasProd
    .filter(d => { const f=new Date(d.fecha+"T00:00:00"); return f.getMonth()===mes && f.getFullYear()===anio-1; })
    .map(mapProd);

  const getChartData = () => {
    const lyField = kpi==="Ocupación"?"occ":kpi==="ADR"?"adr":kpi==="RevPAR"?"revpar":kpi==="TRevPAR"?"trevpar":"revTotal";
    return diasMes.map((d,i)=>({
      ...d,
      mp: diasComp[i]?.[lyField] ?? null,
      ly: diasLY[i]?.[lyField] ?? null,
    }));
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

        {(kpi === "TRevPAR" || kpi === "Revenue Total") ? (() => {
          const totalHabS  = diasMes.reduce((a,d)=>a+d.revHab,0);
          const totalFnbS  = diasMes.reduce((a,d)=>a+d.revFnb,0);
          const totalOtrosS= diasMes.reduce((a,d)=>a+d.revOtros,0);
          return (
            <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:12, marginBottom:20 }}>
              {[
                { label:"Total del mes", value:`€${Math.round(totalHabS+totalFnbS+totalOtrosS).toLocaleString("es-ES")}` },
                { label:`Vs ${MESES_FULL[mesPrevIdx]}`, value: varComp!==null ? `${parseFloat(varComp)>=0?"+":""}${varComp}%` : "Sin datos", up: varComp!==null?parseFloat(varComp)>=0:true },
                { label:"Habitaciones", value:`€${Math.round(totalHabS).toLocaleString("es-ES")}`, color:C.accent },
                { label:"F&B", value:`€${Math.round(totalFnbS).toLocaleString("es-ES")}`, color:"#E85D04" },
                { label:"Otros", value:`€${Math.round(totalOtrosS).toLocaleString("es-ES")}`, color:C.green },
              ].map((k,i)=>(
                <div key={i} style={{ background:`${C.accent}0f`, borderRadius:8, padding:"16px", borderLeft:`3px solid ${k.color||C.accent}`, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", textAlign:"center" }}>
                  <p style={{ fontSize:10, color:C.textMid, textTransform:"uppercase", letterSpacing:1.5, marginBottom:6, fontWeight:600 }}>{k.label}</p>
                  <p style={{ fontSize:22, fontWeight:700, color:k.color||(k.up===false?C.red:k.up===true?C.green:C.text), fontFamily:"'DM Sans',sans-serif" }}>{k.value}</p>
                </div>
              ))}
            </div>
          );
        })() : (
        <div style={{ display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:12, marginBottom:20 }}>
          {[
            { label:"Media del mes", value:`${kpi==="Ocupación"?mediaActual.toFixed(1):Math.round(mediaActual).toLocaleString("es-ES")}${unit}` },
            { label:`Vs ${compLabel}`, value: varComp!==null ? `${parseFloat(varComp)>=0?"+":""}${varComp}%` : "Sin datos", up: varComp!==null?parseFloat(varComp)>=0:true },
          ].map((k,i)=>(
            <div key={i} style={{ background:`${C.accent}0f`, borderRadius:8, padding:"16px", borderLeft:`3px solid ${C.accent}`, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", textAlign:"center" }}>
              <p style={{ fontSize:10, color:C.textMid, textTransform:"uppercase", letterSpacing:1.5, marginBottom:6, fontWeight:600 }}>{k.label}</p>
              <p style={{ fontSize:22, fontWeight:700, color:k.up===false?C.red:k.up===true?C.green:C.text, fontFamily:"'DM Sans',sans-serif" }}>{k.value}</p>
            </div>
          ))}
        </div>
        )}

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
          })() : kpi!=="TRevPAR" ? (<>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:10 }}>
              <div style={{ display:"flex", gap:6 }}>
                {[["30dias","Últimos 30 días"],["mes","Mes actual"]].map(([key,label])=>(
                  <button key={key} onClick={()=>setModoVista(key)}
                    style={{ padding:"4px 12px", borderRadius:6, border:`1px solid ${modoVista===key?C.accent:C.border}`, background:modoVista===key?C.accentLight:"transparent", color:modoVista===key?C.accent:C.textLight, fontSize:11, fontWeight:modoVista===key?600:400, cursor:"pointer", fontFamily:"'DM Sans',sans-serif" }}>
                    {label}
                  </button>
                ))}
              </div>
              <div style={{ display:"flex", gap:12, alignItems:"center" }}>
                <div style={{ display:"flex", alignItems:"center", gap:5 }}>
                  <div style={{ width:12, height:10, background:C.accent, borderRadius:2 }}/>
                  <span style={{ fontSize:10, color:C.textMid }}>Actual</span>
                </div>
                <div style={{ display:"flex", alignItems:"center", gap:5 }}>
                  <div style={{ width:18, height:2, background:"#E85D04", borderRadius:1 }}/>
                  <span style={{ fontSize:10, color:C.textMid }}>Año anterior</span>
                </div>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <ComposedChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke={C.border} vertical={false}/>
                <XAxis dataKey="dia" tick={{fill:"#555",fontSize:11,fontWeight:500}} axisLine={false} tickLine={false} interval={modoVista==="mes"?1:4}/>
                <YAxis tick={{fill:C.textLight,fontSize:10}} axisLine={false} tickLine={false} unit={unit}/>
                <Tooltip content={<CustomTooltip unit={unit}/>}/>
                <Bar dataKey={fieldKey} name={kpi} fill={C.accent} fillOpacity={0.85} radius={[2,2,0,0]} barSize={modoVista==="mes"?10:6}/>
                <Line type="monotone" dataKey="ly" name="Año anterior" stroke="#E85D04" strokeWidth={1.5} dot={false} connectNulls/>
              </ComposedChart>
            </ResponsiveContainer>
          </>) : null}
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
      <p style={{ fontSize: "clamp(22px,5vw,30px)", fontWeight: 700, fontFamily: "'DM Sans', sans-serif", color: C.text, margin: "8px 0 6px", letterSpacing: "-1px", lineHeight: 1 }}>{value}</p>
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
                border: esHoyMes && !activo ? `1.5px solid ${C.accent}66` : `1px solid ${activo?C.accent:C.border}`,
                background: activo ? C.accent : "transparent",
                color: futuro ? C.textLight : activo ? "#fff" : C.text,
                fontSize: 11, fontWeight: activo ? 700 : 500, opacity: futuro ? 0.3 : 1,
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




function calcularAlertas(datos, mes, anio) {
  const alertas = [];
  const { produccion, presupuesto, pickupEntries } = datos;
  const hoy = new Date();

  if (!produccion || produccion.length === 0) return alertas;

  // ── Pickup de ayer ──
  const ayer = new Date(hoy); ayer.setDate(hoy.getDate() - 1);
  const ayerStr = `${ayer.getFullYear()}-${String(ayer.getMonth()+1).padStart(2,"0")}-${String(ayer.getDate()).padStart(2,"0")}`;
  const pickupAyer = (pickupEntries||[]).filter(e => String(e.fecha_pickup||"").slice(0,10) === ayerStr);
  const totalAyer = pickupAyer.reduce((a,e) => a + (e.num_reservas||1), 0);

  // Media de pickup de los últimos 30 días
  const hace30 = new Date(hoy); hace30.setDate(hoy.getDate() - 30);
  const pickup30 = (pickupEntries||[]).filter(e => {
    const d = new Date(String(e.fecha_pickup||"").slice(0,10)+"T00:00:00");
    return d >= hace30 && d < ayer;
  });
  const diasConPickup = [...new Set(pickup30.map(e => String(e.fecha_pickup||"").slice(0,10)))].length || 1;
  const mediaPickupDia = pickup30.reduce((a,e) => a+(e.num_reservas||1), 0) / diasConPickup;

  if (totalAyer === 0 && mediaPickupDia > 1) {
    alertas.push({ tipo: "rojo", icono: "📭", titulo: "Sin pickup ayer", desc: `No se captó ninguna reserva ayer. La media diaria es ${mediaPickupDia.toFixed(1)} reservas.`, accion: "pickup" });
  } else if (totalAyer > 0 && mediaPickupDia > 0 && totalAyer >= mediaPickupDia * 2) {
    alertas.push({ tipo: "verde", icono: "🚀", titulo: "Pickup excepcional", desc: `Ayer se captaron ${totalAyer} reservas, muy por encima de la media diaria (${mediaPickupDia.toFixed(1)}).`, accion: "pickup" });
  }

  // ── Ocupación vs presupuesto ──
  const datosMes = produccion.filter(d => {
    const f = new Date(d.fecha+"T00:00:00");
    return f.getMonth() === mes && f.getFullYear() === anio;
  });
  if (datosMes.length > 0) {
    const habOcu = datosMes.reduce((a,d) => a+(d.hab_ocupadas||0), 0);
    const habDis = datosMes.reduce((a,d) => a+(d.hab_disponibles||0), 0);
    const occReal = habDis > 0 ? habOcu/habDis*100 : 0;
    const ppto = (presupuesto||[]).find(p => p.mes===mes+1 && p.anio===anio);

    if (ppto?.occ_ppto) {
      const diff = occReal - ppto.occ_ppto;
      if (diff <= -10) alertas.push({ tipo: "rojo", icono: "📉", titulo: "Ocupación por debajo del presupuesto", desc: `${Math.abs(diff).toFixed(1)}% por debajo del objetivo (${ppto.occ_ppto.toFixed(1)}% ppto vs ${occReal.toFixed(1)}% real).`, accion: "kpi:Ocupación" });
      else if (diff >= 5) alertas.push({ tipo: "verde", icono: "🎯", titulo: "Ocupación por encima del presupuesto", desc: `+${diff.toFixed(1)}% sobre el objetivo. Real: ${occReal.toFixed(1)}% vs ${ppto.occ_ppto.toFixed(1)}% ppto.`, accion: "kpi:Ocupación" });
    }

    // ── Revenue vs presupuesto ──


    // ── ADR vs año anterior ──
    const mesAnterior = produccion.filter(d => {
      const f = new Date(d.fecha+"T00:00:00");
      return f.getMonth() === mes && f.getFullYear() === anio - 1;
    });
    if (mesAnterior.length > 0) {
      const adrReal = habOcu > 0 ? datosMes.reduce((a,d)=>a+(d.revenue_hab||0),0)/habOcu : 0;
      const habOcuLY = mesAnterior.reduce((a,d)=>a+(d.hab_ocupadas||0),0);
      const adrLY = habOcuLY > 0 ? mesAnterior.reduce((a,d)=>a+(d.revenue_hab||0),0)/habOcuLY : 0;
      if (adrLY > 0 && adrReal < adrLY * 0.93) {
        alertas.push({ tipo: "amarillo", icono: "⚠️", titulo: "ADR por debajo del año anterior", desc: `ADR actual €${Math.round(adrReal)} vs €${Math.round(adrLY)} del año pasado (-${((adrLY-adrReal)/adrLY*100).toFixed(1)}%).`, accion: "kpi:ADR" });
      }
    }
  }

  // ── Datos desactualizados ──
  const ultimaFecha = produccion.map(d => new Date(d.fecha+"T00:00:00")).sort((a,b)=>b-a)[0];
  if (ultimaFecha) {
    const diasSinDatos = Math.floor((hoy - ultimaFecha) / (1000*60*60*24));
    if (diasSinDatos >= 1) alertas.push({ tipo: "amarillo", icono: "🕐", titulo: "Datos desactualizados", desc: `Importa la plantilla con los últimos datos para mantener el dashboard al día.`, accion: "importar" });
  }

  return alertas;
}

function AlertasPanel({ alertas, onClose, onNavegar }) {
  if (alertas.length === 0) return (
    <div style={{ position:"absolute", top:54, right:0, width:340, background:C.bgCard, border:`1px solid ${C.border}`, borderRadius:12, boxShadow:"0 8px 32px rgba(0,0,0,0.12)", zIndex:200, padding:20 }}>
      <p style={{ fontSize:13, color:C.textMid, textAlign:"center" }}>✅ Todo en orden, sin alertas activas</p>
    </div>
  );
  const colores = { rojo:{ bg:"#FDECEA", border:"#D32F2F", text:"#D32F2F" }, amarillo:{ bg:"#FFF8E1", border:"#F9A825", text:"#E65100" }, verde:{ bg:"#E6F7EE", border:"#1A7A3C", text:"#1A7A3C" } };
  const labelAccion = (accion) => {
    if (!accion) return null;
    if (accion === "pickup") return "→ Ver Pickup";
    if (accion === "importar") return "→ Importar datos";
    if (accion.startsWith("kpi:")) return `→ Ver ${accion.split(":")[1]}`;
    return "→ Ver más";
  };
  return (
    <div style={{ position:"absolute", top:54, right:0, width:360, background:C.bgCard, border:`1px solid ${C.border}`, borderRadius:12, boxShadow:"0 8px 32px rgba(0,0,0,0.12)", zIndex:200, overflow:"hidden" }}>
      <div style={{ padding:"14px 16px", borderBottom:`1px solid ${C.border}`, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <p style={{ fontSize:13, fontWeight:700, color:C.text }}>Alertas <span style={{ background:C.accent, color:"#fff", borderRadius:10, padding:"1px 7px", fontSize:11, marginLeft:6 }}>{alertas.length}</span></p>
        <button onClick={onClose} style={{ background:"none", border:"none", cursor:"pointer", color:C.textLight, fontSize:16 }}>✕</button>
      </div>
      <div style={{ maxHeight:380, overflowY:"auto" }}>
        {alertas.map((a, i) => {
          const c = colores[a.tipo] || colores.amarillo;
          const label = labelAccion(a.accion);
          return (
            <div key={i} onClick={() => { if(a.accion) { onNavegar(a.accion); onClose(); } }}
              style={{ padding:"12px 16px", borderBottom:`1px solid ${C.border}`, borderLeft:`3px solid ${c.border}`, background: i%2===0 ? C.bg : C.bgCard, cursor: a.accion ? "pointer" : "default", transition:"background 0.1s" }}
              onMouseEnter={e => { if(a.accion) e.currentTarget.style.background = C.accentLight; }}
              onMouseLeave={e => { e.currentTarget.style.background = i%2===0 ? C.bg : C.bgCard; }}>
              <p style={{ fontSize:12, fontWeight:700, color:c.text, marginBottom:3 }}>{a.icono} {a.titulo}</p>
              <p style={{ fontSize:11, color:C.textMid, lineHeight:1.5 }}>{a.desc}</p>
              {label && <p style={{ fontSize:10, color:C.accent, fontWeight:600, marginTop:5 }}>{label}</p>}
            </div>
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
  const [progreso, setProgreso] = useState("");
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
          // Nuevos campos: col4=fecha_salida, col5=noches, col6=precio_total, col7=estado
          const fechaSalida = row[4] && esSerial(row[4]) ? serialToDate(row[4]) : null;
          const noches      = row[5] && typeof row[5] === "number" && row[5] < 100 ? Math.round(row[5]) : null;
          const precioTotal = row[6] && typeof row[6] === "number" ? Math.round(row[6] * 100) / 100 : null;
          const estado      = row[7] && typeof row[7] === "string" ? row[7] : "confirmada";
          pickupRows.push({
            hotel_id:      session.user.id,
            fecha_pickup:  fp,
            fecha_llegada: fl,
            canal:         row[2] || null,
            num_reservas:  nr || 1,
            fecha_salida:  fechaSalida,
            noches:        noches,
            precio_total:  precioTotal,
            estado:        estado || "confirmada",
          });
        }
      }

      // ── Presupuesto — col[0]=Mes, col[1]=OCC(decimal), col[4]=ADR, col[7]=RevPAR, col[10]=RevTotal ──
      const wsBu = wb.Sheets["💰 Presupuesto"];
      const presupuestoRows = [];
      if (wsBu) {
        const rowsBu = XLSX.utils.sheet_to_json(wsBu, { header: 1 });
        const MESES_PPTO = ["Enero","Febrero","Marzo","Abril","Mayo","Junio",
                            "Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
        // Buscar todos los bloques: una celda con un número de 4 dígitos (año) seguida de "Enero"
        const aniosEnProd = produccionRows.map(r => parseInt(r.fecha.slice(0,4))).filter(Boolean);
        let bloques = []; // [{anio, startRow}]
        for (let r = 0; r < rowsBu.length; r++) {
          const v = rowsBu[r]?.[0];
          const asNum = parseInt(v);
          if (asNum >= 2020 && asNum <= 2035) {
            // Buscar "Enero" en las siguientes filas
            for (let s = r+1; s <= r+5; s++) {
              if (rowsBu[s]?.[0] === "Enero") { bloques.push({ anio: asNum, startRow: s }); break; }
            }
          }
        }
        // Si no hay bloques con año explícito, usar método antiguo con año más reciente de producción
        if (bloques.length === 0) {
          const anioFallback = aniosEnProd.length > 0 ? Math.max(...aniosEnProd) : new Date().getFullYear();
          for (let r = 0; r < rowsBu.length; r++) {
            if (rowsBu[r]?.[0] === "Enero") { bloques.push({ anio: anioFallback, startRow: r }); break; }
          }
        }
        for (const { anio: anioBloque, startRow } of bloques) {
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
              anio: anioBloque,
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
        const LOTE = 200;
        const total = pickupRows.length;
        for (let i = 0; i < total; i += LOTE) {
          setProgreso(`Guardando pickup... ${Math.min(i+LOTE, total)} de ${total}`);
          const { error: errPu } = await supabase.from("pickup_entries").insert(pickupRows.slice(i, i + LOTE));
          if (errPu) throw new Error("Error al guardar pickup: " + errPu.message);
          await new Promise(r => setTimeout(r, 50));
        }
        setProgreso("");
      }

      if (presupuestoRows.length > 0) {
        const { error: err3 } = await supabase.from("presupuesto").insert(presupuestoRows);
        if (err3) throw new Error("Error al guardar presupuesto: " + err3.message);
      }

      // ── Grupos & Eventos ──
      const wsGr = wb.Sheets["🎪 Grupos y Eventos"];
      if (wsGr) {
        const rowsGr = XLSX.utils.sheet_to_json(wsGr, { header: 1, raw: true });
        const gruposRows = [];
        for (const row of rowsGr) {
          if (!row || !row[0] || typeof row[0] !== "string" || row[0].startsWith("GRUPOS") || row[0].startsWith("Estado")) continue;
          if (row[0] === "nombre") continue; // cabecera
          const serialToDate = (v) => {
            if (!v) return null;
            if (typeof v === "string" && v.match(/^\d{4}-\d{2}-\d{2}$/)) return v;
            if (typeof v === "number" && v > 40000) {
              const d = new Date(Date.UTC(1899, 11, 30) + Math.floor(v) * 86400000);
              return d.toISOString().slice(0,10);
            }
            return null;
          };
          const fi = serialToDate(row[3]);
          const ff = serialToDate(row[4]);
          if (!fi || !ff) continue;
          const estados_validos = ["confirmado","tentativo","cotizacion","cancelado"];
          const cats_validas    = ["corporativo","boda","feria","deportivo","otros"];
          gruposRows.push({
            hotel_id:       session.user.id,
            nombre:         String(row[0]),
            categoria:      cats_validas.includes(row[1]) ? row[1] : "otros",
            estado:         estados_validos.includes(row[2]) ? row[2] : "cotizacion",
            fecha_inicio:   fi,
            fecha_fin:      ff,
            habitaciones:   parseInt(row[5])||0,
            adr_grupo:      parseFloat(row[6])||0,
            revenue_fnb:    parseFloat(row[7])||0,
            revenue_sala:   parseFloat(row[8])||0,
            notas:          row[9] ? String(row[9]) : null,
            motivo_perdida: row[10] ? String(row[10]) : null,
          });
        }
        if (gruposRows.length > 0) {
          await supabase.from("grupos_eventos").delete().eq("hotel_id", session.user.id);
          const { error: errGr } = await supabase.from("grupos_eventos").insert(gruposRows);
          if (errGr) throw new Error("Error al guardar grupos: " + errGr.message);
          setProgreso(`${gruposRows.length} grupos/eventos importados`);
        }
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
            <p style={{ fontSize: 12, color: "#A8998A", marginTop: 4 }}>Sube tu plantilla Excel de FastRev</p>
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
              
              <p style={{ fontWeight: 600, color: "#1C1814", marginBottom: 6 }}>{progreso || (loading ? "Procesando..." : "Haz clic para seleccionar el archivo")}</p>
              <p style={{ fontSize: 12, color: "#A8998A" }}>Formato .xlsx · Plantilla FastRev</p>
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

  checkY(60);
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

  // ── GRÁFICA OCUPACIÓN DIARIA (barras) ──
  addPage();
  doc.setTextColor(...azul); doc.setFontSize(13); doc.setFont("helvetica","bold");
  doc.text(`Evolución Diaria — Ocupación & ADR`, M, y); y+=6;
  doc.setDrawColor(...grisCl); doc.line(M,y,W-M,y); y+=6;

  if(diasMes.length > 0) {
    const chartW = W-M*2;
    const chartH = 45;
    const barW = Math.min(6, chartW/diasMes.length - 1);
    const gap = chartW/diasMes.length;
    const maxOcc = 100;
    const maxAdr = Math.max(...diasMes.map(d=>d.adr)) * 1.15;

    // Fondo gráfica
    doc.setFillColor(248,250,253);
    doc.rect(M, y, chartW, chartH, "F");
    doc.setDrawColor(...grisCl);
    doc.rect(M, y, chartW, chartH, "S");

    // Líneas guía horizontales
    [25,50,75,100].forEach(pct => {
      const ly = y + chartH - (pct/maxOcc)*chartH;
      doc.setDrawColor(220,220,220); doc.setLineWidth(0.1);
      doc.line(M, ly, M+chartW, ly);
      doc.setTextColor(...gris); doc.setFontSize(5);
      doc.text(pct+"%", M-4, ly+1, {align:"right"});
    });

    // Barras ocupación
    diasMes.forEach((d,i) => {
      const bx = M + i*gap + gap/2 - barW/2;
      const bh = (parseFloat(d.occ)/maxOcc) * chartH;
      const by = y + chartH - bh;
      const color = parseFloat(d.occ)>=80 ? verde : parseFloat(d.occ)<50 ? rojo : azul;
      doc.setFillColor(...color);
      doc.rect(bx, by, barW, bh, "F");
    });

    // Línea ADR
    doc.setDrawColor(232,93,4); doc.setLineWidth(0.6);
    diasMes.forEach((d,i) => {
      if(i===0) return;
      const x1 = M + (i-1)*gap + gap/2;
      const x2 = M + i*gap + gap/2;
      const y1 = y + chartH - (diasMes[i-1].adr/maxAdr)*chartH;
      const y2 = y + chartH - (d.adr/maxAdr)*chartH;
      doc.line(x1, y1, x2, y2);
    });

    // Eje X días
    doc.setTextColor(...gris); doc.setFontSize(5);
    diasMes.forEach((d,i) => {
      if(i%5===0 || i===diasMes.length-1) {
        doc.text(String(d.dia), M+i*gap+gap/2, y+chartH+4, {align:"center"});
      }
    });

    // Leyenda
    doc.setFillColor(...azul); doc.rect(M, y+chartH+7, 8, 3, "F");
    doc.setTextColor(...negro); doc.setFontSize(7);
    doc.text("Ocupación %", M+10, y+chartH+10);
    doc.setDrawColor(232,93,4); doc.setLineWidth(0.8);
    doc.line(M+45, y+chartH+8.5, M+53, y+chartH+8.5);
    doc.text("ADR €", M+55, y+chartH+10);

    y += chartH + 18;
  }

  // ── GRÁFICA OCUPACIÓN POR DÍA DE SEMANA ──
  checkY(65);
  doc.setTextColor(...azul); doc.setFontSize(13); doc.setFont("helvetica","bold");
  doc.text("Ocupación Media por Día de Semana", M, y); y+=6;
  doc.setDrawColor(...grisCl); doc.line(M,y,W-M,y); y+=6;

  if(diasMes.length > 0) {
    const diasSem = ["Lun","Mar","Mié","Jue","Vie","Sáb","Dom"];
    const ocpSem = diasSem.map(ds => {
      const dias = diasMes.filter(d=>d.sem===ds);
      return dias.length>0 ? dias.reduce((a,d)=>a+parseFloat(d.occ),0)/dias.length : 0;
    });
    const chartW = W-M*2;
    const chartH = 35;
    const barW = 18;
    const gap = chartW/7;

    doc.setFillColor(248,250,253);
    doc.rect(M, y, chartW, chartH, "F");
    doc.setDrawColor(...grisCl); doc.rect(M, y, chartW, chartH, "S");

    ocpSem.forEach((occ,i) => {
      const bx = M + i*gap + gap/2 - barW/2;
      const bh = (occ/100)*chartH;
      const by = y + chartH - bh;
      const color = occ>=80 ? verde : occ<50 ? rojo : azul;
      doc.setFillColor(...color);
      doc.rect(bx, by, barW, bh, "F");
      doc.setTextColor(...negro); doc.setFontSize(7); doc.setFont("helvetica","bold");
      if(occ>0) doc.text(occ.toFixed(0)+"%", bx+barW/2, by-1.5, {align:"center"});
      doc.setFont("helvetica","normal"); doc.setTextColor(...gris); doc.setFontSize(8);
      doc.text(diasSem[i], bx+barW/2, y+chartH+5, {align:"center"});
    });
    y += chartH + 14;
  }

  // ── DISTRIBUCIÓN REVENUE ──
  checkY(45);
  doc.setTextColor(...azul); doc.setFontSize(13); doc.setFont("helvetica","bold");
  doc.text("Distribución del Revenue", M, y); y+=6;
  doc.setDrawColor(...grisCl); doc.line(M,y,W-M,y); y+=4;

  const revComponents = [
    { label:"Revenue Habitaciones", value:mesAct.revH, color:azul },
    { label:"Revenue F&B", value:mesAct.revFnb, color:[0,159,77] },
    { label:"Revenue Otros", value:mesAct.revOt, color:[232,93,4] },
  ].filter(r=>r.value>0);

  if(revComponents.length>0) {
    const total = revComponents.reduce((a,r)=>a+r.value,0);
    const barTotalW = W-M*2;
    let bx = M;
    revComponents.forEach(r => {
      const bw = (r.value/total)*barTotalW;
      doc.setFillColor(...r.color);
      doc.rect(bx, y, bw, 10, "F");
      bx += bw;
    });
    y += 13;
    revComponents.forEach((r,i) => {
      const pct = (r.value/total*100).toFixed(1);
      doc.setFillColor(...r.color); doc.rect(M+i*65, y, 8, 4, "F");
      doc.setTextColor(...negro); doc.setFontSize(8);
      doc.text(`${r.label}: €${Math.round(r.value).toLocaleString("es-ES")} (${pct}%)`, M+i*65+10, y+3.5);
    });
    y += 12;
  }

  const pages = doc.internal.getNumberOfPages();
  for(let i=1;i<=pages;i++){
    doc.setPage(i);
    doc.setFontSize(8); doc.setTextColor(...gris);
    doc.text(`${hotelNombre||"FastRev"} · Informe ${MESES_FULL[mes]} ${anio} · Página ${i} de ${pages}`, W/2, 292, {align:"center"});
  }

  doc.save(`Informe_${MESES_FULL[mes]}_${anio}.pdf`);
}

// ─── DASHBOARD VIEW ───────────────────────────────────────────────
function DashboardView({ datos, mes, anio, onPeriodo, onMesDetalle, kpiModal, setKpiModal, kpiModalExterno, onKpiModalExternoHandled }) {
  const { produccion } = datos;
  const pickupEntries = datos.pickupEntries || [];
  const presupuesto   = datos.presupuesto   || [];
  const [hmMesSel, setHmMesSel] = useState(null);
  const [modalDiario, setModalDiario] = useState(null); // {mesIdx, anioIdx}

  // ── Pickup del último día importado por mes de llegada ──
  const todasFechasPickup = pickupEntries
    .map(e => String(e.fecha_pickup || '').slice(0,10))
    .filter(f => f.length === 10)
    .sort();
  const ultimoDiaImportado = todasFechasPickup[todasFechasPickup.length - 1] || '';
  const pickupUltimoDiaPorMes = {};
  const pickupUltimoDiaPorDia = {}; // { "2026-04-15": X, ... }
  pickupEntries.forEach(e => {
    const fp = String(e.fecha_pickup || '').slice(0,10);
    if (fp !== ultimoDiaImportado) return;
    const fl = String(e.fecha_llegada || '').slice(0,10);
    const flMes = fl.slice(0,7);
    if (!flMes) return;
    const cancelada = (e.estado || 'confirmada') === 'cancelada';
    const nr = (e.num_reservas || 1) * (cancelada ? -1 : 1);
    pickupUltimoDiaPorMes[flMes] = (pickupUltimoDiaPorMes[flMes] || 0) + nr;
    pickupUltimoDiaPorDia[fl]    = (pickupUltimoDiaPorDia[fl]    || 0) + nr;
  });
  // Los 2 meses con más reservas ese día
  const top2Meses = Object.entries(pickupUltimoDiaPorMes)
    .sort((a,b) => b[1]-a[1])
    .slice(0,2)
    .map(([mes]) => mes);
  const [metricaSel, setMetricaSel] = useState("adr_occ");
  useEffect(() => {
    if (kpiModalExterno) { setKpiModal(kpiModalExterno); onKpiModalExternoHandled && onKpiModalExternoHandled(); }
  }, [kpiModalExterno]);

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
      mes: MESES_CORTO[mIdx],
      mesNombre: MESES_FULL[mIdx],
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
    { label: "Revenue Diario", value: `€${datosMes.length > 0 ? Math.round(totalRevTotal / datosMes.length).toLocaleString("es-ES") : 0}`,
      ...(() => {
        const diasPrev = prevRevTot > 0 ? (datos.produccion||[]).filter(d => { const f=new Date(d.fecha+"T00:00:00"); return f.getMonth()===(mes===0?11:mes-1) && f.getFullYear()===(mes===0?anio-1:anio); }).length : 0;
        const revDiarioPrev = diasPrev > 0 ? prevRevTot / diasPrev : null;
        const revDiarioAct  = datosMes.length > 0 ? totalRevTotal / datosMes.length : 0;
        return diff(revDiarioAct, revDiarioPrev, true);
      })()
    },
  ];

  return (
    <div>
      {/* ── CABECERA MES ACTIVO ── */}
      <div className="dash-header" style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:16, paddingBottom:14, borderBottom:`1px solid ${C.border}` }}>
        <div>
          <p style={{ fontSize:22, fontWeight:800, color:C.text, fontFamily:"'DM Sans',sans-serif", letterSpacing:-0.5, marginBottom:2 }}>
            Bienvenido, <span style={{ color:C.accent }}>{datos.hotel?.nombre || "Mi Hotel"}</span>
          </p>
          <div style={{ display:"flex", alignItems:"baseline", gap:10 }}>
            <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:28, fontWeight:700, color:C.text, margin:0, letterSpacing:-0.5 }}>
              {["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"][mes]}
            </h2>
            <span style={{ fontSize:20, fontWeight:400, color:C.textLight }}>{anio}</span>
          </div>
        </div>
        <PeriodSelectorInline mes={mes} anio={anio} onChange={onPeriodo} aniosDisponibles={[...new Set((datos.produccion||[]).map(d=>new Date(d.fecha+"T00:00:00").getFullYear()))].sort()} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(clamp(140px,40vw,200px), 1fr))", gap: 10, marginBottom: 20 }}>
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
          // Año anterior
          const dLY = produccion.filter(r => {
            const f = new Date(r.fecha+"T00:00:00");
            return f.getMonth()===mi && f.getFullYear()===anio-1;
          });
          const habOcuLY = dLY.reduce((a,r)=>a+(r.hab_ocupadas||0),0);
          const habDisLY = dLY.reduce((a,r)=>a+(r.hab_disponibles||0),0);
          const occLY = habDisLY>0 ? habOcuLY/habDisLY*100 : null;
          if (habDis>0) return { label, mi, occ: habOcu/habDis*100, occLY, esOtb: false };
          // Mes futuro: sumar reservas OTB del pickup
          const mesStr = `${anio}-${_pad(mi+1)}`;
          const primerDia = `${mesStr}-01`;
          if (primerDia <= _hoyStr) return { label, mi, occ: null, occLY, esOtb: false };
          const diasMes = new Date(anio, mi+1, 0).getDate();
          // Calcular habH desde produccion si no viene del hotel
          const habFromProd = produccion.length > 0
            ? Math.round(produccion.reduce((a,r)=>a+(r.hab_disponibles||0),0)/produccion.length)
            : 30;
          const habH = (datos.hotel?.habitaciones && datos.hotel.habitaciones > 0)
            ? datos.hotel.habitaciones
            : habFromProd;
          let totalRes = 0;
          for (let di=1; di<=diasMes; di++) {
            const iso = `${mesStr}-${_pad(di)}`;
            totalRes += otbDia[iso] || 0;
          }
          const occ = habH > 0 ? (totalRes / (habH * diasMes) * 100) : null;
          return { label, mi, occ: totalRes>0 ? occ : null, occLY, esOtb: true };
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


        // Neto acumulado por día para meses futuros (confirmadas - canceladas)
        const netoPorDia = {};
        if (hmMesSel != null) {
          const padM = n => String(n).padStart(2,"0");
          const mesStr = `${anio}-${padM(hmMesSel+1)}`;
          pickupEntries.forEach(e => {
            const fl = String(e.fecha_llegada||"").slice(0,10);
            if (!fl.startsWith(mesStr)) return;
            const cancelada = (e.estado||"confirmada") === "cancelada";
            const nr = (e.num_reservas||1) * (cancelada ? -1 : 1);
            netoPorDia[fl] = (netoPorDia[fl]||0) + nr;
          });
        }

        const diasDelMes = hmMesSel!=null ? (() => {
          const diasEnMes = new Date(anio, hmMesSel+1, 0).getDate();
          const pad = n => String(n).padStart(2,"0");
          return Array.from({length:diasEnMes},(_,di)=>{
            const dt   = new Date(anio, hmMesSel, di+1);
            const iso  = `${anio}-${pad(hmMesSel+1)}-${pad(di+1)}`;
            const prod = produccion.find(r=>r.fecha===iso);
            const esFut = iso > hoyStr2;
            const neto  = netoPorDia[iso] || 0;
            let occ=null, adr=null;
            if (prod) {
              occ = prod.hab_disponibles>0 ? Math.min(100,prod.hab_ocupadas/prod.hab_disponibles*100) : null;
              adr = prod.hab_ocupadas>0    ? (prod.revenue_hab/prod.hab_ocupadas) : null;
            } else if (esFut) {
              occ = neto>0 ? Math.min(100, neto/habHotel*100) : null;
            }
            const resUltDia = pickupUltimoDiaPorDia[iso] || 0;
            return { iso, dia:di+1, diaSem:dt.getDay(), occ, adr, esFut, tieneReal:!!prod, resUltDia, neto };
          });
        })() : [];

        return (
          <div className="dash-charts-grid" style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16, marginBottom:16 }}>

            {/* ── HEATMAP ── */}
            <Card style={{ display:"flex", flexDirection:"column" }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
                <div>
                  <p style={{ fontFamily:"'Playfair Display',serif", fontWeight:700, fontSize:20, color:C.text, marginBottom:2 }}>Ocupación mensual</p>
                  
                </div>

              </div>

              {/* Vista anual: grid 4x3 */}
                <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gridTemplateRows:"repeat(3,1fr)", gap:8, flex:1 }}>
                  {occPorMes.map(({label, mi, occ, esOtb})=>{
                    const mesKey = `${anio}-${String(mi+1).padStart(2,"0")}`;
                    const resUltDia = pickupUltimoDiaPorMes[mesKey] || 0;
                    const esCaliente = top2Meses.includes(mesKey) && resUltDia > 0;
                    const signo = resUltDia > 0 ? "+" : resUltDia < 0 ? "" : null;
                    return (
                    <div key={mi} onClick={()=>setHmMesSel(mi)}
                      title={occ!=null?`${label}: ${occ.toFixed(0)}%`:""}
                      style={{ borderRadius:8, padding:"10px 6px", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", background: occ!=null ? heatColor(occ)+"22" : C.bg, border:`1.5px solid ${esCaliente?"#E85D04":occ!=null?heatColor(occ):C.border}`, cursor:"pointer", textAlign:"center", transition:"all 0.15s", position:"relative" }}
                      onMouseEnter={e=>e.currentTarget.style.opacity="0.8"} onMouseLeave={e=>e.currentTarget.style.opacity="1"}>
                      {esCaliente && (
                        <span title={`${resUltDia} reservas captadas el ${ultimoDiaImportado}`} style={{ position:"absolute", top:3, right:4, fontSize:10, lineHeight:1, animation:"pulse-rayo 1.5s ease-in-out infinite" }}>⚡</span>
                      )}
                      <p style={{ fontSize:9, fontWeight:600, color:C.textLight, textTransform:"uppercase", letterSpacing:0.5, marginBottom:3 }}>{label}</p>
                      {occ!=null
                        ? <p style={{ fontSize:16, fontWeight:800, color:heatColor(occ), fontFamily:"'DM Sans',sans-serif" }}>{occ.toFixed(0)}%</p>
                        : <p style={{ fontSize:12, color:C.border }}>—</p>
                      }
                      {resUltDia !== 0
                        ? <p style={{ fontSize:8, color:resUltDia>0?"#E85D04":C.red, fontWeight:700, marginTop:2 }}>{resUltDia>0?"+":""}{resUltDia} res.</p>
                        : esOtb && occ!=null
                          ? <p style={{ fontSize:8, color:"#7A9CC8", fontWeight:700, marginTop:2 }}>OTB</p>
                          : null
                      }
                    </div>
                  );})}
                </div>
            </Card>

            {/* ── MODAL HEATMAP DIARIO ── */}
            {hmMesSel!=null && (
              <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.6)", zIndex:1000, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}
                onClick={()=>setHmMesSel(null)}>
                <div style={{ background:C.bgCard, borderRadius:14, width:"100%", maxWidth:560, padding:"20px 24px", boxShadow:"0 20px 60px rgba(0,0,0,0.25)" }}
                  onClick={e=>e.stopPropagation()}>

                  {/* Cabecera compacta */}
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
                    <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                      <button onClick={()=>setHmMesSel(m=>m>0?m-1:11)} style={{ background:C.bg, border:`1px solid ${C.border}`, borderRadius:6, width:26, height:26, cursor:"pointer", fontSize:12, color:C.textMid }}>‹</button>
                      <h3 style={{ fontSize:15, fontWeight:700, color:C.text }}>{MESES_H[hmMesSel]} {anio}</h3>
                      <button onClick={()=>setHmMesSel(m=>m<11?m+1:0)} style={{ background:C.bg, border:`1px solid ${C.border}`, borderRadius:6, width:26, height:26, cursor:"pointer", fontSize:12, color:C.textMid }}>›</button>
                    </div>
                    <button onClick={()=>setHmMesSel(null)} style={{ background:"none", border:`1px solid ${C.border}`, borderRadius:6, width:26, height:26, cursor:"pointer", fontSize:15, color:C.textMid }}>×</button>
                  </div>

                  {/* Días semana */}
                  <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:3, marginBottom:3 }}>
                    {["L","M","X","J","V","S","D"].map(d=>(
                      <p key={d} style={{ fontSize:9, color:C.textLight, textAlign:"center", fontWeight:600 }}>{d}</p>
                    ))}
                  </div>

                  {/* Grid días — todos con aspectRatio 1 */}
                  <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:3 }}>
                    {Array.from({length:(diasDelMes[0]?.diaSem===0?6:diasDelMes[0]?.diaSem-1)||0},(_,i)=>(
                      <div key={"e"+i} style={{ aspectRatio:"1" }}/>
                    ))}
                    {diasDelMes.map(({dia,occ,adr,esFut,resUltDia,neto})=>{
                      const col = occ!=null ? heatColor(occ) : C.border;
                      const resDia = resUltDia || 0;
                      const netoVal = neto || 0;
                      return (
                        <div key={dia} style={{ aspectRatio:"1", borderRadius:5, background: resDia<0?C.redLight:occ!=null?col+"22":esFut&&netoVal>0?col+"22":C.bg, border:`1.5px solid ${resDia<0?C.red:occ!=null?col:C.border}`, opacity:esFut&&netoVal===0?0.2:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:1 }}>
                          <p style={{ fontSize:8, color:C.textLight, lineHeight:1 }}>{dia}</p>
                          {esFut
                            ? netoVal>0
                              ? <p style={{ fontSize:11, fontWeight:800, color:heatColor(netoVal/habHotel*100), lineHeight:1 }}>{netoVal}</p>
                              : <p style={{ fontSize:8, color:C.border }}>—</p>
                            : occ!=null
                              ? <p style={{ fontSize:11, fontWeight:800, color:col, lineHeight:1 }}>{occ.toFixed(0)}%</p>
                              : <p style={{ fontSize:8, color:C.border }}>—</p>
                          }
                          {adr && !esFut && <p style={{ fontSize:7, color:C.textLight, lineHeight:1 }}>€{Math.round(adr)}</p>}
                          {resDia>0 && <p style={{ fontSize:7, color:C.green, fontWeight:700, lineHeight:1 }}>+{resDia}</p>}
                          {resDia<0 && <p style={{ fontSize:7, color:C.red, fontWeight:700, lineHeight:1 }}>{resDia}</p>}
                        </div>
                      );
                    })}
                  </div>



                </div>
              </div>
            )}

            {/* ── GRÁFICA DERECHA UNIFICADA ── */}
            {(() => {
              const metricas = [
                { key:"adr_occ", label:"ADR & Ocupación" },
              ];
              const xTick = (props) => {
                const {x,y,payload} = props;
                if(payload.value!=="Ene") return null;
                return <text x={x} y={y+10} fill={C.textLight} fontSize={9} textAnchor="middle">{porMes.find(d=>d.mes==="Ene")?.anioIdx||""}</text>;
              };
              return (
                <Card style={{ display:"flex", flexDirection:"column", minHeight:360 }}>
                  <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:16 }}>
                    <p style={{ fontFamily:"'Playfair Display',serif", fontWeight:700, fontSize:18, color:C.text }}>
                      {metricas.find(m=>m.key===metricaSel)?.label}
                    </p>
                    <div style={{ display:"flex", gap:4 }}>
                      {metricas.map(m => (
                        <button key={m.key} onClick={()=>setMetricaSel(m.key)}
                          style={{ padding:"4px 10px", borderRadius:6, border:`1px solid ${metricaSel===m.key?C.accent:C.border}`, background:metricaSel===m.key?C.accentLight:"transparent", color:metricaSel===m.key?C.accent:C.textLight, fontSize:10, fontWeight:metricaSel===m.key?600:400, cursor:"pointer", fontFamily:"'DM Sans',sans-serif", transition:"all 0.15s" }}>
                          {m.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <div style={{ height:300 }}>
                    <ResponsiveContainer width="100%" height={300}>
                      {metricaSel === "adr_occ" ? (
                        <ComposedChart data={porMes} barSize={10}>
                          <CartesianGrid strokeDasharray="3 3" stroke={C.border} vertical={false}/>
                          <XAxis dataKey="mes" axisLine={false} tickLine={false} height={18} interval={0} tick={{fill:C.textLight, fontSize:8}}/>
                          <YAxis yAxisId="left"  tick={{fill:C.textLight,fontSize:9}} axisLine={false} tickLine={false} unit="%" domain={[0,100]}/>
                          <YAxis yAxisId="right" orientation="right" tick={{fill:C.textLight,fontSize:9}} axisLine={false} tickLine={false} unit="€"/>
                          <Tooltip content={<CustomTooltip/>}/>
                          <Bar yAxisId="left" dataKey="occ" name="Ocupación" fill={C.accent} radius={[2,2,0,0]} fillOpacity={0.8}
                            cursor="pointer"
                            onClick={(data) => { if(data?.mesIdx!=null) setModalDiario({mesIdx:data.mesIdx, anioIdx:data.anioIdx}); }}
                          />
                          <Line yAxisId="right" dataKey="adr" name="ADR Real" type="monotone" stroke="#E85D04" strokeWidth={2} dot={{fill:"#E85D04", r:3, strokeWidth:0}} activeDot={{r:4}}/>
                          <Line yAxisId="right" dataKey="adr_ppto" name="ADR Ppto." type="monotone" stroke="#B8860B" strokeWidth={1.5} strokeDasharray="6 3" dot={false} connectNulls/>
                        </ComposedChart>
                      ) : (
                        <AreaChart data={porMes}>
                          <defs>
                            <linearGradient id="gMetrica" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%"  stopColor={C.accent} stopOpacity={0.15}/>
                              <stop offset="95%" stopColor={C.accent} stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke={C.border} vertical={false}/>
                          <XAxis dataKey="mes" axisLine={false} tickLine={false} height={18} interval={0} tick={{fill:C.textLight, fontSize:8}}/>
                          <YAxis tick={{fill:C.textLight,fontSize:9}} axisLine={false} tickLine={false} unit="€"/>
                          <Tooltip content={<CustomTooltip/>}/>
                          <Area type="monotone" dataKey={metricaSel} name={metricaSel==="revpar"?"RevPAR":"TRevPAR"} stroke={C.accent} strokeWidth={2} fill="url(#gMetrica)" dot={{fill:C.accent,r:2}} activeDot={{r:3}}/>
                        </AreaChart>
                      )}
                    </ResponsiveContainer>
                  </div>
                </Card>
              );
            })()}

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

      {/* ── MODAL DIARIO ADR & OCUPACIÓN ── */}
      {modalDiario && (() => {
        const { mesIdx, anioIdx } = modalDiario;
        const MESES_FULL2 = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
        const pad = n => String(n).padStart(2,"0");
        const diasData = (datos.produccion||[])
          .filter(r => {
            const f = new Date(r.fecha+"T00:00:00");
            return f.getMonth()===mesIdx && f.getFullYear()===anioIdx;
          })
          .sort((a,b)=>new Date(a.fecha)-new Date(b.fecha))
          .map(r => {
            const f = new Date(r.fecha+"T00:00:00");
            const habDis = r.hab_disponibles||30;
            return {
              dia: f.getDate(),
              label: `${f.getDate()}/${f.getMonth()+1}`,
              occ: habDis>0 ? Math.min(100, Math.round(r.hab_ocupadas/habDis*100)) : 0,
              adr: r.hab_ocupadas>0 ? Math.round(r.revenue_hab/r.hab_ocupadas) : 0,
            };
          });

        const pptoMes = (datos.presupuesto||[]).find(p=>p.anio===anioIdx && p.mes===mesIdx+1);

        return (
          <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.5)", zIndex:1000, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}
            onClick={()=>setModalDiario(null)}>
            <div style={{ background:C.bgCard, borderRadius:14, width:"100%", maxWidth:780, maxHeight:"90vh", overflow:"auto", padding:28, boxShadow:"0 20px 60px rgba(0,0,0,0.2)" }}
              onClick={e=>e.stopPropagation()}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
                <div>
                  <p style={{ fontSize:11, color:C.textLight, textTransform:"uppercase", letterSpacing:2 }}>{MESES_FULL2[mesIdx]} {anioIdx}</p>
                  <h3 style={{ fontSize:22, fontWeight:800, color:C.text, fontFamily:"'DM Sans',sans-serif", letterSpacing:-0.5 }}>ADR & Ocupación diaria</h3>
                </div>
                <button onClick={()=>setModalDiario(null)} style={{ background:"none", border:`1.5px solid ${C.border}`, borderRadius:8, width:34, height:34, cursor:"pointer", fontSize:16, color:C.textMid }}
                  onMouseEnter={e=>{e.currentTarget.style.background=C.accent;e.currentTarget.style.color="#fff";}}
                  onMouseLeave={e=>{e.currentTarget.style.background="none";e.currentTarget.style.color=C.textMid;}}>×</button>
              </div>

              {diasData.length === 0 ? (
                <p style={{ color:C.textLight, textAlign:"center", padding:40 }}>Sin datos para este mes</p>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <ComposedChart data={diasData} barSize={10}>
                    <CartesianGrid strokeDasharray="3 3" stroke={C.border} vertical={false}/>
                    <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{fill:C.textLight, fontSize:9}} interval={Math.floor(diasData.length/8)}/>
                    <YAxis yAxisId="left"  tick={{fill:C.textLight,fontSize:9}} axisLine={false} tickLine={false} unit="%" domain={[0,100]}/>
                    <YAxis yAxisId="right" orientation="right" tick={{fill:C.textLight,fontSize:9}} axisLine={false} tickLine={false} unit="€"/>
                    <Tooltip content={<CustomTooltip/>}/>
                    <Legend wrapperStyle={{fontSize:11, paddingTop:8}}/>
                    <Bar yAxisId="left" dataKey="occ" name="Ocupación" fill={C.accent} radius={[2,2,0,0]} fillOpacity={0.85}/>
                    <Line yAxisId="right" dataKey="adr" name="ADR" type="monotone" stroke="#E85D04" strokeWidth={2} dot={{fill:"#E85D04",r:2,strokeWidth:0}} activeDot={{r:4}}/>

                  </ComposedChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        );
      })()}
    </div>
  );
}

// ─── PICKUP VIEW ──────────────────────────────────────────────────
function PickupView({ datos }) {
  const { session, presupuesto, produccion } = datos;
  const pickupEntries = datos.pickupEntries || [];
  const cargando = false;
  const [anio, setAnio]                   = useState(new Date().getFullYear());

  const hoy     = new Date();
  const MESES   = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];

  // Año inicial: el más reciente con datos
  useEffect(() => {
    if (pickupEntries.length > 0) {
      const anios = [...new Set(pickupEntries.map(e => String(e.fecha_llegada||"").slice(0,4)).filter(Boolean).map(Number))].sort();
      if (anios.length > 0) setAnio(anios[anios.length - 1]);
    }
  }, [pickupEntries.length]);

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
  const COL_OTB  = "#7A5200";  // dorado muy oscuro
  const COL_PPTO = "#C9973A";  // dorado medio
  const COL_LY   = "#F0D090";  // dorado muy claro

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

  // ── Pickup de ayer ──
  const hoyD = new Date();
  const ayerD = new Date(hoyD); ayerD.setDate(hoyD.getDate()-1);
  const ayerStr = `${ayerD.getFullYear()}-${String(ayerD.getMonth()+1).padStart(2,"0")}-${String(ayerD.getDate()).padStart(2,"0")}`;
  const MESES_FULL_PU = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];

  const reservasAyer = pickupEntries.filter(e => String(e.fecha_pickup||"").slice(0,10) === ayerStr);

  const ayerPorMes = {};
  const ayerPorCanal = {};
  let ayerTotal = 0;
  reservasAyer.forEach(e => {
    const fl = String(e.fecha_llegada||"").slice(0,7); // YYYY-MM
    const mes = parseInt(fl.slice(5,7)) - 1;
    const nr = e.num_reservas || 1;
    ayerPorMes[mes] = (ayerPorMes[mes]||0) + nr;
    const canal = e.canal || "Directo";
    ayerPorCanal[canal] = (ayerPorCanal[canal]||0) + nr;
    ayerTotal += nr;
  });

  const CANAL_COLORS = {
    "Booking.com": "#0052CC", "Expedia": "#FF6B00", "Directo Web": "#111111",
    "Directo": "#111111", "Teléfono": "#059669", "Agencia": "#7C3AED"
  };

  // ── Cancelaciones de ayer ──
  const cancelacionesAyer = reservasAyer.filter(e => (e.estado||"confirmada") === "cancelada");
  const cancelTotal = cancelacionesAyer.length;
  const cancelPorMes = {};
  cancelacionesAyer.forEach(e => {
    const fl = String(e.fecha_llegada||"").slice(0,7);
    const mes = parseInt(fl.slice(5,7)) - 1;
    cancelPorMes[mes] = (cancelPorMes[mes]||0) + 1;
  });

  // ── Duración media de estancia ──
  const conNoches = pickupEntries.filter(e => e.noches && e.noches > 0 && (e.estado||"confirmada") !== "cancelada");
  const nochesMed = conNoches.length > 0
    ? (conNoches.reduce((a,e)=>a+(e.noches||0),0) / conNoches.length).toFixed(1)
    : null;
  // Por canal
  const nochesPorCanal = {};
  conNoches.forEach(e => {
    const c = e.canal || "Directo";
    if (!nochesPorCanal[c]) nochesPorCanal[c] = { total:0, count:0 };
    nochesPorCanal[c].total  += e.noches||0;
    nochesPorCanal[c].count  += 1;
  });
  const nochesCanalData = Object.entries(nochesPorCanal)
    .map(([canal, d]) => ({ canal, media: (d.total/d.count).toFixed(1) }))
    .sort((a,b) => b.media - a.media);

  // ── Precio medio por reserva ──
  const conPrecio = pickupEntries.filter(e => e.precio_total && e.precio_total > 0 && (e.estado||"confirmada") !== "cancelada");
  const precioMed = conPrecio.length > 0
    ? Math.round(conPrecio.reduce((a,e)=>a+(e.precio_total||0),0) / conPrecio.length)
    : null;
  // Por canal
  const precioPorCanal = {};
  conPrecio.forEach(e => {
    const c = e.canal || "Directo";
    if (!precioPorCanal[c]) precioPorCanal[c] = { total:0, count:0 };
    precioPorCanal[c].total += e.precio_total||0;
    precioPorCanal[c].count += 1;
  });
  const precioCanalData = Object.entries(precioPorCanal)
    .map(([canal, d]) => ({ canal, media: Math.round(d.total/d.count), color: CANAL_COLORS[canal]||C.accent }))
    .sort((a,b) => b.media - a.media);

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:20 }}>

      {/* ── PICKUP AYER ── */}
      <Card>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:16 }}>
          <div>
            <p style={{ fontFamily:"'Playfair Display',serif", fontWeight:700, fontSize:18, color:C.text }}>Reservas de ayer</p>
            <p style={{ fontSize:12, color:C.textLight, marginTop:2 }}>
              {ayerD.toLocaleDateString("es-ES",{weekday:"long",day:"numeric",month:"long"}).replace(/^\w/,c=>c.toUpperCase())}
            </p>
          </div>
          <div style={{ background:"#B8860B22", border:"1px solid #B8860B44", borderRadius:10, padding:"10px 20px", textAlign:"center" }}>
            <p style={{ fontSize:28, fontWeight:800, color:"#B8860B", fontFamily:"'DM Sans',sans-serif", lineHeight:1 }}>{ayerTotal}</p>
            <p style={{ fontSize:10, color:"#B8860B", fontWeight:600, textTransform:"uppercase", letterSpacing:0.8, marginTop:3 }}>reservas captadas</p>
          </div>
        </div>

        {ayerTotal === 0 ? (
          <p style={{ color:C.textLight, fontSize:13, textAlign:"center", padding:"20px 0" }}>No hay reservas registradas para ayer</p>
        ) : (
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:20 }}>

            {/* Por mes de llegada */}
            <div>
              <p style={{ fontSize:11, fontWeight:700, color:C.textLight, textTransform:"uppercase", letterSpacing:1, marginBottom:10 }}>Por mes de llegada</p>
              <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                {Object.entries(ayerPorMes).sort((a,b)=>a[0]-b[0]).map(([mi, nr]) => {
                  const pct = ayerTotal > 0 ? nr/ayerTotal : 0;
                  return (
                    <div key={mi}>
                      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:3 }}>
                        <span style={{ fontSize:12, color:C.textMid, fontWeight:500 }}>{MESES_FULL_PU[parseInt(mi)]}</span>
                        <span style={{ fontSize:12, fontWeight:700, color:"#B8860B" }}>{nr} res.</span>
                      </div>
                      <div style={{ height:6, borderRadius:3, background:C.border }}>
                        <div style={{ height:6, borderRadius:3, background:"#B8860B", width:`${pct*100}%`, transition:"width 0.4s" }}/>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Por canal — Pie chart */}
            <div>
              <p style={{ fontSize:11, fontWeight:700, color:C.textLight, textTransform:"uppercase", letterSpacing:1, marginBottom:10 }}>Por canal</p>
              {Object.keys(ayerPorCanal).length > 0 ? (() => {
                const pieData = Object.entries(ayerPorCanal).sort((a,b)=>b[1]-a[1]).map(([canal, nr]) => ({
                  name: canal, value: nr, color: CANAL_COLORS[canal] || C.accent
                }));
                return (
                  <div style={{ display:"flex", alignItems:"center", gap:16 }}>
                    <PieChart width={110} height={110}>
                      <Pie data={pieData} cx={50} cy={50} innerRadius={28} outerRadius={50}
                        dataKey="value" startAngle={90} endAngle={-270} paddingAngle={2}>
                        {pieData.map((entry, i) => <Cell key={i} fill={entry.color} stroke="none"/>)}
                      </Pie>
                    </PieChart>
                    <div style={{ display:"flex", flexDirection:"column", gap:6, flex:1 }}>
                      {pieData.map((entry, i) => (
                        <div key={i} style={{ display:"flex", alignItems:"center", gap:7 }}>
                          <div style={{ width:8, height:8, borderRadius:"50%", background:entry.color, flexShrink:0 }}/>
                          <span style={{ fontSize:11, color:C.textMid, flex:1 }}>{entry.name}</span>
                          <span style={{ fontSize:11, color:C.textLight }}>{Math.round(entry.value/ayerTotal*100)}%</span>
                          <span style={{ fontSize:11, fontWeight:700, color:entry.color }}>{entry.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })() : <p style={{ fontSize:12, color:C.textLight }}>Sin datos</p>}
            </div>

          </div>
        )}
      </Card>

      {/* ── 3 WIDGETS NUEVOS ── */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(280px,1fr))", gap:16 }}>

        {/* CANCELACIONES DE AYER */}
        <Card>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:14 }}>
            <div>
              <p style={{ fontFamily:"'Playfair Display',serif", fontWeight:700, fontSize:16, color:C.text }}>Cancelaciones de ayer</p>
              <p style={{ fontSize:11, color:C.textLight, marginTop:2 }}>
                {ayerD.toLocaleDateString("es-ES",{weekday:"long",day:"numeric",month:"long"}).replace(/^\w/,c=>c.toUpperCase())}
              </p>
            </div>
            <div style={{ background: cancelTotal>0?"#FDECEA":"#E6F7EE", border:`1px solid ${cancelTotal>0?"#D32F2F44":"#1A7A3C44"}`, borderRadius:10, padding:"10px 20px", textAlign:"center" }}>
              <p style={{ fontSize:28, fontWeight:800, color:cancelTotal>0?C.red:C.green, fontFamily:"'DM Sans',sans-serif", lineHeight:1 }}>{cancelTotal}</p>
              <p style={{ fontSize:10, fontWeight:600, textTransform:"uppercase", letterSpacing:0.8, marginTop:3, color:cancelTotal>0?C.red:C.green }}>cancelaciones</p>
            </div>
          </div>
          {cancelTotal === 0 ? (
            <p style={{ color:C.green, fontSize:13, textAlign:"center", padding:"12px 0" }}>✅ Sin cancelaciones ayer</p>
          ) : (
            <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
              <p style={{ fontSize:11, fontWeight:700, color:C.textLight, textTransform:"uppercase", letterSpacing:1, marginBottom:4 }}>Por mes afectado</p>
              {Object.entries(cancelPorMes).sort((a,b)=>a[0]-b[0]).map(([mi, n]) => (
                <div key={mi} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"6px 10px", background:C.redLight, borderRadius:6 }}>
                  <span style={{ fontSize:12, color:C.text, fontWeight:500 }}>{MESES_FULL_PU[parseInt(mi)]}</span>
                  <span style={{ fontSize:13, fontWeight:700, color:C.red }}>{n} cancel.</span>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* DURACIÓN MEDIA DE ESTANCIA */}
        <Card>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:14 }}>
            <div>
              <p style={{ fontFamily:"'Playfair Display',serif", fontWeight:700, fontSize:16, color:C.text }}>Duración media</p>
              <p style={{ fontSize:11, color:C.textLight, marginTop:2 }}>Noches por reserva confirmada</p>
            </div>
            <div style={{ background:`${C.accent}15`, border:`1px solid ${C.accent}33`, borderRadius:10, padding:"10px 20px", textAlign:"center" }}>
              <p style={{ fontSize:28, fontWeight:800, color:C.accent, fontFamily:"'DM Sans',sans-serif", lineHeight:1 }}>{nochesMed ?? "—"}</p>
              <p style={{ fontSize:10, fontWeight:600, textTransform:"uppercase", letterSpacing:0.8, marginTop:3, color:C.accent }}>noches media</p>
            </div>
          </div>
          {nochesCanalData.length > 0 && (
            <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
              <p style={{ fontSize:11, fontWeight:700, color:C.textLight, textTransform:"uppercase", letterSpacing:1, marginBottom:4 }}>Por canal</p>
              {nochesCanalData.slice(0,5).map((d,i) => {
                const maxNoches = parseFloat(nochesCanalData[0].media);
                const pct = maxNoches > 0 ? parseFloat(d.media)/maxNoches : 0;
                const color = CANAL_COLORS[d.canal] || C.accent;
                return (
                  <div key={i}>
                    <div style={{ display:"flex", justifyContent:"space-between", marginBottom:3 }}>
                      <span style={{ fontSize:12, color:C.textMid }}>{d.canal}</span>
                      <span style={{ fontSize:12, fontWeight:700, color }}>{d.media} noches</span>
                    </div>
                    <div style={{ height:5, borderRadius:3, background:C.border }}>
                      <div style={{ height:5, borderRadius:3, background:color, width:`${pct*100}%`, transition:"width 0.4s" }}/>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        {/* PRECIO MEDIO POR RESERVA */}
        <Card>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:14 }}>
            <div>
              <p style={{ fontFamily:"'Playfair Display',serif", fontWeight:700, fontSize:16, color:C.text }}>Precio medio reserva</p>
              <p style={{ fontSize:11, color:C.textLight, marginTop:2 }}>Revenue medio por reserva confirmada</p>
            </div>
            <div style={{ background:"#1A7A3C15", border:"1px solid #1A7A3C33", borderRadius:10, padding:"10px 20px", textAlign:"center" }}>
              <p style={{ fontSize:28, fontWeight:800, color:C.green, fontFamily:"'DM Sans',sans-serif", lineHeight:1 }}>
                {precioMed ? `€${precioMed.toLocaleString("es-ES")}` : "—"}
              </p>
              <p style={{ fontSize:10, fontWeight:600, textTransform:"uppercase", letterSpacing:0.8, marginTop:3, color:C.green }}>precio medio</p>
            </div>
          </div>
          {precioCanalData.length > 0 && (
            <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
              <p style={{ fontSize:11, fontWeight:700, color:C.textLight, textTransform:"uppercase", letterSpacing:1, marginBottom:4 }}>Por canal</p>
              {precioCanalData.slice(0,5).map((d,i) => {
                const maxPrecio = precioCanalData[0].media;
                const pct = maxPrecio > 0 ? d.media/maxPrecio : 0;
                return (
                  <div key={i}>
                    <div style={{ display:"flex", justifyContent:"space-between", marginBottom:3 }}>
                      <span style={{ fontSize:12, color:C.textMid }}>{d.canal}</span>
                      <span style={{ fontSize:12, fontWeight:700, color:d.color }}>€{d.media.toLocaleString("es-ES")}</span>
                    </div>
                    <div style={{ height:5, borderRadius:3, background:C.border }}>
                      <div style={{ height:5, borderRadius:3, background:d.color, width:`${pct*100}%`, transition:"width 0.4s" }}/>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

      </div>

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
      <div className="pickup-chart-row" style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:"24px 28px", display:"flex", gap:40 }}>
        {/* Col izquierda: días más reservados */}
        <div style={{ display:"flex", flexDirection:"column", gap:12, minWidth:190, paddingRight:24, borderRight:`1px solid ${C.border}` }}>
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
            <div style={{ display:"flex", flex:1, alignItems:"flex-end", height:"100%", paddingLeft:36, gap:24 }}>
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
  const pickupEntries = datos.pickupEntries || [];

  const aniosDisponibles = [...new Set((presupuesto || []).map(p => p.anio))].sort();
  const [anio, setAnio] = useState(() => aniosDisponibles.includes(anioProp) ? anioProp : (aniosDisponibles[aniosDisponibles.length - 1] || anioProp));
  const [kpiChart, setKpiChart] = useState("revenue");

  if (!presupuesto || presupuesto.length === 0) {
    return <EmptyState mensaje="Importa tu plantilla Excel con los datos de la hoja 💰 Presupuesto para ver el análisis aquí" />;
  }

  const hoy = new Date();
  const pad = n => String(n).padStart(2, "0");
  const hoyStr = `${hoy.getFullYear()}-${pad(hoy.getMonth()+1)}-${pad(hoy.getDate())}`;

  // ── FORECAST (OTB + ETP) ──────────────────────────────────────
  const calcForecastRevenue = (mesIdx, anioF) => {
    const primerDia = new Date(anioF, mesIdx, 1);
    const ultimoDia = new Date(anioF, mesIdx + 1, 0);
    const mesStr    = `${anioF}-${pad(mesIdx + 1)}`;
    const mesStrLY  = `${anioF - 1}-${pad(mesIdx + 1)}`;

    // Mes ya cerrado → no hay forecast, devuelve null
    if (ultimoDia < hoy) return null;

    // ADR medio del año anterior para este mes
    const diasLY = (produccion || []).filter(r => String(r.fecha || "").slice(0, 7) === mesStrLY);
    const habOcuLY = diasLY.reduce((a, r) => a + (r.hab_ocupadas || 0), 0);
    const revHabLY = diasLY.reduce((a, r) => a + (r.revenue_hab || 0), 0);
    const adrLY = habOcuLY > 0 ? revHabLY / habOcuLY : null;
    if (!adrLY) return null;

    // OTB actual: reservas en pickup con fecha_llegada en este mes y fecha_pickup <= hoy
    const otbRes = pickupEntries
      .filter(e => String(e.fecha_llegada || "").slice(0, 7) === mesStr && String(e.fecha_pickup || "").slice(0, 10) <= hoyStr)
      .reduce((a, e) => a + (e.num_reservas || 1), 0);

    // OTB año anterior en la misma fecha relativa
    const hoyLY = `${anioF - 1}-${pad(hoy.getMonth() + 1)}-${pad(hoy.getDate())}`;
    const otbResLY = pickupEntries
      .filter(e => String(e.fecha_llegada || "").slice(0, 7) === mesStrLY && String(e.fecha_pickup || "").slice(0, 10) <= hoyLY)
      .reduce((a, e) => a + (e.num_reservas || 1), 0);

    // ETP: pickup del año anterior desde hoy hasta fin de mes, ajustado por pace
    const finMesLY = `${anioF - 1}-${pad(mesIdx + 1)}-${pad(ultimoDia.getDate())}`;
    const etpResLY = pickupEntries
      .filter(e => {
        const fp = String(e.fecha_pickup || "").slice(0, 10);
        return String(e.fecha_llegada || "").slice(0, 7) === mesStrLY && fp > hoyLY && fp <= finMesLY;
      })
      .reduce((a, e) => a + (e.num_reservas || 1), 0);

    // Factor pace — limitado a máx 1.5x para evitar distorsiones por falta de datos LY
    const paceRaw = otbResLY > 20 ? otbRes / otbResLY : 1;
    const paceFactor = Math.min(1.5, Math.max(0.5, paceRaw));
    const etpRes = Math.round(etpResLY * paceFactor);

    // Forecast reservas totales = OTB + ETP
    const forecastRes = otbRes + etpRes;

    // Revenue forecast = reservas * ADR año anterior
    const forecastRev = Math.round(forecastRes * adrLY);


    // Confianza: % del mes transcurrido
    const diasMes    = ultimoDia.getDate();
    const diaActual  = primerDia > hoy ? 0 : Math.min(hoy.getDate(), diasMes);
    const confianza  = Math.round((diaActual / diasMes) * 100);

    return { forecastRev, otbRes, etpRes, paceFactor: paceFactor.toFixed(2), confianza };
  };

  // ── REALES POR MES ────────────────────────────────────────────
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
      const real      = realesPorMes[p.mes - 1];
      const fcData    = calcForecastRevenue(p.mes - 1, anio);
      // Si cerrado → forecast = real; si en curso/futuro → OTB+ETP
      const ultimoDiaMes = new Date(anio, p.mes, 0);
      const mesCerrado   = ultimoDiaMes < hoy;
      const forecast_rev = mesCerrado
        ? real.rev_total_real
        : (fcData ? fcData.forecastRev : null);
      const confianza    = mesCerrado ? 100 : (fcData ? fcData.confianza : null);

      const adr_dev       = real.adr_real != null       ? Math.round((real.adr_real - p.adr_ppto) * 100) / 100     : null;
      const revpar_dev    = real.revpar_real != null     ? Math.round((real.revpar_real - p.revpar_ppto) * 100) / 100 : null;
      const revtotal_dev  = real.rev_total_real != null  ? real.rev_total_real - p.rev_total_ppto : null;
      const forecast_dev  = forecast_rev != null && p.rev_total_ppto ? forecast_rev - p.rev_total_ppto : null;
      const forecast_dev_pct = forecast_dev != null && p.rev_total_ppto > 0 ? ((forecast_dev / p.rev_total_ppto) * 100).toFixed(1) : null;

      return {
        mes: MESES_CORTO[p.mes - 1], mesIdx: p.mes - 1,
        adr_ppto: p.adr_ppto, adr_real: real.adr_real, adr_dev,
        adr_dev_pct: p.adr_ppto > 0 && adr_dev != null ? ((adr_dev / p.adr_ppto) * 100).toFixed(1) : null,
        revpar_ppto: p.revpar_ppto, revpar_real: real.revpar_real, revpar_dev,
        revpar_dev_pct: p.revpar_ppto > 0 && revpar_dev != null ? ((revpar_dev / p.revpar_ppto) * 100).toFixed(1) : null,
        rev_total_ppto: p.rev_total_ppto, rev_total_real: real.rev_total_real, revtotal_dev,
        revtotal_dev_pct: p.rev_total_ppto > 0 && revtotal_dev != null ? ((revtotal_dev / p.rev_total_ppto) * 100).toFixed(1) : null,
        forecast_rev, forecast_dev, forecast_dev_pct, confianza, mesCerrado,
        otbRes: fcData?.otbRes, etpRes: fcData?.etpRes, paceFactor: fcData?.paceFactor,
      };
    });

  const filasConReal   = filas.filter(f => f.adr_real != null || f.revpar_real != null);
  const totalRevPpto   = filas.reduce((a, f) => a + (f.rev_total_ppto || 0), 0);
  const totalRevReal   = filasConReal.reduce((a, f) => a + (f.rev_total_real || 0), 0);
  const totalRevDev    = totalRevReal - filasConReal.reduce((a, f) => a + (f.rev_total_ppto || 0), 0);
  const totalRevDevPct = filasConReal.length > 0 ? ((totalRevDev / filasConReal.reduce((a,f)=>a+(f.rev_total_ppto||0),0))*100).toFixed(1) : null;
  const totalForecast  = filas.reduce((a, f) => a + (f.forecast_rev || 0), 0);

  const mediaAdrPpto    = filas.length > 0 ? Math.round(filas.reduce((a,f)=>a+(f.adr_ppto||0),0)/filas.length) : 0;
  const mediaAdrReal    = filasConReal.length > 0 ? Math.round(filasConReal.reduce((a,f)=>a+(f.adr_real||0),0)/filasConReal.length) : null;
  const mediaRevparPpto = filas.length > 0 ? Math.round(filas.reduce((a,f)=>a+(f.revpar_ppto||0),0)/filas.length) : 0;
  const mediaRevparReal = filasConReal.length > 0 ? Math.round(filasConReal.reduce((a,f)=>a+(f.revpar_real||0),0)/filasConReal.length) : null;

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

  const ConfianzaBadge = ({ pct, cerrado }) => {
    if (pct == null) return null;
    if (cerrado) return <span style={{ fontSize: 9, color: C.green, fontWeight: 600 }}>✓ Real</span>;
    const color = pct >= 70 ? C.green : pct >= 40 ? "#E85D04" : C.textLight;
    return (
      <span style={{ fontSize: 9, color, fontWeight: 600, display: "block", marginTop: 2 }}>
        {pct}% confianza
      </span>
    );
  };

  const kpiOpts = [
    { key: "revenue", label: "Revenue Total" },
    { key: "adr",     label: "ADR" },
    { key: "revpar",  label: "RevPAR" },
  ];

  const chartUnificado = filas.map(f => ({
    mes: f.mes,
    Ppto: kpiChart==="revenue" ? (f.rev_total_ppto ? Math.round(f.rev_total_ppto/1000) : null)
         : kpiChart==="adr"     ? f.adr_ppto : f.revpar_ppto,
    Real: kpiChart==="revenue" ? (f.rev_total_real ? Math.round(f.rev_total_real/1000) : null)
         : kpiChart==="adr"     ? f.adr_real : f.revpar_real,
    Forecast: kpiChart==="revenue" && !f.mesCerrado && f.forecast_rev
      ? Math.round(f.forecast_rev / 1000) : null,
  }));

  const chartUnit  = kpiChart==="revenue" ? "k€" : "€";
  const chartTitle = kpiChart==="revenue" ? "Revenue Total — Ppto. vs Real vs Forecast"
                   : kpiChart==="adr"     ? "ADR — Ppto. vs Real" : "RevPAR — Ppto. vs Real";

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:20 }}>

      {/* KPIs forecast resumen */}
      {totalForecast > 0 && (
        <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:14 }}>
          {[
            { label:"Revenue Real YTD",     value:`€${Math.round(totalRevReal).toLocaleString("es-ES")}`,    color:C.green },
            { label:"Forecast Cierre Año",  value:`€${Math.round(totalForecast).toLocaleString("es-ES")}`,   color:"#B8860B" },
            { label:"Presupuesto Año",       value:`€${Math.round(totalRevPpto).toLocaleString("es-ES")}`,   color:C.accent },
          ].map((k,i) => (
            <div key={i} style={{ background:C.bgCard, border:`1px solid ${C.border}`, borderRadius:10, padding:"16px 20px", borderLeft:`3px solid ${k.color}` }}>
              <p style={{ fontSize:10, color:C.textLight, textTransform:"uppercase", letterSpacing:1.5, marginBottom:6, fontWeight:600 }}>{k.label}</p>
              <p style={{ fontSize:22, fontWeight:700, color:k.color, fontFamily:"'DM Sans',sans-serif" }}>{k.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Selector año */}
      {aniosDisponibles.length > 1 && (
        <div style={{ display:"flex", justifyContent:"flex-end" }}>
          <select value={anio} onChange={e => setAnio(parseInt(e.target.value))} style={{ padding:"6px 10px", borderRadius:6, border:`1px solid ${C.border}`, fontSize:12, fontWeight:600, color:C.text, background:C.bgCard, cursor:"pointer", fontFamily:"'DM Sans',sans-serif", outline:"none" }}>
            {aniosDisponibles.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>
      )}

      {/* Gráfica */}
      <Card>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:18 }}>
          <div>
            <p style={{ fontFamily:"'Playfair Display',serif", fontWeight:700, fontSize:17, color:C.text }}>{chartTitle}</p>
            <p style={{ fontSize:11, color:C.textLight, marginTop:2 }}>Ppto. vs Real vs Forecast · {anio}</p>
          </div>
          <div style={{ display:"flex", gap:6 }}>
            {kpiOpts.map(o => (
              <button key={o.key} onClick={()=>setKpiChart(o.key)}
                style={{ padding:"5px 14px", borderRadius:7, border:`1.5px solid ${kpiChart===o.key?"#1A7A3C":C.border}`, background:kpiChart===o.key?"#1A7A3C18":"transparent", color:kpiChart===o.key?"#1A7A3C":C.textLight, fontSize:12, fontWeight:kpiChart===o.key?700:400, cursor:"pointer", fontFamily:"'DM Sans',sans-serif", transition:"all 0.15s" }}>
                {o.label}
              </button>
            ))}
          </div>
        </div>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={chartUnificado} barSize={14} barGap={3}>
            <CartesianGrid strokeDasharray="3 3" stroke={C.border} vertical={false}/>
            <XAxis dataKey="mes" tick={{fill:C.textLight, fontSize:10}} axisLine={false} tickLine={false}/>
            <YAxis tick={{fill:C.textLight, fontSize:11}} axisLine={false} tickLine={false} unit={chartUnit}/>
            <Tooltip
              formatter={(val, name) => {
                if (val == null) return ["—", name];
                const num = kpiChart==="revenue" ? Math.round(val*1000) : Math.round(val);
                return [`€${num.toLocaleString("es-ES")}`, name];
              }}
              contentStyle={{background:"#fff", border:`1px solid ${C.border}`, borderRadius:8, fontSize:12}}
              labelStyle={{color:C.accent, fontWeight:700}}
            />
            <Legend wrapperStyle={{fontSize:11, color:C.textMid, paddingTop:8}}/>
            <Bar dataKey="Ppto"     fill="#2E9C5588" radius={[3,3,0,0]}/>
            <Bar dataKey="Real"     fill="#1A7A3C"   radius={[3,3,0,0]}/>
            <Bar dataKey="Forecast" fill="#B8860B88" radius={[3,3,0,0]} legendType={kpiChart==="revenue" ? "square" : "none"}/>
          </BarChart>
        </ResponsiveContainer>
      </Card>

      {/* Tabla detalle */}
      <Card>
        <p style={{ fontFamily:"'Playfair Display',serif", fontWeight:700, fontSize:16, color:C.text, marginBottom:16 }}>Detalle mensual</p>
        <div style={{ overflowX:"auto" }}>
          <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12 }}>
            <thead>
              <tr style={{ borderBottom:`2px solid ${C.border}` }}>
                {["Mes","ADR Ppto.","ADR Real","Desv. ADR","RevPAR Ppto.","RevPAR Real","Desv. RevPAR","Rev. Ppto.","Rev. Real","Desv. Rev.","Forecast Cierre"].map((h,hi) => (
                  <th key={h} style={{ padding:"8px 8px", textAlign: hi===0?"left":"right", fontSize:10, color: h==="Forecast Cierre"?"#B8860B":C.textLight, textTransform:"uppercase", letterSpacing:"1px", fontWeight:600 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filas.map((f, i) => {
                const esFuturo = !f.mesCerrado && f.rev_total_real == null;
                const esEnCurso = !f.mesCerrado && f.rev_total_real != null;
                return (
                  <tr key={i} style={{ borderBottom:`1px solid ${C.border}`, background: i%2===0?"#FAFAFA":C.bgCard }}>
                    <td style={{ padding:"10px 12px", fontWeight:600, color:C.text }}>{f.mes}</td>
                    <td style={{ padding:"10px 8px", textAlign:"right", color:C.textMid }}>€{f.adr_ppto}</td>
                    <td style={{ padding:"10px 8px", textAlign:"right", color:C.text, fontWeight:f.adr_real?600:400 }}>{f.adr_real!=null?`€${f.adr_real}`:"—"}</td>
                    <td style={{ padding:"10px 8px", textAlign:"right" }}><DevBadge val={f.adr_dev} pct={f.adr_dev_pct}/></td>
                    <td style={{ padding:"10px 8px", textAlign:"right", color:C.textMid }}>€{f.revpar_ppto}</td>
                    <td style={{ padding:"10px 8px", textAlign:"right", color:"#1A7A3C", fontWeight:f.revpar_real?600:400 }}>{f.revpar_real!=null?`€${f.revpar_real}`:"—"}</td>
                    <td style={{ padding:"10px 8px", textAlign:"right" }}><DevBadge val={f.revpar_dev} pct={f.revpar_dev_pct}/></td>
                    <td style={{ padding:"10px 8px", textAlign:"right", color:C.textMid }}>€{f.rev_total_ppto?.toLocaleString("es-ES")}</td>
                    <td style={{ padding:"10px 8px", textAlign:"right", color:"#1A7A3C", fontWeight:f.rev_total_real?600:400 }}>{f.rev_total_real!=null?`€${f.rev_total_real.toLocaleString("es-ES")}`:"—"}</td>
                    <td style={{ padding:"10px 8px", textAlign:"right" }}><DevBadge val={f.revtotal_dev} pct={f.revtotal_dev_pct}/></td>
                    <td style={{ padding:"10px 8px", textAlign:"right", background: f.mesCerrado?"transparent":"#FFF8E7", borderLeft:`2px solid ${f.forecast_rev?"#B8860B44":"transparent"}` }}>
                      {f.forecast_rev != null ? (
                        <div>
                          <span style={{ fontSize:13, fontWeight:700, color:"#B8860B" }}>€{Math.round(f.forecast_rev).toLocaleString("es-ES")}</span>
                          {f.forecast_dev != null && (
                            <span style={{ fontSize:9, color:f.forecast_dev>=0?C.green:C.red, fontWeight:600, display:"block" }}>
                              {f.forecast_dev>=0?"+":""}{(f.forecast_dev/1000).toFixed(1)}k vs ppto
                            </span>
                          )}
                          <ConfianzaBadge pct={f.confianza} cerrado={f.mesCerrado}/>
                        </div>
                      ) : "—"}
                    </td>
                  </tr>
                );
              })}
              {filasConReal.length > 0 && (
                <tr style={{ borderTop:`2px solid ${C.border}`, background:"#E8F5EE", fontWeight:700 }}>
                  <td style={{ padding:"10px 12px", color:C.text, fontWeight:700 }}>TOTAL YTD</td>
                  <td colSpan={2} style={{ padding:"10px 8px", textAlign:"right", color:C.textMid, fontSize:11 }}>Ppto: €{mediaAdrPpto} media</td>
                  <td style={{ padding:"10px 8px", textAlign:"right" }}><DevBadge val={mediaAdrReal!=null?mediaAdrReal-mediaAdrPpto:null} pct={mediaAdrReal!=null?(((mediaAdrReal-mediaAdrPpto)/mediaAdrPpto)*100).toFixed(1):null}/></td>
                  <td colSpan={2} style={{ padding:"10px 8px", textAlign:"right", color:C.textMid, fontSize:11 }}>Ppto: €{mediaRevparPpto} media</td>
                  <td style={{ padding:"10px 8px", textAlign:"right" }}><DevBadge val={mediaRevparReal!=null?mediaRevparReal-mediaRevparPpto:null} pct={mediaRevparReal!=null?(((mediaRevparReal-mediaRevparPpto)/mediaRevparPpto)*100).toFixed(1):null}/></td>
                  <td style={{ padding:"10px 8px", textAlign:"right", color:C.textMid, fontSize:11 }}>€{Math.round(filasConReal.reduce((a,f)=>a+(f.rev_total_ppto||0),0)).toLocaleString("es-ES")}</td>
                  <td style={{ padding:"10px 8px", textAlign:"right", color:"#1A7A3C" }}>€{Math.round(totalRevReal).toLocaleString("es-ES")}</td>
                  <td style={{ padding:"10px 8px", textAlign:"right" }}><DevBadge val={Math.round(totalRevDev)} pct={totalRevDevPct}/></td>
                  <td style={{ padding:"10px 8px", textAlign:"right", background:"#FFF8E7", borderLeft:"2px solid #B8860B44" }}>
                    {totalForecast > 0 && <span style={{ fontSize:13, fontWeight:700, color:"#B8860B" }}>€{Math.round(totalForecast).toLocaleString("es-ES")}</span>}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

    </div>
  );
}


// ─── GRUPOS & EVENTOS VIEW ────────────────────────────────────────
function GruposView({ datos, onRecargar }) {
  const grupos = datos.grupos || [];
  const session = datos.session;

  const CATS = {
    corporativo: { label: "Corporativo",    icon: "🏢", color: "#2B7EC1" },
    boda:        { label: "Boda / Social",  icon: "💍", color: "#D4547A" },
    feria:       { label: "Feria / Congreso", icon: "🎟️", color: "#E85D04" },
    deportivo:   { label: "Deportivo",      icon: "🏆", color: "#059669" },
    otros:       { label: "Otros",          icon: "✨", color: "#7C3AED" },
  };

  const ESTADOS = {
    confirmado:  { label: "Confirmado",    color: "#1A7A3C", bg: "#E6F7EE", peso: 1.0 },
    tentativo:   { label: "Tentativo",     color: "#B8860B", bg: "#FFF8E7", peso: 0.5 },
    cotizacion:  { label: "En cotización", color: "#2B7EC1", bg: "#E8F0F9", peso: 0 },
    cancelado:   { label: "Cancelado",     color: "#999",    bg: "#F5F5F5", peso: 0 },
  };

  const MESES = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
  const MESES_FULL = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];

  const [anio, setAnio] = useState(new Date().getFullYear());
  const [filtroEstado, setFiltroEstado] = useState("todos");
  const [modalGrupo, setModalGrupo] = useState(null); // null | {} (nuevo) | {id,...} (editar)
  const [guardando, setGuardando] = useState(false);
  const [vistaActiva, setVistaActiva] = useState("calendario"); // calendario | lista | pipeline

  // ── Formulario estado ──
  const FORM_VACIO = { nombre:"", categoria:"corporativo", estado:"cotizacion", fecha_inicio:"", fecha_fin:"", habitaciones:"", adr_grupo:"", revenue_fnb:"", revenue_sala:"", notas:"", motivo_perdida:"" };
  const [form, setForm] = useState(FORM_VACIO);

  const abrirNuevo = (fecha = "") => {
    setForm({ ...FORM_VACIO, fecha_inicio: fecha, fecha_fin: fecha });
    setModalGrupo({});
  };

  const abrirEditar = (g) => {
    setForm({
      nombre: g.nombre||"", categoria: g.categoria||"corporativo", estado: g.estado||"cotizacion",
      fecha_inicio: g.fecha_inicio||"", fecha_fin: g.fecha_fin||"",
      habitaciones: g.habitaciones||"", adr_grupo: g.adr_grupo||"",
      revenue_fnb: g.revenue_fnb||"", revenue_sala: g.revenue_sala||"",
      notas: g.notas||"", motivo_perdida: g.motivo_perdida||"",
    });
    setModalGrupo(g);
  };

  const guardar = async () => {
    if (!form.nombre || !form.fecha_inicio || !form.fecha_fin) return;
    setGuardando(true);
    const payload = {
      hotel_id: session.user.id,
      nombre: form.nombre,
      categoria: form.categoria,
      estado: form.estado,
      fecha_inicio: form.fecha_inicio,
      fecha_fin: form.fecha_fin,
      habitaciones: parseInt(form.habitaciones)||0,
      adr_grupo: parseFloat(form.adr_grupo)||0,
      revenue_fnb: parseFloat(form.revenue_fnb)||0,
      revenue_sala: parseFloat(form.revenue_sala)||0,
      notas: form.notas||null,
      motivo_perdida: form.motivo_perdida||null,
    };
    if (modalGrupo?.id) {
      await supabase.from("grupos_eventos").update(payload).eq("id", modalGrupo.id);
    } else {
      await supabase.from("grupos_eventos").insert(payload);
    }
    setGuardando(false);
    setModalGrupo(null);
    onRecargar();
  };

  const eliminar = async (id) => {
    if (!window.confirm("¿Eliminar este grupo?")) return;
    await supabase.from("grupos_eventos").delete().eq("id", id);
    setModalGrupo(null);
    onRecargar();
  };

  // ── Cálculos KPIs ──
  const gruposAnio = grupos.filter(g => g.fecha_inicio?.slice(0,4) === String(anio) || g.fecha_fin?.slice(0,4) === String(anio));
  const confirmados = gruposAnio.filter(g => g.estado === "confirmado");
  const tentativos  = gruposAnio.filter(g => g.estado === "tentativo");
  const pipeline    = gruposAnio.filter(g => g.estado === "cotizacion");
  const cancelados  = gruposAnio.filter(g => g.estado === "cancelado");

  const calcRevTotal = (g) => {
    const noches = g.fecha_inicio && g.fecha_fin
      ? Math.max(1, Math.round((new Date(g.fecha_fin) - new Date(g.fecha_inicio)) / 86400000))
      : 1;
    return (g.habitaciones||0) * (g.adr_grupo||0) * noches + (g.revenue_fnb||0) + (g.revenue_sala||0);
  };

  const revConfirmado = confirmados.reduce((a,g) => a + calcRevTotal(g), 0);
  const revTentativo  = tentativos.reduce((a,g)  => a + calcRevTotal(g) * 0.5, 0);
  const revPipeline   = pipeline.reduce((a,g)    => a + calcRevTotal(g), 0);

  // ── Calendario mensual ──
  const eventosPorMes = MESES.map((_, mi) => 
    gruposAnio.filter(g => {
      const ini = new Date(g.fecha_inicio+"T00:00:00");
      const fin = new Date(g.fecha_fin+"T00:00:00");
      return ini.getMonth() <= mi && fin.getMonth() >= mi;
    })
  );

  const gruposFiltrados = filtroEstado === "todos"
    ? gruposAnio.filter(g => g.estado !== "cancelado")
    : gruposAnio.filter(g => g.estado === filtroEstado);

  const inp = { width:"100%", padding:"9px 12px", borderRadius:7, border:`1.5px solid ${C.border}`, fontSize:13, fontFamily:"'DM Sans',sans-serif", color:C.text, background:C.bg, outline:"none", boxSizing:"border-box" };

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:20 }}>

      {/* ── KPIs ── */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))", gap:12 }}>
        {[
          { label:"Revenue confirmado",  value:`€${Math.round(revConfirmado).toLocaleString("es-ES")}`,  color:"#1A7A3C", n:confirmados.length },
          { label:"Revenue tentativo (50%)", value:`€${Math.round(revTentativo).toLocaleString("es-ES")}`, color:"#B8860B", n:tentativos.length },
          { label:"Pipeline en cotización", value:`€${Math.round(revPipeline).toLocaleString("es-ES")}`,  color:"#2B7EC1", n:pipeline.length },
          { label:"Cancelados / Perdidos",  value:cancelados.length,                                       color:"#999",    n:cancelados.length },
        ].map((k,i) => (
          <div key={i} style={{ background:C.bgCard, border:`1px solid ${C.border}`, borderRadius:10, padding:"14px 18px", borderLeft:`3px solid ${k.color}` }}>
            <p style={{ fontSize:10, color:C.textLight, textTransform:"uppercase", letterSpacing:1.5, fontWeight:600, marginBottom:4 }}>{k.label}</p>
            <p style={{ fontSize:20, fontWeight:800, color:k.color, fontFamily:"'DM Sans',sans-serif" }}>{k.value}</p>
            <p style={{ fontSize:11, color:C.textLight, marginTop:2 }}>{k.n} evento{k.n!==1?"s":""}</p>
          </div>
        ))}
      </div>

      {/* ── Toolbar ── */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", gap:12, flexWrap:"wrap" }}>
        <div style={{ display:"flex", gap:6, alignItems:"center" }}>
          {/* Selector año */}
          <button onClick={()=>setAnio(a=>a-1)} style={{ background:C.bg, border:`1px solid ${C.border}`, borderRadius:6, width:28, height:28, cursor:"pointer", color:C.textMid }}>‹</button>
          <span style={{ fontSize:14, fontWeight:700, color:C.text, minWidth:40, textAlign:"center" }}>{anio}</span>
          <button onClick={()=>setAnio(a=>a+1)} style={{ background:C.bg, border:`1px solid ${C.border}`, borderRadius:6, width:28, height:28, cursor:"pointer", color:C.textMid }}>›</button>
          {/* Tabs vista */}
          <div style={{ display:"flex", background:C.bg, borderRadius:8, padding:3, marginLeft:8, gap:2 }}>
            {[["calendario","📅"],["lista","☰"],["pipeline","🔮"]].map(([k,ic])=>(
              <button key={k} onClick={()=>setVistaActiva(k)}
                style={{ padding:"4px 12px", borderRadius:6, border:"none", background:vistaActiva===k?C.bgCard:"transparent", color:vistaActiva===k?C.text:C.textLight, fontSize:12, fontWeight:vistaActiva===k?600:400, cursor:"pointer", boxShadow:vistaActiva===k?"0 1px 4px rgba(0,0,0,0.08)":"none" }}>
                {ic} {k.charAt(0).toUpperCase()+k.slice(1)}
              </button>
            ))}
          </div>
        </div>
        <button onClick={()=>abrirNuevo()} style={{ background:"#7C3AED", color:"#fff", border:"none", borderRadius:8, padding:"8px 18px", fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:"'DM Sans',sans-serif" }}>
          + Nuevo evento
        </button>
      </div>

      {/* ── VISTA CALENDARIO ── */}
      {vistaActiva === "calendario" && (
        <Card>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:10 }}>
            {MESES.map((mes, mi) => {
              const evs = eventosPorMes[mi];
              return (
                <div key={mi} style={{ border:`1px solid ${C.border}`, borderRadius:8, padding:"10px 12px", minHeight:90, cursor:"pointer", background: evs.length>0?C.bg:C.bgCard }}
                  onClick={()=>abrirNuevo(`${anio}-${String(mi+1).padStart(2,"0")}-01`)}>
                  <p style={{ fontSize:11, fontWeight:700, color:C.textLight, textTransform:"uppercase", letterSpacing:1, marginBottom:6 }}>{MESES_FULL[mi]}</p>
                  {evs.length === 0
                    ? <p style={{ fontSize:10, color:C.border }}>Sin eventos</p>
                    : evs.map((g,i) => (
                        <div key={i} onClick={e=>{e.stopPropagation();abrirEditar(g);}}
                          style={{ display:"flex", alignItems:"center", gap:5, marginBottom:4, padding:"3px 6px", borderRadius:4, background:ESTADOS[g.estado]?.bg||"#f5f5f5", border:`1px solid ${ESTADOS[g.estado]?.color||"#ddd"}33`, cursor:"pointer" }}>
                          <span style={{ fontSize:11 }}>{CATS[g.categoria]?.icon||"✨"}</span>
                          <span style={{ fontSize:10, fontWeight:600, color:ESTADOS[g.estado]?.color||C.text, flex:1, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{g.nombre}</span>
                          <span style={{ fontSize:9, color:C.textLight }}>{g.habitaciones||0}h</span>
                        </div>
                      ))
                  }
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* ── VISTA LISTA ── */}
      {vistaActiva === "lista" && (
        <Card>
          <div style={{ display:"flex", gap:6, marginBottom:16, flexWrap:"wrap" }}>
            {["todos","confirmado","tentativo","cotizacion","cancelado"].map(e=>(
              <button key={e} onClick={()=>setFiltroEstado(e)}
                style={{ padding:"4px 12px", borderRadius:6, border:`1px solid ${filtroEstado===e?(ESTADOS[e]?.color||C.accent):C.border}`, background:filtroEstado===e?(ESTADOS[e]?.bg||C.accentLight):"transparent", color:filtroEstado===e?(ESTADOS[e]?.color||C.accent):C.textLight, fontSize:11, fontWeight:filtroEstado===e?700:400, cursor:"pointer" }}>
                {e==="todos"?"Todos":ESTADOS[e]?.label}
              </button>
            ))}
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
            {gruposFiltrados.length === 0
              ? <p style={{ color:C.textLight, textAlign:"center", padding:24 }}>Sin eventos</p>
              : gruposFiltrados.sort((a,b)=>a.fecha_inicio?.localeCompare(b.fecha_inicio)).map(g => {
                  const revT = calcRevTotal(g);
                  const noches = Math.max(1, Math.round((new Date(g.fecha_fin) - new Date(g.fecha_inicio)) / 86400000));
                  return (
                    <div key={g.id} onClick={()=>abrirEditar(g)} style={{ display:"flex", alignItems:"center", gap:14, padding:"12px 16px", borderRadius:8, border:`1px solid ${C.border}`, background:C.bgCard, cursor:"pointer" }}
                      onMouseEnter={e=>e.currentTarget.style.background=C.bg}
                      onMouseLeave={e=>e.currentTarget.style.background=C.bgCard}>
                      <span style={{ fontSize:22 }}>{CATS[g.categoria]?.icon||"✨"}</span>
                      <div style={{ flex:1 }}>
                        <p style={{ fontSize:13, fontWeight:700, color:C.text }}>{g.nombre}</p>
                        <p style={{ fontSize:11, color:C.textLight }}>{g.fecha_inicio} → {g.fecha_fin} · {noches} noche{noches!==1?"s":""} · {g.habitaciones||0} hab.</p>
                      </div>
                      <div style={{ textAlign:"right" }}>
                        <p style={{ fontSize:14, fontWeight:700, color:"#1A7A3C" }}>€{Math.round(revT).toLocaleString("es-ES")}</p>
                        <span style={{ fontSize:10, fontWeight:600, padding:"2px 8px", borderRadius:10, background:ESTADOS[g.estado]?.bg, color:ESTADOS[g.estado]?.color }}>
                          {ESTADOS[g.estado]?.label}
                        </span>
                      </div>
                    </div>
                  );
                })
            }
          </div>
        </Card>
      )}

      {/* ── VISTA PIPELINE ── */}
      {vistaActiva === "pipeline" && (
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(260px,1fr))", gap:16 }}>
          {["cotizacion","tentativo","confirmado"].map(estado => {
            const evs = gruposAnio.filter(g=>g.estado===estado).sort((a,b)=>a.fecha_inicio?.localeCompare(b.fecha_inicio));
            const revTotal = evs.reduce((a,g)=>a+calcRevTotal(g),0);
            return (
              <div key={estado} style={{ background:C.bgCard, border:`1px solid ${C.border}`, borderRadius:10, overflow:"hidden" }}>
                <div style={{ padding:"12px 16px", background:ESTADOS[estado]?.bg, borderBottom:`1px solid ${C.border}` }}>
                  <p style={{ fontSize:12, fontWeight:700, color:ESTADOS[estado]?.color, textTransform:"uppercase", letterSpacing:1 }}>{ESTADOS[estado]?.label}</p>
                  <p style={{ fontSize:11, color:C.textLight }}>{evs.length} eventos · €{Math.round(revTotal).toLocaleString("es-ES")}</p>
                </div>
                <div style={{ padding:"10px 12px", display:"flex", flexDirection:"column", gap:8, minHeight:120 }}>
                  {evs.length === 0
                    ? <p style={{ fontSize:11, color:C.border, textAlign:"center", paddingTop:16 }}>Sin eventos</p>
                    : evs.map(g => (
                        <div key={g.id} onClick={()=>abrirEditar(g)} style={{ padding:"8px 10px", borderRadius:7, border:`1px solid ${C.border}`, cursor:"pointer", background:C.bg }}
                          onMouseEnter={e=>e.currentTarget.style.borderColor=ESTADOS[estado]?.color}
                          onMouseLeave={e=>e.currentTarget.style.borderColor=C.border}>
                          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
                            <p style={{ fontSize:12, fontWeight:600, color:C.text }}>{CATS[g.categoria]?.icon} {g.nombre}</p>
                            <p style={{ fontSize:11, fontWeight:700, color:"#1A7A3C" }}>€{Math.round(calcRevTotal(g)).toLocaleString("es-ES")}</p>
                          </div>
                          <p style={{ fontSize:10, color:C.textLight, marginTop:2 }}>{g.fecha_inicio} · {g.habitaciones||0} hab.</p>
                        </div>
                      ))
                  }
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── MODAL FORMULARIO ── */}
      {modalGrupo !== null && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.55)", zIndex:1000, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}
          onClick={()=>setModalGrupo(null)}>
          <div style={{ background:C.bgCard, borderRadius:14, width:"100%", maxWidth:540, maxHeight:"90vh", overflow:"auto", padding:"28px 32px", boxShadow:"0 24px 80px rgba(0,0,0,0.2)" }}
            onClick={e=>e.stopPropagation()}>

            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
              <h3 style={{ fontSize:18, fontWeight:700, color:C.text }}>{modalGrupo?.id?"Editar evento":"Nuevo evento"}</h3>
              <button onClick={()=>setModalGrupo(null)} style={{ background:"none", border:`1px solid ${C.border}`, borderRadius:6, width:28, height:28, cursor:"pointer", fontSize:16, color:C.textMid }}>×</button>
            </div>

            <div style={{ display:"flex", flexDirection:"column", gap:12 }}>

              <div>
                <p style={{ fontSize:11, color:C.textLight, textTransform:"uppercase", letterSpacing:1, marginBottom:5 }}>Nombre del evento *</p>
                <input style={inp} placeholder="Boda García · Congreso Pharma..." value={form.nombre} onChange={e=>setForm(f=>({...f,nombre:e.target.value}))}/>
              </div>

              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
                <div>
                  <p style={{ fontSize:11, color:C.textLight, textTransform:"uppercase", letterSpacing:1, marginBottom:5 }}>Categoría</p>
                  <select style={inp} value={form.categoria} onChange={e=>setForm(f=>({...f,categoria:e.target.value}))}>
                    {Object.entries(CATS).map(([k,v])=><option key={k} value={k}>{v.icon} {v.label}</option>)}
                  </select>
                </div>
                <div>
                  <p style={{ fontSize:11, color:C.textLight, textTransform:"uppercase", letterSpacing:1, marginBottom:5 }}>Estado</p>
                  <select style={inp} value={form.estado} onChange={e=>setForm(f=>({...f,estado:e.target.value}))}>
                    {Object.entries(ESTADOS).map(([k,v])=><option key={k} value={k}>{v.label}</option>)}
                  </select>
                </div>
              </div>

              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
                <div>
                  <p style={{ fontSize:11, color:C.textLight, textTransform:"uppercase", letterSpacing:1, marginBottom:5 }}>Fecha entrada *</p>
                  <input style={inp} type="date" value={form.fecha_inicio} onChange={e=>setForm(f=>({...f,fecha_inicio:e.target.value}))}/>
                </div>
                <div>
                  <p style={{ fontSize:11, color:C.textLight, textTransform:"uppercase", letterSpacing:1, marginBottom:5 }}>Fecha salida *</p>
                  <input style={inp} type="date" value={form.fecha_fin} onChange={e=>setForm(f=>({...f,fecha_fin:e.target.value}))}/>
                </div>
              </div>

              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
                <div>
                  <p style={{ fontSize:11, color:C.textLight, textTransform:"uppercase", letterSpacing:1, marginBottom:5 }}>Habitaciones / noche</p>
                  <input style={inp} type="number" placeholder="20" value={form.habitaciones} onChange={e=>setForm(f=>({...f,habitaciones:e.target.value}))}/>
                </div>
                <div>
                  <p style={{ fontSize:11, color:C.textLight, textTransform:"uppercase", letterSpacing:1, marginBottom:5 }}>ADR grupo (€)</p>
                  <input style={inp} type="number" placeholder="89" value={form.adr_grupo} onChange={e=>setForm(f=>({...f,adr_grupo:e.target.value}))}/>
                </div>
              </div>

              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
                <div>
                  <p style={{ fontSize:11, color:C.textLight, textTransform:"uppercase", letterSpacing:1, marginBottom:5 }}>Revenue F&B (€)</p>
                  <input style={inp} type="number" placeholder="5000" value={form.revenue_fnb} onChange={e=>setForm(f=>({...f,revenue_fnb:e.target.value}))}/>
                </div>
                <div>
                  <p style={{ fontSize:11, color:C.textLight, textTransform:"uppercase", letterSpacing:1, marginBottom:5 }}>Alquiler sala (€)</p>
                  <input style={inp} type="number" placeholder="800" value={form.revenue_sala} onChange={e=>setForm(f=>({...f,revenue_sala:e.target.value}))}/>
                </div>
              </div>

              {form.estado === "cancelado" && (
                <div>
                  <p style={{ fontSize:11, color:C.textLight, textTransform:"uppercase", letterSpacing:1, marginBottom:5 }}>Motivo pérdida</p>
                  <input style={inp} placeholder="Precio, competencia, fecha..." value={form.motivo_perdida} onChange={e=>setForm(f=>({...f,motivo_perdida:e.target.value}))}/>
                </div>
              )}

              <div>
                <p style={{ fontSize:11, color:C.textLight, textTransform:"uppercase", letterSpacing:1, marginBottom:5 }}>Notas</p>
                <textarea style={{...inp, resize:"vertical", minHeight:60}} placeholder="Contacto, condiciones especiales..." value={form.notas} onChange={e=>setForm(f=>({...f,notas:e.target.value}))}/>
              </div>

              {/* Preview revenue */}
              {(form.habitaciones || form.revenue_fnb || form.revenue_sala) && (() => {
                const noches = form.fecha_inicio && form.fecha_fin
                  ? Math.max(1, Math.round((new Date(form.fecha_fin) - new Date(form.fecha_inicio)) / 86400000))
                  : 1;
                const revHab = (parseInt(form.habitaciones)||0) * (parseFloat(form.adr_grupo)||0) * noches;
                const revFnb = parseFloat(form.revenue_fnb)||0;
                const revSala = parseFloat(form.revenue_sala)||0;
                const total = revHab + revFnb + revSala;
                return total > 0 ? (
                  <div style={{ background:"#E6F7EE", border:"1px solid #1A7A3C33", borderRadius:8, padding:"10px 14px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                    <p style={{ fontSize:12, color:"#1A7A3C", fontWeight:600 }}>Revenue estimado</p>
                    <p style={{ fontSize:18, fontWeight:800, color:"#1A7A3C" }}>€{Math.round(total).toLocaleString("es-ES")}</p>
                  </div>
                ) : null;
              })()}

              <div style={{ display:"flex", justifyContent:"space-between", marginTop:4 }}>
                {modalGrupo?.id
                  ? <button onClick={()=>eliminar(modalGrupo.id)} style={{ background:"none", border:`1px solid ${C.red}`, color:C.red, borderRadius:7, padding:"8px 16px", fontSize:12, cursor:"pointer" }}>Eliminar</button>
                  : <div/>
                }
                <div style={{ display:"flex", gap:8 }}>
                  <button onClick={()=>setModalGrupo(null)} style={{ background:"none", border:`1px solid ${C.border}`, color:C.textMid, borderRadius:7, padding:"8px 16px", fontSize:12, cursor:"pointer" }}>Cancelar</button>
                  <button onClick={guardar} disabled={guardando||!form.nombre||!form.fecha_inicio||!form.fecha_fin}
                    style={{ background:"#7C3AED", color:"#fff", border:"none", borderRadius:7, padding:"8px 20px", fontSize:13, fontWeight:600, cursor:"pointer", opacity:guardando?0.6:1 }}>
                    {guardando?"Guardando...":"Guardar"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

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
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700;800&family=DM+Sans:wght@300;400;500;600&display=swap'); * { box-sizing: border-box; margin: 0; padding: 0; } html, body, #root { width: 100%; min-height: 100vh; } @keyframes fadeUp { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: translateY(0); } }`}</style>
      <div style={{ width: 420, background: C.bgCard, borderRadius: 20, padding: "40px 36px", boxShadow: "0 32px 80px rgba(0,0,0,0.4)", animation: "fadeUp 0.5s ease both" }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <img src={LOGO_B64} alt="FastRevenue" style={{ height: 56, width: "auto", margin: "0 auto 14px", display: "block" }} />
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
  { key: "pickup",     label: "Pickup" },
  { key: "budget",     icon: "💰", label: "Presupuesto" },
  { key: "grupos",     icon: "🎪", label: "M&E" },
];


function PantallaSubscripcion({ session, onPagar }) {
  const [cargando, setCargando] = useState(false);

  const iniciarPago = async () => {
    setCargando(true);
    try {
      const res = await fetch("/api/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: session.user.id, email: session.user.email }),
      });
      const { url, error } = await res.json();
      if (error) throw new Error(error);
      window.location.href = url;
    } catch(e) {
      alert("Error al iniciar el pago: " + e.message);
    }
    setCargando(false);
  };

  return (
    <div style={{ minHeight:"100vh", background:C.bg, display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"'DM Sans',sans-serif" }}>
      <div style={{ width:460, background:C.bgCard, borderRadius:20, padding:"48px 40px", boxShadow:"0 32px 80px rgba(0,0,0,0.1)", textAlign:"center" }}>
        <img src={LOGO_B64} alt="FastRevenue" style={{ height:52, marginBottom:24 }} />
        <h1 style={{ fontFamily:"'Playfair Display',serif", fontSize:26, fontWeight:800, color:C.text, marginBottom:10 }}>Empieza gratis 30 días</h1>
        <p style={{ fontSize:14, color:C.textMid, lineHeight:1.7, marginBottom:32 }}>
          Acceso completo a FastRev durante 30 días sin coste.<br/>
          Después, solo <strong>€49/mes</strong> + IVA. Cancela cuando quieras.
        </p>
        <div style={{ background:C.bg, borderRadius:12, padding:"20px 24px", marginBottom:28, textAlign:"left" }}>
          {["Dashboard con KPIs en tiempo real","Análisis de pickup y forecast","Presupuesto vs real mensual","Informes PDF mensuales","Alertas automáticas"].map((f,i) => (
            <div key={i} style={{ display:"flex", alignItems:"center", gap:10, marginBottom: i<4?10:0 }}>
              <span style={{ color:C.green, fontWeight:700, fontSize:14 }}>✓</span>
              <span style={{ fontSize:13, color:C.text }}>{f}</span>
            </div>
          ))}
        </div>
        <button onClick={iniciarPago} disabled={cargando}
          style={{ width:"100%", padding:"14px", borderRadius:10, border:"none", background:C.accent, color:"#fff", fontSize:15, fontWeight:700, cursor:cargando?"not-allowed":"pointer", fontFamily:"'DM Sans',sans-serif", marginBottom:12 }}>
          {cargando ? "Redirigiendo..." : "Empezar prueba gratuita →"}
        </button>
        <button onClick={() => supabase.auth.signOut()} style={{ background:"none", border:"none", color:C.textLight, fontSize:12, cursor:"pointer" }}>
          Cerrar sesión
        </button>
      </div>
    </div>
  );
}

export default function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState(() => localStorage.getItem("fr_view") || "dashboard");

  const hoy = new Date();
  const [mesSel,  setMesSel]  = useState(() => { const v = localStorage.getItem("rm_mes");  return v !== null ? parseInt(v) : hoy.getMonth(); });
  const [anioSel, setAnioSel] = useState(() => { const v = localStorage.getItem("rm_anio"); return v !== null ? parseInt(v) : hoy.getFullYear(); });
  const [importar, setImportar] = useState(false);
  const [suscripcion, setSuscripcion] = useState(null);
  const [cargandoSub, setCargandoSub] = useState(true);
  const [datos, setDatos] = useState({ produccion: [], presupuesto: [] });
  const [cargandoDatos, setCargandoDatos] = useState(false);

  // Restaurar scroll al montar
  useEffect(() => {
    const saved = localStorage.getItem("fr_scroll");
    if (saved) {
      const el = document.getElementById("main-scroll");
      if (el) el.scrollTop = parseInt(saved);
    }
  }, [datos.produccion?.length]); // restaurar cuando los datos ya están cargados

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      // Si cambia el usuario, limpiar caché
      if (session) {
        const cachedUserId = localStorage.getItem("fr_user_id");
        if (cachedUserId && cachedUserId !== session.user.id) {
          localStorage.removeItem("fr_datos_cache_v3");
          localStorage.removeItem("fr_datos_ts_v3");
          localStorage.removeItem("fr_scroll");
          localStorage.removeItem("fr_view");
        }
        localStorage.setItem("fr_user_id", session.user.id);
      }
      setSession(session);
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session) {
      cargarDatos(false);
      // Cargar suscripción
      supabase.from("suscripciones").select("*").eq("user_id", session.user.id).maybeSingle()
        .then(({ data, error }) => {
          setSuscripcion(data || null);
          setCargandoSub(false);
        }).catch(() => { setSuscripcion(null); setCargandoSub(false); });
      // Verificar pago=ok en URL
      if (window.location.search.includes("pago=ok")) {
        setTimeout(() => {
          supabase.from("suscripciones").select("*").eq("user_id", session.user.id).maybeSingle()
            .then(({ data }) => { setSuscripcion(data); });
        }, 2000);
        window.history.replaceState({}, "", window.location.pathname);
      }
    }
  }, [session]);

  const [refreshKey, setRefreshKey] = useState(0);

  const CACHE_KEY = "fr_datos_cache_v3";
  const CACHE_TS_KEY = "fr_datos_ts_v3";

  const cargarDatos = async (forzar = false) => {
    // Si no forzamos, intentar usar caché
    if (!forzar) {
      try {
        const cached = localStorage.getItem(CACHE_KEY);
        const ts = localStorage.getItem(CACHE_TS_KEY);
        if (cached && ts) {
          const parsed = JSON.parse(cached);
          parsed.session = session;
          setDatos(parsed);
          setCargandoDatos(false);
          // Restaurar scroll después de pintar
          setTimeout(() => {
            const el = document.getElementById("main-scroll");
            const scroll = localStorage.getItem("fr_scroll");
            if (el && scroll) el.scrollTop = parseInt(scroll);
          }, 50);
          return;
        }
      } catch(_) {}
    }

    setCargandoDatos(true);
    const [{ data: produccion }, { data: presupuesto }, { data: hotelData }, { data: gruposData }] = await Promise.all([
      supabase.from("produccion_diaria").select("*").eq("hotel_id", session.user.id).order("fecha"),
      supabase.from("presupuesto").select("*").eq("hotel_id", session.user.id).order("mes"),
      supabase.from("hoteles").select("nombre, ciudad, habitaciones").eq("id", session.user.id).maybeSingle(),
      supabase.from("grupos_eventos").select("*").eq("hotel_id", session.user.id).order("fecha_inicio"),
    ]);
    // Pickup separado — carga en paralelo para máxima velocidad
    let pickupEntries = [];
    try {
      const { data: pe0, count } = await supabase.from("pickup_entries")
        .select("fecha_llegada, fecha_pickup, canal, num_reservas, fecha_salida, noches, precio_total, estado", { count: "exact" })
        .eq("hotel_id", session.user.id)
        .range(0, 999);
      if (pe0 && pe0.length > 0) {
        const total = count || pe0.length;
        const PAGINA = 1000;
        const paginas = Math.ceil(total / PAGINA);
        const resto = paginas > 1
          ? await Promise.all(
              Array.from({ length: paginas - 1 }, (_, i) =>
                supabase.from("pickup_entries")
                  .select("fecha_llegada, fecha_pickup, canal, num_reservas, fecha_salida, noches, precio_total, estado")
                  .eq("hotel_id", session.user.id)
                  .range((i + 1) * PAGINA, (i + 2) * PAGINA - 1)
                  .then(r => r.data || [])
              )
            )
          : [];
        pickupEntries = [...pe0, ...resto.flat()];
      }
    } catch(_) {}

    const nuevoDatos = {
      produccion: produccion || [],
      presupuesto: presupuesto || [],
      pickupEntries,
      hotel: hotelData,
      grupos: gruposData || [],
    };

    // Guardar en caché
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify(nuevoDatos));
      localStorage.setItem(CACHE_TS_KEY, Date.now().toString());
    } catch(_) {}

    setDatos({ ...nuevoDatos, session });
    setCargandoDatos(false);
    setRefreshKey(k => k + 1);

    // Restaurar scroll
    setTimeout(() => {
      const el = document.getElementById("main-scroll");
      const scroll = localStorage.getItem("fr_scroll");
      if (el && scroll) el.scrollTop = parseInt(scroll);
    }, 50);
  };

  const handleLogout = async () => { await supabase.auth.signOut(); };

  const [mesDetalle, setMesDetalle] = useState(null);
  const [generandoPDF, setGenerandoPDF] = useState(false);
  const [mostrarAlertas, setMostrarAlertas] = useState(false);
  const [mostrarPerfil, setMostrarPerfil] = useState(false);
  useEffect(() => {
    if (!mostrarPerfil && !mostrarAlertas) return;
    const handler = (e) => {
      if (!e.target.closest("[data-menu]")) {
        setMostrarPerfil(false);
        setMostrarAlertas(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [mostrarPerfil, mostrarAlertas]);
  const [perfilSeccion, setPerfilSeccion] = useState(null); // null | "suscripcion" | "extranets"
  const [kpiModalApp, setKpiModalApp] = useState(null);
  const [kpiModal, setKpiModal] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const views = {
    dashboard: (props) => <DashboardView {...props} onMesDetalle={(m, a) => setMesDetalle({ mes: m, anio: a })} kpiModal={kpiModal} setKpiModal={setKpiModal} kpiModalExterno={kpiModalApp} onKpiModalExternoHandled={() => setKpiModalApp(null)} />,
    pickup:    (props) => <PickupView    {...props} />,
    budget:    (props) => <BudgetView    {...props} />,
    grupos:    (props) => <GruposView    {...props} onRecargar={() => cargarDatos(true)} />,
  };
  const View = views[view];

  if (loading) return (
    <div style={{ minHeight: "100vh", background: C.bgDeep, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ color: C.accent, fontFamily: "'Playfair Display', serif", fontSize: 20 }}>Cargando...</div>
    </div>
  );

  if (!session) return <AuthScreen />;
  if (!cargandoSub && (!suscripcion || suscripcion.estado === "cancelada")) return <PantallaSubscripcion session={session} />;

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", background: C.bg, minHeight: "100vh" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700;800&family=DM+Sans:wght@300;400;500;600&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; } html, body, #root { width: 100%; min-height: 100vh; }
        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-track { background: ${C.bg}; }
        ::-webkit-scrollbar-thumb { background: ${C.accentLight}; border-radius: 3px; }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pulse-rayo { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.5; transform: scale(0.8); } }
        @media (max-width: 640px) {
          /* Contenedor raíz — evita desbordamiento lateral */
          html, body, #root { overflow-x: hidden !important; max-width: 100vw !important; }
          main, #main-scroll { padding: 12px !important; width: 100% !important; overflow-x: hidden !important; box-sizing: border-box !important; }

          /* Topbar */
          .topbar-fecha { display: none !important; }
          .topbar-center { left: 50% !important; }
          nav button { padding: 4px 8px !important; font-size: 11px !important; }
          header > div { padding: 0 12px !important; }

          /* KPIs 2x2, el último ocupa todo el ancho */
          .kpi-grid { grid-template-columns: repeat(2, 1fr) !important; gap: 10px !important; }
          .kpi-grid > div:last-child:nth-child(odd) { grid-column: 1 / -1 !important; }

          /* Selector de meses compacto */
          .meses-grid { grid-template-columns: repeat(4, 1fr) !important; min-width: unset !important; gap: 4px !important; }
          .meses-grid button { padding: 5px 2px !important; font-size: 10px !important; }

          /* Cabecera en columna */
          .dash-header { flex-direction: column !important; align-items: flex-start !important; gap: 12px !important; }

          /* Grids en columna */
          .dash-charts-grid { grid-template-columns: 1fr !important; }

          /* Todos los grids multi-columna → 1 columna */
          div[style*="grid-template-columns: 1fr 1fr"] { grid-template-columns: 1fr !important; }
          div[style*="gridTemplateColumns: "1fr 1fr""] { grid-template-columns: 1fr !important; }

          /* Cards y contenedores al 100% */
          div[style*="max-width"] { max-width: 100% !important; }

          /* Recharts — altura fija en móvil para evitar colapso */
          .recharts-wrapper { width: 100% !important; }
          .recharts-wrapper svg { width: 100% !important; }

          /* Budget KPIs 3 cards → 1 columna */
          .budget-kpis { grid-template-columns: 1fr !important; }

          /* Pickup gráfica+pico → columna */
          .pickup-chart-row { flex-direction: column !important; gap: 16px !important; }
          .pickup-chart-row > div:first-child { border-right: none !important; border-bottom: 1px solid #E0E0E0 !important; padding-right: 0 !important; padding-bottom: 16px !important; }

          /* Tablas con scroll horizontal */
          table { font-size: 11px !important; }
          div[style*="overflowX"] { overflow-x: auto !important; -webkit-overflow-scrolling: touch !important; }
        }
        @media (max-width: 768px) {
          .topbar-date { display: none !important; }
          .topbar-nav-label { display: none !important; }
          .topbar-nav-icon { display: inline !important; }
          .topbar-importar-label { display: none !important; }
          .topbar-importar-icon { display: inline !important; }
          .topbar-perfil-label { display: none !important; }
        }
      `}</style>

      {/* Topbar */}
      <header style={{ background: C.bg, minHeight: 52, position: "sticky", top: 0, zIndex: 100, borderBottom: `1px solid ${C.border}` }}><div style={{ width: "100%", minHeight: 52, display: "flex", alignItems: "center", padding: "0 clamp(12px, 4vw, 32px)", gap: 6, flexWrap: "nowrap" }}>
        {/* Logo centro */}
        <div style={{ position: "absolute", left: "50%", transform: "translateX(-50%)", pointerEvents: "none", display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontFamily: "'Arial', sans-serif", fontWeight: 800, fontSize: "clamp(13px, 3.5vw, 18px)", letterSpacing: 2, color: "#000000", textTransform: "uppercase", lineHeight: 1, whiteSpace: "nowrap" }}>FastRevenue</span>
          <span className="topbar-date" style={{ fontSize: 12, color: "#000000", fontWeight: 500, fontFamily: "'DM Sans', sans-serif", letterSpacing: 0.3, whiteSpace: "nowrap" }}>
            {new Date().toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long", year: "numeric" }).replace(/^\w/, c => c.toUpperCase())}
          </span>
        </div>

        {/* Nav links */}
        <nav style={{ display: "flex", alignItems: "center", gap: 2, flex: 1 }}>
          {NAV.map(n => {
            const navColor = n.key==="budget" ? "#1A7A3C" : n.key==="pickup" ? "#B8860B" : n.key==="grupos" ? "#7C3AED" : C.accent;
            const isActive = view===n.key;
            return (
              <button key={n.key} onClick={() => { setView(n.key); setMesDetalle(null); localStorage.setItem("fr_view", n.key); }}
                style={{ padding: "6px clamp(6px,2vw,16px)", borderRadius: 7, border: "none", cursor: "pointer", background: isActive ? navColor+"18" : "transparent", color: isActive ? navColor : C.textLight, fontSize: "clamp(11px,2.5vw,13px)", fontWeight: isActive ? 700 : 400, fontFamily: "'DM Sans', sans-serif", transition: "all 0.15s", whiteSpace: "nowrap", outline: isActive ? `1.5px solid ${navColor}44` : "1.5px solid transparent" }}
                onMouseEnter={e=>{ if(!isActive){ e.currentTarget.style.color=C.text; } }}
                onMouseLeave={e=>{ e.currentTarget.style.color=isActive?navColor:C.textLight; }}>
                <span className="topbar-nav-label">{n.label}</span>
                <span style={{ display:"none" }} className="topbar-nav-icon">{n.label.slice(0,3)}</span>
              </button>
            );
          })}
        </nav>

        {/* Botones + Email + logout */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginLeft: "auto" }}>
          {(() => { const alertas = calcularAlertas(datos, mesSel, anioSel); const n = alertas.length; return (
            <div data-menu style={{ position:"relative" }}>
              <button onClick={() => setMostrarAlertas(v=>!v)} style={{ background:"none", border:`1px solid ${n>0?C.red:C.border}`, borderRadius:7, padding:"5px 10px", cursor:"pointer", color:n>0?C.red:C.textLight, fontSize:13, position:"relative" }} title="Alertas">
                🔔{n > 0 && <span style={{ position:"absolute", top:-4, right:-4, background:C.red, color:"#fff", borderRadius:"50%", width:16, height:16, fontSize:9, fontWeight:700, display:"flex", alignItems:"center", justifyContent:"center" }}>{n}</span>}
              </button>
              {mostrarAlertas && <AlertasPanel alertas={alertas} onClose={()=>setMostrarAlertas(false)} onNavegar={(accion) => {
                if (accion === "pickup") { setView("pickup"); localStorage.setItem("fr_view","pickup"); }
                else if (accion === "importar") { setImportar(true); }
                else if (accion.startsWith("kpi:")) { setView("dashboard"); setKpiModalApp(accion.split(":")[1]); }
              }} />}
            </div>
          ); })()}
          <button onClick={() => setImportar(true)} style={{ background: C.accent, color: "#fff", border: "none", borderRadius: 7, padding: "5px 10px", fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans',sans-serif", whiteSpace: "nowrap" }}>
            <span className="topbar-importar-label">Importar</span>
            <span style={{ display:"none" }} className="topbar-importar-icon">↑</span>
          </button>


          {/* Menú Mi Perfil */}
          <div data-menu style={{ position:"relative" }}>
            <button onClick={() => setMostrarPerfil(v=>!v)}
              style={{ display:"flex", alignItems:"center", gap:6, padding:"5px 8px", borderRadius:7, border:`1px solid ${C.border}`, background:"transparent", color:C.text, cursor:"pointer", fontSize:12, fontWeight:500, fontFamily:"'DM Sans',sans-serif", transition:"all 0.15s", letterSpacing:0.2 }}>
              <span style={{ width:26, height:26, borderRadius:"50%", background:C.accent, color:"#fff", fontSize:11, fontWeight:700, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                {session.user.email[0].toUpperCase()}
              </span>
              <span className="topbar-perfil-label">Mi perfil</span>
            </button>
            {mostrarPerfil && (
              <div style={{ position:"absolute", top:42, right:0, width:240, background:C.bgCard, border:`1px solid ${C.border}`, borderRadius:10, boxShadow:"0 4px 24px rgba(0,0,0,0.08)", zIndex:200, overflow:"hidden" }}>
                {/* Email */}
                <div style={{ padding:"10px 16px", borderBottom:`1px solid ${C.border}`, background:C.bg }}>
                  <p style={{ fontSize:11, color:C.textLight, marginBottom:2 }}>Conectado como</p>
                  <p style={{ fontSize:12, fontWeight:600, color:C.text, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{session.user.email}</p>
                </div>
                {/* Opciones */}
                {[
                  { label:"Suscripción", key:"suscripcion" },
                  { label:"Extranets", key:"extranets" },
                  { label:"Informe mensual", key:"informe" },
                ].map(op => (
                  <button key={op.key} onClick={async () => {
                      if (op.key === "informe") {
                        setMostrarPerfil(false);
                        setGenerandoPDF(true);
                        await generarReportePDF(datos, mesSel, anioSel, datos.hotel?.nombre||"Mi Hotel");
                        setGenerandoPDF(false);
                      } else {
                        setPerfilSeccion(op.key);
                        setMostrarPerfil(false);
                      }
                    }}
                    style={{ width:"100%", display:"flex", alignItems:"center", padding:"10px 16px", background:"transparent", border:"none", borderBottom:`1px solid ${C.border}`, cursor:"pointer", fontSize:12, color:C.text, fontFamily:"'DM Sans',sans-serif", textAlign:"left", letterSpacing:0.2 }}
                    onMouseEnter={e=>e.currentTarget.style.background=C.bg}
                    onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                    {op.key === "informe" && generandoPDF ? "Generando..." : op.label}
                  </button>
                ))}
                <button onClick={handleLogout}
                  style={{ width:"100%", display:"flex", alignItems:"center", padding:"10px 16px", background:"transparent", border:"none", cursor:"pointer", fontSize:12, color:C.red, fontFamily:"'DM Sans',sans-serif", textAlign:"left", letterSpacing:0.2 }}
                  onMouseEnter={e=>e.currentTarget.style.background=C.redLight}
                  onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                  Cerrar sesión
                </button>
              </div>
            )}
          </div>
        </div>
      </div></header>

      {/* Main */}
      <main id="main-scroll" onScroll={e => localStorage.setItem("fr_scroll", e.currentTarget.scrollTop)} style={{ padding: "clamp(14px,4vw,28px) clamp(12px,4vw,32px)", width: "100%", boxSizing: "border-box" }}>


        {cargandoDatos ? <LoadingSpinner /> : mesDetalle ? (
          <div style={{ width:"100%" }}><MonthDetailView datos={datos} mes={mesDetalle.mes} anio={mesDetalle.anio} onBack={() => setMesDetalle(null)} /></div>
        ) : (
          <div style={{ width:"100%" }}><View datos={datos} mes={mesSel} anio={anioSel} onGuardado={cargarDatos} onPeriodo={(m,a) => { setMesSel(m); setAnioSel(a); localStorage.setItem("rm_mes", m); localStorage.setItem("rm_anio", a); }} /></div>
        )}
      </main>


      {/* Modal Suscripción */}
      {perfilSeccion === "suscripcion" && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.6)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:1000 }}>
          <div style={{ background:C.bgCard, borderRadius:16, padding:"36px 40px", width:440, boxShadow:"0 24px 60px rgba(0,0,0,0.2)", fontFamily:"'DM Sans',sans-serif" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:24 }}>
              <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:20, fontWeight:700, color:C.text }}>Gestión de suscripción</h2>
              <button onClick={()=>setPerfilSeccion(null)} style={{ background:"none", border:"none", fontSize:20, cursor:"pointer", color:C.textLight }}>✕</button>
            </div>
            <div style={{ background:C.bg, borderRadius:10, padding:"16px 20px", marginBottom:20 }}>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:8 }}>
                <span style={{ fontSize:12, color:C.textMid }}>Plan</span>
                <span style={{ fontSize:12, fontWeight:700, color:C.text, textTransform:"capitalize" }}>{suscripcion?.plan || "—"}</span>
              </div>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:8 }}>
                <span style={{ fontSize:12, color:C.textMid }}>Estado</span>
                <span style={{ fontSize:12, fontWeight:700, color: suscripcion?.estado==="activa"||suscripcion?.estado==="trial" ? C.green : C.red }}>
                  {suscripcion?.estado === "trial" ? "Periodo de prueba" : suscripcion?.estado === "activa" ? "Activa" : suscripcion?.estado || "—"}
                </span>
              </div>
              {suscripcion?.trial_end && suscripcion.estado === "trial" && (
                <div style={{ display:"flex", justifyContent:"space-between", marginBottom:8 }}>
                  <span style={{ fontSize:12, color:C.textMid }}>Prueba hasta</span>
                  <span style={{ fontSize:12, fontWeight:700, color:C.text }}>{new Date(suscripcion.trial_end).toLocaleDateString("es-ES")}</span>
                </div>
              )}
              {suscripcion?.periodo_fin && suscripcion.estado === "activa" && (
                <div style={{ display:"flex", justifyContent:"space-between" }}>
                  <span style={{ fontSize:12, color:C.textMid }}>Próxima renovación</span>
                  <span style={{ fontSize:12, fontWeight:700, color:C.text }}>{new Date(suscripcion.periodo_fin).toLocaleDateString("es-ES")}</span>
                </div>
              )}
            </div>
            <div style={{ background:C.accentLight, borderRadius:10, padding:"12px 16px", marginBottom:20, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <div>
                <p style={{ fontSize:13, fontWeight:700, color:C.accent }}>FastRevenue Básico</p>
                <p style={{ fontSize:11, color:C.textMid }}>€49/mes + IVA</p>
              </div>
              <span style={{ fontSize:11, fontWeight:600, color:C.green, background:C.greenLight, padding:"3px 10px", borderRadius:20 }}>Activo</span>
            </div>
            <p style={{ fontSize:11, color:C.textLight, textAlign:"center", marginBottom:16 }}>Para cancelar tu suscripción contacta con soporte</p>
            <a href="mailto:soporte@fastrevenue.app" style={{ display:"block", textAlign:"center", fontSize:12, color:C.accent, fontWeight:600 }}>soporte@fastrevenue.app</a>
          </div>
        </div>
      )}

      {/* Modal Extranets */}
      {perfilSeccion === "extranets" && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.6)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:1000 }}>
          <div style={{ background:C.bgCard, borderRadius:16, padding:"36px 40px", width:480, boxShadow:"0 24px 60px rgba(0,0,0,0.2)", fontFamily:"'DM Sans',sans-serif" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
              <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:20, fontWeight:700, color:C.text }}>Extranets</h2>
              <button onClick={()=>setPerfilSeccion(null)} style={{ background:"none", border:"none", fontSize:20, cursor:"pointer", color:C.textLight }}>✕</button>
            </div>
            <p style={{ fontSize:12, color:C.textMid, marginBottom:24 }}>Accede directamente a la extranet de cada canal</p>
            {[
              { nombre:"Brand Web", desc:"Motor de reservas directo", url:"#", logo:"🌐", color:"#004B87" },
              { nombre:"Booking.com", desc:"Extranet de Booking.com", url:"https://admin.booking.com", logo:"🔵", color:"#003580" },
              { nombre:"Expedia", desc:"Extranet de Expedia Group", url:"https://www.expediapartnercentral.com", logo:"🟡", color:"#FFD700" },
            ].map((ex, i) => (
              <a key={i} href={ex.url} target={ex.url==="#"?"_self":"_blank"} rel="noreferrer"
                style={{ display:"flex", alignItems:"center", gap:14, padding:"14px 16px", borderRadius:10, border:`1px solid ${C.border}`, marginBottom:10, textDecoration:"none", background:C.bg, transition:"all 0.15s" }}
                onMouseEnter={e=>{ e.currentTarget.style.background=C.accentLight; e.currentTarget.style.borderColor=C.accent; }}
                onMouseLeave={e=>{ e.currentTarget.style.background=C.bg; e.currentTarget.style.borderColor=C.border; }}>
                <div style={{ width:40, height:40, borderRadius:8, background:ex.color+"18", display:"flex", alignItems:"center", justifyContent:"center", fontSize:22, flexShrink:0 }}>{ex.logo}</div>
                <div style={{ flex:1 }}>
                  <p style={{ fontSize:13, fontWeight:700, color:C.text, marginBottom:2 }}>{ex.nombre}</p>
                  <p style={{ fontSize:11, color:C.textMid }}>{ex.desc}</p>
                </div>
                <span style={{ fontSize:11, color:C.textLight }}>→</span>
              </a>
            ))}
          </div>
        </div>
      )}
      {importar && <ImportarExcel onClose={() => setImportar(false)} session={session} onImportado={() => { localStorage.removeItem("fr_datos_cache"); localStorage.removeItem("fr_datos_ts"); localStorage.removeItem("fr_scroll"); cargarDatos(true); }} />}
    </div>
  );
}