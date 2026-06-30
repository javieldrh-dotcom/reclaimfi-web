"use client";

import { useState } from "react";
import { createClient } from "@/app/lib/supabase/client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">(
    "idle"
  );
  const [errorMsg, setErrorMsg] = useState("");

  async function handleLogin(e: React.FormEvent) {
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

  return (
    <div style={{ maxWidth: 400, margin: "80px auto", padding: 24 }}>
      <h1>ReclaimFi — Acceso</h1>

      {status === "sent" ? (
        <p>
          Te enviamos un enlace de acceso a <strong>{email}</strong>. Revisa
          tu correo (y la carpeta de spam) y haz click para entrar.
        </p>
      ) : (
        <form onSubmit={handleLogin}>
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
      )}
    </div>
  );
}
