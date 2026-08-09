"use client";
import Link from "next/link";
import { useTranslations } from "next-intl";
import LanguageSwitcher from "../_components/LanguageSwitcher";

export default function PreciosPage() {
  const t = useTranslations("precios");
  const ts = useTranslations("servicios");
  const tNav = useTranslations("nav");

  const bg = "#0A1628";
  const bgCard = "#12213B";
  const ink = "#FFFFFF";
  const inkSoft = "#8FA3C4";
  const sky = "#FACC15";
  const cardBorder = "#1E3A5F";

  return (
    <div style={{ background: "radial-gradient(ellipse 90% 50% at 50% -10%, " + bgCard + " 0%, " + bg + " 60%, #040911 100%)", minHeight: "100vh", color: ink, fontFamily: "'IBM Plex Sans', sans-serif" }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "22px 48px", borderBottom: "1px solid " + cardBorder, flexWrap: "wrap", gap: 16, background: "rgba(10,22,40,0.85)", backdropFilter: "blur(12px)", position: "sticky", top: 0, zIndex: 50 }}>
        <Link href="./" style={{ fontSize: 22, fontWeight: 800, color: sky, fontFamily: "'IBM Plex Serif', serif", textDecoration: "none" }}>
          {tNav("brand")}
        </Link>
        <nav style={{ display: "flex", alignItems: "center", gap: 22, flexWrap: "wrap" }}>
          <Link href="./producto" style={{ color: ink, textDecoration: "none", fontSize: 17, fontWeight: 600 }}>{tNav("producto")}</Link>
          <Link href="./soluciones" style={{ color: ink, textDecoration: "none", fontSize: 17, fontWeight: 600 }}>{tNav("soluciones")}</Link>
          <Link href="./precios" style={{ color: sky, textDecoration: "none", fontSize: 17, fontWeight: 700 }}>{tNav("precios")}</Link>
          <Link href="./tecnologia" style={{ color: ink, textDecoration: "none", fontSize: 17, fontWeight: 600 }}>{tNav("tecnologia")}</Link>
          <Link href="./seguridad" style={{ color: ink, textDecoration: "none", fontSize: 17, fontWeight: 600 }}>{tNav("seguridad")}</Link>
          <Link href="./contacto" style={{ color: ink, textDecoration: "none", fontSize: 17, fontWeight: 600 }}>{tNav("contacto")}</Link>
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
        <h1 style={{ fontSize: 56, fontWeight: 800, fontFamily: "'IBM Plex Serif', serif", lineHeight: 1.1 }}>{t("headline")}</h1>
        <p style={{ marginTop: 18, fontSize: 22, color: inkSoft, lineHeight: 1.6 }}>{t("subheadline")}</p>
      </section>

      <section style={{ padding: "20px 40px 90px", maxWidth: 1000, margin: "0 auto" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", minWidth: 700 }}>
            <thead>
              <tr>
                <th style={{ padding: "16px 20px", borderBottom: "2px solid " + cardBorder, fontSize: 15, color: inkSoft, fontWeight: 600 }}></th>
                <th style={{ padding: "16px 20px", borderBottom: "2px solid " + cardBorder, fontSize: 22, fontWeight: 800 }}>{ts("planBasicName")}</th>
                <th style={{ padding: "16px 20px", borderBottom: "2px solid " + sky, fontSize: 22, fontWeight: 800, color: sky, background: sky + "0C" }}>{ts("planProName")}</th>
                <th style={{ padding: "16px 20px", borderBottom: "2px solid " + cardBorder, fontSize: 22, fontWeight: 800 }}>{ts("planEnterpriseName")}</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ padding: "14px 20px", borderBottom: "1px solid " + cardBorder, fontSize: 17, color: inkSoft }}>{ts("planBasicFeature1")}</td>
                <td style={{ padding: "14px 20px", borderBottom: "1px solid " + cardBorder, textAlign: "center", color: sky }}>OK</td>
                <td style={{ padding: "14px 20px", borderBottom: "1px solid " + cardBorder, textAlign: "center", color: sky, background: sky + "0C" }}>OK</td>
                <td style={{ padding: "14px 20px", borderBottom: "1px solid " + cardBorder, textAlign: "center", color: sky }}>OK</td>
              </tr>
              <tr>
                <td style={{ padding: "14px 20px", borderBottom: "1px solid " + cardBorder, fontSize: 17, color: inkSoft }}>{ts("planBasicFeature2")}</td>
                <td style={{ padding: "14px 20px", borderBottom: "1px solid " + cardBorder, textAlign: "center", color: sky }}>OK</td>
                <td style={{ padding: "14px 20px", borderBottom: "1px solid " + cardBorder, textAlign: "center", color: sky, background: sky + "0C" }}>OK</td>
                <td style={{ padding: "14px 20px", borderBottom: "1px solid " + cardBorder, textAlign: "center", color: sky }}>OK</td>
              </tr>
              <tr>
                <td style={{ padding: "14px 20px", borderBottom: "1px solid " + cardBorder, fontSize: 17, color: inkSoft }}>{ts("planProFeature2")}</td>
                <td style={{ padding: "14px 20px", borderBottom: "1px solid " + cardBorder, textAlign: "center", color: cardBorder }}>-</td>
                <td style={{ padding: "14px 20px", borderBottom: "1px solid " + cardBorder, textAlign: "center", color: sky, background: sky + "0C" }}>OK</td>
                <td style={{ padding: "14px 20px", borderBottom: "1px solid " + cardBorder, textAlign: "center", color: sky }}>OK</td>
              </tr>
              <tr>
                <td style={{ padding: "14px 20px", borderBottom: "1px solid " + cardBorder, fontSize: 17, color: inkSoft }}>{ts("planProFeature3")}</td>
                <td style={{ padding: "14px 20px", borderBottom: "1px solid " + cardBorder, textAlign: "center", color: cardBorder }}>-</td>
                <td style={{ padding: "14px 20px", borderBottom: "1px solid " + cardBorder, textAlign: "center", color: sky, background: sky + "0C" }}>OK</td>
                <td style={{ padding: "14px 20px", borderBottom: "1px solid " + cardBorder, textAlign: "center", color: sky }}>OK</td>
              </tr>
              <tr>
                <td style={{ padding: "14px 20px", borderBottom: "1px solid " + cardBorder, fontSize: 17, color: inkSoft }}>{ts("planEnterpriseFeature2")}</td>
                <td style={{ padding: "14px 20px", borderBottom: "1px solid " + cardBorder, textAlign: "center", color: cardBorder }}>-</td>
                <td style={{ padding: "14px 20px", borderBottom: "1px solid " + cardBorder, textAlign: "center", color: cardBorder, background: sky + "0C" }}>-</td>
                <td style={{ padding: "14px 20px", borderBottom: "1px solid " + cardBorder, textAlign: "center", color: sky }}>OK</td>
              </tr>
              <tr>
                <td style={{ padding: "14px 20px", fontSize: 17, color: inkSoft }}>{ts("planEnterpriseFeature3")}</td>
                <td style={{ padding: "14px 20px", textAlign: "center", color: cardBorder }}>-</td>
                <td style={{ padding: "14px 20px", textAlign: "center", color: cardBorder, background: sky + "0C" }}>-</td>
                <td style={{ padding: "14px 20px", textAlign: "center", color: sky }}>OK</td>
              </tr>
              <tr>
                <td style={{ padding: "20px" }}></td>
                <td style={{ padding: 20, textAlign: "center" }}>
                  <Link href="./contacto" style={{ display: "inline-block", padding: "12px 26px", border: "1px solid " + sky, color: sky, borderRadius: 10, textDecoration: "none", fontWeight: 700, fontSize: 15 }}>{ts("planCta")}</Link>
                </td>
                <td style={{ padding: 20, textAlign: "center", background: sky + "0C" }}>
                  <Link href="./contacto" style={{ display: "inline-block", padding: "12px 26px", background: sky, color: bg, borderRadius: 10, textDecoration: "none", fontWeight: 800, fontSize: 15 }}>{ts("planCta")}</Link>
                </td>
                <td style={{ padding: 20, textAlign: "center" }}>
                  <Link href="./contacto" style={{ display: "inline-block", padding: "12px 26px", border: "1px solid " + sky, color: sky, borderRadius: 10, textDecoration: "none", fontWeight: 700, fontSize: 15 }}>{ts("planCta")}</Link>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <footer style={{ padding: "28px 40px", borderTop: "1px solid " + cardBorder, textAlign: "center", fontSize: 14, color: inkSoft }}>
        {tNav("brand")}
      </footer>
    </div>
  );
}