'use client';

import Link from "next/link";

// Esta ruta ("INTEGRIDAD DE EVIDENCIA") antes era un unico Audit Control
// Center que mezclaba casos de cripto y de auditoria financiera. Se separo
// en dos modulos independientes (/dashboard/audit/crypto y
// /dashboard/audit/financiero) porque son dominios distintos para quien
// audita. Esta pagina se deja viva como un selector simple, en vez de un
// redirect automatico, para no romper enlaces guardados a /dashboard/audit.
export default function AuditChooserPage() {
  const cardStyle: React.CSSProperties = {
    display: "block",
    padding: 24,
    borderRadius: 12,
    border: "1px solid #2A3040",
    background: "#151A24",
    color: "white",
    textDecoration: "none",
    width: 320,
  };

  return (
    <div style={{ padding: 40, fontFamily: "monospace", color: "white" }}>
      <h1>AUDIT CONTROL CENTER</h1>
      <p style={{ color: "#8B93A7", marginTop: 8 }}>
        Elige la cadena de custodia que quieres revisar.
      </p>

      <div style={{ display: "flex", gap: 24, marginTop: 32, flexWrap: "wrap" }}>
        <Link href="/dashboard/audit/crypto" style={cardStyle}>
          <h2 style={{ margin: 0, color: "#2DD4BF" }}>Cripto</h2>
          <p style={{ marginTop: 10, color: "#8B93A7" }}>
            Cadena de custodia de casos de wallets/blockchain analizados.
          </p>
        </Link>
        <Link href="/dashboard/audit/financiero" style={cardStyle}>
          <h2 style={{ margin: 0, color: "#facc15" }}>Financiero</h2>
          <p style={{ marginTop: 10, color: "#8B93A7" }}>
            Cadena de custodia de casos de auditoria financiera (corporativo, petrolero/PDVSA, municipal).
          </p>
        </Link>
      </div>
    </div>
  );
}