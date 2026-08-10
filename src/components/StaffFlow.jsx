import React, { useState, useEffect } from "react";
import { C } from "../constants";
import { supabase } from "../supabase";
import { StaffReservaForm } from "./StaffReservaForm";
import { ImportarExcel } from "./ImportarExcel";

// Flujo restringido del rol "Usuario" (recepción): alta de reservas del día
// → producción diaria → confirmación → solo edición de lo ya subido.
// Sin NAV: esta pantalla es todo lo que ve este rol.
export function StaffFlow({ session, hotelId }) {
  const [step, setStep] = useState("reservas"); // reservas | produccion | confirmacion | edicion
  const [hotelHabDisponibles, setHotelHabDisponibles] = useState(0);
  const [grupos, setGrupos] = useState([]);

  useEffect(() => {
    supabase.from("hoteles").select("habitaciones_disponibles").eq("id", hotelId).maybeSingle()
      .then(({ data }) => setHotelHabDisponibles(data?.habitaciones_disponibles || 0));
    supabase.from("grupos_eventos").select("estado,fecha_inicio,fecha_fin,revenue_fnb,revenue_sala").eq("hotel_id", hotelId)
      .then(({ data }) => setGrupos(data || []));
  }, [hotelId]);

  const header = (
    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"14px 20px", borderBottom:`1px solid ${C.border}`, background:"#111111" }}>
      <div style={{ display:"flex", alignItems:"center", gap:8 }}>
        <img src="/fastrev-icon.png" alt="FastRevenue" style={{ height:26, width:"auto", filter:"invert(1)" }} />
        <span style={{ color:"#fff", fontWeight:800, fontSize:14, letterSpacing:0.5 }}>FAST<span style={{ fontWeight:400 }}>REVENUE</span></span>
      </div>
      <button onClick={() => supabase.auth.signOut()}
        style={{ background:"none", border:"1px solid #ffffff55", color:"#fff", borderRadius:7, padding:"6px 14px", fontSize:12, cursor:"pointer" }}>
        Cerrar sesión
      </button>
    </div>
  );

  return (
    <div style={{ minHeight:"100vh", background:C.bg, fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
      {header}

      {step === "reservas" && (
        <StaffReservaForm hotelId={hotelId} onContinuar={() => setStep("produccion")} />
      )}

      {(step === "produccion" || step === "edicion") && (
        <ImportarExcel
          session={session}
          soloProduccion
          hotelIdOverride={hotelId}
          hotelHabDisponibles={hotelHabDisponibles}
          grupos={grupos}
          fullPage
          onImportado={() => {}}
          onGuardadoProduccionStaff={() => setStep("confirmacion")}
          onVolverStaff={step === "produccion" ? () => setStep("reservas") : undefined}
        />
      )}

      {step === "confirmacion" && (
        <div style={{ maxWidth:480, margin:"0 auto", padding:"60px 20px", textAlign:"center" }}>
          <div style={{ fontSize:48, marginBottom:16 }}>✓</div>
          <h2 style={{ fontSize:20, fontWeight:700, color:C.text, marginBottom:8 }}>Datos subidos correctamente</h2>
          <p style={{ fontSize:13, color:C.textMid, marginBottom:28 }}>
            Ya has terminado por hoy. Si te has equivocado en algo, puedes corregirlo.
          </p>
          <button onClick={() => setStep("edicion")}
            style={{ padding:"11px 24px", borderRadius:9, background:"none", border:`1px solid ${C.border}`, color:C.textMid, fontSize:13, fontWeight:600, cursor:"pointer" }}>
            Editar datos
          </button>
        </div>
      )}
    </div>
  );
}
