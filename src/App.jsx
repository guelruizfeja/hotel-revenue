import { useState, useRef, useCallback } from "react";
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, ReferenceLine
} from "recharts";

// ─── DESIGN TOKENS ───────────────────────────────────────────────
const C = {
  bg: "#F7F3EE",
  bgCard: "#FFFFFF",
  bgDeep: "#1C1814",
  accent: "#C8933A",
  accentLight: "#F0DDB8",
  accentDark: "#8A6020",
  text: "#1C1814",
  textMid: "#6B5E4E",
  textLight: "#A8998A",
  border: "#E8E0D5",
  green: "#2D7A4F",
  greenLight: "#D4EDDE",
  red: "#C0392B",
  redLight: "#FDECEA",
  blue: "#2C5F8A",
  blueLight: "#D6E8F5",
};

// ─── MOCK DATA ────────────────────────────────────────────────────
const MONTHS = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];

const historicData = [
  { mes: "Ene", occ: 52, adr: 118, revpar: 61, trevpar: 88 },
  { mes: "Feb", occ: 58, adr: 124, revpar: 72, trevpar: 102 },
  { mes: "Mar", occ: 67, adr: 131, revpar: 88, trevpar: 124 },
  { mes: "Abr", occ: 74, adr: 142, revpar: 105, trevpar: 148 },
  { mes: "May", occ: 79, adr: 155, revpar: 122, trevpar: 170 },
  { mes: "Jun", occ: 85, adr: 168, revpar: 143, trevpar: 198 },
  { mes: "Jul", occ: 94, adr: 188, revpar: 177, trevpar: 240 },
  { mes: "Ago", occ: 97, adr: 195, revpar: 189, trevpar: 255 },
  { mes: "Sep", occ: 82, adr: 162, revpar: 133, trevpar: 184 },
  { mes: "Oct", occ: 71, adr: 148, revpar: 105, trevpar: 148 },
  { mes: "Nov", occ: 59, adr: 128, revpar: 76, trevpar: 108 },
  { mes: "Dic", occ: 63, adr: 138, revpar: 87, trevpar: 122 },
];

const forecastData = historicData.map((d, i) => ({
  ...d,
  forecastOcc: Math.min(100, Math.round(d.occ * (1 + (Math.random() * 0.1 - 0.02)))),
  forecastAdr: Math.round(d.adr * (1 + (Math.random() * 0.08 + 0.02))),
  forecastRevpar: Math.round(d.revpar * (1 + (Math.random() * 0.1 + 0.03))),
  budget: Math.round(d.revpar * 1.08),
  actual: i < 8 ? Math.round(d.revpar * (0.95 + Math.random() * 0.12)) : null,
}));

const pickupData = [
  { dia: "24/01", hoy: 42, ayer: 39, semAnt: 35, anioAnt: 30 },
  { dia: "25/01", hoy: 48, ayer: 44, semAnt: 38, anioAnt: 32 },
  { dia: "26/01", hoy: 55, ayer: 51, semAnt: 44, anioAnt: 38 },
  { dia: "27/01", hoy: 61, ayer: 58, semAnt: 50, anioAnt: 44 },
  { dia: "28/01", hoy: 68, ayer: 63, semAnt: 55, anioAnt: 48 },
  { dia: "29/01", hoy: 74, ayer: 70, semAnt: 61, anioAnt: 52 },
  { dia: "30/01", hoy: 79, ayer: 75, semAnt: 68, anioAnt: 58 },
  { dia: "31/01", hoy: 83, ayer: 80, semAnt: 72, anioAnt: 62 },
  { dia: "01/02", hoy: 87, ayer: 84, semAnt: 77, anioAnt: 67 },
  { dia: "02/02", hoy: 91, ayer: 88, semAnt: 82, anioAnt: 72 },
  { dia: "03/02", hoy: 94, ayer: 92, semAnt: 86, anioAnt: 76 },
  { dia: "04/02", hoy: 96, ayer: 94, semAnt: 89, anioAnt: 80 },
  { dia: "05/02", hoy: 97, ayer: 96, semAnt: 92, anioAnt: 84 },
  { dia: "06/02", hoy: 98, ayer: 97, semAnt: 94, anioAnt: 87 },
];

const canalData = [
  { name: "Booking.com", reservas: 284, ingresos: 42800, adr: 151, color: "#003580" },
  { name: "Directo Web", reservas: 198, ingresos: 36200, adr: 183, color: C.accent },
  { name: "Expedia", reservas: 142, ingresos: 19800, adr: 139, color: "#FF6B00" },
  { name: "Teléfono", reservas: 96, ingresos: 18200, adr: 190, color: C.green },
  { name: "GDS", reservas: 54, ingresos: 10800, adr: 200, color: C.blue },
  { name: "TTOO", reservas: 38, ingresos: 5700, adr: 150, color: "#9B59B6" },
];

const tarifaData = [
  { name: "BAR Flexible", value: 38, color: C.accent },
  { name: "No Reembolsable", value: 28, color: C.accentDark },
  { name: "Grupos", value: 16, color: C.blue },
  { name: "Oferta Especial", value: 11, color: C.green },
  { name: "Corporativo", value: 7, color: C.textMid },
];

