"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/app/lib/supabase";

export default function BalanceSheetPage() {
  const [assets, setAssets] = useState<any[]>([]);
  const [liabilities, setLiabilities] = useState<any[]>([]);
  const [equity, setEquity] = useState<any[]>([]);
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
        .in("account_type", ["ASSET", "LIABILITY", "EQUITY"]);

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
        if (acc.account_type === "ASSET") grouped[key].amount += (l.debit || 0) - (l.credit || 0);
        else grouped[key].amount += (l.credit || 0) - (l.debit || 0);
      });

      const all = Object.values(grouped).sort((a: any, b: any) => a.code.localeCompare(b.code));
      setAssets(all.filter((r: any) => r.type === "ASSET"));
      setLiabilities(all.filter((r: any) => r.type === "LIABILITY"));
      setEquity(all.filter((r: any) => r.type === "EQUITY"));
      setLoading(false);
    }
    load();
  }, []);

  const totalAssets = assets.reduce((s, r) => s + r.amount, 0);
  const totalLiabilities = liabilities.reduce((s, r) => s + r.amount, 0);
  const totalEquity = equity.reduce((s, r) => s + r.amount, 0);

  if (loading) return <div style={{ padding: 40, color: "#7dd3fc" }}>Cargando...</div>;

  return (
    <div style={{ padding: 40, color: "white", background: "#000a16", minHeight: "100vh" }}>
      <h1 style={{ fontSize: 32, fontWeight: 900, color: "#7dd3fc" }}>Estado de Situacion Financiera</h1>

      <h2 style={{ marginTop: 30, fontSize: 18, color: "#7dd3fc" }}>Activos</h2>
      {assets.map((r) => (
        <div key={r.code} style={{ display: "flex", justifyContent: "space-between", padding: 6 }}>
          <span>{r.code} - {r.name}</span>
          <span>{r.amount.toLocaleString()}</span>
        </div>
      ))}
      <div style={{ display: "flex", justifyContent: "space-between", padding: 6, fontWeight: 700, borderTop: "1px solid #1a3050" }}>
        <span>Total Activos</span>
        <span>{totalAssets.toLocaleString()}</span>
      </div>

      <h2 style={{ marginTop: 30, fontSize: 18, color: "#facc15" }}>Pasivos</h2>
      {liabilities.map((r) => (
        <div key={r.code} style={{ display: "flex", justifyContent: "space-between", padding: 6 }}>
          <span>{r.code} - {r.name}</span>
          <span>{r.amount.toLocaleString()}</span>
        </div>
      ))}
      <div style={{ display: "flex", justifyContent: "space-between", padding: 6, fontWeight: 700, borderTop: "1px solid #1a3050" }}>
        <span>Total Pasivos</span>
        <span>{totalLiabilities.toLocaleString()}</span>
      </div>

      <h2 style={{ marginTop: 30, fontSize: 18, color: "#4ade80" }}>Patrimonio</h2>
      {equity.map((r) => (
        <div key={r.code} style={{ display: "flex", justifyContent: "space-between", padding: 6 }}>
          <span>{r.code} - {r.name}</span>
          <span>{r.amount.toLocaleString()}</span>
        </div>
      ))}
      <div style={{ display: "flex", justifyContent: "space-between", padding: 6, fontWeight: 700, borderTop: "1px solid #1a3050" }}>
        <span>Total Patrimonio</span>
        <span>{totalEquity.toLocaleString()}</span>
      </div>

      <div style={{ marginTop: 30, padding: 16, background: "#0d1117", borderRadius: 12, display: "flex", justifyContent: "space-between", fontSize: 18, fontWeight: 900 }}>
        <span>Activos = Pasivos + Patrimonio</span>
        <span style={{ color: totalAssets === totalLiabilities + totalEquity ? "#4ade80" : "#f87171" }}>
          {totalAssets.toLocaleString()} {totalAssets === (totalLiabilities + totalEquity) ? "= " : "≠ "} {(totalLiabilities + totalEquity).toLocaleString()}
        </span>
      </div>
    </div>
  );
}