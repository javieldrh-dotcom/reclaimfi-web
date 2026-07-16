"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { getVerticalTheme } from "@/app/core/design/tokens";

interface NavItem {
  href: string;
  label: string;
}

interface Props {
  vertical: "accounting" | "apu";
  brandName: string;
  navItems: NavItem[];
}

export default function VerticalSidebar({ vertical, brandName, navItems }: Props) {
  const pathname = usePathname();
  const theme = getVerticalTheme(vertical);

  return (
    <div style={{ width: 240, minHeight: "100vh", background: "#0B0E14", borderRight: "1px solid #1F2937", padding: "24px 16px", position: "fixed", left: 0, top: 0, overflowY: "auto" }}>
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 20, fontWeight: 900, color: theme.accent, letterSpacing: "0.05em", fontFamily: theme.titleStyle.fontFamily }}>{brandName}</div>
        <div style={{ fontSize: 10, color: "#8B93A7", letterSpacing: "0.15em", marginTop: 4 }}>CENTRAL OPERATIVA</div>
      </div>
      {navItems.map((item) => {
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            style={{
              display: "block",
              padding: "10px 12px",
              marginBottom: 6,
              borderRadius: 8,
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: "0.04em",
              textDecoration: "none",
              color: isActive ? "#0B0E14" : "#8B93A7",
              background: isActive ? theme.accent : "transparent",
              border: isActive ? "none" : "1px solid #1F2937",
            }}
          >
            {item.label}
          </Link>
        );
      })}
    </div>
  );
}