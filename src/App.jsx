import { useState, useEffect } from "react";
import { supabase } from "./supabase";
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from "recharts";

const C = {
  bg: "#F7F3EE", bgCard: "#FFFFFF", bgDeep: "#1C1814",
  accent: "#C8933A", accentLight: "#F0DDB8", accentDark: "#8A6020",
  text: "#1C1814", textMid: "#6B5E4E", textLight: "#A8998A",
  border: "#E8E0D5", green: "#2D7A4F", greenLight: "#D4EDDE",
  red: "#C0392B", redLight: "#FDECEA", blue: "#2C5F8A", blueLight: "#D6E8F5",
};

const MESES = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: C.bgDeep, borderRadius: 8, padding: "10px 14px", border: `1px solid ${C.accent}22`, fontSize: 12, color: "#E8DDD0" }}>
      <p style={{ color: C.accent, fontWeight: 600, marginBottom: 6 }}>{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color || "#E8DDD0", margin: "2px 0" }}>
          {p.name}: <b style={{ color: "#fff" }}>{p.value}</b>
        </p>
      ))}
    </div>
  );
};

function Card({ children, style = {} }) {
  return (
    <div style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 14, padding: "22px 24px", ...style }}>
      {children}
    </div>
  );
}

function KpiCard({ label, value, change, sub, up, i }) {
  return (
    <div style={{
      background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 14,
      padding: "20px 22px", animation: `fadeUp 0.5s ease ${i * 0.08}s both`,
      borderTop: `3px solid ${C.accent}`, position: "relative", overflow: "hidden",
    }}>
      <div style={{ position: "absolute", bottom: -20, right: -20, width: 80, height: 80, background: `${C.accent}0A`, borderRadius: "50%" }} />
      <p style={{ fontSize: 11, color: C.textLight, textTransform: "uppercase", letterSpacing: "1.5px" }}>{label}</p>
      <p style={{ fontSize: 30, fontWeight: 700, fontFamily: "'Playfair Display', serif", color: C.text, margin: "8px 0 6px", letterSpacing: "-1px" }}>{value}</p>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 4, background: up ? C.greenLight : C.redLight, color: up ? C.green : C.red }}>{change}</span>
        <span style={{ fontSize: 11, color: C.textLight }}>{sub}</span>
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

      const ws = wb.Sheets["📅 Producción Diaria"];
      if (!ws) throw new Error("No se encontró la hoja '📅 Producción Diaria'");

      const rows = XLSX.utils.sheet_to_json(ws, { header: 1, range: 4 });
      const produccionRows = [];

      for (const row of rows) {
        if (!row[0]) continue;
        const fecha = row[0];
        const hab_ocupadas = parseFloat(row[1]) || null;
        const hab_disponibles = parseFloat(row[2]) || null;
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

      const wsPu = wb.Sheets["🎯 Pickup"];
      const pickupRows = [];
      if (wsPu) {
        const rowsPu = XLSX.utils.sheet_to_json(wsPu, { header: 1, range: 4 });
        for (const row of rowsPu) {
          if (!row[0]) continue;
          const fecha = row[0];
          let fechaISO;
          if (typeof fecha === "number") {
            const d = XLSX.SSF.parse_date_code(fecha);
            fechaISO = `${d.y}-${String(d.m).padStart(2,"0")}-${String(d.d).padStart(2,"0")}`;
          } else if (typeof fecha === "string") {
            const parts = fecha.split("/");
            if (parts.length === 3) fechaISO = `${parts[2]}-${parts[1]}-${parts[0]}`;
          }
          if (!fechaISO) continue;
          const meses = [row[1],row[2],row[3],row[4],row[5],row[6],row[7],row[8],row[9],row[10],row[11],row[12]];
          if (meses.every(m => !m)) continue;
          pickupRows.push({
            hotel_id: session.user.id, fecha_pickup: fechaISO,
            mes_enero: parseInt(meses[0])||0, mes_febrero: parseInt(meses[1])||0,
            mes_marzo: parseInt(meses[2])||0, mes_abril: parseInt(meses[3])||0,
            mes_mayo: parseInt(meses[4])||0, mes_junio: parseInt(meses[5])||0,
            mes_julio: parseInt(meses[6])||0, mes_agosto: parseInt(meses[7])||0,
            mes_septiembre: parseInt(meses[8])||0, mes_octubre: parseInt(meses[9])||0,
            mes_noviembre: parseInt(meses[10])||0, mes_diciembre: parseInt(meses[11])||0,
            total_dia: meses.reduce((a,b) => a+(parseInt(b)||0), 0),
            notas: row[14] || "",
          });
        }
      }

      if (produccionRows.length === 0) throw new Error("No se encontraron datos en la hoja de Producción Diaria");

      await supabase.from("produccion_diaria").delete().eq("hotel_id", session.user.id);
      await supabase.from("pickup_diario").delete().eq("hotel_id", session.user.id);

      const { error: err1 } = await supabase.from("produccion_diaria").insert(produccionRows);
      if (err1) throw new Error("Error al guardar producción: " + err1.message);

      if (pickupRows.length > 0) {
        const { error: err2 } = await supabase.from("pickup_diario").insert(pickupRows);
        if (err2) throw new Error("Error al guardar pickup: " + err2.message);
      }

      setResultado({ produccion: produccionRows.length, pickup: pickupRows.length });
      if (onImportado) onImportado();
    } catch (e) {
      setError(e.message);
    }
    setLoading(false);
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
      <div style={{ background: "#fff", borderRadius: 16, padding: "36px 40px", width: 480, boxShadow: "0 24px 60px rgba(0,0,0,0.3)", fontFamily: "'DM Sans', sans-serif" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <div>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, fontWeight: 700, color: "#1C1814" }}>Importar datos</h2>
            <p style={{ fontSize: 12, color: "#A8998A", marginTop: 4 }}>Sube tu plantilla Excel de RevManager</p>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#A8998A" }}>✕</button>
        </div>
        {!resultado ? (
          <>
            <div onClick={() => document.getElementById("excel-input").click()} style={{ border: "2px dashed #E8E0D5", borderRadius: 12, padding: "40px 20px", textAlign: "center", cursor: "pointer", background: "#F7F3EE", marginBottom: 16 }}>
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
            </div>
            <button onClick={onClose} style={{ background: "#C8933A", color: "#fff", border: "none", borderRadius: 10, padding: "12px 32px", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>Ver dashboard</button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── DASHBOARD VIEW ───────────────────────────────────────────────
function DashboardView({ datos }) {
  const { produccion } = datos;

  if (!produccion || produccion.length === 0) return <EmptyState />;

  // Calcular KPIs del mes actual
  const ahora = new Date();
  const mesActual = ahora.getMonth();
  const anioActual = ahora.getFullYear();

  const datosMes = produccion.filter(d => {
    const f = new Date(d.fecha);
    return f.getMonth() === mesActual && f.getFullYear() === anioActual;
  });

  const totalHabOcupadas = datosMes.reduce((a, d) => a + (d.hab_ocupadas || 0), 0);
  const totalHabDisponibles = datosMes.reduce((a, d) => a + (d.hab_disponibles || 0), 0);
  const totalRevHab = datosMes.reduce((a, d) => a + (d.revenue_hab || 0), 0);
  const totalRevTotal = datosMes.reduce((a, d) => a + (d.revenue_total || 0), 0);
  const totalRevFnb = datosMes.reduce((a, d) => a + (d.revenue_fnb || 0), 0);
  const totalRevOtros = datosMes.reduce((a, d) => a + (d.revenue_otros || 0), 0);

  const occ = totalHabDisponibles > 0 ? (totalHabOcupadas / totalHabDisponibles * 100).toFixed(1) : 0;
  const adr = totalHabOcupadas > 0 ? (totalRevHab / totalHabOcupadas).toFixed(0) : 0;
  const revpar = totalHabDisponibles > 0 ? (totalRevHab / totalHabDisponibles).toFixed(0) : 0;
  const trevpar = totalHabDisponibles > 0 ? ((totalRevHab + totalRevFnb + totalRevOtros) / totalHabDisponibles).toFixed(0) : 0;

  // Datos por mes para gráfica
  const porMes = MESES.map((mes, i) => {
    const d = produccion.filter(r => new Date(r.fecha).getMonth() === i);
    const habOcu = d.reduce((a, r) => a + (r.hab_ocupadas || 0), 0);
    const habDis = d.reduce((a, r) => a + (r.hab_disponibles || 0), 0);
    const revH = d.reduce((a, r) => a + (r.revenue_hab || 0), 0);
    const revFnb = d.reduce((a, r) => a + (r.revenue_fnb || 0), 0);
    const revOtros = d.reduce((a, r) => a + (r.revenue_otros || 0), 0);
    return {
      mes,
      occ: habDis > 0 ? Math.round(habOcu / habDis * 100) : 0,
      adr: habOcu > 0 ? Math.round(revH / habOcu) : 0,
      revpar: habDis > 0 ? Math.round(revH / habDis) : 0,
      trevpar: habDis > 0 ? Math.round((revH + revFnb + revOtros) / habDis) : 0,
    };
  }).filter(d => d.occ > 0 || d.adr > 0);

  const kpis = [
    { label: "Ocupación MTD", value: `${occ}%`, change: `${occ}%`, sub: "mes actual", up: parseFloat(occ) > 60 },
    { label: "ADR MTD", value: `€${adr}`, change: `€${adr}`, sub: "mes actual", up: true },
    { label: "RevPAR MTD", value: `€${revpar}`, change: `€${revpar}`, sub: "mes actual", up: true },
    { label: "TRevPAR MTD", value: `€${trevpar}`, change: `€${trevpar}`, sub: "mes actual", up: true },
    { label: "Revenue Hab.", value: `€${Math.round(totalRevHab).toLocaleString()}`, change: `€${Math.round(totalRevHab).toLocaleString()}`, sub: "mes actual", up: true },
    { label: "Revenue Total", value: `€${Math.round(totalRevTotal).toLocaleString()}`, change: `€${Math.round(totalRevTotal).toLocaleString()}`, sub: "mes actual", up: true },
  ];

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, fontWeight: 700, color: C.text }}>Panel de Control</h2>
        <p style={{ fontSize: 12, color: C.textLight, marginTop: 4 }}>Datos reales · {MESES[mesActual]} {anioActual}</p>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 14, marginBottom: 24 }}>
        {kpis.map((k, i) => <KpiCard key={i} {...k} i={i} />)}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "minmax(0,3fr) minmax(0,2fr)", gap: 16, marginBottom: 16 }}>
        <Card>
          <p style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700, fontSize: 16, color: C.text, marginBottom: 4 }}>RevPAR — Evolución</p>
          <p style={{ fontSize: 11, color: C.textLight, marginBottom: 18 }}>RevPAR vs TRevPAR (€/hab disponible)</p>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={porMes}>
              <defs>
                <linearGradient id="gRevpar" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={C.accent} stopOpacity={0.25} />
                  <stop offset="95%" stopColor={C.accent} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
              <XAxis dataKey="mes" tick={{ fill: C.textLight, fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: C.textLight, fontSize: 11 }} axisLine={false} tickLine={false} unit="€" />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="revpar" name="RevPAR" stroke={C.accent} strokeWidth={2.5} fill="url(#gRevpar)" dot={false} />
              <Line type="monotone" dataKey="trevpar" name="TRevPAR" stroke={C.blue} strokeWidth={1.5} dot={false} strokeDasharray="5 4" />
            </AreaChart>
          </ResponsiveContainer>
        </Card>
        <Card>
          <p style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700, fontSize: 16, color: C.text, marginBottom: 4 }}>Ocupación vs ADR</p>
          <p style={{ fontSize: 11, color: C.textLight, marginBottom: 18 }}>Correlación mensual</p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={porMes} barSize={14}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.border} vertical={false} />
              <XAxis dataKey="mes" tick={{ fill: C.textLight, fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis yAxisId="left" tick={{ fill: C.textLight, fontSize: 11 }} axisLine={false} tickLine={false} unit="%" />
              <YAxis yAxisId="right" orientation="right" tick={{ fill: C.textLight, fontSize: 11 }} axisLine={false} tickLine={false} unit="€" />
              <Tooltip content={<CustomTooltip />} />
              <Bar yAxisId="left" dataKey="occ" name="Ocupación" fill={`${C.accent}99`} radius={[3,3,0,0]} />
              <Bar yAxisId="right" dataKey="adr" name="ADR" fill={C.blue} radius={[3,3,0,0]} fillOpacity={0.7} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>
      <Card>
        <p style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700, fontSize: 16, color: C.text, marginBottom: 16 }}>Resumen por Mes</p>
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
                <tr key={i} style={{ borderBottom: `1px solid ${C.border}`, background: i % 2 === 0 ? C.bg : C.bgCard }}>
                  <td style={{ padding: "10px 12px", fontWeight: 600, color: C.text }}>{d.mes}</td>
                  <td style={{ padding: "10px 12px", textAlign: "right", color: d.occ > 80 ? C.green : C.textMid }}>{d.occ}%</td>
                  <td style={{ padding: "10px 12px", textAlign: "right", color: C.textMid }}>€{d.adr}</td>
                  <td style={{ padding: "10px 12px", textAlign: "right", fontWeight: 600, color: C.accent }}>€{d.revpar}</td>
                  <td style={{ padding: "10px 12px", textAlign: "right", color: C.blue }}>€{d.trevpar}</td>
                  <td style={{ padding: "10px 12px", textAlign: "right", color: C.textMid }}>
                    €{produccion.filter(r => new Date(r.fecha).getMonth() === MESES.indexOf(d.mes)).reduce((a,r) => a+(r.revenue_hab||0),0).toLocaleString()}
                  </td>
                  <td style={{ padding: "10px 12px", textAlign: "right", color: C.textMid }}>
                    €{produccion.filter(r => new Date(r.fecha).getMonth() === MESES.indexOf(d.mes)).reduce((a,r) => a+(r.revenue_total||0),0).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

// ─── PICKUP VIEW ──────────────────────────────────────────────────
function PickupView({ datos }) {
  const { pickup } = datos;
  if (!pickup || pickup.length === 0) return <EmptyState mensaje="Importa tu plantilla con datos de pickup para ver las curvas aquí" />;

  const totalesPorMes = MESES.map((mes, i) => {
    const campo = `mes_${["enero","febrero","marzo","abril","mayo","junio","julio","agosto","septiembre","octubre","noviembre","diciembre"][i]}`;
    return { mes, total: pickup.reduce((a, d) => a + (d[campo] || 0), 0) };
  }).filter(d => d.total > 0);

  const ultimosDias = [...pickup].sort((a,b) => new Date(b.fecha_pickup) - new Date(a.fecha_pickup)).slice(0, 14).reverse();

  const pickupHoy = pickup.reduce((a,d) => a + (d.total_dia || 0), 0);

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, fontWeight: 700, color: C.text }}>Seguimiento de Pickup</h2>
        <p style={{ fontSize: 12, color: C.textLight, marginTop: 4 }}>Ritmo de captación de reservas</p>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 14, marginBottom: 24 }}>
        <KpiCard label="Total Pickup" value={pickupHoy} change={`${pickupHoy} reservas`} sub="total importado" up={true} i={0} />
        <KpiCard label="Días registrados" value={pickup.length} change={`${pickup.length} días`} sub="con pickup" up={true} i={1} />
        <KpiCard label="Media diaria" value={pickup.length > 0 ? Math.round(pickupHoy/pickup.length) : 0} change="reservas/día" sub="media" up={true} i={2} />
      </div>
      <Card style={{ marginBottom: 16 }}>
        <p style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700, fontSize: 16, color: C.text, marginBottom: 4 }}>Pickup acumulado por mes de llegada</p>
        <p style={{ fontSize: 11, color: C.textLight, marginBottom: 18 }}>Total reservas captadas para cada mes</p>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={totalesPorMes} barSize={32}>
            <CartesianGrid strokeDasharray="3 3" stroke={C.border} vertical={false} />
            <XAxis dataKey="mes" tick={{ fill: C.textLight, fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: C.textLight, fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="total" name="Reservas" fill={C.accent} radius={[4,4,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </Card>
      <Card>
        <p style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700, fontSize: 16, color: C.text, marginBottom: 4 }}>Pickup diario — últimos días</p>
        <p style={{ fontSize: 11, color: C.textLight, marginBottom: 18 }}>Reservas totales captadas cada día</p>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={ultimosDias.map(d => ({ dia: d.fecha_pickup?.slice(5), total: d.total_dia || 0 }))}>
            <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
            <XAxis dataKey="dia" tick={{ fill: C.textLight, fontSize: 10 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: C.textLight, fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Line type="monotone" dataKey="total" name="Pickup" stroke={C.accent} strokeWidth={2.5} dot={{ fill: C.accent, r: 4 }} />
          </LineChart>
        </ResponsiveContainer>
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
      await supabase.from("hoteles").insert({ nombre: hotelNombre, ciudad: hotelCiudad, habitaciones: parseInt(habitaciones) || null });
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
          <div style={{ width: 52, height: 52, background: C.accent, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, margin: "0 auto 14px" }}>🏨</div>
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
  { key: "dashboard", icon: "◈", label: "Dashboard" },
  { key: "pickup", icon: "⟳", label: "Pickup" },
];

export default function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("dashboard");
  const [importar, setImportar] = useState(false);
  const [datos, setDatos] = useState({ produccion: [], pickup: [] });
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
    const [{ data: produccion }, { data: pickup }] = await Promise.all([
      supabase.from("produccion_diaria").select("*").eq("hotel_id", session.user.id).order("fecha"),
      supabase.from("pickup_diario").select("*").eq("hotel_id", session.user.id).order("fecha_pickup"),
    ]);
    setDatos({ produccion: produccion || [], pickup: pickup || [] });
    setCargandoDatos(false);
  };

  const handleLogout = async () => { await supabase.auth.signOut(); };

  const views = { dashboard: DashboardView, pickup: PickupView };
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
        .nav-item:hover { background: ${C.accentLight} !important; color: ${C.accentDark} !important; }
      `}</style>

      {/* Sidebar */}
      <div style={{ width: 220, flexShrink: 0, minHeight: "100vh", background: C.bgDeep, display: "flex", flexDirection: "column", position: "sticky", top: 0, height: "100vh" }}>
        <div style={{ padding: "24px 20px 20px", borderBottom: "1px solid #FFFFFF11" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 36, height: 36, background: C.accent, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>🏨</div>
            <div>
              <p style={{ fontFamily: "'Playfair Display', serif", color: "#F7F3EE", fontWeight: 700, fontSize: 15 }}>RevManager</p>
              <p style={{ fontSize: 10, color: C.accentLight, opacity: 0.6 }}>Hotel Independiente</p>
            </div>
          </div>
        </div>
        <nav style={{ flex: 1, padding: "16px 12px" }}>
          {NAV.map(n => (
            <button key={n.key} className="nav-item" onClick={() => setView(n.key)} style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 8, border: "none", cursor: "pointer", background: view===n.key ? C.accent : "transparent", color: view===n.key ? "#fff" : "#A8998A", fontSize: 13, fontWeight: view===n.key ? 600 : 400, fontFamily: "'DM Sans', sans-serif", marginBottom: 2, textAlign: "left" }}>
              <span style={{ fontSize: 14 }}>{n.icon}</span>{n.label}
            </button>
          ))}
        </nav>
        <div style={{ padding: "16px 12px", borderTop: "1px solid #FFFFFF11" }}>
          <p style={{ fontSize: 11, color: "#FFFFFF44", marginBottom: 8, paddingLeft: 4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{session.user.email}</p>
          <button onClick={handleLogout} style={{ width: "100%", padding: "10px", borderRadius: 8, border: "1px solid #FFFFFF22", background: "transparent", color: "#A8998A", cursor: "pointer", fontSize: 12, fontFamily: "'DM Sans', sans-serif" }}>Cerrar sesión</button>
        </div>
      </div>

      {/* Main */}
      <main style={{ flex: 1, minWidth: 0, padding: "28px 32px", overflowY: "auto", height: "100vh" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
          <div>
            <p style={{ fontSize: 11, color: C.textLight, textTransform: "uppercase", letterSpacing: "1.5px" }}>RevManager · Panel de Revenue</p>
            <p style={{ fontSize: 12, color: C.textLight, marginTop: 2 }}>
              {datos.produccion.length > 0 ? `${datos.produccion.length} días importados` : "Sin datos — importa tu plantilla"}
            </p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <button onClick={() => setImportar(true)} style={{ background: C.accent, color: "#fff", border: "none", borderRadius: 20, padding: "6px 16px", fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>
              📊 Importar datos
            </button>
            <div style={{ padding: "6px 14px", borderRadius: 20, background: C.greenLight, color: C.green, fontSize: 11, fontWeight: 600, display: "flex", alignItems: "center", gap: 5 }}>
              <span style={{ width: 6, height: 6, background: C.green, borderRadius: "50%", display: "inline-block" }} />
              {cargandoDatos ? "Cargando..." : "En directo"}
            </div>
          </div>
        </div>
        {cargandoDatos ? <LoadingSpinner /> : <View datos={datos} />}
      </main>

      {importar && <ImportarExcel onClose={() => setImportar(false)} session={session} onImportado={cargarDatos} />}
    </div>
  );
}