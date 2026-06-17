import { C } from "../constants";
import { useT } from "../i18n";

export function PeriodSelectorInline({ mes, anio, onChange, aniosDisponibles, allowFuture = false }) {
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
                border: esHoyMes && !activo ? `1.5px solid ${C.text}44` : `1px solid ${activo?C.text:C.border}`,
                background: activo ? C.text : "transparent",
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
