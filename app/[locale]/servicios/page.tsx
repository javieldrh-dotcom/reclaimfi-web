"use client";
import Link from "next/link";
import { useTranslations } from "next-intl";
import LanguageSwitcher from "../_components/LanguageSwitcher";

export default function ServiciosPage() {
  const t = useTranslations("servicios");
  const tNav = useTranslations("nav");

  const bg = "#0A1628";
  const bgCard = "#12213B";
  const bgCard2 = "#16294A";
  const ink = "#FFFFFF";
  const inkSoft = "#8FA3C4";
  const sky = "#FACC15";
  const navy = "#3B82F6";
  const cardBorder = "#1E3A5F";

  const cardStyle: React.CSSProperties = {
    padding: 32,
    background: bgCard,
    border: "1px solid " + cardBorder,
    borderTop: "4px solid " + sky,
    borderRadius: 16,
    boxShadow: "0 14px 34px rgba(0,0,0,0.4)",
  };

  return (
    <div style={{ background: "radial-gradient(ellipse 90% 50% at 50% -10%, " + bgCard + " 0%, " + bg + " 60%, #040911 100%)", minHeight: "100vh", color: ink, fontFamily: "'IBM Plex Sans', sans-serif" }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "22px 48px", borderBottom: "1px solid " + cardBorder, flexWrap: "wrap", gap: 16, background: "rgba(10,22,40,0.85)", backdropFilter: "blur(12px)", position: "sticky", top: 0, zIndex: 50 }}>
        <Link href="./" style={{ fontSize: 22, fontWeight: 800, color: sky, fontFamily: "'IBM Plex Serif', serif", textDecoration: "none" }}>
          {tNav("brand")}
        </Link>
        <nav style={{ display: "flex", alignItems: "center", gap: 28, flexWrap: "wrap" }}>
          <Link href="./servicios" style={{ color: sky, textDecoration: "none", fontSize: 19, fontWeight: 700 }}>{tNav("servicios")}</Link>
          <Link href="./tecnologia" style={{ color: ink, textDecoration: "none", fontSize: 19, fontWeight: 600 }}>{tNav("tecnologia")}</Link>
          <Link href="./contacto" style={{ color: ink, textDecoration: "none", fontSize: 19, fontWeight: 600 }}>{tNav("contacto")}</Link>
          <LanguageSwitcher />
          <Link href="/login" style={{ padding: "12px 26px", background: sky, borderRadius: 10, color: bg, textDecoration: "none", fontSize: 16, fontWeight: 800 }}>
            {tNav("acceso")}
          </Link>
        </nav>
      </header>

      <section style={{ padding: "70px 40px 50px", textAlign: "center", maxWidth: 900, margin: "0 auto" }}>
        <div style={{ display: "inline-block", padding: "8px 20px", background: sky + "18", color: sky, borderRadius: 999, fontSize: 14, fontWeight: 700, marginBottom: 20, border: "1px solid " + sky + "35" }}>
          {t("eyebrow")}
        </div>
        <h1 style={{ fontSize: 68, fontWeight: 800, fontFamily: "'IBM Plex Serif', serif", lineHeight: 1.1 }}>{t("headline")}</h1>
        <p style={{ marginTop: 22, fontSize: 26, color: inkSoft, lineHeight: 1.6 }}>{t("subheadline")}</p>
      </section>

      <section style={{ padding: "20px 40px 80px", maxWidth: 1150, margin: "0 auto" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 28 }}>
          <div style={cardStyle}>
            <h2 style={{ fontSize: 28, fontWeight: 800, color: sky }}>{t("service1Title")}</h2>
            <p style={{ marginTop: 12, fontSize: 19, color: inkSoft, lineHeight: 1.7 }}>{t("service1Desc")}</p>
          </div>
          <div style={cardStyle}>
            <h2 style={{ fontSize: 28, fontWeight: 800, color: sky }}>{t("service2Title")}</h2>
            <p style={{ marginTop: 12, fontSize: 19, color: inkSoft, lineHeight: 1.7 }}>{t("service2Desc")}</p>
          </div>
          <div style={cardStyle}>
            <h2 style={{ fontSize: 28, fontWeight: 800, color: sky }}>{t("service4Title")}</h2>
            <p style={{ marginTop: 12, fontSize: 19, color: inkSoft, lineHeight: 1.7 }}>{t("service4Desc")}</p>
          </div>
          <div style={cardStyle}>
            <h2 style={{ fontSize: 28, fontWeight: 800, color: sky }}>{t("service3Title")}</h2>
            <p style={{ marginTop: 12, fontSize: 19, color: inkSoft, lineHeight: 1.7 }}>{t("service3Desc")}</p>
          </div>
          <div style={cardStyle}>
            <h2 style={{ fontSize: 28, fontWeight: 800, color: sky }}>{t("service5Title")}</h2>
            <p style={{ marginTop: 12, fontSize: 19, color: inkSoft, lineHeight: 1.7 }}>{t("service5Desc")}</p>
          </div>
          <div style={cardStyle}>
            <h2 style={{ fontSize: 28, fontWeight: 800, color: sky }}>{t("service6Title")}</h2>
            <p style={{ marginTop: 12, fontSize: 19, color: inkSoft, lineHeight: 1.7 }}>{t("service6Desc")}</p>
          </div>
        </div>
      </section>

      <section style={{ padding: "70px 40px 90px", background: bgCard2, borderTop: "1px solid " + cardBorder }}>
        <div style={{ maxWidth: 1000, margin: "0 auto", textAlign: "center" }}>
          <div style={{ display: "inline-block", padding: "8px 20px", background: navy + "20", color: sky, borderRadius: 999, fontSize: 14, fontWeight: 700, marginBottom: 20, border: "1px solid " + navy + "40" }}>
            {t("plansLabel")}
          </div>
          <h2 style={{ fontSize: 48, fontWeight: 800, fontFamily: "'IBM Plex Serif', serif" }}>{t("plansHeadline")}</h2>
          <p style={{ marginTop: 14, fontSize: 18, color: inkSoft, maxWidth: 650, margin: "14px auto 0" }}>{t("plansSubheadline")}</p>

          <div style={{ marginTop: 48, overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", minWidth: 700 }}>
              <thead>
                <tr>
                  <th style={{ padding: "16px 20px", borderBottom: "2px solid " + cardBorder, fontSize: 15, color: inkSoft, fontWeight: 600 }}></th>
                  <th style={{ padding: "16px 20px", borderBottom: "2px solid " + cardBorder, fontSize: 22, fontWeight: 800 }}>{t("planBasicName")}</th>
                  <th style={{ padding: "16px 20px", borderBottom: "2px solid " + sky, fontSize: 22, fontWeight: 800, color: sky, background: sky + "0C" }}>{t("planProName")}</th>
                  <th style={{ padding: "16px 20px", borderBottom: "2px solid " + cardBorder, fontSize: 22, fontWeight: 800 }}>{t("planEnterpriseName")}</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ padding: "14px 20px", borderBottom: "1px solid " + cardBorder, fontSize: 17, color: inkSoft }}>{t("planBasicFeature1")}</td>
                  <td style={{ padding: "14px 20px", borderBottom: "1px solid " + cardBorder, textAlign: "center", color: sky }}>OK</td>
                  <td style={{ padding: "14px 20px", borderBottom: "1px solid " + cardBorder, textAlign: "center", color: sky, background: sky + "0C" }}>OK</td>
                  <td style={{ padding: "14px 20px", borderBottom: "1px solid " + cardBorder, textAlign: "center", color: sky }}>OK</td>
                </tr>
                <tr>
                  <td style={{ padding: "14px 20px", borderBottom: "1px solid " + cardBorder, fontSize: 17, color: inkSoft }}>{t("planBasicFeature2")}</td>
                  <td style={{ padding: "14px 20px", borderBottom: "1px solid " + cardBorder, textAlign: "center", color: sky }}>OK</td>
                  <td style={{ padding: "14px 20px", borderBottom: "1px solid " + cardBorder, textAlign: "center", color: sky, background: sky + "0C" }}>OK</td>
                  <td style={{ padding: "14px 20px", borderBottom: "1px solid " + cardBorder, textAlign: "center", color: sky }}>OK</td>
                </tr>
                <tr>
                  <td style={{ padding: "14px 20px", borderBottom: "1px solid " + cardBorder, fontSize: 17, color: inkSoft }}>{t("planProFeature2")}</td>
                  <td style={{ padding: "14px 20px", borderBottom: "1px solid " + cardBorder, textAlign: "center", color: cardBorder }}>-</td>
                  <td style={{ padding: "14px 20px", borderBottom: "1px solid " + cardBorder, textAlign: "center", color: sky, background: sky + "0C" }}>OK</td>
                  <td style={{ padding: "14px 20px", borderBottom: "1px solid " + cardBorder, textAlign: "center", color: sky }}>OK</td>
                </tr>
                <tr>
                  <td style={{ padding: "14px 20px", borderBottom: "1px solid " + cardBorder, fontSize: 17, color: inkSoft }}>{t("planProFeature3")}</td>
                  <td style={{ padding: "14px 20px", borderBottom: "1px solid " + cardBorder, textAlign: "center", color: cardBorder }}>-</td>
                  <td style={{ padding: "14px 20px", borderBottom: "1px solid " + cardBorder, textAlign: "center", color: sky, background: sky + "0C" }}>OK</td>
                  <td style={{ padding: "14px 20px", borderBottom: "1px solid " + cardBorder, textAlign: "center", color: sky }}>OK</td>
                </tr>
                <tr>
                  <td style={{ padding: "14px 20px", borderBottom: "1px solid " + cardBorder, fontSize: 17, color: inkSoft }}>{t("planEnterpriseFeature2")}</td>
                  <td style={{ padding: "14px 20px", borderBottom: "1px solid " + cardBorder, textAlign: "center", color: cardBorder }}>-</td>
                  <td style={{ padding: "14px 20px", borderBottom: "1px solid " + cardBorder, textAlign: "center", color: cardBorder, background: sky + "0C" }}>-</td>
                  <td style={{ padding: "14px 20px", borderBottom: "1px solid " + cardBorder, textAlign: "center", color: sky }}>OK</td>
                </tr>
                <tr>
                  <td style={{ padding: "14px 20px", fontSize: 17, color: inkSoft }}>{t("planEnterpriseFeature3")}</td>
                  <td style={{ padding: "14px 20px", textAlign: "center", color: cardBorder }}>-</td>
                  <td style={{ padding: "14px 20px", textAlign: "center", color: cardBorder, background: sky + "0C" }}>-</td>
                  <td style={{ padding: "14px 20px", textAlign: "center", color: sky }}>OK</td>
                </tr>
                <tr>
                  <td style={{ padding: "20px" }}></td>
                  <td style={{ padding: 20, textAlign: "center" }}>
                    <Link href="./contacto" style={{ display: "inline-block", padding: "10px 24px", border: "1px solid " + sky, color: sky, borderRadius: 10, textDecoration: "none", fontWeight: 700, fontSize: 14 }}>{t("planCta")}</Link>
                  </td>
                  <td style={{ padding: 20, textAlign: "center", background: sky + "0C" }}>
                    <Link href="./contacto" style={{ display: "inline-block", padding: "10px 24px", background: sky, color: bg, borderRadius: 10, textDecoration: "none", fontWeight: 800, fontSize: 14 }}>{t("planCta")}</Link>
                  </td>
                  <td style={{ padding: 20, textAlign: "center" }}>
                    <Link href="./contacto" style={{ display: "inline-block", padding: "10px 24px", border: "1px solid " + sky, color: sky, borderRadius: 10, textDecoration: "none", fontWeight: 700, fontSize: 14 }}>{t("planCta")}</Link>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <footer style={{ padding: "28px 40px", borderTop: "1px solid " + cardBorder, textAlign: "center", fontSize: 14, color: inkSoft }}>
        {tNav("brand")}
      </footer>
    </div>
  );
}