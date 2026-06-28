export const LOGO_B64 = "/fastrev-logo.png";
export const SALAS_FIJAS = ["Salón Principal", "Sala de Reuniones", "Terraza"];

export const C = {
  bg: "#FDFDFD", bgCard: "#FFFFFF", bgDeep: "#0A2540",
  accent: "#004B87", accentLight: "#E8F0F9", accentDark: "#003366",
  text: "#1A1A1A", textMid: "#555555", textLight: "#888888",
  border: "#E0E0E0", green: "#009F4D", greenLight: "#E6F7EE",
  red: "#D32F2F", redLight: "#FDECEA", blue: "#004B87",
};

export const dmy = iso => {
  if (!iso) return "—";
  const s = String(iso).slice(0, 10);
  const [y, m, d] = s.split("-");
  return `${d}/${m}/${y}`;
};

export const MESES       = ["Enero","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
export const MESES_CORTO = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
export const MESES_FULL  = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];

export const NET_HAB_FNB = 1 / 1.10;
export const NET_SALA    = 1 / 1.21;

export const KPI_HELP = {
  "Ocupación":       { formula: "Hab. ocupadas ÷ Hab. disponibles × 100", desc: "% de habitaciones vendidas sobre el total disponible." },
  "ADR":             { formula: "Revenue habitaciones ÷ Hab. ocupadas",    desc: "Precio medio cobrado por cada habitación ocupada." },
  "RevPAR":          { formula: "Revenue habitaciones ÷ Hab. disponibles", desc: "Ingreso por habitación disponible, vendida o no." },
  "TRevPAR":         { formula: "Revenue total ÷ Hab. disponibles",        desc: "Ingreso total del hotel (hab. + F&B + extras) por habitación disponible." },
  "Revenue Diario":  { formula: "Σ revenue del día",                       desc: "Facturación total del hotel en el día seleccionado." },
  "Revenue Mensual": { formula: "Σ acumulada desde el día 1 del mes",      desc: "Facturación acumulada desde el 1 del mes hasta hoy." },
  "Revenue Total":   { formula: "Revenue hab. + F&B + otros",              desc: "Suma de todos los ingresos del período seleccionado." },
};

export const NAV = [
  { key: "dashboard", icon: "◈",  labelKey: "nav_dashboard" },
  { key: "pickup",                 labelKey: "nav_pickup" },
  { key: "budget",    icon: "💰", labelKey: "nav_budget" },
  { key: "grupos",                 labelKey: "nav_grupos" },
  { key: "gestion",                labelKey: "nav_gestion" },
];

export const GRUPOS_SUB = [
  { key: "semana",   label: "Calendario" },
  { key: "pipeline", label: "Resumen" },
  { key: "grupos",   label: "Grupos" },
  { key: "eventos",  label: "Eventos" },
  { key: "salas",    label: "Gestión de salas" },
];