const mercadoData = [
  { pais: "España", reservas: 312, pct: 38, adr: 158 },
  { pais: "Francia", reservas: 178, pct: 22, adr: 172 },
  { pais: "Alemania", reservas: 124, pct: 15, adr: 168 },
  { pais: "Reino Unido", reservas: 98, pct: 12, adr: 180 },
  { pais: "EE.UU.", reservas: 72, pct: 9, adr: 210 },
  { pais: "Otros", reservas: 28, pct: 4, adr: 145 },
];

// ─── HELPERS ──────────────────────────────────────────────────────
const fmt = (n, prefix = "", suffix = "") =>
  `${prefix}${Number(n).toLocaleString("es-ES")}${suffix}`;

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: C.bgDeep, borderRadius: 8, padding: "10px 14px",
      border: `1px solid ${C.accent}22`, fontSize: 12, color: "#E8DDD0"
    }}>
      <p style={{ color: C.accent, fontWeight: 600, marginBottom: 6 }}>{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color || "#E8DDD0", margin: "2px 0" }}>
          {p.name}: <b style={{ color: "#fff" }}>{p.value}</b>
        </p>
      ))}
    </div>
  );
};

// ─── COMPONENTS ───────────────────────────────────────────────────
function Card({ children, style = {} }) {
  return (
    <div style={{
      background: C.bgCard,
      border: `1px solid ${C.border}`,
      borderRadius: 14,
      padding: "22px 24px",
      ...style
    }}>
      {children}
    </div>
  );
}

function KpiCard({ label, value, change, sub, up, i }) {
  return (
    <div style={{
      background: C.bgCard,
      border: `1px solid ${C.border}`,
      borderRadius: 14,
      padding: "20px 22px",
      animation: `fadeUp 0.5s ease ${i * 0.08}s both`,
      borderTop: `3px solid ${C.accent}`,
      position: "relative",
      overflow: "hidden",
    }}>
      <div style={{
        position: "absolute", bottom: -20, right: -20,
        width: 80, height: 80,
        background: `${C.accent}0A`,
        borderRadius: "50%"
      }} />
      <p style={{ fontSize: 11, color: C.textLight, textTransform: "uppercase", letterSpacing: "1.5px", fontFamily: "'DM Sans', sans-serif" }}>
        {label}
      </p>
      <p style={{ fontSize: 30, fontWeight: 700, fontFamily: "'Playfair Display', serif", color: C.text, margin: "8px 0 6px", letterSpacing: "-1px" }}>
        {value}
      </p>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{
          fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 4,
          background: up ? C.greenLight : C.redLight,
          color: up ? C.green : C.red,
        }}>
          {change}
        </span>
        <span style={{ fontSize: 11, color: C.textLight }}>{sub}</span>
      </div>
    </div>
  );
}

function SectionHeader({ title, sub }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, fontWeight: 700, color: C.text, letterSpacing: "-0.5px" }}>
        {title}
      </h2>
      {sub && <p style={{ fontSize: 12, color: C.textLight, marginTop: 4, fontFamily: "'DM Sans', sans-serif" }}>{sub}</p>}
    </div>
  );
}

