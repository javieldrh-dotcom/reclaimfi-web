"use client";
import VerticalSidebar from "@/app/components/VerticalSidebar";

const navItems = [
  { href: "/apu/projects", label: "PROYECTOS" },
  { href: "/apu/financial-qualification", label: "CALIFICACION FINANCIERA" },
  { href: "/apu/cost-summary", label: "RESUMEN DE COSTO" },
  { href: "/apu/fscl", label: "CALCULADORA FSCL" },
];

export default function ApuLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", position: "relative" }}>
      <VerticalSidebar vertical="apu" brandName="APU / LICITACIONES" navItems={navItems} />
      <div style={{ marginLeft: 280, flex: 1, position: "relative", zIndex: 1 }}>
        {children}
      </div>
    </div>
  );
}