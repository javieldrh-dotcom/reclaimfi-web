"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/app/lib/supabase";

export default function SubscriptionsAdminPage() {
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);

  async function loadSubscriptions() {
    const { data } = await supabase
      .from("subscriptions")
      .select("*, companies(name, owner_id), subscription_plans(plan_name, monthly_price_usd), payment_methods(method_name)")
      .order("requested_at", { ascending: false });
    setSubscriptions(data ?? []);
    setLoading(false);
  }

  // Al aprobar un pago, la suscripcion queda ACTIVE pero eso por si solo NO
  // le da acceso a ningun modulo: el acceso real lo controla la tabla
  // user_role_assignments (ver app/auth/callback/route.ts). Esta funcion
  // cierra ese hueco: ademas de activar la suscripcion, le otorga al dueno
  // de la empresa el rol ADMIN sobre su propia empresa, si todavia no tiene
  // ningun rol asignado ahi (mismo patron que app/admin/companies/new).
  async function grantAccessIfMissing(companyId: string | null | undefined, ownerId: string | null | undefined): Promise<string | null> {
    if (!companyId || !ownerId) {
      return "No se pudo otorgar acceso: falta la empresa o el propietario de esta suscripcion.";
    }
    const { data: existing, error: existingError } = await supabase
      .from("user_role_assignments")
      .select("id")
      .eq("user_id", ownerId)
      .eq("company_id", companyId)
      .maybeSingle();
    if (existingError) {
      return "No se pudo verificar el acceso existente: " + existingError.message;
    }
    if (existing) return null;

    const { data: adminRole, error: roleError } = await supabase.from("user_roles").select("id").eq("name", "ADMIN").single();
    if (roleError || !adminRole) {
      return "No se pudo otorgar acceso: no se encontro el rol ADMIN (" + (roleError?.message ?? "") + ").";
    }
    const { error: insertError } = await supabase.from("user_role_assignments").insert([{
      user_id: ownerId,
      role_id: adminRole.id,
      company_id: companyId,
    }]);
    if (insertError) {
      return "La suscripcion se activo, pero no se pudo otorgar el acceso al modulo: " + insertError.message;
    }
    return null;
  }

  useEffect(() => {
    loadSubscriptions();
  }, []);

  async function revokeSubscription(id: string) {
    if (!window.confirm("Revocar esta suscripcion? El usuario perdera acceso inmediatamente.")) return;
    await supabase.from("subscriptions").update({ status: "CANCELLED" }).eq("id", id);
    await loadSubscriptions();
  }

  async function extendSubscription(sub: any) {
    setActionMessage(null);
    setProcessingId(sub.id);
    const newExpiry = new Date();
    newExpiry.setDate(newExpiry.getDate() + 30);
    const { error } = await supabase.from("subscriptions").update({ status: "ACTIVE", expires_at: newExpiry.toISOString().slice(0, 10) }).eq("id", sub.id);
    if (error) {
      setActionMessage("Error al activar la suscripcion: " + error.message);
      setProcessingId(null);
      return;
    }
    const accessError = await grantAccessIfMissing(sub.company_id, sub.companies?.owner_id);
    if (accessError) {
      setActionMessage(accessError);
    } else {
      setActionMessage("Suscripcion activada y acceso otorgado correctamente.");
    }
    await loadSubscriptions();
    setProcessingId(null);
  }

  function isExpired(sub: any) {
    if (!sub.expires_at) return false;
    return new Date(sub.expires_at) < new Date();
  }
  if (loading) return <div style={{ padding: 40, color: "#7dd3fc" }}>Cargando...</div>;

  const totalSubscribed = subscriptions.length;
  const activeCount = subscriptions.filter((s) => s.status === "ACTIVE" && !isExpired(s)).length;
  const expiredCount = subscriptions.filter((s) => s.status === "ACTIVE" && isExpired(s)).length;
  const totalRevenue = subscriptions.filter((s) => s.status === "ACTIVE" && !isExpired(s)).reduce((sum, s) => sum + (s.subscription_plans?.monthly_price_usd || 0), 0);

  const cardStyle = { padding: 20, background: "#12161F", border: "1px solid #1F2937", borderRadius: 12 };

  return (
    <div style={{ padding: 40, color: "white", background: "#0B0E14", minHeight: "100vh", fontFamily: "'IBM Plex Sans', sans-serif" }}>
      <h1 style={{ fontSize: 28, fontWeight: 900, color: "#2DD4BF", fontFamily: "'IBM Plex Serif', serif" }}>Administracion de Suscripciones</h1>

      {actionMessage && (
        <div style={{ marginTop: 16, padding: "12px 16px", borderRadius: 10, maxWidth: 900, background: actionMessage.startsWith("Error") || actionMessage.startsWith("No se pudo") || actionMessage.includes("no se pudo") ? "#F8717115" : "#2DD4BF15", border: "1px solid " + (actionMessage.startsWith("Error") || actionMessage.startsWith("No se pudo") || actionMessage.includes("no se pudo") ? "#F8717140" : "#2DD4BF40"), color: actionMessage.startsWith("Error") || actionMessage.startsWith("No se pudo") || actionMessage.includes("no se pudo") ? "#F87171" : "#2DD4BF", fontSize: 14 }}>
          {actionMessage}
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16, marginTop: 24, maxWidth: 900 }}>
        <div style={cardStyle}>
          <p style={{ fontSize: 12, color: "#8B93A7" }}>TOTAL SUSCRITOS</p>
          <p style={{ fontSize: 28, fontWeight: 900, marginTop: 6 }}>{totalSubscribed}</p>
        </div>
        <div style={{ ...cardStyle, border: "1px solid #2DD4BF40" }}>
          <p style={{ fontSize: 12, color: "#8B93A7" }}>ACTIVOS / SOLVENTES</p>
          <p style={{ fontSize: 28, fontWeight: 900, marginTop: 6, color: "#2DD4BF" }}>{activeCount}</p>
        </div>
        <div style={{ ...cardStyle, border: "1px solid #F8717140" }}>
          <p style={{ fontSize: 12, color: "#8B93A7" }}>VENCIDOS</p>
          <p style={{ fontSize: 28, fontWeight: 900, marginTop: 6, color: "#F87171" }}>{expiredCount}</p>
        </div>
        <div style={cardStyle}>
          <p style={{ fontSize: 12, color: "#8B93A7" }}>INGRESO MENSUAL ACTIVO</p>
          <p style={{ fontSize: 28, fontWeight: 900, marginTop: 6, fontFamily: "monospace" }}>${totalRevenue}</p>
        </div>
      </div>

      <h2 style={{ marginTop: 32, fontSize: 18, color: "#8B93A7" }}>Todas las Suscripciones</h2>
      <div style={{ marginTop: 12 }}>
        {subscriptions.map((s) => (
          <div key={s.id} style={{ ...cardStyle, marginTop: 10, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <p style={{ fontSize: 15, fontWeight: 700 }}>{s.companies?.name ?? "Sin empresa"} — {s.subscription_plans?.plan_name}</p>
              <p style={{ fontSize: 13, color: "#8B93A7", marginTop: 4 }}>
                Metodo: {s.payment_methods?.method_name} | Vence: {s.expires_at ?? "N/A"}
                {s.receipt_url && <a href={s.receipt_url} target="_blank" rel="noopener noreferrer" style={{ color: "#818CF8", marginLeft: 8 }}>Ver comprobante</a>}
              </p>
              <p style={{ fontSize: 13, marginTop: 4, color: s.status === "ACTIVE" && !isExpired(s) ? "#2DD4BF" : s.status === "CANCELLED" ? "#F87171" : isExpired(s) ? "#F87171" : "#FACC15" }}>
                {s.status === "ACTIVE" && !isExpired(s) ? "ACTIVO" : s.status === "CANCELLED" ? "CANCELADO" : isExpired(s) ? "VENCIDO" : "PENDIENTE"}
              </p>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              {(isExpired(s) || s.status === "PENDING_PAYMENT") && (
                <button onClick={() => extendSubscription(s)} disabled={processingId === s.id} style={{ background: "none", border: "1px solid #2DD4BF", color: "#2DD4BF", padding: "6px 14px", borderRadius: 8, fontSize: 13, cursor: processingId === s.id ? "default" : "pointer", opacity: processingId === s.id ? 0.6 : 1 }}>
                  {processingId === s.id ? "Procesando..." : "Confirmar 30 dias"}
                </button>
              )}
              {s.status === "ACTIVE" && (
                <button onClick={() => revokeSubscription(s.id)} style={{ background: "none", border: "1px solid #F87171", color: "#F87171", padding: "6px 14px", borderRadius: 8, fontSize: 13, cursor: "pointer" }}>
                  Revocar
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
