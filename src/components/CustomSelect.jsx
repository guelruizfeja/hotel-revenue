import React from "react";

export function CustomSelect({ value, onChange, options, style }) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef(null);
  const selected = options.find(o => o.value === value) || options[0];
  React.useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);
  return (
    <div ref={ref} style={{ position:"relative", ...style }}>
      <button type="button" onClick={() => setOpen(o => !o)}
        style={{ width:"100%", display:"flex", alignItems:"center", justifyContent:"space-between", gap:8,
          padding:"8px 10px", borderRadius:7, border:"1px solid #111111", background:"#fff",
          cursor:"pointer", fontFamily:"'Plus Jakarta Sans',sans-serif", fontSize:13, fontWeight:500,
          color:"#1A1A1A", boxSizing:"border-box" }}>
        <span style={{ display:"flex", alignItems:"center", gap:7 }}>
          {selected.color && <span style={{ width:8, height:8, borderRadius:"50%", background:selected.color, flexShrink:0, display:"inline-block" }}/>}
          <span style={{ color: selected.color || "#1A1A1A", fontWeight: selected.color ? 700 : 500 }}>{selected.label}</span>
        </span>
        <span style={{ fontSize:9, color:"#888", transform: open ? "rotate(180deg)" : "none", transition:"transform 0.15s" }}>▼</span>
      </button>
      {open && (
        <div style={{ position:"absolute", top:"calc(100% + 4px)", left:0, right:0, zIndex:999,
          background:"#fff", border:"1px solid #111111", borderRadius:8,
          boxShadow:"0 4px 16px rgba(0,0,0,0.12)", overflow:"hidden" }}>
          {options.map(o => (
            <button key={o.value} type="button"
              onClick={() => { onChange(o.value); setOpen(false); }}
              style={{ width:"100%", display:"flex", alignItems:"center", gap:8, padding:"9px 12px",
                background: o.value === value ? (o.bg || "#F5F5F5") : "transparent",
                border:"none", cursor:"pointer", fontFamily:"'Plus Jakarta Sans',sans-serif",
                fontSize:13, fontWeight: o.value === value ? 700 : 500, color:"#1A1A1A",
                textAlign:"left", transition:"background 0.12s" }}
              onMouseEnter={e => { if (o.value !== value) e.currentTarget.style.background = "#F5F5F5"; }}
              onMouseLeave={e => { e.currentTarget.style.background = o.value === value ? (o.bg || "#F5F5F5") : "transparent"; }}>
              {o.color && <span style={{ width:8, height:8, borderRadius:"50%", background:o.color, flexShrink:0, display:"inline-block" }}/>}
              <span style={{ color: o.color || "#1A1A1A", fontWeight: o.color ? 700 : 500 }}>{o.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
