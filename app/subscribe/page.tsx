"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/app/lib/supabase";
import AuroraBackground from "@/app/components/AuroraBackground";

export default function SubscribePage() {
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [plans, setPlans] = useState<any[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [selectedMethod, setSelectedMethod] = useState<any>(null);
  const [message, setMessage] = useState("");
  const [receiptFile, setReceiptFile] = useState<File | null>(null);

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

    let receiptUrl = null;
    if (receiptFile) {
      const fileName = Date.now() + "-" + receiptFile.name;
      const { error: uploadError } = await supabase.storage.from("payment-receipts").upload(fileName, receiptFile);
      if (uploadError) { setMessage("Error al subir comprobante: " + uploadError.message); return; }
      const { data: urlData } = supabase.storage.from("payment-receipts").getPublicUrl(fileName);
      receiptUrl = urlData.publicUrl;
    }

    const isProvisional = receiptUrl !== null;
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 5);

    const { error } = await supabase.from("subscriptions").insert([{
      company_id: companyId,
      plan_id: selectedPlan.id,
      payment_method_id: selectedMethod.id,
      status: isProvisional ? "ACTIVE" : "PENDING_PAYMENT",
      receipt_url: receiptUrl,
      approved_at: isProvisional ? new Date().toISOString() : null,
      expires_at: isProvisional ? expiresAt.toISOString().slice(0, 10) : null,
    }]);

    if (error) { setMessage("Error: " + error.message); return; }

    if (isProvisional && selectedPlan) {
      const roleMap: Record<string, string> = { RECLAIMFI: "AUDITOR", CONTABILIDAD: "CONTADOR", APU: "CONTADOR", COMPLETO: "ADMIN" };
      const roleName = roleMap[selectedPlan.plan_code] ?? "SOLO_LECTURA";
      const { data: roleData } = await supabase.from("user_roles").select("id").eq("name", roleName).single();
      const { data: userData } = await supabase.auth.getUser();
      if (roleData && userData?.user && companyId) {
        await supabase.from("user_role_assignments").insert([{
          user_id: userData.user.id,
          role_id: roleData.id,
          company_id: companyId,
        }]);
      }
    }

    setMessage(isProvisional ? "Acceso activado por 5 dias mientras se verifica tu pago. Ya puedes usar la plataforma." : "Solicitud registrada. Realiza el pago y envia tu comprobante para activar tu acceso.");
  }
  const cardStyle = { padding: 36, background: "#12161F", border: "2px solid #2DD4BF30", borderRadius: 20, cursor: "pointer", boxShadow: "0 6px 25px rgba(0,0,0,0.4)" };
  const selectedCardStyle = { ...cardStyle, border: "3px solid #2DD4BF", boxShadow: "0 10px 40px #2DD4BF40" };

  return (
    <div style={{ position: "relative", minHeight: "100vh", background: "#0B0E14", color: "white", fontFamily: "'IBM Plex Sans', sans-serif", overflow: "hidden" }}>
      <AuroraBackground />
      <style>{`
        .sub-card { transition: transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease; }
        .sub-card:hover { transform: translateY(-4px); box-shadow: 0 12px 40px rgba(45, 212, 191, 0.25); }
        .sub-logo-card { transition: transform 0.2s ease, box-shadow 0.2s ease; }
        .sub-logo-card:hover { transform: scale(1.03); }
        .sub-cta { transition: transform 0.2s ease, box-shadow 0.2s ease; }
        .sub-cta:hover { transform: translateY(-2px); box-shadow: 0 12px 40px #2DD4BF60 !important; }
      `}</style>
      <div style={{ position: "relative", zIndex: 1, padding: "48px 60px", maxWidth: 1400, margin: "0 auto" }}>
      <h1 style={{ fontSize: 36, fontWeight: 900, color: "#2DD4BF", fontFamily: "'IBM Plex Serif', serif" }}>Suscripcion</h1>
      <p style={{ marginTop: 10, color: "#B0B8C8", fontSize: 18 }}>Elige tu plan y metodo de pago preferido para activar tu acceso.</p>

      <h2 style={{ marginTop: 48, fontSize: 22, color: "#8B93A7", fontWeight: 700 }}>1. Elige tu Plan</h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 24, marginTop: 20, maxWidth: 1300 }}>
        {plans.map((p) => (
          <div
            key={p.id}
            onClick={() => setSelectedPlan(p)}
            className="sub-card" style={selectedPlan?.id === p.id ? selectedCardStyle : cardStyle}
          >
            <h3 style={{ fontSize: 24, fontWeight: 700 }}>{p.plan_name}</h3>
            <p style={{ fontSize: 40, fontWeight: 900, marginTop: 14, fontFamily: "monospace" }}>${p.monthly_price_usd}<span style={{ fontSize: 18, color: "#8B93A7" }}>/mes</span></p>
            <div style={{ marginTop: 16, fontSize: 17, color: "#B0B8C8", lineHeight: 2 }}>
              {p.includes_reclaimfi && <p>✓ ReclaimFi</p>}
              {p.includes_accounting && <p>✓ Contabilidad</p>}
              {p.includes_apu && <p>✓ APU / Licitaciones</p>}
            </div>
          </div>
        ))}
      </div>

      <h2 style={{ marginTop: 48, fontSize: 22, color: "#8B93A7", fontWeight: 700 }}>2. Elige tu Metodo de Pago</h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 24, marginTop: 20, maxWidth: 1300 }}>
        {paymentMethods.map((m) => {
          const logoFile = m.method_code === "BINANCE_PAY" ? "binance.png" :
                            m.method_code === "ZINLI" ? "zinli.png" :
                            m.method_code === "PAYPAL" ? "paypal.png" :
                            m.method_code.includes("BANESCO") ? "banesco.png" :
                            "banco-venezuela.png";
          const isSelected = selectedMethod?.id === m.id;
          return (
            <div
              key={m.id}
              onClick={() => setSelectedMethod(m)}
              className="sub-logo-card" style={{
                borderRadius: 18, cursor: "pointer",
                backgroundImage: "url(/logos/" + logoFile + ")",
                backgroundSize: "cover",
                backgroundPosition: "center",
                backgroundColor: "white",
                border: isSelected ? "3px solid #2DD4BF" : "3px solid transparent",
                boxShadow: isSelected ? "0 10px 40px #2DD4BF60" : "0 6px 20px rgba(0,0,0,0.3)",
                minHeight: 100,
              }}
            />
          );
        })}
      </div>

      {paymentMethods.length === 0 && (
        <p style={{ marginTop: 20, color: "#8B93A7", fontSize: 15 }}>Cargando metodos de pago...</p>
      )}

      {selectedMethod && (
        <div style={{ marginTop: 24, padding: 28, background: "#12161F", border: "1px solid #818CF860", borderRadius: 16, maxWidth: 1300, boxShadow: "0 8px 30px #818CF815" }}>
          <p style={{ fontSize: 15, color: "#8B93A7", fontWeight: 600 }}>DATOS PARA PAGAR CON {selectedMethod.method_name.toUpperCase()}</p>
          <p style={{ marginTop: 12, fontSize: 17, fontFamily: "monospace", background: "#0B0E14", padding: 14, borderRadius: 10 }}>{selectedMethod.account_details}</p>
          <p style={{ marginTop: 8, fontSize: 14, color: "#8B93A7" }}>Titular: {selectedMethod.account_holder}</p>
          {selectedMethod.method_code === "BINANCE_PAY" && (
            <a href="https://s.binance.com/RFaCraV0" target="_blank" rel="noopener noreferrer" style={{ display: "inline-block", marginTop: 16, padding: "12px 24px", background: "#F0B90B", color: "#0B0E14", borderRadius: 10, textDecoration: "none", fontWeight: 700, fontSize: 15 }}>
              Abrir Binance Pay
            </a>
          )}
          {selectedMethod.method_code === "PAYPAL" && (
            <a href="https://www.paypal.com" target="_blank" rel="noopener noreferrer" style={{ display: "inline-block", marginTop: 16, padding: "12px 24px", background: "#0070BA", color: "white", borderRadius: 10, textDecoration: "none", fontWeight: 700, fontSize: 15 }}>
              Pagar con PayPal
            </a>
          )}
        </div>
      )}

      <div style={{ marginTop: 32, maxWidth: 550 }}>
        <label style={{ fontSize: 15, color: "#8B93A7", fontWeight: 600 }}>COMPROBANTE DE PAGO (opcional, puedes enviarlo despues)</label>
        <div style={{ marginTop: 10, padding: 20, background: "#12161F", border: "1px dashed #1F2937", borderRadius: 12 }}>
          <input type="file" accept="image/*,.pdf" onChange={(e) => setReceiptFile(e.target.files?.[0] ?? null)} style={{ color: "white", fontSize: 15 }} />
        </div>
      </div>

      <button onClick={requestSubscription} className="sub-cta" style={{ marginTop: 32, padding: "18px 40px", background: "#2DD4BF", color: "#0B0E14", fontWeight: 900, borderRadius: 14, border: "none", fontSize: 18, cursor: "pointer", boxShadow: "0 8px 30px #2DD4BF40" }}>
        Confirmar Solicitud de Suscripcion
      </button>
      {message && <p style={{ marginTop: 20, fontSize: 16, color: message.includes("Error") ? "#F87171" : "#4ade80", maxWidth: 550, lineHeight: 1.6 }}>{message}</p>}
      </div>
    </div>
  );
}
