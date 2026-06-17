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
  "Ocupación":       { formula: "Hab. ocupadas ÷ Hab. disponibles × 100", desc: "De cada 10 habitaciones que tienes, cuántas has vendido. Si está baja, te sobran habitaciones vacías. Si está muy alta y el precio es bajo, estás dejando dinero sobre la mesa." },
  "ADR":             { formula: "Revenue habitaciones ÷ Hab. ocupadas", desc: "Lo que cobras de media por cada habitación que vendes. Si sube mientras la ocupación se mantiene, estás vendiendo mejor. Si baja, puede que estés tirando el precio para llenar." },
  "RevPAR":          { formula: "Revenue habitaciones ÷ Hab. disponibles", desc: "Lo que ingresa cada habitación de tu hotel, esté vendida o no. Es el número que mejor resume si tu hotel va bien: sube cuando vendes más habitaciones o a mejor precio." },
  "TRevPAR":         { formula: "Revenue total ÷ Hab. disponibles", desc: "Como el RevPAR, pero contando todo lo que genera el hotel: restaurante, eventos, extras… Si es muy superior al RevPAR, tienes fuentes de ingreso más allá de las habitaciones que funcionan bien." },
  "Revenue Diario":  { formula: "Suma del revenue del día seleccionado", desc: "Todo lo que ha facturado el hotel ese día. Útil para comparar días concretos o detectar si un día puntual fue especialmente bueno o malo." },
  "Revenue Mensual": { formula: "Suma acumulada desde el 1 del mes", desc: "Lo que llevas facturado en el mes hasta hoy. Compáralo con el presupuesto y con el mismo punto del año pasado para saber si el mes va por buen camino." },
  "Revenue Total":   { formula: "Revenue hab. + F&B + otros ingresos", desc: "La facturación completa del período, sumando todos los departamentos. Es lo que entra en caja antes de costes." },
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
  { key: "revenue",  label: "Revenue" },
  { key: "salas",    label: "Gestión de salas" },
];
