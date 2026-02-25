import { useState, useEffect } from "react";
import { supabase } from "./supabase";
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
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

const forecastData = historicData.map((d) => ({
  ...d,
  forecastOcc: Math.min(100, Math.round(d.occ * 1.05)),
  forecastAdr: Math.round(d.adr * 1.06),
  forecastRevpar: Math.round(d.revpar * 1.09),
  budget: Math.round(d.revpar * 1.08),
}));

const pickupData = [
  { dia: "24/01", hoy: 42, ayer: 39, semAnt: 35, anioAnt: 30 },
  { dia: "25/01", hoy: 48, ayer: 44, semAnt: 38, anioAnt: 32 },
  { dia: "26/01", hoy: 55, ayer: 51, semAnt: 44, anioAnt: 38 },
  { dia: "27/01", hoy: 61, ayer: 58, semAnt: 50, anioAnt: 44 },
  { dia: "28/01", hoy: 68, ayer: 63, semAnt: 55, anioAnt: 48 },
  { dia: "29/01", hoy: 74, ayer: 70, semAnt: 61, anioAnt: 52 },
  { dia: "30/01", hoy: 79, ayer: 75, semAnt: 68, anioAnt: 58 },
];

const canalData = [
  { name: "Booking.com", reservas: 284, ingresos: 42800, adr: 151, color: "#003580" },
  { name: "Directo Web", reservas: 198, ingresos: 36200, adr: 183, color: C.accent },
  { name: "Expedia", reservas: 142, ingresos: 19800, adr: 139, color: "#FF6B00" },
  { name: "Teléfono", reservas: 96, ingresos: 18200, adr: 190, color: C.green },
  { name: "GDS", reservas: 54, ingresos: 10800, adr: 200, color: C.blue },
];

const tarifaData = [
  { name: "BAR Flexible", value: 38, color: C.accent },
  { name: "No Reembolsable", value: 28, color: C.accentDark },
  { name: "Grupos", value: 16, color: C.blue },
  { name: "Oferta Especial", value: 11, color: C.green },
  { name: "Corporativo", value: 7, color: C.textMid },
];

const mercadoData = [
  { pais: "España", reservas: 312, pct: 38, adr: 158, flag: "🇪🇸", trend: "+2.1%", up: true },
  { pais: "Francia", reservas: 178, pct: 22, adr: 172, flag: "🇫🇷", trend: "+4.8%", up: true },
  { pais: "Alemania", reservas: 124, pct: 15, adr: 168, flag: "🇩🇪", trend: "-1.2%", up: false },
  { pais: "Reino Unido", reservas: 98, pct: 12, adr: 180, flag: "🇬🇧", trend: "+3.3%", up: true },
  { pais: "EE.UU.", reservas: 72, pct: 9, adr: 210, flag: "🇺🇸", trend: "+12.4%", up: true },
  { pais: "Otros", reservas: 28, pct: 4, adr: 145, flag: "🌍", trend: "+0.8%", up: true },
];

// ─── HELPERS ──────────────────────────────────────────────────────
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

