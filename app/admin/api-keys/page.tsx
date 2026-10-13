"use client";
import { useEffect, useState } from "react";

// Esta pagina ya no toca Supabase directamente -- external_api_keys no
// tiene ninguna politica RLS a proposito (ver auditoria de Fase 3), asi
// que las llamadas se hacen contra app/api/admin/api-keys/route.ts, que
// verifica que quien llama es el propietario y usa el cliente de servicio.
export default function ApiKeysAdminPage() {
  const [keys, setKeys] = useState<any[]>([]);
  const [partnerName, setPartnerName] = useState("");
  const [newKeyPlaintext, setNewKeyPlaintext] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function loadKeys() {
    const res = await fetch("/api/admin/api-keys");
    const body = await res.json().catch(() => ({}));
    if (!res.ok || !body.success) {
      setMessage(body?.error || "No se pudieron cargar las claves.");
      return;
    }
    setKeys(body.keys ?? []);
  }

  useEffect(() => {
    loadKeys();
  }, []);

  async function generateKey() {
    if (!partnerName.trim()) { setMessage("Ingresa el nombre del socio."); return; }
    setMessage("");
    setNewKeyPlaintext("");
    setLoading(true);

    const res = await fetch("/api/admin/api-keys", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ partnerName: partnerName.trim() }),
    });
    const body = await res.json().catch(() => ({}));
    setLoading(false);

    if (!res.ok || !body.success) {
      setMessage("Error: " + (body?.error || "No se pudo generar la clave."));
      return;
    }

    setNewKeyPlaintext(body.rawKey);
    setPartnerName("");
    await loadKeys();
  }

  async function toggleActive(id: string, current: boolean) {
    const res = await fetch("/api/admin/api-keys", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, isActive: !current }),
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok || !body.success) {
      setMessage("Error: " + (body?.error || "No se pudo cambiar el estado de la clave."));
      return;
    }
    await loadKeys();
  }

  return (
    <div style={{ minHeight: "100vh", background: "#0B0E14", color: "white", padding: 40 }}>
      <div style={{ maxWidth: 800, margin: "0 auto" }}>
        <h1 style={{ fontSize: 28, fontWeight: 900 }}>Claves de API para Socios Externos</h1>
        <p style={{ color: "#8B93A7", marginTop: 8 }}>Genera claves para plataformas asociadas (ej. Chainalysis) que consumiran el feed de senales.</p>

        <div style={{ marginTop: 24, background: "#151A24", borderRadius: 16, padding: 24, border: "1px solid #2A3040" }}>
          <input
            value={partnerName}
            onChange={(e) => setPartnerName(e.target.value)}
            placeholder="Nombre del socio (ej. Chainalysis)"
            style={{ width: "100%", padding: 12, background: "#0B0E14", border: "1px solid #2A3040", borderRadius: 8, color: "white" }}
          />
          <button onClick={generateKey} disabled={loading} style={{ marginTop: 12, padding: "10px 24px", background: "#2DD4BF", color: "#0B0E14", border: "none", borderRadius: 8, fontWeight: 700, cursor: "pointer", opacity: loading ? 0.6 : 1 }}>
            {loading ? "GENERANDO..." : "Generar Nueva Clave"}
          </button>
          {message && <p style={{ marginTop: 8, color: "#f87171" }}>{message}</p>}
          {newKeyPlaintext && (
            <div style={{ marginTop: 16, padding: 16, background: "#4ade8020", border: "1px solid #4ade80", borderRadius: 8 }}>
              <p style={{ fontSize: 13, color: "#4ade80", fontWeight: 700 }}>Clave generada — copiala ahora, no se volvera a mostrar:</p>
              <p style={{ marginTop: 8, fontFamily: "monospace", fontSize: 14, wordBreak: "break-all" }}>{newKeyPlaintext}</p>
            </div>
          )}
        </div>

        <div style={{ marginTop: 24 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 12 }}>Claves Existentes</h2>
          {keys.map((k) => (
            <div key={k.id} style={{ background: "#151A24", borderRadius: 12, padding: 16, marginBottom: 8, border: "1px solid #2A3040", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <p style={{ fontWeight: 700 }}>{k.partner_name}</p>
                <p style={{ fontSize: 12, color: "#8B93A7", marginTop: 4 }}>
                  Creada: {new Date(k.created_at).toLocaleDateString()} · Ultimo uso: {k.last_used_at ? new Date(k.last_used_at).toLocaleString() : "Nunca"}
                </p>
              </div>
              <button
                onClick={() => toggleActive(k.id, k.is_active)}
                style={{ padding: "6px 14px", borderRadius: 20, border: "1px solid " + (k.is_active ? "#4ade80" : "#f87171"), background: "none", color: k.is_active ? "#4ade80" : "#f87171", cursor: "pointer", fontSize: 12 }}
              >
                {k.is_active ? "ACTIVA" : "DESACTIVADA"}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}