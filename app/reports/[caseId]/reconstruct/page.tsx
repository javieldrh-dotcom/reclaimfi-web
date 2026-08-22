"use client";
import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/app/lib/supabase";

export default function ReconstructAccountingPage() {
  const params = useParams();
  const caseId = params.caseId as string;

  const [files, setFiles] = useState<File[]>([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [companyName, setCompanyName] = useState("");
  const [savedCompanyId, setSavedCompanyId] = useState<string | null>(null);

  async function analyzeDocuments() {
    if (files.length === 0) { setMessage("Selecciona al menos un documento."); return; }
    setAnalyzing(true);
    setMessage("");
    setResults([]);
    try {
      const formData = new FormData();
      files.forEach((f) => formData.append("files", f));
      const res = await fetch("/api/reconstruct-accounting", { method: "POST", body: formData });
      const json = await res.json();
      if (!json.success) {
        setMessage(json.error || "No se pudo procesar los documentos.");
      } else {
        setResults(json.results);
        if (!companyName) setCompanyName("Reconstruccion - Caso " + caseId.slice(0, 8));
      }
    } catch (e: any) {
      setMessage("Error: " + e.message);
    }
    setAnalyzing(false);
  }

  function updateTransaction(docIdx: number, txIdx: number, field: string, value: string) {
    setResults((prev) => {
      const next = [...prev];
      const tx = { ...next[docIdx].transactions[txIdx] };
      (tx as any)[field] = field === "amount" ? parseFloat(value) || 0 : value;
      next[docIdx] = { ...next[docIdx], transactions: next[docIdx].transactions.map((t: any, i: number) => (i === txIdx ? tx : t)) };
      return next;
    });
  }

  function removeTransaction(docIdx: number, txIdx: number) {
    setResults((prev) => {
      const next = [...prev];
      next[docIdx] = { ...next[docIdx], transactions: next[docIdx].transactions.filter((_: any, i: number) => i !== txIdx) };
      return next;
    });
  }

  const allTransactions = results.flatMap((r) => r.transactions || []);

  async function confirmReconstruction() {
    if (allTransactions.length === 0) { setMessage("No hay transacciones para guardar."); return; }
    setSaving(true);
    setMessage("");

    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user) { setMessage("No autenticado."); setSaving(false); return; }

    const { data: newCompany, error: compError } = await supabase.from("companies").insert([{
      name: companyName || "Reconstruccion - Caso " + caseId.slice(0, 8),
      is_forensic_reconstruction: true,
      reconstruction_case_id: caseId,
      functional_currency: "USD",
    }]).select("id").single();

    if (compError || !newCompany) {
      setMessage("Error al crear la empresa de reconstruccion: " + compError?.message);
      setSaving(false);
      return;
    }

    await supabase.from("user_companies").insert([{ user_id: userData.user.id, company_id: newCompany.id, role: "ADMIN" }]);

    const uniqueAccounts = new Map<string, { name: string; type: string }>();
    for (const tx of allTransactions) {
      uniqueAccounts.set(tx.debitAccountName + "|" + tx.debitAccountType, { name: tx.debitAccountName, type: tx.debitAccountType });
      uniqueAccounts.set(tx.creditAccountName + "|" + tx.creditAccountType, { name: tx.creditAccountName, type: tx.creditAccountType });
    }

    const accountIdMap = new Map<string, string>();
    let codeCounter = 1;
    for (const [key, acc] of uniqueAccounts) {
      const { data: newAccount, error: accError } = await supabase.from("chart_of_accounts").insert([{
        company_id: newCompany.id,
        account_code: String(codeCounter).padStart(4, "0"),
        account_name: acc.name,
        account_type: acc.type,
      }]).select("id").single();
      if (accError || !newAccount) {
        setMessage("Error al crear cuenta '" + acc.name + "': " + accError?.message);
        setSaving(false);
        return;
      }
      accountIdMap.set(key, newAccount.id);
      codeCounter++;
    }

    let entryNumber = 1;
    for (const tx of allTransactions) {
      const debitId = accountIdMap.get(tx.debitAccountName + "|" + tx.debitAccountType);
      const creditId = accountIdMap.get(tx.creditAccountName + "|" + tx.creditAccountType);
      if (!debitId || !creditId) continue;

      const { data: entry, error: entryError } = await supabase.from("journal_entries").insert([{
        company_id: newCompany.id,
        description: tx.description + " (Fuente: " + tx.sourceDocument + ")",
        entry_date: tx.date,
        currency: "USD",
        exchange_rate: 1,
        entry_number: entryNumber,
      }]).select("id").single();

      if (entryError || !entry) continue;

      await supabase.from("journal_lines").insert([
        { journal_entry_id: entry.id, account_id: debitId, debit: tx.amount, credit: 0 },
        { journal_entry_id: entry.id, account_id: creditId, debit: 0, credit: tx.amount },
      ]);

      entryNumber++;
    }

    setSavedCompanyId(newCompany.id);
    setMessage("Reconstruccion contable completada: " + allTransactions.length + " transacciones registradas.");
    setSaving(false);
  }

  return (
    <div style={{ minHeight: "100vh", background: "#0B0E14", color: "white", padding: 40 }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <Link href={"/reports/" + caseId} style={{ color: "#2DD4BF", fontSize: 14 }}>&larr; Volver al caso</Link>
        <h1 style={{ fontSize: 32, fontWeight: 900, marginTop: 12 }}>Reconstruccion Contable desde Evidencia</h1>
        <p style={{ color: "#8B93A7", marginTop: 8, maxWidth: 700 }}>
          Sube estados de cuenta, facturas, o recibos. La IA identificara cada transaccion real y propondra su registro contable en partida doble. Revisa y corrige antes de confirmar - solo entonces se crean los libros reales.
        </p>

        <div style={{ marginTop: 24, background: "#151A24", borderRadius: 16, padding: 24, border: "1px solid #2A3040" }}>
          <input
            type="file"
            multiple
            accept=".pdf,.docx,.txt,.csv"
            onChange={(e) => setFiles(Array.from(e.target.files ?? []))}
            style={{ color: "white" }}
          />
          {files.length > 0 && <p style={{ marginTop: 8, fontSize: 13, color: "#8B93A7" }}>{files.length} archivo(s) seleccionado(s)</p>}
          <button
            onClick={analyzeDocuments}
            disabled={analyzing || files.length === 0}
            style={{ marginTop: 16, padding: "10px 24px", background: "#2DD4BF", color: "#0B0E14", border: "none", borderRadius: 8, fontWeight: 700, cursor: "pointer", opacity: analyzing || files.length === 0 ? 0.6 : 1 }}
          >
            {analyzing ? "Analizando..." : "Analizar Documentos con IA"}
          </button>
          {message && <p style={{ marginTop: 12, color: message.includes("Error") ? "#f87171" : "#2DD4BF" }}>{message}</p>}
        </div>

        {results.length > 0 && (
          <div style={{ marginTop: 24 }}>
            <label style={{ fontSize: 14, color: "#8B93A7" }}>Nombre de la reconstruccion</label>
            <input
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              style={{ display: "block", width: "100%", marginTop: 6, padding: 12, background: "#151A24", border: "1px solid #2A3040", borderRadius: 8, color: "white" }}
            />

            {results.map((doc, docIdx) => (
              <div key={docIdx} style={{ marginTop: 20, background: "#151A24", borderRadius: 16, padding: 20, border: "1px solid #2A3040" }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: "#2DD4BF" }}>{doc.documentName}</h3>
                {doc.documentSummary && <p style={{ fontSize: 13, color: "#8B93A7", marginTop: 4 }}>{doc.documentSummary}</p>}
                {doc.warnings?.length > 0 && (
                  <p style={{ fontSize: 12, color: "#facc15", marginTop: 8 }}>Advertencias: {doc.warnings.join(" | ")}</p>
                )}
                <div style={{ marginTop: 12, maxHeight: 400, overflowY: "auto" }}>
                  {doc.transactions.map((tx: any, txIdx: number) => (
                    <div key={txIdx} style={{ display: "flex", gap: 6, marginBottom: 6, alignItems: "center", flexWrap: "wrap" }}>
                      <input type="date" value={tx.date} onChange={(e) => updateTransaction(docIdx, txIdx, "date", e.target.value)} style={{ padding: 6, background: "#0B0E14", border: "1px solid #2A3040", borderRadius: 6, color: "white", fontSize: 12, width: 130 }} />
                      <input value={tx.description} onChange={(e) => updateTransaction(docIdx, txIdx, "description", e.target.value)} style={{ padding: 6, background: "#0B0E14", border: "1px solid #2A3040", borderRadius: 6, color: "white", fontSize: 12, flex: 1, minWidth: 150 }} placeholder="Descripcion" />
                      <input value={tx.debitAccountName} onChange={(e) => updateTransaction(docIdx, txIdx, "debitAccountName", e.target.value)} style={{ padding: 6, background: "#0B0E14", border: "1px solid #4ade80", borderRadius: 6, color: "white", fontSize: 12, width: 140 }} placeholder="Debe" />
                      <input value={tx.creditAccountName} onChange={(e) => updateTransaction(docIdx, txIdx, "creditAccountName", e.target.value)} style={{ padding: 6, background: "#0B0E14", border: "1px solid #f87171", borderRadius: 6, color: "white", fontSize: 12, width: 140 }} placeholder="Haber" />
                      <input type="number" value={tx.amount} onChange={(e) => updateTransaction(docIdx, txIdx, "amount", e.target.value)} style={{ padding: 6, background: "#0B0E14", border: "1px solid #2A3040", borderRadius: 6, color: "white", fontSize: 12, width: 100 }} placeholder="Monto" />
                      <span style={{ fontSize: 10, color: tx.confidence === "HIGH" ? "#4ade80" : tx.confidence === "MEDIUM" ? "#facc15" : "#f87171" }}>{tx.confidence}</span>
                      <button onClick={() => removeTransaction(docIdx, txIdx)} style={{ background: "none", border: "none", color: "#f87171", cursor: "pointer" }}>x</button>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {!savedCompanyId ? (
              <button
                onClick={confirmReconstruction}
                disabled={saving || allTransactions.length === 0}
                style={{ marginTop: 20, padding: "14px 28px", background: "#4ade80", color: "#0B0E14", border: "none", borderRadius: 8, fontWeight: 700, cursor: "pointer", fontSize: 16, opacity: saving ? 0.6 : 1 }}
              >
                {saving ? "Guardando..." : "Confirmar y Generar Libros Contables (" + allTransactions.length + " transacciones)"}
              </button>
            ) : (
              <div style={{ marginTop: 20, padding: 20, background: "#0B0E14", borderRadius: 12, border: "1px solid #4ade80" }}>
                <p style={{ color: "#4ade80", fontWeight: 700 }}>Reconstruccion completada. Cambia a la empresa "{companyName}" en el selector de empresas para ver el Diario, Mayor, y Estados Financieros generados.</p>
                <Link href="/accounting/journal" style={{ color: "#2DD4BF", marginTop: 8, display: "inline-block" }}>Ir al Libro Diario &rarr;</Link>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}