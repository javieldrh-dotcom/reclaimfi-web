"use client";
import { useState } from "react";
import { supabase } from "@/app/lib/supabase";

export default function BankReconciliationPage() {
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

  const inputStyle = { background: "#0d1117", border: "1px solid #1a3050", borderRadius: 8, padding: 8, color: "white", width: "100%" };

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
    <div style={{ padding: 40, color: "white", background: "#000a16", minHeight: "100vh" }}>
      <h1 style={{ fontSize: 32, fontWeight: 900, color: "#7dd3fc" }}>Conciliacion Bancaria con IA</h1>
      <p style={{ marginTop: 10, color: "#9ca3af", fontSize: 13 }}>
        Pega los movimientos del estado de cuenta del banco (uno por linea). La IA los comparara con tu libro contable.
      </p>

      <textarea
        value={bankText}
        onChange={(e) => setBankText(e.target.value)}
        rows={10}
        style={{ ...inputStyle, marginTop: 16, fontFamily: "monospace" }}
        placeholder="15/01/2026 Transferencia recibida 5000&#10;16/01/2026 Pago de servicios -200"
      />

      <button onClick={analyze} disabled={loading} style={{ marginTop: 16, padding: 14, background: "#22d3ee", color: "black", fontWeight: 900, borderRadius: 12, border: "none" }}>
        {loading ? "ANALIZANDO CON IA..." : "COMPARAR CON LIBRO"}
      </button>

      {result && (
        <div style={{ marginTop: 30 }}>
          {result.summary && (
            <div style={{ padding: 16, background: "#0d1117", borderRadius: 12, marginBottom: 20 }}>
              <p style={{ color: "#7dd3fc", fontWeight: 700, marginBottom: 8 }}>Resumen del Agente</p>
              <p>{result.summary}</p>
            </div>
          )}

          {result.matches && result.matches.map((m: any, idx: number) => (
            <div key={idx} style={{ padding: 12, borderBottom: "1px solid #1a3050" }}>
              <span style={{
                display: "inline-block",
                padding: "2px 10px",
                borderRadius: 999,
                fontSize: 11,
                fontWeight: 700,
                background: statusColor[m.status] + "22",
                color: statusColor[m.status],
                marginBottom: 6,
              }}>
                {statusLabel[m.status] ?? m.status}
              </span>
              <p style={{ fontSize: 13 }}>
                <strong>Libro:</strong> {m.bookDescription ?? "-"} | <strong>Banco:</strong> {m.bankLine ?? "-"}
              </p>
              <p style={{ fontSize: 12, color: "#9ca3af", marginTop: 4 }}>{m.explanation}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
