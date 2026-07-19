"use client";
import VerticalSidebar from "@/app/components/VerticalSidebar";
import NeuralBackground from "@/app/components/NeuralBackground";

const navItems = [
  { href: "/accounting", label: "DASHBOARD" },
  { href: "/accounting/journal", label: "LIBRO DIARIO" },
  { href: "/accounting/general-ledger", label: "LIBRO MAYOR" },
  { href: "/accounting/trial-balance", label: "BALANCE COMPROBACION" },
  { href: "/accounting/balance-sheet", label: "SITUACION FINANCIERA" },
  { href: "/accounting/income-statement", label: "ESTADO RESULTADOS" },
  { href: "/accounting/cash-flow", label: "FLUJO DE EFECTIVO" },
  { href: "/accounting/equity-statement", label: "VARIACION PATRIMONIO" },
  { href: "/accounting/ar-invoices", label: "CUENTAS POR COBRAR" },
  { href: "/accounting/ap-bills", label: "CUENTAS POR PAGAR" },
  { href: "/accounting/fixed-assets", label: "ACTIVOS FIJOS" },
  { href: "/accounting/inventory", label: "INVENTARIO" },
  { href: "/accounting/payroll", label: "NOMINA" },
  { href: "/accounting/sales-book", label: "LIBRO DE VENTAS" },
  { href: "/accounting/purchase-book", label: "LIBRO DE COMPRAS" },
  { href: "/accounting/vat-summary", label: "RESUMEN DE IVA" },
  { href: "/accounting/withholding-summary", label: "RESUMEN RETENCIONES" },
  { href: "/accounting/special-taxpayer", label: "CONTRIBUYENTE ESPECIAL" },
  { href: "/accounting/bank-reconciliation", label: "CONCILIACION" },
  { href: "/accounting/period-close", label: "CIERRE EJERCICIO" },
  { href: "/accounting/financial-notes", label: "NOTAS EEFF" },
  { href: "/accounting/price-indices", label: "INDICES DE PRECIOS" },
];

export default function AccountingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", position: "relative" }}>
      <NeuralBackground color="#818CF8" particleCount={100} />
      <VerticalSidebar vertical="accounting" brandName="CONTABILIDAD" navItems={navItems} />
      <div style={{ marginLeft: 280, flex: 1, position: "relative", zIndex: 1 }}>
        {children}
      </div>
    </div>
  );
}