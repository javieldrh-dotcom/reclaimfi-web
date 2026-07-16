"use client";
import VerticalSidebar from "@/app/components/VerticalSidebar";

const navItems = [
  { href: "/apu/projects", label: "PROYECTOS" },
  { href: "/apu/fscl", label: "CALCULADORA FSCL" },
];

export default function ApuLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: "flex" }}>
      <VerticalSidebar vertical="apu" brandName="APU / LICITACIONES" navItems={navItems} />
      <div style={{ marginLeft: 240, flex: 1 }}>
        {children}
      </div>
    </div>
  );
}