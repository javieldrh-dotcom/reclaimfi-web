"use client";
import VerticalSidebar from "@/app/components/VerticalSidebar";
import NeuralBackground from "@/app/components/NeuralBackground";

const navItems = [
  { href: "/apu/projects", label: "PROYECTOS" },
  { href: "/apu/fscl", label: "CALCULADORA FSCL" },
];

export default function ApuLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", position: "relative" }}>
      <NeuralBackground color="#FB923C" particleCount={100} />
      <VerticalSidebar vertical="apu" brandName="APU / LICITACIONES" navItems={navItems} />
      <div style={{ marginLeft: 280, flex: 1, position: "relative", zIndex: 1 }}>
        {children}
      </div>
    </div>
  );
}