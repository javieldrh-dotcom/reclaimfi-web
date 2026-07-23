"use client";
import VerticalSidebar from "@/app/components/VerticalSidebar";
import NeuralBackground from "@/app/components/NeuralBackground";
const navItems = [
  { href: "/accounting", label: "DASHBOARD" },
  {
    groupLabel: "CONTABILIDAD",
    items: [
      { href: "/accounting/journal", label: "Libro Diario" },
      { href: "/accounting/general-ledger", label: "Libro Mayor" },
      { href: "/accounting/inventory", label: "Inventario de Mercancia" },
      { href: "/accounting/inventory-book", label: "Libro de Inventario (Legal)" },
    ],
  },
  {
    groupLabel: "ESTADOS FINANCIEROS",
    items: [
      { href: "/accounting/trial-balance", label: "Balance de Comprobacion" },
      { href: "/accounting/balance-sheet", label: "Situacion Financiera" },
      { href: "/accounting/income-statement", label: "Estado de Resultados" },
      { href: "/accounting/cash-flow", label: "Flujo de Efectivo" },
      { href: "/accounting/equity-statement", label: "Variacion de Patrimonio" },
    ],
  },
  {
    groupLabel: "CUENTAS Y OPERACIONES",
    items: [
      { href: "/accounting/ar-invoices", label: "Cuentas por Cobrar" },
      { href: "/accounting/ap-bills", label: "Cuentas por Pagar" },
      { href: "/accounting/fixed-assets", label: "Activos Fijos" },
      { href: "/accounting/payroll", label: "Nomina" },
      { href: "/accounting/bank-reconciliation", label: "Conciliacion Bancaria" },
    ],
  },
  {
    groupLabel: "FISCAL",
    items: [
      { href: "/accounting/sales-book", label: "Libro de Ventas" },
      { href: "/accounting/purchase-book", label: "Libro de Compras" },
      { href: "/accounting/vat-summary", label: "Resumen de IVA" },
      { href: "/accounting/withholding-summary", label: "Resumen Retenciones" },
      { href: "/accounting/special-taxpayer", label: "Contribuyente Especial" },
      { href: "/accounting/islr", label: "ISLR Anual" },
      { href: "/accounting/islr-estimated", label: "ISLR Declaracion Estimada" },
      { href: "/accounting/deferred-tax", label: "Impuesto Diferido" },
    ],
  },
  {
    groupLabel: "CIERRE Y REPORTES",
    items: [
      { href: "/accounting/period-close", label: "Cierre de Ejercicio" },
      { href: "/accounting/financial-notes", label: "Notas a Estados Financieros" },
      { href: "/accounting/price-indices", label: "Indices de Precios" },
    ],
  },
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