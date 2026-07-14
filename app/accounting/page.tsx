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
  if (loading) return <div style={{ padding: 40, color: "#7dd3fc" }}>Cargando...</div>;

  const cardStyle = { background: "#0d1117", border: "1px solid #1a3050", borderRadius: 12, padding: 20 };

  return (
    <div style={{ padding: 40, color: "white", background: "#000a16", minHeight: "100vh" }}>
      <h1 style={{ fontSize: 32, fontWeight: 900, color: "#7dd3fc" }}>Contabilidad Financiera</h1>
      <p style={{ marginTop: 6, color: "#9ca3af", fontSize: 13 }}>{companyName}</p>

      <div style={{ marginTop: 30, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
        <div style={cardStyle}>
          <p style={{ fontSize: 12, color: "#8B93A7" }}>TOTAL ACTIVOS</p>
          <p style={{ fontSize: 24, fontWeight: 900, marginTop: 6 }}>{totalAssets.toLocaleString()}</p>
        </div>
        <div style={cardStyle}>
          <p style={{ fontSize: 12, color: "#8B93A7" }}>TOTAL PASIVOS</p>
          <p style={{ fontSize: 24, fontWeight: 900, marginTop: 6 }}>{totalLiabilities.toLocaleString()}</p>
        </div>
        <div style={{ ...cardStyle, borderColor: netResult >= 0 ? "#2DD4BF40" : "#F8717140" }}>
          <p style={{ fontSize: 12, color: "#8B93A7" }}>RESULTADO DEL PERIODO</p>
          <p style={{ fontSize: 24, fontWeight: 900, marginTop: 6, color: netResult >= 0 ? "#4ade80" : "#f87171" }}>{netResult.toLocaleString()}</p>
        </div>
        <div style={cardStyle}>
          <p style={{ fontSize: 12, color: "#8B93A7" }}>POR COBRAR PENDIENTE</p>
          <p style={{ fontSize: 24, fontWeight: 900, marginTop: 6, color: "#facc15" }}>{pendingAR.toLocaleString()}</p>
        </div>
        <div style={cardStyle}>
          <p style={{ fontSize: 12, color: "#8B93A7" }}>POR PAGAR PENDIENTE</p>
          <p style={{ fontSize: 24, fontWeight: 900, marginTop: 6, color: "#facc15" }}>{pendingAP.toLocaleString()}</p>
        </div>
        {lastRepomo && (
          <div style={cardStyle}>
            <p style={{ fontSize: 12, color: "#8B93A7" }}>REPOMO MAS RECIENTE</p>
            <p style={{ fontSize: 24, fontWeight: 900, marginTop: 6, color: lastRepomo.result_type === "GANANCIA" ? "#4ade80" : "#f87171" }}>{lastRepomo.repomo_result?.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
          </div>
        )}
      </div>

      <h2 style={{ marginTop: 40, fontSize: 18, color: "#7dd3fc" }}>Accesos Rapidos</h2>
      <div style={{ marginTop: 16, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}>
        <Link href="/accounting/journal" style={{ ...cardStyle, color: "white", textDecoration: "none" }}>Libro Diario</Link>
        <Link href="/accounting/trial-balance" style={{ ...cardStyle, color: "white", textDecoration: "none" }}>Balance de Comprobacion</Link>
        <Link href="/accounting/balance-sheet" style={{ ...cardStyle, color: "white", textDecoration: "none" }}>Estado de Situacion Financiera</Link>
        <Link href="/accounting/income-statement" style={{ ...cardStyle, color: "white", textDecoration: "none" }}>Estado de Resultados</Link>
        <Link href="/accounting/cash-flow" style={{ ...cardStyle, color: "white", textDecoration: "none" }}>Flujo de Efectivo</Link>
        <Link href="/accounting/equity-statement" style={{ ...cardStyle, color: "white", textDecoration: "none" }}>Variacion de Patrimonio</Link>
        <Link href="/accounting/ar-invoices" style={{ ...cardStyle, color: "white", textDecoration: "none" }}>Cuentas por Cobrar</Link>
        <Link href="/accounting/ap-bills" style={{ ...cardStyle, color: "white", textDecoration: "none" }}>Cuentas por Pagar</Link>
        <Link href="/accounting/fixed-assets" style={{ ...cardStyle, color: "white", textDecoration: "none" }}>Activos Fijos</Link>
        <Link href="/accounting/bank-reconciliation" style={{ ...cardStyle, color: "white", textDecoration: "none" }}>Conciliacion Bancaria</Link>
        <Link href="/accounting/period-close" style={{ ...cardStyle, color: "white", textDecoration: "none" }}>Cierre de Ejercicio</Link>
        <Link href="/accounting/financial-notes" style={{ ...cardStyle, color: "white", textDecoration: "none" }}>Notas a Estados Financieros</Link>
        <Link href="/accounting/price-indices" style={{ ...cardStyle, color: "white", textDecoration: "none" }}>Indices de Precios</Link>
      </div>
    </div>
  );
}
