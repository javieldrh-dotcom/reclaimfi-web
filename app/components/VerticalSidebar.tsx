"use client";
import { useState, useRef, useEffect } from "react";
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
  const [openGroup, setOpenGroup] = useState<string | null>(null);
  const navRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setOpenGroup(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const topLinkStyle = (isActive: boolean) => ({
    display: "flex",
    alignItems: "center",
    gap: 6,
    padding: "10px 14px",
    borderRadius: 8,
    fontSize: 14,
    fontWeight: 700,
    letterSpacing: "0.02em",
    textDecoration: "none",
    color: isActive ? theme.background : "#B0B8C8",
    background: isActive ? theme.accent : "transparent",
    border: "none",
    cursor: "pointer",
    whiteSpace: "nowrap",
  });

  return (
    <div ref={navRef} style={{ width: "100%", background: theme.background, borderBottom: "1px solid " + theme.border, position: "sticky", top: 0, zIndex: 200 }}>
      <div style={{ display: "flex", alignItems: "center", padding: "0 24px", height: 64, gap: 4, overflowX: "auto" }}>
        <div style={{ fontSize: 18, fontWeight: 900, color: theme.accent, letterSpacing: "0.03em", fontFamily: theme.titleStyle.fontFamily, marginRight: 20, whiteSpace: "nowrap" }}>
          {brandName}
        </div>

        {navItems.map((entry) => {
          if (isGroup(entry)) {
            const isOpen = openGroup === entry.groupLabel;
            const hasActiveChild = entry.items.some((i) => i.href === pathname);
            return (
              <div key={entry.groupLabel} style={{ position: "relative" }}>
                <button
                  onClick={() => setOpenGroup(isOpen ? null : entry.groupLabel)}
                  style={{ ...topLinkStyle(false), color: hasActiveChild ? theme.accent : "#B0B8C8", background: isOpen ? theme.surface : "transparent" }}
                >
                  {entry.groupLabel}
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" style={{ transform: isOpen ? "rotate(180deg)" : "none", transition: "transform 0.15s" }}>
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </button>
                {isOpen && (
                  <div style={{ position: "absolute", top: "100%", left: 0, marginTop: 6, background: theme.surface, border: "1px solid " + theme.border, borderRadius: 10, padding: 8, minWidth: 260, boxShadow: "0 12px 28px rgba(0,0,0,0.4)" }}>
                    {entry.items.map((item) => {
                      const isActive = pathname === item.href;
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setOpenGroup(null)}
                          style={{
                            display: "block",
                            padding: "10px 14px",
                            borderRadius: 8,
                            fontSize: 13,
                            fontWeight: 600,
                            textDecoration: "none",
                            color: isActive ? theme.background : theme.textPrimary,
                            background: isActive ? theme.accent : "transparent",
                            marginBottom: 2,
                          }}
                        >
                          {item.label}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          }
          const isActive = pathname === entry.href;
          return (
            <Link key={entry.href} href={entry.href} style={topLinkStyle(isActive)}>
              {entry.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}