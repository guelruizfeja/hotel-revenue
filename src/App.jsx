import React, { useState, useEffect, useRef, useMemo, createContext, useContext } from "react";
import { supabase } from "./supabase";
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line, ComposedChart,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  PieChart, Pie, Cell,
} from "recharts";

const LOGO_B64 = "/fastrev-logo.png";
const SALAS_FIJAS = ["Salón Principal", "Sala de Reuniones", "Terraza"];
const C = {
  bg: "#FDFDFD", bgCard: "#FFFFFF", bgDeep: "#0A2540",
  accent: "#004B87", accentLight: "#E8F0F9", accentDark: "#003366",
  text: "#1A1A1A", textMid: "#555555", textLight: "#888888",
  border: "#E0E0E0", green: "#009F4D", greenLight: "#E6F7EE",
  red: "#D32F2F", redLight: "#FDECEA", blue: "#004B87",
};

const LangContext = createContext("es");
const useT = () => { const lang = useContext(LangContext); return (k) => (TRANSLATIONS[lang] || TRANSLATIONS.es)[k] ?? k; };
const TRANSLATIONS = {
  es: {
    // Nav & topbar
    nav_dashboard:"Dashboard", nav_pickup:"Reservas", nav_budget:"Presupuesto", nav_grupos:"Grupos/Eventos", nav_salas:"Salas", nav_gestion:"Gestión de datos",
    importar:"Importar", mi_perfil:"Mi perfil", cerrar_sesion:"Cerrar sesión",
    suscripcion:"Suscripción", extranets:"Extranets", informe_mensual:"Informe mensual",
    conectado_como:"Conectado como", cargando:"Cargando...",
    // Onboarding
    ob_paso:"Paso", ob_de:"de", ob_omitir:"Omitir", ob_siguiente:"Siguiente →", ob_empezar:"¡Empezar!",
    ob0_title:"Importa tus datos", ob0_text:"Descarga la plantilla Excel, rellénala con tus datos de producción y súbela aquí. En segundos tendrás el dashboard activo.",
    ob1_title:"Dashboard", ob1_text:"Visualiza tus KPIs principales: RevPAR, ADR y ocupación comparados con el año anterior.",
    ob2_title:"Pickup", ob2_text:"Analiza el ritmo de nuevas reservas día a día y detecta tendencias de cara al mes.",
    ob3_title:"Presupuesto", ob3_text:"Compara producción real vs objetivo mensual y proyecta el cierre del año.",
    ob4_title:"Grupos/Eventos", ob4_text:"Gestiona grupos y eventos: confirmados, tentativos y pipeline de negocio.",
    // KPIs
    kpi_ocupacion:"Ocupación", kpi_adr:"ADR", kpi_revpar:"RevPAR", kpi_trevpar:"TRevPAR",
    kpi_rev_diario:"Revenue Diario", kpi_rev_mensual:"Revenue Mensual", kpi_rev_hab:"Rev. Hab.", kpi_rev_total:"Rev. Total",
    sin_datos_prev:"Sin datos prev.", vs_mes_ant:"vs mes ant.", vs_anio_ant:"vs año ant.",
    // Empty & loading
    sin_datos:"Sin datos todavía", importa_excel:"Importa tu plantilla Excel para ver los datos aquí",
    cargando_datos:"Cargando datos...", cargando_pickup:"Cargando pickup...",
    // Months
    meses_full:["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"],
    meses_corto:["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"],
    dias_semana:["L","M","X","J","V","S","D"],
    dias_abrev:["Dom","Lun","Mar","Mié","Jue","Vie","Sáb"],
    // Dashboard
    bienvenido:"Bienvenido", ocup_mensual:"Ocupación mensual", adr_ocupacion:"ADR & Ocupación",
    ultimos_12m:"Últimos 12 meses", sin_datos_mes:"Sin datos para este mes",
    adr_ocup_diaria:"ADR & Ocupación diaria", otb:"OTB",
    // Table headers
    th_anio:"Año", th_mes:"Mes", th_ocup:"Ocup.", th_adr:"ADR",
    th_revpar:"RevPAR", th_trevpar:"TRevPAR", th_rev_hab:"Rev. Hab.", th_rev_total:"Rev. Total",
    th_fecha:"Fecha", th_hab_ocup:"Hab. Ocup.", th_rev_day:"Rev. Total",
    th_ocup_media:"Ocupación media", th_adr_medio:"ADR medio", th_revpar_medio:"RevPAR medio",
    th_rev_hab_total:"Rev. Hab. total", detalle_diario:"Detalle diario",
    dias_con_datos:"días con datos", total_mes:"TOTAL MES", volver:"← Volver",
    // Pickup
    reservas_ayer:"Reservas de ayer", reservas_captadas:"reservas captadas",
    no_reservas_ayer:"No hay reservas registradas para ayer",
    por_mes_llegada:"Por mes de llegada", por_canal:"Por canal", por_mes_afectado:"Por mes afectado",
    cancelaciones_ayer:"Cancelaciones de ayer", cancelaciones:"cancelaciones",
    sin_cancelaciones:"Sin cancelaciones ayer", cancel_abrev:"cancel.",
    duracion_media:"Duración media", noches_reserva:"Noches por reserva confirmada",
    noches_media:"noches media", precio_medio_reserva:"Precio medio reserva",
    revenue_medio:"Revenue medio por reserva confirmada", precio_medio:"precio medio",
    dia_pico:"Día pico", res_abrev:"res.",
    fechas_calientes:"Fechas Calientes", sin_futuras:"Sin reservas futuras",
    ventana_reserva:"Ventana de reserva", dias_label:"días",
    este_mes_label:"Este mes", anio_ant_abrev:"Año ant.", variacion_label:"Variación",
    demanda_debil:"↓ Señal de demanda débil", demanda_adelantada:"↑ Demanda adelantada",
    analisis_desplazamiento:"Análisis de Desplazamiento",
    contrib_grupo:"Contrib. grupo", coste_desplaz:"Coste desplaz.", valor_neto:"Valor neto",
    adr_transient_ref:"ADR transient ref.", occ_hist_ly:"Occ. hist. LY",
    adr_minimo_rentable:"ADR mínimo rentable", acepta_grupo:"✓ Aceptar", revisar_grupo:"⚠ Revisar",
    sin_datos_ly:"Sin datos LY — usando ppto.", fuente_ppto:"fuente: ppto.",
    // Budget
    rev_real_ytd:"Revenue Real YTD", forecast_cierre_anio:"Forecast Cierre Año",
    presupuesto_anio:"Presupuesto Año", detalle_mensual:"Detalle mensual",
    th_adr_ppto:"ADR Ppto.", th_adr_real:"ADR Real", th_desv_adr:"Desv. ADR",
    th_revpar_ppto:"RevPAR Ppto.", th_revpar_real:"RevPAR Real", th_desv_revpar:"Desv. RevPAR",
    th_rev_ppto:"Rev. Ppto.", th_rev_real:"Rev. Real", th_desv_rev:"Desv. Rev.",
    th_forecast:"Forecast Cierre", total_ytd:"TOTAL YTD", vs_ppto:"vs ppto",
    confianza:"confianza", real_badge:"✓ Real",
    // Grupos
    nuevo_evento:"+ Nuevo evento", sin_eventos:"Sin grupos/eventos", rev_estimado:"Revenue estimado",
    editar_evento:"Editar evento", nuevo_evento_title:"Nuevo evento",
    nuevo_grupo_title:"Nuevo grupo", editar_grupo:"Editar grupo",
    eliminar_grupo:"¿Eliminar este grupo?", eliminar_evento:"¿Eliminar este evento?",
    form_hora_inicio:"Hora inicio", form_hora_fin:"Hora fin", form_sala_nombre:"Sala / Espacio",
    form_servicio_incluido:"Servicio incluido",
    vista_calendario:"Calendario", vista_lista:"Lista", vista_pipeline:"Pipeline", vista_tabla:"Tabla",
    rev_confirmado:"Revenue confirmado", rev_tentativo:"Revenue tentativo (50%)",
    pipeline_cotizacion:"Pipeline en cotización", cancelados_perdidos:"Cancelados / Perdidos",
    cat_corporativo:"Corporativo", cat_boda:"Boda / Social", cat_feria:"Feria / Congreso",
    cat_deportivo:"Deportivo", cat_otros:"Otros",
    estado_confirmado:"Confirmado", estado_cotizacion:"Cotizado", estado_cancelado:"Cancelado",
    form_nombre:"Nombre del evento *", form_categoria:"Categoría", form_estado:"Estado",
    form_fecha_entrada:"Fecha entrada *", form_fecha_salida:"Fecha salida *", form_fecha_confirmacion:"Fecha confirmación",
    form_habitaciones:"Habitaciones", form_adr:"ADR Grupo", form_fnb:"Revenue F&B",
    form_sala:"Revenue Sala", form_notas:"Notas", form_motivo:"Motivo de pérdida",
    form_guardar:"Guardar", form_cancelar:"Cancelar", form_eliminar:"Eliminar", guardando_btn:"Guardando...",
    noche:"noche", noches:"noches", hab_abrev:"hab.",
    // Importar
    importar_title:"Importar datos", importar_sub:"Sube tu plantilla Excel de FastRev",
    vaciar_datos:"Vaciar todos los datos importados", vaciar_confirm:"¿Vaciar todos los datos?",
    vaciar_desc:"Se eliminarán producción, pickup y presupuesto. Esta acción no se puede deshacer.",
    vaciando:"Vaciando...", si_vaciar:"Sí, vaciar todo",
    haz_clic:"Haz clic para seleccionar el archivo", formato_xlsx:"Formato .xlsx · Plantilla FastRev",
    importando_xlsx:"Al importar se reemplazarán los datos anteriores",
    importado_ok:"¡Datos importados correctamente!", ver_dashboard:"Ver dashboard",
    dias_produccion:"días de producción importados", reservas_pickup:"reservas de pickup importadas",
    meses_presupuesto:"meses de presupuesto importados",
    leyendo:"Leyendo archivo...", procesando:"Procesando hojas...",
    limpiando:"Limpiando datos anteriores...", guardando:"Guardando datos...",
    imp_datos_title:"Datos & Pickup", imp_datos_sub:"Producción diaria + reservas pickup",
    imp_ppto_title:"Presupuesto", imp_ppto_sub:"Sólo hoja 💰 Presupuesto",
    imp_ppto_ok:"Presupuesto actualizado",
    // Suscripción
    empieza_gratis:"Empieza gratis 30 días",
    acceso_completo:"Acceso completo a FastRev durante 30 días sin coste.",
    precio_sub:"Después, solo €49/mes + IVA. Cancela cuando quieras.",
    empezar_prueba:"Empezar prueba gratuita →", redirigiendo:"Redirigiendo...",
    feat_dashboard:"Dashboard con KPIs en tiempo real", feat_pickup:"Análisis de pickup y forecast",
    feat_presupuesto:"Presupuesto vs real mensual", feat_pdf:"Informes PDF mensuales",
    ver_pickup:"→ Ver Pickup", importar_datos:"→ Importar datos", ver_mas:"→ Ver más",
    prox_semana:"Próx. semana", prox_mes:"Próx. mes", anio_actual:"Año actual",
    otb_actual:"OTB Actual", anio_anterior:"Año Anterior",
    pace_title:"Pace — Próximos 6 meses", pace_sub:"OCC en cartera vs Presupuesto y Año Anterior",
    sin_datos_pickup:"Sin datos de pickup",
    budget_empty:"Importa tu plantilla Excel con los datos de la hoja 💰 Presupuesto para ver el análisis aquí",
    rev_total_label:"Revenue Total", ppto_abrev:"Ppto.", real_label:"Real",
    chart_rev:"Revenue Total — Ppto. vs Real vs Forecast",
    chart_adr:"ADR — Ppto. vs Real", chart_revpar:"RevPAR — Ppto. vs Real",
    // General
    generando:"Generando...", cancelar:"Cancelar", guardar:"Guardar", eliminar:"Eliminar",
    si:"Sí", no:"No", todos:"Todos",
  },
  en: {
    nav_dashboard:"Dashboard", nav_pickup:"Reservas", nav_budget:"Budget", nav_grupos:"Grupos/Eventos", nav_salas:"Rooms", nav_gestion:"Data management",
    importar:"Import", mi_perfil:"My profile", cerrar_sesion:"Log out",
    suscripcion:"Subscription", extranets:"Extranets", informe_mensual:"Monthly report",
    conectado_como:"Signed in as", cargando:"Loading...",
    ob_paso:"Step", ob_de:"of", ob_omitir:"Skip", ob_siguiente:"Next →", ob_empezar:"Get started!",
    ob0_title:"Import your data", ob0_text:"Download the Excel template, fill it with your production data and upload it here. Your dashboard will be ready in seconds.",
    ob1_title:"Dashboard", ob1_text:"View your main KPIs: RevPAR, ADR and occupancy compared to the previous year.",
    ob2_title:"Pickup", ob2_text:"Analyze the pace of new reservations day by day and detect trends for the month.",
    ob3_title:"Budget", ob3_text:"Compare real production vs monthly target and project year-end results.",
    ob4_title:"Grupos/Eventos", ob4_text:"Manage groups and events: confirmed, tentative and business pipeline.",
    kpi_ocupacion:"Occupancy", kpi_adr:"ADR", kpi_revpar:"RevPAR", kpi_trevpar:"TRevPAR",
    kpi_rev_diario:"Daily Revenue", kpi_rev_mensual:"Monthly Revenue", kpi_rev_hab:"Room Rev.", kpi_rev_total:"Total Rev.",
    sin_datos_prev:"No prev. data", vs_mes_ant:"vs prev. month", vs_anio_ant:"vs prev. year",
    sin_datos:"No data yet", importa_excel:"Import your Excel template to see your data here",
    cargando_datos:"Loading data...", cargando_pickup:"Loading pickup...",
    meses_full:["January","February","March","April","May","June","July","August","September","October","November","December"],
    meses_corto:["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"],
    dias_semana:["M","T","W","T","F","S","S"],
    dias_abrev:["Sun","Mon","Tue","Wed","Thu","Fri","Sat"],
    bienvenido:"Welcome", ocup_mensual:"Monthly Occupancy", adr_ocupacion:"ADR & Occupancy",
    ultimos_12m:"Last 12 months", sin_datos_mes:"No data for this month",
    adr_ocup_diaria:"Daily ADR & Occupancy", otb:"OTB",
    th_anio:"Year", th_mes:"Month", th_ocup:"Occup.", th_adr:"ADR",
    th_revpar:"RevPAR", th_trevpar:"TRevPAR", th_rev_hab:"Room Rev.", th_rev_total:"Total Rev.",
    th_fecha:"Date", th_hab_ocup:"Occ. Rooms", th_rev_day:"Total Rev.",
    th_ocup_media:"Avg Occupancy", th_adr_medio:"Avg ADR", th_revpar_medio:"Avg RevPAR",
    th_rev_hab_total:"Total Room Rev.", detalle_diario:"Daily detail",
    dias_con_datos:"days with data", total_mes:"MONTH TOTAL", volver:"← Back",
    reservas_ayer:"Yesterday's bookings", reservas_captadas:"bookings captured",
    no_reservas_ayer:"No bookings registered for yesterday",
    por_mes_llegada:"By arrival month", por_canal:"By channel", por_mes_afectado:"By affected month",
    cancelaciones_ayer:"Yesterday's cancellations", cancelaciones:"cancellations",
    sin_cancelaciones:"No cancellations yesterday", cancel_abrev:"cancel.",
    duracion_media:"Average stay", noches_reserva:"Nights per confirmed booking",
    noches_media:"avg nights", precio_medio_reserva:"Average booking price",
    revenue_medio:"Average revenue per confirmed booking", precio_medio:"avg price",
    dia_pico:"Peak day", res_abrev:"bkgs.",
    fechas_calientes:"Hot Dates", sin_futuras:"No future bookings",
    ventana_reserva:"Booking window", dias_label:"days",
    este_mes_label:"This month", anio_ant_abrev:"Prev. year", variacion_label:"Change",
    demanda_debil:"↓ Weaker demand signal", demanda_adelantada:"↑ Stronger demand",
    analisis_desplazamiento:"Displacement Analysis",
    contrib_grupo:"Group contrib.", coste_desplaz:"Displacement cost", valor_neto:"Net value",
    adr_transient_ref:"Transient ADR ref.", occ_hist_ly:"Hist. occ. LY",
    adr_minimo_rentable:"Min. profitable ADR", acepta_grupo:"✓ Accept", revisar_grupo:"⚠ Review",
    sin_datos_ly:"No LY data — using budget", fuente_ppto:"source: budget",
    rev_real_ytd:"Actual Revenue YTD", forecast_cierre_anio:"Year-End Forecast",
    presupuesto_anio:"Annual Budget", detalle_mensual:"Monthly detail",
    th_adr_ppto:"Budget ADR", th_adr_real:"Actual ADR", th_desv_adr:"ADR Dev.",
    th_revpar_ppto:"Budget RevPAR", th_revpar_real:"Actual RevPAR", th_desv_revpar:"RevPAR Dev.",
    th_rev_ppto:"Budget Rev.", th_rev_real:"Actual Rev.", th_desv_rev:"Rev. Dev.",
    th_forecast:"Closing Forecast", total_ytd:"TOTAL YTD", vs_ppto:"vs budget",
    confianza:"confidence", real_badge:"✓ Actual",
    nuevo_evento:"+ New event", sin_eventos:"No groups/events", rev_estimado:"Estimated revenue",
    editar_evento:"Edit event", nuevo_evento_title:"New event",
    nuevo_grupo_title:"New group", editar_grupo:"Edit group",
    eliminar_grupo:"Delete this group?", eliminar_evento:"Delete this event?",
    form_hora_inicio:"Start time", form_hora_fin:"End time", form_sala_nombre:"Room / Space",
    form_servicio_incluido:"Service included",
    vista_calendario:"Calendar", vista_lista:"List", vista_pipeline:"Pipeline", vista_tabla:"Table",
    rev_confirmado:"Confirmed revenue", rev_tentativo:"Tentative revenue (50%)",
    pipeline_cotizacion:"Quotation pipeline", cancelados_perdidos:"Cancelled / Lost",
    cat_corporativo:"Corporate", cat_boda:"Wedding / Social", cat_feria:"Trade Fair / Congress",
    cat_deportivo:"Sports", cat_otros:"Others",
    estado_confirmado:"Confirmed", estado_cotizacion:"Quoted", estado_cancelado:"Cancelled",
    form_nombre:"Event name *", form_categoria:"Category", form_estado:"Status",
    form_fecha_entrada:"Check-in date *", form_fecha_salida:"Check-out date *", form_fecha_confirmacion:"Confirmation date",
    form_habitaciones:"Rooms", form_adr:"Group ADR", form_fnb:"F&B Revenue",
    form_sala:"Meeting Room Revenue", form_notas:"Notes", form_motivo:"Reason for loss",
    form_guardar:"Save", form_cancelar:"Cancel", form_eliminar:"Delete", guardando_btn:"Saving...",
    noche:"night", noches:"nights", hab_abrev:"rms.",
    importar_title:"Import data", importar_sub:"Upload your FastRev Excel template",
    vaciar_datos:"Clear all imported data", vaciar_confirm:"Clear all data?",
    vaciar_desc:"Production, pickup and budget data will be deleted. This action cannot be undone.",
    vaciando:"Clearing...", si_vaciar:"Yes, clear all",
    haz_clic:"Click to select file", formato_xlsx:"Format .xlsx · FastRev template",
    importando_xlsx:"Importing will replace previous data",
    importado_ok:"Data imported successfully!", ver_dashboard:"View dashboard",
    dias_produccion:"production days imported", reservas_pickup:"pickup bookings imported",
    meses_presupuesto:"budget months imported",
    imp_datos_title:"Data & Pickup", imp_datos_sub:"Daily production + pickup bookings",
    imp_ppto_title:"Budget", imp_ppto_sub:"Only 💰 Budget sheet",
    imp_ppto_ok:"Budget updated",
    leyendo:"Reading file...", procesando:"Processing sheets...",
    limpiando:"Clearing previous data...", guardando:"Saving data...",
    empieza_gratis:"Start free for 30 days",
    acceso_completo:"Full access to FastRev for 30 days at no cost.",
    precio_sub:"Then just €49/month + VAT. Cancel anytime.",
    empezar_prueba:"Start free trial →", redirigiendo:"Redirecting...",
    feat_dashboard:"Real-time KPI dashboard", feat_pickup:"Pickup and forecast analysis",
    feat_presupuesto:"Budget vs actual monthly", feat_pdf:"Monthly PDF reports",
    ver_pickup:"→ View Pickup", importar_datos:"→ Import data", ver_mas:"→ See more",
    prox_semana:"Next week", prox_mes:"Next month", anio_actual:"Current year",
    otb_actual:"Current OTB", anio_anterior:"Previous Year",
    pace_title:"Pace — Next 6 months", pace_sub:"OCC pipeline vs Budget and Previous Year",
    sin_datos_pickup:"No pickup data",
    budget_empty:"Import your Excel template with the 💰 Budget sheet data to see the analysis here",
    rev_total_label:"Total Revenue", ppto_abrev:"Budget", real_label:"Actual",
    chart_rev:"Total Revenue — Budget vs Actual vs Forecast",
    chart_adr:"ADR — Budget vs Actual", chart_revpar:"RevPAR — Budget vs Actual",
    generando:"Generating...", cancelar:"Cancel", guardar:"Save", eliminar:"Delete",
    si:"Yes", no:"No", todos:"All",
  },
  fr: {
    nav_dashboard:"Dashboard", nav_pickup:"Reservas", nav_budget:"Budget", nav_grupos:"Grupos/Eventos", nav_salas:"Salles", nav_gestion:"Gestion des données",
    importar:"Importer", mi_perfil:"Mon profil", cerrar_sesion:"Déconnexion",
    suscripcion:"Abonnement", extranets:"Extranets", informe_mensual:"Rapport mensuel",
    conectado_como:"Connecté en tant que", cargando:"Chargement...",
    ob_paso:"Étape", ob_de:"sur", ob_omitir:"Ignorer", ob_siguiente:"Suivant →", ob_empezar:"Commencer !",
    ob0_title:"Importez vos données", ob0_text:"Téléchargez le modèle Excel, remplissez-le avec vos données de production et importez-le ici.",
    ob1_title:"Dashboard", ob1_text:"Visualisez vos KPIs principaux : RevPAR, ADR et occupation comparés à l'année précédente.",
    ob2_title:"Pickup", ob2_text:"Analysez le rythme des nouvelles réservations jour par jour et détectez les tendances.",
    ob3_title:"Budget", ob3_text:"Comparez la production réelle vs l'objectif mensuel et projetez la clôture annuelle.",
    ob4_title:"Grupos/Eventos", ob4_text:"Gérez les groupes et événements : confirmés, tentatifs et pipeline.",
    kpi_ocupacion:"Occupation", kpi_adr:"ADR", kpi_revpar:"RevPAR", kpi_trevpar:"TRevPAR",
    kpi_rev_diario:"Revenu Journalier", kpi_rev_mensual:"Revenu Mensuel", kpi_rev_hab:"Rev. Ch.", kpi_rev_total:"Rev. Total",
    sin_datos_prev:"Pas de données préc.", vs_mes_ant:"vs mois préc.", vs_anio_ant:"vs année préc.",
    sin_datos:"Aucune donnée", importa_excel:"Importez votre modèle Excel pour voir vos données ici",
    cargando_datos:"Chargement...", cargando_pickup:"Chargement pickup...",
    meses_full:["Janvier","Février","Mars","Avril","Mai","Juin","Juillet","Août","Septembre","Octobre","Novembre","Décembre"],
    meses_corto:["Jan","Fév","Mar","Avr","Mai","Jun","Jul","Aoû","Sep","Oct","Nov","Déc"],
    dias_semana:["L","M","M","J","V","S","D"],
    dias_abrev:["Dim","Lun","Mar","Mer","Jeu","Ven","Sam"],
    bienvenido:"Bienvenue", ocup_mensual:"Occupation mensuelle", adr_ocupacion:"ADR & Occupation",
    ultimos_12m:"12 derniers mois", sin_datos_mes:"Pas de données pour ce mois",
    adr_ocup_diaria:"ADR & Occupation journalière", otb:"OTB",
    th_anio:"Année", th_mes:"Mois", th_ocup:"Occup.", th_adr:"ADR",
    th_revpar:"RevPAR", th_trevpar:"TRevPAR", th_rev_hab:"Rev. Ch.", th_rev_total:"Rev. Total",
    th_fecha:"Date", th_hab_ocup:"Ch. Occup.", th_rev_day:"Rev. Total",
    th_ocup_media:"Occup. moy.", th_adr_medio:"ADR moy.", th_revpar_medio:"RevPAR moy.",
    th_rev_hab_total:"Rev. Ch. total", detalle_diario:"Détail journalier",
    dias_con_datos:"jours avec données", total_mes:"TOTAL MOIS", volver:"← Retour",
    reservas_ayer:"Réservations d'hier", reservas_captadas:"réservations captées",
    no_reservas_ayer:"Aucune réservation enregistrée hier",
    por_mes_llegada:"Par mois d'arrivée", por_canal:"Par canal", por_mes_afectado:"Par mois concerné",
    cancelaciones_ayer:"Annulations d'hier", cancelaciones:"annulations",
    sin_cancelaciones:"Aucune annulation hier", cancel_abrev:"annul.",
    duracion_media:"Durée moyenne", noches_reserva:"Nuits par réservation confirmée",
    noches_media:"nuits moy.", precio_medio_reserva:"Prix moyen réservation",
    revenue_medio:"Revenu moyen par réservation confirmée", precio_medio:"prix moy.",
    dia_pico:"Jour pic", res_abrev:"rés.",
    fechas_calientes:"Dates Chaudes", sin_futuras:"Aucune réservation future",
    ventana_reserva:"Fenêtre de réservation", dias_label:"jours",
    este_mes_label:"Ce mois", anio_ant_abrev:"Année préc.", variacion_label:"Variation",
    demanda_debil:"↓ Signal de demande faible", demanda_adelantada:"↑ Demande anticipée",
    analisis_desplazamiento:"Analyse de Déplacement",
    contrib_grupo:"Contrib. groupe", coste_desplaz:"Coût déplac.", valor_neto:"Valeur nette",
    adr_transient_ref:"ADR transient réf.", occ_hist_ly:"Occ. hist. LY",
    adr_minimo_rentable:"ADR min. rentable", acepta_grupo:"✓ Accepter", revisar_grupo:"⚠ Réviser",
    sin_datos_ly:"Pas de données LY — budget utilisé", fuente_ppto:"source : budget",
    rev_real_ytd:"Revenu Réel YTD", forecast_cierre_anio:"Prévision Clôture Année",
    presupuesto_anio:"Budget Annuel", detalle_mensual:"Détail mensuel",
    th_adr_ppto:"ADR Budget", th_adr_real:"ADR Réel", th_desv_adr:"Écart ADR",
    th_revpar_ppto:"RevPAR Budget", th_revpar_real:"RevPAR Réel", th_desv_revpar:"Écart RevPAR",
    th_rev_ppto:"Rev. Budget", th_rev_real:"Rev. Réelle", th_desv_rev:"Écart Rev.",
    th_forecast:"Prévision Clôture", total_ytd:"TOTAL YTD", vs_ppto:"vs budget",
    confianza:"confiance", real_badge:"✓ Réel",
    nuevo_evento:"+ Nouvel événement", sin_eventos:"Aucun groupe/événement", rev_estimado:"Chiffre d'affaires estimé",
    editar_evento:"Modifier l'événement", nuevo_evento_title:"Nouvel événement",
    nuevo_grupo_title:"Nouveau groupe", editar_grupo:"Modifier le groupe",
    eliminar_grupo:"Supprimer ce groupe ?", eliminar_evento:"Supprimer cet événement ?",
    form_hora_inicio:"Heure début", form_hora_fin:"Heure fin", form_sala_nombre:"Salle / Espace",
    form_servicio_incluido:"Service inclus",
    vista_calendario:"Calendrier", vista_lista:"Liste", vista_pipeline:"Pipeline", vista_tabla:"Tableau",
    rev_confirmado:"Revenu confirmé", rev_tentativo:"Revenu tentative (50%)",
    pipeline_cotizacion:"Pipeline en devis", cancelados_perdidos:"Annulés / Perdus",
    cat_corporativo:"Corporatif", cat_boda:"Mariage / Social", cat_feria:"Foire / Congrès",
    cat_deportivo:"Sportif", cat_otros:"Autres",
    estado_confirmado:"Confirmé", estado_cotizacion:"Devis", estado_cancelado:"Annulé",
    form_nombre:"Nom de l'événement *", form_categoria:"Catégorie", form_estado:"Statut",
    form_fecha_entrada:"Date d'arrivée *", form_fecha_salida:"Date de départ *", form_fecha_confirmacion:"Date de confirmation",
    form_habitaciones:"Chambres", form_adr:"ADR Groupe", form_fnb:"Revenu F&B",
    form_sala:"Revenu Salle", form_notas:"Notes", form_motivo:"Motif de perte",
    form_guardar:"Enregistrer", form_cancelar:"Annuler", form_eliminar:"Supprimer", guardando_btn:"Enregistrement...",
    noche:"nuit", noches:"nuits", hab_abrev:"ch.",
    importar_title:"Importer des données", importar_sub:"Téléchargez votre modèle Excel FastRev",
    vaciar_datos:"Effacer toutes les données importées", vaciar_confirm:"Effacer toutes les données ?",
    vaciar_desc:"Les données de production, pickup et budget seront supprimées. Cette action est irréversible.",
    vaciando:"Effacement...", si_vaciar:"Oui, tout effacer",
    haz_clic:"Cliquez pour sélectionner le fichier", formato_xlsx:"Format .xlsx · Modèle FastRev",
    importando_xlsx:"L'importation remplacera les données précédentes",
    importado_ok:"Données importées avec succès !", ver_dashboard:"Voir le dashboard",
    dias_produccion:"jours de production importés", reservas_pickup:"réservations pickup importées",
    meses_presupuesto:"mois de budget importés",
    leyendo:"Lecture du fichier...", procesando:"Traitement des feuilles...",
    limpiando:"Suppression des données précédentes...", guardando:"Sauvegarde...",
    imp_datos_title:"Données & Pickup", imp_datos_sub:"Production journalière + réservations pickup",
    imp_ppto_title:"Budget", imp_ppto_sub:"Uniquement la feuille 💰 Budget",
    imp_ppto_ok:"Budget mis à jour",
    empieza_gratis:"Commencez gratuitement 30 jours",
    acceso_completo:"Accès complet à FastRev pendant 30 jours sans frais.",
    precio_sub:"Ensuite, seulement 49€/mois + TVA. Annulez quand vous voulez.",
    empezar_prueba:"Démarrer l'essai gratuit →", redirigiendo:"Redirection...",
    feat_dashboard:"Dashboard KPIs en temps réel", feat_pickup:"Analyse pickup et prévisions",
    feat_presupuesto:"Budget vs réel mensuel", feat_pdf:"Rapports PDF mensuels",
    ver_pickup:"→ Voir Pickup", importar_datos:"→ Importer données", ver_mas:"→ Voir plus",
    prox_semana:"Sem. prochaine", prox_mes:"Mois prochain", anio_actual:"Année en cours",
    otb_actual:"OTB Actuel", anio_anterior:"Année Précédente",
    pace_title:"Pace — 6 prochains mois", pace_sub:"OCC en portefeuille vs Budget et Année Précédente",
    sin_datos_pickup:"Pas de données pickup",
    budget_empty:"Importez votre modèle Excel avec les données de la feuille 💰 Budget pour voir l'analyse ici",
    rev_total_label:"Revenu Total", ppto_abrev:"Budget", real_label:"Réel",
    chart_rev:"Revenu Total — Budget vs Réel vs Prévision",
    chart_adr:"ADR — Budget vs Réel", chart_revpar:"RevPAR — Budget vs Réel",
    generando:"Génération...", cancelar:"Annuler", guardar:"Enregistrer", eliminar:"Supprimer",
    si:"Oui", no:"Non", todos:"Tous",
  },
};

