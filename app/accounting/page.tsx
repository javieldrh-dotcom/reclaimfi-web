"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/app/lib/supabase";
export default function AccountingDashboard() {
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [companyName, setCompanyName] = useState("");
  const [totalAssets, setTotalAssets] = useState(0);
  const [totalLiabilities, setTotalLiabilities] = useState(0);
  const [netResult, setNetResult] = useState(0);
  const [pendingAR, setPendingAR] = useState(0);
  const [pendingAP, setPendingAP] = useState(0);
  const [lastRepomo, setLastRepomo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    async function load() {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user) return;
      const { data: uc } = await supabase.from("user_companies").select("company_id").eq("user_id", userData.user.id).limit(1).single();
      const cid = uc?.company_id ?? null;
      setCompanyId(cid);
      if (!cid) { setLoading(false); return; }
      const { data: companyData } = await supabase.from("companies").select("name").eq("id", cid).single();
      setCompanyName(companyData?.name ?? "");
      const { data: accountsData } = await supabase.from("chart_of_accounts").select("id, account_type").eq("company_id", cid).in("account_type", ["ASSET", "LIABILITY", "REVENUE", "EXPENSE"]);
      const accountsMap: Record<string, string> = {};
      (accountsData ?? []).forEach((a: any) => { accountsMap[a.id] = a.account_type; });
      const accountIds = (accountsData ?? []).map((a: any) => a.id);
      const { data: lines } = await supabase.from("journal_lines").select("debit, credit, account_id").in("account_id", accountIds);
      let assets = 0, liabilities = 0, revenue = 0, expense = 0;
      (lines ?? []).forEach((l: any) => {
        const type = accountsMap[l.account_id];
        if (type === "ASSET") assets += (l.debit || 0) - (l.credit || 0);
        if (type === "LIABILITY") liabilities += (l.credit || 0) - (l.debit || 0);
        if (type === "REVENUE") revenue += (l.credit || 0) - (l.debit || 0);
        if (type === "EXPENSE") expense += (l.debit || 0) - (l.credit || 0);
      });
      setTotalAssets(assets);
      setTotalLiabilities(liabilities);
      setNetResult(revenue - expense);
      const { data: arData } = await supabase.from("ar_invoices").select("amount").eq("company_id", cid).eq("status", "PENDING");
      setPendingAR((arData ?? []).reduce((s: number, i: any) => s + i.amount, 0));
      const { data: apData } = await supabase.from("ap_bills").select("amount").eq("company_id", cid).eq("status", "PENDING");
      setPendingAP((apData ?? []).reduce((s: number, i: any) => s + i.amount, 0));
      const { data: repomoData } = await supabase.from("repomo_calculations").select("*").eq("company_id", cid).order("created_at", { ascending: false }).limit(1).single();
      setLastRepomo(repomoData);
      setLoading(false);
    }
    load();
  }, []);
  if (loading) return <div style={{ padding: 40, color: "#7dd3fc", fontSize: 20 }}>Cargando...</div>;
  const cardStyle = { background: "#0d1117", border: "1px solid #1a3050", borderRadius: 12, padding: 20 };
  const quickCard = (color: string) => ({
    background: "#12161F", border: "2px solid " + color, borderRadius: 14, padding: "18px 16px",
    color: "white", textDecoration: "none", fontSize: 16, fontWeight: 600, display: "block",
    boxShadow: "0 4px 20px " + color + "30", transition: "transform 0.2s ease",
  });
  return (
    <div style={{ padding: 40, color: "white", minHeight: "100vh" }}>
      <h1 style={{ fontSize: 32, fontWeight: 900, color: "#7dd3fc" }}>Contabilidad Financiera</h1>
      <p style={{ marginTop: 6, color: "#9ca3af", fontSize: 15 }}>{companyName}</p>
      <div style={{ marginTop: 30, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
        <div style={cardStyle}>
          <p style={{ fontSize: 13, color: "#8B93A7" }}>TOTAL ACTIVOS</p>
          <p style={{ fontSize: 24, fontWeight: 900, marginTop: 6 }}>{totalAssets.toLocaleString()}</p>
        </div>
        <div style={cardStyle}>
          <p style={{ fontSize: 13, color: "#8B93A7" }}>TOTAL PASIVOS</p>
          <p style={{ fontSize: 24, fontWeight: 900, marginTop: 6 }}>{totalLiabilities.toLocaleString()}</p>
        </div>
        <div style={{ ...cardStyle, borderColor: netResult >= 0 ? "#2DD4BF40" : "#F8717140" }}>
          <p style={{ fontSize: 13, color: "#8B93A7" }}>RESULTADO DEL PERIODO</p>
          <p style={{ fontSize: 24, fontWeight: 900, marginTop: 6, color: netResult >= 0 ? "#4ade80" : "#f87171" }}>{netResult.toLocaleString()}</p>
        </div>
        <div style={cardStyle}>
          <p style={{ fontSize: 13, color: "#8B93A7" }}>POR COBRAR PENDIENTE</p>
          <p style={{ fontSize: 24, fontWeight: 900, marginTop: 6, color: "#facc15" }}>{pendingAR.toLocaleString()}</p>
        </div>
        <div style={cardStyle}>
          <p style={{ fontSize: 13, color: "#8B93A7" }}>POR PAGAR PENDIENTE</p>
          <p style={{ fontSize: 24, fontWeight: 900, marginTop: 6, color: "#facc15" }}>{pendingAP.toLocaleString()}</p>
        </div>
        {lastRepomo && (
          <div style={cardStyle}>
            <p style={{ fontSize: 13, color: "#8B93A7" }}>REPOMO MAS RECIENTE</p>
            <p style={{ fontSize: 24, fontWeight: 900, marginTop: 6, color: lastRepomo.result_type === "GANANCIA" ? "#4ade80" : "#f87171" }}>{lastRepomo.repomo_result?.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
          </div>
        )}
      </div>
      <h2 style={{ marginTop: 40, fontSize: 22, color: "#818CF8", fontWeight: 700 }}>Libros Contables</h2>
      <div style={{ marginTop: 16, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
        <Link href="/accounting/journal" style={quickCard("#818CF8")}>Libro Diario</Link>
        <Link href="/accounting/general-ledger" style={quickCard("#818CF8")}>Libro Mayor</Link>
        <Link href="/accounting/trial-balance" style={quickCard("#818CF8")}>Balance de Comprobacion</Link>
        <Link href="/accounting/balance-sheet" style={quickCard("#818CF8")}>Situacion Financiera</Link>
        <Link href="/accounting/income-statement" style={quickCard("#818CF8")}>Estado de Resultados</Link>
        <Link href="/accounting/cash-flow" style={quickCard("#818CF8")}>Flujo de Efectivo</Link>
        <Link href="/accounting/equity-statement" style={quickCard("#818CF8")}>Variacion de Patrimonio</Link>
      </div>

      <h2 style={{ marginTop: 40, fontSize: 22, color: "#2DD4BF", fontWeight: 700 }}>Cuentas y Operaciones</h2>
      <div style={{ marginTop: 16, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
        <Link href="/accounting/ar-invoices" style={quickCard("#2DD4BF")}>Cuentas por Cobrar</Link>
        <Link href="/accounting/ap-bills" style={quickCard("#2DD4BF")}>Cuentas por Pagar</Link>
        <Link href="/accounting/fixed-assets" style={quickCard("#2DD4BF")}>Activos Fijos</Link>
        <Link href="/accounting/inventory" style={quickCard("#2DD4BF")}>Inventario de Mercancia</Link>
        <Link href="/accounting/payroll" style={quickCard("#2DD4BF")}>Nomina</Link>
        <Link href="/accounting/bank-reconciliation" style={quickCard("#2DD4BF")}>Conciliacion Bancaria</Link>
      </div>

      <h2 style={{ marginTop: 40, fontSize: 22, color: "#FB923C", fontWeight: 700 }}>Modulo Fiscal</h2>
      <div style={{ marginTop: 16, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
        <Link href="/accounting/sales-book" style={quickCard("#FB923C")}>Libro de Ventas</Link>
        <Link href="/accounting/purchase-book" style={quickCard("#FB923C")}>Libro de Compras</Link>
        <Link href="/accounting/vat-summary" style={quickCard("#FB923C")}>Resumen de IVA</Link>
        <Link href="/accounting/withholding-summary" style={quickCard("#FB923C")}>Resumen Retenciones</Link>
        <Link href="/accounting/special-taxpayer" style={quickCard("#FB923C")}>Contribuyente Especial</Link>
        <Link href="/accounting/islr" style={quickCard("#FB923C")}>ISLR Anual</Link>
        <Link href="/accounting/deferred-tax" style={quickCard("#FB923C")}>Impuesto Diferido</Link>
      </div>

      <h2 style={{ marginTop: 40, fontSize: 22, color: "#facc15", fontWeight: 700 }}>Cierre y Reportes</h2>
      <div style={{ marginTop: 16, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
        <Link href="/accounting/period-close" style={quickCard("#facc15")}>Cierre de Ejercicio</Link>
        <Link href="/accounting/financial-notes" style={quickCard("#facc15")}>Notas a Estados Financieros</Link>
        <Link href="/accounting/price-indices" style={quickCard("#facc15")}>Indices de Precios</Link>
      </div>
    </div>
  );
}
