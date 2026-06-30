import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { LangContext, useT, TRANSLATIONS } from "./i18n";
import { C, LOGO_B64, SALAS_FIJAS, dmy, MESES, MESES_CORTO, MESES_FULL, NET_HAB_FNB, NET_SALA, KPI_HELP, NAV, GRUPOS_SUB } from "./constants";
import { buildHabEnCasaMap, calcHabEnCasa } from "./utils";
import { supabase } from "./supabase";
import { CustomSelect } from "./components/CustomSelect";
import { AnimatedBar, SimpleBar, TOOLTIP_COLORS, CustomTooltip } from "./components/charts";
import { Card, LoadingSpinner, EmptyState } from "./components/Card";
import { KpiCard } from "./components/KpiCard";
import { PeriodSelectorInline } from "./components/PeriodSelectorInline";
import { WeatherBar } from "./components/WeatherBar";
import { KpiModal } from "./components/KpiModal";
import { ImportarExcel } from "./components/ImportarExcel";
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line, ComposedChart,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  PieChart, Pie, Cell,
} from "recharts";


















// ─── MONTH DETAIL VIEW ───────────────────────────────────────────
function MonthDetailView({ datos, mes, anio, onBack }) {
  const t = useT();
  const { produccion } = datos;
  const [notasDia, setNotasDia] = useState(() => { try { return JSON.parse(localStorage.getItem("fr_notas_dia")||"{}"); } catch { return {}; } });
  const [editingNotaDia, setEditingNotaDia] = useState(null);
  const guardarNotaDia = (key, txt) => { const n={...notasDia,[key]:txt}; setNotasDia(n); localStorage.setItem("fr_notas_dia",JSON.stringify(n)); };

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
        <button onClick={onBack} style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 8, padding: "8px 16px", cursor: "pointer", fontSize: 13, color: C.textMid, fontFamily: "'Plus Jakarta Sans', sans-serif", display: "flex", alignItems: "center", gap: 6 }}>
          {t("volver")}
        </button>
        <div>
          <h2 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 20, fontWeight: 700, color: C.text, letterSpacing: -0.3 }}>
            {t("detalle_diario")} — {t("meses_corto")[mes]} {anio}
          </h2>
          <p style={{ fontSize: 12, color: C.textLight, marginTop: 4 }}>{datosMes.length} {t("dias_con_datos")}</p>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 14, marginBottom: 24 }}>
        {[
          { label: t("th_ocup_media"), value: `${mediaOcc}%` },
          { label: t("th_adr_medio"),  value: `€${mediaAdr}` },
          { label: t("th_revpar_medio"), value: `€${mediaRevpar}` },
          { label: t("th_rev_hab_total"), value: `€${Math.round(totalRevHab).toLocaleString("es-ES")}` },
          { label: t("th_rev_total"),  value: `€${Math.round(totalRevTot).toLocaleString("es-ES")}` },
        ].map((k, i) => (
          <div key={i} style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 8, padding: "16px 18px", borderTop: `3px solid ${C.accent}` }}>
            <p style={{ fontSize: 11, color: C.textLight, textTransform: "uppercase", letterSpacing: "1.5px" }}>{k.label}</p>
            <p style={{ fontSize: 24, fontWeight: 700, fontFamily: "'Plus Jakarta Sans', sans-serif", color: C.text, marginTop: 6 }}>{k.value}</p>
          </div>
        ))}
      </div>

      <Card>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
            <thead>
              <tr style={{ borderBottom: `2px solid ${C.border}` }}>
                {[t("th_fecha"), "Notas", t("th_hab_ocup"), t("th_ocup"), t("th_adr"), t("th_revpar"), t("th_rev_hab"), t("th_rev_total")].map((h,hi) => (
                  <th key={h} style={{ padding: "10px 14px", textAlign: hi<=1 ? "left" : "right", fontSize: 10, color: C.textLight, textTransform: "uppercase", letterSpacing: "1px", fontWeight: 600 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {datosMes.map((d, i) => {
                const fecha   = new Date(d.fecha + "T00:00:00");
                const dia     = fecha.getDate();
                const semana  = t("dias_abrev")[fecha.getDay()];
                const habDis  = d.hab_disponibles || datos.hotel?.habitaciones || 30;
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
                    <td style={{ padding: "9px 14px" }} onClick={e=>e.stopPropagation()}>
                      {editingNotaDia === d.fecha ? (
                        <input autoFocus defaultValue={notasDia[d.fecha]||""} onBlur={e=>{ guardarNotaDia(d.fecha,e.target.value); setEditingNotaDia(null); }} onKeyDown={e=>{ if(e.key==="Enter"||e.key==="Escape"){ guardarNotaDia(d.fecha,e.target.value); setEditingNotaDia(null); } }} style={{ width:120, fontSize:12, padding:"3px 6px", borderRadius:4, border:`1px solid ${C.border}`, background:C.bg, color:C.text, fontFamily:"inherit", outline:"none" }}/>
                      ) : (
                        <span onClick={()=>setEditingNotaDia(d.fecha)} style={{ fontSize:12, color:notasDia[d.fecha]?C.textMid:C.border, cursor:"text", display:"inline-block", minWidth:80, padding:"2px 4px", borderRadius:4, border:`1px dashed ${C.border}` }}>
                          {notasDia[d.fecha]||"—"}
                        </span>
                      )}
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
                <td style={{ padding: "10px 14px", color: C.text, fontWeight: 700 }}>{t("total_mes")}</td>
                <td/>
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


async function generarReportePDF(datos, mes, anio, hotelNombre, returnData = false) {
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
    const revTot = d.reduce((a,r)=>a+(r.revenue_total||0),0);
    return { d, habOcu, habDis, revH, revFnb, revTot,
      occ:    habDis>0 ? (habOcu/habDis*100) : 0,
      adr:    habOcu>0 ? revH/habOcu : 0,
      revpar: habDis>0 ? revH/habDis : 0,
      trevpar:habDis>0 ? (revH+revFnb)/habDis : 0,
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
    const habDis = d.hab_disponibles || datos.hotel?.habitaciones || 30;
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
    occ:   pptoMes.occ_ppto       ? (mesAct.occ    - pptoMes.occ_ppto).toFixed(1)                                : null,
    adr:   pptoMes.adr_ppto       ? ((mesAct.adr    - pptoMes.adr_ppto)   / pptoMes.adr_ppto   * 100).toFixed(1) : null,
    revpar:pptoMes.revpar_ppto     ? ((mesAct.revpar  - pptoMes.revpar_ppto)/ pptoMes.revpar_ppto * 100).toFixed(1) : null,
    rev:   pptoMes.rev_total_ppto  ? ((mesAct.revTot - pptoMes.rev_total_ppto)/pptoMes.rev_total_ppto*100).toFixed(1) : null,
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
    pptoVsReal ? `En cuanto al cumplimiento presupuestario, el revenue total ${pptoOk?"superó":"no alcanzó"} el objetivo con una desviación del ${pptoVsReal.rev}%.${pptoVsReal.occ ? ` La ocupación se situó ${parseFloat(pptoVsReal.occ)>=0?"por encima":"por debajo"} del objetivo en ${Math.abs(pptoVsReal.occ)} pp.` : ""} El ADR ${parseFloat(pptoVsReal.adr)>=0?"superó":"estuvo por debajo de"} el presupuesto en un ${Math.abs(pptoVsReal.adr)}% y el RevPAR se desvió un ${pptoVsReal.revpar}% respecto al objetivo.` : `No se dispone de datos presupuestarios para este mes, por lo que no es posible realizar la comparativa vs objetivo.`,
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
        ["Ocupación", pptoMes?.occ_ppto?fmtP(pptoMes.occ_ppto):"—", fmtP(mesAct.occ), pptoVsReal.occ?(parseFloat(pptoVsReal.occ)>=0?"+":"")+pptoVsReal.occ+" pp":"—"],
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

  if (returnData) {
    return doc.output('datauristring').split(',')[1];
  }
  doc.save(`Informe_${MESES_FULL[mes]}_${anio}.pdf`);
}

// ─── DASHBOARD VIEW ───────────────────────────────────────────────
// ─── DESGLOSE MOVIMIENTO VIEW ────────────────────────────────────────────────
function ModalEditarReserva({ entry, onClose, onGuardado }) {
  const canales = ["Directo","Web propia","Booking.com","Expedia","Hotels.com","Airbnb","Hotelbeds","Agoda","Trip.com","GDS","Tour operador","Agencia de viajes","Empresa","Grupos","Eventos / MICE","Otro"];
  const [form, setForm] = useState({
    fecha_llegada:  String(entry.fecha_llegada||"").slice(0,10),
    canal:          entry.canal || "",
    num_reservas:   String(entry.num_reservas || 1),
    noches:         String(entry.noches || ""),
    fecha_salida:   String(entry.fecha_salida||"").slice(0,10),
    estado:         entry.estado || "confirmada",
    precio_total:   entry.precio_total != null ? String(entry.precio_total) : "",
    numero_reserva: entry.numero_reserva != null ? String(entry.numero_reserva) : "",
  });
  const [guardando, setGuardando] = useState(false);
  const [error, setError]         = useState("");
  const [ok, setOk]               = useState(false);
  const f = k => e => setForm(p => ({ ...p, [k]: e.target.value }));
  const inp = { width:"100%", padding:"8px 10px", borderRadius:7, border:`1px solid ${C.border}`, fontSize:13, background:C.bgCard, color:C.text, fontFamily:"inherit", boxSizing:"border-box" };
  const lbl = { fontSize:10, color:C.textLight, fontWeight:600, textTransform:"uppercase", letterSpacing:"0.8px", marginBottom:4 };

  const guardar = async () => {
    if (!entry?.id) return;
    setGuardando(true); setError("");
    try {
      const { error: err } = await supabase.from("pickup_entries").update({
        canal:          form.canal || null,
        num_reservas:   parseInt(form.num_reservas) || 1,
        fecha_llegada:  form.fecha_llegada || null,
        fecha_salida:   form.fecha_salida || null,
        noches:         form.noches ? parseInt(form.noches) : null,
        precio_total:   form.precio_total ? Math.round(parseFloat(form.precio_total) * NET_HAB_FNB * 100) / 100 : null,
        estado:         form.estado || "confirmada",
        numero_reserva: form.numero_reserva ? parseInt(form.numero_reserva) : null,
      }).eq("id", entry.id);
      if (err) throw new Error(err.message);
      setOk(true);
      setTimeout(() => { onClose(); onGuardado && onGuardado(); }, 1000);
    } catch(e) { setError(e.message); }
    finally { setGuardando(false); }
  };

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.55)", zIndex:2000, display:"flex", alignItems:"center", justifyContent:"center", padding:24 }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background:C.bgCard, borderRadius:14, padding:"28px 32px", width:"100%", maxWidth:460, boxShadow:"0 20px 60px rgba(0,0,0,0.25)" }}
        onClick={e => e.stopPropagation()}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:18 }}>
          <p style={{ fontFamily:"'Plus Jakarta Sans',sans-serif", fontWeight:700, fontSize:20, color:C.text }}>Gestión de reserva</p>
          <button onClick={onClose} style={{ background:"none", border:`1px solid ${C.border}`, borderRadius:6, width:28, height:28, cursor:"pointer", fontSize:14, color:C.textLight }}>✕</button>
        </div>
        <p style={{ fontFamily:"'Plus Jakarta Sans',sans-serif", fontWeight:700, fontSize:16, color:C.text, marginBottom:14 }}>
          Editar reserva{entry.numero_reserva ? ` #${entry.numero_reserva}` : ""}
        </p>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
          <div><p style={lbl}>Fecha llegada</p>
            <input type="date" value={form.fecha_llegada} onChange={f("fecha_llegada")} style={inp}/></div>
          <div><p style={lbl}>Canal</p>
            <select value={form.canal} onChange={f("canal")} style={inp}>
              <option value="">—</option>
              {canales.map(c => <option key={c} value={c}>{c}</option>)}
            </select></div>
          <div><p style={lbl}>Habitaciones</p>
            <input type="number" min="1" value={form.num_reservas} onChange={f("num_reservas")} style={inp}/></div>
          <div><p style={lbl}>Noches</p>
            <input type="number" min="1" value={form.noches} onChange={f("noches")} style={inp}/></div>
          <div><p style={lbl}>Fecha salida</p>
            <input type="date" value={form.fecha_salida} onChange={f("fecha_salida")} style={inp}/></div>
          <div><p style={lbl}>Estado</p>
            <CustomSelect
              value={form.estado}
              onChange={v => f("estado")({target:{value:v}})}
              options={[{value:"confirmada",label:"Confirmada",color:"#1A7A3C",bg:"#E6F7EE"},{value:"cancelada",label:"Cancelada",color:"#999",bg:"#F5F5F5"}]}
            /></div>
          <div><p style={lbl}>Precio total €</p>
            <input type="number" min="0" step="0.01" value={form.precio_total} onChange={f("precio_total")} style={inp}/></div>
          <div><p style={lbl}>Nº reserva</p>
            <input type="number" min="1" value={form.numero_reserva} onChange={f("numero_reserva")} style={inp}/></div>
        </div>
        <p style={{ fontSize:10, color:"#004B87", marginTop:10, lineHeight:1.5 }}>ⓘ Al guardar se deduce el IVA automáticamente: precio ÷1,10 (IVA 10%)</p>
        {error && <p style={{ fontSize:12, color:C.red, marginTop:6 }}>{error}</p>}
        {ok    && <p style={{ fontSize:12, color:C.green, marginTop:6, fontWeight:600 }}>✓ Reserva actualizada</p>}
        <button onClick={guardar} disabled={guardando}
          style={{ marginTop:16, width:"100%", padding:"10px 0", borderRadius:8, background:guardando?C.border:C.text, color:"#fff", border:"none", cursor:guardando?"default":"pointer", fontSize:13, fontWeight:700, fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
          {guardando ? "Guardando..." : "Guardar cambios"}
        </button>
      </div>
    </div>
  );
}

function DesgloseMovimientoView({ datos, tipo, onBack }) {
  const pickupEntries = datos.pickupEntries || [];
  const _p = n => String(n).padStart(2,"0");
  const [editEntry, setEditEntry] = useState(null);
  const hoy = new Date();
  const hoyStr = `${hoy.getFullYear()}-${_p(hoy.getMonth()+1)}-${_p(hoy.getDate())}`;
  const TITULOS = { entradas:"Entradas hoy", salidas:"Salidas hoy", estancias:"En casa hoy" };

  const getFechaSalida = e => {
    if (e.fecha_salida) return String(e.fecha_salida).slice(0,10);
    if (e.noches && e.fecha_llegada) {
      const d = new Date(e.fecha_llegada); d.setDate(d.getDate() + Number(e.noches));
      return d.toISOString().slice(0,10);
    }
    return null;
  };

  const todasBruto = pickupEntries.filter(e => !e._grupo && (e.estado||"confirmada") !== "cancelada");
  const deduped = {};
  todasBruto.forEach(e => {
    const fl = String(e.fecha_llegada||"").slice(0,10);
    const fs = getFechaSalida(e) || "";
    const key = `${fl}|${e.canal||""}|${fs}`;
    const fp  = String(e.fecha_pickup||"").slice(0,10);
    if (!deduped[key] || fp > deduped[key]._fp) deduped[key] = { ...e, _fp: fp };
  });
  const todasActivas = Object.values(deduped);
  const reservas = todasActivas.filter(e => {
    const fl = String(e.fecha_llegada||"").slice(0,10);
    const fs = getFechaSalida(e);
    if (tipo === "entradas")  return fl === hoyStr;
    if (tipo === "salidas")   return fs === hoyStr;
    if (tipo === "estancias") return fl <= hoyStr && fs > hoyStr;
    return false;
  }).sort((a,b) => (a.canal||"").localeCompare(b.canal||""));

  const total = reservas.reduce((a,e) => a + (e.num_reservas||1), 0);

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:20 }}>
      <div style={{ display:"flex", alignItems:"center", gap:16 }}>
        <button onClick={onBack} style={{ background:C.bgCard, border:`1px solid ${C.border}`, borderRadius:8, padding:"8px 16px", cursor:"pointer", fontSize:13, color:C.textMid, fontFamily:"'Plus Jakarta Sans',sans-serif", display:"flex", alignItems:"center", gap:6 }}>← Volver</button>
        <div>
          <h2 style={{ fontFamily:"'Plus Jakarta Sans',sans-serif", fontSize:24, fontWeight:700, color:C.text, margin:0 }}>{TITULOS[tipo]}</h2>
          <p style={{ fontSize:12, color:C.textLight, margin:0, marginTop:2 }}>{hoyStr} · {total} reservas</p>
        </div>
      </div>

      <Card>
        {reservas.length === 0
          ? <p style={{ textAlign:"center", color:C.textLight, padding:"40px 0", fontSize:13 }}>Sin reservas para hoy</p>
          : <div style={{ overflowX:"auto" }}>
              <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
                <thead>
                  <tr>
                    {["Nº Reserva","Canal","Llegada","Salida","Noches","Habitaciones","Precio total"].map(h => (
                      <th key={h} style={{ padding:"10px 16px", textAlign:"left", fontSize:10, fontWeight:600, color:C.textLight, textTransform:"uppercase", letterSpacing:"1px", borderBottom:`2px solid ${C.border}`, whiteSpace:"nowrap" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {reservas.map((e, i) => (
                    <tr key={i}
                      onClick={() => setEditEntry(e)}
                      style={{ borderBottom:`1px solid ${C.border}`, background: i%2===0 ? C.bg : C.bgCard, cursor:"pointer", transition:"background 0.1s" }}
                      onMouseEnter={ev => ev.currentTarget.style.background = C.accentLight}
                      onMouseLeave={ev => ev.currentTarget.style.background = i%2===0 ? C.bg : C.bgCard}>
                      <td style={{ padding:"11px 16px", color:C.textMid, fontVariantNumeric:"tabular-nums" }}>{e.numero_reserva || "—"}</td>
                      <td style={{ padding:"11px 16px", fontWeight:600, color:C.text }}>{e.canal || "—"}</td>
                      <td style={{ padding:"11px 16px", color:C.textMid }}>{dmy(e.fecha_llegada)}</td>
                      <td style={{ padding:"11px 16px", color:C.textMid }}>{dmy(getFechaSalida(e))}</td>
                      <td style={{ padding:"11px 16px", color:C.textMid, textAlign:"center" }}>{e.noches || "—"}</td>
                      <td style={{ padding:"11px 16px", color:C.textMid, textAlign:"center" }}>{e.num_reservas || 1}</td>
                      <td style={{ padding:"11px 16px", fontWeight:700, color:"#1A7A3C", textAlign:"right" }}>{e.precio_total ? `€${Number(e.precio_total).toLocaleString("es-ES")}` : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
        }
      </Card>
      {editEntry && <ModalEditarReserva entry={editEntry} onClose={() => setEditEntry(null)} />}
    </div>
  );
}

function calcForecastRevStandalone(mesIdx, anioF, produccion, pickupEntries, hotel) {
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

async function generarInformeDiarioPDF(kpis, hotelNombre) {
  const MESES     = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
  const MESES_S   = ["ene","feb","mar","abr","may","jun","jul","ago","sep","oct","nov","dic"];
  const {
    fecha, mesNombre, occ, adr, revpar, trevpar,
    hab_ocupadas, hab_disponibles, pickup_neto, cancelaciones, revenue_pickup_ayer,
    revenueAcumulado, presupuestoMensual,
    avg_occ, avg_adr, avg_revpar, avg_trevpar,
    lm_avg_occ, lm_avg_adr, lm_avg_revpar, lm_avg_trevpar,
    revHabAyer, revFnbAyer, canalesRevenue, canalesPickup, canalesRevMix,
    revGruposAyer, revIndividualAyer,
    adrPpto, occPpto, gruposProximos, proximoConfirmado,
    forecastMes, paceProximos7,
  } = kpis;

  const loadScript = src => new Promise((res, rej) => {
    if (document.querySelector(`script[src="${src}"]`)) { res(); return; }
    const s = document.createElement("script");
    s.src = src; s.onload = res; s.onerror = rej;
    document.head.appendChild(s);
  });
  await loadScript("https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js");
  const { jsPDF } = window.jspdf;

  const doc = new jsPDF({ orientation:"portrait", unit:"mm", format:"a4" });
  const W = 210; const M = 14; let y = 0;

  const C_AZUL  = [10, 37, 64];
  const C_GOLD  = [212, 160, 23];
  const C_GRIS  = [20, 30, 50];
  const C_VERDE = [5, 150, 105];
  const C_ROJO  = [220, 38, 38];
  const C_GRISC = [245, 247, 250];
  const C_GRISM = [55, 70, 90];
  const C_BORDE = [210, 218, 230];
  const C_NEGRO = [10, 10, 10];

  const fmt   = n => n != null && !isNaN(n) ? Math.round(n).toLocaleString("es-ES") : "—";
  const fmtD  = iso => { if (!iso) return "—"; const [yr,mo,dy] = iso.split("-"); return `${parseInt(dy)} de ${MESES[parseInt(mo)-1]} de ${yr}`; };
  const fmtSD = iso => { if (!iso) return "—"; const [,mo,dy] = iso.split("-"); return `${parseInt(dy)} ${MESES_S[parseInt(mo)-1]}`; };

  // Donut via canvas (transparent bg → white center when placed on white PDF)
  function addDonut(cx, cy, rMm, segments) {
    const px = 160;
    const canvas = document.createElement("canvas");
    canvas.width = px; canvas.height = px;
    const ctx = canvas.getContext("2d");
    const ccx = px/2, ccy = px/2;
    const outerR = px/2 - 4;
    const ringW  = Math.round(outerR * 0.44);
    const midR   = outerR - ringW/2;
    const total  = segments.reduce((s, sg) => s + (sg.value||0), 0);
    if (total === 0) {
      ctx.beginPath(); ctx.arc(ccx, ccy, midR, 0, 2*Math.PI);
      ctx.strokeStyle = "#CBD5E1"; ctx.lineWidth = ringW; ctx.stroke();
    } else {
      let a = -Math.PI/2;
      const activeSegs = segments.filter(s => s.value > 0);
      const gap = activeSegs.length > 1 ? 0.05 : 0;
      for (const seg of segments) {
        if (!seg.value) continue;
        const sweep = (seg.value/total)*2*Math.PI - gap;
        ctx.beginPath(); ctx.arc(ccx, ccy, midR, a, a+sweep);
        ctx.strokeStyle = seg.color; ctx.lineWidth = ringW; ctx.lineCap = "butt"; ctx.stroke();
        a += sweep + gap;
      }
    }
    const mm = rMm*2;
    doc.addImage(canvas.toDataURL("image/png"), "PNG", cx-rMm, cy-rMm, mm, mm);
  }

  // Colored legend square
  function legendSq(x, y2, hex) {
    const [r,g,b] = hex.match(/\w\w/g).map(h => parseInt(h,16));
    doc.setFillColor(r,g,b); doc.rect(x, y2-2.2, 2.5, 2.5, "F");
  }

  // ── HEADER ──────────────────────────────────────────
  const hdrH = 26;
  doc.setFillColor(10, 37, 64); doc.rect(0, 0, W, hdrH, "F");
  // Label superior centrado
  doc.setFontSize(6.5); doc.setFont("helvetica","normal"); doc.setTextColor(130,145,165);
  doc.text("INFORME DIARIO DE REVENUE", W/2, 7, { align:"center" });
  // Hotel centrado y grande
  doc.setFontSize(15); doc.setFont("helvetica","bold"); doc.setTextColor(255,255,255);
  doc.text((hotelNombre || "Mi Hotel").toUpperCase(), W/2, 16, { align:"center" });
  // Fecha centrada debajo
  doc.setFontSize(8); doc.setFont("helvetica","normal"); doc.setTextColor(160,175,190);
  doc.text(fmtD(fecha), W/2, 23, { align:"center" });
  // Solo logo derecha en blanco
  try {
    const img = new Image();
    await new Promise((res, rej) => { img.onload=res; img.onerror=rej; img.src="/fastrev-icon.png"; });
    const cv = document.createElement("canvas"); cv.width=img.width; cv.height=img.height;
    const cx2 = cv.getContext("2d"); cx2.drawImage(img,0,0);
    const id = cx2.getImageData(0,0,cv.width,cv.height);
    for (let i=0; i<id.data.length; i+=4) { if(id.data[i+3]>10){ id.data[i]=255; id.data[i+1]=255; id.data[i+2]=255; } }
    cx2.putImageData(id,0,0);
    const lW=9, lH=9;
    doc.addImage(cv.toDataURL("image/png"), "PNG", W-lW-3, 3, lW, lH);
  } catch(_) {}
  y = hdrH + 1 + 6;

  // ── CUMPLIMIENTO KPIs DEL MES ──────────────────────
  {
    const acumRev = revenueAcumulado?.length ? revenueAcumulado[revenueAcumulado.length-1]?.acum || 0 : 0;
    const revPct  = presupuestoMensual && presupuestoMensual > 0 ? Math.round(acumRev / presupuestoMensual * 100) : null;
    const occPct  = avg_occ != null && occPpto != null && occPpto > 0 ? Math.round(avg_occ / occPpto * 100) : null;
    const adrPct2 = avg_adr != null && adrPpto != null && adrPpto > 0 ? Math.round(avg_adr / adrPpto * 100) : null;
    doc.setFontSize(8); doc.setFont("helvetica","bold"); doc.setTextColor(...C_GRIS);
    doc.text("CUMPLIMIENTO DEL MES", M, y);
    doc.setFont("helvetica","normal"); doc.setTextColor(...C_GRISM);
    doc.text(`(${mesNombre||""})`, M+47, y);
    y += 4;
    const kmH = 22;
    doc.setFillColor(255,255,255); doc.setDrawColor(...C_BORDE);
    doc.roundedRect(M, y, W-M*2, kmH, 2, 2, "FD");
    const kmDefs = [
      { lbl:"OCC MES",       val: avg_occ!=null?parseFloat(avg_occ).toFixed(1)+"%":"—",  ppto: occPpto!=null?parseFloat(occPpto).toFixed(1)+"%":"—",  pct: occPct },
      { lbl:"ADR MEDIO",     val: avg_adr!=null?`€${Math.round(avg_adr)}`:"—",           ppto: adrPpto!=null?`€${Math.round(adrPpto)}`:"—",           pct: adrPct2 },
      { lbl:"REVENUE TOTAL", val: `€${fmt(acumRev)}`,                                    ppto: presupuestoMensual?`€${fmt(presupuestoMensual)}`:"—",   pct: revPct },
    ];
    const kmCW = (W-M*2)/3;
    kmDefs.forEach((k, i) => {
      const kx = M + i*kmCW + kmCW/2;
      if (i>0) { doc.setDrawColor(...C_BORDE); doc.line(M+i*kmCW, y+2, M+i*kmCW, y+kmH-2); }
      doc.setFontSize(6.5); doc.setFont("helvetica","bold"); doc.setTextColor(...C_GRIS);
      doc.text(k.lbl, kx, y+5, { align:"center" });
      const valCol = k.pct==null ? C_NEGRO : k.pct>=100 ? C_VERDE : k.pct>=75 ? [196,154,10] : C_ROJO;
      doc.setFontSize(12); doc.setFont("helvetica","bold"); doc.setTextColor(...valCol);
      doc.text(k.val, kx, y+14, { align:"center" });
      const statusTxt = k.pct==null ? `ppto: ${k.ppto}` : k.pct>=100 ? `Por encima del objetivo (ppto: ${k.ppto})` : `Por debajo del objetivo (ppto: ${k.ppto})`;
      doc.setFontSize(6); doc.setFont("helvetica","normal"); doc.setTextColor(...valCol);
      doc.text(statusTxt, kx, y+20, { align:"center", maxWidth: kmCW-4 });
    });
    y += kmH + 5;
  }

  // ── RESUMEN DE AYER ────────────────────────────────
  doc.setFontSize(8); doc.setFont("helvetica","bold"); doc.setTextColor(...C_GRIS);
  doc.text("RESUMEN DE AYER", M, y);
  doc.setFont("helvetica","normal"); doc.setTextColor(...C_GRISM);
  doc.text("(vs. Media del Mes)", M+38, y);
  y += 4;

  // ── Tarjeta KPIs (4 columnas) ──
  const kH = 27;
  doc.setFillColor(255,255,255); doc.setDrawColor(...C_BORDE);
  doc.roundedRect(M, y, W-M*2, kH, 2, 2, "FD");

  const occΔ  = occ!=null&&avg_occ!=null ? occ-avg_occ : null;
  const adrΔ  = adr!=null&&avg_adr!=null ? adr-avg_adr : null;
  const rvpΔ  = revpar!=null&&avg_revpar!=null&&avg_revpar>0 ? (revpar-avg_revpar)/avg_revpar*100 : null;
  const kpiDefs = [
    { lbl:"OCUPACIÓN", val: occ!=null?parseFloat(occ).toFixed(1)+"%":"—",  delta:occΔ, dfmt:n=>(n>=0?"+":"")+parseFloat(n).toFixed(1)+" pp", sub:hab_ocupadas!=null?`${hab_ocupadas}/${hab_disponibles} hab.`:null, vc:null },
    { lbl:"ADR",       val: adr!=null?`€${Math.round(adr)}`:"—",           delta:adrΔ, dfmt:n=>(n>=0?"+€":"-€")+Math.abs(n).toFixed(1),        sub:null, vc:null },
    { lbl:"REVPAR",    val: revpar!=null?`€${Math.round(revpar)}`:"—",      delta:rvpΔ, dfmt:n=>(n>=0?"+":"")+parseFloat(n).toFixed(1)+"%",   sub:null, vc:null },
    { lbl:"TREVPAR",   val: trevpar!=null?`€${Math.round(trevpar)}`:"—",    delta:trevpar!=null&&avg_trevpar!=null&&avg_trevpar>0?(trevpar-avg_trevpar)/avg_trevpar*100:null, dfmt:n=>(n>=0?"+":"")+parseFloat(n).toFixed(1)+"%", sub:null, vc:null },
  ];
  const kColW = (W-M*2)/4;
  kpiDefs.forEach((k, i) => {
    const kx = M + i*kColW + kColW/2;
    if (i>0) { doc.setDrawColor(...C_BORDE); doc.line(M+i*kColW, y+4, M+i*kColW, y+kH-4); }
    doc.setFontSize(6.5); doc.setFont("helvetica","bold"); doc.setTextColor(...C_GRIS);
    doc.text(k.lbl, kx, y+5, { align:"center" });
    doc.setFontSize(12); doc.setFont("helvetica","bold"); doc.setTextColor(...(k.vc||C_NEGRO));
    doc.text(k.val, kx, y+14, { align:"center" });
    if (k.delta!=null) {
      doc.setFontSize(7.5); doc.setFont("helvetica","bold"); doc.setTextColor(...(k.delta>=0?[2,110,75]:[180,20,20]));
      doc.text(k.dfmt(k.delta), kx, y+21, { align:"center" });
    }
    if (k.sub) {
      doc.setFontSize(6); doc.setFont("helvetica","normal"); doc.setTextColor(...C_GRISM);
      doc.text(k.sub, kx, k.delta!=null?y+26:y+21, { align:"center" });
    }
  });
  y += kH + 4;

  // ── Tarjeta Pick Up desglosada ──
  const nuevas = pickup_neto || 0;
  const cancels = cancelaciones || 0;
  const neto = nuevas - cancels;
  const canalesPick = (canalesPickup || []).slice(0, 5);
  const pickH = 30;
  doc.setFillColor(255,255,255); doc.setDrawColor(...C_BORDE);
  doc.roundedRect(M, y, W-M*2, pickH, 2, 2, "FD");
  doc.setFontSize(6.5); doc.setFont("helvetica","bold"); doc.setTextColor(...C_GRIS);
  doc.text("PICK UP AYER", M+4, y+6);
  doc.setDrawColor(...C_BORDE); doc.line(M, y+9, M+W-M*2, y+9);
  const pColW = (W-M*2)/3;
  const pLabels = ["NUEVAS RESERVAS","CANCELACIONES","NETO"];
  const pVals   = [`+${nuevas} hab.`, `-${cancels} hab.`, (neto>=0?"+":"")+neto+" hab."];
  const pColors = [[2,110,75], cancels>0?[180,20,20]:C_GRIS, neto>0?[2,110,75]:neto<0?[180,20,20]:C_NEGRO];
  pLabels.forEach((lbl, i) => {
    const px = M + i*pColW + pColW/2;
    if (i>0) { doc.setDrawColor(...C_BORDE); doc.line(M+i*pColW, y+10, M+i*pColW, y+26); }
    doc.setFontSize(6.5); doc.setFont("helvetica","bold"); doc.setTextColor(...C_GRIS);
    doc.text(lbl, px, y+14, { align:"center" });
    doc.setFontSize(12); doc.setFont("helvetica","bold"); doc.setTextColor(...pColors[i]);
    doc.text(pVals[i], px, y+23, { align:"center" });
  });
  if (canalesPick.length > 0) {
    const dotColors2 = ["#0A2540","#D4A017","#059669","#7C3AED","#94A3B8"];
    let cx2 = M + 4; const py2 = y + 28;
    doc.setFontSize(6); doc.setFont("helvetica","bold"); doc.setTextColor(...C_GRISM);
    doc.text("Procedencia:", cx2, py2); cx2 += 24;
    canalesPick.forEach((c, i) => {
      const [r2,g2,b2] = dotColors2[i].match(/\w\w/g).map(h=>parseInt(h,16));
      doc.setFillColor(r2,g2,b2); doc.circle(cx2+1, py2-1.3, 1.2, "F");
      doc.setFontSize(6); doc.setFont("helvetica","normal"); doc.setTextColor(...C_NEGRO);
      const lbl2 = `${c.canal} (${c.reservas})`;
      doc.text(lbl2, cx2+3.5, py2);
      cx2 += doc.getTextWidth(lbl2) + 7;
    });
  }
  y += pickH + 5;

  // ── MIX DE REVENUE ──────────────────────────────────
  doc.setFontSize(8); doc.setFont("helvetica","bold"); doc.setTextColor(...C_GRIS);
  doc.text("MIX DE REVENUE", M, y);
  doc.setFont("helvetica","normal"); doc.setTextColor(...C_GRISM);
  doc.text("— AYER", M+33, y);
  y += 5;

  function addBar(x, bY, totalW, label, value, maxVal, hexColor) {
    const barH = 3.5; const lblW = 28; const valW = 20;
    const barW = totalW - lblW - valW;
    const pct = maxVal > 0 ? Math.min(value / maxVal, 1) : 0;
    doc.setFontSize(7); doc.setFont("helvetica","normal"); doc.setTextColor(...C_NEGRO);
    doc.text(label, x, bY, { maxWidth: lblW - 1 });
    doc.setFillColor(220, 228, 238); doc.rect(x + lblW, bY - 3.2, barW, barH, "F");
    if (pct > 0) {
      const [r,g,b] = hexColor.match(/\w\w/g).map(h => parseInt(h, 16));
      doc.setFillColor(r, g, b); doc.rect(x + lblW, bY - 3.2, barW * pct, barH, "F");
    }
    doc.setFontSize(7); doc.setFont("helvetica","bold"); doc.setTextColor(...C_NEGRO);
    doc.text(`€${Math.round(value).toLocaleString("es-ES")}`, x + lblW + barW + 1, bY);
  }

  const barRowH = 7;
  const mixH    = 3 + 7 + 2 * barRowH + 3;

  doc.setFillColor(255,255,255); doc.setDrawColor(...C_BORDE);
  doc.roundedRect(M, y, W - M * 2, mixH, 2, 2, "FD");

  const lx = M + 3;
  let ly = y + 4;
  doc.setFontSize(6.5); doc.setFont("helvetica","bold"); doc.setTextColor(...C_GRIS);
  doc.text("HAB. VS F&B", lx, ly); ly += 7;
  const totHF = (revHabAyer || 0) + (revFnbAyer || 0);
  addBar(lx, ly, W - M * 2 - 6, "Habitaciones", revHabAyer || 0, totHF || 1, "#0A2540"); ly += barRowH;
  addBar(lx, ly, W - M * 2 - 6, "F&B",          revFnbAyer || 0, totHF || 1, "#D4A017");

  y += mixH + 5;


  // ── PROGRESO MENSUAL ────────────────────────────────
  if (revenueAcumulado?.length) {
    const acum    = revenueAcumulado[revenueAcumulado.length-1]?.acum || 0;
    const lastDay = revenueAcumulado[revenueAcumulado.length-1]?.dia  || 1;
    const pct     = presupuestoMensual && presupuestoMensual>0 ? Math.round(acum/presupuestoMensual*100) : null;
    const barCol  = pct==null ? C_GRIS : pct>=100 ? C_VERDE : pct>=75 ? [196,154,10] : C_ROJO;

    doc.setFontSize(8); doc.setFont("helvetica","bold"); doc.setTextColor(...C_GRIS);
    doc.text("PROGRESO MENSUAL", M, y);
    doc.setFont("helvetica","normal"); doc.setTextColor(...C_GRISM);
    doc.text(`(${mesNombre||""})`, M+41, y);
    y += 4;

    const pgH = 24;
    doc.setFillColor(255,255,255); doc.setDrawColor(...C_BORDE);
    doc.roundedRect(M, y, W-M*2, pgH, 2, 2, "FD");

    const pgCols = [
      { lbl:`ACUMULADO DÍA ${lastDay}`, val:`€${fmt(acum)}`,                                     vc:C_NEGRO },
      { lbl:"CUMPLIMIENTO",             val:pct!=null?`${pct}%`:"—",                             vc:barCol  },
      { lbl:"PRESUPUESTO",              val:presupuestoMensual?`€${fmt(presupuestoMensual)}`:"—", vc:C_NEGRO },
      { lbl:"PREVISIÓN",                val:forecastMes?`€${fmt(forecastMes)}`:"—",              vc:C_NEGRO },
    ];
    const pgCW = (W-M*2)/4;
    pgCols.forEach((col, i) => {
      const px3 = M + i*pgCW + pgCW/2;
      if (i>0) { doc.setDrawColor(...C_BORDE); doc.line(M+i*pgCW, y+3, M+i*pgCW, y+pgH-3); }
      doc.setFontSize(6.5); doc.setFont("helvetica","bold"); doc.setTextColor(...C_GRIS);
      doc.text(col.lbl, px3, y+7, { align:"center" });
      doc.setFontSize(12); doc.setFont("helvetica","bold"); doc.setTextColor(...(col.vc===C_AZUL?C_NEGRO:col.vc));
      doc.text(col.val, px3, y+18, { align:"center" });
    });

    y += pgH + 5;
  }

  // ── GRUPOS & EVENTOS ─────────────────────────────────
  const drawGruposSeccion = (subtitulo, lista) => {
    if (!lista?.length) return;
    doc.setFontSize(8); doc.setFont("helvetica","bold"); doc.setTextColor(...C_GRIS);
    const _geTxt = "GRUPOS & EVENTOS";
    const _geW = doc.getTextWidth(_geTxt);
    doc.text(_geTxt, M, y);
    doc.setFont("helvetica","normal"); doc.setTextColor(...C_GRISM);
    doc.text(` — ${subtitulo}`, M + _geW, y);
    y += 4;
    const tH = 9 + lista.length * 8;
    doc.setFillColor(255,255,255); doc.setDrawColor(...C_BORDE);
    doc.roundedRect(M, y, W-M*2, tH, 2, 2, "FD");
    const cols = [{lbl:"NOMBRE",x:M+3},{lbl:"TIPO",x:M+52},{lbl:"FECHAS",x:M+80},{lbl:"HAB.",x:M+126},{lbl:"REVENUE",x:M+148}];
    doc.setFontSize(6.5); doc.setFont("helvetica","bold"); doc.setTextColor(...C_GRIS);
    cols.forEach(c => doc.text(c.lbl, c.x, y+6));
    doc.setDrawColor(...C_BORDE); doc.line(M+3, y+8, W-M-3, y+8);
    lista.forEach((g, i) => {
      const ry = y + 14 + i*8;
      doc.setFontSize(7.5); doc.setFont("helvetica","bold"); doc.setTextColor(...C_NEGRO);
      doc.text((g.nombre||"—").slice(0,22), cols[0].x, ry);
      doc.setFontSize(7); doc.setFont("helvetica","normal"); doc.setTextColor(...C_NEGRO);
      doc.text((g.tipo||"").slice(0,13), cols[1].x, ry);
      doc.text(`${fmtSD(g.fecha_inicio)} – ${fmtSD(g.fecha_fin)}`, cols[2].x, ry);
      doc.text(g.habitaciones?`${g.habitaciones} hab.`:"—", cols[3].x, ry);
      doc.setFontSize(7.5); doc.setFont("helvetica","bold"); doc.setTextColor(...C_NEGRO);
      doc.text(g.revenue?`€${fmt(g.revenue)}`:"—", cols[4].x, ry);
    });
    y += tH + 5;
  };

  drawGruposSeccion("PRÓXIMOS 7 DÍAS", gruposProximos);

  if (proximoConfirmado && !gruposProximos?.find(g => g.nombre===proximoConfirmado.nombre && g.fecha_inicio===proximoConfirmado.fecha_inicio)) {
    drawGruposSeccion("PRÓXIMO CONFIRMADO", [proximoConfirmado]);
  }

  // ── PACE — PRÓXIMOS 7 DÍAS ──────────────────────────
  if (paceProximos7?.length) {
    doc.setFontSize(8); doc.setFont("helvetica","bold"); doc.setTextColor(...C_GRIS);
    doc.text("PACE", M, y);
    doc.setFont("helvetica","normal"); doc.setTextColor(...C_GRISM);
    doc.text("— PRÓXIMOS 7 DÍAS", M+13, y);
    y += 4;
    const DIAS_S = ["DOM","LUN","MAR","MIÉ","JUE","VIE","SÁB"];
    const pColW = (W-M*2)/7;
    const paceH = 26;
    doc.setFillColor(255,255,255); doc.setDrawColor(...C_BORDE);
    doc.roundedRect(M, y, W-M*2, paceH, 2, 2, "FD");
    paceProximos7.forEach((d, i) => {
      const cx = M + i*pColW + pColW/2;
      if (i>0) { doc.setDrawColor(...C_BORDE); doc.line(M+i*pColW, y+2, M+i*pColW, y+paceH-2); }
      const dow = DIAS_S[new Date(d.fecha+'T00:00:00').getDay()];
      const dayNum = parseInt(d.fecha.split('-')[2]);
      doc.setFontSize(6.5); doc.setFont("helvetica","normal"); doc.setTextColor(...C_GRISM);
      doc.text(dow, cx, y+5, { align:"center" });
      doc.setFontSize(7); doc.setFont("helvetica","bold"); doc.setTextColor(...C_GRIS);
      doc.text(String(dayNum), cx, y+9, { align:"center" });
      const bH = 8; const bW2 = pColW*0.55; const bX2 = cx-bW2/2;
      const pct2 = d.occ_pct!=null ? Math.min(d.occ_pct/100, 1) : 0;
      doc.setFillColor(220,228,238); doc.rect(bX2, y+11, bW2, bH, "F");
      if (pct2>0) {
        const col = d.occ_pct>=80 ? C_VERDE : d.occ_pct>=60 ? [196,154,10] : C_AZUL;
        doc.setFillColor(...col); doc.rect(bX2, y+11+(bH*(1-pct2)), bW2, bH*pct2, "F");
      }
      const occ_col = d.occ_pct!=null && d.occ_pct>=80 ? C_VERDE : d.occ_pct!=null && d.occ_pct>=60 ? [196,154,10] : C_AZUL;
      doc.setFontSize(7); doc.setFont("helvetica","bold"); doc.setTextColor(...occ_col);
      doc.text(d.occ_pct!=null?d.occ_pct+"%":"—", cx, y+22, { align:"center" });
    });
    y += paceH + 5;
  }

  return doc.output("datauristring").split(",")[1];
}

function DashboardView({ datos, mes, anio, onPeriodo, onMesDetalle, onDesgloseMovimiento, kpiModal, setKpiModal, kpiModalExterno, onKpiModalExternoHandled, onNavigarGrupos }) {
  const t = useT();
  const { produccion } = datos;
  const pickupEntries = datos.pickupEntries || [];
  const presupuesto   = datos.presupuesto   || [];
  const [hmMesSel, setHmMesSel] = useState(() => { try { const v=localStorage.getItem("fr_hmMesSel"); return v!==null?JSON.parse(v):null; } catch { return null; } });
  const [hmVista, setHmVista] = useState(() => { try { return localStorage.getItem("fr_hmVista") || "mensual"; } catch { return "mensual"; } });
  const [modalDiario, setModalDiario] = useState(null); // {mesIdx, anioIdx}

  // Mapa precalculado fecha→habitaciones (un solo paso, O(1) lookups en render)
  const habEnCasaMap = useMemo(
    () => buildHabEnCasaMap(datos.pickupEntries, datos.grupos),
    [datos.pickupEntries, datos.grupos]
  );

  // ADR real desde precios de pickup para un día ISO — fórmula correcta: Σ(precio_noche×nr)/Σ(nr)
  const calcAdrPickup = useCallback((iso) => {
    const activas = pickupEntries.filter(e => {
      const est = e.estado||"confirmada";
      if (est === "cancelada" || est === "tentativo") return false;
      const fl = String(e.fecha_llegada||"").slice(0,10);
      if (e._grupo) return fl === iso;
      const fs = e.fecha_salida
        ? String(e.fecha_salida).slice(0,10)
        : e.noches && fl ? (() => { const d=new Date(fl); d.setDate(d.getDate()+Number(e.noches)); return d.toISOString().slice(0,10); })()
        : null;
      return fl && fs && fl <= iso && fs > iso;
    });
    let sumRev = 0, sumHabs = 0;
    for (const e of activas) {
      const fl = String(e.fecha_llegada||"").slice(0,10);
      const nightIdx = Math.round((new Date(iso) - new Date(fl)) / 86400000);
      const nr = e.num_reservas || 1;
      let pn = null;
      if (e.precios_por_noche && Array.isArray(e.precios_por_noche) && e.precios_por_noche[nightIdx] != null) {
        pn = e.precios_por_noche[nightIdx];
      } else if (e.precio_total) {
        const noches = e.noches || (() => {
          const fs = e.fecha_salida ? String(e.fecha_salida).slice(0,10) : null;
          return fs ? Math.round((new Date(fs)-new Date(fl))/86400000) : null;
        })();
        if (noches > 0) pn = e.precio_total / noches;
      }
      if (pn != null && pn > 0) { sumRev += pn * nr; sumHabs += nr; }
    }
    return sumHabs > 0 ? sumRev / sumHabs : null;
  }, [pickupEntries]);

  // ── Pickup del último día importado por mes de llegada ──
  const todasFechasPickup = pickupEntries
    .filter(e => !e._grupo)
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
  const [activeSeriesKey, setActiveSeriesKey] = useState(null);
  const KPI_ALL_KEYS = ["Ocupación","ADR","RevPAR","TRevPAR"];
  const [kpiOrder, setKpiOrder] = useState(() => { try { const s=JSON.parse(localStorage.getItem("fr_kpi_order")||"null"); if(s&&Array.isArray(s)&&s.length===4) return s; } catch {} return KPI_ALL_KEYS; });
  const kpiDragKey = useRef(null);
  const [kpiPreview, setKpiPreview] = useState(null);
  const [draggingKpiKey, setDraggingKpiKey] = useState(null);
const [metricaSel, setMetricaSel] = useState(() => localStorage.getItem("fr_metrica_sel") || "adr_occ");
  const setMetricaSelPersist = (v) => { setMetricaSel(v); localStorage.setItem("fr_metrica_sel", v); };
  const [notasMes, setNotasMes] = useState(() => { try { return JSON.parse(localStorage.getItem("fr_notas_mes")||"{}"); } catch { return {}; } });
  const [editingNota, setEditingNota] = useState(null);
  const guardarNota = (key, txt) => { const n={...notasMes,[key]:txt}; setNotasMes(n); localStorage.setItem("fr_notas_mes",JSON.stringify(n)); };
  const [hmDragStart,  setHmDragStart]  = useState(null);
  const [hmDragEnd,    setHmDragEnd]    = useState(null);
  const [hmIsDragging, setHmIsDragging] = useState(false);
  const [hmEventForm,  setHmEventForm]  = useState(null); // {fromISO, toISO}
  const [hmEventEdit,  setHmEventEdit]  = useState({ title:"", color:"#3B82F6", notes:"" });
  const [hmSelRango,   setHmSelRango]   = useState(null); // {fromISO, toISO}
  const [hmEvents, setHmEvents] = useState(() => { try { return JSON.parse(localStorage.getItem("fr_hm_events")||"[]"); } catch { return []; } });
  const guardarHmEvent = (ev) => { const a=[...hmEvents,ev]; setHmEvents(a); localStorage.setItem("fr_hm_events",JSON.stringify(a)); };
  const borrarHmEvent  = (idx) => { const a=hmEvents.filter((_,i)=>i!==idx); setHmEvents(a); localStorage.setItem("fr_hm_events",JSON.stringify(a)); };
  const [hmModoCrear, setHmModoCrear] = useState(false);
  const [hmDayModal, setHmDayModal] = useState(() => localStorage.getItem("fr_hmDayModal") || null);
  const [hmEditEntry, setHmEditEntry] = useState(null);
  useEffect(() => { localStorage.setItem("fr_hmMesSel", JSON.stringify(hmMesSel)); }, [hmMesSel]);
  useEffect(() => { localStorage.setItem("fr_hmVista", hmVista); }, [hmVista]);
  useEffect(() => { if (hmDayModal) localStorage.setItem("fr_hmDayModal", hmDayModal); else localStorage.removeItem("fr_hmDayModal"); }, [hmDayModal]);
  useEffect(() => { setHmDragStart(null); setHmDragEnd(null); setHmIsDragging(false); setHmModoCrear(false); }, [hmMesSel]);
  useEffect(() => {
    const up = () => { if (hmIsDragging) setHmIsDragging(false); };
    window.addEventListener("mouseup", up);
    return () => window.removeEventListener("mouseup", up);
  }, [hmIsDragging]);
  useEffect(() => {
    if (kpiModalExterno) { setKpiModal(kpiModalExterno); onKpiModalExternoHandled && onKpiModalExternoHandled(); }
  }, [kpiModalExterno]);
  useEffect(() => {
    const handler = (e) => {
      if (e.key !== "Escape") return;
      if (hmDayModal)   { setHmDayModal(null);   return; }
      if (hmModoCrear)  { setHmModoCrear(false); return; }
      if (hmSelRango)   { setHmSelRango(null);   return; }
      if (hmEventForm) { setHmEventForm(null); return; }
      if (modalDiario) { setModalDiario(null); return; }
      if (hmMesSel !== null) { setHmMesSel(null); return; }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [modalDiario, hmMesSel, hmEventForm, hmSelRango, hmDayModal, hmModoCrear]);

  const kpiCacheKey = `fr_kpis_${mes}_${anio}`;
  const kpisComputed = useMemo(() => {
    if (!produccion || produccion.length === 0) return null;
    const dM=produccion.filter(d=>{const f=new Date(d.fecha+"T00:00:00");return f.getMonth()===mes&&f.getFullYear()===anio;});
    const tHO=dM.reduce((a,d)=>a+(d.hab_ocupadas||0),0), tHD=dM.reduce((a,d)=>a+(d.hab_disponibles||0),0), tRH=dM.reduce((a,d)=>a+(d.revenue_hab||0),0), tRF=dM.reduce((a,d)=>a+(d.revenue_fnb||0),0);
    const _occ=tHD>0?(tHO/tHD*100).toFixed(1):0, _adr=tHO>0?(tRH/tHO).toFixed(0):0, _rvp=tHD>0?(tRH/tHD).toFixed(0):0, _trv=tHD>0?((tRH+tRF)/tHD).toFixed(0):0;
    const mPI=mes===0?11:mes-1, aP=mes===0?anio-1:anio;
    const dP=produccion.filter(d=>{const f=new Date(d.fecha+"T00:00:00");return f.getMonth()===mPI&&f.getFullYear()===aP;});
    const pH=dP.reduce((a,d)=>a+(d.hab_ocupadas||0),0),pD=dP.reduce((a,d)=>a+(d.hab_disponibles||0),0),pRH=dP.reduce((a,d)=>a+(d.revenue_hab||0),0),pRF=dP.reduce((a,d)=>a+(d.revenue_fnb||0),0);
    const pOcc=pD>0?(pH/pD*100):null,pAdr=pH>0?(pRH/pH):null,pRvp=pD>0?(pRH/pD):null,pTrv=pD>0?((pRH+pRF)/pD):null;
    const dLY=produccion.filter(d=>{const f=new Date(d.fecha+"T00:00:00");return f.getMonth()===mes&&f.getFullYear()===anio-1;});
    const lH=dLY.reduce((a,d)=>a+(d.hab_ocupadas||0),0),lD=dLY.reduce((a,d)=>a+(d.hab_disponibles||0),0),lRH=dLY.reduce((a,d)=>a+(d.revenue_hab||0),0),lRF=dLY.reduce((a,d)=>a+(d.revenue_fnb||0),0);
    const lOcc=lD>0?(lH/lD*100):null,lAdr=lH>0?(lRH/lH):null,lRvp=lD>0?(lRH/lD):null,lTrv=lD>0?((lRH+lRF)/lD):null;
    const _diff=(c,lm,ly)=>{const b=(p)=>p==null||p===0?{ch:"—",up:true}:{ch:`${c-p>=0?"+":""}${((c-p)/p*100).toFixed(1)}%`,up:c-p>=0};return{changeLm:b(lm).ch,upLm:b(lm).up,changeLy:b(ly).ch,upLy:b(ly).up};};
    return [
      {label:"Ocupación",kpiKey:"Ocupación",value:`${_occ}%`,..._diff(parseFloat(_occ),pOcc,lOcc)},
      {label:"ADR",kpiKey:"ADR",value:`€${_adr}`,subtitle:"Precio medio",..._diff(parseFloat(_adr),pAdr,lAdr)},
      {label:"RevPAR",kpiKey:"RevPAR",value:`€${_rvp}`,subtitle:"Revenue por hab. disponible",..._diff(parseFloat(_rvp),pRvp,lRvp)},
      {label:"TRevPAR",kpiKey:"TRevPAR",value:`€${_trv}`,subtitle:"Revenue total por hab.",..._diff(parseFloat(_trv),pTrv,lTrv)},
    ];
  }, [produccion, mes, anio]);
  const [kpisCached, setKpisCached] = useState(() => { try { return JSON.parse(localStorage.getItem(`fr_kpis_${mes}_${anio}`) || "null"); } catch { return null; } });
  useEffect(() => {
    if (kpisComputed) {
      const json = JSON.stringify(kpisComputed);
      localStorage.setItem(kpiCacheKey, json);
      setKpisCached(prev => JSON.stringify(prev) === json ? prev : kpisComputed);
    } else {
      try { const c=JSON.parse(localStorage.getItem(kpiCacheKey)||"null"); if(c) setKpisCached(prev => JSON.stringify(prev)===JSON.stringify(c)?prev:c); } catch {}
    }
  }, [kpisComputed, kpiCacheKey]);

  if (!produccion || produccion.length === 0) {
    return <EmptyState />;
  }

  const datosMes = produccion.filter(d => {
    const f = new Date(d.fecha + "T00:00:00");
    return f.getMonth() === mes && f.getFullYear() === anio;
  });

  const totalHabOcupadas    = datosMes.reduce((a, d) => a + (d.hab_ocupadas || 0), 0);
  const totalHabDisponibles = datosMes.reduce((a, d) => a + (d.hab_disponibles || 0), 0);
  const totalRevHab   = datosMes.reduce((a, d) => a + (d.revenue_hab || 0), 0);
  const totalRevTotal = datosMes.reduce((a, d) => a + (d.revenue_total || 0), 0);
  const totalRevFnb   = datosMes.reduce((a, d) => a + (d.revenue_fnb || 0), 0);
  const occ     = totalHabDisponibles > 0 ? (totalHabOcupadas / totalHabDisponibles * 100).toFixed(1) : 0;
  const adr     = totalHabOcupadas > 0 ? (totalRevHab / totalHabOcupadas).toFixed(0) : 0;
  const revpar  = totalHabDisponibles > 0 ? (totalRevHab / totalHabDisponibles).toFixed(0) : 0;
  const trevpar = totalHabDisponibles > 0 ? ((totalRevHab + totalRevFnb) / totalHabDisponibles).toFixed(0) : 0;

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
    const dLY = produccion.filter(r => { const f = new Date(r.fecha+"T00:00:00"); return f.getMonth()===mIdx && f.getFullYear()===anio-1; });
    const habOcuLY = dLY.reduce((a,r)=>a+(r.hab_ocupadas||0),0);
    const habDisLY = dLY.reduce((a,r)=>a+(r.hab_disponibles||0),0);
    const revHLY   = dLY.reduce((a,r)=>a+(r.revenue_hab||0),0);
    return {
      mes: t("meses_corto")[mIdx],
      mesNombre: t("meses_full")[mIdx],
      mesIdx: mIdx,
      anioIdx: aIdx,
      occ:     habDis > 0 ? Math.round(habOcu / habDis * 100) : 0,
      adr:     habOcu > 0 ? Math.round(revH / habOcu) : 0,
      revpar:  habDis > 0 ? Math.round(revH / habDis) : 0,
      trevpar: habDis > 0 ? Math.round((revH + revFnb) / habDis) : 0,
      revHab:  Math.round(revH),
      revTotal: d.reduce((a,r) => a+(r.revenue_total||0), 0),
      occLY:   habDisLY > 0 ? Math.round(habOcuLY / habDisLY * 100) : null,
      adrLY:   habOcuLY > 0 ? Math.round(revHLY / habOcuLY) : null,
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
      adr: Math.round(calcAdrPickup(d.fecha) ?? (d.hab_ocupadas > 0 ? d.revenue_hab / d.hab_ocupadas : 0)),
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
  const prevOcc     = prevHabDis > 0 ? (prevHabOcu / prevHabDis * 100) : null;
  const prevAdr     = prevHabOcu > 0 ? (prevRevHab / prevHabOcu) : null;
  const prevRevpar  = prevHabDis > 0 ? (prevRevHab / prevHabDis) : null;
  const prevTrevpar = prevHabDis > 0 ? ((prevRevHab + prevRevFnb) / prevHabDis) : null;

  // LY: mismo mes año anterior
  const datosMesLY = produccion.filter(d => { const f=new Date(d.fecha+"T00:00:00"); return f.getMonth()===mes && f.getFullYear()===anio-1; });
  const lyHabOcuD  = datosMesLY.reduce((a,d)=>a+(d.hab_ocupadas||0),0);
  const lyHabDisD  = datosMesLY.reduce((a,d)=>a+(d.hab_disponibles||0),0);
  const lyRevHabD  = datosMesLY.reduce((a,d)=>a+(d.revenue_hab||0),0);
  const lyRevFnbD  = datosMesLY.reduce((a,d)=>a+(d.revenue_fnb||0),0);
  const lyRevTotD  = datosMesLY.reduce((a,d)=>a+(d.revenue_total||0),0);
  const lyOccD     = lyHabDisD>0?(lyHabOcuD/lyHabDisD*100):null;
  const lyAdrD     = lyHabOcuD>0?(lyRevHabD/lyHabOcuD):null;
  const lyRevparD  = lyHabDisD>0?(lyRevHabD/lyHabDisD):null;
  const lyTrevparD = lyHabDisD>0?((lyRevHabD+lyRevFnbD)/lyHabDisD):null;

  const diff = (curr, prevLm, prevLy) => {
    const badge = (prev) => {
      if (prev==null||prev===0) return { ch:"—", up:true };
      const d=curr-prev; return { ch:`${d>=0?"+":""}${((d/prev)*100).toFixed(1)}%`, up:d>=0 };
    };
    const lm=badge(prevLm), ly=badge(prevLy);
    return { changeLm:lm.ch, upLm:lm.up, changeLy:ly.ch, upLy:ly.up };
  };

  const kpis = [
    { label: t("kpi_ocupacion"), kpiKey:"Ocupación", value: `${occ}%`,     ...diff(parseFloat(occ), prevOcc, lyOccD) },
    { label: t("kpi_adr"),       kpiKey:"ADR",        value: `€${adr}`,    subtitle:"Precio medio",                    ...diff(parseFloat(adr), prevAdr, lyAdrD) },
    { label: t("kpi_revpar"),    kpiKey:"RevPAR",     value: `€${revpar}`, subtitle:"Revenue por hab. disponible",     ...diff(parseFloat(revpar), prevRevpar, lyRevparD) },
    { label: t("kpi_trevpar"),   kpiKey:"TRevPAR",    value: `€${trevpar}`,subtitle:"Revenue total por hab.",          ...diff(parseFloat(trevpar), prevTrevpar, lyTrevparD) },
  ];

  return (
    <div>
      {/* ── CABECERA MES ACTIVO ── */}
      <div className="dash-header" style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:10, paddingBottom:10, borderBottom:`1px solid ${C.border}` }}>
        <div>
          <p style={{ fontSize:22, fontWeight:800, color:C.text, fontFamily:"'Plus Jakarta Sans',sans-serif", letterSpacing:-0.5, marginBottom:2 }}>
            {t("bienvenido")}, <span style={{ color:C.text }}>{datos.hotel?.nombre || "Mi Hotel"}</span>
          </p>
          <div style={{ display:"flex", alignItems:"baseline", gap:10 }}>
            <h2 style={{ fontFamily:"'Plus Jakarta Sans',sans-serif", fontSize:28, fontWeight:700, color:C.text, margin:0, letterSpacing:-0.5 }}>
              {t("meses_full")[mes]}
            </h2>
            <span style={{ fontSize:20, fontWeight:400, color:C.textLight }}>{anio}</span>
          </div>
        </div>
        <PeriodSelectorInline mes={mes} anio={anio} onChange={onPeriodo} aniosDisponibles={[...new Set((datos.produccion||[]).map(d=>new Date(d.fecha+"T00:00:00").getFullYear()))].sort()} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(clamp(140px,40vw,200px), 1fr))", gap: 10, marginBottom: 4 }}>
        {(kpiPreview || kpiOrder).map(key => kpis.find(k=>k.kpiKey===key)).filter(Boolean).map((k, i) => (
          <div key={k.kpiKey} draggable
            onDragStart={e => { kpiDragKey.current = k.kpiKey; e.dataTransfer.effectAllowed = "move"; setTimeout(() => setDraggingKpiKey(k.kpiKey), 0); }}
            onDragEnd={() => { if (kpiDragKey.current !== null && kpiPreview) { setKpiOrder(kpiPreview); localStorage.setItem("fr_kpi_order", JSON.stringify(kpiPreview)); } kpiDragKey.current = null; setKpiPreview(null); setDraggingKpiKey(null); }}
            onDragOver={e => { e.preventDefault(); const from=kpiDragKey.current; if (!from||from===k.kpiKey) return; const base=kpiPreview||kpiOrder; const fi=base.indexOf(from),ti=base.indexOf(k.kpiKey); if(fi===-1||ti===-1||fi===ti) return; const next=[...base]; next.splice(fi,1); next.splice(ti,0,from); setKpiPreview(next); }}
            onDrop={e => { e.preventDefault(); const c=kpiPreview||kpiOrder; setKpiOrder(c); localStorage.setItem("fr_kpi_order",JSON.stringify(c)); setKpiPreview(null); kpiDragKey.current=null; }}
            style={{ visibility: draggingKpiKey===k.kpiKey?"hidden":"visible", cursor:"grab", height:"100%" }}>
            <KpiCard {...k} i={i} onClick={()=>setKpiModal(k.kpiKey)} />
          </div>
        ))}
      </div>

      <p style={{ fontSize: 11, color: C.textLight, marginBottom: 10, marginTop: 0 }}>
        * Media mensual
      </p>

      {/* ── HEATMAP + GRÁFICAS ── */}
      {(() => {
        const MESES_H = t("meses_full");
        const DIAS_S  = t("dias_semana");
        // Ocupación por mes para el heatmap (real o OTB para futuros)
        const _pad = n => String(n).padStart(2,"0");
        const _hoy = new Date();
        const _hoyStr = `${_hoy.getFullYear()}-${_pad(_hoy.getMonth()+1)}-${_pad(_hoy.getDate())}`;
        const habFromProd = produccion.length > 0
          ? Math.round(produccion.reduce((a,r)=>a+(r.hab_disponibles||0),0)/produccion.length)
          : 30;
        const habHMes = (datos.hotel?.habitaciones && datos.hotel.habitaciones > 0)
          ? datos.hotel.habitaciones
          : habFromProd;
        const occPorMes = MESES_H.map((label, mi) => {
          // Produccion del mes actual
          const d = produccion.filter(r => {
            const f = new Date(r.fecha+"T00:00:00");
            return f.getMonth()===mi && f.getFullYear()===anio;
          });
          const habOcu = d.reduce((a,r)=>a+(r.hab_ocupadas||0),0);
          const habDis = d.reduce((a,r)=>a+(r.hab_disponibles||0),0);
          // Año anterior (LY)
          const dLY = produccion.filter(r => {
            const f = new Date(r.fecha+"T00:00:00");
            return f.getMonth()===mi && f.getFullYear()===anio-1;
          });
          const habOcuLY = dLY.reduce((a,r)=>a+(r.hab_ocupadas||0),0);
          const habDisLY = dLY.reduce((a,r)=>a+(r.hab_disponibles||0),0);
          const occLY = habDisLY>0 ? habOcuLY/habDisLY*100 : null;
          // Meses pasados con datos reales → produccion
          if (habDis>0) return { label, mi, occ: habOcu/habDis*100, occLY, esOtb: false };
          // Meses futuros (o sin produccion) → pickup OTB
          const mesStr = `${anio}-${_pad(mi+1)}`;
          const diasMes = new Date(anio, mi+1, 0).getDate();
          const ultimoDia = `${mesStr}-${_pad(diasMes)}`;
          if (ultimoDia < _hoyStr) return { label, mi, occ: null, occLY, esOtb: false };
          let totalRoomNights = 0;
          for (let di=1; di<=diasMes; di++) {
            totalRoomNights += habEnCasaMap[`${mesStr}-${_pad(di)}`] || 0;
          }
          const occ = habHMes > 0 && totalRoomNights > 0 ? (totalRoomNights / (habHMes * diasMes) * 100) : null;
          return { label, mi, occ, occLY, esOtb: true };
        });

        // Color heatmap — verde (baja) → amarillo → rojo (alta ocupación)
        const heatColor = (occ) => {
          if (occ==null) return C.border;
          if (occ<25)  return "#81C784";
          if (occ<40)  return "#4CAF50";
          if (occ<55)  return "#FFC107";
          if (occ<70)  return "#FF7043";
          if (occ<85)  return "#E53935";
          if (occ<100) return "#B71C1C";
          return "#7B0000"; // sobrebook
        };
        const heatBg = (occ) => occ!=null
          ? `linear-gradient(to bottom, ${heatColor(occ)}88, ${heatColor(occ)}33)`
          : C.bg;

        // Datos diarios del mes seleccionado (pasado=produccion, futuro=pickup)
        const habHotel = datos.hotel?.habitaciones ||
          (produccion.length > 0 ? Math.round(produccion.reduce((a,r)=>a+(r.hab_disponibles||0),0)/produccion.length) : 30);
        const _hoy2 = new Date();
        const pad2  = n => String(n).padStart(2,"0");
        const hoyStr2 = `${_hoy2.getFullYear()}-${pad2(_hoy2.getMonth()+1)}-${pad2(_hoy2.getDate())}`;


        // Habitaciones pernoctando por día — grupos directamente desde datos.grupos + individuales desde pickup
        const habPorDia = {};
        if (hmMesSel != null) {
          const padM = n => String(n).padStart(2,"0");
          const mesStr = `${anio}-${padM(hmMesSel+1)}`;
          const diasEnMes = new Date(anio, hmMesSel+1, 0).getDate();
          const mesInicio  = `${mesStr}-01`;
          const mesFin     = `${mesStr}-${padM(diasEnMes)}`;
          const mesFinPlus1 = hmMesSel === 11 ? `${anio+1}-01-01` : `${anio}-${padM(hmMesSel+2)}-01`;
          const isoLocal = d => `${d.getFullYear()}-${padM(d.getMonth()+1)}-${padM(d.getDate())}`;

          // 1) Grupos confirmados directamente desde datos.grupos (sin depender de entradas sintéticas)
          (datos.grupos||[]).filter(g => g.estado==="confirmado" && g.habitaciones>0 && g.fecha_inicio && g.fecha_fin).forEach(g => {
            let d = new Date(g.fecha_inicio+"T00:00:00");
            const fin = new Date(g.fecha_fin+"T00:00:00");
            while (d < fin) {
              const iso = isoLocal(d);
              if (iso >= mesInicio && iso <= mesFin) habPorDia[iso] = (habPorDia[iso]||0) + g.habitaciones;
              d.setDate(d.getDate()+1);
            }
          });

          // 2) Reservas individuales desde pickup (excluir entradas _grupo para evitar doble cuenta)
          const getFsSt = e => {
            if (e.fecha_salida) return String(e.fecha_salida).slice(0,10);
            if (e.noches && e.fecha_llegada) { const d=new Date(String(e.fecha_llegada).slice(0,10)+"T00:00:00"); d.setDate(d.getDate()+Number(e.noches)); return isoLocal(d); }
            return null;
          };
          const dd = {};
          pickupEntries.forEach(e => {
            if (e._grupo) return; // grupos ya contados arriba
            const est = e.estado||"confirmada";
            if (est === "cancelada" || est === "tentativo") return;
            const fl = String(e.fecha_llegada||"").slice(0,10);
            const fs = getFsSt(e) || "";
            if (!fl || !fs) return;
            const key = `${fl}|${e.canal||""}|${fs}`;
            const fp = String(e.fecha_pickup||"").slice(0,10);
            if (!dd[key] || fp > dd[key]._fp) dd[key] = { ...e, _fp: fp, _fs: fs };
          });
          Object.values(dd).forEach(e => {
            const fl = e.fecha_llegada ? String(e.fecha_llegada).slice(0,10) : "";
            const fs = e._fs || "";
            if (!fl || !fs) return;
            const nr = e.num_reservas || 1;
            const start = fl < mesInicio ? mesInicio : fl;
            const end   = fs > mesFinPlus1 ? mesFinPlus1 : fs;
            let cur = new Date(start+"T00:00:00");
            const endD = new Date(end+"T00:00:00");
            while (cur < endD) {
              const iso = isoLocal(cur);
              habPorDia[iso] = (habPorDia[iso]||0) + nr;
              cur.setDate(cur.getDate()+1);
            }
          });
        }
        // Alias para compatibilidad con código que leía netoPorDia
        const netoPorDia = habPorDia;

        const diasDelMes = hmMesSel!=null ? (() => {
          const diasEnMes = new Date(anio, hmMesSel+1, 0).getDate();
          const pad = n => String(n).padStart(2,"0");
          return Array.from({length:diasEnMes},(_,di)=>{
            const dt   = new Date(anio, hmMesSel, di+1);
            const iso  = `${anio}-${pad(hmMesSel+1)}-${pad(di+1)}`;
            const prod = produccion.find(r=>r.fecha===iso);
            const esFut = iso > hoyStr2;
            const neto  = habEnCasaMap[iso] || 0;
            let occ=null, adr=null;
            if (prod && !esFut) {
              const habDen = prod.hab_disponibles > 0 ? prod.hab_disponibles : habHotel;
              occ = habDen > 0 && prod.hab_ocupadas > 0 ? Math.round(prod.hab_ocupadas / habDen * 100) : null;
              adr = prod.hab_ocupadas > 0 && prod.revenue_hab > 0 ? Math.round(prod.revenue_hab / prod.hab_ocupadas) : calcAdrPickup(iso);
            } else {
              occ = habHotel > 0 && neto > 0 ? Math.round(neto / habHotel * 100) : null;
              adr = calcAdrPickup(iso);
            }
            const resUltDia = pickupUltimoDiaPorDia[iso] || 0;
            return { iso, dia:di+1, diaSem:dt.getDay(), occ, adr, esFut, tieneReal:!!prod, resUltDia, neto };
          });
        })() : [];

        return (
          <>
          {/* ── MODALES (fixed, fuera de la card combinada) ── */}

            {/* ── VISTA COMPLETA HEATMAP MENSUAL ── */}
            {hmMesSel!=null && (
              <div style={{ position:"fixed", inset:0, background:C.bg, zIndex:1000, display:"flex", flexDirection:"column", overflow:"hidden" }}>

                {/* Top bar */}
                <div style={{ padding:"10px 20px", borderBottom:`1px solid ${C.border}`, display:"flex", alignItems:"center", gap:10, flexShrink:0, background:C.bgCard }}>
                  <button onClick={()=>setHmMesSel(null)}
                    style={{ padding:"5px 12px", borderRadius:7, border:`1px solid ${C.border}`, background:C.bg, color:C.textMid, fontSize:12, fontWeight:600, cursor:"pointer", fontFamily:"inherit", display:"flex", alignItems:"center", gap:5 }}>
                    ← Volver
                  </button>
                  <button onClick={()=>setHmMesSel(m=>m>0?m-1:11)} style={{ background:C.bg, border:`1px solid ${C.border}`, borderRadius:6, width:28, height:28, cursor:"pointer", fontSize:14, color:C.textMid, display:"flex", alignItems:"center", justifyContent:"center", padding:0 }}>‹</button>
                  <h3 style={{ fontSize:16, fontWeight:700, color:C.text, minWidth:140, textAlign:"center" }}>{MESES_H[hmMesSel]} {anio}</h3>
                  <button onClick={()=>setHmMesSel(m=>m<11?m+1:0)} style={{ background:C.bg, border:`1px solid ${C.border}`, borderRadius:6, width:28, height:28, cursor:"pointer", fontSize:14, color:C.textMid, display:"flex", alignItems:"center", justifyContent:"center", padding:0 }}>›</button>
                  <div style={{ marginLeft:"auto" }}>
                    <button onClick={()=>{ setHmModoCrear(v=>!v); setHmDayModal(null); }}
                      style={{ padding:"5px 12px", borderRadius:7, border:"none", background:C.text, color:"#fff", fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:"inherit", display:"flex", alignItems:"center", gap:5, transition:"all 0.15s" }}>
                      <span style={{ fontSize:14 }}>+</span> Nuevo evento/grupo
                    </button>
                  </div>
                </div>

                {/* Content row */}
                <div style={{ flex:1, display:"flex", overflow:"hidden" }}>

                  {/* Left: day grid */}
                  <div style={{ flex:1, padding:"16px 24px", overflowY:"auto", minWidth:0, display:"flex", flexDirection:"column", alignItems:"center" }}>
                  <div style={{ width:"100%", maxWidth:480 }}>

                    {/* Días semana */}
                    <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:3, marginBottom:3 }}>
                      {t("dias_semana").map(d=>(
                        <p key={d} style={{ fontSize:10, color:C.textLight, textAlign:"center", fontWeight:600 }}>{d}</p>
                      ))}
                    </div>

                    {/* Grid días — semana a semana con barras de eventos */}
                    {(() => {
                      const _pad2 = n=>String(n).padStart(2,"0");
                      const mesPrefix = `${anio}-${_pad2(hmMesSel+1)}`;
                      const COL_GRUPO = "#059669", COL_EVENTO = "#2563EB";
                      const firstDayOffset = (diasDelMes[0]?.diaSem===0?6:diasDelMes[0]?.diaSem-1)||0;
                      const allCells = [...Array.from({length:firstDayOffset},()=>null), ...diasDelMes];
                      const weeks = [];
                      for (let i=0; i<allCells.length; i+=7) weeks.push(allCells.slice(i,i+7));
                      const gruposDelMes = (datos.grupos||[]).filter(g=>{
                        const ini=(g.fecha_inicio||"").slice(0,7);
                        const fin=(g.fecha_fin||g.fecha_inicio||"").slice(0,7);
                        return ini<=mesPrefix && fin>=mesPrefix;
                      });
                      const allEvs = [
                        ...gruposDelMes.map(g=>{ const finRaw=g.fecha_fin||g.fecha_inicio||""; const finD=new Date(finRaw+"T12:00:00"); finD.setDate(finD.getDate()-1); const yy=finD.getFullYear(),mm=String(finD.getMonth()+1).padStart(2,"0"),dd=String(finD.getDate()).padStart(2,"0"); const toISO=`${yy}-${mm}-${dd}`; const to=toISO>=(g.fecha_inicio||"") ? toISO : (g.fecha_inicio||""); return { from:g.fecha_inicio||"", to, title:g.nombre||"(sin nombre)", color:g.categoria==="evento"?COL_EVENTO:COL_GRUPO, id:g.id, categoria:g.categoria, tipo:"db" }; }),
                        ...hmEvents.map(ev=>({ from:ev.from, to:ev.to, title:ev.title||"(sin título)", color:COL_EVENTO, tipo:"manual" }))
                      ];
                      return (
                        <div onMouseLeave={()=>{ if(hmIsDragging) setHmIsDragging(false); }}>
                          {weeks.map((weekCells,wi)=>{
                            const weekISOs = weekCells.map(c=>c?`${anio}-${_pad2(hmMesSel+1)}-${_pad2(c.dia)}`:null);
                            const weekDays = weekISOs.filter(Boolean);
                            const weekStart=weekDays[0]||"", weekEnd=weekDays[weekDays.length-1]||"";
                            const eventsThisWeek = allEvs.filter(ev=>ev.from<=weekEnd&&ev.to>=weekStart);
                            return (
                              <React.Fragment key={wi}>
                                <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:3, marginBottom:eventsThisWeek.length>0?2:3 }}>
                                  {weekCells.map((cell,ci)=>{
                                    if(!cell) return (
                      <div key={"e"+ci} style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:2, visibility:"hidden" }}>
                        <p style={{ fontSize:13, fontWeight:700, lineHeight:1 }}>0</p>
                        <div style={{ width:"100%", aspectRatio:"1" }}/>
                      </div>
                    );
                                    const {dia,occ,adr,esFut,resUltDia}=cell;
                                    const resDia=resUltDia||0, tieneReserva=resDia>0;
                                    const isoDay=`${anio}-${_pad2(hmMesSel+1)}-${_pad2(dia)}`;
                                    const inSel=hmModoCrear&&hmIsDragging&&hmDragStart!=null&&hmDragEnd!=null&&dia>=Math.min(hmDragStart,hmDragEnd)&&dia<=Math.max(hmDragStart,hmDragEnd);
                                    const isDaySelected=hmDayModal===isoDay;
                                    const borderColor=isDaySelected?C.accent:inSel?"#3B82F6":tieneReserva?"#B8860B":occ!=null?heatColor(occ)+"CC":C.border;
                                    const bg=isDaySelected?C.accentLight:inSel?"#3B82F618":occ!=null?heatBg(occ):C.bg;
                                    return (
                                      <div key={dia} style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:2 }}>
                                        <p style={{ fontSize:13, fontWeight:700, color:isDaySelected?C.accent:C.text, lineHeight:1, textAlign:"center" }}>{dia}</p>
                                        <div
                                          style={{ width:"100%", aspectRatio:"1", borderRadius:5, background:bg, border:`${inSel||isDaySelected?"2px":"1.5px"} solid ${borderColor}`, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:1, position:"relative", cursor:hmModoCrear?"crosshair":esFut?"pointer":"default", userSelect:"none" }}
                                          onClick={()=>{ if(!hmModoCrear && esFut){setHmDayModal(isoDay===hmDayModal?null:isoDay);} }}
                                          onMouseDown={(e)=>{ if(!hmModoCrear)return; e.preventDefault(); setHmDragStart(dia); setHmDragEnd(dia); setHmIsDragging(true); }}
                                          onMouseEnter={()=>{ if(hmModoCrear&&hmIsDragging)setHmDragEnd(dia); }}
                                          onMouseUp={()=>{
                                            if(hmModoCrear&&hmIsDragging){
                                              setHmIsDragging(false);
                                              const from=Math.min(hmDragStart||dia,dia),to=Math.max(hmDragStart||dia,dia);
                                              if(from!==to){ setHmSelRango({fromISO:`${anio}-${_pad2(hmMesSel+1)}-${_pad2(from)}`,toISO:`${anio}-${_pad2(hmMesSel+1)}-${_pad2(to)}`}); }
                                            }
                                          }}>
                                          {tieneReserva&&<span style={{ position:"absolute", top:2, right:2, fontSize:8, lineHeight:1, animation:"pulse-rayo 1.5s ease-in-out infinite" }}>⚡</span>}
                                          {occ!=null?<p style={{ fontSize:11, fontWeight:800, color:"#111", lineHeight:1 }}>{occ.toFixed(0)}%</p>:<p style={{ fontSize:8, color:C.border }}>—</p>}
                                          {adr!=null&&<p style={{ fontSize:7, color:C.textMid, lineHeight:1, fontWeight:600 }}>€{Math.round(adr)}</p>}
                                          {resDia!==0&&<p style={{ fontSize:7, color:tieneReserva?"#B8860B":C.red, fontWeight:700, lineHeight:1 }}>{resDia>0?"+":""}{resDia}</p>}
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                                {eventsThisWeek.length>0&&(
                                  <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:3, marginBottom:3, gridAutoRows:"14px" }}>
                                    {eventsThisWeek.map((ev,ei)=>{
                                      const evFrom=ev.from>weekStart?ev.from:weekStart;
                                      const evTo=ev.to<weekEnd?ev.to:weekEnd;
                                      let c1=weekISOs.findIndex(iso=>iso===evFrom);
                                      if(c1<0) c1=weekISOs.findIndex(iso=>iso!==null)||0;
                                      let c2=weekISOs.lastIndexOf(evTo);
                                      if(c2<0) c2=weekISOs.map((iso,i)=>iso!==null?i:-1).filter(i=>i>=0).slice(-1)[0]||6;
                                      return (
                                        <div key={ei}
                                          onClick={()=>{ if(ev.tipo==="db"&&ev.id){ setHmMesSel(null); onNavigarGrupos&&onNavigarGrupos(ev.categoria==="evento"?"eventos":"grupos",ev.from,ev.to||ev.from,ev.id); } }}
                                          style={{ gridColumn:`${c1+1}/${c2+2}`, height:14, borderRadius:3, background:ev.color, display:"flex", alignItems:"center", paddingLeft:5, overflow:"hidden", cursor:ev.tipo==="db"?"pointer":"default" }}>
                                          <span style={{ fontSize:9, color:"#fff", fontWeight:700, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{ev.title}</span>
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}
                              </React.Fragment>
                            );
                          })}
                        </div>
                      );
                    })()}

                    {/* Leyenda */}
                    <div style={{ marginTop:10, display:"flex", flexWrap:"wrap", gap:6, alignItems:"center" }}>
                      {[["#81C784","<25%"],["#4CAF50","25-40%"],["#FFC107","40-55%"],["#FF7043","55-70%"],["#E53935","70-85%"],["#B71C1C",">85%"]].map(([col,lbl])=>(
                        <span key={lbl} style={{ display:"flex", alignItems:"center", gap:3, fontSize:9, color:C.textLight }}>
                          <span style={{ width:10, height:10, borderRadius:2, background:col, display:"inline-block" }}/>
                          {lbl}
                        </span>
                      ))}
                      <span style={{ fontSize:9, color:C.textLight, display:"flex", alignItems:"center", gap:3 }}>
                        <span style={{ fontSize:10 }}>⚡</span> Reserva captada
                      </span>
                      {hmModoCrear
                        ? <span style={{ fontSize:9, color:"#3B82F6", fontWeight:600, marginLeft:"auto" }}>Arrastra para seleccionar rango · ESC para cancelar</span>
                        : <span style={{ fontSize:9, color:C.textLight, marginLeft:"auto" }}>Pulsa un día para ver KPIs</span>
                      }
                    </div>
                  </div>
                  </div>

                  {/* Separator */}
                  <div style={{ width:1, background:C.border, flexShrink:0 }} />

                  {/* Right: grupos y eventos del mes */}
                  {(() => {
                    const _pad2 = n=>String(n).padStart(2,"0");
                    const mesPrefix = `${anio}-${_pad2(hmMesSel+1)}`;
                    const COL_GRUPO = "#059669", COL_EVENTO = "#2563EB";
                    const todasEntradas = (datos.grupos||[]).filter(g => {
                      const ini = (g.fecha_inicio||"").slice(0,7);
                      const fin = (g.fecha_fin||g.fecha_inicio||"").slice(0,7);
                      return ini <= mesPrefix && fin >= mesPrefix;
                    }).sort((a,b)=>a.fecha_inicio>b.fecha_inicio?1:-1);
                    const soloGrupos  = todasEntradas.filter(g => g.categoria !== "evento");
                    const soloEventos = todasEntradas.filter(g => g.categoria === "evento");
                    const evMes = hmEvents.map((ev,idx)=>({...ev,idx})).filter(ev => ev.from.slice(0,7)===mesPrefix || ev.to.slice(0,7)===mesPrefix);
                    const totalRev = todasEntradas.reduce((sum,g)=>{
                      const ini = new Date((g.fecha_inicio||mesPrefix+"-01")+"T00:00:00");
                      const fin = new Date((g.fecha_fin||g.fecha_inicio||mesPrefix+"-01")+"T00:00:00");
                      const noches = Math.max(1,(fin-ini)/86400000);
                      const peso = g.estado==="cancelado"?0:g.estado==="cotizado"||g.estado==="tentativo"?0.5:1.0;
                      return sum + ((g.habitaciones||0)*(g.adr_grupo||0)*noches+(g.revenue_fnb||0)+(g.revenue_sala||0))*peso;
                    },0);

                    const renderCard = (g, i, color) => {
                      const esEvento = g.categoria === "evento";
                      const ini = new Date((g.fecha_inicio||"")+"T00:00:00");
                      const fin = new Date((g.fecha_fin||g.fecha_inicio||"")+"T00:00:00");
                      const noches = Math.max(1,(fin-ini)/86400000);
                      const peso = g.estado==="cancelado"?0:g.estado==="cotizado"||g.estado==="tentativo"?0.5:1.0;
                      const rev = ((g.habitaciones||0)*(g.adr_grupo||0)*noches+(g.revenue_fnb||0)+(g.revenue_sala||0))*peso;
                      const estadoBadge = { confirmado:"#059669", cotizado:"#D97706", perdido:C.red, cancelado:C.red }[g.estado]||C.textLight;
                      return (
                        <div key={g.id||i}
                          onClick={()=>{ if(g.id){ setHmMesSel(null); onNavigarGrupos&&onNavigarGrupos(esEvento?"eventos":"grupos",g.fecha_inicio,g.fecha_fin||g.fecha_inicio,g.id); } }}
                          style={{ background:C.bgCard, borderRadius:9, padding:"10px 12px", marginBottom:8, borderLeft:`3px solid ${color}`, cursor:g.id?"pointer":"default", transition:"opacity 0.12s" }}
                          onMouseEnter={e=>{ if(g.id) e.currentTarget.style.opacity="0.75"; }}
                          onMouseLeave={e=>e.currentTarget.style.opacity="1"}>
                          <div style={{ display:"flex", alignItems:"flex-start", gap:8 }}>
                            <div style={{ flex:1, minWidth:0 }}>
                              <p style={{ fontSize:12, fontWeight:700, color:C.text, marginBottom:2, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{g.nombre||"(sin nombre)"}</p>
                              <div style={{ display:"flex", gap:6, flexWrap:"wrap", alignItems:"center" }}>
                                <span style={{ fontSize:10, color:C.textLight }}>
                                  {dmy(g.fecha_inicio)}
                                  {!esEvento && g.fecha_fin && g.fecha_fin!==g.fecha_inicio && ` – ${dmy(g.fecha_fin)}`}
                                </span>
                                {!esEvento && g.habitaciones>0 && (
                                  <span style={{ fontSize:10, color:C.textLight }}>{g.habitaciones} hab · {noches} noche{noches!==1?"s":""}</span>
                                )}
                                <span style={{ fontSize:9, fontWeight:700, color:estadoBadge, textTransform:"capitalize" }}>{g.estado||""}</span>
                              </div>
                            </div>
                            {rev>0 && <span style={{ fontSize:12, fontWeight:700, color:C.text, flexShrink:0 }}>€{Math.round(rev).toLocaleString("es-ES")}</span>}
                          </div>
                        </div>
                      );
                    };

                    return (
                      <div style={{ width:340, padding:"20px 20px", overflowY:"auto", flexShrink:0 }}>
                        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:14 }}>
                          <p style={{ fontSize:13, fontWeight:700, color:C.text }}>Grupos y eventos</p>
                          {totalRev>0 && <span style={{ fontSize:11, fontWeight:700, color:C.accent }}>€{Math.round(totalRev).toLocaleString("es-ES")}</span>}
                        </div>

                        {todasEntradas.length===0 && evMes.length===0 && (
                          <p style={{ fontSize:12, color:C.textLight, textAlign:"center", marginTop:40 }}>Sin grupos ni eventos este mes</p>
                        )}

                        {soloGrupos.length>0 && (
                          <>
                            <p style={{ fontSize:10, fontWeight:700, color:COL_GRUPO, textTransform:"uppercase", letterSpacing:"1px", marginBottom:8 }}>Grupos</p>
                            {soloGrupos.map((g,i)=>renderCard(g,i,COL_GRUPO))}
                          </>
                        )}

                        {soloEventos.length>0 && (
                          <>
                            {soloGrupos.length>0 && <div style={{ height:1, background:C.border, margin:"10px 0" }}/>}
                            <p style={{ fontSize:10, fontWeight:700, color:COL_EVENTO, textTransform:"uppercase", letterSpacing:"1px", marginBottom:8 }}>Eventos</p>
                            {soloEventos.map((g,i)=>renderCard(g,i,COL_EVENTO))}
                          </>
                        )}

                        {evMes.length>0 && (
                          <>
                            {todasEntradas.length>0 && <div style={{ height:1, background:C.border, margin:"10px 0" }}/>}
                            <p style={{ fontSize:10, fontWeight:700, color:C.textLight, textTransform:"uppercase", letterSpacing:"1px", marginBottom:8 }}>Eventos manuales</p>
                            {evMes.map(ev=>(
                              <div key={ev.idx} style={{ display:"flex", alignItems:"center", gap:8, marginBottom:6, background:C.bgCard, borderRadius:7, padding:"7px 10px", borderLeft:`3px solid ${COL_EVENTO}` }}>
                                <span style={{ fontSize:12, fontWeight:600, color:C.text, flex:1, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{ev.title||"(sin título)"}</span>
                                <span style={{ fontSize:10, color:C.textLight, flexShrink:0 }}>{dmy(ev.from)} – {dmy(ev.to)}</span>
                                <button onClick={()=>borrarHmEvent(ev.idx)} style={{ background:"none", border:"none", cursor:"pointer", color:C.red, fontSize:13, padding:"0 2px", lineHeight:1, flexShrink:0 }}>×</button>
                              </div>
                            ))}
                          </>
                        )}
                      </div>
                    );
                  })()}
                </div>
              </div>
            )}

            {/* ── MODAL KPI DÍA ── */}
            {hmDayModal && hmMesSel!=null && hmDayModal.slice(0,7) === `${anio}-${String(hmMesSel+1).padStart(2,'0')}` && (() => {
              const iso = hmDayModal;
              const diaN = parseInt(iso.slice(8,10));
              const dt = new Date(iso+"T00:00:00");
              const diasSemNombre = ["Dom","Lun","Mar","Mié","Jue","Vie","Sáb"];
              const labelDia = `${diasSemNombre[dt.getDay()]} ${diaN} ${MESES_H[hmMesSel]} ${anio}`;

              const dayData = diasDelMes.find(d => d.dia === diaN);

              const getFechaSalidaD = e => {
                if (e.fecha_salida) return String(e.fecha_salida).slice(0,10);
                if (e.noches && e.fecha_llegada) { const d=new Date(String(e.fecha_llegada).slice(0,10)); d.setDate(d.getDate()+Number(e.noches)); return d.toISOString().slice(0,10); }
                return null;
              };
              // Deduplicar pickup reports; reservas individuales se cuentan sin deduplicar
              const dedupMap = {};
              const individualesIso = [];
              (pickupEntries||[]).forEach((e, idx) => {
                const est = e.estado||"confirmada";
                if (est === "cancelada") return;
                const fl = String(e.fecha_llegada||"").slice(0,10);
                const fs = getFechaSalidaD(e) || "";
                if (e.es_individual) {
                  if (fl && fs && fl <= iso && fs > iso) individualesIso.push(e);
                  return;
                }
                const key = e._grupo ? `_g|${fl}|${e._grupoId||e.canal||""}` : `${fl}|${e.canal||""}|${fs}`;
                const fp = String(e.fecha_pickup||"").slice(0,10);
                if (!dedupMap[key] || fp > dedupMap[key]._fp) dedupMap[key] = { ...e, _fp: fp };
              });
              const activasIso = [...individualesIso, ...Object.values(dedupMap).filter(e => {
                if (e._grupo) return String(e.fecha_llegada||"").slice(0,10) === iso;
                const fl = String(e.fecha_llegada||"").slice(0,10);
                const fs = getFechaSalidaD(e);
                return fl && fs && fl <= iso && fs > iso;
              })];
              // Grupos con actividad en este día
              const gruposDia = (datos.grupos||[]).filter(g =>
                g.fecha_inicio <= iso && (g.fecha_fin||g.fecha_inicio) >= iso &&
                (g.estado==="confirmado"||g.estado==="cotizado"||g.estado==="tentativo"||g.estado==="cancelado")
              );

              const _isGrupoCanal = c => { const lc=(c||"").toLowerCase(); return lc.includes("grupo")||lc.includes("mice")||lc.includes("evento"); };

              // Canal map: solo canales de distribución individual
              const canalMap = {};
              activasIso.forEach(e => {
                if (e._grupo) return;
                const c = e.canal||"Directo";
                if (_isGrupoCanal(c)) return;
                canalMap[c] = (canalMap[c]||0) + (e.num_reservas||1);
              });
              // Añadir grupos confirmados con su número real de habitaciones
              const habGruposConf = gruposDia.filter(g=>g.estado==="confirmado").reduce((a,g)=>a+(g.habitaciones||0),0);
              if (habGruposConf > 0) canalMap["Grupos / MICE"] = habGruposConf;

              const canales = Object.entries(canalMap).sort((a,b)=>b[1]-a[1]);
              const totalRes = canales.reduce((a,[,v])=>a+v,0);
              const habIndividual = totalRes;

              const habHotelModal = datos.hotel?.habitaciones || habHotel;
              const prodDia = (produccion||[]).find(r => r.fecha === iso);
              const esFutModal = iso > hoyStr2;
              let occ, adr;
              if (prodDia && !esFutModal) {
                const habDenModal = prodDia.hab_disponibles > 0 ? prodDia.hab_disponibles : habHotelModal;
                occ = habDenModal > 0 && prodDia.hab_ocupadas > 0 ? Math.round(prodDia.hab_ocupadas / habDenModal * 100) : null;
                adr = prodDia.hab_ocupadas > 0 && prodDia.revenue_hab > 0 ? Math.round(prodDia.revenue_hab / prodDia.hab_ocupadas) : calcAdrPickup(iso);
              } else {
                const totalHabOcup = habIndividual;
                occ = habHotelModal > 0 && totalHabOcup > 0 ? Math.round(totalHabOcup / habHotelModal * 100) : null;
                adr = calcAdrPickup(iso);
              }

              // Antelación: reservas con llegada ese día, deduplicadas, antelación = fecha_llegada - fecha_pickup más antiguo
              const resEseDia = Object.values(dedupMap).filter(e => String(e.fecha_llegada||"").slice(0,10)===iso);
              let antelMediaDias = null;
              if (resEseDia.length > 0) {
                // Para la antelación queremos el pickup más antiguo (cuándo se creó la reserva)
                const dedupAntel = {};
                (pickupEntries||[]).forEach(e => {
                  const est = e.estado||"confirmada";
                  if (est === "cancelada") return;
                  const fl = String(e.fecha_llegada||"").slice(0,10);
                  if (fl !== iso) return;
                  const fs = getFechaSalidaD(e) || "";
                  const key = `${fl}|${e.canal||""}|${fs}`;
                  const fp = String(e.fecha_pickup||"").slice(0,10);
                  if (!dedupAntel[key] || fp < dedupAntel[key]._fp) dedupAntel[key] = { ...e, _fp: fp };
                });
                const dias = Object.values(dedupAntel).map(e => {
                  const fp = e._fp;
                  if (!fp) return null;
                  return Math.round((new Date(iso)-new Date(fp))/86400000);
                }).filter(d => d!=null && d>=0);
                if (dias.length > 0) antelMediaDias = Math.round(dias.reduce((a,b)=>a+b,0)/dias.length);
              }

              return (
                <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.55)", zIndex:1200, display:"flex", alignItems:"center", justifyContent:"center", padding:24 }}
                  onClick={()=>setHmDayModal(null)}>
                  <div style={{ background:C.bgCard, borderRadius:16, width:"100%", maxWidth:640, maxHeight:"88vh", overflowY:"auto", padding:"28px 32px", boxShadow:"0 24px 80px rgba(0,0,0,0.35)" }}
                    onClick={e=>e.stopPropagation()}>

                    {/* Cabecera */}
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:24, paddingBottom:18, borderBottom:`1px solid ${C.border}` }}>
                      <div>
                        <p style={{ fontSize:11, color:C.textLight, textTransform:"uppercase", letterSpacing:"2px", fontWeight:600, marginBottom:4 }}>Resumen del día</p>
                        <h2 style={{ fontSize:24, fontWeight:800, color:C.text, fontFamily:"'Plus Jakarta Sans',sans-serif", letterSpacing:-0.5, margin:0 }}>{labelDia}</h2>
                      </div>
                      <button onClick={()=>setHmDayModal(null)} style={{ background:"none", border:`1.5px solid ${C.border}`, borderRadius:8, width:36, height:36, cursor:"pointer", fontSize:18, color:C.textMid, display:"flex", alignItems:"center", justifyContent:"center", padding:0 }}>×</button>
                    </div>

                    {/* OCC + ADR + Antelación en fila */}
                    <div style={{ display:"grid", gridTemplateColumns: antelMediaDias!=null ? "1fr 1fr 1fr" : "1fr 1fr", gap:12, marginBottom:24 }}>
                      <div style={{ background:C.bg, borderRadius:12, padding:"16px 18px" }}>
                        <p style={{ fontSize:10, color:C.textLight, textTransform:"uppercase", letterSpacing:"1px", marginBottom:6 }}>Ocupación</p>
                        <p style={{ fontSize:32, fontWeight:800, color: occ!=null ? heatColor(occ) : C.border, lineHeight:1 }}>
                          {occ!=null ? `${occ.toFixed(0)}%` : "—"}
                        </p>
                      </div>
                      <div style={{ background:C.bg, borderRadius:12, padding:"16px 18px" }}>
                        <p style={{ fontSize:10, color:C.textLight, textTransform:"uppercase", letterSpacing:"1px", marginBottom:6 }}>ADR</p>
                        <p style={{ fontSize:32, fontWeight:800, color:C.text, lineHeight:1 }}>
                          {adr!=null ? `€${Math.round(adr)}` : "—"}
                        </p>
                      </div>
                      {antelMediaDias != null && (
                        <div style={{ background:C.bg, borderRadius:12, padding:"16px 18px" }}>
                          <p style={{ fontSize:10, color:C.textLight, textTransform:"uppercase", letterSpacing:"1px", marginBottom:6 }}>Antelación media</p>
                          <p style={{ fontSize:32, fontWeight:800, color:C.text, lineHeight:1 }}>{antelMediaDias}<span style={{ fontSize:14, fontWeight:600, color:C.textMid, marginLeft:4 }}>días</span></p>
                        </div>
                      )}
                    </div>

                    {/* Grupos/eventos + Origen lado a lado si hay ambos, o full width si solo uno */}
                    <div style={{ display:"grid", gridTemplateColumns: gruposDia.length>0 && canales.length>0 ? "1fr 1fr" : "1fr", gap:20 }}>

                      {/* Grupos/eventos */}
                      {gruposDia.length > 0 && (
                        <div>
                          <p style={{ fontSize:11, fontWeight:700, color:C.textMid, textTransform:"uppercase", letterSpacing:"1.5px", marginBottom:12 }}>Grupos / Eventos</p>
                          {gruposDia.map((g,i) => (
                            <div key={i} onClick={()=>{ setHmDayModal(null); setHmMesSel(null); onNavigarGrupos && onNavigarGrupos(g.tipo==="evento"?"eventos":"grupos", g.fecha_inicio, g.fecha_fin||g.fecha_inicio, g.id); }}
                              style={{ display:"flex", alignItems:"center", gap:10, marginBottom:8, padding:"10px 14px", background:C.bg, borderRadius:10, border:`1px solid ${C.border}`, cursor:"pointer", transition:"background 0.12s" }}
                              onMouseEnter={e=>e.currentTarget.style.background=C.accentLight}
                              onMouseLeave={e=>e.currentTarget.style.background=C.bg}>
                              <span style={{ fontSize:18 }}>{g.tipo==="evento"?"📌":"🏨"}</span>
                              <div style={{ flex:1, minWidth:0 }}>
                                <p style={{ fontSize:13, fontWeight:700, color:C.text, margin:0, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{g.nombre}</p>
                                {g.habitaciones ? <p style={{ fontSize:11, color:C.textLight, margin:0 }}>{g.habitaciones} hab.</p> : null}
                              </div>
                              <span style={{ fontSize:10, padding:"3px 7px", borderRadius:5, background: g.estado==="confirmado"?"#16a34a22":g.estado==="cancelado"?"#99999922":"#ca8a0422", color: g.estado==="confirmado"?"#16a34a":g.estado==="cancelado"?"#999":"#ca8a04", fontWeight:700, flexShrink:0 }}>{g.estado}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Origen reservas */}
                      {canales.length > 0 && (
                        <div>
                          <p style={{ fontSize:11, fontWeight:700, color:C.textMid, textTransform:"uppercase", letterSpacing:"1.5px", marginBottom:12 }}>Mix de canales</p>
                          {canales.map(([canal, n]) => (
                            <div key={canal} style={{ marginBottom:10 }}>
                              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
                                <span style={{ fontSize:12, color:C.text }}>{canal}</span>
                                <span style={{ fontSize:12, fontWeight:700, color:C.text }}>{n} <span style={{ color:C.textLight, fontWeight:400 }}>({totalRes>0?Math.round(n/totalRes*100):0}%)</span></span>
                              </div>
                              <div style={{ height:5, borderRadius:3, background:C.border, overflow:"hidden" }}>
                                <div style={{ height:"100%", width:`${totalRes>0?n/totalRes*100:0}%`, background:C.accent, borderRadius:3 }}/>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Listado de reservas con número */}
                    {(() => {
                      const resIndiv = activasIso.filter(e => !e._grupo && !_isGrupoCanal(e.canal));
                      const gruposEnCasa = gruposDia.filter(g => g.estado !== "cancelado");
                      if (resIndiv.length === 0 && gruposEnCasa.length === 0) return null;
                      const totalHabs = resIndiv.reduce((a,e) => a + (e.num_reservas||1), 0) + gruposEnCasa.reduce((a,g) => a + (g.habitaciones||0), 0);
                      return (
                        <div style={{ marginTop:20 }}>
                          <p style={{ fontSize:11, fontWeight:700, color:C.textMid, textTransform:"uppercase", letterSpacing:"1.5px", marginBottom:12 }}>Reservas en casa</p>
                          <div style={{ overflowX:"auto" }}>
                            <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12 }}>
                              <thead>
                                <tr>
                                  {["Nº Reserva","Canal","Llegada","Salida","Habs","Precio"].map(h => (
                                    <th key={h} style={{ padding:"7px 12px", textAlign: h==="Precio" ? "right" : "left", fontSize:10, fontWeight:600, color:C.textLight, textTransform:"uppercase", letterSpacing:"0.8px", borderBottom:`2px solid ${C.border}`, whiteSpace:"nowrap" }}>{h}</th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                {resIndiv.sort((a,b)=>(a.numero_reserva||0)-(b.numero_reserva||0)).map((e, i) => (
                                  <tr key={i}
                                    onClick={() => setHmEditEntry(e)}
                                    style={{ borderBottom:`1px solid ${C.border}`, background: i%2===0 ? C.bg : C.bgCard, cursor:"pointer", transition:"background 0.1s" }}
                                    onMouseEnter={ev => ev.currentTarget.style.background = C.accentLight}
                                    onMouseLeave={ev => ev.currentTarget.style.background = i%2===0 ? C.bg : C.bgCard}>
                                    <td style={{ padding:"8px 12px", color:C.textMid, fontVariantNumeric:"tabular-nums" }}>{e.numero_reserva || "—"}</td>
                                    <td style={{ padding:"8px 12px", fontWeight:600, color:C.text }}>{e.canal || "—"}</td>
                                    <td style={{ padding:"8px 12px", color:C.textMid }}>{dmy(e.fecha_llegada)}</td>
                                    <td style={{ padding:"8px 12px", color:C.textMid }}>{getFechaSalidaD(e) || "—"}</td>
                                    <td style={{ padding:"8px 12px", color:C.textMid, textAlign:"center" }}>{e.num_reservas || 1}</td>
                                    <td style={{ padding:"8px 12px", fontWeight:600, color:"#1A7A3C", textAlign:"right", whiteSpace:"nowrap" }}>{e.precio_total ? `€${Number(e.precio_total).toLocaleString("es-ES")}` : "—"}</td>
                                  </tr>
                                ))}
                                {gruposEnCasa.map((g, i) => (
                                  <tr key={"g"+i}
                                    onClick={() => { setHmDayModal(null); setHmMesSel(null); onNavigarGrupos && onNavigarGrupos(g.tipo==="evento"?"eventos":"grupos", g.fecha_inicio, g.fecha_fin||g.fecha_inicio, g.id); }}
                                    style={{ borderBottom:`1px solid ${C.border}`, background: (resIndiv.length+i)%2===0 ? C.bg : C.bgCard, cursor:"pointer", transition:"background 0.1s" }}
                                    onMouseEnter={ev => ev.currentTarget.style.background = C.accentLight}
                                    onMouseLeave={ev => ev.currentTarget.style.background = (resIndiv.length+i)%2===0 ? C.bg : C.bgCard}>
                                    <td style={{ padding:"8px 12px", color:C.textMid }}>—</td>
                                    <td style={{ padding:"8px 12px", fontWeight:600, color:C.text, display:"flex", alignItems:"center", gap:5 }}>
                                      <span style={{ fontSize:12 }}>{g.tipo==="evento"?"📌":"🏨"}</span>{g.nombre}
                                    </td>
                                    <td style={{ padding:"8px 12px", color:C.textMid }}>{dmy(g.fecha_inicio)}</td>
                                    <td style={{ padding:"8px 12px", color:C.textMid }}>{g.fecha_fin ? dmy(g.fecha_fin) : "—"}</td>
                                    <td style={{ padding:"8px 12px", color:C.textMid, textAlign:"center" }}>{g.habitaciones || "—"}</td>
                                    <td style={{ padding:"8px 12px", color:C.textMid, textAlign:"right", whiteSpace:"nowrap" }}>—</td>
                                  </tr>
                                ))}
                              </tbody>
                              <tfoot>
                                <tr style={{ borderTop:`2px solid ${C.border}` }}>
                                  <td colSpan={4} style={{ padding:"8px 12px", fontSize:11, fontWeight:700, color:C.textMid, textTransform:"uppercase", letterSpacing:"0.8px" }}>Total</td>
                                  <td style={{ padding:"8px 12px", fontWeight:800, color:C.text, textAlign:"center" }}>{totalHabs}</td>
                                  <td/>
                                </tr>
                              </tfoot>
                            </table>
                          </div>
                        </div>
                      );
                    })()}

                    {canales.length===0 && gruposDia.length===0 && antelMediaDias==null && (
                      <p style={{ fontSize:13, color:C.textLight, textAlign:"center", padding:"24px 0" }}>Sin datos de reservas para este día</p>
                    )}
                  </div>
                </div>
              );
            })()}

            {hmEditEntry && <ModalEditarReserva entry={hmEditEntry} onClose={() => setHmEditEntry(null)} />}

            {/* ── FORM EVENTO HEATMAP ── */}
            {hmSelRango && (
              <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.55)", zIndex:1100, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}
                onClick={()=>setHmSelRango(null)}>
                <div style={{ background:C.bgCard, borderRadius:14, width:"100%", maxWidth:340, padding:"24px", boxShadow:"0 20px 60px rgba(0,0,0,0.3)" }}
                  onClick={e=>e.stopPropagation()}>
                  <p style={{ fontSize:10, color:C.textLight, textTransform:"uppercase", letterSpacing:"1.5px", fontWeight:600, marginBottom:8 }}>Período seleccionado</p>
                  <div style={{ display:"flex", gap:8, marginBottom:20, padding:"8px 12px", background:C.bg, borderRadius:8, border:`1px solid ${C.border}` }}>
                    <span style={{ fontSize:13, color:C.textLight }}>📅</span>
                    <span style={{ fontSize:13, fontWeight:700, color:C.accent }}>
                      {hmSelRango.fromISO.split("-").reverse().join("/")} — {hmSelRango.toISO.split("-").reverse().join("/")}
                    </span>
                  </div>
                  <p style={{ fontSize:13, color:C.textMid, marginBottom:14 }}>¿Qué quieres crear para este período?</p>
                  <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                    <button onClick={()=>{ setHmSelRango(null); onNavigarGrupos && onNavigarGrupos("grupos", hmSelRango.fromISO, hmSelRango.toISO); }}
                      style={{ padding:"12px 16px", borderRadius:10, border:`1.5px solid ${C.border}`, background:C.bg, color:C.text, fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:"inherit", textAlign:"left", display:"flex", alignItems:"center", gap:10, transition:"background 0.12s" }}
                      onMouseEnter={e=>e.currentTarget.style.background=C.accentLight}
                      onMouseLeave={e=>e.currentTarget.style.background=C.bg}>
                      <span style={{ fontSize:18 }}>🏨</span>
                      <div>
                        <p style={{ fontSize:13, fontWeight:700, color:C.text, margin:0 }}>Nuevo grupo</p>
                        <p style={{ fontSize:11, color:C.textLight, margin:0, fontWeight:400 }}>Grupo de habitaciones con cotización</p>
                      </div>
                    </button>
                    <button onClick={()=>{ setHmSelRango(null); onNavigarGrupos && onNavigarGrupos("eventos", hmSelRango.fromISO, hmSelRango.toISO); }}
                      style={{ padding:"12px 16px", borderRadius:10, border:`1.5px solid ${C.border}`, background:C.bg, color:C.text, fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:"inherit", textAlign:"left", display:"flex", alignItems:"center", gap:10, transition:"background 0.12s" }}
                      onMouseEnter={e=>e.currentTarget.style.background=C.accentLight}
                      onMouseLeave={e=>e.currentTarget.style.background=C.bg}>
                      <span style={{ fontSize:18 }}>📌</span>
                      <div>
                        <p style={{ fontSize:13, fontWeight:700, color:C.text, margin:0 }}>Nuevo evento</p>
                        <p style={{ fontSize:11, color:C.textLight, margin:0, fontWeight:400 }}>Feria, congreso u otro evento externo</p>
                      </div>
                    </button>
                  </div>
                  <button onClick={()=>setHmSelRango(null)}
                    style={{ marginTop:14, width:"100%", padding:"7px", borderRadius:8, border:`1px solid ${C.border}`, background:"transparent", color:C.textLight, fontSize:12, fontWeight:600, cursor:"pointer", fontFamily:"inherit" }}>
                    Cancelar
                  </button>
                </div>
              </div>
            )}

          <Card style={{ display:"flex", padding:0, overflow:"hidden", marginBottom:16 }}>

            {/* ── HEATMAP (izquierda) ── */}
            <div style={{ flex: hmVista === "diario" ? 3 : 2, padding:"20px 22px", display:"flex", flexDirection:"column" }}>
              {/* Header con toggle */}
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:14 }}>
                <p style={{ fontSize:11, fontWeight:700, color:C.textMid, textTransform:"uppercase", letterSpacing:"1.5px" }}>
                  {hmVista === "diario"
                    ? <>{t("meses_full")[mes].toUpperCase()} {anio} <span style={{ color:C.accent }}>| DIARIO</span></>
                    : <>{t("ocup_mensual")} <span style={{ color:C.accent }}>| {t("meses_full")[mes].toUpperCase()} {anio}</span></>
                  }
                </p>
                <div style={{ display:"flex", borderRadius:6, overflow:"hidden", border:`1px solid ${C.border}`, flexShrink:0 }}>
                  {[["mensual","Mensual"],["diario","Diario"]].map(([key, label]) => (
                    <button key={key} onClick={() => setHmVista(key)}
                      style={{ padding:"4px 11px", fontSize:11, fontWeight:600, border:"none", cursor:"pointer", fontFamily:"inherit",
                        background: hmVista === key ? C.text : "transparent",
                        color:      hmVista === key ? "#fff"  : C.textMid,
                        transition:"all 0.15s" }}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* ── Vista mensual (4×3 grid) ── */}
              {hmVista === "mensual" && (<>
                <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gridTemplateRows:"repeat(3,1fr)", gap:8, flex:1 }}>
                  {occPorMes.map(({label, mi, occ, esOtb})=>{
                    const mesKey = `${anio}-${String(mi+1).padStart(2,"0")}`;
                    const resUltDia = pickupUltimoDiaPorMes[mesKey] || 0;
                    const esCaliente = top2Meses.includes(mesKey) && resUltDia > 0;
                    const esMesActual = mi === mes;
                    return (
                      <div key={mi} onClick={()=>setHmMesSel(mi)}
                        title={occ!=null?`${label}: ${occ.toFixed(0)}%`:""}
                        style={{
                          borderRadius:8, padding:"10px 6px", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center",
                          background: occ!=null ? heatBg(occ) : C.bg,
                          border:`2px solid ${esMesActual ? C.accent : esCaliente?"#E85D04":occ!=null?heatColor(occ)+"CC":C.border}`,
                          cursor:"pointer", textAlign:"center", transition:"all 0.15s", position:"relative"
                        }}
                        onMouseEnter={e=>e.currentTarget.style.opacity="0.8"} onMouseLeave={e=>e.currentTarget.style.opacity="1"}>
                        {esCaliente && (
                          <span title={`${resUltDia} reservas captadas el ${ultimoDiaImportado}`} style={{ position:"absolute", top:4, right:5, fontSize:14, lineHeight:1, animation:"pulse-rayo 1.5s ease-in-out infinite" }}>⚡</span>
                        )}
                        <p style={{ fontSize:12, fontWeight:700, color:C.textLight, textTransform:"uppercase", letterSpacing:0.5, marginBottom:3 }}>{label}</p>
                        {occ!=null
                          ? <p style={{ fontSize:17, fontWeight:800, color:C.text, fontFamily:"'Plus Jakarta Sans',sans-serif" }}>{occ.toFixed(0)}%</p>
                          : <p style={{ fontSize:12, color:C.border }}>—</p>
                        }
                        {resUltDia !== 0
                          ? <p style={{ fontSize:8, color:resUltDia>0?"#E85D04":C.red, fontWeight:700, marginTop:2 }}>{resUltDia>0?"+":""}{resUltDia} res.</p>
                          : esOtb && occ!=null
                            ? <p style={{ fontSize:8, color:"#7A9CC8", fontWeight:700, marginTop:2 }}>OTB</p>
                            : null
                        }
                      </div>
                    );
                  })}
                </div>
                <p style={{ fontSize:10, color:C.textLight, marginTop:8, display:"flex", alignItems:"center", gap:4 }}>
                  <span style={{ fontSize:12 }}>⚡</span> Meses con mayor captación en el último día &nbsp;·&nbsp; <span style={{ fontSize:10, color:"#7A9CC8", fontWeight:700 }}>OTB</span> Dato estimado por reservas en cartera
                </p>
              </>)}

              {/* ── Vista diaria (calendario mes actual) ── */}
              {hmVista === "diario" && (() => {
                const p2 = n => String(n).padStart(2,"0");
                const diasEnMes = new Date(anio, mes+1, 0).getDate();
                const diasDiario = Array.from({length: diasEnMes}, (_, di) => {
                  const dt = new Date(anio, mes, di+1);
                  const iso = `${anio}-${p2(mes+1)}-${p2(di+1)}`;
                  const isHoy = iso === hoyStr2;
                  const isFut = iso > hoyStr2;
                  // Siempre pickup como fuente principal (incluye hoy y pasado)
                  const neto = habEnCasaMap[iso] || 0;
                  const occ = habHotel > 0 && neto > 0 ? Math.round(neto / habHotel * 100) : null;
                  const adr = calcAdrPickup(iso);
                  return { iso, dia: di+1, diaSem: dt.getDay(), occ, adr, isHoy, isFut };
                });
                // Primer día de semana del mes (lunes=0 … domingo=6)
                const primerDow = new Date(anio, mes, 1).getDay();
                const offsetLun = (primerDow + 6) % 7; // desplazamiento para empezar en lunes
                const DIAS_LABEL = ["L","M","X","J","V","S","D"];
                const celdas = [...Array(offsetLun).fill(null), ...diasDiario];
                return (
                  <div style={{ flex:1, display:"flex", flexDirection:"column" }}>
                    {/* Cabecera días semana */}
                    <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:3, marginBottom:3 }}>
                      {DIAS_LABEL.map(d => (
                        <div key={d} style={{ textAlign:"center", fontSize:9, fontWeight:700, color:C.textLight, textTransform:"uppercase", letterSpacing:"0.5px", padding:"2px 0" }}>{d}</div>
                      ))}
                    </div>
                    {/* Días */}
                    <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:3, flex:1 }}>
                      {celdas.map((dia, idx) => {
                        if (!dia) return <div key={`e${idx}`}/>;
                        const { iso, dia: n, occ, adr, isHoy, isFut, diaSem } = dia;
                        const esFinde = diaSem === 0 || diaSem === 6;
                        return (
                          <div key={iso} onClick={() => { setHmMesSel(mes); setHmDayModal(iso); }}
                            title={occ!=null ? `${n} ${MESES_H[mes]}: ${occ}%${adr!=null?` · ADR €${Math.round(adr)}`:""}` : "Sin datos"}
                            style={{
                              borderRadius:6, padding:"5px 3px", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center",
                              background: occ!=null ? heatBg(occ) : esFinde ? `${C.border}55` : C.bg,
                              border:`1.5px solid ${isHoy ? C.accent : occ!=null ? heatColor(occ)+"99" : C.border}`,
                              cursor:"pointer", textAlign:"center", transition:"opacity 0.12s", minHeight:52,
                            }}
                            onMouseEnter={e=>e.currentTarget.style.opacity="0.75"}
                            onMouseLeave={e=>e.currentTarget.style.opacity="1"}>
                            <p style={{ fontSize:10, fontWeight: isHoy ? 800 : 600, color: isHoy ? C.accent : C.textLight, lineHeight:1, marginBottom:2 }}>{n}</p>
                            {occ!=null
                              ? <p style={{ fontSize:13, fontWeight:800, color:C.text, lineHeight:1 }}>{occ}%</p>
                              : <p style={{ fontSize:10, color:C.border, lineHeight:1 }}>—</p>
                            }
                            {adr!=null && <p style={{ fontSize:8, color:C.textLight, fontWeight:600, marginTop:1, lineHeight:1 }}>€{Math.round(adr)}</p>}
                          </div>
                        );
                      })}
                    </div>
                    <p style={{ fontSize:10, color:C.textLight, marginTop:6, display:"flex", alignItems:"center", gap:4 }}>
                      <span style={{ fontSize:10, color:"#7A9CC8", fontWeight:700 }}>OTB</span> Estimado · Click en día para detalle
                    </p>
                  </div>
                );
              })()}
            </div>

            {/* ── SEPARADOR VERTICAL ── */}
            <div style={{ width:1, background:C.border, flexShrink:0, margin:"16px 0" }}/>

            {/* ── MOVIMIENTO OPERATIVO DIARIO (derecha) ── */}
            {(() => {
              const _p = n => String(n).padStart(2,"0");
              const hoy = new Date();
              const hoyStr = `${hoy.getFullYear()}-${_p(hoy.getMonth()+1)}-${_p(hoy.getDate())}`;
              const ayer = new Date(hoy); ayer.setDate(ayer.getDate()-1);
              const ayerStr = `${ayer.getFullYear()}-${_p(ayer.getMonth()+1)}-${_p(ayer.getDate())}`;

              const getFechaSalida = e => {
                if (e.fecha_salida) return String(e.fecha_salida).slice(0,10);
                if (e.noches && e.fecha_llegada) {
                  const d = new Date(e.fecha_llegada); d.setDate(d.getDate() + Number(e.noches));
                  return d.toISOString().slice(0,10);
                }
                return null;
              };
              const todasActivas = (pickupEntries||[]).filter(e => !e._grupo && (e.estado||"confirmada") !== "cancelada" && (e.estado||"confirmada") !== "tentativo");

              const _dedupMov = {};
              const _indMov = [];
              todasActivas.forEach(e => {
                const fl = String(e.fecha_llegada||"").slice(0,10);
                const fs = getFechaSalida(e) || "";
                if (e.es_individual) { _indMov.push(e); return; }
                const key = `${fl}|${e.canal||""}|${fs}`;
                const fp  = String(e.fecha_pickup||"").slice(0,10);
                if (!_dedupMov[key] || fp > _dedupMov[key]._fp) _dedupMov[key] = { ...e, _fp: fp };
              });
              const activas = [..._indMov, ...Object.values(_dedupMov)];

              const numEntradas      = activas.filter(e => String(e.fecha_llegada||"").slice(0,10) === hoyStr).reduce((a,e)=>a+(e.num_reservas||1),0);
              const numSalidas       = activas.filter(e => getFechaSalida(e) === hoyStr).reduce((a,e)=>a+(e.num_reservas||1),0);
              const numEntradasAyer  = activas.filter(e => String(e.fecha_llegada||"").slice(0,10) === ayerStr).reduce((a,e)=>a+(e.num_reservas||1),0);
              const numSalidasAyer   = activas.filter(e => getFechaSalida(e) === ayerStr).reduce((a,e)=>a+(e.num_reservas||1),0);

              const proxEntrada = numEntradas===0 ? todasActivas.map(e=>String(e.fecha_llegada||"").slice(0,10)).filter(f=>f>hoyStr).sort()[0]||null : null;
              const proxSalida  = numSalidas===0  ? todasActivas.map(e=>getFechaSalida(e)).filter(f=>f&&f>hoyStr).sort()[0]||null : null;

              const habFromProd2 = produccion.length > 0
                ? Math.round(produccion.reduce((a,r)=>a+(r.hab_disponibles||0),0)/produccion.length) : 30;
              const habH = (datos.hotel?.habitaciones && datos.hotel.habitaciones > 0)
                ? datos.hotel.habitaciones : habFromProd2;
              const prodHoy  = produccion.find(d => d.fecha === hoyStr);
              const occHoy   = prodHoy?.hab_disponibles > 0
                ? Math.round(prodHoy.hab_ocupadas/prodHoy.hab_disponibles*100)
                : (habH > 0 ? Math.round((habEnCasaMap[hoyStr]||0)/habH*100) : null);
              const occColor = occHoy>100?"#7B0000":occHoy>=85?"#E53935":occHoy>=70?"#C49A0A":occHoy>=50?C.accent:C.textLight;
              const ayerProd = produccion.find(d => d.fecha === ayerStr);
              const occAyer  = ayerProd?.hab_disponibles > 0
                ? Math.round(ayerProd.hab_ocupadas/ayerProd.hab_disponibles*100)
                : (habH > 0 ? Math.round((habEnCasaMap[ayerStr]||0)/habH*100) : null);

              const Delta = ({ hoy, ayer, unit="" }) => {
                const d = hoy - ayer;
                if (d === 0) return <span style={{ fontSize:18, color:C.border, fontWeight:400, lineHeight:1 }}>—</span>;
                const col  = d > 0 ? "#10B981" : "#EF4444";
                const bg   = d > 0 ? "#10B98115" : "#EF444415";
                const arrow = d > 0
                  ? <svg width="10" height="10" viewBox="0 0 10 10" fill={col}><polygon points="5,1 9,9 1,9"/></svg>
                  : <svg width="10" height="10" viewBox="0 0 10 10" fill={col}><polygon points="5,9 9,1 1,1"/></svg>;
                return (
                  <div style={{ display:"inline-flex", flexDirection:"column", alignItems:"flex-end", gap:2 }}>
                    <span style={{ fontSize:8, color:C.textLight, fontWeight:500, letterSpacing:"0.5px", textTransform:"uppercase" }}>vs ayer</span>
                    <span style={{ display:"inline-flex", alignItems:"center", gap:4, padding:"3px 7px", borderRadius:20, background:bg }}>
                      {arrow}
                      <span style={{ fontSize:12, fontWeight:700, color:col, lineHeight:1 }}>{d>0?"+":""}{d}{unit}</span>
                    </span>
                  </div>
                );
              };

              const lbl = () => ({ fontSize:9, color:C.textMid, textTransform:"uppercase", letterSpacing:"1.2px", fontWeight:600 });
              const num = () => ({ fontSize:30, fontWeight:800, color:C.text, fontFamily:"'Plus Jakarta Sans',sans-serif", lineHeight:1 });
              const sep = { gridColumn:"1 / -1", borderTop:`1px solid ${C.border}` };
              const abrirDesglose = (tipo) => onDesgloseMovimiento && onDesgloseMovimiento(tipo);

              const FilaMovimiento = ({ tipo, icon, label, count, countAyer, extra }) => (
                <>
                  <div style={sep}/>
                  <div style={{ gridColumn:"1 / -1", display:"grid", gridTemplateColumns:"22px 1fr auto auto", alignItems:"center", columnGap:8, padding:"6px 8px", borderRadius:8, cursor:"pointer", transition:"background 0.12s" }}
                    onClick={() => abrirDesglose(tipo)}
                    onMouseEnter={e => e.currentTarget.style.background = C.accentLight}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                    {icon}
                    <span style={lbl()}>{label}{extra}</span>
                    <span style={num()}>{count}</span>
                    <Delta hoy={count} ayer={countAyer}/>
                  </div>
                </>
              );
              const Rc=20, SWc=3.5, circC=2*Math.PI*Rc, sizeC=Rc*2+SWc*2;

              return (
                <div style={{ flex:"0 0 420px", padding:"28px 32px", display:"flex", flexDirection:"column", justifyContent:"center", gap:14 }}>
                  <div>
                    <p style={{ fontSize:11, fontWeight:700, color:C.text, textTransform:"uppercase", letterSpacing:"1.5px" }}>Movimiento Operativo Diario</p>
                    <p style={{ fontSize:10, color:C.textLight, marginTop:2 }}>{hoyStr}</p>
                  </div>
                  <div style={{ display:"grid", gridTemplateColumns:"22px 1fr auto auto", alignItems:"center", rowGap:14, columnGap:8 }}>

                    {/* Entradas */}
                    <FilaMovimiento tipo="entradas"
                      icon={<svg width="22" height="22" viewBox="0 0 32 32" fill="none"><rect x="8" y="4" width="16" height="24" rx="1.5" stroke={C.text} strokeWidth="2"/><line x1="8" y1="28" x2="24" y2="28" stroke={C.text} strokeWidth="2" strokeLinecap="round"/><circle cx="20" cy="16" r="1.5" fill={C.text}/><line x1="0" y1="16" x2="13" y2="16" stroke={C.text} strokeWidth="2" strokeLinecap="round"/><polyline points="9,12 13,16 9,20" stroke={C.text} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                      label="Entradas"
                      extra={proxEntrada&&<span style={{ color:C.textLight, fontWeight:400 }}> · próx. {proxEntrada}</span>}
                      count={numEntradas} countAyer={numEntradasAyer}/>


                    {/* Salidas */}
                    <FilaMovimiento tipo="salidas"
                      icon={<svg width="22" height="22" viewBox="0 0 32 32" fill="none"><rect x="8" y="4" width="16" height="24" rx="1.5" stroke={C.text} strokeWidth="2"/><line x1="8" y1="28" x2="24" y2="28" stroke={C.text} strokeWidth="2" strokeLinecap="round"/><circle cx="12" cy="16" r="1.5" fill={C.text}/><line x1="8" y1="16" x2="21" y2="16" stroke={C.text} strokeWidth="2" strokeLinecap="round"/><polyline points="17,12 21,16 17,20" stroke={C.text} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><line x1="21" y1="16" x2="32" y2="16" stroke={C.text} strokeWidth="2" strokeLinecap="round"/></svg>}
                      label="Salidas"
                      extra={proxSalida&&<span style={{ color:C.textLight, fontWeight:400 }}> · próx. {proxSalida}</span>}
                      count={numSalidas} countAyer={numSalidasAyer}/>

                    {occHoy !== null && <>
                      <div style={sep}/>
                      <div style={{ gridColumn:"1 / -1", display:"grid", gridTemplateColumns:"22px 1fr auto auto", alignItems:"center", columnGap:8, padding:"6px 8px", borderRadius:8, cursor:"pointer", transition:"background 0.12s" }}
                        onClick={() => abrirDesglose("estancias")}
                        onMouseEnter={e => e.currentTarget.style.background = C.accentLight}
                        onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                        <svg width="22" height="22" viewBox="0 0 32 32" fill="none">
                          <path d="M4 28V14L16 4l12 10v14" stroke={C.text} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          <rect x="11" y="18" width="10" height="10" rx="1" stroke={C.text} strokeWidth="1.8"/>
                          <circle cx="16" cy="13" r="2" stroke={C.text} strokeWidth="1.5"/>
                        </svg>
                        <span style={lbl()}>Ocupación hoy</span>
                        <span style={num()}>{occHoy}%</span>
                        {occAyer !== null ? <Delta hoy={occHoy} ayer={occAyer} unit="%"/> : <span/>}
                      </div>
                    </>}
                  </div>


                </div>
              );
            })()}

          </Card>

          {/* ── ADR & OCC — fila completa debajo del heatmap ── */}
          {(() => {
            const metricas = [
              { key:"adr_occ", label:t("adr_ocupacion") },
            ];
            return (
              <Card style={{ display:"flex", flexDirection:"column", minHeight:360, marginTop:16 }}>
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:16 }}>
                  <p style={{ fontFamily:"'Plus Jakarta Sans',sans-serif", fontWeight:700, fontSize:18, color:C.text }}>
                    {metricas.find(m=>m.key===metricaSel)?.label}
                  </p>
                  <div style={{ display:"flex", gap:14 }}>
                    {[
                      { color:"#004B87", opacity:0.75, label:"Ocupación", type:"bar" },
                      { color:"#B8860B", opacity:1,    label:"ADR",       type:"line" },
                      { color:"#E53935", opacity:1,    label:"RevPAR",    type:"line" },
                    ].map((item,i) => (
                      <div key={i} style={{ display:"flex", alignItems:"center", gap:5 }}>
                        {item.type==="bar" && <div style={{ width:10, height:10, borderRadius:2, background:item.color, opacity:item.opacity }}/>}
                        {item.type==="line" && <div style={{ width:16, height:2, background:item.color, borderRadius:1 }}/>}
                        <span style={{ fontSize:10, color:C.textLight, fontWeight:500, letterSpacing:"0.3px" }}>{item.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div style={{ height:300 }} onMouseDown={e => e.preventDefault()}>
                  <ResponsiveContainer width="100%" height={300}>
                    {metricaSel === "adr_occ" ? (
                      <ComposedChart data={porMes} barSize={14} barCategoryGap="32%"
                        onMouseLeave={() => setActiveSeriesKey(null)}>
                        <defs>
                          <linearGradient id="gradOcc" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#004B87" stopOpacity={0.9}/>
                            <stop offset="100%" stopColor="#004B87" stopOpacity={0.55}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke={C.border} vertical={false}/>
                        <XAxis dataKey="mes" axisLine={false} tickLine={false} height={18} interval={0} tick={{ fill: C.textLight, fontSize: 11 }}/>
                        <YAxis yAxisId="left"  tick={{ fill: C.textLight, fontSize: 11 }} axisLine={false} tickLine={false} unit="%" domain={[0,100]}/>
                        <YAxis yAxisId="right" orientation="right" tick={{ fill: C.textLight, fontSize: 11 }} axisLine={false} tickLine={false} unit="€"/>
                        <Tooltip content={<CustomTooltip/>} cursor={false}/>
                        <Bar yAxisId="left" dataKey="occ" name="Ocupación" fill="url(#gradOcc)" radius={[4,4,0,0]}
                          cursor="pointer" activeBar={false} isAnimationActive={false}
                          onMouseEnter={() => setActiveSeriesKey("occ")}
                          onClick={(data) => { if(data?.mesIdx!=null) setModalDiario({mesIdx:data.mesIdx, anioIdx:data.anioIdx}); }}
                          shape={<AnimatedBar highlighted={activeSeriesKey === "occ"} onClick={(p) => { if(p?.mesIdx!=null) setModalDiario({mesIdx:p.mesIdx, anioIdx:p.anioIdx}); }}/>}
                        />
                        <Line yAxisId="right" dataKey="adr"    name="ADR"    type="monotone" stroke="#B8860B"
                          strokeWidth={activeSeriesKey === "adr" ? 3 : 2}
                          dot={{ fill:"#B8860B", r: activeSeriesKey === "adr" ? 4 : 3, strokeWidth:0 }}
                          activeDot={{ r:6, fill:"#B8860B", strokeWidth:0 }}
                          onMouseEnter={() => setActiveSeriesKey("adr")} isAnimationActive={false}/>
                        <Line yAxisId="right" dataKey="revpar" name="RevPAR" type="monotone" stroke="#E53935"
                          strokeWidth={activeSeriesKey === "revpar" ? 3 : 2}
                          dot={{ fill:"#E53935", r: activeSeriesKey === "revpar" ? 4 : 3, strokeWidth:0 }}
                          activeDot={{ r:6, fill:"#E53935", strokeWidth:0 }}
                          onMouseEnter={() => setActiveSeriesKey("revpar")} isAnimationActive={false}/>
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
                        <XAxis dataKey="mes" axisLine={false} tickLine={false} height={18} interval={0} tick={{ fill: C.textLight, fontSize: 11 }}/>
                        <YAxis tick={{ fill: C.textLight, fontSize: 11 }} axisLine={false} tickLine={false} unit="€"/>
                        <Tooltip content={<CustomTooltip/>} cursor={{ fill: "rgba(10,37,64,0.04)" }}/>
                        <Area type="monotone" dataKey={metricaSel} name={metricaSel==="revpar"?"RevPAR":"TRevPAR"} stroke={C.accent} strokeWidth={2} fill="url(#gMetrica)" dot={{fill:C.accent,r:2}} activeDot={{r:3}} isAnimationActive={false}/>
                      </AreaChart>
                    )}
                  </ResponsiveContainer>
                </div>
              </Card>
            );
          })()}
          </>
        );
      })()}


      <div style={{ background:C.bgCard, border:`1px solid ${C.border}`, borderRadius:12, overflow:"hidden" }}>
        <div style={{ padding:"18px 24px 12px", borderBottom:`1px solid ${C.border}` }}>
          <h3 style={{ fontFamily:"'Plus Jakarta Sans',sans-serif", fontSize:16, fontWeight:700, color:C.text, margin:0 }}>{t("ultimos_12m")}</h3>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ background:C.bg }}>
                {[t("th_anio"),t("th_mes"),t("th_ocup"),t("th_adr"),t("th_revpar"),t("th_trevpar"),t("th_rev_hab"),t("th_rev_total")].map((h,hi) => (
                  <th key={h} style={{ padding: "9px 14px", textAlign: hi<=1?"left":"right", fontSize: 10, color: C.textLight, textTransform: "uppercase", letterSpacing: 1, fontWeight: 600, borderBottom: `2px solid ${C.border}`, whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[...porMes].reverse().map((d, i) => (
                <tr key={i} onClick={() => onMesDetalle && onMesDetalle(d.mesIdx, d.anioIdx)} style={{ borderBottom: `1px solid ${C.border}`, background: d.mesIdx === mes && d.anioIdx === anio ? C.accentLight : (i % 2 === 0 ? C.bg : C.bgCard), cursor: "pointer" }} onMouseEnter={e => e.currentTarget.style.background = C.accentLight} onMouseLeave={e => e.currentTarget.style.background = MESES_CORTO.indexOf(d.mes) === mes ? C.accentLight : (i % 2 === 0 ? C.bg : C.bgCard)}>
                  <td style={{ padding: "9px 14px", fontWeight: 600, fontSize: 13, color: C.textLight }}>{d.anioIdx}</td>
                  <td style={{ padding: "9px 14px", fontWeight: 700, fontSize: 15, color: C.accent, textDecoration: "underline", cursor: "pointer" }}>{d.mesNombre}</td>
                  <td style={{ padding: "9px 14px", textAlign: "right", color: d.occ > 80 ? C.green : C.textMid }}>{d.occ}%</td>
                  <td style={{ padding: "9px 14px", textAlign: "right", color: C.textMid }}>€{d.adr}</td>
                  <td style={{ padding: "9px 14px", textAlign: "right", fontWeight: 600, color: C.accent }}>€{d.revpar}</td>
                  <td style={{ padding: "9px 14px", textAlign: "right", color: C.blue }}>€{d.trevpar}</td>
                  <td style={{ padding: "9px 14px", textAlign: "right", color: C.textMid }}>€{Math.round(d.revHab).toLocaleString("es-ES")}</td>
                  <td style={{ padding: "9px 14px", textAlign: "right", color: C.textMid }}>€{Math.round(d.revTotal).toLocaleString("es-ES")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
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
            const habDis = r.hab_disponibles || datos.hotel?.habitaciones || 30;
            return {
              dia: f.getDate(),
              label: `${f.getDate()}/${f.getMonth()+1}`,
              fecha: f.toLocaleDateString("es-ES",{day:"numeric",month:"long",year:"numeric"}),
              occ:    habDis>0 ? Math.min(100, Math.round(r.hab_ocupadas/habDis*100)) : 0,
              adr:    r.hab_ocupadas>0 ? Math.round(r.revenue_hab/r.hab_ocupadas) : 0,
              revpar: habDis>0 ? Math.round((r.revenue_hab||0)/habDis) : 0,
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
                  <h3 style={{ fontSize:22, fontWeight:800, color:C.text, fontFamily:"'Plus Jakarta Sans',sans-serif", letterSpacing:-0.5 }}>{t("adr_ocup_diaria")}</h3>
                </div>
                <button onClick={()=>setModalDiario(null)} style={{ background:"none", border:`1.5px solid ${C.border}`, borderRadius:8, width:34, height:34, cursor:"pointer", fontSize:16, color:C.textMid, display:"flex", alignItems:"center", justifyContent:"center", padding:0 }}
                  onMouseEnter={e=>{e.currentTarget.style.background=C.accent;e.currentTarget.style.color="#fff";}}
                  onMouseLeave={e=>{e.currentTarget.style.background="none";e.currentTarget.style.color=C.textMid;}}>×</button>
              </div>

              {diasData.length === 0 ? (
                <p style={{ color:C.textLight, textAlign:"center", padding:40 }}>{t("sin_datos_mes")}</p>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <ComposedChart data={diasData} barSize={10} barCategoryGap="30%">
                    <defs>
                      <linearGradient id="gradOccDiario" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#004B87" stopOpacity={0.9}/>
                        <stop offset="100%" stopColor="#004B87" stopOpacity={0.55}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={C.border} vertical={false}/>
                    <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: C.textLight, fontSize: 11 }} interval={Math.floor(diasData.length/8)}/>
                    <YAxis yAxisId="left"  tick={{ fill: C.textLight, fontSize: 11 }} axisLine={false} tickLine={false} unit="%" domain={[0,100]}/>
                    <YAxis yAxisId="right" orientation="right" tick={{ fill: C.textLight, fontSize: 11 }} axisLine={false} tickLine={false} unit="€"/>
                    <Tooltip content={<CustomTooltip/>} cursor={false}/>
                    <Legend wrapperStyle={{ fontSize: 11, color: C.textMid, paddingTop: 8 }}/>
                    <Bar yAxisId="left" dataKey="occ" name="Ocupación" fill="url(#gradOccDiario)" radius={[4,4,0,0]} activeBar={false}/>
                    <Line yAxisId="right" dataKey="adr"    name="ADR"    type="monotone" stroke="#B8860B" strokeWidth={2} dot={{fill:"#B8860B",r:2,strokeWidth:0}} activeDot={{r:4}}/>
                    <Line yAxisId="right" dataKey="revpar" name="RevPAR" type="monotone" stroke="#E53935" strokeWidth={2} dot={{fill:"#E53935",r:2,strokeWidth:0}} activeDot={{r:4}}/>
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
function PickupView({ datos, onGuardado }) {
  const t = useT();
  const { session, presupuesto, produccion } = datos;
  const pickupEntries = datos.pickupEntries || [];
  const cargando = false;

  const [generandoMock, setGenerandoMock] = useState(false);
  const [okMock, setOkMock] = useState(false);
  const generarPickupMock = async () => {
    if (!session?.user?.id) return;
    setGenerandoMock(true);
    try {
      const hoy = new Date();
      const hoyStr = `${hoy.getFullYear()}-${String(hoy.getMonth()+1).padStart(2,"0")}-${String(hoy.getDate()).padStart(2,"0")}`;
      await Promise.all([
        supabase.from("pickup_entries").delete().eq("hotel_id", session.user.id).eq("fecha_pickup", hoyStr),
        supabase.from("pickup_entries").delete().eq("hotel_id", session.user.id).ilike("canal", "%grupo%"),
        supabase.from("pickup_entries").delete().eq("hotel_id", session.user.id).ilike("canal", "%evento%"),
        supabase.from("pickup_entries").delete().eq("hotel_id", session.user.id).ilike("canal", "%mice%"),
      ]);
      const { data: todos } = await supabase.from("pickup_entries").select("canal,num_reservas,noches,precio_total,estado,fecha_llegada").eq("hotel_id", session.user.id).neq("estado", "cancelada");
      const EXCL = ["grupos/eventos","grupo","evento","groups/events","mice"];
      const ind = (todos||[]).filter(r => !EXCL.some(x => (r.canal||"").toLowerCase().includes(x)));
      let mediaNoches, mediaADR;
      if (ind.length > 20) {
        const cn = ind.filter(r=>r.noches>0); mediaNoches = cn.length ? cn.reduce((a,r)=>a+r.noches,0)/cn.length : 2;
        const cp = ind.filter(r=>r.precio_total>0&&r.noches>0); mediaADR = cp.length ? cp.reduce((a,r)=>a+(r.precio_total/r.noches),0)/cp.length : 120;
      } else { mediaNoches = 2; mediaADR = 120; }
      const plantillaConf = [
        {canal:"Booking.com",mesesDesde:1,mesesHasta:4,nochesDef:2,factorADR:0.97},
        {canal:"Booking.com",mesesDesde:2,mesesHasta:5,nochesDef:1,factorADR:0.96},
        {canal:"Booking.com",mesesDesde:3,mesesHasta:7,nochesDef:3,factorADR:0.98},
        {canal:"Directo",mesesDesde:1,mesesHasta:4,nochesDef:2,factorADR:1.06},
        {canal:"Directo",mesesDesde:2,mesesHasta:6,nochesDef:3,factorADR:1.04},
        {canal:"Empresa",mesesDesde:1,mesesHasta:2,nochesDef:1,factorADR:1.12},
        {canal:"Empresa",mesesDesde:1,mesesHasta:3,nochesDef:2,factorADR:1.08},
        {canal:"Expedia",mesesDesde:3,mesesHasta:7,nochesDef:2,factorADR:0.95},
        {canal:"Expedia",mesesDesde:4,mesesHasta:8,nochesDef:2,factorADR:0.94},
        {canal:"Web propia",mesesDesde:1,mesesHasta:5,nochesDef:2,factorADR:1.02},
        {canal:"Hotels.com",mesesDesde:2,mesesHasta:6,nochesDef:2,factorADR:0.96},
        {canal:"Airbnb",mesesDesde:3,mesesHasta:7,nochesDef:3,factorADR:0.94},
        {canal:"Tour operador",mesesDesde:3,mesesHasta:9,nochesDef:4,factorADR:0.90},
        {canal:"Agencia de viajes",mesesDesde:2,mesesHasta:8,nochesDef:3,factorADR:0.92},
        {canal:"GDS",mesesDesde:1,mesesHasta:4,nochesDef:2,factorADR:1.00},
      ];
      const plantillaCancel = [
        {canal:"Booking.com",mesesDesde:2,mesesHasta:5,nochesDef:2,factorADR:0.97},
        {canal:"Booking.com",mesesDesde:3,mesesHasta:6,nochesDef:1,factorADR:0.96},
        {canal:"Expedia",mesesDesde:2,mesesHasta:6,nochesDef:2,factorADR:0.95},
        {canal:"Web propia",mesesDesde:3,mesesHasta:7,nochesDef:2,factorADR:1.02},
        {canal:"Airbnb",mesesDesde:3,mesesHasta:8,nochesDef:2,factorADR:0.93},
      ];
      const numConf = 6 + Math.floor(Math.random() * 3), numCancel = 1;
      const shuffled = arr => [...arr].sort(()=>Math.random()-0.5);
      const mkFila = ({canal,mesesDesde,mesesHasta,nochesDef,factorADR}, estado) => {
        const dias = Math.round(mesesDesde*30 + Math.random()*(mesesHasta-mesesDesde)*30);
        const llegada = new Date(hoy); llegada.setDate(llegada.getDate()+dias);
        const noches = Math.max(1, Math.round(nochesDef+(Math.random()-0.5)));
        const adr = Math.round(mediaADR*factorADR*(0.93+Math.random()*0.14));
        const salida = new Date(llegada); salida.setDate(salida.getDate()+noches);
        const fmt = d => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
        return { hotel_id:session.user.id, fecha_pickup:hoyStr, fecha_llegada:fmt(llegada), fecha_salida:fmt(salida), canal, num_reservas:1, noches, precio_total:Math.round(adr*noches*100)/100, estado };
      };
      const filas = [...shuffled(plantillaConf).slice(0,numConf).map(p=>mkFila(p,"confirmada")), ...shuffled(plantillaCancel).slice(0,numCancel).map(p=>mkFila(p,"cancelada"))];
      const { error } = await supabase.from("pickup_entries").insert(filas);
      if (error) throw new Error(error.message);
      setOkMock(true);
      setTimeout(() => { setOkMock(false); onGuardado && onGuardado(true); }, 2000);
    } catch(e) { console.error("Error generando mock:", e); }
    setGenerandoMock(false);
  };

  // Auto-generar mock si no hay datos de pickup de hoy (desarrollo)
  const autoMockDoneRef = useRef(false);
  useEffect(() => {
    if (autoMockDoneRef.current) return;
    const hoy = new Date();
    const hoyStr = `${hoy.getFullYear()}-${String(hoy.getMonth()+1).padStart(2,"0")}-${String(hoy.getDate()).padStart(2,"0")}`;
    const tieneHoy = (datos.pickupEntries || []).some(e => String(e.fecha_pickup||"").slice(0,10) === hoyStr);
    if (!tieneHoy && session?.user?.id) {
      autoMockDoneRef.current = true;
      generarPickupMock();
    }
  }, [datos.pickupEntries]);

  // Mapa precalculado — mismo origen que el heatmap
  const habEnCasaMapPU = useMemo(
    () => buildHabEnCasaMap(datos.pickupEntries, datos.grupos),
    [datos.pickupEntries, datos.grupos]
  );
  const habHotelPU = useMemo(() => {
    if (datos.hotel?.habitaciones && datos.hotel.habitaciones > 0) return datos.hotel.habitaciones;
    const p = datos.produccion || [];
    return p.length > 0 ? Math.round(p.reduce((a,r)=>a+(r.hab_disponibles||0),0)/p.length) : 30;
  }, [datos.hotel, datos.produccion]);

  const _hoyISOd = new Date();
  const hoyISO = `${_hoyISOd.getFullYear()}-${String(_hoyISOd.getMonth()+1).padStart(2,"0")}-${String(_hoyISOd.getDate()).padStart(2,"0")}`;
  const [modalNR, setModalNR] = useState(() => { try { return localStorage.getItem("fr_nr_modal") === "1"; } catch { return false; } });
  const setModalNRPersist = (v) => { setModalNR(v); try { localStorage.setItem("fr_nr_modal", v ? "1" : "0"); } catch {} };
  const [nrForm, setNrForm] = useState(() => {
    const hoy0 = new Date(); const hoyD=`${hoy0.getFullYear()}-01-01`;
    try { return { canal:"", num_reservas:"", fecha_llegada:hoyD, fecha_salida:"", noches:"", precio_total:"", numero_reserva:"" }; } catch { return { canal:"", num_reservas:"", fecha_llegada:hoyD, fecha_salida:"", noches:"", precio_total:"", numero_reserva:"" }; }
  });
  const setNrFormPersist = (fn) => setNrForm(prev => { const next = typeof fn === "function" ? fn(prev) : fn; try { localStorage.setItem("fr_nr_form", JSON.stringify(next)); } catch {} return next; });
  const [nrGuardando, setNrGuardando] = useState(false);
  const [nrError, setNrError] = useState("");
  const [nrOk, setNrOk] = useState(false);
  const [nrPreciosPorNoche, setNrPreciosPorNoche] = useState([]);
  const [gestionTab, setGestionTab] = useState(() => { try { return localStorage.getItem("fr_gestion_tab") || "buscar"; } catch { return "buscar"; } });
  const setGestionTabPersist = (v) => { setGestionTab(v); try { localStorage.setItem("fr_gestion_tab", v); } catch {} };
  const [nrTipo, setNrTipo] = useState(() => { try { return localStorage.getItem("fr_nr_tipo") || "individual"; } catch { return "individual"; } });
  const setNrTipoPersist = (v) => { setNrTipo(v); try { localStorage.setItem("fr_nr_tipo", v); } catch {} };
  const [busqTerm, setBusqTerm] = useState(() => { try { return localStorage.getItem("fr_gestion_busq") || ""; } catch { return ""; } });
  const setBusqTermPersist = (v) => { setBusqTerm(v); try { localStorage.setItem("fr_gestion_busq", v); } catch {} };
  const [editEntry, setEditEntry] = useState(null); // entrada en edición
  const [editForm, setEditForm] = useState({});
  const [editGuardando, setEditGuardando] = useState(false);
  const [editError, setEditError] = useState("");
  const [editOk, setEditOk] = useState(false);
  const abrirNuevaReserva = () => { setNrError(""); setNrOk(false); setEditEntry(null); setGestionTab("buscar"); setModalNRPersist(true); };
  const abrirEdicion = (e) => {
    setEditEntry(e);
    setEditForm({
      canal: e.canal || "",
      num_reservas: String(e.num_reservas || 1),
      fecha_llegada: String(e.fecha_llegada || "").slice(0, 10),
      fecha_salida: String(e.fecha_salida || "").slice(0, 10),
      noches: String(e.noches || ""),
      precio_total: e.precio_total != null ? String(e.precio_total) : "",
      estado: e.estado || "confirmada",
      numero_reserva: e.numero_reserva != null ? String(e.numero_reserva) : "",
    });
    setEditError(""); setEditOk(false);
  };
  const guardarEdicion = async () => {
    if (!editEntry?.id) return;
    setEditGuardando(true); setEditError("");
    try {
      const noches = editForm.noches ? parseInt(editForm.noches) : null;
      const { error } = await supabase.from("pickup_entries").update({
        canal: editForm.canal || null,
        num_reservas: parseInt(editForm.num_reservas) || 1,
        fecha_llegada: editForm.fecha_llegada || null,
        fecha_salida: editForm.fecha_salida || null,
        noches,
        precio_total: editForm.precio_total ? parseFloat(editForm.precio_total) : null,
        estado: editForm.estado || "confirmada",
        numero_reserva: editForm.numero_reserva ? parseInt(editForm.numero_reserva) : null,
      }).eq("id", editEntry.id);
      if (error) throw new Error(error.message);
      setEditOk(true);
      setTimeout(() => { setEditEntry(null); setEditOk(false); onGuardado && onGuardado(true); }, 1200);
    } catch(e) { setEditError(e.message); }
    finally { setEditGuardando(false); }
  };
  const guardarNuevaReserva = async () => {
    setNrGuardando(true); setNrError("");
    try {
      const noches = nrForm.noches ? parseInt(nrForm.noches) : 1;
      const fechaLlegada = nrForm.fecha_llegada || hoyISO;
      let fechaSalida = nrForm.fecha_salida || null;
      if (!fechaSalida) { const d = new Date(fechaLlegada+"T00:00:00"); d.setDate(d.getDate()+noches); fechaSalida = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`; }
      const { data: maxRow2 } = await supabase.from("pickup_entries")
        .select("numero_reserva").eq("hotel_id", session.user.id)
        .not("numero_reserva", "is", null).order("numero_reserva", { ascending: false }).limit(1);
      const nextNumero2 = ((maxRow2?.[0]?.numero_reserva) || 0) + 1;
      let numero_reserva = nrForm.numero_reserva ? parseInt(nrForm.numero_reserva) : nextNumero2;
      if (nrForm.numero_reserva) {
        const { data: dup } = await supabase.from("pickup_entries")
          .select("id").eq("hotel_id", session.user.id).eq("numero_reserva", numero_reserva).limit(1);
        if (dup && dup.length > 0) throw new Error(`La reserva #${numero_reserva} ya existe`);
      }
      const preciosPNVal = nrPreciosPorNoche.length > 0 && nrPreciosPorNoche.some(v=>parseFloat(v)>0)
        ? nrPreciosPorNoche.map(v => Math.round((parseFloat(v)||0) * NET_HAB_FNB * 100) / 100)
        : null;
      const precioTotalFinal = preciosPNVal
        ? Math.round(preciosPNVal.reduce((a,v)=>a+v,0) * 100) / 100
        : (nrForm.precio_total ? Math.round(parseFloat(nrForm.precio_total) * NET_HAB_FNB * 100) / 100 : null);
      const row = {
        hotel_id: session.user.id, fecha_pickup: hoyISO, fecha_llegada: fechaLlegada,
        canal: nrForm.canal || null, num_reservas: parseInt(nrForm.num_reservas)||1,
        fecha_salida: fechaSalida, noches,
        precio_total: precioTotalFinal,
        precios_por_noche: preciosPNVal,
        estado: "confirmada",
        es_individual: true,
        numero_reserva,
      };
      const { error } = await supabase.from("pickup_entries").insert(row);
      if (error) throw new Error(error.message);
      setNrOk(true);
      setTimeout(() => { setModalNRPersist(false); setNrOk(false); onGuardado && onGuardado(true); }, 1200);
    } catch(e) { setNrError(e.message); }
    finally { setNrGuardando(false); }
  };

  const [anio, setAnio] = useState(() => {
    const saved = localStorage.getItem("fr_pickup_anio");
    return saved ? parseInt(saved) : new Date().getFullYear();
  });
  const [trimSel, setTrimSel] = useState(null);
  const [trimTip, setTrimTip] = useState(null); // data only (no x/y)
  const trimTipRef = useRef(null);
  const [canalMetric, setCanalMetric]     = useState("adr"); // "adr" | "noches"
  const [ayerVista, setAyerVista]         = useState(null); // null | "count"|"adr"|"noches"|"antelacion"
  const [reservasVentana, setReservasVentana] = useState(() => localStorage.getItem('reservasVentana') || "30d");
  const [reservasMesFiltro, setReservasMesFiltro] = useState(() => { try { const v = localStorage.getItem('reservasMesFiltro'); return v ? JSON.parse(v) : null; } catch { return null; } });
  const [showMesPicker, setShowMesPicker] = useState(false);
  const mesPickerRef = useRef(null);
  useEffect(() => {
    if (!showMesPicker) return;
    const handler = e => { if (mesPickerRef.current && !mesPickerRef.current.contains(e.target)) setShowMesPicker(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showMesPicker]);
  const [reservasVista, setReservasVista]     = useState("count"); // "count"|"adr"|"noches"|"antelacion"
  const [otaDetalle, setOtaDetalle]           = useState(() => localStorage.getItem('otaDetalle') === 'true');
  const [showPickupDetalle, setShowPickupDetalle] = useState(false);

  const hoy     = new Date();
  const padL    = n => String(n).padStart(2,"0");
  const hoyStr  = `${hoy.getFullYear()}-${padL(hoy.getMonth()+1)}-${padL(hoy.getDate())}`;
  const MESES   = t("meses_corto");

  const setAnioGuardado = (a) => { setAnio(a); localStorage.setItem("fr_pickup_anio", a); };

  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape" && trimSel !== null) setTrimSel(null); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [trimSel]);

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

  // ── Colores gráfica: dorados con rango amplio ──
  const COL_OTB  = "#5C3300";  // marrón dorado oscuro — OTB actual
  const COL_PPTO = "#C8850C";  // naranja dorado medio — presupuesto
  const COL_LY   = "#F2D06B";  // amarillo dorado claro — año anterior

  // ── Drill-down por trimestre ──
  const MESES_CORTO_PU = t("meses_corto");
  const datosDetalle = trimSel !== null ? [0,1,2].map(offset => {
    const mi = trimSel * 3 + offset;
    const key   = `${anio}-${String(mi+1).padStart(2,"0")}`;
    const keyLY = `${anio-1}-${String(mi+1).padStart(2,"0")}`;
    const otb  = otbPorMes[key]  || 0;
    const ly   = otbPorMes[keyLY] || 0;
    const ppto = pptoPorMes[key] ?? null;
    return { mes: MESES_CORTO_PU[mi], otb: otb||null, ppto, ly: ly||null };
  }) : [];

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
      <p style={{ color:C.textLight, fontSize:13 }}>{t("cargando_pickup")}</p>
    </div>
  );

  // ── Pickup de ayer ──
  const hoyD = new Date();
  const ayerD = new Date(hoyD); ayerD.setDate(hoyD.getDate()-1);
  const ayerStr = `${ayerD.getFullYear()}-${String(ayerD.getMonth()+1).padStart(2,"0")}-${String(ayerD.getDate()).padStart(2,"0")}`;
  const MESES_FULL_PU = t("meses_full");

  const esGrupoEvento = e => { const c = (e.canal||"").toLowerCase(); return c.includes("grupo") || c.includes("evento"); };
  const ultDia = [...pickupEntries].filter(e => !esGrupoEvento(e)).map(e=>String(e.fecha_pickup||"").slice(0,10)).filter(f=>f.length===10).sort().pop() || "";
  const hayHoy = pickupEntries.some(e => !esGrupoEvento(e) && String(e.fecha_pickup||"").slice(0,10) === hoyISO);
  const refDia = hayHoy ? hoyISO : (ultDia >= ayerStr ? ultDia : "");
  const reservasUltDia = refDia ? pickupEntries.filter(e => !esGrupoEvento(e) && String(e.fecha_pickup||"").slice(0,10) === refDia && (e.estado||"confirmada") !== "cancelada").sort((a,b)=>(a.fecha_llegada||"").localeCompare(b.fecha_llegada||"")) : [];
  const ultDiaTotal = reservasUltDia.reduce((a,e) => a + (e.num_reservas||1), 0);
  const tituloBloque = refDia === hoyISO ? "Reservas de hoy" : "Reservas de ayer";
  const fmtDatePU = d => { if (!d) return "—"; const p=d.split("-"); return p.length===3?`${p[2]}/${p[1]}/${p[0]}`:d; };

  const reservasAyer = pickupEntries.filter(e => String(e.fecha_pickup||"").slice(0,10) === ayerStr);

  const normCanal = c => {
    const lc = (c || "").toLowerCase().trim();
    if (lc.includes("directo") || lc.includes("teléfono") || lc.includes("telefono") || lc.includes("email")) return "Directo";
    if (lc.includes("web")) return "Web propia";
    if (lc.includes("empresa") || lc.includes("corporativo")) return "Empresa";
    if (lc.includes("mice") || lc.includes("evento")) return "Eventos / MICE";
    if (lc.includes("grupo")) return "Grupos";
    return c || "Directo";
  };

  const ayerPorMes = {};
  const ayerPorCanal = {};
  let ayerTotal = 0;
  reservasAyer.filter(e => (e.estado||"confirmada") !== "cancelada" && normCanal(e.canal) !== "Grupos/Eventos").forEach(e => {
    const fl = String(e.fecha_llegada||"").slice(0,7); // YYYY-MM
    const mes = parseInt(fl.slice(5,7)) - 1;
    const nr = e.num_reservas || 1;
    ayerPorMes[mes] = (ayerPorMes[mes]||0) + nr;
    const canal = normCanal(e.canal);
    ayerPorCanal[canal] = (ayerPorCanal[canal]||0) + nr;
    ayerTotal += nr;
  });

  const CANAL_COLORS = {
    // OTAs — color distinto por plataforma
    "Booking.com":      "#0052CC",
    "Expedia":          "#FFD700",
    "Hotels.com":       "#FF6B00",
    "Airbnb":           "#FF5A5F",
    "Hotelbeds":        "#00897B",
    "Agoda":            "#7C3AED",
    "Trip.com":         "#06B6D4",
    // Canales directos
    "Directo":          "#111111",
    "Web propia":       "#BDBDBD",
    // Canales B2B / otros
    "Tour operador":    "#F59E0B",
    "Agencia de viajes":"#8B5CF6",
    "GDS":              "#6B7280",
    "Empresa":          "#059669",
    "Grupos":           "#EC4899",
    "Eventos / MICE":   "#F43F5E",
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
  const conNoches = pickupEntries.filter(e => e.noches && e.noches > 0 && (e.estado||"confirmada") !== "cancelada" && !esGrupoEvento(e));
  const nochesMed = conNoches.length > 0
    ? (conNoches.reduce((a,e)=>a+(e.noches||0),0) / conNoches.length).toFixed(1)
    : null;
  // Por canal
  const nochesPorCanal = {};
  conNoches.forEach(e => {
    const c = normCanal(e.canal);
    if (!nochesPorCanal[c]) nochesPorCanal[c] = { total:0, count:0 };
    nochesPorCanal[c].total  += e.noches||0;
    nochesPorCanal[c].count  += 1;
  });
  const nochesCanalData = Object.entries(nochesPorCanal)
    .map(([canal, d]) => ({ canal, media: (d.total/d.count).toFixed(1) }))
    .sort((a,b) => b.media - a.media);

  // ── Reservas por ventana temporal ──
  const hoyTs = new Date();
  const _hoyD = hoyTs.toISOString().slice(0,10);
  const _ayerD = (() => { const d=new Date(hoyTs); d.setDate(d.getDate()-1); return d.toISOString().slice(0,10); })();
  const ventanaDesde = reservasMesFiltro
    ? `${reservasMesFiltro.anio}-${String(reservasMesFiltro.mes+1).padStart(2,"0")}-01`
    : reservasVentana === "ayer" ? _ayerD
    : reservasVentana === "7d"   ? new Date(hoyTs - 7   * 86400000).toISOString().slice(0,10)
    : reservasVentana === "30d"  ? new Date(hoyTs - 30  * 86400000).toISOString().slice(0,10)
    :                              new Date(hoyTs - 365 * 86400000).toISOString().slice(0,10);
  const ventanaHasta = reservasMesFiltro
    ? (() => { const d = new Date(reservasMesFiltro.anio, reservasMesFiltro.mes+1, 0); return d.toISOString().slice(0,10); })()
    : reservasVentana === "ayer" ? _ayerD : _hoyD;
  const reservasVentanaEntries = pickupEntries.filter(e => {
    const fp = String(e.fecha_pickup||"").slice(0,10);
    return fp >= ventanaDesde && fp <= ventanaHasta && (e.estado||"confirmada") !== "cancelada" && !esGrupoEvento(e);
  });

  const grupoVentanaEntries = pickupEntries.filter(e => {
    const fp = String(e.fecha_pickup||"").slice(0,10);
    return fp >= ventanaDesde && fp <= ventanaHasta && (e.estado||"confirmada") !== "cancelada" && esGrupoEvento(e);
  });
  const grupoVentanaStats = {};
  grupoVentanaEntries.forEach(e => {
    const c = normCanal(e.canal);
    if (!grupoVentanaStats[c]) grupoVentanaStats[c] = { count:0, rooms:0, revenue:0, nochesTot:0 };
    grupoVentanaStats[c].count   += 1;
    grupoVentanaStats[c].rooms   += e.num_reservas || 1;
    grupoVentanaStats[c].revenue += e.precio_total || 0;
    grupoVentanaStats[c].nochesTot += (e.noches || 0) * (e.num_reservas || 1);
  });
  const ventanaCanalStats = {};
  reservasVentanaEntries.forEach(e => {
    const c = normCanal(e.canal);
    if (!ventanaCanalStats[c]) ventanaCanalStats[c] = { count:0, precioTotal:0, nochesTotal:0, antTotal:0, antCount:0 };
    const nr = e.num_reservas || 1;
    ventanaCanalStats[c].count       += nr;
    ventanaCanalStats[c].precioTotal += (e.precio_total || 0);
    ventanaCanalStats[c].nochesTotal += (e.noches || 0) * nr;
    if (e.fecha_llegada && e.fecha_pickup) {
      const dias = Math.round((new Date(e.fecha_llegada) - new Date(e.fecha_pickup)) / 86400000);
      if (dias >= 0) { ventanaCanalStats[c].antTotal += dias * nr; ventanaCanalStats[c].antCount += nr; }
    }
  });
  const ventanaCanalData = Object.entries(ventanaCanalStats).map(([canal, d]) => ({
    canal, color: CANAL_COLORS[canal] || C.accent,
    count: d.count,
    adr:   d.nochesTotal > 0 ? Math.round(d.precioTotal / d.nochesTotal) : (d.count > 0 ? Math.round(d.precioTotal / d.count) : null),
    noches: d.count > 0 ? parseFloat((d.nochesTotal / d.count).toFixed(1)) : null,
    antelacion: d.antCount > 0 ? Math.round(d.antTotal / d.antCount) : null,
  })).sort((a,b) => b.count - a.count);
  const ventanaTotal = ventanaCanalData.reduce((a,d) => a + d.count, 0);

  const isOTA = canal => {
    const c = canal.toLowerCase();
    return !['directo', 'web', 'empresa', 'corporativo', 'agencia', 'tour', 'gds', 'grupo', 'mice', 'evento'].some(k => c.includes(k));
  };

  // Datos agrupando OTAs (para vista principal)
  const ventanaCanalDataAgrupado = (() => {
    const noOta = ventanaCanalData.filter(d => !isOTA(d.canal));
    const otaRows = ventanaCanalData.filter(d => isOTA(d.canal));
    if (otaRows.length === 0) return noOta;
    const otaCount     = otaRows.reduce((a,d) => a + d.count, 0);
    const otaPrecioTot = reservasVentanaEntries.filter(e => isOTA(normCanal(e.canal))).reduce((a,e) => a + (e.precio_total||0), 0);
    const otaNochesTot = reservasVentanaEntries.filter(e => isOTA(normCanal(e.canal))).reduce((a,e) => a + (e.noches||0)*(e.num_reservas||1), 0);
    const otaAntRows   = reservasVentanaEntries.filter(e => isOTA(normCanal(e.canal)) && e.fecha_llegada && e.fecha_pickup);
    const otaAntTot    = otaAntRows.reduce((a,e) => { const d=Math.round((new Date(e.fecha_llegada)-new Date(e.fecha_pickup))/86400000); return d>=0?a+d*(e.num_reservas||1):a; }, 0);
    const otaAntCnt    = otaAntRows.reduce((a,e) => a+(e.num_reservas||1), 0);
    const otaEntry = {
      canal: "OTAs", color: "#0052CC", isOtaGroup: true,
      count: otaCount,
      adr:   otaNochesTot > 0 ? Math.round(otaPrecioTot/otaNochesTot) : (otaCount > 0 ? Math.round(otaPrecioTot/otaCount) : null),
      noches: otaCount > 0 ? parseFloat((otaNochesTot/otaCount).toFixed(1)) : null,
      antelacion: otaAntCnt > 0 ? Math.round(otaAntTot/otaAntCnt) : null,
    };
    return [...noOta, otaEntry].sort((a,b) => b.count - a.count);
  })();

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:20 }}>

      {/* Botón Gestión de reserva — independiente, arriba a la izquierda */}
      <div style={{ display:"flex", gap:8, alignItems:"center" }}>
        <button onClick={abrirNuevaReserva}
          style={{ display:"inline-flex", alignItems:"center", gap:7, background:C.text, color:"#fff", border:"none", borderRadius:8, padding:"9px 18px", cursor:"pointer", fontSize:12, fontWeight:700, fontFamily:"'Plus Jakarta Sans',sans-serif", letterSpacing:"0.3px" }}>
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><rect x="1" y="1" width="11" height="11" rx="2" stroke="#fff" strokeWidth="1.8"/><line x1="4" y1="4.5" x2="9" y2="4.5" stroke="#fff" strokeWidth="1.5" strokeLinecap="round"/><line x1="4" y1="7" x2="7" y2="7" stroke="#fff" strokeWidth="1.5" strokeLinecap="round"/></svg>
          Gestión de reservas
        </button>
        <button onClick={generarPickupMock} disabled={generandoMock}
          style={{ display:"inline-flex", alignItems:"center", gap:6, background:"none", color:C.textMid, border:`1px solid ${C.border}`, borderRadius:8, padding:"8px 14px", cursor:generandoMock?"not-allowed":"pointer", fontSize:11, fontWeight:600, fontFamily:"'Plus Jakarta Sans',sans-serif", opacity:generandoMock?0.6:1 }}>
          ⚡ {generandoMock ? "Generando…" : "Generar pickup ficticio"}
        </button>
      </div>

      {/* Modal Gestión de reserva */}
      {modalNR && (
          <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.55)", zIndex:2000, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
            <div style={{ background:C.bgCard, borderRadius:14, padding:"28px 32px", width:"100%", maxWidth: gestionTab==="nueva" && (nrTipo==="grupo" || nrTipo==="evento") ? 540 : 460, maxHeight:"90vh", overflowY:"auto", boxShadow:"0 20px 60px rgba(0,0,0,0.25)" }}>
              {/* Cabecera */}
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:18 }}>
                <p style={{ fontFamily:"'Plus Jakarta Sans',sans-serif", fontWeight:700, fontSize:20, color:C.text }}>Gestión de reserva</p>
                <button onClick={()=>{ setModalNRPersist(false); setEditEntry(null); setGestionTabPersist("buscar"); }} style={{ background:"none", border:`1px solid ${C.border}`, borderRadius:6, width:28, height:28, cursor:"pointer", fontSize:14, color:C.textLight }}>✕</button>
              </div>

              {/* Pestañas */}
              <div style={{ display:"flex", gap:4, marginBottom:20, background:C.bg, borderRadius:8, padding:4 }}>
                {[{key:"buscar",label:"Buscar reserva"},{key:"nueva",label:"Nueva reserva"}].map(tab => (
                  <button key={tab.key} onClick={()=>{ setGestionTabPersist(tab.key); if(tab.key==="nueva"){ const _h=new Date(); const _hoy=`${_h.getFullYear()}-01-01`; setNrForm({ canal:"", num_reservas:"", fecha_llegada:_hoy, fecha_salida:"", noches:"", precio_total:"", numero_reserva:"" }); try { localStorage.removeItem("fr_nr_form"); } catch {} } }}
                    style={{ flex:1, padding:"7px 0", borderRadius:6, border:"none", cursor:"pointer", fontSize:12, fontWeight:700, fontFamily:"'Plus Jakarta Sans',sans-serif", background:gestionTab===tab.key ? C.text : "transparent", color:gestionTab===tab.key ? "#fff" : C.textLight, boxShadow:gestionTab===tab.key ? "0 1px 4px rgba(0,0,0,0.18)" : "none", transition:"all 0.15s" }}>
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* ── Pestaña Buscar ── */}
              {gestionTab === "buscar" && (() => {
                const term = busqTerm.trim();
                const termLow = term.toLowerCase();
                const esNumerico = /^\d+$/.test(term);
                const resultados = term.length < 1 ? [] : pickupEntries.filter(e => {
                  if (e._grupo) return false;
                  if (esNumerico) {
                    return e.numero_reserva != null && String(e.numero_reserva) === term;
                  }
                  return (e.canal || "").toLowerCase().includes(termLow);
                }).slice(0, 20);
                // ── Vista edición ──
                if (editEntry) return (
                  <div>
                    <button onClick={() => setEditEntry(null)} style={{ display:"flex", alignItems:"center", gap:5, background:"none", border:"none", cursor:"pointer", color:C.textMid, fontSize:12, marginBottom:14, padding:0, fontFamily:"inherit" }}>← Volver a resultados</button>
                    <p style={{ fontFamily:"'Plus Jakarta Sans',sans-serif", fontWeight:700, fontSize:16, color:C.text, marginBottom:14 }}>
                      Editar reserva{editEntry.numero_reserva ? ` #${editEntry.numero_reserva}` : ""}
                    </p>
                    {(() => {
                      const inp = { width:"100%", padding:"8px 10px", borderRadius:7, border:`1px solid ${C.border}`, fontSize:13, background:C.bgCard, color:C.text, fontFamily:"inherit", boxSizing:"border-box" };
                      const lbl = { fontSize:10, color:C.textLight, fontWeight:600, textTransform:"uppercase", letterSpacing:"0.8px", marginBottom:4 };
                      return (
                        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
                          <div><p style={lbl}>Fecha llegada</p>
                            <input type="date" value={editForm.fecha_llegada} onChange={e=>setEditForm(f=>({...f,fecha_llegada:e.target.value}))} style={inp}/></div>
                          <div><p style={lbl}>Canal</p>
                            <select value={editForm.canal} onChange={e=>setEditForm(f=>({...f,canal:e.target.value}))} style={inp}>
                              <option value="">—</option>
                              {["Booking.com","Expedia","Hotels.com","Airbnb","Hotelbeds","Agoda","Trip.com","Directo","Web propia","Tour operador","Agencia de viajes","GDS","Empresa"].map(c=><option key={c} value={c}>{c}</option>)}
                            </select></div>
                          <div><p style={lbl}>Habitaciones</p>
                            <input type="number" min="1" value={editForm.num_reservas} onChange={e=>setEditForm(f=>({...f,num_reservas:e.target.value}))} style={inp}/></div>
                          <div><p style={lbl}>Noches</p>
                            <input type="number" min="1" value={editForm.noches} onChange={e=>setEditForm(f=>({...f,noches:e.target.value}))} style={inp}/></div>
                          <div><p style={lbl}>Fecha salida</p>
                            <input type="date" value={editForm.fecha_salida} onChange={e=>setEditForm(f=>({...f,fecha_salida:e.target.value}))} style={inp}/></div>
                          <div><p style={lbl}>Estado</p>
                            <CustomSelect
                              value={editForm.estado}
                              onChange={v => setEditForm(f=>({...f, estado:v}))}
                              options={[{value:"confirmada",label:"Confirmada",color:"#1A7A3C",bg:"#E6F7EE"},{value:"cancelada",label:"Cancelada",color:"#999",bg:"#F5F5F5"}]}
                            /></div>
                          <div><p style={lbl}>Precio total €</p>
                            <input type="number" min="0" step="0.01" value={editForm.precio_total} onChange={e=>setEditForm(f=>({...f,precio_total:e.target.value}))} style={inp}/></div>
                          <div><p style={lbl}>Nº reserva</p>
                            <input type="number" min="1" value={editForm.numero_reserva} onChange={e=>setEditForm(f=>({...f,numero_reserva:e.target.value}))} style={inp}/></div>
                        </div>
                      );
                    })()}
                    {editError && <p style={{ fontSize:12, color:C.red, marginTop:10 }}>{editError}</p>}
                    {editOk && <p style={{ fontSize:12, color:C.green, marginTop:10, fontWeight:600 }}>✓ Reserva actualizada</p>}
                    <button onClick={guardarEdicion} disabled={editGuardando}
                      style={{ marginTop:16, width:"100%", padding:"10px 0", borderRadius:8, background:editGuardando?C.border:C.text, color:"#fff", border:"none", cursor:editGuardando?"default":"pointer", fontSize:13, fontWeight:700, fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
                      {editGuardando ? "Guardando..." : "Guardar cambios"}
                    </button>
                  </div>
                );
                // ── Vista búsqueda ──
                return (
                  <div>
                    <input
                      autoFocus
                      type="text"
                      placeholder="Nº reserva o canal…"
                      value={busqTerm}
                      onChange={e => setBusqTermPersist(e.target.value)}
                      style={{ width:"100%", padding:"9px 12px", borderRadius:8, border:`1px solid ${C.border}`, fontSize:13, background:C.bgCard, color:C.text, fontFamily:"inherit", boxSizing:"border-box", marginBottom:12 }}
                    />
                    {term.length > 0 && resultados.length === 0 && (
                      <p style={{ textAlign:"center", color:C.textLight, fontSize:13, padding:"24px 0" }}>Sin resultados</p>
                    )}
                    {resultados.length > 0 && (
                      <div style={{ display:"flex", flexDirection:"column", gap:0, borderRadius:8, border:`1px solid ${C.border}`, overflow:"hidden", maxHeight:320, overflowY:"auto" }}>
                        {resultados.map((e, i) => {
                          const adr = e.noches > 0 ? Math.round((e.precio_total||0)/e.noches) : null;
                          const cancelada = (e.estado||"confirmada") === "cancelada";
                          return (
                            <div key={i} onClick={() => abrirEdicion(e)}
                              style={{ display:"grid", gridTemplateColumns:"auto 1fr auto", gap:10, alignItems:"center", padding:"10px 14px", borderBottom: i<resultados.length-1 ? `1px solid ${C.border}` : "none", background: i%2===0 ? C.bg : C.bgCard, cursor:"pointer" }}
                              onMouseEnter={ev => ev.currentTarget.style.background = C.border}
                              onMouseLeave={ev => ev.currentTarget.style.background = i%2===0 ? C.bg : C.bgCard}>
                              <div style={{ textAlign:"center", minWidth:52 }}>
                                {e.numero_reserva != null
                                  ? <span style={{ display:"inline-block", background:C.text, color:"#fff", borderRadius:5, padding:"2px 7px", fontSize:11, fontWeight:700, letterSpacing:"0.3px" }}>#{e.numero_reserva}</span>
                                  : <span style={{ fontSize:10, color:C.textLight }}>—</span>}
                              </div>
                              <div>
                                <p style={{ fontSize:12, fontWeight:600, color:cancelada?C.textLight:C.text, margin:0, textDecoration:cancelada?"line-through":"none" }}>{e.canal || "—"}</p>
                                <p style={{ fontSize:11, color:C.textMid, margin:0 }}>Llegada {dmy(e.fecha_llegada)} · {e.noches||"—"}n{adr!=null?` · €${adr}/n`:""}</p>
                              </div>
                              <span style={{ fontSize:10, color:C.textLight }}>✏️</span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                    {term.length === 0 && (
                      <p style={{ textAlign:"center", color:C.textLight, fontSize:12, padding:"20px 0" }}>Número → busca por nº de reserva · Texto → busca por canal</p>
                    )}
                  </div>
                );
              })()}

              {/* ── Pestaña Nueva reserva ── */}
              {gestionTab === "nueva" && (
                <>
                  {/* Selector Individual / Grupo */}
                  <div style={{ display:"flex", gap:4, marginBottom:16, background:C.bg, borderRadius:8, padding:4 }}>
                    {[{key:"individual",label:"Individual"},{key:"grupo",label:"Grupo"},{key:"evento",label:"Evento"}].map(opt => (
                      <button key={opt.key} onClick={() => setNrTipoPersist(opt.key)}
                        style={{ flex:1, padding:"7px 0", borderRadius:6, border:"none", cursor:"pointer", fontSize:12, fontWeight:700, fontFamily:"inherit", background:nrTipo===opt.key ? C.text : "transparent", color:nrTipo===opt.key ? "#fff" : C.textLight, boxShadow:nrTipo===opt.key ? "0 1px 4px rgba(0,0,0,0.18)" : "none", transition:"all 0.15s" }}>
                        {opt.label}
                      </button>
                    ))}
                  </div>

                  {/* Formulario individual */}
                  {nrTipo === "individual" && (
                    <>
                      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
                        <div>
                          <p style={{ fontSize:10, color:C.textLight, fontWeight:600, textTransform:"uppercase", letterSpacing:"0.8px", marginBottom:4 }}>Fecha llegada</p>
                          <input type="date" value={nrForm.fecha_llegada||""} onChange={e=>{ const v=e.target.value; setNrFormPersist(f=>({ ...f, fecha_llegada:v, fecha_salida:"", noches:"" })); }} style={{ width:"100%", padding:"8px 10px", borderRadius:7, border:`1px solid ${C.border}`, fontSize:13, background:C.bgCard, color:C.text, fontFamily:"inherit", boxSizing:"border-box" }}/>
                        </div>
                        <div>
                          <p style={{ fontSize:10, color:C.textLight, fontWeight:600, textTransform:"uppercase", letterSpacing:"0.8px", marginBottom:4 }}>Canal</p>
                          <select value={nrForm.canal} onChange={e=>setNrFormPersist(f=>({...f,canal:e.target.value}))}
                            style={{ width:"100%", padding:"8px 10px", borderRadius:7, border:`1px solid ${C.border}`, fontSize:13, background:C.bgCard, color:C.text, fontFamily:"inherit", boxSizing:"border-box" }}>
                            <option value="">Seleccionar</option>
                            {["Booking.com","Expedia","Hotels.com","Airbnb","Hotelbeds","Agoda","Trip.com","Directo","Web propia","Tour operador","Agencia de viajes","GDS","Empresa"].map(c=><option key={c} value={c}>{c}</option>)}
                          </select>
                        </div>
                        <div>
                          <p style={{ fontSize:10, color:C.textLight, fontWeight:600, textTransform:"uppercase", letterSpacing:"0.8px", marginBottom:4 }}>Habitaciones</p>
                          <input type="number" min="1" value={nrForm.num_reservas} onChange={e=>setNrFormPersist(f=>({...f,num_reservas:e.target.value}))}
                            style={{ width:"100%", padding:"8px 10px", borderRadius:7, border:`1px solid ${C.border}`, fontSize:13, background:C.bgCard, color:C.text, fontFamily:"inherit", boxSizing:"border-box" }}/>
                        </div>
                        <div>
                          <p style={{ fontSize:10, color:C.textLight, fontWeight:600, textTransform:"uppercase", letterSpacing:"0.8px", marginBottom:4 }}>Noches</p>
                          <input type="number" min="1" value={nrForm.noches} onChange={e=>{ const v=e.target.value; const fl=nrForm.fecha_llegada||""; const d=new Date(fl+"T00:00:00"); if(parseInt(v)>0){d.setDate(d.getDate()+parseInt(v));} const _p=n=>String(n).padStart(2,"0"); setNrFormPersist(f=>({...f,noches:v,fecha_salida:parseInt(v)>0?`${d.getFullYear()}-${_p(d.getMonth()+1)}-${_p(d.getDate())}`:""}) ); setNrPreciosPorNoche(Array.from({length:parseInt(v)||0},()=>"")); }}
                            style={{ width:"100%", padding:"8px 10px", borderRadius:7, border:`1px solid ${C.border}`, fontSize:13, background:C.bgCard, color:C.text, fontFamily:"inherit", boxSizing:"border-box" }}/>
                        </div>
                        <div>
                          <p style={{ fontSize:10, color:C.textLight, fontWeight:600, textTransform:"uppercase", letterSpacing:"0.8px", marginBottom:4 }}>Fecha salida</p>
                          <input type="date" value={nrForm.fecha_salida} onChange={e=>{ const v=e.target.value; const fl=nrForm.fecha_llegada||""; const n=v?Math.round((new Date(v+"T00:00:00")-new Date(fl+"T00:00:00"))/86400000):0; setNrFormPersist(f=>({...f,fecha_salida:v,noches:n>0?String(n):""})); setNrPreciosPorNoche(Array.from({length:n>0?n:0},()=>"")); }}
                            style={{ width:"100%", padding:"8px 10px", borderRadius:7, border:`1px solid ${C.border}`, fontSize:13, background:C.bgCard, color:C.text, fontFamily:"inherit", boxSizing:"border-box" }}/>
                        </div>
                        {parseInt(nrForm.noches) > 1 ? (
                          <div style={{ gridColumn:"1 / -1" }}>
                            <p style={{ fontSize:10, color:C.textLight, fontWeight:600, textTransform:"uppercase", letterSpacing:"0.8px", marginBottom:6 }}>Precio por noche €</p>
                            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(90px,1fr))", gap:6 }}>
                              {nrPreciosPorNoche.map((precio, idx) => (
                                <div key={idx}>
                                  <label style={{ fontSize:9, color:C.textMid, display:"block", marginBottom:3 }}>Noche {idx+1}</label>
                                  <input type="number" min="0" step="0.01" value={precio}
                                    onChange={e=>setNrPreciosPorNoche(prev=>prev.map((v,i)=>i===idx?e.target.value:v))}
                                    style={{ width:"100%", padding:"8px 10px", borderRadius:7, border:`1px solid ${C.border}`, fontSize:13, background:C.bgCard, color:C.text, fontFamily:"inherit", boxSizing:"border-box" }}/>
                                </div>
                              ))}
                              {nrPreciosPorNoche.some(v=>parseFloat(v)>0) && (
                                <div style={{ display:"flex", alignItems:"flex-end", paddingBottom:1 }}>
                                  <div style={{ width:"100%", padding:"8px 10px", borderRadius:7, border:`1px solid ${C.border}`, fontSize:12, fontWeight:600, background:"#F5F7FA", color:C.textMid, boxSizing:"border-box" }}>
                                    Total: €{nrPreciosPorNoche.reduce((a,v)=>a+(parseFloat(v)||0),0).toLocaleString("es-ES",{minimumFractionDigits:2,maximumFractionDigits:2})}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div>
                            <p style={{ fontSize:10, color:C.textLight, fontWeight:600, textTransform:"uppercase", letterSpacing:"0.8px", marginBottom:4 }}>Precio total €</p>
                            <input type="number" min="0" step="0.01" value={nrForm.precio_total} onChange={e=>setNrFormPersist(f=>({...f,precio_total:e.target.value}))}
                              style={{ width:"100%", padding:"8px 10px", borderRadius:7, border:`1px solid ${C.border}`, fontSize:13, background:C.bgCard, color:C.text, fontFamily:"inherit", boxSizing:"border-box" }}/>
                          </div>
                        )}
                        <div>
                          <p style={{ fontSize:10, color:C.textLight, fontWeight:600, textTransform:"uppercase", letterSpacing:"0.8px", marginBottom:4 }}>Nº de reserva</p>
                          <input type="number" min="1" value={nrForm.numero_reserva} onChange={e=>setNrFormPersist(f=>({...f,numero_reserva:e.target.value}))}
                            style={{ width:"100%", padding:"8px 10px", borderRadius:7, border:`1px solid ${C.border}`, fontSize:13, background:C.bgCard, color:C.text, fontFamily:"inherit", boxSizing:"border-box" }}/>
                        </div>
                      </div>
                      {nrError && <p style={{ fontSize:12, color:C.red, marginTop:10 }}>{nrError}</p>}
                      {nrOk && <p style={{ fontSize:12, color:C.green, marginTop:10, fontWeight:600 }}>Reserva guardada</p>}
                      <button onClick={guardarNuevaReserva} disabled={nrGuardando}
                        style={{ marginTop:18, width:"100%", padding:"10px 0", borderRadius:8, background:nrGuardando?C.border:C.text, color:"#fff", border:"none", cursor:nrGuardando?"default":"pointer", fontSize:13, fontWeight:700, fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
                        {nrGuardando ? "Guardando..." : "Guardar reserva"}
                      </button>
                    </>
                  )}

                  {/* Formulario grupo / evento */}
                  {(nrTipo === "grupo" || nrTipo === "evento") && (
                    <ModalFormGrupo
                      datos={datos}
                      grupoData={{ tipo: nrTipo }}
                      onClose={() => setNrTipoPersist("individual")}
                      onGuardado={() => { setModalNRPersist(false); setNrTipoPersist("individual"); onGuardado && onGuardado(true); }}
                    />
                  )}
                </>
              )}
            </div>
          </div>
        )}

      {/* ── PICKUP HOY / AYER ── */}
      <Card>
        <div style={{ display:"flex", alignItems:"flex-start", gap:16, marginBottom:20 }}>
          <div
            onClick={() => ultDiaTotal > 0 && setShowPickupDetalle(v => !v)}
            style={{ background:"#111", borderRadius:10, padding:"10px 18px", textAlign:"center", flexShrink:0, cursor: ultDiaTotal > 0 ? "pointer" : "default", position:"relative" }}>
            <p style={{ fontSize:30, fontWeight:800, color:"#fff", fontFamily:"'Plus Jakarta Sans',sans-serif", lineHeight:1 }}>{ultDiaTotal}</p>
            <p style={{ fontSize:9, color:"#ffffff", fontWeight:700, textTransform:"uppercase", letterSpacing:1, marginTop:4 }}>Nuevas reservas</p>
            {ultDiaTotal > 0 && <span style={{ fontSize:8, color:"#aaa", display:"block", marginTop:2 }}>{showPickupDetalle ? "▲" : "▼"}</span>}
          </div>
          <div>
            <p style={{ fontFamily:"'Plus Jakarta Sans',sans-serif", fontWeight:700, fontSize:18, color:C.text }}>{tituloBloque}</p>
          </div>
        </div>

        {showPickupDetalle && (() => {
          const detalleEntries = pickupEntries.filter(e =>
            !esGrupoEvento(e) &&
            (e.estado||"confirmada") !== "cancelada" &&
            String(e.fecha_pickup||"").slice(0,10) === refDia
          ).sort((a,b) => (a.fecha_llegada||"").localeCompare(b.fecha_llegada||""));
          if (detalleEntries.length === 0) return null;
          const getSalida = e => {
            if (e.fecha_salida) return String(e.fecha_salida).slice(0,10);
            if (e.noches && e.fecha_llegada) {
              const d = new Date(String(e.fecha_llegada).slice(0,10)+"T00:00:00");
              d.setDate(d.getDate() + Number(e.noches));
              return d.toISOString().slice(0,10);
            }
            return null;
          };
          const thS = { fontSize:10, fontWeight:700, color:C.textLight, textTransform:"uppercase", letterSpacing:0.7, padding:"6px 12px", textAlign:"left", borderBottom:`1px solid ${C.border}`, whiteSpace:"nowrap" };
          const tdS = { fontSize:12, padding:"5px 12px", color:C.text, whiteSpace:"nowrap" };
          return (
            <div style={{ marginBottom:16, borderRadius:8, border:`1px solid ${C.border}`, overflow:"hidden" }}>
              <table style={{ width:"100%", borderCollapse:"collapse" }}>
                <thead><tr style={{ background:C.bg }}>
                  <th style={thS}>Nº</th>
                  <th style={thS}>Creación</th>
                  <th style={thS}>Canal</th>
                  <th style={thS}>Llegada</th>
                  <th style={thS}>Salida</th>
                  <th style={{ ...thS, textAlign:"center" }}>Noches</th>
                  <th style={{ ...thS, textAlign:"right" }}>ADR</th>
                </tr></thead>
                <tbody>
                  {detalleEntries.map((e, i) => {
                    const noches = Number(e.noches) || 0;
                    const adr = noches > 0 ? Math.round((e.precio_total||0) / noches) : null;
                    const salida = getSalida(e);
                    return (
                      <tr key={i} style={{ borderBottom: i < detalleEntries.length-1 ? `1px solid ${C.border}` : "none", background: i%2===0 ? "transparent" : C.bg }}>
                        <td style={{ ...tdS, color:C.textLight, fontVariantNumeric:"tabular-nums" }}>{e.numero_reserva ?? "—"}</td>
                        <td style={{ ...tdS, color:C.textMid }}>{fmtDatePU(String(e.fecha_pickup||"").slice(0,10))}</td>
                        <td style={{ ...tdS, fontWeight:500 }}>{e.canal || "—"}</td>
                        <td style={tdS}>{fmtDatePU(String(e.fecha_llegada||"").slice(0,10))}</td>
                        <td style={{ ...tdS, color:C.textMid }}>{salida ? fmtDatePU(salida) : "—"}</td>
                        <td style={{ ...tdS, textAlign:"center", color:C.textMid }}>{noches || "—"}</td>
                        <td style={{ ...tdS, textAlign:"right", fontWeight:700 }}>{adr != null ? `€${adr}` : "—"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          );
        })()}

        {ultDiaTotal === 0 ? (
          <p style={{ color:C.textLight, fontSize:13, textAlign:"center", padding:"20px 0" }}>{t("no_reservas_ayer")}</p>
        ) : (() => {
          const canalStats = {};
          reservasUltDia.forEach(e => {
            const c = normCanal(e.canal);
            if (!canalStats[c]) canalStats[c] = { count:0, precioTotal:0, nochesTotal:0, antTotal:0, antCount:0 };
            const nr = e.num_reservas || 1;
            canalStats[c].count       += nr;
            canalStats[c].precioTotal += (e.precio_total || 0);
            canalStats[c].nochesTotal += (e.noches || 0) * nr;
            if (e.fecha_llegada && e.fecha_pickup) {
              const dias = Math.round((new Date(e.fecha_llegada) - new Date(e.fecha_pickup)) / 86400000);
              if (dias >= 0) { canalStats[c].antTotal += dias * nr; canalStats[c].antCount += nr; }
            }
          });
          const canalData = Object.entries(canalStats).map(([canal, d]) => ({
            canal, color: CANAL_COLORS[canal] || C.accent,
            count: d.count,
            adr:   d.nochesTotal > 0 ? Math.round(d.precioTotal / d.nochesTotal) : (d.count > 0 ? Math.round(d.precioTotal / d.count) : null),
            noches: d.count > 0 ? parseFloat((d.nochesTotal / d.count).toFixed(1)) : null,
            antelacion: d.antCount > 0 ? Math.round(d.antTotal / d.antCount) : null,
          })).sort((a,b) => b.count - a.count);

          // Totales globales
          const totRaw = Object.values(canalStats).reduce((acc, d) => ({
            count: acc.count + d.count, precioTotal: acc.precioTotal + d.precioTotal,
            nochesTotal: acc.nochesTotal + d.nochesTotal, antTotal: acc.antTotal + d.antTotal, antCount: acc.antCount + d.antCount,
          }), { count:0, precioTotal:0, nochesTotal:0, antTotal:0, antCount:0 });
          const globalAdr        = totRaw.nochesTotal > 0 ? Math.round(totRaw.precioTotal / totRaw.nochesTotal) : (totRaw.count > 0 ? Math.round(totRaw.precioTotal / totRaw.count) : null);
          const globalNoches     = totRaw.count > 0 ? parseFloat((totRaw.nochesTotal / totRaw.count).toFixed(1)) : null;
          const globalAntelacion = totRaw.antCount > 0 ? Math.round(totRaw.antTotal / totRaw.antCount) : null;

          const pieData = canalData.map(d => ({ name: d.canal, value: d.count, color: d.color }));

          return (
            <div style={{ display:"grid", gridTemplateColumns:"2fr 1fr 1fr 1fr", gap:10 }}>

              {/* Tarjeta canal — queso */}
              <div style={{ borderRadius:10, padding:"16px", border:`1.5px solid ${C.border}`, background:C.bg }}>
                <p style={{ fontSize:10, fontWeight:700, textTransform:"uppercase", letterSpacing:1, color:C.textLight, marginBottom:10 }}>Por canal</p>
                <div style={{ display:"flex", alignItems:"center", gap:16 }}>
                  <PieChart width={90} height={90}>
                    <Pie data={pieData} cx={40} cy={40} innerRadius={26} outerRadius={42} dataKey="value" strokeWidth={0} isAnimationActive={false}>
                      {pieData.map((d,i) => <Cell key={i} fill={d.color}/>)}
                    </Pie>
                  </PieChart>
                  <div style={{ display:"flex", flexDirection:"column", gap:5, flex:1 }}>
                    {canalData.map(d => (
                      <div key={d.canal} style={{ display:"flex", alignItems:"center", gap:6 }}>
                        <div style={{ width:8, height:8, borderRadius:"50%", background:d.color, flexShrink:0 }}/>
                        <span style={{ fontSize:11, color:C.textMid, flex:1 }}>{d.canal}</span>
                        <span style={{ fontSize:11, fontWeight:700, color:C.text }}>{d.count}</span>
                        <span style={{ fontSize:10, color:C.textLight }}>{Math.round(d.count/ultDiaTotal*100)}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* ADR */}
              <div style={{ borderRadius:10, padding:"16px", border:`1.5px solid ${C.border}`, background:C.bg }}>
                <p style={{ fontSize:10, fontWeight:700, textTransform:"uppercase", letterSpacing:1, color:C.textLight, marginBottom:10 }}>Precio medio</p>
                <p style={{ fontSize:28, fontWeight:800, color:C.text, fontFamily:"'Plus Jakarta Sans',sans-serif", lineHeight:1, marginBottom:6 }}>{globalAdr != null ? `€${globalAdr}` : "—"}</p>
                <p style={{ fontSize:10, color:C.textMid, marginBottom:10 }}>ADR medio</p>
                <div style={{ display:"flex", flexDirection:"column", gap:4 }}>
                  {canalData.map(d => d.adr != null && (
                    <div key={d.canal} style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                      <span style={{ fontSize:10, color:C.textMid }}>{d.canal}</span>
                      <span style={{ fontSize:11, fontWeight:700, color:d.color }}>€{d.adr}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Duración */}
              <div style={{ borderRadius:10, padding:"16px", border:`1.5px solid ${C.border}`, background:C.bg }}>
                <p style={{ fontSize:10, fontWeight:700, textTransform:"uppercase", letterSpacing:1, color:C.textLight, marginBottom:10 }}>Duración media</p>
                <p style={{ fontSize:28, fontWeight:800, color:C.text, fontFamily:"'Plus Jakarta Sans',sans-serif", lineHeight:1, marginBottom:6 }}>{globalNoches != null ? globalNoches : "—"}</p>
                <p style={{ fontSize:10, color:C.textMid, marginBottom:10 }}>noches / reserva</p>
                <div style={{ display:"flex", flexDirection:"column", gap:4 }}>
                  {canalData.map(d => d.noches != null && (
                    <div key={d.canal} style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                      <span style={{ fontSize:10, color:C.textMid }}>{d.canal}</span>
                      <span style={{ fontSize:11, fontWeight:700, color:d.color }}>{d.noches}n</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Antelación */}
              <div style={{ borderRadius:10, padding:"16px", border:`1.5px solid ${C.border}`, background:C.bg }}>
                <p style={{ fontSize:10, fontWeight:700, textTransform:"uppercase", letterSpacing:1, color:C.textLight, marginBottom:10 }}>Antelación</p>
                <p style={{ fontSize:28, fontWeight:800, color:C.text, fontFamily:"'Plus Jakarta Sans',sans-serif", lineHeight:1, marginBottom:6 }}>{globalAntelacion != null ? globalAntelacion : "—"}</p>
                <p style={{ fontSize:10, color:C.textMid, marginBottom:10 }}>días de antelación</p>
                <div style={{ display:"flex", flexDirection:"column", gap:4 }}>
                  {canalData.map(d => d.antelacion != null && (
                    <div key={d.canal} style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                      <span style={{ fontSize:10, color:C.textMid }}>{d.canal}</span>
                      <span style={{ fontSize:11, fontWeight:700, color:d.color }}>{d.antelacion}d</span>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          );
        })()}
      </Card>

      {/* ── FECHAS CALIENTES + CANCELACIONES | PRECIO MEDIO CANAL ── */}
      <div style={{ display:"grid", gridTemplateColumns:"280px 1fr", gap:16, alignItems:"start" }}>

        {/* Col izquierda: Fechas Calientes + Cancelaciones */}
        <Card>
          <p style={{ fontSize:11, fontWeight:700, color:C.textLight, textTransform:"uppercase", letterSpacing:1, marginBottom:8 }}>🔥 {t("fechas_calientes")}</p>
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
          {(() => {
            const padL = n => String(n).padStart(2,"0");
            const hoyStr = `${hoy.getFullYear()}-${padL(hoy.getMonth()+1)}-${padL(hoy.getDate())}`;
            const top5 = Object.entries(habEnCasaMapPU)
              .filter(([iso, n]) => iso > hoyStr && n > 0)
              .sort((a,b) => b[1]-a[1])
              .slice(0,5);
            if (top5.length === 0) return <p style={{ fontSize:11, color:C.textLight }}>{t("sin_futuras")}</p>;
            const maxVal = top5[0][1] || 1;
            const fmt = (iso) => {
              const [y,m,d] = iso.split("-");
              const dt = new Date(Number(y), Number(m)-1, Number(d));
              return `${t("dias_abrev")[dt.getDay()]} ${Number(d)} ${t("meses_corto")[Number(m)-1]}`;
            };
            return top5.map(([fecha, otb]) => {
              const occ = Math.round(otb / habHotelPU * 100);
              const occColor = occ > 100 ? "#7B0000" : occ >= 85 ? "#E53935" : occ >= 70 ? "#FF7043" : occ >= 55 ? "#FFC107" : "#4CAF50";
              return (
                <div key={fecha} style={{ display:"flex", flexDirection:"column", gap:3 }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"baseline" }}>
                    <span style={{ fontSize:12, fontWeight:700, color:C.text }}>{fmt(fecha)}</span>
                    <div style={{ display:"flex", alignItems:"baseline", gap:6 }}>
                      <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end" }}>
                        <span style={{ fontSize:11, fontWeight:700, color:occColor }}>{occ}%</span>
                        <span style={{ fontSize:8, color:C.textLight, lineHeight:1, marginTop:1 }}>ocup.</span>
                      </div>
                      <span style={{ fontSize:13, fontWeight:800, color:COL_OTB, fontFamily:"'Plus Jakarta Sans',sans-serif" }}>{otb} {t("res_abrev")}</span>
                    </div>
                  </div>
                  <div style={{ width:"100%", height:4, background:C.border, borderRadius:2 }}>
                    <div style={{ width:`${Math.round(otb/maxVal*100)}%`, height:"100%", background:`linear-gradient(to right, ${occColor}77, ${occColor})`, borderRadius:2 }} />
                  </div>
                </div>
              );
            });
          })()}
          </div>
          <p style={{ fontSize:11, color:C.text, marginTop:8, fontStyle:"italic", opacity:0.75 }}>
            💡 Se recomienda comprobar el precio de estas fechas.
          </p>

          <div style={{ borderTop:`1px solid ${C.border}`, margin:"16px 0" }}/>

          {/* CANCELACIONES DE AYER */}
          <p style={{ fontFamily:"'Plus Jakarta Sans',sans-serif", fontWeight:700, fontSize:14, color:C.text, marginBottom:2 }}>{t("cancelaciones_ayer")}</p>
          <p style={{ fontSize:10, color:C.textLight, marginBottom:10 }}>
            {ayerD.toLocaleDateString("es-ES",{weekday:"long",day:"numeric",month:"long"}).replace(/^\w/,c=>c.toUpperCase())}
          </p>
          <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:12 }}>
            <div style={{ background: cancelTotal>0?C.redLight:"#E6F7EE", border:`1px solid ${cancelTotal>0?"#D32F2F44":"#1A7A3C44"}`, borderRadius:8, padding:"5px 12px", display:"flex", alignItems:"baseline", gap:6 }}>
              <span style={{ fontSize:18, fontWeight:800, color:cancelTotal>0?C.red:C.green, fontFamily:"'Plus Jakarta Sans',sans-serif", lineHeight:1 }}>{cancelTotal}</span>
              <span style={{ fontSize:9, fontWeight:600, textTransform:"uppercase", letterSpacing:0.8, color:cancelTotal>0?C.red:C.green }}>{cancelTotal===1?"cancelación":"cancelaciones"}</span>
            </div>
          </div>
          {cancelTotal === 0 ? (
            <p style={{ color:C.green, fontSize:12, textAlign:"center", padding:"8px 0" }}>✅ {t("sin_cancelaciones")}</p>
          ) : (() => {
            const fmtFecha = dmy;
            const thS = { fontSize:9, fontWeight:700, color:C.textLight, textTransform:"uppercase", letterSpacing:0.7, padding:"0 6px 6px", textAlign:"left", borderBottom:`1px solid ${C.border}` };
            const tdS = { fontSize:10, padding:"6px 6px", verticalAlign:"middle" };
            return (
              <table style={{ width:"100%", borderCollapse:"collapse" }}>
                <thead><tr>
                  <th style={thS}>Nº</th>
                  <th style={thS}>Llegada</th>
                  <th style={thS}>Canal</th>
                  <th style={{ ...thS, textAlign:"right" }}>ADR</th>
                </tr></thead>
                <tbody>
                  {cancelacionesAyer.map((e, i) => {
                    const canal = normCanal(e.canal) || "—";
                    const adr = e.precio_total && e.noches > 0
                      ? Math.round(e.precio_total / e.noches)
                      : e.precio_total ? Math.round(e.precio_total) : null;
                    const canalColor = CANAL_COLORS[canal] || C.textMid;
                    return (
                      <tr key={i} style={{ background: i%2===0?"transparent":C.redLight+"66" }}>
                        <td style={{ ...tdS, color:C.textLight, fontWeight:500 }}>{e.numero_reserva ?? "—"}</td>
                        <td style={{ ...tdS, color:C.text, fontWeight:600 }}>{fmtFecha(e.fecha_llegada)}</td>
                        <td style={{ ...tdS, color:canalColor, fontWeight:700 }}>{canal}</td>
                        <td style={{ ...tdS, textAlign:"right", fontWeight:800, color:C.red }}>{adr !== null ? `€${adr.toLocaleString("es-ES")}` : "—"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            );
          })()}
        </Card>

        {/* Col derecha: Reservas por ventana */}
        <Card>
          {/* Header */}
          <div style={{ display:"flex", alignItems:"flex-start", gap:16, marginBottom:20 }}>
            <div style={{ background:"#111", borderRadius:10, padding:"10px 18px", textAlign:"center", flexShrink:0 }}>
              <p style={{ fontSize:30, fontWeight:800, color:"#fff", fontFamily:"'Plus Jakarta Sans',sans-serif", lineHeight:1 }}>{ventanaTotal}</p>
              <p style={{ fontSize:9, color:"#ffffff", fontWeight:700, textTransform:"uppercase", letterSpacing:1, marginTop:4 }}>reservas</p>
            </div>
            <div style={{ flex:1 }}>
              <p style={{ fontFamily:"'Plus Jakarta Sans',sans-serif", fontWeight:700, fontSize:18, color:C.text, marginBottom:8 }}>Resumen de reservas</p>
              {/* Toggle ventana */}
              <div style={{ display:"flex", alignItems:"center", gap:8, flexWrap:"wrap" }}>
                <div style={{ display:"flex", borderRadius:8, overflow:"hidden", border:`1px solid ${C.border}`, width:"fit-content" }}>
                  {[["ayer","Ayer"], ["7d","7 días"], ["30d","30 días"], ["year","1 año"]].map(([key, label]) => (
                    <button key={key} onClick={()=>{ setReservasVentana(key); localStorage.setItem('reservasVentana',key); setReservasMesFiltro(null); localStorage.removeItem('reservasMesFiltro'); setShowMesPicker(false); setOtaDetalle(false); localStorage.setItem('otaDetalle','false'); }}
                      style={{ padding:"5px 14px", fontSize:11, fontWeight:700, cursor:"pointer", border:"none", background: !reservasMesFiltro && reservasVentana===key ? "#111" : "transparent", color: !reservasMesFiltro && reservasVentana===key ? "#fff" : C.textMid, transition:"background 0.2s", fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
                      {label}
                    </button>
                  ))}
                </div>
                {/* Picker de mes */}
                <div style={{ position:"relative" }} ref={mesPickerRef}>
                  <button onClick={()=>setShowMesPicker(v=>!v)}
                    style={{ padding:"5px 12px", fontSize:11, fontWeight:700, cursor:"pointer", borderRadius:8, border:`1px solid ${reservasMesFiltro ? "#111" : C.border}`, background: reservasMesFiltro ? "#111" : "transparent", color: reservasMesFiltro ? "#fff" : C.textMid, fontFamily:"'Plus Jakarta Sans',sans-serif", transition:"all 0.2s" }}>
                    {reservasMesFiltro ? `${MESES_CORTO[reservasMesFiltro.mes]} ${reservasMesFiltro.anio}` : "Seleccionar mes"}
                  </button>
                  {showMesPicker && (
                    <div style={{ position:"absolute", top:"calc(100% + 6px)", left:0, zIndex:300, background:C.bgCard, border:`1px solid #111`, borderRadius:10, padding:"12px", boxShadow:"0 8px 24px rgba(0,0,0,0.12)", minWidth:220 }}>
                      <PeriodSelectorInline
                        mes={reservasMesFiltro?.mes ?? hoy.getMonth()}
                        anio={reservasMesFiltro?.anio ?? hoy.getFullYear()}
                        onChange={(m,a)=>{ const v={mes:m,anio:a}; setReservasMesFiltro(v); localStorage.setItem('reservasMesFiltro',JSON.stringify(v)); setReservasVentana(null); localStorage.removeItem('reservasVentana'); setShowMesPicker(false); setOtaDetalle(false); localStorage.setItem('otaDetalle','false'); }}
                        aniosDisponibles={[...new Set((datos.produccion||[]).map(d=>new Date(d.fecha+"T00:00:00").getFullYear()).concat([hoy.getFullYear()]))].sort()}
                        allowFuture={false}
                      />
                      {reservasMesFiltro && (
                        <button onClick={()=>{ setReservasMesFiltro(null); localStorage.removeItem('reservasMesFiltro'); setReservasVentana("30d"); localStorage.setItem('reservasVentana',"30d"); setShowMesPicker(false); }}
                          style={{ width:"100%", marginTop:8, padding:"5px 0", borderRadius:6, border:`1px solid ${C.border}`, background:"none", color:C.textMid, fontSize:11, cursor:"pointer", fontFamily:"inherit" }}>
                          Quitar filtro
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          {ventanaCanalData.length === 0 ? (
            <p style={{ color:C.textLight, fontSize:13, textAlign:"center", padding:"20px 0" }}>{t("sin_datos")}</p>
          ) : (() => {
            const VISTAS = [
              { key:"count",      label:"Por canal",    valFn: d=>d.count,      fmt: v=>`${v} res.` },
              { key:"adr",        label:"Precio medio", valFn: d=>d.adr,        fmt: v=>`€${v}` },
              { key:"noches",     label:"Duración",     valFn: d=>d.noches,     fmt: v=>`${v} noches` },
              { key:"antelacion", label:"Antelación",   valFn: d=>d.antelacion, fmt: v=>`${v} días` },
            ];
            const vista = VISTAS.find(v=>v.key===reservasVista) || VISTAS[0];
            const sourceData = otaDetalle ? ventanaCanalData.filter(d => isOTA(d.canal)) : ventanaCanalDataAgrupado;
            const rows  = [...sourceData].sort((a,b) => (vista.valFn(b)||0) - (vista.valFn(a)||0));
            const max   = Math.max(...rows.map(d => vista.valFn(d)||0));
            const chartData = rows.map(d => ({ canal: d.canal, valor: vista.valFn(d) ?? 0, color: d.color, isOtaGroup: d.isOtaGroup }));
            const yMax  = max > 0 ? Math.ceil(max * 1.2) : 10;
            return (
              <div>
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:12, flexWrap:"wrap", gap:8 }}>
                  {otaDetalle && (
                    <button onClick={() => { setOtaDetalle(false); localStorage.setItem('otaDetalle','false'); }}
                      style={{ display:"flex", alignItems:"center", gap:6, background:"none", border:`1px solid ${C.border}`, borderRadius:6, padding:"4px 12px", cursor:"pointer", fontSize:11, color:C.textMid, fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
                      ← Volver
                    </button>
                  )}
                  {!otaDetalle && <div/>}
                  {otaDetalle && <span style={{ fontSize:12, fontWeight:700, color:C.text }}>Desglose OTAs</span>}
                </div>
                <div style={{ display:"flex", gap:6, marginBottom:16, flexWrap:"wrap" }}>
                  {VISTAS.map(v => (
                    <button key={v.key} onClick={()=>setReservasVista(v.key)}
                      style={{ padding:"5px 14px", borderRadius:20, border:`1.5px solid ${reservasVista===v.key?"#111":C.border}`, background:reservasVista===v.key?"#111":"transparent", color:reservasVista===v.key?"#fff":C.textMid, fontSize:12, fontWeight:reservasVista===v.key?700:400, cursor:"pointer", fontFamily:"'Plus Jakarta Sans',sans-serif", transition:"all 0.15s" }}>
                      {v.label}
                    </button>
                  ))}
                </div>
                <div onMouseDown={e=>e.preventDefault()}>
                <ResponsiveContainer width="100%" height={280}>
                <BarChart data={chartData} margin={{ top:16, right:16, left:8, bottom:8 }}>
                  <defs>
                    {chartData.map((d,i) => (
                      <linearGradient key={i} id={`vg_${i}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={d.color} stopOpacity={1}/>
                        <stop offset="100%" stopColor={d.color} stopOpacity={0.55}/>
                      </linearGradient>
                    ))}
                  </defs>
                  <CartesianGrid vertical={false} stroke={C.border} strokeDasharray="4 4"/>
                  <XAxis dataKey="canal" tick={{ fill:C.textMid, fontSize:11, fontWeight:600 }} axisLine={false} tickLine={false}/>
                  <YAxis domain={[0, yMax]} tickFormatter={vista.fmt} tick={{ fill:C.textLight, fontSize:10 }} axisLine={false} tickLine={false} width={52}/>
                  <Tooltip
                    cursor={false}
                    content={({ active, payload, label }) => {
                      if (!active || !payload?.length) return null;
                      const d = payload[0];
                      const color = (typeof d.payload?.color === "string" && !d.payload.color.startsWith("url(")) ? d.payload.color : "#7A9CC8";
                      return (
                        <div style={{ background:"#f5f5f5", border:"1.5px solid #111111", borderRadius:8, padding:"10px 14px", boxShadow:"0 1px 4px rgba(0,0,0,0.06)", minWidth:130 }}>
                          <p style={{ color:"#111111", fontSize:10, fontWeight:700, marginBottom:6, textTransform:"uppercase", letterSpacing:"1.5px" }}>{label}</p>
                          <div style={{ display:"flex", alignItems:"center", gap:7 }}>
                            <span style={{ width:8, height:8, borderRadius:2, background:color, flexShrink:0, display:"inline-block" }}/>
                            <span style={{ color:"rgba(0,0,0,0.65)", fontSize:12 }}>{vista.label}: <span style={{ color:"#111111", fontWeight:700 }}>{vista.fmt(d.value)}</span></span>
                          </div>
                          {d.payload?.isOtaGroup && <p style={{ color:"rgba(0,0,0,0.4)", fontSize:10, marginTop:6 }}>Pulsa para ver desglose</p>}
                        </div>
                      );
                    }}
                  />
                  <Bar dataKey="valor" radius={[4,4,0,0]} maxBarSize={56} shape={(p) => <SimpleBar {...p}/>}
                    onClick={(data) => { if (data?.isOtaGroup) { setOtaDetalle(true); localStorage.setItem('otaDetalle','true'); } }}
                    cursor="pointer">
                    {chartData.map((d,i) => (
                      <Cell key={i} fill={`url(#vg_${i})`} cursor={d.isOtaGroup ? "pointer" : "default"}/>
                    ))}
                  </Bar>
                </BarChart>
                </ResponsiveContainer>
                </div>
              </div>
            );
          })()}
        </Card>{/* fin col derecha */}
      </div>{/* fin grid 2 cols */}

      {/* Selector año */}
      <div style={{ display:"flex", justifyContent:"flex-end" }}>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <button
            onClick={()=>setAnioGuardado(aniosDisp[Math.max(0,aniosDisp.indexOf(anio)-1)])}
            disabled={aniosDisp.indexOf(anio)===0}
            style={{ background:"none", border:`1px solid ${C.border}`, borderRadius:6, width:28, height:28, cursor: aniosDisp.indexOf(anio)===0?"default":"pointer", fontSize:15, color: aniosDisp.indexOf(anio)===0?C.border:C.textMid, display:"flex", alignItems:"center", justifyContent:"center" }}>‹</button>
          <span style={{ fontWeight:700, fontSize:16, color:C.text, minWidth:44, textAlign:"center", fontFamily:"'Plus Jakarta Sans',sans-serif" }}>{anio}</span>
          <button
            onClick={()=>setAnioGuardado(aniosDisp[Math.min(aniosDisp.length-1,aniosDisp.indexOf(anio)+1)])}
            disabled={aniosDisp.indexOf(anio)===aniosDisp.length-1}
            style={{ background:"none", border:`1px solid ${C.border}`, borderRadius:6, width:28, height:28, cursor: aniosDisp.indexOf(anio)===aniosDisp.length-1?"default":"pointer", fontSize:15, color: aniosDisp.indexOf(anio)===aniosDisp.length-1?C.border:C.textMid, display:"flex", alignItems:"center", justifyContent:"center" }}>›</button>
        </div>
      </div>

      {/* PICKUP TRIMESTRAL — ancho completo */}
      <Card style={{ position:"relative" }}>
        <div ref={trimTipRef} style={{ position:"fixed", display: trimTip ? "block" : "none", background:"#f5f5f5", border:"1.5px solid #111111", borderRadius:8, padding:"12px 16px", boxShadow:"0 1px 4px rgba(0,0,0,0.06)", pointerEvents:"none", zIndex:9999, minWidth:148 }}>
          {trimTip && <>
            <p style={{ color:"#111111", fontSize:10, fontWeight:700, marginBottom:6, textTransform:"uppercase", letterSpacing:"1px" }}>{trimTip.mes}</p>
            {trimTip.otb  != null && <div style={{ display:"flex", alignItems:"center", gap:7, margin:"2px 0" }}><span style={{ width:8, height:8, borderRadius:2, background:COL_OTB, flexShrink:0, display:"inline-block", border:"1px solid rgba(0,0,0,0.15)" }}/><span style={{ color:"rgba(0,0,0,0.75)", fontSize:12 }}>{t("otb_actual")}: <span style={{ color:"#111111", fontWeight:700 }}>{trimTip.otb}</span></span></div>}
            {trimTip.ppto != null && <div style={{ display:"flex", alignItems:"center", gap:7, margin:"2px 0" }}><span style={{ width:8, height:8, borderRadius:2, background:COL_PPTO, flexShrink:0, display:"inline-block", border:"1px solid rgba(0,0,0,0.15)" }}/><span style={{ color:"rgba(0,0,0,0.75)", fontSize:12 }}>{t("nav_budget")}: <span style={{ color:"#111111", fontWeight:700 }}>{trimTip.ppto}</span></span></div>}
            {trimTip.ly   != null && <div style={{ display:"flex", alignItems:"center", gap:7, margin:"2px 0" }}><span style={{ width:8, height:8, borderRadius:2, background:COL_LY,  flexShrink:0, display:"inline-block", border:"1px solid rgba(0,0,0,0.15)" }}/><span style={{ color:"rgba(0,0,0,0.75)", fontSize:12 }}>{t("anio_anterior")}: <span style={{ color:"#111111", fontWeight:700 }}>{trimTip.ly}</span></span></div>}
          </>}
        </div>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:24, flexWrap:"wrap", gap:8 }}>
          <div style={{ display:"flex", gap:20, flexWrap:"wrap" }}>
            {[[t("otb_actual"), COL_OTB], [t("nav_budget"), COL_PPTO], [t("anio_anterior"), COL_LY]].map(([label, color]) => (
              <div key={label} style={{ display:"flex", alignItems:"center", gap:7 }}>
                <div style={{ width:14, height:14, background:color, borderRadius:2 }} />
                <span style={{ fontSize:12, fontWeight:600, color:C.textMid }}>{label}</span>
              </div>
            ))}
          </div>
          {trimSel !== null && (
            <button onClick={() => setTrimSel(null)}
              style={{ display:"flex", alignItems:"center", gap:6, background:"none", border:`1px solid ${C.border}`, borderRadius:6, padding:"4px 12px", cursor:"pointer", fontSize:11, color:C.textMid, fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
              ← Volver
            </button>
          )}
        </div>

        {!hayDatos ? (
          <div style={{ textAlign:"center", padding:"60px 0", color:C.textLight, fontSize:13 }}>
            {t("sin_datos_pickup")}
          </div>
        ) : (() => {
          const vista = trimSel !== null ? datosDetalle : datosGrafica;
          const vMax  = Math.ceil(Math.max(...vista.map(d => Math.max(d.otb||0, d.ppto||0, d.ly||0)), 10) * 1.15 / 10) * 10;
          const bH    = (val) => val && vMax > 0 ? `${Math.min((val/vMax)*100, 100)}%` : "0%";
          return (
          <div style={{ display:"flex", gap:0, alignItems:"flex-end", height:340, position:"relative" }}>
            {[0,25,50,75,100].map(p => (
              <div key={p} style={{ position:"absolute", left:0, right:0, bottom:`${p}%`, display:"flex", alignItems:"center" }}>
                <span style={{ fontSize:10, color:C.textLight, lineHeight:1, width:36, flexShrink:0 }}>{Math.round(vMax * p / 100)}</span>
              </div>
            ))}
            <div style={{ display:"flex", flex:1, alignItems:"flex-end", height:"100%", paddingLeft:40, gap: trimSel !== null ? 48 : 32 }}>
              {vista.map((d, i) => (
                <div key={i}
                  onClick={() => trimSel === null && setTrimSel(i)}
                  onMouseEnter={(e) => { setTrimTip(d); if (trimTipRef.current) { trimTipRef.current.style.top=`${e.clientY-10}px`; trimTipRef.current.style.left=`${e.clientX+14}px`; } }}
                  onMouseMove={(e)  => { if (trimTipRef.current) { trimTipRef.current.style.top=`${e.clientY-10}px`; trimTipRef.current.style.left=`${e.clientX+14}px`; } }}
                  onMouseLeave={() => setTrimTip(null)}
                  style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", height:"100%", justifyContent:"flex-end", gap:2, cursor: trimSel === null ? "pointer" : "default" }}>
                  <div style={{ display:"flex", alignItems:"flex-end", gap:3, width:"100%", height:"calc(100% - 22px)", justifyContent:"center" }}>
                    <div style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"flex-end", height:"100%" }}>
                      {d.otb > 0 && <span style={{ fontSize:9, fontWeight:700, color:COL_OTB, marginBottom:2, lineHeight:1 }}>{d.otb}</span>}
                      <div style={{ width:"100%", height:bH(d.otb), background:`linear-gradient(to top, ${COL_OTB}88, ${COL_OTB})`, borderRadius:"4px 4px 0 0", minHeight:d.otb>0?4:0, transition:"height 0.3s" }} />
                    </div>
                    <div style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"flex-end", height:"100%" }}>
                      {d.ppto > 0 && <span style={{ fontSize:9, fontWeight:700, color:COL_PPTO, marginBottom:2, lineHeight:1 }}>{d.ppto}</span>}
                      <div style={{ width:"100%", height:bH(d.ppto), background:`linear-gradient(to top, ${COL_PPTO}88, ${COL_PPTO})`, borderRadius:"4px 4px 0 0", minHeight:d.ppto>0?4:0, transition:"height 0.3s" }} />
                    </div>
                    <div style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"flex-end", height:"100%" }}>
                      {d.ly > 0 && <span style={{ fontSize:9, fontWeight:700, color:COL_LY, marginBottom:2, lineHeight:1 }}>{d.ly}</span>}
                      <div style={{ width:"100%", height:bH(d.ly), background:`linear-gradient(to top, ${COL_LY}88, ${COL_LY})`, borderRadius:"4px 4px 0 0", minHeight:d.ly>0?4:0, transition:"height 0.3s" }} />
                    </div>
                  </div>
                  <span style={{ fontSize:11, fontWeight:700, marginTop:6, color: trimSel === null ? COL_OTB : C.textLight }}>{d.mes}</span>
                </div>
              ))}
            </div>
          </div>
          );
        })()}
      </Card>

      {/* ── GASTOS DE DISTRIBUCIÓN ── */}
      {(() => {
        const comisionesConfig = datos.hotel?.comisiones_canales || {};
        const DEFAULT_COM = {
          "Booking.com": 15, "Expedia": 18, "Hotels.com": 15, "Airbnb": 3,
          "Hotelbeds": 20, "Agoda": 18, "Trip.com": 15, "Directo": 0,
          "Web propia": 2, "Tour operador": 20, "Agencia de viajes": 10,
          "GDS": 12, "Empresa": 0, "Grupos": 0, "Eventos / MICE": 0,
        };
        const mesD = reservasMesFiltro
          ? { mes: reservasMesFiltro.mes + 1, anio: reservasMesFiltro.anio }
          : { mes: hoy.getMonth() + 1, anio: hoy.getFullYear() };
        const mesStr = `${mesD.anio}-${String(mesD.mes).padStart(2,"0")}`;
        const MESES_NOM = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
        const mesLabel = `${MESES_NOM[mesD.mes-1]} ${mesD.anio}`;

        const revPorCanal = {};
        pickupEntries.forEach(e => {
          if ((e.estado||"confirmada") === "cancelada") return;
          const fl = String(e.fecha_llegada||"").slice(0,7);
          if (fl !== mesStr) return;
          const c = normCanal(e.canal);
          revPorCanal[c] = (revPorCanal[c]||0) + (e.precio_total||0);
        });

        if (Object.keys(revPorCanal).length === 0) return null;

        const filas = Object.entries(revPorCanal)
          .sort((a,b) => b[1]-a[1])
          .map(([canal, revenue]) => {
            const pct = comisionesConfig[canal] ?? DEFAULT_COM[canal] ?? 0;
            const coste = revenue * pct / 100;
            return { canal, revenue, pct, coste, neto: revenue - coste };
          })
          .filter(f => f.pct > 0);

        if (filas.length === 0) return null;

        const totRev   = filas.reduce((a,r)=>a+r.revenue, 0);
        const totCoste = filas.reduce((a,r)=>a+r.coste, 0);
        const totNeto  = totRev - totCoste;
        const fmt = v => Math.round(v).toLocaleString("es-ES");

        return (
          <div style={{ background:C.bgCard, border:`1px solid ${C.border}`, borderRadius:12, overflow:"hidden", marginBottom:20 }}>
            <div style={{ padding:"18px 24px 12px", borderBottom:`1px solid ${C.border}`, display:"flex", alignItems:"baseline", gap:10 }}>
              <h3 style={{ fontFamily:"'Plus Jakarta Sans',sans-serif", fontSize:16, fontWeight:700, color:C.text, margin:0 }}>Gastos de Distribución · {mesLabel}</h3>
            </div>
            <div style={{ overflowX:"auto" }}>
              <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12 }}>
                <thead>
                  <tr style={{ background:C.bg }}>
                    <th style={{ padding:"9px 16px", textAlign:"left",  color:C.textLight, fontWeight:600, fontSize:10, textTransform:"uppercase", letterSpacing:1, whiteSpace:"nowrap" }}>Canal</th>
                    <th style={{ padding:"9px 12px", textAlign:"right", color:C.textLight, fontWeight:600, fontSize:10, textTransform:"uppercase", letterSpacing:1 }}>Revenue bruto</th>
                    <th style={{ padding:"9px 12px", textAlign:"right", color:C.textLight, fontWeight:600, fontSize:10, textTransform:"uppercase", letterSpacing:1 }}>Coste dist.</th>
                    <th style={{ padding:"9px 16px", textAlign:"right", color:C.textLight, fontWeight:600, fontSize:10, textTransform:"uppercase", letterSpacing:1 }}>Revenue neto</th>
                  </tr>
                </thead>
                <tbody>
                  {filas.map((f, i) => (
                    <tr key={f.canal} style={{ borderBottom: i < filas.length-1 ? `1px solid ${C.border}` : "none" }}>
                      <td style={{ padding:"9px 16px", color:C.text, fontWeight:500, whiteSpace:"nowrap" }}>{f.canal}</td>
                      <td style={{ padding:"9px 12px", textAlign:"right", color:C.textMid }}>€{fmt(f.revenue)}</td>
                      <td style={{ padding:"9px 12px", textAlign:"right", color: f.coste > 0 ? "#C0392B" : C.textLight }}>{f.coste > 0 ? `-€${fmt(f.coste)}` : "—"}</td>
                      <td style={{ padding:"9px 16px", textAlign:"right", color:C.text, fontWeight:600 }}>€{fmt(f.neto)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr style={{ background:C.bg, borderTop:`2px solid ${C.border}` }}>
                    <td style={{ padding:"10px 16px", color:C.text, fontWeight:700, fontSize:11, textTransform:"uppercase", letterSpacing:0.8 }}>Total</td>
                    <td style={{ padding:"10px 12px", textAlign:"right", color:C.text, fontWeight:700 }}>€{fmt(totRev)}</td>
                    <td style={{ padding:"10px 12px", textAlign:"right", color:"#C0392B", fontWeight:700 }}>-€{fmt(totCoste)}</td>
                    <td style={{ padding:"10px 16px", textAlign:"right", color:C.text, fontWeight:700 }}>€{fmt(totNeto)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        );
      })()}

      {/* ── PACE ── */}
      {(() => {
        const pad = n => String(n).padStart(2,"0");
        const hab = datos.hotel?.habitaciones || 30;

        // 6 meses desde el mes actual
        const diaHoy = hoy.getDate();
        const filasPace = Array.from({ length: 6 }, (_, i) => {
          const d    = new Date(hoy.getFullYear(), hoy.getMonth() + i, 1);
          const a    = d.getFullYear();
          const m    = d.getMonth() + 1;
          const key  = `${a}-${pad(m)}`;
          const diasMes = new Date(a, m, 0).getDate();
          const esFuturo = a > hoy.getFullYear() || (a === hoy.getFullYear() && m > hoy.getMonth() + 1);
          const esMesActual = i === 0;

          // OTB actual
          const otb = otbPorMes[key] || 0;

          // LY: mes actual → hasta mismo día (LYTD); meses futuros → mes completo
          const lyDatos = (produccion || []).filter(r => {
            const f = new Date(r.fecha + "T00:00:00");
            if (f.getFullYear() !== a-1 || f.getMonth()+1 !== m) return false;
            if (esMesActual) return f.getDate() <= diaHoy;
            return true;
          });
          const lyHabOcu = lyDatos.reduce((s,r) => s + (r.hab_ocupadas||0), 0);
          const lyHabDis = lyDatos.reduce((s,r) => s + (r.hab_disponibles||0), 0);
          const lyOcc    = lyHabDis > 0 ? (lyHabOcu / lyHabDis * 100) : null;
          const lyRevHab = lyDatos.reduce((s,r) => s + (r.revenue_hab||0), 0);
          const lyAdr    = lyHabOcu > 0 ? (lyRevHab / lyHabOcu) : null;

          // Presupuesto
          const pp = (presupuesto || []).find(p => p.anio === a && p.mes === m);
          const ppOcc = pp?.occ_ppto || null;
          const ppAdr = pp?.adr_ppto || null;

          // OCC OTB estimada (reservas / (hab * días))
          const otbOcc = hab > 0 ? (otb / (hab * diasMes) * 100) : null;

          // Ppto de referencia: mes actual → proporcional al día; meses futuros → objetivo completo
          const ppOccRef = ppOcc != null && esMesActual ? (ppOcc * diaHoy / diasMes) : ppOcc;

          // Diferencias
          const diffLY   = lyOcc != null && otbOcc != null ? (otbOcc - lyOcc).toFixed(1) : null;
          const diffPpto = ppOccRef != null && otbOcc != null ? (otbOcc - ppOccRef).toFixed(1) : null;

          return {
            label: MESES[d.getMonth()] + " " + a,
            esFuturo,
            esMesActual,
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
          <div style={{ background:C.bgCard, border:`1px solid ${C.border}`, borderRadius:12, overflow:"hidden" }}>
            <div style={{ padding:"18px 24px 12px", borderBottom:`1px solid ${C.border}`, display:"flex", alignItems:"baseline", gap:10 }}>
              <h3 style={{ fontFamily:"'Plus Jakarta Sans',sans-serif", fontSize:16, fontWeight:700, color:C.text, margin:0 }}>{t("pace_title")}</h3>
              <span style={{ fontSize:11, color:C.textLight }}>{t("pace_sub")}</span>
            </div>
            <div style={{ overflowX:"auto" }}>
              <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12 }}>
                <thead>
                  <tr style={{ background:C.bg }}>
                    <th style={{ padding:"9px 16px", textAlign:"left",   color:C.textLight, fontWeight:600, fontSize:10, textTransform:"uppercase", letterSpacing:1, whiteSpace:"nowrap" }}>Mes</th>
                    <th style={{ padding:"9px 12px", textAlign:"right",  color:C.textLight, fontWeight:600, fontSize:10, textTransform:"uppercase", letterSpacing:1 }}>OTB Res.</th>
                    <th style={{ padding:"9px 12px", textAlign:"right",  color:C.textLight, fontWeight:600, fontSize:10, textTransform:"uppercase", letterSpacing:1 }}>OCC OTB</th>
                    <th style={{ padding:"9px 12px", textAlign:"right",  color:C.textLight, fontWeight:600, fontSize:10, textTransform:"uppercase", letterSpacing:1 }}>OCC LY</th>
                    <th style={{ padding:"9px 12px", textAlign:"right",  color:C.textLight, fontWeight:600, fontSize:10, textTransform:"uppercase", letterSpacing:1 }}>OCC Ppto</th>
                    <th style={{ padding:"9px 12px", textAlign:"right",  color:C.textLight, fontWeight:600, fontSize:10, textTransform:"uppercase", letterSpacing:1 }}>vs LYTD</th>
                    <th style={{ padding:"9px 16px", textAlign:"right",  color:C.textLight, fontWeight:600, fontSize:10, textTransform:"uppercase", letterSpacing:1 }}>vs Ppto</th>
                  </tr>
                </thead>
                <tbody>
                  {filasPace.map((f, i) => (
                    <tr key={i} style={{ borderTop:`1px solid ${C.border}`, background: i===0 ? C.accentLight : "transparent" }}>
                      <td style={{ padding:"10px 16px", fontWeight:600, color:C.text, whiteSpace:"nowrap" }}>
                        {f.label}
                        {f.esFuturo && <span style={{ marginLeft:6, fontSize:9, background:"#2C3E7A22", color:"#7A9CC8", borderRadius:3, padding:"1px 5px", fontWeight:700 }}>OTB</span>}
                      </td>
                      <td style={{ padding:"10px 12px", textAlign:"right", color:C.text }}>{f.otb > 0 ? f.otb : "—"}</td>
                      <td style={{ padding:"10px 12px", textAlign:"right", fontWeight:700, color:C.text }}>{f.otbOcc != null ? `${f.otbOcc}%` : "—"}</td>
                      <td style={{ padding:"10px 12px", textAlign:"right", color:C.text }}>{f.lyOcc  != null ? `${f.lyOcc}%`  : "—"}</td>
                      <td style={{ padding:"10px 12px", textAlign:"right", color:C.text }}>{f.ppOcc  != null ? `${f.ppOcc}%`  : "—"}</td>
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
  const t = useT();
  const { produccion, presupuesto } = datos;
  const pickupEntries = datos.pickupEntries || [];

  const aniosDisponibles = [...new Set((presupuesto || []).map(p => p.anio))].sort();
  const [anio, setAnio] = useState(() => aniosDisponibles.includes(anioProp) ? anioProp : (aniosDisponibles[aniosDisponibles.length - 1] || anioProp));
  const [kpiChart, setKpiChart] = useState("revenue");

  if (!presupuesto || presupuesto.length === 0) {
    return <EmptyState mensaje={t("budget_empty")} />;
  }

  const hoy = new Date();
  const pad = n => String(n).padStart(2, "0");
  const hoyStr = `${hoy.getFullYear()}-${pad(hoy.getMonth()+1)}-${pad(hoy.getDate())}`;

  // ── FORECAST v3 (dedup snapshots + ETP como diferencia LY total - OTB LY) ──
  const calcForecastRevenue = (mesIdx, anioF) => {
    const primerDia   = new Date(anioF, mesIdx, 1);
    const ultimoDia   = new Date(anioF, mesIdx + 1, 0);
    const mesStr      = `${anioF}-${pad(mesIdx + 1)}`;
    const mesStrLY    = `${anioF - 1}-${pad(mesIdx + 1)}`;
    const hoyMidnight = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
    if (ultimoDia < hoyMidnight) return null;

    const getNochas = e => {
      const n = Number(e.noches);
      if (n > 0) return n;
      if (e.fecha_salida && e.fecha_llegada) {
        const d = (new Date(String(e.fecha_salida).slice(0,10)+"T00:00:00") - new Date(String(e.fecha_llegada).slice(0,10)+"T00:00:00")) / 86400000;
        return d > 0 ? d : 1;
      }
      return 1;
    };

    // Deduplica snapshots acumulados: conserva el más reciente por (llegada|canal|salida)
    const getSalidaKey = e => {
      if (e.fecha_salida) return String(e.fecha_salida).slice(0,10);
      const n = Number(e.noches);
      if (n > 0 && e.fecha_llegada) {
        const d = new Date(String(e.fecha_llegada).slice(0,10)+"T00:00:00");
        d.setDate(d.getDate() + n);
        return d.toISOString().slice(0,10);
      }
      return "";
    };
    const dedup = (entries) => {
      const map = {};
      entries.forEach(e => {
        const key = `${String(e.fecha_llegada||"").slice(0,10)}|${e.canal||""}|${getSalidaKey(e)}`;
        const fp  = String(e.fecha_pickup||"").slice(0,10);
        if (!map[key] || fp > map[key]._fp) map[key] = { ...e, _fp: fp };
      });
      return Object.values(map);
    };

    const sumNights  = arr => arr.reduce((a, e) => a + (e.num_reservas || 1) * getNochas(e), 0);
    const sumRevenue = arr => arr.reduce((a, e) => a + (e.precio_total || 0), 0);

    // ── Producción LY (fuente autorizada para ADR histórico) ──
    const diasLY   = (produccion || []).filter(r => String(r.fecha || "").slice(0,7) === mesStrLY);
    const habOcuLY = diasLY.reduce((a, r) => a + (r.hab_ocupadas || 0), 0);
    const revHabLY = diasLY.reduce((a, r) => a + (r.revenue_hab  || 0), 0);
    const habDisLY = diasLY.reduce((a, r) => a + (r.hab_disponibles || 0), 0);
    const adrLY    = habOcuLY > 0 ? revHabLY / habOcuLY : null;
    const habHotel = datos?.hotel?.habitaciones || 0;
    const habDis   = habDisLY > 0 ? habDisLY : habHotel * ultimoDia.getDate();

    // ── Tasa de cancelación histórica (últimos 3 meses, deduplicada) ──
    let canceladas = 0, totales = 0;
    for (let m = 1; m <= 3; m++) {
      const ref    = new Date(hoy.getFullYear(), hoy.getMonth() - m, 1);
      const refStr = `${ref.getFullYear()}-${pad(ref.getMonth() + 1)}`;
      const mes3   = dedup(pickupEntries.filter(e => String(e.fecha_llegada || "").slice(0,7) === refStr));
      mes3.forEach(e => { totales++; if ((e.estado || "confirmada") === "cancelada") canceladas++; });
    }
    const cancelRate = totales > 20 ? canceladas / totales : 0.08;

    const hoyLY    = `${anioF - 1}-${pad(hoy.getMonth() + 1)}-${pad(hoy.getDate())}`;
    const finMesLY = `${anioF - 1}-${pad(mesIdx + 1)}-${pad(ultimoDia.getDate())}`;

    // ── OTB actual: snapshot más reciente por reserva, pickup ≤ hoy ──
    const otbEntries = dedup(pickupEntries.filter(e =>
      String(e.fecha_llegada || "").slice(0,7) === mesStr &&
      String(e.fecha_pickup  || "").slice(0,10) <= hoyStr &&
      (e.estado || "confirmada") !== "cancelada"
    ));
    const otbNights  = sumNights(otbEntries);
    const otbRevenue = sumRevenue(otbEntries);
    const adrOTB     = otbNights > 0 && otbRevenue > 0 ? otbRevenue / otbNights : adrLY;
    const netOTBNights  = otbNights  * (1 - cancelRate);
    const netOTBRevenue = otbRevenue * (1 - cancelRate);

    // ── LY OTB a fecha equivalente (snapshot más reciente, pickup ≤ hoyLY) ──
    const lyBase = pickupEntries.filter(e =>
      String(e.fecha_llegada || "").slice(0,7) === mesStrLY &&
      (e.estado || "confirmada") !== "cancelada"
    );
    const lyOtbEntries  = dedup(lyBase.filter(e => String(e.fecha_pickup||"").slice(0,10) <= hoyLY));
    const lyAllEntries  = dedup(lyBase.filter(e => String(e.fecha_pickup||"").slice(0,10) <= finMesLY));

    const otbNightsLY   = sumNights(lyOtbEntries);
    const lyTotalNights = sumNights(lyAllEntries);
    const lyTotalRev    = sumRevenue(lyAllEntries);
    const lyOtbRev      = sumRevenue(lyOtbEntries);

    // ETP LY = diferencia real entre total fin de mes LY y estado en fecha equivalente LY
    const etpNightsLY = Math.max(0, lyTotalNights - otbNightsLY);
    const etpRevLY    = Math.max(0, lyTotalRev    - lyOtbRev);

    // ── Pace factor: ratio OTB actual vs OTB LY en la misma fecha relativa ──
    const paceRaw    = otbNightsLY > 3 ? otbNights / otbNightsLY : 1;
    const paceFactor = Math.min(1.5, Math.max(0.5, paceRaw));
    const hasLYData  = etpNightsLY > 0;

    // ETP proyectado (LY ajustado por pace)
    const etpNights = Math.round(etpNightsLY * paceFactor);
    const etpRev    = etpRevLY > 0
      ? Math.round(etpRevLY * paceFactor)
      : (adrLY ? Math.round(etpNights * adrLY) : 0);

    // ── Revenue forecast = OTB neto + ETP ──
    const forecastRev = Math.round(netOTBRevenue + etpRev);
    if (forecastRev <= 0) return null;

    // ADR blended (ponderado por room-nights de cada parte)
    const totalNights = netOTBNights + etpNights;
    const forecastAdr = totalNights > 0
      ? Math.round((netOTBRevenue + etpRev) / totalNights)
      : Math.round(adrOTB || adrLY || 0);

    const forecastRevpar = habDis > 0 ? Math.round(forecastRev / habDis) : null;

    // ── Confianza: % del mes + penalización por falta de datos ──
    const diasMes   = ultimoDia.getDate();
    const diaActual = primerDia > hoy ? 0 : Math.min(hoy.getDate(), diasMes);
    const basePct   = Math.round((diaActual / diasMes) * 100);
    const confianza = Math.max(5, basePct + (hasLYData ? 0 : -20) + (otbNights > 5 ? 0 : -10));

    return {
      forecastRev, forecastAdr, forecastRevpar,
      otbNights: Math.round(otbNights), etpNights,
      netOTBNights: Math.round(netOTBNights),
      cancelRate: Math.round(cancelRate * 100),
      paceFactor: paceFactor.toFixed(2),
      confianza, hasLYData,
    };
  };

  // ── REALES POR MES ────────────────────────────────────────────
  const realesPorMes = t("meses_full").map((_, i) => {
    const d = (produccion || []).filter(r => {
      const f = new Date(r.fecha + "T00:00:00");
      return f.getMonth() === i && f.getFullYear() === anio;
    });
    const habOcu = d.reduce((a, r) => a + (r.hab_ocupadas || 0), 0);
    const habDis = d.reduce((a, r) => a + (r.hab_disponibles || 0), 0);
    const revH   = d.reduce((a, r) => a + (r.revenue_hab || 0), 0);
    const revF   = d.reduce((a, r) => a + (r.revenue_fnb || 0), 0);
    const revS   = d.reduce((a, r) => a + (r.revenue_salas || 0), 0);
    const revT   = d.reduce((a, r) => a + (r.revenue_total || 0), 0);
    return {
      adr_real:       habOcu > 0 ? Math.round(revH / habOcu) : null,
      revpar_real:    habDis > 0 ? Math.round(revH / habDis) : null,
      rev_total_real: d.length > 0 ? Math.round(revT) : null,
      rev_hab_real:   d.length > 0 ? Math.round(revH) : null,
      rev_fnb_real:   d.length > 0 && revF > 0 ? Math.round(revF) : null,
      rev_salas_real: d.length > 0 && revS > 0 ? Math.round(revS) : null,
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
      const hoyMidnight  = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
      const mesCerrado   = ultimoDiaMes < hoyMidnight;
      const fcKey = `fr_fc_${anio}_${p.mes}`;
      let forecast_rev, forecast_adr, forecast_revpar, confianza;
      if (!mesCerrado && fcData) {
        forecast_rev    = fcData.forecastRev;
        forecast_adr    = fcData.forecastAdr;
        forecast_revpar = fcData.forecastRevpar;
        confianza       = fcData.confianza;
        try { sessionStorage.setItem(fcKey, JSON.stringify({ forecast_rev, forecast_adr, forecast_revpar, confianza })); } catch(_) {}
      } else if (mesCerrado) {
        let saved = null;
        try { saved = JSON.parse(sessionStorage.getItem(fcKey)); } catch(_) {}
        forecast_rev    = saved?.forecast_rev    ?? null;
        forecast_adr    = saved?.forecast_adr    ?? null;
        forecast_revpar = saved?.forecast_revpar ?? null;
        confianza       = saved?.confianza       ?? null;
      } else {
        forecast_rev = forecast_adr = forecast_revpar = confianza = null;
      }

      const adr_dev       = real.adr_real != null       ? Math.round((real.adr_real - p.adr_ppto) * 100) / 100     : null;
      const revpar_dev    = real.revpar_real != null     ? Math.round((real.revpar_real - p.revpar_ppto) * 100) / 100 : null;
      const revtotal_dev  = real.rev_total_real != null  ? real.rev_total_real - p.rev_total_ppto : null;
      const forecast_dev  = forecast_rev != null && p.rev_total_ppto ? forecast_rev - p.rev_total_ppto : null;
      const forecast_dev_pct = forecast_dev != null && p.rev_total_ppto > 0 ? ((forecast_dev / p.rev_total_ppto) * 100).toFixed(1) : null;

      return {
        mes: t("meses_full")[p.mes - 1], mesIdx: p.mes - 1,
        adr_ppto: p.adr_ppto, adr_real: real.adr_real, adr_dev,
        adr_dev_pct: p.adr_ppto > 0 && adr_dev != null ? ((adr_dev / p.adr_ppto) * 100).toFixed(1) : null,
        revpar_ppto: p.revpar_ppto, revpar_real: real.revpar_real, revpar_dev,
        revpar_dev_pct: p.revpar_ppto > 0 && revpar_dev != null ? ((revpar_dev / p.revpar_ppto) * 100).toFixed(1) : null,
        rev_total_ppto: p.rev_total_ppto, rev_total_real: real.rev_total_real, revtotal_dev,
        revtotal_dev_pct: p.rev_total_ppto > 0 && revtotal_dev != null ? ((revtotal_dev / p.rev_total_ppto) * 100).toFixed(1) : null,
        rev_hab_real: real.rev_hab_real, rev_fnb_real: real.rev_fnb_real, rev_salas_real: real.rev_salas_real,
        forecast_rev, forecast_adr, forecast_revpar, forecast_dev, forecast_dev_pct, confianza, mesCerrado,
        otbRes: fcData?.otbRes, etpRes: fcData?.etpRes, paceFactor: fcData?.paceFactor,
      };
    });

  const filasConReal   = filas.filter(f => f.adr_real != null || f.revpar_real != null);
  const totalRevPpto   = filas.reduce((a, f) => a + (f.rev_total_ppto || 0), 0);
  const totalRevReal   = filasConReal.reduce((a, f) => a + (f.rev_total_real || 0), 0);
  const totalRevRealLY = filasConReal.reduce((a, f) => {
    const d = (produccion || []).filter(r => {
      const fe = new Date(r.fecha + "T00:00:00");
      return fe.getMonth() === f.mesIdx && fe.getFullYear() === anio - 1;
    });
    return a + d.reduce((s, r) => s + (r.revenue_total || 0), 0);
  }, 0);
  const lytdPct = totalRevRealLY > 0 ? (((totalRevReal - totalRevRealLY) / totalRevRealLY) * 100).toFixed(1) : null;
  const lytdUp  = lytdPct != null ? parseFloat(lytdPct) >= 0 : null;
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
    if (cerrado) return <span style={{ fontSize: 9, color: C.green, fontWeight: 600 }}>{t("real_badge")}</span>;
    const color = pct >= 70 ? C.green : pct >= 40 ? "#E85D04" : C.textLight;
    return (
      <span style={{ fontSize: 9, color, fontWeight: 600, display: "block", marginTop: 2 }}>
        {pct}% {t("confianza")}
      </span>
    );
  };

  const kpiOpts = [
    { key: "revenue", label: t("rev_total_label") },
    { key: "adr",     label: "ADR" },
    { key: "revpar",  label: "RevPAR" },
  ];

  const chartUnificado = filas.map(f => ({
    mes: f.mes,
    mesFull: t("meses_full")[f.mesIdx],
    anioIdx: anio,
    Ppto: kpiChart==="revenue" ? (f.rev_total_ppto ? Math.round(f.rev_total_ppto/1000) : null)
         : kpiChart==="adr"     ? f.adr_ppto : f.revpar_ppto,
    Real: kpiChart==="revenue" ? (f.rev_total_real ? Math.round(f.rev_total_real/1000) : null)
         : kpiChart==="adr"     ? f.adr_real : f.revpar_real,
    Forecast: f.mesCerrado ? null
            : kpiChart==="revenue" && f.forecast_rev ? Math.round(f.forecast_rev / 1000)
            : kpiChart==="adr"    ? (f.forecast_adr ?? null)
            : kpiChart==="revpar" ? (f.forecast_revpar != null ? Math.round(f.forecast_revpar) : null)
            : null,
  }));

  const chartUnit  = kpiChart==="revenue" ? "k€" : "€";
  const chartTitle = kpiChart==="revenue" ? t("chart_rev")
                   : kpiChart==="adr"     ? t("chart_adr") : t("chart_revpar");

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:20 }}>

      {/* Selector año */}
      {aniosDisponibles.length > 1 && (
        <div style={{ display:"flex", justifyContent:"flex-end" }}>
          <select value={anio} onChange={e => setAnio(parseInt(e.target.value))} style={{ padding:"6px 10px", borderRadius:6, border:`1px solid ${C.border}`, fontSize:12, fontWeight:600, color:C.text, background:C.bgCard, cursor:"pointer", fontFamily:"'Plus Jakarta Sans',sans-serif", outline:"none" }}>
            {aniosDisponibles.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>
      )}

      {/* Gráfica */}
      <Card>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:20 }}>
          <div>
            <p style={{ fontFamily:"'Plus Jakarta Sans',sans-serif", fontWeight:700, fontSize:18, color:C.text }}>{chartTitle}</p>
            <p style={{ fontSize:11, color:C.textLight, marginTop:3, letterSpacing:"0.3px" }}>Presupuesto · Real · Forecast &mdash; {anio}</p>
          </div>
          <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:10 }}>
            <div style={{ display:"flex", gap:6 }}>
              {kpiOpts.map(o => (
                <button key={o.key} onClick={()=>setKpiChart(o.key)}
                  style={{ padding:"5px 14px", borderRadius:7, border:`1.5px solid ${kpiChart===o.key?"#1A7A3C":C.border}`, background:kpiChart===o.key?"#1A7A3C18":"transparent", color:kpiChart===o.key?"#1A7A3C":C.textLight, fontSize:12, fontWeight:kpiChart===o.key?700:400, cursor:"pointer", fontFamily:"'Plus Jakarta Sans',sans-serif", transition:"all 0.15s" }}>
                  {o.label}
                </button>
              ))}
            </div>
            <div style={{ display:"flex", gap:16 }}>
              {[
                { color:"#64748B", opacity:0.55, label:t("ppto_abrev") },
                { color:"#1A7A3C", opacity:1,    label:t("real_label") },
                { color:"#B8860B", opacity:0.85,  label:"Forecast" },
              ].map((item, i) => (
                <div key={i} style={{ display:"flex", alignItems:"center", gap:5 }}>
                  <div style={{ width:10, height:10, borderRadius:2, background:item.color, opacity:item.opacity }} />
                  <span style={{ fontSize:10, color:C.textLight, fontWeight:500, letterSpacing:"0.5px", textTransform:"uppercase" }}>{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div onMouseDown={e=>e.preventDefault()}>
        <ResponsiveContainer width="100%" height={310}>
          <BarChart data={chartUnificado} barSize={16} barGap={3} barCategoryGap="32%">
            <defs>
              <linearGradient id="gradReal" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#1A7A3C" stopOpacity={1}/>
                <stop offset="100%" stopColor="#1A7A3C" stopOpacity={0.75}/>
              </linearGradient>
              <linearGradient id="gradForecast" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#B8860B" stopOpacity={0.9}/>
                <stop offset="100%" stopColor="#B8860B" stopOpacity={0.55}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={C.border} vertical={false}/>
            <XAxis dataKey="mes" tick={{ fill: C.textLight, fontSize: 11 }} axisLine={false} tickLine={false}/>
            <YAxis tick={{ fill: C.textLight, fontSize: 11 }} axisLine={false} tickLine={false} unit={chartUnit} width={54}/>
            <Tooltip
              cursor={false}
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const colorMap = { Ppto:"#64748B", Real:"#1A7A3C", Forecast:"#B8860B" };
                const raw = payload[0]?.payload || {};
                const mesNombre = raw.mesFull || raw.mes || "";
                const anioLabel = raw.anioIdx ? ` ${raw.anioIdx}` : "";
                return (
                  <div style={{ background:"#f5f5f5", border:"1.5px solid #111111", borderRadius:8, padding:"12px 16px", boxShadow:"0 1px 4px rgba(0,0,0,0.06)", minWidth:164 }}>
                    <p style={{ margin:"0 0 8px", fontSize:10, fontWeight:700, color:"#111111", textTransform:"uppercase", letterSpacing:"1.5px" }}>{mesNombre}{anioLabel}</p>
                    {payload.map((p, i) => p.value != null && (
                      <div key={i} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", gap:20, marginBottom:4 }}>
                        <span style={{ display:"flex", alignItems:"center", gap:6 }}>
                          <span style={{ display:"inline-block", width:8, height:8, borderRadius:2, background:colorMap[p.dataKey] || "#888", border:"1px solid rgba(0,0,0,0.15)" }} />
                          <span style={{ fontSize:11, color:"rgba(0,0,0,0.65)" }}>{p.name}</span>
                        </span>
                        <span style={{ fontSize:12, fontWeight:700, color:"#111111" }}>
                          €{(kpiChart==="revenue" ? Math.round(p.value*1000) : Math.round(p.value)).toLocaleString("es-ES")}
                        </span>
                      </div>
                    ))}
                  </div>
                );
              }}
            />
            <Bar dataKey="Ppto"     name={t("ppto_abrev")} fill="#64748B" fillOpacity={0.45} radius={[4,4,0,0]} shape={(p) => <SimpleBar {...p}/>}/>
            <Bar dataKey="Real"     name={t("real_label")} fill="url(#gradReal)"     radius={[4,4,0,0]} shape={(p) => <SimpleBar {...p}/>}/>
            <Bar dataKey="Forecast" name="Forecast"         fill="url(#gradForecast)" radius={[4,4,0,0]} shape={(p) => <SimpleBar {...p}/>}/>
          </BarChart>
        </ResponsiveContainer>
        </div>
      </Card>

      {/* Tabla detalle */}
      <Card>
        <p style={{ fontFamily:"'Plus Jakarta Sans',sans-serif", fontWeight:700, fontSize:16, color:C.text, marginBottom:16 }}>{t("detalle_mensual")}</p>
        <div style={{ overflowX:"auto" }}>
          <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12 }}>
            <thead>
              <tr>
                {[t("th_mes"),t("th_adr_ppto"),t("th_adr_real"),t("th_desv_adr"),t("th_revpar_ppto"),t("th_revpar_real"),t("th_desv_revpar"),t("th_rev_ppto"),t("th_rev_real"),t("th_desv_rev"),t("th_forecast")].map((h,hi) => (
                  <th key={hi} style={{ padding:"10px 14px", textAlign: hi===0?"left":"right", fontSize:10, color: hi===10?"#B8860B":C.textLight, textTransform:"uppercase", letterSpacing:"1px", fontWeight:600, borderBottom:`2px solid ${C.border}`, whiteSpace:"nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filas.map((f, i) => {
                const esFuturo = !f.mesCerrado && f.rev_total_real == null;
                const esEnCurso = !f.mesCerrado && f.rev_total_real != null;
                return (
                  <tr key={i} style={{ borderBottom:`1px solid ${C.border}`, background: i%2===0?C.bg:C.bgCard }}>
                    <td style={{ padding:"9px 14px", fontWeight:600, color:C.text }}>{f.mes}</td>
                    <td style={{ padding:"9px 14px", textAlign:"right", color:C.textMid }}>€{f.adr_ppto}</td>
                    <td style={{ padding:"9px 14px", textAlign:"right", color:C.text, fontWeight:f.adr_real?600:400 }}>{f.adr_real!=null?`€${f.adr_real}`:"—"}</td>
                    <td style={{ padding:"9px 14px", textAlign:"right" }}><DevBadge val={f.adr_dev} pct={f.adr_dev_pct}/></td>
                    <td style={{ padding:"9px 14px", textAlign:"right", color:C.textMid }}>€{f.revpar_ppto}</td>
                    <td style={{ padding:"9px 14px", textAlign:"right", color:"#1A7A3C", fontWeight:f.revpar_real?600:400 }}>{f.revpar_real!=null?`€${f.revpar_real}`:"—"}</td>
                    <td style={{ padding:"9px 14px", textAlign:"right" }}><DevBadge val={f.revpar_dev} pct={f.revpar_dev_pct}/></td>
                    <td style={{ padding:"9px 14px", textAlign:"right", color:C.textMid }}>€{f.rev_total_ppto?.toLocaleString("es-ES")}</td>
                    <td style={{ padding:"9px 14px", textAlign:"right", color:"#1A7A3C", fontWeight:f.rev_total_real?600:400 }}>{f.rev_total_real!=null?`€${f.rev_total_real.toLocaleString("es-ES")}`:"—"}</td>
                    <td style={{ padding:"9px 14px", textAlign:"right" }}><DevBadge val={f.revtotal_dev} pct={f.revtotal_dev_pct}/></td>
                    <td style={{ padding:"9px 14px", textAlign:"right", background: f.mesCerrado?"transparent":"#FFF8E7", borderLeft:`2px solid ${f.forecast_rev?"#B8860B44":"transparent"}` }}>
                      {f.forecast_rev != null ? (
                        <div>
                          <span style={{ fontSize:13, fontWeight:700, color:"#B8860B" }}>€{Math.round(f.forecast_rev).toLocaleString("es-ES")}</span>
                          {f.forecast_dev != null && (
                            <span style={{ fontSize:9, color:f.forecast_dev>=0?C.green:C.red, fontWeight:600, display:"block" }}>
                              {f.forecast_dev>=0?"+":""}{(f.forecast_dev/1000).toFixed(1)}k {t("vs_ppto")}
                            </span>
                          )}
                        </div>
                      ) : "—"}
                    </td>
                  </tr>
                );
              })}
              {filasConReal.length > 0 && (
                <tr style={{ borderTop:`2px solid ${C.border}`, background: C.greenLight, fontWeight:700 }}>
                  <td style={{ padding:"10px 14px", color:C.text, fontWeight:700 }}>{t("total_ytd")}</td>
                  <td colSpan={2} style={{ padding:"10px 14px", textAlign:"right", color:C.textMid, fontSize:11 }}>Ppto: €{mediaAdrPpto} media</td>
                  <td style={{ padding:"10px 14px", textAlign:"right" }}><DevBadge val={mediaAdrReal!=null?mediaAdrReal-mediaAdrPpto:null} pct={mediaAdrReal!=null?(((mediaAdrReal-mediaAdrPpto)/mediaAdrPpto)*100).toFixed(1):null}/></td>
                  <td colSpan={2} style={{ padding:"10px 14px", textAlign:"right", color:C.textMid, fontSize:11 }}>Ppto: €{mediaRevparPpto} media</td>
                  <td style={{ padding:"10px 14px", textAlign:"right" }}><DevBadge val={mediaRevparReal!=null?mediaRevparReal-mediaRevparPpto:null} pct={mediaRevparReal!=null?(((mediaRevparReal-mediaRevparPpto)/mediaRevparPpto)*100).toFixed(1):null}/></td>
                  <td style={{ padding:"10px 14px", textAlign:"right", color:C.textMid, fontSize:11 }}>€{Math.round(filasConReal.reduce((a,f)=>a+(f.rev_total_ppto||0),0)).toLocaleString("es-ES")}</td>
                  <td style={{ padding:"10px 14px", textAlign:"right", color:"#1A7A3C", fontWeight:700 }}>€{Math.round(totalRevReal).toLocaleString("es-ES")}</td>
                  <td style={{ padding:"10px 14px", textAlign:"right" }}><DevBadge val={Math.round(totalRevDev)} pct={totalRevDevPct}/></td>
                  <td style={{ padding:"10px 14px", textAlign:"right", background:"#FFF8E7", borderLeft:"2px solid #B8860B44" }}>
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
function ModalFormGrupo({ datos, grupoData = {}, onClose, onGuardado }) {
  const t = useT();
  const session = datos.session;
  const isEditing = Boolean(grupoData?.id);

  const FORM_VACIO = { tipo:"grupo", nombre:"", categoria:"corporativo", estado:"confirmado", segmento:"negocio", fecha_inicio:"", fecha_fin:"", fecha_confirmacion:"", habitaciones:"", pax:"", adr_grupo:"", revenue_fnb:"", revenue_sala:"", notas:"", motivo_perdida:"", hora_inicio:"", hora_fin:"", sala_nombre:"", servicio_incluido:false };

  const normEstado = (e) => (e === "tentativo" || e === "cotizacion") ? "cotizado" : (e || "confirmado");
  const parseNotasEvento = (notas) => {
    if (!notas) return { hora_inicio:"", hora_fin:"", sala_nombre:"", servicio_incluido:false, notasUser:"" };
    const m = notas.match(/^\[ev:([^\]]*)\]\n?([\s\S]*)$/);
    if (!m) return { hora_inicio:"", hora_fin:"", sala_nombre:"", servicio_incluido:false, notasUser: notas };
    const parts = Object.fromEntries(m[1].split(",").map(p => p.split("=")));
    return { hora_inicio: parts.hi||"", hora_fin: parts.hf||"", sala_nombre: parts.sala||"", servicio_incluido: parts.serv==="sí", notasUser: m[2] };
  };
  const packNotasEvento = (f) => {
    const meta = `[ev:hi=${f.hora_inicio},hf=${f.hora_fin},sala=${f.sala_nombre},serv=${f.servicio_incluido?"sí":"no"}]`;
    return meta + (f.notas ? "\n" + f.notas : "");
  };

  const initForm = () => {
    const g = grupoData;
    const _anyo = new Date().getFullYear();
    const _defFecha = `${_anyo}-01-01`;
    if (!g || !g.nombre) return { ...FORM_VACIO, tipo: g.tipo||"grupo", fecha_inicio: g.fecha_inicio||_defFecha, fecha_fin: g.fecha_fin||_defFecha };
    const esEvento = g.categoria === "evento";
    const { hora_inicio, hora_fin, sala_nombre, servicio_incluido, notasUser } = esEvento ? parseNotasEvento(g.notas) : {};
    return {
      tipo: esEvento ? "evento" : "grupo",
      nombre: g.nombre||"", categoria: g.categoria||"corporativo", estado: normEstado(g.estado), segmento: g.segmento||"negocio",
      fecha_inicio: g.fecha_inicio||"", fecha_fin: g.fecha_fin||"", fecha_confirmacion: g.fecha_confirmacion||"",
      habitaciones: g.habitaciones||"", pax: g.pax||"", adr_grupo: g.adr_grupo||"",
      revenue_fnb: g.revenue_fnb||"", revenue_sala: g.revenue_sala||"",
      notas: esEvento ? (notasUser||"") : (g.notas||""), motivo_perdida: g.motivo_perdida||"",
      hora_inicio: hora_inicio||"", hora_fin: hora_fin||"", sala_nombre: sala_nombre||"", servicio_incluido: servicio_incluido||false,
    };
  };

  const [form, setForm] = useState(initForm);
  const [guardando, setGuardando] = useState(false);
  const [ingresosHabs, setIngresosHabs] = useState("");

  const CATS = {
    corporativo: { label: t("cat_corporativo"), color: "#2B7EC1" },
    boda:        { label: t("cat_boda"),        color: "#D4547A" },
    feria:       { label: t("cat_feria"),       color: "#E85D04" },
    deportivo:   { label: t("cat_deportivo"),   color: "#059669" },
    otros:       { label: t("cat_otros"),       color: "#7C3AED" },
    evento:      { label: "Evento",             color: "#0A7C6A" },
  };
  const ESTADOS = {
    confirmado: { label: t("estado_confirmado"), color: "#1A7A3C", bg: "#E6F7EE", peso: 1.0 },
    cotizado:   { label: t("estado_cotizacion"), color: "#B8860B", bg: "#FFF8E7", peso: 0.5 },
    cancelado:  { label: t("estado_cancelado"),  color: "#999",    bg: "#F5F5F5", peso: 0   },
    tentativo:  { label: t("estado_cotizacion"), color: "#B8860B", bg: "#FFF8E7", peso: 0.5 },
  };

  const guardar = async () => {
    if (!form.nombre || !form.fecha_inicio) return;
    if (form.tipo === "grupo" && !form.fecha_fin) return;
    setGuardando(true);
    const esEvento = form.tipo === "evento";
    const payload = {
      hotel_id: session.user.id,
      nombre: form.nombre,
      categoria: esEvento ? "evento" : form.categoria,
      estado: normEstado(form.estado),
      segmento: form.segmento||null,
      fecha_inicio: form.fecha_inicio,
      fecha_fin: esEvento ? form.fecha_inicio : (form.fecha_fin || form.fecha_inicio),
      habitaciones: esEvento ? 0 : (parseInt(form.habitaciones)||0),
      adr_grupo: esEvento ? 0 : (() => {
        const habs = parseInt(form.habitaciones)||0;
        const noches = Math.max(1, Math.round((new Date(form.fecha_fin)-new Date(form.fecha_inicio))/86400000));
        const ing = parseFloat(ingresosHabs)||0;
        const adr = habs > 0 && noches > 0 && ing > 0 ? ing/(habs*noches) : (parseFloat(form.adr_grupo)||0);
        return Math.round(adr * NET_HAB_FNB * 100) / 100;
      })(),
      revenue_fnb: Math.round((parseFloat(form.revenue_fnb)||0) * NET_HAB_FNB * 100) / 100,
      revenue_sala: Math.round((parseFloat(form.revenue_sala)||0) * NET_SALA * 100) / 100,
      fecha_confirmacion: form.fecha_confirmacion||null,
      notas: esEvento ? packNotasEvento(form) : (form.notas||null),
      motivo_perdida: form.motivo_perdida||null,
    };
    if (isEditing) {
      await supabase.from("grupos_eventos").update(payload).eq("id", grupoData.id);
    } else {
      await supabase.from("grupos_eventos").insert(payload);
    }
    setGuardando(false);
    onGuardado && onGuardado();
  };

  const eliminar = async () => {
    const msg = form.tipo === "evento" ? t("eliminar_evento") : t("eliminar_grupo");
    if (!window.confirm(msg)) return;
    await supabase.from("grupos_eventos").delete().eq("id", grupoData.id);
    onGuardado && onGuardado();
  };

  const inp = { width:"100%", padding:"9px 12px", borderRadius:7, border:`1.5px solid ${C.border}`, fontSize:13, fontFamily:"'Plus Jakarta Sans',sans-serif", color:C.text, background:C.bg, outline:"none", boxSizing:"border-box" };

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:12 }}>

      <div>
        <p style={{ fontSize:11, color:C.textLight, textTransform:"uppercase", letterSpacing:1, marginBottom:5 }}>{t("form_nombre")}</p>
        <input style={inp} placeholder="" value={form.nombre} onChange={e=>setForm(f=>({...f,nombre:e.target.value}))}/>
      </div>

      <div style={{ display:"grid", gridTemplateColumns: form.tipo === "evento" ? "1fr 1fr" : "1fr 1fr 1fr", gap:10 }}>
        {form.tipo !== "evento" && (
          <div>
            <p style={{ fontSize:11, color:C.textLight, textTransform:"uppercase", letterSpacing:1, marginBottom:5 }}>{t("form_categoria")}</p>
            <select style={inp} value={form.categoria} onChange={e=>setForm(f=>({...f,categoria:e.target.value}))}>
              {Object.entries(CATS).filter(([k])=>k!=="evento").map(([k,v])=><option key={k} value={k}>{v.label}</option>)}
            </select>
          </div>
        )}
        <div>
          <p style={{ fontSize:11, color:C.textLight, textTransform:"uppercase", letterSpacing:1, marginBottom:5 }}>{t("form_segmento")}</p>
          <select style={inp} value={form.segmento} onChange={e=>setForm(f=>({...f,segmento:e.target.value}))}>
            {["deportivo","negocio","turistico","congreso","social","otros"].map(s=><option key={s} value={s}>{t("seg_"+s)}</option>)}
          </select>
        </div>
        <div>
          <p style={{ fontSize:11, color:C.textLight, textTransform:"uppercase", letterSpacing:1, marginBottom:5 }}>{t("form_estado")}</p>
          <CustomSelect
            value={form.estado}
            onChange={v => setForm(f=>({...f, estado:v}))}
            options={Object.entries(ESTADOS).filter(([k])=>k!=="tentativo").map(([k,v])=>({ value:k, label:v.label, color:v.color, bg:v.bg }))}
          />
        </div>
      </div>

      {form.tipo === "evento" ? (
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
          <div>
            <p style={{ fontSize:11, color:C.textLight, textTransform:"uppercase", letterSpacing:1, marginBottom:5 }}>Fecha del evento *</p>
            <input style={inp} type="date" value={form.fecha_inicio} onChange={e=>setForm(f=>({...f,fecha_inicio:e.target.value,fecha_fin:e.target.value}))}/>
          </div>
          <div>
            <p style={{ fontSize:11, color:C.textLight, textTransform:"uppercase", letterSpacing:1, marginBottom:5 }}>{t("form_fecha_confirmacion")}</p>
            <input style={inp} type="date" value={form.fecha_confirmacion} onChange={e=>setForm(f=>({...f,fecha_confirmacion:e.target.value}))}/>
          </div>
        </div>
      ) : (
        <>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
            <div>
              <p style={{ fontSize:11, color:C.textLight, textTransform:"uppercase", letterSpacing:1, marginBottom:5 }}>{t("form_fecha_entrada")}</p>
              <input style={inp} type="date" value={form.fecha_inicio} onChange={e=>setForm(f=>({...f,fecha_inicio:e.target.value}))}/>
            </div>
            <div>
              <p style={{ fontSize:11, color:C.textLight, textTransform:"uppercase", letterSpacing:1, marginBottom:5 }}>{t("form_fecha_salida")}</p>
              <input style={inp} type="date" value={form.fecha_fin} onChange={e=>setForm(f=>({...f,fecha_fin:e.target.value}))}/>
            </div>
          </div>
          <div>
            <p style={{ fontSize:11, color:C.textLight, textTransform:"uppercase", letterSpacing:1, marginBottom:5 }}>{t("form_fecha_confirmacion")}</p>
            <input style={inp} type="date" value={form.fecha_confirmacion} onChange={e=>setForm(f=>({...f,fecha_confirmacion:e.target.value}))}/>
          </div>
          {form.fecha_inicio && form.fecha_fin && (() => {
            const noches = Math.max(0, Math.round((new Date(form.fecha_fin) - new Date(form.fecha_inicio)) / 86400000));
            return noches > 0 ? (
              <div style={{ background:C.bg, border:`1px solid ${C.border}`, borderRadius:7, padding:"7px 12px", fontSize:12, color:C.textMid, display:"flex", alignItems:"center", gap:6 }}>
                <span style={{ fontWeight:700, color:C.text }}>{noches}</span> noche{noches !== 1 ? "s" : ""} de duración
              </div>
            ) : null;
          })()}
        </>
      )}

      {form.tipo === "evento" && (
        <>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
            <div>
              <p style={{ fontSize:11, color:C.textLight, textTransform:"uppercase", letterSpacing:1, marginBottom:5 }}>{t("form_hora_inicio")}</p>
              <input style={inp} type="time" value={form.hora_inicio} onChange={e=>setForm(f=>({...f,hora_inicio:e.target.value}))}/>
            </div>
            <div>
              <p style={{ fontSize:11, color:C.textLight, textTransform:"uppercase", letterSpacing:1, marginBottom:5 }}>{t("form_hora_fin")}</p>
              <input style={inp} type="time" value={form.hora_fin} onChange={e=>setForm(f=>({...f,hora_fin:e.target.value}))}/>
            </div>
          </div>
          <div>
            <p style={{ fontSize:11, color:C.textLight, textTransform:"uppercase", letterSpacing:1, marginBottom:5 }}>{t("form_sala_nombre")}</p>
            <select style={inp} value={form.sala_nombre} onChange={e=>setForm(f=>({...f,sala_nombre:e.target.value}))}>
              <option value="">— Seleccionar sala —</option>
              {SALAS_FIJAS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <label style={{ display:"flex", alignItems:"center", gap:8, cursor:"pointer" }}>
            <input type="checkbox" checked={form.servicio_incluido} onChange={e=>setForm(f=>({...f,servicio_incluido:e.target.checked}))} style={{ width:16, height:16 }}/>
            <span style={{ fontSize:13, color:C.text }}>{t("form_servicio_incluido")}</span>
          </label>
        </>
      )}

      {form.tipo === "grupo" ? (
        <>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
            <div>
              <p style={{ fontSize:11, color:C.textLight, textTransform:"uppercase", letterSpacing:1, marginBottom:5 }}>{t("form_habitaciones")}</p>
              <input style={inp} type="number" placeholder="" value={form.habitaciones} onChange={e=>setForm(f=>({...f,habitaciones:e.target.value}))}/>
            </div>
            <div>
              <p style={{ fontSize:11, color:C.textLight, textTransform:"uppercase", letterSpacing:1, marginBottom:5 }}>PAX</p>
              <input style={inp} type="number" placeholder="" value={form.pax} onChange={e=>setForm(f=>({...f,pax:e.target.value}))}/>
            </div>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
            <div>
              <p style={{ fontSize:11, color:C.textLight, textTransform:"uppercase", letterSpacing:1, marginBottom:5 }}>Ingresos habs €</p>
              <input style={inp} type="number" placeholder="" value={ingresosHabs} onChange={e=>setIngresosHabs(e.target.value)}/>
            </div>
            <div>
              <p style={{ fontSize:11, color:C.textLight, textTransform:"uppercase", letterSpacing:1, marginBottom:5 }}>{t("form_adr")}</p>
              {(() => {
                const habs = parseInt(form.habitaciones)||0;
                const noches = form.fecha_inicio && form.fecha_fin ? Math.max(1, Math.round((new Date(form.fecha_fin)-new Date(form.fecha_inicio))/86400000)) : 0;
                const ing = parseFloat(ingresosHabs)||0;
                const adrCalc = habs > 0 && noches > 0 && ing > 0 ? Math.round(ing/(habs*noches)*100)/100 : null;
                return <input style={{...inp, background:C.bg, color: adrCalc ? C.text : C.textLight }} type="number" readOnly value={adrCalc ?? ""} placeholder="Auto"/>;
              })()}
            </div>
          </div>
        </>
      ) : (
        <div>
          <p style={{ fontSize:11, color:C.textLight, textTransform:"uppercase", letterSpacing:1, marginBottom:5 }}>PAX</p>
          <input style={inp} type="number" placeholder="" value={form.pax} onChange={e=>setForm(f=>({...f,pax:e.target.value}))}/>
        </div>
      )}

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
        <div>
          <p style={{ fontSize:11, color:C.textLight, textTransform:"uppercase", letterSpacing:1, marginBottom:5 }}>{t("form_fnb")}</p>
          <input style={inp} type="number" placeholder="" value={form.revenue_fnb} onChange={e=>setForm(f=>({...f,revenue_fnb:e.target.value}))}/>
        </div>
        <div>
          <p style={{ fontSize:11, color:C.textLight, textTransform:"uppercase", letterSpacing:1, marginBottom:5 }}>{t("form_sala")}</p>
          <input style={inp} type="number" placeholder="" value={form.revenue_sala} onChange={e=>setForm(f=>({...f,revenue_sala:e.target.value}))}/>
        </div>
      </div>
      <p style={{ fontSize:10, color:"#004B87", lineHeight:1.5 }}>ⓘ Al guardar se deduce el IVA: ADR/F&B ÷1,10 · sala ÷1,21</p>

      {form.estado === "cancelado" && (
        <div>
          <p style={{ fontSize:11, color:C.textLight, textTransform:"uppercase", letterSpacing:1, marginBottom:5 }}>{t("form_motivo")}</p>
          <input style={inp} placeholder="Precio, competencia, fecha..." value={form.motivo_perdida} onChange={e=>setForm(f=>({...f,motivo_perdida:e.target.value}))}/>
        </div>
      )}

      <div>
        <p style={{ fontSize:11, color:C.textLight, textTransform:"uppercase", letterSpacing:1, marginBottom:5 }}>{t("form_notas")}</p>
        <textarea style={{...inp, resize:"vertical", minHeight:60}} placeholder="Contacto, condiciones especiales..." value={form.notas} onChange={e=>setForm(f=>({...f,notas:e.target.value}))}/>
      </div>

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
            <p style={{ fontSize:12, color:"#1A7A3C", fontWeight:600 }}>{t("rev_estimado")}</p>
            <p style={{ fontSize:18, fontWeight:800, color:"#1A7A3C" }}>€{Math.round(total).toLocaleString("es-ES")}</p>
          </div>
        ) : null;
      })()}


      <div style={{ display:"flex", justifyContent:"space-between", marginTop:4 }}>
        {isEditing
          ? <button onClick={eliminar} style={{ background:"none", border:`1px solid ${C.red}`, color:C.red, borderRadius:7, padding:"8px 16px", fontSize:12, cursor:"pointer" }}>{t("form_eliminar")}</button>
          : <div/>
        }
        <div style={{ display:"flex", gap:8 }}>
          <button onClick={onClose} style={{ background:"none", border:`1px solid ${C.border}`, color:C.textMid, borderRadius:7, padding:"8px 16px", fontSize:12, cursor:"pointer" }}>{t("form_cancelar")}</button>
          <button onClick={guardar} disabled={guardando||!form.nombre||!form.fecha_inicio||(form.tipo==="grupo"&&!form.fecha_fin)}
            style={{ background:C.text, color:"#fff", border:"none", borderRadius:7, padding:"8px 20px", fontSize:13, fontWeight:600, cursor:"pointer", opacity:guardando?0.6:1 }}>
            {guardando ? t("guardando_btn") : t("form_guardar")}
          </button>
        </div>
      </div>
    </div>
  );
}

function GruposView({ datos, onRecargar, onVolverHeatmap, subVistaExt, onCambiarSubVista }) {
  const t = useT();
  const grupos = datos.grupos || [];
  const session = datos.session;

  // ── Seed datos demo ──────────────────────────────────────────────────────
  const [seedando, setSeedando] = useState(false);
  const [borrandoDemo, setBorrandoDemo] = useState(false);

  const borrarTodosGrupos = async () => {
    if (!window.confirm("¿Borrar todos los grupos y eventos?")) return;
    setBorrandoDemo(true);
    await supabase.from("grupos_eventos").delete().eq("hotel_id", session.user.id);
    setBorrandoDemo(false);
    onRecargar();
  };

  const rnd = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
  const fmt  = (y, m, d)  => `${y}-${String(m).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
  const packEv = (hi, hf, sala, serv, notas="") =>
    `[ev:hi=${hi},hf=${hf},sala=${sala},serv=${serv?"sí":"no"}]${notas?"\n"+notas:""}`;

  const seedDemoData = async () => {
    if (!window.confirm("¿Insertar datos demo (2 grupos + 1 evento × 24 meses)?")) return;
    setSeedando(true);
    const hotel_id = session.user.id;
    const anioActual = new Date().getFullYear();
    const mesActual  = new Date().getMonth() + 1;
    const totalHab   = datos.hotel?.habitaciones || 30;
    const hoyStr     = new Date().toISOString().slice(0,10);

    // ── OTB por día a partir de pickupEntries (solo transient, confirmadas) ──
    const otbPorDia = {};
    (datos.pickupEntries || []).forEach(e => {
      if (e._grupo) return; // excluir sintéticos de grupos
      const c = (e.canal || "").toLowerCase();
      if (c.includes("grupo") || c.includes("evento")) return;
      if ((e.estado || "confirmada") === "cancelada") return;
      const fl = String(e.fecha_llegada || "").slice(0,10);
      if (fl.length < 10) return;
      otbPorDia[fl] = (otbPorDia[fl] || 0) + (e.num_reservas || 1);
    });

    // Devuelve las habitaciones disponibles (mín. a lo largo del rango fecha_inicio..fecha_fin-1)
    // Descuenta OTB transient + grupos ya en records (confirmados)
    const disponiblesEnRango = (fi, ff, recordsYa) => {
      const gruposYa = recordsYa.filter(r => r.estado === "confirmado" && r.habitaciones > 0);
      let min = totalHab;
      const ini = new Date(fi + "T00:00:00");
      const fin = new Date(ff + "T00:00:00");
      for (let d = new Date(ini); d < fin; d.setDate(d.getDate() + 1)) {
        const dia = d.toISOString().slice(0,10);
        const otb = otbPorDia[dia] || 0;
        const grp = gruposYa.reduce((a, r) => {
          if (r.fecha_inicio <= dia && r.fecha_fin > dia) return a + r.habitaciones;
          return a;
        }, 0);
        min = Math.min(min, totalHab - otb - grp);
      }
      return Math.max(0, min);
    };

    const NOMBRES_G = [
      ["Pharma Congress","Congreso Médico","Feria Tecnología","Cumbre Directivos","Convención RRHH"],
      ["Boda García-López","Boda Martínez","Boda Silva","Celebración Pérez","Enlace Fernández"],
      ["Torneo Golf","Copa Baloncesto","Maratón Ciudad","Liga Padel","Campeonato Natación"],
      ["Grupo TechCo","Grupo IBEX","Grupo Repsol","Grupo Inditex","Grupo Santander"],
      ["Congreso Arquitectura","Feria FITUR","Salón del Automóvil","Feria del Libro","Expo Gastro"],
    ];
    const NOMBRES_EV = [
      "Gala Benéfica","Cena de Empresa","Presentación Producto","Cóctel Inauguración",
      "Evento Networking","Aniversario Corporativo","Fiesta Fin de Año","Conferencia Interna",
      "Workshop Design","Cocktail Party","Noche de Gala","Summit Ejecutivo",
    ];
    const SALAS = SALAS_FIJAS;
    const CATS_LIST = ["corporativo","boda","feria","deportivo","otros"];
    const estadoPasado = () => ["confirmado","confirmado","confirmado","cancelado"][rnd(0,3)];
    const estadoFuturo = () => ["confirmado","confirmado","confirmado","cancelado"][rnd(0,3)];

    const records = [];
    for (const anio of [anioActual - 1, anioActual]) {
      for (let mes = 1; mes <= 12; mes++) {
        const esFuturo = anio > anioActual || (anio === anioActual && mes > mesActual);
        const esFutura = (fi) => fi > hoyStr;

        // ── Grupo 1 ──
        const cat1 = CATS_LIST[(mes) % CATS_LIST.length];
        const di1  = rnd(3, 8); const df1 = Math.min(di1 + rnd(2,5), 28);
        const fi1  = fmt(anio,mes,di1); const ff1 = fmt(anio,mes,df1);
        const est1 = esFuturo ? estadoFuturo() : estadoPasado();
        let hab1 = rnd(15,80);
        if (esFutura(fi1) && est1 === "confirmado") {
          const disp1 = disponiblesEnRango(fi1, ff1, records);
          if (disp1 <= 0) { /* sin hueco, saltar grupo */ }
          else {
            hab1 = Math.min(hab1, disp1);
            records.push({
              hotel_id, nombre: NOMBRES_G[mes % CATS_LIST.length][(mes*2) % 5],
              categoria: cat1, estado: est1,
              fecha_inicio: fi1, fecha_fin: ff1,
              fecha_confirmacion: fmt(anio, mes===1?12:mes-1, rnd(1,28)),
              habitaciones: hab1, adr_grupo: rnd(85,220),
              revenue_fnb: rnd(0,1)?rnd(2000,18000):0, revenue_sala: rnd(0,1)?rnd(500,4000):0,
              notas: null, motivo_perdida: null,
            });
          }
        } else {
          records.push({
            hotel_id, nombre: NOMBRES_G[mes % CATS_LIST.length][(mes*2) % 5],
            categoria: cat1, estado: est1,
            fecha_inicio: fi1, fecha_fin: ff1,
            fecha_confirmacion: est1==="confirmado" ? fmt(anio, mes===1?12:mes-1, rnd(1,28)) : null,
            habitaciones: hab1, adr_grupo: rnd(85,220),
            revenue_fnb: rnd(0,1)?rnd(2000,18000):0, revenue_sala: rnd(0,1)?rnd(500,4000):0,
            notas: null, motivo_perdida: est1==="cancelado"?["Precio","Competencia","Fechas","Presupuesto"][rnd(0,3)]:null,
          });
        }

        // ── Grupo 2 ──
        const cat2 = CATS_LIST[(mes+2) % CATS_LIST.length];
        const di2  = rnd(15, 20); const df2 = Math.min(di2 + rnd(2,5), 28);
        const fi2  = fmt(anio,mes,di2); const ff2 = fmt(anio,mes,df2);
        const est2 = esFuturo ? estadoFuturo() : estadoPasado();
        let hab2 = rnd(10,60);
        if (esFutura(fi2) && est2 === "confirmado") {
          const disp2 = disponiblesEnRango(fi2, ff2, records);
          if (disp2 <= 0) { /* sin hueco, saltar grupo */ }
          else {
            hab2 = Math.min(hab2, disp2);
            records.push({
              hotel_id, nombre: NOMBRES_G[(mes+2) % CATS_LIST.length][(mes*3) % 5],
              categoria: cat2, estado: est2,
              fecha_inicio: fi2, fecha_fin: ff2,
              fecha_confirmacion: fmt(anio, mes===1?12:mes-1, rnd(1,28)),
              habitaciones: hab2, adr_grupo: rnd(70,200),
              revenue_fnb: rnd(0,1)?rnd(1500,12000):0, revenue_sala: rnd(0,1)?rnd(400,3000):0,
              notas: null, motivo_perdida: null,
            });
          }
        } else {
          records.push({
            hotel_id, nombre: NOMBRES_G[(mes+2) % CATS_LIST.length][(mes*3) % 5],
            categoria: cat2, estado: est2,
            fecha_inicio: fi2, fecha_fin: ff2,
            fecha_confirmacion: est2==="confirmado" ? fmt(anio, mes===1?12:mes-1, rnd(1,28)) : null,
            habitaciones: hab2, adr_grupo: rnd(70,200),
            revenue_fnb: rnd(0,1)?rnd(1500,12000):0, revenue_sala: rnd(0,1)?rnd(400,3000):0,
            notas: null, motivo_perdida: est2==="cancelado"?["Precio","Otro proveedor","Presupuesto"][rnd(0,2)]:null,
          });
        }

        // ── Evento (no ocupa habitaciones, siempre se genera) ──
        const hiH = rnd(10,14); const hfH = Math.min(hiH+rnd(3,6),23);
        const estEv = esFuturo ? estadoFuturo() : estadoPasado();
        records.push({
          hotel_id, nombre: NOMBRES_EV[(mes + anio) % NOMBRES_EV.length],
          categoria: "evento", estado: estEv,
          fecha_inicio: fmt(anio,mes,rnd(22,27)), fecha_fin: fmt(anio,mes,rnd(22,27)),
          fecha_confirmacion: null,
          habitaciones: 0, adr_grupo: 0,
          revenue_fnb: rnd(3000,20000), revenue_sala: rnd(800,5000),
          notas: packEv(`${String(hiH).padStart(2,"0")}:00`,`${String(hfH).padStart(2,"0")}:00`,SALAS[mes%SALAS.length],rnd(0,1)===1),
          motivo_perdida: estEv==="cancelado"?["Presupuesto","Otro proveedor","Fecha cambiada"][rnd(0,2)]:null,
        });
      }
    }

    const { error } = await supabase.from("grupos_eventos").insert(records);
    setSeedando(false);
    if (error) { alert("Error: " + error.message); return; }
    onRecargar();
  };
  // ────────────────────────────────────────────────────────────────────────────

  const CATS = {
    corporativo: { label: t("cat_corporativo"), color: "#2B7EC1" },
    boda:        { label: t("cat_boda"),        color: "#D4547A" },
    feria:       { label: t("cat_feria"),       color: "#E85D04" },
    deportivo:   { label: t("cat_deportivo"),   color: "#059669" },
    otros:       { label: t("cat_otros"),       color: "#7C3AED" },
    evento:      { label: "Evento",             color: "#0A7C6A" },
  };

  const ESTADOS = {
    confirmado: { label: t("estado_confirmado"), color: "#1A7A3C", bg: "#E6F7EE", peso: 1.0 },
    cotizado:   { label: t("estado_cotizacion"), color: "#B8860B", bg: "#FFF8E7", peso: 0.5 },
    cancelado:  { label: t("estado_cancelado"),  color: "#999",    bg: "#F5F5F5", peso: 0   },
    tentativo:  { label: t("estado_cotizacion"), color: "#B8860B", bg: "#FFF8E7", peso: 0.5 },
  };
  const normEstado = (e) => (e === "tentativo" || e === "cotizacion") ? "cotizado" : (e || "confirmado");

  const MESES = t("meses_corto");
  const MESES_FULL = t("meses_full");

  const [anio, setAnioRaw] = useState(() => parseInt(localStorage.getItem("fr_grupos_anio")) || new Date().getFullYear());
  const setAnio = (v) => { const val = typeof v === "function" ? v(anio) : v; setAnioRaw(val); localStorage.setItem("fr_grupos_anio", val); };
  const [mes, setMesRaw] = useState(() => { const v = localStorage.getItem("fr_grupos_mes"); return v !== null ? parseInt(v) : new Date().getMonth(); });
  const setMes = (v) => { const val = typeof v === "function" ? v(mes) : v; setMesRaw(val); localStorage.setItem("fr_grupos_mes", val); };
  const [mesCal, setMesCalRaw] = useState(() => { const v = localStorage.getItem("fr_grupos_mes_cal"); return v !== null ? parseInt(v) : new Date().getMonth(); });
  const setMesCal = (v) => { const val = typeof v === "function" ? v(mesCal) : v; setMesCalRaw(val); localStorage.setItem("fr_grupos_mes_cal", val); };
  const [anioCal, setAnioCalRaw] = useState(() => parseInt(localStorage.getItem("fr_grupos_anio_cal")) || new Date().getFullYear());
  const setAnioCal = (v) => { const val = typeof v === "function" ? v(anioCal) : v; setAnioCalRaw(val); localStorage.setItem("fr_grupos_anio_cal", val); };
  const [modalGrupo, setModalGrupoRaw] = useState(null);
  const setModalGrupo = (g) => { setModalGrupoRaw(g); try { if (g?.id) localStorage.setItem("fr_grupos_modal_id", g.id); else localStorage.removeItem("fr_grupos_modal_id"); } catch {} };
  const [detalleGrupo, setDetalleGrupoRaw] = useState(null);
  const setDetalleGrupo = (g) => { setDetalleGrupoRaw(g); try { if (g?.id) localStorage.setItem("fr_grupos_detalle_id", g.id); else localStorage.removeItem("fr_grupos_detalle_id"); } catch {} };
  const [_subVistaInt, _setSubVistaInt] = useState(() => localStorage.getItem("fr_grupos_subvista") || "grupos");
  const subVista = subVistaExt ?? _subVistaInt;
  const cambiarSubVista = onCambiarSubVista ?? ((v) => { _setSubVistaInt(v); localStorage.setItem("fr_grupos_subvista", v); });
  const [salaDetalle, setSalaDetalle] = useState(() => localStorage.getItem("fr_sala_detalle") || null);
  const cambiarSalaDetalle = (v) => { setSalaDetalle(v); if (v) localStorage.setItem("fr_sala_detalle", v); else localStorage.removeItem("fr_sala_detalle"); };
  useEffect(() => {
    const handler = (e) => {
      if (e.key !== "Escape") return;
      if (modalGrupo)    { setModalGrupo(null); return; }
      if (detalleGrupo)  { setDetalleGrupo(null); return; }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [modalGrupo, detalleGrupo]);

  const prevMes = () => { if (mes === 0) { setMes(11); setAnio(a => a - 1); } else setMes(m => m - 1); };
  const nextMes = () => { if (mes === 11) { setMes(0); setAnio(a => a + 1); } else setMes(m => m + 1); };

  const abrirNuevo = (fecha = "", tipo = "grupo", fechaFin = "") => {
    setModalGrupo({ tipo, fecha_inicio: fecha, fecha_fin: fechaFin || fecha });
  };

  const [highlightId, setHighlightId] = useState(null);
  const [fromHeatmap, setFromHeatmap] = useState(false);
  useEffect(() => {
    if (highlightId) {
      const t = setTimeout(()=>setHighlightId(null), 3000);
      // scroll to highlighted row
      const el = document.getElementById(`grupo-row-${highlightId}`);
      if (el) el.scrollIntoView({ behavior:"smooth", block:"center" });
      return ()=>clearTimeout(t);
    }
  }, [highlightId]);

  // Restaurar detalle y modal con datos frescos al montar
  useEffect(() => {
    if (!datos?.grupos?.length) return;
    const detalleId = localStorage.getItem("fr_grupos_detalle_id");
    if (detalleId) {
      const g = datos.grupos.find(x => String(x.id) === String(detalleId));
      if (g) setDetalleGrupoRaw(g); else localStorage.removeItem("fr_grupos_detalle_id");
    }
    const modalId = localStorage.getItem("fr_grupos_modal_id");
    if (modalId) {
      const g = datos.grupos.find(x => String(x.id) === String(modalId));
      if (g) abrirEditar(g); else localStorage.removeItem("fr_grupos_modal_id");
    }
  }, [datos?.grupos]);

  useEffect(() => {
    if (sessionStorage.getItem("fr_from_heatmap")) {
      setFromHeatmap(true);
      sessionStorage.removeItem("fr_from_heatmap");
    }
    const raw = sessionStorage.getItem("fr_pending_nuevo");
    if (!raw) return;
    sessionStorage.removeItem("fr_pending_nuevo");
    try {
      const { tipo, fecha_inicio, fecha_fin, highlightId: hid } = JSON.parse(raw);
      const subvista = tipo === "evento" ? "eventos" : "grupos";
      cambiarSubVista(subvista);
      if (hid) { setHighlightId(hid); }
      else { abrirNuevo(fecha_inicio, tipo, fecha_fin); }
    } catch {}
  }, []);

  const abrirEditar = (g) => { setModalGrupo(g); };

  const calcRevTotal = (g) => {
    const noches = g.fecha_inicio && g.fecha_fin
      ? Math.max(1, Math.round((new Date(g.fecha_fin) - new Date(g.fecha_inicio)) / 86400000))
      : 1;
    return (g.habitaciones||0) * (g.adr_grupo||0) * noches + (g.revenue_fnb||0) + (g.revenue_sala||0);
  };

  // ── Cálculos KPIs del mes activo ──
  const gruposAnio = grupos.filter(g => g.fecha_inicio?.slice(0,4) === String(anio) || g.fecha_fin?.slice(0,4) === String(anio));
  const mesStr = String(anio) + "-" + String(mes + 1).padStart(2, "0");
  const gruposMes = grupos.filter(g => g.fecha_inicio?.slice(0,7) === mesStr);
  const confirmados = gruposMes.filter(g => g.estado === "confirmado");
  const cancelados  = gruposMes.filter(g => g.estado === "cancelado");

  const revConfirmado = confirmados.reduce((a,g) => a + calcRevTotal(g), 0);

  // ── Datos para gráfico mensual desglosado por día ──
  const produccion = datos.produccion || [];
  const pad2 = n => String(n).padStart(2,"0");
  const diasEnMes = new Date(anio, mes + 1, 0).getDate();
  const chartRevMensual = Array.from({ length: diasEnMes }, (_, di) => {
    const dayStr = `${anio}-${pad2(mes+1)}-${pad2(di+1)}`;
    const prod = produccion.find(d => d.fecha === dayStr);
    const revSalas = prod?.revenue_salas || 0;
    const gruposActivos = grupos.filter(g =>
      g.estado === "confirmado" && g.fecha_inicio && g.fecha_fin &&
      g.fecha_inicio <= dayStr && g.fecha_fin >= dayStr
    );
    const calcRevDia = g => {
      const noches = Math.max(1, Math.round((new Date(g.fecha_fin) - new Date(g.fecha_inicio)) / 86400000));
      return calcRevTotal(g) / noches;
    };
    const revGrupos = gruposActivos.filter(g => g.categoria !== "evento").reduce((a,g) => a + calcRevDia(g), 0);
    const revEventos = gruposActivos.filter(g => g.categoria === "evento").reduce((a,g) => a + calcRevDia(g), 0);
    const tieneDatos = prod || revGrupos > 0 || revEventos > 0 || revSalas > 0;
    return {
      dia: di + 1,
      mesNombre: `${di+1} ${t("meses_full")[mes]}`,
      Grupos:   revGrupos  > 0 ? Math.round(revGrupos)  : null,
      Eventos:  revEventos > 0 ? Math.round(revEventos) : null,
      Salas:    revSalas   > 0 ? Math.round(revSalas)   : null,
    };
  }).filter(d => d.Grupos || d.Eventos || d.Salas);

  const inp = { width:"100%", padding:"9px 12px", borderRadius:7, border:`1.5px solid ${C.border}`, fontSize:13, fontFamily:"'Plus Jakarta Sans',sans-serif", color:C.text, background:C.bg, outline:"none", boxSizing:"border-box" };

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:20 }}>

      {/* ── Acciones superiores ── */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"flex-end", gap:8 }}>
        {fromHeatmap && (
          <button onClick={()=>{ setFromHeatmap(false); onVolverHeatmap&&onVolverHeatmap(); }}
            style={{ padding:"7px 14px", fontSize:12, fontWeight:600, cursor:"pointer", border:`1.5px solid ${C.border}`, borderRadius:8, background:C.bg, color:C.textMid, fontFamily:"'Plus Jakarta Sans',sans-serif", display:"flex", alignItems:"center", gap:5, marginRight:"auto" }}>
            ← Heatmap
          </button>
        )}
      </div>

      {/* ── Vista mensual (Calendario) ── */}
      {subVista === "semana" && (() => {
        const DIAS_ES = ["Lunes","Martes","Miércoles","Jueves","Viernes","Sábado","Domingo"];
        const MESES_ES = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
        const hoyStr = new Date().toISOString().slice(0,10);
        const pad = n => String(n).padStart(2,"0");
        const toISO = d => `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;

        const prevMes = () => setMesCal(m => { if(m===0){setAnioCal(a=>a-1);return 11;} return m-1; });
        const nextMes = () => setMesCal(m => { if(m===11){setAnioCal(a=>a+1);return 0;} return m+1; });
        const irHoy = () => { const h=new Date(); setMesCal(h.getMonth()); setAnioCal(h.getFullYear()); };

        // Build calendar grid: find first Monday on or before day 1
        const primerDia = new Date(anioCal, mesCal, 1);
        const dow0 = (primerDia.getDay()+6)%7; // 0=Mon
        const gridStart = new Date(primerDia); gridStart.setDate(1-dow0);
        const ultimoDia = new Date(anioCal, mesCal+1, 0);
        const dow1 = (ultimoDia.getDay()+6)%7;
        const gridEnd = new Date(ultimoDia); gridEnd.setDate(ultimoDia.getDate()+(6-dow1));
        const totalDias = Math.round((gridEnd-gridStart)/86400000)+1;
        const diasGrid = Array.from({length:totalDias},(_,i)=>{ const d=new Date(gridStart); d.setDate(gridStart.getDate()+i); return toISO(d); });
        const semanas = [];
        for(let i=0;i<diasGrid.length;i+=7) semanas.push(diasGrid.slice(i,i+7));

        const mesStr = `${anioCal}-${pad(mesCal+1)}`;
        const gruposMes = grupos.filter(g =>
          g.fecha_inicio && g.fecha_fin &&
          g.fecha_inicio <= `${mesStr}-31` && g.fecha_fin >= `${mesStr}-01`
        ).sort((a,b)=>a.fecha_inicio.localeCompare(b.fecha_inicio));

        // Lane assignment per week
        const getLanesForWeek = (weekDays) => {
          const gs = gruposMes.filter(g => g.fecha_inicio <= weekDays[6] && g.fecha_fin >= weekDays[0]);
          const carriles = []; const filaDeGrupo = {};
          gs.forEach(g => {
            let fila = carriles.findIndex(fin => fin < g.fecha_inicio);
            if(fila===-1){fila=carriles.length; carriles.push(g.fecha_fin);}
            else carriles[fila]=g.fecha_fin;
            filaDeGrupo[g.id]=fila;
          });
          return { gs, filaDeGrupo, numFilas:Math.max(carriles.length,1) };
        };

        const colEstado = { confirmado:"#1A7A3C", cotizado:"#B8860B", cancelado:"#999" };
        const bgEstado  = { confirmado:"#E6F7EE", cotizado:"#FFF8E7", cancelado:"#F5F5F5" };

        return (
          <Card style={{ overflow:"hidden" }}>
            {/* Header */}
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:16 }}>
              <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                <button onClick={prevMes} style={{ background:"none", border:`1px solid ${C.border}`, borderRadius:6, width:28, height:28, cursor:"pointer", fontSize:15, color:C.textMid, display:"flex", alignItems:"center", justifyContent:"center" }}>‹</button>
                <span style={{ fontFamily:"'Plus Jakarta Sans',sans-serif", fontWeight:700, fontSize:15, color:C.text, minWidth:120, textAlign:"center" }}>
                  {MESES_ES[mesCal]} {anioCal}
                </span>
                <button onClick={nextMes} style={{ background:"none", border:`1px solid ${C.border}`, borderRadius:6, width:28, height:28, cursor:"pointer", fontSize:15, color:C.textMid, display:"flex", alignItems:"center", justifyContent:"center" }}>›</button>
              </div>
              <div style={{ display:"flex", gap:16 }}>
                {Object.entries(colEstado).map(([k,col]) => (
                  <div key={k} style={{ display:"flex", alignItems:"center", gap:6 }}>
                    <div style={{ width:12, height:12, borderRadius:3, background:col }}/>
                    <span style={{ fontSize:13, fontWeight:600, color:C.text, textTransform:"capitalize" }}>{ESTADOS[k]?.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Cabecera días */}
            <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", borderTop:`1px solid ${C.border}`, borderLeft:`1px solid ${C.border}` }}>
              {DIAS_ES.map(d => (
                <div key={d} style={{ borderRight:`1px solid ${C.border}`, borderBottom:`1px solid ${C.border}`, padding:"7px 4px", textAlign:"center", background:"#fff" }}>
                  <span style={{ fontSize:11, color:"#111", fontWeight:600, textTransform:"uppercase", letterSpacing:"0.5px" }}>{d}</span>
                </div>
              ))}
            </div>

            {/* Semanas */}
            {semanas.map((semDias, si) => {
              const { gs, filaDeGrupo, numFilas } = getLanesForWeek(semDias);
              return (
                <div key={si} style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gridTemplateRows:`28px repeat(${numFilas},26px)`, borderLeft:`1px solid ${C.border}` }}>
                  {/* Números de día */}
                  {semDias.map(d => {
                    const esMes = d.slice(0,7)===mesStr;
                    const esHoy = d===hoyStr;
                    return (
                      <div key={d} style={{ borderRight:`1px solid ${C.border}`, borderBottom:`1px solid ${C.border}`, padding:"4px 6px", background: esHoy?`${C.accent}18`: esMes?"#F0F0F0":"#E4E4E4", gridRow:1, display:"flex", alignItems:"center", justifyContent:"center" }}>
                        <span style={{ fontSize:12, fontWeight:esHoy?800:600, color:esHoy?C.accent:esMes?"#1A1A1A":"#888", fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
                          {parseInt(d.slice(8))}
                        </span>
                      </div>
                    );
                  })}
                  {/* Carriles de grupos — bloque único por evento abarcando todas sus columnas */}
                  {Array.from({length:numFilas},(_,fi) => {
                    const gsEnFila = gs.filter(g=>filaDeGrupo[g.id]===fi);
                    return (
                      <React.Fragment key={fi}>
                        {/* Celdas de fondo para bordes */}
                        {semDias.map((d,ci) => (
                          <div key={d} style={{ gridRow:fi+2, gridColumn:ci+1, borderRight:`1px solid ${C.border}`, borderBottom:`1px solid ${C.border}` }} />
                        ))}
                        {/* Bloque del evento que abarca su duración completa en la semana */}
                        {gsEnFila.map(g => {
                          const ini = g.fecha_inicio.slice(0,10);
                          const fin = g.fecha_fin.slice(0,10);
                          const sCI = ini >= semDias[0] ? Math.max(0, semDias.findIndex(d=>d===ini)) : 0;
                          const eCIraw = semDias.findIndex(d=>d===fin);
                          const eCI = fin <= semDias[6] ? (eCIraw>=0 ? eCIraw : 6) : 6;
                          const esInicio = ini >= semDias[0];
                          const esFin    = fin <= semDias[6];
                          const col = colEstado[normEstado(g.estado)]||"#888";
                          const bg  = bgEstado[normEstado(g.estado)] ||"#eee";
                          return (
                            <div key={g.id} onClick={e=>{e.stopPropagation();setDetalleGrupo(g);}}
                              style={{
                                gridRow: fi+2, gridColumn:`${sCI+1} / ${eCI+2}`, zIndex:1,
                                margin:"3px 1px",
                                borderRadius: esInicio&&esFin?"4px": esInicio?"4px 0 0 4px": esFin?"0 4px 4px 0":"0",
                                background:bg,
                                borderLeft: esInicio?`3px solid ${col}`:"none",
                                borderTop:`1px solid ${col}40`, borderBottom:`1px solid ${col}40`,
                                borderRight: esFin?`1px solid ${col}40`:"none",
                                cursor:"pointer", overflow:"hidden",
                                display:"flex", alignItems:"center", justifyContent:"center", padding:"0 6px",
                              }}>
                              <span style={{ fontSize:12, fontWeight:700, color:col, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>
                                {g.nombre}
                              </span>
                            </div>
                          );
                        })}
                      </React.Fragment>
                    );
                  })}
                </div>
              );
            })}

            {gruposMes.length === 0 && (
              <p style={{ textAlign:"center", color:C.textLight, fontSize:13, padding:"16px 0 8px" }}>Sin grupos ni eventos este mes</p>
            )}
          </Card>
        );
      })()}

      {/* ── Pipeline de conversión ── */}
      {(subVista === "pipeline" || subVista === "revenue") && (() => {
        const hoy = new Date().toISOString().slice(0,10);
        const anioStr = String(anio);

        const enAnio = grupos.filter(g =>
          (g.fecha_inicio?.slice(0,4) === anioStr || g.fecha_fin?.slice(0,4) === anioStr)
          && g.categoria !== "evento"
        );

        const cotizados   = enAnio.filter(g => normEstado(g.estado) === "cotizado");
        const confirmados = enAnio.filter(g => normEstado(g.estado) === "confirmado");
        const cancelados  = enAnio.filter(g => normEstado(g.estado) === "cancelado");
        const total = cotizados.length + confirmados.length + cancelados.length;
        const cerrados = confirmados.length + cancelados.length;
        const tasaConv = cerrados > 0 ? Math.round(confirmados.length / cerrados * 100) : null;

        const revCotizado   = cotizados.reduce((a,g)=>a+calcRevTotal(g),0);
        const revConfirmado = confirmados.reduce((a,g)=>a+calcRevTotal(g),0);

        // Tiempo medio de cierre (fecha_confirmacion - fecha_inicio como proxy)
        const tiemposCierre = confirmados
          .filter(g => g.fecha_confirmacion && g.fecha_inicio)
          .map(g => Math.round((new Date(g.fecha_inicio)-new Date(g.fecha_confirmacion))/86400000))
          .filter(d => d > 0);
        const tiempoMedio = tiemposCierre.length > 0 ? Math.round(tiemposCierre.reduce((a,b)=>a+b,0)/tiemposCierre.length) : null;

        // Motivos de cancelación
        const motivoCount = {};
        cancelados.forEach(g => {
          const m = g.motivo_perdida || "Sin especificar";
          motivoCount[m] = (motivoCount[m]||0)+1;
        });
        const motivos = Object.entries(motivoCount).sort((a,b)=>b[1]-a[1]);

        // Cotizaciones pendientes (cotizado + fecha_inicio >= hoy)
        const pendientes = cotizados
          .filter(g => g.fecha_inicio >= hoy)
          .sort((a,b)=>a.fecha_inicio.localeCompare(b.fecha_inicio));

        const fmtFecha = dmy;
        const fmtEur = n => `€${Math.round(n).toLocaleString("es-ES")}`;

        const FUNNEL = [
          { label:"Total recibidos", n:total,              color:"#004B87", bg:"#E8F0FB" },
          { label:"Confirmados",     n:confirmados.length, color:"#1A7A3C", bg:"#E6F7EE" },
          { label:"En cotización",   n:cotizados.length,   color:"#B8860B", bg:"#FFF8E7" },
          { label:"Cancelados",      n:cancelados.length,  color:"#999",    bg:"#F5F5F5" },
        ];
        const maxN = Math.max(...FUNNEL.map(f=>f.n), 1);

        return (
          <div style={{ display:"flex", flexDirection:"column", gap:16 }}>

            {/* Selector año */}
            <div style={{ display:"flex", justifyContent:"flex-end" }}>
              <select value={anio} onChange={e=>setAnio(Number(e.target.value))}
                style={{ padding:"5px 10px", borderRadius:7, border:`1.5px solid ${C.border}`, fontSize:13, fontWeight:600, color:C.text, background:C.bg, cursor:"pointer", fontFamily:"'Plus Jakarta Sans',sans-serif", outline:"none" }}>
                {[...new Set([anio-1, anio, anio+1, ...grupos.map(g=>parseInt(g.fecha_inicio?.slice(0,4))).filter(Boolean)])].sort().map(a=><option key={a} value={a}>{a}</option>)}
              </select>
            </div>

            {/* KPIs resumen */}
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))", gap:12 }}>
              {[
                { label:"Tasa de conversión", value: tasaConv!=null?`${tasaConv}%`:"—", color:"#1A7A3C", sub:"confirmados / cerrados" },
                { label:"Revenue confirmado",  value: fmtEur(revConfirmado), color:"#1A7A3C", sub:`${confirmados.length} grupos` },
                { label:"Revenue cotizado",    value: fmtEur(revCotizado),   color:"#B8860B", sub:`${cotizados.length} cotizaciones` },
                { label:"Tiempo medio cierre", value: tiempoMedio!=null?`${tiempoMedio}d`:"—", color:C.accent, sub:"días hasta confirmar" },
              ].map((k,i)=>(
                <div key={i} style={{ background:"#f5f5f5", border:"1.5px solid #111111", borderRadius:8, padding:"14px 18px", boxShadow:"0 1px 4px rgba(0,0,0,0.06)" }}>
                  <p style={{ fontSize:10, color:C.text, textTransform:"uppercase", letterSpacing:1.5, marginBottom:6, fontWeight:700 }}>{k.label}</p>
                  <p style={{ fontSize:22, fontWeight:700, color:k.color, fontFamily:"'Plus Jakarta Sans',sans-serif", margin:0 }}>{k.value}</p>
                  <p style={{ fontSize:10, color:C.textLight, marginTop:3 }}>{k.sub}</p>
                </div>
              ))}
            </div>

            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>

              {/* Funnel visual */}
              <Card>
                <p style={{ fontFamily:"'Plus Jakarta Sans',sans-serif", fontWeight:700, fontSize:16, color:C.text, marginBottom:16 }}>Datos {anio}</p>
                <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                  {FUNNEL.map((f,i)=>(
                    <div key={i}>
                      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
                        <span style={{ fontSize:12, color:C.textMid, fontWeight:500 }}>{f.label}</span>
                        <span style={{ fontSize:13, fontWeight:700, color:f.color }}>{f.n}</span>
                      </div>
                      <div style={{ height:10, borderRadius:6, background:C.border, overflow:"hidden" }}>
                        <div style={{ height:"100%", width:`${(f.n/maxN)*100}%`, background:f.color, borderRadius:6, transition:"width 0.4s" }}/>
                      </div>
                    </div>
                  ))}
                  {tasaConv!=null && (
                    <div style={{ marginTop:8, padding:"8px 12px", borderRadius:8, background:"#E6F7EE", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                      <span style={{ fontSize:12, color:"#1A7A3C", fontWeight:600 }}>Tasa de conversión</span>
                      <span style={{ fontSize:18, fontWeight:800, color:"#1A7A3C", fontFamily:"'Plus Jakarta Sans',sans-serif" }}>{tasaConv}%</span>
                    </div>
                  )}
                </div>

                {/* Motivos cancelación */}
                {motivos.length > 0 && (
                  <div style={{ marginTop:20 }}>
                    <p style={{ fontSize:10, color:C.textLight, textTransform:"uppercase", letterSpacing:1, fontWeight:600, marginBottom:10 }}>Motivos cancelación</p>
                    <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                      {motivos.map(([m,n],i)=>(
                        <div key={i} style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                          <span style={{ fontSize:12, color:C.textMid }}>{m}</span>
                          <span style={{ fontSize:12, fontWeight:700, padding:"2px 8px", borderRadius:10, background:"#F5F5F5", color:"#999" }}>{n}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </Card>

              {/* Cotizaciones pendientes */}
              <Card>
                <p style={{ fontFamily:"'Plus Jakarta Sans',sans-serif", fontWeight:700, fontSize:16, color:C.text, marginBottom:16 }}>Cotizaciones pendientes</p>
                {pendientes.length === 0 ? (
                  <p style={{ color:C.textLight, fontSize:13, textAlign:"center", padding:"24px 0" }}>Sin cotizaciones abiertas</p>
                ) : (
                  <div style={{ display:"flex", flexDirection:"column", gap:1 }}>
                    {pendientes.map((g,i)=>{
                      const noches = g.fecha_inicio&&g.fecha_fin ? Math.max(1,Math.round((new Date(g.fecha_fin)-new Date(g.fecha_inicio))/86400000)) : 1;
                      const rev = calcRevTotal(g);
                      const diasRestantes = Math.round((new Date(g.fecha_inicio)-new Date())/86400000);
                      return (
                        <div key={g.id} onClick={()=>setDetalleGrupo(g)}
                          style={{ display:"grid", gridTemplateColumns:"1fr auto", alignItems:"center", gap:8, padding:"10px 12px", borderRadius:8, cursor:"pointer", background: i%2===0?C.bg:C.bgCard }}
                          onMouseEnter={e=>e.currentTarget.style.background=C.accentLight}
                          onMouseLeave={e=>e.currentTarget.style.background=i%2===0?C.bg:C.bgCard}>
                          <div>
                            <p style={{ fontSize:13, fontWeight:600, color:C.text, marginBottom:2 }}>{g.nombre}</p>
                            <p style={{ fontSize:10, color:C.textLight }}>
                              {fmtFecha(g.fecha_inicio)}{g.fecha_fin&&g.fecha_fin!==g.fecha_inicio?` → ${fmtFecha(g.fecha_fin)}`:""} · {noches} noche{noches!==1?"s":""}
                              {g.habitaciones ? ` · ${g.habitaciones} hab.` : ""}
                              <span style={{ marginLeft:6, padding:"1px 6px", borderRadius:8, background:"#FFF8E7", color:"#B8860B", fontWeight:700 }}>{diasRestantes}d</span>
                            </p>
                          </div>
                          <p style={{ fontSize:13, fontWeight:700, color:"#B8860B", textAlign:"right", whiteSpace:"nowrap" }}>{fmtEur(rev)}</p>
                        </div>
                      );
                    })}
                    <div style={{ borderTop:`1px solid ${C.border}`, marginTop:8, paddingTop:10, display:"flex", justifyContent:"space-between", padding:"10px 12px 0" }}>
                      <span style={{ fontSize:11, color:C.textLight }}>Revenue total en pipeline</span>
                      <span style={{ fontSize:13, fontWeight:700, color:"#B8860B" }}>{fmtEur(revCotizado)}</span>
                    </div>
                  </div>
                )}
              </Card>

            </div>

            {/* ── Revenue por categoría (mensual) ── */}
            {(() => {
              const datosMesRev = produccion.filter(d => d.fecha.startsWith(mesStr));
              const totalRevProd = datosMesRev.reduce((a,d) => a+(d.revenue_total||0), 0);
              const confMes     = confirmados.filter(g => g.fecha_inicio?.slice(0,7) === mesStr);
              const confGrupos  = confMes.filter(g => g.categoria !== "evento");
              const confEventos = confMes.filter(g => g.categoria === "evento");
              const revGrupos   = confGrupos.reduce((a,g)  => a+calcRevTotal(g), 0);
              const revEventos  = confEventos.reduce((a,g) => a+calcRevTotal(g), 0);
              const revSalas    = confGrupos.reduce((a,g)  => a+(g.revenue_sala||0), 0)
                                + confEventos.reduce((a,g) => a+(g.revenue_sala||0), 0);
              const revSeccion  = revGrupos + revEventos + revSalas;
              const pct = totalRevProd > 0 ? (revSeccion / totalRevProd * 100) : null;
              const filas = [
                { label:"Grupos",  rev:revGrupos,  count:confGrupos.length  },
                { label:"Eventos", rev:revEventos, count:confEventos.length },
                { label:"Salas",   rev:revSalas,   count:null               },
              ];
              return (
                <Card>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
                    <p style={{ fontFamily:"'Plus Jakarta Sans',sans-serif", fontWeight:700, fontSize:16, color:C.text }}>
                      Revenue confirmado — {MESES_FULL[mes]} {anio}
                    </p>
                    <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                      {(() => {
                        const prev = () => { if(mes===0){setMes(11);setAnio(a=>a-1);}else{setMes(m=>m-1);} };
                        const next = () => { if(mes===11){setMes(0);setAnio(a=>a+1);}else{setMes(m=>m+1);} };
                        const btn = { background:"none", border:`1.5px solid ${C.border}`, borderRadius:7, width:30, height:30, display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", fontSize:15, color:C.text, fontWeight:700 };
                        return (<><button onClick={prev} style={btn}>‹</button><button onClick={next} style={btn}>›</button></>);
                      })()}
                    </div>
                  </div>
                  <table style={{ width:"100%", borderCollapse:"collapse", fontSize:14 }}>
                    <thead>
                      <tr>
                        {["Categoría","Confirmados","Revenue confirmado","% del total mes"].map(h => (
                          <th key={h} style={{ padding:"7px 14px", textAlign:h==="Revenue confirmado"||h==="% del total mes"?"right":"left", fontSize:10, fontWeight:600, color:C.textLight, textTransform:"uppercase", letterSpacing:"1px", borderBottom:`2px solid ${C.border}`, whiteSpace:"nowrap" }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filas.map(f => {
                        const pctFila = totalRevProd > 0 ? f.rev / totalRevProd * 100 : 0;
                        return (
                          <tr key={f.label} style={{ borderBottom:`1px solid ${C.border}` }}>
                            <td style={{ padding:"12px 14px", fontWeight:600, color:C.text }}>{f.label}</td>
                            <td style={{ padding:"12px 14px", color:C.textMid }}>{f.count != null ? f.count : "—"}</td>
                            <td style={{ padding:"12px 14px", fontWeight:700, color:C.text, textAlign:"right" }}>€{Math.round(f.rev).toLocaleString("es-ES")}</td>
                            <td style={{ padding:"12px 14px", textAlign:"right", fontWeight:700, color:C.textMid }}>{totalRevProd > 0 ? `${pctFila.toFixed(1)}%` : "—"}</td>
                          </tr>
                        );
                      })}
                      <tr style={{ background:C.bg }}>
                        <td style={{ padding:"12px 14px", fontWeight:700, color:C.text }} colSpan={2}>Total</td>
                        <td style={{ padding:"12px 14px", fontWeight:800, color:"#1A7A3C", textAlign:"right", fontSize:15 }}>€{Math.round(revSeccion).toLocaleString("es-ES")}</td>
                        <td style={{ padding:"12px 14px", fontWeight:800, color:"#1A7A3C", textAlign:"right" }}>{pct!=null?`${pct.toFixed(1)}%`:"—"}</td>
                      </tr>
                    </tbody>
                  </table>
                </Card>
              );
            })()}

          </div>
        );
      })()}

      {/* ── Salas ── */}
      {subVista === "salas" && <SalasView datos={datos} onRecargar={onRecargar} onVolver={()=>cambiarSubVista("grupos")}
        salaDetalle={salaDetalle} setSalaDetalle={cambiarSalaDetalle}
        onVerEventos={(m, a) => { setMes(m); setAnio(a); cambiarSubVista("eventos"); }} />}

      {/* ── Grupos del mes ── */}
      {subVista === "grupos" && (() => {
        const pad2 = n => String(n).padStart(2,"0");
        const anioStr = String(anio);
        const listaAnio = grupos
          .filter(g => g.categoria !== "evento" && g.fecha_inicio?.slice(0,4) === anioStr)
          .sort((a,b)=>a.fecha_inicio?.localeCompare(b.fecha_inicio));
        const porMes = Array.from({length:12},(_,mi) => {
          const mStr = `${anioStr}-${pad2(mi+1)}`;
          return listaAnio.filter(g => g.fecha_inicio?.slice(0,7) === mStr);
        });
        return (
          <div style={{ display:"flex", flexDirection:"column", gap:0 }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
              <p style={{ fontSize:11, fontWeight:700, color:"#2B7EC1", textTransform:"uppercase", letterSpacing:1.5, margin:0 }}>Grupos {anio}</p>
              <select value={anio} onChange={e=>setAnio(Number(e.target.value))}
                style={{ padding:"5px 10px", borderRadius:7, border:`1.5px solid ${C.border}`, fontSize:13, fontWeight:600, color:C.text, background:C.bg, cursor:"pointer", fontFamily:"'Plus Jakarta Sans',sans-serif", outline:"none" }}>
                {[...new Set([anio-1,anio,anio+1,...grupos.map(g=>parseInt(g.fecha_inicio?.slice(0,4))).filter(Boolean)])].sort().map(a=><option key={a} value={a}>{a}</option>)}
              </select>
            </div>
            {MESES_FULL.map((nombreMes, mi) => {
              const lista = porMes[mi];
              const revTotal = lista.reduce((a,g)=>a+calcRevTotal(g),0);
              const confirmados = lista.filter(g=>g.estado==="confirmado").length;
              if(lista.length===0) return null;
              return (
                <Card key={mi} style={{ marginBottom:10, padding:0, overflow:"hidden" }}>
                  <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"10px 16px", background:C.bg, borderBottom:`1px solid ${C.border}` }}>
                    <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                      <span style={{ fontFamily:"'Plus Jakarta Sans',sans-serif", fontWeight:700, fontSize:14, color:C.text }}>{nombreMes}</span>
                      <span style={{ fontSize:11, color:C.textMid }}>{lista.length} grupo{lista.length!==1?"s":""}</span>
                      {confirmados > 0 && <span style={{ fontSize:10, fontWeight:700, padding:"2px 7px", borderRadius:8, background:"#E6F7EE", color:"#1A7A3C" }}>{confirmados} confirmado{confirmados!==1?"s":""}</span>}
                    </div>
                    <span style={{ fontWeight:700, color:"#1A7A3C", fontSize:13 }}>€{Math.round(revTotal).toLocaleString("es-ES")}</span>
                  </div>
                  <div style={{ overflowX:"auto" }}>
                    <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
                      <thead>
                        <tr>
                          {["Nombre","Segmento","Estado","F. Confirm.","Entrada","Salida","Noches","Habs","ADR","F&B","Sala","Revenue total","Notas"].map(h=>(
                            <th key={h} style={{ padding:"6px 12px", textAlign:"left", fontSize:10, fontWeight:600, color:C.textLight, textTransform:"uppercase", letterSpacing:"1px", borderBottom:`1px solid ${C.border}`, whiteSpace:"nowrap" }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {lista.map((g,i)=>{
                          const noches = g.fecha_inicio && g.fecha_fin ? Math.max(1,Math.round((new Date(g.fecha_fin)-new Date(g.fecha_inicio))/86400000)) : 1;
                          const isHL = highlightId === g.id;
                          return (
                            <tr key={g.id} id={`grupo-row-${g.id}`} onClick={()=>setDetalleGrupo(g)} style={{ borderBottom:`1px solid ${C.border}`, background: isHL ? "#EBF5FF" : i%2===0?C.bg:C.bgCard, cursor:"pointer", outline: isHL ? "2px solid #3B82F6" : "none", outlineOffset:"-2px", transition:"background 0.3s" }}
                              onMouseEnter={e=>{ if(!isHL) e.currentTarget.style.background=C.accentLight; }}
                              onMouseLeave={e=>{ e.currentTarget.style.background= isHL?"#EBF5FF":i%2===0?C.bg:C.bgCard; }}>
                              <td style={{ padding:"8px 12px", fontWeight:600, color:C.text, whiteSpace:"nowrap" }}>{g.nombre}</td>
                              <td style={{ padding:"8px 12px", color:C.textMid, whiteSpace:"nowrap" }}>{g.segmento ? t("seg_"+g.segmento) : "—"}</td>
                              <td style={{ padding:"8px 12px" }}><span style={{ fontSize:10, fontWeight:700, padding:"2px 8px", borderRadius:10, background:ESTADOS[normEstado(g.estado)]?.bg, color:ESTADOS[normEstado(g.estado)]?.color, whiteSpace:"nowrap" }}>{ESTADOS[normEstado(g.estado)]?.label}</span></td>
                              <td style={{ padding:"8px 12px", color:C.textMid, whiteSpace:"nowrap" }}>{dmy(g.fecha_confirmacion)}</td>
                              <td style={{ padding:"8px 12px", color:C.textMid, whiteSpace:"nowrap" }}>{dmy(g.fecha_inicio)}</td>
                              <td style={{ padding:"8px 12px", color:C.textMid, whiteSpace:"nowrap" }}>{dmy(g.fecha_fin)}</td>
                              <td style={{ padding:"8px 12px", color:C.textMid, textAlign:"center" }}>{noches}</td>
                              <td style={{ padding:"8px 12px", color:C.textMid, textAlign:"center" }}>{g.habitaciones||0}</td>
                              <td style={{ padding:"8px 12px", color:C.textMid, textAlign:"right" }}>€{(g.adr_grupo||0).toLocaleString("es-ES")}</td>
                              <td style={{ padding:"8px 12px", color:C.textMid, textAlign:"right" }}>€{(g.revenue_fnb||0).toLocaleString("es-ES")}</td>
                              <td style={{ padding:"8px 12px", color:C.textMid, textAlign:"right" }}>€{(g.revenue_sala||0).toLocaleString("es-ES")}</td>
                              <td style={{ padding:"8px 12px", fontWeight:700, color:"#1A7A3C", textAlign:"right", whiteSpace:"nowrap" }}>€{Math.round(calcRevTotal(g)).toLocaleString("es-ES")}</td>
                              <td style={{ padding:"8px 12px", color:C.textLight, maxWidth:160, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{g.notas||"—"}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </Card>
              );
            })}
            {listaAnio.length === 0 && (
              <Card><p style={{ textAlign:"center", color:C.textLight, fontSize:13, padding:"24px 0" }}>Sin grupos en {anio}</p></Card>
            )}
          </div>
        );
      })()}

      {/* ── Eventos ── */}
      {subVista === "eventos" && (() => {
        const pad2 = n => String(n).padStart(2,"0");
        const anioStr = String(anio);
        const listaAnio = grupos
          .filter(g => g.categoria === "evento" && g.fecha_inicio?.slice(0,4) === anioStr)
          .sort((a,b)=>a.fecha_inicio?.localeCompare(b.fecha_inicio));
        const porMes = Array.from({length:12},(_,mi) => {
          const mStr = `${anioStr}-${pad2(mi+1)}`;
          return listaAnio.filter(g => g.fecha_inicio?.slice(0,7) === mStr);
        });
        return (
          <div style={{ display:"flex", flexDirection:"column", gap:0 }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
              <p style={{ fontSize:11, fontWeight:700, color:"#7C3AED", textTransform:"uppercase", letterSpacing:1.5, margin:0 }}>Eventos {anio}</p>
              <select value={anio} onChange={e=>setAnio(Number(e.target.value))}
                style={{ padding:"5px 10px", borderRadius:7, border:`1.5px solid ${C.border}`, fontSize:13, fontWeight:600, color:C.text, background:C.bg, cursor:"pointer", fontFamily:"'Plus Jakarta Sans',sans-serif", outline:"none" }}>
                {[...new Set([anio-1,anio,anio+1,...grupos.map(g=>parseInt(g.fecha_inicio?.slice(0,4))).filter(Boolean)])].sort().map(a=><option key={a} value={a}>{a}</option>)}
              </select>
            </div>
            {MESES_FULL.map((nombreMes, mi) => {
              const lista = porMes[mi];
              const revTotal = lista.reduce((a,g)=>a+calcRevTotal(g),0);
              const confirmados = lista.filter(g=>g.estado==="confirmado").length;
              if(lista.length===0) return null;
              return (
                <Card key={mi} style={{ marginBottom:10, padding:0, overflow:"hidden" }}>
                  <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"10px 16px", background:C.bg, borderBottom:`1px solid ${C.border}` }}>
                    <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                      <span style={{ fontFamily:"'Plus Jakarta Sans',sans-serif", fontWeight:700, fontSize:14, color:C.text }}>{nombreMes}</span>
                      <span style={{ fontSize:11, color:C.textMid }}>{lista.length} evento{lista.length!==1?"s":""}</span>
                      {confirmados > 0 && <span style={{ fontSize:10, fontWeight:700, padding:"2px 7px", borderRadius:8, background:"#E6F7EE", color:"#1A7A3C" }}>{confirmados} confirmado{confirmados!==1?"s":""}</span>}
                    </div>
                    <span style={{ fontWeight:700, color:"#1A7A3C", fontSize:13 }}>€{Math.round(revTotal).toLocaleString("es-ES")}</span>
                  </div>
                  <div style={{ overflowX:"auto" }}>
                    <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
                      <thead>
                        <tr>
                          {["Nombre","Segmento","Estado","F. Confirm.","Fecha","Hora","Sala","F&B","Sala Rev.","Revenue total","Notas"].map(h=>(
                            <th key={h} style={{ padding:"6px 12px", textAlign:"left", fontSize:10, fontWeight:600, color:C.textLight, textTransform:"uppercase", letterSpacing:"1px", borderBottom:`1px solid ${C.border}`, whiteSpace:"nowrap" }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {lista.map((g,i)=>{
                          const ev = parseNotasEvento(g.notas);
                          const hora = ev.hora_inicio && ev.hora_fin ? `${ev.hora_inicio} – ${ev.hora_fin}` : (ev.hora_inicio||"—");
                          const isHL = highlightId === g.id;
                          return (
                            <tr key={g.id} id={`grupo-row-${g.id}`} onClick={()=>setDetalleGrupo(g)} style={{ borderBottom:`1px solid ${C.border}`, background: isHL?"#EBF5FF":i%2===0?C.bg:C.bgCard, cursor:"pointer", outline: isHL?"2px solid #3B82F6":"none", outlineOffset:"-2px", transition:"background 0.3s" }}
                              onMouseEnter={e=>{ if(!isHL) e.currentTarget.style.background=C.accentLight; }}
                              onMouseLeave={e=>{ e.currentTarget.style.background= isHL?"#EBF5FF":i%2===0?C.bg:C.bgCard; }}>
                              <td style={{ padding:"8px 12px", fontWeight:600, color:C.text, whiteSpace:"nowrap" }}>{g.nombre}</td>
                              <td style={{ padding:"8px 12px", color:C.textMid, whiteSpace:"nowrap" }}>{g.segmento ? t("seg_"+g.segmento) : "—"}</td>
                              <td style={{ padding:"8px 12px" }}><span style={{ fontSize:10, fontWeight:700, padding:"2px 8px", borderRadius:10, background:ESTADOS[normEstado(g.estado)]?.bg, color:ESTADOS[normEstado(g.estado)]?.color, whiteSpace:"nowrap" }}>{ESTADOS[normEstado(g.estado)]?.label}</span></td>
                              <td style={{ padding:"8px 12px", color:C.textMid, whiteSpace:"nowrap" }}>{dmy(g.fecha_confirmacion)}</td>
                              <td style={{ padding:"8px 12px", color:C.textMid, whiteSpace:"nowrap" }}>{dmy(g.fecha_inicio)}</td>
                              <td style={{ padding:"8px 12px", color:C.textMid, whiteSpace:"nowrap" }}>{hora}</td>
                              <td style={{ padding:"8px 12px", color:C.textMid, whiteSpace:"nowrap" }}>{ev.sala_nombre||"—"}</td>
                              <td style={{ padding:"8px 12px", color:C.textMid, textAlign:"right" }}>€{(g.revenue_fnb||0).toLocaleString("es-ES")}</td>
                              <td style={{ padding:"8px 12px", color:C.textMid, textAlign:"right" }}>€{(g.revenue_sala||0).toLocaleString("es-ES")}</td>
                              <td style={{ padding:"8px 12px", fontWeight:700, color:"#1A7A3C", textAlign:"right", whiteSpace:"nowrap" }}>€{Math.round(calcRevTotal(g)).toLocaleString("es-ES")}</td>
                              <td style={{ padding:"8px 12px", color:C.textLight, maxWidth:160, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{ev.notasUser||"—"}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </Card>
              );
            })}
            {listaAnio.length === 0 && (
              <Card><p style={{ textAlign:"center", color:C.textLight, fontSize:13, padding:"24px 0" }}>Sin eventos en {anio}</p></Card>
            )}
          </div>
        );
      })()}


      {/* ── PANEL DETALLE EVENTO (desde calendario) ── */}
      {detalleGrupo !== null && (
        <div style={{ position:"fixed", top:"50%", left:"50%", transform:"translate(-50%,-50%)", zIndex:600, background:C.bgCard, borderRadius:14, width:"95vw", maxWidth:1100, maxHeight:"85vh", overflow:"auto", padding:"28px 36px", boxShadow:"0 8px 60px rgba(0,0,0,0.35)", border:`1px solid ${C.border}` }}>

            {/* Cabecera */}
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:20 }}>
              <div>
                <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:4 }}>
                  <h3 style={{ fontSize:18, fontWeight:700, color:C.text }}>{detalleGrupo.nombre}</h3>
                </div>
                <span style={{ fontSize:11, fontWeight:700, padding:"3px 10px", borderRadius:10, background:ESTADOS[detalleGrupo.estado]?.bg||"#eee", color:ESTADOS[detalleGrupo.estado]?.color||"#666" }}>
                  {ESTADOS[detalleGrupo.estado]?.label || detalleGrupo.estado || "—"}
                </span>
              </div>
              <button onClick={()=>setDetalleGrupo(null)} style={{ background:"none", border:`1px solid ${C.border}`, borderRadius:6, width:28, height:28, cursor:"pointer", fontSize:16, color:C.textMid, flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center", padding:0 }}>×</button>
            </div>

            {/* Tabla de métricas — mismo estilo que vista Tabla */}
            {(() => {
              const g = detalleGrupo;
              const noches = g.fecha_inicio && g.fecha_fin
                ? Math.max(1, Math.round((new Date(g.fecha_fin) - new Date(g.fecha_inicio)) / 86400000))
                : 1;
              return (
                <div style={{ overflowX:"auto" }}>
                  <table style={{ width:"100%", borderCollapse:"collapse", fontSize:14 }}>
                    <thead>
                      <tr>
                        {["Evento","Segmento","Estado","F. Confirmación","Entrada","Salida","Noches","Habs","PAX","ADR","F&B","Sala","Revenue total","Notas"].map(h => (
                          <th key={h} style={{ padding:"10px 14px", textAlign:"left", fontSize:10, fontWeight:600, color:C.textLight, textTransform:"uppercase", letterSpacing:"1px", borderBottom:`2px solid ${C.border}`, whiteSpace:"nowrap" }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      <tr style={{ borderBottom:`1px solid ${C.border}`, background: C.bg }}>
                        <td style={{ padding:"9px 14px", fontWeight:600, color:C.text, whiteSpace:"nowrap" }}>{g.nombre}</td>
                        <td style={{ padding:"9px 14px", color:C.textMid, whiteSpace:"nowrap" }}>{g.segmento ? t("seg_"+g.segmento) : "—"}</td>
                        <td style={{ padding:"9px 14px" }}>
                          <span style={{ fontSize:10, fontWeight:700, padding:"2px 8px", borderRadius:10, background:ESTADOS[normEstado(g.estado)]?.bg||"#eee", color:ESTADOS[normEstado(g.estado)]?.color||"#666", whiteSpace:"nowrap" }}>
                            {ESTADOS[normEstado(g.estado)]?.label || g.estado || "—"}
                          </span>
                        </td>
                        <td style={{ padding:"9px 14px", color:C.textMid, whiteSpace:"nowrap" }}>{dmy(g.fecha_confirmacion)}</td>
                        <td style={{ padding:"9px 14px", color:C.textMid, whiteSpace:"nowrap" }}>{dmy(g.fecha_inicio)}</td>
                        <td style={{ padding:"9px 14px", color:C.textMid, whiteSpace:"nowrap" }}>{dmy(g.fecha_fin)}</td>
                        <td style={{ padding:"9px 14px", color:C.textMid, textAlign:"center" }}>{noches}</td>
                        <td style={{ padding:"9px 14px", color:C.textMid, textAlign:"center" }}>{g.habitaciones||0}</td>
                        <td style={{ padding:"9px 14px", color:C.textMid, textAlign:"center" }}>{g.pax||0}</td>
                        <td style={{ padding:"9px 14px", color:C.textMid, textAlign:"right" }}>€{(g.adr_grupo||0).toLocaleString("es-ES")}</td>
                        <td style={{ padding:"9px 14px", color:C.textMid, textAlign:"right" }}>€{(g.revenue_fnb||0).toLocaleString("es-ES")}</td>
                        <td style={{ padding:"9px 14px", color:C.textMid, textAlign:"right" }}>€{(g.revenue_sala||0).toLocaleString("es-ES")}</td>
                        <td style={{ padding:"9px 14px", fontWeight:800, color:"#1A7A3C", textAlign:"right", whiteSpace:"nowrap" }}>
                          €{Math.round(calcRevTotal(g)).toLocaleString("es-ES")}
                        </td>
                        <td style={{ padding:"9px 14px", color:C.textLight }}>{g.notas||"—"}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              );
            })()}

            {/* Botón editar */}
            <div style={{ display:"flex", justifyContent:"flex-end", marginTop:20 }}>
              <button onClick={()=>{ setDetalleGrupo(null); abrirEditar(detalleGrupo); }}
                style={{ background:"#1F1F1F", color:"#fff", border:"none", borderRadius:7, padding:"9px 22px", fontSize:13, fontWeight:600, cursor:"pointer" }}>
                {detalleGrupo?.categoria === "evento" ? t("editar_evento") : t("editar_grupo")}
              </button>
            </div>
          </div>
      )}

      {/* ── MODAL FORMULARIO ── */}
      {modalGrupo !== null && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.55)", zIndex:1000, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
          <div style={{ background:C.bgCard, borderRadius:14, width:"100%", maxWidth:540, maxHeight:"90vh", overflow:"auto", padding:"28px 32px", boxShadow:"0 24px 80px rgba(0,0,0,0.2)" }}
            onClick={e=>e.stopPropagation()}>

            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
              <h3 style={{ fontSize:18, fontWeight:700, color:C.text }}>
                {modalGrupo?.id
                  ? (modalGrupo.categoria === "evento" ? t("editar_evento") : t("editar_grupo"))
                  : (modalGrupo.tipo === "evento" ? t("nuevo_evento_title") : t("nuevo_grupo_title"))}
              </h3>
              <button onClick={()=>setModalGrupo(null)} style={{ background:"none", border:`1px solid ${C.border}`, borderRadius:6, width:28, height:28, cursor:"pointer", fontSize:16, color:C.textMid, display:"flex", alignItems:"center", justifyContent:"center", padding:0 }}>×</button>
            </div>

            <ModalFormGrupo
              datos={datos}
              grupoData={modalGrupo}
              onClose={()=>setModalGrupo(null)}
              onGuardado={()=>{ onRecargar(); setModalGrupo(null); }}
            />

          </div>
        </div>
      )}

    </div>
  );
}

// ─── AUTH SCREEN ──────────────────────────────────────────────────
function AuthScreen() {
  const [showAuth, setShowAuth] = useState(() => window.location.hash === "#login" || window.location.hash === "#register");
  const [mode, setMode] = useState(() => window.location.hash === "#register" ? "register" : "login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [hotelNombre, setHotelNombre] = useState("");
  const [hotelCiudad, setHotelCiudad] = useState("");
  const [habitaciones, setHabitaciones] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");

  const openAuth = (m = "login") => { setMode(m); setError(""); setMensaje(""); setShowAuth(true); };

  const handleLogin = async () => {
    setLoading(true); setError("");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setError("Email o contraseña incorrectos");
    setLoading(false);
  };

  const validarPassword = (pw) => {
    if (pw.length < 8) return "La contraseña debe tener al menos 8 caracteres";
    if (!/[A-Z]/.test(pw)) return "Debe incluir al menos una mayúscula";
    if (!/[0-9]/.test(pw)) return "Debe incluir al menos un número";
    return null;
  };

  const handleRegister = async () => {
    if (!hotelNombre || !email || !password) { setError("Rellena todos los campos obligatorios"); return; }
    const pwError = validarPassword(password);
    if (pwError) { setError(pwError); return; }
    setLoading(true); setError("");
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) { setError(error.message); setLoading(false); return; }
    if (data.user) {
      await supabase.from("hoteles").insert({ id: data.user.id, nombre: hotelNombre, ciudad: hotelCiudad, habitaciones: parseInt(habitaciones) || null });
      fetch("/api/send-welcome-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, hotelNombre, user_id: data.user.id }),
      }).catch(() => {});
    }
    setMensaje("¡Cuenta creada! Ya puedes iniciar sesión.");
    setLoading(false);
  };

  useEffect(() => {
    if (!showAuth) return;
    const handler = (e) => { if (e.key === "Escape") setShowAuth(false); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [showAuth]);

  const inp = { width: "100%", padding: "11px 14px", borderRadius: 8, border: "1.5px solid #E0E0E0", fontSize: 14, fontFamily: "'Plus Jakarta Sans', sans-serif", color: "#1A1A1A", background: "#FDFDFD", outline: "none", boxSizing: "border-box" };

  return (
    <div style={{ minHeight: "100vh", backgroundImage: "url('/login-bg.jpg')", backgroundSize: "cover", backgroundPosition: "center", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontFamily: "'Plus Jakarta Sans', sans-serif", padding: "24px" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        * { box-sizing: border-box; }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>

      <div style={{ width: "100%", maxWidth: 400, animation: "fadeUp 0.4s ease both" }}>
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginBottom: 36 }}>
          <img src="/fastrev-icon.png" alt="FastRevenue" style={{ height: 38, width: "auto", filter: "brightness(0) invert(1)" }} />
          <span style={{ fontSize: 19, fontWeight: 800, color: "#fff", letterSpacing: 0.3 }}>FAST<span style={{ fontWeight: 400 }}>REVENUE</span></span>
        </div>

        {/* Card */}
        <div style={{ background: "#fff", borderRadius: 16, padding: "32px 28px", boxShadow: "0 24px 60px rgba(0,0,0,0.4)" }}>
          {/* Tabs */}
          <div style={{ display: "flex", background: "#F3F4F6", borderRadius: 10, padding: 4, marginBottom: 24 }}>
            {[["login","Iniciar sesión"],["register","Crear cuenta"]].map(([k,l]) => (
              <button key={k} onClick={() => { setMode(k); setError(""); setMensaje(""); }}
                style={{ flex: 1, padding: "9px", borderRadius: 7, border: "none", cursor: "pointer",
                  background: mode===k ? "#fff" : "transparent",
                  color: mode===k ? "#004B87" : "#6B7280",
                  fontWeight: mode===k ? 700 : 400, fontSize: 13,
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  boxShadow: mode===k ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
                  transition: "all 0.15s" }}>{l}</button>
            ))}
          </div>

          {mensaje ? (
            <div style={{ background: "#ECFDF5", color: "#059669", padding: "14px", borderRadius: 8, fontSize: 13, textAlign: "center", fontWeight: 600 }}>{mensaje}</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {mode === "register" && (
                <>
                  <div>
                    <p style={{ fontSize: 11, color: "#9CA3AF", marginBottom: 5, textTransform: "uppercase", letterSpacing: "1px", fontWeight: 600 }}>Nombre del hotel *</p>
                    <input style={inp} placeholder="Ej. Hotel Mediterráneo" value={hotelNombre} onChange={e => setHotelNombre(e.target.value)} />
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                    <div>
                      <p style={{ fontSize: 11, color: "#9CA3AF", marginBottom: 5, textTransform: "uppercase", letterSpacing: "1px", fontWeight: 600 }}>Ciudad</p>
                      <input style={inp} placeholder="Ciudad" value={hotelCiudad} onChange={e => setHotelCiudad(e.target.value)} />
                    </div>
                    <div>
                      <p style={{ fontSize: 11, color: "#9CA3AF", marginBottom: 5, textTransform: "uppercase", letterSpacing: "1px", fontWeight: 600 }}>Habitaciones</p>
                      <input style={inp} placeholder="Nº hab." type="number" value={habitaciones} onChange={e => setHabitaciones(e.target.value)} />
                    </div>
                  </div>
                  <div style={{ height: 1, background: "#E5E7EB" }} />
                </>
              )}
              <div>
                <p style={{ fontSize: 11, color: "#9CA3AF", marginBottom: 5, textTransform: "uppercase", letterSpacing: "1px", fontWeight: 600 }}>Email *</p>
                <input style={inp} type="email" value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" />
              </div>
              <div>
                <p style={{ fontSize: 11, color: "#9CA3AF", marginBottom: 5, textTransform: "uppercase", letterSpacing: "1px", fontWeight: 600 }}>Contraseña *</p>
                <input style={inp} type="password" value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key==="Enter" && (mode==="login" ? handleLogin() : handleRegister())} autoComplete="current-password" />
                {mode === "register" && <p style={{ fontSize: 11, color: "#9CA3AF", marginTop: 4 }}>Mín. 8 caracteres, una mayúscula y un número</p>}
              </div>
              {error && <div style={{ background: "#FEF2F2", color: "#DC2626", padding: "10px 14px", borderRadius: 8, fontSize: 13 }}>{error}</div>}
              <button onClick={mode==="login" ? handleLogin : handleRegister} disabled={loading}
                style={{ width: "100%", padding: "13px", borderRadius: 10, border: "none",
                  background: loading ? "#BFDBFE" : "#004B87",
                  color: loading ? "#1E40AF" : "#fff",
                  fontSize: 14, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer",
                  fontFamily: "'Plus Jakarta Sans', sans-serif", marginTop: 2 }}>
                {loading ? "Cargando..." : mode==="login" ? "Entrar" : "Crear cuenta"}
              </button>
            </div>
          )}
        </div>

        <p style={{ textAlign: "center", marginTop: 20, fontSize: 12, color: "rgba(255,255,255,0.35)" }}>
          <a href="/" style={{ color: "rgba(255,255,255,0.35)", textDecoration: "none" }}>← Volver a fastrevenue.app</a>
        </p>
      </div>
    </div>
  );
}

// ─── SALAS VIEW ──────────────────────────────────────────────────────────────
function SalasView({ datos, onRecargar, onVolver, onVerEventos, salaDetalle, setSalaDetalle }) {
  const t  = useT();
  const MESES_FULL = t("meses_full");
  const grupos = datos.grupos || [];

  // Parsea las notas de evento para extraer sala
  const parseEv = (notas) => {
    if (!notas) return { sala_nombre:"", hora_inicio:"", hora_fin:"", notasUser:"" };
    const m = notas.match(/^\[ev:([^\]]*)\]\n?([\s\S]*)$/);
    if (!m) return { sala_nombre:"", hora_inicio:"", hora_fin:"", notasUser: notas };
    const p = Object.fromEntries(m[1].split(",").map(x => x.split("=")));
    return { sala_nombre: p.sala||"", hora_inicio: p.hi||"", hora_fin: p.hf||"", notasUser: m[2] };
  };

  // Salas detectadas de los eventos + las guardadas manualmente
  const SALA_META_KEY = `fr_salas_meta_${datos.session?.user?.id}`;
  const [salaMeta, setSalaMeta] = useState(() => {
    try { return JSON.parse(localStorage.getItem(SALA_META_KEY) || "{}"); } catch { return {}; }
  });
  const guardarMeta = (meta) => { setSalaMeta(meta); localStorage.setItem(SALA_META_KEY, JSON.stringify(meta)); };

  const [modalSala, setModalSala] = useState(null); // null | "nueva" | {nombre,...}
  const [formSala, setFormSala] = useState({ nombre:"", capacidad:"", tipo:"", precio_hora:"", descripcion:"" });
  const [planningAnio, setPlanningAnio] = useState(new Date().getFullYear());
  const [planningMes, setPlanningMes] = useState(new Date().getMonth());
  const [planningDia, setPlanningDia] = useState(() => localStorage.getItem("fr_sala_planning_dia") || null);
  const cambiarPlanningDia = (v) => { setPlanningDia(v); if (v) localStorage.setItem("fr_sala_planning_dia", v); else localStorage.removeItem("fr_sala_planning_dia"); };

  useEffect(() => {
    const handler = (e) => {
      if (e.key !== "Escape") return;
      if (planningDia) { cambiarPlanningDia(null); return; }
      if (salaDetalle)  { setSalaDetalle(null); return; }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [planningDia, salaDetalle]);

  // Salas: las de los eventos + las guardadas manualmente
  const todasSalas = SALAS_FIJAS;

  const hoy = new Date().toISOString().slice(0,10);
  const anioActual = new Date().getFullYear();

  // Stats por sala
  const statsSala = (nombre) => {
    const eventos = grupos.filter(g => g.categoria === "evento" && parseEv(g.notas).sala_nombre === nombre);
    const mesStr = `${planningAnio}-${String(planningMes+1).padStart(2,"0")}`;
    const eventosMes = eventos.filter(g => g.fecha_inicio?.slice(0,7) === mesStr && g.estado !== "cancelado");
    const proximoEv = eventos.filter(g => g.fecha_inicio >= hoy && g.estado !== "cancelado")
      .sort((a,b) => a.fecha_inicio.localeCompare(b.fecha_inicio))[0];
    const ocupadaHoy = eventos.some(g => g.fecha_inicio === hoy && g.estado !== "cancelado");
    const disponibleMes = eventosMes.length === 0;
    return { eventosMes, disponibleMes, proximoEv, ocupadaHoy };
  };

  const TIPOS = ["Banquetes","Reuniones","Conferencias","Bodas","Polivalente","Exterior","Otro"];

  const abrirNuevaSala = () => {
    setFormSala({ nombre:"", capacidad:"", tipo:"", precio_hora:"", descripcion:"" });
    setModalSala("nueva");
  };
  const abrirEditarSala = (nombre) => {
    const meta = salaMeta[nombre] || {};
    setFormSala({ nombre, capacidad: meta.capacidad||"", tipo: meta.tipo||"", precio_hora: meta.precio_hora||"", descripcion: meta.descripcion||"" });
    setModalSala({ nombre });
  };
  const guardarSala = () => {
    if (!formSala.nombre.trim()) return;
    const nuevo = { ...salaMeta };
    const nombreFinal = formSala.nombre.trim();
    if (modalSala !== "nueva" && modalSala.nombre !== nombreFinal) delete nuevo[modalSala.nombre];
    nuevo[nombreFinal] = { capacidad: parseInt(formSala.capacidad)||null, tipo: formSala.tipo||"", precio_hora: parseFloat(formSala.precio_hora)||null, descripcion: formSala.descripcion||"" };
    guardarMeta(nuevo);
    setModalSala(null);
  };
  const eliminarSala = (nombre) => {
    if (!window.confirm(`¿Eliminar la sala "${nombre}" del registro?`)) return;
    const nuevo = { ...salaMeta };
    delete nuevo[nombre];
    guardarMeta(nuevo);
    if (salaDetalle === nombre) setSalaDetalle(null);
  };

  const inp = { width:"100%", padding:"9px 12px", borderRadius:7, border:`1.5px solid ${C.border}`, fontSize:13, fontFamily:"'Plus Jakarta Sans',sans-serif", color:C.text, background:C.bg, outline:"none", boxSizing:"border-box" };

  if (salaDetalle) {
    const meta = salaMeta[salaDetalle] || {};
    const DIAS_SEMANA = ["Dom","Lun","Mar","Mié","Jue","Vie","Sáb"];
    const mesStr = `${planningAnio}-${String(planningMes+1).padStart(2,"0")}`;
    const diasEnMes = new Date(planningAnio, planningMes+1, 0).getDate();
    const eventosMes = grupos.filter(g =>
      g.categoria === "evento" &&
      parseEv(g.notas).sala_nombre === salaDetalle &&
      g.fecha_inicio?.slice(0,7) === mesStr
    );
    const estadoColor = { confirmado:"#1A7A3C", cancelado:"#999" };
    const estadoBg    = { confirmado:"#E6F7EE", cancelado:"#F5F5F5" };

    // ── Vista diaria ────────────────────────────────────────────────────────
    if (planningDia) {
      const eventosDia = grupos.filter(g =>
        g.categoria === "evento" &&
        parseEv(g.notas).sala_nombre === salaDetalle &&
        g.fecha_inicio === planningDia
      );
      const fechaObj  = new Date(planningDia + "T12:00:00");
      const DS_FULL   = ["Domingo","Lunes","Martes","Miércoles","Jueves","Viernes","Sábado"];
      const HORAS     = Array.from({length:17}, (_,i) => i + 7); // 07–23

      return (
        <div style={{ display:"flex", flexDirection:"column", gap:20 }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <div style={{ display:"flex", alignItems:"center", gap:12 }}>
              <button onClick={()=>cambiarPlanningDia(null)} style={{ background:"none", border:`1px solid ${C.border}`, borderRadius:6, padding:"5px 10px", cursor:"pointer", fontSize:12, color:C.textMid }}>← Volver</button>
              <div>
                <h2 style={{ fontFamily:"'Plus Jakarta Sans',sans-serif", fontSize:22, fontWeight:700, color:C.text, margin:0 }}>{salaDetalle}</h2>
                <p style={{ fontSize:13, color:C.textMid, margin:0 }}>{DS_FULL[fechaObj.getDay()]}, {fechaObj.getDate()} {MESES_FULL[fechaObj.getMonth()]} {fechaObj.getFullYear()}</p>
              </div>
            </div>
          </div>

          <Card>
            <p style={{ fontSize:11, fontWeight:700, color:C.textLight, textTransform:"uppercase", letterSpacing:1.5, marginBottom:16 }}>Planning diario</p>
            <div style={{ display:"flex", flexDirection:"column" }}>
              {HORAS.map(hora => {
                const horaStr = `${String(hora).padStart(2,"0")}:00`;

                // Evento que empieza en esta hora
                const evInicio = eventosDia.find(g => parseEv(g.notas).hora_inicio === horaStr);

                // Hora en mitad de un evento (no el inicio) → omitir fila
                const esMitad = !evInicio && eventosDia.some(g => {
                  const ev  = parseEv(g.notas);
                  const hiH = parseInt(ev.hora_inicio.split(":")[0]);
                  const hfH = parseInt(ev.hora_fin.split(":")[0]);
                  return hiH < hora && hora < hfH;
                });
                if (esMitad) return null;

                const ROW_H = 48;
                let rowHeight = ROW_H;
                if (evInicio) {
                  const ev  = parseEv(evInicio.notas);
                  const dur = parseInt(ev.hora_fin.split(":")[0]) - parseInt(ev.hora_inicio.split(":")[0]);
                  rowHeight = Math.max(dur, 1) * ROW_H;
                }

                const libre = !evInicio;
                return (
                  <div key={hora} style={{ display:"flex", borderBottom:`1px solid ${C.border}`, height:rowHeight }}>
                    <div style={{ width:60, flexShrink:0, paddingRight:10, paddingTop:14, display:"flex", alignItems:"flex-start", justifyContent:"flex-end", fontSize:12, fontWeight:600, color:C.textLight, borderRight:`1px solid ${C.border}` }}>
                      {horaStr}
                    </div>
                    <div style={{ flex:1, padding:"6px 14px", background: libre ? "transparent" : "#F0F6FF", display:"flex", flexDirection:"column", justifyContent:"center" }}>
                      {libre
                        ? <span style={{ fontSize:11, color:C.border }}>Disponible</span>
                        : (() => {
                            const ev = parseEv(evInicio.notas);
                            const evMes = evInicio.fecha_inicio ? parseInt(evInicio.fecha_inicio.slice(5,7)) - 1 : planningMes;
                            const evAnio = evInicio.fecha_inicio ? parseInt(evInicio.fecha_inicio.slice(0,4)) : planningAnio;
                            return (
                              <div onClick={()=>{ onVerEventos && onVerEventos(evMes, evAnio); }}
                                style={{ background:estadoBg[evInicio.estado], border:`1px solid ${estadoColor[evInicio.estado]}`, borderRadius:8, padding:"10px 14px", fontSize:12, display:"flex", alignItems:"center", gap:10, height:"calc(100% - 12px)", boxSizing:"border-box", cursor:"pointer" }}>
                                <span style={{ fontWeight:700, color:estadoColor[evInicio.estado], fontSize:13 }}>{evInicio.nombre}</span>
                                <span style={{ color:C.textMid }}>{ev.hora_inicio} – {ev.hora_fin}</span>
                                <span style={{ fontSize:10, fontWeight:700, padding:"2px 8px", borderRadius:8, background:"white", color:estadoColor[evInicio.estado], border:`1px solid ${estadoColor[evInicio.estado]}` }}>{evInicio.estado}</span>
                                {ev.servicio_incluido === true || ev.serv === "sí" ? <span style={{ fontSize:10, color:C.textLight }}>· F&B incl.</span> : null}
                                <span style={{ marginLeft:"auto", fontWeight:700, color:"#1A7A3C", fontSize:13 }}>€{((evInicio.revenue_fnb||0)+(evInicio.revenue_sala||0)).toLocaleString("es-ES")}</span>
                              </div>
                            );
                          })()
                      }
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      );
    }

    // ── Vista mensual ───────────────────────────────────────────────────────
    return (
      <div style={{ display:"flex", flexDirection:"column", gap:20 }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:12, flexWrap:"wrap" }}>
          <div style={{ display:"flex", alignItems:"center", gap:12 }}>
            <button onClick={()=>setSalaDetalle(null)} style={{ background:"none", border:`1px solid ${C.border}`, borderRadius:6, padding:"5px 10px", cursor:"pointer", fontSize:12, color:C.textMid }}>← Volver</button>
            <div>
              <h2 style={{ fontFamily:"'Plus Jakarta Sans',sans-serif", fontSize:22, fontWeight:700, color:C.text, margin:0 }}>{salaDetalle}</h2>
              {meta.tipo && <span style={{ fontSize:11, color:C.textMid }}>{meta.tipo}{meta.capacidad ? ` · ${meta.capacidad} pax` : ""}</span>}
            </div>
          </div>
          <div style={{ display:"flex", gap:6, alignItems:"center" }}>
            <select value={planningMes} onChange={e=>setPlanningMes(Number(e.target.value))}
              style={{ padding:"6px 10px", borderRadius:7, border:`1.5px solid ${C.border}`, fontSize:13, fontWeight:600, color:C.text, background:C.bg, cursor:"pointer", fontFamily:"'Plus Jakarta Sans',sans-serif", outline:"none" }}>
              {MESES_FULL.map((m,i) => {
                const mStr = String(planningAnio) + "-" + String(i+1).padStart(2,"0");
                const conf = grupos.filter(g => g.categoria === "evento" && g.estado === "confirmado" && parseEv(g.notas).sala_nombre === salaDetalle && g.fecha_inicio?.slice(0,7) === mStr).length;
                return <option key={i} value={i}>{m}{conf > 0 ? ` (${conf})` : ""}</option>;
              })}
            </select>
            <select value={planningAnio} onChange={e=>setPlanningAnio(Number(e.target.value))}
              style={{ padding:"6px 10px", borderRadius:7, border:`1.5px solid ${C.border}`, fontSize:13, fontWeight:600, color:C.text, background:C.bg, cursor:"pointer", fontFamily:"'Plus Jakarta Sans',sans-serif", outline:"none" }}>
              {[planningAnio-1, planningAnio, planningAnio+1].map(a => <option key={a} value={a}>{a}</option>)}
            </select>
            <button onClick={()=>abrirEditarSala(salaDetalle)} style={{ background:"#0A2540", color:"#fff", border:"none", borderRadius:8, padding:"7px 16px", fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:"'Plus Jakarta Sans',sans-serif" }}>Editar</button>
          </div>
        </div>

        <Card>
          <p style={{ fontSize:11, fontWeight:700, color:C.textLight, textTransform:"uppercase", letterSpacing:1.5, marginBottom:14 }}>Planning mensual — pulsa un día para ver el detalle</p>
          <div style={{ overflowX:"auto" }}>
            <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
              <thead>
                <tr>
                  {["Día","","Evento","Estado","Horario","Revenue"].map(h => (
                    <th key={h} style={{ padding:"8px 12px", textAlign:"left", fontSize:10, fontWeight:600, color:C.textLight, textTransform:"uppercase", letterSpacing:"1px", borderBottom:`2px solid ${C.border}`, whiteSpace:"nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Array.from({length:diasEnMes}, (_,i) => i+1).map(dia => {
                  const fechaDia = `${planningAnio}-${String(planningMes+1).padStart(2,"0")}-${String(dia).padStart(2,"0")}`;
                  const evsDia   = eventosMes.filter(g => g.fecha_inicio === fechaDia);
                  const dSem     = new Date(fechaDia + "T12:00:00").getDay();
                  const esFds    = dSem === 0 || dSem === 6;
                  const esHoy    = fechaDia === hoy;
                  const revDia   = evsDia.reduce((a,g)=>a+(g.revenue_fnb||0)+(g.revenue_sala||0),0);
                  const bgBase   = esHoy ? "#FFFBEB" : esFds ? C.bg : C.bgCard;
                  return (
                    <tr key={dia} onClick={()=>cambiarPlanningDia(fechaDia)}
                      style={{ borderBottom:`1px solid ${C.border}`, background:bgBase, cursor:"pointer" }}
                      onMouseEnter={e=>e.currentTarget.style.background=C.accentLight}
                      onMouseLeave={e=>e.currentTarget.style.background=bgBase}>
                      <td style={{ padding:"9px 12px", fontWeight:700, color:esHoy?"#B8860B":C.text, width:48 }}>{dia}</td>
                      <td style={{ padding:"9px 12px", color:C.textLight, fontSize:11, whiteSpace:"nowrap" }}>{DIAS_SEMANA[dSem]}</td>
                      <td style={{ padding:"9px 12px" }}>
                        {evsDia.length === 0
                          ? <span style={{ color:C.border }}>—</span>
                          : evsDia.map(g => (
                              <span key={g.id} onClick={e=>{ e.stopPropagation(); onVerEventos && onVerEventos(planningMes, planningAnio); }}
                                style={{ display:"inline-block", fontSize:11, fontWeight:600, padding:"2px 8px", borderRadius:5, background:estadoBg[g.estado], color:estadoColor[g.estado], marginRight:4, cursor:"pointer", textDecoration:"underline" }}>{g.nombre}</span>
                            ))
                        }
                      </td>
                      <td style={{ padding:"9px 12px" }}>
                        {evsDia.map(g => (
                          <span key={g.id} style={{ fontSize:10, fontWeight:700, padding:"2px 7px", borderRadius:8, background:estadoBg[g.estado], color:estadoColor[g.estado], marginRight:4 }}>{g.estado}</span>
                        ))}
                      </td>
                      <td style={{ padding:"9px 12px", color:C.textMid, whiteSpace:"nowrap" }}>
                        {evsDia.map(g=>{ const ev=parseEv(g.notas); return ev.hora_inicio?`${ev.hora_inicio}–${ev.hora_fin}`:null; }).filter(Boolean).join(", ") || "—"}
                      </td>
                      <td style={{ padding:"9px 12px", fontWeight:700, color:"#1A7A3C", textAlign:"right", whiteSpace:"nowrap" }}>
                        {revDia > 0 ? `€${revDia.toLocaleString("es-ES")}` : ""}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:20 }}>

      {/* Header */}
      <div style={{ display:"flex", alignItems:"center", gap:12 }}>
        {onVolver && <button onClick={onVolver} style={{ background:"none", border:`1px solid ${C.border}`, borderRadius:6, padding:"5px 10px", cursor:"pointer", fontSize:12, color:C.textMid }}>← Volver</button>}
        <h2 style={{ fontFamily:"'Plus Jakarta Sans',sans-serif", fontSize:24, fontWeight:700, color:C.text, margin:0 }}>Salas</h2>
      </div>

      <div style={{ display:"flex", gap:6 }}>
        <select value={planningMes} onChange={e=>setPlanningMes(Number(e.target.value))}
          style={{ padding:"5px 10px", borderRadius:7, border:`1.5px solid ${C.border}`, fontSize:13, fontWeight:600, color:C.text, background:C.bg, cursor:"pointer", fontFamily:"'Plus Jakarta Sans',sans-serif", outline:"none" }}>
          {MESES_FULL.map((m,i) => <option key={i} value={i}>{m}</option>)}
        </select>
        <select value={planningAnio} onChange={e=>setPlanningAnio(Number(e.target.value))}
          style={{ padding:"5px 10px", borderRadius:7, border:`1.5px solid ${C.border}`, fontSize:13, fontWeight:600, color:C.text, background:C.bg, cursor:"pointer", fontFamily:"'Plus Jakarta Sans',sans-serif", outline:"none" }}>
          {[planningAnio-1, planningAnio, planningAnio+1].map(a => <option key={a} value={a}>{a}</option>)}
        </select>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))", gap:14 }}>
        {todasSalas.map(nombre => {
          const meta  = salaMeta[nombre] || {};
          const stats = statsSala(nombre);
          return (
            <Card key={nombre} style={{ cursor:"pointer", transition:"box-shadow 0.15s" }}
              onClick={()=>{ setSalaDetalle(nombre); cambiarPlanningDia(null); }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:12 }}>
                <div>
                  <p style={{ fontSize:15, fontWeight:700, color:C.text, marginBottom:3 }}>{nombre}</p>
                  <p style={{ fontSize:11, color:C.textLight }}>{meta.tipo || "Sin tipo"}{meta.capacidad ? ` · ${meta.capacidad} pax` : ""}</p>
                </div>
                <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:4 }}>
                  <span style={{ fontSize:10, fontWeight:700, padding:"2px 8px", borderRadius:8, background: stats.ocupadaHoy ? "#FFF8E7" : "#E6F7EE", color: stats.ocupadaHoy ? "#B8860B" : "#1A7A3C" }}>
                    {stats.ocupadaHoy ? "Ocupada hoy" : "Sin eventos hoy"}
                  </span>
                </div>
              </div>

              <div style={{ background: stats.disponibleMes ? "#E6F7EE" : "#FFF8E7", borderRadius:8, padding:"10px 12px", marginBottom:12 }}>
                {stats.disponibleMes
                  ? <p style={{ fontSize:12, fontWeight:700, color:"#1A7A3C", margin:0 }}>Sin eventos — {MESES_FULL[planningMes]}</p>
                  : <>
                      <p style={{ fontSize:11, color:"#92600A", fontWeight:600, margin:"0 0 4px" }}>{MESES_FULL[planningMes]}: {stats.eventosMes.length} evento{stats.eventosMes.length !== 1 ? "s" : ""}</p>
                      {stats.eventosMes.slice(0,2).map(g => (
                        <p key={g.id} style={{ fontSize:11, color:"#92600A", margin:"2px 0 0" }}>· {g.nombre} ({dmy(g.fecha_inicio)})</p>
                      ))}
                      {stats.eventosMes.length > 2 && <p style={{ fontSize:11, color:"#92600A", margin:"2px 0 0" }}>· +{stats.eventosMes.length - 2} más</p>}
                    </>
                }
              </div>

              {stats.proximoEv && (
                <div style={{ background:C.bg, borderRadius:7, padding:"8px 10px", fontSize:11, color:C.textMid }}>
                  Próximo: <span style={{ fontWeight:600, color:C.text }}>{stats.proximoEv.nombre}</span> · {dmy(stats.proximoEv.fecha_inicio)}
                </div>
              )}

              <div style={{ display:"flex", justifyContent:"flex-end", marginTop:12 }}
                onClick={e=>e.stopPropagation()}>
                <button onClick={()=>abrirEditarSala(nombre)}
                  style={{ background:"none", border:`1px solid ${C.border}`, borderRadius:6, padding:"4px 10px", fontSize:11, cursor:"pointer", color:C.textMid }}>
                  Editar
                </button>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Modal sala */}
      {modalSala !== null && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.55)", zIndex:1000, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}
          onClick={()=>setModalSala(null)}>
          <div style={{ background:C.bgCard, borderRadius:14, width:"100%", maxWidth:460, padding:"28px 32px", boxShadow:"0 24px 80px rgba(0,0,0,0.2)" }}
            onClick={e=>e.stopPropagation()}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
              <h3 style={{ fontSize:17, fontWeight:700, color:C.text }}>{modalSala === "nueva" ? "Nueva sala" : "Editar sala"}</h3>
              <button onClick={()=>setModalSala(null)} style={{ background:"none", border:`1px solid ${C.border}`, borderRadius:6, width:28, height:28, cursor:"pointer", fontSize:16, color:C.textMid, display:"flex", alignItems:"center", justifyContent:"center", padding:0 }}>×</button>
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
              <div>
                <p style={{ fontSize:11, color:C.textLight, textTransform:"uppercase", letterSpacing:1, marginBottom:5 }}>Nombre *</p>
                <input style={inp} value={formSala.nombre} onChange={e=>setFormSala(f=>({...f,nombre:e.target.value}))} placeholder="Salón Principal"/>
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
                <div>
                  <p style={{ fontSize:11, color:C.textLight, textTransform:"uppercase", letterSpacing:1, marginBottom:5 }}>Tipo</p>
                  <select style={inp} value={formSala.tipo} onChange={e=>setFormSala(f=>({...f,tipo:e.target.value}))}>
                    <option value="">Sin tipo</option>
                    {TIPOS.map(tp=><option key={tp} value={tp}>{tp}</option>)}
                  </select>
                </div>
                <div>
                  <p style={{ fontSize:11, color:C.textLight, textTransform:"uppercase", letterSpacing:1, marginBottom:5 }}>Capacidad (pax)</p>
                  <input style={inp} type="number" placeholder="150" value={formSala.capacidad} onChange={e=>setFormSala(f=>({...f,capacidad:e.target.value}))}/>
                </div>
              </div>
              <div>
                <p style={{ fontSize:11, color:C.textLight, textTransform:"uppercase", letterSpacing:1, marginBottom:5 }}>Precio/hora (€)</p>
                <input style={inp} type="number" placeholder="300" value={formSala.precio_hora} onChange={e=>setFormSala(f=>({...f,precio_hora:e.target.value}))}/>
              </div>
              <div>
                <p style={{ fontSize:11, color:C.textLight, textTransform:"uppercase", letterSpacing:1, marginBottom:5 }}>Descripción</p>
                <textarea style={{...inp, resize:"vertical", minHeight:60}} placeholder="Equipamiento, características..." value={formSala.descripcion} onChange={e=>setFormSala(f=>({...f,descripcion:e.target.value}))}/>
              </div>
              <div style={{ display:"flex", justifyContent:"flex-end", gap:8, marginTop:4 }}>
                <button onClick={()=>setModalSala(null)} style={{ background:"none", border:`1px solid ${C.border}`, color:C.textMid, borderRadius:7, padding:"8px 16px", fontSize:12, cursor:"pointer" }}>Cancelar</button>
                <button onClick={guardarSala} disabled={!formSala.nombre.trim()} style={{ background:"#0A2540", color:"#fff", border:"none", borderRadius:7, padding:"8px 20px", fontSize:13, fontWeight:600, cursor:"pointer" }}>Guardar</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}



function PantallaSubscripcion({ session, onPagar }) {
  const t = useT();
  const [cargando, setCargando] = useState(false);

  const iniciarPago = async () => {
    setCargando(true);
    try {
      const res = await fetch("/api/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${session.access_token}` },
        body: JSON.stringify({}),
      });
      const { url, error } = await res.json();
      if (error) throw new Error(error);
      window.location.href = url;
    } catch(e) {
    }
    setCargando(false);
  };

  return (
    <div style={{ minHeight:"100vh", background:C.bg, display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
      <div style={{ width:460, background:C.bgCard, borderRadius:20, padding:"48px 40px", boxShadow:"0 32px 80px rgba(0,0,0,0.1)", textAlign:"center" }}>
        <img src={LOGO_B64} alt="FastRevenue" style={{ height:52, marginBottom:24 }} />
        <h1 style={{ fontFamily:"'Plus Jakarta Sans',sans-serif", fontSize:26, fontWeight:800, color:C.text, marginBottom:10 }}>{t("empieza_gratis")}</h1>
        <p style={{ fontSize:14, color:C.textMid, lineHeight:1.7, marginBottom:32 }}>
          {t("acceso_completo")}<br/>
          {t("precio_sub")}
        </p>
        <div style={{ background:C.bg, borderRadius:12, padding:"20px 24px", marginBottom:28, textAlign:"left" }}>
          {[t("feat_dashboard"),t("feat_pickup"),t("feat_presupuesto"),t("feat_pdf")].map((f,i) => (
            <div key={i} style={{ display:"flex", alignItems:"center", gap:10, marginBottom: i<3?10:0 }}>
              <span style={{ color:C.green, fontWeight:700, fontSize:14 }}>✓</span>
              <span style={{ fontSize:13, color:C.text }}>{f}</span>
            </div>
          ))}
        </div>
        <button onClick={iniciarPago} disabled={cargando}
          style={{ width:"100%", padding:"14px", borderRadius:10, border:"none", background:C.accent, color:"#fff", fontSize:15, fontWeight:700, cursor:cargando?"not-allowed":"pointer", fontFamily:"'Plus Jakarta Sans',sans-serif", marginBottom:12 }}>
          {cargando ? t("redirigiendo") : t("empezar_prueba")}
        </button>
        <button onClick={() => supabase.auth.signOut()} style={{ background:"none", border:"none", color:C.textLight, fontSize:12, cursor:"pointer" }}>
          {t("cerrar_sesion")}
        </button>
      </div>
    </div>
  );
}

function OnboardingOverlay({ step, onNext, onSkip }) {
  const t = useT();
  const STEPS = [
    { target: "ob-importar",      titleKey: "ob0_title", textKey: "ob0_text" },
    { target: "ob-nav-dashboard", titleKey: "ob1_title", textKey: "ob1_text" },
    { target: "ob-nav-pickup",    titleKey: "ob2_title", textKey: "ob2_text" },
    { target: "ob-nav-budget",    titleKey: "ob3_title", textKey: "ob3_text" },
    { target: "ob-nav-grupos",    titleKey: "ob4_title", textKey: "ob4_text" },
  ];

  const [rect, setRect] = useState(null);
  const s = STEPS[step];

  useEffect(() => {
    const update = () => {
      const el = document.getElementById(s.target);
      if (el) setRect(el.getBoundingClientRect());
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [step]);

  if (!rect) return null;

  const PAD = 8;
  const sL = rect.left - PAD, sT = rect.top - PAD, sW = rect.width + PAD * 2, sH = rect.height + PAD * 2;
  const TW = 280;
  let tLeft = sL + sW / 2 - TW / 2;
  const tTop = sT + sH + 14;
  tLeft = Math.max(12, Math.min(tLeft, window.innerWidth - TW - 12));
  const arrowX = Math.max(20, Math.min((sL + sW / 2) - tLeft, TW - 20));

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 9999 }}>
      <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", cursor: "default" }} onClick={onNext}>
        <defs>
          <mask id="ob-spot">
            <rect width="100%" height="100%" fill="white" />
            <rect x={sL} y={sT} width={sW} height={sH} rx={8} fill="black" />
          </mask>
        </defs>
        <rect width="100%" height="100%" fill="rgba(10,37,64,0.65)" mask="url(#ob-spot)" />
      </svg>
      <div style={{ position: "fixed", left: tLeft, top: tTop, width: TW, background: "#fff", borderRadius: 12, padding: "18px 20px 16px", boxShadow: "0 12px 40px rgba(0,0,0,0.25)", animation: "fadeUp 0.2s ease" }}>
        <div style={{ position: "absolute", top: -8, left: arrowX - 8, width: 16, height: 8, overflow: "hidden" }}>
          <div style={{ width: 12, height: 12, background: "#fff", transform: "rotate(45deg)", margin: "3px auto 0", boxShadow: "-2px -2px 4px rgba(0,0,0,0.06)" }} />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: C.accent, textTransform: "uppercase", letterSpacing: 1.5 }}>{t("ob_paso")} {step + 1} {t("ob_de")} {STEPS.length}</span>
          <button onClick={(e) => { e.stopPropagation(); onSkip(); }} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 11, color: C.textLight, padding: 0 }}>{t("ob_omitir")}</button>
        </div>
        <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 18, fontWeight: 700, color: C.text, marginBottom: 6 }}>{t(s.titleKey)}</p>
        <p style={{ fontSize: 13, color: C.textMid, lineHeight: 1.6, marginBottom: 16 }}>{t(s.textKey)}</p>
        <button onClick={(e) => { e.stopPropagation(); onNext(); }} style={{ width: "100%", background: C.accent, color: "#fff", border: "none", borderRadius: 8, padding: "10px", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
          {step < STEPS.length - 1 ? t("ob_siguiente") : t("ob_empezar")}
        </button>
      </div>
    </div>
  );
}

function LiveClock({ lang }) {
  const [ahora, setAhora] = useState(new Date());
  useEffect(() => { const id = setInterval(() => setAhora(new Date()), 1000); return () => clearInterval(id); }, []);
  return (
    <span style={{ display:"flex", alignItems:"center", gap:5 }}>
      <span style={{ fontSize: 11, color: "#0A0A0A", fontWeight: 600, letterSpacing: 0.5, fontVariantNumeric:"tabular-nums" }}>
        {ahora.toLocaleTimeString(lang === "en" ? "en-GB" : lang === "fr" ? "fr-FR" : "es-ES", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
      </span>
      <span style={{ fontSize: 9, color: "#666", fontWeight: 600, background: "#F0F0F0", borderRadius: 3, padding: "1px 4px", letterSpacing: 0.5 }}>
        {ahora.toLocaleTimeString("en-GB", { timeZoneName: "short" }).split(" ").pop()}
      </span>
    </span>
  );
}

function ModalConfigUnificado({ datos, session, navHidden, toggleNavHidden, navRestrictions, onSaveRestrictions, initialTab, onClose, onGuardado, barColor, onOpenColorPicker }) {
  const t = useT();
  const [tab, setTab] = React.useState(initialTab || "datos");
  const [unlocked, setUnlocked] = React.useState(() => sessionStorage.getItem("fr_settings_unlocked") === "1");
  const [hForm, setHForm] = React.useState({ nombre: datos.hotel?.nombre||"", ciudad: datos.hotel?.ciudad||"", habitaciones: datos.hotel?.habitaciones||"" });
  const [hGuardando, setHGuardando] = React.useState(false);
  const [hOk, setHOk] = React.useState(false);
  const [enviandoEmail, setEnviandoEmail] = React.useState(false);
  const [okEmail, setOkEmail] = React.useState(false);
  const [errorEmail, setErrorEmail] = React.useState("");
  const [pin, setPin] = React.useState("");
  const [pinError, setPinError] = React.useState("");
  const [pinLoading, setPinLoading] = React.useState(false);
  const [pinInputs, setPinInputs] = React.useState({});
  const [savedKeys, setSavedKeys] = React.useState({});
  const [showPin, setShowPin] = React.useState(false);
  const [showPinKey, setShowPinKey] = React.useState(null);
  const [rememberSettings, setRememberSettings] = React.useState(false);

  const DEFAULT_COMMISSIONS_CFG = {
    "Booking.com": 15, "Expedia": 18, "Hotels.com": 15, "Airbnb": 3,
    "Hotelbeds": 20, "Agoda": 18, "Trip.com": 15, "Directo": 0,
    "Web propia": 2, "Tour operador": 20, "Agencia de viajes": 10,
    "GDS": 12, "Empresa": 0, "Grupos": 0, "Eventos / MICE": 0,
  };
  const [comisiones, setComisiones] = React.useState(() => ({
    ...DEFAULT_COMMISSIONS_CFG,
    ...(datos.hotel?.comisiones_canales || {}),
  }));
  const [comisionesGuardando, setComisionesGuardando] = React.useState(false);
  const [comisionesOk, setComisionesOk] = React.useState(false);

  const inp = { width:"100%", padding:"9px 12px", borderRadius:8, border:`1px solid ${C.border}`, background:C.bg, color:C.text, fontSize:13, fontFamily:"'Plus Jakarta Sans',sans-serif", boxSizing:"border-box", outline:"none" };

  const verificarPin = async () => {
    if (!pin) return;
    setPinLoading(true); setPinError("");
    const { error } = await supabase.auth.signInWithPassword({ email: session.user.email, password: pin });
    setPinLoading(false);
    if (error) { setPinError("Contraseña incorrecta"); return; }
    if (rememberSettings) sessionStorage.setItem("fr_settings_unlocked", "1");
    setUnlocked(true); setPin("");
  };

  const toggleRestriction = (key) => {
    if (navRestrictions[key]) {
      const newR = { ...navRestrictions };
      delete newR[key];
      onSaveRestrictions(newR);
      setPinInputs(p => { const n={...p}; delete n[key]; return n; });
      setSavedKeys(s => { const n={...s}; delete n[key]; return n; });
    } else {
      onSaveRestrictions({ ...navRestrictions, [key]: { type: "password" } });
    }
  };

  const saveRestriction = (key) => {
    const val = (pinInputs[key] || "").replace(/\D/g,"");
    if (val.length !== 4) return;
    onSaveRestrictions({ ...navRestrictions, [key]: { type: "pin", value: val } });
    setSavedKeys(s => ({...s, [key]: true}));
    setTimeout(() => setSavedKeys(s => { const n={...s}; delete n[key]; return n; }), 2000);
  };

  const TABS_CONFIG = [
    { key: "datos", label: "Datos del hotel" },
    { key: "personalizacion", label: "Personalización" },
    { key: "canales", label: "Canales" },
    { key: "restricciones", label: "Restricciones" },
  ];

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.6)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:1000 }}>
      <div style={{ background:C.bgCard, borderRadius:16, padding:"32px 36px", width:480, maxHeight:"85vh", overflowY:"auto", boxShadow:"0 24px 60px rgba(0,0,0,0.2)", fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:24 }}>
          <h2 style={{ fontFamily:"'Plus Jakarta Sans',sans-serif", fontSize:20, fontWeight:700, color:C.text }}>Configuración del hotel</h2>
          <button onClick={onClose} style={{ background:"none", border:`1px solid ${C.border}`, borderRadius:6, width:28, height:28, cursor:"pointer", fontSize:15, color:C.textLight, display:"flex", alignItems:"center", justifyContent:"center", padding:0 }}>✕</button>
        </div>
        {/* Pestañas */}
        <div style={{ display:"flex", gap:6, marginBottom:24 }}>
          {TABS_CONFIG.map(tc => (
            <button key={tc.key} onClick={() => { setTab(tc.key); }}
              style={{ padding:"7px 16px", border:`1.5px solid ${tab===tc.key ? "#111111" : C.border}`, borderRadius:8, background: tab===tc.key ? "#f5f5f5" : "transparent", color: tab===tc.key ? "#111111" : C.textMid, fontSize:12, fontWeight: tab===tc.key ? 700 : 400, cursor:"pointer", fontFamily:"'Plus Jakarta Sans',sans-serif", transition:"all 0.15s", boxShadow: tab===tc.key ? "0 1px 4px rgba(0,0,0,0.06)" : "none" }}>
              {tc.label}
            </button>
          ))}
        </div>

        {/* Pestaña: Datos del hotel */}
        {tab === "datos" && (
          <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
            <div>
              <p style={{ fontSize:11, color:C.textLight, fontWeight:600, marginBottom:5 }}>NOMBRE DEL HOTEL</p>
              <input style={inp} value={hForm.nombre} onChange={e=>setHForm(f=>({...f,nombre:e.target.value}))} placeholder="Nombre del hotel" />
            </div>
            <div>
              <p style={{ fontSize:11, color:C.textLight, fontWeight:600, marginBottom:5 }}>CIUDAD</p>
              <input style={inp} value={hForm.ciudad} onChange={e=>setHForm(f=>({...f,ciudad:e.target.value}))} placeholder="Ciudad" />
            </div>
            <div>
              <p style={{ fontSize:11, color:C.textLight, fontWeight:600, marginBottom:5 }}>NÚMERO DE HABITACIONES</p>
              <input style={inp} type="number" min="1" value={hForm.habitaciones} onChange={e=>setHForm(f=>({...f,habitaciones:e.target.value}))} placeholder="Ej: 110" />
              <p style={{ fontSize:10, color:C.textLight, marginTop:4 }}>Usado para calcular la ocupación en el heatmap y previsiones futuras.</p>
            </div>
            <button disabled={hGuardando||hOk} onClick={async()=>{
              setHGuardando(true);
              await supabase.from("hoteles").update({ nombre:hForm.nombre||null, ciudad:hForm.ciudad||null, habitaciones:parseInt(hForm.habitaciones)||null }).eq("id",session.user.id);
              setHGuardando(false); setHOk(true);
              onGuardado(true);
              setTimeout(()=>{ setHOk(false); }, 1500);
            }} style={{ marginTop:10, width:"100%", padding:"11px", borderRadius:9, border:"none", background:hOk?"#059669":C.accent, color:"#fff", fontSize:14, fontWeight:700, cursor:hGuardando||hOk?"not-allowed":"pointer", fontFamily:"'Plus Jakarta Sans',sans-serif", transition:"background 0.2s" }}>
              {hGuardando ? "Guardando..." : hOk ? "✓ Guardado" : "Guardar cambios"}
            </button>

            {/* Envío de informe de prueba */}
            <div style={{ borderTop:`1px solid ${C.border}`, paddingTop:16, marginTop:6 }}>
              <p style={{ fontSize:11, color:C.textLight, fontWeight:600, marginBottom:6 }}>CORREO DIARIO</p>
              <p style={{ fontSize:12, color:C.textMid, marginBottom:10 }}>Envía el informe con los datos del último día registrado para verificar que el correo llega correctamente.</p>
              <button disabled={enviandoEmail || okEmail} onClick={async () => {
                setEnviandoEmail(true); setErrorEmail("");
                try {
                  const { data: ultimoDia } = await supabase.from("produccion_diaria")
                    .select("*").eq("hotel_id", session.user.id).order("fecha", { ascending: false }).limit(1).maybeSingle();
                  if (!ultimoDia) throw new Error("Sin datos de producción registrados. Importa o introduce datos primero.");
                  const mesActual = parseInt(ultimoDia.fecha.split('-')[1]);
                  const anioActual = parseInt(ultimoDia.fecha.split('-')[0]);
                  const mesStr = String(mesActual).padStart(2,'0');
                  const inicioMes = `${anioActual}-${mesStr}-01`;
                  const inicioSig = mesActual === 12 ? `${anioActual+1}-01-01` : `${anioActual}-${String(mesActual+1).padStart(2,'0')}-01`;
                  const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
                  const [{ data: datosMes }, { data: pickupRows }, { data: pptoData }] = await Promise.all([
                    supabase.from("produccion_diaria").select("fecha,hab_ocupadas,hab_disponibles,revenue_hab,revenue_fnb,revenue_total").eq("hotel_id", session.user.id).gte("fecha", inicioMes).lt("fecha", inicioSig).order("fecha", { ascending: true }),
                    supabase.from("pickup_entries").select("num_reservas,precio_total,estado").eq("hotel_id", session.user.id).eq("fecha_pickup", ultimoDia.fecha),
                    supabase.from("presupuesto").select("rev_total_ppto,adr_ppto").eq("hotel_id", session.user.id).eq("mes", mesActual).eq("anio", anioActual).maybeSingle(),
                  ]);
                  let nuevas = 0, cancels = 0, revPickup = 0;
                  for (const p of (pickupRows || [])) { const nr = p.num_reservas||1; if (p.estado==='cancelada') cancels+=nr; else { nuevas+=nr; revPickup+=p.precio_total||0; } }
                  let acum = 0;
                  const revenueAcumulado = (datosMes||[]).map(d => { acum += d.revenue_hab||0; return { dia: parseInt(d.fecha.split('-')[2]), acum: Math.round(acum) }; });
                  let totHabOcu=0, totHabDisp=0, totRevHab=0, totRevTotal=0;
                  for (const d of (datosMes||[])) { if (d.hab_disponibles>0) { totHabOcu+=d.hab_ocupadas||0; totHabDisp+=d.hab_disponibles||0; totRevHab+=d.revenue_hab||0; totRevTotal+=d.revenue_total||0; } }
                  const occ = ultimoDia.hab_disponibles>0 ? ultimoDia.hab_ocupadas/ultimoDia.hab_disponibles*100 : null;
                  const adr = ultimoDia.adr ?? (ultimoDia.hab_ocupadas>0&&ultimoDia.revenue_hab ? ultimoDia.revenue_hab/ultimoDia.hab_ocupadas : null);
                  const revpar = ultimoDia.revpar ?? (ultimoDia.hab_disponibles>0&&ultimoDia.revenue_hab ? ultimoDia.revenue_hab/ultimoDia.hab_disponibles : null);
                  const revTotalEff_t = ultimoDia.revenue_total || ((ultimoDia.revenue_hab||0)+(ultimoDia.revenue_fnb||0)) || null;
                  const trevpar = ultimoDia.trevpar ?? (ultimoDia.hab_disponibles>0&&revTotalEff_t ? revTotalEff_t/ultimoDia.hab_disponibles : null);
                  const totRevTotalEff_t = totRevTotal || (totRevHab + (datosMes||[]).reduce((s,d)=>s+(d.revenue_fnb||0),0)) || 0;
                  const isOTA_t=c=>!['directo','web','empresa','grupo','mice','tour','agencia','gds','evento'].some(k=>(c||'').toLowerCase().includes(k));
                  const normC_t=c=>{const lc=(c||'').toLowerCase().trim();if(lc.includes('directo')||lc.includes('teléfono')||lc.includes('email'))return 'Directo';if(lc.includes('web'))return 'Web propia';if(lc.includes('empresa')||lc.includes('corporativo'))return 'Empresa';if(lc.includes('mice')||lc.includes('evento'))return 'Eventos/MICE';if(lc.includes('grupo'))return 'Grupos';return c||'Directo';};
                  const cMap_t={};let totC_t=0;
                  for(const p of(pickupRows||[])){if((p.estado||'')==='cancelada')continue;const peso=p.precio_total||(p.num_reservas||1);const key=isOTA_t(p.canal)?'OTAs':normC_t(p.canal);cMap_t[key]=(cMap_t[key]||0)+peso;totC_t+=peso;}
                  const canalesRevenue_t=Object.entries(cMap_t).filter(([,v])=>v>0).sort((a,b)=>b[1]-a[1]).map(([canal,revenue])=>({canal,revenue,pct:totC_t>0?Math.round(revenue/totC_t*100):0}));
                  const resp = await fetch('/api/daily-email', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` },
                    body: JSON.stringify({
                      email: session.user.email,
                      hotelNombre: datos.hotel?.nombre || null,
                      kpis: { fecha: ultimoDia.fecha, mesNombre: MESES[mesActual-1], occ, adr, revpar, trevpar, hab_ocupadas: ultimoDia.hab_ocupadas, hab_disponibles: ultimoDia.hab_disponibles, pickup_neto: nuevas, cancelaciones: cancels, revenue_pickup_ayer: revPickup||null, revenueAcumulado, presupuestoMensual: pptoData?.rev_total_ppto??null, avg_occ: totHabDisp>0?totHabOcu/totHabDisp*100:null, avg_adr: totHabOcu>0?totRevHab/totHabOcu:null, avg_revpar: totHabDisp>0?totRevHab/totHabDisp:null, avg_trevpar: totHabDisp>0&&totRevTotalEff_t>0?totRevTotalEff_t/totHabDisp:null, revHabAyer: ultimoDia.revenue_hab||0, revFnbAyer: ultimoDia.revenue_fnb||0, canalesRevenue: canalesRevenue_t, revGruposAyer: 0, revIndividualAyer: ultimoDia.revenue_hab||0, adrPpto: pptoData?.adr_ppto??null, gruposProximos: [] },
                    }),
                  });
                  const json = await resp.json();
                  if (!resp.ok) throw new Error(json.error || `HTTP ${resp.status}`);
                  setOkEmail(true); setTimeout(() => setOkEmail(false), 4000);
                } catch(e) { setErrorEmail(e.message); }
                setEnviandoEmail(false);
              }} style={{ width:"100%", padding:"10px", borderRadius:8, border:`1px solid ${C.border}`, background: okEmail ? C.greenLight : "transparent", color: okEmail ? C.green : C.text, fontSize:13, fontWeight:600, cursor: enviandoEmail||okEmail ? "not-allowed" : "pointer", fontFamily:"'Plus Jakarta Sans',sans-serif", transition:"all .2s" }}>
                {enviandoEmail ? "Enviando..." : okEmail ? "✓ Correo enviado" : "Enviar correo de prueba"}
              </button>
              {errorEmail && <p style={{ fontSize:11, color:C.red, marginTop:6 }}>{errorEmail}</p>}
            </div>
          </div>
        )}

        {/* Pestaña: Personalización */}
        {tab === "personalizacion" && (
          <div>
            <p style={{ fontSize:12, color:C.textMid, marginBottom:20 }}>Activa o desactiva las pestañas que quieres ver en la barra de navegación.</p>

            {/* Color barra superior */}
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"10px 14px", borderRadius:8, border:`1.5px solid ${C.border}`, background:C.bg, marginBottom:16 }}>
              <span style={{ fontSize:13, fontWeight:600, color:C.text }}>Color de barra superior</span>
              <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                <div style={{ width:22, height:22, borderRadius:5, background:barColor, border:"1.5px solid rgba(0,0,0,0.18)", flexShrink:0 }} />
                <button onClick={onOpenColorPicker} style={{ padding:"5px 14px", borderRadius:7, border:`1.5px solid #111111`, background:"#f5f5f5", color:"#111111", fontSize:12, fontWeight:600, cursor:"pointer", fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
                  Cambiar
                </button>
              </div>
            </div>

            <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
              {NAV.map(n => {
                const isVisible = !navHidden.includes(n.key);
                const isLast = isVisible && NAV.filter(nav => !navHidden.includes(nav.key)).length === 1;
                return (
                  <label key={n.key} style={{ display:"flex", alignItems:"center", gap:12, padding:"10px 14px", borderRadius:8, border:`1.5px solid ${isVisible ? C.accent : C.border}`, background: isVisible ? C.accentLight : C.bg, cursor: isLast ? "not-allowed" : "pointer", opacity: isLast ? 0.5 : 1, transition:"all 0.15s" }}>
                    <input type="checkbox" checked={isVisible} disabled={isLast} onChange={() => toggleNavHidden(n.key)} style={{ width:15, height:15, accentColor:C.accent, cursor: isLast ? "not-allowed" : "pointer", flexShrink:0 }} />
                    <span style={{ fontSize:13, fontWeight: isVisible ? 600 : 400, color: isVisible ? C.text : C.textMid }}>{t(n.labelKey)}</span>
                  </label>
                );
              })}
            </div>
          </div>
        )}

        {/* Pestaña: Canales */}
        {tab === "canales" && (
          <div style={{ display:"flex", flexDirection:"column", gap:0 }}>
            <p style={{ fontSize:12, color:C.textMid, marginBottom:16 }}>Configura el % de comisión de cada canal. Se usa para calcular el coste neto de distribución en Reservas.</p>
            <div style={{ border:`1px solid ${C.border}`, borderRadius:10, overflow:"hidden", marginBottom:16 }}>
              <table style={{ width:"100%", borderCollapse:"collapse" }}>
                <thead>
                  <tr style={{ background:C.bg }}>
                    <th style={{ padding:"8px 14px", textAlign:"left", fontSize:10, color:C.textLight, fontWeight:600, textTransform:"uppercase", letterSpacing:"1px" }}>Canal</th>
                    <th style={{ padding:"8px 14px", textAlign:"right", fontSize:10, color:C.textLight, fontWeight:600, textTransform:"uppercase", letterSpacing:"1px" }}>Comisión %</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(comisiones).map(([canal, pct], i, arr) => (
                    <tr key={canal} style={{ borderBottom: i < arr.length-1 ? `1px solid ${C.border}` : "none" }}>
                      <td style={{ padding:"9px 14px", fontSize:13, color:C.text, fontWeight:500 }}>{canal}</td>
                      <td style={{ padding:"7px 14px", textAlign:"right" }}>
                        <div style={{ display:"flex", alignItems:"center", justifyContent:"flex-end", gap:4 }}>
                          <input type="number" min="0" max="100" step="0.5"
                            value={pct}
                            onChange={e => setComisiones(c => ({...c, [canal]: parseFloat(e.target.value)||0}))}
                            style={{ width:60, padding:"5px 8px", borderRadius:6, border:`1px solid ${C.border}`, background:C.bg, color:C.text, fontSize:13, textAlign:"right", fontFamily:"'Plus Jakarta Sans',sans-serif", outline:"none" }}
                          />
                          <span style={{ fontSize:12, color:C.textMid, width:14 }}>%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button disabled={comisionesGuardando||comisionesOk} onClick={async()=>{
              setComisionesGuardando(true);
              await supabase.from("hoteles").update({ comisiones_canales: comisiones }).eq("id", session.user.id);
              setComisionesGuardando(false); setComisionesOk(true);
              onGuardado(true);
              setTimeout(()=>{ setComisionesOk(false); }, 1500);
            }} style={{ width:"100%", padding:"11px", borderRadius:9, border:"none", background:comisionesOk?"#059669":C.accent, color:"#fff", fontSize:14, fontWeight:700, cursor:comisionesGuardando||comisionesOk?"not-allowed":"pointer", fontFamily:"'Plus Jakarta Sans',sans-serif", transition:"background 0.2s" }}>
              {comisionesGuardando ? "Guardando..." : comisionesOk ? "✓ Guardado" : "Guardar comisiones"}
            </button>
          </div>
        )}

        {/* Pestaña: Restricciones */}
        {tab === "restricciones" && (
          <div>
            <p style={{ fontSize:12, color:C.textMid, marginBottom:20 }}>Protege el acceso a pestañas con contraseña o código de 4 dígitos.</p>
            <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
              {NAV.map(n => {
                const isRestricted = !!navRestrictions[n.key];
                const restriction = navRestrictions[n.key];
                const pinVal = pinInputs[n.key] || "";
                return (
                  <div key={n.key} style={{ borderRadius:10, border:`1.5px solid ${isRestricted ? "#111111" : C.border}`, overflow:"hidden", transition:"all 0.15s", boxShadow: isRestricted ? "0 2px 8px rgba(0,0,0,0.10)" : "none" }}>
                    <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"11px 14px", background: isRestricted ? "#e8e8e8" : C.bg, cursor:"pointer", transition:"background 0.15s" }}
                      onClick={() => toggleRestriction(n.key)}
                      onMouseEnter={e => { if (!isRestricted) { e.currentTarget.style.background="#f5f5f5"; e.currentTarget.parentElement.style.border="1.5px solid #111111"; e.currentTarget.parentElement.style.boxShadow="0 4px 12px rgba(0,0,0,0.08)"; }}}
                      onMouseLeave={e => { if (!isRestricted) { e.currentTarget.style.background=C.bg; e.currentTarget.parentElement.style.border=`1.5px solid ${C.border}`; e.currentTarget.parentElement.style.boxShadow="none"; }}}>
                      <span style={{ fontSize:13, fontWeight: isRestricted ? 600 : 400, color: "#111111" }}>{t(n.labelKey)}</span>
                      <span style={{ display:"flex", alignItems:"center", justifyContent:"center", width:30, height:30, borderRadius:7, background: isRestricted ? "#111111" : "transparent", border:`1.5px solid ${isRestricted ? "#111111" : C.border}`, flexShrink:0, transition:"all 0.15s" }}>
                        {isRestricted
                          ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                          : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#888888" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M17 11V7a5 5 0 0 0-9.9-1"/></svg>}
                      </span>
                    </div>
                    {isRestricted && (
                      <div style={{ padding:"14px", borderTop:`1px solid ${C.border}`, background:C.bgCard }}>
                        <p style={{ fontSize:11, color:C.textLight, fontWeight:600, marginBottom:10, letterSpacing:0.5 }}>MÉTODO DE ACCESO</p>
                        <div style={{ display:"flex", flexDirection:"column", gap:8, marginBottom:12 }}>
                          <label style={{ display:"flex", alignItems:"center", gap:8, cursor:"pointer" }}>
                            <input type="radio" name={`rest-${n.key}`} checked={restriction.type === "password"} onChange={() => onSaveRestrictions({ ...navRestrictions, [n.key]: { type: "password" } })} style={{ accentColor:C.accent }} />
                            <span style={{ fontSize:12, color:C.text }}>Contraseña de acceso</span>
                          </label>
                          <label style={{ display:"flex", alignItems:"center", gap:8, cursor:"pointer" }}>
                            <input type="radio" name={`rest-${n.key}`} checked={restriction.type === "pin"} onChange={() => onSaveRestrictions({ ...navRestrictions, [n.key]: { type: "pin", value: restriction.value || "" } })} style={{ accentColor:C.accent }} />
                            <span style={{ fontSize:12, color:C.text }}>Código de 4 dígitos</span>
                          </label>
                        </div>
                        {restriction.type === "pin" && (
                          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                            <input type={showPinKey === n.key ? "text" : "password"} inputMode="numeric" maxLength={4} placeholder="····" value={pinVal}
                              onChange={e => { const v = e.target.value.replace(/\D/g,"").slice(0,4); setPinInputs(p => ({...p, [n.key]: v})); }}
                              style={{ width:90, padding:"9px 0", borderRadius:8, border:`1.5px solid ${C.border}`, background:C.bg, color:C.text, fontSize:20, letterSpacing:10, fontFamily:"monospace", outline:"none", textAlign:"center" }} />
                            <button onMouseDown={e=>{e.preventDefault();setShowPinKey(n.key);}} onMouseUp={()=>setShowPinKey(null)} onMouseLeave={()=>setShowPinKey(null)} onTouchStart={e=>{e.preventDefault();setShowPinKey(n.key);}} onTouchEnd={()=>setShowPinKey(null)}
                              style={{ background:"none", border:"none", cursor:"pointer", color:C.textLight, padding:4, display:"flex", alignItems:"center", userSelect:"none", WebkitUserSelect:"none", flexShrink:0 }}>
                              {showPinKey === n.key
                                ? <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                                : <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>}
                            </button>
                            <button disabled={pinVal.length!==4} onClick={() => saveRestriction(n.key)}
                              style={{ padding:"8px 14px", borderRadius:8, border:"none", background:pinVal.length===4?C.accent:"#ccc", color:"#fff", fontSize:12, fontWeight:600, cursor:pinVal.length===4?"pointer":"not-allowed", fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
                              Guardar código
                            </button>
                            {savedKeys[n.key] && <span style={{ fontSize:11, color:C.green, fontWeight:600 }}>✓ Guardado</span>}
                            {!savedKeys[n.key] && restriction.value && <span style={{ fontSize:11, color:C.textLight }}>✓ Activo</span>}
                          </div>
                        )}
                        {restriction.type === "password" && (
                          <p style={{ fontSize:11, color:C.textMid, fontStyle:"italic" }}>Se usará la contraseña de tu cuenta para desbloquear esta pestaña.</p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState(() => localStorage.getItem("fr_view") || "dashboard");
  const [gruposSubVista, setGruposSubVista] = useState(() => localStorage.getItem("fr_grupos_subvista") || "grupos");
  const cambiarGruposSubVista = (v) => { setGruposSubVista(v); localStorage.setItem("fr_grupos_subvista", v); };

  const hoy = new Date();
  const [mesSel,  setMesSel]  = useState(() => {
    const v = localStorage.getItem("rm_mes"), a = localStorage.getItem("rm_anio");
    if (v !== null && a !== null) {
      const sM = parseInt(v), sA = parseInt(a), cM = hoy.getMonth(), cA = hoy.getFullYear();
      if (sA < cA || (sA === cA && sM < cM)) return cM; // mes guardado ya pasó → avanzar al mes actual
      return sM;
    }
    return hoy.getMonth();
  });
  const [anioSel, setAnioSel] = useState(() => {
    const v = localStorage.getItem("rm_mes"), a = localStorage.getItem("rm_anio");
    if (v !== null && a !== null) {
      const sM = parseInt(v), sA = parseInt(a), cM = hoy.getMonth(), cA = hoy.getFullYear();
      if (sA < cA || (sA === cA && sM < cM)) return cA;
      return sA;
    }
    return hoy.getFullYear();
  });
  const [importar, setImportar] = useState(false);
  const [suscripcion, setSuscripcion] = useState(null);
  const [cargandoSub, setCargandoSub] = useState(true);
  const [confirmCancelar, setConfirmCancelar] = useState(false);
  const [cancelandoSub, setCancelandoSub] = useState(false);
  const [enviandoInformePrueba, setEnviandoInformePrueba] = useState(false);
  const [previsualizandoDiario, setPrevisualizandoDiario] = useState(false);
  const [okInformePrueba, setOkInformePrueba] = useState(false);
  const [errorInformePrueba, setErrorInformePrueba] = useState("");
  const [toast, setToast] = useState(null); // { msg, ok }
  const showToast = (msg, ok=true) => { setToast({ msg, ok }); setTimeout(() => setToast(null), ok ? 3500 : 6000); };
  const [alertasDismissed, setAlertasDismissed] = useState(() => sessionStorage.getItem("fr_alertas_dismissed") === "1");
  const [alertasExpanded, setAlertasExpanded] = useState(false);
  const [datos, setDatos] = useState(() => {
    try {
      const cached = sessionStorage.getItem("fr_datos_cache_v4");
      if (cached) return { ...JSON.parse(cached), session: null };
    } catch(_) {}
    return { produccion: [], presupuesto: [] };
  });
  const [cargandoDatos, setCargandoDatos] = useState(false);

  const alertasFaltantes = useMemo(() => {
    const produccion = datos.produccion || [];
    const pickup = (datos.pickupEntries || []).filter(e => !e._grupo);
    const pad2 = n => String(n).padStart(2, "0");
    const fechasProd = new Set(produccion.map(d => d.fecha));
    const fechasPickup = new Set(pickup.map(e => e.fecha_pickup).filter(Boolean));
    const todas = [...fechasProd, ...fechasPickup].sort();
    const fechaRef = todas[0];
    if (!fechaRef) return [];
    const hoyD = new Date();
    const result = [];
    for (let i = 1; i <= 30; i++) {
      const d = new Date(hoyD);
      d.setDate(hoyD.getDate() - i);
      const f = `${d.getFullYear()}-${pad2(d.getMonth()+1)}-${pad2(d.getDate())}`;
      if (f < fechaRef) break;
      const sinProd = !fechasProd.has(f);
      const sinPick = !fechasPickup.has(f);
      if (!sinProd && !sinPick) break;
      result.unshift({ fecha: f, sinProd, sinPick });
    }
    return result;
  }, [datos.produccion, datos.pickupEntries]);

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
          sessionStorage.removeItem("fr_datos_cache_v4");
          sessionStorage.removeItem("fr_datos_ts_v4");
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
  const [navOrder, setNavOrder] = useState(() => {
    try {
      const hidden = JSON.parse(localStorage.getItem("fr_nav_hidden") || "[]");
      const s = JSON.parse(localStorage.getItem("fr_nav_order") || "null");
      if (s && Array.isArray(s) && s.every(k => NAV.some(n => n.key === k))) return s;
      return NAV.filter(n => !hidden.includes(n.key)).map(n => n.key);
    } catch {}
    return NAV.map(n => n.key);
  });
  const [navHidden, setNavHidden] = useState(() => {
    try {
      const s = JSON.parse(localStorage.getItem("fr_nav_hidden") || "null");
      if (s && Array.isArray(s)) return s;
    } catch {}
    return [];
  });
  const dragNavKey = useRef(null);
  const [navPreview, setNavPreview] = useState(null);
  const [draggingNavKey, setDraggingNavKey] = useState(null);
  const navSorted = navOrder.map(k => NAV.find(n => n.key === k)).filter(Boolean);
  const navDisplay = navPreview ? navPreview.map(k => NAV.find(n => n.key === k)).filter(Boolean) : navSorted;

  const [gruposSubOrder, setGruposSubOrder] = useState(() => {
    try {
      const s = JSON.parse(localStorage.getItem("fr_grupos_sub_order") || "null");
      if (s && Array.isArray(s) && s.length === GRUPOS_SUB.length) return s;
    } catch {}
    return GRUPOS_SUB.map(n => n.key);
  });
  const dragGruposSubKey = useRef(null);
  const gruposSubPreviewRef = useRef(null);
  const [gruposSubPreview, setGruposSubPreviewState] = useState(null);
  const setGruposSubPreview = (val) => { gruposSubPreviewRef.current = val; setGruposSubPreviewState(val); };
  const [draggingGruposSubKey, setDraggingGruposSubKey] = useState(null);
  const gruposSubSorted = gruposSubOrder.map(k => GRUPOS_SUB.find(n => n.key === k)).filter(Boolean);
  const gruposSubDisplay = gruposSubPreview ? gruposSubPreview.map(k => GRUPOS_SUB.find(n => n.key === k)).filter(Boolean) : gruposSubSorted;

  const CACHE_KEY = "fr_datos_cache_v4";
  const CACHE_TS_KEY = "fr_datos_ts_v4";

  const cargarDatos = async (forzar = false) => {
    // Si no forzamos, intentar usar caché
    if (!forzar) {
      try {
        const cached = sessionStorage.getItem(CACHE_KEY);
        const ts = sessionStorage.getItem(CACHE_TS_KEY);
        if (cached && ts) {
          const parsed = JSON.parse(cached);
          parsed.session = session;
          // Solo actualizar si producción no estaba ya cargada (evita re-render y parpadeo)
          setDatos(prev => (prev.produccion?.length > 0 ? { ...prev, session } : parsed));
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

    // Limpiar una sola vez entradas de pickup con canales de grupo/evento/mice
    if (!localStorage.getItem('cleanup_grupo_canal_v1')) {
      await Promise.all([
        supabase.from("pickup_entries").delete().eq("hotel_id", session.user.id).ilike("canal", "%grupo%"),
        supabase.from("pickup_entries").delete().eq("hotel_id", session.user.id).ilike("canal", "%mice%"),
        supabase.from("pickup_entries").delete().eq("hotel_id", session.user.id).ilike("canal", "%evento%"),
      ]);
      localStorage.setItem('cleanup_grupo_canal_v1', '1');
    }

    setCargandoDatos(true);
    const [{ data: produccion }, { data: presupuesto }, { data: hotelData }, { data: gruposData }] = await Promise.all([
      supabase.from("produccion_diaria").select("*").eq("hotel_id", session.user.id).order("fecha"),
      supabase.from("presupuesto").select("*").eq("hotel_id", session.user.id).order("mes"),
      supabase.from("hoteles").select("nombre, ciudad, habitaciones, comisiones_canales").eq("id", session.user.id).maybeSingle(),
      supabase.from("grupos_eventos").select("*").eq("hotel_id", session.user.id).order("fecha_inicio"),
    ]);
    // Pickup separado — carga en paralelo para máxima velocidad
    let pickupEntries = [];
    try {
      const { data: pe0, count } = await supabase.from("pickup_entries")
        .select("id, fecha_llegada, fecha_pickup, canal, num_reservas, fecha_salida, noches, precio_total, estado, es_individual, numero_reserva", { count: "exact" })
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
                  .select("id, fecha_llegada, fecha_pickup, canal, num_reservas, fecha_salida, noches, precio_total, estado, es_individual, numero_reserva")
                  .eq("hotel_id", session.user.id)
                  .range((i + 1) * PAGINA, (i + 2) * PAGINA - 1)
                  .then(r => r.data || [])
              )
            )
          : [];
        pickupEntries = [...pe0, ...resto.flat()];
      }
    } catch(_) {}

    // ── Inyectar grupos confirmados como pickup sintético ──
    // Cada noche de estancia del grupo = una entrada por día con hab rooms como num_reservas
    const hoyIso = new Date().toISOString().slice(0, 10);
    const gruposConfirmados = (gruposData || []).filter(g => g.estado === "confirmado" && g.fecha_inicio && g.fecha_fin && g.fecha_confirmacion);
    const pickupGrupos = [];
    for (const g of gruposConfirmados) {
      const ini = new Date(g.fecha_inicio + "T00:00:00");
      const fin = new Date(g.fecha_fin   + "T00:00:00");
      for (let d = new Date(ini); d < fin; d.setDate(d.getDate() + 1)) {
        const fecha = d.toISOString().slice(0, 10);
        pickupGrupos.push({
          fecha_llegada:  fecha,
          fecha_pickup:   g.fecha_confirmacion || hoyIso,
          canal:          "Grupos/Eventos",
          num_reservas:   g.habitaciones || 0,
          fecha_salida:   g.fecha_fin,
          noches:         1,
          precio_total:   g.adr_grupo || 0,
          estado:         "confirmada",
          _grupo:         true,
          _grupoId:       g.id || g.nombre || fecha,
        });
      }
    }
    const pickupConGrupos = [...pickupEntries, ...pickupGrupos];

    const nuevoDatos = {
      produccion: produccion || [],
      presupuesto: presupuesto || [],
      pickupEntries: pickupConGrupos,
      hotel: hotelData,
      grupos: gruposData || [],
    };

    // Guardar en caché
    try {
      sessionStorage.setItem(CACHE_KEY, JSON.stringify(nuevoDatos));
      sessionStorage.setItem(CACHE_TS_KEY, Date.now().toString());
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
  const toggleNavHidden = (key) => {
    const isHidden = navHidden.includes(key);
    const visibleCount = NAV.length - navHidden.length;
    if (!isHidden && visibleCount <= 1) return;
    const newHidden = isHidden ? navHidden.filter(k => k !== key) : [...navHidden, key];
    const newOrder = isHidden ? [...navOrder, key] : navOrder.filter(k => k !== key);
    setNavHidden(newHidden);
    setNavOrder(newOrder);
    localStorage.setItem("fr_nav_hidden", JSON.stringify(newHidden));
    localStorage.setItem("fr_nav_order", JSON.stringify(newOrder));
    if (!isHidden && key === view) {
      const firstVisible = newOrder[0];
      if (firstVisible) { setView(firstVisible); localStorage.setItem("fr_view", firstVisible); }
    }
  };
  const saveNavRestrictions = (newR) => {
    setNavRestrictions(newR);
    localStorage.setItem("fr_nav_restrictions", JSON.stringify(newR));
  };
  const navigateTo = (key) => {
    const restriction = navRestrictions[key];
    if (restriction && !sessionUnlockedTabs.includes(key)) {
      setRestriccionModal({ key, type: restriction.type });
      setRestriccionInput("");
      setRestriccionError("");
      setRememberRestriccion(false);
    } else {
      setView(key);
      setMesDetalle(null);
      localStorage.setItem("fr_view", key);
    }
  };
  const verificarRestriccion = async () => {
    if (!restriccionInput) return;
    const r = navRestrictions[restriccionModal?.key];
    if (!r) return;
    if (r.type === "pin") {
      if (restriccionInput === r.value) {
        const key = restriccionModal.key;
        if (rememberRestriccion) {
          const updated = [...sessionUnlockedTabs, key];
          setSessionUnlockedTabs(updated);
          sessionStorage.setItem("fr_unlocked_tabs", JSON.stringify(updated));
        }
        setRestriccionModal(null); setRestriccionInput(""); setShowRestriccionInput(false);
        setView(key); setMesDetalle(null); localStorage.setItem("fr_view", key);
      } else {
        setRestriccionError("Código incorrecto");
      }
    } else {
      setRestriccionLoading(true); setRestriccionError("");
      const { error } = await supabase.auth.signInWithPassword({ email: session.user.email, password: restriccionInput });
      setRestriccionLoading(false);
      if (error) { setRestriccionError("Contraseña incorrecta"); return; }
      const key = restriccionModal.key;
      if (rememberRestriccion) {
        const updated = [...sessionUnlockedTabs, key];
        setSessionUnlockedTabs(updated);
        sessionStorage.setItem("fr_unlocked_tabs", JSON.stringify(updated));
      }
      setRestriccionModal(null); setRestriccionInput(""); setShowRestriccionInput(false);
      setView(key); setMesDetalle(null); localStorage.setItem("fr_view", key);
    }
  };

  // OCC de hoy/ayer para el ticker — misma fuente que el heatmap
  const _occDeTicker = useMemo(() => {
    const produccion = datos.produccion || [];
    const pad = n => String(n).padStart(2,"0");
    const hoy  = new Date();
    const ayer = new Date(hoy); ayer.setDate(hoy.getDate()-1);
    const hoyStr  = `${hoy.getFullYear()}-${pad(hoy.getMonth()+1)}-${pad(hoy.getDate())}`;
    const ayerStr = `${ayer.getFullYear()}-${pad(ayer.getMonth()+1)}-${pad(ayer.getDate())}`;
    const habFromProd = produccion.length > 0
      ? Math.round(produccion.reduce((a,r)=>a+(r.hab_disponibles||0),0)/produccion.length)
      : 30;
    const hab = (datos.hotel?.habitaciones && datos.hotel.habitaciones > 0)
      ? datos.hotel.habitaciones : habFromProd;
    const tickerMap = buildHabEnCasaMap(datos.pickupEntries, datos.grupos);
    const occDia = (iso) => {
      const prod = produccion.find(r => r.fecha === iso);
      if (prod?.hab_disponibles > 0)
        return Math.round(prod.hab_ocupadas/prod.hab_disponibles*100);
      const n = tickerMap[iso] || 0;
      return hab > 0 ? Math.round(n/hab*100) : null;
    };
    return { hoyStr, ayerStr, occHoy: occDia(hoyStr), occAyer: occDia(ayerStr) };
  }, [datos.produccion, datos.pickupEntries, datos.grupos, datos.hotel]);

  const [mesDetalle, setMesDetalle] = useState(null);
  const [desgloseMovimiento, setDesgloseMovimiento] = useState(null); // null | "entradas" | "salidas" | "estancias"
  const [generandoPDF, setGenerandoPDF] = useState(false);
  const [mostrarPerfil, setMostrarPerfil] = useState(false);
  useEffect(() => {
    if (!mostrarPerfil) return;
    const handler = (e) => {
      if (!e.target.closest("[data-menu]")) {
        setMostrarPerfil(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [mostrarPerfil]);
  const [perfilSeccion, setPerfilSeccion] = useState(null);
  const EXTRANETS_DEFAULT = [
    { nombre:"Brand Web", url:"" },
    { nombre:"Booking.com", url:"https://admin.booking.com" },
    { nombre:"Expedia", url:"https://www.expediapartnercentral.com" },
  ];
  const [extranets, setExtranets] = useState(() => {
    try { const s = localStorage.getItem("fr_extranets"); return s ? JSON.parse(s) : EXTRANETS_DEFAULT; } catch { return EXTRANETS_DEFAULT; }
  });
  const setExtranetsPersist = (v) => { setExtranets(v); try { localStorage.setItem("fr_extranets", JSON.stringify(v)); } catch {} };
  const [editingExtranetIdx, setEditingExtranetIdx] = useState(null);
  const [extranetForm, setExtranetForm] = useState({ nombre:"", url:"" });
  const [addingExtranet, setAddingExtranet] = useState(false);
  const [newExtranetForm, setNewExtranetForm] = useState({ nombre:"", url:"" });
  const [configInitialTab, setConfigInitialTab] = useState("datos");
  const [navRestrictions, setNavRestrictions] = useState(() => {
    try {
      const s = JSON.parse(localStorage.getItem("fr_nav_restrictions") || "null");
      if (s && typeof s === "object") return s;
    } catch {}
    return {};
  });
  const [barColor, setBarColor] = useState(() => localStorage.getItem("fr_topbar_color") || "#111111");
  const [colorPickerActive, setColorPickerActive] = useState(false);
  const [tempBarColor, setTempBarColor] = useState("#111111");
  const [restriccionModal, setRestriccionModal] = useState(null);
  const [restriccionInput, setRestriccionInput] = useState("");
  const [restriccionError, setRestriccionError] = useState("");
  const [restriccionLoading, setRestriccionLoading] = useState(false);
  const [showRestriccionInput, setShowRestriccionInput] = useState(false);
  const [rememberRestriccion, setRememberRestriccion] = useState(false);
  const [sessionUnlockedTabs, setSessionUnlockedTabs] = useState(() => {
    try { return JSON.parse(sessionStorage.getItem("fr_unlocked_tabs") || "[]"); } catch { return []; }
  });
  const [kpiModalApp, setKpiModalApp] = useState(null);
  const [kpiModal, setKpiModal] = useState(null);

  // Escape global: cierra modales en orden de prioridad o vuelve a la vista anterior
  useEffect(() => {
    const handler = (e) => {
      if (e.key !== "Escape") return;
      if (kpiModal)        { setKpiModal(null); return; }
      if (importar)        { setImportar(false); return; }
      if (restriccionModal) { setRestriccionModal(null); setRestriccionInput(""); setShowRestriccionInput(false); setRestriccionError(""); return; }
      if (perfilSeccion)   { setPerfilSeccion(null); setConfirmCancelar(false); return; }
      if (mesDetalle)           { setMesDetalle(null); return; }
      if (desgloseMovimiento)   { setDesgloseMovimiento(null); return; }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [kpiModal, importar, restriccionModal, perfilSeccion, mesDetalle, desgloseMovimiento]);
  const [lang, setLang] = useState(() => localStorage.getItem("fr_lang") || "es");
  const t = useT();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState(() =>
    localStorage.getItem("fr_onboarding_v1") ? null : 0
  );
  const handleOnboardingNext = () => {
    if (onboardingStep >= 4) { localStorage.setItem("fr_onboarding_v1", "1"); setOnboardingStep(null); }
    else setOnboardingStep(s => s + 1);
  };
  const handleOnboardingSkip = () => { localStorage.setItem("fr_onboarding_v1", "1"); setOnboardingStep(null); };

  const _commonViewProps = { datos, mes: mesSel, anio: anioSel, onGuardado: cargarDatos, onPeriodo: (m,a) => { setMesSel(m); setAnioSel(a); localStorage.setItem("rm_mes", m); localStorage.setItem("rm_anio", a); } };

  if (loading) return (
    <div style={{ minHeight: "100vh", background: C.bgDeep, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ color: C.accent, fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 20 }}>{t("cargando")}</div>
    </div>
  );

  if (!session) return <AuthScreen />;
  if (!cargandoSub && (!suscripcion || suscripcion.estado === "cancelada")) return <PantallaSubscripcion session={session} />;

  return (
    <LangContext.Provider value={lang}>
    <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", background: C.bg, minHeight: "100vh" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; } html, body, #root { width: 100%; min-height: 100vh; }
        ::-webkit-scrollbar { width: 8px; }
        ::-webkit-scrollbar-track { background: ${C.border}; }
        ::-webkit-scrollbar-thumb { background: ${C.textLight}88; border-radius: 4px; }
        ::-webkit-scrollbar-thumb:hover { background: ${C.textLight}; }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: translateY(0); } }
        svg:focus, svg *:focus { outline: none !important; }
        @keyframes pulse-rayo { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.5; transform: scale(0.8); } }
        @keyframes bar-fill-up { from { transform: scaleY(0); } to { transform: scaleY(1); } }
        @keyframes ticker { 0% { transform: translateX(-50%); } 100% { transform: translateX(0); } }
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
          .recharts-wrapper svg { width: 100% !important; outline: none; }
          .recharts-wrapper svg:focus, .recharts-wrapper svg:focus-visible { outline: none; }
          .recharts-surface:focus, .recharts-surface:focus-visible { outline: none; }
          .recharts-wrapper *:focus, .recharts-wrapper *:focus-visible { outline: none; }

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

      {/* Barra principal negra: logo + nav + botones */}
      <header style={{ background: colorPickerActive ? tempBarColor : barColor, position: "sticky", top: 0, zIndex: 101, minHeight: 52, overflow: "visible", transition:"background 0.2s" }}>
        <div style={{ width: "100%", minHeight: 52, display: "flex", alignItems: "center", padding: "0 clamp(12px,4vw,32px)", gap: 6, flexWrap: "nowrap", overflow: "visible" }}>
          {/* Logo */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0, marginRight: 8 }}>
            <img src="/fastrev-icon.png" alt="FastRevenue" style={{ height: 36, width: "auto", filter: "invert(1)" }} />
            <span style={{ fontSize: 16, fontWeight: 800, color: "#ffffff", letterSpacing: 0.5, fontFamily: "'Plus Jakarta Sans', sans-serif", whiteSpace: "nowrap" }}>
              FAST<span style={{ fontWeight: 400 }}>REVENUE</span>
            </span>
            <span style={{ fontSize: 9, fontWeight: 700, color: "rgba(255,255,255,0.55)", letterSpacing: "1.5px", border: "1px solid rgba(255,255,255,0.25)", borderRadius: 4, padding: "2px 5px", lineHeight: 1, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>BETA</span>
          </div>

          {/* Nav links — arrastrables para reordenar */}
          <nav style={{ display: "flex", alignItems: "center", gap: 2 }}>
            {navDisplay.map(n => {
              const isActive = view===n.key;
              return (
                <button key={n.key} id={`ob-nav-${n.key}`}
                  draggable
                  onMouseDown={e => { e.currentTarget.style.cursor = "grabbing"; }}
                  onMouseUp={e => { e.currentTarget.style.cursor = "pointer"; }}
                  onMouseLeave={e => { e.currentTarget.style.cursor = "pointer"; }}
                  onDragStart={e => { dragNavKey.current = n.key; e.dataTransfer.effectAllowed = "move"; setTimeout(() => setDraggingNavKey(n.key), 0); }}
                  onDragEnd={e => { e.currentTarget.style.cursor = "pointer"; if (dragNavKey.current !== null && navPreview) { setNavOrder(navPreview); localStorage.setItem("fr_nav_order", JSON.stringify(navPreview)); } dragNavKey.current = null; setNavPreview(null); setDraggingNavKey(null); }}
                  onDragOver={e => {
                    e.preventDefault();
                    const from = dragNavKey.current;
                    if (!from || from === n.key) return;
                    const base = navPreview || navOrder;
                    const fi = base.indexOf(from), ti = base.indexOf(n.key);
                    if (fi === -1 || ti === -1 || fi === ti) return;
                    const next = [...base];
                    next.splice(fi, 1); next.splice(ti, 0, from);
                    setNavPreview(next);
                  }}
                  onDrop={e => {
                    e.preventDefault();
                    const committed = navPreview || navOrder;
                    setNavOrder(committed);
                    localStorage.setItem("fr_nav_order", JSON.stringify(committed));
                    setNavPreview(null);
                    dragNavKey.current = null;
                  }}
                  onClick={() => { navigateTo(n.key); }}
                  style={{ padding: "6px clamp(6px,2vw,16px)", borderRadius: 7, border: "none", cursor: "pointer", background: isActive ? "rgba(255,255,255,0.12)" : "transparent", color: "#fff", fontSize: "clamp(11px,2.5vw,13px)", fontWeight: isActive ? 700 : 400, fontFamily: "'Plus Jakarta Sans', sans-serif", transition: "background 0.1s", whiteSpace: "nowrap", outline: isActive ? `1.5px solid rgba(255,255,255,0.3)` : "1.5px solid transparent", visibility: draggingNavKey === n.key ? "hidden" : "visible" }}>
                  <span className="topbar-nav-label">{t(n.labelKey)}</span>
                  <span style={{ display:"none" }} className="topbar-nav-icon">{t(n.labelKey).slice(0,3)}</span>
                </button>
              );
            })}
          </nav>

          {/* Botones derecha */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginLeft: "auto" }}>

            {/* Menú Mi Perfil */}
            <div data-menu style={{ position:"relative" }}>
              <button onClick={() => setMostrarPerfil(v=>!v)}
                style={{ display:"flex", alignItems:"center", gap:7, padding:"5px 10px", borderRadius:7, border:"1px solid rgba(255,255,255,0.25)", background:"transparent", color:"#fff", cursor:"pointer", fontSize:13, fontWeight:500, fontFamily:"'Plus Jakarta Sans',sans-serif", transition:"all 0.15s", letterSpacing:0.2 }}>
                <span className="topbar-perfil-label" style={{ color:"#ffffff" }}>{t("mi_perfil")}</span>
              </button>
              {mostrarPerfil && (
                <div style={{ position:"absolute", top:46, right:0, width:256, background:"#ffffff", border:"1.5px solid #111111", borderRadius:12, boxShadow:"0 8px 32px rgba(0,0,0,0.18)", zIndex:200, overflow:"hidden", fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
                  {/* Cabecera usuario */}
                  <div style={{ padding:"14px 18px 12px", borderBottom:"1px solid #F0F0F0" }}>
                    <p style={{ fontSize:10, fontWeight:700, color:"#999", textTransform:"uppercase", letterSpacing:"1px", marginBottom:3 }}>{t("conectado_como")}</p>
                    <p style={{ fontSize:13, fontWeight:600, color:"#111111", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{session.user.email}</p>
                  </div>
                  {/* Opciones */}
                  <div style={{ padding:"6px 0" }}>
                    {[
                      { label:"Configuración del hotel", key:"hotel" },
                      { label:t("suscripcion"),           key:"suscripcion" },
                      { label:t("extranets"),             key:"extranets" },
                      { label:t("informe_mensual"),       key:"informe" },
                      { label:"Vista previa informe diario", key:"preview_diario" },
                      { label:"Enviar informe diario",    key:"informe_diario" },
                    ].map(op => (
                      <button key={op.key} onClick={async () => {
                          if (op.key === "informe") {
                            setMostrarPerfil(false);
                            setGenerandoPDF(true);
                            await generarReportePDF(datos, mesSel, anioSel, datos.hotel?.nombre||"Mi Hotel");
                            setGenerandoPDF(false);
                          } else if (op.key === "informe_diario") {
                            setMostrarPerfil(false);
                            showToast("Enviando informe...", true);
                            try {
                              const { data: ultimoDia } = await supabase.from("produccion_diaria").select("*").eq("hotel_id", session.user.id).order("fecha", { ascending: false }).limit(1).maybeSingle();
                              if (!ultimoDia) throw new Error("Sin datos de producción registrados");
                              const mesActual = parseInt(ultimoDia.fecha.split('-')[1]);
                              const anioActual = parseInt(ultimoDia.fecha.split('-')[0]);
                              const mesStr = String(mesActual).padStart(2,'0');
                              const inicioMes = `${anioActual}-${mesStr}-01`;
                              const inicioSig = mesActual===12 ? `${anioActual+1}-01-01` : `${anioActual}-${String(mesActual+1).padStart(2,'0')}-01`;
                              const mesLM = mesActual===1 ? 12 : mesActual-1;
                              const anioLM = mesActual===1 ? anioActual-1 : anioActual;
                              const inicioMesLM = `${anioLM}-${String(mesLM).padStart(2,'0')}-01`;
                              const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
                              const [{ data: datosMes }, { data: pickupRows }, { data: pptoData }, { data: gruposRows }, { data: datosLM }] = await Promise.all([
                                supabase.from("produccion_diaria").select("fecha,hab_ocupadas,hab_disponibles,revenue_hab,revenue_fnb,revenue_total").eq("hotel_id", session.user.id).gte("fecha", inicioMes).lt("fecha", inicioSig).order("fecha", { ascending: true }),
                                supabase.from("pickup_entries").select("canal,num_reservas,precio_total,estado").eq("hotel_id", session.user.id).eq("fecha_pickup", ultimoDia.fecha),
                                supabase.from("presupuesto").select("rev_total_ppto,adr_ppto,occ_ppto").eq("hotel_id", session.user.id).eq("mes", mesActual).eq("anio", anioActual).maybeSingle(),
                                supabase.from("grupos_eventos").select("nombre,categoria,estado,fecha_inicio,fecha_fin,habitaciones,adr_grupo,revenue_fnb,revenue_sala").eq("hotel_id", session.user.id).neq("estado","cancelado").gte("fecha_fin", ultimoDia.fecha).order("fecha_inicio"),
                                supabase.from("produccion_diaria").select("hab_ocupadas,hab_disponibles,revenue_hab,revenue_fnb,revenue_total").eq("hotel_id", session.user.id).gte("fecha", inicioMesLM).lt("fecha", inicioMes),
                              ]);
                              let nuevas=0, cancels=0, revPickup=0;
                              for (const p of (pickupRows||[])) { const nr=p.num_reservas||1; if (p.estado==='cancelada') cancels+=nr; else { nuevas+=nr; revPickup+=p.precio_total||0; } }
                              let acum=0;
                              const revenueAcumulado = (datosMes||[]).map(d => { acum+=d.revenue_hab||0; return { dia: parseInt(d.fecha.split('-')[2]), acum: Math.round(acum) }; });
                              let totHabOcu=0, totHabDisp=0, totRevHab=0, totRevFnb=0, totRevTotal=0;
                              for (const d of (datosMes||[])) { if (d.hab_disponibles>0) { totHabOcu+=d.hab_ocupadas||0; totHabDisp+=d.hab_disponibles||0; totRevHab+=d.revenue_hab||0; totRevFnb+=d.revenue_fnb||0; totRevTotal+=d.revenue_total||0; } }
                              let lmHabOcu=0, lmHabDisp=0, lmRevHab=0, lmRevFnb=0, lmRevTotal=0;
                              for (const d of (datosLM||[])) { if (d.hab_disponibles>0) { lmHabOcu+=d.hab_ocupadas||0; lmHabDisp+=d.hab_disponibles||0; lmRevHab+=d.revenue_hab||0; lmRevFnb+=d.revenue_fnb||0; lmRevTotal+=d.revenue_total||0; } }
                              const lmRevTotalEff = lmRevTotal || (lmRevHab+lmRevFnb) || 0;
                              const lm_avg_occ    = lmHabDisp>0 ? lmHabOcu/lmHabDisp*100 : null;
                              const lm_avg_adr    = lmHabOcu>0  ? lmRevHab/lmHabOcu : null;
                              const lm_avg_revpar = lmHabDisp>0 ? lmRevHab/lmHabDisp : null;
                              const lm_avg_trevpar= lmHabDisp>0&&lmRevTotalEff>0 ? lmRevTotalEff/lmHabDisp : null;
                              // Canales de ayer (solo las reservas nuevas del día)
                              const normCanalP = c => { const lc=(c||'').toLowerCase().trim(); if(lc.includes('directo')||lc.includes('teléfono')||lc.includes('telefono')||lc.includes('email')) return 'Directo'; if(lc.includes('web')) return 'Web'; if(lc.includes('empresa')||lc.includes('corporativo')) return 'Empresa'; if(lc.includes('mice')||lc.includes('evento')) return 'Eventos/MICE'; if(lc.includes('grupo')) return 'Grupos'; return c||'Otro'; };
                              const isOTA_p = c => !['directo','web','empresa','corporativo','grupo','mice','evento','tour','agencia','gds'].some(k=>(c||'').toLowerCase().includes(k));
                              const canalMap = {}; let totCanalRev = 0;
                              for (const p of (pickupRows||[])) { if((p.estado||'')==='cancelada') continue; const peso=p.precio_total||(p.num_reservas||1); const key=isOTA_p(p.canal)?'OTA':normCanalP(p.canal); canalMap[key]=(canalMap[key]||0)+peso; totCanalRev+=peso; }
                              const canalesRevenue = Object.entries(canalMap).filter(([,v])=>v>0).sort((a,b)=>b[1]-a[1]).map(([canal,revenue])=>({ canal, revenue:Math.round(revenue), pct:totCanalRev>0?Math.round(revenue/totCanalRev*100):0 }));
                              const canalPickupMap = {};
                              for (const p of (pickupRows||[])) { if((p.estado||'')==='cancelada') continue; const key=normCanalP(p.canal); canalPickupMap[key]=(canalPickupMap[key]||0)+(p.num_reservas||1); }
                              const canalesPickup = Object.entries(canalPickupMap).filter(([,v])=>v>0).sort((a,b)=>b[1]-a[1]).map(([canal,reservas])=>({ canal, reservas }));
                              const canalRevMixMap = {};
                              for (const p of (pickupRows||[])) { if((p.estado||'')==='cancelada') continue; const key=normCanalP(p.canal); canalRevMixMap[key]=(canalRevMixMap[key]||0)+(p.precio_total||0); }
                              const canalesRevMix = Object.entries(canalRevMixMap).filter(([,v])=>v>0).sort((a,b)=>b[1]-a[1]).map(([canal,revenue])=>({ canal, revenue:Math.round(revenue) }));
                              // Grupos en casa ayer (1 noche)
                              const gruposAyer = (gruposRows||[]).filter(g => g.estado==='confirmado' && g.fecha_inicio<=ultimoDia.fecha && g.fecha_fin>ultimoDia.fecha);
                              const revGruposAyer = gruposAyer.reduce((s,g) => s+(g.habitaciones||0)*(g.adr_grupo||0), 0);
                              const mkGrupo = g => { const noches=Math.max(1,(new Date(g.fecha_fin+'T00:00:00')-new Date(g.fecha_inicio+'T00:00:00'))/86400000); return { nombre:g.nombre, tipo:g.categoria||"", estado:g.estado, fecha_inicio:g.fecha_inicio, fecha_fin:g.fecha_fin, habitaciones:g.habitaciones||0, revenue:Math.round((g.habitaciones||0)*(g.adr_grupo||0)*noches+(g.revenue_fnb||0)+(g.revenue_sala||0)) }; };
                              const en7Str = new Date(new Date(ultimoDia.fecha+'T00:00:00').getTime()+7*86400000).toISOString().split('T')[0];
                              const gruposProximos = (gruposRows||[]).filter(g => g.estado==='confirmado' && g.fecha_inicio>ultimoDia.fecha && g.fecha_inicio<=en7Str).map(mkGrupo);
                              const proximoConfirmado = (() => { const g=(gruposRows||[]).filter(g=>g.estado==='confirmado'&&g.fecha_inicio>ultimoDia.fecha).sort((a,b)=>a.fecha_inicio.localeCompare(b.fecha_inicio))[0]; return g?mkGrupo(g):null; })();
                              const occ = ultimoDia.hab_disponibles>0 ? ultimoDia.hab_ocupadas/ultimoDia.hab_disponibles*100 : null;
                              const adr = ultimoDia.adr ?? (ultimoDia.hab_ocupadas>0&&ultimoDia.revenue_hab ? ultimoDia.revenue_hab/ultimoDia.hab_ocupadas : null);
                              const revpar = ultimoDia.revpar ?? (ultimoDia.hab_disponibles>0&&ultimoDia.revenue_hab ? ultimoDia.revenue_hab/ultimoDia.hab_disponibles : null);
                              const revTotalEff = ultimoDia.revenue_total || ((ultimoDia.revenue_hab||0) + (ultimoDia.revenue_fnb||0)) || null;
                              const trevpar = ultimoDia.trevpar ?? (ultimoDia.hab_disponibles>0&&revTotalEff ? revTotalEff/ultimoDia.hab_disponibles : null);
                              const totRevTotalEff = totRevTotal || (totRevHab + totRevFnb) || 0;
                              const forecastMes = calcForecastRevStandalone(mesActual-1, anioActual, datos.produccion, datos.pickupEntries, datos.hotel);
                              const _habMap = buildHabEnCasaMap(datos.pickupEntries, datos.grupos);
                              const _habDisp = datos.hotel?.habitaciones || ultimoDia.hab_disponibles || 1;
                              const paceProximos7 = Array.from({length:7},(_,i)=>{ const d=new Date(new Date(ultimoDia.fecha+'T00:00:00').getTime()+(i+1)*86400000); const iso=d.toISOString().split('T')[0]; const hab=_habMap[iso]||0; return { fecha:iso, hab_reservadas:hab, occ_pct:Math.round(hab/_habDisp*100) }; });
                              const kpisPayload = { fecha: ultimoDia.fecha, mesNombre: MESES[mesActual-1], occ, adr, revpar, trevpar, hab_ocupadas: ultimoDia.hab_ocupadas, hab_disponibles: ultimoDia.hab_disponibles, pickup_neto: nuevas, cancelaciones: cancels, revenue_pickup_ayer: revPickup||null, revenueAcumulado, presupuestoMensual: pptoData?.rev_total_ppto??null, avg_occ: totHabDisp>0?totHabOcu/totHabDisp*100:null, avg_adr: totHabOcu>0?totRevHab/totHabOcu:null, avg_revpar: totHabDisp>0?totRevHab/totHabDisp:null, avg_trevpar: totHabDisp>0&&totRevTotalEff>0?totRevTotalEff/totHabDisp:null, lm_avg_occ, lm_avg_adr, lm_avg_revpar, lm_avg_trevpar, revHabAyer: ultimoDia.revenue_hab||0, revFnbAyer: ultimoDia.revenue_fnb||0, canalesRevenue, canalesPickup, canalesRevMix, revGruposAyer: Math.round(revGruposAyer), revIndividualAyer: Math.round(Math.max(0, (ultimoDia.revenue_hab||0)-revGruposAyer)), adrPpto: pptoData?.adr_ppto??null, occPpto: pptoData?.occ_ppto??null, gruposProximos, proximoConfirmado, forecastMes, paceProximos7 };
                              let pdfBase64 = null;
                              try {
                                pdfBase64 = await generarInformeDiarioPDF(kpisPayload, datos.hotel?.nombre||null);
                                if (!pdfBase64) throw new Error("PDF vacío");
                              } catch(pdfErr) {
                                showToast("Aviso: PDF no generado (" + pdfErr.message + ") — enviando sin adjunto", false);
                                await new Promise(r => setTimeout(r, 2000));
                              }
                              const resp = await fetch('/api/daily-email', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` },
                                body: JSON.stringify({ email: session.user.email, hotelNombre: datos.hotel?.nombre||null, kpis: kpisPayload, pdfBase64 }),
                              });
                              const json = await resp.json();
                              if (!resp.ok) throw new Error(json.error || `HTTP ${resp.status}`);
                              showToast("✓ Informe enviado a " + session.user.email, true);
                            } catch(e) { showToast("Error: " + e.message, false); }
                          } else if (op.key === "preview_diario") {
                            setMostrarPerfil(false);
                            setPrevisualizandoDiario(true);
                            try {
                              const { data: ultimoDia } = await supabase.from("produccion_diaria").select("*").eq("hotel_id", session.user.id).order("fecha", { ascending: false }).limit(1).maybeSingle();
                              if (!ultimoDia) throw new Error("Sin datos de producción registrados");
                              const mesActual = parseInt(ultimoDia.fecha.split('-')[1]);
                              const anioActual = parseInt(ultimoDia.fecha.split('-')[0]);
                              const mesStr = String(mesActual).padStart(2,'0');
                              const inicioMes = `${anioActual}-${mesStr}-01`;
                              const inicioSig = mesActual===12 ? `${anioActual+1}-01-01` : `${anioActual}-${String(mesActual+1).padStart(2,'0')}-01`;
                              const mesLM = mesActual===1 ? 12 : mesActual-1;
                              const anioLM = mesActual===1 ? anioActual-1 : anioActual;
                              const inicioMesLM = `${anioLM}-${String(mesLM).padStart(2,'0')}-01`;
                              const MESES_ES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
                              const [{ data: datosMes }, { data: pickupRows }, { data: pptoData }, { data: gruposRows }, { data: datosLM }] = await Promise.all([
                                supabase.from("produccion_diaria").select("fecha,hab_ocupadas,hab_disponibles,revenue_hab,revenue_fnb,revenue_total").eq("hotel_id", session.user.id).gte("fecha", inicioMes).lt("fecha", inicioSig).order("fecha", { ascending: true }),
                                supabase.from("pickup_entries").select("canal,num_reservas,precio_total,estado").eq("hotel_id", session.user.id).eq("fecha_pickup", ultimoDia.fecha),
                                supabase.from("presupuesto").select("rev_total_ppto,adr_ppto,occ_ppto").eq("hotel_id", session.user.id).eq("mes", mesActual).eq("anio", anioActual).maybeSingle(),
                                supabase.from("grupos_eventos").select("nombre,categoria,estado,fecha_inicio,fecha_fin,habitaciones,adr_grupo,revenue_fnb,revenue_sala").eq("hotel_id", session.user.id).neq("estado","cancelado").gte("fecha_fin", ultimoDia.fecha).order("fecha_inicio"),
                                supabase.from("produccion_diaria").select("hab_ocupadas,hab_disponibles,revenue_hab,revenue_fnb,revenue_total").eq("hotel_id", session.user.id).gte("fecha", inicioMesLM).lt("fecha", inicioMes),
                              ]);
                              let nuevas=0, cancels=0, revPickup=0;
                              for (const p of (pickupRows||[])) { const nr=p.num_reservas||1; if (p.estado==='cancelada') cancels+=nr; else { nuevas+=nr; revPickup+=p.precio_total||0; } }
                              let acum=0;
                              const revenueAcumulado = (datosMes||[]).map(d => { acum+=d.revenue_hab||0; return { dia: parseInt(d.fecha.split('-')[2]), acum: Math.round(acum) }; });
                              let totHabOcu=0, totHabDisp=0, totRevHab=0, totRevFnb=0, totRevTotal=0;
                              for (const d of (datosMes||[])) { if (d.hab_disponibles>0) { totHabOcu+=d.hab_ocupadas||0; totHabDisp+=d.hab_disponibles||0; totRevHab+=d.revenue_hab||0; totRevFnb+=d.revenue_fnb||0; totRevTotal+=d.revenue_total||0; } }
                              let lmHabOcu=0, lmHabDisp=0, lmRevHab=0, lmRevFnb=0, lmRevTotal=0;
                              for (const d of (datosLM||[])) { if (d.hab_disponibles>0) { lmHabOcu+=d.hab_ocupadas||0; lmHabDisp+=d.hab_disponibles||0; lmRevHab+=d.revenue_hab||0; lmRevFnb+=d.revenue_fnb||0; lmRevTotal+=d.revenue_total||0; } }
                              const lmRevTotalEff = lmRevTotal || (lmRevHab+lmRevFnb) || 0;
                              const normCanalP = c => { const lc=(c||'').toLowerCase().trim(); if(lc.includes('directo')||lc.includes('teléfono')||lc.includes('telefono')||lc.includes('email')) return 'Directo'; if(lc.includes('web')) return 'Web'; if(lc.includes('empresa')||lc.includes('corporativo')) return 'Empresa'; if(lc.includes('mice')||lc.includes('evento')) return 'Eventos/MICE'; if(lc.includes('grupo')) return 'Grupos'; return c||'Otro'; };
                              const isOTA_p = c => !['directo','web','empresa','corporativo','grupo','mice','evento','tour','agencia','gds'].some(k=>(c||'').toLowerCase().includes(k));
                              const canalMap = {}; let totCanalRev = 0;
                              for (const p of (pickupRows||[])) { if((p.estado||'')==='cancelada') continue; const peso=p.precio_total||(p.num_reservas||1); const key=isOTA_p(p.canal)?'OTA':normCanalP(p.canal); canalMap[key]=(canalMap[key]||0)+peso; totCanalRev+=peso; }
                              const canalesRevenue = Object.entries(canalMap).filter(([,v])=>v>0).sort((a,b)=>b[1]-a[1]).map(([canal,revenue])=>({ canal, revenue:Math.round(revenue), pct:totCanalRev>0?Math.round(revenue/totCanalRev*100):0 }));
                              const canalPickupMap = {};
                              for (const p of (pickupRows||[])) { if((p.estado||'')==='cancelada') continue; const key=normCanalP(p.canal); canalPickupMap[key]=(canalPickupMap[key]||0)+(p.num_reservas||1); }
                              const canalesPickup = Object.entries(canalPickupMap).filter(([,v])=>v>0).sort((a,b)=>b[1]-a[1]).map(([canal,reservas])=>({ canal, reservas }));
                              const canalRevMixMap = {};
                              for (const p of (pickupRows||[])) { if((p.estado||'')==='cancelada') continue; const key=normCanalP(p.canal); canalRevMixMap[key]=(canalRevMixMap[key]||0)+(p.precio_total||0); }
                              const canalesRevMix = Object.entries(canalRevMixMap).filter(([,v])=>v>0).sort((a,b)=>b[1]-a[1]).map(([canal,revenue])=>({ canal, revenue:Math.round(revenue) }));
                              const gruposAyer = (gruposRows||[]).filter(g => g.estado==='confirmado' && g.fecha_inicio<=ultimoDia.fecha && g.fecha_fin>ultimoDia.fecha);
                              const revGruposAyer = gruposAyer.reduce((s,g) => s+(g.habitaciones||0)*(g.adr_grupo||0), 0);
                              const mkGrupo = g => { const noches=Math.max(1,(new Date(g.fecha_fin+'T00:00:00')-new Date(g.fecha_inicio+'T00:00:00'))/86400000); return { nombre:g.nombre, tipo:g.categoria||"", estado:g.estado, fecha_inicio:g.fecha_inicio, fecha_fin:g.fecha_fin, habitaciones:g.habitaciones||0, revenue:Math.round((g.habitaciones||0)*(g.adr_grupo||0)*noches+(g.revenue_fnb||0)+(g.revenue_sala||0)) }; };
                              const en7Str = new Date(new Date(ultimoDia.fecha+'T00:00:00').getTime()+7*86400000).toISOString().split('T')[0];
                              const gruposProximos = (gruposRows||[]).filter(g => g.estado==='confirmado' && g.fecha_inicio>ultimoDia.fecha && g.fecha_inicio<=en7Str).map(mkGrupo);
                              const proximoConfirmado = (() => { const g=(gruposRows||[]).filter(g=>g.estado==='confirmado'&&g.fecha_inicio>ultimoDia.fecha).sort((a,b)=>a.fecha_inicio.localeCompare(b.fecha_inicio))[0]; return g?mkGrupo(g):null; })();
                              const occ = ultimoDia.hab_disponibles>0 ? ultimoDia.hab_ocupadas/ultimoDia.hab_disponibles*100 : null;
                              const adr = ultimoDia.adr ?? (ultimoDia.hab_ocupadas>0&&ultimoDia.revenue_hab ? ultimoDia.revenue_hab/ultimoDia.hab_ocupadas : null);
                              const revpar = ultimoDia.revpar ?? (ultimoDia.hab_disponibles>0&&ultimoDia.revenue_hab ? ultimoDia.revenue_hab/ultimoDia.hab_disponibles : null);
                              const revTotalEff = ultimoDia.revenue_total || ((ultimoDia.revenue_hab||0) + (ultimoDia.revenue_fnb||0)) || null;
                              const trevpar = ultimoDia.trevpar ?? (ultimoDia.hab_disponibles>0&&revTotalEff ? revTotalEff/ultimoDia.hab_disponibles : null);
                              const totRevTotalEff = totRevTotal || (totRevHab + totRevFnb) || 0;
                              const forecastMes = calcForecastRevStandalone(mesActual-1, anioActual, datos.produccion, datos.pickupEntries, datos.hotel);
                              const _habMap2 = buildHabEnCasaMap(datos.pickupEntries, datos.grupos);
                              const _habDisp2 = datos.hotel?.habitaciones || ultimoDia.hab_disponibles || 1;
                              const paceProximos7 = Array.from({length:7},(_,i)=>{ const d=new Date(new Date(ultimoDia.fecha+'T00:00:00').getTime()+(i+1)*86400000); const iso=d.toISOString().split('T')[0]; const hab=_habMap2[iso]||0; return { fecha:iso, hab_reservadas:hab, occ_pct:Math.round(hab/_habDisp2*100) }; });
                              const kpisPayload = { fecha: ultimoDia.fecha, mesNombre: MESES_ES[mesActual-1], occ, adr, revpar, trevpar, hab_ocupadas: ultimoDia.hab_ocupadas, hab_disponibles: ultimoDia.hab_disponibles, pickup_neto: nuevas, cancelaciones: cancels, revenue_pickup_ayer: revPickup||null, revenueAcumulado, presupuestoMensual: pptoData?.rev_total_ppto??null, avg_occ: totHabDisp>0?totHabOcu/totHabDisp*100:null, avg_adr: totHabOcu>0?totRevHab/totHabOcu:null, avg_revpar: totHabDisp>0?totRevHab/totHabDisp:null, avg_trevpar: totHabDisp>0&&totRevTotalEff>0?totRevTotalEff/totHabDisp:null, lm_avg_occ: lmHabDisp>0?lmHabOcu/lmHabDisp*100:null, lm_avg_adr: lmHabOcu>0?lmRevHab/lmHabOcu:null, lm_avg_revpar: lmHabDisp>0?lmRevHab/lmHabDisp:null, lm_avg_trevpar: lmHabDisp>0&&lmRevTotalEff>0?lmRevTotalEff/lmHabDisp:null, revHabAyer: ultimoDia.revenue_hab||0, revFnbAyer: ultimoDia.revenue_fnb||0, canalesRevenue, canalesPickup, canalesRevMix, revGruposAyer: Math.round(revGruposAyer), revIndividualAyer: Math.round(Math.max(0, (ultimoDia.revenue_hab||0)-revGruposAyer)), adrPpto: pptoData?.adr_ppto??null, occPpto: pptoData?.occ_ppto??null, gruposProximos, proximoConfirmado, forecastMes, paceProximos7 };
                              const pdfBase64 = await generarInformeDiarioPDF(kpisPayload, datos.hotel?.nombre||null);
                              if (!pdfBase64) throw new Error("PDF vacío");
                              const bytes = atob(pdfBase64);
                              const buf = new Uint8Array(bytes.length);
                              for (let i=0; i<bytes.length; i++) buf[i] = bytes.charCodeAt(i);
                              const blob = new Blob([buf], { type:"application/pdf" });
                              const url = URL.createObjectURL(blob);
                              window.open(url, "_blank");
                            } catch(e) { showToast("Error: " + e.message, false); }
                            finally { setPrevisualizandoDiario(false); }
                          } else if (op.key === "hotel") {
                            setConfigInitialTab("datos");
                            setPerfilSeccion("config");
                            setMostrarPerfil(false);
                          } else {
                            setPerfilSeccion(op.key);
                            setMostrarPerfil(false);
                          }
                        }}
                        style={{ width:"100%", padding:"9px 18px", background:"transparent", border:"none", cursor:"pointer", fontSize:13, fontWeight:500, color:"#1A1A1A", textAlign:"left" }}
                        onMouseEnter={e=>e.currentTarget.style.background="#F7F7F7"}
                        onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                        {op.key === "informe" && generandoPDF ? t("generando") : op.key === "preview_diario" && previsualizandoDiario ? "Generando..." : op.key === "informe_diario" && enviandoInformePrueba ? "Enviando..." : op.key === "informe_diario" && okInformePrueba ? "✓ Enviado" : op.label}
                      </button>
                    ))}
                  </div>
                  {/* Idioma */}
                  <div style={{ padding:"10px 18px 12px", borderTop:"1px solid #F0F0F0", borderBottom:"1px solid #F0F0F0" }}>
                    <p style={{ fontSize:10, fontWeight:700, color:"#999", textTransform:"uppercase", letterSpacing:"1px", marginBottom:8 }}>{t("idioma") ?? "Idioma"}</p>
                    <div style={{ display:"flex", gap:6 }}>
                      {[{v:"es",l:"ES"},{v:"en",l:"EN"},{v:"fr",l:"FR"}].map(({v,l}) => (
                        <button key={v} onClick={()=>{ setLang(v); localStorage.setItem("fr_lang",v); }}
                          style={{ flex:1, padding:"5px 0", borderRadius:6, border: lang===v ? "1.5px solid #111111" : "1px solid #E0E0E0", background: lang===v ? "#111111" : "transparent", color: lang===v ? "#fff" : "#666", fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:"inherit", transition:"all 0.12s" }}>
                          {l}
                        </button>
                      ))}
                    </div>
                  </div>
                  {/* Cerrar sesión */}
                  <button onClick={handleLogout}
                    style={{ width:"100%", padding:"11px 18px", background:"transparent", border:"none", cursor:"pointer", fontSize:13, fontWeight:600, color:"#D32F2F", textAlign:"left" }}
                    onMouseEnter={e=>e.currentTarget.style.background="#FFF5F5"}
                    onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                    {t("cerrar_sesion")}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <div style={{ height: "0.5px", background: "#fff", width: "100%", position:"sticky", top:52, zIndex:100 }} />

      {/* Barra de sub-navegación de Grupos — visible solo en vista grupos */}
      {view === "grupos" && (
        <div style={{ position:"sticky", top:52.5, zIndex:99, background:colorPickerActive ? tempBarColor : barColor, display:"flex", alignItems:"center", gap:2, padding:"0 clamp(12px,4vw,32px)", height:40, overflow:"hidden", transition:"background 0.2s" }}>
          {gruposSubDisplay.map(({ key, label }) => {
            const activo = gruposSubVista === key;
            return (
              <button key={key}
                draggable
                onMouseDown={e => { e.currentTarget.style.cursor = "grabbing"; }}
                onMouseUp={e => { e.currentTarget.style.cursor = "pointer"; }}
                onMouseLeave={e => { e.currentTarget.style.cursor = "pointer"; }}
                onDragStart={e => { dragGruposSubKey.current = key; e.dataTransfer.effectAllowed = "move"; setTimeout(() => setDraggingGruposSubKey(key), 0); }}
                onDragEnd={e => { e.currentTarget.style.cursor = "pointer"; if (dragGruposSubKey.current !== null && gruposSubPreviewRef.current) { setGruposSubOrder(gruposSubPreviewRef.current); localStorage.setItem("fr_grupos_sub_order", JSON.stringify(gruposSubPreviewRef.current)); } dragGruposSubKey.current = null; setGruposSubPreview(null); setDraggingGruposSubKey(null); }}
                onDragOver={e => {
                  e.preventDefault();
                  const from = dragGruposSubKey.current;
                  if (!from || from === key) return;
                  const base = gruposSubPreviewRef.current || gruposSubOrder;
                  const fi = base.indexOf(from), ti = base.indexOf(key);
                  if (fi === -1 || ti === -1 || fi === ti) return;
                  const next = [...base];
                  next.splice(fi, 1); next.splice(ti, 0, from);
                  setGruposSubPreview(next);
                }}
                onDrop={e => {
                  e.preventDefault();
                  const committed = gruposSubPreviewRef.current || gruposSubOrder;
                  setGruposSubOrder(committed);
                  localStorage.setItem("fr_grupos_sub_order", JSON.stringify(committed));
                  setGruposSubPreview(null);
                  dragGruposSubKey.current = null;
                }}
                onClick={() => cambiarGruposSubVista(key)}
                style={{ padding:"6px clamp(6px,2vw,16px)", borderRadius:7, border:"none", cursor:"pointer", background: activo ? "rgba(255,255,255,0.12)" : "transparent", color:"#fff", fontSize:"clamp(11px,2.5vw,13px)", fontWeight: activo ? 700 : 400, fontFamily:"'Plus Jakarta Sans',sans-serif", transition:"all 0.15s", whiteSpace:"nowrap", outline: activo ? "1.5px solid rgba(255,255,255,0.3)" : "1.5px solid transparent", visibility: draggingGruposSubKey === key ? "hidden" : "visible" }}>
                {label}
              </button>
            );
          })}
        </div>
      )}
      {view === "grupos" && <div style={{ height: "0.5px", background: "#fff", width: "100%", position:"sticky", top:92.5, zIndex:100 }} />}

      <WeatherBar ciudad={datos.hotel?.ciudad} datos={datos} lang={lang} occDeTicker={_occDeTicker} stickyTop={view === "grupos" ? 93 : 52} barColor={colorPickerActive ? tempBarColor : barColor} />
      <div style={{ height: 8, background: "#fff", width: "100%" }} />

      {/* Main */}
      <main id="main-scroll" onScroll={e => localStorage.setItem("fr_scroll", e.currentTarget.scrollTop)} style={{ padding: "clamp(14px,4vw,28px) clamp(12px,4vw,32px)", width: "100%", boxSizing: "border-box" }}>

        {/* Banner datos faltantes */}
        {!cargandoDatos && !alertasDismissed && alertasFaltantes.length > 0 && (
          <div style={{ display:"inline-block", marginBottom:20, fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
            <div style={{ background:"#FFF1F0", border:"1.5px solid #E53935", borderRadius:10 }}>
              {/* Cabecera clicable */}
              <button
                onClick={() => setAlertasExpanded(v => !v)}
                style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 14px", background:"none", border:"none", cursor:"pointer", textAlign:"left", whiteSpace:"nowrap", outline:"none" }}
              >
                <span style={{ fontWeight:700, fontSize:13, color:"#B71C1C" }}>
                  {alertasFaltantes.length === 1 ? "Falta importar 1 día" : `Faltan importar ${alertasFaltantes.length} días`}
                </span>
                <span style={{ fontSize:11, color:"#C62828", marginLeft:8 }}>{alertasExpanded ? "Ocultar" : "Ver detalle"}</span>
                <span style={{ fontSize:11, color:"#C62828", transform: alertasExpanded ? "rotate(180deg)" : "none", transition:"transform 0.2s", display:"inline-block" }}>▼</span>
                <button
                  onClick={e => { e.stopPropagation(); setAlertasDismissed(true); sessionStorage.setItem("fr_alertas_dismissed", "1"); }}
                  style={{ background:"none", border:"none", cursor:"pointer", fontSize:14, color:"#C62828", lineHeight:1, padding:"0 0 0 10px" }}
                  title="Cerrar"
                >✕</button>
              </button>
              {/* Detalle — siempre renderizado para fijar el ancho, oculto cuando colapsado */}
              <div style={{ borderTop: alertasExpanded ? "1px solid #FFCDD2" : "none", padding: alertasExpanded ? "8px 14px 12px" : 0, maxHeight: alertasExpanded ? 500 : 0, overflow:"hidden", transition:"max-height 0.2s ease" }}>
                {alertasFaltantes.map(({ fecha, sinProd, sinPick }) => {
                  const d = new Date(fecha + "T00:00:00");
                  const label = d.toLocaleDateString("es-ES", { weekday:"long", day:"2-digit", month:"long" });
                  return (
                    <div key={fecha} style={{ display:"flex", alignItems:"center", gap:10, padding:"5px 0", borderBottom:"1px solid #FFEBEE" }}>
                      <span style={{ fontSize:12, color:"#B71C1C", fontWeight:600, minWidth:160, textTransform:"capitalize" }}>{label}</span>
                      <div style={{ display:"flex", gap:6 }}>
                        {sinProd && <span style={{ fontSize:11, fontWeight:600, background:"#FFEBEE", color:"#C62828", border:"1px solid #EF9A9A", borderRadius:5, padding:"2px 8px" }}>Sin producción</span>}
                        {sinPick && <span style={{ fontSize:11, fontWeight:600, background:"#FFEBEE", color:"#C62828", border:"1px solid #EF9A9A", borderRadius:5, padding:"2px 8px" }}>Sin pick up</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Gestión siempre montada para no perder estado al cambiar de pestaña */}
        <div style={{ display: !cargandoDatos && !mesDetalle && !desgloseMovimiento && view === "gestion" ? "block" : "none", width:"100%" }}>
          <ImportarExcel fullPage
            onClose={() => { setView("dashboard"); localStorage.setItem("fr_view","dashboard"); }}
            session={session} hotelNombre={datos.hotel?.nombre||''} produccion={datos.produccion||[]} hotelHab={datos.hotel?.habitaciones||0}
            onImportado={() => {
              sessionStorage.removeItem("fr_datos_cache_v4");
              sessionStorage.removeItem("fr_datos_ts_v4");
              sessionStorage.removeItem("fr_alertas_dismissed");
              setAlertasDismissed(false);
              localStorage.removeItem("fr_scroll");
              Object.keys(localStorage).filter(k => k.startsWith("fr_kpis_")).forEach(k => localStorage.removeItem(k));
              setDatos(d => ({ produccion:[], presupuesto:[], pickupEntries:[], grupos:[], hotel:d.hotel, session }));
              cargarDatos(true);
            }}
            onProduccionDirecta={(row) => setDatos(prev => ({ ...prev, produccion: [...(prev.produccion||[]).filter(r => r.fecha !== row.fecha), row].sort((a,b) => a.fecha.localeCompare(b.fecha)) }))}
          />
        </div>

        {cargandoDatos ? <LoadingSpinner /> : mesDetalle ? (
          <div style={{ width:"100%" }}><MonthDetailView datos={datos} mes={mesDetalle.mes} anio={mesDetalle.anio} onBack={() => setMesDetalle(null)} /></div>
        ) : desgloseMovimiento ? (
          <div style={{ width:"100%" }}><DesgloseMovimientoView datos={datos} tipo={desgloseMovimiento} onBack={() => setDesgloseMovimiento(null)} /></div>
        ) : view !== "gestion" ? (
          <div style={{ width:"100%" }}>
            {(view === "dashboard" || !["pickup","budget","grupos"].includes(view)) && (
              <DashboardView {..._commonViewProps}
                onMesDetalle={(m,a) => setMesDetalle({ mes:m, anio:a })}
                onDesgloseMovimiento={tipo => setDesgloseMovimiento(tipo)}
                kpiModal={kpiModal} setKpiModal={setKpiModal}
                kpiModalExterno={kpiModalApp} onKpiModalExternoHandled={() => setKpiModalApp(null)}
                onNavigarGrupos={(subvista, fechaInicio, fechaFin, id) => { localStorage.setItem("fr_grupos_subvista", subvista); sessionStorage.setItem("fr_pending_nuevo", JSON.stringify({ tipo: subvista === "eventos" ? "evento" : "grupo", fecha_inicio: fechaInicio, fecha_fin: fechaFin, highlightId: id||null })); sessionStorage.setItem("fr_from_heatmap", "1"); setView("grupos"); localStorage.setItem("fr_view", "grupos"); }}
              />
            )}
            {view === "pickup" && <PickupView {..._commonViewProps} />}
            {view === "budget" && <BudgetView {..._commonViewProps} />}
            {view === "grupos" && <GruposView {..._commonViewProps} onRecargar={() => cargarDatos(true)} onVolverHeatmap={() => { setView("dashboard"); localStorage.setItem("fr_view", "dashboard"); }} subVistaExt={gruposSubVista} onCambiarSubVista={cambiarGruposSubVista} />}
          </div>
        ) : null}
      </main>


      {/* Modal Configuración Unificado */}
      {perfilSeccion === "config" && (
        <ModalConfigUnificado
          datos={datos}
          session={session}
          navHidden={navHidden}
          toggleNavHidden={toggleNavHidden}
          navRestrictions={navRestrictions}
          onSaveRestrictions={saveNavRestrictions}
          initialTab={configInitialTab}
          onClose={() => setPerfilSeccion(null)}
          onGuardado={cargarDatos}
          barColor={barColor}
          onOpenColorPicker={() => { setTempBarColor(barColor); setColorPickerActive(true); setPerfilSeccion(null); }}
        />
      )}

      {/* Modal bloqueo de pestaña restringida */}
      {restriccionModal && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.6)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:1000 }}>
          <div style={{ background:C.bgCard, borderRadius:16, padding:"36px 40px", width:360, boxShadow:"0 24px 60px rgba(0,0,0,0.2)", fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
              <h2 style={{ fontFamily:"'Plus Jakarta Sans',sans-serif", fontSize:20, fontWeight:700, color:C.text }}>Sección restringida</h2>
              <button onClick={() => { setRestriccionModal(null); setRestriccionInput(""); setShowRestriccionInput(false); setRestriccionError(""); }} style={{ background:"none", border:`1px solid ${C.border}`, borderRadius:6, width:28, height:28, cursor:"pointer", fontSize:15, color:C.textLight, display:"flex", alignItems:"center", justifyContent:"center", padding:0 }}>✕</button>
            </div>
            <p style={{ fontSize:13, color:C.textMid, marginBottom:20 }}>
              {restriccionModal.type === "pin" ? "Introduce el código de 4 dígitos para acceder." : "Introduce tu contraseña de acceso para continuar."}
            </p>
            <div style={{ position:"relative", marginBottom: restriccionError ? 6 : 16 }}>
              <input
                autoFocus
                type={showRestriccionInput ? "text" : "password"}
                inputMode={restriccionModal.type === "pin" ? "numeric" : undefined}
                maxLength={restriccionModal.type === "pin" ? 4 : undefined}
                value={restriccionInput}
                onChange={e => { const v = restriccionModal.type === "pin" ? e.target.value.replace(/\D/g,"").slice(0,4) : e.target.value; setRestriccionInput(v); setRestriccionError(""); }}
                onKeyDown={e => { if (e.key === "Enter") verificarRestriccion(); }}
                placeholder={restriccionModal.type === "pin" ? "····" : "Contraseña"}
                style={{ width:"100%", padding:"10px 40px 10px 14px", borderRadius:8, border:`1.5px solid ${restriccionError ? C.red : C.border}`, background:C.bg, color:C.text, fontSize: restriccionModal.type === "pin" ? 22 : 13, letterSpacing: restriccionModal.type === "pin" ? 12 : 0, fontFamily: restriccionModal.type === "pin" ? "monospace" : "'Plus Jakarta Sans',sans-serif", textAlign: restriccionModal.type === "pin" ? "center" : "left", outline:"none", boxSizing:"border-box" }}
              />
              <button onMouseDown={e=>{e.preventDefault();setShowRestriccionInput(true);}} onMouseUp={()=>setShowRestriccionInput(false)} onMouseLeave={()=>setShowRestriccionInput(false)} onTouchStart={e=>{e.preventDefault();setShowRestriccionInput(true);}} onTouchEnd={()=>setShowRestriccionInput(false)}
                style={{ position:"absolute", right:10, top:"50%", transform:"translateY(-50%)", background:"none", border:"none", cursor:"pointer", color:C.textLight, padding:4, display:"flex", alignItems:"center", userSelect:"none", WebkitUserSelect:"none" }}>
                {showRestriccionInput
                  ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                  : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>}
              </button>
            </div>
            {restriccionError && <p style={{ fontSize:11, color:C.red, marginBottom:12 }}>{restriccionError}</p>}
            <label style={{ display:"flex", alignItems:"center", gap:8, marginBottom:16, cursor:"pointer" }}>
              <input type="checkbox" checked={rememberRestriccion} onChange={e => setRememberRestriccion(e.target.checked)} style={{ width:14, height:14, accentColor:C.accent, cursor:"pointer", flexShrink:0 }} />
              <span style={{ fontSize:12, color:C.textMid }}>Recordar en esta sesión</span>
            </label>
            <button onClick={verificarRestriccion} disabled={restriccionLoading||!restriccionInput}
              style={{ width:"100%", padding:"10px 0", background:C.accent, color:"#fff", border:"none", borderRadius:8, fontSize:13, fontWeight:600, cursor:restriccionLoading||!restriccionInput?"not-allowed":"pointer", fontFamily:"'Plus Jakarta Sans',sans-serif", opacity:restriccionLoading||!restriccionInput?0.6:1 }}>
              {restriccionLoading ? "Verificando…" : "Entrar"}
            </button>
          </div>
        </div>
      )}

      {/* Paleta color barra superior */}
      {colorPickerActive && (
        <div style={{ position:"fixed", bottom:28, left:"50%", transform:"translateX(-50%)", zIndex:10000, background:"#f5f5f5", border:"1.5px solid #111111", borderRadius:12, padding:"18px 22px", boxShadow:"0 4px 20px rgba(0,0,0,0.18)", fontFamily:"'Plus Jakarta Sans',sans-serif", minWidth:340, maxWidth:"92vw" }}>
          <p style={{ fontSize:11, fontWeight:700, color:"#111111", textTransform:"uppercase", letterSpacing:"1.2px", marginBottom:14 }}>Color de barra superior</p>
          <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginBottom:14 }}>
            {["#111111","#0A2540","#004B87","#1A7A3C","#374151","#7C3AED","#B8860B","#9F1239","#0F766E","#1E293B"].map(col => (
              <button key={col} onClick={() => setTempBarColor(col)}
                style={{ width:30, height:30, borderRadius:6, background:col, border: tempBarColor===col ? "2.5px solid #111111" : "1.5px solid rgba(0,0,0,0.15)", cursor:"pointer", outline: tempBarColor===col ? "2px solid #f5f5f5" : "none", outlineOffset:"-4px", transition:"transform 0.1s", transform: tempBarColor===col ? "scale(1.15)" : "scale(1)", flexShrink:0 }} />
            ))}
            <label title="Color personalizado" style={{ width:30, height:30, borderRadius:6, border:"1.5px solid rgba(0,0,0,0.2)", overflow:"hidden", cursor:"pointer", flexShrink:0, position:"relative", display:"flex", alignItems:"center", justifyContent:"center" }}>
              <input type="color" value={tempBarColor} onChange={e => setTempBarColor(e.target.value)}
                style={{ position:"absolute", width:"200%", height:"200%", top:"-50%", left:"-50%", opacity:0, cursor:"pointer" }} />
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="13.5" cy="6.5" r="0.5"/><circle cx="17.5" cy="10.5" r="0.5"/><circle cx="8.5" cy="7.5" r="0.5"/><circle cx="6.5" cy="12.5" r="0.5"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/></svg>
            </label>
          </div>
          <div style={{ display:"flex", gap:8 }}>
            <button onClick={() => { setBarColor(tempBarColor); localStorage.setItem("fr_topbar_color", tempBarColor); setColorPickerActive(false); }}
              style={{ flex:1, padding:"9px 0", background:"#111111", color:"#fff", border:"none", borderRadius:8, fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
              Guardar
            </button>
            <button onClick={() => setColorPickerActive(false)}
              style={{ flex:1, padding:"9px 0", background:"transparent", color:"#111111", border:"1.5px solid #111111", borderRadius:8, fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
              Descartar
            </button>
          </div>
        </div>
      )}

      {/* Toast global */}
      {toast && (
        <div style={{ position:"fixed", bottom:24, left:"50%", transform:"translateX(-50%)", zIndex:9999, background: toast.ok ? "#111" : "#D32F2F", color:"#fff", padding:"12px 24px", borderRadius:10, fontSize:13, fontWeight:600, fontFamily:"'Plus Jakarta Sans',sans-serif", boxShadow:"0 8px 24px rgba(0,0,0,0.2)", maxWidth:"90vw", textAlign:"center", pointerEvents:"none" }}>
          {toast.msg}
        </div>
      )}

      {perfilSeccion === "suscripcion" && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.6)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:1000 }}>
          <div style={{ background:C.bgCard, borderRadius:16, padding:"36px 40px", width:440, boxShadow:"0 24px 60px rgba(0,0,0,0.2)", fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:24 }}>
              <h2 style={{ fontFamily:"'Plus Jakarta Sans',sans-serif", fontSize:20, fontWeight:700, color:C.text }}>Gestión de suscripción</h2>
              <button onClick={()=>{ setPerfilSeccion(null); setConfirmCancelar(false); }} style={{ background:"none", border:`1px solid ${C.border}`, borderRadius:6, width:28, height:28, cursor:"pointer", fontSize:15, color:C.textLight, display:"flex", alignItems:"center", justifyContent:"center", padding:0 }}>✕</button>
            </div>

            {/* Datos del plan */}
            <div style={{ background:C.bg, borderRadius:10, padding:"16px 20px", marginBottom:20 }}>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:8 }}>
                <span style={{ fontSize:12, color:C.textMid }}>Plan</span>
                <span style={{ fontSize:12, fontWeight:700, color:C.text, textTransform:"capitalize" }}>{suscripcion?.plan || "—"}</span>
              </div>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:8 }}>
                <span style={{ fontSize:12, color:C.textMid }}>Estado</span>
                <span style={{ fontSize:12, fontWeight:700, color:
                  suscripcion?.estado === "activa" || suscripcion?.estado === "trial" ? C.green :
                  suscripcion?.estado === "cancelando" ? C.gold : C.red }}>
                  {suscripcion?.estado === "trial" ? "Periodo de prueba"
                    : suscripcion?.estado === "activa" ? "Activa"
                    : suscripcion?.estado === "cancelando" ? "Cancelación programada"
                    : suscripcion?.estado || "—"}
                </span>
              </div>
              {suscripcion?.trial_end && suscripcion.estado === "trial" && (
                <div style={{ display:"flex", justifyContent:"space-between", marginBottom:8 }}>
                  <span style={{ fontSize:12, color:C.textMid }}>Prueba hasta</span>
                  <span style={{ fontSize:12, fontWeight:700, color:C.text }}>{new Date(suscripcion.trial_end).toLocaleDateString("es-ES",{day:"2-digit",month:"2-digit",year:"numeric"})}</span>
                </div>
              )}
              {suscripcion?.periodo_fin && suscripcion.estado === "activa" && (
                <div style={{ display:"flex", justifyContent:"space-between" }}>
                  <span style={{ fontSize:12, color:C.textMid }}>Próxima renovación</span>
                  <span style={{ fontSize:12, fontWeight:700, color:C.text }}>{new Date(suscripcion.periodo_fin).toLocaleDateString("es-ES",{day:"2-digit",month:"2-digit",year:"numeric"})}</span>
                </div>
              )}
              {suscripcion?.periodo_fin && suscripcion.estado === "cancelando" && (
                <div style={{ display:"flex", justifyContent:"space-between" }}>
                  <span style={{ fontSize:12, color:C.textMid }}>Acceso hasta</span>
                  <span style={{ fontSize:12, fontWeight:700, color:C.text }}>{new Date(suscripcion.periodo_fin).toLocaleDateString("es-ES",{day:"2-digit",month:"2-digit",year:"numeric"})}</span>
                </div>
              )}
            </div>


            {/* Aviso cancelación programada */}
            {suscripcion?.estado === "cancelando" && (
              <div style={{ background:"#FEF3C7", border:"1px solid #FCD34D", borderRadius:10, padding:"12px 16px", marginBottom:16 }}>
                <p style={{ fontSize:12, color:"#92400E", lineHeight:1.6 }}>
                  Tu suscripción se cancelará el <strong>{new Date(suscripcion.periodo_fin).toLocaleDateString("es-ES")}</strong>. Seguirás teniendo acceso completo hasta esa fecha.
                </p>
              </div>
            )}

            {/* Informe de prueba */}
            <div style={{ borderTop:`1px solid ${C.border}`, paddingTop:16, marginBottom:16 }}>
              <p style={{ fontSize:12, color:C.textMid, marginBottom:10 }}>Envía el informe diario ahora con los datos del último día registrado.</p>
              <button
                disabled={enviandoInformePrueba || okInformePrueba}
                onClick={async () => {
                  setEnviandoInformePrueba(true);
                  setErrorInformePrueba("");
                  try {
                    const { data: ultimoDia } = await supabase.from("produccion_diaria")
                      .select("*").eq("hotel_id", session.user.id).order("fecha", { ascending: false }).limit(1).maybeSingle();
                    if (!ultimoDia) throw new Error("Sin datos registrados");
                    const mesActual  = parseInt(ultimoDia.fecha.split('-')[1]);
                    const anioActual = parseInt(ultimoDia.fecha.split('-')[0]);
                    const mesStr     = String(mesActual).padStart(2,'0');
                    const inicioMes  = `${anioActual}-${mesStr}-01`;
                    const inicioSig  = mesActual === 12 ? `${anioActual+1}-01-01` : `${anioActual}-${String(mesActual+1).padStart(2,'0')}-01`;
                    const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
                    const NO_OTA_KEYS2 = ['directo', 'web', 'empresa', 'corporativo', 'grupo', 'mice', 'evento', 'tour', 'agencia', 'gds'];
                    const isOTA2 = (canal) => { const c = (canal || '').toLowerCase(); return !NO_OTA_KEYS2.some(k => c.includes(k)); };
                    const normCanal2 = (canal) => { const c = (canal || '').toLowerCase().trim(); if (c.includes('directo') || c.includes('teléfono') || c.includes('telefono') || c.includes('email')) return 'Directo'; if (c.includes('web')) return 'Web'; if (c.includes('empresa') || c.includes('corporativo')) return 'Empresa'; if (c.includes('mice') || c.includes('evento')) return 'Eventos / MICE'; if (c.includes('grupo')) return 'Grupos'; return canal || 'Directo'; };
                    const [{ data: datosMes }, { data: pickupRows }, { data: pptoData }, { data: pickupMes2 }, { data: gruposMes2 }, { data: gruposProx2 }] = await Promise.all([
                      supabase.from("produccion_diaria").select("fecha,hab_ocupadas,hab_disponibles,revenue_hab,revenue_fnb,revenue_total").eq("hotel_id", session.user.id).gte("fecha", inicioMes).lt("fecha", inicioSig).order("fecha", { ascending: true }),
                      supabase.from("pickup_entries").select("num_reservas,precio_total,estado").eq("hotel_id", session.user.id).eq("fecha_pickup", ultimoDia.fecha),
                      supabase.from("presupuesto").select("rev_total_ppto,adr_ppto").eq("hotel_id", session.user.id).eq("mes", mesActual).eq("anio", anioActual).maybeSingle(),
                      supabase.from("pickup_entries").select("canal,precio_total,num_reservas,estado").eq("hotel_id", session.user.id).gte("fecha_pickup", inicioMes).lt("fecha_pickup", inicioSig).neq("estado", "cancelada"),
                      supabase.from("grupos_eventos").select("habitaciones,adr_grupo,revenue_fnb,revenue_sala,fecha_inicio,fecha_fin,estado").eq("hotel_id", session.user.id).neq("estado", "cancelado").gte("fecha_fin", inicioMes).lt("fecha_inicio", inicioSig),
                      supabase.from("grupos_eventos").select("nombre,categoria,estado,fecha_inicio,fecha_fin,habitaciones,adr_grupo,revenue_fnb,revenue_sala").eq("hotel_id", session.user.id).neq("estado", "cancelado").gte("fecha_inicio", (() => { const d=new Date(ultimoDia.fecha+'T00:00:00'); d.setDate(d.getDate()+1); return d.toISOString().slice(0,10); })()).lte("fecha_inicio", (() => { const d=new Date(ultimoDia.fecha+'T00:00:00'); d.setDate(d.getDate()+8); return d.toISOString().slice(0,10); })()).order("fecha_inicio"),
                    ]);
                    let nuevas = 0, cancels = 0, revPickup = 0;
                    for (const p of (pickupRows || [])) {
                      const nr = p.num_reservas || 1;
                      if (p.estado === 'cancelada') cancels += nr;
                      else { nuevas += nr; revPickup += p.precio_total || nr * (ultimoDia.adr || 0); }
                    }
                    let acum = 0;
                    const revenueAcumulado = (datosMes || []).map(d => { acum += d.revenue_hab || 0; return { dia: parseInt(d.fecha.split('-')[2]), acum: Math.round(acum) }; });
                    let totHabOcu2 = 0, totHabDisp2 = 0, totRevHab2 = 0, totRevFnb2 = 0, totRevTotal2 = 0;
                    for (const d of (datosMes || [])) {
                      if (d.hab_disponibles > 0) { totHabOcu2 += d.hab_ocupadas || 0; totHabDisp2 += d.hab_disponibles || 0; totRevHab2 += d.revenue_hab || 0; totRevFnb2 += d.revenue_fnb || 0; totRevTotal2 += d.revenue_total || 0; }
                    }
                    const avgOcc2    = totHabDisp2 > 0 ? totHabOcu2 / totHabDisp2 * 100 : null;
                    const avgAdr2    = totHabOcu2 > 0 ? totRevHab2 / totHabOcu2 : null;
                    const avgRevpar2 = totHabDisp2 > 0 ? totRevHab2 / totHabDisp2 : null;
                    const totRevTotal2Eff = totRevTotal2 || (totRevHab2 + totRevFnb2) || 0;
                    const avgTrevpar2= totHabDisp2 > 0 && totRevTotal2Eff > 0 ? totRevTotal2Eff / totHabDisp2 : null;
                    const canalMap2 = {};
                    for (const p of (pickupMes2 || [])) { const peso = p.precio_total || (p.num_reservas || 1); const key = isOTA2(p.canal) ? 'OTAs' : normCanal2(p.canal); canalMap2[key] = (canalMap2[key] || 0) + peso; }
                    const canalesRevenue2 = Object.entries(canalMap2).filter(([,v])=>v>0).sort((a,b)=>b[1]-a[1]).map(([canal,revenue])=>({canal,revenue}));
                    let revGrupos2 = 0;
                    for (const g of (gruposMes2 || [])) { const noches = Math.max(1, (new Date(g.fecha_fin+'T00:00:00') - new Date(g.fecha_inicio+'T00:00:00')) / 86400000); const peso = g.estado === 'cancelado' ? 0 : g.estado === 'cotizado' || g.estado === 'tentativo' ? 0.5 : 1.0; revGrupos2 += ((g.habitaciones||0)*(g.adr_grupo||0)*noches+(g.revenue_fnb||0)+(g.revenue_sala||0))*peso; }
                    const revIndividual2 = Math.max(0, totRevHab2 - revGrupos2);
                    const occ    = ultimoDia.hab_disponibles > 0 ? ultimoDia.hab_ocupadas / ultimoDia.hab_disponibles * 100 : null;
                    const adr    = ultimoDia.adr    ?? (ultimoDia.hab_ocupadas > 0 && ultimoDia.revenue_hab ? ultimoDia.revenue_hab / ultimoDia.hab_ocupadas : null);
                    const revpar = ultimoDia.revpar ?? (ultimoDia.hab_disponibles > 0 && ultimoDia.revenue_hab ? ultimoDia.revenue_hab / ultimoDia.hab_disponibles : null);
                    const revTotalEff2 = ultimoDia.revenue_total || ((ultimoDia.revenue_hab||0)+(ultimoDia.revenue_fnb||0)) || null;
                    const trevpar= ultimoDia.trevpar ?? (ultimoDia.hab_disponibles > 0 && revTotalEff2 ? revTotalEff2 / ultimoDia.hab_disponibles : null);
                    const resp = await fetch('/api/daily-email', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` },
                      body: JSON.stringify({
                        email: session.user.email,
                        hotelNombre: datos.hotel?.nombre || null,
                        kpis: { fecha: ultimoDia.fecha, mesNombre: MESES[mesActual-1], occ, adr, revpar, trevpar, hab_ocupadas: ultimoDia.hab_ocupadas, hab_disponibles: ultimoDia.hab_disponibles, revenue_hab: ultimoDia.revenue_hab, revenue_total: ultimoDia.revenue_total, pickup_neto: nuevas, cancelaciones: cancels, revenue_pickup_ayer: revPickup || null, revenueAcumulado, presupuestoMensual: pptoData?.rev_total_ppto ?? null, avg_occ: avgOcc2, avg_adr: avgAdr2, avg_revpar: avgRevpar2, avg_trevpar: avgTrevpar2, revHabMes: totRevHab2, revFnbMes: totRevFnb2, canalesRevenue: canalesRevenue2, revGruposMes: revGrupos2, revIndividualMes: revIndividual2, adrPpto: pptoData?.adr_ppto ?? null, gruposProximos: gruposProx2 || [] },
                      }),
                    });
                    const json = await resp.json();
                    if (!resp.ok) throw new Error(json.error || `HTTP ${resp.status}`);
                    setOkInformePrueba(true);
                    setTimeout(() => setOkInformePrueba(false), 4000);
                  } catch(e) { setErrorInformePrueba(e.message); }
                  setEnviandoInformePrueba(false);
                }}
                style={{ width:"100%", padding:"10px", borderRadius:8, border:`1px solid ${C.border}`, background: okInformePrueba ? C.greenLight : "transparent", color: okInformePrueba ? C.green : C.accent, fontSize:13, fontWeight:600, cursor: enviandoInformePrueba || okInformePrueba ? "not-allowed" : "pointer", fontFamily:"'Plus Jakarta Sans',sans-serif", transition:"all .2s" }}>
                {enviandoInformePrueba ? "Enviando..." : okInformePrueba ? "✓ Informe enviado" : "Enviar informe ahora"}
              </button>
              {errorInformePrueba && <p style={{ fontSize:11, color:C.red, marginTop:6 }}>{errorInformePrueba}</p>}
            </div>

            {/* Confirmación cancelar */}
            {confirmCancelar && suscripcion?.estado !== "cancelando" ? (
              <div style={{ background:"#FEF2F2", border:"1px solid #FECACA", borderRadius:10, padding:"16px", marginBottom:16 }}>
                <p style={{ fontSize:13, fontWeight:700, color:C.red, marginBottom:6 }}>¿Confirmas la cancelación?</p>
                <p style={{ fontSize:12, color:"#7F1D1D", lineHeight:1.6, marginBottom:14 }}>
                  No se realizarán más cargos. Mantendrás el acceso hasta el final del período actual ({suscripcion?.periodo_fin ? new Date(suscripcion.periodo_fin).toLocaleDateString("es-ES") : "fin del período"}).
                </p>
                <div style={{ display:"flex", gap:10 }}>
                  <button onClick={()=>setConfirmCancelar(false)}
                    style={{ flex:1, padding:"9px", borderRadius:8, border:`1px solid ${C.border}`, background:"#fff", color:C.textMid, fontSize:13, cursor:"pointer", fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
                    Volver
                  </button>
                  <button
                    disabled={cancelandoSub}
                    onClick={async () => {
                      setCancelandoSub(true);
                      try {
                        const res = await fetch("/api/cancel-subscription", {
                          method: "POST",
                          headers: { "Content-Type": "application/json", "Authorization": `Bearer ${session.access_token}` },
                          body: JSON.stringify({}),
                        });
                        const json = await res.json();
                        if (!res.ok) throw new Error(json.error);
                        setSuscripcion(s => ({ ...s, estado: "cancelando", periodo_fin: json.periodo_fin }));
                        setConfirmCancelar(false);
                      } catch(e) {
                      }
                      setCancelandoSub(false);
                    }}
                    style={{ flex:1, padding:"9px", borderRadius:8, border:"none", background:C.red, color:"#fff", fontSize:13, fontWeight:700, cursor:cancelandoSub?"not-allowed":"pointer", fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
                    {cancelandoSub ? "Cancelando..." : "Sí, cancelar"}
                  </button>
                </div>
              </div>
            ) : suscripcion?.estado !== "cancelando" ? (
              <button onClick={()=>setConfirmCancelar(true)}
                style={{ width:"100%", padding:"10px", borderRadius:8, border:`1px solid ${C.border}`, background:"transparent", color:C.red, fontSize:13, cursor:"pointer", fontFamily:"'Plus Jakarta Sans',sans-serif", fontWeight:500 }}>
                Cancelar suscripción
              </button>
            ) : null}
          </div>
        </div>
      )}

      {/* Modal Extranets */}
      {perfilSeccion === "extranets" && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.6)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:1000 }}>
          <div style={{ background:C.bgCard, borderRadius:16, padding:"32px 36px", width:500, maxHeight:"85vh", overflowY:"auto", boxShadow:"0 24px 60px rgba(0,0,0,0.2)", fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:6 }}>
              <h2 style={{ fontFamily:"'Plus Jakarta Sans',sans-serif", fontSize:20, fontWeight:700, color:C.text }}>Extranets</h2>
              <button onClick={()=>{ setPerfilSeccion(null); setEditingExtranetIdx(null); setAddingExtranet(false); }} style={{ background:"none", border:`1px solid ${C.border}`, borderRadius:6, width:28, height:28, cursor:"pointer", fontSize:15, color:C.textLight, display:"flex", alignItems:"center", justifyContent:"center", padding:0 }}>✕</button>
            </div>
            <p style={{ fontSize:12, color:C.textMid, marginBottom:20 }}>Accede directamente a la extranet de cada canal</p>

            {extranets.map((ex, i) => {
              return (
                <div key={i} style={{ marginBottom:8 }}>
                  {editingExtranetIdx === i ? (
                    <div style={{ border:`1px solid #111111`, borderRadius:10, padding:"14px 16px", background:C.bg }}>
                      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:8 }}>
                        <div>
                          <p style={{ fontSize:10, color:C.textLight, fontWeight:600, textTransform:"uppercase", letterSpacing:"0.8px", marginBottom:4 }}>Nombre</p>
                          <input value={extranetForm.nombre} onChange={e=>setExtranetForm(f=>({...f,nombre:e.target.value}))}
                            style={{ width:"100%", padding:"7px 10px", borderRadius:7, border:`1px solid ${C.border}`, fontSize:13, background:C.bgCard, color:C.text, fontFamily:"inherit", boxSizing:"border-box" }}/>
                        </div>
                        <div>
                          <p style={{ fontSize:10, color:C.textLight, fontWeight:600, textTransform:"uppercase", letterSpacing:"0.8px", marginBottom:4 }}>URL</p>
                          <input value={extranetForm.url} onChange={e=>setExtranetForm(f=>({...f,url:e.target.value}))}
                            placeholder="https://..." style={{ width:"100%", padding:"7px 10px", borderRadius:7, border:`1px solid ${C.border}`, fontSize:13, background:C.bgCard, color:C.text, fontFamily:"inherit", boxSizing:"border-box" }}/>
                        </div>
                      </div>
                      <div style={{ display:"flex", gap:8 }}>
                        <button onClick={()=>{ const updated=[...extranets]; updated[i]={nombre:extranetForm.nombre,url:extranetForm.url}; setExtranetsPersist(updated); setEditingExtranetIdx(null); }}
                          style={{ flex:1, padding:"7px 0", borderRadius:7, border:"none", background:"#111111", color:"#fff", fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>Guardar</button>
                        <button onClick={()=>setEditingExtranetIdx(null)}
                          style={{ padding:"7px 14px", borderRadius:7, border:`1px solid ${C.border}`, background:"none", color:C.textMid, fontSize:12, cursor:"pointer", fontFamily:"inherit" }}>Cancelar</button>
                        <button onClick={()=>{ setExtranetsPersist(extranets.filter((_,j)=>j!==i)); setEditingExtranetIdx(null); }}
                          style={{ padding:"7px 14px", borderRadius:7, border:`1px solid ${C.red}`, background:"none", color:C.red, fontSize:12, cursor:"pointer", fontFamily:"inherit" }}>Eliminar</button>
                      </div>
                    </div>
                  ) : (
                    <div onClick={()=>{ if(ex.url) window.open(ex.url,"_blank","noreferrer"); }}
                      style={{ display:"flex", alignItems:"center", gap:12, padding:"13px 16px", borderRadius:10, border:`1px solid ${C.border}`, background:C.bg, cursor: ex.url ? "pointer" : "default", transition:"border-color 0.15s, background 0.15s" }}
                      onMouseEnter={e=>{ if(ex.url){ e.currentTarget.style.borderColor="#111111"; e.currentTarget.style.background=C.bgCard; } }}
                      onMouseLeave={e=>{ e.currentTarget.style.borderColor=C.border; e.currentTarget.style.background=C.bg; }}>
                      <div style={{ flex:1, minWidth:0 }}>
                        <p style={{ fontSize:13, fontWeight:700, color:C.text }}>{ex.nombre}</p>
                        {!ex.url && <p style={{ fontSize:11, color:C.red, fontStyle:"italic" }}>Sin URL configurada</p>}
                      </div>
                      <button onClick={e=>{ e.stopPropagation(); setExtranetForm({ nombre:ex.nombre, url:ex.url||"" }); setEditingExtranetIdx(i); }}
                        style={{ padding:"5px 10px", borderRadius:6, border:`1px solid ${C.border}`, background:C.bgCard, color:C.textMid, fontSize:11, cursor:"pointer", fontFamily:"inherit", flexShrink:0 }}>Editar</button>
                    </div>
                  )}
                </div>
              );
            })}

            {/* Añadir nueva extranet */}
            {addingExtranet ? (
              <div style={{ border:`1px solid #111111`, borderRadius:10, padding:"14px 16px", background:C.bg, marginTop:10 }}>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:10 }}>
                  <div>
                    <p style={{ fontSize:10, color:C.textLight, fontWeight:600, textTransform:"uppercase", letterSpacing:"0.8px", marginBottom:4 }}>Nombre</p>
                    <input value={newExtranetForm.nombre} onChange={e=>setNewExtranetForm(f=>({...f,nombre:e.target.value}))}
                      placeholder="Ej: Hotelbeds" style={{ width:"100%", padding:"7px 10px", borderRadius:7, border:`1px solid ${C.border}`, fontSize:13, background:C.bgCard, color:C.text, fontFamily:"inherit", boxSizing:"border-box" }}/>
                  </div>
                  <div>
                    <p style={{ fontSize:10, color:C.textLight, fontWeight:600, textTransform:"uppercase", letterSpacing:"0.8px", marginBottom:4 }}>URL</p>
                    <input value={newExtranetForm.url} onChange={e=>setNewExtranetForm(f=>({...f,url:e.target.value}))}
                      placeholder="https://..." style={{ width:"100%", padding:"7px 10px", borderRadius:7, border:`1px solid ${C.border}`, fontSize:13, background:C.bgCard, color:C.text, fontFamily:"inherit", boxSizing:"border-box" }}/>
                  </div>
                </div>
                <div style={{ display:"flex", gap:8 }}>
                  <button onClick={()=>{ if(!newExtranetForm.nombre) return; setExtranetsPersist([...extranets,{ nombre:newExtranetForm.nombre, url:newExtranetForm.url }]); setNewExtranetForm({nombre:"",url:""}); setAddingExtranet(false); }}
                    style={{ flex:1, padding:"7px 0", borderRadius:7, border:"none", background:"#111111", color:"#fff", fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>Añadir</button>
                  <button onClick={()=>{ setAddingExtranet(false); setNewExtranetForm({nombre:"",url:""}); }}
                    style={{ padding:"7px 14px", borderRadius:7, border:`1px solid ${C.border}`, background:"none", color:C.textMid, fontSize:12, cursor:"pointer", fontFamily:"inherit" }}>Cancelar</button>
                </div>
              </div>
            ) : (
              <button onClick={()=>setAddingExtranet(true)}
                style={{ width:"100%", marginTop:10, padding:"10px 0", borderRadius:9, border:`1.5px dashed ${C.border}`, background:"none", color:C.textMid, fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:"inherit", transition:"border-color 0.15s, color 0.15s" }}
                onMouseEnter={e=>{ e.currentTarget.style.borderColor="#111111"; e.currentTarget.style.color="#111111"; }}
                onMouseLeave={e=>{ e.currentTarget.style.borderColor=C.border; e.currentTarget.style.color=C.textMid; }}>
                + Añadir extranet
              </button>
            )}
          </div>
        </div>
      )}
      {onboardingStep !== null && <OnboardingOverlay step={onboardingStep} onNext={handleOnboardingNext} onSkip={handleOnboardingSkip} />}
    </div>
    </LangContext.Provider>
  );
}