// ─── UPLOAD PANEL ─────────────────────────────────────────────────
function UploadPanel({ onClose }) {
  const [dragging, setDragging] = useState(false);
  const [file, setFile] = useState(null);
  const ref = useRef();

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) setFile(f);
  };

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(28,24,20,0.6)",
      backdropFilter: "blur(4px)", zIndex: 100,
      display: "flex", alignItems: "center", justifyContent: "center"
    }}>
      <div style={{
        background: C.bgCard, borderRadius: 16, padding: 36,
        width: 480, border: `1px solid ${C.border}`,
        boxShadow: "0 24px 60px rgba(0,0,0,0.15)"
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
          <div>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, fontWeight: 700, color: C.text }}>
              Importar Datos
            </h2>
            <p style={{ fontSize: 12, color: C.textLight, marginTop: 4 }}>
              Sube tu archivo de reservas en formato Excel o CSV
            </p>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 20, color: C.textLight }}>✕</button>
        </div>

        <div
          ref={ref}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => ref.current?.querySelector("input")?.click()}
          style={{
            border: `2px dashed ${dragging ? C.accent : C.border}`,
            borderRadius: 12,
            padding: "40px 24px",
            textAlign: "center",
            cursor: "pointer",
            background: dragging ? C.accentLight : C.bg,
            transition: "all 0.2s",
            marginBottom: 20,
          }}
        >
          <input type="file" accept=".csv,.xlsx,.xls" style={{ display: "none" }} onChange={(e) => setFile(e.target.files[0])} />
          <div style={{ fontSize: 36, marginBottom: 12 }}>📂</div>
          {file ? (
            <p style={{ color: C.green, fontWeight: 600, fontSize: 14 }}>✓ {file.name}</p>
          ) : (
            <>
              <p style={{ color: C.textMid, fontSize: 14, fontWeight: 500 }}>Arrastra tu archivo aquí</p>
              <p style={{ color: C.textLight, fontSize: 12, marginTop: 4 }}>o haz clic para seleccionar</p>
            </>
          )}
        </div>

        <div style={{ background: C.bg, borderRadius: 8, padding: "12px 14px", marginBottom: 20 }}>
          <p style={{ fontSize: 11, color: C.textMid, fontWeight: 600, marginBottom: 6 }}>Columnas esperadas en tu archivo:</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {["fecha_llegada", "noches", "hab_tipo", "canal", "tarifa_tipo", "pais_origen", "precio_noche", "estado"].map(c => (
              <span key={c} style={{ fontSize: 10, background: C.accentLight, color: C.accentDark, padding: "2px 8px", borderRadius: 4, fontFamily: "monospace" }}>{c}</span>
            ))}
          </div>
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={onClose} style={{
            flex: 1, padding: "12px", border: `1px solid ${C.border}`,
            borderRadius: 8, background: "none", cursor: "pointer",
            color: C.textMid, fontSize: 13, fontFamily: "'DM Sans', sans-serif"
          }}>
            Cancelar
          </button>
          <button onClick={onClose} style={{
            flex: 2, padding: "12px", border: "none",
            borderRadius: 8, background: C.accent, cursor: "pointer",
            color: "#fff", fontSize: 13, fontWeight: 600, fontFamily: "'DM Sans', sans-serif"
          }}>
            {file ? "Procesar Archivo" : "Usar Datos de Ejemplo"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── VIEWS ────────────────────────────────────────────────────────
function DashboardView() {
  const kpis = [
    { label: "Ocupación MTD", value: "74,2%", change: "+3.1pp", sub: "vs mismo período año ant.", up: true },
    { label: "ADR MTD", value: "€162", change: "+€8", sub: "vs año anterior", up: true },
    { label: "RevPAR MTD", value: "€120", change: "+12,4%", sub: "vs año anterior", up: true },
    { label: "TRevPAR MTD", value: "€168", change: "+9,8%", sub: "vs año anterior", up: true },
    { label: "Pickup 7 días", value: "+142", change: "+18", sub: "reservas netas esta semana", up: true },
    { label: "Cancelaciones", value: "23", change: "+5", sub: "vs semana anterior", up: false },
  ];

  return (
    <div>
      <SectionHeader
        title="Panel de Control"
        sub="Resumen de rendimiento · Febrero 2026 · Hotel Ejemplo"
      />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, marginBottom: 24 }}>
        {kpis.map((k, i) => <KpiCard key={i} {...k} i={i} />)}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "3fr 2fr", gap: 16, marginBottom: 16 }}>
        <Card>
          <p style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700, fontSize: 16, color: C.text, marginBottom: 4 }}>
            RevPAR — Evolución Anual
          </p>
          <p style={{ fontSize: 11, color: C.textLight, marginBottom: 18 }}>Real vs Año anterior (€/hab disponible)</p>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={historicData}>
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
          <p style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700, fontSize: 16, color: C.text, marginBottom: 4 }}>
            Ocupación vs ADR
          </p>
          <p style={{ fontSize: 11, color: C.textLight, marginBottom: 18 }}>Correlación mensual</p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={historicData} barSize={14}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.border} vertical={false} />
              <XAxis dataKey="mes" tick={{ fill: C.textLight, fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis yAxisId="left" tick={{ fill: C.textLight, fontSize: 11 }} axisLine={false} tickLine={false} unit="%" />
              <YAxis yAxisId="right" orientation="right" tick={{ fill: C.textLight, fontSize: 11 }} axisLine={false} tickLine={false} unit="€" />
              <Tooltip content={<CustomTooltip />} />
              <Bar yAxisId="left" dataKey="occ" name="Ocupación" fill={`${C.accent}99`} radius={[3, 3, 0, 0]} />
              <Bar yAxisId="right" dataKey="adr" name="ADR" fill={C.blue} radius={[3, 3, 0, 0]} fillOpacity={0.7} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Tabla resumen mensual */}
      <Card>
        <p style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700, fontSize: 16, color: C.text, marginBottom: 16 }}>
          Resumen Mensual Completo
        </p>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: `2px solid ${C.border}` }}>
                {["Mes", "Ocup.", "ADR", "RevPAR", "TRevPAR", "vs AÑO ANT"].map(h => (
                  <th key={h} style={{ padding: "8px 12px", textAlign: "right", fontSize: 10, color: C.textLight, textTransform: "uppercase", letterSpacing: "1px", fontFamily: "'DM Sans', sans-serif", fontWeight: 600 }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {historicData.map((d, i) => {
                const vsAnt = ((d.revpar / (d.revpar * 0.91) - 1) * 100).toFixed(1);
                return (
                  <tr key={i} style={{ borderBottom: `1px solid ${C.border}`, background: i % 2 === 0 ? C.bg : C.bgCard }}>
                    <td style={{ padding: "10px 12px", fontWeight: 600, color: C.text }}>{d.mes}</td>
                    <td style={{ padding: "10px 12px", textAlign: "right", color: d.occ > 80 ? C.green : C.textMid }}>{d.occ}%</td>
                    <td style={{ padding: "10px 12px", textAlign: "right", color: C.textMid }}>€{d.adr}</td>
                    <td style={{ padding: "10px 12px", textAlign: "right", fontWeight: 600, color: C.accent }}>€{d.revpar}</td>
                    <td style={{ padding: "10px 12px", textAlign: "right", color: C.blue }}>€{d.trevpar}</td>
                    <td style={{ padding: "10px 12px", textAlign: "right" }}>
                      <span style={{ color: C.green, fontSize: 12, fontWeight: 600 }}>+{vsAnt}%</span>
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

function ForecastView() {
  const [metric, setMetric] = useState("revpar");

  const metricOpts = [
    { k: "revpar", label: "RevPAR", color: C.accent },
    { k: "occ", label: "Ocupación", color: C.blue },
    { k: "adr", label: "ADR", color: C.green },
  ];

  const sel = metricOpts.find(m => m.k === metric);

  const chartData = forecastData.map(d => ({
    mes: d.mes,
    Histórico: d[metric],
    Forecast: d[`forecast${metric.charAt(0).toUpperCase() + metric.slice(1)}`] || Math.round(d[metric] * 1.05),
    Budget: d.budget || Math.round(d[metric] * 1.08),
    Real: d.actual,
  }));

  return (
    <div>
      <SectionHeader
        title="Forecast & Proyecciones"
        sub="Basado en histórico con ajuste estacional · Horizonte 12 meses"
      />

      {/* Metric selector */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        {metricOpts.map(m => (
          <button key={m.k} onClick={() => setMetric(m.k)} style={{
            padding: "8px 20px", borderRadius: 8, border: `1.5px solid ${metric === m.k ? m.color : C.border}`,
            background: metric === m.k ? `${m.color}15` : "white",
            color: metric === m.k ? m.color : C.textMid,
            cursor: "pointer", fontSize: 13, fontWeight: 600,
            fontFamily: "'DM Sans', sans-serif", transition: "all 0.15s"
          }}>
            {m.label}
          </button>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14, marginBottom: 20 }}>
        {[
          { label: "RevPAR Forecast Año", value: "€118", sub: "Media anual proyectada", up: true, change: "+9.2%" },
          { label: "Mejor Mes Previsto", value: "Agosto", sub: "RevPAR €197 / Ocup. 96%", up: true, change: "Pico temporada" },
          { label: "Cumplimiento Budget", value: "94%", sub: "YTD vs presupuesto", up: false, change: "-6pp" },
        ].map((k, i) => <KpiCard key={i} {...k} i={i} />)}
      </div>

      <Card style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 18 }}>
          <div>
            <p style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700, fontSize: 16, color: C.text }}>
              {sel.label} — Forecast vs Budget vs Real
            </p>
            <p style={{ fontSize: 11, color: C.textLight, marginTop: 3 }}>Comparativa mensual del año en curso</p>
          </div>
          <div style={{ display: "flex", gap: 16, fontSize: 11, color: C.textLight, alignItems: "center" }}>
            {[
              { label: "Forecast", color: sel.color },
              { label: "Budget", color: C.textLight, dash: true },
              { label: "Real", color: C.green },
            ].map(l => (
              <span key={l.label} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <span style={{ width: l.dash ? 16 : 8, height: l.dash ? 2 : 8, background: l.color, borderRadius: l.dash ? 0 : "50%", borderTop: l.dash ? `2px dashed ${l.color}` : "none", display: "inline-block" }} />
                {l.label}
              </span>
            ))}
          </div>
        </div>
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
            <XAxis dataKey="mes" tick={{ fill: C.textLight, fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: C.textLight, fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Line type="monotone" dataKey="Forecast" stroke={sel.color} strokeWidth={2.5} dot={{ fill: sel.color, r: 4 }} />
            <Line type="monotone" dataKey="Budget" stroke={C.textLight} strokeWidth={1.5} strokeDasharray="6 4" dot={false} />
            <Line type="monotone" dataKey="Real" stroke={C.green} strokeWidth={2} dot={{ fill: C.green, r: 4 }} connectNulls={false} />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      {/* Tabla forecast */}
      <Card>
        <p style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700, fontSize: 16, color: C.text, marginBottom: 16 }}>
          Tabla Forecast Detallada
        </p>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: `2px solid ${C.border}` }}>
              {["Mes", "Ocup. Forecast", "ADR Forecast", "RevPAR Forecast", "Budget RevPAR", "Desviación", "Confianza"].map(h => (
                <th key={h} style={{ padding: "8px 12px", textAlign: "right", fontSize: 10, color: C.textLight, textTransform: "uppercase", letterSpacing: "1px", fontFamily: "'DM Sans', sans-serif", fontWeight: 600 }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {forecastData.map((d, i) => {
              const dev = d.forecastRevpar - d.budget;
              const conf = i < 3 ? 95 : i < 6 ? 88 : i < 9 ? 78 : 65;
              return (
                <tr key={i} style={{ borderBottom: `1px solid ${C.border}`, background: i % 2 === 0 ? C.bg : C.bgCard }}>
                  <td style={{ padding: "10px 12px", fontWeight: 600, color: C.text }}>{d.mes}</td>
                  <td style={{ padding: "10px 12px", textAlign: "right" }}>{d.forecastOcc}%</td>
                  <td style={{ padding: "10px 12px", textAlign: "right" }}>€{d.forecastAdr}</td>
                  <td style={{ padding: "10px 12px", textAlign: "right", fontWeight: 600, color: C.accent }}>€{d.forecastRevpar}</td>
                  <td style={{ padding: "10px 12px", textAlign: "right", color: C.textMid }}>€{d.budget}</td>
                  <td style={{ padding: "10px 12px", textAlign: "right" }}>
                    <span style={{ color: dev >= 0 ? C.green : C.red, fontWeight: 600 }}>
                      {dev >= 0 ? "+" : ""}€{dev}
                    </span>
                  </td>
                  <td style={{ padding: "10px 12px", textAlign: "right" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 6 }}>
                      <div style={{ width: 50, height: 4, background: C.border, borderRadius: 2, overflow: "hidden" }}>
                        <div style={{ width: `${conf}%`, height: "100%", background: conf > 85 ? C.green : conf > 70 ? C.accent : C.red, borderRadius: 2 }} />
                      </div>
                      <span style={{ fontSize: 11, color: C.textMid }}>{conf}%</span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

function PickupView() {
  const [periodo, setPeriodo] = useState("14d");

  const pickupKpis = [
    { label: "Pickup Hoy", value: "+23", change: "+5", sub: "vs mismo día sem. ant.", up: true },
    { label: "Pickup 7 días", value: "+142", change: "+18", sub: "vs semana anterior", up: true },
    { label: "Pace vs AÑO ANT", value: "+8,4%", change: "on pace", sub: "Febrero 2026", up: true },
    { label: "Cancelaciones 7d", value: "12", change: "+3", sub: "vs semana anterior", up: false },
  ];

  return (
    <div>
      <SectionHeader
        title="Seguimiento de Pickup"
        sub="Ritmo de captación de reservas · En tiempo real"
      />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 24 }}>
        {pickupKpis.map((k, i) => <KpiCard key={i} {...k} i={i} />)}
      </div>

      <Card style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
          <div>
            <p style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700, fontSize: 16, color: C.text }}>
              Curva de Pickup Acumulado
            </p>
            <p style={{ fontSize: 11, color: C.textLight, marginTop: 3 }}>Noches de llegada: 01–14 Febrero 2026</p>
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            {[["14d", "14 días"], ["30d", "30 días"]].map(([k, l]) => (
              <button key={k} onClick={() => setPeriodo(k)} style={{
                padding: "6px 14px", borderRadius: 6,
                border: `1px solid ${periodo === k ? C.accent : C.border}`,
                background: periodo === k ? C.accentLight : "white",
                color: periodo === k ? C.accentDark : C.textMid,
                cursor: "pointer", fontSize: 12, fontFamily: "'DM Sans', sans-serif"
              }}>{l}</button>
            ))}
          </div>
        </div>
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={pickupData}>
            <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
            <XAxis dataKey="dia" tick={{ fill: C.textLight, fontSize: 10 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: C.textLight, fontSize: 11 }} axisLine={false} tickLine={false} unit="%" />
            <Tooltip content={<CustomTooltip />} />
            <Line type="monotone" dataKey="hoy" name="Hoy" stroke={C.accent} strokeWidth={3} dot={false} />
            <Line type="monotone" dataKey="ayer" name="Ayer" stroke={C.blue} strokeWidth={1.5} dot={false} strokeDasharray="4 3" />
            <Line type="monotone" dataKey="semAnt" name="Sem. anterior" stroke={C.textLight} strokeWidth={1.5} dot={false} strokeDasharray="6 4" />
            <Line type="monotone" dataKey="anioAnt" name="Año anterior" stroke={`${C.red}99`} strokeWidth={1.5} dot={false} strokeDasharray="2 3" />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      {/* Pickup por día de la semana */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <Card>
          <p style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700, fontSize: 16, color: C.text, marginBottom: 4 }}>
            Pickup por Día de Semana
          </p>
          <p style={{ fontSize: 11, color: C.textLight, marginBottom: 18 }}>Reservas netas promedio</p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={[
              { dia: "Lun", reservas: 18 },
              { dia: "Mar", reservas: 22 },
              { dia: "Mié", reservas: 31 },
              { dia: "Jue", reservas: 28 },
              { dia: "Vie", reservas: 42 },
              { dia: "Sáb", reservas: 38 },
              { dia: "Dom", reservas: 14 },
            ]} barSize={28}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.border} vertical={false} />
              <XAxis dataKey="dia" tick={{ fill: C.textLight, fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: C.textLight, fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="reservas" name="Reservas" fill={C.accent} radius={[4, 4, 0, 0]} fillOpacity={0.85} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card>
          <p style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700, fontSize: 16, color: C.text, marginBottom: 16 }}>
            Últimas Reservas Recibidas
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {[
              { hab: "Doble Sup.", canal: "Booking.com", fecha: "08/03", precio: "€168", flag: "🇩🇪" },
              { hab: "Suite Junior", canal: "Directo Web", fecha: "14/02", precio: "€245", flag: "🇪🇸" },
              { hab: "Individual", canal: "Expedia", fecha: "22/02", precio: "€98", flag: "🇫🇷" },
              { hab: "Doble Estd.", canal: "Teléfono", fecha: "01/03", precio: "€142", flag: "🇬🇧" },
              { hab: "Doble Sup.", canal: "GDS", fecha: "19/02", precio: "€178", flag: "🇺🇸" },
            ].map((r, i) => (
              <div key={i} style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "10px 12px", background: C.bg, borderRadius: 8,
                borderLeft: `3px solid ${C.accent}`
              }}>
                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <span style={{ fontSize: 18 }}>{r.flag}</span>
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{r.hab}</p>
                    <p style={{ fontSize: 11, color: C.textLight }}>{r.canal} · llegada {r.fecha}</p>
                  </div>
                </div>
                <span style={{ fontWeight: 700, color: C.accent, fontSize: 14, fontFamily: "'Playfair Display', serif" }}>{r.precio}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

function SegmentacionView() {
  const [segTab, setSegTab] = useState("canal");

  const totalRes = canalData.reduce((a, b) => a + b.reservas, 0);
  const totalIng = canalData.reduce((a, b) => a + b.ingresos, 0);

  return (
    <div>
      <SectionHeader
        title="Segmentación de Reservas"
        sub="Análisis por canal, tarifa y mercado de origen"
      />

      <div style={{ display: "flex", gap: 8, marginBottom: 20, background: C.bgCard, padding: 4, borderRadius: 10, border: `1px solid ${C.border}`, width: "fit-content" }}>
        {[["canal", "🌐 Por Canal"], ["tarifa", "🏷 Por Tarifa"], ["mercado", "🌍 Por Mercado"]].map(([k, l]) => (
          <button key={k} onClick={() => setSegTab(k)} style={{
            padding: "8px 20px", borderRadius: 8, border: "none",
            background: segTab === k ? C.accent : "transparent",
            color: segTab === k ? "#fff" : C.textMid,
            cursor: "pointer", fontSize: 13, fontWeight: segTab === k ? 600 : 400,
            fontFamily: "'DM Sans', sans-serif", transition: "all 0.2s"
          }}>{l}</button>
        ))}
      </div>

      {segTab === "canal" && (
        <div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, marginBottom: 20 }}>
            {[
              { label: "Total Reservas", value: fmt(totalRes), change: "+124 esta semana", up: true, sub: "acumulado YTD" },
              { label: "Ingresos Totales", value: fmt(totalIng, "€"), change: "+8.4%", up: true, sub: "vs año anterior" },
              { label: "ADR Medio Global", value: "€162", change: "+€8", up: true, sub: "promedio ponderado" },
            ].map((k, i) => <KpiCard key={i} {...k} i={i} />)}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <Card>
              <p style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700, fontSize: 16, color: C.text, marginBottom: 4 }}>
                Reservas por Canal
              </p>
              <p style={{ fontSize: 11, color: C.textLight, marginBottom: 16 }}>Distribución y ADR comparado</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {canalData.map((c, i) => {
                  const pct = Math.round((c.reservas / totalRes) * 100);
                  return (
                    <div key={i}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5, alignItems: "center" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={{ width: 10, height: 10, borderRadius: 2, background: c.color, display: "inline-block" }} />
                          <span style={{ fontSize: 13, color: C.text, fontWeight: 500 }}>{c.name}</span>
                        </div>
                        <div style={{ display: "flex", gap: 16 }}>
                          <span style={{ fontSize: 12, color: C.textLight }}>{c.reservas} res.</span>
                          <span style={{ fontSize: 12, color: C.accent, fontWeight: 600 }}>ADR €{c.adr}</span>
                          <span style={{ fontSize: 12, color: C.textMid, fontWeight: 600, minWidth: 32, textAlign: "right" }}>{pct}%</span>
                        </div>
                      </div>
                      <div style={{ height: 5, background: C.border, borderRadius: 3, overflow: "hidden" }}>
                        <div style={{ width: `${pct}%`, height: "100%", background: c.color, borderRadius: 3 }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>

            <Card>
              <p style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700, fontSize: 16, color: C.text, marginBottom: 4 }}>
                Ingresos por Canal
              </p>
              <p style={{ fontSize: 11, color: C.textLight, marginBottom: 10 }}>Distribución porcentual (€)</p>
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie data={canalData.map(c => ({ name: c.name, value: c.ingresos, color: c.color }))}
                    cx="50%" cy="50%" innerRadius={60} outerRadius={90}
                    dataKey="value" strokeWidth={2} stroke={C.bgCard} paddingAngle={2}>
                    {canalData.map((c, i) => <Cell key={i} fill={c.color} />)}
                  </Pie>
                  <Tooltip formatter={(v) => `€${v.toLocaleString("es-ES")}`} contentStyle={{ background: C.bgDeep, border: "none", borderRadius: 8, fontSize: 12, color: "#E8DDD0" }} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 14px", justifyContent: "center" }}>
                {canalData.map((c, i) => (
                  <span key={i} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: C.textMid }}>
                    <span style={{ width: 8, height: 8, background: c.color, borderRadius: 2, display: "inline-block" }} />
                    {c.name}
                  </span>
                ))}
              </div>
            </Card>
          </div>
        </div>
      )}

      {segTab === "tarifa" && (
        <div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <Card>
              <p style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700, fontSize: 16, color: C.text, marginBottom: 4 }}>
                Mix de Tarifas
              </p>
              <p style={{ fontSize: 11, color: C.textLight, marginBottom: 16 }}>Porcentaje de reservas por tipo de tarifa</p>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={tarifaData} cx="50%" cy="50%" innerRadius={55} outerRadius={85}
                    dataKey="value" strokeWidth={2} stroke={C.bgCard} paddingAngle={3}>
                    {tarifaData.map((t, i) => <Cell key={i} fill={t.color} />)}
                  </Pie>
                  <Tooltip formatter={(v) => `${v}%`} contentStyle={{ background: C.bgDeep, border: "none", borderRadius: 8, fontSize: 12, color: "#E8DDD0" }} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 10 }}>
                {tarifaData.map((t, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: C.textMid }}>
                      <span style={{ width: 10, height: 10, background: t.color, borderRadius: 2, display: "inline-block" }} />
                      {t.name}
                    </span>
                    <span style={{ fontWeight: 700, color: C.text, fontSize: 13 }}>{t.value}%</span>
                  </div>
                ))}
              </div>
            </Card>

            <Card>
              <p style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700, fontSize: 16, color: C.text, marginBottom: 4 }}>
                ADR por Tipo de Tarifa
              </p>
              <p style={{ fontSize: 11, color: C.textLight, marginBottom: 18 }}>Precio medio por noche según tarifa</p>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={[
                  { tarifa: "BAR Flex.", adr: 168 },
                  { tarifa: "No Reemb.", adr: 142 },
                  { tarifa: "Grupos", adr: 118 },
                  { tarifa: "Oferta", adr: 128 },
                  { tarifa: "Corp.", adr: 155 },
                ]} barSize={32} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke={C.border} horizontal={false} />
                  <XAxis type="number" tick={{ fill: C.textLight, fontSize: 11 }} axisLine={false} tickLine={false} unit="€" />
                  <YAxis type="category" dataKey="tarifa" tick={{ fill: C.textMid, fontSize: 12 }} axisLine={false} tickLine={false} width={65} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="adr" name="ADR" fill={C.accent} radius={[0, 4, 4, 0]} fillOpacity={0.85} />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </div>
        </div>
      )}

      {segTab === "mercado" && (
        <div>
          <Card>
            <p style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700, fontSize: 16, color: C.text, marginBottom: 16 }}>
              Reservas por Mercado de Origen
            </p>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: `2px solid ${C.border}` }}>
                  {["País / Mercado", "Reservas", "% del total", "ADR medio", "Cuota vs AÑO ANT", "Tendencia"].map(h => (
                    <th key={h} style={{ padding: "8px 12px", textAlign: "right", fontSize: 10, color: C.textLight, textTransform: "uppercase", letterSpacing: "1px", fontFamily: "'DM Sans', sans-serif", fontWeight: 600 }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {mercadoData.map((m, i) => {
                  const flags = { "España": "🇪🇸", "Francia": "🇫🇷", "Alemania": "🇩🇪", "Reino Unido": "🇬🇧", "EE.UU.": "🇺🇸", "Otros": "🌍" };
                  const trends = ["+2.1%", "+4.8%", "-1.2%", "+3.3%", "+12.4%", "+0.8%"];
                  const ups = [true, true, false, true, true, true];
                  return (
                    <tr key={i} style={{ borderBottom: `1px solid ${C.border}`, background: i % 2 === 0 ? C.bg : C.bgCard }}>
                      <td style={{ padding: "12px 12px" }}>
                        <span style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 600, color: C.text }}>
                          <span style={{ fontSize: 18 }}>{flags[m.pais]}</span>
                          {m.pais}
                        </span>
                      </td>
                      <td style={{ padding: "12px 12px", textAlign: "right", color: C.textMid }}>{m.reservas}</td>
                      <td style={{ padding: "12px 12px", textAlign: "right" }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 8 }}>
                          <div style={{ width: 50, height: 4, background: C.border, borderRadius: 2, overflow: "hidden" }}>
                            <div style={{ width: `${m.pct}%`, height: "100%", background: C.accent, borderRadius: 2 }} />
                          </div>
                          <span style={{ fontWeight: 600, color: C.accent }}>{m.pct}%</span>
                        </div>
                      </td>
                      <td style={{ padding: "12px 12px", textAlign: "right", fontWeight: 600, color: C.text }}>€{m.adr}</td>
                      <td style={{ padding: "12px 12px", textAlign: "right" }}>
                        <span style={{ color: ups[i] ? C.green : C.red, fontWeight: 600 }}>{trends[i]}</span>
                      </td>
                      <td style={{ padding: "12px 12px", textAlign: "right" }}>
                        <span style={{ fontSize: 16 }}>{ups[i] ? "📈" : "📉"}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Card>

          <div style={{ marginTop: 16 }}>
            <Card>
              <p style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700, fontSize: 16, color: C.text, marginBottom: 4 }}>
                Evolución de Mercados Top 3
              </p>
              <p style={{ fontSize: 11, color: C.textLight, marginBottom: 18 }}>Reservas mensuales por origen principal</p>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={historicData.map((d, i) => ({
                  mes: d.mes,
                  España: Math.round(d.occ * 1.8),
                  Francia: Math.round(d.occ * 1.1),
                  Alemania: Math.round(d.occ * 0.7),
                }))} barSize={14}>
                  <CartesianGrid strokeDasharray="3 3" stroke={C.border} vertical={false} />
                  <XAxis dataKey="mes" tick={{ fill: C.textLight, fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: C.textLight, fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="España" fill="#E74C3C" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="Francia" fill="#3498DB" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="Alemania" fill="#2ECC71" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── APP SHELL ────────────────────────────────────────────────────
const NAV = [
  { key: "dashboard", icon: "◈", label: "Dashboard" },
  { key: "forecast", icon: "◎", label: "Forecast" },
  { key: "pickup", icon: "⟳", label: "Pickup" },
  { key: "segmentacion", icon: "⊞", label: "Segmentación" },
];

export default function App() {
  const [view, setView] = useState("dashboard");
  const [showUpload, setShowUpload] = useState(false);

  const views = { dashboard: DashboardView, forecast: ForecastView, pickup: PickupView, segmentacion: SegmentacionView };
  const View = views[view];

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", background: C.bg, minHeight: "100vh", display: "flex" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700;800&family=DM+Sans:wght@300;400;500;600&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-track { background: ${C.bg}; }
        ::-webkit-scrollbar-thumb { background: ${C.accentLight}; border-radius: 3px; }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(14px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .nav-item:hover { background: ${C.accentLight} !important; }
        button { transition: all 0.15s ease; }
      `}</style>

      {/* Sidebar */}
      <div style={{
        width: 220, minHeight: "100vh", background: C.bgDeep,
        display: "flex", flexDirection: "column",
        position: "sticky", top: 0, height: "100vh",
        borderRight: `1px solid ${C.accentDark}33`
      }}>
        {/* Logo */}
        <div style={{ padding: "24px 20px 20px", borderBottom: `1px solid #FFFFFF11` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 36, height: 36, background: C.accent, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>
              🏨
            </div>
            <div>
              <p style={{ fontFamily: "'Playfair Display', serif", color: "#F7F3EE", fontWeight: 700, fontSize: 15, lineHeight: 1.2 }}>
                RevManager
              </p>
              <p style={{ fontSize: 10, color: C.accentLight, opacity: 0.6 }}>Hotel Independiente</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: "16px 12px" }}>
          <p style={{ fontSize: 9, color: "#FFFFFF33", textTransform: "uppercase", letterSpacing: "2px", padding: "0 8px", marginBottom: 8 }}>
            Módulos
          </p>
          {NAV.map(n => (
            <button
              key={n.key}
              className="nav-item"
              onClick={() => setView(n.key)}
              style={{
                width: "100%", display: "flex", alignItems: "center", gap: 10,
                padding: "10px 12px", borderRadius: 8, border: "none", cursor: "pointer",
                background: view === n.key ? C.accent : "transparent",
                color: view === n.key ? "#fff" : "#A8998A",
                fontSize: 13, fontWeight: view === n.key ? 600 : 400,
                fontFamily: "'DM Sans', sans-serif", marginBottom: 2, textAlign: "left",
                transition: "all 0.15s"
              }}
            >
              <span style={{ fontSize: 14, opacity: 0.8 }}>{n.icon}</span>
              {n.label}
            </button>
          ))}
        </nav>

        {/* Upload button */}
        <div style={{ padding: "16px 12px", borderTop: `1px solid #FFFFFF11` }}>
          <button onClick={() => setShowUpload(true)} style={{
            width: "100%", padding: "11px", borderRadius: 8,
            border: `1.5px dashed ${C.accentDark}`,
            background: "transparent", color: C.accentLight, cursor: "pointer",
            fontSize: 12, fontWeight: 600, fontFamily: "'DM Sans', sans-serif",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8
          }}>
            ↑ Importar datos
          </button>
          <p style={{ fontSize: 10, color: "#FFFFFF33", textAlign: "center", marginTop: 8 }}>
            CSV / Excel
          </p>
        </div>
      </div>

      {/* Main */}
      <main style={{ flex: 1, padding: "28px 32px", overflowY: "auto", maxHeight: "100vh" }}>
        {/* Top bar */}
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          marginBottom: 28
        }}>
          <div>
            <p style={{ fontSize: 11, color: C.textLight, textTransform: "uppercase", letterSpacing: "1.5px" }}>
              Hotel Ejemplo · Madrid
            </p>
            <p style={{ fontSize: 12, color: C.textLight, marginTop: 2 }}>
              Datos actualizados: 24 Feb 2026 · 09:00h
            </p>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <div style={{
              padding: "6px 14px", borderRadius: 20, background: C.greenLight,
              color: C.green, fontSize: 11, fontWeight: 600,
              display: "flex", alignItems: "center", gap: 5
            }}>
              <span style={{ width: 6, height: 6, background: C.green, borderRadius: "50%", display: "inline-block" }} />
              En directo
            </div>
            <div style={{
              width: 36, height: 36, borderRadius: "50%",
              background: `linear-gradient(135deg, ${C.accent}, ${C.accentDark})`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 13, fontWeight: 700, color: "#fff"
            }}>GM</div>
          </div>
        </div>

        <View />
      </main>

      {showUpload && <UploadPanel onClose={() => setShowUpload(false)} />}
    </div>
  );
}