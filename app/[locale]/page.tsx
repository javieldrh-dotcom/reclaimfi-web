"use client";
import Link from "next/link";
import { useTranslations } from "next-intl";
import LanguageSwitcher from "./_components/LanguageSwitcher";

export default function HomePage() {
  const t = useTranslations("home");
  const tNav = useTranslations("nav");

  const ink = "#0F1B2D";
  const inkLight = "#16233A";
  const parchment = "#F6F1E7";
  const verified = "#1F9D6C";
  const inflationRed = "#C4432E";
  const textInk = "#C9D3E0";

  return (
    <div style={{ background: ink, minHeight: "100vh", color: textInk, fontFamily: "'IBM Plex Sans', sans-serif" }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "24px 40px", borderBottom: "1px solid #1F2937", flexWrap: "wrap", gap: 16 }}>
        <div style={{ fontSize: 20, fontWeight: 700, color: verified, fontFamily: "'IBM Plex Serif', serif" }}>
          {tNav("brand")}
        </div>
        <nav style={{ display: "flex", alignItems: "center", gap: 24, flexWrap: "wrap" }}>
          <Link href="./servicios" style={{ color: textInk, textDecoration: "none", fontSize: 15 }}>{tNav("servicios")}</Link>
          <Link href="./tecnologia" style={{ color: textInk, textDecoration: "none", fontSize: 15 }}>{tNav("tecnologia")}</Link>
          <Link href="./contacto" style={{ color: textInk, textDecoration: "none", fontSize: 15 }}>{tNav("contacto")}</Link>
          <LanguageSwitcher />
          <Link href="/login" style={{ padding: "10px 20px", border: "1px solid " + verified, borderRadius: 8, color: verified, textDecoration: "none", fontSize: 14, fontWeight: 700 }}>
            {tNav("acceso")}
          </Link>
        </nav>
      </header>

      <section style={{ padding: "80px 40px 60px", textAlign: "center", maxWidth: 900, margin: "0 auto" }}>
        <div style={{ display: "inline-block", padding: "8px 18px", border: "1px solid " + verified + "60", borderRadius: 999, fontSize: 14, color: verified, marginBottom: 26, fontWeight: 600 }}>
          {t("eyebrow")}
        </div>
        <h1 style={{ fontSize: 48, fontWeight: 700, lineHeight: 1.25, fontFamily: "'IBM Plex Serif', serif", color: "#FFFFFF" }}>
          {t("headline")}
        </h1>
        <p style={{ marginTop: 22, fontSize: 19, color: "#8B93A7", maxWidth: 700, margin: "22px auto 0", lineHeight: 1.7 }}>
          {t("subheadline")}
        </p>
      </section>

      <section style={{ padding: "0 40px 60px", maxWidth: 900, margin: "0 auto" }}>
        <div style={{ background: parchment, borderRadius: 16, padding: "32px 36px", color: ink }}>
          <p style={{ fontSize: 13, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, color: inflationRed }}>
            {t("statLabel")}
          </p>
          <p style={{ marginTop: 12, fontSize: 16, lineHeight: 1.7, fontFamily: "'IBM Plex Mono', monospace" }}>
            {t("statDescription")}
          </p>
        </div>
      </section>

      <section style={{ padding: "20px 40px 100px", maxWidth: 1150, margin: "0 auto" }}>
        <h2 style={{ fontSize: 28, fontWeight: 700, fontFamily: "'IBM Plex Serif', serif", textAlign: "center", color: "#FFFFFF", marginBottom: 40 }}>
          {t("pillarsTitle")}
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 32 }}>
          <div style={{ padding: 32, background: inkLight, border: "1px solid #2A3A52", borderRadius: 16 }}>
            <div style={{ width: 40, height: 4, background: verified, borderRadius: 2, marginBottom: 20 }} />
            <h3 style={{ fontSize: 22, fontWeight: 700, color: verified, fontFamily: "'IBM Plex Serif', serif" }}>{t("pillar1Title")}</h3>
            <p style={{ marginTop: 12, fontSize: 15, color: "#8B93A7", lineHeight: 1.7 }}>{t("pillar1Desc")}</p>
          </div>
          <div style={{ padding: 32, background: inkLight, border: "1px solid #2A3A52", borderRadius: 16 }}>
            <div style={{ width: 40, height: 4, background: "#818CF8", borderRadius: 2, marginBottom: 20 }} />
            <h3 style={{ fontSize: 22, fontWeight: 700, color: "#818CF8", fontFamily: "'IBM Plex Serif', serif" }}>{t("pillar2Title")}</h3>
            <p style={{ marginTop: 12, fontSize: 15, color: "#8B93A7", lineHeight: 1.7 }}>{t("pillar2Desc")}</p>
          </div>
          <div style={{ padding: 32, background: inkLight, border: "1px solid #2A3A52", borderRadius: 16 }}>
            <div style={{ width: 40, height: 4, background: inflationRed, borderRadius: 2, marginBottom: 20 }} />
            <h3 style={{ fontSize: 22, fontWeight: 700, color: inflationRed, fontFamily: "'IBM Plex Serif', serif" }}>{t("pillar3Title")}</h3>
            <p style={{ marginTop: 12, fontSize: 15, color: "#8B93A7", lineHeight: 1.7 }}>{t("pillar3Desc")}</p>
          </div>
        </div>
        <div style={{ textAlign: "center", marginTop: 48 }}>
          <Link href="/login" style={{ padding: "16px 36px", background: verified, color: ink, borderRadius: 10, textDecoration: "none", fontSize: 16, fontWeight: 700 }}>
            {t("cta")}
          </Link>
        </div>
      </section>

      <footer style={{ padding: "28px 40px", borderTop: "1px solid #1F2937", textAlign: "center", fontSize: 13, color: "#8B93A7" }}>
        {tNav("brand")}
      </footer>
    </div>
  );
}