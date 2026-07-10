"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/app/lib/supabase";

export default function IncomeStatementPage() {
  const [revenue, setRevenue] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
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
        .in("account_type", ["REVENUE", "EXPENSE"]);

      const accountsMap: Record<string, any> = {};
      (accountsData ?? []).forEach((a: any) => { accountsMap[a.id] = a; });
      const accountIds = (accountsData ?? []).map((a: any) => a.id);

      const { data: lines } = await supabase
        .from("journal_lines")
        .select("debit, credit, account_id")
        .in("account_id", accountIds);

      const grouped: Record<string, any> = {};
      (lines ?? []).forEach((l: any) => {
        const acc = accountsMap[l.account_id];
        if (!acc) return;
        const key = acc.account_code;
        if (!grouped[key]) grouped[key] = { code: acc.account_code, name: acc.account_name, type: acc.account_type, amount: 0 };
        if (acc.account_type === "REVENUE") grouped[key].amount += (l.credit || 0) - (l.debit || 0);
        if (acc.account_type === "EXPENSE") grouped[key].amount += (l.debit || 0) - (l.credit || 0);
      });

      const all = Object.values(grouped).sort((a: any, b: any) => a.code.localeCompare(b.code));
      setRevenue(all.filter((r: any) => r.type === "REVENUE"));
      setExpenses(all.filter((r: any) => r.type === "EXPENSE"));
      setLoading(false);
    }
    load();
  }, []);

  const totalRevenue = revenue.reduce((s, r) => s + r.amount, 0);
  const totalExpenses = expenses.reduce((s, r) => s + r.amount, 0);
  const netResult = totalRevenue - totalExpenses;

  if (loading) return <div style={{ padding: 40, color: "#7dd3fc" }}>Cargando...</div>;

  return (
    <div style={{ padding: 40, color: "white", background: "#000a16", minHeight: "100vh" }}>
      <h1 style={{ fontSize: 32, fontWeight: 900, color: "#7dd3fc" }}>Estado de Resultados</h1>

      <h2 style={{ marginTop: 30, fontSize: 18, color: "#4ade80" }}>Ingresos</h2>
      {revenue.map((r) => (
        <div key={r.code} style={{ display: "flex", justifyContent: "space-between", padding: 6 }}>
          <span>{r.code} - {r.name}</span>
          <span>{r.amount.toLocaleString()}</span>
        </div>
      ))}
      <div style={{ display: "flex", justifyContent: "space-between", padding: 6, fontWeight: 700, borderTop: "1px solid #1a3050" }}>
        <span>Total Ingresos</span>
        <span>{totalRevenue.toLocaleString()}</span>
      </div>

      <h2 style={{ marginTop: 30, fontSize: 18, color: "#f87171" }}>Gastos</h2>
      {expenses.map((r) => (
        <div key={r.code} style={{ display: "flex", justifyContent: "space-between", padding: 6 }}>
          <span>{r.code} - {r.name}</span>
          <span>{r.amount.toLocaleString()}</span>
        </div>
      ))}
      <div style={{ display: "flex", justifyContent: "space-between", padding: 6, fontWeight: 700, borderTop: "1px solid #1a3050" }}>
        <span>Total Gastos</span>
        <span>{totalExpenses.toLocaleString()}</span>
      </div>

      <div style={{ marginTop: 30, padding: 16, background: "#0d1117", borderRadius: 12, display: "flex", justifyContent: "space-between", fontSize: 20, fontWeight: 900, color: netResult >= 0 ? "#4ade80" : "#f87171" }}>
        <span>{netResult >= 0 ? "Utilidad Neta" : "Perdida Neta"}</span>
        <span>{Math.abs(netResult).toLocaleString()}</span>
      </div>
    </div>
  );
}