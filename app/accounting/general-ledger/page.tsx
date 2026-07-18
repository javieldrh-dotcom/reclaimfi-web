"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/app/lib/supabase";
import { getVerticalTheme } from "@/app/core/design/tokens";
import VerticalPageLayout from "@/app/components/VerticalPageLayout";

export default function GeneralLedgerPage() {
  const theme = getVerticalTheme("accounting");
  const [accounts, setAccounts] = useState<any[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [movements, setMovements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMovements, setLoadingMovements] = useState(false);

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
        .not("account_type", "in", "(ORDER_DEBTOR,ORDER_CREDITOR)")
        .order("account_code");

      setAccounts(accountsData ?? []);
      setLoading(false);
    }
    load();
  }, []);

  async function loadMovements(accountId: string) {
    setSelectedAccountId(accountId);
    setLoadingMovements(true);
    const { data } = await supabase
      .from("journal_lines")
      .select("debit, credit, journal_entries!inner(description, entry_date, status)")
      .eq("account_id", accountId)
      .eq("journal_entries.status", "ACTIVE")
      .order("journal_entries(entry_date)", { ascending: true });

    let runningBalance = 0;
    const rows = (data ?? []).map((l: any) => {
      runningBalance += (l.debit || 0) - (l.credit || 0);
      return {
        date: l.journal_entries?.entry_date,
        description: l.journal_entries?.description,
        debit: l.debit || 0,
        credit: l.credit || 0,
        balance: runningBalance,
      };
    });
    setMovements(rows);
    setLoadingMovements(false);
  }
  if (loading) return <div style={{ padding: 40, color: "#7dd3fc" }}>Cargando...</div>;

  const selectedAccount = accounts.find((a) => a.id === selectedAccountId);

  return (
    <VerticalPageLayout vertical="accounting" title="Libro Mayor" subtitle="Vista consolidada de todas las cuentas con movimiento">
      <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 24 }}>
        <div style={{ ...theme.cardStyle, maxHeight: 600, overflowY: "auto" }}>
          <h3 style={{ fontSize: 15, color: theme.accent, marginBottom: 12 }}>Cuentas</h3>
          {accounts.map((a) => (
            <div
              key={a.id}
              onClick={() => loadMovements(a.id)}
              style={{
                padding: "10px 12px",
                borderRadius: 8,
                cursor: "pointer",
                marginBottom: 4,
                background: selectedAccountId === a.id ? theme.accent + "30" : "transparent",
                border: selectedAccountId === a.id ? "1px solid " + theme.accent : "1px solid transparent",
              }}
            >
              <p style={{ fontSize: 13, fontWeight: 600 }}>{a.account_code}</p>
              <p style={{ fontSize: 13, color: "#8B93A7" }}>{a.account_name}</p>
            </div>
          ))}
        </div>

        <div style={theme.cardStyle}>
          {!selectedAccountId && <p style={{ color: "#8B93A7" }}>Selecciona una cuenta para ver su detalle de movimientos.</p>}
          {selectedAccountId && loadingMovements && <p style={{ color: "#8B93A7" }}>Cargando movimientos...</p>}
          {selectedAccountId && !loadingMovements && (
            <>
              <h3 style={{ fontSize: 18, color: theme.accent, marginBottom: 16 }}>{selectedAccount?.account_code} - {selectedAccount?.account_name}</h3>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ textAlign: "left", color: theme.accent, fontSize: 12 }}>
                    <th style={{ padding: 8 }}>Fecha</th>
                    <th style={{ padding: 8 }}>Descripcion</th>
                    <th style={{ padding: 8, textAlign: "right" }}>Debe</th>
                    <th style={{ padding: 8, textAlign: "right" }}>Haber</th>
                    <th style={{ padding: 8, textAlign: "right" }}>Saldo</th>
                  </tr>
                </thead>
                <tbody>
                  {movements.map((m, idx) => (
                    <tr key={idx} style={{ borderBottom: "1px solid #1F2937" }}>
                      <td style={{ padding: 8, fontSize: 13 }}>{m.date}</td>
                      <td style={{ padding: 8, fontSize: 13 }}>{m.description}</td>
                      <td style={{ padding: 8, textAlign: "right", ...theme.numberStyle }}>{m.debit > 0 ? m.debit.toLocaleString() : ""}</td>
                      <td style={{ padding: 8, textAlign: "right", ...theme.numberStyle }}>{m.credit > 0 ? m.credit.toLocaleString() : ""}</td>
                      <td style={{ padding: 8, textAlign: "right", fontWeight: 700, ...theme.numberStyle }}>{m.balance.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {movements.length === 0 && <p style={{ color: "#8B93A7", marginTop: 12 }}>Sin movimientos registrados.</p>}
            </>
          )}
        </div>
      </div>
    </VerticalPageLayout>
  );
}