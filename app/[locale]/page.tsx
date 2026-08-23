"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useTranslations, useLocale } from "next-intl";
import LanguageSwitcher from "./_components/LanguageSwitcher";

export default function HomePage() {
  const t = useTranslations("home");
  const locale = useLocale();
  const [menuOpen, setMenuOpen] = useState(false);
  const tNav = useTranslations("nav");

  useEffect(() => {
    const els = document.querySelectorAll(".fade-in-up");
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("in-view");
          }
        });
      },
      { threshold: 0.15 }
    );
    els.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const bg = "#0A1628";
  const bgCard = "#12213B";
  const bgCard2 = "#16294A";
  const ink = "#F1F5F9";
  const inkSoft = "#94A3B8";
  const cyan = "#10B981";
  const indigo = "#818CF8";
  const amber = "#F59E0B";
  const green = "#34D399";
  const cardBorder = "#1E3A5F";
  const yellowBrand = "#FACC15";

  const sectionTitleStyle: React.CSSProperties = {
    fontSize: 44,
    fontWeight: 800,
    fontFamily: "'IBM Plex Serif', serif",
    color: ink,
    textAlign: "center" as const,
    lineHeight: 1.2, maxWidth: 720, margin: "0 auto", textWrap: "balance" as any,
  };

  const labelStyle = (color: string): React.CSSProperties => ({
    display: "inline-block",
    padding: "10px 22px",
    background: color + "15",
    color: color,
    borderRadius: 999,
    fontSize: 16,
    fontWeight: 700,
    marginBottom: 24,
  });

  return (
    <div style={{ background: "radial-gradient(ellipse 90% 50% at 50% -10%, " + bgCard + " 0%, " + bg + " 60%, #040911 100%)", minHeight: "100vh", color: ink, fontFamily: "'IBM Plex Sans', sans-serif", overflow: "hidden" }}>
      <style>{`
        @keyframes heroGradientShift {
          0% { background-position: 0% 0%; }
          50% { background-position: 100% 20%; }
          100% { background-position: 0% 0%; }
        }
        .hover-lift {
          transition: transform 0.35s ease, box-shadow 0.35s ease;
        }
        .hover-lift:hover {
          transform: translateY(-6px);
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(18px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .fade-in-up {
          opacity: 0;
          transform: translateY(28px);
          transition: opacity 0.8s ease, transform 0.8s ease;
        }
        .fade-in-up.in-view {
          opacity: 1;
          transform: translateY(0);
        @keyframes ctaBreathe {
          0%, 100% { box-shadow: 0 10px 30px rgba(250,204,21,0.45); transform: scale(1); }
          50% { box-shadow: 0 14px 42px rgba(250,204,21,0.65); transform: scale(1.02); }
        }
        .cta-breathe { animation: ctaBreathe 2.6s ease-in-out infinite; }
        @keyframes livePulseDot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(1.3); }
        }
        .live-dot {
          display: inline-block;
          width: 8px;
          height: 8px;
          border-radius: 50%;
          margin-right: 6px;
          animation: livePulseDot 1.6s ease-in-out infinite;
        }
        @keyframes staggerFade {
          from { opacity: 0; transform: translateX(-8px); }
          to { opacity: 1; transform: translateX(0); }
        }
        .stagger-row {
          animation: staggerFade 0.5s ease forwards;
          opacity: 0;
        }
        }
        @keyframes pulseGlow {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 1; }
        }
        .pulse-glow {
          animation: pulseGlow 2.4s ease-in-out infinite;
        }
        @keyframes meshMove {
          0% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(-3%, 2%) scale(1.08); }
          100% { transform: translate(0, 0) scale(1); }
        }
        .mesh-anim { animation: meshMove 14s ease-in-out infinite; }
        @media (max-width: 768px) {
          section { padding-left: 20px !important; padding-right: 20px !important; }
          header { padding-left: 20px !important; padding-right: 20px !important; }
          .responsive-grid-2 { grid-template-columns: 1fr !important; }
          .responsive-grid-3 { grid-template-columns: 1fr !important; }
          .bento-card { padding: 20px !important; box-sizing: border-box; max-width: 100%; overflow: hidden; }
          .hero-title { font-size: 34px !important; }
          .hero-subtitle { font-size: 17px !important; }
          h2 { font-size: 26px !important; }
          h3 { font-size: 18px !important; }
          .bento-card p { font-size: 15px !important; }
          section p { font-size: 15px !important; }
          .label-badge { font-size: 12px !important; padding: 6px 14px !important; }
          .cta-button { font-size: 15px !important; padding: 14px 28px !important; }
          .diario-table { padding: 10px !important; font-size: 9px !important; }
          .diario-table > div { grid-template-columns: 40px 1fr 42px 42px !important; gap: 3px !important; }
          .pillar-icon { width: 46px !important; height: 46px !important; }
          .desktop-nav { display: none !important; }
          .mobile-menu-btn { display: block !important; }
        }
        @media (max-width: 480px) {
          .hero-title { font-size: 28px !important; }
        }
        @keyframes dotDrift {
          0% { background-position: 0 0; }
          100% { background-position: 60px 60px; }
        }
        .bg-texture {
          position: fixed;
          inset: 0;
          background-image: radial-gradient(circle, rgba(148,163,184,0.14) 1px, transparent 1px);
          background-size: 34px 34px;
          animation: dotDrift 40s linear infinite;
          pointer-events: none;
          z-index: 0;
          opacity: 0.5;
        }
        .ambient-glow {
          position: absolute;
          border-radius: 50%;
          filter: blur(90px);
          pointer-events: none;
          z-index: 0;
        }
      `}</style>
      <div className="bg-texture" />
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "24px 56px", borderBottom: "1px solid " + cardBorder, flexWrap: "wrap", gap: 16, background: "rgba(10,14,22,0.85)", backdropFilter: "blur(12px)", position: "sticky", top: 0, zIndex: 50 }}>
        <div style={{ fontSize: 24, fontWeight: 800, color: yellowBrand, fontFamily: "'IBM Plex Serif', serif" }}>
          {tNav("brand")}
        </div>
        <nav className="desktop-nav" style={{ display: "flex", alignItems: "center", gap: 32, flexWrap: "wrap" }}>
          <Link href={"/" + locale + "/producto"} style={{ color: ink, textDecoration: "none", fontSize: 17, fontWeight: 600 }}>{tNav("producto")}</Link>
          <Link href={"/" + locale + "/soluciones"} style={{ color: ink, textDecoration: "none", fontSize: 17, fontWeight: 600 }}>{tNav("soluciones")}</Link>
          <Link href={"/" + locale + "/precios"} style={{ color: ink, textDecoration: "none", fontSize: 17, fontWeight: 600 }}>{tNav("precios")}</Link>
          <Link href={"/" + locale + "/servicios"} style={{ color: ink, textDecoration: "none", fontSize: 18, fontWeight: 600 }}>{tNav("servicios")}</Link>
          <Link href={"/" + locale + "/tecnologia"} style={{ color: ink, textDecoration: "none", fontSize: 18, fontWeight: 600 }}>{tNav("tecnologia")}</Link>
          <Link href={"/" + locale + "/seguridad"} style={{ color: ink, textDecoration: "none", fontSize: 17, fontWeight: 600 }}>{tNav("seguridad")}</Link>
          <Link href={"/" + locale + "/contacto"} style={{ color: ink, textDecoration: "none", fontSize: 18, fontWeight: 600 }}>{tNav("contacto")}</Link>
          <LanguageSwitcher />
          <Link href="/login" style={{ padding: "14px 30px", background: yellowBrand, borderRadius: 12, color: bg, textDecoration: "none", fontSize: 17, fontWeight: 800, boxShadow: "0 6px 18px " + yellowBrand + "40" }}>
            {tNav("acceso")}
          </Link>
        </nav>
        <button className="mobile-menu-btn" onClick={() => setMenuOpen(!menuOpen)} style={{ display: "none", background: "none", border: "none", cursor: "pointer", padding: 8 }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={ink} strokeWidth="2"><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" /></svg>
        </button>
        {menuOpen && (
          <div style={{ position: "absolute", top: "100%", left: 0, right: 0, background: bgCard, borderBottom: "1px solid " + cardBorder, display: "flex", flexDirection: "column", padding: 24, gap: 18 }}>
            <Link href={"/" + locale + "/producto"} onClick={() => setMenuOpen(false)} style={{ color: ink, textDecoration: "none", fontSize: 18, fontWeight: 600 }}>{tNav("producto")}</Link>
            <Link href={"/" + locale + "/soluciones"} onClick={() => setMenuOpen(false)} style={{ color: ink, textDecoration: "none", fontSize: 18, fontWeight: 600 }}>{tNav("soluciones")}</Link>
            <Link href={"/" + locale + "/precios"} onClick={() => setMenuOpen(false)} style={{ color: ink, textDecoration: "none", fontSize: 18, fontWeight: 600 }}>{tNav("precios")}</Link>
            <Link href={"/" + locale + "/servicios"} onClick={() => setMenuOpen(false)} style={{ color: ink, textDecoration: "none", fontSize: 18, fontWeight: 600 }}>{tNav("servicios")}</Link>
            <Link href={"/" + locale + "/tecnologia"} onClick={() => setMenuOpen(false)} style={{ color: ink, textDecoration: "none", fontSize: 18, fontWeight: 600 }}>{tNav("tecnologia")}</Link>
            <Link href={"/" + locale + "/seguridad"} onClick={() => setMenuOpen(false)} style={{ color: ink, textDecoration: "none", fontSize: 18, fontWeight: 600 }}>{tNav("seguridad")}</Link>
            <Link href={"/" + locale + "/contacto"} onClick={() => setMenuOpen(false)} style={{ color: ink, textDecoration: "none", fontSize: 18, fontWeight: 600 }}>{tNav("contacto")}</Link>
            <LanguageSwitcher />
            <Link href="/login" style={{ padding: "14px 30px", background: yellowBrand, borderRadius: 12, color: bg, textDecoration: "none", fontSize: 17, fontWeight: 800, textAlign: "center" }}>
              {tNav("acceso")}
            </Link>
          </div>
        )}
      </header>
      {/* HERO with gradient */}
      <section style={{
        position: "relative", overflow: "hidden",
        padding: "110px 40px 90px",
        textAlign: "center",
        maxWidth: 1100,
        margin: "0 auto",
        background: "radial-gradient(ellipse 80% 60% at 50% 0%, " + indigo + "12, transparent), radial-gradient(ellipse 60% 50% at 80% 20%, " + cyan + "10, transparent)",
      }}>
        <div className="mesh-anim" style={{ position: "absolute", top: "-15%", left: "-5%", width: "60%", height: "130%", background: "radial-gradient(circle, " + indigo + "30, transparent 60%)", filter: "blur(60px)", zIndex: 0, pointerEvents: "none" }} />
        <div className="mesh-anim" style={{ position: "absolute", top: "-5%", right: "-5%", width: "55%", height: "110%", background: "radial-gradient(circle, " + cyan + "25, transparent 60%)", filter: "blur(60px)", zIndex: 0, pointerEvents: "none", animationDelay: "-7s" }} />
        <div style={{ position: "relative", zIndex: 1, maxWidth: 1100, margin: "0 auto" }}>
        <div className="label-badge" style={labelStyle(indigo)}>{t("eyebrow")}</div>
        <h1 className="hero-title" style={{ fontSize: 76, fontWeight: 800, lineHeight: 1.08, fontFamily: "'IBM Plex Serif', serif", color: ink, letterSpacing: "-0.02em" }}>
          {t("headline")}
        </h1>
        <p style={{ marginTop: 30, fontSize: 25, color: inkSoft, maxWidth: 820, margin: "30px auto 0", lineHeight: 1.6 }}>
          {t("subheadline")}
        </p>
        <div style={{ marginTop: 44, display: "flex", gap: 18, justifyContent: "center", flexWrap: "wrap" }}>
          <Link href="/login" className="cta-button cta-breathe" style={{ padding: "20px 48px", background: yellowBrand, color: bg, borderRadius: 14, textDecoration: "none", fontSize: 20, fontWeight: 800, boxShadow: "0 10px 30px " + yellowBrand + "45" }}>
            {t("cta")}
          </Link>
        </div>
        </div>
      </section>

      {/* BENTO GRID - product mockups (light mode) */}
      <section style={{ position: "relative", padding: "60px 40px 100px", background: "#F1F5F9" }}>
        <div className="responsive-grid-2" style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr", gap: 24, maxWidth: 1200, margin: "0 auto" }}>
          {/* Diario mockup - large */}
          <div className="hover-lift fade-in-up bento-card" style={{ background: "#FFFFFF", borderRadius: 24, padding: 32, border: "1px solid #E2E8F0", boxShadow: "0 20px 50px rgba(15,23,42,0.08)" }}>
            <p style={{ fontSize: 13, fontWeight: 800, color: indigo, textTransform: "uppercase", letterSpacing: 1 }}>Libro Diario</p>
            <div className="diario-table" style={{ marginTop: 16, background: "#F8FAFC", borderRadius: 14, padding: 20, fontFamily: "'IBM Plex Mono', monospace", fontSize: 13 }}>
              <div style={{ display: "grid", gridTemplateColumns: "70px 1fr 80px 80px", gap: 8, color: "#64748B", fontWeight: 700, paddingBottom: 8, borderBottom: "1px solid #E2E8F0" }}>
                <span>Fecha</span><span>Cuenta</span><span>Debe</span><span>Haber</span>
              </div>
              {[
                ["01-08", "1102-01 Banco", "5.000", ""],
                ["01-08", "4101-01 Ventas", "", "5.000"],
                ["03-08", "5102-01 Sueldos", "1.200", ""],
                ["03-08", "1102-01 Banco", "", "1.200"],
              ].map((row, i) => (
                <div key={i} className="stagger-row" style={{ display: "grid", gridTemplateColumns: "70px 1fr 80px 80px", gap: 8, padding: "8px 0", color: "#0F172A", borderBottom: i < 3 ? "1px solid #E2E8F0" : "none", animationDelay: (i * 0.15) + "s" }}>
                  <span>{row[0]}</span><span>{row[1]}</span><span>{row[2]}</span><span>{row[3]}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Blockchain mockup */}
          <div className="hover-lift fade-in-up bento-card" style={{ background: "#FFFFFF", borderRadius: 24, padding: 32, border: "1px solid #E2E8F0", boxShadow: "0 20px 50px rgba(15,23,42,0.08)" }}>
            <p style={{ fontSize: 13, fontWeight: 800, color: cyan, textTransform: "uppercase", letterSpacing: 1 }}>Cadena Verificable</p>
            <div style={{ marginTop: 20, display: "flex", flexDirection: "column", gap: 10 }}>
              {[1, 2, 3, 4].map((n) => (
                <div key={n} className="stagger-row" style={{ display: "flex", alignItems: "center", gap: 10, animationDelay: (n * 0.15) + "s" }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: green + "18", display: "flex", alignItems: "center", justifyContent: "center" }}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={green} strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg></div>
                  <div style={{ flex: 1, height: 10, background: "#F1F5F9", borderRadius: 6, overflow: "hidden" }}>
                    <div style={{ width: "100%", height: "100%", background: cyan + "40" }} />
                  </div>
                  <span style={{ fontSize: 11, fontFamily: "'IBM Plex Mono', monospace", color: "#64748B" }}>SHA-256</span>
                </div>
              ))}
            </div>
            <p style={{ marginTop: 16, fontSize: 13, color: "#64748B" }}><span className="live-dot" style={{ background: green }} />Integridad 100% verificada</p>
          </div>

          {/* Hyperinflation mockup */}
          <div className="hover-lift fade-in-up bento-card" style={{ background: "#FFFFFF", borderRadius: 24, padding: 32, border: "1px solid #E2E8F0", boxShadow: "0 20px 50px rgba(15,23,42,0.08)", gridColumn: "span 1" }}>
            <p style={{ fontSize: 13, fontWeight: 800, color: amber, textTransform: "uppercase", letterSpacing: 1 }}>Reexpresion Automatica</p>
            <div style={{ marginTop: 20, display: "flex", alignItems: "center", justifyContent: "space-between", fontFamily: "'IBM Plex Mono', monospace" }}>
              <div>
                <p style={{ fontSize: 11, color: "#64748B" }}>Historico</p>
                <p style={{ fontSize: 20, fontWeight: 700, color: "#94A3B8", textDecoration: "line-through" }}>100.00</p>
              </div>
              <span style={{ display: "inline-flex", alignItems: "center" }}><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={amber} strokeWidth="2.5"><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></svg></span>
              <div>
                <p style={{ fontSize: 11, color: "#64748B" }}>Reexpresado</p>
                <p style={{ fontSize: 20, fontWeight: 800, color: amber }}>488.122...</p>
              </div>
            </div>
          </div>

          {/* Multi-region mockup */}
          <div className="hover-lift fade-in-up bento-card" style={{ background: "linear-gradient(135deg, " + indigo + ", " + cyan + ")", borderRadius: 24, padding: 32, color: "#FFFFFF", display: "flex", flexDirection: "column", justifyContent: "center", boxShadow: "0 20px 60px " + indigo + "35" }}>
            <p style={{ fontSize: 13, fontWeight: 800, textTransform: "uppercase", letterSpacing: 1, opacity: 0.85 }}>17 idiomas</p>
            <p style={{ fontSize: 28, fontWeight: 800, marginTop: 10, fontFamily: "'IBM Plex Serif', serif" }}>5 continentes</p>
            <p style={{ fontSize: 15, marginTop: 10, opacity: 0.9, lineHeight: 1.6 }}>Una plataforma que se adapta a cada region, no al reves.</p>
          </div>
        </div>
      </section>

      {/* DIFFERENTIATOR MESSAGE */}
      <section style={{ position: "relative", overflow: "hidden", padding: "70px 40px", background: bgCard, borderTop: "1px solid " + cardBorder, borderBottom: "1px solid " + cardBorder }}>
        <div className="ambient-glow" style={{ top: "-20%", left: "30%", width: "40%", height: "160%", background: green + "18" }} />
        <div style={{ maxWidth: 900, margin: "0 auto", textAlign: "center", position: "relative", zIndex: 1 }}>
          <div className="label-badge" style={labelStyle(green)}>{t("differentiatorLabel")}</div>
          <h2 style={{ ...sectionTitleStyle, fontSize: 38 }}>{t("differentiatorTitle")}</h2>
          <p style={{ marginTop: 22, fontSize: 20, color: inkSoft, lineHeight: 1.8 }}>{t("differentiatorDesc")}</p>
        </div>
      </section>

      {/* DIFFERENTIATOR STAT */}
      <section style={{ padding: "70px 40px", maxWidth: 980, margin: "0 auto" }}>
        <div style={{ background: amber + "12", border: "1px solid " + amber + "40", borderRadius: 24, padding: "40px 44px" }}>
          <p style={{ fontSize: 15, fontWeight: 800, textTransform: "uppercase", letterSpacing: 1, color: amber }}>
            {t("statLabel")}
          </p>
          <p style={{ marginTop: 16, fontSize: 20, lineHeight: 1.8, color: ink, fontFamily: "'IBM Plex Mono', monospace" }}>
            {t("statDescription")}
          </p>
        </div>
      </section>

      {/* 3 PILLARS */}
      <section style={{ padding: "70px 40px 100px", maxWidth: 1200, margin: "0 auto" }}>
        <h2 style={sectionTitleStyle}>{t("pillarsTitle")}</h2>
        <div className="responsive-grid-3" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 32, marginTop: 56 }}>
          <div className="hover-lift fade-in-up" style={{ padding: 40, background: "linear-gradient(160deg, " + cyan + ", #065F46)", border: "2px solid " + cyan + "60", borderRadius: 22, boxShadow: "0 20px 44px " + cyan + "35" }}>
            <div className="pillar-icon" style={{ width: 60, height: 60, background: "rgba(255,255,255,0.2)", borderRadius: 16, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 24 }}><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg></div>
            <h3 style={{ fontSize: 27, fontWeight: 800, color: "white", fontFamily: "'IBM Plex Serif', serif" }}>{t("pillar1Title")}</h3>
            <p style={{ marginTop: 16, fontSize: 18, color: "rgba(255,255,255,0.82)", lineHeight: 1.8 }}>{t("pillar1Desc")}</p>
          </div>
          <div className="hover-lift fade-in-up" style={{ padding: 40, background: "linear-gradient(160deg, " + indigo + ", #312E81)", border: "2px solid " + indigo + "60", borderRadius: 22, boxShadow: "0 20px 44px " + indigo + "35" }}>
            <div className="pillar-icon" style={{ width: 60, height: 60, background: "rgba(255,255,255,0.2)", borderRadius: 16, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 24 }}><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><line x1="12" y1="20" x2="12" y2="10" /><line x1="18" y1="20" x2="18" y2="4" /><line x1="6" y1="20" x2="6" y2="16" /></svg></div>
            <h3 style={{ fontSize: 27, fontWeight: 800, color: "white", fontFamily: "'IBM Plex Serif', serif" }}>{t("pillar2Title")}</h3>
            <p style={{ marginTop: 16, fontSize: 18, color: "rgba(255,255,255,0.82)", lineHeight: 1.8 }}>{t("pillar2Desc")}</p>
          </div>
          <div className="hover-lift fade-in-up" style={{ padding: 40, background: "linear-gradient(160deg, " + amber + ", #92400E)", border: "2px solid " + amber + "60", borderRadius: 22, boxShadow: "0 20px 44px " + amber + "35" }}>
            <div className="pillar-icon" style={{ width: 60, height: 60, background: "rgba(255,255,255,0.2)", borderRadius: 16, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 24 }}><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" /><rect x="9" y="3" width="6" height="4" rx="1" /></svg></div>
            <h3 style={{ fontSize: 27, fontWeight: 800, color: "white", fontFamily: "'IBM Plex Serif', serif" }}>{t("pillar3Title")}</h3>
            <p style={{ marginTop: 16, fontSize: 18, color: "rgba(255,255,255,0.82)", lineHeight: 1.8 }}>{t("pillar3Desc")}</p>
          </div>
        </div>
      </section>

      {/* SECURITY */}
      <section style={{ position: "relative", overflow: "hidden", padding: "90px 40px", background: green + "08" }}>
        <div className="ambient-glow" style={{ bottom: "-15%", right: "10%", width: "45%", height: "130%", background: indigo + "14" }} />
        <div style={{ maxWidth: 1100, margin: "0 auto", position: "relative", zIndex: 1 }}>
          <div style={{ textAlign: "center" }}>
            <div className="label-badge" style={labelStyle(green)}>{t("securityLabel")}</div>
            <h2 style={sectionTitleStyle}>{t("securityTitle")}</h2>
          </div>
          <div className="responsive-grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 28, marginTop: 56 }}>
            <div style={{ padding: 30, background: bgCard, borderRadius: 18, border: "1px solid " + cardBorder, boxSizing: "border-box" }}>
              <h3 style={{ fontSize: 21, fontWeight: 700, color: green, display: "flex", alignItems: "center", gap: 8 }}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={green} strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>{t("security1Title")}</h3>
              <p style={{ marginTop: 12, fontSize: 17, color: inkSoft, lineHeight: 1.7 }}>{t("security1Desc")}</p>
            </div>
            <div style={{ padding: 30, background: bgCard, borderRadius: 18, border: "1px solid " + cardBorder, boxSizing: "border-box" }}>
              <h3 style={{ fontSize: 21, fontWeight: 700, color: green, display: "flex", alignItems: "center", gap: 8 }}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={green} strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>{t("security2Title")}</h3>
              <p style={{ marginTop: 12, fontSize: 17, color: inkSoft, lineHeight: 1.7 }}>{t("security2Desc")}</p>
            </div>
            <div style={{ padding: 30, background: bgCard, borderRadius: 18, border: "1px solid " + cardBorder, boxSizing: "border-box" }}>
              <h3 style={{ fontSize: 21, fontWeight: 700, color: green, display: "flex", alignItems: "center", gap: 8 }}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={green} strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>{t("security3Title")}</h3>
              <p style={{ marginTop: 12, fontSize: 17, color: inkSoft, lineHeight: 1.7 }}>{t("security3Desc")}</p>
            </div>
            <div style={{ padding: 30, background: bgCard, borderRadius: 18, border: "1px solid " + cardBorder, boxSizing: "border-box" }}>
              <h3 style={{ fontSize: 21, fontWeight: 700, color: green, display: "flex", alignItems: "center", gap: 8 }}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={green} strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>{t("security4Title")}</h3>
              <p style={{ marginTop: 12, fontSize: 17, color: inkSoft, lineHeight: 1.7 }}>{t("security4Desc")}</p>
            </div>
          </div>
        </div>
      </section>

      {/* PLANS TEASER */}
      <section style={{ padding: "90px 40px", textAlign: "center" }}>
        <div className="label-badge" style={labelStyle(indigo)}>{t("plansLabel")}</div>
        <h2 style={sectionTitleStyle}>{t("plansTitle")}</h2>
        <p style={{ marginTop: 18, fontSize: 20, color: inkSoft, maxWidth: 600, margin: "18px auto 0" }}>{t("plansDesc")}</p>
        <Link href={"/" + locale + "/servicios"} style={{ display: "inline-block", marginTop: 34, padding: "18px 42px", background: yellowBrand, color: bg, borderRadius: 14, textDecoration: "none", fontSize: 19, fontWeight: 800, boxShadow: "0 10px 26px " + yellowBrand + "40" }}>
          {t("plansCta")}
        </Link>
      </section>

      <section style={{ position: "relative", overflow: "hidden", padding: "150px 40px 90px", background: bgCard, borderTop: "1px solid " + cardBorder }}>
        <svg viewBox="0 0 1200 220" preserveAspectRatio="none" style={{ position: "absolute", top: 0, left: 0, width: "100%", height: 180, zIndex: 0 }}>
          <defs>
            <linearGradient id="paintGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={amber} stopOpacity="0.9" />
              <stop offset="100%" stopColor="#EA580C" stopOpacity="0.85" />
            </linearGradient>
          </defs>
          <path fill="url(#paintGrad)" d="M0,0 L1200,0 L1200,55 C1160,55 1150,95 1120,95 C1100,95 1095,60 1070,60 C1045,60 1035,170 1000,170 C980,170 975,75 945,75 L760,75 C735,75 725,140 695,140 C675,140 668,65 640,65 L430,65 C405,65 398,120 368,120 C348,120 342,55 315,55 L150,55 C125,55 118,100 90,100 C70,100 65,50 40,50 L0,50 Z" />
        </svg>
        <div style={{ maxWidth: 820, margin: "0 auto", position: "relative", zIndex: 1 }}>
          <div style={{ textAlign: "center" }}>
            <div className="label-badge" style={labelStyle(cyan)}>{t("faqLabel")}</div>
            <h2 style={sectionTitleStyle}>{t("faqTitle")}</h2>
          </div>
          <div style={{ marginTop: 46, display: "flex", flexDirection: "column", gap: 22 }}>
            {[1, 2, 3, 4].map((n) => (
              <div key={n} style={{ padding: 30, background: bg, borderRadius: 16, border: "1px solid " + cardBorder }}>
                <h3 style={{ fontSize: 20, fontWeight: 700, color: ink }}>{t(`faq${n}Q` as any)}</h3>
                <p style={{ marginTop: 12, fontSize: 17, color: inkSoft, lineHeight: 1.7 }}>{t(`faq${n}A` as any)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer style={{ padding: "36px 40px", borderTop: "1px solid " + cardBorder, textAlign: "center", fontSize: 15, color: inkSoft, background: bgCard }}>
        {tNav("brand")}
      </footer>
    </div>
  );
}
