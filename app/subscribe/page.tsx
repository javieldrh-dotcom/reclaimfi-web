"use client";
import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/app/lib/supabase";
import NeuralBackground from "@/app/components/NeuralBackground";

declare global {
  interface Window {
    paypal?: any;
  }
}

function SubscribePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedPlanCode = searchParams.get("plan");
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [plans, setPlans] = useState<any[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [selectedMethod, setSelectedMethod] = useState<any>(null);
  const [message, setMessage] = useState("");
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [industrySector, setIndustrySector] = useState("GENERIC");

  useEffect(() => {
    async function load() {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user) return;
      const { data: uc } = await supabase.from("user_companies").select("company_id").eq("user_id", userData.user.id).limit(1).single();
      setCompanyId(uc?.company_id ?? null);

      const { data: plansData } = await supabase.from("subscription_plans").select("*").order("monthly_price_usd");
      setPlans(plansData ?? []);
      if (preselectedPlanCode) {
        const match = (plansData ?? []).find((p: any) => p.plan_code === preselectedPlanCode);
        if (match) setSelectedPlan(match);
      }

      const { data: methodsData } = await supabase.from("payment_methods").select("*").eq("is_active", true);
      setPaymentMethods(methodsData ?? []);
    }
    load();
  }, []);

  useEffect(() => {
    if (selectedMethod?.method_code !== "PAYPAL" || !selectedPlan?.paypal_plan_id) return;
    const existingScript = document.getElementById("paypal-sdk-script");
    if (existingScript) existingScript.remove();
    const script = document.createElement("script");
    script.id = "paypal-sdk-script";
    script.src = "https://www.paypal.com/sdk/js?client-id=BAA14BzB_9VhviO_C0gWpUwrrpSkF4AMRkzz-wI1E0_VGAEawrXQ-09k-jOguRdCZZzifZFfD41n2B97V4&vault=true&intent=subscription";
    script.onload = () => {
      const container = document.getElementById("paypal-button-container");
      if (container) container.innerHTML = "";
      if (window.paypal) {
        window.paypal.Buttons({
          style: { shape: "pill", color: "gold", layout: "vertical", label: "subscribe" },
          createSubscription: function (data: any, actions: any) {
            return actions.subscription.create({ plan_id: selectedPlan.paypal_plan_id });
          },
          onApprove: function (data: any) {
            setMessage("Suscripcion PayPal iniciada correctamente. ID: " + data.subscriptionID);
          },
        }).render("#paypal-button-container");
      }
    };
    document.body.appendChild(script);
  }, [selectedMethod, selectedPlan]);
  async function importWithholdingTxt(file: File) {
    setMessage("Procesando archivo...");
    const text = await file.text();
    const lines = text.split(/\r?\n/).filter((l) => l.trim());
    let updated = 0;
    let notFound = 0;
    for (const line of lines) {
      const cols = line.split("\t");
      if (cols.length < 13) continue;
      const invoiceNumber = cols[6];
      const withheldAmount = parseFloat(cols[10]) || 0;
      if (!invoiceNumber || withheldAmount === 0) continue;
      const { data: matchingEntry } = await supabase
        .from("sales_book_entries")
        .select("id")
        .eq("company_id", companyId)
        .eq("invoice_number", invoiceNumber)
        .limit(1)
        .single();
      if (matchingEntry) {
        await supabase.from("sales_book_entries").update({ withheld_by_customer: withheldAmount }).eq("id", matchingEntry.id);
        updated++;
      } else {
        notFound++;
      }
    }
    setMessage("Importacion completa: " + updated + " facturas actualizadas" + (notFound > 0 ? ", " + notFound + " no encontradas." : "."));
  }

  async function requestSubscription() {
    setMessage("");
    if (!selectedPlan || !selectedMethod) {
      setMessage("Selecciona un plan y un metodo de pago.");
      return;
    }

    let effectiveCompanyId = companyId;

    if (!effectiveCompanyId) {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user) { setMessage("Error: sesion no valida."); return; }

      const { data: newCompanyRows, error: companyError } = await supabase.from("companies").insert([{
        name: "Mi Empresa",
        owner_id: userData.user.id,
        industry_sector: industrySector,
        country: "VE",
        functional_currency: "USD",
      }]).select("id");

      if (companyError || !newCompanyRows || newCompanyRows.length === 0) { setMessage("Error al crear tu empresa: " + companyError?.message); return; }
        const newCompany = newCompanyRows[0];

      const { error: ucError } = await supabase.from("user_companies").insert([{ user_id: userData.user.id, company_id: newCompany.id }]);

      const { data: baseAccounts } = await supabase.from("chart_of_accounts").select("account_code, account_name, account_type, sector").eq("company_id", "32dcf25d-12e4-45f5-9de0-9dfef2c54bef").in("sector", ["GENERIC", industrySector]);
      if (baseAccounts && baseAccounts.length > 0) {
        const newAccounts = baseAccounts.map((a: any) => ({ ...a, company_id: newCompany.id }));
        await supabase.from("chart_of_accounts").insert(newAccounts);
      }

      effectiveCompanyId = newCompany.id;
      setCompanyId(newCompany.id);
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
      company_id: effectiveCompanyId,
      plan_id: selectedPlan.id,
      payment_method_id: selectedMethod.id,
      status: isProvisional ? "ACTIVE" : "PENDING_PAYMENT",
      receipt_url: receiptUrl,
      approved_at: isProvisional ? new Date().toISOString() : null,
      expires_at: isProvisional ? expiresAt.toISOString().slice(0, 10) : null,
    }]);

    if (error) { setMessage("Error: " + error.message); return; }

    if (isProvisional && selectedPlan) {
      try {
        const { data: userData } = await supabase.auth.getUser();
        if (userData?.user && effectiveCompanyId) {
          const { data: existingRoles } = await supabase
            .from("user_role_assignments")
            .select("id")
            .eq("user_id", userData.user.id)
            .eq("company_id", effectiveCompanyId);
          if (!existingRoles || existingRoles.length === 0) {
            const roleMap: Record<string, string> = { RECLAIMFI: "AUDITOR", CONTABILIDAD: "CONTADOR", APU: "CONTADOR", COMPLETO: "ADMIN" };
            const roleName = roleMap[selectedPlan.plan_code] ?? "SOLO_LECTURA";
            const { data: roleData } = await supabase.from("user_roles").select("id").eq("name", roleName).limit(1);
            if (roleData && roleData.length > 0) {
              await supabase.from("user_role_assignments").insert([{ user_id: userData.user.id, role_id: roleData[0].id, company_id: effectiveCompanyId }]);
            }
          }
        }
      } catch (roleError) {
        console.error("No se pudo asignar rol automaticamente:", roleError);
      }
    }

    setMessage(isProvisional ? "Acceso activado por 5 dias mientras se verifica tu pago. Redirigiendo..." : "Solicitud registrada. Realiza el pago y envia tu comprobante para activar tu acceso.");

    if (isProvisional) {
      const redirectMap: Record<string, string> = { RECLAIMFI: "/dashboard", CONTABILIDAD: "/accounting", APU: "/apu/projects", COMPLETO: "/select-module" };
      const redirectTo = redirectMap[selectedPlan.plan_code] ?? "/select-module";
      setTimeout(() => { router.push(redirectTo); }, 2000);
    }
  }

  const inputStyle = { background: "#0d1117", border: "1px solid #1a3050", borderRadius: 8, padding: 10, color: "white", width: "100%" };

  return (
    <div style={{ position: "relative", minHeight: "100vh", background: "#0B0E14", color: "white", fontFamily: "'IBM Plex Sans', sans-serif", overflow: "hidden" }}>
      <style>{`
        .sub-card { transition: transform 0.25s ease, box-shadow 0.25s ease; }
        .sub-card:hover { transform: translateY(-4px); }
        .sub-cta { transition: transform 0.2s ease; }
        .sub-cta:hover { transform: translateY(-2px); }
      `}</style>
      <div style={{ position: "relative", zIndex: 1, padding: "48px 60px", maxWidth: 1400, margin: "0 auto" }}>
        <h1 style={{ fontSize: 36, fontWeight: 900, color: "#2DD4BF", fontFamily: "'IBM Plex Serif', serif" }}>Suscripcion</h1>
        <style>{`
          @keyframes twinkle { 0%, 100% { opacity: 0.5; } 50% { opacity: 1; } }
          .twinkle-subtitle { animation: twinkle 2s ease-in-out infinite; }
        `}</style>
        <p className="twinkle-subtitle" style={{ marginTop: 8, color: "#7dd3fc", fontSize: 18, fontWeight: 600 }}>Elige tu plan y metodo de pago preferido.</p>

        {!preselectedPlanCode && <h2 style={{ marginTop: 32, fontSize: 20, color: "#8B93A7" }}>1. Elige tu Plan</h2>}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 30, marginTop: 20, maxWidth: 1300 }}>
          {(preselectedPlanCode ? plans.filter((p) => p.plan_code === preselectedPlanCode) : plans).map((p) => (
            <div
              key={p.id}
              onClick={() => setSelectedPlan(p)}
              className="sub-card"
              style={{
                padding: 0, borderRadius: 20, cursor: "pointer", overflow: "hidden",
                background: "#12161F",
                border: selectedPlan?.id === p.id ? "2px solid " + (p.plan_code === "RECLAIMFI" ? "#2DD4BF" : p.plan_code === "CONTABILIDAD" ? "#818CF8" : p.plan_code === "APU" ? "#FB923C" : "#4ade80") : "1px solid #1F2937",
                boxShadow: "0 8px 30px rgba(0,0,0,0.4)",
              }}
            >
              <div style={{
                width: "100%", height: 220, position: "relative", overflow: "hidden",
                background: p.plan_code === "RECLAIMFI" ? "radial-gradient(circle, #2DD4BF35 0%, #0B0E14 100%)" :
                            p.plan_code === "CONTABILIDAD" ? "radial-gradient(circle, #818CF835 0%, #0B0E14 100%)" :
                            p.plan_code === "APU" ? "radial-gradient(circle, #FB923C35 0%, #0B0E14 100%)" :
                            "radial-gradient(circle, #4ade8035 0%, #0B0E14 100%)",
              }}>
                {p.plan_code === "RECLAIMFI" && <NeuralBackground contained color="#2DD4BF" particleCount={70} />}
                {p.plan_code === "CONTABILIDAD" && (
                  <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "flex-end", justifyContent: "center", gap: 10 }}>
                    <style>{`
                      @keyframes growBar { 0% { height: 10%; } 50% { height: 90%; } 100% { height: 10%; } }
                      .bar1 { animation: growBar 3s ease-in-out infinite; }
                      .bar2 { animation: growBar 3s ease-in-out infinite 0.3s; }
                      .bar3 { animation: growBar 3s ease-in-out infinite 0.6s; }
                      .bar4 { animation: growBar 3s ease-in-out infinite 0.9s; }
                      .bar5 { animation: growBar 3s ease-in-out infinite 1.2s; }
                    `}</style>
                    <div className="bar1" style={{ width: 22, background: "#818CF8", opacity: 0.5, borderRadius: "4px 4px 0 0" }} />
                    <div className="bar2" style={{ width: 22, background: "#818CF8", opacity: 0.5, borderRadius: "4px 4px 0 0" }} />
                    <div className="bar3" style={{ width: 22, background: "#818CF8", opacity: 0.5, borderRadius: "4px 4px 0 0" }} />
                    <div className="bar4" style={{ width: 22, background: "#818CF8", opacity: 0.5, borderRadius: "4px 4px 0 0" }} />
                    <div className="bar5" style={{ width: 22, background: "#818CF8", opacity: 0.5, borderRadius: "4px 4px 0 0" }} />
                  </div>
                )}
                {p.plan_code === "APU" && (
                  <div style={{ position: "absolute", inset: 0 }}>
                    <style>{`
                      @keyframes pulseGrid { 0%, 100% { opacity: 0.2; } 50% { opacity: 0.6; } }
                      .grid-pulse { animation: pulseGrid 2.5s ease-in-out infinite; }
                    `}</style>
                    <svg width="100%" height="100%" viewBox="0 0 400 220" className="grid-pulse">
                      <g stroke="#FB923C" strokeWidth="1">
                        {[0,40,80,120,160,200,240,280,320,360,400].map((x) => <line key={x} x1={x} y1="0" x2={x} y2="220" />)}
                        {[0,35,70,105,140,175,210].map((y) => <line key={y} x1="0" y1={y} x2="400" y2={y} />)}
                      </g>
                    </svg>
                  </div>
                )}
                <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", zIndex: 2 }}>
                  <h3 style={{ fontSize: 32, fontWeight: 900, color: "rgba(255,255,255,0.92)", textShadow: "0 0 30px " + (p.plan_code === "RECLAIMFI" ? "#2DD4BF" : p.plan_code === "CONTABILIDAD" ? "#818CF8" : "#FB923C") + ", 0 0 60px " + (p.plan_code === "RECLAIMFI" ? "#2DD4BF" : p.plan_code === "CONTABILIDAD" ? "#818CF8" : "#FB923C") + "80" }}>{p.plan_name}</h3>
                  <p style={{ fontSize: 50, fontWeight: 900, marginTop: 8, fontFamily: "monospace", color: "rgba(255,255,255,0.95)", textShadow: "0 0 30px " + (p.plan_code === "RECLAIMFI" ? "#2DD4BF" : p.plan_code === "CONTABILIDAD" ? "#818CF8" : "#FB923C") + ", 0 0 60px " + (p.plan_code === "RECLAIMFI" ? "#2DD4BF" : p.plan_code === "CONTABILIDAD" ? "#818CF8" : "#FB923C") + "80" }}>${p.monthly_price_usd}<span style={{ fontSize: 18, color: "rgba(255,255,255,0.6)" }}>/mes</span></p>
                </div>
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
            const bgSize = m.method_code === "ZINLI" ? "contain" : "cover";
            const isSelected = selectedMethod?.id === m.id;
            return (
              <div key={m.id} onClick={() => setSelectedMethod(m)} style={{ cursor: "pointer" }}>
                <div
                  className="sub-logo-card" style={{
                    borderRadius: 18,
                    backgroundImage: "url(/logos/" + logoFile + ")",
                    backgroundSize: bgSize,
                    backgroundPosition: "center",
                    backgroundRepeat: "no-repeat",
                    backgroundColor: "white",
                    border: isSelected ? "3px solid #2DD4BF" : "3px solid transparent",
                    boxShadow: isSelected ? "0 10px 40px #2DD4BF60" : "0 6px 20px rgba(0,0,0,0.3)",
                    minHeight: 100,
                  }}
                />
                <p style={{ textAlign: "center", fontSize: 13, color: "#8B93A7", marginTop: 8, fontWeight: 600 }}>{m.method_name}</p>
              </div>
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
            {selectedMethod.method_code === "PAYPAL" && selectedPlan && selectedPlan.paypal_plan_id && (
              <div id="paypal-button-container" style={{ marginTop: 16 }}></div>
            )}
          </div>
        )}

        <div style={{ marginTop: 32, maxWidth: 550 }}>
          <label style={{ fontSize: 15, color: "#8B93A7", fontWeight: 600 }}>SECTOR DE TU EMPRESA (define el plan de cuentas inicial)</label>
        <select value={industrySector} onChange={(e) => setIndustrySector(e.target.value)} style={{ background: "#0d1117", border: "1px solid #1a3050", borderRadius: 8, padding: 10, color: "white", width: "100%", marginTop: 8, fontSize: 16 }}>
          <option value="GENERIC">General / Servicios</option>
          <option value="RETAIL">Comercio / Retail / Supermercado</option>
          <option value="RESTAURANT">Restaurantes / Hospitalidad</option>
          <option value="CONSTRUCTION">Construccion (NIC 11 / NIIF 15)</option>
          <option value="MANUFACTURING">Manufactura / Industrial</option>
        </select>

        <label style={{ fontSize: 15, color: "#8B93A7", fontWeight: 600, marginTop: 20, display: "block" }}>COMPROBANTE DE PAGO (opcional, puedes enviarlo despues)</label>
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

export default function SubscribePage() {
  return (
    <Suspense fallback={<div style={{ minHeight: "100vh", background: "#0B0E14", color: "white" }}></div>}>
      <SubscribePageContent />
    </Suspense>
  );
}
