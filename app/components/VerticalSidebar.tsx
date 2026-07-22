"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { getVerticalTheme } from "@/app/core/design/tokens";

interface NavItem {
  href: string;
  label: string;
}
interface NavGroup {
  groupLabel: string;
  items: NavItem[];
}
type NavEntry = NavItem | NavGroup;

interface Props {
  vertical: "accounting" | "apu";
  brandName: string;
  navItems: NavEntry[];
}

function isGroup(entry: NavEntry): entry is NavGroup {
  return (entry as NavGroup).groupLabel !== undefined;
}

export default function VerticalSidebar({ vertical, brandName, navItems }: Props) {
  const pathname = usePathname();
  const theme = getVerticalTheme(vertical);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});

  function toggleGroup(label: string) {
    setOpenGroups((prev) => ({ ...prev, [label]: !prev[label] }));
  }

  const linkStyle = (isActive: boolean, indent: boolean) => ({
    display: "block",
    padding: indent ? "10px 16px 10px 28px" : "14px 16px",
    marginBottom: 6,
    borderRadius: 10,
    fontSize: indent ? 13 : 14,
    fontWeight: 700,
    letterSpacing: "0.03em",
    textDecoration: "none",
    color: isActive ? "#0B0E14" : "#B0B8C8",
    background: isActive ? theme.accent : "transparent",
    boxShadow: isActive ? "0 0 20px " + theme.accent + "80" : "none",
    border: isActive ? "none" : "1px solid #1F2937",
  });

  return (
    <div style={{ width: 280, minHeight: "100vh", background: "#0B0E14", borderRight: "1px solid #1F2937", padding: "32px 20px", position: "fixed", left: 0, top: 0, overflowY: "auto" }}>
      <style>{`
        .sidebar-link { transition: all 0.15s ease; }
        .sidebar-link:hover { background: #1F2937 !important; transform: translateX(4px); }
        .sidebar-link:active { filter: brightness(1.4); transform: translateX(6px) scale(0.98); }
        .sidebar-group-header { cursor: pointer; transition: all 0.15s ease; }
        .sidebar-group-header:hover { background: #1F2937 !important; }
      `}</style>
      <div style={{ marginBottom: 32 }}>
        <div style={{ fontSize: 24, fontWeight: 900, color: theme.accent, letterSpacing: "0.05em", fontFamily: theme.titleStyle.fontFamily }}>{brandName}</div>
        <div style={{ fontSize: 11, color: "#8B93A7", letterSpacing: "0.15em", marginTop: 6 }}>CENTRAL OPERATIVA</div>
      </div>
      {navItems.map((entry) => {
        if (isGroup(entry)) {
          const isOpen = openGroups[entry.groupLabel] ?? false;
          const hasActiveChild = entry.items.some((i) => i.href === pathname);
          return (
            <div key={entry.groupLabel} style={{ marginBottom: 6 }}>
              <div
                className="sidebar-group-header"
                onClick={() => toggleGroup(entry.groupLabel)}
                style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  padding: "14px 16px", borderRadius: 10, fontSize: 14, fontWeight: 700,
                  letterSpacing: "0.03em", color: hasActiveChild ? theme.accent : "#B0B8C8",
                  border: "1px solid #1F2937",
                }}
              >
                <span>{entry.groupLabel}</span>
                <span style={{ fontSize: 12 }}>{isOpen ? "▲" : "▼"}</span>
              </div>
              {isOpen && (
                <div style={{ marginTop: 6 }}>
                  {entry.items.map((item) => (
                    <Link key={item.href} href={item.href} className="sidebar-link" style={linkStyle(pathname === item.href, true)}>
                      {item.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          );
        }
        const isActive = pathname === entry.href;
        return (
          <Link key={entry.href} href={entry.href} className="sidebar-link" style={linkStyle(isActive, false)}>
            {entry.label}
          </Link>
        );
      })}
    </div>
  );
}