const MESES = ["Enero","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
const MESES_CORTO = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
const MESES_FULL = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];

const AnimatedBar = (props) => {
  const { x, y, width, height, fill, onClick } = props;
  const [animKey, setAnimKey] = useState(0);
  if (!height || height <= 0) return null;
  return (
    <g onClick={onClick} style={{ cursor:"pointer", outline:"none" }}
      onMouseEnter={() => setAnimKey(k => k + 1)}>
      {/* Barra base — siempre visible a color completo */}
      <rect x={x} y={y} width={width} height={height} rx={4} ry={4} fill={fill}/>
      {/* Overlay de relleno animado desde abajo al hover */}
      {animKey > 0 && (
        <rect key={animKey} x={x} y={y} width={width} height={height} rx={4} ry={4} fill={fill}
          style={{
            transformBox:"fill-box",
            transformOrigin:"bottom",
            animation:"bar-fill-up 0.5s cubic-bezier(0.22,1,0.36,1) both",
          }}/>
      )}
    </g>
  );
};

const SimpleBar = ({ x, y, width, height, fill, fillOpacity }) => {
  if (!height || height <= 0) return null;
  return <rect x={x} y={y} width={width} height={height} rx={4} ry={4} fill={fill} fillOpacity={fillOpacity}/>;
};

const TOOLTIP_COLORS = {
  "Ocupación":"#004B87","occ":"#004B87","OCC":"#004B87","Occupancy":"#004B87",
  "ADR":"#004B87","adr":"#004B87",
  "RevPAR":"#004B87","revpar":"#004B87",
  "TRevPAR":"#004B87","trevpar":"#004B87",
  "Hab.":"#1A7A3C","Habitaciones":"#1A7A3C","revHab":"#1A7A3C",
  "F&B":"#E85D04","revFnb":"#E85D04",
  "Grupos/Eventos":"#B8860B","revME":"#B8860B",
  "Año anterior":"#D32F2F","ly":"#D32F2F",
  "Ocup. LY":"#F87171","occLY":"#F87171",
  "ADR LY":"#8B5CF6","adrLY":"#8B5CF6",
};
const CustomTooltip = ({ active, payload, label, unit }) => {
  if (!active || !payload?.length) return null;
  const OCC_NAMES = ["Ocupación","occ","OCC","Occupancy"];
  const raw = payload[0]?.payload || {};
  let displayLabel = raw.fecha || raw.mesNombre || label;
  if (raw.mesNombre && raw.anioIdx) displayLabel = `${raw.mesNombre} ${raw.anioIdx}`;
  return (
    <div style={{ background:"#111111", borderRadius:10, padding:"12px 16px", boxShadow:"0 8px 24px rgba(0,0,0,0.35)", minWidth:148 }}>
      <p style={{ color:"#fff", fontSize:10, fontWeight:700, marginBottom:8, textTransform:"uppercase", letterSpacing:"1px" }}>{displayLabel}</p>
      {payload.map((p, i) => {
        const isOcc = unit === "%" || OCC_NAMES.includes(p.name);
        const val = typeof p.value === 'number'
          ? isOcc ? `${Math.round(p.value)}%` : `${Math.round(p.value).toLocaleString("es-ES")}€`
          : p.value;
        const color = (typeof p.color === "string" && !p.color.startsWith("url(")) ? p.color : (TOOLTIP_COLORS[p.name] || TOOLTIP_COLORS[p.dataKey] || "#7A9CC8");
        return (
          <div key={i} style={{ display:"flex", alignItems:"center", gap:7, margin:"3px 0" }}>
            <span style={{ width:8, height:8, borderRadius:2, background:color, flexShrink:0, display:"inline-block" }}/>
            <span style={{ color:"rgba(255,255,255,0.75)", fontSize:12 }}>{p.name}: <span style={{ color:"#fff", fontWeight:700 }}>{val}</span></span>
          </div>
        );
      })}
    </div>
  );
};

function WeatherBar({ ciudad, datos, lang }) {
  const [weather, setWeather] = useState(null);
  const [ahora, setAhora] = useState(new Date());
  useEffect(() => { const id = setInterval(() => setAhora(new Date()), 1000); return () => clearInterval(id); }, []);

  useEffect(() => {
    if (!ciudad) return;
    fetch(`https://wttr.in/${encodeURIComponent(ciudad.trim())}?format=j1`)
      .then(r => r.json())
      .then(data => {
        const cur = data.current_condition?.[0];
        if (!cur) return;
        setWeather({ temp: cur.temp_C, code: parseInt(cur.weatherCode) });
      })
      .catch(() => {});
  }, [ciudad]);

  const weatherEmoji = (code) => {
    if (!code) return "🌡️";
    if (code === 113) return "☀️";
    if (code === 116) return "⛅";
    if (code === 119 || code === 122) return "☁️";
    if ([143,248,260].includes(code)) return "🌫️";
    if ([176,293,296,353].includes(code)) return "🌦️";
    if ([185,263,266,281,284,311,314,317,350,374,377].includes(code)) return "🌧️";
    if ([200,386,389,392,395].includes(code)) return "⛈️";
    if ([179,182,227,230,323,326,329,332,335,338,356,359,362,365,368,371].includes(code)) return "❄️";
    return "🌡️";
  };
  const WEATHER_ES = { 113:"Despejado", 116:"Parcialmente nublado", 119:"Nublado", 122:"Cubierto", 143:"Niebla", 176:"Lluvia ligera", 179:"Nieve ligera", 182:"Aguanieve", 185:"Llovizna helada", 200:"Tormenta eléctrica", 227:"Ventisca", 230:"Tormenta de nieve", 248:"Niebla", 260:"Niebla helada", 263:"Llovizna", 266:"Llovizna", 281:"Llovizna helada", 284:"Llovizna helada", 293:"Lluvia ligera", 296:"Lluvia ligera", 299:"Lluvia moderada", 302:"Lluvia moderada", 305:"Lluvia intensa", 308:"Lluvia muy intensa", 311:"Lluvia helada", 314:"Lluvia helada", 317:"Aguanieve ligera", 320:"Aguanieve", 323:"Nevada ligera", 326:"Nevada ligera", 329:"Nevada moderada", 332:"Nevada moderada", 335:"Nevada intensa", 338:"Nevada muy intensa", 350:"Granizo", 353:"Lluvia ligera", 356:"Lluvia intensa", 359:"Lluvia torrencial", 362:"Aguanieve ligera", 365:"Aguanieve", 368:"Nevada ligera", 371:"Nevada moderada", 374:"Granizo ligero", 377:"Granizo", 386:"Tormenta con lluvia", 389:"Tormenta con lluvia intensa", 392:"Tormenta con nieve", 395:"Tormenta de nieve" };

  const tickerText = useMemo(() => {
    const produccion = datos?.produccion || [];
    const pickupEntries = datos?.pickupEntries || [];
    const msgs = [];

    const hoy = new Date();
    const ayer = new Date(hoy); ayer.setDate(hoy.getDate() - 1);
    const ayerStr = `${ayer.getFullYear()}-${String(ayer.getMonth()+1).padStart(2,"0")}-${String(ayer.getDate()).padStart(2,"0")}`;
    const hoyStr  = `${hoy.getFullYear()}-${String(hoy.getMonth()+1).padStart(2,"0")}-${String(hoy.getDate()).padStart(2,"0")}`;
    const diaHoy = hoy.getDate();
    const mesActual = hoy.getMonth() + 1;
    const anioActual = hoy.getFullYear();
    const mesPad = String(mesActual).padStart(2, "0");
    const mesPrefijo = `${anioActual}-${mesPad}`;
    const hab = datos?.hotel?.habitaciones || 30;

    const fmtFecha = iso => { const [y,m,d]=iso.split("-"); return `${d}/${m}/${y.slice(2)}`; };
    const getFechaSalida = e => {
      if (e.fecha_salida) return String(e.fecha_salida).slice(0,10);
      if (e.noches && e.fecha_llegada) { const d=new Date(e.fecha_llegada); d.setDate(d.getDate()+Number(e.noches)); return d.toISOString().slice(0,10); }
      return null;
    };
    const activas = pickupEntries.filter(e => (e.estado||"confirmada") !== "cancelada" && !((e.canal||"").toLowerCase().includes("grupo")||(e.canal||"").toLowerCase().includes("evento")));

    // ── 1. MOVIMIENTO DE HOY + comparación ayer ──
    const entradasHoy  = activas.filter(e => String(e.fecha_llegada||"").slice(0,10) === hoyStr).reduce((a,e)=>a+(e.num_reservas||1),0);
    const salidasHoy   = activas.filter(e => getFechaSalida(e) === hoyStr).reduce((a,e)=>a+(e.num_reservas||1),0);
    const entradasAyer = activas.filter(e => String(e.fecha_llegada||"").slice(0,10) === ayerStr).reduce((a,e)=>a+(e.num_reservas||1),0);
    const salidasAyer  = activas.filter(e => getFechaSalida(e) === ayerStr).reduce((a,e)=>a+(e.num_reservas||1),0);
    const ayerProd     = produccion.find(d => d.fecha === ayerStr);
    const occAyerProd  = ayerProd?.hab_disponibles > 0 ? Math.round(ayerProd.hab_ocupadas/ayerProd.hab_disponibles*100) : null;
    const netoHoy      = pickupEntries.reduce((a,e) => { if(String(e.fecha_llegada||"").slice(0,10)!==hoyStr)return a; return a+(e.num_reservas||1)*((e.estado||"confirmada")==="cancelada"?-1:1); },0);
    const occHoy       = hab>0 ? Math.min(Math.round(Math.max(0,netoHoy)/hab*100),100) : null;
    const netoAyer     = pickupEntries.reduce((a,e) => { if(String(e.fecha_llegada||"").slice(0,10)!==ayerStr)return a; return a+(e.num_reservas||1)*((e.estado||"confirmada")==="cancelada"?-1:1); },0);
    const occAyerOTB   = hab>0 ? Math.min(Math.round(Math.max(0,netoAyer)/hab*100),100) : null;
    const occAyer      = occAyerProd ?? occAyerOTB;
    const fmtDelta     = (hoy,ayer) => { if(ayer==null)return ""; const d=hoy-ayer; return ` (${d>=0?"+":""}${d}%)`; };
    {
      const parts = [];
      if (occHoy != null) parts.push(`Ocupación ${occHoy}%${fmtDelta(occHoy,occAyer)}`);
      parts.push(`Entradas ${entradasHoy}${entradasAyer>0?` (ayer ${entradasAyer})`:""}`);
      parts.push(`Salidas ${salidasHoy}${salidasAyer>0?` (ayer ${salidasAyer})`:""}`);
      msgs.push(`Movimiento hoy  ·  ${parts.join("  ·  ")}`);
    }

    // ── 2. GRUPOS / EVENTOS HOY → si no hay, próximo evento ──
    const grupos = datos?.grupos || [];
    const gruposHoy = grupos.filter(g => g.fecha_inicio <= hoyStr && (g.fecha_fin||g.fecha_inicio) >= hoyStr && (g.estado==="confirmado"||g.estado==="tentativo"));
    if (gruposHoy.length > 0) {
      const partes = gruposHoy.map(g => {
        let txt = g.nombre;
        if (g.habitaciones) txt += `  ·  ${g.habitaciones} hab.`;
        if (g.pax) txt += `  ·  ${g.pax} pax`;
        return txt;
      });
      msgs.push(`Grupos/Eventos hoy  ·  ${partes.join("   |   ")}`);
    } else {
      const proximo = grupos.filter(g => g.fecha_inicio > hoyStr && g.estado==="confirmado").sort((a,b)=>a.fecha_inicio.localeCompare(b.fecha_inicio))[0];
      if (proximo) {
        let txt = `Próximo evento  ·  ${proximo.nombre}  ${fmtFecha(proximo.fecha_inicio)}`;
        if (proximo.fecha_fin && proximo.fecha_fin !== proximo.fecha_inicio) txt += `→${fmtFecha(proximo.fecha_fin)}`;
        if (proximo.habitaciones) txt += `  ·  ${proximo.habitaciones} hab.`;
        msgs.push(txt);
      }
    }

    // ── 3. KPIs MENSUALES ──
    const datosMes = produccion.filter(d => d.fecha.startsWith(mesPrefijo));
    if (datosMes.length > 0) {
      const habOcuMes  = datosMes.reduce((a,d)=>a+(d.hab_ocupadas||0),0);
      const habDisMes  = datosMes.reduce((a,d)=>a+(d.hab_disponibles||0),0);
      const revHabMes  = datosMes.reduce((a,d)=>a+(d.revenue_hab||0),0);
      const revTotMes  = datosMes.reduce((a,d)=>a+(d.revenue_total||d.revenue_hab||0),0);
      const occMes     = habDisMes>0 ? (habOcuMes/habDisMes*100).toFixed(1) : null;
      const adrMes     = habOcuMes>0 ? Math.round(revHabMes/habOcuMes) : null;
      const revparMes  = habDisMes>0 ? Math.round(revHabMes/habDisMes) : null;
      const lyPfx      = `${anioActual-1}-${mesPad}`;
      const datosLY    = produccion.filter(d=>d.fecha.startsWith(lyPfx)).slice(0,diaHoy);
      const habOcuLY   = datosLY.reduce((a,d)=>a+(d.hab_ocupadas||0),0);
      const habDisLY   = datosLY.reduce((a,d)=>a+(d.hab_disponibles||0),0);
      const occLY      = habDisLY>0 ? (habOcuLY/habDisLY*100).toFixed(1) : null;
      const revTotLY   = datosLY.reduce((a,d)=>a+(d.revenue_total||d.revenue_hab||0),0);
      const parts = [`Revenue €${Math.round(revTotMes).toLocaleString("es-ES")}`];
      if (revTotLY>0) { const p=((revTotMes-revTotLY)/revTotLY*100); parts[0]+=` (${p>=0?"+":""}${p.toFixed(1)}% vs LY)`; }
      if (occMes)  { let s=`OCC ${occMes}%`; if(occLY) { const d=(parseFloat(occMes)-parseFloat(occLY)); s+=` (${d>=0?"+":""}${d.toFixed(1)}pp vs LY)`; } parts.push(s); }
      if (adrMes)  parts.push(`ADR €${adrMes}`);
      if (revparMes) parts.push(`RevPAR €${revparMes}`);
      msgs.push(`KPIs del mes  ·  ${parts.join("  ·  ")}`);
    }

    if (msgs.length === 0) return "";
    const sep = "          ◆          ";
    const full = msgs.join(sep) + sep;
    return full + full; // duplicar para loop continuo
  }, [datos?.produccion?.length, datos?.pickupEntries?.length, datos?.grupos?.length]);

  const duration = Math.max(25, (tickerText.length / 2) * 0.13);

  if (!ciudad) return null;

  return (
    <div style={{ background:"#1a1a1a", borderBottom:`1px solid #2e2e2e`, position:"sticky", top:52, zIndex:99, height:40, display:"flex", alignItems:"center", overflow:"hidden" }}>

      {/* Ticker */}
      <div style={{ flex:1, overflow:"hidden", padding:"0 16px 0 clamp(12px,4vw,32px)" }}>
        {tickerText ? (
          <div style={{ display:"inline-block", whiteSpace:"nowrap", fontSize:11, color:"#fff", fontFamily:"'Plus Jakarta Sans',sans-serif", fontWeight:500, animationName:"ticker", animationTimingFunction:"linear", animationIterationCount:"infinite", animationDuration:`${duration}s` }}>
            {tickerText}
          </div>
        ) : (
          <span style={{ fontSize:11, color:"#fff" }}>Cargando datos...</span>
        )}
      </div>

      {/* Ciudad + Tiempo + Fecha/Hora — derecha */}
      <div style={{ display:"flex", alignItems:"center", gap:8, padding:"0 clamp(12px,4vw,32px) 0 12px", borderLeft:`1px solid rgba(255,255,255,0.12)`, flexShrink:0, height:"100%" }}>
        {weather && <span style={{ fontSize:14, lineHeight:1 }}>{weatherEmoji(weather.code)}</span>}
        {weather && <span style={{ fontSize:12, fontWeight:800, color:"#fff" }}>{weather.temp}°C</span>}
        {weather && (
          <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-start", justifyContent:"center", lineHeight:1.15 }}>
            <span style={{ fontSize:11, fontWeight:700, color:"#fff" }}>{ciudad}</span>
            <span style={{ fontSize:9.5, color:"#fff" }}>
              {ahora.toLocaleDateString(lang==="en"?"en-GB":lang==="fr"?"fr-FR":"es-ES",{weekday:"short",day:"numeric",month:"short"})}
              {" · "}
              {ahora.toLocaleTimeString(lang==="en"?"en-GB":lang==="fr"?"fr-FR":"es-ES",{hour:"2-digit",minute:"2-digit"})}
              {" "}
              <span style={{ fontSize:8.5, color:"#fff", background:"rgba(255,255,255,0.15)", borderRadius:2, padding:"0 3px" }}>
                {ahora.toLocaleTimeString("en-GB",{timeZoneName:"short"}).split(" ").pop()}
              </span>
            </span>
          </div>
        )}
      </div>

    </div>
  );
}

function Card({ children, style = {}, onClick }) {
  return (
    <div onClick={onClick} style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 10, padding: "22px 24px", width: "100%", ...style }}>
      {children}
    </div>
  );
}


