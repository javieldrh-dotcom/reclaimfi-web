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

  // Hasta ahora el unico metodo de acceso era magic link por correo
  // (signInWithOtp en app/login/page.tsx): no existia ninguna cuenta con
  // contrasena establecida. Esto permite fijar una, para poder entrar con
  // email+contrasena ademas del magic link (que se deja como respaldo).
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordMessage, setPasswordMessage] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);

  // Supabase exige "AAL2" (haber pasado el segundo factor en la sesion
  // actual) para poder cambiar contrasena/email cuando el usuario tiene
  // 2FA activado. El login (magic link o contrasena) hoy solo llega a
  // AAL1, asi que si hay 2FA activo hace falta este paso extra de
  // verificacion aqui mismo antes de poder guardar la nueva contrasena.
  const [aal, setAal] = useState<{ current: string | null; next: string | null } | null>(null);
  const [stepUpCode, setStepUpCode] = useState("");
  const [stepUpMessage, setStepUpMessage] = useState("");
  const [stepUpLoading, setStepUpLoading] = useState(false);

  async function checkAal() {
    const { data } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    setAal({ current: data?.currentLevel ?? null, next: data?.nextLevel ?? null });
  }

  async function handleSetPassword(e: React.FormEvent) {
    e.preventDefault();
    setPasswordMessage("");

    if (newPassword.length < 8) {
      setPasswordMessage("La contrasena debe tener al menos 8 caracteres.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordMessage("Las contrasenas no coinciden.");
      return;
    }

    setPasswordLoading(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setPasswordLoading(false);

    if (error) {
      setPasswordMessage("Error: " + error.message);
      return;
    }

    setPasswordMessage("Contrasena establecida. Ya puedes entrar con email + contrasena desde /login.");
    setNewPassword("");
    setConfirmPassword("");
  }

  async function handleStepUp(e: React.FormEvent) {
    e.preventDefault();
    setStepUpMessage("");

    if (!verifiedFactor) {
      setStepUpMessage("No se encontro un factor 2FA verificado en tu cuenta.");
      return;
    }
    if (!stepUpCode || stepUpCode.length < 6) {
      setStepUpMessage("Ingresa el codigo de 6 digitos de tu app autenticadora.");
      return;
    }

    setStepUpLoading(true);
    const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({ factorId: verifiedFactor.id });
    if (challengeError) {
      setStepUpMessage("Error: " + challengeError.message);
      setStepUpLoading(false);
      return;
    }
    const { error: verifyError } = await supabase.auth.mfa.verify({ factorId: verifiedFactor.id, challengeId: challengeData.id, code: stepUpCode });
    if (verifyError) {
      setStepUpMessage("Codigo incorrecto. Intenta de nuevo.");
      setStepUpLoading(false);
      return;
    }

    setStepUpCode("");
    setStepUpMessage("");
    await checkAal();
    setStepUpLoading(false);
  }

  async function loadFactors() {
    const { data } = await supabase.auth.mfa.listFactors();
    setFactors(data?.totp ?? []);
  }

  useEffect(() => { loadFactors(); checkAal(); }, []);

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

        <div style={{ background: "#0d1117", border: "1px solid #1a3050", borderRadius: 12, padding: 24, marginTop: 24 }}>
          <p style={{ fontSize: 18, fontWeight: 700, color: "#7dd3fc" }}>Contrasena de Acceso</p>
          <p style={{ fontSize: 14, color: "#9ca3af", marginTop: 6 }}>
            Hoy solo puedes entrar con el enlace magico que llega a tu correo. Establece una contrasena para poder entrar directo con email + contrasena (el enlace magico sigue funcionando como respaldo).
          </p>

          {aal && aal.next === "aal2" && aal.current !== "aal2" ? (
            <div style={{ marginTop: 16 }}>
              <p style={{ fontSize: 14, color: "#facc15" }}>
                Tienes 2FA activado: antes de cambiar la contrasena, confirma tu identidad con el codigo de tu app autenticadora.
              </p>
              <form onSubmit={handleStepUp} style={{ marginTop: 10 }}>
                <input
                  value={stepUpCode}
                  onChange={(e) => setStepUpCode(e.target.value)}
                  placeholder="Codigo de 6 digitos"
                  style={{ width: "100%", boxSizing: "border-box", background: "#000a16", border: "1px solid #1a3050", borderRadius: 8, padding: 10, color: "white" }}
                />
                <button
                  type="submit"
                  disabled={stepUpLoading}
                  style={{ marginTop: 10, background: "#facc15", color: "black", fontWeight: 900, padding: "12px 20px", borderRadius: 10, border: "none", cursor: "pointer" }}
                >
                  {stepUpLoading ? "VERIFICANDO..." : "VERIFICAR CODIGO"}
                </button>
              </form>
              {stepUpMessage && (
                <p style={{ marginTop: 12, color: stepUpMessage.startsWith("Error") || stepUpMessage.includes("incorrecto") || stepUpMessage.includes("No se encontro") ? "#f87171" : "#4ade80" }}>
                  {stepUpMessage}
                </p>
              )}
            </div>
          ) : (
            <form onSubmit={handleSetPassword} style={{ marginTop: 16 }}>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Nueva contrasena (minimo 8 caracteres)"
                style={{ width: "100%", boxSizing: "border-box", background: "#000a16", border: "1px solid #1a3050", borderRadius: 8, padding: 10, color: "white" }}
              />
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirmar contrasena"
                style={{ width: "100%", boxSizing: "border-box", background: "#000a16", border: "1px solid #1a3050", borderRadius: 8, padding: 10, color: "white", marginTop: 10 }}
              />
              <button
                type="submit"
                disabled={passwordLoading}
                style={{ marginTop: 12, background: "#22d3ee", color: "black", fontWeight: 900, padding: "12px 20px", borderRadius: 10, border: "none", cursor: "pointer" }}
              >
                {passwordLoading ? "GUARDANDO..." : "ESTABLECER CONTRASENA"}
              </button>
            </form>
          )}

          {passwordMessage && (
            <p style={{ marginTop: 12, color: passwordMessage.startsWith("Error") || passwordMessage.includes("no coinciden") || passwordMessage.includes("al menos") ? "#f87171" : "#4ade80" }}>
              {passwordMessage}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}