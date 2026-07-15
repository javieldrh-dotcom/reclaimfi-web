"use client";
import { getVerticalTheme } from "@/app/core/design/tokens";

interface Props {
  fullWidth?: boolean;
  vertical: "accounting" | "apu";
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}

export default function VerticalPageLayout({ vertical, title, subtitle, actions, children, fullWidth }: Props) {
  const theme = getVerticalTheme(vertical);

  return (
    <div style={theme.pageStyle}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", maxWidth: 1100 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 4, height: 32, background: theme.accent, borderRadius: 2 }} />
            <h1 style={theme.titleStyle}>{title}</h1>
          </div>
          {subtitle && <p style={{ color: "#8B93A7", fontSize: 15, marginLeft: 16, marginTop: 4 }}>{subtitle}</p>}
        </div>
        {actions && <div>{actions}</div>}
      </div>
      <div style={{ marginTop: 28, maxWidth: fullWidth ? "none" : 1100 }}>
        {children}
      </div>
    </div>
  );
}