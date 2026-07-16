"use client";
import VerticalSidebar from "@/app/components/VerticalSidebar";

const navItems = [
  { href: "/accounting", label: "DASHBOARD" },
  { href: "/accounting/journal", label: "LIBRO DIARIO" },
  { href: "/accounting/trial-balance", label: "BALANCE COMPROBACION" },
  { href: "/accounting/balance-sheet", label: "SITUACION FINANCIERA" },
  { href: "/accounting/income-statement", label: "ESTADO RESULTADOS" },
  { href: "/accounting/cash-flow", label: "FLUJO DE EFECTIVO" },
  { href: "/accounting/equity-statement", label: "VARIACION PATRIMONIO" },
  { href: "/accounting/ar-invoices", label: "CUENTAS POR COBRAR" },
  { href: "/accounting/ap-bills", label: "CUENTAS POR PAGAR" },
  { href: "/accounting/fixed-assets", label: "ACTIVOS FIJOS" },
  { href: "/accounting/bank-reconciliation", label: "CONCILIACION" },
  { href: "/accounting/period-close", label: "CIERRE EJERCICIO" },
  { href: "/accounting/financial-notes", label: "NOTAS EEFF" },
  { href: "/accounting/price-indices", label: "INDICES DE PRECIOS" },
];

export default function AccountingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: "flex" }}>
      <VerticalSidebar vertical="accounting" brandName="CONTABILIDAD" navItems={navItems} />
      <div style={{ marginLeft: 240, flex: 1 }}>
        {children}
      </div>
    </div>
  );
}