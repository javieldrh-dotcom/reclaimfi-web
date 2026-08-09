"use client";
import Link from "next/link";
import { useTranslations } from "next-intl";
import LanguageSwitcher from "../_components/LanguageSwitcher";

export default function TecnologiaPage() {
  const t = useTranslations("tecnologia");
  const tNav = useTranslations("nav");

  const bg = "#0A1628";
  const bgCard = "#12213B";
  const ink = "#FFFFFF";
  const inkSoft = "#8FA3C4";
  const sky = "#FACC15";
  const navy = "#3B82F6";
  const cardBorder = "#1E3A5F";

  const featureCard: React.CSSProperties = {
    padding: 30,
    background: bgCard,
    border: "1px solid " + cardBorder,
    borderRadius: 16,
    boxShadow: "0 14px 34px rgba(0,0,0,0.4)",
  };

  const iconBox: React.CSSProperties = {
    width: 48, height: 48, background: sky + "18", borderRadius: 12,
    display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 18,
  };

  return (
    <div style={{ background: "radial-gradient(ellipse 90% 50% at 50% -10%, " + bgCard + " 0%, " + bg + " 60%, #040911 100%)", minHeight: "100vh", color: ink, fontFamily: "'IBM Plex Sans', sans-serif" }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "22px 48px", borderBottom: "1px solid " + cardBorder, flexWrap: "wrap", gap: 16, background: "rgba(10,22,40,0.85)", backdropFilter: "blur(12px)", position: "sticky", top: 0, zIndex: 50 }}>
        <Link href="./" style={{ fontSize: 22, fontWeight: 800, color: sky, fontFamily: "'IBM Plex Serif', serif", textDecoration: "none" }}>
          {tNav("brand")}
        </Link>
        <nav style={{ display: "flex", alignItems: "center", gap: 28, flexWrap: "wrap" }}>
          <Link href="./servicios" style={{ color: ink, textDecoration: "none", fontSize: 19, fontWeight: 600 }}>{tNav("servicios")}</Link>
          <Link href="./tecnologia" style={{ color: sky, textDecoration: "none", fontSize: 19, fontWeight: 700 }}>{tNav("tecnologia")}</Link>
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

      <section style={{ padding: "20px 40px 90px", maxWidth: 1150, margin: "0 auto" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 26 }}>
          <div style={featureCard}>
            <div style={iconBox}><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={sky} strokeWidth="2"><polyline points="20 6 9 17 4 12" /></svg></div>
            <h2 style={{ fontSize: 26, fontWeight: 800 }}>{t("feature1Title")}</h2>
            <p style={{ marginTop: 10, fontSize: 18, color: inkSoft, lineHeight: 1.7 }}>{t("feature1Desc")}</p>
          </div>
          <div style={featureCard}>
            <div style={iconBox}><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={sky} strokeWidth="2"><line x1="12" y1="20" x2="12" y2="10" /><line x1="18" y1="20" x2="18" y2="4" /><line x1="6" y1="20" x2="6" y2="16" /></svg></div>
            <h2 style={{ fontSize: 26, fontWeight: 800 }}>{t("feature2Title")}</h2>
            <p style={{ marginTop: 10, fontSize: 18, color: inkSoft, lineHeight: 1.7 }}>{t("feature2Desc")}</p>
          </div>
          <div style={featureCard}>
            <div style={iconBox}><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={sky} strokeWidth="2"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg></div>
            <h2 style={{ fontSize: 26, fontWeight: 800 }}>{t("feature3Title")}</h2>
            <p style={{ marginTop: 10, fontSize: 18, color: inkSoft, lineHeight: 1.7 }}>{t("feature3Desc")}</p>
          </div>
          <div style={featureCard}>
            <div style={iconBox}><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={sky} strokeWidth="2"><rect x="3" y="11" width="18" height="10" rx="2" /><path d="M7 11V7a5 5 0 0110 0v4" /></svg></div>
            <h2 style={{ fontSize: 26, fontWeight: 800 }}>{t("feature4Title")}</h2>
            <p style={{ marginTop: 10, fontSize: 18, color: inkSoft, lineHeight: 1.7 }}>{t("feature4Desc")}</p>
          </div>
          <div style={featureCard}>
            <div style={iconBox}><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={sky} strokeWidth="2"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" /><rect x="9" y="3" width="6" height="4" rx="1" /></svg></div>
            <h2 style={{ fontSize: 26, fontWeight: 800 }}>{t("feature5Title")}</h2>
            <p style={{ marginTop: 10, fontSize: 18, color: inkSoft, lineHeight: 1.7 }}>{t("feature5Desc")}</p>
          </div>
          <div style={featureCard}>
            <div style={iconBox}><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={sky} strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" /><path d="M12 2a15.3 15.3 0 010 20 15.3 15.3 0 010-20z" /></svg></div>
            <h2 style={{ fontSize: 26, fontWeight: 800 }}>{t("feature6Title")}</h2>
            <p style={{ marginTop: 10, fontSize: 18, color: inkSoft, lineHeight: 1.7 }}>{t("feature6Desc")}</p>
          </div>
        </div>
      </section>

      <footer style={{ padding: "28px 40px", borderTop: "1px solid " + cardBorder, textAlign: "center", fontSize: 14, color: inkSoft }}>
        {tNav("brand")}
      </footer>
    </div>
  );
}