// ─── KPI MODAL ───────────────────────────────────────────────────
const KPI_TKEYS = { "Ocupación":"kpi_ocupacion", "ADR":"kpi_adr", "RevPAR":"kpi_revpar", "TRevPAR":"kpi_trevpar", "Revenue Diario":"kpi_rev_diario", "Revenue Mensual":"kpi_rev_mensual", "Revenue Total":"kpi_rev_total" };
function KpiModal({ kpi, datos, mes, anio, onClose }) {
  const t = useT();
  const kpiLabel = t(KPI_TKEYS[kpi]) || kpi;
  const compMode = "mes";

  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);
  const { produccion, presupuesto } = datos;
  const MESES_FULL = t("meses_full");

  const [modoVista, setModoVista] = useState("30dias"); // "30dias" | "mes"

  const todasProd = (produccion||[]).sort((a,b)=>new Date(a.fecha)-new Date(b.fecha));
  const ultimaFechaMes = todasProd
    .filter(d => { const f=new Date(d.fecha+"T00:00:00"); return f.getMonth()===mes && f.getFullYear()===anio; })
    .map(d => d.fecha).slice(-1)[0];
  const _pad2 = n => String(n).padStart(2,"0");
  const _hoyLocal = new Date();
  const _hoyStr = `${_hoyLocal.getFullYear()}-${_pad2(_hoyLocal.getMonth()+1)}-${_pad2(_hoyLocal.getDate())}`;
  const refDateStr = ultimaFechaMes || _hoyStr;
  const _ref = new Date(refDateStr+"T00:00:00");
  const _desde = new Date(_ref); _desde.setDate(_ref.getDate()-29);
  const desde30Str = `${_desde.getFullYear()}-${_pad2(_desde.getMonth()+1)}-${_pad2(_desde.getDate())}`;

  const diasMes = todasProd
    .filter(d => {
      const f=new Date(d.fecha+"T00:00:00");
      if (modoVista === "mes") return f.getMonth()===mes && f.getFullYear()===anio;
      return d.fecha >= desde30Str && d.fecha <= refDateStr;
    })
    .map(d => {
      const f = new Date(d.fecha+"T00:00:00");
      const habDis = d.hab_disponibles||30;
      return {
        dia: `${f.getDate()}/${f.getMonth()+1}`,
        diaSemana: f.getDay(),
        fecha: f.toLocaleDateString("es-ES",{day:"numeric",month:"long",year:"numeric"}),
        occ:    habDis>0 ? Math.round(d.hab_ocupadas/habDis*100) : 0,
        adr:    d.hab_ocupadas>0 ? Math.round(d.revenue_hab/d.hab_ocupadas) : 0,
        revpar: habDis>0 ? Math.round(d.revenue_hab/habDis) : 0,
        trevpar:habDis>0 ? Math.round((d.revenue_hab+(d.revenue_fnb||0))/habDis) : 0,
        revHab: Math.round(d.revenue_hab||0),
        revFnb: Math.round(d.revenue_fnb||0),
        revTotal: Math.round(d.revenue_total||0),
      };
    });

  const mapProd = d => {
    const habDis=d.hab_disponibles||30;
    return {
      dia: new Date(d.fecha+"T00:00:00").getDate(),
      occ: habDis>0?Math.round(d.hab_ocupadas/habDis*100):0,
      adr: d.hab_ocupadas>0?Math.round(d.revenue_hab/d.hab_ocupadas):0,
      revpar: habDis>0?Math.round(d.revenue_hab/habDis):0,
      trevpar: habDis>0?Math.round((d.revenue_hab+(d.revenue_fnb||0))/habDis):0,
      revHab:  Math.round(d.revenue_hab||0),
      revFnb:  Math.round(d.revenue_fnb||0),
      revTotal: Math.round(d.revenue_total||0),
    };
  };

  const mesPrevIdx = mes === 0 ? 11 : mes - 1;
  const anioPrevModal = mes === 0 ? anio - 1 : anio;
  const diasMP = todasProd
    .filter(d => { const f=new Date(d.fecha+"T00:00:00"); return f.getMonth()===mesPrevIdx && f.getFullYear()===anioPrevModal; })
    .map(mapProd);

  const diasComp  = diasMP;
  const compLabel = MESES_FULL[mesPrevIdx];

  const ppto = (presupuesto||[]).find(p=>p.mes===mes+1&&p.anio===anio);

  // Año anterior mismo mes
  const diasLY = todasProd
    .filter(d => { const f=new Date(d.fecha+"T00:00:00"); return f.getMonth()===mes && f.getFullYear()===anio-1; })
    .map(mapProd);

  const getChartData = () => {
    const lyField = kpi==="Ocupación"?"occ":kpi==="ADR"?"adr":kpi==="RevPAR"?"revpar":kpi==="TRevPAR"?"trevpar":"revTotal";
    return diasMes.map((d,i)=>({
      ...d,
      mp: diasComp[i]?.[lyField] ?? null,
      ly: diasLY[i]?.[lyField] ?? null,
    }));
  };
  const chartData = getChartData();

  const fk = kpi==="Ocupación"?"occ":kpi==="ADR"?"adr":kpi==="RevPAR"?"revpar":kpi==="TRevPAR"?"trevpar":"revTotal";

  const diasMesCompleto = todasProd
    .filter(d => { const f=new Date(d.fecha+"T00:00:00"); return f.getMonth()===mes && f.getFullYear()===anio; })
    .map(mapProd);
  const diasMesCompLetoMP = todasProd
    .filter(d => { const f=new Date(d.fecha+"T00:00:00"); return f.getMonth()===mesPrevIdx && f.getFullYear()===(mes===0?anio-1:anio); })
    .map(mapProd);

  const srcActual = modoVista === "30dias" ? diasMes : diasMesCompleto;
  const srcComp   = diasMesCompLetoMP;

  const mediaActual = srcActual.length>0 ? srcActual.reduce((a,d)=>a+(d[fk]||0),0)/srcActual.length : 0;
  const mediaComp   = srcComp.length>0   ? srcComp.reduce((a,d)=>a+(d[fk]||0),0)/srcComp.length   : 0;
  const varComp = mediaComp>0?((mediaActual-mediaComp)/mediaComp*100).toFixed(1):null;
  const fieldKey = kpi==="Ocupación"?"occ":kpi==="ADR"?"adr":kpi==="RevPAR"?"revpar":kpi==="TRevPAR"?"trevpar":"revTotal";

  const pptoVal = kpi==="Ocupación"?ppto?.occ_ppto:kpi==="ADR"?ppto?.adr_ppto:kpi==="RevPAR"?ppto?.revpar_ppto:kpi==="Revenue Total"?ppto?.rev_total_ppto:null;
  const varPpto = pptoVal&&mediaActual?((mediaActual-pptoVal)/pptoVal*100).toFixed(1):null;

  const unit = kpi==="Ocupación"?"%":"€";

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.5)", zIndex:1000, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
      <div style={{ background:C.bgCard, borderRadius:14, width:"100%", maxWidth:820, maxHeight:"90vh", overflow:"auto", padding:28, boxShadow:"0 20px 60px rgba(0,0,0,0.2)" }} onClick={e=>e.stopPropagation()}>

        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
          <div>
            <p style={{ fontSize:11, color:C.textLight, textTransform:"uppercase", letterSpacing:2 }}>{MESES_FULL[mes]} {anio}</p>
            <h3 style={{ fontSize:22, fontWeight:800, color:C.text, fontFamily:"'Plus Jakarta Sans',sans-serif", letterSpacing:-0.5 }}>{kpiLabel}</h3>
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            <button onClick={onClose} style={{ background:"none", border:`1.5px solid ${C.border}`, borderRadius:8, width:34, height:34, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", fontSize:16, color:C.textMid, fontWeight:300, transition:"all 0.15s" }}
              onMouseEnter={e=>{ e.currentTarget.style.background=C.accent; e.currentTarget.style.borderColor=C.accent; e.currentTarget.style.color="#fff"; }}
              onMouseLeave={e=>{ e.currentTarget.style.background="none"; e.currentTarget.style.borderColor=C.border; e.currentTarget.style.color=C.textMid; }}>
              ×
            </button>
          </div>
        </div>

        {kpi === "Revenue Total" ? (() => {
          const totalHabS  = diasMes.reduce((a,d)=>a+d.revHab,0);
          const totalFnbS  = diasMes.reduce((a,d)=>a+d.revFnb,0);
          return (
            <div style={{ display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:12, marginBottom:20 }}>
              {[
                { label:"Total del mes", value:`€${Math.round(totalHabS+totalFnbS).toLocaleString("es-ES")}` },
                { label:`Vs ${MESES_FULL[mesPrevIdx]}`, value: varComp!==null ? `${parseFloat(varComp)>=0?"+":""}${varComp}%` : "Sin datos", up: varComp!==null?parseFloat(varComp)>=0:true },
                { label:"Habitaciones", value:`€${Math.round(totalHabS).toLocaleString("es-ES")}`, color:C.accent },
                { label:"F&B", value:`€${Math.round(totalFnbS).toLocaleString("es-ES")}`, color:"#E85D04" },
              ].map((k,i)=>(
                <div key={i} style={{ background:`${C.accent}0f`, borderRadius:8, padding:"16px", borderLeft:`3px solid ${k.color||C.accent}`, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", textAlign:"center" }}>
                  <p style={{ fontSize:10, color:C.textMid, textTransform:"uppercase", letterSpacing:1.5, marginBottom:6, fontWeight:600 }}>{k.label}</p>
                  <p style={{ fontSize:22, fontWeight:700, color:k.color||(k.up===false?C.red:k.up===true?C.green:C.text), fontFamily:"'Plus Jakarta Sans',sans-serif" }}>{k.value}</p>
                </div>
              ))}
            </div>
          );
        })() : kpi === "Revenue Mensual" ? (() => {
          const totalHabM = diasMesCompleto.reduce((a,d)=>a+d.revHab,0);
          const totalFnbM = diasMesCompleto.reduce((a,d)=>a+d.revFnb,0);
          const totalM    = totalHabM + totalFnbM;
          const totalLM   = diasMesCompLetoMP.reduce((a,d)=>a+d.revHab+d.revFnb,0);
          const totalLY   = diasLY.reduce((a,d)=>a+(d.revHab||0)+(d.revFnb||0),0);
          const vsLMv = totalLM>0?((totalM-totalLM)/totalLM*100).toFixed(1):null;
          const vsLYv = totalLY>0?((totalM-totalLY)/totalLY*100).toFixed(1):null;
          return (
            <div style={{ display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:12, marginBottom:20 }}>
              {[
                { label:"Total del mes", value:`€${Math.round(totalM).toLocaleString("es-ES")}` },
                { label:`Vs ${MESES_FULL[mesPrevIdx]}`, value:vsLMv?`${parseFloat(vsLMv)>=0?"+":""}${vsLMv}%`:"Sin datos", up:vsLMv?parseFloat(vsLMv)>=0:true },
                { label:"Habitaciones", value:`€${Math.round(totalHabM).toLocaleString("es-ES")}`, color:C.accent },
                { label:"F&B", value:`€${Math.round(totalFnbM).toLocaleString("es-ES")}`, color:"#E85D04" },
              ].map((k,i)=>(
                <div key={i} style={{ background:`${C.accent}0f`, borderRadius:8, padding:"16px", borderLeft:`3px solid ${k.color||C.accent}`, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", textAlign:"center" }}>
                  <p style={{ fontSize:10, color:C.textMid, textTransform:"uppercase", letterSpacing:1.5, marginBottom:6, fontWeight:600 }}>{k.label}</p>
                  <p style={{ fontSize:22, fontWeight:700, color:k.color||(k.up===false?C.red:k.up===true?C.green:C.text), fontFamily:"'Plus Jakarta Sans',sans-serif" }}>{k.value}</p>
                </div>
              ))}
              {vsLYv && <div style={{ gridColumn:"1/-1", display:"flex", gap:8, alignItems:"center" }}>
                <span style={{ fontSize:11, color:C.textLight }}>vs LY ({anio-1}):</span>
                <span style={{ fontSize:12, fontWeight:700, padding:"2px 8px", borderRadius:4, background:parseFloat(vsLYv)>=0?C.greenLight:C.redLight, color:parseFloat(vsLYv)>=0?C.green:C.red }}>{parseFloat(vsLYv)>=0?"+":""}{vsLYv}%</span>
              </div>}
            </div>
          );
        })() : (() => {
          const mediaLY = diasLY.length>0 ? diasLY.reduce((a,d)=>a+(d[fk]||0),0)/diasLY.length : 0;
          const varLY = mediaLY>0 ? ((mediaActual-mediaLY)/mediaLY*100).toFixed(1) : null;
          const cards = [
            { label: modoVista==="30dias" ? "Media 30 días" : "Media del mes", value:`${kpi==="Ocupación"?mediaActual.toFixed(1):Math.round(mediaActual).toLocaleString("es-ES")}${unit}` },
            { label:`Vs ${compLabel}`, value: varComp!==null ? `${parseFloat(varComp)>=0?"+":""}${varComp}%` : "Sin datos", up: varComp!==null?parseFloat(varComp)>=0:true },
            { label:`Vs LY (${anio-1})`, value: varLY!==null ? `${parseFloat(varLY)>=0?"+":""}${varLY}%` : "Sin datos", up: varLY!==null?parseFloat(varLY)>=0:true },
          ];
          return (
            <div style={{ display:"grid", gridTemplateColumns:`repeat(${cards.length},1fr)`, gap:12, marginBottom:20 }}>
              {cards.map((k,i)=>(
                <div key={i} style={{ background:`${C.accent}0f`, borderRadius:8, padding:"16px", borderLeft:`3px solid ${C.accent}`, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", textAlign:"center" }}>
                  <p style={{ fontSize:10, color:C.textMid, textTransform:"uppercase", letterSpacing:1.5, marginBottom:6, fontWeight:600 }}>{k.label}</p>
                  <p style={{ fontSize:22, fontWeight:700, color:k.up===false?C.red:k.up===true?C.green:C.text, fontFamily:"'Plus Jakarta Sans',sans-serif" }}>{k.value}</p>
                </div>
              ))}
            </div>
          );
        })()}

        <div style={{ marginBottom:16 }}>
          {kpi==="Revenue Mensual" ? (() => {
            const dailyData = diasMesCompleto.map(d=>({ dia:d.dia, mesNombre:`${d.dia} ${MESES_FULL[mes]} ${anio}`, revHab:d.revHab, revFnb:d.revFnb }));
            return (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={dailyData} barSize={10} barCategoryGap="20%">
                  <defs>
                    <linearGradient id="gradHabD" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#1A7A3C" stopOpacity={1}/>
                      <stop offset="100%" stopColor="#1A7A3C" stopOpacity={0.7}/>
                    </linearGradient>
                    <linearGradient id="gradFnbD" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#E85D04" stopOpacity={0.9}/>
                      <stop offset="100%" stopColor="#E85D04" stopOpacity={0.55}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={C.border} vertical={false}/>
                  <XAxis dataKey="dia" tick={{ fill:C.textLight, fontSize:10 }} axisLine={false} tickLine={false} interval={Math.ceil(dailyData.length/10)-1}/>
                  <YAxis tick={{ fill:C.textLight, fontSize:10 }} axisLine={false} tickLine={false} tickFormatter={v=>v>=1000?`${(v/1000).toFixed(0)}k€`:v} width={42}/>
                  <Tooltip content={<CustomTooltip/>} cursor={false}/>
                  <Legend wrapperStyle={{ fontSize:11, color:C.textMid, paddingTop:8 }}/>
                  <Bar dataKey="revHab" name="Hab." stackId="a" fill="url(#gradHabD)" radius={[0,0,0,0]} shape={(p)=><SimpleBar {...p}/>}/>
                  <Bar dataKey="revFnb" name="F&B"  stackId="a" fill="url(#gradFnbD)" radius={[4,4,0,0]} shape={(p)=><SimpleBar {...p}/>}/>
                </BarChart>
              </ResponsiveContainer>
            );
          })() : kpi==="Revenue Total" ? (() => {
            const MESES_SHORT = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
            const revPorMes = Array.from({length:12},(_,i)=>{
              const mIdx = ((mes-11+i)%12+12)%12;
              const aIdx = anio + Math.floor((mes-11+i)/12);
              const dias = todasProd.filter(d=>{ const f=new Date(d.fecha+"T00:00:00"); return f.getMonth()===mIdx && f.getFullYear()===aIdx; });
              return {
                mes: MESES_SHORT[mIdx],
                mesNombre: MESES_FULL[mIdx],
                anioIdx: aIdx,
                revHab:   Math.round(dias.reduce((a,d)=>a+(d.revenue_hab||0),0)),
                revFnb:   Math.round(dias.reduce((a,d)=>a+(d.revenue_fnb||0),0)),
              };
            }).filter(d=>d.revHab+d.revFnb>0);
            return (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={revPorMes} barSize={18} barCategoryGap="32%">
                <defs>
                  <linearGradient id="gradHab" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#1A7A3C" stopOpacity={1}/>
                    <stop offset="100%" stopColor="#1A7A3C" stopOpacity={0.7}/>
                  </linearGradient>
                  <linearGradient id="gradFnb" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#B8860B" stopOpacity={0.9}/>
                    <stop offset="100%" stopColor="#B8860B" stopOpacity={0.55}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={C.border} vertical={false}/>
                <XAxis dataKey="mes" tick={{ fill: C.textLight, fontSize: 11 }} axisLine={false} tickLine={false}/>
                <YAxis tick={{ fill: C.textLight, fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v=>v>=1000?`${(v/1000).toFixed(0)}k€`:v} width={48}/>
                <Tooltip content={<CustomTooltip/>} cursor={false}/>
                <Bar dataKey="revHab" name="Hab."   stackId="a" fill="url(#gradHab)" radius={[0,0,0,0]} activeBar={false}/>
                <Bar dataKey="revFnb" name="F&B"    stackId="a" fill="url(#gradFnb)" radius={[4,4,0,0]} activeBar={false}/>
                <Legend wrapperStyle={{ fontSize: 11, color: C.textMid, paddingTop: 8 }}/>
              </BarChart>
            </ResponsiveContainer>
            );
          })() : (<>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:10 }}>
              <div style={{ display:"flex", gap:6 }}>
                {[["30dias","Últimos 30 días"],["mes","Mes actual"]].map(([key,label])=>(
                  <button key={key} onClick={()=>setModoVista(key)}
                    style={{ padding:"4px 12px", borderRadius:6, border:`1px solid ${modoVista===key?C.accent:C.border}`, background:modoVista===key?C.accentLight:"transparent", color:modoVista===key?C.accent:C.textLight, fontSize:11, fontWeight:modoVista===key?600:400, cursor:"pointer", fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
                    {label}
                  </button>
                ))}
              </div>
              <div style={{ display:"flex", gap:12, alignItems:"center" }}>
                <div style={{ display:"flex", alignItems:"center", gap:5 }}>
                  <div style={{ width:12, height:10, background:C.accent, borderRadius:2 }}/>
                  <span style={{ fontSize:10, color:C.textMid }}>Actual</span>
                </div>
                <div style={{ display:"flex", alignItems:"center", gap:5 }}>
                  <div style={{ width:18, height:2, background:"#D32F2F", borderRadius:1 }}/>
                  <span style={{ fontSize:10, color:C.textMid }}>Año anterior</span>
                </div>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <ComposedChart data={chartData}>
                <defs>
                  <linearGradient id="kpiGradBar" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#004B87" stopOpacity={0.9}/>
                    <stop offset="100%" stopColor="#004B87" stopOpacity={0.55}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={C.border} vertical={false}/>
                <XAxis dataKey="dia" tick={{ fill: C.textLight, fontSize: 11 }} axisLine={false} tickLine={false} interval={modoVista==="mes"?1:4}/>
                <YAxis tick={{ fill: C.textLight, fontSize: 11 }} axisLine={false} tickLine={false} unit={unit}/>
                <Tooltip content={<CustomTooltip unit={unit}/>} cursor={false}/>
                <Bar dataKey={fieldKey} name={kpi} fill="url(#kpiGradBar)" radius={[4,4,0,0]} barSize={modoVista==="mes"?10:6} activeBar={false}/>
                <Line type="monotone" dataKey="ly" name="Año anterior" stroke="#D32F2F" strokeWidth={2} dot={{fill:"#D32F2F", r:3, strokeWidth:0}} activeDot={{r:4}} connectNulls/>
              </ComposedChart>
            </ResponsiveContainer>
          </>)}
        </div>

     </div>
    </div>
  );
}

function KpiCard({ label, subtitle, value, changeLm, upLm, changeLy, upLy, i, onClick, accentColor }) {
  const kpiAccent = accentColor || C.accent;
  return (
    <div onClick={onClick} style={{
      background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 8,
      padding: "14px 18px", animation: `fadeUp 0.5s ease ${i * 0.08}s both`,
      borderLeft: `3px solid ${kpiAccent}`, position: "relative", overflow: "hidden",
      boxShadow: "0 1px 4px rgba(0,0,0,0.06)", cursor: "pointer",
      transition: "box-shadow 0.2s, transform 0.2s, border-color 0.2s, background 0.2s",
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center",
    }}
    onMouseEnter={e=>{
      e.currentTarget.style.boxShadow=`0 6px 24px ${kpiAccent}40`;
      e.currentTarget.style.transform="translateY(-2px)";
      e.currentTarget.style.borderColor=kpiAccent;
      e.currentTarget.style.background=`${kpiAccent}08`;
    }}
    onMouseLeave={e=>{
      e.currentTarget.style.boxShadow="0 1px 4px rgba(0,0,0,0.06)";
      e.currentTarget.style.transform="translateY(0)";
      e.currentTarget.style.borderColor=C.border;
      e.currentTarget.style.borderLeftColor=kpiAccent;
      e.currentTarget.style.background=C.bgCard;
    }}>
      <p style={{ fontSize: 11, color: C.text, textTransform: "uppercase", letterSpacing: "1.5px", fontWeight: 700 }}>{label}</p>
      {subtitle && <p style={{ fontSize: 9, color: C.textMid, marginTop: 1, letterSpacing: "0.5px", opacity: 0.7 }}>{subtitle}</p>}
      <p style={{ fontSize: "clamp(18px,4vw,24px)", fontWeight: 700, fontFamily: "'Plus Jakarta Sans', sans-serif", color: C.text, margin: "5px 0 4px", letterSpacing: "-1px", lineHeight: 1 }}>{value}</p>
    </div>
  );
}

function PeriodSelectorInline({ mes, anio, onChange, aniosDisponibles, allowFuture = false }) {
  const t = useT();
  const hoy = new Date();
  const anioMax = hoy.getFullYear();
  const anios = aniosDisponibles && aniosDisponibles.length > 0 ? aniosDisponibles : [anioMax];
  const MESES_C = t("meses_full");

  const anioAnterior = () => {
    const idx = anios.indexOf(anio);
    if (idx > 0) onChange(mes, anios[idx-1]);
  };
  const anioSiguiente = () => {
    const idx = anios.indexOf(anio);
    if (idx < anios.length-1) onChange(mes, anios[idx+1]);
  };
  const puedeAnterior = anios.indexOf(anio) > 0;
  const puedeSiguiente = anios.indexOf(anio) < anios.length-1;
  const btnFlecha = (activo) => ({ background:"none", border:`1px solid ${activo?C.border:"transparent"}`, borderRadius:6, width:22, height:22, cursor:activo?"pointer":"default", color:activo?C.textMid:C.border, fontSize:13, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 });

  return (
    <div style={{ userSelect:"none" }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:10, marginBottom:8 }}>
        <button onClick={anioAnterior} style={btnFlecha(puedeAnterior)}>‹</button>
        <p style={{ fontSize:13, fontWeight:700, color:C.text, fontFamily:"'Plus Jakarta Sans',sans-serif", minWidth:36, textAlign:"center" }}>{anio}</p>
        <button onClick={anioSiguiente} style={btnFlecha(puedeSiguiente)}>›</button>
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:4 }}>
        {MESES_C.map((m, i) => {
          const futuro = !allowFuture && anio === anioMax && i > hoy.getMonth();
          const activo = i === mes;
          const esHoyMes = i === hoy.getMonth() && anio === hoy.getFullYear();
          return (
            <button key={i} onClick={() => !futuro && onChange(i, anio)}
              style={{
                padding: "5px 4px",
                borderRadius: 6,
                border: esHoyMes && !activo ? `1.5px solid ${C.accent}66` : `1px solid ${activo?C.accent:C.border}`,
                background: activo ? C.accent : "transparent",
                color: futuro ? C.textLight : activo ? "#fff" : C.text,
                fontSize: 11, fontWeight: activo ? 700 : 500, opacity: futuro ? 0.3 : 1,
                cursor: futuro ? "not-allowed" : "pointer",
                fontFamily: "'Plus Jakarta Sans',sans-serif",
                textAlign: "center",
                transition: "all 0.1s",
              }}>
              {m}
            </button>
          );
        })}
      </div>
    </div>
  );
}





function LoadingSpinner() {
  const t = useT();
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: 60 }}>
      <div style={{ color: C.accent, fontFamily: "'Cormorant Garamond', serif", fontSize: 16 }}>{t("cargando_datos")}</div>
    </div>
  );
}

function EmptyState({ mensaje }) {
  const t = useT();
  return (
    <div style={{ textAlign: "center", padding: 60 }}>

      <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 18, fontWeight: 700, color: C.text, marginBottom: 8 }}>{t("sin_datos")}</p>
      <p style={{ fontSize: 13, color: C.textLight }}>{mensaje || t("importa_excel")}</p>
    </div>
  );
}

