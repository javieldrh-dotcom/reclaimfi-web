"use client";
import { useState } from "react";

export default function VerifySealPage() {
  const [hash, setHash] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [message, setMessage] = useState("");

  async function verify() {
    if (!hash.trim()) { setMessage("Ingresa un hash a verificar."); return; }
    setLoading(true);
    setMessage("");
    setResult(null);
    try {
      const res = await fetch("/api/verify-seal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chainHash: hash.trim() }),
      });
      const json = await res.json();
      if (json.success) {
        setResult(json);
      } else {
        setMessage(json.error || "No se pudo verificar.");
      }
    } catch (e: any) {
      setMessage("Error: " + e.message);
    }
    setLoading(false);
  }

  return (
    <div style={{ minHeight: "100vh", background: "#0B0E14", color: "white", padding: 40 }}>
      <div style={{ maxWidth: 600, margin: "0 auto" }}>
        <h1 style={{ fontSize: 28, fontWeight: 900 }}>Verificación Pública de Sellos de Integridad</h1>
        <p style={{ color: "#8B93A7", marginTop: 12 }}>
          Herramienta de verificación independiente. Pega un hash de cadena para confirmar si existe en el sistema y si la cadena de integridad es válida, sin revelar a qué empresa o documento pertenece.
        </p>

        <div style={{ marginTop: 24, background: "#151A24", borderRadius: 16, padding: 24, border: "1px solid #2A3040" }}>
          <input
            value={hash}
            onChange={(e) => setHash(e.target.value)}
            placeholder="Hash de cadena (64 caracteres)"
            style={{ width: "100%", padding: 12, background: "#0B0E14", border: "1px solid #2A3040", borderRadius: 8, color: "white", fontFamily: "monospace" }}
          />
          <button
            onClick={verify}
            disabled={loading}
            style={{ marginTop: 12, padding: "10px 24px", background: "#2DD4BF", color: "#0B0E14", border: "none", borderRadius: 8, fontWeight: 700, cursor: "pointer", opacity: loading ? 0.6 : 1 }}
          >
            {loading ? "Verificando..." : "Verificar"}
          </button>
          {message && <p style={{ marginTop: 12, color: "#f87171" }}>{message}</p>}
        </div>

        {result && (
          <div
            style={{
              marginTop: 20,
              padding: 20,
              borderRadius: 12,
              background: !result.existsInSystem ? "#f8717120" : result.chainValid ? "#4ade8020" : "#f8717120",
              border: "1px solid " + (!result.existsInSystem ? "#f87171" : result.chainValid ? "#4ade80" : "#f87171"),
            }}
          >
            {!result.existsInSystem ? (
              <p style={{ fontWeight: 700, color: "#f87171" }}>Este hash no existe en el sistema.</p>
            ) : (
              <>
                <p style={{ fontWeight: 700, fontSize: 18, color: result.chainValid ? "#4ade80" : "#f87171" }}>
                  {result.chainValid ? "✓ Cadena Íntegra — Sin evidencia de alteración" : "⚠ Cadena Rota — Posible alteración detectada"}
                </p>
                <p style={{ marginTop: 8, fontSize: 14, color: "#8B93A7" }}>
                  Sellado el: {new Date(result.sealedAt).toLocaleString()}
                </p>
                <p style={{ marginTop: 4, fontSize: 14, color: "#8B93A7" }}>
                  Posición {result.positionInChain} de {result.totalChainLength} en su cadena
                </p>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}