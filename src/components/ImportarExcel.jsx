import { useState, useEffect } from "react";
import { useT } from "../i18n";
import { C, NET_HAB_FNB, NET_SALA, dmy, MESES_FULL } from "../constants";
import { supabase } from "../supabase";
import { CustomSelect } from "./CustomSelect";
import { PeriodSelectorInline } from "./PeriodSelectorInline";
import { Card } from "./Card";

export function ImportarExcel({ onClose, session, onImportado, onProduccionDirecta, hotelNombre: hotelNombreProp, fullPage = false }) {
  const t = useT();
  // Pestaña activa (persiste entre navegaciones)
  const [activeBlock, setActiveBlock] = useState(() => localStorage.getItem("fr_gestion_tab") || "presupuesto");
  const setActiveBlockPersist = (id) => { setActiveBlock(id); localStorage.setItem("fr_gestion_tab", id); };
  // Estado datos principales (Histórico)
  const [loadingMain, setLoadingMain] = useState(false);
  const [resultadoMain, setResultadoMain] = useState(null);
  const [errorMain, setErrorMain] = useState("");
  const [progresoMain, setProgresoMain] = useState("");
  const [progresoPctMain, setProgresoPctMain] = useState(0);
  // Edición por fecha (Histórico)
  const [fechaBusqueda, setFechaBusqueda] = useState("");
  const [diaEncontrado, setDiaEncontrado] = useState(null);
  const [buscando, setBuscando] = useState(false);
  const [editValues, setEditValues] = useState({});
  const [guardandoEdit, setGuardandoEdit] = useState(false);
  const [errorEdit, setErrorEdit] = useState("");
  const [okEdit, setOkEdit] = useState(false);
  // Estado presupuesto
  const [loadingPpto, setLoadingPpto] = useState(false);
  const [resultadoPpto, setResultadoPpto] = useState(null);
  const [errorPpto, setErrorPpto] = useState("");
  const [progresoPpto, setProgresoPpto] = useState("");
  const [progresoPctPpto, setProgresoPctPpto] = useState(0);
  // Estado pick up diario
  const [pickupForm, setPickupForm] = useState({
    fecha_pickup: new Date().toISOString().slice(0,10),
    fecha_llegada: "", canal: "", num_reservas: "1",
    fecha_salida: "", noches: "", precio_total: "", estado: "confirmada",
  });
  const [guardandoPickup, setGuardandoPickup] = useState(false);
  const [errorPickup, setErrorPickup] = useState("");
  const [pickupRecientes, setPickupRecientes] = useState([]);
  const [okPickup, setOkPickup] = useState(false);
  const [preciosDiferentes, setPreciosDiferentes] = useState(false);
  const [preciosPorNoche, setPreciosPorNoche] = useState([]);
  const [canalPersonalizado, setCanalPersonalizado] = useState("");
  // Estado producción diaria
  const [prodForm, setProdForm] = useState({
    fecha: new Date().toISOString().slice(0,10),
    hab_ocupadas: "", hab_disponibles: "",
    revenue_hab: "", revenue_fnb: "", revenue_salas: "",
  });
  const [guardandoProd, setGuardandoProd] = useState(false);
  const [errorProd, setErrorProd] = useState("");
  const [okProd, setOkProd] = useState(false);
  const [prodRecientes, setProdRecientes] = useState([]);
  const [generandoProdMock, setGenerandoProdMock] = useState(false);
  const [okProdMock, setOkProdMock] = useState(false);
  const [resultadoRelleno, setResultadoRelleno] = useState(null);
  // Vaciar
  const [vaciando, setVaciando] = useState(false);
  const [confirmVaciar, setConfirmVaciar] = useState(false);
  // Limpiar solo pickup
  const [limpiandoPickup, setLimpiandoPickup] = useState(false);
  const [confirmLimpiarPickup, setConfirmLimpiarPickup] = useState(false);
  // Estado de importación existente
  const [importStatusHistorico, setImportStatusHistorico] = useState(null); // null=comprobando, false=sin datos, {fecha,count}
  const [importStatusPresupuesto, setImportStatusPresupuesto] = useState(null);
  const [modoHistorico, setModoHistorico] = useState("status"); // "status" | "upload" | "edit"
  const [modoPpto, setModoPpto] = useState("status"); // "status" | "upload" | "edit"
  const [pptoEditAnio, setPptoEditAnio] = useState(() => new Date().getFullYear());
  const [pptoEditMes, setPptoEditMes] = useState(() => new Date().getMonth() + 1);
  const [pptoEditValues, setPptoEditValues] = useState({ occ_ppto:"", adr_ppto:"", revpar_ppto:"", rev_total_ppto:"" });
  const [pptoEditLoading, setPptoEditLoading] = useState(false);
  const [okEditPpto, setOkEditPpto] = useState(false);
  const [errorEditPpto, setErrorEditPpto] = useState("");
  const [confirmEliminarHistorico, setConfirmEliminarHistorico] = useState(false);
  const [confirmEliminarPresupuesto, setConfirmEliminarPresupuesto] = useState(false);
  const [eliminandoHistorico, setEliminandoHistorico] = useState(false);
  const [eliminandoPresupuesto, setEliminandoPresupuesto] = useState(false);
  const [showPptoZone, setShowPptoZone] = useState(true);
  // Tabla presupuesto editable (12 meses)
  const [pptoTablaAnio, setPptoTablaAnio] = useState(() => new Date().getFullYear());
  const [pptoTablaData, setPptoTablaData] = useState(() =>
    Array.from({length:12}, (_,i) => ({ mes:i+1, occ_ppto:"", adr_ppto:"", revpar_ppto:"", rev_total_ppto:"" }))
  );
  const [pptoTablaLoading, setPptoTablaLoading] = useState(false);
  const [pptoTablaOk, setPptoTablaOk] = useState(false);
  const [pptoTablaError, setPptoTablaError] = useState("");
  const [pptoTablaLoadingData, setPptoTablaLoadingData] = useState(false);

  // Comprobar si ya hay datos importados al montar
  useEffect(() => {
    const checkImports = async () => {
      const [{ count: countH }, { count: countP }] = await Promise.all([
        supabase.from("produccion_diaria").select("*", { count: "exact", head: true }).eq("hotel_id", session.user.id),
        supabase.from("presupuesto").select("*", { count: "exact", head: true }).eq("hotel_id", session.user.id),
      ]);
      const fechaH = localStorage.getItem(`fr_import_hist_${session.user.id}`);
      const fechaP = localStorage.getItem(`fr_import_ppto_${session.user.id}`);
      setImportStatusHistorico(countH > 0 ? { fecha: fechaH, count: countH } : false);
      setImportStatusPresupuesto(countP > 0 ? { fecha: fechaP, count: countP } : false);
    };
    checkImports();
  }, []);

  useEffect(() => { cargarPptoTabla(pptoTablaAnio); }, [pptoTablaAnio]); // eslint-disable-line

  const vaciarDatos = async () => {
    setVaciando(true);
    try {
      await Promise.all([
        supabase.from("produccion_diaria").delete().eq("hotel_id", session.user.id),
        supabase.from("pickup_entries").delete().eq("hotel_id", session.user.id),
        supabase.from("presupuesto").delete().eq("hotel_id", session.user.id),
        supabase.from("grupos_eventos").delete().eq("hotel_id", session.user.id),
      ]);
      localStorage.setItem('cleanup_grupo_canal_v1', '1');
      setConfirmVaciar(false);
      onImportado();
      onClose();
    } catch(e) {
      setErrorMain("Error al vaciar datos: " + e.message);
    }
    setVaciando(false);
  };

  const limpiarPickup = async () => {
    setLimpiandoPickup(true);
    try {
      await supabase.from("pickup_entries").delete().eq("hotel_id", session.user.id);
      setConfirmLimpiarPickup(false);
      if (onImportado) onImportado();
    } catch(e) {
      setErrorMain("Error al limpiar pickup: " + e.message);
    }
    setLimpiandoPickup(false);
  };

  const eliminarHistorico = async () => {
    setEliminandoHistorico(true);
    try {
      await Promise.all([
        supabase.from("produccion_diaria").delete().eq("hotel_id", session.user.id),
        supabase.from("pickup_entries").delete().eq("hotel_id", session.user.id),
        supabase.from("grupos_eventos").delete().eq("hotel_id", session.user.id),
      ]);
      localStorage.removeItem(`fr_import_hist_${session.user.id}`);
      localStorage.setItem('cleanup_grupo_canal_v1', '1'); // tablas ya vacías, no repetir limpieza
      setImportStatusHistorico(false);
      setModoHistorico("status");
      setConfirmEliminarHistorico(false);
      setResultadoMain(null);
      if (onImportado) onImportado();
    } catch(e) { setErrorMain("Error al eliminar: " + e.message); }
    setEliminandoHistorico(false);
  };

  const eliminarPresupuesto = async () => {
    setEliminandoPresupuesto(true);
    try {
      await supabase.from("presupuesto").delete().eq("hotel_id", session.user.id);
      localStorage.removeItem(`fr_import_ppto_${session.user.id}`);
      setImportStatusPresupuesto(false);
      setModoPpto("status");
      setConfirmEliminarPresupuesto(false);
      setResultadoPpto(null);
      if (onImportado) onImportado();
    } catch(e) { setErrorPpto("Error al eliminar: " + e.message); }
    setEliminandoPresupuesto(false);
  };

  const validarArchivo = (file) => {
    if (file.size > 10 * 1024 * 1024) throw new Error("El archivo es demasiado grande (máx. 10 MB)");
    const TIPOS_VALIDOS = ["application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "application/vnd.ms-excel"];
    if (!TIPOS_VALIDOS.includes(file.type) && !file.name.endsWith(".xlsx") && !file.name.endsWith(".xls")) {
      throw new Error("Formato no válido. Sube un archivo .xlsx");
    }
  };

  // ── Import datos principales: producción + pickup (sin presupuesto) ──
  const procesarPrincipal = async (file) => {
    setLoadingMain(true); setErrorMain(""); setResultadoMain(null); setProgresoPctMain(0);
    try {
      validarArchivo(file);
      setProgresoMain(t("leyendo")); setProgresoPctMain(5);
      const XLSX = await import("xlsx");
      const data = await file.arrayBuffer();
      const wb = XLSX.read(data, { sheets: ["📅 Producción Diaria", "🎯 Pickup", "🏨 Mi Hotel", "🎪 Grupos y Eventos"] });
      setProgresoPctMain(15);

      // ── Producción Diaria ──
      const ws = wb.Sheets["📅 Producción Diaria"];
      if (!ws) throw new Error("No se encontró la hoja '📅 Producción Diaria'");

      const rows = XLSX.utils.sheet_to_json(ws, { header: 1, range: 4 });
      const produccionRows = [];

      const wsHotel = wb.Sheets["🏨 Mi Hotel"];
      const hotelRows = wsHotel ? XLSX.utils.sheet_to_json(wsHotel, { header: 1 }) : [];
      const totalHab = parseFloat(hotelRows?.[8]?.[4]) || null;

      for (const row of rows) {
        if (!row[0]) continue;
        const fecha = row[0];
        const hab_ocupadas = parseFloat(row[1]) || null;
        const hab_disponibles = parseFloat(row[2]) || totalHab;
        const _rh_csv = parseFloat(row[3]) || null;
        const _rf_csv = parseFloat(row[5]) || null;
        const revenue_hab = _rh_csv != null ? Math.round(_rh_csv * NET_HAB_FNB * 100) / 100 : null;
        const revenue_fnb = _rf_csv != null ? Math.round(_rf_csv * NET_HAB_FNB * 100) / 100 : null;
        const revenue_total = revenue_hab != null || revenue_fnb != null ? Math.round(((revenue_hab||0)+(revenue_fnb||0)) * 100) / 100 : null;
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
        const trevpar = hab_disponibles > 0 ? ((revenue_hab||0)+(revenue_fnb||0)) / hab_disponibles : null;

        produccionRows.push({
          hotel_id: session.user.id, fecha: fechaISO,
          hab_ocupadas, hab_disponibles, revenue_hab, revenue_total,
          revenue_fnb,
          adr: adr ? Math.round(adr*100)/100 : null,
          revpar: revpar ? Math.round(revpar*100)/100 : null,
          trevpar: trevpar ? Math.round(trevpar*100)/100 : null,
        });
      }


      // ── Pickup — hoja "🎯 Pickup", datos desde fila 5 ──
      // raw:false hace que SheetJS convierta datetime → string "YYYY-MM-DD"
      const wsPu = wb.Sheets["🎯 Pickup"];
      const pickupRows = [];
      if (wsPu) {
        // Leer toda la hoja sin range fijo — buscar filas con seriales de fecha válidos
        const rowsPu = XLSX.utils.sheet_to_json(wsPu, { header: 1, raw: true });
        const esSerial = (v) => typeof v === "number" && v > 40000 && v < 60000;
        const serialToDate = (v) => {
          const d = new Date(Date.UTC(1899, 11, 30) + Math.floor(v) * 86400000);
          return d.toISOString().slice(0, 10);
        };
        for (const row of rowsPu) {
          if (!row || row.length < 2) continue;
          if (!esSerial(row[0]) || !esSerial(row[1])) continue;
          const fp = serialToDate(row[0]);
          const fl = serialToDate(row[1]);
          // col2=canal, col3=num_reservas (puede ser número o serial pequeño 1900-xx)
          const nrRaw = row[3];
          const nr = typeof nrRaw === "number"
            ? (nrRaw < 40000 ? Math.round(nrRaw) : 1)  // serial < 40000 = número real de reservas
            : (parseInt(nrRaw) || 1);
          // col4=fecha_salida, col5=noches, col6=precio_total, col7=estado, col8+=precio noche 1,2,3...
          const fechaSalida = row[4] && esSerial(row[4]) ? serialToDate(row[4]) : null;
          const noches      = row[5] && typeof row[5] === "number" && row[5] < 100 ? Math.round(row[5]) : null;
          const precioTotal = row[6] && typeof row[6] === "number" ? Math.round(row[6] * 100) / 100 : null;
          const estado         = row[7] && typeof row[7] === "string" ? row[7] : "confirmada";
          const _nr8 = row[8]; const numeroReserva = (_nr8 != null && _nr8 !== "" && !isNaN(Number(_nr8)) && Number(_nr8) > 0) ? Math.round(Number(_nr8)) : null;
          // Precios por noche desde col J (índice 9) en adelante
          const preciosNoche = [];
          for (let ci = 9; ci < row.length; ci++) {
            const v = row[ci];
            if (typeof v === "number" && v >= 0) preciosNoche.push(Math.round(v * 100) / 100);
            else break;
          }
          const preciosPorNocheVal = preciosNoche.length > 0 ? preciosNoche.map(v => Math.round(v * NET_HAB_FNB * 100) / 100) : null;
          // Si hay precios por noche y no hay precio_total, calcularlo como suma; aplicar IVA
          const _precioBase = precioTotal ?? (preciosPorNocheVal ? Math.round(preciosPorNocheVal.reduce((a,v)=>a+v,0)*100)/100 : null);
          const precioTotalFinal = _precioBase != null ? (preciosNoche.length > 0 ? _precioBase : Math.round(_precioBase * NET_HAB_FNB * 100) / 100) : null;
          pickupRows.push({
            hotel_id:          session.user.id,
            fecha_pickup:      fp,
            fecha_llegada:     fl,
            canal:             row[2] || null,
            num_reservas:      nr || 1,
            fecha_salida:      fechaSalida,
            noches:            noches,
            precio_total:      precioTotalFinal,
            precios_por_noche: preciosPorNocheVal,
            estado:            estado || "confirmada",
            numero_reserva:    numeroReserva,
          });
        }
      }

      if (produccionRows.length === 0) throw new Error("No se encontró la hoja '📅 Producción Diaria' o está vacía");

      setProgresoMain(t("procesando")); setProgresoPctMain(30);

      // Detectar años y limpiar
      const aniosImport = [...new Set(produccionRows.map(r => r.fecha.slice(0, 4)))];
      // Años en pickup (por fecha_llegada)
      const aniosPickup = [...new Set(pickupRows.map(r => r.fecha_llegada.slice(0, 4)))];
      const todosAnios  = [...new Set([...aniosImport, ...aniosPickup])];

      setProgresoMain(t("limpiando")); setProgresoPctMain(40);
      await Promise.all([
        ...aniosImport.map(anio =>
          supabase.from("produccion_diaria").delete()
            .eq("hotel_id", session.user.id)
            .gte("fecha", `${anio}-01-01`).lte("fecha", `${anio}-12-31`)
        ),
        // Borrar TODOS los pickup (no solo por año) para eliminar mocks y entradas huérfanas
        supabase.from("pickup_entries").delete().eq("hotel_id", session.user.id),
      ]);

      setProgresoMain(t("guardando")); setProgresoPctMain(55);

      const LOTE_PROD = 500;
      const lotesProd = [];
      for (let i = 0; i < produccionRows.length; i += LOTE_PROD) lotesProd.push(produccionRows.slice(i, i + LOTE_PROD));
      const insertPromises = [
        Promise.all(lotesProd.map(lote =>
          supabase.from("produccion_diaria").insert(lote).then(({ error }) => {
            if (error) throw new Error("Error al guardar producción: " + error.message);
          })
        )).then(() => setProgresoPctMain(p => Math.max(p, 70))),
      ];

      if (pickupRows.length > 0) {
        const LOTE = 500;
        const total = pickupRows.length;
        const lotes = [];
        for (let i = 0; i < total; i += LOTE) lotes.push(pickupRows.slice(i, i + LOTE));
        insertPromises.push(
          Promise.all(lotes.map((lote, idx) =>
            supabase.from("pickup_entries").insert(lote).then(({ error }) => {
              if (error) throw new Error("Error al guardar pickup: " + error.message);
              const pct = Math.round(55 + ((idx + 1) / lotes.length) * 35);
              setProgresoPctMain(pct);
              setProgresoMain(`Guardando pickup... ${Math.min((idx+1)*LOTE, total)} de ${total}`);
            })
          )).then(() => setProgresoMain(""))
        );
      }

      await Promise.all(insertPromises);
      setProgresoPctMain(90);

      if (totalHab) {
        await supabase.from("hoteles").update({ habitaciones: totalHab }).eq("id", session.user.id);
      }

      // ── Grupos y Eventos ──
      const wsGrupos = wb.Sheets["🎪 Grupos y Eventos"];
      if (wsGrupos) {
        const rowsG = XLSX.utils.sheet_to_json(wsGrupos, { header: 1, raw: true });
        const serialToISO = v => { const d = new Date(Date.UTC(1899, 11, 30) + Math.floor(v) * 86400000); return d.toISOString().slice(0, 10); };
        const esSerial = v => typeof v === "number" && v > 40000 && v < 70000;
        const parseDate = v => {
          if (!v) return null;
          if (esSerial(v)) return serialToISO(v);
          const s = String(v).trim();
          // YYYY-MM-DD
          if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
          // DD-MM-YYYY or DD/MM/YYYY
          const m = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
          if (m) return `${m[3]}-${m[2].padStart(2,'0')}-${m[1].padStart(2,'0')}`;
          return null;
        };
        const gruposRows = [];
        for (const row of rowsG) {
          if (!row || !row[0] || typeof row[0] !== "string" || !parseDate(row[3])) continue;
          gruposRows.push({
            hotel_id:           session.user.id,
            nombre:             row[0] || null,
            categoria:          row[1] || null,
            estado:             row[2] || "tentativo",
            fecha_inicio:       parseDate(row[3]),
            fecha_fin:          parseDate(row[4]),
            habitaciones:       typeof row[5] === "number" ? Math.round(row[5]) : null,
            adr_grupo:          typeof row[6] === "number" ? row[6] : null,
            revenue_fnb:        typeof row[7] === "number" ? row[7] : null,
            revenue_sala:       typeof row[8] === "number" ? row[8] : null,
            notas:              row[9] || null,
            motivo_perdida:     row[10] || null,
            fecha_confirmacion: parseDate(row[11]),
          });
        }
        if (gruposRows.length > 0) {
          await supabase.from("grupos_eventos").delete().eq("hotel_id", session.user.id);
          const LOTE_G = 200;
          for (let i = 0; i < gruposRows.length; i += LOTE_G) {
            const { error } = await supabase.from("grupos_eventos").insert(gruposRows.slice(i, i + LOTE_G));
            if (error) throw new Error("Error al guardar grupos: " + error.message);
          }
        }
      }

      setProgresoPctMain(100);
      setResultadoMain({ produccion: produccionRows.length, pickup: pickupRows.length });
      const fechaImportH = new Date().toLocaleString("es-ES", { day:"2-digit", month:"2-digit", year:"numeric", hour:"2-digit", minute:"2-digit" });
      localStorage.setItem(`fr_import_hist_${session.user.id}`, fechaImportH);
      setImportStatusHistorico({ fecha: fechaImportH, count: produccionRows.length });
      setModoHistorico("status");
      if (onImportado) onImportado();
    } catch (e) {
      setErrorMain(e.message);
      setProgresoPctMain(0);
    }
    setLoadingMain(false);
  };

  // ── Import presupuesto: sólo hoja 💰 Presupuesto ──
  // ── Cargar mes de presupuesto para editar ──
  const cargarMesPpto = async (anio, mes) => {
    setPptoEditLoading(true); setErrorEditPpto(""); setOkEditPpto(false);
    const { data } = await supabase.from("presupuesto")
      .select("occ_ppto,adr_ppto,revpar_ppto,rev_total_ppto")
      .eq("hotel_id", session.user.id).eq("anio", anio).eq("mes", mes).maybeSingle();
    setPptoEditValues({
      occ_ppto:       data?.occ_ppto       ?? "",
      adr_ppto:       data?.adr_ppto       ?? "",
      revpar_ppto:    data?.revpar_ppto     ?? "",
      rev_total_ppto: data?.rev_total_ppto  ?? "",
    });
    setPptoEditLoading(false);
  };

  // ── Guardar mes de presupuesto editado (upsert) ──
  const guardarMesPpto = async () => {
    setPptoEditLoading(true); setErrorEditPpto(""); setOkEditPpto(false);
    try {
      const row = {
        hotel_id:       session.user.id,
        anio:           pptoEditAnio,
        mes:            pptoEditMes,
        occ_ppto:       parseFloat(pptoEditValues.occ_ppto)       || null,
        adr_ppto:       parseFloat(pptoEditValues.adr_ppto)       || null,
        revpar_ppto:    parseFloat(pptoEditValues.revpar_ppto)    || null,
        rev_total_ppto: parseFloat(pptoEditValues.rev_total_ppto) || null,
      };
      const { data: existing } = await supabase.from("presupuesto")
        .select("id").eq("hotel_id", session.user.id).eq("anio", pptoEditAnio).eq("mes", pptoEditMes).maybeSingle();
      const { error } = existing
        ? await supabase.from("presupuesto").update(row).eq("hotel_id", session.user.id).eq("anio", pptoEditAnio).eq("mes", pptoEditMes)
        : await supabase.from("presupuesto").insert(row);
      if (error) throw new Error(error.message);
      setOkEditPpto(true); setTimeout(() => setOkEditPpto(false), 3000);
      if (onImportado) onImportado();
    } catch(e) { setErrorEditPpto("Error: " + e.message); }
    setPptoEditLoading(false);
  };

  // ── Cargar los 12 meses de un año para la tabla ──
  const cargarPptoTabla = async (anio) => {
    setPptoTablaLoadingData(true);
    const { data } = await supabase.from("presupuesto")
      .select("mes,occ_ppto,adr_ppto,revpar_ppto,rev_total_ppto")
      .eq("hotel_id", session.user.id).eq("anio", anio).order("mes");
    setPptoTablaData(Array.from({length:12}, (_,i) => {
      const r = data?.find(r => r.mes === i+1);
      return { mes:i+1, occ_ppto:r?.occ_ppto??'', adr_ppto:r?.adr_ppto??'', revpar_ppto:r?.revpar_ppto??'', rev_total_ppto:r?.rev_total_ppto??'' };
    }));
    setPptoTablaLoadingData(false);
  };

  // ── Guardar los 12 meses de la tabla ──
  const guardarPptoTabla = async () => {
    setPptoTablaLoading(true); setPptoTablaError(""); setPptoTablaOk(false);
    try {
      await supabase.from("presupuesto").delete().eq("hotel_id", session.user.id).eq("anio", pptoTablaAnio);
      const rows = pptoTablaData
        .filter(r => r.occ_ppto!=='' || r.adr_ppto!=='' || r.revpar_ppto!=='' || r.rev_total_ppto!=='')
        .map(r => ({
          hotel_id: session.user.id, anio: pptoTablaAnio, mes: r.mes,
          occ_ppto:       r.occ_ppto!==''       ? parseFloat(r.occ_ppto)       : null,
          adr_ppto:       r.adr_ppto!==''       ? parseFloat(r.adr_ppto)       : null,
          revpar_ppto:    r.revpar_ppto!==''    ? parseFloat(r.revpar_ppto)    : null,
          rev_total_ppto: r.rev_total_ppto!=='' ? parseFloat(r.rev_total_ppto) : null,
        }));
      if (rows.length > 0) {
        const { error } = await supabase.from("presupuesto").insert(rows);
        if (error) throw new Error(error.message);
      }
      setPptoTablaOk(true); setTimeout(() => setPptoTablaOk(false), 3000);
      const ts = new Date().toLocaleString("es-ES", { day:"2-digit", month:"2-digit", year:"numeric", hour:"2-digit", minute:"2-digit" });
      localStorage.setItem(`fr_import_ppto_${session.user.id}`, ts);
      setImportStatusPresupuesto({ fecha: ts, count: rows.length });
      if (onImportado) onImportado();
    } catch(e) { setPptoTablaError("Error: " + e.message); }
    setPptoTablaLoading(false);
  };

  const procesarPresupuesto = async (file) => {
    setLoadingPpto(true); setErrorPpto(""); setResultadoPpto(null); setProgresoPctPpto(0);
    try {
      validarArchivo(file);
      setProgresoPpto(t("leyendo")); setProgresoPctPpto(10);
      const XLSX = await import("xlsx");
      const data = await file.arrayBuffer();
      const wb = XLSX.read(data, { sheets: ["💰 Presupuesto"] });
      setProgresoPctPpto(30);

      const wsBu = wb.Sheets["💰 Presupuesto"];
      if (!wsBu) throw new Error("No se encontró la hoja '💰 Presupuesto'");

      const rowsBu = XLSX.utils.sheet_to_json(wsBu, { header: 1 });
      const MESES_PPTO = ["Enero","Febrero","Marzo","Abril","Mayo","Junio",
                          "Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
      let bloques = [];
      for (let r = 0; r < rowsBu.length; r++) {
        const asNum = parseInt(rowsBu[r]?.[0]);
        if (asNum >= 2020 && asNum <= 2035) {
          for (let s = r+1; s <= r+5; s++) {
            if (rowsBu[s]?.[0] === "Enero") { bloques.push({ anio: asNum, startRow: s }); break; }
          }
        }
      }
      if (bloques.length === 0) {
        // Fallback: buscar primer "Enero" y asumir año actual
        const anioFallback = new Date().getFullYear();
        for (let r = 0; r < rowsBu.length; r++) {
          if (rowsBu[r]?.[0] === "Enero") { bloques.push({ anio: anioFallback, startRow: r }); break; }
        }
      }
      if (bloques.length === 0) throw new Error("No se encontraron datos de presupuesto en la hoja");

      const presupuestoRows = [];
      for (const { anio: anioBloque, startRow } of bloques) {
        for (let i = 0; i < 12; i++) {
          const row = rowsBu[startRow + i];
          if (!row || !MESES_PPTO.includes(row[0])) continue;
          const occ_ppto       = parseFloat(row[1])  || null;
          const adr_ppto       = parseFloat(row[4])  || null;
          const revpar_ppto    = parseFloat(row[7])  || null;
          const rev_total_ppto = parseFloat(row[10]) || null;
          if (!occ_ppto && !adr_ppto && !revpar_ppto && !rev_total_ppto) continue;
          presupuestoRows.push({
            hotel_id: session.user.id,
            anio: anioBloque,
            mes: i + 1,
            occ_ppto:       occ_ppto       ? Math.round(occ_ppto * 1000) / 10 : null,
            adr_ppto:       adr_ppto       ? Math.round(adr_ppto * 100) / 100 : null,
            revpar_ppto:    revpar_ppto    ? Math.round(revpar_ppto * 100) / 100 : null,
            rev_total_ppto: rev_total_ppto ? Math.round(rev_total_ppto) : null,
          });
        }
      }
      if (presupuestoRows.length === 0) throw new Error("No se encontraron datos de presupuesto");

      setProgresoPpto(t("limpiando")); setProgresoPctPpto(55);
      const aniosPpto = [...new Set(bloques.map(b => b.anio))];
      await Promise.all(aniosPpto.map(a =>
        supabase.from("presupuesto").delete().eq("hotel_id", session.user.id).eq("anio", a)
      ));

      setProgresoPpto(t("guardando")); setProgresoPctPpto(75);
      const { error } = await supabase.from("presupuesto").insert(presupuestoRows);
      if (error) throw new Error("Error al guardar presupuesto: " + error.message);

      setProgresoPctPpto(100);
      setResultadoPpto({ presupuesto: presupuestoRows.length });
      const fechaImportP = new Date().toLocaleString("es-ES", { day:"2-digit", month:"2-digit", year:"numeric", hour:"2-digit", minute:"2-digit" });
      localStorage.setItem(`fr_import_ppto_${session.user.id}`, fechaImportP);
      setImportStatusPresupuesto({ fecha: fechaImportP, count: presupuestoRows.length });
      setModoPpto("status");
      setShowPptoZone(false);
      if (onImportado) onImportado();
    } catch (e) {
      setErrorPpto(e.message);
      setProgresoPctPpto(0);
    }
    setLoadingPpto(false);
  };


  // ── Producción diaria (upsert por fecha) ──
  const guardarProduccion = async () => {
    setGuardandoProd(true); setErrorProd(""); setOkProd(false);
    try {
      if (!prodForm.fecha) throw new Error("La fecha es obligatoria");
      const hab_ocupadas    = parseFloat(prodForm.hab_ocupadas)    || null;
      const hab_disponibles = parseFloat(prodForm.hab_disponibles) || null;
      const _rh_raw     = parseFloat(prodForm.revenue_hab)     || null;
      const _rf_raw     = parseFloat(prodForm.revenue_fnb)     || null;
      const _rs_raw     = parseFloat(prodForm.revenue_salas)   || null;
      const revenue_hab   = _rh_raw != null ? Math.round(_rh_raw * NET_HAB_FNB * 100) / 100 : null;
      const revenue_fnb   = _rf_raw != null ? Math.round(_rf_raw * NET_HAB_FNB * 100) / 100 : null;
      const revenue_salas = _rs_raw != null ? Math.round(_rs_raw * NET_SALA    * 100) / 100 : null;
      const revenue_total   = Math.round(((revenue_hab||0) + (revenue_fnb||0) + (revenue_salas||0)) * 100) / 100 || null;
      if (!hab_ocupadas && !revenue_hab) throw new Error("Introduce al menos Hab. Ocupadas o Rev. Habitaciones");
      const adr    = hab_ocupadas > 0 && revenue_hab ? Math.round(revenue_hab / hab_ocupadas * 100) / 100 : null;
      const revpar = hab_disponibles > 0 && revenue_hab ? Math.round(revenue_hab / hab_disponibles * 100) / 100 : null;
      const trevpar = hab_disponibles > 0 ? Math.round(((revenue_hab||0)+(revenue_fnb||0)+(revenue_salas||0)) / hab_disponibles * 100) / 100 : null;
      const row = {
        hotel_id: session.user.id, fecha: prodForm.fecha,
        hab_ocupadas, hab_disponibles, revenue_hab, revenue_total, revenue_fnb,
        adr, revpar, trevpar,
      };
      const { data: existing } = await supabase.from("produccion_diaria")
        .select("id").eq("hotel_id", session.user.id).eq("fecha", prodForm.fecha).maybeSingle();
      const { error } = existing
        ? await supabase.from("produccion_diaria").update(row).eq("hotel_id", session.user.id).eq("fecha", prodForm.fecha)
        : await supabase.from("produccion_diaria").insert(row);
      if (error) throw new Error(error.message);
      setProdRecientes(prev => [row, ...prev.filter(r => r.fecha !== prodForm.fecha)].slice(0, 8));
      setProdForm(f => ({...f, hab_ocupadas:"", hab_disponibles:"", revenue_hab:"", revenue_fnb:"", revenue_salas:""}));
      setOkProd(true); setTimeout(() => setOkProd(false), 3000);
      if (onImportado) onImportado();
      const d = new Date(prodForm.fecha + 'T00:00:00');
      const nextDay = new Date(d); nextDay.setDate(d.getDate() + 1);
      if (nextDay.getMonth() !== d.getMonth()) enviarInformeMensual(d.getFullYear(), d.getMonth() + 1);
    } catch(e) { setErrorProd(e.message); }
    setGuardandoProd(false);
  };

  // ── Rellenar días faltantes de producción y pickup basado en histórico ──
  const rellenarDiasFaltantes = async () => {
    setGenerandoProdMock(true); setErrorProd(""); setOkProdMock(false); setResultadoRelleno(null);
    try {
      const pad = n => String(n).padStart(2, "0");
      const isoDate = d => `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
      const hoy = new Date();
      const ayer = new Date(hoy); ayer.setDate(hoy.getDate() - 1);
      const ayerStr = isoDate(ayer);

      // 1. Leer toda la producción existente
      const { data: existingProd } = await supabase.from("produccion_diaria")
        .select("fecha,hab_ocupadas,hab_disponibles,revenue_hab,revenue_fnb,revenue_total")
        .eq("hotel_id", session.user.id).order("fecha", { ascending: true });

      const existingDates = new Set((existingProd || []).map(r => r.fecha));

      // Rango: desde primera fecha registrada (o hace 1 año si no hay datos) hasta ayer
      let startDate;
      if (existingProd && existingProd.length > 0) {
        startDate = new Date(existingProd[0].fecha + 'T00:00:00');
      } else {
        startDate = new Date(hoy); startDate.setFullYear(startDate.getFullYear() - 1);
      }

      // 2. Fechas faltantes
      const missingDates = [];
      let cur = new Date(startDate);
      const ayerDate = new Date(ayerStr + 'T00:00:00');
      while (cur <= ayerDate) {
        const iso = isoDate(cur);
        if (!existingDates.has(iso)) missingDates.push(iso);
        cur.setDate(cur.getDate() + 1);
      }

      if (missingDates.length === 0) {
        setResultadoRelleno(0); setOkProdMock(true);
        setTimeout(() => setOkProdMock(false), 3000);
        setGenerandoProdMock(false); return;
      }

      // 3. Patrones del histórico
      const hist = existingProd || [];
      let habDis = 30, baseOcc = 0.68, baseADR = 110, fnbRatio = 0.12;
      if (hist.length > 5) {
        const conHab = hist.filter(d => d.hab_disponibles > 0);
        if (conHab.length) habDis = Math.round(conHab.reduce((a, d) => a + d.hab_disponibles, 0) / conHab.length);
        if (conHab.length) baseOcc = conHab.reduce((a, d) => a + d.hab_ocupadas / d.hab_disponibles, 0) / conHab.length;
        const conADR = hist.filter(d => d.hab_ocupadas > 0 && d.revenue_hab > 0);
        if (conADR.length) baseADR = conADR.reduce((a, d) => a + d.revenue_hab / d.hab_ocupadas, 0) / conADR.length;
        const conFnb = hist.filter(d => d.revenue_hab > 0);
        if (conFnb.length) fnbRatio = conFnb.reduce((a, d) => a + (d.revenue_fnb || 0) / d.revenue_hab, 0) / conFnb.length;
      }

      // Factores día de semana (0=dom … 6=sáb)
      const dowFactors = [0.88, 0.78, 0.80, 0.85, 0.95, 1.12, 1.08];
      if (hist.length > 20) {
        const sums = Array(7).fill(0); const counts = Array(7).fill(0);
        hist.forEach(d => {
          if (d.hab_disponibles > 0) {
            const dow = new Date(d.fecha + 'T00:00:00').getDay();
            sums[dow] += d.hab_ocupadas / d.hab_disponibles; counts[dow]++;
          }
        });
        const avgs = sums.map((s, i) => counts[i] > 0 ? s / counts[i] : baseOcc);
        const global = avgs.reduce((a, v) => a + v, 0) / 7;
        if (global > 0) avgs.forEach((v, i) => { dowFactors[i] = v / global; });
      }

      // Factores mes (estacionalidad típica hotelera)
      const monthFactors = [0.62, 0.68, 0.78, 0.88, 0.92, 1.08, 1.20, 1.25, 1.05, 0.92, 0.75, 0.82];
      if (hist.length > 30) {
        const sums = Array(12).fill(0); const counts = Array(12).fill(0);
        hist.forEach(d => {
          if (d.hab_disponibles > 0) {
            const m = parseInt(d.fecha.slice(5, 7)) - 1;
            sums[m] += d.hab_ocupadas / d.hab_disponibles; counts[m]++;
          }
        });
        const validAvgs = sums.map((s, i) => counts[i] > 2 ? s / counts[i] : null);
        const validVals = validAvgs.filter(v => v !== null);
        const global = validVals.length ? validVals.reduce((a, v) => a + v, 0) / validVals.length : baseOcc;
        if (global > 0) validAvgs.forEach((v, i) => { if (v !== null) monthFactors[i] = v / global; });
      }

      // 4. Generar filas de producción
      const prodRows = missingDates.map(fecha => {
        const d = new Date(fecha + 'T00:00:00');
        const rawOcc = baseOcc * dowFactors[d.getDay()] * monthFactors[d.getMonth()];
        const occ = Math.min(1, Math.max(0.15, rawOcc + (Math.random() - 0.5) * 0.08));
        const hab_ocupadas = Math.round(habDis * occ);
        const adr = Math.round(baseADR * (0.92 + Math.random() * 0.16) * 100) / 100;
        const revenue_hab = Math.round(hab_ocupadas * adr * 100) / 100;
        const revenue_fnb = Math.round(revenue_hab * fnbRatio * (0.7 + Math.random() * 0.6) * 100) / 100;
        const revenue_total = Math.round((revenue_hab + revenue_fnb) * 100) / 100;
        return {
          hotel_id: session.user.id, fecha,
          hab_ocupadas, hab_disponibles: habDis,
          revenue_hab, revenue_fnb, revenue_total,
          adr,
          revpar: Math.round(revenue_hab / habDis * 100) / 100,
          trevpar: Math.round(revenue_total / habDis * 100) / 100,
        };
      });

      // 5. Insertar producción en lotes
      const BATCH = 200;
      for (let i = 0; i < prodRows.length; i += BATCH) {
        const { error } = await supabase.from("produccion_diaria").insert(prodRows.slice(i, i + BATCH));
        if (error) throw new Error(error.message);
      }

      // 6. Pickup para los días faltantes (solo los que no tienen ya entradas)
      const { data: existingPickup } = await supabase.from("pickup_entries")
        .select("fecha_pickup").eq("hotel_id", session.user.id);
      const pickupDates = new Set((existingPickup || []).map(r => r.fecha_pickup ? String(r.fecha_pickup).slice(0, 10) : null));

      const CANALES = [
        "Booking.com","Booking.com","Booking.com","Booking.com","Booking.com","Booking.com",
        "Directo","Directo","Directo","Directo",
        "Web propia","Web propia","Web propia",
        "Expedia","Expedia",
        "Hotels.com",
        "Airbnb","Airbnb",
        "Empresa","Empresa",
        "Tour operador",
        "Agencia de viajes",
        "Grupos",
        "Eventos / MICE",
        "Hotelbeds",
        "GDS",
        "Agoda",
        "Trip.com",
      ];
      const pickupRows = [];
      missingDates.forEach(fecha => {
        if (pickupDates.has(fecha)) return;
        const d = new Date(fecha + 'T00:00:00');
        const dow = d.getDay();
        // Más reservas jueves/viernes; menos lunes/martes
        const n = dow === 4 || dow === 5 ? Math.floor(Math.random() * 3) + 1
          : dow === 0 || dow === 1     ? Math.floor(Math.random() * 2)
          :                              Math.floor(Math.random() * 2) + 1;
        for (let e = 0; e < n; e++) {
          const antelacion = Math.floor(Math.random() * 85) + 5;
          const llegada = new Date(d); llegada.setDate(d.getDate() + antelacion);
          const noches = Math.floor(Math.random() * 4) + 1;
          const salida = new Date(llegada); salida.setDate(llegada.getDate() + noches);
          const precio = Math.round(baseADR * noches * (0.88 + Math.random() * 0.24) * 100) / 100;
          pickupRows.push({
            hotel_id: session.user.id,
            fecha_pickup: fecha,
            fecha_llegada: isoDate(llegada),
            fecha_salida: isoDate(salida),
            canal: CANALES[Math.floor(Math.random() * CANALES.length)],
            num_reservas: 1, noches,
            precio_total: precio > 0 ? precio : null,
            estado: "confirmada",
          });
        }
      });

      for (let i = 0; i < pickupRows.length; i += BATCH) {
        await supabase.from("pickup_entries").insert(pickupRows.slice(i, i + BATCH));
      }

      setProdRecientes(prev => [...prodRows.slice(-8), ...prev].slice(0, 8));
      if (onImportado) onImportado();
      setResultadoRelleno(missingDates.length);
      setOkProdMock(true);
      setTimeout(() => { setOkProdMock(false); setResultadoRelleno(null); }, 6000);
    } catch(e) { setErrorProd("Error: " + e.message); }
    setGenerandoProdMock(false);
  };

  // ── Enviar informe diario por email (fire & forget) ──
  const enviarInformeDiario = async (diaRow) => {
    if (!diaRow || !session?.user?.email) return;
    try {
      const mesActual  = parseInt(diaRow.fecha.split('-')[1]);
      const anioActual = parseInt(diaRow.fecha.split('-')[0]);
      const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
      const mesStr    = String(mesActual).padStart(2,'0');
      const inicioMes = `${anioActual}-${mesStr}-01`;
      const inicioSig = mesActual === 12 ? `${anioActual+1}-01-01` : `${anioActual}-${String(mesActual+1).padStart(2,'0')}-01`;
      const inicioMesLY = `${anioActual-1}-${mesStr}-01`;
      const inicioSigLY = mesActual === 12 ? `${anioActual}-01-01` : `${anioActual-1}-${String(mesActual+1).padStart(2,'0')}-01`;

      const NO_OTA_KEYS = ['directo', 'web', 'empresa', 'grupo', 'mice', 'tour', 'agencia', 'gds', 'evento'];
      const isOTA = (canal) => { const c = (canal || '').toLowerCase(); return !NO_OTA_KEYS.some(k => c.includes(k)); };
      const isGrupo = (canal) => { const c = (canal || '').toLowerCase(); return c.includes('grupo') || c.includes('mice') || c.includes('evento'); };
      const normCanal = (canal) => {
        const c = (canal || '').toLowerCase().trim();
        if (c.includes('directo') || c.includes('teléfono') || c.includes('telefono') || c.includes('email')) return 'Directo';
        if (c.includes('web')) return 'Web';
        if (c.includes('empresa') || c.includes('corporativo')) return 'Empresa';
        if (c.includes('mice') || c.includes('evento')) return 'Eventos / MICE';
        if (c.includes('grupo')) return 'Grupos';
        return canal || 'Directo';
      };

      const hoyDate = new Date(diaRow.fecha + 'T00:00:00'); hoyDate.setDate(hoyDate.getDate() + 1);
      const hoy = hoyDate.toISOString().slice(0, 10);
      const fin7Date = new Date(hoyDate); fin7Date.setDate(fin7Date.getDate() + 7);
      const hoyMas7 = fin7Date.toISOString().slice(0, 10);

      const [{ data: datosMes }, { data: pickupRows }, { data: pptoData }, { data: gruposMes }, { data: gruposProx }] = await Promise.all([
        supabase.from("produccion_diaria")
          .select("fecha,hab_ocupadas,hab_disponibles,revenue_hab,revenue_fnb,revenue_total")
          .eq("hotel_id", session.user.id).gte("fecha", inicioMes).lt("fecha", inicioSig)
          .order("fecha", { ascending: true }),
        supabase.from("pickup_entries")
          .select("canal,num_reservas,precio_total,estado")
          .eq("hotel_id", session.user.id).eq("fecha_pickup", diaRow.fecha),
        supabase.from("presupuesto")
          .select("rev_total_ppto,adr_ppto")
          .eq("hotel_id", session.user.id).eq("mes", mesActual).eq("anio", anioActual)
          .maybeSingle(),
        supabase.from("grupos_eventos")
          .select("habitaciones,adr_grupo,revenue_fnb,revenue_sala,fecha_inicio,fecha_fin,estado")
          .eq("hotel_id", session.user.id).neq("estado", "cancelado")
          .gte("fecha_fin", inicioMes).lt("fecha_inicio", inicioSig),
        supabase.from("grupos_eventos")
          .select("nombre,categoria,estado,fecha_inicio,fecha_fin,habitaciones,adr_grupo,revenue_fnb,revenue_sala")
          .eq("hotel_id", session.user.id).neq("estado", "cancelado")
          .gte("fecha_inicio", hoy).lte("fecha_inicio", hoyMas7)
          .order("fecha_inicio"),
      ]);

      let nuevasAyer = 0, cancelAyer = 0, revPickupAyer = 0;
      for (const p of (pickupRows || [])) {
        const nr = p.num_reservas || 1;
        if (p.estado === 'cancelada') cancelAyer += nr;
        else { nuevasAyer += nr; revPickupAyer += p.precio_total || nr * (diaRow.adr || 0); }
      }

      let acum = 0;
      const revenueAcumulado = (datosMes || []).map(d => {
        acum += d.revenue_hab || 0;
        return { dia: parseInt(d.fecha.split('-')[2]), acum: Math.round(acum) };
      });

      let totHabOcu = 0, totHabDisp = 0, totRevHab = 0, totRevFnb = 0, totRevTotal = 0;
      for (const d of (datosMes || [])) {
        if (d.hab_disponibles > 0) {
          totHabOcu += d.hab_ocupadas || 0;
          totHabDisp += d.hab_disponibles || 0;
          totRevHab += d.revenue_hab || 0;
          totRevFnb += d.revenue_fnb || 0;
          totRevTotal += d.revenue_total || 0;
        }
      }
      const avgOcc    = totHabDisp > 0 ? totHabOcu / totHabDisp * 100 : null;
      const avgAdr    = totHabOcu > 0 ? totRevHab / totHabOcu : null;
      const avgRevpar = totHabDisp > 0 ? totRevHab / totHabDisp : null;
      const avgTrevpar= totHabDisp > 0 ? totRevTotal / totHabDisp : null;

      // Canales de ayer (nuevas reservas del día)
      const canalMap = {};
      let totalCanalRev = 0;
      for (const p of (pickupRows || [])) {
        if ((p.estado || '') === 'cancelada') continue;
        const peso = p.precio_total || (p.num_reservas || 1);
        const key = isOTA(p.canal) ? 'OTAs' : normCanal(p.canal);
        canalMap[key] = (canalMap[key] || 0) + peso;
        totalCanalRev += peso;
      }
      const canalesRevenue = Object.entries(canalMap).filter(([,v])=>v>0).sort((a,b)=>b[1]-a[1])
        .map(([canal,revenue])=>({ canal, revenue, pct: totalCanalRev>0 ? Math.round(revenue/totalCanalRev*100) : 0 }));

      // Grupos activos ayer (en casa) → revenue por habitación/noche
      const gruposAyer = (gruposMes || []).filter(g => g.estado === 'confirmado' && g.fecha_inicio <= diaRow.fecha && g.fecha_fin > diaRow.fecha);
      const revGruposAyer = gruposAyer.reduce((a,g) => a + (g.habitaciones||0) * (g.adr_grupo||0), 0);
      const revIndividualAyer = Math.max(0, (diaRow.revenue_hab||0) - revGruposAyer);

      const occ    = diaRow.hab_disponibles > 0 ? diaRow.hab_ocupadas / diaRow.hab_disponibles * 100 : null;
      const adr    = diaRow.adr    ?? (diaRow.hab_ocupadas > 0 && diaRow.revenue_hab ? diaRow.revenue_hab / diaRow.hab_ocupadas : null);
      const revpar = diaRow.revpar ?? (diaRow.hab_disponibles > 0 && diaRow.revenue_hab ? diaRow.revenue_hab / diaRow.hab_disponibles : null);
      const trevpar= diaRow.trevpar?? (diaRow.hab_disponibles > 0 && diaRow.revenue_total ? diaRow.revenue_total / diaRow.hab_disponibles : null);

      await fetch('/api/daily-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` },
        body: JSON.stringify({
          email: session.user.email,
          hotelNombre: hotelNombreProp || null,
          kpis: {
            fecha: diaRow.fecha,
            mesNombre: MESES[mesActual - 1],
            occ, adr, revpar, trevpar,
            hab_ocupadas: diaRow.hab_ocupadas,
            hab_disponibles: diaRow.hab_disponibles,
            revenue_hab: diaRow.revenue_hab,
            revenue_total: diaRow.revenue_total,
            pickup_neto: nuevasAyer,
            cancelaciones: cancelAyer,
            revenue_pickup_ayer: revPickupAyer,
            revenueAcumulado,
            presupuestoMensual: pptoData?.rev_total_ppto ?? null,
            avg_occ: avgOcc, avg_adr: avgAdr, avg_revpar: avgRevpar, avg_trevpar: avgTrevpar,
            revHabAyer: diaRow.revenue_hab||0, revFnbAyer: diaRow.revenue_fnb||0, canalesRevenue, revGruposAyer, revIndividualAyer,
            adrPpto: pptoData?.adr_ppto ?? null, gruposProximos: gruposProx || [],
          },
        }),
      });
    } catch { /* ignored */ }
  };

  // ── Enviar informe mensual por email con PDF adjunto (fire & forget) ──
  const enviarInformeMensual = async (anio, mes) => {
    if (!session?.user?.email) return;
    try {
      const MESES_FULL = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
      const mesStr = String(mes).padStart(2, '0');
      const inicioFetch = new Date(anio - 1, mes - 1, 1).toISOString().slice(0, 10);
      const [{ data: produccion }, { data: presupuesto }, { data: ppto }] = await Promise.all([
        supabase.from("produccion_diaria")
          .select("fecha,hab_ocupadas,hab_disponibles,revenue_hab,revenue_fnb,revenue_total")
          .eq("hotel_id", session.user.id)
          .gte("fecha", inicioFetch),
        supabase.from("presupuesto")
          .select("mes,anio,occ_ppto,adr_ppto,revpar_ppto,rev_total_ppto")
          .eq("hotel_id", session.user.id),
        supabase.from("presupuesto")
          .select("rev_total_ppto")
          .eq("hotel_id", session.user.id).eq("anio", anio).eq("mes", mes).maybeSingle(),
      ]);
      const rowsMes = (produccion || []).filter(r => r.fecha.startsWith(`${anio}-${mesStr}`));
      if (!rowsMes.length) return;
      let totalHabOcup = 0, totalHabDis = 0, totalRevHab = 0, totalRevTotal = 0;
      for (const r of rowsMes) {
        totalHabOcup  += r.hab_ocupadas    || 0;
        totalHabDis   += r.hab_disponibles || 0;
        totalRevHab   += r.revenue_hab     || 0;
        totalRevTotal += r.revenue_total   || 0;
      }
      const occ    = totalHabDis > 0 ? totalHabOcup / totalHabDis * 100 : null;
      const adr    = totalHabOcup > 0 ? totalRevHab / totalHabOcup : null;
      const revpar = totalHabDis > 0 ? totalRevHab / totalHabDis : null;
      const datos  = { produccion: produccion || [], presupuesto: presupuesto || [] };
      const pdfBase64 = await generarReportePDF(datos, mes - 1, anio, hotelNombreProp || 'Mi Hotel', true);
      await fetch('/api/monthly-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` },
        body: JSON.stringify({
          email: session.user.email,
          hotelNombre: hotelNombreProp || null,
          kpis: {
            mes, anio,
            mesNombre: MESES_FULL[mes - 1],
            occ, adr, revpar,
            revenue_total: Math.round(totalRevTotal),
            presupuesto: ppto?.rev_total_ppto ?? null,
          },
          pdfBase64,
          pdfNombre: `Informe_${MESES_FULL[mes - 1]}_${anio}.pdf`,
        }),
      });
    } catch { /* ignored */ }
  };

  // ── Buscar y editar día histórico ──
  const buscarDia = async () => {
    if (!fechaBusqueda) return;
    setBuscando(true); setErrorEdit(""); setOkEdit(false); setDiaEncontrado(null);
    const { data } = await supabase.from("produccion_diaria").select("*")
      .eq("hotel_id", session.user.id).eq("fecha", fechaBusqueda).maybeSingle();
    if (!data) { setErrorEdit(`No hay datos para ${fechaBusqueda}`); }
    else {
      setDiaEncontrado(data);
      setEditValues({
        hab_ocupadas: data.hab_ocupadas ?? "", hab_disponibles: data.hab_disponibles ?? "",
        revenue_hab: data.revenue_hab ?? "", revenue_total: data.revenue_total ?? "",
        revenue_fnb: data.revenue_fnb ?? "",
      });
    }
    setBuscando(false);
  };

  const guardarDia = async () => {
    setGuardandoEdit(true); setErrorEdit(""); setOkEdit(false);
    const hab_ocupadas    = parseFloat(editValues.hab_ocupadas)    || null;
    const hab_disponibles = parseFloat(editValues.hab_disponibles) || null;
    const _rh_e = parseFloat(editValues.revenue_hab) || null;
    const _rf_e = parseFloat(editValues.revenue_fnb) || null;
    const revenue_hab   = _rh_e != null ? Math.round(_rh_e * NET_HAB_FNB * 100) / 100 : null;
    const revenue_fnb   = _rf_e != null ? Math.round(_rf_e * NET_HAB_FNB * 100) / 100 : null;
    const revenue_total = revenue_hab != null || revenue_fnb != null ? Math.round(((revenue_hab||0)+(revenue_fnb||0)) * 100) / 100 : null;
    const adr    = hab_ocupadas > 0 && revenue_hab ? Math.round(revenue_hab / hab_ocupadas * 100) / 100 : null;
    const revpar = hab_disponibles > 0 && revenue_hab ? Math.round(revenue_hab / hab_disponibles * 100) / 100 : null;
    const trevpar = hab_disponibles > 0 ? Math.round(((revenue_hab||0)+(revenue_fnb||0)) / hab_disponibles * 100) / 100 : null;
    const { error } = await supabase.from("produccion_diaria")
      .update({ hab_ocupadas, hab_disponibles, revenue_hab, revenue_total, revenue_fnb, adr, revpar, trevpar })
      .eq("hotel_id", session.user.id).eq("fecha", fechaBusqueda);
    if (error) { setErrorEdit("Error: " + error.message); }
    else {
      setOkEdit(true);
      if (onProduccionDirecta) onProduccionDirecta({ hotel_id: session.user.id, fecha: fechaBusqueda, hab_ocupadas, hab_disponibles, revenue_hab, revenue_fnb, revenue_total, adr, revpar, trevpar });
      if (onImportado) onImportado();
      const d = new Date(fechaBusqueda + 'T00:00:00');
      const nextDay = new Date(d); nextDay.setDate(d.getDate() + 1);
      if (nextDay.getMonth() !== d.getMonth()) enviarInformeMensual(d.getFullYear(), d.getMonth() + 1);
    }
    setGuardandoEdit(false);
  };

  // ── Guardar pickup diario manual ──
  const guardarPickup = async () => {
    setGuardandoPickup(true); setErrorPickup(""); setOkPickup(false);
    try {
      if (!pickupForm.fecha_llegada) throw new Error("La fecha de llegada es obligatoria");
      const { data: maxRow } = await supabase.from("pickup_entries")
        .select("numero_reserva").eq("hotel_id", session.user.id)
        .not("numero_reserva", "is", null).order("numero_reserva", { ascending: false }).limit(1);
      const nextNumero = ((maxRow?.[0]?.numero_reserva) || 0) + 1;
      const row = {
        hotel_id:      session.user.id,
        fecha_pickup:  pickupForm.fecha_pickup,
        fecha_llegada: pickupForm.fecha_llegada,
        canal:         (pickupForm.canal === "otro" ? canalPersonalizado : pickupForm.canal) || null,
        num_reservas:  parseInt(pickupForm.num_reservas) || 1,
        fecha_salida:  pickupForm.fecha_salida || null,
        noches:        pickupForm.noches ? parseInt(pickupForm.noches) : null,
        precio_total:  (() => {
          if (preciosDiferentes && preciosPorNoche.length > 0) {
            const suma = preciosPorNoche.reduce((a, v) => a + (parseFloat(v) || 0), 0);
            return suma > 0 ? Math.round(suma * NET_HAB_FNB * 100) / 100 : null;
          }
          return pickupForm.precio_total ? Math.round(parseFloat(pickupForm.precio_total) * NET_HAB_FNB * 100) / 100 : null;
        })(),
        precios_por_noche: preciosDiferentes && preciosPorNoche.length > 0
          ? preciosPorNoche.map(v => Math.round((parseFloat(v) || 0) * NET_HAB_FNB * 100) / 100)
          : null,
        estado:        pickupForm.estado || "confirmada",
        numero_reserva: nextNumero,
      };
      const { error } = await supabase.from("pickup_entries").insert(row);
      if (error) throw new Error(error.message);
      setPickupRecientes(prev => [row, ...prev].slice(0, 8));
      setPickupForm(f => ({...f, fecha_llegada:"", canal:"", num_reservas:"1", fecha_salida:"", noches:"", precio_total:""}));
      setPreciosDiferentes(false);
      setPreciosPorNoche([]);
      setCanalPersonalizado("");
      setOkPickup(true);
      setTimeout(() => setOkPickup(false), 3000);
      if (onImportado) onImportado();
    } catch(e) { setErrorPickup(e.message); }
    setGuardandoPickup(false);
  };

  // ── Generar pickup mock de hoy basado en histórico ──
  const [generandoMock, setGenerandoMock] = useState(false);
  const [okMock, setOkMock] = useState(false);
  const generarPickupMock = async () => {
    if (!session?.user?.id) { setErrorPickup("Sesión no disponible, recarga la página."); return; }
    setGenerandoMock(true);
    try {
      const hoy = new Date();
      const ayerStr = `${hoy.getFullYear()}-${String(hoy.getMonth()+1).padStart(2,"0")}-${String(hoy.getDate()).padStart(2,"0")}`;

      // Limpiar entradas de hoy y todas las entradas de Grupos/Eventos de cualquier fecha
      await Promise.all([
        supabase.from("pickup_entries")
          .delete()
          .eq("hotel_id", session.user.id)
          .eq("fecha_pickup", ayerStr),
        supabase.from("pickup_entries").delete().eq("hotel_id", session.user.id).ilike("canal", "%grupo%"),
        supabase.from("pickup_entries").delete().eq("hotel_id", session.user.id).ilike("canal", "%evento%"),
        supabase.from("pickup_entries").delete().eq("hotel_id", session.user.id).ilike("canal", "%mice%"),
      ]);

      // Leer todos los pickup para calcular patrones (excluir grupos/eventos)
      const { data: todos } = await supabase.from("pickup_entries")
        .select("canal,num_reservas,noches,precio_total,estado,fecha_llegada,numero_reserva")
        .eq("hotel_id", session.user.id)
        .neq("estado", "cancelada");

      const { data: todosParaMax } = await supabase.from("pickup_entries")
        .select("numero_reserva")
        .eq("hotel_id", session.user.id)
        .not("numero_reserva", "is", null);
      const maxNumRes = (todosParaMax || []).reduce((max, r) => r.numero_reserva > max ? r.numero_reserva : max, 0);

      // Asignar número a todas las entradas que no tienen, ordenadas por fecha_pickup + id
      const { data: sinNumero } = await supabase.from("pickup_entries")
        .select("id")
        .eq("hotel_id", session.user.id)
        .is("numero_reserva", null)
        .order("fecha_pickup", { ascending: true })
        .order("id", { ascending: true });
      let maxNumResActual = maxNumRes;
      if (sinNumero && sinNumero.length > 0) {
        let siguiente = maxNumRes + 1;
        const LOTE = 20;
        for (let i = 0; i < sinNumero.length; i += LOTE) {
          await Promise.all(sinNumero.slice(i, i + LOTE).map(r =>
            supabase.from("pickup_entries").update({ numero_reserva: siguiente++ }).eq("id", r.id)
          ));
        }
        maxNumResActual = siguiente - 1;
      }

      // Calcular patrones solo con reservas individuales (excluir grupos/eventos)
      const CANALES_EXCLUIDOS = ["grupos/eventos", "grupo", "evento", "groups/events"];
      const individuales = (todos || []).filter(r => {
        const c = (r.canal || "").toLowerCase();
        return !CANALES_EXCLUIDOS.some(x => c.includes(x));
      });

      let patronCanales, mediaNoches, mediaADR;
      if (individuales.length > 20) {
        const canalCount = {};
        individuales.forEach(r => { const c = r.canal || "Directo / Web"; canalCount[c] = (canalCount[c]||0) + (r.num_reservas||1); });
        const totalRes = Object.values(canalCount).reduce((a,b)=>a+b,0);
        patronCanales = Object.entries(canalCount)
          .sort((a,b)=>b[1]-a[1]).slice(0,5)
          .map(([canal, cnt]) => ({ canal, peso: cnt/totalRes }));
        const conNoches = individuales.filter(r => r.noches > 0);
        mediaNoches = conNoches.length ? conNoches.reduce((a,r)=>a+r.noches,0)/conNoches.length : 2;
        const conPrecio = individuales.filter(r => r.precio_total > 0 && r.noches > 0);
        mediaADR = conPrecio.length
          ? conPrecio.reduce((a,r)=>a+(r.precio_total/r.noches),0)/conPrecio.length
          : 120;
      } else {
        // Defaults hotel estándar
        patronCanales = [
          { canal:"Booking.com",       peso:0.32 },
          { canal:"Directo",           peso:0.20 },
          { canal:"Web propia",         peso:0.10 },
          { canal:"Expedia",           peso:0.08 },
          { canal:"Hotels.com",        peso:0.05 },
          { canal:"Airbnb",            peso:0.05 },
          { canal:"Empresa",           peso:0.08 },
          { canal:"Tour operador",     peso:0.04 },
          { canal:"Agencia de viajes", peso:0.03 },
          { canal:"Hotelbeds",         peso:0.02 },
          { canal:"GDS",               peso:0.02 },
          { canal:"Agoda",             peso:0.01 },
        ];
        mediaNoches = 2;
        mediaADR = 120;
      }

      // Pool con pesos: Booking, Directo y Empresa aparecen más veces → más probabilidad de salir
      const plantillaConf = [
        { canal:"Booking.com",      mesesDesde:1, mesesHasta:4,  nochesDef:2, factorADR:0.97 },
        { canal:"Booking.com",      mesesDesde:2, mesesHasta:5,  nochesDef:1, factorADR:0.96 },
        { canal:"Booking.com",      mesesDesde:3, mesesHasta:7,  nochesDef:3, factorADR:0.98 },
        { canal:"Directo",          mesesDesde:1, mesesHasta:4,  nochesDef:2, factorADR:1.06 },
        { canal:"Directo",          mesesDesde:2, mesesHasta:6,  nochesDef:3, factorADR:1.04 },
        { canal:"Empresa",          mesesDesde:1, mesesHasta:2,  nochesDef:1, factorADR:1.12 },
        { canal:"Empresa",          mesesDesde:1, mesesHasta:3,  nochesDef:2, factorADR:1.08 },
        { canal:"Expedia",          mesesDesde:3, mesesHasta:7,  nochesDef:2, factorADR:0.95 },
        { canal:"Expedia",          mesesDesde:4, mesesHasta:8,  nochesDef:2, factorADR:0.94 },
        { canal:"Web propia",       mesesDesde:1, mesesHasta:5,  nochesDef:2, factorADR:1.02 },
        { canal:"Hotels.com",       mesesDesde:2, mesesHasta:6,  nochesDef:2, factorADR:0.96 },
        { canal:"Airbnb",           mesesDesde:3, mesesHasta:7,  nochesDef:3, factorADR:0.94 },
        { canal:"Tour operador",    mesesDesde:3, mesesHasta:9,  nochesDef:4, factorADR:0.90 },
        { canal:"Agencia de viajes",mesesDesde:2, mesesHasta:8,  nochesDef:3, factorADR:0.92 },
        { canal:"GDS",              mesesDesde:1, mesesHasta:4,  nochesDef:2, factorADR:1.00 },
      ];
      const plantillaCancel = [
        { canal:"Booking.com",      mesesDesde:2, mesesHasta:5, nochesDef:2, factorADR:0.97 },
        { canal:"Booking.com",      mesesDesde:3, mesesHasta:6, nochesDef:1, factorADR:0.96 },
        { canal:"Expedia",          mesesDesde:2, mesesHasta:6, nochesDef:2, factorADR:0.95 },
        { canal:"Web propia",       mesesDesde:3, mesesHasta:7, nochesDef:2, factorADR:1.02 },
        { canal:"Airbnb",           mesesDesde:3, mesesHasta:8, nochesDef:2, factorADR:0.93 },
      ];
      // 6-8 confirmadas + 1 cancelada = 7-9 reservas en total, siempre distintas
      const numConf   = 6 + Math.floor(Math.random() * 3); // 6, 7 u 8
      const numCancel = 1;
      const shuffled = (arr) => [...arr].sort(() => Math.random() - 0.5);
      const selConf   = shuffled(plantillaConf).slice(0, numConf);
      const selCancel = shuffled(plantillaCancel).slice(0, numCancel);

      const mkFila = ({ canal, mesesDesde, mesesHasta, nochesDef, factorADR }, estado) => {
        const diasOffset = Math.round((mesesDesde * 30) + Math.random() * ((mesesHasta - mesesDesde) * 30));
        const llegada = new Date(hoy); llegada.setDate(llegada.getDate() + diasOffset);
        const noches = Math.max(1, Math.round(nochesDef + (Math.random() - 0.5)));
        const adr = Math.round(mediaADR * factorADR * (0.93 + Math.random() * 0.14));
        const salida = new Date(llegada); salida.setDate(salida.getDate() + noches);
        return {
          hotel_id:      session.user.id,
          fecha_pickup:  ayerStr,
          fecha_llegada: llegada.toISOString().slice(0,10),
          fecha_salida:  salida.toISOString().slice(0,10),
          canal,
          num_reservas:  1,
          noches,
          precio_total:  Math.round(adr * noches * 100) / 100,
          estado,
        };
      };

      const filasBase = [
        ...selConf.map(p => mkFila(p, "confirmada")),
        ...selCancel.map(p => mkFila(p, "cancelada")),
      ];
      const filas = filasBase.map((f, i) => ({ ...f, numero_reserva: maxNumResActual + i + 1 }));

      const { error } = await supabase.from("pickup_entries").insert(filas);
      if (error) throw new Error(error.message);
      setOkMock(true);
      setGenerandoMock(false);
      setTimeout(() => {
        setOkMock(false);
        if (onImportado) onImportado();
      }, 2000);
      return;
    } catch(e) { setErrorPickup("Error generando datos: " + (e.message || String(e))); }
    setGenerandoMock(false);
  };

  // ── Paleta clara (igual que el resto de la web) ──
  const H = {
    bg:      "#FFFFFF",
    card:    "#FFFFFF",
    card2:   "#FFFFFF",
    border:  "#E0E5EC",
    accent:  "#C8933A",
    accentD: "#A07228",
    blue:    "#004B87",
    text:    "#1A1A1A",
    textMid: "#666E7A",
    green:   "#009F4D",
    red:     "#D32F2F",
  };

  const UploadZone = ({ id, loading, resultado, error, progreso, progresoPct, onFile, okContent }) => (
    <div>
      {resultado ? (
        <div style={{ background:"rgba(46,204,113,0.12)", border:"1px solid rgba(46,204,113,0.3)", borderRadius:10, padding:"14px 18px" }}>{okContent}</div>
      ) : (
        <>
          <div onClick={() => !loading && document.getElementById(id).click()}
            style={{ border:`2px dashed ${H.border}`, borderRadius:10, padding:"32px 16px", textAlign:"center", cursor:loading?"default":"pointer", background:H.card, transition:"border-color 0.2s" }}>
            <div style={{ marginBottom:10, display:"flex", justifyContent:"center" }}>
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke={H.border} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="17 8 12 3 7 8"/>
                <line x1="12" y1="3" x2="12" y2="15"/>
              </svg>
            </div>
            <p style={{ fontWeight:600, color:H.text, fontSize:13, marginBottom:4 }}>{progreso || (loading ? t("procesando") : t("haz_clic"))}</p>
            <p style={{ fontSize:11, color:H.textMid }}>Soporta .xlsx — plantilla FastRev Pro</p>
            {loading && (
              <div style={{ marginTop:12 }}>
                <div style={{ background:H.border, borderRadius:999, height:5, overflow:"hidden" }}>
                  <div style={{ height:"100%", borderRadius:999, background:`linear-gradient(90deg,${H.accentD},${H.accent})`, width:`${progresoPct}%`, transition:"width 0.4s ease" }}/>
                </div>
                <p style={{ fontSize:10, color:H.textMid, marginTop:4 }}>{progresoPct}%</p>
              </div>
            )}
            <input id={id} type="file" accept=".xlsx" style={{ display:"none" }} onChange={e => e.target.files[0] && onFile(e.target.files[0])}/>
          </div>
          {error && <div style={{ background:"rgba(231,76,60,0.12)", border:"1px solid rgba(231,76,60,0.3)", color:"#F1948A", padding:"8px 12px", borderRadius:8, fontSize:12, marginTop:8 }}>{error}</div>}
        </>
      )}
    </div>
  );

  const inputStyle = { width:"100%", padding:"7px 10px", border:`1px solid ${H.border}`, borderRadius:6, fontSize:12, fontFamily:"'Plus Jakarta Sans',sans-serif", background:H.card2, color:H.text, boxSizing:"border-box", outline:"none" };
  const labelStyle = { fontSize:10, color:"#0A0A0A", marginBottom:4, textTransform:"uppercase", letterSpacing:"0.8px", display:"block", fontWeight:600 };

  const TabIcons = {
    presupuesto: (color) => (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="3" width="20" height="14" rx="2"/>
        <path d="M8 21h8M12 17v4"/>
        <path d="M7 10h2M11 10h6M7 13h4"/>
      </svg>
    ),
    historico: (color) => (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
        <path d="M3 3v5h5"/>
        <path d="M12 7v5l4 2"/>
      </svg>
    ),
    produccion: (color) => (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 3v18h18"/>
        <path d="m7 16 4-4 4 4 4-4"/>
      </svg>
    ),
    pickup: (color) => (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>
      </svg>
    ),
  };

  const tabs = [
    { id:"presupuesto", label:"Presupuesto",      done: !!resultadoPpto },
    { id:"historico",   label:"Histórico",         done: !!resultadoMain },
    { id:"produccion",  label:"Producción Diaria", done: prodRecientes.length > 0 },
  ];

  const inner = (
    <div style={{ background:H.bg, borderRadius: fullPage ? 0 : 14, width: fullPage ? "100%" : 620, maxWidth: fullPage ? "100%" : "95vw", boxShadow: fullPage ? "none" : "0 20px 60px rgba(0,0,0,0.15)", fontFamily:"'Plus Jakarta Sans',sans-serif", overflow:"hidden", border: fullPage ? "none" : `1px solid ${H.border}` }}>

      {/* Header */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"22px 26px 18px", borderBottom: fullPage ? `1px solid ${H.border}` : "none" }}>
        <h2 style={{ fontFamily:"'Plus Jakarta Sans',sans-serif", fontSize:28, fontWeight:700, color:"#0A0A0A", letterSpacing:0.2 }}>
          Gestión de datos
        </h2>
        <button onClick={onClose} style={{ background:"none", border:`1px solid ${H.border}`, borderRadius:7, padding:"6px 14px", cursor:"pointer", fontSize:12, fontWeight:600, color:H.textMid, fontFamily:"'Plus Jakarta Sans',sans-serif", display:"flex", alignItems:"center", gap:6 }}>
          ← Volver al dashboard
        </button>
      </div>

        {/* Tab cards */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:8, padding:"0 26px 20px" }}>
          {tabs.map(tab => {
            const active = activeBlock === tab.id;
            return (
              <button key={tab.id} onClick={() => setActiveBlockPersist(tab.id)}
                style={{ background: active ? "#e8e8e8" : H.card, border:`1.5px solid ${active ? "#111111" : H.border}`, borderRadius:10, padding:"14px 8px 10px", cursor:"pointer", fontFamily:"'Plus Jakarta Sans',sans-serif", display:"flex", flexDirection:"column", alignItems:"center", gap:7, transition:"all 0.15s", boxShadow: active ? "0 2px 8px rgba(0,0,0,0.12)" : "none", transform: active ? "translateY(-1px)" : "translateY(0)" }}
                onMouseEnter={e => { if (!active) { e.currentTarget.style.background="#f5f5f5"; e.currentTarget.style.border="1.5px solid #111111"; e.currentTarget.style.transform="translateY(-2px)"; e.currentTarget.style.boxShadow="0 4px 12px rgba(0,0,0,0.1)"; }}}
                onMouseLeave={e => { if (!active) { e.currentTarget.style.background=H.card; e.currentTarget.style.border=`1.5px solid ${H.border}`; e.currentTarget.style.transform="translateY(0)"; e.currentTarget.style.boxShadow="none"; }}}>
                {TabIcons[tab.id](active ? "#111111" : H.textMid)}
                <span style={{ fontSize:10, fontWeight: active ? 700 : 500, color: active ? "#111111" : H.textMid, textAlign:"center", lineHeight:1.2 }}>{tab.label}</span>
                {tab.done && <span style={{ width:6, height:6, borderRadius:"50%", background: H.green, display:"block" }} />}
              </button>
            );
          })}
        </div>

        {/* Tab content */}
        <div style={{ background:H.card2, borderTop:`1px solid ${H.border}`, padding:"22px 26px 26px" }}>

          {/* ── PRESUPUESTO ── */}
          {activeBlock === "presupuesto" && (
            <div>
              {/* Selector de año */}
              <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:16 }}>
                <span style={{ fontSize:10, fontWeight:700, color:H.textMid, textTransform:"uppercase", letterSpacing:"0.8px" }}>Año</span>
                <div style={{ display:"flex", gap:4 }}>
                  {[new Date().getFullYear()-1, new Date().getFullYear(), new Date().getFullYear()+1].map(a => (
                    <button key={a} onClick={() => { setPptoTablaAnio(a); cargarPptoTabla(a); }}
                      style={{ padding:"4px 14px", borderRadius:6, border:`1.5px solid ${a===pptoTablaAnio ? H.blue : H.border}`, background: a===pptoTablaAnio ? "#EEF4FF" : "none", color: a===pptoTablaAnio ? H.blue : H.textMid, fontWeight: a===pptoTablaAnio ? 700 : 400, fontSize:12, cursor:"pointer", fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
                      {a}
                    </button>
                  ))}
                </div>
                {pptoTablaOk && <span style={{ fontSize:11, color:H.green, fontWeight:600 }}>✓ Guardado</span>}
                {importStatusPresupuesto?.fecha && !pptoTablaOk && (
                  <span style={{ fontSize:11, color:H.textMid, marginLeft:"auto" }}>Último guardado: {importStatusPresupuesto.fecha}</span>
                )}
              </div>

              {/* Tabla de 12 meses */}
              {pptoTablaLoadingData ? (
                <p style={{ fontSize:12, color:H.textMid, padding:"20px 0" }}>Cargando…</p>
              ) : (
                <div style={{ overflowX:"auto", borderRadius:10, border:`1px solid ${H.border}` }}>
                  <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12 }}>
                    <thead>
                      <tr style={{ background:"#F5F7FA", borderBottom:`1px solid ${H.border}` }}>
                        <th style={{ textAlign:"left", padding:"8px 12px", fontSize:10, fontWeight:700, color:H.textMid, textTransform:"uppercase", letterSpacing:"0.8px", width:110 }}>Mes</th>
                        <th style={{ textAlign:"right", padding:"8px 10px", fontSize:10, fontWeight:700, color:H.textMid, textTransform:"uppercase", letterSpacing:"0.8px", whiteSpace:"nowrap" }}>OCC %</th>
                        <th style={{ textAlign:"right", padding:"8px 10px", fontSize:10, fontWeight:700, color:H.textMid, textTransform:"uppercase", letterSpacing:"0.8px", whiteSpace:"nowrap" }}>ADR €</th>
                        <th style={{ textAlign:"right", padding:"8px 10px", fontSize:10, fontWeight:700, color:H.textMid, textTransform:"uppercase", letterSpacing:"0.8px", whiteSpace:"nowrap" }}>RevPAR €</th>
                        <th style={{ textAlign:"right", padding:"8px 10px", fontSize:10, fontWeight:700, color:H.textMid, textTransform:"uppercase", letterSpacing:"0.8px", whiteSpace:"nowrap" }}>Revenue Total €</th>
                      </tr>
                    </thead>
                    <tbody>
                      {MESES_FULL.map((mes, i) => (
                        <tr key={i} style={{ borderBottom: i < 11 ? `1px solid ${H.border}` : "none", background: i % 2 === 0 ? H.card : "#FAFBFC" }}>
                          <td style={{ padding:"5px 12px", fontWeight:600, color:H.text, fontSize:12, whiteSpace:"nowrap" }}>{mes}</td>
                          {[
                            { key:"occ_ppto",       placeholder:"72.5",  step:"0.1" },
                            { key:"adr_ppto",       placeholder:"120.00", step:"0.01" },
                            { key:"revpar_ppto",    placeholder:"86.40",  step:"0.01" },
                            { key:"rev_total_ppto", placeholder:"250000", step:"1" },
                          ].map(({ key, placeholder, step }) => (
                            <td key={key} style={{ padding:"3px 6px" }}>
                              <input
                                type="number" min="0" step={step}
                                value={pptoTablaData[i][key]}
                                placeholder={placeholder}
                                onChange={e => {
                                  const v = e.target.value;
                                  setPptoTablaData(prev => prev.map((r, idx) => idx === i ? {...r, [key]: v} : r));
                                }}
                                style={{ width:"100%", minWidth:72, padding:"5px 7px", border:`1px solid ${H.border}`, borderRadius:5, fontSize:12, fontFamily:"'Plus Jakarta Sans',sans-serif", background:"#fff", color:H.text, textAlign:"right", boxSizing:"border-box", outline:"none" }}
                              />
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Guardar */}
              <div style={{ display:"flex", alignItems:"center", gap:10, marginTop:14 }}>
                {pptoTablaError && <span style={{ fontSize:11, color:H.red }}>{pptoTablaError}</span>}
                <button onClick={guardarPptoTabla} disabled={pptoTablaLoading || pptoTablaLoadingData}
                  style={{ marginLeft:"auto", padding:"10px 22px", background:H.blue, color:"#fff", border:"none", borderRadius:8, fontSize:13, fontWeight:700, cursor:(pptoTablaLoading||pptoTablaLoadingData)?"not-allowed":"pointer", fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
                  {pptoTablaLoading ? "Guardando…" : `Guardar presupuesto ${pptoTablaAnio}`}
                </button>
              </div>

              {/* Importar desde Excel (opción secundaria) */}
              <div style={{ marginTop:24, paddingTop:16, borderTop:`1px solid ${H.border}` }}>
                <p style={{ fontSize:11, color:H.textMid, marginBottom:10 }}>O importa desde la hoja <strong>💰 Presupuesto</strong> del Excel FastRevenue:</p>
                <UploadZone
                  id="excel-input-ppto"
                  loading={loadingPpto} resultado={resultadoPpto ? true : null} error={errorPpto}
                  progreso={progresoPpto} progresoPct={progresoPctPpto}
                  onFile={async (file) => { await procesarPresupuesto(file); await cargarPptoTabla(pptoTablaAnio); }}
                  okContent={<p style={{ color:H.green, fontSize:12 }}>✓ {resultadoPpto?.presupuesto} {t("meses_presupuesto")}</p>}
                />
              </div>

              {/* Eliminar datos */}
              {confirmEliminarPresupuesto ? (
                <div style={{ background:"rgba(211,47,47,0.08)", border:"1px solid rgba(211,47,47,0.25)", borderRadius:10, padding:"14px 16px", marginTop:12 }}>
                  <p style={{ fontSize:13, fontWeight:700, color:H.red, marginBottom:4 }}>¿Eliminar los datos de presupuesto?</p>
                  <p style={{ fontSize:11, color:H.textMid, marginBottom:12 }}>Se eliminarán todos los datos de presupuesto. Esta acción no se puede deshacer.</p>
                  <div style={{ display:"flex", gap:8 }}>
                    <button onClick={() => setConfirmEliminarPresupuesto(false)} style={{ padding:"6px 14px", borderRadius:6, border:`1px solid ${H.border}`, background:H.card2, color:H.textMid, fontSize:11, cursor:"pointer", fontFamily:"'Plus Jakarta Sans',sans-serif" }}>Cancelar</button>
                    <button onClick={async () => { await eliminarPresupuesto(); await cargarPptoTabla(pptoTablaAnio); }} disabled={eliminandoPresupuesto} style={{ padding:"6px 14px", borderRadius:6, border:"none", background:H.red, color:"#fff", fontSize:11, fontWeight:700, cursor:eliminandoPresupuesto?"not-allowed":"pointer", fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
                      {eliminandoPresupuesto ? "Eliminando…" : "Sí, eliminar"}
                    </button>
                  </div>
                </div>
              ) : (
                <button onClick={() => setConfirmEliminarPresupuesto(true)}
                  style={{ width:"100%", padding:"7px", borderRadius:7, border:"1px solid rgba(211,47,47,0.2)", background:"none", color:"rgba(211,47,47,0.5)", cursor:"pointer", fontSize:11, fontFamily:"'Plus Jakarta Sans',sans-serif", marginTop:12 }}>
                  Eliminar datos de presupuesto
                </button>
              )}
            </div>
          )}

          {/* ── HISTÓRICO ── */}
          {activeBlock === "historico" && (
            <div>
              {/* Banner datos ya importados */}
              {importStatusHistorico && modoHistorico === "status" && !confirmEliminarHistorico && (
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:10, background:"rgba(0,159,77,0.07)", border:"1px solid rgba(0,159,77,0.25)", borderRadius:10, padding:"12px 16px", marginBottom:16 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={H.green} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                    <div>
                      <p style={{ fontSize:13, fontWeight:700, color:H.green, margin:0 }}>Datos ya importados</p>
                      {importStatusHistorico.fecha && <p style={{ fontSize:11, color:H.textMid, margin:0, marginTop:2 }}>{importStatusHistorico.fecha}</p>}
                    </div>
                  </div>
                  <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                    <button onClick={() => setModoHistorico("edit")}
                      style={{ padding:"6px 12px", borderRadius:6, border:`1px solid ${H.border}`, background:"none", color:H.text, fontSize:11, fontWeight:600, cursor:"pointer", fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
                      Editar datos
                    </button>
                    <button onClick={() => setConfirmEliminarHistorico(true)}
                      style={{ padding:"6px 12px", borderRadius:6, border:`1px solid rgba(211,47,47,0.4)`, background:"none", color:H.red, fontSize:11, fontWeight:600, cursor:"pointer", fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
                      Eliminar datos
                    </button>
                    <button onClick={() => setModoHistorico("upload")}
                      style={{ padding:"6px 12px", borderRadius:6, border:`1px solid ${H.blue}`, background:"none", color:H.blue, fontSize:11, fontWeight:600, cursor:"pointer", fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
                      Importar nuevos datos
                    </button>
                  </div>
                </div>
              )}

              {/* Confirmación eliminar histórico */}
              {confirmEliminarHistorico && (
                <div style={{ background:"rgba(211,47,47,0.08)", border:"1px solid rgba(211,47,47,0.25)", borderRadius:10, padding:"14px 16px", marginBottom:16 }}>
                  <p style={{ fontSize:13, fontWeight:700, color:H.red, marginBottom:4 }}>¿Eliminar los datos de producción e histórico?</p>
                  <p style={{ fontSize:11, color:H.textMid, marginBottom:12 }}>Se eliminarán todos los datos de producción diaria y pickup. Esta acción no se puede deshacer.</p>
                  <div style={{ display:"flex", gap:8 }}>
                    <button onClick={() => setConfirmEliminarHistorico(false)} style={{ padding:"6px 14px", borderRadius:6, border:`1px solid ${H.border}`, background:H.card2, color:H.textMid, fontSize:11, cursor:"pointer", fontFamily:"'Plus Jakarta Sans',sans-serif" }}>Cancelar</button>
                    <button onClick={eliminarHistorico} disabled={eliminandoHistorico} style={{ padding:"6px 14px", borderRadius:6, border:"none", background:H.red, color:"#fff", fontSize:11, fontWeight:700, cursor:eliminandoHistorico?"not-allowed":"pointer", fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
                      {eliminandoHistorico ? "Eliminando…" : "Sí, eliminar"}
                    </button>
                  </div>
                </div>
              )}

              {/* Importar nuevos datos */}
              {(!importStatusHistorico || modoHistorico === "upload") && !confirmEliminarHistorico && (
                <div>
                  {modoHistorico === "upload" && (
                    <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:12 }}>
                      <button onClick={() => setModoHistorico("status")} style={{ padding:"5px 12px", borderRadius:6, border:`1px solid ${H.border}`, background:"none", color:H.textMid, fontSize:11, cursor:"pointer", fontFamily:"'Plus Jakarta Sans',sans-serif" }}>← Volver</button>
                      <span style={{ fontSize:12, fontWeight:600, color:H.text }}>Importar nuevos datos históricos</span>
                    </div>
                  )}
                  {importStatusHistorico === null ? (
                    <p style={{ fontSize:12, color:H.textMid }}>Comprobando datos…</p>
                  ) : (
                    <>
                      <p style={{ fontSize:11, fontWeight:700, color:H.text, marginBottom:3 }}>Carga inicial</p>
                      <p style={{ fontSize:12, color:H.textMid, marginBottom:14, lineHeight:1.5 }}>Importa todos los datos históricos de producción diaria y reservas OTB desde el Excel.</p>
                      <UploadZone
                        id="excel-input-main"
                        loading={loadingMain} resultado={resultadoMain ? true : null} error={errorMain}
                        progreso={progresoMain} progresoPct={progresoPctMain}
                        onFile={procesarPrincipal}
                        okContent={<>
                          <p style={{ color:H.green, fontSize:12 }}>✓ {resultadoMain?.produccion} {t("dias_produccion")}</p>
                          {resultadoMain?.pickup > 0 && <p style={{ color:H.green, fontSize:12, marginTop:3 }}>{resultadoMain?.pickup} {t("reservas_pickup")}</p>}
                        </>}
                      />
                    </>
                  )}
                </div>
              )}

              {/* Editar día */}
              {(modoHistorico === "edit" || (!importStatusHistorico && importStatusHistorico !== null)) && !confirmEliminarHistorico && modoHistorico !== "upload" && (
                <div style={{ marginTop: modoHistorico === "edit" ? 0 : 22, paddingTop: modoHistorico === "edit" ? 0 : 18, borderTop: modoHistorico === "edit" ? "none" : `1px solid ${H.border}` }}>
                  {modoHistorico === "edit" && (
                    <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:14 }}>
                      <button onClick={() => setModoHistorico("status")} style={{ padding:"5px 12px", borderRadius:6, border:`1px solid ${H.border}`, background:"none", color:H.textMid, fontSize:11, cursor:"pointer", fontFamily:"'Plus Jakarta Sans',sans-serif" }}>← Volver</button>
                      <span style={{ fontSize:12, fontWeight:600, color:H.text }}>Editar datos importados</span>
                    </div>
                  )}
                  <p style={{ fontSize:11, fontWeight:700, color:H.text, marginBottom:3 }}>Editar día</p>
                  <p style={{ fontSize:12, color:H.textMid, marginBottom:12 }}>Busca una fecha para corregir los datos de ese día.</p>
                  <div style={{ display:"flex", gap:8, marginBottom:10 }}>
                    <input type="date" value={fechaBusqueda}
                      onChange={e => { setFechaBusqueda(e.target.value); setDiaEncontrado(null); setOkEdit(false); setErrorEdit(""); }}
                      style={{ flex:1, padding:"8px 10px", border:`1px solid ${H.border}`, borderRadius:6, fontSize:12, fontFamily:"'Plus Jakarta Sans',sans-serif", background:H.card2, color:H.text, outline:"none" }}
                    />
                    <button onClick={buscarDia} disabled={buscando || !fechaBusqueda}
                      style={{ padding:"8px 18px", background:H.blue, color:"#fff", border:"none", borderRadius:6, fontSize:12, fontWeight:600, cursor:buscando||!fechaBusqueda?"not-allowed":"pointer", fontFamily:"'Plus Jakarta Sans',sans-serif", opacity:!fechaBusqueda?0.4:1 }}>
                      {buscando ? "…" : "Buscar"}
                    </button>
                  </div>
                  {errorEdit && !diaEncontrado && <p style={{ fontSize:11, color:H.red, marginBottom:8 }}>{errorEdit}</p>}
                  {diaEncontrado && (
                    <div style={{ background:H.card2, border:`1px solid ${H.border}`, borderRadius:10, padding:"14px" }}>
                      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"8px 12px", marginBottom:12 }}>
                        {[
                          { label:"Hab. Ocupadas",       key:"hab_ocupadas" },
                          { label:"Hab. Disponibles",    key:"hab_disponibles" },
                          { label:"Rev. Habitaciones €", key:"revenue_hab" },
                          { label:"Rev. Total €",        key:"revenue_total" },
                          { label:"Rev. F&B €",          key:"revenue_fnb" },
                        ].map(({ label, key }) => (
                          <div key={key}>
                            <label style={labelStyle}>{label}</label>
                            <input type="number" value={editValues[key]}
                              onChange={e => setEditValues(v => ({...v, [key]: e.target.value}))}
                              style={inputStyle} />
                          </div>
                        ))}
                      </div>
                      {okEdit && <p style={{ fontSize:11, color:H.green, marginBottom:8 }}>✓ Datos guardados</p>}
                      {errorEdit && <p style={{ fontSize:11, color:H.red, marginBottom:8 }}>{errorEdit}</p>}
                      <button onClick={guardarDia} disabled={guardandoEdit}
                        style={{ width:"100%", padding:"9px", background:H.blue, color:"#fff", border:"none", borderRadius:7, fontSize:12, fontWeight:700, cursor:guardandoEdit?"not-allowed":"pointer", fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
                        {guardandoEdit ? "Guardando…" : "Guardar cambios"}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ── PRODUCCIÓN DIARIA ── */}
          {activeBlock === "produccion" && (
            <div>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:16, flexWrap:"wrap", gap:8 }}>
                <p style={{ fontSize:12, color:H.textMid, lineHeight:1.5, margin:0 }}>Introduce la producción del día. Si ya existe registro para esa fecha, se actualizará.</p>
                <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                  {okProdMock && <span style={{ fontSize:11, color:H.green, fontWeight:600 }}>{resultadoRelleno === 0 ? "✓ Sin días faltantes" : `✓ ${resultadoRelleno} día${resultadoRelleno !== 1 ? "s" : ""} completado${resultadoRelleno !== 1 ? "s" : ""}`}</span>}
                  <button onClick={rellenarDiasFaltantes} disabled={generandoProdMock}
                    style={{ padding:"6px 13px", borderRadius:6, border:`1px solid ${H.border}`, background:H.card, color:H.textMid, fontSize:11, fontWeight:600, cursor:generandoProdMock?"not-allowed":"pointer", fontFamily:"'Plus Jakarta Sans',sans-serif", whiteSpace:"nowrap" }}>
                    {generandoProdMock ? "Calculando…" : "⚡ Rellenar días faltantes"}
                  </button>
                </div>
              </div>
              <div style={{ background:H.card2, border:`1px solid ${H.border}`, borderRadius:10, padding:"16px", marginBottom:12 }}>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"10px 14px", marginBottom:14 }}>
                  <div style={{ gridColumn:"1 / -1" }}>
                    <label style={labelStyle}>Fecha</label>
                    <input type="date" value={prodForm.fecha}
                      onChange={e => setProdForm(f=>({...f, fecha:e.target.value}))} style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>Habitaciones Ocupadas</label>
                    <input type="number" min="0" value={prodForm.hab_ocupadas} placeholder="0"
                      onChange={e => setProdForm(f=>({...f, hab_ocupadas:e.target.value}))} style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>Habitaciones Disponibles</label>
                    <input type="number" min="0" value={prodForm.hab_disponibles} placeholder="0"
                      onChange={e => setProdForm(f=>({...f, hab_disponibles:e.target.value}))} style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>Revenue Habitaciones €</label>
                    <input type="number" min="0" step="0.01" value={prodForm.revenue_hab} placeholder="0.00"
                      onChange={e => setProdForm(f=>({...f, revenue_hab:e.target.value}))} style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>Revenue F&B €</label>
                    <input type="number" min="0" step="0.01" value={prodForm.revenue_fnb} placeholder="0.00"
                      onChange={e => setProdForm(f=>({...f, revenue_fnb:e.target.value}))} style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>Revenue Salas €</label>
                    <input type="number" min="0" step="0.01" value={prodForm.revenue_salas} placeholder="0.00"
                      onChange={e => setProdForm(f=>({...f, revenue_salas:e.target.value}))} style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>Revenue Total € <span style={{ fontWeight:400, fontSize:9, color:H.textMid, textTransform:"none", letterSpacing:0 }}>(calculado)</span></label>
                    <div style={{ ...inputStyle, background:"#F5F7FA", color:H.textMid, display:"flex", alignItems:"center" }}>
                      {(() => {
                        const rh = parseFloat(prodForm.revenue_hab) || 0;
                        const rf = parseFloat(prodForm.revenue_fnb) || 0;
                        const rs = parseFloat(prodForm.revenue_salas) || 0;
                        const total = rh + rf + rs;
                        return total > 0 ? `€ ${total.toLocaleString("es-ES", { minimumFractionDigits:2, maximumFractionDigits:2 })}` : "—";
                      })()}
                    </div>
                  </div>
                  {(prodForm.hab_ocupadas || prodForm.revenue_hab) && (() => {
                    const ho = parseFloat(prodForm.hab_ocupadas) || 0;
                    const hd = parseFloat(prodForm.hab_disponibles) || 0;
                    const rh = parseFloat(prodForm.revenue_hab) || 0;
                    const adr    = ho > 0 ? Math.round(rh / ho * 100) / 100 : null;
                    const revpar = hd > 0 ? Math.round(rh / hd * 100) / 100 : null;
                    const occ    = hd > 0 ? Math.round(ho / hd * 1000) / 10 : null;
                    return (
                      <div style={{ gridColumn:"1 / -1", display:"flex", gap:8 }}>
                        {[["OCC", occ!=null?`${occ}%`:"—"], ["ADR", adr!=null?`€${adr}`:"—"], ["RevPAR", revpar!=null?`€${revpar}`:"—"]].map(([k,v]) => (
                          <div key={k} style={{ flex:1, background:H.bg, border:`1px solid ${H.border}`, borderRadius:8, padding:"8px 10px", textAlign:"center" }}>
                            <p style={{ fontSize:9, color:H.textMid, textTransform:"uppercase", letterSpacing:"0.8px", marginBottom:3 }}>{k}</p>
                            <p style={{ fontSize:16, fontWeight:700, color:H.accent, fontFamily:"'Plus Jakarta Sans',sans-serif" }}>{v}</p>
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                </div>
                <p style={{ fontSize:10, color:"#004B87", marginBottom:8, lineHeight:1.5 }}>ⓘ Al guardar se deduce el IVA automáticamente: alojamiento/F&B ÷1,10 · salas ÷1,21</p>
                {errorProd && <p style={{ fontSize:11, color:H.red, marginBottom:8 }}>{errorProd}</p>}
                {okProd && <p style={{ fontSize:11, color:H.green, marginBottom:8 }}>✓ Producción guardada</p>}
                <button onClick={guardarProduccion} disabled={guardandoProd}
                  style={{ width:"100%", padding:"10px", background:H.accent, color:"#fff", border:"none", borderRadius:8, fontSize:13, fontWeight:700, cursor:guardandoProd?"not-allowed":"pointer", fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
                  {guardandoProd ? "Guardando…" : "Guardar producción"}
                </button>
              </div>
              {prodRecientes.length > 0 && (
                <div>
                  <p style={{ fontSize:10, color:H.textMid, marginBottom:6, textTransform:"uppercase", letterSpacing:"0.8px" }}>Guardados esta sesión</p>
                  <div style={{ background:H.card2, border:`1px solid ${H.border}`, borderRadius:8, overflow:"hidden" }}>
                    {prodRecientes.map((r, i) => {
                      const ho = r.hab_ocupadas || 0; const hd = r.hab_disponibles || 0;
                      const occ = hd > 0 ? (ho/hd*100).toFixed(1) : "—";
                      const adr = ho > 0 && r.revenue_hab ? Math.round(r.revenue_hab/ho) : "—";
                      return (
                        <div key={i} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"8px 12px", borderBottom: i < prodRecientes.length-1 ? `1px solid ${H.border}` : "none", fontSize:12 }}>
                          <span style={{ color:H.text, fontWeight:600, minWidth:90 }}>{dmy(r.fecha)}</span>
                          <span style={{ color:H.textMid }}>{ho} hab.</span>
                          <span style={{ color:H.accent, fontWeight:600 }}>{occ !== "—" ? `${occ}%` : "—"}</span>
                          <span style={{ color:H.textMid }}>ADR {adr !== "—" ? `€${adr}` : "—"}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── PICK UP ── */}
          {false && (
            <div>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:16, flexWrap:"wrap", gap:8 }}>
                <p style={{ fontSize:12, color:H.textMid, lineHeight:1.5, margin:0 }}>Añade el pick up diario de reservas en el mismo formato que el Excel.</p>
                <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                  {okMock && <span style={{ fontSize:11, color:H.green, fontWeight:600 }}>✓ Pickup de hoy generado</span>}
                  <button onClick={generarPickupMock} disabled={generandoMock}
                    style={{ padding:"6px 13px", borderRadius:6, border:`1px solid ${H.border}`, background:H.card, color:H.textMid, fontSize:11, fontWeight:600, cursor:generandoMock?"not-allowed":"pointer", fontFamily:"'Plus Jakarta Sans',sans-serif", whiteSpace:"nowrap" }}>
                    {generandoMock ? "Generando…" : "⚡ Generar pickup de hoy"}
                  </button>
                </div>
              </div>
              <div style={{ background:H.card2, border:`1px solid ${H.border}`, borderRadius:10, padding:"16px", marginBottom:12 }}>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"10px 14px", marginBottom:14 }}>
                  <div>
                    <label style={labelStyle}>Fecha Pick Up</label>
                    <input type="date" value={pickupForm.fecha_pickup}
                      onChange={e => setPickupForm(f=>({...f, fecha_pickup:e.target.value}))} style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>Fecha Llegada *</label>
                    <input type="date" value={pickupForm.fecha_llegada}
                      onChange={e => setPickupForm(f=>({...f, fecha_llegada:e.target.value}))} style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>Canal</label>
                    <select value={pickupForm.canal}
                      onChange={e => { setPickupForm(f=>({...f, canal:e.target.value})); if (e.target.value !== "otro") setCanalPersonalizado(""); }}
                      style={{...inputStyle, cursor:"pointer"}}>
                      <option value="">— Selecciona canal —</option>
                      <option value="Directo">Directo</option>
                      <option value="Web propia">Web propia</option>
                      <option value="Booking.com">Booking.com</option>
                      <option value="Expedia">Expedia</option>
                      <option value="Hotels.com">Hotels.com</option>
                      <option value="Airbnb">Airbnb</option>
                      <option value="Hotelbeds">Hotelbeds</option>
                      <option value="Agoda">Agoda</option>
                      <option value="Trip.com">Trip.com</option>
                      <option value="GDS">GDS</option>
                      <option value="Tour operador">Tour operador</option>
                      <option value="Agencia de viajes">Agencia de viajes</option>
                      <option value="Empresa">Empresa</option>
                      <option value="Grupos">Grupos</option>
                      <option value="Eventos / MICE">Eventos / MICE</option>
                      <option value="otro">Otro…</option>
                    </select>
                    {pickupForm.canal === "otro" && (
                      <input type="text" value={canalPersonalizado} placeholder="Nombre del canal"
                        onChange={e => setCanalPersonalizado(e.target.value)}
                        style={{...inputStyle, marginTop:6}} />
                    )}
                  </div>
                  <div>
                    <label style={labelStyle}>Nº Reservas</label>
                    <input type="number" min="1" value={pickupForm.num_reservas}
                      onChange={e => setPickupForm(f=>({...f, num_reservas:e.target.value}))} style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>Noches</label>
                    <input type="number" min="1" value={pickupForm.noches} placeholder="—"
                      onChange={e => {
                        const val = e.target.value;
                        const n = parseInt(val) || 0;
                        // Calcular fecha salida a partir de llegada + noches
                        let nuevaFechaSalida = pickupForm.fecha_salida;
                        if (n > 0 && pickupForm.fecha_llegada) {
                          const d = new Date(pickupForm.fecha_llegada + "T00:00:00");
                          d.setDate(d.getDate() + n);
                          nuevaFechaSalida = d.toISOString().slice(0, 10);
                        }
                        setPickupForm(f => ({...f, noches: val, fecha_salida: nuevaFechaSalida}));
                        if (n > 1) {
                          setPreciosPorNoche(prev => Array.from({length:n}, (_,i) => prev[i] || ""));
                        } else {
                          setPreciosDiferentes(false);
                          setPreciosPorNoche([]);
                        }
                      }} style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>Fecha Salida</label>
                    <input type="date" value={pickupForm.fecha_salida}
                      onChange={e => {
                        const nuevaFechaSalida = e.target.value;
                        // Calcular noches a partir de llegada y salida
                        let nuevasNoches = pickupForm.noches;
                        if (nuevaFechaSalida && pickupForm.fecha_llegada) {
                          const diff = Math.round((new Date(nuevaFechaSalida + "T00:00:00") - new Date(pickupForm.fecha_llegada + "T00:00:00")) / 86400000);
                          if (diff > 0) {
                            nuevasNoches = String(diff);
                            if (diff > 1) setPreciosPorNoche(prev => Array.from({length:diff}, (_,i) => prev[i] || ""));
                            else { setPreciosDiferentes(false); setPreciosPorNoche([]); }
                          }
                        }
                        setPickupForm(f => ({...f, fecha_salida: nuevaFechaSalida, noches: nuevasNoches}));
                      }} style={inputStyle} />
                  </div>
                  {/* Precio total o precios por noche */}
                  {parseInt(pickupForm.noches) > 1 ? (
                    <div style={{ gridColumn:"1 / -1" }}>
                      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:8 }}>
                        <label style={labelStyle}>Precio Total €</label>
                        <label style={{ display:"flex", alignItems:"center", gap:6, cursor:"pointer", fontSize:11, color:H.textMid, fontWeight:500 }}>
                          <input type="checkbox" checked={preciosDiferentes}
                            onChange={e => {
                              setPreciosDiferentes(e.target.checked);
                              if (!e.target.checked) setPreciosPorNoche(Array.from({length: parseInt(pickupForm.noches)||0}, () => ""));
                            }}
                            style={{ cursor:"pointer" }} />
                          Precio diferente por noche
                        </label>
                      </div>
                      {preciosDiferentes ? (
                        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(90px, 1fr))", gap:6 }}>
                          {preciosPorNoche.map((precio, idx) => (
                            <div key={idx}>
                              <label style={{ fontSize:9, color:H.textMid, display:"block", marginBottom:3 }}>Noche {idx+1}</label>
                              <input type="number" min="0" step="0.01" value={precio} placeholder="0.00"
                                onChange={e => setPreciosPorNoche(prev => prev.map((v,i) => i===idx ? e.target.value : v))}
                                style={inputStyle} />
                            </div>
                          ))}
                          {preciosPorNoche.some(v => parseFloat(v) > 0) && (
                            <div style={{ display:"flex", alignItems:"flex-end", paddingBottom:1 }}>
                              <div style={{ ...inputStyle, background:"#F5F7FA", color:H.textMid, fontSize:12, fontWeight:600 }}>
                                Total: €{preciosPorNoche.reduce((a,v) => a+(parseFloat(v)||0), 0).toLocaleString("es-ES", {minimumFractionDigits:2, maximumFractionDigits:2})}
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <input type="number" step="0.01" value={pickupForm.precio_total} placeholder="—"
                          onChange={e => setPickupForm(f=>({...f, precio_total:e.target.value}))} style={inputStyle} />
                      )}
                    </div>
                  ) : (
                    <div>
                      <label style={labelStyle}>Precio Total €</label>
                      <input type="number" step="0.01" value={pickupForm.precio_total} placeholder="—"
                        onChange={e => setPickupForm(f=>({...f, precio_total:e.target.value}))} style={inputStyle} />
                    </div>
                  )}
                  <div>
                    <label style={labelStyle}>Estado</label>
                    <CustomSelect
                      value={pickupForm.estado}
                      onChange={v => setPickupForm(f=>({...f, estado:v}))}
                      options={[{value:"confirmada",label:"Confirmada",color:"#1A7A3C",bg:"#E6F7EE"},{value:"cancelada",label:"Cancelada",color:"#999",bg:"#F5F5F5"}]}
                    />
                  </div>
                </div>
                <p style={{ fontSize:10, color:"#004B87", marginBottom:8, lineHeight:1.5 }}>ⓘ Al guardar se deduce el IVA automáticamente: precio ÷1,10 (IVA 10%)</p>
                {errorPickup && <p style={{ fontSize:11, color:H.red, marginBottom:8 }}>{errorPickup}</p>}
                {okPickup && <p style={{ fontSize:11, color:H.green, marginBottom:8 }}>✓ Reserva añadida</p>}
                <button onClick={guardarPickup} disabled={guardandoPickup}
                  style={{ width:"100%", padding:"10px", background:H.accent, color:"#fff", border:"none", borderRadius:8, fontSize:13, fontWeight:700, cursor:guardandoPickup?"not-allowed":"pointer", fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
                  {guardandoPickup ? "Guardando…" : "Añadir reserva"}
                </button>
              </div>
              {pickupRecientes.length > 0 && (
                <div>
                  <p style={{ fontSize:10, color:H.textMid, marginBottom:6, textTransform:"uppercase", letterSpacing:"0.8px" }}>Añadidas esta sesión</p>
                  <div style={{ background:H.card2, border:`1px solid ${H.border}`, borderRadius:8, overflow:"hidden" }}>
                    {pickupRecientes.map((r, i) => (
                      <div key={i} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"8px 12px", borderBottom: i < pickupRecientes.length-1 ? `1px solid ${H.border}` : "none", fontSize:12 }}>
                        <span style={{ color:H.text, minWidth:80 }}>{dmy(r.fecha_llegada)}</span>
                        <span style={{ color:H.textMid, flex:1, paddingLeft:8 }}>{r.canal || "—"}</span>
                        <span style={{ color:H.textMid, marginRight:10 }}>{r.num_reservas} hab.</span>
                        <span style={{ color: r.estado==="cancelada" ? H.red : H.green, fontSize:11, fontWeight:600 }}>{r.estado}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Ver dashboard */}
          {(resultadoMain || resultadoPpto || prodRecientes.length > 0 || pickupRecientes.length > 0) && (
            <button onClick={onClose} style={{ width:"100%", marginTop:20, marginBottom:10, background:H.accent, color:"#fff", border:"none", borderRadius:10, padding:"12px", fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:"'Plus Jakarta Sans',sans-serif", boxShadow:`0 4px 20px rgba(200,147,58,0.35)` }}>
              {t("ver_dashboard")}
            </button>
          )}

          {/* Limpiar solo Pickup */}
          {confirmLimpiarPickup ? (
            <div style={{ background:"rgba(231,76,60,0.08)", border:"1px solid rgba(231,76,60,0.25)", borderRadius:8, padding:"14px", textAlign:"center", marginTop:8 }}>
              <p style={{ fontWeight:700, color:H.red, marginBottom:4, fontSize:13 }}>¿Limpiar datos de Pickup?</p>
              <p style={{ fontSize:11, color:H.textMid, marginBottom:10 }}>Se eliminarán todas las entradas de pickup. Producción y presupuesto no se tocan. Podrás re-importar el Excel para cargar datos correctos.</p>
              <div style={{ display:"flex", gap:8, justifyContent:"center" }}>
                <button onClick={()=>setConfirmLimpiarPickup(false)} style={{ padding:"6px 16px", borderRadius:7, border:`1px solid ${H.border}`, background:H.card2, color:H.textMid, cursor:"pointer", fontFamily:"'Plus Jakarta Sans',sans-serif", fontSize:11 }}>Cancelar</button>
                <button onClick={limpiarPickup} disabled={limpiandoPickup} style={{ padding:"6px 16px", borderRadius:7, border:"none", background:H.red, color:"#fff", cursor:limpiandoPickup?"not-allowed":"pointer", fontWeight:700, fontFamily:"'Plus Jakarta Sans',sans-serif", fontSize:11 }}>{limpiandoPickup?"Limpiando...":"Sí, limpiar pickup"}</button>
              </div>
            </div>
          ) : (
            <button onClick={()=>setConfirmLimpiarPickup(true)} style={{ width:"100%", padding:"7px", borderRadius:7, border:"1px solid rgba(231,76,60,0.15)", background:"none", color:"rgba(231,76,60,0.5)", cursor:"pointer", fontSize:11, fontFamily:"'Plus Jakarta Sans',sans-serif", marginTop:8 }}>
              Limpiar solo datos de Pickup
            </button>
          )}

          {/* Vaciar datos */}
          {confirmVaciar ? (
            <div style={{ background:"rgba(231,76,60,0.1)", border:"1px solid rgba(231,76,60,0.3)", borderRadius:8, padding:"14px", textAlign:"center", marginTop:8 }}>
              <p style={{ fontWeight:700, color:H.red, marginBottom:4, fontSize:13 }}>{t("vaciar_confirm")}</p>
              <p style={{ fontSize:11, color:H.textMid, marginBottom:10 }}>{t("vaciar_desc")}</p>
              <div style={{ display:"flex", gap:8, justifyContent:"center" }}>
                <button onClick={()=>setConfirmVaciar(false)} style={{ padding:"6px 16px", borderRadius:7, border:`1px solid ${H.border}`, background:H.card2, color:H.textMid, cursor:"pointer", fontFamily:"'Plus Jakarta Sans',sans-serif", fontSize:11 }}>{t("cancelar")}</button>
                <button onClick={vaciarDatos} disabled={vaciando} style={{ padding:"6px 16px", borderRadius:7, border:"none", background:H.red, color:"#fff", cursor:vaciando?"not-allowed":"pointer", fontWeight:700, fontFamily:"'Plus Jakarta Sans',sans-serif", fontSize:11 }}>{vaciando?t("vaciando"):t("si_vaciar")}</button>
              </div>
            </div>
          ) : (
            <button onClick={()=>setConfirmVaciar(true)} style={{ width:"100%", padding:"7px", borderRadius:7, border:"1px solid rgba(231,76,60,0.2)", background:"none", color:"rgba(231,76,60,0.6)", cursor:"pointer", fontSize:11, fontFamily:"'Plus Jakarta Sans',sans-serif", marginTop:8 }}>
              {t("vaciar_datos")}
            </button>
          )}
        </div>
      </div>
  );

  if (fullPage) return inner;
  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.45)", display:"flex", alignItems:"flex-start", justifyContent:"center", zIndex:1000, overflowY:"auto", padding:"32px 0" }}>
      {inner}
    </div>
  );
}

