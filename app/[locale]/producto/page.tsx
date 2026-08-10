"use client";
import Link from "next/link";
import { useTranslations, useLocale } from "next-intl";
import LanguageSwitcher from "../_components/LanguageSwitcher";

export default function ProductoPage() {
  const t = useTranslations("producto");
  const locale = useLocale();
  const tNav = useTranslations("nav");

  const bg = "#0A1628";
  const bgCard = "#12213B";
  const ink = "#FFFFFF";
  const inkSoft = "#8FA3C4";
  const sky = "#FACC15";
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
        <Link href={"/" + locale} style={{ fontSize: 22, fontWeight: 800, color: sky, fontFamily: "'IBM Plex Serif', serif", textDecoration: "none" }}>
          {tNav("brand")}
        </Link>
        <nav style={{ display: "flex", alignItems: "center", gap: 22, flexWrap: "wrap" }}>
          <Link href={"/" + locale + "/producto"} style={{ color: sky, textDecoration: "none", fontSize: 17, fontWeight: 700 }}>{tNav("producto")}</Link>
          <Link href={"/" + locale + "/soluciones"} style={{ color: ink, textDecoration: "none", fontSize: 17, fontWeight: 600 }}>{tNav("soluciones")}</Link>
          <Link href={"/" + locale + "/precios"} style={{ color: ink, textDecoration: "none", fontSize: 17, fontWeight: 600 }}>{tNav("precios")}</Link>
          <Link href={"/" + locale + "/tecnologia"} style={{ color: ink, textDecoration: "none", fontSize: 17, fontWeight: 600 }}>{tNav("tecnologia")}</Link>
          <Link href={"/" + locale + "/seguridad"} style={{ color: ink, textDecoration: "none", fontSize: 17, fontWeight: 600 }}>{tNav("seguridad")}</Link>
          <Link href={"/" + locale + "/contacto"} style={{ color: ink, textDecoration: "none", fontSize: 17, fontWeight: 600 }}>{tNav("contacto")}</Link>
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
        <h1 style={{ fontSize: 52, fontWeight: 800, fontFamily: "'IBM Plex Serif', serif", lineHeight: 1.15 }}>{t("headline")}</h1>
        <p style={{ marginTop: 18, fontSize: 22, color: inkSoft, lineHeight: 1.6 }}>{t("subheadline")}</p>
      </section>

      <section style={{ padding: "20px 40px 90px", maxWidth: 1150, margin: "0 auto" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 28 }}>
          <div style={cardStyle}>
            <h2 style={{ fontSize: 24, fontWeight: 800, color: sky }}>{t("section1Title")}</h2>
            <p style={{ marginTop: 14, fontSize: 18, color: inkSoft, lineHeight: 1.7 }}>{t("section1Desc")}</p>
          </div>
          <div style={cardStyle}>
            <h2 style={{ fontSize: 24, fontWeight: 800, color: sky }}>{t("section2Title")}</h2>
            <p style={{ marginTop: 14, fontSize: 18, color: inkSoft, lineHeight: 1.7 }}>{t("section2Desc")}</p>
          </div>
          <div style={cardStyle}>
            <h2 style={{ fontSize: 24, fontWeight: 800, color: sky }}>{t("section3Title")}</h2>
            <p style={{ marginTop: 14, fontSize: 18, color: inkSoft, lineHeight: 1.7 }}>{t("section3Desc")}</p>
          </div>
          <div style={cardStyle}>
            <h2 style={{ fontSize: 24, fontWeight: 800, color: sky }}>{t("section4Title")}</h2>
            <p style={{ marginTop: 14, fontSize: 18, color: inkSoft, lineHeight: 1.7 }}>{t("section4Desc")}</p>
          </div>
        </div>
      </section>

      <footer style={{ padding: "28px 40px", borderTop: "1px solid " + cardBorder, textAlign: "center", fontSize: 14, color: inkSoft }}>
        {tNav("brand")}
      </footer>
    </div>
  );
}