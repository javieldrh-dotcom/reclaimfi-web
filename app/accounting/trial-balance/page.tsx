"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/app/lib/supabase";

export default function TrialBalancePage() {
  const [rows, setRows] = useState<any[]>([]);
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
        .select("id, account_code, account_name")
        .eq("company_id", cid)
        .not("account_type", "in", "(ORDER_DEBTOR,ORDER_CREDITOR)");

      const accountsMap: Record<string, any> = {};
      (accountsData ?? []).forEach((a: any) => { accountsMap[a.id] = a; });
      const accountIds = (accountsData ?? []).map((a: any) => a.id);

      const { data: lines } = await supabase
        .from("journal_lines")
        .select("debit, credit, account_id, journal_entries!inner(status)")
        .in("account_id", accountIds)
        .eq("journal_entries.status", "ACTIVE");

      const grouped: Record<string, any> = {};
      (lines ?? []).forEach((l: any) => {
        const acc = accountsMap[l.account_id];
        if (!acc) return;
        const key = acc.account_code;
        if (!grouped[key]) grouped[key] = { id: l.account_id, code: acc.account_code, name: acc.account_name, debit: 0, credit: 0 };
        grouped[key].debit += l.debit || 0;
        grouped[key].credit += l.credit || 0;
      });

      setRows(Object.values(grouped).sort((a: any, b: any) => a.code.localeCompare(b.code)));
      setLoading(false);
    }
    load();
  }, []);

  const totalDebit = rows.reduce((s, r) => s + r.debit, 0);
  const totalCredit = rows.reduce((s, r) => s + r.credit, 0);

  if (loading) return <div style={{ padding: 40, color: "#7dd3fc" }}>Cargando...</div>;
  return (
    <div style={{ padding: 40, color: "white", background: "#000a16", minHeight: "100vh" }}>
      <h1 style={{ fontSize: 32, fontWeight: 900, color: "#7dd3fc" }}>Balance de Comprobacion</h1>
      <p style={{ marginTop: 8, color: "#9ca3af", fontSize: 12 }}>Click en una cuenta para ver su Mayor Auxiliar (detalle de movimientos)</p>
      <table style={{ width: "100%", marginTop: 30, borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ textAlign: "left", color: "#7dd3fc", fontSize: 12 }}>
            <th style={{ padding: 8 }}>Codigo</th>
            <th style={{ padding: 8 }}>Cuenta</th>
            <th style={{ padding: 8 }}>Debe</th>
            <th style={{ padding: 8 }}>Haber</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.code} style={{ borderBottom: "1px solid #1a3050" }}>
              <td style={{ padding: 8 }}>{r.code}</td>
              <td style={{ padding: 8 }}>
                <Link href={"/accounting/ledger/" + r.id} style={{ color: "#7dd3fc", textDecoration: "underline" }}>
                  {r.name}
                </Link>
              </td>
              <td style={{ padding: 8 }}>{r.debit > 0 ? r.debit.toLocaleString() : ""}</td>
              <td style={{ padding: 8 }}>{r.credit > 0 ? r.credit.toLocaleString() : ""}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p style={{ marginTop: 20, fontWeight: 700 }}>
        Total Debe: {totalDebit.toLocaleString()} | Total Haber: {totalCredit.toLocaleString()} |{" "}
        {totalDebit === totalCredit ? "CUADRADO" : "DESCUADRADO"}
      </p>
    </div>
  );
}
