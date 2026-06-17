import React from "react";
import { C, KPI_HELP } from "../constants";

export const KpiCard = React.memo(function KpiCard({ label, subtitle, value, changeLm, upLm, changeLy, upLy, i, onClick, accentColor }) {
  const kpiAccent = accentColor || C.accent;
  const pct = changeLm && changeLm !== "—" ? parseFloat(changeLm) : null;
  const isFlat = pct !== null && Math.abs(pct) < 1;
  const indicatorColor = pct === null ? null : isFlat ? "#B8860B" : upLm ? "#16a34a" : "#D32F2F";
  const indicatorIcon  = pct === null ? null : isFlat ? "—" : upLm ? "↑" : "↓";
  const [hovered, setHovered] = React.useState(false);
  const [helpOpen, setHelpOpen] = React.useState(false);
  const wrapRef = React.useRef(null);
  const help = KPI_HELP[label];

  React.useEffect(() => {
    if (!helpOpen) return;
    const handler = e => { if (wrapRef.current && !wrapRef.current.contains(e.target)) setHelpOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [helpOpen]);

  return (
    <div ref={wrapRef} style={{ position:"relative", height:"100%", animation:`fadeUp 0.5s ease ${i * 0.08}s both` }}>
      <div onClick={onClick} style={{
        background: "#f5f5f5", border: `1.5px solid #111111`, borderRadius: 8,
        padding: "14px 18px",
        position: "relative", overflow: "hidden",
        boxShadow: "0 1px 4px rgba(0,0,0,0.06)", cursor: "pointer",
        transition: "box-shadow 0.2s, transform 0.2s, border-color 0.2s, background 0.2s",
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center",
        height: "100%", boxSizing: "border-box",
      }}
      onMouseEnter={e=>{
        setHovered(true);
        e.currentTarget.style.boxShadow=`0 6px 24px rgba(0,0,0,0.18)`;
        e.currentTarget.style.transform="translateY(-2px)";
        e.currentTarget.style.borderColor="#111111";
      }}
      onMouseLeave={e=>{
        setHovered(false);
        e.currentTarget.style.boxShadow="0 1px 4px rgba(0,0,0,0.06)";
        e.currentTarget.style.transform="translateY(0)";
        e.currentTarget.style.borderColor="#111111";
        e.currentTarget.style.background="#f5f5f5";
      }}>
        <p style={{ fontSize: 11, color: C.text, textTransform: "uppercase", letterSpacing: "1.5px", fontWeight: 700 }}>{label}</p>
        {subtitle && <p style={{ fontSize: 9, color: C.textMid, marginTop: 1, letterSpacing: "0.5px", opacity: 0.7 }}>{subtitle}</p>}
        <div style={{ position:"relative", margin:"5px 0 4px" }}>
          <p style={{ textAlign:"center", fontSize:"clamp(18px,4vw,24px)", fontWeight:700, fontFamily:"'Plus Jakarta Sans', sans-serif", color:C.text, margin:0, letterSpacing:"-1px", lineHeight:1 }}>{value}</p>
          {indicatorColor && (
            <div style={{ position:"absolute", top:0, bottom:0, left:"calc(50% + 46px)", display:"flex", flexDirection:"column", justifyContent:"center", alignItems:"flex-start", gap:2 }}>
              <span style={{ fontSize:13, fontWeight:800, color:indicatorColor, lineHeight:1, whiteSpace:"nowrap" }}>{indicatorIcon} <span style={{ fontSize:11, fontWeight:600 }}>{changeLm}</span></span>
              <span style={{ fontSize:9, color:C.textLight, lineHeight:1 }}>vs LM</span>
            </div>
          )}
        </div>
        {help && (hovered || helpOpen) && (
          <button onClick={e=>{ e.stopPropagation(); setHelpOpen(o=>!o); }}
            style={{ position:"absolute", top:7, right:7, width:17, height:17, borderRadius:"50%", border:"1.5px solid #aaa", background:"#fff", color:"#666", fontSize:10, fontWeight:700, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", padding:0, lineHeight:1, transition:"all 0.15s" }}
            onMouseEnter={e=>{ e.currentTarget.style.background="#111"; e.currentTarget.style.color="#fff"; e.currentTarget.style.borderColor="#111"; }}
            onMouseLeave={e=>{ e.currentTarget.style.background="#fff"; e.currentTarget.style.color="#666"; e.currentTarget.style.borderColor="#aaa"; }}
          >?</button>
        )}
      </div>
      {helpOpen && help && (
        <div style={{ position:"absolute", bottom:"calc(100% + 8px)", left:0, right:0, background:"#fff", border:"1.5px solid #111", borderRadius:10, padding:"14px 16px", zIndex:200, boxShadow:"0 8px 24px rgba(0,0,0,0.13)", fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
          <p style={{ fontSize:10, color:"#888", fontWeight:600, textTransform:"uppercase", letterSpacing:"1px", marginBottom:6 }}>Cómo se calcula</p>
          <p style={{ fontSize:11, color:"#333", fontWeight:600, marginBottom:10, background:"#f5f5f5", padding:"6px 10px", borderRadius:6, fontFamily:"monospace" }}>{help.formula}</p>
          <p style={{ fontSize:12, color:"#555", lineHeight:1.55, margin:0 }}>{help.desc}</p>
        </div>
      )}
    </div>
  );
}, (prev, next) =>
  prev.label === next.label && prev.subtitle === next.subtitle &&
  prev.value === next.value && prev.changeLm === next.changeLm &&
  prev.upLm === next.upLm && prev.changeLy === next.changeLy &&
  prev.upLy === next.upLy && prev.i === next.i && prev.accentColor === next.accentColor
);
