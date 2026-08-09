"use client";
import { useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import LanguageSwitcher from "../_components/LanguageSwitcher";

export default function ContactoPage() {
  const t = useTranslations("contacto");
  const tNav = useTranslations("nav");

  const bg = "#0A1628";
  const bgCard = "#12213B";
  const ink = "#FFFFFF";
  const inkSoft = "#8FA3C4";
  const sky = "#FACC15";
  const cardBorder = "#1E3A5F";

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, message }),
      });
      const data = await res.json();
      if (data.success) {
        setStatus("success");
        setName("");
        setEmail("");
        setMessage("");
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  }

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "14px 16px",
    background: bg,
    border: "1px solid " + cardBorder,
    borderRadius: 10,
    color: ink,
    fontSize: 16,
    fontFamily: "'IBM Plex Sans', sans-serif",
    boxSizing: "border-box",
    marginBottom: 18,
  };

  return (
    <div style={{ background: "radial-gradient(ellipse 90% 50% at 50% -10%, " + bgCard + " 0%, " + bg + " 60%, #040911 100%)", minHeight: "100vh", color: ink, fontFamily: "'IBM Plex Sans', sans-serif" }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "22px 48px", borderBottom: "1px solid " + cardBorder, flexWrap: "wrap", gap: 16, background: "rgba(10,22,40,0.85)", backdropFilter: "blur(12px)", position: "sticky", top: 0, zIndex: 50 }}>
        <Link href="./" style={{ fontSize: 22, fontWeight: 800, color: sky, fontFamily: "'IBM Plex Serif', serif", textDecoration: "none" }}>
          {tNav("brand")}
        </Link>
        <nav style={{ display: "flex", alignItems: "center", gap: 28, flexWrap: "wrap" }}>
          <Link href="./producto" style={{ color: ink, textDecoration: "none", fontSize: 17, fontWeight: 600 }}>{tNav("producto")}</Link>
          <Link href="./soluciones" style={{ color: ink, textDecoration: "none", fontSize: 17, fontWeight: 600 }}>{tNav("soluciones")}</Link>
          <Link href="./precios" style={{ color: ink, textDecoration: "none", fontSize: 17, fontWeight: 600 }}>{tNav("precios")}</Link>
          <Link href="./servicios" style={{ color: ink, textDecoration: "none", fontSize: 19, fontWeight: 600 }}>{tNav("servicios")}</Link>
          <Link href="./tecnologia" style={{ color: ink, textDecoration: "none", fontSize: 19, fontWeight: 600 }}>{tNav("tecnologia")}</Link>
          <Link href="./seguridad" style={{ color: ink, textDecoration: "none", fontSize: 17, fontWeight: 600 }}>{tNav("seguridad")}</Link>
          <Link href="./contacto" style={{ color: sky, textDecoration: "none", fontSize: 19, fontWeight: 700 }}>{tNav("contacto")}</Link>
          <LanguageSwitcher />
          <Link href="/login" style={{ padding: "12px 26px", background: sky, borderRadius: 10, color: bg, textDecoration: "none", fontSize: 16, fontWeight: 800 }}>
            {tNav("acceso")}
          </Link>
        </nav>
      </header>

      <section style={{ padding: "70px 40px 90px", maxWidth: 640, margin: "0 auto" }}>
        <div style={{ textAlign: "center" }}>
          <h1 style={{ fontSize: 56, fontWeight: 800, fontFamily: "'IBM Plex Serif', serif", lineHeight: 1.1 }}>{t("headline")}</h1>
          <p style={{ marginTop: 18, fontSize: 22, color: inkSoft, lineHeight: 1.6 }}>{t("subheadline")}</p>
        </div>

        <form onSubmit={handleSubmit} style={{ marginTop: 44, background: bgCard, border: "1px solid " + cardBorder, borderRadius: 18, padding: 36, boxShadow: "0 14px 34px rgba(0,0,0,0.4)" }}>
          <input
            type="text"
            placeholder={t("namePlaceholder")}
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            style={inputStyle}
          />
          <input
            type="email"
            placeholder={t("emailPlaceholder")}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={inputStyle}
          />
          <textarea
            placeholder={t("messagePlaceholder")}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            required
            rows={6}
            style={{ ...inputStyle, resize: "vertical", fontFamily: "'IBM Plex Sans', sans-serif" }}
          />
          <button
            type="submit"
            disabled={status === "sending"}
            style={{
              width: "100%",
              padding: "16px 0",
              background: sky,
              color: bg,
              border: "none",
              borderRadius: 10,
              fontSize: 17,
              fontWeight: 800,
              cursor: status === "sending" ? "not-allowed" : "pointer",
              opacity: status === "sending" ? 0.7 : 1,
            }}
          >
            {status === "sending" ? t("submitting") : t("submitButton")}
          </button>

          {status === "success" && (
            <p style={{ marginTop: 18, color: "#4ADE80", fontSize: 15, textAlign: "center" }}>{t("successMessage")}</p>
          )}
          {status === "error" && (
            <p style={{ marginTop: 18, color: "#F87171", fontSize: 15, textAlign: "center" }}>{t("errorMessage")}</p>
          )}
        </form>
      </section>

      <footer style={{ padding: "28px 40px", borderTop: "1px solid " + cardBorder, textAlign: "center", fontSize: 14, color: inkSoft }}>
        {tNav("brand")}
      </footer>
    </div>
  );
}
