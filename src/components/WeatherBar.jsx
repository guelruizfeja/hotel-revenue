import { useState, useEffect, useMemo } from "react";
import { dmy } from "../constants";

export function WeatherBar({ ciudad, datos, lang, occDeTicker, stickyTop = 52, barColor = "#1a1a1a" }) {
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
    const fmtFecha = dmy;
    const getFechaSalida = e => {
      if (e.fecha_salida) return String(e.fecha_salida).slice(0,10);
      if (e.noches && e.fecha_llegada) { const d=new Date(String(e.fecha_llegada).slice(0,10)+"T00:00:00"); d.setDate(d.getDate()+Number(e.noches)); return d.toISOString().slice(0,10); }
      return null;
    };
    const rawActivas = pickupEntries.filter(e => !e._grupo && (e.estado||"confirmada") !== "cancelada" && (e.estado||"confirmada") !== "tentativo");
    const dedupMap = {};
    const individuales = [];
    rawActivas.forEach(e => {
      const fl = String(e.fecha_llegada||"").slice(0,10);
      const fs = getFechaSalida(e) || "";
      if (e.es_individual) { individuales.push(e); return; }
      const key = `${fl}|${e.canal||""}|${fs}`;
      const fp  = String(e.fecha_pickup||"").slice(0,10);
      if (!dedupMap[key] || fp > dedupMap[key]._fp) dedupMap[key] = { ...e, _fp: fp };
    });
    const activas = [...individuales, ...Object.values(dedupMap)];

    const entradasHoy  = activas.filter(e => String(e.fecha_llegada||"").slice(0,10) === hoyStr).reduce((a,e)=>a+(e.num_reservas||1),0);
    const salidasHoy   = activas.filter(e => getFechaSalida(e) === hoyStr).reduce((a,e)=>a+(e.num_reservas||1),0);
    const entradasAyer = activas.filter(e => String(e.fecha_llegada||"").slice(0,10) === ayerStr).reduce((a,e)=>a+(e.num_reservas||1),0);
    const salidasAyer  = activas.filter(e => getFechaSalida(e) === ayerStr).reduce((a,e)=>a+(e.num_reservas||1),0);
    const occHoy  = occDeTicker?.occHoy  ?? null;
    const occAyer = occDeTicker?.occAyer ?? null;
    const fmtDelta = (hoy,ayer) => { if(ayer==null)return ""; const d=hoy-ayer; return ` (${d>=0?"+":""}${d}%)`; };
    {
      const parts = [];
      if (occHoy != null) parts.push(`Ocupación ${occHoy}%${fmtDelta(occHoy,occAyer)}`);
      parts.push(`Entradas ${entradasHoy}${entradasAyer>0?` (ayer ${entradasAyer})`:""}`);
      parts.push(`Salidas ${salidasHoy}${salidasAyer>0?` (ayer ${salidasAyer})`:""}`);
      msgs.push(`Movimiento hoy  ·  ${parts.join("  ·  ")}`);
    }

    const grupos = datos?.grupos || [];
    const gruposHoy = grupos.filter(g => g.fecha_inicio <= hoyStr && (g.fecha_fin||g.fecha_inicio) >= hoyStr && (g.estado==="confirmado"||g.estado==="cotizado"||g.estado==="tentativo"));
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
    return full + full;
  }, [datos?.produccion?.length, datos?.pickupEntries?.length, datos?.grupos?.length, occDeTicker]);

  const duration = Math.max(25, (tickerText.length / 2) * 0.13);

  if (!ciudad) return null;

  return (
    <div style={{ background:barColor, borderBottom:`1px solid rgba(255,255,255,0.08)`, position:"sticky", top:stickyTop, zIndex:99, height:40, display:"flex", alignItems:"center", overflow:"hidden", transition:"background 0.2s" }}>
      <div style={{ flex:1, overflow:"hidden", padding:"0 16px 0 clamp(12px,4vw,32px)" }}>
        {tickerText ? (
          <div style={{ display:"inline-block", whiteSpace:"nowrap", fontSize:11, color:"#fff", fontFamily:"'Plus Jakarta Sans',sans-serif", fontWeight:500, animationName:"ticker", animationTimingFunction:"linear", animationIterationCount:"infinite", animationDuration:`${duration}s` }}>
            {tickerText}
          </div>
        ) : (
          <span style={{ fontSize:11, color:"#fff" }}>Cargando datos...</span>
        )}
      </div>
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
