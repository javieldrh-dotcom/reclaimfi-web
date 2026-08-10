// Sistema de diseÃ±o compartido para toda la plataforma AGI
// El modulo de Auditoria Forense (reclaimfi) mantiene su identidad de red neuronal (no tocar esos componentes)
// Contabilidad y APU usan el esquema azul marino / amarillo / verde, consistente con el sitio publico
export const designTokens = {
  base: {
    background: "#0A1628",
    surface: "#12213B",
    border: "#1E3A5F",
    textPrimary: "#FFFFFF",
    textSecondary: "#8FA3C4",
    success: "#34D399",
    danger: "#F87171",
    warning: "#F59E0B",
  },
  baseAuditoria: {
    background: "#0B0E14",
    surface: "#12161F",
    border: "#1F2937",
    textPrimary: "#E8EAED",
    textSecondary: "#8B93A7",
    success: "#2DD4BF",
    danger: "#F87171",
    warning: "#F59E0B",
  },
  verticals: {
    reclaimfi: { accent: "#2DD4BF", subtleAccent: "#2DD4BF", label: "ReclaimFi" },
    accounting: { accent: "#FACC15", subtleAccent: "#34D399", label: "Contabilidad" },
    apu: { accent: "#FB923C", subtleAccent: "#34D399", label: "APU / Licitaciones" },
  },
  fonts: {
    display: "'IBM Plex Serif', Georgia, serif",
    body: "'IBM Plex Sans', -apple-system, sans-serif",
    mono: "'IBM Plex Mono', 'Courier New', monospace",
  },
};
export function getVerticalTheme(vertical: "reclaimfi" | "accounting" | "apu") {
  const v = designTokens.verticals[vertical];
  const b = vertical === "reclaimfi" ? designTokens.baseAuditoria : designTokens.base;
  return {
    pageStyle: {
      padding: 40,
        color: b.textPrimary,
        fontSize: 18,
        minHeight: "100vh",
      fontFamily: designTokens.fonts.body,
      background: b.background,
      backgroundImage: vertical === "reclaimfi" ? "repeating-linear-gradient(0deg, transparent, transparent 27px, " + b.border + "22 28px)" : "none",
    },
    titleStyle: {
      fontSize: 32,
      fontWeight: 700,
      color: v.accent,
      fontFamily: designTokens.fonts.display,
    },
    subtitleStyle: {
      fontSize: 16,
      fontWeight: 600,
      color: v.subtleAccent,
      fontFamily: designTokens.fonts.body,
    },
    cardStyle: {
      background: b.surface,
      border: "1px solid " + b.border,
      borderRadius: 12,
      padding: 20,
    },
    inputStyle: {
      background: b.background,
      border: "1px solid " + b.border,
      borderRadius: 8,
      padding: 10,
      color: b.textPrimary,
      width: "100%",
      fontFamily: designTokens.fonts.body,
    },
    numberStyle: {
      fontFamily: designTokens.fonts.mono,
      fontVariantNumeric: "tabular-nums",
      color: b.textPrimary,
    },
    kpiStyle: {
      fontFamily: designTokens.fonts.mono,
      fontVariantNumeric: "tabular-nums",
      fontSize: 26,
      fontWeight: 700,
      color: b.textPrimary,
    },
    buttonStyle: {
      padding: 14,
      background: v.accent,
      color: b.background,
      fontWeight: 700,
      borderRadius: 10,
      border: "none",
      fontFamily: designTokens.fonts.body,
      cursor: "pointer",
    },
    accent: v.accent,
    subtleAccent: v.subtleAccent,
    label: v.label,
    textPrimary: b.textPrimary,
    textSecondary: b.textSecondary,
    surface: b.surface,
    border: b.border,
    background: b.background,
  };
}