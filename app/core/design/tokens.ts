// Sistema de diseño compartido para toda la plataforma AGI
// ReclaimFi mantiene su identidad de red neuronal (no tocar esos componentes)
// Contabilidad y APU usan esta base + su color distintivo por vertical

export const designTokens = {
  base: {
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
    reclaimfi: { accent: "#2DD4BF", label: "ReclaimFi" },
    accounting: { accent: "#818CF8", label: "Contabilidad" },
    apu: { accent: "#FB923C", label: "APU / Licitaciones" },
  },
  fonts: {
    display: "'IBM Plex Serif', Georgia, serif",
    body: "'IBM Plex Sans', -apple-system, sans-serif",
    mono: "'IBM Plex Mono', 'Courier New', monospace",
  },
};

export function getVerticalTheme(vertical: "reclaimfi" | "accounting" | "apu") {
  const v = designTokens.verticals[vertical];
  return {
    pageStyle: {
      padding: 40,
      color: designTokens.base.textPrimary,
      fontSize: 15,
      background: designTokens.base.background,
      minHeight: "100vh",
      fontFamily: designTokens.fonts.body,
      backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 27px, " + designTokens.base.border + "22 28px)",
    },
    titleStyle: {
      fontSize: 32,
      fontWeight: 700,
      color: v.accent,
      fontFamily: designTokens.fonts.display,
    },
    cardStyle: {
      background: designTokens.base.surface,
      border: "1px solid " + designTokens.base.border,
      borderRadius: 12,
      padding: 20,
    },
    inputStyle: {
      background: designTokens.base.background,
      border: "1px solid " + designTokens.base.border,
      borderRadius: 8,
      padding: 10,
      color: designTokens.base.textPrimary,
      width: "100%",
      fontFamily: designTokens.fonts.body,
    },
    numberStyle: {
      fontFamily: designTokens.fonts.mono,
    },
    buttonStyle: {
      padding: 14,
      background: v.accent,
      color: "#0B0E14",
      fontWeight: 700,
      borderRadius: 10,
      border: "none",
      fontFamily: designTokens.fonts.body,
      cursor: "pointer",
    },
    accent: v.accent,
    label: v.label,
  };
}