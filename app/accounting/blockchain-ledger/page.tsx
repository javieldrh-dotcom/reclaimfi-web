"use client";
import { useState } from "react";
import { supabase } from "@/app/lib/supabase";
import { getVerticalTheme } from "@/app/core/design/tokens";
import VerticalPageLayout from "@/app/components/VerticalPageLayout";

export default function BlockchainLedgerPage() {
  const theme = getVerticalTheme("accounting");
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [checked, setChecked] = useState(false);

  async function verifyChain() {
    setLoading(true);
    setChecked(false);
    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user) { setLoading(false); return; }
    const { data: uc } = await supabase.from("user_companies").select("company_id").eq("user_id", userData.user.id).order("last_active_at", { ascending: false }).limit(1).single();
    const cid = uc?.company_id;
    if (!cid) { setLoading(false); return; }

    const { data, error } = await supabase.rpc("verify_journal_chain", { check_company_id: cid });
    if (error) {
      alert("Error al verificar: " + error.message);
      setLoading(false);
      return;
    }
    setResults(data ?? []);
    setChecked(true);
    setLoading(false);
  }

  const allValid = results.length > 0 && results.every((r) => r.hash_matches && r.chain_matches);
  const brokenEntries = results.filter((r) => !r.hash_matches || !r.chain_matches);

  return (
    <VerticalPageLayout vertical="accounting" title="Libro Verificable por Blockchain" subtitle="Cada asiento esta encadenado criptograficamente al anterior - verifica si algo fue alterado" fullWidth>
      <div style={{ maxWidth: 900 }}>
        <button onClick={verifyChain} style={{ ...theme.buttonStyle, fontSize: 18 }}>
          {loading ? "VERIFICANDO..." : "VERIFICAR INTEGRIDAD DE LA CADENA"}
        </button>

        {checked && results.length === 0 && (
          <p style={{ marginTop: 16, color: "#8B93A7", fontSize: 16 }}>No hay asientos numerados para verificar todavia.</p>
        )}

        {checked && results.length > 0 && (
          <div style={{ marginTop: 24, padding: 20, borderRadius: 12, background: allValid ? "#4ade8020" : "#f8717120", border: "1px solid " + (allValid ? "#4ade80" : "#f87171") }}>
            <p style={{ fontSize: 24, fontWeight: 900, color: allValid ? "#4ade80" : "#f87171" }}>
              {allValid ? "✓ CADENA INTEGRA - " + results.length + " asientos verificados" : "✗ SE DETECTARON " + brokenEntries.length + " INCONSISTENCIAS"}
            </p>
            {!allValid && (
              <p style={{ fontSize: 14, color: "#8B93A7", marginTop: 8 }}>
                Los siguientes asientos no coinciden con su hash esperado, lo cual indica que fueron modificados despues de creados, o que hubo una manipulacion directa en la base de datos.
              </p>
            )}
          </div>
        )}

        {checked && brokenEntries.length > 0 && (
          <div style={{ marginTop: 20 }}>
            <h3 style={{ fontSize: 18, color: "#f87171", fontWeight: 700, marginBottom: 12 }}>Asientos con Inconsistencias</h3>
            {brokenEntries.map((r, idx) => (
              <div key={idx} style={{ ...theme.cardStyle, marginTop: 10, border: "1px solid #f87171" }}>
                <p style={{ fontSize: 16, fontWeight: 700 }}>Nº{r.entry_number} - {r.entry_date} - {r.description}</p>
                {!r.hash_matches && <p style={{ fontSize: 13, color: "#f87171", marginTop: 4 }}>El contenido del asiento no coincide con su hash original.</p>}
                {!r.chain_matches && <p style={{ fontSize: 13, color: "#f87171", marginTop: 4 }}>La cadena esta rota: el hash del asiento anterior no coincide.</p>}
              </div>
            ))}
          </div>
        )}

        {checked && results.length > 0 && (
          <div style={{ marginTop: 24 }}>
            <h3 style={{ fontSize: 16, color: theme.accent, fontWeight: 700, marginBottom: 10 }}>Detalle de la Cadena Completa</h3>
            <div style={{ overflowX: "auto" }}>
              <table style={{ borderCollapse: "collapse", width: "100%", fontSize: 12 }}>
                <thead>
                  <tr style={{ color: theme.accent }}>
                    <th style={{ border: "1px solid #1F2937", padding: 6, textAlign: "left" }}>Nº</th>
                    <th style={{ border: "1px solid #1F2937", padding: 6, textAlign: "left" }}>Fecha</th>
                    <th style={{ border: "1px solid #1F2937", padding: 6, textAlign: "left" }}>Descripcion</th>
                    <th style={{ border: "1px solid #1F2937", padding: 6, textAlign: "left" }}>Hash (primeros 12 caracteres)</th>
                    <th style={{ border: "1px solid #1F2937", padding: 6, textAlign: "center" }}>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((r, idx) => (
                    <tr key={idx}>
                      <td style={{ border: "1px solid #1F2937", padding: 6 }}>{r.entry_number}</td>
                      <td style={{ border: "1px solid #1F2937", padding: 6 }}>{r.entry_date}</td>
                      <td style={{ border: "1px solid #1F2937", padding: 6 }}>{r.description}</td>
                      <td style={{ border: "1px solid #1F2937", padding: 6, fontFamily: "monospace" }}>{r.stored_hash?.slice(0, 12)}...</td>
                      <td style={{ border: "1px solid #1F2937", padding: 6, textAlign: "center", color: (r.hash_matches && r.chain_matches) ? "#4ade80" : "#f87171" }}>
                        {(r.hash_matches && r.chain_matches) ? "✓" : "✗"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </VerticalPageLayout>
  );
}