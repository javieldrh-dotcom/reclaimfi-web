"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/app/lib/supabase";

export default function SecurityPage() {
  const [factors, setFactors] = useState<any[]>([]);
  const [enrolling, setEnrolling] = useState(false);
  const [qrCode, setQrCode] = useState("");
  const [factorId, setFactorId] = useState("");
  const [code, setCode] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function loadFactors() {
    const { data } = await supabase.auth.mfa.listFactors();
    setFactors(data?.totp ?? []);
  }

  useEffect(() => { loadFactors(); }, []);

  async function startEnroll() {
    setMessage("");
    setLoading(true);
    const { data, error } = await supabase.auth.mfa.enroll({ factorType: "totp" });
    if (error) { setMessage("Error: " + error.message); setLoading(false); return; }
    setQrCode(data.totp.qr_code);
    setFactorId(data.id);
    setEnrolling(true);
    setLoading(false);
  }

  async function verifyEnroll() {
    setMessage("");
    if (!code || code.length < 6) { setMessage("Ingresa el codigo de 6 digitos de tu app autenticadora."); return; }
    setLoading(true);
    const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({ factorId });
    if (challengeError) { setMessage("Error: " + challengeError.message); setLoading(false); return; }
    const { error: verifyError } = await supabase.auth.mfa.verify({ factorId, challengeId: challengeData.id, code });
    if (verifyError) { setMessage("Codigo incorrecto. Intenta de nuevo."); setLoading(false); return; }
    setMessage("Autenticacion de dos factores activada correctamente.");
    setEnrolling(false);
    setCode("");
    setQrCode("");
    await loadFactors();
    setLoading(false);
  }

  async function unenroll(id: string) {
    if (!window.confirm("Se desactivara la autenticacion de dos factores. Confirmar?")) return;
    setLoading(true);
    const { error } = await supabase.auth.mfa.unenroll({ factorId: id });
    if (error) { setMessage("Error: " + error.message); setLoading(false); return; }
    setMessage("2FA desactivado.");
    await loadFactors();
    setLoading(false);
  }

  const verifiedFactor = factors.find((f) => f.status === "verified");

  return (
    <div style={{ padding: 40, color: "white", background: "#000a16", minHeight: "100vh" }}>
      <h1 style={{ fontSize: 32, fontWeight: 900, color: "#7dd3fc" }}>Seguridad de la Cuenta</h1>
      <div style={{ marginTop: 30, maxWidth: 500 }}>
        <div style={{ background: "#0d1117", border: "1px solid #1a3050", borderRadius: 12, padding: 24 }}>
          <p style={{ fontSize: 18, fontWeight: 700, color: "#7dd3fc" }}>Autenticacion de Dos Factores (2FA)</p>
          <p style={{ fontSize: 14, color: "#9ca3af", marginTop: 6 }}>Agrega una capa extra de seguridad usando una app autenticadora (Google Authenticator, Authy, etc.)</p>

          {verifiedFactor && !enrolling && (
            <div style={{ marginTop: 16 }}>
              <p style={{ color: "#4ade80", fontSize: 15, fontWeight: 700 }}>✓ 2FA Activado</p>
              <button onClick={() => unenroll(verifiedFactor.id)} disabled={loading} style={{ marginTop: 10, background: "none", border: "1px solid #f87171", color: "#f87171", padding: "8px 16px", borderRadius: 8, cursor: "pointer" }}>
                Desactivar 2FA
              </button>
            </div>
          )}

          {!verifiedFactor && !enrolling && (
            <button onClick={startEnroll} disabled={loading} style={{ marginTop: 16, background: "#22d3ee", color: "black", fontWeight: 900, padding: "12px 20px", borderRadius: 10, border: "none", cursor: "pointer" }}>
              {loading ? "CARGANDO..." : "ACTIVAR 2FA"}
            </button>
          )}

          {enrolling && (
            <div style={{ marginTop: 16 }}>
              <p style={{ fontSize: 14, color: "#9ca3af" }}>Escanea este codigo QR con tu app autenticadora:</p>
              <div style={{ background: "white", padding: 16, borderRadius: 8, marginTop: 10, maxWidth: 220 }} dangerouslySetInnerHTML={{ __html: qrCode }} />
              <input
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Codigo de 6 digitos"
                style={{ marginTop: 12, width: "100%", boxSizing: "border-box", background: "#000a16", border: "1px solid #1a3050", borderRadius: 8, padding: 10, color: "white" }}
              />
              <button onClick={verifyEnroll} disabled={loading} style={{ marginTop: 10, background: "#22d3ee", color: "black", fontWeight: 900, padding: "12px 20px", borderRadius: 10, border: "none", cursor: "pointer" }}>
                {loading ? "VERIFICANDO..." : "VERIFICAR Y ACTIVAR"}
              </button>
            </div>
          )}

          {message && <p style={{ marginTop: 12, color: message.includes("Error") || message.includes("incorrecto") ? "#f87171" : "#4ade80" }}>{message}</p>}
        </div>
      </div>
    </div>
  );
}