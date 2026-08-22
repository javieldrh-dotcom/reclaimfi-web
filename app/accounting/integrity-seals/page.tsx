"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/app/lib/supabase";
import { getVerticalTheme } from "@/app/core/design/tokens";
import VerticalPageLayout from "@/app/components/VerticalPageLayout";

const DOC_TYPES = ["BALANCE_GENERAL", "ESTADO_RESULTADOS", "LIBRO_DIARIO", "LIBRO_MAYOR", "OTRO"];

export default function IntegritySealsPage() {
  const theme = getVerticalTheme("accounting");
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [seals, setSeals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [file, setFile] = useState<File | null>(null);
  const [documentType, setDocumentType] = useState(DOC_TYPES[0]);
  const [sealing, setSealing] = useState(false);
  const [message, setMessage] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<string>("");

  async function loadSeals(cid: string) {
    const { data } = await supabase.from("blockchain_seals").select("*").eq("company_id", cid).order("created_at", { ascending: true });
    setSeals(data ?? []);
    setLoading(false);
  }

  useEffect(() => {
    async function load() {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user) return;
      const { data: uc } = await supabase.from("user_companies").select("company_id").eq("user_id", userData.user.id).order("last_active_at", { ascending: false }).limit(1).single();
      const cid = uc?.company_id ?? null;
      setCompanyId(cid);
      if (cid) await loadSeals(cid);
    }
    load();
  }, []);

  async function sealDocument() {
    if (!file || !companyId) { setMessage("Selecciona un archivo primero."); return; }
    setSealing(true);
    setMessage("");
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("companyId", companyId);
      formData.append("documentType", documentType);
      const res = await fetch("/api/seal-document", { method: "POST", body: formData });
      const json = await res.json();
      if (!json.success) {
        setMessage(json.error || "No se pudo sellar el documento.");
      } else {
        setMessage("Documento sellado correctamente. Hash de cadena: " + json.seal.chain_hash.slice(0, 16) + "...");
        setFile(null);
        if (companyId) await loadSeals(companyId);
      }
    } catch (e: any) {
      setMessage("Error: " + e.message);
    }
    setSealing(false);
  }

  async function verifyChain() {
    setVerifying(true);
    setVerificationResult("");
    const encoder = new TextEncoder();
    let previousHash = "0".repeat(64);
    let allValid = true;
    let brokenAt = -1;

    for (let i = 0; i < seals.length; i++) {
      const seal = seals[i];
      if (seal.previous_hash !== previousHash) {
        allValid = false;
        brokenAt = i;
        break;
      }
      const data = encoder.encode(seal.document_hash + previousHash);
      const hashBuffer = await crypto.subtle.digest("SHA-256", data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const computedChainHash = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");

      if (computedChainHash !== seal.chain_hash) {
        allValid = false;
        brokenAt = i;
        break;
      }
      previousHash = seal.chain_hash;
    }

    if (allValid) {
      setVerificationResult("Cadena verificada: los " + seals.length + " sellos son integros, sin evidencia de alteracion.");
    } else {
      setVerificationResult("ALERTA: la cadena se rompe en el sello #" + (brokenAt + 1) + " (" + seals[brokenAt]?.document_name + "). Esto indica que un registro pudo haber sido alterado despues de sellado.");
    }
    setVerifying(false);
  }

  if (loading) return <div style={theme.pageStyle}>Cargando...</div>;

  return (
    <VerticalPageLayout vertical="accounting" title="Sellos de Integridad" subtitle="Cadena de hashes que detecta alteraciones en tus documentos financieros sellados" fullWidth>
      <div style={{ ...theme.cardStyle, maxWidth: 600, marginBottom: 24 }}>
        <p style={{ fontSize: 13, color: "#8B93A7", marginBottom: 16 }}>
          Cada documento que sellas queda encadenado al sello anterior mediante un hash criptografico. Si alguien altera un registro pasado (incluso en la base de datos), la cadena se rompe y es detectable al verificar. Esta cadena es propia de tu cuenta - no esta anclada a la blockchain publica de Bitcoin.
        </p>
        <input type="file" onChange={(e) => setFile(e.target.files?.[0] ?? null)} style={theme.inputStyle} />
        <select value={documentType} onChange={(e) => setDocumentType(e.target.value)} style={{ ...theme.inputStyle, marginTop: 10 }}>
          {DOC_TYPES.map((t) => <option key={t} value={t}>{t.replace(/_/g, " ")}</option>)}
        </select>
        <button onClick={sealDocument} disabled={sealing || !file} style={{ ...theme.buttonStyle, marginTop: 12, opacity: sealing || !file ? 0.6 : 1 }}>
          {sealing ? "Sellando..." : "Sellar Documento"}
        </button>
        {message && <p style={{ marginTop: 8, fontSize: 13, color: message.includes("Error") ? "#f87171" : theme.accent }}>{message}</p>}
      </div>

      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <h3 style={{ fontSize: 18, color: theme.accent, fontWeight: 700 }}>Historial de Sellos ({seals.length})</h3>
          {seals.length > 0 && (
            <button onClick={verifyChain} disabled={verifying} style={{ ...theme.buttonStyle, padding: "8px 16px", fontSize: 13 }}>
              {verifying ? "Verificando..." : "Verificar Integridad de la Cadena"}
            </button>
          )}
        </div>
        {verificationResult && (
          <p style={{ marginBottom: 16, padding: 12, borderRadius: 8, fontSize: 13, background: verificationResult.startsWith("ALERTA") ? "#f8717120" : "#4ade8020", color: verificationResult.startsWith("ALERTA") ? "#f87171" : "#4ade80" }}>
            {verificationResult}
          </p>
        )}
        {seals.length === 0 ? (
          <p style={{ color: "#8B93A7", fontSize: 14 }}>Aun no has sellado ningun documento.</p>
        ) : (
          seals.map((seal, idx) => (
            <div key={seal.id} style={{ ...theme.cardStyle, marginBottom: 8, padding: 14 }}>
              <p style={{ fontSize: 14, fontWeight: 600 }}>#{idx + 1} - {seal.document_name}</p>
              <p style={{ fontSize: 12, color: "#8B93A7", marginTop: 4 }}>{seal.document_type} · {new Date(seal.created_at).toLocaleString()}</p>
              <p style={{ fontSize: 11, color: "#8B93A7", marginTop: 4, fontFamily: "monospace" }}>Hash: {seal.chain_hash.slice(0, 32)}...</p>
            </div>
          ))
        )}
      </div>
    </VerticalPageLayout>
  );
}