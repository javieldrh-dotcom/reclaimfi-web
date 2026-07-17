"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/app/lib/supabase";

export default function SubscribePage() {
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [plans, setPlans] = useState<any[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [selectedMethod, setSelectedMethod] = useState<any>(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function load() {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user) return;
      const { data: uc } = await supabase.from("user_companies").select("company_id").eq("user_id", userData.user.id).limit(1).single();
      setCompanyId(uc?.company_id ?? null);

      const { data: plansData } = await supabase.from("subscription_plans").select("*").order("monthly_price_usd");
      setPlans(plansData ?? []);

      const { data: methodsData } = await supabase.from("payment_methods").select("*").eq("is_active", true);
      setPaymentMethods(methodsData ?? []);
    }
    load();
  }, []);

  async function requestSubscription() {
    setMessage("");
    if (!companyId || !selectedPlan || !selectedMethod) {
      setMessage("Selecciona un plan y un metodo de pago.");
      return;
    }

    const { error } = await supabase.from("subscriptions").insert([{
      company_id: companyId,
      plan_id: selectedPlan.id,
      payment_method_id: selectedMethod.id,
      status: "PENDING_PAYMENT",
    }]);

    if (error) { setMessage("Error: " + error.message); return; }
    setMessage("Solicitud registrada. Realiza el pago con los datos mostrados y envia tu comprobante para activar tu suscripcion.");
  }

  const cardStyle = { padding: 24, background: "#12161F", border: "1px solid #1F2937", borderRadius: 16, cursor: "pointer" };
  return (
    <div style={{ padding: 40, color: "white", background: "#0B0E14", minHeight: "100vh", fontFamily: "'IBM Plex Sans', sans-serif" }}>
      <h1 style={{ fontSize: 32, fontWeight: 900, color: "#2DD4BF", fontFamily: "'IBM Plex Serif', serif" }}>Suscripcion</h1>
      <p style={{ marginTop: 8, color: "#8B93A7", fontSize: 16 }}>Elige tu plan y metodo de pago preferido.</p>

      <h2 style={{ marginTop: 32, fontSize: 20, color: "#8B93A7" }}>1. Elige tu Plan</h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16, marginTop: 16, maxWidth: 900 }}>
        {plans.map((p) => (
          <div
            key={p.id}
            onClick={() => setSelectedPlan(p)}
            style={{ ...cardStyle, border: selectedPlan?.id === p.id ? "2px solid #2DD4BF" : "1px solid #1F2937" }}
          >
            <h3 style={{ fontSize: 18, fontWeight: 700 }}>{p.plan_name}</h3>
            <p style={{ fontSize: 28, fontWeight: 900, marginTop: 8, fontFamily: "monospace" }}>${p.monthly_price_usd}<span style={{ fontSize: 14, color: "#8B93A7" }}>/mes</span></p>
            <div style={{ marginTop: 12, fontSize: 13, color: "#8B93A7" }}>
              {p.includes_reclaimfi && <p>✓ ReclaimFi</p>}
              {p.includes_accounting && <p>✓ Contabilidad</p>}
              {p.includes_apu && <p>✓ APU / Licitaciones</p>}
            </div>
          </div>
        ))}
      </div>

      <h2 style={{ marginTop: 32, fontSize: 20, color: "#8B93A7" }}>2. Elige tu Metodo de Pago</h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginTop: 16, maxWidth: 900 }}>
        {paymentMethods.map((m) => (
          <div
            key={m.id}
            onClick={() => setSelectedMethod(m)}
            style={{ ...cardStyle, border: selectedMethod?.id === m.id ? "2px solid #818CF8" : "1px solid #1F2937" }}
          >
            <h3 style={{ fontSize: 16, fontWeight: 700, color: "#818CF8" }}>{m.method_name}</h3>
          </div>
        ))}
      </div>

      {selectedMethod && (
        <div style={{ marginTop: 20, padding: 20, background: "#12161F", border: "1px solid #818CF860", borderRadius: 12, maxWidth: 500 }}>
          <p style={{ fontSize: 14, color: "#8B93A7" }}>Datos para pagar con {selectedMethod.method_name}:</p>
          <p style={{ marginTop: 8, fontSize: 15, fontFamily: "monospace" }}>{selectedMethod.account_details}</p>
          <p style={{ marginTop: 4, fontSize: 13, color: "#8B93A7" }}>Titular: {selectedMethod.account_holder}</p>
          {selectedMethod.method_code === "BINANCE_PAY" && (
            <a href={selectedMethod.account_details} target="_blank" rel="noopener noreferrer" style={{ display: "inline-block", marginTop: 12, padding: "10px 20px", background: "#818CF8", color: "#0B0E14", borderRadius: 8, textDecoration: "none", fontWeight: 700, fontSize: 14 }}>
              Abrir enlace de pago
            </a>
          )}
        </div>
      )}

      <button onClick={requestSubscription} style={{ marginTop: 32, padding: "16px 32px", background: "#2DD4BF", color: "#0B0E14", fontWeight: 900, borderRadius: 12, border: "none", fontSize: 16, cursor: "pointer" }}>
        Confirmar Solicitud de Suscripcion
      </button>
      {message && <p style={{ marginTop: 16, color: message.includes("Error") ? "#F87171" : "#4ade80", maxWidth: 500 }}>{message}</p>}
    </div>
  );
}
