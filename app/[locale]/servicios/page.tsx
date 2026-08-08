"use client";
import Link from "next/link";
import { useTranslations } from "next-intl";
import LanguageSwitcher from "../_components/LanguageSwitcher";

export default function ServiciosPage() {
  const t = useTranslations("servicios");
  const tNav = useTranslations("nav");

  const bg = "#FBF3E3";
  const ink = "#14181F";
  const inkSoft = "#565F73";
  const cyan = "#0891B2";
  const indigo = "#6366F1";
  const amber = "#D97706";
  const cardBorder = "#E7E3D9";

  const cardStyle = (color: string): React.CSSProperties => ({
    padding: 32,
    background: "#FFFFFF",
    border: "1px solid " + cardBorder,
    borderTop: "4px solid " + color,
    borderRadius: 16,
    boxShadow: "0 10px 30px rgba(20,24,31,0.06)",
  });

  return (
    <div style={{ background: bg, minHeight: "100vh", color: ink, fontFamily: "'IBM Plex Sans', sans-serif" }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "22px 48px", borderBottom: "1px solid " + cardBorder, flexWrap: "wrap", gap: 16, background: "#FFFFFF" }}>
        <Link href="./" style={{ fontSize: 22, fontWeight: 800, color: indigo, fontFamily: "'IBM Plex Serif', serif", textDecoration: "none" }}>
          {tNav("brand")}
        </Link>
        <nav style={{ display: "flex", alignItems: "center", gap: 28, flexWrap: "wrap" }}>
          <Link href="./servicios" style={{ color: indigo, textDecoration: "none", fontSize: 17, fontWeight: 700 }}>{tNav("servicios")}</Link>
          <Link href="./tecnologia" style={{ color: ink, textDecoration: "none", fontSize: 17, fontWeight: 600 }}>{tNav("tecnologia")}</Link>
          <Link href="./contacto" style={{ color: ink, textDecoration: "none", fontSize: 17, fontWeight: 600 }}>{tNav("contacto")}</Link>
          <LanguageSwitcher />
          <Link href="/login" style={{ padding: "12px 26px", background: indigo, borderRadius: 10, color: "white", textDecoration: "none", fontSize: 16, fontWeight: 700 }}>
            {tNav("acceso")}
          </Link>
        </nav>
      </header>

      <section style={{ padding: "70px 40px 50px", textAlign: "center", maxWidth: 1100, margin: "0 auto", background: "radial-gradient(ellipse 70% 60% at 50% 0%, " + indigo + "18, transparent), radial-gradient(ellipse 60% 50% at 85% 30%, " + amber + "15, transparent)" }}>
        <div style={{ display: "inline-block", padding: "8px 20px", background: indigo + "12", color: indigo, borderRadius: 999, fontSize: 14, fontWeight: 700, marginBottom: 20 }}>
          {t("eyebrow")}
        </div>
        <h1 style={{ fontSize: 44, fontWeight: 800, fontFamily: "'IBM Plex Serif', serif", lineHeight: 1.2 }}>{t("headline")}</h1>
        <p style={{ marginTop: 18, fontSize: 19, color: inkSoft, lineHeight: 1.7 }}>{t("subheadline")}</p>
      </section>

      <section style={{ padding: "20px 40px 80px", maxWidth: 1150, margin: "0 auto" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 28 }}>
          <div style={cardStyle(cyan)}>
            <h2 style={{ fontSize: 21, fontWeight: 800, color: cyan }}>{t("service1Title")}</h2>
            <p style={{ marginTop: 12, fontSize: 16, color: inkSoft, lineHeight: 1.7 }}>{t("service1Desc")}</p>
          </div>
          <div style={cardStyle(indigo)}>
            <h2 style={{ fontSize: 21, fontWeight: 800, color: indigo }}>{t("service2Title")}</h2>
            <p style={{ marginTop: 12, fontSize: 16, color: inkSoft, lineHeight: 1.7 }}>{t("service2Desc")}</p>
          </div>
          <div style={cardStyle(amber)}>
            <h2 style={{ fontSize: 21, fontWeight: 800, color: amber }}>{t("service4Title")}</h2>
            <p style={{ marginTop: 12, fontSize: 16, color: inkSoft, lineHeight: 1.7 }}>{t("service4Desc")}</p>
          </div>
          <div style={cardStyle(cyan)}>
            <h2 style={{ fontSize: 21, fontWeight: 800, color: cyan }}>{t("service3Title")}</h2>
            <p style={{ marginTop: 12, fontSize: 16, color: inkSoft, lineHeight: 1.7 }}>{t("service3Desc")}</p>
          </div>
          <div style={cardStyle(indigo)}>
            <h2 style={{ fontSize: 21, fontWeight: 800, color: indigo }}>{t("service5Title")}</h2>
            <p style={{ marginTop: 12, fontSize: 16, color: inkSoft, lineHeight: 1.7 }}>{t("service5Desc")}</p>
          </div>
          <div style={cardStyle(amber)}>
            <h2 style={{ fontSize: 21, fontWeight: 800, color: amber }}>{t("service6Title")}</h2>
            <p style={{ marginTop: 12, fontSize: 16, color: inkSoft, lineHeight: 1.7 }}>{t("service6Desc")}</p>
          </div>
        </div>
      </section>

      {/* PLANES */}
      <section style={{ padding: "70px 40px 90px", background: "#FFFFFF", borderTop: "1px solid " + cardBorder }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", textAlign: "center" }}>
          <div style={{ display: "inline-block", padding: "8px 20px", background: amber + "12", color: amber, borderRadius: 999, fontSize: 14, fontWeight: 700, marginBottom: 20 }}>
            {t("plansLabel")}
          </div>
          <h2 style={{ fontSize: 36, fontWeight: 800, fontFamily: "'IBM Plex Serif', serif" }}>{t("plansHeadline")}</h2>
          <p style={{ marginTop: 14, fontSize: 18, color: inkSoft, maxWidth: 650, margin: "14px auto 0" }}>{t("plansSubheadline")}</p>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 28, marginTop: 48, textAlign: "left" }}>
            <div style={{ padding: 32, border: "1px solid " + cardBorder, borderRadius: 16, background: bg }}>
              <h3 style={{ fontSize: 20, fontWeight: 800 }}>{t("planBasicName")}</h3>
              <p style={{ marginTop: 8, fontSize: 15, color: inkSoft }}>{t("planBasicDesc")}</p>
              <ul style={{ marginTop: 20, paddingLeft: 20, fontSize: 15, color: inkSoft, lineHeight: 2 }}>
                <li>{t("planBasicFeature1")}</li>
                <li>{t("planBasicFeature2")}</li>
                <li>{t("planBasicFeature3")}</li>
              </ul>
              <Link href="./contacto" style={{ display: "block", marginTop: 24, padding: "12px 0", textAlign: "center", border: "1px solid " + indigo, color: indigo, borderRadius: 10, textDecoration: "none", fontWeight: 700 }}>
                {t("planCta")}
              </Link>
            </div>

            <div style={{ padding: 32, border: "2px solid " + indigo, borderRadius: 16, background: bg, position: "relative" }}>
              <div style={{ position: "absolute", top: -14, left: 24, background: indigo, color: "white", fontSize: 12, fontWeight: 800, padding: "4px 14px", borderRadius: 999 }}>{t("planPopular")}</div>
              <h3 style={{ fontSize: 20, fontWeight: 800 }}>{t("planProName")}</h3>
              <p style={{ marginTop: 8, fontSize: 15, color: inkSoft }}>{t("planProDesc")}</p>
              <ul style={{ marginTop: 20, paddingLeft: 20, fontSize: 15, color: inkSoft, lineHeight: 2 }}>
                <li>{t("planProFeature1")}</li>
                <li>{t("planProFeature2")}</li>
                <li>{t("planProFeature3")}</li>
                <li>{t("planProFeature4")}</li>
              </ul>
              <Link href="./contacto" style={{ display: "block", marginTop: 24, padding: "12px 0", textAlign: "center", background: indigo, color: "white", borderRadius: 10, textDecoration: "none", fontWeight: 700 }}>
                {t("planCta")}
              </Link>
            </div>

            <div style={{ padding: 32, border: "1px solid " + cardBorder, borderRadius: 16, background: bg }}>
              <h3 style={{ fontSize: 20, fontWeight: 800 }}>{t("planEnterpriseName")}</h3>
              <p style={{ marginTop: 8, fontSize: 15, color: inkSoft }}>{t("planEnterpriseDesc")}</p>
              <ul style={{ marginTop: 20, paddingLeft: 20, fontSize: 15, color: inkSoft, lineHeight: 2 }}>
                <li>{t("planEnterpriseFeature1")}</li>
                <li>{t("planEnterpriseFeature2")}</li>
                <li>{t("planEnterpriseFeature3")}</li>
              </ul>
              <Link href="./contacto" style={{ display: "block", marginTop: 24, padding: "12px 0", textAlign: "center", border: "1px solid " + indigo, color: indigo, borderRadius: 10, textDecoration: "none", fontWeight: 700 }}>
                {t("planCta")}
              </Link>
            </div>
          </div>
        </div>
      </section>

      <footer style={{ padding: "28px 40px", borderTop: "1px solid " + cardBorder, textAlign: "center", fontSize: 14, color: inkSoft }}>
        {tNav("brand")}
      </footer>
    </div>
  );
}
