"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/app/lib/supabase/client";

// Dos metodos de acceso: magic link (el unico que existia antes) y
// email+contrasena (nuevo, requiere que el usuario ya haya establecido una
// contrasena desde /security). Se deja el magic link como respaldo para
// quien aun no fijo contrasena.
export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"password" | "magic">("password");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">(
    "idle"
  );
  const [errorMsg, setErrorMsg] = useState("");

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    setErrorMsg("");

    const supabase = createClient();

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setStatus("error");
      setErrorMsg(error.message);
      return;
    }

    setStatus("sent");
  }

  async function handlePasswordLogin(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    setErrorMsg("");

    const supabase = createClient();

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setStatus("error");
      setErrorMsg(error.message);
      return;
    }

    setStatus("idle");
    router.push("/dashboard");
  }

  return (
    <div style={{ maxWidth: 400, margin: "80px auto", padding: 24 }}>
      <h1>ReclaimFi — Acceso</h1>

      <div style={{ display: "flex", gap: 8, marginTop: 20, marginBottom: 20 }}>
        <button
          type="button"
          onClick={() => { setMode("password"); setStatus("idle"); setErrorMsg(""); }}
          style={{
            flex: 1,
            padding: 10,
            fontWeight: mode === "password" ? 700 : 400,
            background: mode === "password" ? "#111" : "#eee",
            color: mode === "password" ? "white" : "#333",
            border: "none",
            cursor: "pointer",
          }}
        >
          Contraseña
        </button>
        <button
          type="button"
          onClick={() => { setMode("magic"); setStatus("idle"); setErrorMsg(""); }}
          style={{
            flex: 1,
            padding: 10,
            fontWeight: mode === "magic" ? 700 : 400,
            background: mode === "magic" ? "#111" : "#eee",
            color: mode === "magic" ? "white" : "#333",
            border: "none",
            cursor: "pointer",
          }}
        >
          Enlace mágico
        </button>
      </div>

      {mode === "magic" ? (
        status === "sent" ? (
          <p>
            Te enviamos un enlace de acceso a <strong>{email}</strong>. Revisa
            tu correo (y la carpeta de spam) y haz click para entrar.
          </p>
        ) : (
          <form onSubmit={handleMagicLink}>
            <input
              type="email"
              placeholder="tu correo"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{ display: "block", width: "100%", marginBottom: 12 }}
            />

            <button type="submit" disabled={status === "sending"}>
              {status === "sending" ? "Enviando..." : "Enviar enlace de acceso"}
            </button>

            {status === "error" && (
              <p style={{ color: "red", marginTop: 12 }}>{errorMsg}</p>
            )}
          </form>
        )
      ) : (
        <form onSubmit={handlePasswordLogin}>
          <input
            type="email"
            placeholder="tu correo"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{ display: "block", width: "100%", marginBottom: 12 }}
          />
          <input
            type="password"
            placeholder="tu contraseña"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ display: "block", width: "100%", marginBottom: 12 }}
          />

          <button type="submit" disabled={status === "sending"}>
            {status === "sending" ? "Entrando..." : "Entrar"}
          </button>

          {status === "error" && (
            <p style={{ color: "red", marginTop: 12 }}>
              {errorMsg}
              {errorMsg.toLowerCase().includes("invalid") && (
                <>
                  {" "}
                  Si aun no has establecido una contraseña, usa "Enlace mágico"
                  para entrar y crea una en Seguridad de la Cuenta.
                </>
              )}
            </p>
          )}
        </form>
      )}
    </div>
  );
}