"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/app/lib/supabase";
import { getVerticalTheme } from "@/app/core/design/tokens";
import VerticalPageLayout from "@/app/components/VerticalPageLayout";
import { generateFinancialStatementPdf } from "@/app/core/reports/generateFinancialStatementPdf";

export default function GeneralLedgerPage() {
  const theme = getVerticalTheme("accounting");
  const [companyName, setCompanyName] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [accounts, setAccounts] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [movements, setMovements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMovements, setLoadingMovements] = useState(false);
  const [continuationFolio, setContinuationFolio] = useState("");

  useEffect(() => {
    async function load() {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user) return;
      const { data: uc } = await supabase.from("user_companies").select("company_id").eq("user_id", userData.user.id).order("last_active_at", { ascending: false }).limit(1).single();
      const cid = uc?.company_id;
      if (!cid) { setLoading(false); return; }

      const { data: companyData } = await supabase.from("companies").select("name, functional_currency").eq("id", cid).single();
      setCompanyName(companyData?.name ?? "");
      setCurrency(companyData?.functional_currency ?? "USD");

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
    const acc = accounts.find((a) => a.id === accountId);
    setContinuationFolio(acc?.mayor_folio_continuation ? String(acc.mayor_folio_continuation) : "");
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
  async function saveContinuationFolio(value: string) {
    setContinuationFolio(value);
    if (!selectedAccountId) return;
    const num = value ? parseInt(value, 10) : null;
    await supabase.from("chart_of_accounts").update({ mayor_folio_continuation: num }).eq("id", selectedAccountId);
    setAccounts((prev) => prev.map((a) => a.id === selectedAccountId ? { ...a, mayor_folio_continuation: num } : a));
  }

  function downloadPdf() {
    const selectedAccount = accounts.find((a) => a.id === selectedAccountId);
    const items = movements.map((m) => ({
      name: m.date + " - " + m.description,
      amount: 0,
      debitAmount: m.debit,
      creditAmount: m.credit,
    }));
    const finalBalance = movements.length > 0 ? movements[movements.length - 1].balance : 0;
    const doc = generateFinancialStatementPdf(
      "LIBRO MAYOR - " + (selectedAccount?.account_code ?? "") + " " + (selectedAccount?.account_name ?? ""),
      companyName,
      [{ title: "Movimientos", items, total: 0, totalLabel: "Totales", totalDebit: movements.reduce((s, m) => s + m.debit, 0), totalCredit: movements.reduce((s, m) => s + m.credit, 0) }],
      "Saldo Final",
      finalBalance,
      currency
    );
    if (continuationFolio) {
      const pw = doc.internal.pageSize.getWidth();
      doc.setFontSize(9);
      doc.setFont("helvetica", "italic");
      doc.text("Pasa al Folio Nº " + continuationFolio, 15, 280);
    }
    doc.save("libro-mayor-" + (selectedAccount?.account_code ?? "cuenta") + ".pdf");
  }

  if (loading) return <div style={{ padding: 40, color: "#7dd3fc" }}>Cargando...</div>;

  const selectedAccount = accounts.find((a) => a.id === selectedAccountId);

  return (
    <VerticalPageLayout
      vertical="accounting"
      title="Libro Mayor"
      subtitle="Vista consolidada de todas las cuentas con movimiento"
      fullWidth
      actions={selectedAccountId && movements.length > 0 ? (
        <button onClick={downloadPdf} style={{ ...theme.buttonStyle, fontSize: 13, padding: "10px 20px" }}>
          Descargar PDF
        </button>
      ) : undefined}
    >
      <div style={{ display: "grid", gridTemplateColumns: "1fr 3fr", gap: 24, maxWidth: "none" }}>
        <div style={{ ...theme.cardStyle, maxHeight: 700, overflowY: "auto" }}>
          <h3 style={{ fontSize: 18, color: theme.accent, marginBottom: 12, fontWeight: 700 }}>Cuentas</h3><input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Buscar cuenta..." style={{ width: "100%", padding: "8px 12px", fontSize: 14, borderRadius: 8, border: "1px solid #1F2937", background: "#0d1117", color: "white", marginBottom: 12, boxSizing: "border-box" }} />
          {accounts.filter((a) => (a.account_code + " " + a.account_name).toLowerCase().includes(searchQuery.toLowerCase())).map((a) => (
            <div
              key={a.id}
              onClick={() => loadMovements(a.id)}
              style={{
                padding: "12px 14px",
                borderRadius: 8,
                cursor: "pointer",
                marginBottom: 6,
                background: selectedAccountId === a.id ? theme.accent + "30" : "transparent",
                border: selectedAccountId === a.id ? "1px solid " + theme.accent : "1px solid transparent",
              }}
            >
              <p style={{ fontSize: 20, fontWeight: 700 }}>{a.account_code}</p>
              <p style={{ fontSize: 18, color: "#B0B8C8" }}>{a.account_name}</p>
            </div>
          ))}
        </div>

        <div style={theme.cardStyle}>
          {!selectedAccountId && <p style={{ color: "#8B93A7", fontSize: 16 }}>Selecciona una cuenta para ver su detalle de movimientos.</p>}
          {selectedAccountId && loadingMovements && <p style={{ color: "#8B93A7", fontSize: 16 }}>Cargando movimientos...</p>}
          {selectedAccountId && !loadingMovements && (
            <>
              <h3 style={{ fontSize: 26, color: theme.accent, marginBottom: 4, fontWeight: 700 }}>{selectedAccount?.account_code} - {selectedAccount?.account_name}</h3>
              <p style={{ fontSize: 14, color: "#8B93A7", marginBottom: 16 }}>Folio Mayor Nº {selectedAccount?.mayor_folio ?? "-"}</p>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
                <label style={{ fontSize: 14, color: theme.accent }}>Si esta cuenta continua en otra pagina, Folio de Continuacion:</label>
                <input type="number" value={continuationFolio} onChange={(e) => saveContinuationFolio(e.target.value)} style={{ ...theme.inputStyle, fontSize: 14, width: 100, padding: "6px 10px" }} placeholder="Ej. 15" />
              </div>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ textAlign: "left", color: theme.accent, fontSize: 17, fontWeight: 700 }}>
                    <th style={{ padding: 10 }}>Fecha</th>
                    <th style={{ padding: 10 }}>Descripcion</th>
                    <th style={{ padding: 10, textAlign: "right" }}>Debe</th>
                    <th style={{ padding: 10, textAlign: "right" }}>Haber</th>
                    <th style={{ padding: 10, textAlign: "right" }}>Saldo</th>
                  </tr>
                </thead>
                <tbody>
                  {movements.map((m, idx) => (
                    <tr key={idx} style={{ borderBottom: "1px solid #1F2937" }}>
                      <td style={{ padding: 10, fontSize: 22 }}>{m.date}</td>
                      <td style={{ padding: 10, fontSize: 22 }}>{m.description}</td>
                      <td style={{ padding: 10, textAlign: "right", fontSize: 22, ...theme.numberStyle }}>{m.debit > 0 ? m.debit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : ""}</td>
                      <td style={{ padding: 10, textAlign: "right", fontSize: 22, ...theme.numberStyle }}>{m.credit > 0 ? m.credit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : ""}</td>
                      <td style={{ padding: 10, textAlign: "right", fontWeight: 700, fontSize: 22, ...theme.numberStyle }}>{m.balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {movements.length === 0 && <p style={{ color: "#8B93A7", marginTop: 12, fontSize: 16 }}>Sin movimientos registrados.</p>}
            </>
          )}
        </div>
      </div>
    </VerticalPageLayout>
  );
}
