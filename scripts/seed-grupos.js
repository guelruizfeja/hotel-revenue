// Script para insertar datos mock de grupos y eventos
// Uso: node scripts/seed-grupos.js <email-del-usuario>
// El email debe coincidir con un usuario registrado en Supabase

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { resolve } from "path";

// Leer .env manualmente (sin dotenv)
const envPath = resolve(process.cwd(), ".env");
const envContent = readFileSync(envPath, "utf8");
const env = Object.fromEntries(
  envContent.split("\n")
    .filter(l => l.trim() && !l.startsWith("#"))
    .map(l => { const [k, ...v] = l.split("="); return [k.trim(), v.join("=").trim()]; })
);

const SUPABASE_URL = env.SUPABASE_URL || env.VITE_SUPABASE_URL;
const SERVICE_KEY  = env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("Faltan SUPABASE_URL y/o SUPABASE_SERVICE_ROLE_KEY en .env");
  process.exit(1);
}

const email = process.argv[2];
if (!email) {
  console.error("Uso: node scripts/seed-grupos.js <email>");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// ── Helpers ──────────────────────────────────────────────────────────────────

const rnd = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

const formatDate = (y, m, d) =>
  `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

const packNotasEvento = (hi, hf, sala, serv, notas = "") => {
  return `[ev:hi=${hi},hf=${hf},sala=${sala},serv=${serv ? "sí" : "no"}]${notas ? "\n" + notas : ""}`;
};

// ── Datos mock por mes ───────────────────────────────────────────────────────

const NOMBRES_GRUPOS = [
  ["Pharma Congress","Congreso Anual Médico","Feria Tecnología","Cumbre Directivos","Convención RRHH"],
  ["Boda García-López","Boda Martínez","Boda Silva-Romero","Celebración Pérez","Enlace Fernández"],
  ["Torneo Golf","Copa Baloncesto","Maratón Ciudad","Liga Padel","Campeonato Natación"],
  ["Grupo Corporativo TechCo","Grupo IBEX Finanzas","Grupo Repsol","Grupo Inditex","Grupo Santander"],
  ["Congreso Arquitectura","Feria FITUR","Salón del Automóvil","Feria del Libro","Expo Gastronomía"],
];

const NOMBRES_EVENTOS = [
  "Gala Benéfica","Cena de Empresa","Presentación Producto","Cóctel Inauguración",
  "Evento Networking","Celebración Aniversario","Fiesta de Fin de Año","Conferencia TED",
  "Workshop Design","Cocktail Party","Noche de Gala","Summit Ejecutivo",
];

const SALAS = ["Salón Principal","Salón Mediterráneo","Terraza","Salón Jardín","Salón Panorámico","Auditorio"];

const CATS = ["corporativo","boda","feria","deportivo","otros"];

// Estados distribuidos de forma realista
// Pasado: mayormente confirmado/cancelado; futuro: más tentativo/cotizacion
const estadoPasado  = () => ["confirmado","confirmado","confirmado","cancelado"][rnd(0,3)];
const estadoFuturo  = () => ["confirmado","tentativo","tentativo","cotizacion"][rnd(0,3)];

function generarGrupo(hotel_id, anio, mes, slot, esFuturo) {
  const catIdx = (mes + slot) % CATS.length;
  const cat    = CATS[catIdx];
  const nombre = NOMBRES_GRUPOS[catIdx][(mes + slot * 3) % NOMBRES_GRUPOS[catIdx].length];
  const estado = esFuturo ? estadoFuturo() : estadoPasado();

  const diaIni  = slot === 0 ? rnd(3, 8)  : rnd(15, 20);
  const noches  = rnd(2, 5);
  const diaFin  = Math.min(diaIni + noches, 28);
  const fechaIni = formatDate(anio, mes, diaIni);
  const fechaFin = formatDate(anio, mes, diaFin);

  const habitaciones = rnd(15, 80);
  const adr          = rnd(85, 220);
  const revFnb       = rnd(0, 1) ? rnd(2000, 18000) : 0;
  const revSala      = rnd(0, 1) ? rnd(500, 4000)   : 0;
  const fechaConf    = estado === "confirmado" ? formatDate(anio, mes - 1 < 1 ? 12 : mes - 1, rnd(1, 28)) : null;

  return {
    hotel_id,
    nombre,
    categoria: cat,
    estado,
    fecha_inicio: fechaIni,
    fecha_fin:    fechaFin,
    fecha_confirmacion: fechaConf,
    habitaciones,
    pax: habitaciones * 2,
    adr_grupo: adr,
    revenue_fnb:  revFnb,
    revenue_sala: revSala,
    notas: null,
    motivo_perdida: estado === "cancelado" ? ["Precio","Competencia","Fechas no disponibles","Presupuesto"][rnd(0,3)] : null,
  };
}

function generarEvento(hotel_id, anio, mes, esFuturo) {
  const nombre  = NOMBRES_EVENTOS[(mes + anio) % NOMBRES_EVENTOS.length];
  const estado  = esFuturo ? estadoFuturo() : estadoPasado();
  const dia     = rnd(22, 27);
  const fecha   = formatDate(anio, mes, dia);
  const sala    = SALAS[mes % SALAS.length];
  const hiH     = rnd(10, 14);
  const hfH     = hiH + rnd(3, 6);
  const hi      = `${String(hiH).padStart(2,"0")}:00`;
  const hf      = `${String(Math.min(hfH,23)).padStart(2,"0")}:00`;
  const serv    = rnd(0,1) === 1;
  const revFnb  = rnd(3000, 20000);
  const revSala = rnd(800, 5000);

  return {
    hotel_id,
    nombre,
    categoria: "evento",
    estado,
    fecha_inicio: fecha,
    fecha_fin:    fecha,
    fecha_confirmacion: null,
    habitaciones: 0,
    pax: rnd(30, 200),
    adr_grupo: 0,
    revenue_fnb:  revFnb,
    revenue_sala: revSala,
    notas: packNotasEvento(hi, hf, sala, serv),
    motivo_perdida: estado === "cancelado" ? ["Presupuesto","Otro proveedor","Fecha cambiada"][rnd(0,2)] : null,
  };
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  // Buscar el usuario por email usando la admin API
  const { data: { users }, error: userErr } = await supabase.auth.admin.listUsers();
  if (userErr) { console.error("Error listando usuarios:", userErr.message); process.exit(1); }

  const user = users.find(u => u.email === email);
  if (!user) {
    console.error(`No se encontró ningún usuario con email: ${email}`);
    console.log("Usuarios disponibles:", users.map(u => u.email).join(", "));
    process.exit(1);
  }

  const hotel_id = user.id;
  console.log(`Usuario encontrado: ${email} (${hotel_id})`);

  const records = [];
  const anioActual = new Date().getFullYear();

  for (const anio of [anioActual - 1, anioActual]) {
    for (let mes = 1; mes <= 12; mes++) {
      const esFuturo = anio > anioActual || (anio === anioActual && mes > new Date().getMonth() + 1);
      records.push(generarGrupo(hotel_id, anio, mes, 0, esFuturo));
      records.push(generarGrupo(hotel_id, anio, mes, 1, esFuturo));
      records.push(generarEvento(hotel_id, anio, mes, esFuturo));
    }
  }

  console.log(`Insertando ${records.length} registros...`);

  const { error } = await supabase.from("grupos_eventos").insert(records);
  if (error) {
    console.error("Error al insertar:", error.message);
    process.exit(1);
  }

  console.log(`✓ ${records.length} registros insertados correctamente.`);
  console.log(`  → ${records.filter(r=>r.categoria==="evento").length} eventos`);
  console.log(`  → ${records.filter(r=>r.categoria!=="evento").length} grupos`);
}

main();
