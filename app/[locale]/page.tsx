"use client";
import Link from "next/link";
import { useTranslations } from "next-intl";
import LanguageSwitcher from "./_components/LanguageSwitcher";

export default function HomePage() {
  const t = useTranslations("home");
  const tNav = useTranslations("nav");

  const bg = "#FAFAF7";
  const ink = "#14181F";
  const inkSoft = "#565F73";
  const cyan = "#0891B2";
  const indigo = "#6366F1";
  const amber = "#D97706";
  const green = "#16A34A";
  const cardBorder = "#E7E3D9";

  const sectionTitleStyle: React.CSSProperties = {
    fontSize: 38,
    fontWeight: 800,
    fontFamily: "'IBM Plex Serif', serif",
    color: ink,
    textAlign: "center" as const,
  };

  const labelStyle = (color: string): React.CSSProperties => ({
    display: "inline-block",
    padding: "8px 20px",
    background: color + "15",
    color: color,
    borderRadius: 999,
    fontSize: 15,
    fontWeight: 700,
    marginBottom: 20,
  });

  return (
    <div style={{ background: bg, minHeight: "100vh", color: ink, fontFamily: "'IBM Plex Sans', sans-serif" }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "22px 48px", borderBottom: "1px solid " + cardBorder, flexWrap: "wrap", gap: 16, background: "#FFFFFF" }}>
        <div style={{ fontSize: 22, fontWeight: 800, color: indigo, fontFamily: "'IBM Plex Serif', serif" }}>
          {tNav("brand")}
        </div>
        <nav style={{ display: "flex", alignItems: "center", gap: 28, flexWrap: "wrap" }}>
          <Link href="./servicios" style={{ color: ink, textDecoration: "none", fontSize: 17, fontWeight: 600 }}>{tNav("servicios")}</Link>
          <Link href="./tecnologia" style={{ color: ink, textDecoration: "none", fontSize: 17, fontWeight: 600 }}>{tNav("tecnologia")}</Link>
          <Link href="./contacto" style={{ color: ink, textDecoration: "none", fontSize: 17, fontWeight: 600 }}>{tNav("contacto")}</Link>
          <LanguageSwitcher />
          <Link href="/login" style={{ padding: "12px 26px", background: indigo, borderRadius: 10, color: "white", textDecoration: "none", fontSize: 16, fontWeight: 700 }}>
            {tNav("acceso")}
          </Link>
        </nav>
      </header>

      {/* HERO */}
      <section style={{ padding: "90px 40px 70px", textAlign: "center", maxWidth: 980, margin: "0 auto" }}>
        <div style={labelStyle(indigo)}>{t("eyebrow")}</div>
        <h1 style={{ fontSize: 58, fontWeight: 800, lineHeight: 1.2, fontFamily: "'IBM Plex Serif', serif", color: ink }}>
          {t("headline")}
        </h1>
        <p style={{ marginTop: 26, fontSize: 22, color: inkSoft, maxWidth: 760, margin: "26px auto 0", lineHeight: 1.7 }}>
          {t("subheadline")}
        </p>
        <div style={{ marginTop: 36, display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap" }}>
          <Link href="/login" style={{ padding: "18px 40px", background: indigo, color: "white", borderRadius: 12, textDecoration: "none", fontSize: 18, fontWeight: 700 }}>
            {t("cta")}
          </Link>
        </div>
      </section>

      {/* DIFFERENTIATOR STAT */}
      <section style={{ padding: "0 40px 70px", maxWidth: 980, margin: "0 auto" }}>
        <div style={{ background: amber + "12", border: "1px solid " + amber + "40", borderRadius: 20, padding: "36px 40px" }}>
          <p style={{ fontSize: 14, fontWeight: 800, textTransform: "uppercase", letterSpacing: 1, color: amber }}>
            {t("statLabel")}
          </p>
          <p style={{ marginTop: 14, fontSize: 19, lineHeight: 1.8, color: ink, fontFamily: "'IBM Plex Mono', monospace" }}>
            {t("statDescription")}
          </p>
        </div>
      </section>

      {/* DIFFERENTIATOR MESSAGE */}
      <section style={{ padding: "60px 40px", background: "#FFFFFF", borderTop: "1px solid " + cardBorder, borderBottom: "1px solid " + cardBorder }}>
        <div style={{ maxWidth: 900, margin: "0 auto", textAlign: "center" }}>
          <div style={labelStyle(green)}>{t("differentiatorLabel")}</div>
          <h2 style={{ ...sectionTitleStyle, fontSize: 34 }}>{t("differentiatorTitle")}</h2>
          <p style={{ marginTop: 20, fontSize: 19, color: inkSoft, lineHeight: 1.8 }}>{t("differentiatorDesc")}</p>
        </div>
      </section>

      {/* 3 PILLARS */}
      <section style={{ padding: "90px 40px", maxWidth: 1200, margin: "0 auto" }}>
        <h2 style={sectionTitleStyle}>{t("pillarsTitle")}</h2>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 32, marginTop: 50 }}>
          <div style={{ padding: 38, background: "#FFFFFF", border: "2px solid " + cyan + "30", borderRadius: 20, boxShadow: "0 10px 30px " + cyan + "12" }}>
            <div style={{ width: 56, height: 56, background: cyan + "18", borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, marginBottom: 22 }}>🔍</div>
            <h3 style={{ fontSize: 25, fontWeight: 800, color: cyan, fontFamily: "'IBM Plex Serif', serif" }}>{t("pillar1Title")}</h3>
            <p style={{ marginTop: 14, fontSize: 17, color: inkSoft, lineHeight: 1.8 }}>{t("pillar1Desc")}</p>
          </div>
          <div style={{ padding: 38, background: "#FFFFFF", border: "2px solid " + indigo + "30", borderRadius: 20, boxShadow: "0 10px 30px " + indigo + "12" }}>
            <div style={{ width: 56, height: 56, background: indigo + "18", borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, marginBottom: 22 }}>📊</div>
            <h3 style={{ fontSize: 25, fontWeight: 800, color: indigo, fontFamily: "'IBM Plex Serif', serif" }}>{t("pillar2Title")}</h3>
            <p style={{ marginTop: 14, fontSize: 17, color: inkSoft, lineHeight: 1.8 }}>{t("pillar2Desc")}</p>
          </div>
          <div style={{ padding: 38, background: "#FFFFFF", border: "2px solid " + amber + "30", borderRadius: 20, boxShadow: "0 10px 30px " + amber + "12" }}>
            <div style={{ width: 56, height: 56, background: amber + "18", borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, marginBottom: 22 }}>📋</div>
            <h3 style={{ fontSize: 25, fontWeight: 800, color: amber, fontFamily: "'IBM Plex Serif', serif" }}>{t("pillar3Title")}</h3>
            <p style={{ marginTop: 14, fontSize: 17, color: inkSoft, lineHeight: 1.8 }}>{t("pillar3Desc")}</p>
          </div>
        </div>
      </section>

      {/* SECURITY */}
      <section style={{ padding: "80px 40px", background: green + "08" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ textAlign: "center" }}>
            <div style={labelStyle(green)}>{t("securityLabel")}</div>
            <h2 style={sectionTitleStyle}>{t("securityTitle")}</h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 28, marginTop: 50 }}>
            <div style={{ padding: 28, background: "#FFFFFF", borderRadius: 16, border: "1px solid " + cardBorder }}>
              <h3 style={{ fontSize: 19, fontWeight: 700, color: green }}>✓ {t("security1Title")}</h3>
              <p style={{ marginTop: 10, fontSize: 16, color: inkSoft, lineHeight: 1.7 }}>{t("security1Desc")}</p>
            </div>
            <div style={{ padding: 28, background: "#FFFFFF", borderRadius: 16, border: "1px solid " + cardBorder }}>
              <h3 style={{ fontSize: 19, fontWeight: 700, color: green }}>✓ {t("security2Title")}</h3>
              <p style={{ marginTop: 10, fontSize: 16, color: inkSoft, lineHeight: 1.7 }}>{t("security2Desc")}</p>
            </div>
            <div style={{ padding: 28, background: "#FFFFFF", borderRadius: 16, border: "1px solid " + cardBorder }}>
              <h3 style={{ fontSize: 19, fontWeight: 700, color: green }}>✓ {t("security3Title")}</h3>
              <p style={{ marginTop: 10, fontSize: 16, color: inkSoft, lineHeight: 1.7 }}>{t("security3Desc")}</p>
            </div>
            <div style={{ padding: 28, background: "#FFFFFF", borderRadius: 16, border: "1px solid " + cardBorder }}>
              <h3 style={{ fontSize: 19, fontWeight: 700, color: green }}>✓ {t("security4Title")}</h3>
              <p style={{ marginTop: 10, fontSize: 16, color: inkSoft, lineHeight: 1.7 }}>{t("security4Desc")}</p>
            </div>
          </div>
        </div>
      </section>

      {/* PLANS TEASER */}
      <section style={{ padding: "80px 40px", textAlign: "center" }}>
        <div style={labelStyle(indigo)}>{t("plansLabel")}</div>
        <h2 style={sectionTitleStyle}>{t("plansTitle")}</h2>
        <p style={{ marginTop: 16, fontSize: 19, color: inkSoft, maxWidth: 600, margin: "16px auto 0" }}>{t("plansDesc")}</p>
        <Link href="./servicios" style={{ display: "inline-block", marginTop: 30, padding: "16px 36px", background: indigo, color: "white", borderRadius: 12, textDecoration: "none", fontSize: 17, fontWeight: 700 }}>
          {t("plansCta")}
        </Link>
      </section>

      {/* FAQ */}
      <section style={{ padding: "80px 40px", background: "#FFFFFF", borderTop: "1px solid " + cardBorder }}>
        <div style={{ maxWidth: 800, margin: "0 auto" }}>
          <div style={{ textAlign: "center" }}>
            <div style={labelStyle(cyan)}>{t("faqLabel")}</div>
            <h2 style={sectionTitleStyle}>{t("faqTitle")}</h2>
          </div>
          <div style={{ marginTop: 40, display: "flex", flexDirection: "column", gap: 20 }}>
            {[1, 2, 3, 4].map((n) => (
              <div key={n} style={{ padding: 26, background: bg, borderRadius: 14, border: "1px solid " + cardBorder }}>
                <h3 style={{ fontSize: 18, fontWeight: 700, color: ink }}>{t(`faq${n}Q` as any)}</h3>
                <p style={{ marginTop: 10, fontSize: 16, color: inkSoft, lineHeight: 1.7 }}>{t(`faq${n}A` as any)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer style={{ padding: "32px 40px", borderTop: "1px solid " + cardBorder, textAlign: "center", fontSize: 14, color: inkSoft, background: "#FFFFFF" }}>
        {tNav("brand")}
      </footer>
    </div>
  );
}
