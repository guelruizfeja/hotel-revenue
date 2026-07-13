import { jsPDF } from 'jspdf';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LOGO_WHITE_B64 = readFileSync(path.join(__dirname, 'assets', 'fastrev-icon-white.png')).toString('base64');

export function generarInformeDiarioPDF(kpis, hotelNombre) {
  const MESES     = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
  const MESES_S   = ["ene","feb","mar","abr","may","jun","jul","ago","sep","oct","nov","dic"];
  const {
    fecha, mesNombre, occ, adr, revpar, trevpar,
    hab_ocupadas, hab_disponibles, pickup_neto, cancelaciones, revenue_pickup_ayer,
    revenueAcumulado, presupuestoMensual,
    avg_occ, avg_adr, avg_revpar, avg_trevpar,
    lm_avg_occ, lm_avg_adr, lm_avg_revpar, lm_avg_trevpar,
    revHabAyer, revFnbAyer, revSalasAyer, canalesRevenue, canalesPickup, canalesRevMix,
    revGruposAyer, revIndividualAyer,
    adrPpto, occPpto, gruposProximos, proximoConfirmado,
    forecastMes, paceProximos7,
  } = kpis;

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
  // Logo derecha en blanco (asset pre-generado, sin recoloreo en tiempo de ejecución)
  try {
    const lW=9, lH=9;
    doc.addImage(`data:image/png;base64,${LOGO_WHITE_B64}`, "PNG", W-lW-3, 3, lW, lH);
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
      const statusTxt = `ppto: ${k.ppto}`;
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
  const adrNuevas = nuevas > 0 && revenue_pickup_ayer ? Math.round(revenue_pickup_ayer / nuevas) : null;
  const canalesPick = (canalesPickup || []).slice(0, 5);
  const pickH = 36;
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
    if (i>0) { doc.setDrawColor(...C_BORDE); doc.line(M+i*pColW, y+10, M+i*pColW, y+30); }
    doc.setFontSize(6.5); doc.setFont("helvetica","bold"); doc.setTextColor(...C_GRIS);
    doc.text(lbl, px, y+14, { align:"center" });
    doc.setFontSize(12); doc.setFont("helvetica","bold"); doc.setTextColor(...pColors[i]);
    doc.text(pVals[i], px, y+22, { align:"center" });
    if (i===0 && adrNuevas!=null) {
      doc.setFontSize(6); doc.setFont("helvetica","normal"); doc.setTextColor(...C_GRISM);
      doc.text(`Precio medio: €${adrNuevas}`, px, y+27, { align:"center" });
    }
  });
  if (canalesPick.length > 0) {
    const dotColors2 = ["#0A2540","#D4A017","#059669","#7C3AED","#94A3B8"];
    let cx2 = M + 4; const py2 = y + 33;
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

  function addBar(x, bY, totalW, label, value, maxVal, hexColor, pct) {
    const barH = 3.5; const lblW = 28; const valW = 26;
    const barW = totalW - lblW - valW;
    const fillPct = maxVal > 0 ? Math.min(value / maxVal, 1) : 0;
    doc.setFontSize(7); doc.setFont("helvetica","bold"); doc.setTextColor(0,0,0);
    doc.text(label, x, bY, { maxWidth: lblW - 1 });
    doc.setFillColor(220, 228, 238); doc.rect(x + lblW, bY - 3.2, barW, barH, "F");
    if (fillPct > 0) {
      const [r,g,b] = hexColor.match(/\w\w/g).map(h => parseInt(h, 16));
      doc.setFillColor(r, g, b); doc.rect(x + lblW, bY - 3.2, barW * fillPct, barH, "F");
    }
    doc.setFontSize(7); doc.setFont("helvetica","bold"); doc.setTextColor(0,0,0);
    const valTxt = `€${Math.round(value).toLocaleString("es-ES")}` + (pct!=null ? `  ·  ${pct}%` : '');
    doc.text(valTxt, x + lblW + barW + 1, bY);
  }

  const barRowH = 7;
  const mixH    = 3 + 7 + 3 * barRowH + 3;

  doc.setFillColor(255,255,255); doc.setDrawColor(...C_BORDE);
  doc.roundedRect(M, y, W - M * 2, mixH, 2, 2, "FD");

  const lx = M + 3;
  let ly = y + 4;
  doc.setFontSize(6.5); doc.setFont("helvetica","bold"); doc.setTextColor(...C_GRIS);
  doc.text("HAB. VS F&B VS SALAS", lx, ly); ly += 7;
  const totHF = (revHabAyer || 0) + (revFnbAyer || 0) + (revSalasAyer || 0);
  const pctHab   = totHF > 0 ? Math.round((revHabAyer || 0) / totHF * 100) : 0;
  const pctFnb   = totHF > 0 ? Math.round((revFnbAyer || 0) / totHF * 100) : 0;
  const pctSalas = totHF > 0 ? Math.round((revSalasAyer || 0) / totHF * 100) : 0;
  addBar(lx, ly, W - M * 2 - 6, "Habitaciones", revHabAyer   || 0, totHF || 1, "#0A2540", pctHab);   ly += barRowH;
  addBar(lx, ly, W - M * 2 - 6, "F&B",          revFnbAyer   || 0, totHF || 1, "#D4A017", pctFnb);   ly += barRowH;
  addBar(lx, ly, W - M * 2 - 6, "Salas",        revSalasAyer || 0, totHF || 1, "#7C3AED", pctSalas);

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
    const pColW2 = (W-M*2)/7;
    const paceH = 31;
    doc.setFillColor(255,255,255); doc.setDrawColor(...C_BORDE);
    doc.roundedRect(M, y, W-M*2, paceH, 2, 2, "FD");
    paceProximos7.forEach((d, i) => {
      const cx = M + i*pColW2 + pColW2/2;
      if (i>0) { doc.setDrawColor(...C_BORDE); doc.line(M+i*pColW2, y+2, M+i*pColW2, y+paceH-2); }
      const dow = DIAS_S[new Date(d.fecha+'T00:00:00').getDay()];
      const dayNum = parseInt(d.fecha.split('-')[2]);
      doc.setFontSize(6.5); doc.setFont("helvetica","normal"); doc.setTextColor(...C_GRISM);
      doc.text(dow, cx, y+5, { align:"center" });
      doc.setFontSize(7); doc.setFont("helvetica","bold"); doc.setTextColor(...C_GRIS);
      doc.text(String(dayNum), cx, y+9, { align:"center" });
      const bH = 8; const bW2 = pColW2*0.55; const bX2 = cx-bW2/2;
      const pct2 = d.occ_pct!=null ? Math.min(d.occ_pct/100, 1) : 0;
      doc.setFillColor(220,228,238); doc.rect(bX2, y+11, bW2, bH, "F");
      if (pct2>0) {
        const col = d.occ_pct>=80 ? C_VERDE : d.occ_pct>=60 ? [196,154,10] : C_AZUL;
        doc.setFillColor(...col); doc.rect(bX2, y+11+(bH*(1-pct2)), bW2, bH*pct2, "F");
      }
      const occ_col = d.occ_pct!=null && d.occ_pct>=80 ? C_VERDE : d.occ_pct!=null && d.occ_pct>=60 ? [196,154,10] : C_AZUL;
      doc.setFontSize(7); doc.setFont("helvetica","bold"); doc.setTextColor(...occ_col);
      doc.text(d.occ_pct!=null?d.occ_pct+"%":"—", cx, y+22, { align:"center" });
      doc.setFontSize(6); doc.setFont("helvetica","normal"); doc.setTextColor(...C_GRISM);
      doc.text(d.adr!=null?`ADR €${d.adr}`:"—", cx, y+27, { align:"center" });
    });
    y += paceH + 5;
  }

  return Buffer.from(doc.output("arraybuffer")).toString("base64");
}