// ─── LOGIN / REGISTER ─────────────────────────────────────────────
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
    setLoading(true);
    setError("");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setError("Email o contraseña incorrectos");
    setLoading(false);
  };

  const handleRegister = async () => {
    if (!hotelNombre || !email || !password) {
      setError("Rellena todos los campos obligatorios");
      return;
    }
    setLoading(true);
    setError("");
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) { setError(error.message); setLoading(false); return; }
    if (data.user) {
      await supabase.from("hoteles").insert({
        nombre: hotelNombre,
        ciudad: hotelCiudad,
        habitaciones: parseInt(habitaciones) || null,
      });
    }
    setMensaje("¡Cuenta creada! Revisa tu email para confirmarla.");
    setLoading(false);
  };

  const inputStyle = {
    width: "100%", padding: "11px 14px", borderRadius: 8,
    border: `1.5px solid ${C.border}`, fontSize: 14,
    fontFamily: "'DM Sans', sans-serif", color: C.text,
    background: C.bg, outline: "none",
  };

  return (
    <div style={{ minHeight: "100vh", background: C.bgDeep, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700;800&family=DM+Sans:wght@300;400;500;600&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
      <div style={{ width: 420, background: C.bgCard, borderRadius: 20, padding: "40px 36px", boxShadow: "0 32px 80px rgba(0,0,0,0.4)", animation: "fadeUp 0.5s ease both" }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ width: 52, height: 52, background: C.accent, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, margin: "0 auto 14px" }}>🏨</div>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 24, fontWeight: 800, color: C.text }}>RevManager</h1>
          <p style={{ fontSize: 12, color: C.textLight, marginTop: 4 }}>Revenue Management para hoteles independientes</p>
        </div>

        <div style={{ display: "flex", background: C.bg, borderRadius: 10, padding: 4, marginBottom: 24 }}>
          {[["login", "Iniciar sesión"], ["register", "Crear cuenta"]].map(([k, l]) => (
            <button key={k} onClick={() => { setMode(k); setError(""); setMensaje(""); }} style={{
              flex: 1, padding: "9px", borderRadius: 8, border: "none", cursor: "pointer",
              background: mode === k ? C.bgCard : "transparent",
              color: mode === k ? C.accent : C.textMid,
              fontWeight: mode === k ? 600 : 400, fontSize: 13,
              fontFamily: "'DM Sans', sans-serif",
              boxShadow: mode === k ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
            }}>{l}</button>
          ))}
        </div>

        {mensaje ? (
          <div style={{ background: C.greenLight, color: C.green, padding: "14px", borderRadius: 8, fontSize: 13, textAlign: "center", fontWeight: 500 }}>
            {mensaje}
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {mode === "register" && (
              <>
                <div>
                  <p style={{ fontSize: 11, color: C.textLight, marginBottom: 5, textTransform: "uppercase", letterSpacing: "1px" }}>Nombre del hotel *</p>
                  <input style={inputStyle} placeholder="Hotel San Marcos" value={hotelNombre} onChange={e => setHotelNombre(e.target.value)} />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <div>
                    <p style={{ fontSize: 11, color: C.textLight, marginBottom: 5, textTransform: "uppercase", letterSpacing: "1px" }}>Ciudad</p>
                    <input style={inputStyle} placeholder="Madrid" value={hotelCiudad} onChange={e => setHotelCiudad(e.target.value)} />
                  </div>
                  <div>
                    <p style={{ fontSize: 11, color: C.textLight, marginBottom: 5, textTransform: "uppercase", letterSpacing: "1px" }}>Habitaciones</p>
                    <input style={inputStyle} placeholder="45" type="number" value={habitaciones} onChange={e => setHabitaciones(e.target.value)} />
                  </div>
                </div>
                <div style={{ height: 1, background: C.border, margin: "4px 0" }} />
              </>
            )}
            <div>
              <p style={{ fontSize: 11, color: C.textLight, marginBottom: 5, textTransform: "uppercase", letterSpacing: "1px" }}>Email *</p>
              <input style={inputStyle} type="email" placeholder="gerente@mihotel.com" value={email} onChange={e => setEmail(e.target.value)} />
            </div>
            <div>
              <p style={{ fontSize: 11, color: C.textLight, marginBottom: 5, textTransform: "uppercase", letterSpacing: "1px" }}>Contraseña *</p>
              <input style={inputStyle} type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)}
                onKeyDown={e => e.key === "Enter" && (mode === "login" ? handleLogin() : handleRegister())} />
            </div>
            {error && (
              <div style={{ background: C.redLight, color: C.red, padding: "10px 14px", borderRadius: 8, fontSize: 13 }}>{error}</div>
            )}
            <button onClick={mode === "login" ? handleLogin : handleRegister} disabled={loading} style={{
              width: "100%", padding: "13px", borderRadius: 10, border: "none",
              background: loading ? C.accentLight : C.accent,
              color: loading ? C.accentDark : "#fff",
              fontSize: 14, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer",
              fontFamily: "'DM Sans', sans-serif", marginTop: 4,
            }}>
              {loading ? "Cargando..." : mode === "login" ? "Entrar" : "Crear cuenta"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── DASHBOARD VIEW ───────────────────────────────────────────────
function DashboardView() {
  const kpis = [
    { label: "Ocupación MTD", value: "74,2%", change: "+3.1pp", sub: "vs año anterior", up: true },
    { label: "ADR MTD", value: "€162", change: "+€8", sub: "vs año anterior", up: true },
    { label: "RevPAR MTD", value: "€120", change: "+12,4%", sub: "vs año anterior", up: true },
    { label: "TRevPAR MTD", value: "€168", change: "+9,8%", sub: "vs año anterior", up: true },
    { label: "Pickup 7 días", value: "+142", change: "+18", sub: "reservas netas", up: true },
    { label: "Cancelaciones", value: "23", change: "+5", sub: "vs semana anterior", up: false },
  ];
  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, fontWeight: 700, color: C.text }}>Panel de Control</h2>
        <p style={{ fontSize: 12, color: C.textLight, marginTop: 4 }}>Resumen de rendimiento · Febrero 2026</p>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, marginBottom: 24 }}>
        {kpis.map((k, i) => <KpiCard key={i} {...k} i={i} />)}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "3fr 2fr", gap: 16, marginBottom: 16 }}>
        <Card>
          <p style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700, fontSize: 16, color: C.text, marginBottom: 4 }}>RevPAR — Evolución Anual</p>
          <p style={{ fontSize: 11, color: C.textLight, marginBottom: 18 }}>Real vs TRevPAR (€/hab disponible)</p>
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
          <p style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700, fontSize: 16, color: C.text, marginBottom: 4 }}>Ocupación vs ADR</p>
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
      <Card>
        <p style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700, fontSize: 16, color: C.text, marginBottom: 16 }}>Resumen Mensual</p>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: `2px solid ${C.border}` }}>
                {["Mes", "Ocup.", "ADR", "RevPAR", "TRevPAR", "vs AÑO ANT"].map(h => (
                  <th key={h} style={{ padding: "8px 12px", textAlign: "right", fontSize: 10, color: C.textLight, textTransform: "uppercase", letterSpacing: "1px", fontWeight: 600 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {historicData.map((d, i) => (
                <tr key={i} style={{ borderBottom: `1px solid ${C.border}`, background: i % 2 === 0 ? C.bg : C.bgCard }}>
                  <td style={{ padding: "10px 12px", fontWeight: 600, color: C.text }}>{d.mes}</td>
                  <td style={{ padding: "10px 12px", textAlign: "right", color: d.occ > 80 ? C.green : C.textMid }}>{d.occ}%</td>
                  <td style={{ padding: "10px 12px", textAlign: "right", color: C.textMid }}>€{d.adr}</td>
                  <td style={{ padding: "10px 12px", textAlign: "right", fontWeight: 600, color: C.accent }}>€{d.revpar}</td>
                  <td style={{ padding: "10px 12px", textAlign: "right", color: C.blue }}>€{d.trevpar}</td>
                  <td style={{ padding: "10px 12px", textAlign: "right" }}><span style={{ color: C.green, fontSize: 12, fontWeight: 600 }}>+9.2%</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

// ─── FORECAST VIEW ────────────────────────────────────────────────
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
    Forecast: d[`forecast${metric.charAt(0).toUpperCase() + metric.slice(1)}`] || Math.round(d[metric] * 1.05),
    Budget: d.budget || Math.round(d[metric] * 1.08),
  }));
  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, fontWeight: 700, color: C.text }}>Forecast & Proyecciones</h2>
        <p style={{ fontSize: 12, color: C.textLight, marginTop: 4 }}>Basado en histórico con ajuste estacional</p>
      </div>
      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        {metricOpts.map(m => (
          <button key={m.k} onClick={() => setMetric(m.k)} style={{
            padding: "8px 20px", borderRadius: 8, border: `1.5px solid ${metric === m.k ? m.color : C.border}`,
            background: metric === m.k ? `${m.color}15` : "white",
            color: metric === m.k ? m.color : C.textMid,
            cursor: "pointer", fontSize: 13, fontWeight: 600, fontFamily: "'DM Sans', sans-serif",
          }}>{m.label}</button>
        ))}
      </div>
      <Card style={{ marginBottom: 16 }}>
        <p style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700, fontSize: 16, color: C.text, marginBottom: 4 }}>{sel.label} — Forecast vs Budget</p>
        <p style={{ fontSize: 11, color: C.textLight, marginBottom: 18 }}>Proyección anual</p>
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
            <XAxis dataKey="mes" tick={{ fill: C.textLight, fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: C.textLight, fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Line type="monotone" dataKey="Forecast" stroke={sel.color} strokeWidth={2.5} dot={{ fill: sel.color, r: 4 }} />
            <Line type="monotone" dataKey="Budget" stroke={C.textLight} strokeWidth={1.5} strokeDasharray="6 4" dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </Card>
      <Card>
        <p style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700, fontSize: 16, color: C.text, marginBottom: 16 }}>Tabla Forecast Detallada</p>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: `2px solid ${C.border}` }}>
              {["Mes", "Ocup. Forecast", "ADR Forecast", "RevPAR Forecast", "Budget", "Desviación", "Confianza"].map(h => (
                <th key={h} style={{ padding: "8px 12px", textAlign: "right", fontSize: 10, color: C.textLight, textTransform: "uppercase", letterSpacing: "1px", fontWeight: 600 }}>{h}</th>
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
                    <span style={{ color: dev >= 0 ? C.green : C.red, fontWeight: 600 }}>{dev >= 0 ? "+" : ""}€{dev}</span>
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

// ─── PICKUP VIEW ──────────────────────────────────────────────────
function PickupView() {
  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, fontWeight: 700, color: C.text }}>Seguimiento de Pickup</h2>
        <p style={{ fontSize: 12, color: C.textLight, marginTop: 4 }}>Ritmo de captación de reservas</p>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 24 }}>
        {[
          { label: "Pickup Hoy", value: "+23", change: "+5", sub: "vs sem. anterior", up: true },
          { label: "Pickup 7 días", value: "+142", change: "+18", sub: "vs semana anterior", up: true },
          { label: "Pace vs AÑO ANT", value: "+8,4%", change: "on pace", sub: "Febrero 2026", up: true },
          { label: "Cancelaciones 7d", value: "12", change: "+3", sub: "vs semana anterior", up: false },
        ].map((k, i) => <KpiCard key={i} {...k} i={i} />)}
      </div>
      <Card>
        <p style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700, fontSize: 16, color: C.text, marginBottom: 4 }}>Curva de Pickup Acumulado</p>
        <p style={{ fontSize: 11, color: C.textLight, marginBottom: 18 }}>Comparativa vs períodos anteriores</p>
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
    </div>
  );
}

