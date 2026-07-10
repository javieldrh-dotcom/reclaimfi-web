"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/app/lib/supabase";

export default function EquityStatementPage() {
  const [equity, setEquity] = useState<any[]>([]);
  const [netResult, setNetResult] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user) return;
      const { data: uc } = await supabase.from("user_companies").select("company_id").eq("user_id", userData.user.id).limit(1).single();
      const cid = uc?.company_id;
      if (!cid) { setLoading(false); return; }

      const { data: accountsData } = await supabase
        .from("chart_of_accounts")
        .select("id, account_code, account_name, account_type")
        .eq("company_id", cid)
        .in("account_type", ["EQUITY", "REVENUE", "EXPENSE"]);

      const accountsMap: Record<string, any> = {};
      (accountsData ?? []).forEach((a: any) => { accountsMap[a.id] = a; });
      const accountIds = (accountsData ?? []).map((a: any) => a.id);

      const { data: lines } = await supabase
        .from("journal_lines")
        .select("debit, credit, account_id")
        .in("account_id", accountIds);

      const grouped: Record<string, any> = {};
      let revenue = 0;
      let expense = 0;

      (lines ?? []).forEach((l: any) => {
        const acc = accountsMap[l.account_id];
        if (!acc) return;
        if (acc.account_type === "EQUITY") {
          const key = acc.account_code;
          if (!grouped[key]) grouped[key] = { code: acc.account_code, name: acc.account_name, amount: 0 };
          grouped[key].amount += (l.credit || 0) - (l.debit || 0);
        }
        if (acc.account_type === "REVENUE") revenue += (l.credit || 0) - (l.debit || 0);
        if (acc.account_type === "EXPENSE") expense += (l.debit || 0) - (l.credit || 0);
      });

      setEquity(Object.values(grouped).sort((a: any, b: any) => a.code.localeCompare(b.code)));
      setNetResult(revenue - expense);
      setLoading(false);
    }
    load();
  }, []);

  const totalEquityBefore = equity.reduce((s, r) => s + r.amount, 0);
  const totalEquityAfter = totalEquityBefore + netResult;

  if (loading) return <div style={{ padding: 40, color: "#7dd3fc" }}>Cargando...</div>;

  return (
    <div style={{ padding: 40, color: "white", background: "#000a16", minHeight: "100vh" }}>
      <h1 style={{ fontSize: 32, fontWeight: 900, color: "#7dd3fc" }}>Estado de Variacion de Patrimonio</h1>

      <h2 style={{ marginTop: 30, fontSize: 18, color: "#7dd3fc" }}>Cuentas de Patrimonio</h2>
      {equity.map((r) => (
        <div key={r.code} style={{ display: "flex", justifyContent: "space-between", padding: 6 }}>
          <span>{r.code} - {r.name}</span>
          <span>{r.amount.toLocaleString()}</span>
        </div>
      ))}
      <div style={{ display: "flex", justifyContent: "space-between", padding: 6, fontWeight: 700, borderTop: "1px solid #1a3050" }}>
        <span>Subtotal Patrimonio (antes de resultado)</span>
        <span>{totalEquityBefore.toLocaleString()}</span>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", padding: 6, marginTop: 10, color: netResult >= 0 ? "#4ade80" : "#f87171" }}>
        <span>(+/-) Resultado del Ejercicio</span>
        <span>{netResult.toLocaleString()}</span>
      </div>

      <div style={{ marginTop: 30, padding: 16, background: "#0d1117", borderRadius: 12, display: "flex", justifyContent: "space-between", fontSize: 18, fontWeight: 900, color: "#4ade80" }}>
        <span>Patrimonio Final</span>
        <span>{totalEquityAfter.toLocaleString()}</span>
      </div>
    </div>
  );
}