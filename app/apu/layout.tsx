"use client";
import VerticalSidebar from "@/app/components/VerticalSidebar";
import CompanySwitcher from "@/app/components/CompanySwitcher";
const navItems = [
  { href: "/apu/projects", label: "PROYECTOS" },
  { href: "/apu/financial-qualification", label: "CALIFICACION FINANCIERA" },
  { href: "/apu/cost-summary", label: "RESUMEN DE COSTO" },
  { href: "/apu/fscl", label: "CALCULADORA FSCL" },
  { href: "/apu/price-catalog", label: "CATALOGO DE PRECIOS" },
];
export default function ApuLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ position: "relative" }}>
      <VerticalSidebar vertical="apu" brandName="APU / LICITACIONES" navItems={navItems} />
      <div style={{ position: "relative", zIndex: 1 }}>
        <div style={{ padding: "20px 40px 0" }}>
          <CompanySwitcher />
        </div>
        {children}
      </div>
    </div>
  );
}