import { useState, useEffect } from "react";
import { C } from "../constants";
import { useT } from "../i18n";
import { SimpleBar, CustomTooltip } from "./charts";
import {
  BarChart, Bar, ComposedChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";

const KPI_TKEYS = {
  "Ocupación":"kpi_ocupacion", "ADR":"kpi_adr", "RevPAR":"kpi_revpar", "TRevPAR":"kpi_trevpar",
  "Revenue Diario":"kpi_rev_diario", "Revenue Mensual":"kpi_rev_mensual", "Revenue Total":"kpi_rev_total",
};

export function KpiModal({ kpi, datos, mes, anio, onClose }) {
  const t = useT();
  const kpiLabel = t(KPI_TKEYS[kpi]) || kpi;

  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);
  const { produccion, presupuesto } = datos;
  const MESES_FULL = t("meses_full");

  const [modoVista, setModoVista] = useState("30dias");

  const todasProd = (produccion||[]).sort((a,b)=>new Date(a.fecha)-new Date(b.fecha));
  const _pad2 = n => String(n).padStart(2,"0");
  const _hoyLocal = new Date();
  const _hoyStr = `${_hoyLocal.getFullYear()}-${_pad2(_hoyLocal.getMonth()+1)}-${_pad2(_hoyLocal.getDate())}`;
  const refDateStr = _hoyStr;
  const _ref = new Date(refDateStr+"T00:00:00");
  const _desde = new Date(_ref); _desde.setDate(_ref.getDate()-29);
  const desde30Str = `${_desde.getFullYear()}-${_pad2(_desde.getMonth()+1)}-${_pad2(_desde.getDate())}`;

  const diasMes = todasProd
    .filter(d => {
      const f=new Date(d.fecha+"T00:00:00");
      if (modoVista === "mes") return f.getMonth()===mes && f.getFullYear()===anio;
      return d.fecha >= desde30Str && d.fecha <= refDateStr;
    })
    .map(d => {
      const f = new Date(d.fecha+"T00:00:00");
      const habDis = d.hab_disponibles || datos.hotel?.habitaciones || 30;
      return {
        dia: `${f.getDate()}/${f.getMonth()+1}`,
        diaSemana: f.getDay(),
        fecha: f.toLocaleDateString("es-ES",{day:"numeric",month:"long",year:"numeric"}),
        occ:    habDis>0 ? Math.round(d.hab_ocupadas/habDis*100) : 0,
        adr:    d.hab_ocupadas>0 ? Math.round(d.revenue_hab/d.hab_ocupadas) : 0,
        revpar: habDis>0 ? Math.round(d.revenue_hab/habDis) : 0,
        trevpar:habDis>0 ? Math.round((d.revenue_hab+(d.revenue_fnb||0))/habDis) : 0,
        revHab: Math.round(d.revenue_hab||0),
        revFnb: Math.round(d.revenue_fnb||0),
        revTotal: Math.round(d.revenue_total||0),
      };
    });

  const mapProd = d => {
    const habDis = d.hab_disponibles || datos.hotel?.habitaciones || 30;
    return {
      dia: new Date(d.fecha+"T00:00:00").getDate(),
      occ: habDis>0?Math.round(d.hab_ocupadas/habDis*100):0,
      adr: d.hab_ocupadas>0?Math.round(d.revenue_hab/d.hab_ocupadas):0,
      revpar: habDis>0?Math.round(d.revenue_hab/habDis):0,
      trevpar: habDis>0?Math.round((d.revenue_hab+(d.revenue_fnb||0))/habDis):0,
      revHab:  Math.round(d.revenue_hab||0),
      revFnb:  Math.round(d.revenue_fnb||0),
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

  const diasLY = todasProd
    .filter(d => { const f=new Date(d.fecha+"T00:00:00"); return f.getMonth()===mes && f.getFullYear()===anio-1; })
    .map(mapProd);

  const fk = kpi==="Ocupación"?"occ":kpi==="ADR"?"adr":kpi==="RevPAR"?"revpar":kpi==="TRevPAR"?"trevpar":"revTotal";

  const getChartData = () => {
    const lyField = fk;
    return diasMes.map((d,i)=>({
      ...d,
      mp: diasComp[i]?.[lyField] ?? null,
      ly: diasLY[i]?.[lyField] ?? null,
    }));
  };
  const chartData = getChartData();

  const fieldKey = fk;

  const diasMesCompleto = todasProd
    .filter(d => { const f=new Date(d.fecha+"T00:00:00"); return f.getMonth()===mes && f.getFullYear()===anio; })
    .map(mapProd);
  const diasMesCompLetoMP = todasProd
    .filter(d => { const f=new Date(d.fecha+"T00:00:00"); return f.getMonth()===mesPrevIdx && f.getFullYear()===(mes===0?anio-1:anio); })
    .map(mapProd);

  const srcActual = modoVista === "30dias" ? diasMes : diasMesCompleto;
  const srcComp   = diasMesCompLetoMP;

  const mediaActual = srcActual.length>0 ? srcActual.reduce((a,d)=>a+(d[fk]||0),0)/srcActual.length : 0;
  const mediaComp   = srcComp.length>0   ? srcComp.reduce((a,d)=>a+(d[fk]||0),0)/srcComp.length   : 0;
  const varComp = mediaComp>0?((mediaActual-mediaComp)/mediaComp*100).toFixed(1):null;

  const pptoVal = kpi==="Ocupación"?ppto?.occ_ppto:kpi==="ADR"?ppto?.adr_ppto:kpi==="RevPAR"?ppto?.revpar_ppto:kpi==="Revenue Total"?ppto?.rev_total_ppto:null;
  const varPpto = pptoVal&&mediaActual?((mediaActual-pptoVal)/pptoVal*100).toFixed(1):null;

  const unit = kpi==="Ocupación"?"%":"€";

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.5)", zIndex:1000, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
      <div style={{ background:C.bgCard, borderRadius:14, width:"100%", maxWidth:820, maxHeight:"90vh", overflow:"auto", padding:28, boxShadow:"0 20px 60px rgba(0,0,0,0.2)" }} onClick={e=>e.stopPropagation()}>

        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
          <div>
            <p style={{ fontSize:11, color:C.textLight, textTransform:"uppercase", letterSpacing:2 }}>{MESES_FULL[mes]} {anio}</p>
            <h3 style={{ fontSize:22, fontWeight:800, color:C.text, fontFamily:"'Plus Jakarta Sans',sans-serif", letterSpacing:-0.5 }}>{kpiLabel}</h3>
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            <button onClick={onClose} style={{ background:"none", border:`1.5px solid ${C.border}`, borderRadius:8, width:34, height:34, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", fontSize:16, color:C.textMid, fontWeight:300, transition:"all 0.15s" }}
              onMouseEnter={e=>{ e.currentTarget.style.background=C.accent; e.currentTarget.style.borderColor=C.accent; e.currentTarget.style.color="#fff"; }}
              onMouseLeave={e=>{ e.currentTarget.style.background="none"; e.currentTarget.style.borderColor=C.border; e.currentTarget.style.color=C.textMid; }}>
              ×
            </button>
          </div>
        </div>

        {kpi === "Revenue Total" ? (() => {
          const totalHabS  = diasMes.reduce((a,d)=>a+d.revHab,0);
          const totalFnbS  = diasMes.reduce((a,d)=>a+d.revFnb,0);
          return (
            <div style={{ display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:12, marginBottom:20 }}>
              {[
                { label:"Total del mes", value:`€${Math.round(totalHabS+totalFnbS).toLocaleString("es-ES")}` },
                { label:`Vs ${MESES_FULL[mesPrevIdx]}`, value: varComp!==null ? `${parseFloat(varComp)>=0?"+":""}${varComp}%` : "Sin datos", up: varComp!==null?parseFloat(varComp)>=0:true },
                { label:"Habitaciones", value:`€${Math.round(totalHabS).toLocaleString("es-ES")}`, color:C.accent },
                { label:"F&B", value:`€${Math.round(totalFnbS).toLocaleString("es-ES")}`, color:"#E85D04" },
              ].map((k,i)=>(
                <div key={i} style={{ background:"#f5f5f5", border:"1.5px solid #111111", borderRadius:8, padding:"14px 18px", boxShadow:"0 1px 4px rgba(0,0,0,0.06)", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", textAlign:"center", transition:"box-shadow 0.2s, transform 0.2s" }}
                  onMouseEnter={e=>{e.currentTarget.style.boxShadow="0 6px 24px rgba(0,0,0,0.18)";e.currentTarget.style.transform="translateY(-2px)";}}
                  onMouseLeave={e=>{e.currentTarget.style.boxShadow="0 1px 4px rgba(0,0,0,0.06)";e.currentTarget.style.transform="translateY(0)";}}>
                  <p style={{ fontSize:11, color:C.text, textTransform:"uppercase", letterSpacing:"1.5px", marginBottom:6, fontWeight:700 }}>{k.label}</p>
                  <p style={{ fontSize:"clamp(18px,4vw,24px)", fontWeight:700, color:k.color||(k.up===false?C.red:k.up===true?C.green:C.text), fontFamily:"'Plus Jakarta Sans',sans-serif", letterSpacing:"-1px", lineHeight:1, margin:0 }}>{k.value}</p>
                </div>
              ))}
            </div>
          );
        })() : kpi === "Revenue Mensual" ? (() => {
          const totalHabM = diasMesCompleto.reduce((a,d)=>a+d.revHab,0);
          const totalFnbM = diasMesCompleto.reduce((a,d)=>a+d.revFnb,0);
          const totalM    = totalHabM + totalFnbM;
          const totalLM   = diasMesCompLetoMP.reduce((a,d)=>a+d.revHab+d.revFnb,0);
          const totalLY   = diasLY.reduce((a,d)=>a+(d.revHab||0)+(d.revFnb||0),0);
          const vsLMv = totalLM>0?((totalM-totalLM)/totalLM*100).toFixed(1):null;
          const vsLYv = totalLY>0?((totalM-totalLY)/totalLY*100).toFixed(1):null;
          return (
            <div style={{ display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:12, marginBottom:20 }}>
              {[
                { label:"Total del mes", value:`€${Math.round(totalM).toLocaleString("es-ES")}` },
                { label:`Vs ${MESES_FULL[mesPrevIdx]}`, value:vsLMv?`${parseFloat(vsLMv)>=0?"+":""}${vsLMv}%`:"Sin datos", up:vsLMv?parseFloat(vsLMv)>=0:true },
                { label:"Habitaciones", value:`€${Math.round(totalHabM).toLocaleString("es-ES")}`, color:C.accent },
                { label:"F&B", value:`€${Math.round(totalFnbM).toLocaleString("es-ES")}`, color:"#E85D04" },
              ].map((k,i)=>(
                <div key={i} style={{ background:"#f5f5f5", border:"1.5px solid #111111", borderRadius:8, padding:"14px 18px", boxShadow:"0 1px 4px rgba(0,0,0,0.06)", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", textAlign:"center", transition:"box-shadow 0.2s, transform 0.2s" }}
                  onMouseEnter={e=>{e.currentTarget.style.boxShadow="0 6px 24px rgba(0,0,0,0.18)";e.currentTarget.style.transform="translateY(-2px)";}}
                  onMouseLeave={e=>{e.currentTarget.style.boxShadow="0 1px 4px rgba(0,0,0,0.06)";e.currentTarget.style.transform="translateY(0)";}}>
                  <p style={{ fontSize:11, color:C.text, textTransform:"uppercase", letterSpacing:"1.5px", marginBottom:6, fontWeight:700 }}>{k.label}</p>
                  <p style={{ fontSize:"clamp(18px,4vw,24px)", fontWeight:700, color:k.color||(k.up===false?C.red:k.up===true?C.green:C.text), fontFamily:"'Plus Jakarta Sans',sans-serif", letterSpacing:"-1px", lineHeight:1, margin:0 }}>{k.value}</p>
                </div>
              ))}
              {vsLYv && <div style={{ gridColumn:"1/-1", display:"flex", gap:8, alignItems:"center" }}>
                <span style={{ fontSize:11, color:C.textLight }}>vs LY ({anio-1}):</span>
                <span style={{ fontSize:12, fontWeight:700, padding:"2px 8px", borderRadius:4, background:parseFloat(vsLYv)>=0?C.greenLight:C.redLight, color:parseFloat(vsLYv)>=0?C.green:C.red }}>{parseFloat(vsLYv)>=0?"+":""}{vsLYv}%</span>
              </div>}
            </div>
          );
        })() : (() => {
          const mediaLY = diasLY.length>0 ? diasLY.reduce((a,d)=>a+(d[fk]||0),0)/diasLY.length : 0;
          const varLY = mediaLY>0 ? ((mediaActual-mediaLY)/mediaLY*100).toFixed(1) : null;
          const cards = [
            { label: modoVista==="30dias" ? "Media 30 días" : "Media del mes", value:`${kpi==="Ocupación"?mediaActual.toFixed(1):Math.round(mediaActual).toLocaleString("es-ES")}${unit}` },
            { label:`Vs ${compLabel}`, value: varComp!==null ? `${parseFloat(varComp)>=0?"+":""}${varComp}%` : "Sin datos", up: varComp!==null?parseFloat(varComp)>=0:true },
            { label:`Vs LY (${anio-1})`, value: varLY!==null ? `${parseFloat(varLY)>=0?"+":""}${varLY}%` : "Sin datos", up: varLY!==null?parseFloat(varLY)>=0:true },
          ];
          return (
            <div style={{ display:"grid", gridTemplateColumns:`repeat(${cards.length},1fr)`, gap:12, marginBottom:20 }}>
              {cards.map((k,i)=>(
                <div key={i} style={{ background:"#f5f5f5", border:"1.5px solid #111111", borderRadius:8, padding:"14px 18px", boxShadow:"0 1px 4px rgba(0,0,0,0.06)", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", textAlign:"center", transition:"box-shadow 0.2s, transform 0.2s" }}
                  onMouseEnter={e=>{e.currentTarget.style.boxShadow="0 6px 24px rgba(0,0,0,0.18)";e.currentTarget.style.transform="translateY(-2px)";}}
                  onMouseLeave={e=>{e.currentTarget.style.boxShadow="0 1px 4px rgba(0,0,0,0.06)";e.currentTarget.style.transform="translateY(0)";}}>
                  <p style={{ fontSize:11, color:C.text, textTransform:"uppercase", letterSpacing:"1.5px", marginBottom:6, fontWeight:700 }}>{k.label}</p>
                  <p style={{ fontSize:"clamp(18px,4vw,24px)", fontWeight:700, color:k.up===false?C.red:k.up===true?C.green:C.text, fontFamily:"'Plus Jakarta Sans',sans-serif", letterSpacing:"-1px", lineHeight:1, margin:0 }}>{k.value}</p>
                </div>
              ))}
            </div>
          );
        })()}

        <div style={{ marginBottom:16 }}>
          {kpi==="Revenue Mensual" ? (() => {
            const dailyData = diasMesCompleto.map(d=>({ dia:d.dia, mesNombre:`${d.dia} ${MESES_FULL[mes]} ${anio}`, revHab:d.revHab, revFnb:d.revFnb }));
            return (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={dailyData} barSize={10} barCategoryGap="20%">
                  <defs>
                    <linearGradient id="gradHabD" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#1A7A3C" stopOpacity={1}/>
                      <stop offset="100%" stopColor="#1A7A3C" stopOpacity={0.7}/>
                    </linearGradient>
                    <linearGradient id="gradFnbD" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#E85D04" stopOpacity={0.9}/>
                      <stop offset="100%" stopColor="#E85D04" stopOpacity={0.55}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={C.border} vertical={false}/>
                  <XAxis dataKey="dia" tick={{ fill:C.textLight, fontSize:10 }} axisLine={false} tickLine={false} interval={Math.ceil(dailyData.length/10)-1}/>
                  <YAxis tick={{ fill:C.textLight, fontSize:10 }} axisLine={false} tickLine={false} tickFormatter={v=>v>=1000?`${(v/1000).toFixed(0)}k€`:v} width={42}/>
                  <Tooltip content={<CustomTooltip/>} cursor={false}/>
                  <Legend wrapperStyle={{ fontSize:11, color:C.textMid, paddingTop:8 }}/>
                  <Bar dataKey="revHab" name="Hab." stackId="a" fill="url(#gradHabD)" radius={[0,0,0,0]} shape={(p)=><SimpleBar {...p}/>}/>
                  <Bar dataKey="revFnb" name="F&B"  stackId="a" fill="url(#gradFnbD)" radius={[4,4,0,0]} shape={(p)=><SimpleBar {...p}/>}/>
                </BarChart>
              </ResponsiveContainer>
            );
          })() : kpi==="Revenue Total" ? (() => {
            const MESES_SHORT = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
            const revPorMes = Array.from({length:12},(_,i)=>{
              const mIdx = ((mes-11+i)%12+12)%12;
              const aIdx = anio + Math.floor((mes-11+i)/12);
              const dias = todasProd.filter(d=>{ const f=new Date(d.fecha+"T00:00:00"); return f.getMonth()===mIdx && f.getFullYear()===aIdx; });
              return {
                mes: MESES_SHORT[mIdx],
                mesNombre: MESES_FULL[mIdx],
                anioIdx: aIdx,
                revHab:   Math.round(dias.reduce((a,d)=>a+(d.revenue_hab||0),0)),
                revFnb:   Math.round(dias.reduce((a,d)=>a+(d.revenue_fnb||0),0)),
              };
            }).filter(d=>d.revHab+d.revFnb>0);
            return (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={revPorMes} barSize={18} barCategoryGap="32%">
                  <defs>
                    <linearGradient id="gradHab" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#1A7A3C" stopOpacity={1}/>
                      <stop offset="100%" stopColor="#1A7A3C" stopOpacity={0.7}/>
                    </linearGradient>
                    <linearGradient id="gradFnb" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#B8860B" stopOpacity={0.9}/>
                      <stop offset="100%" stopColor="#B8860B" stopOpacity={0.55}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={C.border} vertical={false}/>
                  <XAxis dataKey="mes" tick={{ fill: C.textLight, fontSize: 11 }} axisLine={false} tickLine={false}/>
                  <YAxis tick={{ fill: C.textLight, fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v=>v>=1000?`${(v/1000).toFixed(0)}k€`:v} width={48}/>
                  <Tooltip content={<CustomTooltip/>} cursor={false}/>
                  <Bar dataKey="revHab" name="Hab."   stackId="a" fill="url(#gradHab)" radius={[0,0,0,0]} activeBar={false}/>
                  <Bar dataKey="revFnb" name="F&B"    stackId="a" fill="url(#gradFnb)" radius={[4,4,0,0]} activeBar={false}/>
                  <Legend wrapperStyle={{ fontSize: 11, color: C.textMid, paddingTop: 8 }}/>
                </BarChart>
              </ResponsiveContainer>
            );
          })() : (<>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:10 }}>
              <div style={{ display:"flex", gap:6 }}>
                {[["30dias","Últimos 30 días"],["mes","Mes actual"]].map(([key,label])=>(
                  <button key={key} onClick={()=>setModoVista(key)}
                    style={{ padding:"4px 12px", borderRadius:6, border:`1px solid ${modoVista===key?C.accent:C.border}`, background:modoVista===key?C.accentLight:"transparent", color:modoVista===key?C.accent:C.textLight, fontSize:11, fontWeight:modoVista===key?600:400, cursor:"pointer", fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
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
                  <div style={{ width:18, height:2, background:"#D32F2F", borderRadius:1 }}/>
                  <span style={{ fontSize:10, color:C.textMid }}>Año anterior</span>
                </div>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <ComposedChart data={chartData}>
                <defs>
                  <linearGradient id="kpiGradBar" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#004B87" stopOpacity={0.9}/>
                    <stop offset="100%" stopColor="#004B87" stopOpacity={0.55}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={C.border} vertical={false}/>
                <XAxis dataKey="dia" tick={{ fill: C.textLight, fontSize: 11 }} axisLine={false} tickLine={false} interval={modoVista==="mes"?1:4}/>
                <YAxis tick={{ fill: C.textLight, fontSize: 11 }} axisLine={false} tickLine={false} unit={unit}/>
                <Tooltip content={<CustomTooltip unit={unit}/>} cursor={false}/>
                <Bar dataKey={fieldKey} name={kpi} fill="url(#kpiGradBar)" radius={[4,4,0,0]} barSize={modoVista==="mes"?10:6} activeBar={false}/>
                <Line type="monotone" dataKey="ly" name="Año anterior" stroke="#D32F2F" strokeWidth={2} dot={{fill:"#D32F2F", r:3, strokeWidth:0}} activeDot={{r:4}} connectNulls/>
              </ComposedChart>
            </ResponsiveContainer>
          </>)}
        </div>

      </div>
    </div>
  );
}
