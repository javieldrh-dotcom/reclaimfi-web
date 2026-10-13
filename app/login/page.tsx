"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/app/lib/supabase/client";

// Dos metodos de acceso: magic link (el unico que existia antes) y
// email+contrasena (nuevo, requiere que el usuario ya haya establecido una
// contrasena desde /security). Se deja el magic link como respaldo para
// quien aun no fijo contrasena.
//
// A donde redirigir tras entrar: el flujo de magic link
// (app/auth/callback/route.ts) ya decide esto correctamente -- dueno de
// la plataforma siempre a /select-module, cliente con un solo modulo
// derecho a ese modulo, con varios al selector, sin ninguno a
// /subscribe. El login por contrasena hacia router.push("/dashboard")
// fijo sin mirar nada de esto, asi que todo cliente (y el propio dueno)
// entraba siempre directo a ReclaimFi en vez de ver "Selecciona tu
// Modulo". Se replica aqui la misma logica, en el cliente.
const PLATFORM_OWNER_EMAIL = "javiel.ramirez@gmail.com";
const PLATFORM_OWNER_ID = "a56f197e-a532-4d3c-9f08-5b5b3a4d7b7a";

async function resolvePostLoginDestination(
  supabase: ReturnType<typeof createClient>,
  user: { id: string; email?: string | null }
): Promise<string> {
  const isOwner =
    user.id === PLATFORM_OWNER_ID ||
    user.email?.toLowerCase() === PLATFORM_OWNER_EMAIL;
  if (isOwner) return "/select-module";

  const { data: assignments } = await supabase
    .from("user_role_assignments")
    .select("role_id")
    .eq("user_id", user.id);
  const roleIds = (assignments ?? []).map((a: any) => a.role_id);
  if (roleIds.length === 0) return "/subscribe";

  const { data: rolePerms } = await supabase
    .from("role_permissions")
    .select("permissions(name)")
    .in("role_id", roleIds);
  const permNames = (rolePerms ?? [])
    .map((p: any) => p.permissions?.name)
    .filter(Boolean);
  const hasReclaimFi = permNames.includes("VIEW_RECLAIMFI");
  const hasAccounting = permNames.includes("VIEW_ACCOUNTING");
  const hasApu = permNames.includes("VIEW_APU");
  const moduleCount = [hasReclaimFi, hasAccounting, hasApu].filter(Boolean).length;

  if (moduleCount === 0) return "/subscribe";
  if (moduleCount > 1) return "/select-module";
  if (hasReclaimFi) return "/dashboard";
  if (hasAccounting) return "/accounting";
  if (hasApu) return "/apu/projects";
  return "/select-module";
}

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

    const { error, data } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error || !data?.user) {
      setStatus("error");
      setErrorMsg(error?.message ?? "No se pudo iniciar sesion.");
      return;
    }

    setStatus("idle");
    router.push(await resolvePostLoginDestination(supabase, data.user));
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