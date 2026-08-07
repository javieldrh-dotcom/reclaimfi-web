"use client";
import Link from "next/link";

export default function HomePage() {
  return (
    <div style={{ background: "#0B0E14", minHeight: "100vh", color: "white", fontFamily: "'IBM Plex Sans', sans-serif", position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", top: -100, left: -100, width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle, #2DD4BF22 0%, transparent 70%)", pointerEvents: "none" }} />
      <div style={{ position: "absolute", top: 100, right: -150, width: 600, height: 600, borderRadius: "50%", background: "radial-gradient(circle, #818CF822 0%, transparent 70%)", pointerEvents: "none" }} />
      <div style={{ position: "absolute", bottom: -100, left: "40%", width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle, #FB923C15 0%, transparent 70%)", pointerEvents: "none" }} />

      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "24px 40px", borderBottom: "1px solid #1F2937", position: "relative", zIndex: 1 }}>
        <div style={{ fontSize: 22, fontWeight: 900, color: "#2DD4BF", fontFamily: "'IBM Plex Serif', serif" }}>
          Audit Global Intelligence
        </div>
        <Link href="/login" style={{ padding: "12px 24px", border: "1px solid #2DD4BF", borderRadius: 8, color: "#2DD4BF", textDecoration: "none", fontSize: 15, fontWeight: 700 }}>
          Acceso Seguro
        </Link>
      </header>

      <section style={{ padding: "100px 40px 80px", textAlign: "center", maxWidth: 950, margin: "0 auto", position: "relative", zIndex: 1 }}>
        <div style={{ display: "inline-block", padding: "8px 20px", border: "1px solid #2DD4BF60", borderRadius: 999, fontSize: 15, color: "#2DD4BF", marginBottom: 28, fontWeight: 600 }}>
          Plataforma Integral de Inteligencia Financiera
        </div>
        <h1 style={{ fontSize: 60, fontWeight: 900, lineHeight: 1.2, fontFamily: "'IBM Plex Serif', serif" }}>
          Auditoría Forense, Contabilidad NIIF<br />
          y Licitaciones al Estado
        </h1>
        <p style={{ marginTop: 24, fontSize: 22, color: "#B0B8C8", maxWidth: 750, margin: "24px auto 0", lineHeight: 1.6 }}>
          Tres módulos integrados en una sola plataforma: investigación forense blockchain,
          contabilidad financiera con ajuste automático por inflación, y análisis de precios
          unitarios para contratación con el Estado.
        </p>
      </section>
      <section style={{ padding: "0 40px 120px", maxWidth: 1150, margin: "0 auto", position: "relative", zIndex: 1 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 40 }}>
          <Link href="/login" style={{ textDecoration: "none", color: "white" }}>
            <div style={{ padding: 36, background: "#12161F", border: "1px solid #2DD4BF40", borderRadius: 18, height: "100%", boxShadow: "0 8px 30px #2DD4BF15" }}>
              <div style={{ width: 44, height: 5, background: "#2DD4BF", borderRadius: 3, marginBottom: 22 }} />
              <h3 style={{ fontSize: 28, fontWeight: 900, color: "#2DD4BF", fontFamily: "'IBM Plex Serif', serif" }}>ReclaimFi</h3>
              <p style={{ marginTop: 14, fontSize: 17, color: "#B0B8C8", lineHeight: 1.7 }}>
                Investigación forense blockchain, análisis de riesgo explicable y cadena de custodia
                con hash criptográfico para evidencia digital.
              </p>
              <p style={{ marginTop: 24, fontSize: 16, color: "#2DD4BF", fontWeight: 700 }}>Acceder al módulo →</p>
            </div>
          </Link>

          <Link href="/login" style={{ textDecoration: "none", color: "white" }}>
            <div style={{ padding: 36, background: "#12161F", border: "1px solid #818CF840", borderRadius: 18, height: "100%", boxShadow: "0 8px 30px #818CF815" }}>
              <div style={{ width: 44, height: 5, background: "#818CF8", borderRadius: 3, marginBottom: 22 }} />
              <h3 style={{ fontSize: 28, fontWeight: 900, color: "#818CF8", fontFamily: "'IBM Plex Serif', serif" }}>Contabilidad Financiera</h3>
              <p style={{ marginTop: 14, fontSize: 17, color: "#B0B8C8", lineHeight: 1.7 }}>
                Plan de cuentas NIIF multi-sector, ajuste automático por inflación (REPOMO),
                estados financieros y cadena de custodia contable.
              </p>
              <p style={{ marginTop: 24, fontSize: 16, color: "#818CF8", fontWeight: 700 }}>Acceder al módulo →</p>
            </div>
          </Link>

          <Link href="/login" style={{ textDecoration: "none", color: "white" }}>
            <div style={{ padding: 36, background: "#12161F", border: "1px solid #FB923C40", borderRadius: 18, height: "100%", boxShadow: "0 8px 30px #FB923C15" }}>
              <div style={{ width: 44, height: 5, background: "#FB923C", borderRadius: 3, marginBottom: 22 }} />
              <h3 style={{ fontSize: 28, fontWeight: 900, color: "#FB923C", fontFamily: "'IBM Plex Serif', serif" }}>APU / Licitaciones</h3>
              <p style={{ marginTop: 14, fontSize: 17, color: "#B0B8C8", lineHeight: 1.7 }}>
                Análisis de precios unitarios para licitaciones al Estado, con motor de costo laboral
                CCTP y catálogo oficial de clasificación SNC.
              </p>
              <p style={{ marginTop: 24, fontSize: 16, color: "#FB923C", fontWeight: 700 }}>Acceder al módulo →</p>
            </div>
          </Link>
        </div>
      </section>

      <footer style={{ padding: "28px 40px", borderTop: "1px solid #1F2937", textAlign: "center", fontSize: 14, color: "#8B93A7", position: "relative", zIndex: 1 }}>
        Audit Global Intelligence — Plataforma profesional de inteligencia financiera
      </footer>
    </div>
  );
}
