"use client";
import Link from "next/link";
import { useTranslations } from "next-intl";
import LanguageSwitcher from "./_components/LanguageSwitcher";

export default function HomePage() {
  const t = useTranslations("home");
  const tNav = useTranslations("nav");

  const bg = "#0A0E16";
  const bgCard = "#12161F";
  const bgCard2 = "#161B26";
  const ink = "#F1F5F9";
  const inkSoft = "#94A3B8";
  const cyan = "#22D3EE";
  const indigo = "#818CF8";
  const amber = "#FBBF24";
  const green = "#34D399";
  const cardBorder = "#232937";

  const sectionTitleStyle: React.CSSProperties = {
    fontSize: 44,
    fontWeight: 800,
    fontFamily: "'IBM Plex Serif', serif",
    color: ink,
    textAlign: "center" as const,
    lineHeight: 1.15,
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
    <div style={{ background: "radial-gradient(ellipse 90% 50% at 50% -10%, " + bgCard + " 0%, " + bg + " 60%, #050709 100%)", minHeight: "100vh", color: ink, fontFamily: "'IBM Plex Sans', sans-serif", overflow: "hidden" }}>
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
          animation: fadeInUp 0.7s ease both;
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
        .mesh-anim {
          animation: meshMove 14s ease-in-out infinite;
        }
      `}</style>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "24px 56px", borderBottom: "1px solid " + cardBorder, flexWrap: "wrap", gap: 16, background: "rgba(10,14,22,0.85)", backdropFilter: "blur(12px)", position: "sticky", top: 0, zIndex: 50 }}>
        <div style={{ fontSize: 24, fontWeight: 800, color: indigo, fontFamily: "'IBM Plex Serif', serif" }}>
          {tNav("brand")}
        </div>
        <nav style={{ display: "flex", alignItems: "center", gap: 32, flexWrap: "wrap" }}>
          <Link href="./servicios" style={{ color: ink, textDecoration: "none", fontSize: 18, fontWeight: 600 }}>{tNav("servicios")}</Link>
          <Link href="./tecnologia" style={{ color: ink, textDecoration: "none", fontSize: 18, fontWeight: 600 }}>{tNav("tecnologia")}</Link>
          <Link href="./contacto" style={{ color: ink, textDecoration: "none", fontSize: 18, fontWeight: 600 }}>{tNav("contacto")}</Link>
          <LanguageSwitcher />
          <Link href="/login" style={{ padding: "14px 30px", background: indigo, borderRadius: 12, color: "white", textDecoration: "none", fontSize: 17, fontWeight: 700, boxShadow: "0 6px 18px " + indigo + "40" }}>
            {tNav("acceso")}
          </Link>
        </nav>
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
        <div style={labelStyle(indigo)}>{t("eyebrow")}</div>
        <h1 style={{ fontSize: 76, fontWeight: 800, lineHeight: 1.08, fontFamily: "'IBM Plex Serif', serif", color: ink, letterSpacing: "-0.02em" }}>
          {t("headline")}
        </h1>
        <p style={{ marginTop: 30, fontSize: 25, color: inkSoft, maxWidth: 820, margin: "30px auto 0", lineHeight: 1.6 }}>
          {t("subheadline")}
        </p>
        <div style={{ marginTop: 44, display: "flex", gap: 18, justifyContent: "center", flexWrap: "wrap" }}>
          <Link href="/login" style={{ padding: "20px 48px", background: indigo, color: "white", borderRadius: 14, textDecoration: "none", fontSize: 20, fontWeight: 700, boxShadow: "0 10px 30px " + indigo + "45" }}>
            {t("cta")}
          </Link>
        </div>
        </div>
      </section>

      {/* BENTO GRID - product mockups */}
      <section style={{ padding: "20px 40px 100px", maxWidth: 1200, margin: "0 auto" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr", gap: 24 }}>
          {/* Diario mockup - large */}
          <div className="hover-lift fade-in-up" style={{ background: bgCard, borderRadius: 24, padding: 32, border: "1px solid " + cardBorder, boxShadow: "0 20px 50px rgba(0,0,0,0.5)" }}>
            <p style={{ fontSize: 13, fontWeight: 800, color: indigo, textTransform: "uppercase", letterSpacing: 1 }}>Libro Diario</p>
            <div style={{ marginTop: 16, background: bg, borderRadius: 14, padding: 20, fontFamily: "'IBM Plex Mono', monospace", fontSize: 13 }}>
              <div style={{ display: "grid", gridTemplateColumns: "70px 1fr 80px 80px", gap: 8, color: inkSoft, fontWeight: 700, paddingBottom: 8, borderBottom: "1px solid " + cardBorder }}>
                <span>Fecha</span><span>Cuenta</span><span>Debe</span><span>Haber</span>
              </div>
              {[
                ["01-08", "1102-01 Banco", "5.000", ""],
                ["01-08", "4101-01 Ventas", "", "5.000"],
                ["03-08", "5102-01 Sueldos", "1.200", ""],
                ["03-08", "1102-01 Banco", "", "1.200"],
              ].map((row, i) => (
                <div key={i} style={{ display: "grid", gridTemplateColumns: "70px 1fr 80px 80px", gap: 8, padding: "8px 0", color: ink, borderBottom: i < 3 ? "1px solid " + cardBorder : "none" }}>
                  <span>{row[0]}</span><span>{row[1]}</span><span>{row[2]}</span><span>{row[3]}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Blockchain mockup */}
          <div className="hover-lift fade-in-up" style={{ background: bgCard, borderRadius: 24, padding: 32, border: "1px solid " + cardBorder, boxShadow: "0 20px 50px rgba(0,0,0,0.5)" }}>
            <p style={{ fontSize: 13, fontWeight: 800, color: cyan, textTransform: "uppercase", letterSpacing: 1 }}>Cadena Verificable</p>
            <div style={{ marginTop: 20, display: "flex", flexDirection: "column", gap: 10 }}>
              {[1, 2, 3, 4].map((n) => (
                <div key={n} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: green + "18", display: "flex", alignItems: "center", justifyContent: "center" }}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={green} strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg></div>
                  <div style={{ flex: 1, height: 10, background: bg, borderRadius: 6, overflow: "hidden" }}>
                    <div style={{ width: "100%", height: "100%", background: cyan + "30" }} />
                  </div>
                  <span style={{ fontSize: 11, fontFamily: "'IBM Plex Mono', monospace", color: inkSoft }}>SHA-256</span>
                </div>
              ))}
            </div>
            <p style={{ marginTop: 16, fontSize: 13, color: inkSoft }}>Integridad 100% verificada</p>
          </div>

          {/* Hyperinflation mockup */}
          <div className="hover-lift fade-in-up" style={{ background: bgCard, borderRadius: 24, padding: 32, border: "1px solid " + cardBorder, boxShadow: "0 20px 50px rgba(0,0,0,0.5)", gridColumn: "span 1" }}>
            <p style={{ fontSize: 13, fontWeight: 800, color: amber, textTransform: "uppercase", letterSpacing: 1 }}>Reexpresion Automatica</p>
            <div style={{ marginTop: 20, display: "flex", alignItems: "center", justifyContent: "space-between", fontFamily: "'IBM Plex Mono', monospace" }}>
              <div>
                <p style={{ fontSize: 11, color: inkSoft }}>Historico</p>
                <p style={{ fontSize: 20, fontWeight: 700, color: inkSoft, textDecoration: "line-through" }}>100.00</p>
              </div>
              <span style={{ display: "inline-flex", alignItems: "center" }}><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={amber} strokeWidth="2.5"><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></svg></span>
              <div>
                <p style={{ fontSize: 11, color: inkSoft }}>Reexpresado</p>
                <p style={{ fontSize: 20, fontWeight: 800, color: amber }}>488.122...</p>
              </div>
            </div>
          </div>

          {/* Multi-region mockup */}
          <div className="hover-lift fade-in-up" style={{ background: "linear-gradient(135deg, " + indigo + ", " + cyan + ")", borderRadius: 24, padding: 32, color: bg, display: "flex", flexDirection: "column", justifyContent: "center", boxShadow: "0 20px 60px " + indigo + "45" }}>
            <p style={{ fontSize: 13, fontWeight: 800, textTransform: "uppercase", letterSpacing: 1, opacity: 0.8 }}>17 idiomas</p>
            <p style={{ fontSize: 28, fontWeight: 800, marginTop: 10, fontFamily: "'IBM Plex Serif', serif" }}>5 continentes</p>
            <p style={{ fontSize: 15, marginTop: 10, opacity: 0.85, lineHeight: 1.6 }}>Una plataforma que se adapta a cada region, no al reves.</p>
          </div>
        </div>
      </section>

      {/* DIFFERENTIATOR MESSAGE */}
      <section style={{ padding: "70px 40px", background: bgCard, borderTop: "1px solid " + cardBorder, borderBottom: "1px solid " + cardBorder }}>
        <div style={{ maxWidth: 900, margin: "0 auto", textAlign: "center" }}>
          <div style={labelStyle(green)}>{t("differentiatorLabel")}</div>
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
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 32, marginTop: 56 }}>
          <div className="hover-lift fade-in-up" style={{ padding: 40, background: bgCard, border: "2px solid " + cyan + "30", borderRadius: 22, boxShadow: "0 14px 34px " + cyan + "14" }}>
            <div style={{ width: 60, height: 60, background: cyan + "18", borderRadius: 16, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 24 }}><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={cyan} strokeWidth="2"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg></div>
            <h3 style={{ fontSize: 27, fontWeight: 800, color: cyan, fontFamily: "'IBM Plex Serif', serif" }}>{t("pillar1Title")}</h3>
            <p style={{ marginTop: 16, fontSize: 18, color: inkSoft, lineHeight: 1.8 }}>{t("pillar1Desc")}</p>
          </div>
          <div className="hover-lift fade-in-up" style={{ padding: 40, background: bgCard, border: "2px solid " + indigo + "30", borderRadius: 22, boxShadow: "0 14px 34px " + indigo + "14" }}>
            <div style={{ width: 60, height: 60, background: indigo + "18", borderRadius: 16, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 24 }}><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={indigo} strokeWidth="2"><line x1="12" y1="20" x2="12" y2="10" /><line x1="18" y1="20" x2="18" y2="4" /><line x1="6" y1="20" x2="6" y2="16" /></svg></div>
            <h3 style={{ fontSize: 27, fontWeight: 800, color: indigo, fontFamily: "'IBM Plex Serif', serif" }}>{t("pillar2Title")}</h3>
            <p style={{ marginTop: 16, fontSize: 18, color: inkSoft, lineHeight: 1.8 }}>{t("pillar2Desc")}</p>
          </div>
          <div className="hover-lift fade-in-up" style={{ padding: 40, background: bgCard, border: "2px solid " + amber + "30", borderRadius: 22, boxShadow: "0 14px 34px " + amber + "14" }}>
            <div style={{ width: 60, height: 60, background: amber + "18", borderRadius: 16, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 24 }}><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={amber} strokeWidth="2"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" /><rect x="9" y="3" width="6" height="4" rx="1" /></svg></div>
            <h3 style={{ fontSize: 27, fontWeight: 800, color: amber, fontFamily: "'IBM Plex Serif', serif" }}>{t("pillar3Title")}</h3>
            <p style={{ marginTop: 16, fontSize: 18, color: inkSoft, lineHeight: 1.8 }}>{t("pillar3Desc")}</p>
          </div>
        </div>
      </section>

      {/* SECURITY */}
      <section style={{ padding: "90px 40px", background: green + "08" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ textAlign: "center" }}>
            <div style={labelStyle(green)}>{t("securityLabel")}</div>
            <h2 style={sectionTitleStyle}>{t("securityTitle")}</h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 28, marginTop: 56 }}>
            <div style={{ padding: 30, background: bgCard, borderRadius: 18, border: "1px solid " + cardBorder }}>
              <h3 style={{ fontSize: 21, fontWeight: 700, color: green, display: "flex", alignItems: "center", gap: 8 }}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={green} strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>{t("security1Title")}</h3>
              <p style={{ marginTop: 12, fontSize: 17, color: inkSoft, lineHeight: 1.7 }}>{t("security1Desc")}</p>
            </div>
            <div style={{ padding: 30, background: bgCard, borderRadius: 18, border: "1px solid " + cardBorder }}>
              <h3 style={{ fontSize: 21, fontWeight: 700, color: green, display: "flex", alignItems: "center", gap: 8 }}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={green} strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>{t("security2Title")}</h3>
              <p style={{ marginTop: 12, fontSize: 17, color: inkSoft, lineHeight: 1.7 }}>{t("security2Desc")}</p>
            </div>
            <div style={{ padding: 30, background: bgCard, borderRadius: 18, border: "1px solid " + cardBorder }}>
              <h3 style={{ fontSize: 21, fontWeight: 700, color: green, display: "flex", alignItems: "center", gap: 8 }}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={green} strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>{t("security3Title")}</h3>
              <p style={{ marginTop: 12, fontSize: 17, color: inkSoft, lineHeight: 1.7 }}>{t("security3Desc")}</p>
            </div>
            <div style={{ padding: 30, background: bgCard, borderRadius: 18, border: "1px solid " + cardBorder }}>
              <h3 style={{ fontSize: 21, fontWeight: 700, color: green, display: "flex", alignItems: "center", gap: 8 }}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={green} strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>{t("security4Title")}</h3>
              <p style={{ marginTop: 12, fontSize: 17, color: inkSoft, lineHeight: 1.7 }}>{t("security4Desc")}</p>
            </div>
          </div>
        </div>
      </section>

      {/* PLANS TEASER */}
      <section style={{ padding: "90px 40px", textAlign: "center" }}>
        <div style={labelStyle(indigo)}>{t("plansLabel")}</div>
        <h2 style={sectionTitleStyle}>{t("plansTitle")}</h2>
        <p style={{ marginTop: 18, fontSize: 20, color: inkSoft, maxWidth: 600, margin: "18px auto 0" }}>{t("plansDesc")}</p>
        <Link href="./servicios" style={{ display: "inline-block", marginTop: 34, padding: "18px 42px", background: indigo, color: "white", borderRadius: 14, textDecoration: "none", fontSize: 19, fontWeight: 700, boxShadow: "0 10px 26px " + indigo + "40" }}>
          {t("plansCta")}
        </Link>
      </section>

      {/* FAQ */}
      <section style={{ padding: "90px 40px", background: bgCard, borderTop: "1px solid " + cardBorder }}>
        <div style={{ maxWidth: 820, margin: "0 auto" }}>
          <div style={{ textAlign: "center" }}>
            <div style={labelStyle(cyan)}>{t("faqLabel")}</div>
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
