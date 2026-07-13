"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/app/lib/supabase";
import { getVerticalTheme } from "@/app/core/design/tokens";

export default function TrialBalancePage() {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const theme = getVerticalTheme("accounting");

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
  const isBalanced = totalDebit === totalCredit;

  if (loading) return <div style={theme.pageStyle}>Cargando...</div>;
  return (
    <div style={theme.pageStyle}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6 }}>
        <div style={{ width: 4, height: 32, background: theme.accent, borderRadius: 2 }} />
        <h1 style={theme.titleStyle}>Balance de Comprobación</h1>
      </div>
      <p style={{ color: "#8B93A7", fontSize: 13, marginLeft: 16 }}>
        Selecciona una cuenta para ver su historial completo de movimientos
      </p>

      <div style={{ ...theme.cardStyle, marginTop: 28, padding: 0, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ textAlign: "left", color: theme.accent, fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", borderBottom: "1px solid #1F2937" }}>
              <th style={{ padding: "14px 16px" }}>Código</th>
              <th style={{ padding: "14px 16px" }}>Cuenta</th>
              <th style={{ padding: "14px 16px", textAlign: "right" }}>Debe</th>
              <th style={{ padding: "14px 16px", textAlign: "right" }}>Haber</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, idx) => (
              <tr key={r.code} style={{ borderBottom: idx < rows.length - 1 ? "1px solid #1F2937" : "none" }}>
                <td style={{ padding: "12px 16px", ...theme.numberStyle, color: "#8B93A7", fontSize: 13 }}>{r.code}</td>
                <td style={{ padding: "12px 16px" }}>
                  <Link href={"/accounting/ledger/" + r.id} style={{ color: theme.accent, textDecoration: "none", fontWeight: 500 }}>
                    {r.name}
                  </Link>
                </td>
                <td style={{ padding: "12px 16px", textAlign: "right", ...theme.numberStyle }}>{r.debit > 0 ? r.debit.toLocaleString() : "—"}</td>
                <td style={{ padding: "12px 16px", textAlign: "right", ...theme.numberStyle }}>{r.credit > 0 ? r.credit.toLocaleString() : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{
        marginTop: 20,
        padding: "16px 20px",
        borderRadius: 12,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        background: isBalanced ? "#2DD4BF15" : "#F8717115",
        border: "1px solid " + (isBalanced ? "#2DD4BF40" : "#F8717140"),
      }}>
        <div style={{ ...theme.numberStyle, fontSize: 14 }}>
          Debe: {totalDebit.toLocaleString()} &nbsp;·&nbsp; Haber: {totalCredit.toLocaleString()}
        </div>
        <div style={{ fontWeight: 700, color: isBalanced ? "#2DD4BF" : "#F87171", display: "flex", alignItems: "center", gap: 6 }}>
          <span>{isBalanced ? "✓" : "!"}</span>
          {isBalanced ? "Cuadrado" : "Descuadrado"}
        </div>
      </div>
    </div>
  );
}
