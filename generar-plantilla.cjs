const XLSX = require("xlsx");

const wb = XLSX.utils.book_new();

// ── 1. 🏨 Mi Hotel ──
{
  const data = [
    ["CONFIGURACIÓN DEL HOTEL"],
    [],
    ["Completa los datos de tu hotel a continuación"],
    [],
    ["Nombre del hotel", "", "", "", "Hotel Ejemplo"],
    ["Ciudad",          "", "", "", "Madrid"],
    ["Categoría",       "", "", "", "4 estrellas"],
    [],
    ["Habitaciones disponibles", "", "", "", 80],
    ["Año de apertura",          "", "", "", 2010],
  ];
  const ws = XLSX.utils.aoa_to_sheet(data);
  ws["!cols"] = [{ wch: 28 }, { wch: 5 }, { wch: 5 }, { wch: 5 }, { wch: 20 }];
  XLSX.utils.book_append_sheet(wb, ws, "🏨 Mi Hotel");
}

// ── 2. 📅 Producción Diaria ──
{
  const data = [
    ["PRODUCCIÓN DIARIA — Rellena desde la fila 6"],
    [],
    ["Columnas: Fecha | Hab. Ocupadas | Hab. Disponibles | Rev. Habitaciones | Rev. Total | Rev. F&B | Rev. Otros"],
    [],
    // Fila 5 (índice 4) = cabecera que el parser salta (range:4 significa empieza en índice 4 = fila 5 Excel)
    ["Fecha", "Hab. Ocupadas", "Hab. Disponibles", "Rev. Habitaciones", "Rev. Total", "Rev. F&B", "Rev. Otros"],
    // Datos de ejemplo
    [new Date(2024, 0, 1), 64, 80, 5760, 6200, 800, 120],
    [new Date(2024, 0, 2), 70, 80, 6300, 6900, 950, 200],
    [new Date(2024, 0, 3), 55, 80, 4950, 5400, 600, 80],
  ];

  const ws = XLSX.utils.aoa_to_sheet(data);

  // Formato fecha para columna A (filas de datos: fila 7 en adelante = índice 6+)
  for (let r = 5; r <= 8; r++) {
    const cell = ws[XLSX.utils.encode_cell({ r, c: 0 })];
    if (cell) cell.z = "dd/mm/yyyy";
  }

  ws["!cols"] = [
    { wch: 14 }, { wch: 14 }, { wch: 18 }, { wch: 20 }, { wch: 12 }, { wch: 12 }, { wch: 12 }
  ];
  XLSX.utils.book_append_sheet(wb, ws, "📅 Producción Diaria");
}

// ── 3. 🎯 Pickup ──
{
  const data = [
    ["PICKUP DE RESERVAS"],
    [],
    ["Columnas: Fecha Pickup | Fecha Llegada | Canal | Num. Reservas | Fecha Salida | Noches | Precio Total | Estado"],
    [],
    ["fecha_pickup", "fecha_llegada", "canal", "num_reservas", "fecha_salida", "noches", "precio_total", "estado"],
    [new Date(2024, 2, 1), new Date(2024, 5, 15), "Booking.com", 2, new Date(2024, 5, 18), 3, 450, "confirmada"],
    [new Date(2024, 2, 1), new Date(2024, 5, 20), "Directo",  1, new Date(2024, 5, 22), 2, 190, "confirmada"],
    [new Date(2024, 2, 2), new Date(2024, 5, 15), "Booking.com", 1, new Date(2024, 5, 16), 1, 150, "cancelada"],
  ];

  const ws = XLSX.utils.aoa_to_sheet(data);

  // Formato fecha para columnas A, B, E
  for (let r = 5; r <= 7; r++) {
    ["A","B","E"].forEach(col => {
      const cell = ws[col + (r + 1)];
      if (cell) cell.z = "dd/mm/yyyy";
    });
  }

  ws["!cols"] = [
    { wch: 14 }, { wch: 14 }, { wch: 16 }, { wch: 14 }, { wch: 14 }, { wch: 8 }, { wch: 14 }, { wch: 12 }
  ];
  XLSX.utils.book_append_sheet(wb, ws, "🎯 Pickup");
}

