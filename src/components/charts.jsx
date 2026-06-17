import { useState } from "react";
import { C } from "../constants";

export const AnimatedBar = (props) => {
  const { x, y, width, height, fill, onClick, highlighted } = props;
  const [animKey, setAnimKey] = useState(0);
  if (!height || height <= 0) return null;
  return (
    <g onClick={() => onClick && onClick(props)} style={{ cursor:"pointer", outline:"none" }}
      onMouseEnter={() => setAnimKey(k => k + 1)}>
      <rect x={x} y={y} width={width} height={height} rx={4} ry={4} fill={fill}
        opacity={highlighted ? 1 : 0.82}
        style={{ transition:"opacity 0.15s" }}/>
      {highlighted && (
        <rect x={x-1} y={y-1} width={width+2} height={height+1} rx={4} ry={4}
          fill="none" stroke="#ffffff" strokeWidth={1.5} strokeOpacity={0.5}/>
      )}
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

export const SimpleBar = ({ x, y, width, height, fill, fillOpacity }) => {
  if (!height || height <= 0) return null;
  return <rect x={x} y={y} width={width} height={height} rx={4} ry={4} fill={fill} fillOpacity={fillOpacity}/>;
};

export const TOOLTIP_COLORS = {
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

export const CustomTooltip = ({ active, payload, label, unit }) => {
  if (!active || !payload?.length) return null;
  const OCC_NAMES = ["Ocupación","occ","OCC","Occupancy"];
  const raw = payload[0]?.payload || {};
  let displayLabel = raw.fecha || raw.mesNombre || label;
  if (raw.mesNombre && raw.anioIdx) displayLabel = `${raw.mesNombre} ${raw.anioIdx}`;
  return (
    <div style={{ background:"#f5f5f5", border:"1.5px solid #111111", borderRadius:8, padding:"12px 16px", boxShadow:"0 1px 4px rgba(0,0,0,0.06)", minWidth:148 }}>
      <p style={{ color:"#111111", fontSize:10, fontWeight:700, marginBottom:8, textTransform:"uppercase", letterSpacing:"1.5px" }}>{displayLabel}</p>
      {payload.map((p, i) => {
        const isOcc = unit === "%" || OCC_NAMES.includes(p.name);
        const val = typeof p.value === 'number'
          ? isOcc ? `${Math.round(p.value)}%` : `${Math.round(p.value).toLocaleString("es-ES")}€`
          : p.value;
        const color = (typeof p.color === "string" && !p.color.startsWith("url(")) ? p.color : (TOOLTIP_COLORS[p.name] || TOOLTIP_COLORS[p.dataKey] || "#7A9CC8");
        return (
          <div key={i} style={{ display:"flex", alignItems:"center", gap:7, margin:"3px 0" }}>
            <span style={{ width:8, height:8, borderRadius:2, background:color, flexShrink:0, display:"inline-block" }}/>
            <span style={{ color:"rgba(0,0,0,0.65)", fontSize:12 }}>{p.name}: <span style={{ color:"#111111", fontWeight:700 }}>{val}</span></span>
          </div>
        );
      })}
    </div>
  );
};
