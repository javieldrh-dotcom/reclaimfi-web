"use client";
import Link from "next/link";

export default function HomePage() {
  return (
    <div style={{ background: "#0B0E14", minHeight: "100vh", color: "white", fontFamily: "'IBM Plex Sans', sans-serif" }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 40px", borderBottom: "1px solid #1F2937" }}>
        <div style={{ fontSize: 20, fontWeight: 900, color: "#2DD4BF", fontFamily: "'IBM Plex Serif', serif" }}>
          Audit Global Intelligence
        </div>
        <Link href="/login" style={{ padding: "10px 20px", border: "1px solid #2DD4BF", borderRadius: 8, color: "#2DD4BF", textDecoration: "none", fontSize: 14, fontWeight: 700 }}>
          Acceso Seguro
        </Link>
      </header>

      <section style={{ padding: "80px 40px", textAlign: "center", maxWidth: 900, margin: "0 auto" }}>
        <div style={{ display: "inline-block", padding: "6px 16px", border: "1px solid #2DD4BF60", borderRadius: 999, fontSize: 13, color: "#2DD4BF", marginBottom: 24 }}>
          Plataforma Integral de Inteligencia Financiera
        </div>
        <h1 style={{ fontSize: 48, fontWeight: 900, lineHeight: 1.2, fontFamily: "'IBM Plex Serif', serif" }}>
          Auditoría Forense, Contabilidad NIIF<br />
          y Licitaciones al Estado
        </h1>
        <p style={{ marginTop: 20, fontSize: 18, color: "#8B93A7", maxWidth: 650, margin: "20px auto 0" }}>
          Tres módulos integrados en una sola plataforma: investigación forense blockchain,
          contabilidad financiera con ajuste automático por inflación, y análisis de precios
          unitarios para contratación con el Estado.
        </p>
      </section>
      <section style={{ padding: "0 40px 100px", maxWidth: 1100, margin: "0 auto" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 24 }}>
          <Link href="/login" style={{ textDecoration: "none", color: "white" }}>
            <div style={{ padding: 32, background: "#12161F", border: "1px solid #2DD4BF40", borderRadius: 16, height: "100%" }}>
              <div style={{ width: 40, height: 4, background: "#2DD4BF", borderRadius: 2, marginBottom: 20 }} />
              <h3 style={{ fontSize: 22, fontWeight: 900, color: "#2DD4BF", fontFamily: "'IBM Plex Serif', serif" }}>ReclaimFi</h3>
              <p style={{ marginTop: 12, fontSize: 14, color: "#8B93A7", lineHeight: 1.6 }}>
                Investigación forense blockchain, análisis de riesgo explicable y cadena de custodia
                con hash criptográfico para evidencia digital.
              </p>
              <p style={{ marginTop: 20, fontSize: 13, color: "#2DD4BF", fontWeight: 700 }}>Acceder al módulo →</p>
            </div>
          </Link>

          <Link href="/login" style={{ textDecoration: "none", color: "white" }}>
            <div style={{ padding: 32, background: "#12161F", border: "1px solid #818CF840", borderRadius: 16, height: "100%" }}>
              <div style={{ width: 40, height: 4, background: "#818CF8", borderRadius: 2, marginBottom: 20 }} />
              <h3 style={{ fontSize: 22, fontWeight: 900, color: "#818CF8", fontFamily: "'IBM Plex Serif', serif" }}>Contabilidad Financiera</h3>
              <p style={{ marginTop: 12, fontSize: 14, color: "#8B93A7", lineHeight: 1.6 }}>
                Plan de cuentas NIIF multi-sector, ajuste automático por inflación (REPOMO),
                estados financieros y cadena de custodia contable.
              </p>
              <p style={{ marginTop: 20, fontSize: 13, color: "#818CF8", fontWeight: 700 }}>Acceder al módulo →</p>
            </div>
          </Link>

          <Link href="/login" style={{ textDecoration: "none", color: "white" }}>
            <div style={{ padding: 32, background: "#12161F", border: "1px solid #FB923C40", borderRadius: 16, height: "100%" }}>
              <div style={{ width: 40, height: 4, background: "#FB923C", borderRadius: 2, marginBottom: 20 }} />
              <h3 style={{ fontSize: 22, fontWeight: 900, color: "#FB923C", fontFamily: "'IBM Plex Serif', serif" }}>APU / Licitaciones</h3>
              <p style={{ marginTop: 12, fontSize: 14, color: "#8B93A7", lineHeight: 1.6 }}>
                Análisis de precios unitarios para licitaciones al Estado, con motor de costo laboral
                CCTP y catálogo oficial de clasificación SNC.
              </p>
              <p style={{ marginTop: 20, fontSize: 13, color: "#FB923C", fontWeight: 700 }}>Acceder al módulo →</p>
            </div>
          </Link>
        </div>
      </section>

      <footer style={{ padding: "24px 40px", borderTop: "1px solid #1F2937", textAlign: "center", fontSize: 13, color: "#8B93A7" }}>
        Audit Global Intelligence — Plataforma profesional de inteligencia financiera
      </footer>
    </div>
  );
}
