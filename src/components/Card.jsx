import { C } from "../constants";
import { useT } from "../i18n";

export function Card({ children, style = {}, onClick }) {
  return (
    <div onClick={onClick} style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 10, padding: "22px 24px", width: "100%", ...style }}>
      {children}
    </div>
  );
}

export function LoadingSpinner() {
  const t = useT();
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: 60 }}>
      <div style={{ color: C.accent, fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 16 }}>{t("cargando_datos")}</div>
    </div>
  );
}

export function EmptyState({ mensaje }) {
  const t = useT();
  return (
    <div style={{ textAlign: "center", padding: 60 }}>
      <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 18, fontWeight: 700, color: C.text, marginBottom: 8 }}>{t("sin_datos")}</p>
      <p style={{ fontSize: 13, color: C.textLight }}>{mensaje || t("importa_excel")}</p>
    </div>
  );
}
