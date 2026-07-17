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
    <div style={{ width: 280, minHeight: "100vh", background: "#0B0E14", borderRight: "1px solid #1F2937", padding: "32px 20px", position: "fixed", left: 0, top: 0, overflowY: "auto" }}>
      <style>{`
        .sidebar-link { transition: all 0.15s ease; }
        .sidebar-link:hover { background: #1F2937 !important; transform: translateX(4px); }
        .sidebar-link:active { filter: brightness(1.4); transform: translateX(6px) scale(0.98); }
      `}</style>
      <div style={{ marginBottom: 32 }}>
        <div style={{ fontSize: 24, fontWeight: 900, color: theme.accent, letterSpacing: "0.05em", fontFamily: theme.titleStyle.fontFamily }}>{brandName}</div>
        <div style={{ fontSize: 11, color: "#8B93A7", letterSpacing: "0.15em", marginTop: 6 }}>CENTRAL OPERATIVA</div>
      </div>
      {navItems.map((item) => {
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className="sidebar-link"
            style={{
              display: "block",
              padding: "14px 16px",
              marginBottom: 8,
              borderRadius: 10,
              fontSize: 14,
              fontWeight: 700,
              letterSpacing: "0.03em",
              textDecoration: "none",
              color: isActive ? "#0B0E14" : "#B0B8C8",
              background: isActive ? theme.accent : "transparent",
              boxShadow: isActive ? "0 0 20px " + theme.accent + "80" : "none",
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