// ── 4. 💰 Presupuesto ──
{
  const MESES = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
  const data = [
    ["PRESUPUESTO ANUAL"],
    [],
    ["Columnas: Mes | OCC (decimal ej: 0.75) | — | — | ADR | — | — | RevPAR | — | — | Rev.Total"],
    [],
    [2024],
    ["Mes", "OCC", "", "", "ADR", "", "", "RevPAR", "", "", "Rev. Total"],
  ];
  MESES.forEach((mes, i) => {
    data.push([mes, 0.70 + (i % 3) * 0.05, "", "", 89 + i * 2, "", "", 62 + i, "", "", 180000 + i * 5000]);
  });
  data.push([]);
  data.push([2025]);
  data.push(["Mes", "OCC", "", "", "ADR", "", "", "RevPAR", "", "", "Rev. Total"]);
  MESES.forEach((mes, i) => {
    data.push([mes, 0.72 + (i % 3) * 0.05, "", "", 92 + i * 2, "", "", 66 + i, "", "", 190000 + i * 5000]);
  });

  const ws = XLSX.utils.aoa_to_sheet(data);
  ws["!cols"] = [
    { wch: 14 }, { wch: 8 }, { wch: 4 }, { wch: 4 }, { wch: 8 },
    { wch: 4 }, { wch: 4 }, { wch: 8 }, { wch: 4 }, { wch: 4 }, { wch: 12 }
  ];
  XLSX.utils.book_append_sheet(wb, ws, "💰 Presupuesto");
}

// ── 5. 🎪 Grupos y Eventos ──
{
  const data = [
    ["GRUPOS Y EVENTOS"],
    [],
    ["Columnas: Nombre | Categoría | Estado | Fecha Inicio | Fecha Fin | Habitaciones | ADR Grupo | Rev. F&B | Rev. Sala | Notas | Motivo Pérdida"],
    ["Categorías válidas: corporativo, boda, feria, deportivo, otros"],
    ["Estados válidos: confirmado, tentativo, cotizacion, cancelado"],
    ["nombre", "categoria", "estado", "fecha_inicio", "fecha_fin", "habitaciones", "adr_grupo", "revenue_fnb", "revenue_sala", "notas", "motivo_perdida"],
    ["Congreso Médico 2024", "corporativo", "confirmado", new Date(2024, 4, 10), new Date(2024, 4, 13), 40, 95, 12000, 3000, "Salón principal", null],
    ["Boda García-López",    "boda",        "tentativo",  new Date(2024, 7, 17), new Date(2024, 7, 18), 20, 110, 8000, 1500, "",              null],
    ["Feria del Turismo",    "feria",       "cotizacion", new Date(2024, 9, 5),  new Date(2024, 9,  8), 15, 85,  2000,  800, "",              null],
  ];

  const ws = XLSX.utils.aoa_to_sheet(data);

  // Formato fecha columnas D y E
  for (let r = 5; r <= 7; r++) {
    ["D","E"].forEach(col => {
      const cell = ws[col + (r + 1)];
      if (cell) cell.z = "dd/mm/yyyy";
    });
  }

  ws["!cols"] = [
    { wch: 22 }, { wch: 14 }, { wch: 12 }, { wch: 14 }, { wch: 14 },
    { wch: 14 }, { wch: 10 }, { wch: 12 }, { wch: 12 }, { wch: 20 }, { wch: 20 }
  ];
  XLSX.utils.book_append_sheet(wb, ws, "🎪 Grupos y Eventos");
}

// Guardar
const outputPath = "./Plantilla_FastRevenue.xlsx";
XLSX.writeFile(wb, outputPath);
console.log("✅ Plantilla generada:", outputPath);
