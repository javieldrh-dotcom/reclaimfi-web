"use client";
import { useState } from "react";
import { supabase } from "@/app/lib/supabase";
import { getVerticalTheme } from "@/app/core/design/tokens";
import VerticalPageLayout from "@/app/components/VerticalPageLayout";

export default function BankReconciliationPage() {
  const theme = getVerticalTheme("accounting");
  const [bankText, setBankText] = useState("");
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  async function analyze() {
    setLoading(true);
    setResult(null);

    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user) { setLoading(false); return; }

    const { data: uc } = await supabase.from("user_companies").select("company_id").eq("user_id", userData.user.id).limit(1).single();
    const cid = uc?.company_id;

    const { data: accountsData } = await supabase.from("chart_of_accounts").select("id").eq("company_id", cid).ilike("account_code", "1102%");
    const accountIds = (accountsData ?? []).map((a: any) => a.id);

    const { data: lines } = await supabase.from("journal_lines").select("debit, credit, journal_entries(description, entry_date)").in("account_id", accountIds);

    const bookMovements = (lines ?? []).map((l: any) => ({
      description: l.journal_entries?.description ?? "Sin descripcion",
      amount: (l.debit || 0) - (l.credit || 0),
    }));

    const bankLines = bankText.split("\n").filter((l) => l.trim());

    const res = await fetch("/api/reconcile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bookMovements, bankLines }),
    });

    const data = await res.json();
    setResult(data);
    setLoading(false);
  }

  const statusColor: Record<string, string> = {
    MATCHED: "#4ade80",
    ONLY_IN_BOOK: "#facc15",
    ONLY_IN_BANK: "#f87171",
    AMOUNT_MISMATCH: "#fb923c",
  };

  const statusLabel: Record<string, string> = {
    MATCHED: "Coincide",
    ONLY_IN_BOOK: "Solo en tu libro",
    ONLY_IN_BANK: "Solo en el banco",
    AMOUNT_MISMATCH: "Monto distinto",
  };
  return (
    <VerticalPageLayout vertical="accounting" title="Conciliacion Bancaria" subtitle="Analisis asistido por IA de tus movimientos" fullWidth>
      <div style={{ maxWidth: 700 }}>
        <label style={{ fontSize: 18, color: theme.accent, fontWeight: 700 }}>Pega el texto de tu estado de cuenta bancario</label>
        <textarea
          value={bankText}
          onChange={(e) => setBankText(e.target.value)}
          rows={8}
          style={{ ...theme.inputStyle, marginTop: 10, fontSize: 18 }}
          placeholder="Ej: 15/01/2026 Pago de Local -10000"
        />
        <button onClick={analyze} disabled={loading} style={{ ...theme.buttonStyle, marginTop: 16, fontSize: 18 }}>
          {loading ? "ANALIZANDO..." : "ANALIZAR CON IA"}
        </button>
      </div>

      {result && (
        <div style={{ marginTop: 32 }}>
          {result.error && <p style={{ color: "#f87171", fontSize: 20 }}>{result.error}</p>}
          {result.matches && (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ textAlign: "left", color: theme.accent, fontSize: 16, fontWeight: 700 }}>
                  <th style={{ padding: 10 }}>Descripcion</th>
                  <th style={{ padding: 10 }}>Monto</th>
                  <th style={{ padding: 10 }}>Estado</th>
                </tr>
              </thead>
              <tbody>
                {result.matches.map((m: any, idx: number) => (
                  <tr key={idx} style={{ borderBottom: "1px solid #1F2937" }}>
                    <td style={{ padding: 10, fontSize: 20 }}>{m.description}</td>
                    <td style={{ padding: 10, fontSize: 20, ...theme.numberStyle }}>{m.amount?.toLocaleString()}</td>
                    <td style={{ padding: 10, fontSize: 20, color: statusColor[m.status] ?? "white", fontWeight: 700 }}>{statusLabel[m.status] ?? m.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </VerticalPageLayout>
  );
}
