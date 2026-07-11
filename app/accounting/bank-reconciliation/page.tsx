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
      description: l.journal_entries?.description,
      amount: (l.debit || 0) - (l.credit || 0),
    }));

    const bankLines = bankText.split("\n").filter((l) => l.trim());

    setResult({
      bookCount: bookMovements.length,
      bankCount: bankLines.length,
      bookTotal: bookMovements.reduce((s, m) => s + m.amount, 0),
      bookMovements,
      bankLines,
    });
    setLoading(false);
  }

  const inputStyle = { background: "#0d1117", border: "1px solid #1a3050", borderRadius: 8, padding: 8, color: "white", width: "100%" };

  return (
    <div style={{ padding: 40, color: "white", background: "#000a16", minHeight: "100vh" }}>
      <h1 style={{ fontSize: 32, fontWeight: 900, color: "#7dd3fc" }}>Conciliacion Bancaria</h1>
      <p style={{ marginTop: 10, color: "#9ca3af", fontSize: 13 }}>
        Pega los movimientos del estado de cuenta del banco (uno por linea)
      </p>

      <textarea
        value={bankText}
        onChange={(e) => setBankText(e.target.value)}
        rows={10}
        style={{ ...inputStyle, marginTop: 16, fontFamily: "monospace" }}
        placeholder="15/01/2026 Transferencia recibida 5000&#10;16/01/2026 Pago de servicios -200"
      />

      <button onClick={analyze} disabled={loading} style={{ marginTop: 16, padding: 14, background: "#22d3ee", color: "black", fontWeight: 900, borderRadius: 12, border: "none" }}>
        {loading ? "ANALIZANDO..." : "COMPARAR CON LIBRO"}
      </button>

      {result && (
        <div style={{ marginTop: 30 }}>
          <h2 style={{ fontSize: 18, color: "#7dd3fc" }}>Movimientos en tu Libro Contable</h2>
          <p>Total de movimientos: {result.bookCount} | Suma neta: {result.bookTotal.toLocaleString()}</p>
          {result.bookMovements.map((m: any, idx: number) => (
            <div key={idx} style={{ padding: 6, borderBottom: "1px solid #1a3050" }}>
              {m.description}: {m.amount.toLocaleString()}
            </div>
          ))}

          <h2 style={{ fontSize: 18, color: "#facc15", marginTop: 30 }}>Movimientos del Banco (sin procesar por IA todavia)</h2>
          <p>Lineas pegadas: {result.bankCount}</p>
          {result.bankLines.map((l: string, idx: number) => (
            <div key={idx} style={{ padding: 6, borderBottom: "1px solid #1a3050", fontFamily: "monospace", fontSize: 12 }}>{l}</div>
          ))}
        </div>
      )}
    </div>
  );
}