// ─── SEGMENTACION VIEW ────────────────────────────────────────────
function SegmentacionView() {
  const [segTab, setSegTab] = useState("canal");
  const totalRes = canalData.reduce((a, b) => a + b.reservas, 0);
  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, fontWeight: 700, color: C.text }}>Segmentación de Reservas</h2>
        <p style={{ fontSize: 12, color: C.textLight, marginTop: 4 }}>Análisis por canal, tarifa y mercado</p>
      </div>
      <div style={{ display: "flex", gap: 8, marginBottom: 20, background: C.bgCard, padding: 4, borderRadius: 10, border: `1px solid ${C.border}`, width: "fit-content" }}>
        {[["canal", "🌐 Canal"], ["tarifa", "🏷 Tarifa"], ["mercado", "🌍 Mercado"]].map(([k, l]) => (
          <button key={k} onClick={() => setSegTab(k)} style={{
            padding: "8px 20px", borderRadius: 8, border: "none",
            background: segTab === k ? C.accent : "transparent",
            color: segTab === k ? "#fff" : C.textMid,
            cursor: "pointer", fontSize: 13, fontWeight: segTab === k ? 600 : 400,
            fontFamily: "'DM Sans', sans-serif",
          }}>{l}</button>
        ))}
      </div>

      {segTab === "canal" && (
        <Card>
          <p style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700, fontSize: 16, color: C.text, marginBottom: 16 }}>Reservas por Canal</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
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
                      <span style={{ fontSize: 12, color: C.textMid, fontWeight: 600 }}>{pct}%</span>
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
      )}

      {segTab === "tarifa" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <Card>
            <p style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700, fontSize: 16, color: C.text, marginBottom: 16 }}>Mix de Tarifas</p>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={tarifaData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} dataKey="value" strokeWidth={2} stroke={C.bgCard} paddingAngle={3}>
                  {tarifaData.map((t, i) => <Cell key={i} fill={t.color} />)}
                </Pie>
                <Tooltip formatter={(v) => `${v}%`} contentStyle={{ background: C.bgDeep, border: "none", borderRadius: 8, fontSize: 12 }} />
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
            <p style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700, fontSize: 16, color: C.text, marginBottom: 4 }}>ADR por Tipo de Tarifa</p>
            <p style={{ fontSize: 11, color: C.textLight, marginBottom: 18 }}>Precio medio por noche</p>
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
      )}

      {segTab === "mercado" && (
        <Card>
          <p style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700, fontSize: 16, color: C.text, marginBottom: 16 }}>Reservas por Mercado de Origen</p>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: `2px solid ${C.border}` }}>
                {["País / Mercado", "Reservas", "% del total", "ADR medio", "Tendencia"].map(h => (
                  <th key={h} style={{ padding: "8px 12px", textAlign: "right", fontSize: 10, color: C.textLight, textTransform: "uppercase", letterSpacing: "1px", fontWeight: 600 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {mercadoData.map((m, i) => (
                <tr key={i} style={{ borderBottom: `1px solid ${C.border}`, background: i % 2 === 0 ? C.bg : C.bgCard }}>
                  <td style={{ padding: "12px 12px" }}>
                    <span style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 600, color: C.text }}>
                      <span style={{ fontSize: 18 }}>{m.flag}</span>{m.pais}
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
                    <span style={{ color: m.up ? C.green : C.red, fontWeight: 600 }}>{m.trend}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
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
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("dashboard");

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

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const views = { dashboard: DashboardView, forecast: ForecastView, pickup: PickupView, segmentacion: SegmentacionView };
  const View = views[view];

  if (loading) return (
    <div style={{ minHeight: "100vh", background: C.bgDeep, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ color: C.accent, fontFamily: "'Playfair Display', serif", fontSize: 20 }}>Cargando...</div>
    </div>
  );

  if (!session) return <AuthScreen />;

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", background: C.bg, minHeight: "100vh", display: "flex" }}>
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
      <div style={{ width: 220, minHeight: "100vh", background: C.bgDeep, display: "flex", flexDirection: "column", position: "sticky", top: 0, height: "100vh" }}>
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
            <button key={n.key} className="nav-item" onClick={() => setView(n.key)} style={{
              width: "100%", display: "flex", alignItems: "center", gap: 10,
              padding: "10px 12px", borderRadius: 8, border: "none", cursor: "pointer",
              background: view === n.key ? C.accent : "transparent",
              color: view === n.key ? "#fff" : "#A8998A",
              fontSize: 13, fontWeight: view === n.key ? 600 : 400,
              fontFamily: "'DM Sans', sans-serif", marginBottom: 2, textAlign: "left",
            }}>
              <span style={{ fontSize: 14 }}>{n.icon}</span>{n.label}
            </button>
          ))}
        </nav>
        <div style={{ padding: "16px 12px", borderTop: "1px solid #FFFFFF11" }}>
          <p style={{ fontSize: 11, color: "#FFFFFF44", marginBottom: 8, paddingLeft: 4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {session.user.email}
          </p>
          <button onClick={handleLogout} style={{
            width: "100%", padding: "10px", borderRadius: 8,
            border: "1px solid #FFFFFF22", background: "transparent",
            color: "#A8998A", cursor: "pointer", fontSize: 12,
            fontFamily: "'DM Sans', sans-serif",
          }}>
            Cerrar sesión
          </button>
        </div>
      </div>

      {/* Main */}
      <main style={{ flex: 1, padding: "28px 32px", overflowY: "auto", maxHeight: "100vh" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
          <div>
            <p style={{ fontSize: 11, color: C.textLight, textTransform: "uppercase", letterSpacing: "1.5px" }}>RevManager · Panel de Revenue</p>
            <p style={{ fontSize: 12, color: C.textLight, marginTop: 2 }}>Datos actualizados: Feb 2026</p>
          </div>
          <div style={{ padding: "6px 14px", borderRadius: 20, background: C.greenLight, color: C.green, fontSize: 11, fontWeight: 600, display: "flex", alignItems: "center", gap: 5 }}>
            <span style={{ width: 6, height: 6, background: C.green, borderRadius: "50%", display: "inline-block" }} />
            En directo
          </div>
        </div>
        <View />
      </main>
    </div>
  );
}