// ─── IMPORTAR EXCEL ───────────────────────────────────────────────
function ImportarExcel({ onClose, session, onImportado, onProduccionDirecta, hotelNombre: hotelNombreProp, fullPage = false }) {
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

  const vaciarDatos = async () => {
    setVaciando(true);
    try {
      await Promise.all([
        supabase.from("produccion_diaria").delete().eq("hotel_id", session.user.id),
        supabase.from("pickup_entries").delete().eq("hotel_id", session.user.id),
        supabase.from("presupuesto").delete().eq("hotel_id", session.user.id),
      ]);
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
      ]);
      localStorage.removeItem(`fr_import_hist_${session.user.id}`);
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
      const wb = XLSX.read(data, { sheets: ["📅 Producción Diaria", "🎯 Pickup", "🏨 Mi Hotel"] });
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
        const revenue_hab = parseFloat(row[3]) || null;
        const revenue_total = parseFloat(row[4]) || null;
        const revenue_fnb = parseFloat(row[5]) || null;
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
          const estado      = row[7] && typeof row[7] === "string" ? row[7] : "confirmada";
          // Precios por noche desde col I (índice 8) en adelante
          const preciosNoche = [];
          for (let ci = 8; ci < row.length; ci++) {
            const v = row[ci];
            if (typeof v === "number" && v >= 0) preciosNoche.push(Math.round(v * 100) / 100);
            else break;
          }
          const preciosPorNocheVal = preciosNoche.length > 0 ? preciosNoche : null;
          // Si hay precios por noche y no hay precio_total, calcularlo como suma
          const precioTotalFinal = precioTotal ?? (preciosPorNocheVal ? Math.round(preciosPorNocheVal.reduce((a,v)=>a+v,0)*100)/100 : null);
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
        revpar_ppto:    parseFloat(pptoEditValues.revpar_ppto)     || null,
        rev_total_ppto: parseFloat(pptoEditValues.rev_total_ppto)  || null,
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
      const revenue_hab     = parseFloat(prodForm.revenue_hab)     || null;
      const revenue_fnb     = parseFloat(prodForm.revenue_fnb)     || null;
      const revenue_salas   = parseFloat(prodForm.revenue_salas)   || null;
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
      enviarInformeDiario(row);
      const d = new Date(prodForm.fecha + 'T00:00:00');
      const nextDay = new Date(d); nextDay.setDate(d.getDate() + 1);
      if (nextDay.getMonth() !== d.getMonth()) enviarInformeMensual(d.getFullYear(), d.getMonth() + 1);
    } catch(e) { setErrorProd(e.message); }
    setGuardandoProd(false);
  };

  // ── Generar producción mock de ayer ──
  const generarProduccionMock = async () => {
    setGenerandoProdMock(true);
    try {
      const ayer = new Date(); ayer.setDate(ayer.getDate() - 1);
      const ayerStr = `${ayer.getFullYear()}-${String(ayer.getMonth()+1).padStart(2,"0")}-${String(ayer.getDate()).padStart(2,"0")}`;

      // Leer histórico para calcular patrones reales
      const { data: historico } = await supabase.from("produccion_diaria")
        .select("hab_ocupadas,hab_disponibles,revenue_hab,revenue_fnb,revenue_total")
        .eq("hotel_id", session.user.id)
        .limit(90);

      let habDis, mediaOcc, mediaADR, mediaFnbRatio;
      if (historico && historico.length > 10) {
        const conHab = historico.filter(d => d.hab_disponibles > 0);
        habDis = Math.round(conHab.reduce((a, d) => a + d.hab_disponibles, 0) / conHab.length);
        mediaOcc = conHab.reduce((a, d) => a + d.hab_ocupadas / d.hab_disponibles, 0) / conHab.length;
        const conADR = historico.filter(d => d.hab_ocupadas > 0 && d.revenue_hab > 0);
        mediaADR = conADR.length ? conADR.reduce((a, d) => a + d.revenue_hab / d.hab_ocupadas, 0) / conADR.length : 110;
        const conFnb = historico.filter(d => d.revenue_hab > 0);
        mediaFnbRatio = conFnb.length ? conFnb.reduce((a, d) => a + (d.revenue_fnb || 0) / d.revenue_hab, 0) / conFnb.length : 0.15;
      } else {
        habDis = 80; mediaOcc = 0.72; mediaADR = 110; mediaFnbRatio = 0.15;
      }

      const occ = Math.min(1, Math.max(0.3, mediaOcc + (Math.random() - 0.5) * 0.15));
      const hab_ocupadas = Math.round(habDis * occ);
      const adr = Math.round(mediaADR * (0.92 + Math.random() * 0.16) * 100) / 100;
      const revenue_hab = Math.round(hab_ocupadas * adr * 100) / 100;
      const revenue_fnb = Math.round(revenue_hab * mediaFnbRatio * (0.8 + Math.random() * 0.4) * 100) / 100;
      const revenue_total = Math.round((revenue_hab + revenue_fnb) * 100) / 100;
      const revpar = Math.round(revenue_hab / habDis * 100) / 100;
      const trevpar = Math.round(revenue_total / habDis * 100) / 100;

      const row = {
        hotel_id: session.user.id, fecha: ayerStr,
        hab_ocupadas, hab_disponibles: habDis,
        revenue_hab, revenue_fnb, revenue_total,
        adr, revpar, trevpar,
      };

      const { data: existing } = await supabase.from("produccion_diaria")
        .select("id").eq("hotel_id", session.user.id).eq("fecha", ayerStr).maybeSingle();
      const { error } = existing
        ? await supabase.from("produccion_diaria").update(row).eq("hotel_id", session.user.id).eq("fecha", ayerStr)
        : await supabase.from("produccion_diaria").insert(row);
      if (error) throw new Error(error.message);

      setProdRecientes(prev => [row, ...prev.filter(r => r.fecha !== ayerStr)].slice(0, 8));
      if (onProduccionDirecta) onProduccionDirecta(row);
      setOkProdMock(true);
      setTimeout(() => setOkProdMock(false), 4000);
      if (onImportado) onImportado();
    } catch(e) { setErrorProd("Error generando datos: " + e.message); }
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

      const NO_OTA_KEYS = ['directo', 'teléfono', 'telefono', 'email', 'empresa', 'corporativo', 'grupos', 'mice'];
      const isOTA = (canal) => { const c = (canal || '').toLowerCase(); return !NO_OTA_KEYS.some(k => c.includes(k)); };
      const isGrupo = (canal) => { const c = (canal || '').toLowerCase(); return c.includes('grupo') || c.includes('mice'); };
      const normCanal = (canal) => {
        const c = (canal || '').toLowerCase().trim();
        if (c.includes('directo') || c.includes('web')) return 'Directo / Web';
        if (c.includes('teléfono') || c.includes('telefono') || c.includes('email')) return 'Teléfono / Email';
        if (c.includes('empresa') || c.includes('corporativo')) return 'Empresa / Corp.';
        if (c.includes('grupo') || c.includes('mice')) return 'Grupos / MICE';
        return canal || 'Directo / Web';
      };

      const hoyDate = new Date(diaRow.fecha + 'T00:00:00'); hoyDate.setDate(hoyDate.getDate() + 1);
      const hoy = hoyDate.toISOString().slice(0, 10);
      const fin7Date = new Date(hoyDate); fin7Date.setDate(fin7Date.getDate() + 7);
      const hoyMas7 = fin7Date.toISOString().slice(0, 10);

      const [{ data: datosMes }, { data: pickupRows }, { data: pptoData }, { data: pickupMes }, { data: gruposMes }, { data: gruposProx }] = await Promise.all([
        supabase.from("produccion_diaria")
          .select("fecha,hab_ocupadas,hab_disponibles,revenue_hab,revenue_fnb,revenue_total")
          .eq("hotel_id", session.user.id).gte("fecha", inicioMes).lt("fecha", inicioSig)
          .order("fecha", { ascending: true }),
        supabase.from("pickup_entries")
          .select("num_reservas,precio_total,estado")
          .eq("hotel_id", session.user.id).eq("fecha_pickup", diaRow.fecha),
        supabase.from("presupuesto")
          .select("rev_total_ppto,adr_ppto")
          .eq("hotel_id", session.user.id).eq("mes", mesActual).eq("anio", anioActual)
          .maybeSingle(),
        supabase.from("pickup_entries")
          .select("canal,precio_total,num_reservas,estado")
          .eq("hotel_id", session.user.id).gte("fecha_pickup", inicioMes).lt("fecha_pickup", inicioSig)
          .neq("estado", "cancelada"),
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

      const canalMap = {};
      for (const p of (pickupMes || [])) {
        const peso = p.precio_total || (p.num_reservas || 1);
        const key = isOTA(p.canal) ? 'OTAs' : normCanal(p.canal);
        canalMap[key] = (canalMap[key] || 0) + peso;
      }
      const canalesRevenue = Object.entries(canalMap).filter(([,v])=>v>0).sort((a,b)=>b[1]-a[1]).map(([canal,revenue])=>({canal,revenue}));

      let revGrupos = 0;
      for (const g of (gruposMes || [])) {
        const ini = new Date(g.fecha_inicio + 'T00:00:00');
        const fin = new Date(g.fecha_fin + 'T00:00:00');
        const noches = Math.max(1, (fin - ini) / 86400000);
        const peso = g.estado === 'cotizado' ? 0.5 : 1.0;
        revGrupos += ((g.habitaciones || 0) * (g.adr_grupo || 0) * noches + (g.revenue_fnb || 0) + (g.revenue_sala || 0)) * peso;
      }
      const revIndividual = Math.max(0, totRevHab - revGrupos);

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
            revHabMes: totRevHab, revFnbMes: totRevFnb, canalesRevenue, revGruposMes: revGrupos, revIndividualMes: revIndividual,
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
    const revenue_hab     = parseFloat(editValues.revenue_hab)     || null;
    const revenue_total   = parseFloat(editValues.revenue_total)   || null;
    const revenue_fnb     = parseFloat(editValues.revenue_fnb)     || null;
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
      enviarInformeDiario({ fecha: fechaBusqueda, hab_ocupadas, hab_disponibles, revenue_hab, revenue_fnb, revenue_total, adr, revpar, trevpar });
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
            return suma > 0 ? Math.round(suma * 100) / 100 : null;
          }
          return pickupForm.precio_total ? parseFloat(pickupForm.precio_total) : null;
        })(),
        precios_por_noche: preciosDiferentes && preciosPorNoche.length > 0
          ? preciosPorNoche.map(v => parseFloat(v) || 0)
          : null,
        estado:        pickupForm.estado || "confirmada",
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

  // ── Generar pickup mock de ayer basado en histórico ──
  const [generandoMock, setGenerandoMock] = useState(false);
  const [okMock, setOkMock] = useState(false);
  const generarPickupMock = async () => {
    if (!session?.user?.id) { setErrorPickup("Sesión no disponible, recarga la página."); return; }
    setGenerandoMock(true);
    try {
      const ayer = new Date(); ayer.setDate(ayer.getDate() - 1);
      const ayerStr = `${ayer.getFullYear()}-${String(ayer.getMonth()+1).padStart(2,"0")}-${String(ayer.getDate()).padStart(2,"0")}`;

      // Limpiar entradas de ayer y todas las entradas de Grupos/Eventos de cualquier fecha
      await Promise.all([
        supabase.from("pickup_entries")
          .delete()
          .eq("hotel_id", session.user.id)
          .eq("fecha_pickup", ayerStr),
        supabase.from("pickup_entries")
          .delete()
          .eq("hotel_id", session.user.id)
          .ilike("canal", "%grupo%"),
        supabase.from("pickup_entries")
          .delete()
          .eq("hotel_id", session.user.id)
          .ilike("canal", "%evento%"),
      ]);

      // Leer todos los pickup para calcular patrones (excluir grupos/eventos)
      const { data: todos } = await supabase.from("pickup_entries")
        .select("canal,num_reservas,noches,precio_total,estado,fecha_llegada")
        .eq("hotel_id", session.user.id)
        .neq("estado", "cancelada");

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
          { canal:"Booking.com",           peso:0.38 },
          { canal:"Directo / Web",          peso:0.26 },
          { canal:"Expedia",                peso:0.14 },
          { canal:"Empresa / Corporativo",  peso:0.12 },
          { canal:"Tour operador",          peso:0.10 },
        ];
        mediaNoches = 2;
        mediaADR = 120;
      }

      // 3-4 reservas confirmadas + 1-2 cancelaciones
      const plantillaConf = [
        { canal:"Booking.com",          mesesDesde:1, mesesHasta:4,  nochesDef:2, factorADR:0.97 },
        { canal:"Directo / Web",         mesesDesde:2, mesesHasta:6,  nochesDef:3, factorADR:1.05 },
        { canal:"Expedia",               mesesDesde:4, mesesHasta:8,  nochesDef:2, factorADR:0.95 },
        { canal:"Empresa / Corporativo", mesesDesde:1, mesesHasta:3,  nochesDef:1, factorADR:1.10 },
      ];
      const plantillaCancel = [
        { canal:"Booking.com",  mesesDesde:2, mesesHasta:5, nochesDef:2, factorADR:0.97 },
        { canal:"Directo / Web", mesesDesde:3, mesesHasta:7, nochesDef:2, factorADR:1.02 },
      ];
      // Tomar aleatoriamente 3 ó 4 confirmadas y 1 ó 2 canceladas
      const numConf   = Math.random() < 0.5 ? 3 : 4;
      const numCancel = Math.random() < 0.5 ? 1 : 2;
      const shuffled = (arr) => [...arr].sort(() => Math.random() - 0.5);
      const selConf   = shuffled(plantillaConf).slice(0, numConf);
      const selCancel = shuffled(plantillaCancel).slice(0, numCancel);

      const mkFila = ({ canal, mesesDesde, mesesHasta, nochesDef, factorADR }, estado) => {
        const diasOffset = Math.round((mesesDesde * 30) + Math.random() * ((mesesHasta - mesesDesde) * 30));
        const llegada = new Date(ayer); llegada.setDate(llegada.getDate() + diasOffset);
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

      const filas = [
        ...selConf.map(p => mkFila(p, "confirmada")),
        ...selCancel.map(p => mkFila(p, "cancelada")),
      ];

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
    { id:"pickup",      label:"Pick Up",            done: pickupRecientes.length > 0 },
  ];

  const inner = (
    <div style={{ background:H.bg, borderRadius: fullPage ? 0 : 14, width: fullPage ? "100%" : 620, maxWidth: fullPage ? "100%" : "95vw", boxShadow: fullPage ? "none" : "0 20px 60px rgba(0,0,0,0.15)", fontFamily:"'Plus Jakarta Sans',sans-serif", overflow:"hidden", border: fullPage ? "none" : `1px solid ${H.border}` }}>

      {/* Header */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"22px 26px 18px", borderBottom: fullPage ? `1px solid ${H.border}` : "none" }}>
        <h2 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:28, fontWeight:700, color:"#0A0A0A", letterSpacing:0.2 }}>
          Gestión de datos
        </h2>
        <button onClick={onClose} style={{ background:"none", border:`1px solid ${H.border}`, borderRadius:7, padding:"6px 14px", cursor:"pointer", fontSize:12, fontWeight:600, color:H.textMid, fontFamily:"'Plus Jakarta Sans',sans-serif", display:"flex", alignItems:"center", gap:6 }}>
          ← Volver al dashboard
        </button>
      </div>

        {/* Tab cards */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:8, padding:"0 26px 20px" }}>
          {tabs.map(tab => {
            const active = activeBlock === tab.id;
            return (
              <button key={tab.id} onClick={() => setActiveBlockPersist(tab.id)}
                style={{ background: active ? "#EBF2FA" : H.card, border:`1px solid ${active ? H.blue : H.border}`, borderRadius:10, padding:"14px 8px 10px", cursor:"pointer", fontFamily:"'Plus Jakarta Sans',sans-serif", display:"flex", flexDirection:"column", alignItems:"center", gap:7, transition:"all 0.15s", boxShadow: active ? `0 2px 12px rgba(0,75,135,0.12)` : "none" }}>
                {TabIcons[tab.id](active ? H.blue : H.textMid)}
                <span style={{ fontSize:10, fontWeight: active ? 700 : 500, color: active ? H.blue : H.textMid, textAlign:"center", lineHeight:1.2 }}>{tab.label}</span>
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
              {/* Banner datos ya importados */}
              {importStatusPresupuesto && modoPpto === "status" && !confirmEliminarPresupuesto && (
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:10, background:"rgba(0,159,77,0.07)", border:"1px solid rgba(0,159,77,0.25)", borderRadius:10, padding:"12px 16px", marginBottom:16 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={H.green} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                    <div>
                      <p style={{ fontSize:13, fontWeight:700, color:H.green, margin:0 }}>Datos ya importados</p>
                      {importStatusPresupuesto.fecha && <p style={{ fontSize:11, color:H.textMid, margin:0, marginTop:2 }}>{importStatusPresupuesto.fecha}</p>}
                    </div>
                  </div>
                  <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                    <button onClick={() => { setModoPpto("edit"); cargarMesPpto(pptoEditAnio, pptoEditMes); }}
                      style={{ padding:"6px 12px", borderRadius:6, border:`1px solid ${H.border}`, background:"none", color:H.text, fontSize:11, fontWeight:600, cursor:"pointer", fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
                      Editar datos
                    </button>
                    <button onClick={() => setModoPpto("upload")}
                      style={{ padding:"6px 12px", borderRadius:6, border:`1px solid ${H.blue}`, background:"none", color:H.blue, fontSize:11, fontWeight:600, cursor:"pointer", fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
                      Importar nuevos datos
                    </button>
                    <button onClick={() => setConfirmEliminarPresupuesto(true)}
                      style={{ padding:"6px 12px", borderRadius:6, border:`1px solid rgba(211,47,47,0.4)`, background:"none", color:H.red, fontSize:11, fontWeight:600, cursor:"pointer", fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
                      Eliminar datos
                    </button>
                  </div>
                </div>
              )}

              {/* Confirmación eliminar presupuesto */}
              {confirmEliminarPresupuesto && (
                <div style={{ background:"rgba(211,47,47,0.08)", border:"1px solid rgba(211,47,47,0.25)", borderRadius:10, padding:"14px 16px", marginBottom:16 }}>
                  <p style={{ fontSize:13, fontWeight:700, color:H.red, marginBottom:4 }}>¿Eliminar los datos de presupuesto?</p>
                  <p style={{ fontSize:11, color:H.textMid, marginBottom:12 }}>Se eliminarán todos los datos de presupuesto. Esta acción no se puede deshacer.</p>
                  <div style={{ display:"flex", gap:8 }}>
                    <button onClick={() => setConfirmEliminarPresupuesto(false)} style={{ padding:"6px 14px", borderRadius:6, border:`1px solid ${H.border}`, background:H.card2, color:H.textMid, fontSize:11, cursor:"pointer", fontFamily:"'Plus Jakarta Sans',sans-serif" }}>Cancelar</button>
                    <button onClick={eliminarPresupuesto} disabled={eliminandoPresupuesto} style={{ padding:"6px 14px", borderRadius:6, border:"none", background:H.red, color:"#fff", fontSize:11, fontWeight:700, cursor:eliminandoPresupuesto?"not-allowed":"pointer", fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
                      {eliminandoPresupuesto ? "Eliminando…" : "Sí, eliminar"}
                    </button>
                  </div>
                </div>
              )}

              {/* Zona de subida */}
              {(!importStatusPresupuesto || modoPpto === "upload") && !confirmEliminarPresupuesto && modoPpto !== "edit" && (
                <div>
                  {modoPpto === "upload" && (
                    <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:12 }}>
                      <button onClick={() => setModoPpto("status")} style={{ padding:"5px 12px", borderRadius:6, border:`1px solid ${H.border}`, background:"none", color:H.textMid, fontSize:11, cursor:"pointer", fontFamily:"'Plus Jakarta Sans',sans-serif" }}>← Volver</button>
                      <span style={{ fontSize:12, fontWeight:600, color:H.text }}>Importar nuevos datos de presupuesto</span>
                    </div>
                  )}
                  {importStatusPresupuesto === null && (
                    <p style={{ fontSize:12, color:H.textMid, marginBottom:12 }}>Comprobando datos…</p>
                  )}
                  {importStatusPresupuesto !== null && (
                    <>
                      <p style={{ fontSize:12, color:H.textMid, marginBottom:16, lineHeight:1.5 }}>{t("imp_ppto_sub")}</p>
                      <UploadZone
                        id="excel-input-ppto"
                        loading={loadingPpto} resultado={resultadoPpto ? true : null} error={errorPpto}
                        progreso={progresoPpto} progresoPct={progresoPctPpto}
                        onFile={procesarPresupuesto}
                        okContent={<p style={{ color:H.green, fontSize:12 }}>✓ {resultadoPpto?.presupuesto} {t("meses_presupuesto")}</p>}
                      />
                    </>
                  )}
                </div>
              )}

              {/* ── Editar mes de presupuesto ── */}
              {modoPpto === "edit" && !confirmEliminarPresupuesto && (
                <div>
                  <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:14 }}>
                    <button onClick={() => setModoPpto("status")} style={{ padding:"5px 12px", borderRadius:6, border:`1px solid ${H.border}`, background:"none", color:H.textMid, fontSize:11, cursor:"pointer", fontFamily:"'Plus Jakarta Sans',sans-serif" }}>← Volver</button>
                    <span style={{ fontSize:12, fontWeight:600, color:H.text }}>Editar datos de presupuesto</span>
                  </div>
                  <p style={{ fontSize:12, color:H.textMid, marginBottom:14 }}>Selecciona el año y mes para editar sus objetivos. Si no existe, se creará.</p>

                  {/* Selección año/mes */}
                  <div style={{ display:"flex", gap:8, marginBottom:14 }}>
                    <div style={{ flex:1 }}>
                      <label style={labelStyle}>Año</label>
                      <select value={pptoEditAnio} onChange={e => { const a = parseInt(e.target.value); setPptoEditAnio(a); cargarMesPpto(a, pptoEditMes); }} style={{...inputStyle, cursor:"pointer"}}>
                        {[new Date().getFullYear()-1, new Date().getFullYear(), new Date().getFullYear()+1].map(a => <option key={a} value={a}>{a}</option>)}
                      </select>
                    </div>
                    <div style={{ flex:2 }}>
                      <label style={labelStyle}>Mes</label>
                      <select value={pptoEditMes} onChange={e => { const m = parseInt(e.target.value); setPptoEditMes(m); cargarMesPpto(pptoEditAnio, m); }} style={{...inputStyle, cursor:"pointer"}}>
                        {["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"].map((mn,i) => <option key={i+1} value={i+1}>{mn}</option>)}
                      </select>
                    </div>
                  </div>

                  {/* Campos */}
                  <div style={{ background:H.card2, border:`1px solid ${H.border}`, borderRadius:10, padding:"14px" }}>
                    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"8px 12px", marginBottom:12 }}>
                      {[
                        { label:"OCC % objetivo",       key:"occ_ppto",       placeholder:"72.5" },
                        { label:"ADR € objetivo",        key:"adr_ppto",       placeholder:"120.00" },
                        { label:"RevPAR € objetivo",     key:"revpar_ppto",    placeholder:"86.40" },
                        { label:"Revenue Total € objetivo", key:"rev_total_ppto", placeholder:"250000" },
                      ].map(({ label, key, placeholder }) => (
                        <div key={key}>
                          <label style={labelStyle}>{label}</label>
                          <input type="number" min="0" step="0.01" value={pptoEditValues[key]} placeholder={placeholder}
                            onChange={e => setPptoEditValues(v => ({...v, [key]: e.target.value}))}
                            style={inputStyle} />
                        </div>
                      ))}
                    </div>
                    {okEditPpto && <p style={{ fontSize:11, color:H.green, marginBottom:8 }}>✓ Datos guardados</p>}
                    {errorEditPpto && <p style={{ fontSize:11, color:H.red, marginBottom:8 }}>{errorEditPpto}</p>}
                    <button onClick={guardarMesPpto} disabled={pptoEditLoading}
                      style={{ width:"100%", padding:"9px", background:H.blue, color:"#fff", border:"none", borderRadius:7, fontSize:12, fontWeight:700, cursor:pptoEditLoading?"not-allowed":"pointer", fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
                      {pptoEditLoading ? "Guardando…" : "Guardar cambios"}
                    </button>
                  </div>
                </div>
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
                  {okProdMock && <span style={{ fontSize:11, color:H.green, fontWeight:600 }}>✓ Producción de ayer generada</span>}
                  <button onClick={generarProduccionMock} disabled={generandoProdMock}
                    style={{ padding:"6px 13px", borderRadius:6, border:`1px solid ${H.border}`, background:H.card, color:H.textMid, fontSize:11, fontWeight:600, cursor:generandoProdMock?"not-allowed":"pointer", fontFamily:"'Plus Jakarta Sans',sans-serif", whiteSpace:"nowrap" }}>
                    {generandoProdMock ? "Generando…" : "⚡ Generar producción de ayer"}
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
                            <p style={{ fontSize:16, fontWeight:700, color:H.accent, fontFamily:"'Cormorant Garamond',serif" }}>{v}</p>
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                </div>
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
                          <span style={{ color:H.text, fontWeight:600, minWidth:90 }}>{r.fecha}</span>
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
          {activeBlock === "pickup" && (
            <div>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:16, flexWrap:"wrap", gap:8 }}>
                <p style={{ fontSize:12, color:H.textMid, lineHeight:1.5, margin:0 }}>Añade el pick up diario de reservas en el mismo formato que el Excel.</p>
                <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                  {okMock && <span style={{ fontSize:11, color:H.green, fontWeight:600 }}>✓ Pickup de ayer generado</span>}
                  <button onClick={generarPickupMock} disabled={generandoMock}
                    style={{ padding:"6px 13px", borderRadius:6, border:`1px solid ${H.border}`, background:H.card, color:H.textMid, fontSize:11, fontWeight:600, cursor:generandoMock?"not-allowed":"pointer", fontFamily:"'Plus Jakarta Sans',sans-serif", whiteSpace:"nowrap" }}>
                    {generandoMock ? "Generando…" : "⚡ Generar pickup de ayer"}
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
                      <option value="Directo / Web">Directo / Web</option>
                      <option value="Teléfono / Email">Teléfono / Email</option>
                      <option value="Booking.com">Booking.com</option>
                      <option value="Expedia">Expedia</option>
                      <option value="Airbnb">Airbnb</option>
                      <option value="Hotelbeds">Hotelbeds</option>
                      <option value="GDS">GDS</option>
                      <option value="Tour operador">Tour operador</option>
                      <option value="Agencia de viajes">Agencia de viajes</option>
                      <option value="Empresa / Corporativo">Empresa / Corporativo</option>
                      <option value="Grupos / MICE">Grupos / MICE</option>
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
                    <select value={pickupForm.estado}
                      onChange={e => setPickupForm(f=>({...f, estado:e.target.value}))}
                      style={{...inputStyle, cursor:"pointer"}}>
                      <option value="confirmada">Confirmada</option>
                      <option value="cancelada">Cancelada</option>
                    </select>
                  </div>
                </div>
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
                        <span style={{ color:H.text, minWidth:80 }}>{r.fecha_llegada}</span>
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
            <p style={{ fontSize: 24, fontWeight: 700, fontFamily: "'Cormorant Garamond', serif", color: C.text, marginTop: 6 }}>{k.value}</p>
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
                const habDis  = d.hab_disponibles || 30;
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
    const habDis = d.hab_disponibles||30;
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
function DesgloseMovimientoView({ datos, tipo, onBack }) {
  const pickupEntries = datos.pickupEntries || [];
  const _p = n => String(n).padStart(2,"0");
  const hoy = new Date();
  const hoyStr = `${hoy.getFullYear()}-${_p(hoy.getMonth()+1)}-${_p(hoy.getDate())}`;
  const TITULOS = { entradas:"Entradas hoy", salidas:"Salidas hoy" };

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
    if (tipo === "estancias") return fl < hoyStr && fs > hoyStr;
    return false;
  }).sort((a,b) => (a.canal||"").localeCompare(b.canal||""));

  const total = reservas.reduce((a,e) => a + (e.num_reservas||1), 0);

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:20 }}>
      <div style={{ display:"flex", alignItems:"center", gap:16 }}>
        <button onClick={onBack} style={{ background:C.bgCard, border:`1px solid ${C.border}`, borderRadius:8, padding:"8px 16px", cursor:"pointer", fontSize:13, color:C.textMid, fontFamily:"'Plus Jakarta Sans',sans-serif", display:"flex", alignItems:"center", gap:6 }}>← Volver</button>
        <div>
          <h2 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:24, fontWeight:700, color:C.text, margin:0 }}>{TITULOS[tipo]}</h2>
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
                    {["Canal","Llegada","Salida","Noches","Habitaciones","Precio total"].map(h => (
                      <th key={h} style={{ padding:"10px 16px", textAlign:"left", fontSize:10, fontWeight:600, color:C.textLight, textTransform:"uppercase", letterSpacing:"1px", borderBottom:`2px solid ${C.border}`, whiteSpace:"nowrap" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {reservas.map((e, i) => (
                    <tr key={i} style={{ borderBottom:`1px solid ${C.border}`, background: i%2===0 ? C.bg : C.bgCard }}>
                      <td style={{ padding:"11px 16px", fontWeight:600, color:C.text }}>{e.canal || "—"}</td>
                      <td style={{ padding:"11px 16px", color:C.textMid }}>{String(e.fecha_llegada||"").slice(0,10)}</td>
                      <td style={{ padding:"11px 16px", color:C.textMid }}>{getFechaSalida(e) || "—"}</td>
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
    </div>
  );
}

function DashboardView({ datos, mes, anio, onPeriodo, onMesDetalle, onDesgloseMovimiento, kpiModal, setKpiModal, kpiModalExterno, onKpiModalExternoHandled, onNavigarGrupos }) {
  const t = useT();
  const { produccion } = datos;
  const pickupEntries = datos.pickupEntries || [];
  const presupuesto   = datos.presupuesto   || [];
  const [hmMesSel, setHmMesSel] = useState(null);
  const [modalDiario, setModalDiario] = useState(null); // {mesIdx, anioIdx}

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
  const [metricaSel, setMetricaSel] = useState("adr_occ");
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
  const [hmDayModal, setHmDayModal] = useState(null); // iso string
  useEffect(() => { setHmDragStart(null); setHmDragEnd(null); setHmIsDragging(false); setHmModoCrear(false); setHmDayModal(null); }, [hmMesSel]);
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

  if (!produccion || produccion.length === 0) return <EmptyState />;

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
      adr: d.hab_ocupadas > 0 ? Math.round(d.revenue_hab / d.hab_ocupadas) : 0,
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
      <div className="dash-header" style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:16, paddingBottom:14, borderBottom:`1px solid ${C.border}` }}>
        <div>
          <p style={{ fontSize:22, fontWeight:800, color:C.text, fontFamily:"'Plus Jakarta Sans',sans-serif", letterSpacing:-0.5, marginBottom:2 }}>
            {t("bienvenido")}, <span style={{ color:C.text }}>{datos.hotel?.nombre || "Mi Hotel"}</span>
          </p>
          <div style={{ display:"flex", alignItems:"baseline", gap:10 }}>
            <h2 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:28, fontWeight:700, color:C.text, margin:0, letterSpacing:-0.5 }}>
              {t("meses_full")[mes]}
            </h2>
            <span style={{ fontSize:20, fontWeight:400, color:C.textLight }}>{anio}</span>
          </div>
        </div>
        <PeriodSelectorInline mes={mes} anio={anio} onChange={onPeriodo} aniosDisponibles={[...new Set((datos.produccion||[]).map(d=>new Date(d.fecha+"T00:00:00").getFullYear()))].sort()} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(clamp(140px,40vw,200px), 1fr))", gap: 10, marginBottom: 8 }}>
        {kpis.map((k, i) => <KpiCard key={i} {...k} i={i} onClick={()=>setKpiModal(k.kpiKey)} />)}
      </div>

      <p style={{ fontSize: 11, color: C.textLight, marginBottom: 20, marginTop: 0 }}>
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
        const otbDia = {};
        (datos.pickupEntries||[]).forEach(e => {
          const est = e.estado||"confirmada";
          if (est === "cancelada" || est === "tentativo") return;
          const f = String(e.fecha_llegada||"").slice(0,10);
          if (!f||f.length<10) return;
          otbDia[f] = (otbDia[f]||0)+(e.num_reservas||1);
        });
        const occPorMes = MESES_H.map((label, mi) => {
          const d = produccion.filter(r => {
            const f = new Date(r.fecha+"T00:00:00");
            return f.getMonth()===mi && f.getFullYear()===anio;
          });
          const habOcu = d.reduce((a,r)=>a+(r.hab_ocupadas||0),0);
          const habDis = d.reduce((a,r)=>a+(r.hab_disponibles||0),0);
          // Año anterior
          const dLY = produccion.filter(r => {
            const f = new Date(r.fecha+"T00:00:00");
            return f.getMonth()===mi && f.getFullYear()===anio-1;
          });
          const habOcuLY = dLY.reduce((a,r)=>a+(r.hab_ocupadas||0),0);
          const habDisLY = dLY.reduce((a,r)=>a+(r.hab_disponibles||0),0);
          const occLY = habDisLY>0 ? habOcuLY/habDisLY*100 : null;
          if (habDis>0) return { label, mi, occ: habOcu/habDis*100, occLY, esOtb: false };
          // Mes futuro: sumar reservas OTB del pickup
          const mesStr = `${anio}-${_pad(mi+1)}`;
          const diasMes = new Date(anio, mi+1, 0).getDate();
          const ultimoDia = `${mesStr}-${_pad(diasMes)}`;
          if (ultimoDia < _hoyStr) return { label, mi, occ: null, occLY, esOtb: false };
          // Calcular habH desde produccion si no viene del hotel
          const habFromProd = produccion.length > 0
            ? Math.round(produccion.reduce((a,r)=>a+(r.hab_disponibles||0),0)/produccion.length)
            : 30;
          const habH = (datos.hotel?.habitaciones && datos.hotel.habitaciones > 0)
            ? datos.hotel.habitaciones
            : habFromProd;
          let totalRes = 0;
          for (let di=1; di<=diasMes; di++) {
            const iso = `${mesStr}-${_pad(di)}`;
            totalRes += otbDia[iso] || 0;
          }
          const occ = habH > 0 ? (totalRes / (habH * diasMes) * 100) : null;
          return { label, mi, occ: totalRes>0 ? occ : null, occLY, esOtb: true };
        });

        // Color heatmap — verde (baja) → amarillo → rojo (alta ocupación)
        const heatColor = (occ) => {
          if (occ==null) return C.border;
          if (occ<25)  return "#81C784";
          if (occ<40)  return "#4CAF50";
          if (occ<55)  return "#FFC107";
          if (occ<70)  return "#FF7043";
          if (occ<85)  return "#E53935";
          return "#B71C1C";
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


        // ADR desde pickup para un día ISO (usa precios_por_noche si disponible, sino precio_total/noches)
        const calcAdrPickup = (iso) => {
          const activas = pickupEntries.filter(e => {
            const est = e.estado||"confirmada";
            if (est === "cancelada" || est === "tentativo") return false;
            const fl = String(e.fecha_llegada||"").slice(0,10);
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
        };

        // Habitaciones pernoctando por día (confirmadas, sin tentativos ni canceladas)
        // Deduplicar por (fecha_llegada|canal|fecha_salida) conservando pickup más reciente
        const habPorDia = {};
        if (hmMesSel != null) {
          const padM = n => String(n).padStart(2,"0");
          const mesStr = `${anio}-${padM(hmMesSel+1)}`;
          const diasEnMes = new Date(anio, hmMesSel+1, 0).getDate();
          const mesInicio  = `${mesStr}-01`;
          const mesFin     = `${mesStr}-${padM(diasEnMes)}`;
          const mesFinPlus1 = hmMesSel === 11 ? `${anio+1}-01-01` : `${anio}-${padM(hmMesSel+2)}-01`;

          const isoLocal = d => `${d.getFullYear()}-${padM(d.getMonth()+1)}-${padM(d.getDate())}`;
          const getFsSt = e => {
            if (e.fecha_salida) return String(e.fecha_salida).slice(0,10);
            if (e.noches && e.fecha_llegada) { const d=new Date(String(e.fecha_llegada).slice(0,10)+"T00:00:00"); d.setDate(d.getDate()+Number(e.noches)); return isoLocal(d); }
            return null;
          };
          // Dedup
          const dd = {};
          pickupEntries.forEach(e => {
            const est = e.estado||"confirmada";
            if (est === "cancelada" || est === "tentativo") return;
            const fl = String(e.fecha_llegada||"").slice(0,10);
            const fs = getFsSt(e) || "";
            const key = e._grupo ? `_g|${fl}|${e.canal||""}` : `${fl}|${e.canal||""}|${fs}`;
            const fp = String(e.fecha_pickup||"").slice(0,10);
            if (!dd[key] || fp > dd[key]._fp) dd[key] = { ...e, _fp: fp, _fs: fs };
          });
          Object.values(dd).forEach(e => {
            const fl = String(e.fecha_llegada||"").slice(0,10);
            const fs = e._grupo ? fl : (e._fs || "");  // grupos: una entrada = una noche
            if (!fl || (!e._grupo && !fs)) return;
            const nr = e.num_reservas || 1;
            if (e._grupo) {
              // entrada sintética ya representa exactamente una noche
              if (fl >= mesInicio && fl <= mesFin) habPorDia[fl] = (habPorDia[fl]||0) + nr;
            } else {
              // iterar noches que cubre dentro del mes (end exclusivo → usar mesFinPlus1 como tope)
              const start = fl < mesInicio   ? mesInicio   : fl;
              const end   = fs > mesFinPlus1 ? mesFinPlus1 : fs;
              let cur = new Date(start+"T00:00:00");
              const endD = new Date(end+"T00:00:00");
              while (cur < endD) {
                const iso = isoLocal(cur);
                habPorDia[iso] = (habPorDia[iso]||0) + nr;
                cur.setDate(cur.getDate()+1);
              }
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
            const neto  = netoPorDia[iso] || 0;
            let occ=null, adr=null;
            if (prod) {
              occ = prod.hab_disponibles>0 ? Math.min(100,prod.hab_ocupadas/prod.hab_disponibles*100) : null;
              adr = prod.hab_ocupadas>0    ? (prod.revenue_hab/prod.hab_ocupadas) : null;
            } else if (iso >= hoyStr2) {
              occ = neto>0 ? Math.min(100, neto/habHotel*100) : null;
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
                      style={{ padding:"5px 12px", borderRadius:7, border:`1.5px solid ${hmModoCrear?"#3B82F6":C.border}`, background:hmModoCrear?"#3B82F618":C.bg, color:hmModoCrear?"#3B82F6":C.textMid, fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:"inherit", display:"flex", alignItems:"center", gap:5, transition:"all 0.15s" }}>
                      <span style={{ fontSize:14 }}>+</span> Nuevo evento/grupo
                    </button>
                  </div>
                </div>

                {/* Content row */}
                <div style={{ flex:1, display:"flex", overflow:"hidden" }}>

                  {/* Left: day grid */}
                  <div style={{ flex:1, padding:"20px 24px", overflowY:"auto", minWidth:0 }}>

                    {/* Días semana */}
                    <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:4, marginBottom:4, maxWidth:560 }}>
                      {t("dias_semana").map(d=>(
                        <p key={d} style={{ fontSize:10, color:C.textLight, textAlign:"center", fontWeight:600 }}>{d}</p>
                      ))}
                    </div>

                    {/* Grid días */}
                    <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:4, maxWidth:560 }} onMouseLeave={()=>{ if(hmIsDragging){ setHmIsDragging(false); } }}>
                      {Array.from({length:(diasDelMes[0]?.diaSem===0?6:diasDelMes[0]?.diaSem-1)||0},(_,i)=>(
                        <div key={"e"+i} style={{ aspectRatio:"1" }}/>
                      ))}
                      {diasDelMes.map(({dia,occ,adr,esFut,resUltDia})=>{
                        const resDia = resUltDia || 0;
                        const tieneReserva = resDia > 0;
                        const _pad2 = n=>String(n).padStart(2,"0");
                        const isoDay = hmMesSel!=null ? `${anio}-${_pad2(hmMesSel+1)}-${_pad2(dia)}` : "";
                        const inSel = hmModoCrear && hmIsDragging && hmDragStart!=null && hmDragEnd!=null &&
                          dia >= Math.min(hmDragStart,hmDragEnd) && dia <= Math.max(hmDragStart,hmDragEnd);
                        const isDaySelected = hmDayModal === isoDay;
                        const evDay = hmEvents.filter(ev => ev.from <= isoDay && ev.to >= isoDay);
                        const borderColor = isDaySelected ? C.accent : inSel ? "#3B82F6" : tieneReserva ? "#B8860B" : occ!=null ? heatColor(occ)+"CC" : C.border;
                        const bg = isDaySelected ? C.accentLight : inSel ? "#3B82F618" : occ!=null ? heatBg(occ) : C.bg;
                        return (
                          <div key={dia}
                            style={{ aspectRatio:"1", borderRadius:5, background: bg, border:`${inSel||isDaySelected?"2px":"1.5px"} solid ${borderColor}`, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:1, position:"relative", cursor: hmModoCrear ? "crosshair" : "pointer", userSelect:"none" }}
                            onClick={()=>{ if (!hmModoCrear) { setHmDayModal(isoDay === hmDayModal ? null : isoDay); } }}
                            onMouseDown={(e)=>{ if (!hmModoCrear) return; e.preventDefault(); setHmDragStart(dia); setHmDragEnd(dia); setHmIsDragging(true); }}
                            onMouseEnter={()=>{ if(hmModoCrear && hmIsDragging) setHmDragEnd(dia); }}
                            onMouseUp={()=>{
                              if(hmModoCrear && hmIsDragging){
                                setHmIsDragging(false);
                                const from=Math.min(hmDragStart||dia,dia), to=Math.max(hmDragStart||dia,dia);
                                if(from!==to){
                                  setHmSelRango({ fromISO:`${anio}-${_pad2(hmMesSel+1)}-${_pad2(from)}`, toISO:`${anio}-${_pad2(hmMesSel+1)}-${_pad2(to)}` });
                                }
                              }
                            }}>
                            {tieneReserva && (
                              <span style={{ position:"absolute", top:2, right:2, fontSize:8, lineHeight:1, animation:"pulse-rayo 1.5s ease-in-out infinite" }}>⚡</span>
                            )}
                            {evDay.length>0 && (
                              <div style={{ position:"absolute", bottom:2, left:2, right:2, display:"flex", gap:1, justifyContent:"center" }}>
                                {evDay.map((ev,ei)=><span key={ei} style={{ width:8, height:8, borderRadius:"50%", background:ev.color, display:"inline-block", flexShrink:0 }}/>)}
                              </div>
                            )}
                            <p style={{ fontSize:8, color:C.text, lineHeight:1, fontWeight:600 }}>{dia}</p>
                            {occ!=null
                              ? <p style={{ fontSize:11, fontWeight:800, color:"#111", lineHeight:1 }}>{occ.toFixed(0)}%</p>
                              : <p style={{ fontSize:8, color:C.border }}>—</p>
                            }
                            {adr && !esFut && <p style={{ fontSize:7, color:C.textMid, lineHeight:1, fontWeight:600 }}>€{Math.round(adr)}</p>}
                            {resDia!==0 && <p style={{ fontSize:7, color:tieneReserva?"#B8860B":C.red, fontWeight:700, lineHeight:1 }}>{resDia>0?"+":""}{resDia}</p>}
                          </div>
                        );
                      })}
                    </div>

                    {/* Leyenda */}
                    <div style={{ marginTop:12, display:"flex", flexWrap:"wrap", gap:8, alignItems:"center", maxWidth:560 }}>
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

                  {/* Separator */}
                  <div style={{ width:1, background:C.border, flexShrink:0 }} />

                  {/* Right: grupos y eventos del mes */}
                  {(() => {
                    const _pad2 = n=>String(n).padStart(2,"0");
                    const mesPrefix = `${anio}-${_pad2(hmMesSel+1)}`;
                    const CATCOLORS = { corporativo:"#2B7EC1", boda:"#D4547A", feria:"#E85D04", deportivo:"#059669", otros:"#7C3AED", evento:"#0A7C6A" };
                    const gruposMes = (datos.grupos||[]).filter(g => {
                      const ini = (g.fecha_inicio||"").slice(0,7);
                      const fin = (g.fecha_fin||g.fecha_inicio||"").slice(0,7);
                      return ini <= mesPrefix && fin >= mesPrefix;
                    }).sort((a,b)=>a.fecha_inicio>b.fecha_inicio?1:-1);
                    const evMes = hmEvents.map((ev,idx)=>({...ev,idx})).filter(ev => ev.from.slice(0,7)===mesPrefix || ev.to.slice(0,7)===mesPrefix);
                    const totalRevGrupos = gruposMes.reduce((sum,g)=>{
                      const ini = new Date((g.fecha_inicio||mesPrefix+"-01")+"T00:00:00");
                      const fin = new Date((g.fecha_fin||g.fecha_inicio||mesPrefix+"-01")+"T00:00:00");
                      const noches = Math.max(1,(fin-ini)/86400000);
                      const peso = g.estado==="cotizado"?0.5:1.0;
                      return sum + ((g.habitaciones||0)*(g.adr_grupo||0)*noches+(g.revenue_fnb||0)+(g.revenue_sala||0))*peso;
                    },0);
                    return (
                      <div style={{ width:340, padding:"20px 20px", overflowY:"auto", flexShrink:0 }}>
                        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:14 }}>
                          <p style={{ fontSize:13, fontWeight:700, color:C.text }}>Grupos y eventos</p>
                          {totalRevGrupos>0 && (
                            <span style={{ fontSize:11, fontWeight:700, color:C.accent }}>
                              €{Math.round(totalRevGrupos).toLocaleString("es-ES")}
                            </span>
                          )}
                        </div>

                        {gruposMes.length===0 && evMes.length===0 && (
                          <p style={{ fontSize:12, color:C.textLight, textAlign:"center", marginTop:40 }}>Sin grupos ni eventos este mes</p>
                        )}

                        {gruposMes.map((g,i)=>{
                          const cat = g.categoria||"otros";
                          const color = CATCOLORS[cat]||CATCOLORS.otros;
                          const esEvento = cat==="evento";
                          const ini = new Date((g.fecha_inicio||"")+"T00:00:00");
                          const fin = new Date((g.fecha_fin||g.fecha_inicio||"")+"T00:00:00");
                          const noches = Math.max(1,(fin-ini)/86400000);
                          const peso = g.estado==="cotizado"?0.5:1.0;
                          const rev = ((g.habitaciones||0)*(g.adr_grupo||0)*noches+(g.revenue_fnb||0)+(g.revenue_sala||0))*peso;
                          const estadoBadge = { confirmado:"#059669", cotizado:"#D97706", perdido:C.red, cancelado:C.red }[g.estado]||C.textLight;
                          return (
                            <div key={g.id||i} style={{ background:C.bgCard, borderRadius:9, padding:"10px 12px", marginBottom:8, borderLeft:`3px solid ${color}` }}>
                              <div style={{ display:"flex", alignItems:"flex-start", gap:8 }}>
                                <div style={{ flex:1, minWidth:0 }}>
                                  <p style={{ fontSize:12, fontWeight:700, color:C.text, marginBottom:2, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{g.nombre||"(sin nombre)"}</p>
                                  <div style={{ display:"flex", gap:6, flexWrap:"wrap", alignItems:"center" }}>
                                    <span style={{ fontSize:10, color:C.textLight }}>
                                      {(g.fecha_inicio||"").slice(8,10)}/{(g.fecha_inicio||"").slice(5,7)}
                                      {!esEvento && g.fecha_fin && g.fecha_fin!==g.fecha_inicio && ` – ${g.fecha_fin.slice(8,10)}/${g.fecha_fin.slice(5,7)}`}
                                    </span>
                                    {!esEvento && g.habitaciones>0 && (
                                      <span style={{ fontSize:10, color:C.textLight }}>{g.habitaciones} hab · {noches} noche{noches!==1?"s":""}</span>
                                    )}
                                    <span style={{ fontSize:9, fontWeight:700, color:estadoBadge, textTransform:"capitalize" }}>{g.estado||""}</span>
                                  </div>
                                </div>
                                {rev>0 && (
                                  <span style={{ fontSize:12, fontWeight:700, color:C.text, flexShrink:0 }}>
                                    €{Math.round(rev).toLocaleString("es-ES")}
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}

                        {evMes.length>0 && (
                          <>
                            {gruposMes.length>0 && <div style={{ height:1, background:C.border, margin:"10px 0" }}/>}
                            <p style={{ fontSize:11, fontWeight:600, color:C.textLight, marginBottom:8 }}>Eventos manuales</p>
                            {evMes.map(ev=>(
                              <div key={ev.idx} style={{ display:"flex", alignItems:"center", gap:8, marginBottom:6, background:C.bgCard, borderRadius:7, padding:"7px 10px" }}>
                                <span style={{ width:8, height:8, borderRadius:2, background:ev.color, display:"inline-block", flexShrink:0 }}/>
                                <span style={{ fontSize:12, fontWeight:600, color:C.text, flex:1, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{ev.title||"(sin título)"}</span>
                                <span style={{ fontSize:10, color:C.textLight, flexShrink:0 }}>
                                  {ev.from.slice(8,10)}/{ev.from.slice(5,7)} – {ev.to.slice(8,10)}/{ev.to.slice(5,7)}
                                </span>
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
            {hmDayModal && hmMesSel!=null && (() => {
              const iso = hmDayModal;
              const diaN = parseInt(iso.slice(8,10));
              const dt = new Date(iso+"T00:00:00");
              const diasSemNombre = ["Dom","Lun","Mar","Mié","Jue","Vie","Sáb"];
              const labelDia = `${diasSemNombre[dt.getDay()]} ${diaN} ${MESES_H[hmMesSel]} ${anio}`;

              const dayData = diasDelMes.find(d => d.dia === diaN);
              const adr = dayData?.adr ?? null;

              const getFechaSalidaD = e => {
                if (e.fecha_salida) return String(e.fecha_salida).slice(0,10);
                if (e.noches && e.fecha_llegada) { const d=new Date(String(e.fecha_llegada).slice(0,10)); d.setDate(d.getDate()+Number(e.noches)); return d.toISOString().slice(0,10); }
                return null;
              };
              // Deduplicar: mismo booking aparece una vez por cada día importado — conservar el más reciente
              const dedupMap = {};
              (pickupEntries||[]).forEach(e => {
                const est = e.estado||"confirmada";
                if (est === "cancelada") return;
                const fl = String(e.fecha_llegada||"").slice(0,10);
                const fs = getFechaSalidaD(e) || "";
                const key = `${fl}|${e.canal||""}|${fs}`;
                const fp = String(e.fecha_pickup||"").slice(0,10);
                if (!dedupMap[key] || fp > dedupMap[key]._fp) dedupMap[key] = { ...e, _fp: fp };
              });
              const activasIso = Object.values(dedupMap).filter(e => {
                if (e._grupo) return String(e.fecha_llegada||"").slice(0,10) === iso;
                const fl = String(e.fecha_llegada||"").slice(0,10);
                const fs = getFechaSalidaD(e);
                return fl && fs && fl <= iso && fs > iso;
              });
              const canalMap = {};
              activasIso.forEach(e => {
                const c = e.canal||"Directo";
                canalMap[c] = (canalMap[c]||0) + (e.num_reservas||1);
              });
              const canales = Object.entries(canalMap).sort((a,b)=>b[1]-a[1]).slice(0,6);
              const totalRes = canales.reduce((a,[,v])=>a+v,0);

              // OCC coherente con el canal breakdown: habitaciones pernoctando / total hotel
              // Para pasado usa producción (más preciso); para futuro calcula desde activasIso
              const dayDataOcc = dayData?.tieneReal ? dayData?.occ ?? null : null;
              const habHotelModal = datos.hotel?.habitaciones || habHotel;
              const occDesdeActivas = habHotelModal > 0 ? Math.min(100, totalRes / habHotelModal * 100) : null;
              const occ = dayDataOcc ?? occDesdeActivas;

              const gruposDia = (datos.grupos||[]).filter(g =>
                g.fecha_inicio <= iso && (g.fecha_fin||g.fecha_inicio) >= iso &&
                (g.estado==="confirmado"||g.estado==="tentativo")
              );

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
                              <span style={{ fontSize:10, padding:"3px 7px", borderRadius:5, background: g.estado==="confirmado"?"#16a34a22":"#ca8a0422", color: g.estado==="confirmado"?"#16a34a":"#ca8a04", fontWeight:700, flexShrink:0 }}>{g.estado}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Origen reservas */}
                      {canales.length > 0 && (
                        <div>
                          <p style={{ fontSize:11, fontWeight:700, color:C.textMid, textTransform:"uppercase", letterSpacing:"1.5px", marginBottom:12 }}>Origen reservas</p>
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

                    {canales.length===0 && gruposDia.length===0 && antelMediaDias==null && (
                      <p style={{ fontSize:13, color:C.textLight, textAlign:"center", padding:"24px 0" }}>Sin datos de reservas para este día</p>
                    )}
                  </div>
                </div>
              );
            })()}

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
            <div style={{ flex:2, padding:"20px 22px", display:"flex", flexDirection:"column" }}>
              <div style={{ marginBottom:14 }}>
                <p style={{ fontSize:11, fontWeight:700, color:C.textMid, textTransform:"uppercase", letterSpacing:"1.5px" }}>
                  {t("ocup_mensual")} <span style={{ color:C.accent }}>| {t("meses_full")[mes].toUpperCase()} {anio}</span>
                </p>
              </div>
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
                      <p style={{ fontSize:9, fontWeight:700, color:C.textLight, textTransform:"uppercase", letterSpacing:0.5, marginBottom:3 }}>{label}</p>
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
              const todasActivas = (pickupEntries||[]).filter(e => !e._grupo && (e.estado||"confirmada") !== "cancelada");

              // Deduplicar: si el Excel usa snapshots diarios de OTB, la misma reserva
              // aparece en múltiples fecha_pickup. Quedarse solo con la entrada más reciente
              // por clave (fecha_llegada + canal + fecha_salida/noches).
              const deduped = {};
              todasActivas.forEach(e => {
                const fl = String(e.fecha_llegada||"").slice(0,10);
                const fs = getFechaSalida(e) || "";
                const key = `${fl}|${e.canal||""}|${fs}`;
                const fp  = String(e.fecha_pickup||"").slice(0,10);
                if (!deduped[key] || fp > deduped[key]._fp) deduped[key] = { ...e, _fp: fp };
              });
              const activas = Object.values(deduped);

              const numEntradas      = activas.filter(e => String(e.fecha_llegada||"").slice(0,10) === hoyStr).reduce((a,e)=>a+(e.num_reservas||1),0);
              const numSalidas       = activas.filter(e => getFechaSalida(e) === hoyStr).reduce((a,e)=>a+(e.num_reservas||1),0);
              const numEntradasAyer  = activas.filter(e => String(e.fecha_llegada||"").slice(0,10) === ayerStr).reduce((a,e)=>a+(e.num_reservas||1),0);
              const numSalidasAyer   = activas.filter(e => getFechaSalida(e) === ayerStr).reduce((a,e)=>a+(e.num_reservas||1),0);

              const proxEntrada = numEntradas===0 ? todasActivas.map(e=>String(e.fecha_llegada||"").slice(0,10)).filter(f=>f>hoyStr).sort()[0]||null : null;
              const proxSalida  = numSalidas===0  ? todasActivas.map(e=>getFechaSalida(e)).filter(f=>f&&f>hoyStr).sort()[0]||null : null;

              const habH = datos.hotel?.habitaciones || 0;
              const netoHoy = habH ? (pickupEntries||[]).reduce((a,e) => {
                if (String(e.fecha_llegada||"").slice(0,10) !== hoyStr) return a;
                return a + (e.num_reservas||1) * ((e.estado||"confirmada")==="cancelada" ? -1 : 1);
              }, 0) : 0;
              const occHoy   = habH ? Math.min(Math.round(Math.max(0,netoHoy)/habH*100),100) : null;
              const occColor = occHoy>=85?"#E53935":occHoy>=70?"#C49A0A":occHoy>=50?C.accent:C.textLight;
              const ayerProd = produccion.find(d => d.fecha === ayerStr);
              const netoAyer = habH ? (pickupEntries||[]).reduce((a,e) => {
                if (String(e.fecha_llegada||"").slice(0,10) !== ayerStr) return a;
                return a + (e.num_reservas||1) * ((e.estado||"confirmada")==="cancelada" ? -1 : 1);
              }, 0) : 0;
              const occAyerOTB = habH ? Math.min(Math.round(Math.max(0,netoAyer)/habH*100),100) : null;
              const occAyer  = ayerProd?.hab_disponibles > 0 ? Math.round(ayerProd.hab_ocupadas / ayerProd.hab_disponibles * 100) : occAyerOTB;

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
                      <svg width="22" height="22" viewBox="0 0 32 32" fill="none">
                        <path d="M4 28V14L16 4l12 10v14" stroke={C.text} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <rect x="11" y="18" width="10" height="10" rx="1" stroke={C.text} strokeWidth="1.8"/>
                        <circle cx="16" cy="13" r="2" stroke={C.text} strokeWidth="1.5"/>
                      </svg>
                      <span style={lbl()}>Ocupación hoy</span>
                      <span style={num()}>{occHoy}%</span>
                      {occAyer !== null ? <Delta hoy={occHoy} ayer={occAyer} unit="%"/> : <span/>}
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
                  <p style={{ fontFamily:"'Cormorant Garamond',serif", fontWeight:700, fontSize:18, color:C.text }}>
                    {metricas.find(m=>m.key===metricaSel)?.label}
                  </p>
                  <div style={{ display:"flex", gap:14 }}>
                    {[
                      { color:"#004B87", opacity:0.75, label:"Ocupación", type:"bar" },
                      { color:"#B8860B", opacity:1,    label:"ADR",       type:"line" },
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
                      <ComposedChart data={porMes} barSize={14} barCategoryGap="32%">
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
                          shape={(p) => <AnimatedBar {...p} onClick={() => { if(p?.mesIdx!=null) setModalDiario({mesIdx:p.mesIdx, anioIdx:p.anioIdx}); }}/>}
                          onClick={(data) => { if(data?.mesIdx!=null) setModalDiario({mesIdx:data.mesIdx, anioIdx:data.anioIdx}); }}
                        />
                        <Line yAxisId="right" dataKey="adr" name="ADR" type="monotone" stroke="#B8860B" strokeWidth={2} dot={{fill:"#B8860B", r:3, strokeWidth:0}} activeDot={{r:4}} isAnimationActive={false}/>
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


      <Card>
        <p style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 700, fontSize: 20, color: C.text, marginBottom: 16 }}>
          {t("ultimos_12m")}
        </p>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
            <thead>
              <tr>
                {[t("th_anio"),t("th_mes"),t("th_ocup"),t("th_adr"),t("th_revpar"),t("th_trevpar"),t("th_rev_hab"),t("th_rev_total")].map((h,hi) => (
                  <th key={h} style={{ padding: "10px 14px", textAlign: hi<=1?"left":"right", fontSize: 10, color: C.textLight, textTransform: "uppercase", letterSpacing: "1px", fontWeight: 600, borderBottom: `2px solid ${C.border}`, whiteSpace: "nowrap" }}>{h}</th>
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
      </Card>
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
            const habDis = r.hab_disponibles||30;
            return {
              dia: f.getDate(),
              label: `${f.getDate()}/${f.getMonth()+1}`,
              fecha: f.toLocaleDateString("es-ES",{day:"numeric",month:"long",year:"numeric"}),
              occ: habDis>0 ? Math.min(100, Math.round(r.hab_ocupadas/habDis*100)) : 0,
              adr: r.hab_ocupadas>0 ? Math.round(r.revenue_hab/r.hab_ocupadas) : 0,
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
                    <Line yAxisId="right" dataKey="adr" name="ADR" type="monotone" stroke="#B8860B" strokeWidth={2} dot={{fill:"#B8860B",r:2,strokeWidth:0}} activeDot={{r:4}}/>
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

  const hoyISO = new Date().toISOString().slice(0,10);
  const [modalNR, setModalNR] = useState(() => { try { return localStorage.getItem("fr_nr_modal") === "1"; } catch { return false; } });
  const setModalNRPersist = (v) => { setModalNR(v); try { localStorage.setItem("fr_nr_modal", v ? "1" : "0"); } catch {} };
  const [nrForm, setNrForm] = useState(() => {
    try { const s = localStorage.getItem("fr_nr_form"); return s ? JSON.parse(s) : { canal:"", num_reservas:"1", fecha_salida:"", noches:"", precio_total:"" }; } catch { return { canal:"", num_reservas:"1", fecha_salida:"", noches:"", precio_total:"" }; }
  });
  const setNrFormPersist = (fn) => setNrForm(prev => { const next = typeof fn === "function" ? fn(prev) : fn; try { localStorage.setItem("fr_nr_form", JSON.stringify(next)); } catch {} return next; });
  const [nrGuardando, setNrGuardando] = useState(false);
  const [nrError, setNrError] = useState("");
  const [nrOk, setNrOk] = useState(false);
  const abrirNuevaReserva = () => { setNrError(""); setNrOk(false); setModalNRPersist(true); };
  const guardarNuevaReserva = async () => {
    setNrGuardando(true); setNrError("");
    try {
      const noches = nrForm.noches ? parseInt(nrForm.noches) : null;
      let fechaSalida = nrForm.fecha_salida || null;
      if (!fechaSalida && noches) { const d = new Date(hoyISO); d.setDate(d.getDate()+noches); fechaSalida = d.toISOString().slice(0,10); }
      const row = {
        hotel_id: session.user.id, fecha_pickup: hoyISO, fecha_llegada: hoyISO,
        canal: nrForm.canal || null, num_reservas: parseInt(nrForm.num_reservas)||1,
        fecha_salida: fechaSalida, noches,
        precio_total: nrForm.precio_total ? parseFloat(nrForm.precio_total) : null,
        estado: "confirmada",
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
  const [reservasVentana, setReservasVentana] = useState("30d"); // "30d" | "year"
  const [reservasVista, setReservasVista]     = useState("count"); // "count"|"adr"|"noches"|"antelacion"
  const [otaDetalle, setOtaDetalle]           = useState(false);

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
  const refDia = hayHoy ? hoyISO : ultDia;
  const reservasUltDia = pickupEntries.filter(e => !esGrupoEvento(e) && String(e.fecha_pickup||"").slice(0,10) === refDia && (e.estado||"confirmada") !== "cancelada").sort((a,b)=>(a.fecha_llegada||"").localeCompare(b.fecha_llegada||""));
  const ultDiaTotal = reservasUltDia.reduce((a,e) => a + (e.num_reservas||1), 0);
  const tituloBloque = refDia === hoyISO ? "Reservas captadas hoy" : "Reservas captadas ayer";
  const fmtDatePU = d => { if (!d) return "—"; const p=d.split("-"); return p.length===3?`${p[2]}/${p[1]}/${p[0]}`:d; };

  const reservasAyer = pickupEntries.filter(e => String(e.fecha_pickup||"").slice(0,10) === ayerStr);

  const normCanal = c => {
    const aliases = { "Directo Web": "Directo", "Teléfono": "Directo" };
    return aliases[c] || c || "Directo";
  };

  const ayerPorMes = {};
  const ayerPorCanal = {};
  let ayerTotal = 0;
  reservasAyer.forEach(e => {
    const fl = String(e.fecha_llegada||"").slice(0,7); // YYYY-MM
    const mes = parseInt(fl.slice(5,7)) - 1;
    const nr = e.num_reservas || 1;
    ayerPorMes[mes] = (ayerPorMes[mes]||0) + nr;
    const canal = normCanal(e.canal);
    ayerPorCanal[canal] = (ayerPorCanal[canal]||0) + nr;
    ayerTotal += nr;
  });

  const CANAL_COLORS = {
    "Booking.com": "#0052CC", "Expedia": "#FFD700",
    "Directo": "#555555", "Agencia": "#7C3AED"
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
  const conNoches = pickupEntries.filter(e => e.noches && e.noches > 0 && (e.estado||"confirmada") !== "cancelada" && normCanal(e.canal) !== "Grupos/Eventos");
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

  // ── Reservas por ventana temporal (30d / año) ──
  const hoyTs = new Date();
  const ventanaMs = reservasVentana === "30d" ? 30 * 86400000 : 365 * 86400000;
  const ventanaDesde = new Date(hoyTs - ventanaMs).toISOString().slice(0,10);
  const reservasVentanaEntries = pickupEntries.filter(e => {
    const fp = String(e.fecha_pickup||"").slice(0,10);
    return fp >= ventanaDesde && (e.estado||"confirmada") !== "cancelada" && normCanal(e.canal) !== "Grupos/Eventos";
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
    return !c.includes("directo") && !c.includes("corporativo") && !c.includes("empresa") && !c.includes("agencia");
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

      {/* Botón Nueva Reserva — independiente, arriba a la izquierda */}
      <div>
        <button onClick={abrirNuevaReserva}
          style={{ display:"inline-flex", alignItems:"center", gap:7, background:C.text, color:"#fff", border:"none", borderRadius:8, padding:"9px 18px", cursor:"pointer", fontSize:12, fontWeight:700, fontFamily:"'Plus Jakarta Sans',sans-serif", letterSpacing:"0.3px" }}>
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><line x1="6.5" y1="1" x2="6.5" y2="12" stroke="#fff" strokeWidth="2" strokeLinecap="round"/><line x1="1" y1="6.5" x2="12" y2="6.5" stroke="#fff" strokeWidth="2" strokeLinecap="round"/></svg>
          Nueva reserva
        </button>
      </div>

      {/* Modal nueva reserva */}
      {modalNR && (
          <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.55)", zIndex:2000, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}
            onClick={e => { if(e.target===e.currentTarget) setModalNRPersist(false); }}>
            <div style={{ background:C.bgCard, borderRadius:14, padding:"28px 32px", width:"100%", maxWidth:420, boxShadow:"0 20px 60px rgba(0,0,0,0.25)" }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
                <p style={{ fontFamily:"'Cormorant Garamond',serif", fontWeight:700, fontSize:18, color:C.text }}>Nueva reserva</p>
                <button onClick={()=>setModalNRPersist(false)} style={{ background:"none", border:`1px solid ${C.border}`, borderRadius:6, width:28, height:28, cursor:"pointer", fontSize:14, color:C.textLight }}>✕</button>
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
                <div style={{ gridColumn:"1/-1" }}>
                  <p style={{ fontSize:10, color:C.textLight, fontWeight:600, textTransform:"uppercase", letterSpacing:"0.8px", marginBottom:4 }}>Fecha pickup & entrada</p>
                  <input type="text" readOnly value={hoyISO} style={{ width:"100%", padding:"8px 10px", borderRadius:7, border:`1px solid ${C.border}`, fontSize:13, background:C.bg, color:C.textMid, fontFamily:"inherit", boxSizing:"border-box" }}/>
                </div>
                <div>
                  <p style={{ fontSize:10, color:C.textLight, fontWeight:600, textTransform:"uppercase", letterSpacing:"0.8px", marginBottom:4 }}>Canal</p>
                  <select value={nrForm.canal} onChange={e=>setNrFormPersist(f=>({...f,canal:e.target.value}))}
                    style={{ width:"100%", padding:"8px 10px", borderRadius:7, border:`1px solid ${C.border}`, fontSize:13, background:C.bgCard, color:C.text, fontFamily:"inherit", boxSizing:"border-box" }}>
                    <option value="">Seleccionar</option>
                    {["Booking.com","Expedia","Directo","Directo Web","Teléfono","Agencia","Corporativo","Grupo","Evento","Otro"].map(c=><option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <p style={{ fontSize:10, color:C.textLight, fontWeight:600, textTransform:"uppercase", letterSpacing:"0.8px", marginBottom:4 }}>Habitaciones</p>
                  <input type="number" min="1" value={nrForm.num_reservas} onChange={e=>setNrFormPersist(f=>({...f,num_reservas:e.target.value}))}
                    style={{ width:"100%", padding:"8px 10px", borderRadius:7, border:`1px solid ${C.border}`, fontSize:13, background:C.bgCard, color:C.text, fontFamily:"inherit", boxSizing:"border-box" }}/>
                </div>
                <div>
                  <p style={{ fontSize:10, color:C.textLight, fontWeight:600, textTransform:"uppercase", letterSpacing:"0.8px", marginBottom:4 }}>Noches</p>
                  <input type="number" min="1" value={nrForm.noches} onChange={e=>{ const v=e.target.value; const d=new Date(hoyISO); if(parseInt(v)>0){d.setDate(d.getDate()+parseInt(v));} setNrFormPersist(f=>({...f,noches:v,fecha_salida:parseInt(v)>0?d.toISOString().slice(0,10):""})); }}
                    style={{ width:"100%", padding:"8px 10px", borderRadius:7, border:`1px solid ${C.border}`, fontSize:13, background:C.bgCard, color:C.text, fontFamily:"inherit", boxSizing:"border-box" }}/>
                </div>
                <div>
                  <p style={{ fontSize:10, color:C.textLight, fontWeight:600, textTransform:"uppercase", letterSpacing:"0.8px", marginBottom:4 }}>Fecha salida</p>
                  <input type="date" value={nrForm.fecha_salida} onChange={e=>{ const v=e.target.value; const n=v?Math.round((new Date(v)-new Date(hoyISO))/86400000):0; setNrFormPersist(f=>({...f,fecha_salida:v,noches:n>0?String(n):""})); }}
                    style={{ width:"100%", padding:"8px 10px", borderRadius:7, border:`1px solid ${C.border}`, fontSize:13, background:C.bgCard, color:C.text, fontFamily:"inherit", boxSizing:"border-box" }}/>
                </div>
                <div style={{ gridColumn:"1/-1" }}>
                  <p style={{ fontSize:10, color:C.textLight, fontWeight:600, textTransform:"uppercase", letterSpacing:"0.8px", marginBottom:4 }}>Precio total €</p>
                  <input type="number" min="0" step="0.01" value={nrForm.precio_total} onChange={e=>setNrFormPersist(f=>({...f,precio_total:e.target.value}))}
                    style={{ width:"100%", padding:"8px 10px", borderRadius:7, border:`1px solid ${C.border}`, fontSize:13, background:C.bgCard, color:C.text, fontFamily:"inherit", boxSizing:"border-box" }}/>
                </div>
              </div>
              {nrError && <p style={{ fontSize:12, color:C.red, marginTop:10 }}>{nrError}</p>}
              {nrOk && <p style={{ fontSize:12, color:C.green, marginTop:10, fontWeight:600 }}>Reserva guardada</p>}
              <button onClick={guardarNuevaReserva} disabled={nrGuardando}
                style={{ marginTop:18, width:"100%", padding:"10px 0", borderRadius:8, background:nrGuardando?C.border:C.text, color:"#fff", border:"none", cursor:nrGuardando?"default":"pointer", fontSize:13, fontWeight:700, fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
                {nrGuardando ? "Guardando..." : "Guardar reserva"}
              </button>
            </div>
          </div>
        )}

      {/* ── PICKUP HOY / AYER ── */}
      <Card>
        <div style={{ display:"flex", alignItems:"flex-start", gap:16, marginBottom:20 }}>
          <div style={{ background:"#111", borderRadius:10, padding:"10px 18px", textAlign:"center", flexShrink:0 }}>
            <p style={{ fontSize:30, fontWeight:800, color:"#fff", fontFamily:"'Plus Jakarta Sans',sans-serif", lineHeight:1 }}>{ultDiaTotal}</p>
            <p style={{ fontSize:9, color:"#ffffff", fontWeight:700, textTransform:"uppercase", letterSpacing:1, marginTop:4 }}>Nuevas reservas</p>
          </div>
          <div>
            <p style={{ fontFamily:"'Cormorant Garamond',serif", fontWeight:700, fontSize:18, color:C.text }}>{tituloBloque}</p>
          </div>
        </div>

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
        <div ref={trimTipRef} style={{ position:"fixed", display: trimTip ? "block" : "none", background:"#0A2540", borderRadius:10, padding:"10px 14px", boxShadow:"0 8px 24px rgba(0,0,0,0.25)", pointerEvents:"none", zIndex:9999, minWidth:120 }}>
          {trimTip && <>
            <p style={{ color:"#fff", fontSize:10, fontWeight:700, marginBottom:6, textTransform:"uppercase", letterSpacing:"1px" }}>{trimTip.mes}</p>
            {trimTip.otb  != null && <div style={{ display:"flex", alignItems:"center", gap:7, margin:"2px 0" }}><span style={{ width:8, height:8, borderRadius:"50%", background:COL_OTB, flexShrink:0, display:"inline-block" }}/><span style={{ color:"rgba(255,255,255,0.9)", fontSize:12 }}>{t("otb_actual")}: {trimTip.otb}</span></div>}
            {trimTip.ppto != null && <div style={{ display:"flex", alignItems:"center", gap:7, margin:"2px 0" }}><span style={{ width:8, height:8, borderRadius:"50%", background:COL_PPTO, flexShrink:0, display:"inline-block" }}/><span style={{ color:"rgba(255,255,255,0.9)", fontSize:12 }}>{t("nav_budget")}: {trimTip.ppto}</span></div>}
            {trimTip.ly   != null && <div style={{ display:"flex", alignItems:"center", gap:7, margin:"2px 0" }}><span style={{ width:8, height:8, borderRadius:"50%", background:COL_LY,  flexShrink:0, display:"inline-block" }}/><span style={{ color:"rgba(255,255,255,0.9)", fontSize:12 }}>{t("anio_anterior")}: {trimTip.ly}</span></div>}
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

      {/* ── FECHAS CALIENTES + CANCELACIONES | PRECIO MEDIO CANAL ── */}
      <div style={{ display:"grid", gridTemplateColumns:"280px 1fr", gap:16, alignItems:"start" }}>

        {/* Col izquierda: Fechas Calientes + Cancelaciones */}
        <Card>
          <p style={{ fontSize:11, fontWeight:700, color:C.textLight, textTransform:"uppercase", letterSpacing:1, marginBottom:8 }}>🔥 {t("fechas_calientes")}</p>
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
          {(() => {
            const padL = n => String(n).padStart(2,"0");
            const hoyStr = `${hoy.getFullYear()}-${padL(hoy.getMonth()+1)}-${padL(hoy.getDate())}`;
            const hab = datos.hotel?.habitaciones || 30;
            const otbPorDia = {};
            (pickupEntries || []).forEach(e => {
              const fl = String(e.fecha_llegada || "").slice(0, 10);
              const fp = String(e.fecha_pickup  || "").slice(0, 10);
              if (fl.length < 10 || fp.length < 10) return;
              if (fl <= hoyStr) return;
              if (fp > hoyStr) return;
              if ((e.estado || "confirmada") === "cancelada") return;
              otbPorDia[fl] = (otbPorDia[fl] || 0) + (e.num_reservas || 1);
            });
            const top5 = Object.entries(otbPorDia).sort((a,b) => b[1]-a[1]).slice(0,5);
            if (top5.length === 0) return <p style={{ fontSize:11, color:C.textLight }}>{t("sin_futuras")}</p>;
            const maxVal = top5[0][1] || 1;
            const fmt = (iso) => {
              const [y,m,d] = iso.split("-");
              const dt = new Date(Number(y), Number(m)-1, Number(d));
              return `${t("dias_abrev")[dt.getDay()]} ${Number(d)} ${t("meses_corto")[Number(m)-1]}`;
            };
            return top5.map(([fecha, otb]) => {
              const occ = Math.round(otb / hab * 100);
              const occColor = occ >= 85 ? "#E53935" : occ >= 70 ? "#FF7043" : occ >= 55 ? "#FFC107" : "#4CAF50";
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
          <p style={{ fontFamily:"'Cormorant Garamond',serif", fontWeight:700, fontSize:14, color:C.text, marginBottom:2 }}>{t("cancelaciones_ayer")}</p>
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
            const fmtFecha = (iso) => {
              if (!iso) return "—";
              const [y,m,d] = String(iso).slice(0,10).split("-");
              const dt = new Date(Number(y), Number(m)-1, Number(d));
              return `${t("dias_abrev")[dt.getDay()]} ${Number(d)} ${t("meses_corto")[Number(m)-1]} ${y}`;
            };
            const thS = { fontSize:9, fontWeight:700, color:C.textLight, textTransform:"uppercase", letterSpacing:0.7, padding:"0 6px 6px", textAlign:"left", borderBottom:`1px solid ${C.border}` };
            const tdS = { fontSize:10, padding:"6px 6px", verticalAlign:"middle" };
            return (
              <table style={{ width:"100%", borderCollapse:"collapse" }}>
                <thead><tr>
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
              <p style={{ fontFamily:"'Cormorant Garamond',serif", fontWeight:700, fontSize:18, color:C.text, marginBottom:8 }}>Reservas obtenidas</p>
              {/* Toggle ventana */}
              <div style={{ display:"flex", borderRadius:8, overflow:"hidden", border:`1px solid ${C.border}`, width:"fit-content" }}>
                {[["30d","Últimos 30 días"], ["year","Último año"]].map(([key, label]) => (
                  <button key={key} onClick={()=>setReservasVentana(key)}
                    style={{ padding:"5px 14px", fontSize:11, fontWeight:700, cursor:"pointer", border:"none", background: reservasVentana===key ? "#111" : "transparent", color: reservasVentana===key ? "#fff" : C.textMid, transition:"background 0.2s", fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
                    {label}
                  </button>
                ))}
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
                    <button onClick={() => setOtaDetalle(false)}
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
                        <div style={{ background:"#111111", borderRadius:10, padding:"10px 14px", boxShadow:"0 8px 24px rgba(0,0,0,0.35)", minWidth:130 }}>
                          <p style={{ color:"#fff", fontSize:10, fontWeight:700, marginBottom:6, textTransform:"uppercase", letterSpacing:"1px" }}>{label}</p>
                          <div style={{ display:"flex", alignItems:"center", gap:7 }}>
                            <span style={{ width:8, height:8, borderRadius:2, background:color, flexShrink:0, display:"inline-block" }}/>
                            <span style={{ color:"rgba(255,255,255,0.75)", fontSize:12 }}>{vista.label}: <span style={{ color:"#fff", fontWeight:700 }}>{vista.fmt(d.value)}</span></span>
                          </div>
                          {d.payload?.isOtaGroup && <p style={{ color:"rgba(255,255,255,0.45)", fontSize:10, marginTop:6 }}>Pulsa para ver desglose</p>}
                        </div>
                      );
                    }}
                  />
                  <Bar dataKey="valor" radius={[4,4,0,0]} maxBarSize={56} shape={(p) => <SimpleBar {...p}/>}
                    onClick={(data) => { if (data?.isOtaGroup) setOtaDetalle(true); }}
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

      {/* ── PACE ── */}
      {(() => {
        const pad = n => String(n).padStart(2,"0");
        const hab = datos.hotel?.habitaciones || 30;

        // 6 meses desde el mes actual
        const filasPace = Array.from({ length: 6 }, (_, i) => {
          const d    = new Date(hoy.getFullYear(), hoy.getMonth() + i, 1);
          const a    = d.getFullYear();
          const m    = d.getMonth() + 1;
          const key  = `${a}-${pad(m)}`;
          const diasMes = new Date(a, m, 0).getDate();
          const esFuturo = a > hoy.getFullYear() || (a === hoy.getFullYear() && m > hoy.getMonth() + 1);

          // OTB actual
          const otb = otbPorMes[key] || 0;
          // LY real (produccion)
          const lyDatos = (produccion || []).filter(r => {
            const f = new Date(r.fecha + "T00:00:00");
            return f.getFullYear() === a-1 && f.getMonth()+1 === m;
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

          // Diferencias
          const diffLY   = lyOcc != null && otbOcc != null ? (otbOcc - lyOcc).toFixed(1) : null;
          const diffPpto = ppOcc != null && otbOcc != null ? (otbOcc - ppOcc).toFixed(1) : null;

          return {
            label: MESES[d.getMonth()] + " " + a,
            esFuturo,
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
                    <th style={{ padding:"9px 16px", textAlign:"left",   color:C.textLight, fontWeight:600, fontSize:11, textTransform:"uppercase", letterSpacing:0.8, whiteSpace:"nowrap" }}>Mes</th>
                    <th style={{ padding:"9px 12px", textAlign:"right",  color:C.textLight, fontWeight:600, fontSize:11, textTransform:"uppercase", letterSpacing:0.8 }}>OTB Res.</th>
                    <th style={{ padding:"9px 12px", textAlign:"right",  color:"#B8860B",   fontWeight:700, fontSize:11, textTransform:"uppercase", letterSpacing:0.8 }}>OCC OTB</th>
                    <th style={{ padding:"9px 12px", textAlign:"right",  color:C.textLight, fontWeight:600, fontSize:11, textTransform:"uppercase", letterSpacing:0.8 }}>OCC LY</th>
                    <th style={{ padding:"9px 12px", textAlign:"right",  color:C.textLight, fontWeight:600, fontSize:11, textTransform:"uppercase", letterSpacing:0.8 }}>ADR LY</th>
                    <th style={{ padding:"9px 12px", textAlign:"right",  color:C.textLight, fontWeight:600, fontSize:11, textTransform:"uppercase", letterSpacing:0.8 }}>OCC Ppto</th>
                    <th style={{ padding:"9px 12px", textAlign:"right",  color:C.textLight, fontWeight:600, fontSize:11, textTransform:"uppercase", letterSpacing:0.8 }}>ADR Ppto</th>
                    <th style={{ padding:"9px 12px", textAlign:"right",  color:C.textLight, fontWeight:600, fontSize:11, textTransform:"uppercase", letterSpacing:0.8 }}>vs LY</th>
                    <th style={{ padding:"9px 16px", textAlign:"right",  color:C.textLight, fontWeight:600, fontSize:11, textTransform:"uppercase", letterSpacing:0.8 }}>vs Ppto</th>
                  </tr>
                </thead>
                <tbody>
                  {filasPace.map((f, i) => (
                    <tr key={i} style={{ borderTop:`1px solid ${C.border}`, background: i===0 ? C.accentLight : "transparent" }}>
                      <td style={{ padding:"10px 16px", fontWeight:600, color:C.text, whiteSpace:"nowrap" }}>
                        {f.label}
                        {f.esFuturo && <span style={{ marginLeft:6, fontSize:9, background:"#2C3E7A22", color:"#7A9CC8", borderRadius:3, padding:"1px 5px", fontWeight:700 }}>OTB</span>}
                      </td>
                      <td style={{ padding:"10px 12px", textAlign:"right", color:C.textMid }}>{f.otb > 0 ? f.otb : "—"}</td>
                      <td style={{ padding:"10px 12px", textAlign:"right", fontWeight:700, color:"#B8860B" }}>{f.otbOcc != null ? `${f.otbOcc}%` : "—"}</td>
                      <td style={{ padding:"10px 12px", textAlign:"right", color:C.textMid }}>{f.lyOcc  != null ? `${f.lyOcc}%`  : "—"}</td>
                      <td style={{ padding:"10px 12px", textAlign:"right", color:C.textMid }}>{f.lyAdr  != null ? `€${f.lyAdr}`  : "—"}</td>
                      <td style={{ padding:"10px 12px", textAlign:"right", color:C.textMid }}>{f.ppOcc  != null ? `${f.ppOcc}%`  : "—"}</td>
                      <td style={{ padding:"10px 12px", textAlign:"right", color:C.textMid }}>{f.ppAdr  != null ? `€${f.ppAdr}`  : "—"}</td>
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

  // ── FORECAST (OTB + ETP) ──────────────────────────────────────
  const calcForecastRevenue = (mesIdx, anioF) => {
    const primerDia = new Date(anioF, mesIdx, 1);
    const ultimoDia = new Date(anioF, mesIdx + 1, 0);
    const mesStr    = `${anioF}-${pad(mesIdx + 1)}`;
    const mesStrLY  = `${anioF - 1}-${pad(mesIdx + 1)}`;

    // Mes ya cerrado → no se recalcula; el forecast se recupera de localStorage
    const hoyMidnight = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
    if (ultimoDia < hoyMidnight) return null;

    // ADR medio del año anterior para este mes
    const diasLY = (produccion || []).filter(r => String(r.fecha || "").slice(0, 7) === mesStrLY);
    const habOcuLY = diasLY.reduce((a, r) => a + (r.hab_ocupadas || 0), 0);
    const revHabLY = diasLY.reduce((a, r) => a + (r.revenue_hab || 0), 0);
    const adrLY = habOcuLY > 0 ? revHabLY / habOcuLY : null;
    if (!adrLY) return null;

    // OTB actual: reservas en pickup con fecha_llegada en este mes y fecha_pickup <= hoy
    const otbRes = pickupEntries
      .filter(e => String(e.fecha_llegada || "").slice(0, 7) === mesStr && String(e.fecha_pickup || "").slice(0, 10) <= hoyStr)
      .reduce((a, e) => a + (e.num_reservas || 1), 0);

    // OTB año anterior en la misma fecha relativa
    const hoyLY = `${anioF - 1}-${pad(hoy.getMonth() + 1)}-${pad(hoy.getDate())}`;
    const otbResLY = pickupEntries
      .filter(e => String(e.fecha_llegada || "").slice(0, 7) === mesStrLY && String(e.fecha_pickup || "").slice(0, 10) <= hoyLY)
      .reduce((a, e) => a + (e.num_reservas || 1), 0);

    // ETP: pickup del año anterior desde hoy hasta fin de mes, ajustado por pace
    const finMesLY = `${anioF - 1}-${pad(mesIdx + 1)}-${pad(ultimoDia.getDate())}`;
    const etpResLY = pickupEntries
      .filter(e => {
        const fp = String(e.fecha_pickup || "").slice(0, 10);
        return String(e.fecha_llegada || "").slice(0, 7) === mesStrLY && fp > hoyLY && fp <= finMesLY;
      })
      .reduce((a, e) => a + (e.num_reservas || 1), 0);

    // Factor pace — limitado a máx 1.5x para evitar distorsiones por falta de datos LY
    const paceRaw = otbResLY > 20 ? otbRes / otbResLY : 1;
    const paceFactor = Math.min(1.5, Math.max(0.5, paceRaw));
    const etpRes = Math.round(etpResLY * paceFactor);

    // Forecast reservas totales = OTB + ETP
    const forecastRes = otbRes + etpRes;

    // Revenue forecast = reservas * ADR año anterior
    const forecastRev = Math.round(forecastRes * adrLY);

    // ADR forecast = ADR del año anterior (es el ADR implícito en el modelo)
    const forecastAdr = Math.round(adrLY);

    // RevPAR forecast = forecastRev / hab_disponibles del año anterior
    const habDisLY = diasLY.reduce((a, r) => a + (r.hab_disponibles || 0), 0);
    const forecastRevpar = habDisLY > 0 ? Math.round(forecastRev / habDisLY) : null;

    // Confianza: % del mes transcurrido
    const diasMes    = ultimoDia.getDate();
    const diaActual  = primerDia > hoy ? 0 : Math.min(hoy.getDate(), diasMes);
    const confianza  = Math.round((diaActual / diasMes) * 100);

    return { forecastRev, forecastAdr, forecastRevpar, otbRes, etpRes, paceFactor: paceFactor.toFixed(2), confianza };
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
            : null,
  }));

  const chartUnit  = kpiChart==="revenue" ? "k€" : "€";
  const chartTitle = kpiChart==="revenue" ? t("chart_rev")
                   : kpiChart==="adr"     ? t("chart_adr") : t("chart_revpar");

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:20 }}>

      {/* KPIs forecast resumen */}
      {totalForecast > 0 && (
        <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:14 }}>
          {[
            { label:t("rev_real_ytd"),         value:`€${Math.round(totalRevReal).toLocaleString("es-ES")}`,    color:C.green, lytd: lytdPct },
            { label:t("forecast_cierre_anio"), value:`€${Math.round(totalForecast).toLocaleString("es-ES")}`,   color:"#B8860B" },
            { label:t("presupuesto_anio"),     value:`€${Math.round(totalRevPpto).toLocaleString("es-ES")}`,   color:C.accent },
          ].map((k,i) => (
            <div key={i} style={{ background:C.bgCard, border:`1px solid ${C.border}`, borderRadius:10, padding:"16px 20px", borderLeft:`3px solid ${k.color}` }}>
              <p style={{ fontSize:10, color:C.textLight, textTransform:"uppercase", letterSpacing:1.5, marginBottom:6, fontWeight:600 }}>{k.label}</p>
              <div style={{ display:"flex", alignItems:"baseline", gap:8 }}>
                <p style={{ fontSize:22, fontWeight:700, color:k.color, fontFamily:"'Plus Jakarta Sans',sans-serif", margin:0 }}>{k.value}</p>
                {k.lytd != null && (
                  <span style={{ fontSize:10, fontWeight:600, padding:"1px 5px", borderRadius:3, background: lytdUp ? C.greenLight : C.redLight, color: lytdUp ? C.green : C.red }}>
                    {lytdUp ? "+" : ""}{k.lytd}% vs LYTD
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

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
            <p style={{ fontFamily:"'Cormorant Garamond',serif", fontWeight:700, fontSize:18, color:C.text }}>{chartTitle}</p>
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
                  <div style={{ background:"#111111", borderRadius:10, padding:"12px 16px", boxShadow:"0 8px 24px rgba(0,0,0,0.35)", minWidth:164 }}>
                    <p style={{ margin:"0 0 8px", fontSize:10, fontWeight:700, color:"#FFFFFF", textTransform:"uppercase", letterSpacing:"1.5px" }}>{mesNombre}{anioLabel}</p>
                    {payload.map((p, i) => p.value != null && (
                      <div key={i} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", gap:20, marginBottom:4 }}>
                        <span style={{ display:"flex", alignItems:"center", gap:6 }}>
                          <span style={{ display:"inline-block", width:8, height:8, borderRadius:2, background:colorMap[p.dataKey] || "#888" }} />
                          <span style={{ fontSize:11, color:"rgba(255,255,255,0.75)" }}>{p.name}</span>
                        </span>
                        <span style={{ fontSize:12, fontWeight:700, color:"#FFFFFF" }}>
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
        <p style={{ fontFamily:"'Cormorant Garamond',serif", fontWeight:700, fontSize:16, color:C.text, marginBottom:16 }}>{t("detalle_mensual")}</p>
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
                          <ConfianzaBadge pct={f.confianza} cerrado={f.mesCerrado}/>
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
function GruposView({ datos, onRecargar }) {
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
  };

  const MESES = t("meses_corto");
  const MESES_FULL = t("meses_full");

  const [anio, setAnio] = useState(new Date().getFullYear());
  const [mes, setMes] = useState(new Date().getMonth());
  const [mesCal, setMesCal] = useState(new Date().getMonth());
  const [anioCal, setAnioCal] = useState(new Date().getFullYear());
  const [modalGrupo, setModalGrupo] = useState(null);
  const [detalleGrupo, setDetalleGrupo] = useState(null);
  const [guardando, setGuardando] = useState(false);
  const [menuNuevo, setMenuNuevo] = useState(false);
  const [subVista, setSubVista] = useState(() => localStorage.getItem("fr_grupos_subvista") || "grupos");
  const cambiarSubVista = (v) => { setSubVista(v); localStorage.setItem("fr_grupos_subvista", v); };
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

  // ── Formulario estado ──
  const FORM_VACIO = { tipo:"grupo", nombre:"", categoria:"corporativo", estado:"confirmado", fecha_inicio:"", fecha_fin:"", fecha_confirmacion:"", habitaciones:"", pax:"", adr_grupo:"", revenue_fnb:"", revenue_sala:"", notas:"", motivo_perdida:"", hora_inicio:"", hora_fin:"", sala_nombre:"", servicio_incluido:false };
  const [form, setForm] = useState(FORM_VACIO);

  // Parsea el prefijo de metadata de evento de las notas
  const parseNotasEvento = (notas) => {
    if (!notas) return { hora_inicio:"", hora_fin:"", sala_nombre:"", servicio_incluido:false, notasUser:"" };
    const m = notas.match(/^\[ev:([^\]]*)\]\n?([\s\S]*)$/);
    if (!m) return { hora_inicio:"", hora_fin:"", sala_nombre:"", servicio_incluido:false, notasUser: notas };
    const parts = Object.fromEntries(m[1].split(",").map(p => p.split("=")));
    return { hora_inicio: parts.hi||"", hora_fin: parts.hf||"", sala_nombre: parts.sala||"", servicio_incluido: parts.serv==="sí", notasUser: m[2] };
  };

  const packNotasEvento = (form) => {
    const meta = `[ev:hi=${form.hora_inicio},hf=${form.hora_fin},sala=${form.sala_nombre},serv=${form.servicio_incluido?"sí":"no"}]`;
    return meta + (form.notas ? "\n" + form.notas : "");
  };

  const abrirNuevo = (fecha = "", tipo = "grupo", fechaFin = "") => {
    setForm({ ...FORM_VACIO, fecha_inicio: fecha, fecha_fin: fechaFin || fecha, tipo, categoria: tipo === "evento" ? "evento" : "corporativo" });
    setModalGrupo({});
  };

  const [highlightId, setHighlightId] = useState(null);
  useEffect(() => {
    if (highlightId) { const t = setTimeout(()=>setHighlightId(null), 2500); return ()=>clearTimeout(t); }
  }, [highlightId]);

  useEffect(() => {
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

  const abrirEditar = (g) => {
    const esEvento = g.categoria === "evento";
    const { hora_inicio, hora_fin, sala_nombre, servicio_incluido, notasUser } = esEvento ? parseNotasEvento(g.notas) : {};
    setForm({
      tipo: esEvento ? "evento" : "grupo",
      nombre: g.nombre||"", categoria: g.categoria||"corporativo", estado: g.estado||"confirmado",
      fecha_inicio: g.fecha_inicio||"", fecha_fin: g.fecha_fin||"", fecha_confirmacion: g.fecha_confirmacion||"",
      habitaciones: g.habitaciones||"", pax: g.pax||"", adr_grupo: g.adr_grupo||"",
      revenue_fnb: g.revenue_fnb||"", revenue_sala: g.revenue_sala||"",
      notas: esEvento ? (notasUser||"") : (g.notas||""), motivo_perdida: g.motivo_perdida||"",
      hora_inicio: hora_inicio||"", hora_fin: hora_fin||"", sala_nombre: sala_nombre||"", servicio_incluido: servicio_incluido||false,
    });
    setModalGrupo(g);
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
      estado: form.estado,
      fecha_inicio: form.fecha_inicio,
      fecha_fin: esEvento ? form.fecha_inicio : (form.fecha_fin || form.fecha_inicio),
      habitaciones: esEvento ? 0 : (parseInt(form.habitaciones)||0),
      adr_grupo: esEvento ? 0 : (parseFloat(form.adr_grupo)||0),
      revenue_fnb: parseFloat(form.revenue_fnb)||0,
      revenue_sala: parseFloat(form.revenue_sala)||0,
      fecha_confirmacion: esEvento ? null : (form.fecha_confirmacion||null),
      notas: esEvento ? packNotasEvento(form) : (form.notas||null),
      motivo_perdida: form.motivo_perdida||null,
    };
    if (modalGrupo?.id) {
      await supabase.from("grupos_eventos").update(payload).eq("id", modalGrupo.id);
    } else {
      await supabase.from("grupos_eventos").insert(payload);
    }
    setGuardando(false);
    setModalGrupo(null);
    onRecargar();
  };

  const eliminar = async (id, tipo) => {
    const msg = tipo === "evento" ? t("eliminar_evento") : t("eliminar_grupo");
    if (!window.confirm(msg)) return;
    await supabase.from("grupos_eventos").delete().eq("id", id);
    setModalGrupo(null);
    onRecargar();
  };

  const calcRevTotal = (g) => {
    const noches = g.fecha_inicio && g.fecha_fin
      ? Math.max(1, Math.round((new Date(g.fecha_fin) - new Date(g.fecha_inicio)) / 86400000))
      : 1;
    return (g.habitaciones||0) * (g.adr_grupo||0) * noches + (g.revenue_fnb||0) + (g.revenue_sala||0);
  };

  // ── Cálculos KPIs del mes activo ──
  const gruposAnio = grupos.filter(g => g.fecha_inicio?.slice(0,4) === String(anio) || g.fecha_fin?.slice(0,4) === String(anio));
  const mesStr = String(anio) + "-" + String(mes + 1).padStart(2, "0");
  const gruposMes = grupos.filter(g => g.fecha_inicio?.slice(0,7) === mesStr || g.fecha_fin?.slice(0,7) === mesStr);
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

      {/* ── Sub-navegación + botones ── */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", gap:8, flexWrap:"wrap" }}>
        <div style={{ display:"flex", gap:6 }}>
          {[
            { key:"semana",   label:"Calendario" },
            { key:"pipeline", label:"Pipeline" },
            { key:"grupos",   label:"Grupos" },
            { key:"eventos",  label:"Eventos" },
            { key:"revenue",  label:"Revenue" },
            { key:"salas",    label:"Gestión de salas" },
          ].map(({ key, label }) => {
            const activo = subVista === key;
            return (
              <button key={key} onClick={()=>cambiarSubVista(key)}
                style={{ padding:"7px 18px", fontSize:13, fontWeight:activo?700:500, cursor:"pointer", border:`1.5px solid ${activo ? C.text : C.border}`, borderRadius:8, background: activo ? C.text : "transparent", color: activo ? C.bgCard : C.textMid, fontFamily:"'Plus Jakarta Sans',sans-serif", transition:"all 0.15s" }}>
                {label}
              </button>
            );
          })}
        </div>
        <div style={{ display:"flex", gap:8, alignItems:"center" }}>
          <button onClick={seedDemoData} disabled={seedando || borrandoDemo}
            style={{ background:"#E0F0FF", color:"#2B7EC1", border:"1.5px dashed #2B7EC1", borderRadius:8, padding:"7px 14px", fontSize:12, fontWeight:600, cursor:"pointer", fontFamily:"'Plus Jakarta Sans',sans-serif", opacity:(seedando||borrandoDemo)?0.6:1 }}>
            {seedando ? "Cargando..." : "Datos demo"}
          </button>
          {grupos.length > 0 && (
            <button onClick={borrarTodosGrupos} disabled={seedando || borrandoDemo}
              style={{ background:"none", color:"rgba(211,47,47,0.7)", border:"1.5px solid rgba(211,47,47,0.3)", borderRadius:8, padding:"7px 14px", fontSize:12, fontWeight:600, cursor:"pointer", fontFamily:"'Plus Jakarta Sans',sans-serif", opacity:(seedando||borrandoDemo)?0.6:1 }}>
              {borrandoDemo ? "Borrando..." : "Borrar todo"}
            </button>
          )}
          <div style={{ position:"relative" }}>
            <button onClick={()=>setMenuNuevo(v=>!v)}
              style={{ background:"#0A2540", color:"#fff", border:"none", borderRadius:8, padding:"7px 16px", fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:"'Plus Jakarta Sans',sans-serif", display:"flex", alignItems:"center", gap:6 }}>
              + Nueva reserva
              <span style={{ fontSize:10, opacity:0.7 }}>▾</span>
            </button>
            {menuNuevo && (
              <>
                <div style={{ position:"fixed", inset:0, zIndex:999 }} onClick={()=>setMenuNuevo(false)}/>
                <div style={{ position:"absolute", right:0, top:"calc(100% + 6px)", background:C.bgCard, border:`1px solid ${C.border}`, borderRadius:10, boxShadow:"0 8px 24px rgba(0,0,0,0.12)", zIndex:1000, minWidth:160, overflow:"hidden" }}>
                  <button onClick={()=>{ setMenuNuevo(false); abrirNuevo(); }}
                    style={{ width:"100%", padding:"11px 16px", background:"none", border:"none", textAlign:"left", cursor:"pointer", fontSize:13, fontWeight:600, color:C.text, fontFamily:"'Plus Jakarta Sans',sans-serif" }}
                    onMouseEnter={e=>e.currentTarget.style.background=C.bg}
                    onMouseLeave={e=>e.currentTarget.style.background="none"}>
                    Grupo
                  </button>
                  <div style={{ height:1, background:C.border, margin:"0 12px" }}/>
                  <button onClick={()=>{ setMenuNuevo(false); abrirNuevo("", "evento"); }}
                    style={{ width:"100%", padding:"11px 16px", background:"none", border:"none", textAlign:"left", cursor:"pointer", fontSize:13, fontWeight:600, color:C.text, fontFamily:"'Plus Jakarta Sans',sans-serif" }}
                    onMouseEnter={e=>e.currentTarget.style.background=C.bg}
                    onMouseLeave={e=>e.currentTarget.style.background="none"}>
                    Evento
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── Vista mensual (Calendario) ── */}
      {subVista === "semana" && (() => {
        const DIAS_ES = ["Lun","Mar","Mié","Jue","Vie","Sáb","Dom"];
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
                <button onClick={nextMes} style={{ background:"none", border:`1px solid ${C.border}`, borderRadius:6, width:28, height:28, cursor:"pointer", fontSize:15, color:C.textMid, display:"flex", alignItems:"center", justifyContent:"center" }}>›</button>
                <span style={{ fontFamily:"'Plus Jakarta Sans',sans-serif", fontWeight:700, fontSize:15, color:C.text }}>
                  {MESES_ES[mesCal]} {anioCal}
                </span>
                <button onClick={irHoy} style={{ padding:"3px 10px", borderRadius:6, border:`1px solid ${C.border}`, background:"none", fontSize:11, color:C.textMid, cursor:"pointer", fontFamily:"'Plus Jakarta Sans',sans-serif" }}>Hoy</button>
              </div>
              <div style={{ display:"flex", gap:12 }}>
                {Object.entries(colEstado).map(([k,col]) => (
                  <div key={k} style={{ display:"flex", alignItems:"center", gap:5 }}>
                    <div style={{ width:9, height:9, borderRadius:2, background:col }}/>
                    <span style={{ fontSize:10, color:C.textMid, textTransform:"capitalize" }}>{ESTADOS[k]?.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Cabecera días */}
            <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", borderTop:`1px solid ${C.border}`, borderLeft:`1px solid ${C.border}` }}>
              {DIAS_ES.map(d => (
                <div key={d} style={{ borderRight:`1px solid ${C.border}`, borderBottom:`1px solid ${C.border}`, padding:"6px 4px", textAlign:"center", background:C.bg }}>
                  <span style={{ fontSize:10, color:C.textLight, fontWeight:600, textTransform:"uppercase", letterSpacing:"0.5px" }}>{d}</span>
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
                      <div key={d} style={{ borderRight:`1px solid ${C.border}`, borderBottom:`1px solid ${C.border}`, padding:"4px 6px", background: esHoy?`${C.accent}12`: esMes?C.bgCard:C.bg, gridRow:1 }}>
                        <span style={{ fontSize:12, fontWeight:esHoy?800:500, color:esHoy?C.accent:esMes?C.text:C.textLight, fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
                          {parseInt(d.slice(8))}
                        </span>
                      </div>
                    );
                  })}
                  {/* Carriles de grupos */}
                  {Array.from({length:numFilas},(_,fi) => {
                    const gsEnFila = gs.filter(g=>filaDeGrupo[g.id]===fi);
                    return semDias.map((d,ci) => {
                      const g = gsEnFila.find(g=>g.fecha_inicio<=d && g.fecha_fin>=d);
                      const esInicio = g && (g.fecha_inicio===d || ci===0);
                      const esFin    = g && (g.fecha_fin===d   || ci===6);
                      const col = g ? colEstado[g.estado]||"#888" : null;
                      const bg  = g ? bgEstado[g.estado] ||"#eee" : null;
                      return (
                        <div key={d} style={{ borderRight:`1px solid ${C.border}`, borderBottom:`1px solid ${C.border}`, padding:"2px 1px", gridRow:fi+2 }}>
                          {g && (
                            <div onClick={()=>setDetalleGrupo(g)}
                              style={{
                                height:"100%", borderRadius: esInicio&&esFin?"4px": esInicio?"4px 0 0 4px": esFin?"0 4px 4px 0":"0",
                                background:bg, borderLeft:esInicio?`3px solid ${col}`:"none",
                                borderTop:`1px solid ${col}40`, borderBottom:`1px solid ${col}40`,
                                borderRight:esFin?`1px solid ${col}40`:"none",
                                padding:"2px 5px", cursor:"pointer", overflow:"hidden",
                                display:"flex", alignItems:"center",
                              }}>
                              {esInicio && (
                                <span style={{ fontSize:10, fontWeight:700, color:col, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>
                                  {g.nombre}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    });
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
      {subVista === "pipeline" && (() => {
        const hoy = new Date().toISOString().slice(0,10);
        const anioStr = String(anio);

        const enAnio = grupos.filter(g =>
          (g.fecha_inicio?.slice(0,4) === anioStr || g.fecha_fin?.slice(0,4) === anioStr)
          && g.categoria !== "evento"
        );

        const cotizados   = enAnio.filter(g => g.estado === "cotizado");
        const confirmados = enAnio.filter(g => g.estado === "confirmado");
        const cancelados  = enAnio.filter(g => g.estado === "cancelado");
        const total = cotizados.length + confirmados.length + cancelados.length;
        const cerrados = confirmados.length + cancelados.length;
        const tasaConv = cerrados > 0 ? Math.round(confirmados.length / cerrados * 100) : null;

        const revCotizado   = cotizados.reduce((a,g)=>a+calcRevTotal(g),0);
        const revConfirmado = confirmados.reduce((a,g)=>a+calcRevTotal(g),0);

        // Tiempo medio de cierre (fecha_confirmacion - fecha_inicio como proxy)
        const tiemposCierre = confirmados
          .filter(g => g.fecha_confirmacion && g.fecha_inicio)
          .map(g => Math.round((new Date(g.fecha_confirmacion)-new Date(g.fecha_inicio))/86400000))
          .filter(d => d >= 0);
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

        const fmtFecha = iso => { if(!iso)return"—"; const [y,m,d]=iso.split("-"); return `${d}/${m}/${y.slice(2)}`; };
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
                { label:"Revenue en pipeline", value: fmtEur(revCotizado),   color:"#B8860B", sub:`${cotizados.length} cotizaciones` },
                { label:"Tiempo medio cierre", value: tiempoMedio!=null?`${tiempoMedio}d`:"—", color:C.accent, sub:"días hasta confirmar" },
              ].map((k,i)=>(
                <div key={i} style={{ background:C.bgCard, border:`1px solid ${C.border}`, borderRadius:10, padding:"14px 18px", borderLeft:`3px solid ${k.color}` }}>
                  <p style={{ fontSize:10, color:C.textLight, textTransform:"uppercase", letterSpacing:1.2, marginBottom:6, fontWeight:600 }}>{k.label}</p>
                  <p style={{ fontSize:22, fontWeight:700, color:k.color, fontFamily:"'Plus Jakarta Sans',sans-serif", margin:0 }}>{k.value}</p>
                  <p style={{ fontSize:10, color:C.textLight, marginTop:3 }}>{k.sub}</p>
                </div>
              ))}
            </div>

            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>

              {/* Funnel visual */}
              <Card>
                <p style={{ fontFamily:"'Cormorant Garamond',serif", fontWeight:700, fontSize:16, color:C.text, marginBottom:16 }}>Datos {anio}</p>
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
                <p style={{ fontFamily:"'Cormorant Garamond',serif", fontWeight:700, fontSize:16, color:C.text, marginBottom:16 }}>Cotizaciones pendientes</p>
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
                          {["Nombre","Estado","Entrada","Salida","Noches","Habs","ADR","F&B","Sala","Revenue total","Notas"].map(h=>(
                            <th key={h} style={{ padding:"6px 12px", textAlign:"left", fontSize:10, fontWeight:600, color:C.textLight, textTransform:"uppercase", letterSpacing:"1px", borderBottom:`1px solid ${C.border}`, whiteSpace:"nowrap" }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {lista.map((g,i)=>{
                          const noches = g.fecha_inicio && g.fecha_fin ? Math.max(1,Math.round((new Date(g.fecha_fin)-new Date(g.fecha_inicio))/86400000)) : 1;
                          const isHL = highlightId === g.id;
                          return (
                            <tr key={g.id} onClick={()=>setDetalleGrupo(g)} style={{ borderBottom:`1px solid ${C.border}`, background: isHL ? "#EBF5FF" : i%2===0?C.bg:C.bgCard, cursor:"pointer", outline: isHL ? "2px solid #3B82F6" : "none", outlineOffset:"-2px", transition:"background 0.3s" }}
                              onMouseEnter={e=>{ if(!isHL) e.currentTarget.style.background=C.accentLight; }}
                              onMouseLeave={e=>{ e.currentTarget.style.background= isHL?"#EBF5FF":i%2===0?C.bg:C.bgCard; }}>
                              <td style={{ padding:"8px 12px", fontWeight:600, color:C.text, whiteSpace:"nowrap" }}>{g.nombre}</td>
                              <td style={{ padding:"8px 12px" }}><span style={{ fontSize:10, fontWeight:700, padding:"2px 8px", borderRadius:10, background:ESTADOS[g.estado]?.bg, color:ESTADOS[g.estado]?.color, whiteSpace:"nowrap" }}>{ESTADOS[g.estado]?.label}</span></td>
                              <td style={{ padding:"8px 12px", color:C.textMid, whiteSpace:"nowrap" }}>{g.fecha_inicio||"—"}</td>
                              <td style={{ padding:"8px 12px", color:C.textMid, whiteSpace:"nowrap" }}>{g.fecha_fin||"—"}</td>
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
                          {["Nombre","Estado","Fecha","Hora","Sala","F&B","Sala Rev.","Revenue total","Notas"].map(h=>(
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
                            <tr key={g.id} onClick={()=>setDetalleGrupo(g)} style={{ borderBottom:`1px solid ${C.border}`, background: isHL?"#EBF5FF":i%2===0?C.bg:C.bgCard, cursor:"pointer", outline: isHL?"2px solid #3B82F6":"none", outlineOffset:"-2px", transition:"background 0.3s" }}
                              onMouseEnter={e=>{ if(!isHL) e.currentTarget.style.background=C.accentLight; }}
                              onMouseLeave={e=>{ e.currentTarget.style.background= isHL?"#EBF5FF":i%2===0?C.bg:C.bgCard; }}>
                              <td style={{ padding:"8px 12px", fontWeight:600, color:C.text, whiteSpace:"nowrap" }}>{g.nombre}</td>
                              <td style={{ padding:"8px 12px" }}><span style={{ fontSize:10, fontWeight:700, padding:"2px 8px", borderRadius:10, background:ESTADOS[g.estado]?.bg, color:ESTADOS[g.estado]?.color, whiteSpace:"nowrap" }}>{ESTADOS[g.estado]?.label}</span></td>
                              <td style={{ padding:"8px 12px", color:C.textMid, whiteSpace:"nowrap" }}>{g.fecha_inicio||"—"}</td>
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

      {/* ── Revenue ── */}
      {subVista === "revenue" && (() => {
        const datosMesRev = produccion.filter(d => d.fecha.startsWith(mesStr));
        const totalRevProd = datosMesRev.reduce((a,d) => a+(d.revenue_total||0), 0);

        const confGrupos  = confirmados.filter(g => g.categoria !== "evento");
        const confEventos = confirmados.filter(g => g.categoria === "evento");
        const revGrupos   = confGrupos.reduce((a,g)  => a+calcRevTotal(g), 0);
        const revEventos  = confEventos.reduce((a,g) => a+calcRevTotal(g), 0);
        const revSalas    = confGrupos.reduce((a,g)  => a+(g.revenue_sala||0), 0)
                          + confEventos.reduce((a,g) => a+(g.revenue_sala||0), 0);
        const revSeccion  = revGrupos + revEventos;
        const pct = totalRevProd > 0 ? (revSeccion / totalRevProd * 100) : null;

        const filas = [
          { label:"Grupos",  color:"#2B7EC1", bg:"#EBF4FC", rev:revGrupos,  count:confGrupos.length  },
          { label:"Eventos", color:"#E85D04", bg:"#FEF0E7", rev:revEventos, count:confEventos.length },
          { label:"Salas",   color:"#7C3AED", bg:"#F3EFFE", rev:revSalas,   count:null               },
        ];

        return (
          <Card>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
              <div>
                <p style={{ fontFamily:"'Cormorant Garamond',serif", fontWeight:700, fontSize:18, color:C.text }}>Revenue confirmado</p>
                <p style={{ fontSize:11, color:C.textLight, marginTop:3 }}>Grupos · Eventos · Salas — {t("meses_full")[mes]} {anio}</p>
              </div>
              <div style={{ display:"flex", gap:6 }}>
                <select value={mes} onChange={e=>setMes(Number(e.target.value))}
                  style={{ padding:"5px 10px", borderRadius:7, border:`1.5px solid ${C.border}`, fontSize:13, fontWeight:600, color:C.text, background:C.bg, cursor:"pointer", fontFamily:"'Plus Jakarta Sans',sans-serif", outline:"none" }}>
                  {MESES_FULL.map((m,i) => <option key={i} value={i}>{m}</option>)}
                </select>
                <select value={anio} onChange={e=>setAnio(Number(e.target.value))}
                  style={{ padding:"5px 10px", borderRadius:7, border:`1.5px solid ${C.border}`, fontSize:13, fontWeight:600, color:C.text, background:C.bg, cursor:"pointer", fontFamily:"'Plus Jakarta Sans',sans-serif", outline:"none" }}>
                  {[...new Set([anio-1,anio,anio+1,...grupos.map(g=>parseInt(g.fecha_inicio?.slice(0,4))).filter(Boolean)])].sort().map(a=><option key={a} value={a}>{a}</option>)}
                </select>
              </div>
            </div>

            {/* KPI destacado */}
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:12, marginBottom:24 }}>
              <div style={{ background:C.bg, borderRadius:10, padding:"16px 18px", border:`1px solid ${C.border}` }}>
                <p style={{ fontSize:10, color:C.textLight, fontWeight:600, textTransform:"uppercase", letterSpacing:"1px", marginBottom:6 }}>Rev. confirmado sección</p>
                <p style={{ fontSize:22, fontWeight:800, color:C.text, fontFamily:"'Plus Jakarta Sans',sans-serif" }}>€{Math.round(revSeccion).toLocaleString("es-ES")}</p>
              </div>
              <div style={{ background:C.bg, borderRadius:10, padding:"16px 18px", border:`1px solid ${C.border}` }}>
                <p style={{ fontSize:10, color:C.textLight, fontWeight:600, textTransform:"uppercase", letterSpacing:"1px", marginBottom:6 }}>Revenue total mes</p>
                <p style={{ fontSize:22, fontWeight:800, color:C.text, fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
                  {totalRevProd > 0 ? `€${Math.round(totalRevProd).toLocaleString("es-ES")}` : <span style={{ color:C.textLight, fontSize:14 }}>Sin datos</span>}
                </p>
              </div>
              <div style={{ background: pct != null ? "#E6F7EE" : C.bg, borderRadius:10, padding:"16px 18px", border:`1px solid ${pct!=null?"#1A7A3C40":C.border}` }}>
                <p style={{ fontSize:10, color:C.textLight, fontWeight:600, textTransform:"uppercase", letterSpacing:"1px", marginBottom:6 }}>% sobre total mes</p>
                <p style={{ fontSize:22, fontWeight:800, color: pct!=null ? "#1A7A3C" : C.textLight, fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
                  {pct != null ? `${pct.toFixed(1)}%` : "—"}
                </p>
              </div>
            </div>

            {/* Tabla desglose */}
            <table style={{ width:"100%", borderCollapse:"collapse", fontSize:14 }}>
              <thead>
                <tr>
                  {["Categoría","Confirmados","Revenue confirmado","% del total mes","Barra"].map(h => (
                    <th key={h} style={{ padding:"7px 14px", textAlign: h==="Revenue confirmado"||h==="% del total mes" ? "right" : "left", fontSize:10, fontWeight:600, color:C.textLight, textTransform:"uppercase", letterSpacing:"1px", borderBottom:`2px solid ${C.border}`, whiteSpace:"nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filas.map(f => {
                  const pctFila = totalRevProd > 0 ? f.rev / totalRevProd * 100 : 0;
                  return (
                    <tr key={f.label} style={{ borderBottom:`1px solid ${C.border}` }}>
                      <td style={{ padding:"12px 14px" }}>
                        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                          <div style={{ width:10, height:10, borderRadius:2, background:f.color, flexShrink:0 }}/>
                          <span style={{ fontWeight:600, color:C.text }}>{f.label}</span>
                        </div>
                      </td>
                      <td style={{ padding:"12px 14px", color:C.textMid }}>
                        {f.count != null ? f.count : "—"}
                      </td>
                      <td style={{ padding:"12px 14px", fontWeight:700, color:C.text, textAlign:"right" }}>
                        €{Math.round(f.rev).toLocaleString("es-ES")}
                      </td>
                      <td style={{ padding:"12px 14px", textAlign:"right", fontWeight:700, color: pctFila>0 ? f.color : C.textLight }}>
                        {totalRevProd > 0 ? `${pctFila.toFixed(1)}%` : "—"}
                      </td>
                      <td style={{ padding:"12px 14px", width:160 }}>
                        <div style={{ background:C.border, borderRadius:4, height:8, overflow:"hidden" }}>
                          <div style={{ width:`${Math.min(100,pctFila)}%`, height:"100%", background:f.color, borderRadius:4, transition:"width 0.4s ease" }}/>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {/* Total row */}
                <tr style={{ background:C.bg }}>
                  <td style={{ padding:"12px 14px", fontWeight:700, color:C.text }} colSpan={2}>Total sección</td>
                  <td style={{ padding:"12px 14px", fontWeight:800, color:"#1A7A3C", textAlign:"right", fontSize:15 }}>€{Math.round(revSeccion).toLocaleString("es-ES")}</td>
                  <td style={{ padding:"12px 14px", fontWeight:800, color:"#1A7A3C", textAlign:"right" }}>{pct!=null?`${pct.toFixed(1)}%`:"—"}</td>
                  <td style={{ padding:"12px 14px", width:160 }}>
                    <div style={{ background:C.border, borderRadius:4, height:8, overflow:"hidden" }}>
                      <div style={{ width:`${Math.min(100,pct||0)}%`, height:"100%", background:"#1A7A3C", borderRadius:4 }}/>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </Card>
        );
      })()}

      {/* ── PANEL DETALLE EVENTO (desde calendario) ── */}
      {detalleGrupo !== null && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.55)", zIndex:1000, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}
          onClick={()=>setDetalleGrupo(null)}>
          <div style={{ background:C.bgCard, borderRadius:14, width:"95vw", maxWidth:1100, maxHeight:"90vh", overflow:"auto", padding:"28px 36px", boxShadow:"0 24px 80px rgba(0,0,0,0.2)" }}
            onClick={e=>e.stopPropagation()}>

            {/* Cabecera */}
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:20 }}>
              <div>
                <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:4 }}>
                  <h3 style={{ fontSize:18, fontWeight:700, color:C.text }}>{detalleGrupo.nombre}</h3>
                </div>
                <span style={{ fontSize:11, fontWeight:700, padding:"3px 10px", borderRadius:10, background:ESTADOS[detalleGrupo.estado]?.bg, color:ESTADOS[detalleGrupo.estado]?.color }}>
                  {ESTADOS[detalleGrupo.estado]?.label}
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
                        {["Evento","Estado","Entrada","Salida","Noches","Habs","PAX","ADR","F&B","Sala","Revenue total","Notas"].map(h => (
                          <th key={h} style={{ padding:"10px 14px", textAlign:"left", fontSize:10, fontWeight:600, color:C.textLight, textTransform:"uppercase", letterSpacing:"1px", borderBottom:`2px solid ${C.border}`, whiteSpace:"nowrap" }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      <tr style={{ borderBottom:`1px solid ${C.border}`, background: C.bg }}>
                        <td style={{ padding:"9px 14px", fontWeight:600, color:C.text, whiteSpace:"nowrap" }}>{g.nombre}</td>
                        <td style={{ padding:"9px 14px" }}>
                          <span style={{ fontSize:10, fontWeight:700, padding:"2px 8px", borderRadius:10, background:ESTADOS[g.estado]?.bg, color:ESTADOS[g.estado]?.color, whiteSpace:"nowrap" }}>
                            {ESTADOS[g.estado]?.label}
                          </span>
                        </td>
                        <td style={{ padding:"9px 14px", color:C.textMid, whiteSpace:"nowrap" }}>{g.fecha_inicio||"—"}</td>
                        <td style={{ padding:"9px 14px", color:C.textMid, whiteSpace:"nowrap" }}>{g.fecha_fin||"—"}</td>
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
                style={{ background:"#7C3AED", color:"#fff", border:"none", borderRadius:7, padding:"9px 22px", fontSize:13, fontWeight:600, cursor:"pointer" }}>
                ✏️ {detalleGrupo?.categoria === "evento" ? t("editar_evento") : t("editar_grupo")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL FORMULARIO ── */}
      {modalGrupo !== null && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.55)", zIndex:1000, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}
          onClick={()=>setModalGrupo(null)}>
          <div style={{ background:C.bgCard, borderRadius:14, width:"100%", maxWidth:540, maxHeight:"90vh", overflow:"auto", padding:"28px 32px", boxShadow:"0 24px 80px rgba(0,0,0,0.2)" }}
            onClick={e=>e.stopPropagation()}>

            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
              <h3 style={{ fontSize:18, fontWeight:700, color:C.text }}>
                {modalGrupo?.id
                  ? (form.tipo === "evento" ? t("editar_evento") : t("editar_grupo"))
                  : (form.tipo === "evento" ? t("nuevo_evento_title") : t("nuevo_grupo_title"))}
              </h3>
              <button onClick={()=>setModalGrupo(null)} style={{ background:"none", border:`1px solid ${C.border}`, borderRadius:6, width:28, height:28, cursor:"pointer", fontSize:16, color:C.textMid, display:"flex", alignItems:"center", justifyContent:"center", padding:0 }}>×</button>
            </div>

            <div style={{ display:"flex", flexDirection:"column", gap:12 }}>

              <div>
                <p style={{ fontSize:11, color:C.textLight, textTransform:"uppercase", letterSpacing:1, marginBottom:5 }}>{t("form_nombre")}</p>
                <input style={inp} placeholder="Boda García · Congreso Pharma..." value={form.nombre} onChange={e=>setForm(f=>({...f,nombre:e.target.value}))}/>
              </div>

              <div style={{ display:"grid", gridTemplateColumns: form.tipo === "evento" ? "1fr" : "1fr 1fr", gap:10 }}>
                {form.tipo !== "evento" && (
                  <div>
                    <p style={{ fontSize:11, color:C.textLight, textTransform:"uppercase", letterSpacing:1, marginBottom:5 }}>{t("form_categoria")}</p>
                    <select style={inp} value={form.categoria} onChange={e=>setForm(f=>({...f,categoria:e.target.value}))}>
                      {Object.entries(CATS).filter(([k])=>k!=="evento").map(([k,v])=><option key={k} value={k}>{v.label}</option>)}
                    </select>
                  </div>
                )}
                <div>
                  <p style={{ fontSize:11, color:C.textLight, textTransform:"uppercase", letterSpacing:1, marginBottom:5 }}>{t("form_estado")}</p>
                  <select style={inp} value={form.estado} onChange={e=>setForm(f=>({...f,estado:e.target.value}))}>
                    {Object.entries(ESTADOS).map(([k,v])=><option key={k} value={k}>{v.label}</option>)}
                  </select>
                </div>
              </div>

              {/* Fechas — eventos solo tienen fecha de celebración; grupos tienen entrada+salida */}
              {form.tipo === "evento" ? (
                <div>
                  <p style={{ fontSize:11, color:C.textLight, textTransform:"uppercase", letterSpacing:1, marginBottom:5 }}>Fecha del evento *</p>
                  <input style={inp} type="date" value={form.fecha_inicio} onChange={e=>setForm(f=>({...f,fecha_inicio:e.target.value,fecha_fin:e.target.value}))}/>
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

              {/* Campos específicos de evento: hora y sala */}
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

              {/* Campos específicos de grupo: habitaciones y ADR */}
              {form.tipo === "grupo" ? (
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:10 }}>
                  <div>
                    <p style={{ fontSize:11, color:C.textLight, textTransform:"uppercase", letterSpacing:1, marginBottom:5 }}>{t("form_habitaciones")}</p>
                    <input style={inp} type="number" placeholder="20" value={form.habitaciones} onChange={e=>setForm(f=>({...f,habitaciones:e.target.value}))}/>
                  </div>
                  <div>
                    <p style={{ fontSize:11, color:C.textLight, textTransform:"uppercase", letterSpacing:1, marginBottom:5 }}>PAX</p>
                    <input style={inp} type="number" placeholder="40" value={form.pax} onChange={e=>setForm(f=>({...f,pax:e.target.value}))}/>
                  </div>
                  <div>
                    <p style={{ fontSize:11, color:C.textLight, textTransform:"uppercase", letterSpacing:1, marginBottom:5 }}>{t("form_adr")}</p>
                    <input style={inp} type="number" placeholder="89" value={form.adr_grupo} onChange={e=>setForm(f=>({...f,adr_grupo:e.target.value}))}/>
                  </div>
                </div>
              ) : (
                <div>
                  <p style={{ fontSize:11, color:C.textLight, textTransform:"uppercase", letterSpacing:1, marginBottom:5 }}>PAX</p>
                  <input style={inp} type="number" placeholder="40" value={form.pax} onChange={e=>setForm(f=>({...f,pax:e.target.value}))}/>
                </div>
              )}

              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
                <div>
                  <p style={{ fontSize:11, color:C.textLight, textTransform:"uppercase", letterSpacing:1, marginBottom:5 }}>{t("form_fnb")}</p>
                  <input style={inp} type="number" placeholder="5000" value={form.revenue_fnb} onChange={e=>setForm(f=>({...f,revenue_fnb:e.target.value}))}/>
                </div>
                <div>
                  <p style={{ fontSize:11, color:C.textLight, textTransform:"uppercase", letterSpacing:1, marginBottom:5 }}>{t("form_sala")}</p>
                  <input style={inp} type="number" placeholder="800" value={form.revenue_sala} onChange={e=>setForm(f=>({...f,revenue_sala:e.target.value}))}/>
                </div>
              </div>

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

              {/* Preview revenue */}
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

              {/* ── ANÁLISIS DE DESPLAZAMIENTO ── */}
              {form.fecha_inicio && form.fecha_fin && (parseInt(form.habitaciones)||0) > 0 && (() => {
                const produccion  = datos.produccion  || [];
                const presupuesto = datos.presupuesto || [];
                const noches = Math.max(1, Math.round((new Date(form.fecha_fin) - new Date(form.fecha_inicio)) / 86400000));
                const rooms    = parseInt(form.habitaciones) || 0;
                const adrGrupo = parseFloat(form.adr_grupo)  || 0;
                const revFnb   = parseFloat(form.revenue_fnb)  || 0;
                const revSala  = parseFloat(form.revenue_sala) || 0;

                // Periodo LY equivalente
                const anioEvt = parseInt(form.fecha_inicio.slice(0,4));
                const iniLY   = `${anioEvt-1}${form.fecha_inicio.slice(4)}`;
                const finLY   = `${anioEvt-1}${form.fecha_fin.slice(4)}`;

                const diasLY   = produccion.filter(r => { const f = String(r.fecha||"").slice(0,10); return f >= iniLY && f <= finLY; });
                const habOcuLY = diasLY.reduce((a,r) => a+(r.hab_ocupadas||0), 0);
                const revHabLY = diasLY.reduce((a,r) => a+(r.revenue_hab||0), 0);
                const habDisLY = diasLY.reduce((a,r) => a+(r.hab_disponibles||0), 0);

                let adrTransient, factorOcc, fuenteLY = true;
                if (habOcuLY > 0) {
                  adrTransient = Math.round(revHabLY / habOcuLY);
                  factorOcc    = habDisLY > 0 ? Math.min(1, habOcuLY / habDisLY) : 0.7;
                } else {
                  // Fallback: presupuesto del mes de inicio
                  const mesIni = parseInt(form.fecha_inicio.slice(5,7));
                  const pptoM  = presupuesto.find(p => p.mes === mesIni && p.anio === anioEvt)
                              || presupuesto.find(p => p.mes === mesIni);
                  adrTransient = pptoM?.adr_ppto || null;
                  factorOcc    = 0.65;
                  fuenteLY     = false;
                }
                // Sin referencia de precio: mostrar aviso
                if (!adrTransient) return (
                  <div style={{ background:"#F5F5F5", border:`1px solid ${C.border}`, borderRadius:8, padding:"12px 16px" }}>
                    <p style={{ fontSize:11, fontWeight:700, color:C.textLight, textTransform:"uppercase", letterSpacing:1, marginBottom:6 }}>📊 {t("analisis_desplazamiento")}</p>
                    <p style={{ fontSize:12, color:C.textLight }}>{t("sin_datos_ly")} — importa producción o presupuesto para activar este análisis.</p>
                  </div>
                );

                const contribucion        = rooms * adrGrupo * noches + revFnb + revSala;
                const costeDesplazamiento = rooms * adrTransient * noches * factorOcc;
                const valorNeto           = contribucion - costeDesplazamiento;
                const isPos               = adrGrupo > 0 ? valorNeto >= 0 : false;

                // ADR mínimo para que el grupo sea rentable (valor neto ≥ 0)
                const breakEvenHab = costeDesplazamiento - revFnb - revSala;
                const breakEvenAdr = rooms > 0 && noches > 0 && breakEvenHab > 0
                  ? Math.round(breakEvenHab / (rooms * noches)) : null;

                const sinAdr      = adrGrupo === 0;
                const borderColor = sinAdr ? "#2B7EC133" : isPos ? "#1A7A3C33" : "#E85D0433";
                const bgColor     = sinAdr ? "#EEF4FB"   : isPos ? "#F0FBF4"   : "#FFF8F0";

                return (
                  <div style={{ background:bgColor, border:`1px solid ${borderColor}`, borderRadius:8, padding:"14px 16px" }}>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
                      <p style={{ fontSize:11, fontWeight:700, color:C.textLight, textTransform:"uppercase", letterSpacing:1 }}>📊 {t("analisis_desplazamiento")}</p>
                      {!sinAdr && (
                        <span style={{ fontSize:12, fontWeight:700, padding:"3px 10px", borderRadius:6,
                          background: isPos ? C.greenLight : "#FDECEA", color: isPos ? C.green : C.red }}>
                          {isPos ? t("acepta_grupo") : t("revisar_grupo")}
                        </span>
                      )}
                    </div>

                    {sinAdr ? (
                      <p style={{ fontSize:12, color:"#2B7EC1", marginBottom:12 }}>
                        Rellena el ADR del grupo para ver el análisis completo.
                      </p>
                    ) : (
                    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8, marginBottom:12 }}>
                      {[
                        { label: t("contrib_grupo"),   val: `€${Math.round(contribucion).toLocaleString("es-ES")}`,        color: C.text },
                        { label: t("coste_desplaz"),   val: `€${Math.round(costeDesplazamiento).toLocaleString("es-ES")}`, color: "#E85D04" },
                        { label: t("valor_neto"),      val: `${isPos?"+":""}€${Math.round(valorNeto).toLocaleString("es-ES")}`, color: isPos ? C.green : C.red },
                      ].map(({ label, val, color }) => (
                        <div key={label} style={{ background:C.bgCard, borderRadius:6, padding:"8px 10px" }}>
                          <p style={{ fontSize:10, color:C.textLight, marginBottom:3 }}>{label}</p>
                          <p style={{ fontSize:13, fontWeight:800, color }}>{val}</p>
                        </div>
                      ))}
                    </div>
                    )}

                    <div style={{ display:"flex", gap:16, flexWrap:"wrap", borderTop:`1px solid ${C.border}`, paddingTop:10 }}>
                      <div>
                        <p style={{ fontSize:10, color:C.textLight }}>{t("adr_transient_ref")} {!fuenteLY && <span style={{ color:"#E85D04" }}>({t("fuente_ppto")})</span>}</p>
                        <p style={{ fontSize:12, fontWeight:600, color:C.textMid }}>€{adrTransient}</p>
                      </div>
                      <div>
                        <p style={{ fontSize:10, color:C.textLight }}>{t("occ_hist_ly")}</p>
                        <p style={{ fontSize:12, fontWeight:600, color:C.textMid }}>{Math.round(factorOcc*100)}%</p>
                      </div>
                      {breakEvenAdr != null && (
                        <div>
                          <p style={{ fontSize:10, color:C.textLight }}>{t("adr_minimo_rentable")}</p>
                          <p style={{ fontSize:12, fontWeight:700, color: adrGrupo >= breakEvenAdr ? C.green : C.red }}>€{breakEvenAdr}</p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}

              <div style={{ display:"flex", justifyContent:"space-between", marginTop:4 }}>
                {modalGrupo?.id
                  ? <button onClick={()=>eliminar(modalGrupo.id, form.tipo)} style={{ background:"none", border:`1px solid ${C.red}`, color:C.red, borderRadius:7, padding:"8px 16px", fontSize:12, cursor:"pointer" }}>{t("form_eliminar")}</button>
                  : <div/>
                }
                <div style={{ display:"flex", gap:8 }}>
                  <button onClick={()=>setModalGrupo(null)} style={{ background:"none", border:`1px solid ${C.border}`, color:C.textMid, borderRadius:7, padding:"8px 16px", fontSize:12, cursor:"pointer" }}>{t("form_cancelar")}</button>
                  <button onClick={guardar} disabled={guardando||!form.nombre||!form.fecha_inicio||(form.tipo==="grupo"&&!form.fecha_fin)}
                    style={{ background:"#7C3AED", color:"#fff", border:"none", borderRadius:7, padding:"8px 20px", fontSize:13, fontWeight:600, cursor:"pointer", opacity:guardando?0.6:1 }}>
                    {guardando?t("guardando_btn"):t("form_guardar")}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

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

  const inp = { width: "100%", padding: "11px 14px", borderRadius: 8, border: `1.5px solid ${C.border}`, fontSize: 14, fontFamily: "'Plus Jakarta Sans', sans-serif", color: C.text, background: C.bg, outline: "none" };

  return (
    <div style={{ minHeight: "100vh", background: C.bgDeep, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;0,800;1,400;1,600&family=Plus+Jakarta+Sans:wght@300;400;500;600&display=swap'); * { box-sizing: border-box; margin: 0; padding: 0; } html, body, #root { width: 100%; min-height: 100vh; } @keyframes fadeUp { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: translateY(0); } }`}</style>
      <div style={{ width: 420, background: C.bgCard, borderRadius: 20, padding: "40px 36px", boxShadow: "0 32px 80px rgba(0,0,0,0.4)", animation: "fadeUp 0.5s ease both" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginBottom: 32 }}>
          <img src="/fastrev-icon.png" alt="FastRevenue" style={{ height: 52, width: "auto" }} />
          <span style={{ fontSize: 24, fontWeight: 800, color: "#000000", letterSpacing: 0.5, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            FAST<span style={{ fontWeight: 400 }}>REVENUE</span>
          </span>
        </div>
        <div style={{ display: "flex", background: C.bg, borderRadius: 10, padding: 4, marginBottom: 24 }}>
          {[["login","Iniciar sesión"],["register","Crear cuenta"]].map(([k,l]) => (
            <button key={k} onClick={() => { setMode(k); setError(""); setMensaje(""); }} style={{ flex: 1, padding: "9px", borderRadius: 8, border: "none", cursor: "pointer", background: mode===k ? C.bgCard : "transparent", color: mode===k ? C.accent : C.textMid, fontWeight: mode===k ? 600 : 400, fontSize: 13, fontFamily: "'Plus Jakarta Sans', sans-serif", boxShadow: mode===k ? "0 1px 4px rgba(0,0,0,0.08)" : "none" }}>{l}</button>
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
                  <input style={inp} placeholder="Nombre del hotel" value={hotelNombre} onChange={e => setHotelNombre(e.target.value)} />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <div>
                    <p style={{ fontSize: 11, color: C.textLight, marginBottom: 5, textTransform: "uppercase", letterSpacing: "1px" }}>Ciudad</p>
                    <input style={inp} placeholder="Ciudad" value={hotelCiudad} onChange={e => setHotelCiudad(e.target.value)} />
                  </div>
                  <div>
                    <p style={{ fontSize: 11, color: C.textLight, marginBottom: 5, textTransform: "uppercase", letterSpacing: "1px" }}>Habitaciones</p>
                    <input style={inp} placeholder="Nº habitaciones" type="number" value={habitaciones} onChange={e => setHabitaciones(e.target.value)} />
                  </div>
                </div>
                <div style={{ height: 1, background: C.border, margin: "4px 0" }} />
              </>
            )}
            <div>
              <p style={{ fontSize: 11, color: C.textLight, marginBottom: 5, textTransform: "uppercase", letterSpacing: "1px" }}>Email *</p>
              <input style={inp} type="email" value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" />
            </div>
            <div>
              <p style={{ fontSize: 11, color: C.textLight, marginBottom: 5, textTransform: "uppercase", letterSpacing: "1px" }}>Contraseña *</p>
              <input style={inp} type="password" value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key==="Enter" && (mode==="login" ? handleLogin() : handleRegister())} autoComplete="current-password" />
              {mode === "register" && <p style={{ fontSize: 11, color: C.textLight, marginTop: 4 }}>Mín. 8 caracteres, una mayúscula y un número</p>}
            </div>
            {error && <div style={{ background: C.redLight, color: C.red, padding: "10px 14px", borderRadius: 8, fontSize: 13 }}>{error}</div>}
            <button onClick={mode==="login" ? handleLogin : handleRegister} disabled={loading} style={{ width: "100%", padding: "13px", borderRadius: 10, border: "none", background: loading ? C.accentLight : C.accent, color: loading ? C.accentDark : "#fff", fontSize: 14, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer", fontFamily: "'Plus Jakarta Sans', sans-serif", marginTop: 4 }}>
              {loading ? "Cargando..." : mode==="login" ? "Entrar" : "Crear cuenta"}
            </button>
          </div>
        )}
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
                <h2 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:22, fontWeight:700, color:C.text, margin:0 }}>{salaDetalle}</h2>
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
              <h2 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:22, fontWeight:700, color:C.text, margin:0 }}>{salaDetalle}</h2>
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
        <h2 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:24, fontWeight:700, color:C.text, margin:0 }}>Salas</h2>
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
                        <p key={g.id} style={{ fontSize:11, color:"#92600A", margin:"2px 0 0" }}>· {g.nombre} ({g.fecha_inicio})</p>
                      ))}
                      {stats.eventosMes.length > 2 && <p style={{ fontSize:11, color:"#92600A", margin:"2px 0 0" }}>· +{stats.eventosMes.length - 2} más</p>}
                    </>
                }
              </div>

              {stats.proximoEv && (
                <div style={{ background:C.bg, borderRadius:7, padding:"8px 10px", fontSize:11, color:C.textMid }}>
                  Próximo: <span style={{ fontWeight:600, color:C.text }}>{stats.proximoEv.nombre}</span> · {stats.proximoEv.fecha_inicio}
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

const NAV = [
  { key: "dashboard",  icon: "◈",  labelKey: "nav_dashboard" },
  { key: "pickup",                  labelKey: "nav_pickup" },
  { key: "budget",     icon: "💰", labelKey: "nav_budget" },
  { key: "grupos",     labelKey: "nav_grupos" },
  { key: "gestion",    labelKey: "nav_gestion" },
];


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
        <h1 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:26, fontWeight:800, color:C.text, marginBottom:10 }}>{t("empieza_gratis")}</h1>
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
        <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 18, fontWeight: 700, color: C.text, marginBottom: 6 }}>{t(s.titleKey)}</p>
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

export default function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState(() => localStorage.getItem("fr_view") || "dashboard");

  const hoy = new Date();
  const [mesSel,  setMesSel]  = useState(() => { const v = localStorage.getItem("rm_mes");  return v !== null ? parseInt(v) : hoy.getMonth(); });
  const [anioSel, setAnioSel] = useState(() => { const v = localStorage.getItem("rm_anio"); return v !== null ? parseInt(v) : hoy.getFullYear(); });
  const [importar, setImportar] = useState(false);
  const [suscripcion, setSuscripcion] = useState(null);
  const [cargandoSub, setCargandoSub] = useState(true);
  const [confirmCancelar, setConfirmCancelar] = useState(false);
  const [cancelandoSub, setCancelandoSub] = useState(false);
  const [enviandoInformePrueba, setEnviandoInformePrueba] = useState(false);
  const [okInformePrueba, setOkInformePrueba] = useState(false);
  const [errorInformePrueba, setErrorInformePrueba] = useState("");
  const [datos, setDatos] = useState({ produccion: [], presupuesto: [] });
  const [cargandoDatos, setCargandoDatos] = useState(false);

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
          sessionStorage.removeItem("fr_datos_cache_v3");
          sessionStorage.removeItem("fr_datos_ts_v3");
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

  const CACHE_KEY = "fr_datos_cache_v3";
  const CACHE_TS_KEY = "fr_datos_ts_v3";

  const cargarDatos = async (forzar = false) => {
    // Si no forzamos, intentar usar caché
    if (!forzar) {
      try {
        const cached = sessionStorage.getItem(CACHE_KEY);
        const ts = sessionStorage.getItem(CACHE_TS_KEY);
        if (cached && ts) {
          const parsed = JSON.parse(cached);
          parsed.session = session;
          setDatos(parsed);
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

    setCargandoDatos(true);
    const [{ data: produccion }, { data: presupuesto }, { data: hotelData }, { data: gruposData }] = await Promise.all([
      supabase.from("produccion_diaria").select("*").eq("hotel_id", session.user.id).order("fecha"),
      supabase.from("presupuesto").select("*").eq("hotel_id", session.user.id).order("mes"),
      supabase.from("hoteles").select("nombre, ciudad, habitaciones").eq("id", session.user.id).maybeSingle(),
      supabase.from("grupos_eventos").select("*").eq("hotel_id", session.user.id).order("fecha_inicio"),
    ]);
    // Pickup separado — carga en paralelo para máxima velocidad
    let pickupEntries = [];
    try {
      const { data: pe0, count } = await supabase.from("pickup_entries")
        .select("fecha_llegada, fecha_pickup, canal, num_reservas, fecha_salida, noches, precio_total, estado", { count: "exact" })
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
                  .select("fecha_llegada, fecha_pickup, canal, num_reservas, fecha_salida, noches, precio_total, estado")
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
          precio_total:   (g.habitaciones || 0) * (g.adr_grupo || 0),
          estado:         "confirmada",
          _grupo:         true,
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
  const [perfilSeccion, setPerfilSeccion] = useState(null); // null | "suscripcion" | "extranets"
  const [kpiModalApp, setKpiModalApp] = useState(null);
  const [kpiModal, setKpiModal] = useState(null);

  // Escape global: cierra modales en orden de prioridad o vuelve a la vista anterior
  useEffect(() => {
    const handler = (e) => {
      if (e.key !== "Escape") return;
      if (kpiModal)        { setKpiModal(null); return; }
      if (importar)        { setImportar(false); return; }
      if (perfilSeccion)   { setPerfilSeccion(null); setConfirmCancelar(false); return; }
      if (mesDetalle)           { setMesDetalle(null); return; }
      if (desgloseMovimiento)   { setDesgloseMovimiento(null); return; }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [kpiModal, importar, perfilSeccion, mesDetalle, desgloseMovimiento]);
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

  const views = {
    dashboard: (props) => <DashboardView {...props} onMesDetalle={(m, a) => setMesDetalle({ mes: m, anio: a })} onDesgloseMovimiento={tipo => setDesgloseMovimiento(tipo)} kpiModal={kpiModal} setKpiModal={setKpiModal} kpiModalExterno={kpiModalApp} onKpiModalExternoHandled={() => setKpiModalApp(null)} onNavigarGrupos={(subvista, fechaInicio, fechaFin, id) => { localStorage.setItem("fr_grupos_subvista", subvista); sessionStorage.setItem("fr_pending_nuevo", JSON.stringify({ tipo: subvista === "eventos" ? "evento" : "grupo", fecha_inicio: fechaInicio, fecha_fin: fechaFin, highlightId: id||null })); setView("grupos"); localStorage.setItem("fr_view", "grupos"); }} />,
    pickup:    (props) => <PickupView    {...props} />,
    budget:    (props) => <BudgetView    {...props} />,
    grupos:    (props) => <GruposView    {...props} onRecargar={() => cargarDatos(true)} />,
  };
  const View = views[view] || views["dashboard"];

  if (loading) return (
    <div style={{ minHeight: "100vh", background: C.bgDeep, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ color: C.accent, fontFamily: "'Cormorant Garamond', serif", fontSize: 20 }}>{t("cargando")}</div>
    </div>
  );

  if (!session) return <AuthScreen />;
  if (!cargandoSub && (!suscripcion || suscripcion.estado === "cancelada")) return <PantallaSubscripcion session={session} />;

  return (
    <LangContext.Provider value={lang}>
    <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", background: C.bg, minHeight: "100vh" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;0,800;1,400;1,600&family=Plus+Jakarta+Sans:wght@300;400;500;600&display=swap');
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
      <header style={{ background: "#111111", position: "sticky", top: 0, zIndex: 101, minHeight: 52, overflow: "visible" }}>
        <div style={{ width: "100%", minHeight: 52, display: "flex", alignItems: "center", padding: "0 clamp(12px,4vw,32px)", gap: 6, flexWrap: "nowrap", overflow: "visible" }}>
          {/* Logo */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0, marginRight: 8 }}>
            <img src="/fastrev-icon.png" alt="FastRevenue" style={{ height: 36, width: "auto", filter: "invert(1)" }} />
            <span style={{ fontSize: 16, fontWeight: 800, color: "#ffffff", letterSpacing: 0.5, fontFamily: "'Plus Jakarta Sans', sans-serif", whiteSpace: "nowrap" }}>
              FAST<span style={{ fontWeight: 400 }}>REVENUE</span>
            </span>
          </div>

          {/* Nav links */}
          <nav style={{ display: "flex", alignItems: "center", gap: 2 }}>
            {NAV.map(n => {
              const navColor = n.key==="budget" ? "#4ade80" : n.key==="pickup" ? "#fbbf24" : n.key==="grupos" ? "#a78bfa" : "#60a5fa";
              const isActive = view===n.key;
              return (
                <button key={n.key} id={`ob-nav-${n.key}`} onClick={() => { setView(n.key); setMesDetalle(null); localStorage.setItem("fr_view", n.key); }}
                  style={{ padding: "6px clamp(6px,2vw,16px)", borderRadius: 7, border: "none", cursor: "pointer", background: isActive ? "rgba(255,255,255,0.12)" : "transparent", color: "#fff", fontSize: "clamp(11px,2.5vw,13px)", fontWeight: isActive ? 700 : 400, fontFamily: "'Plus Jakarta Sans', sans-serif", transition: "all 0.15s", whiteSpace: "nowrap", outline: isActive ? `1.5px solid rgba(255,255,255,0.3)` : "1.5px solid transparent" }}>
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
                <div style={{ position:"absolute", top:42, right:0, width:240, background:C.bgCard, border:`1px solid ${C.border}`, borderRadius:10, boxShadow:"0 4px 24px rgba(0,0,0,0.15)", zIndex:200, overflow:"hidden" }}>
                  <div style={{ padding:"10px 16px", borderBottom:`1px solid ${C.border}`, background:C.bg }}>
                    <p style={{ fontSize:11, color:C.textLight, marginBottom:2 }}>{t("conectado_como")}</p>
                    <p style={{ fontSize:12, fontWeight:600, color:C.text, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{session.user.email}</p>
                  </div>
                  {[
                    { label:t("suscripcion"), key:"suscripcion" },
                    { label:t("extranets"), key:"extranets" },
                    { label:t("informe_mensual"), key:"informe" },
                  ].map(op => (
                    <button key={op.key} onClick={async () => {
                        if (op.key === "informe") {
                          setMostrarPerfil(false);
                          setGenerandoPDF(true);
                          await generarReportePDF(datos, mesSel, anioSel, datos.hotel?.nombre||"Mi Hotel");
                          setGenerandoPDF(false);
                        } else {
                          setPerfilSeccion(op.key);
                          setMostrarPerfil(false);
                        }
                      }}
                      style={{ width:"100%", display:"flex", alignItems:"center", padding:"10px 16px", background:"transparent", border:"none", borderBottom:`1px solid ${C.border}`, cursor:"pointer", fontSize:12, color:C.text, fontFamily:"'Plus Jakarta Sans',sans-serif", textAlign:"left", letterSpacing:0.2 }}
                      onMouseEnter={e=>e.currentTarget.style.background=C.bg}
                      onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                      {op.key === "informe" && generandoPDF ? t("generando") : op.label}
                    </button>
                  ))}
                  <div style={{ padding:"10px 16px", borderTop:`1px solid ${C.border}`, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                    <span style={{ fontSize:12, color:C.textMid, fontFamily:"'Plus Jakarta Sans',sans-serif" }}>{t("idioma") ?? "Idioma"}</span>
                    <select value={lang} onChange={e => { setLang(e.target.value); localStorage.setItem("fr_lang", e.target.value); }}
                      style={{ border:`1px solid ${C.border}`, borderRadius:6, padding:"3px 6px", fontSize:11, fontWeight:500, color:C.text, background:C.bgCard, cursor:"pointer", fontFamily:"'Plus Jakarta Sans',sans-serif", outline:"none" }}>
                      <option value="es">Español</option>
                      <option value="en">English</option>
                      <option value="fr">Français</option>
                    </select>
                  </div>
                  <button onClick={handleLogout}
                    style={{ width:"100%", display:"flex", alignItems:"center", padding:"10px 16px", background:"transparent", border:"none", borderTop:`1px solid ${C.border}`, cursor:"pointer", fontSize:12, color:C.red, fontFamily:"'Plus Jakarta Sans',sans-serif", textAlign:"left", letterSpacing:0.2 }}
                    onMouseEnter={e=>e.currentTarget.style.background=C.redLight}
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
      <WeatherBar ciudad={datos.hotel?.ciudad} datos={datos} lang={lang} />
      <div style={{ height: 8, background: "#fff", width: "100%" }} />

      {/* Main */}
      <main id="main-scroll" onScroll={e => localStorage.setItem("fr_scroll", e.currentTarget.scrollTop)} style={{ padding: "clamp(14px,4vw,28px) clamp(12px,4vw,32px)", width: "100%", boxSizing: "border-box" }}>


        {/* Gestión siempre montada para no perder estado al cambiar de pestaña */}
        <div style={{ display: !cargandoDatos && !mesDetalle && !desgloseMovimiento && view === "gestion" ? "block" : "none", width:"100%" }}>
          <ImportarExcel fullPage
            onClose={() => { setView("dashboard"); localStorage.setItem("fr_view","dashboard"); }}
            session={session} hotelNombre={datos.hotel?.nombre||''}
            onImportado={() => { sessionStorage.removeItem("fr_datos_cache_v3"); sessionStorage.removeItem("fr_datos_ts_v3"); localStorage.removeItem("fr_scroll"); cargarDatos(true); }}
            onProduccionDirecta={(row) => setDatos(prev => ({ ...prev, produccion: [...(prev.produccion||[]).filter(r => r.fecha !== row.fecha), row].sort((a,b) => a.fecha.localeCompare(b.fecha)) }))}
          />
        </div>

        {cargandoDatos ? <LoadingSpinner /> : mesDetalle ? (
          <div style={{ width:"100%" }}><MonthDetailView datos={datos} mes={mesDetalle.mes} anio={mesDetalle.anio} onBack={() => setMesDetalle(null)} /></div>
        ) : desgloseMovimiento ? (
          <div style={{ width:"100%" }}><DesgloseMovimientoView datos={datos} tipo={desgloseMovimiento} onBack={() => setDesgloseMovimiento(null)} /></div>
        ) : view !== "gestion" ? (
          <div style={{ width:"100%" }}><View datos={datos} mes={mesSel} anio={anioSel} onGuardado={cargarDatos} onPeriodo={(m,a) => { setMesSel(m); setAnioSel(a); localStorage.setItem("rm_mes", m); localStorage.setItem("rm_anio", a); }} /></div>
        ) : null}
      </main>


      {/* Modal Suscripción */}
      {perfilSeccion === "suscripcion" && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.6)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:1000 }}>
          <div style={{ background:C.bgCard, borderRadius:16, padding:"36px 40px", width:440, boxShadow:"0 24px 60px rgba(0,0,0,0.2)", fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:24 }}>
              <h2 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:20, fontWeight:700, color:C.text }}>Gestión de suscripción</h2>
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
                  <span style={{ fontSize:12, fontWeight:700, color:C.text }}>{new Date(suscripcion.trial_end).toLocaleDateString("es-ES")}</span>
                </div>
              )}
              {suscripcion?.periodo_fin && suscripcion.estado === "activa" && (
                <div style={{ display:"flex", justifyContent:"space-between" }}>
                  <span style={{ fontSize:12, color:C.textMid }}>Próxima renovación</span>
                  <span style={{ fontSize:12, fontWeight:700, color:C.text }}>{new Date(suscripcion.periodo_fin).toLocaleDateString("es-ES")}</span>
                </div>
              )}
              {suscripcion?.periodo_fin && suscripcion.estado === "cancelando" && (
                <div style={{ display:"flex", justifyContent:"space-between" }}>
                  <span style={{ fontSize:12, color:C.textMid }}>Acceso hasta</span>
                  <span style={{ fontSize:12, fontWeight:700, color:C.text }}>{new Date(suscripcion.periodo_fin).toLocaleDateString("es-ES")}</span>
                </div>
              )}
            </div>

            {/* Badge plan */}
            <div style={{ background:C.accentLight, borderRadius:10, padding:"12px 16px", marginBottom:20, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <div>
                <p style={{ fontSize:13, fontWeight:700, color:C.accent }}>FastRevenue Básico</p>
                <p style={{ fontSize:11, color:C.textMid }}>€49/mes + IVA</p>
              </div>
              <span style={{ fontSize:11, fontWeight:600,
                color: suscripcion?.estado === "cancelando" ? C.gold : C.green,
                background: suscripcion?.estado === "cancelando" ? "#FEF3C7" : C.greenLight,
                padding:"3px 10px", borderRadius:20 }}>
                {suscripcion?.estado === "cancelando" ? "Cancela pronto" : "Activo"}
              </span>
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
                    const NO_OTA_KEYS2 = ['directo', 'teléfono', 'telefono', 'email', 'empresa', 'corporativo', 'grupos', 'mice'];
                    const isOTA2 = (canal) => { const c = (canal || '').toLowerCase(); return !NO_OTA_KEYS2.some(k => c.includes(k)); };
                    const normCanal2 = (canal) => { const c = (canal || '').toLowerCase().trim(); if (c.includes('directo') || c.includes('web')) return 'Directo / Web'; if (c.includes('teléfono') || c.includes('telefono') || c.includes('email')) return 'Teléfono / Email'; if (c.includes('empresa') || c.includes('corporativo')) return 'Empresa / Corp.'; if (c.includes('grupo') || c.includes('mice')) return 'Grupos / MICE'; return canal || 'Directo / Web'; };
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
                    const avgTrevpar2= totHabDisp2 > 0 ? totRevTotal2 / totHabDisp2 : null;
                    const canalMap2 = {};
                    for (const p of (pickupMes2 || [])) { const peso = p.precio_total || (p.num_reservas || 1); const key = isOTA2(p.canal) ? 'OTAs' : normCanal2(p.canal); canalMap2[key] = (canalMap2[key] || 0) + peso; }
                    const canalesRevenue2 = Object.entries(canalMap2).filter(([,v])=>v>0).sort((a,b)=>b[1]-a[1]).map(([canal,revenue])=>({canal,revenue}));
                    let revGrupos2 = 0;
                    for (const g of (gruposMes2 || [])) { const noches = Math.max(1, (new Date(g.fecha_fin+'T00:00:00') - new Date(g.fecha_inicio+'T00:00:00')) / 86400000); const peso = g.estado === 'cotizado' ? 0.5 : 1.0; revGrupos2 += ((g.habitaciones||0)*(g.adr_grupo||0)*noches+(g.revenue_fnb||0)+(g.revenue_sala||0))*peso; }
                    const revIndividual2 = Math.max(0, totRevHab2 - revGrupos2);
                    const occ    = ultimoDia.hab_disponibles > 0 ? ultimoDia.hab_ocupadas / ultimoDia.hab_disponibles * 100 : null;
                    const adr    = ultimoDia.adr    ?? (ultimoDia.hab_ocupadas > 0 && ultimoDia.revenue_hab ? ultimoDia.revenue_hab / ultimoDia.hab_ocupadas : null);
                    const revpar = ultimoDia.revpar ?? (ultimoDia.hab_disponibles > 0 && ultimoDia.revenue_hab ? ultimoDia.revenue_hab / ultimoDia.hab_disponibles : null);
                    const trevpar= ultimoDia.trevpar?? (ultimoDia.hab_disponibles > 0 && ultimoDia.revenue_total ? ultimoDia.revenue_total / ultimoDia.hab_disponibles : null);
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
          <div style={{ background:C.bgCard, borderRadius:16, padding:"36px 40px", width:480, boxShadow:"0 24px 60px rgba(0,0,0,0.2)", fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
              <h2 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:20, fontWeight:700, color:C.text }}>Extranets</h2>
              <button onClick={()=>setPerfilSeccion(null)} style={{ background:"none", border:`1px solid ${C.border}`, borderRadius:6, width:28, height:28, cursor:"pointer", fontSize:15, color:C.textLight, display:"flex", alignItems:"center", justifyContent:"center", padding:0 }}>✕</button>
            </div>
            <p style={{ fontSize:12, color:C.textMid, marginBottom:24 }}>Accede directamente a la extranet de cada canal</p>
            {[
              { nombre:"Brand Web", desc:"Motor de reservas directo", url:"#", logo:"🌐", color:"#004B87" },
              { nombre:"Booking.com", desc:"Extranet de Booking.com", url:"https://admin.booking.com", logo:"🔵", color:"#003580" },
              { nombre:"Expedia", desc:"Extranet de Expedia Group", url:"https://www.expediapartnercentral.com", logo:"🟡", color:"#FFD700" },
            ].map((ex, i) => (
              <a key={i} href={ex.url} target={ex.url==="#"?"_self":"_blank"} rel="noreferrer"
                style={{ display:"flex", alignItems:"center", gap:14, padding:"14px 16px", borderRadius:10, border:`1px solid ${C.border}`, marginBottom:10, textDecoration:"none", background:C.bg, transition:"all 0.15s" }}
                onMouseEnter={e=>{ e.currentTarget.style.background=C.accentLight; e.currentTarget.style.borderColor=C.accent; }}
                onMouseLeave={e=>{ e.currentTarget.style.background=C.bg; e.currentTarget.style.borderColor=C.border; }}>
                <div style={{ width:40, height:40, borderRadius:8, background:ex.color+"18", display:"flex", alignItems:"center", justifyContent:"center", fontSize:22, flexShrink:0 }}>{ex.logo}</div>
                <div style={{ flex:1 }}>
                  <p style={{ fontSize:13, fontWeight:700, color:C.text, marginBottom:2 }}>{ex.nombre}</p>
                  <p style={{ fontSize:11, color:C.textMid }}>{ex.desc}</p>
                </div>
                <span style={{ fontSize:11, color:C.textLight }}>→</span>
              </a>
            ))}
          </div>
        </div>
      )}
      {onboardingStep !== null && <OnboardingOverlay step={onboardingStep} onNext={handleOnboardingNext} onSkip={handleOnboardingSkip} />}
    </div>
    </LangContext.Provider>
  );
}